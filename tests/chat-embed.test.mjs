import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {readChatConfig,createChatEmbedStartUrl,chatEmbedErrorHtml} from '../server/chat-embed.mjs';
import {createApp} from '../server/app.mjs';

const secret = 'x'.repeat(40);
const config = {origin: 'https://chat.example.test', secret};

test('readChatConfig requires an https origin without path or credentials', () => {
  assert.equal(readChatConfig({AGENT_CHAT_URL: 'http://chat.example.test', AGENT_CHAT_SHARED_SECRET: secret}), null);
  assert.equal(readChatConfig({AGENT_CHAT_URL: 'https://chat.example.test/sub', AGENT_CHAT_SHARED_SECRET: secret}), null);
  assert.equal(readChatConfig({AGENT_CHAT_URL: 'https://chat.example.test', AGENT_CHAT_SHARED_SECRET: 'short'}), null);
  assert.deepEqual(readChatConfig({AGENT_CHAT_URL: 'https://chat.example.test', AGENT_CHAT_SHARED_SECRET: secret}), config);
});

test('createChatEmbedStartUrl signs the request body and validates the returned startUrl', async () => {
  let seenRequest;
  const fetchImpl = async (url, options) => {
    seenRequest = {url, options};
    return {ok: true, json: async () => ({startUrl: 'https://chat.example.test/_agent-native/embed/start?ticket=abc'})};
  };
  const startUrl = await createChatEmbedStartUrl({roomId: 'room-1', participantId: 'participant-1'}, {config, fetchImpl});
  assert.equal(startUrl, 'https://chat.example.test/_agent-native/embed/start?ticket=abc');
  assert.equal(seenRequest.url, 'https://chat.example.test/_academy/embed/ticket');
  assert.equal(seenRequest.options.method, 'POST');
  const body = seenRequest.options.body;
  const expectedSignature = `v1=${createHmac('sha256', secret).update(body).digest('hex')}`;
  assert.equal(seenRequest.options.headers['x-academy-signature'], expectedSignature);
  const parsed = JSON.parse(body);
  assert.equal(parsed.claims.version, 1);
  assert.equal(parsed.claims.audience, 'academy-chat');
  assert.equal(parsed.claims.roomId, 'room-1');
  assert.equal(parsed.claims.participantId, 'participant-1');
  assert.equal(parsed.claims.targetPath, '/home?embedded=1');
  assert.ok(parsed.claims.expiresAt - parsed.claims.issuedAt <= 60000);
  assert.ok(parsed.claims.nonce);
  assert.match(parsed.claims.ownerEmail, /^academy-[0-9a-f]{32}@academy\.invalid$/);
  assert.doesNotMatch(body, /token|Bearer|participantName|name/i);
});

test('createChatEmbedStartUrl resolves a relative same-origin startUrl', async () => {
  const fetchImpl = async () => ({ok: true, json: async () => ({startUrl: '/_agent-native/embed/start?ticket=abc'})});
  assert.equal(
    await createChatEmbedStartUrl({roomId: 'room-1', participantId: 'participant-1'}, {config, fetchImpl}),
    'https://chat.example.test/_agent-native/embed/start?ticket=abc',
  );
});

test('createChatEmbedStartUrl derives a stable pseudonymous email per room+participant', async () => {
  const fetchImpl = async () => ({ok: true, json: async () => ({startUrl: 'https://chat.example.test/_agent-native/embed/start?ticket=x'})});
  let captured1, captured2;
  const fetch1 = async (url, options) => { captured1 = JSON.parse(options.body); return fetchImpl(); };
  const fetch2 = async (url, options) => { captured2 = JSON.parse(options.body); return fetchImpl(); };
  await createChatEmbedStartUrl({roomId: 'room-1', participantId: 'participant-1'}, {config, fetchImpl: fetch1});
  await createChatEmbedStartUrl({roomId: 'room-1', participantId: 'participant-1'}, {config, fetchImpl: fetch2});
  assert.equal(captured1.claims.ownerEmail, captured2.claims.ownerEmail);
});

test('createChatEmbedStartUrl rejects a startUrl on a different origin', async () => {
  const fetchImpl = async () => ({ok: true, json: async () => ({startUrl: 'https://evil.example.test/_agent-native/embed/start?ticket=x'})});
  await assert.rejects(() => createChatEmbedStartUrl({roomId: 'r', participantId: 'p'}, {config, fetchImpl}), /onverwachte start-url|Chat gaf/i);
});

test('createChatEmbedStartUrl rejects a startUrl with an unexpected path', async () => {
  const fetchImpl = async () => ({ok: true, json: async () => ({startUrl: 'https://chat.example.test/other/path?ticket=x'})});
  await assert.rejects(() => createChatEmbedStartUrl({roomId: 'r', participantId: 'p'}, {config, fetchImpl}));
});

test('createChatEmbedStartUrl rejects a startUrl with no ticket query parameter', async () => {
  const fetchImpl = async () => ({ok: true, json: async () => ({startUrl: 'https://chat.example.test/_agent-native/embed/start'})});
  await assert.rejects(() => createChatEmbedStartUrl({roomId: 'r', participantId: 'p'}, {config, fetchImpl}));
});

test('createChatEmbedStartUrl rejects a startUrl with an empty ticket query parameter', async () => {
  const fetchImpl = async () => ({ok: true, json: async () => ({startUrl: 'https://chat.example.test/_agent-native/embed/start?ticket='})});
  await assert.rejects(() => createChatEmbedStartUrl({roomId: 'r', participantId: 'p'}, {config, fetchImpl}));
});

test('createChatEmbedStartUrl rejects a non-ticket query parameter', async () => {
  const fetchImpl = async () => ({ok: true, json: async () => ({startUrl: 'https://chat.example.test/_agent-native/embed/start?token=abc'})});
  await assert.rejects(() => createChatEmbedStartUrl({roomId: 'r', participantId: 'p'}, {config, fetchImpl}));
});

test('createChatEmbedStartUrl rejects a startUrl with more than one query parameter', async () => {
  const fetchImpl = async () => ({ok: true, json: async () => ({startUrl: 'https://chat.example.test/_agent-native/embed/start?ticket=abc&extra=1'})});
  await assert.rejects(() => createChatEmbedStartUrl({roomId: 'r', participantId: 'p'}, {config, fetchImpl}));
});

test('createChatEmbedStartUrl rejects a startUrl carrying credentials', async () => {
  const fetchImpl = async () => ({ok: true, json: async () => ({startUrl: 'https://user:pass@chat.example.test/_agent-native/embed/start?ticket=abc'})});
  await assert.rejects(() => createChatEmbedStartUrl({roomId: 'r', participantId: 'p'}, {config, fetchImpl}));
});

test('createChatEmbedStartUrl rejects a startUrl carrying a fragment', async () => {
  const fetchImpl = async () => ({ok: true, json: async () => ({startUrl: 'https://chat.example.test/_agent-native/embed/start?ticket=abc#frag'})});
  await assert.rejects(() => createChatEmbedStartUrl({roomId: 'r', participantId: 'p'}, {config, fetchImpl}));
});

test('createChatEmbedStartUrl throws a config error when unconfigured', async () => {
  await assert.rejects(() => createChatEmbedStartUrl({roomId: 'r', participantId: 'p'}, {config: null, fetchImpl: async () => {}}), /niet geconfigureerd/);
});

test('createChatEmbedStartUrl throws on upstream failure without leaking response text', async () => {
  const fetchImpl = async () => ({ok: false, json: async () => ({error: 'internal secret detail'})});
  await assert.rejects(() => createChatEmbedStartUrl({roomId: 'r', participantId: 'p'}, {config, fetchImpl}), e => {
    assert.doesNotMatch(e.message, /internal secret detail/);
    return true;
  });
});

test('chatEmbedErrorHtml renders a safe, secret-free page', () => {
  const html = chatEmbedErrorHtml();
  assert.match(html, /<html/);
  assert.doesNotMatch(html, /AGENT_CHAT_SHARED_SECRET|secret|token/i);
});

async function withAcademy(chatConfig, fetchImpl, run) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'academy-chat-embed-'));
  const {app, store} = createApp({dir, hostKey: 'test', publicBaseUrl: 'https://academy.example.test', chatConfig, fetchImpl});
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const get = (route, token) => fetch(base + route, {redirect: 'manual', headers: token ? {authorization: `Bearer ${token}`} : {}});
  try { await run({store, get}); } finally { server.close(); rmSync(dir, {recursive: true, force: true}); }
}

test('GET /game/chat/embed redirects a participant to the ticketed Chat start URL', async () => {
  const fetchImpl = async () => ({ok: true, json: async () => ({startUrl: '/_agent-native/embed/start?ticket=t1'})});
  await withAcademy(config, fetchImpl, async ({store, get}) => {
    const host = store.create('Squad', {slug: 'intent'});
    const alice = store.join(host.code, 'Alice');
    const participant = await get('/game/chat/embed', alice.token);
    assert.equal(participant.status, 302);
    assert.equal(participant.headers.get('location'), 'https://chat.example.test/_agent-native/embed/start?ticket=t1');
    const facilitator = await get('/game/chat/embed', host.token);
    assert.equal(facilitator.status, 403);
    assert.equal((await get('/game/chat/embed')).status, 401);
    assert.equal((await (await get('/game/config')).json()).agentChatAvailable, true);
  });
});

test('GET /game/chat/embed fails closed with a 502 page when Chat is not configured', async () => {
  await withAcademy(null, async () => { throw new Error('must not call upstream'); }, async ({store, get}) => {
    const host = store.create('Squad', {slug: 'intent'});
    const alice = store.join(host.code, 'Alice');
    const response = await get('/game/chat/embed', alice.token);
    assert.equal(response.status, 502);
    assert.match(await response.text(), /Chat kon niet worden geladen/);
    assert.equal((await (await get('/game/config')).json()).agentChatAvailable, false);
  });
});

test('embedded Chat strings exist in both catalogs and stay distinct from the FAQ chat keys', () => {
  const en = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));
  const nl = JSON.parse(readFileSync(new URL('../src/i18n/nl.json', import.meta.url), 'utf8'));
  assert.equal(en['agentChat.loading'], 'Loading Chat…');
  assert.equal(nl['agentChat.loading'], 'Chat laden…');
  assert.equal(en['chat.title'], 'Ask the Academy');
});
