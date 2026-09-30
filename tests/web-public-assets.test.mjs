import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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

test('web public /assets files are served without a session; unknown /assets paths are not proxied anywhere', async () => {
  const {root, data} = fixtureRoot();
  const instance = createApp({dir: data, root, hostKey: 'test-host', publicBaseUrl: 'http://127.0.0.1:4317'});
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

    const host = instance.store.create('Assets room');
    const player = instance.store.join(host.code, 'Player');
    for (const route of ['/assets/editor-abc123.js', '/assets/aetherlink-mark.png.map']) {
      for (const headers of [{}, {cookie: `academy=${player.token}`}]) {
        const res = await fetch(base + route, {headers});
        assert.notEqual(res.status, 200, route);
        assert.doesNotMatch(await res.text(), /editor-bundle/);
      }
    }
  } finally {
    await new Promise((r) => instance.server.close(r));
    rmSync(root, {recursive: true, force: true});
    rmSync(data, {recursive: true, force: true});
  }
});
