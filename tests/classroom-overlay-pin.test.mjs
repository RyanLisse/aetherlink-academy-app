import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';
import {classroomEmbedUrl, classroomPathForDay} from '../src/classroom.js';

async function invoke(app, method, route, {body = {}, query = {}, params = {}, cookies = {}, bearer} = {}) {
  const layer = app.router.stack.find(
    (candidate) => candidate.route?.path === route && candidate.route.methods[method],
  );
  assert.ok(layer, `Missing ${method} ${route}`);
  const response = {statusCode: 200, headers: {}, body: null, text: null};
  const req = {
    method: method.toUpperCase(),
    body,
    query,
    params,
    headers: {
      cookie: Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; '),
      ...(bearer ? {authorization: `Bearer ${bearer}`} : {}),
    },
  };
  const res = {
    status(s) {
      response.statusCode = s;
      return this;
    },
    json(v) {
      response.body = v;
      return this;
    },
    type() {
      return this;
    },
    set(k, v) {
      response.headers[k.toLowerCase()] = v;
      return this;
    },
    send(v) {
      response.text = v;
      return this;
    },
    end() {
      return this;
    },
  };
  await layer.route.stack[0].handle(req, res, (error) => {
    response.statusCode = error.status || 500;
    response.body = {error: error.status ? error.message : 'Onverwachte serverfout.'};
  });
  return response;
}

function fixture() {
  const instance = createApp({
    dir: mkdtempSync(path.join(os.tmpdir(), 'academy-overlay-pin-')),
    hostKey: 'test-host',
    publicBaseUrl: 'http://127.0.0.1:4317',
  });
  const host = instance.store.create('Overlay pin', {slug: 'overlay-pin'});
  const participant = instance.store.join(host.code, 'Deelnemer');
  return {instance, host, participant};
}

test('facilitator pins Effect deck → present URL; unpin falls back to day map', async () => {
  const {instance, host, participant} = fixture();
  const app = instance.app;
  const hostCookies = {academy: host.token};
  const memberCookies = {academy: participant.token};

  const created = await invoke(app, 'post', '/game/decks', {
    body: {title: 'Pinned lesson'},
    cookies: hostCookies,
  });
  assert.equal(created.statusCode, 201);
  const deckId = created.body.id;
  await invoke(app, 'post', '/game/decks/:deckId/slides', {
    body: {heading: 'Hello', body: ['pin me']},
    params: {deckId},
    cookies: hostCookies,
  });

  const stateBefore = await invoke(app, 'get', '/game/state', {cookies: hostCookies});
  // state route may be registered differently — use control view via pin response instead
  assert.equal(classroomEmbedUrl(1, null), classroomPathForDay(1));

  const pinned = await invoke(app, 'put', '/game/classroom-overlay', {
    body: {deckId, day: 1},
    cookies: hostCookies,
  });
  assert.equal(pinned.statusCode, 200, JSON.stringify(pinned.body));
  assert.equal(pinned.body.classroomOverlayDeckId, deckId);
  assert.equal(pinned.body.classroomOverlayByDay['1'], deckId);
  assert.equal(classroomEmbedUrl(pinned.body.day, pinned.body.classroomOverlayDeckId), `/game/decks/${deckId}/present`);

  const present = await invoke(app, 'get', '/game/decks/:deckId/present', {
    params: {deckId},
    cookies: hostCookies,
  });
  assert.equal(present.statusCode, 200);
  assert.match(present.text, /<!DOCTYPE html>/);
  assert.match(present.text, /Hello|pin me/);
  assert.equal(present.headers['content-disposition'], undefined);

  const forbidden = await invoke(app, 'put', '/game/classroom-overlay', {
    body: {deckId, day: 1},
    cookies: memberCookies,
  });
  assert.equal(forbidden.statusCode, 403);

  const unpinned = await invoke(app, 'delete', '/game/classroom-overlay', {
    body: {day: 1},
    cookies: hostCookies,
  });
  assert.equal(unpinned.statusCode, 200);
  assert.equal(unpinned.body.classroomOverlayDeckId, null);
  assert.deepEqual(unpinned.body.classroomOverlayByDay, {});
  assert.equal(
    classroomEmbedUrl(unpinned.body.day, unpinned.body.classroomOverlayDeckId),
    classroomPathForDay(unpinned.body.day),
  );
});

test('pin is scoped per day; other days keep static map', async () => {
  const {instance, host} = fixture();
  const app = instance.app;
  const cookies = {academy: host.token};

  const created = await invoke(app, 'post', '/game/decks', {body: {title: 'Day2 pin'}, cookies});
  const deckId = created.body.id;

  const pinned = await invoke(app, 'put', '/game/classroom-overlay', {
    body: {deckId, day: 2},
    cookies,
  });
  assert.equal(pinned.statusCode, 200);
  assert.equal(pinned.body.classroomOverlayByDay['2'], deckId);

  // Room still on day 1 → no current-day pin → Slice A path
  assert.equal(pinned.body.day, 1);
  assert.equal(pinned.body.classroomOverlayDeckId, null);
  assert.equal(classroomEmbedUrl(1, pinned.body.classroomOverlayDeckId), '/classroom/1');
  assert.equal(classroomEmbedUrl(2, pinned.body.classroomOverlayByDay['2']), `/game/decks/${deckId}/present`);

  // Switch day via control; view should surface pin for day 2
  const day2 = await invoke(app, 'post', '/game/control', {
    body: {action: 'day', value: 2},
    cookies,
  });
  assert.equal(day2.statusCode, 200);
  assert.equal(day2.body.day, 2);
  assert.equal(day2.body.classroomOverlayDeckId, deckId);
  assert.equal(classroomEmbedUrl(day2.body.day, day2.body.classroomOverlayDeckId), `/game/decks/${deckId}/present`);
});

test('pin rejects unknown deck id', async () => {
  const {instance, host} = fixture();
  const app = instance.app;
  const bad = await invoke(app, 'put', '/game/classroom-overlay', {
    body: {deckId: '11111111-1111-1111-1111-111111111111', day: 1},
    cookies: {academy: host.token},
  });
  assert.equal(bad.statusCode, 404);
});
