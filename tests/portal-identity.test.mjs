import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {createApp} from '../server/app.mjs';
import {createPortal, createPublishAdapter, createLaunchTicketService, listLauncherApps, loadAppsManifest} from '../server/portal/index.mjs';
import {backToAcademyHref, THEMING_HOOKS} from '../packages/branding/src/index.js';

async function withServer(hostKey = 'break-glass-key') {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'academy-portal-'));
  const instance = createApp({
    dir,
    hostKey,
    publicBaseUrl: 'http://127.0.0.1:4317',
    signingSecret: 'portal-route-secret',
    googleClientId: '',
    googleClientSecret: '',
    facilitatorDomains: '',
  });
  instance.proof.create = async () => ({slug: 'portal-proof', editor: 'editor'});
  await new Promise((resolve) => instance.server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${instance.server.address().port}`;
  const request = async (route, {method = 'GET', body, token, cookies} = {}) => {
    const headers = {'content-type': 'application/json'};
    if (token) headers.authorization = `Bearer ${token}`;
    if (cookies) headers.cookie = cookies;
    const response = await fetch(base + route, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = {raw: text}; }
    return {status: response.status, json};
  };
  return {instance, base, request, close: () => new Promise((resolve) => instance.server.close(resolve))};
}

test('manifest lists active apps without Better Auth', () => {
  const manifest = loadAppsManifest();
  const apps = listLauncherApps(manifest);
  assert.ok(apps.some((a) => a.id === 'chat'));
  assert.ok(apps.some((a) => a.id === 'slides'));
  const portal = createPortal({signingSecret: 'x'.repeat(32), academyOrigin: 'http://127.0.0.1:4317'});
  const inventory = portal.inventory();
  assert.equal(inventory.betterAuth, false);
  assert.ok(inventory.academyAuth.includes('google-oidc-facilitator'));
});

test('immutable publish survives external draft mutation; pin stores sha', async () => {
  const adapters = createPublishAdapter();
  const actor = {ownerId: 'fac-1', role: 'facilitator', name: 'Ada'};
  const first = await adapters.publishImmutable({
    appId: 'slides',
    contentRef: {body: '# Lesson v1', sourceRef: 'day-pack:1'},
    actor,
  });
  adapters.mutateExternalDraft('draft-1', '# Lesson v2 mutated externally');
  const again = adapters.getPublished(first.id);
  assert.equal(again.body, '# Lesson v1');
  assert.equal(again.contentSha256, createHash('sha256').update('# Lesson v1').digest('hex'));
  const pin = adapters.pinClassroom({roomId: 'room-1', publishedId: first.id, actor});
  assert.equal(pin.contentSha256, first.contentSha256);
  assert.equal(adapters.readPin('room-1', 'slides').id, first.id);
});

test('launch tickets never embed hostKey and support back-nav + verify', () => {
  const launch = createLaunchTicketService({signingSecret: 'portal-secret-value', academyOrigin: 'https://academy.example.test'});
  const minted = launch.mint({
    appId: 'chat',
    actor: {ownerId: 'user-a', role: 'facilitator', roomId: null},
    returnTo: 'https://academy.example.test/?view=apps',
    targetOrigin: 'https://chat-poc.example.test',
  });
  assert.match(minted.startUrl, /^https:\/\/chat-poc\.example\.test\/_academy\/portal\/start\?ticket=/);
  assert.doesNotMatch(minted.startUrl, /hostKey|portal-secret|AGENT_CHAT/i);
  assert.equal(minted.claims.returnTo, 'https://academy.example.test/?view=apps');
  assert.equal(backToAcademyHref(minted.claims, 'https://academy.example.test'), minted.claims.returnTo);
  const claims = launch.verify(new URL(minted.startUrl).searchParams.get('ticket'));
  assert.equal(claims.ownerId, 'user-a');
  assert.ok(THEMING_HOOKS.slides.includes('defineDesignSystem'));
});

test('facilitator vs participant launch, two accounts, revoke, publish ownership', async () => {
  const {instance, request, close} = await withServer();
  try {
    const config = await request('/game/config');
    assert.equal(config.status, 200);
    assert.equal(config.json.googleSso, false);
    assert.equal(config.json.portal, true);

    const apps = await request('/game/apps');
    assert.equal(apps.status, 200);
    assert.equal(apps.json.inventory.betterAuth, false);

    const denied = await request('/game/apps/chat/launch', {method: 'POST', body: {}});
    assert.equal(denied.status, 401);

    const facLaunch = await request('/game/apps/chat/launch', {
      method: 'POST',
      body: {hostKey: 'break-glass-key', returnTo: 'http://127.0.0.1:4317/?view=apps'},
    });
    assert.equal(facLaunch.status, 200, JSON.stringify(facLaunch.json));
    assert.ok(facLaunch.json.grantId);
    assert.ok(facLaunch.json.launch.startUrl.includes('ticket='));
    assert.equal(facLaunch.json.backToAcademy, 'http://127.0.0.1:4317/?view=apps');
    assert.doesNotMatch(facLaunch.json.launch.startUrl, /break-glass-key|hostKey/i);

    const created = await request('/game/create', {method: 'POST', body: {name: 'Portal squad', hostKey: 'break-glass-key'}});
    assert.equal(created.status, 200, JSON.stringify(created.json));
    const room = instance.store.auth(created.json.token);
    const joined = instance.store.join(room.r.code, 'Pat');
    const participantToken = joined.token;

    const partLaunch = await request('/game/apps/chat/launch', {
      method: 'POST',
      body: {returnTo: 'http://127.0.0.1:4317/?view=apps'},
      token: participantToken,
    });
    assert.equal(partLaunch.status, 200, JSON.stringify(partLaunch.json));
    assert.equal(partLaunch.json.launch.claims.role, 'participant');
    assert.notEqual(partLaunch.json.launch.claims.ownerId, facLaunch.json.launch.claims.ownerId);

    const crossRevoke = await request(`/game/apps/grants/${partLaunch.json.grantId}/revoke`, {
      method: 'POST',
      body: {hostKey: 'break-glass-key'},
    });
    assert.equal(crossRevoke.status, 403);

    const selfRevoke = await request(`/game/apps/grants/${partLaunch.json.grantId}/revoke`, {
      method: 'POST',
      body: {},
      token: participantToken,
    });
    assert.equal(selfRevoke.status, 200);
    assert.ok(selfRevoke.json.revokedAt);

    const publish = await request('/game/apps/slides/publish', {
      method: 'POST',
      body: {hostKey: 'break-glass-key', contentRef: {kind: 'day-pack', day: 1}},
    });
    assert.equal(publish.status, 201, JSON.stringify(publish.json));
    assert.match(publish.json.contentSha256, /^[a-f0-9]{64}$/);

    const partPublish = await request('/game/apps/slides/publish', {
      method: 'POST',
      body: {contentRef: {kind: 'day-pack', day: 1}},
      token: participantToken,
    });
    assert.equal(partPublish.status, 403);

    const read = await request(`/game/apps/slides/published/${publish.json.id}`);
    assert.equal(read.status, 200);
    assert.equal(read.json.contentSha256, publish.json.contentSha256);

    instance.portal.adapters.mutateExternalDraft('x', 'mutated');
    const readAgain = await request(`/game/apps/slides/published/${publish.json.id}`);
    assert.equal(readAgain.json.contentSha256, publish.json.contentSha256);

    const ticket = new URL(facLaunch.json.launch.startUrl).searchParams.get('ticket');
    const verify = await request('/game/portal/verify-ticket', {method: 'POST', body: {ticket}});
    assert.equal(verify.status, 200);
    assert.equal(verify.json.backToAcademy, 'http://127.0.0.1:4317/?view=apps');
  } finally {
    await close();
  }
});
