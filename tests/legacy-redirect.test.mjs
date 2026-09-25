import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';

async function withServer(run) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'academy-legacy-'));
  const data = mkdtempSync(path.join(os.tmpdir(), 'academy-legacy-data-'));
  mkdirSync(path.join(root, 'dist'), {recursive: true});
  mkdirSync(path.join(root, 'apps/web/dist'), {recursive: true});
  writeFileSync(path.join(root, 'dist/index.html'), '<!doctype html><body>legacy-root</body>');
  writeFileSync(path.join(root, 'apps/web/dist/index.html'), '<!doctype html><div id="root" data-surface="classroom-deck"></div>');
  const {server} = createApp({dir: data, root, hostKey: 'test-host', publicBaseUrl: 'http://127.0.0.1:4317', proofBase: 'http://127.0.0.1:9'});
  await new Promise((resolve, reject) => server.listen(0, '127.0.0.1', (err) => (err ? reject(err) : resolve())));
  try {
    await run(server.address().port);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    rmSync(root, {recursive: true, force: true});
    rmSync(data, {recursive: true, force: true});
  }
}

const redirect = async (port, site, from) => {
  const res = await fetch(`http://127.0.0.1:${port}/legacy-redirect?site=${site}&from=${encodeURIComponent(from)}`, {redirect: 'manual'});
  await res.arrayBuffer();
  return {status: res.status, location: res.headers.get('location')};
};

const TRAINING = 'https://aetherlink-training.ryanlisse.chatgpt.site';

test('old training-site and classroom-slides URLs answer 301 with the matching Academy page', async () => {
  const cases = [
    ['training-site', `${TRAINING}/`, '/archive'],
    ['training-site', `${TRAINING}/?squad=1&day=1#1`, '/archive/squad-1/day-1#slide-archive-s1-day1-1'],
    ['training-site', `${TRAINING}/?squad=1&day=2`, '/archive/squad-1/day-2'],
    ['training-site', `${TRAINING}/?squad=1&day=3#12`, '/archive/squad-1/day-3#slide-archive-s1-day3-12'],
    ['training-site', `${TRAINING}/?squad=1&day=4`, '/archive/squad-1/day-4'],
    ['training-site', `${TRAINING}/?squad=1&day=5#1`, '/archive/squad-1/day-5#slide-archive-s1-day5-1'],
    ['training-site', `${TRAINING}/?day=1&squad=2`, '/archive/squad-2/day-1'],
    ['training-site', `${TRAINING}/index.html?squad=2&day=2#7`, '/archive/squad-2/day-2#slide-archive-s2-day2-7'],
    ['training-site', `${TRAINING}/?squad=2&day=3&utm_source=mail`, '/archive/squad-2/day-3'],
    ['training-site', `${TRAINING}/?squad=2&day=4`, '/archive/squad-2/day-4'],
    ['training-site', `${TRAINING}/?squad=2&day=5`, '/archive/squad-2/day-5'],
    ['training-site', `${TRAINING}/?lesson=daily-brief#3`, '/workshop/4'],
    ['training-site', `${TRAINING}/glossary.html`, '/reference/glossary'],
    ['training-site', `${TRAINING}/?squad=3&day=1`, '/archive'],
    ['classroom-slides', 'http://localhost:8080/#1', '/classroom/1'],
    ['classroom-slides', 'http://localhost:8080/#35', '/classroom/1?index=34'],
    ['classroom-slides', 'http://localhost:8080/index.html#45', '/classroom/2'],
    ['classroom-slides', 'http://localhost:8080/#91', '/classroom/2?index=46'],
    ['classroom-slides', 'http://localhost:8080/presenter.html#50', '/classroom/2?index=5&mode=presenter'],
    ['classroom-slides', 'http://localhost:8080/styles.css', '/classroom/1'],
  ];
  await withServer(async (port) => {
    for (const [site, from, location] of cases) {
      assert.deepEqual(await redirect(port, site, from), {status: 301, location}, `${site} ${from}`);
    }
  });
});

test('an unknown site is refused rather than redirected, and redirects never leave the Academy origin', async () => {
  await withServer(async (port) => {
    assert.deepEqual(await redirect(port, 'evil', `${TRAINING}/`), {status: 400, location: null});
    assert.deepEqual(await redirect(port, 'training-site', 'https://evil.example/?squad=1&day=3'), {status: 301, location: '/archive/squad-1/day-3'});
    assert.deepEqual(await redirect(port, 'training-site', '//evil.example/x'), {status: 301, location: '/archive'});
  });
});

test('archive paths are served by the apps/web SPA', async () => {
  await withServer(async (port) => {
    for (const route of ['/archive', '/archive/squad-1/day-3']) {
      const res = await fetch(`http://127.0.0.1:${port}${route}`);
      assert.equal(res.status, 200, route);
      assert.match(await res.text(), /data-surface="classroom-deck"/, route);
    }
  });
});
