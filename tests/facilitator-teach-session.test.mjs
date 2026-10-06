import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Store} from '../server/store.mjs';
import {createApp} from '../server/app.mjs';

async function invoke(app, route, {method = 'post', body = {}, cookies = {}, query = {}} = {}) {
  const layer = app.router.stack.find(
    (candidate) => candidate.route?.path === route && candidate.route.methods[method],
  );
  assert.ok(layer, `Missing ${method} ${route}`);
  const response = {statusCode: 200, body: null, cookies: []};
  const req = {
    body,
    query,
    headers: {
      cookie: Object.entries(cookies)
        .map(([name, value]) => `${name}=${value}`)
        .join('; '),
    },
  };
  const res = {
    cookie(name, value) {
      response.cookies.push(`${name}=${value}`);
      return this;
    },
    clearCookie() {
      return this;
    },
    status(status) {
      response.statusCode = status;
      return this;
    },
    json(value) {
      response.body = value;
      return this;
    },
    end() {
      return this;
    },
  };
  await layer.route.stack[0].handle(req, res, (error) => {
    response.statusCode = error.status || 500;
    response.body = {
      error: error.status ? error.message : 'Onverwachte serverfout.',
    };
  });
  return response;
}

test('ensureTeachSession creates hidden personal room; overview omits it; join blocked', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'academy-teach-'));
  try {
    const store = new Store(dir);
    store.create('Live squad', {email: 'ryan@example.com', name: 'Ryan'});
    const teach = store.ensureTeachSession({email: 'ryan@example.com', name: 'Ryan'});
    assert.equal(teach.teach, true);
    const again = store.ensureTeachSession({email: 'ryan@example.com', name: 'Ryan'});
    assert.equal(again.roomId, teach.roomId, 'reuses same teach room per facilitator');
    const rooms = store.overview();
    assert.deepEqual(
      rooms.map((r) => r.name),
      ['Live squad'],
    );
    assert.ok(!rooms.some((r) => r.id === teach.roomId));
    const other = store.ensureTeachSession({email: 'other@example.com', name: 'Other'});
    assert.notEqual(other.roomId, teach.roomId);
    assert.throws(
      () => store.join(store.auth(teach.token).r.code, 'Alice'),
      /private facilitator teach session/,
    );
    const hostTeach = store.ensureTeachSession(null);
    assert.equal(hostTeach.teach, true);
    assert.ok(store.overview().every((r) => r.name === 'Live squad'));
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});

test('POST /game/facilitator/teach attaches facilitator; overview stays empty; day-route unlocks 1–7', async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'academy-teach-http-'));
  try {
    const instance = createApp({
      dir,
      hostKey: 'test-host-key',
      publicBaseUrl: 'http://127.0.0.1:4321',
    });
    const teach = await invoke(instance.app, '/game/facilitator/teach', {
      body: {hostKey: 'test-host-key'},
    });
    assert.equal(teach.statusCode, 200, JSON.stringify(teach.body));
    assert.ok(teach.body.token);
    assert.equal(teach.body.teach, true);
    const overview = await invoke(instance.app, '/game/facilitator/overview', {
      body: {hostKey: 'test-host-key'},
    });
    assert.equal(overview.statusCode, 200);
    assert.deepEqual(overview.body, []);
    const route = await invoke(instance.app, '/game/day-route', {
      method: 'get',
      query: {locale: 'en'},
      cookies: {academy: teach.body.token},
    });
    assert.equal(route.statusCode, 200, JSON.stringify(route.body));
    assert.ok(route.body.days?.length >= 7);
    assert.ok(
      route.body.days.every((d) => d.released === true),
      'facilitator sees all days released',
    );
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});
