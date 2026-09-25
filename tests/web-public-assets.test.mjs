import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {createApp} from '../server/app.mjs';

const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');

function fixtureRoot() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'academy-web-assets-'));
  const data = mkdtempSync(path.join(os.tmpdir(), 'academy-web-assets-data-'));
  mkdirSync(path.join(root, 'dist'), {recursive: true});
  mkdirSync(path.join(root, 'apps/web/dist/assets/avatars'), {recursive: true});
  writeFileSync(path.join(root, 'dist/index.html'), '<!doctype html><title>legacy</title>');
  writeFileSync(path.join(root, 'apps/web/dist/index.html'), '<!doctype html><title>AetherLink Academy</title>');
  writeFileSync(path.join(root, 'apps/web/dist/assets/aetherlink-mark.png'), PNG);
  writeFileSync(path.join(root, 'apps/web/dist/assets/avatars/avatar-cartoon.webp'), 'RIFFwebp');
  return {root, data};
}

test('web public /assets files are served without a Proof session; other /assets paths stay behind the Proof gateway', async () => {
  const {root, data} = fixtureRoot();
  const forwarded = [];
  const upstream = http.createServer((req, res) => {
    forwarded.push({url: req.url, authorization: req.headers.authorization});
    res.setHeader('content-type', 'text/javascript');
    res.end('proof-editor-bundle');
  });
  await new Promise((r) => upstream.listen(0, '127.0.0.1', r));
  const instance = createApp({dir: data, root, hostKey: 'test-host', publicBaseUrl: 'http://127.0.0.1:4317', proofBase: `http://127.0.0.1:${upstream.address().port}`});
  await new Promise((r) => instance.server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${instance.server.address().port}`;
  try {
    const logo = await fetch(`${base}/assets/aetherlink-mark.png`);
    assert.equal(logo.status, 200);
    assert.equal(logo.headers.get('content-type'), 'image/png');
    assert.deepEqual(Buffer.from(await logo.arrayBuffer()), PNG);

    const avatar = await fetch(`${base}/assets/avatars/avatar-cartoon.webp`);
    assert.equal(avatar.status, 200);
    assert.equal(avatar.headers.get('content-type'), 'image/webp');
    assert.equal(await avatar.text(), 'RIFFwebp');

    for (const route of ['/assets/editor-abc123.js', '/assets/aetherlink-mark.png.map', '/assets/avatars/']) {
      const res = await fetch(base + route);
      assert.equal(res.status, 401, route);
    }
    assert.deepEqual(forwarded, []);

    const host = instance.store.create('Assets room', {slug: 'assets-room', editor: 'proof-test-token'});
    const player = instance.store.join(host.code, 'Player');
    const editor = await fetch(`${base}/assets/editor-abc123.js`, {headers: {cookie: `academy=${player.token}`}});
    assert.equal(editor.status, 200);
    assert.equal(await editor.text(), 'proof-editor-bundle');
    assert.deepEqual(forwarded, [{url: '/assets/editor-abc123.js', authorization: 'Bearer proof-test-token'}]);
  } finally {
    await new Promise((r) => instance.server.close(r));
    await new Promise((r) => upstream.close(r));
    rmSync(root, {recursive: true, force: true});
    rmSync(data, {recursive: true, force: true});
  }
});
