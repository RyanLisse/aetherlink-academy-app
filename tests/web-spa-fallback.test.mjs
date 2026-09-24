import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';

function fixtureRoot() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'academy-web-spa-'));
  const data = mkdtempSync(path.join(os.tmpdir(), 'academy-web-spa-data-'));
  mkdirSync(path.join(root, 'dist'), {recursive: true});
  mkdirSync(path.join(root, 'apps/web/dist/academy-assets'), {recursive: true});
  mkdirSync(path.join(root, 'apps/arcade-lab/dist'), {recursive: true});
  writeFileSync(path.join(root, 'dist/index.html'), '<!doctype html><title>legacy</title><body>legacy-root</body>');
  writeFileSync(
    path.join(root, 'apps/web/dist/index.html'),
    '<!doctype html><html><head><title>AetherLink Academy</title></head><body><div id="root" data-surface="classroom-deck"></div><script type="module" src="/academy-assets/index.js"></script></body></html>',
  );
  writeFileSync(path.join(root, 'apps/web/dist/academy-assets/index.js'), 'console.log("web")');
  writeFileSync(path.join(root, 'apps/arcade-lab/dist/index.html'), '<!doctype html><title>arcade-lab</title>');
  return {root, data};
}

async function withServer(run) {
  const {root, data} = fixtureRoot();
  const {app, server} = createApp({
    dir: data,
    root,
    hostKey: 'test-host',
    publicBaseUrl: 'http://127.0.0.1:4317',
    proofBase: 'http://127.0.0.1:9',
  });
  await new Promise((resolve, reject) => server.listen(0, '127.0.0.1', (err) => (err ? reject(err) : resolve())));
  const {port} = server.address();
  try {
    await run({port, root});
  } finally {
    await new Promise((resolve) => server.close(resolve));
    rmSync(root, {recursive: true, force: true});
    rmSync(data, {recursive: true, force: true});
  }
}

async function get(port, pathname) {
  const res = await fetch(`http://127.0.0.1:${port}${pathname}`);
  const text = await res.text();
  return {status: res.status, text, contentType: res.headers.get('content-type') || ''};
}

test('apps/web SPA fallback returns index for classroom/deck/workshop/lesson/live', async () => {
  await withServer(async ({port}) => {
    for (const route of ['/classroom/1', '/classroom/2', '/workshop/5', '/workshop/3', '/workshop/4', '/workshop/6', '/lesson/classroom-1', '/lesson/workshop-3', '/lesson/workshop-4', '/lesson/workshop-6', '/deck', '/live/demo']) {
      const res = await get(port, route);
      assert.equal(res.status, 200, `${route} status`);
      assert.match(res.text, /data-surface="classroom-deck"/, `${route} body`);
      assert.match(res.text, /AetherLink Academy/, `${route} title`);
    }
    const asset = await get(port, '/academy-assets/index.js');
    assert.equal(asset.status, 200);
    assert.match(asset.text, /console\.log\("web"\)/);
    const legacy = await get(port, '/');
    assert.equal(legacy.status, 200);
    assert.match(legacy.text, /legacy-root/);
    const arcade = await get(port, '/arcade/weather');
    assert.equal(arcade.status, 200);
    assert.match(arcade.text, /legacy-root/);
  });
});
