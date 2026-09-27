import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const main = readFileSync(join(root, 'src/main.jsx'), 'utf8');
const embed = readFileSync(join(root, 'src/LabEmbed.jsx'), 'utf8');
const panels = readFileSync(join(root, 'src/panels.jsx'), 'utf8');
const css = readFileSync(join(root, 'src/style.css'), 'utf8');
const en = JSON.parse(readFileSync(join(root, 'src/i18n/en.json'), 'utf8'));
const nl = JSON.parse(readFileSync(join(root, 'src/i18n/nl.json'), 'utf8'));
const docs = readFileSync(join(root, 'docs/LAB-EMBED.md'), 'utf8');

test('F3 teacher config chrome lives in teach bar (catalog select + open toggle)', () => {
  assert.match(main, /function LabConfigChrome/);
  assert.match(main, /fac-lab-config/);
  assert.match(main, /data-testid="fac-lab-select"/);
  assert.match(main, /data-testid="fac-lab-open"/);
  assert.match(main, /api\('lab-catalog'\)/);
  assert.match(main, /control\('lab'/);
  assert.match(css, /\.fac-lab-config/);
  const teachIdx = main.indexOf('facilitator-teach');
  const dialsIdx = main.indexOf('facilitator-dials');
  assert.ok(main.slice(teachIdx, dialsIdx).includes('LabConfigChrome'), 'lab config belongs in teach bar');
});

test('F4 student play surface gates the iframe behind Enter lab', () => {
  assert.match(embed, /data-testid="lab-play"/);
  assert.match(embed, /lab-play-surface/);
  assert.match(embed, /t\('lab\.play'\)/);
  assert.match(css, /\.lab-play-surface/);
});

test('F6 empty / timeout / retry copy wired', () => {
  assert.match(embed, /READY_TIMEOUT_MS/);
  assert.match(embed, /lab\.timeout/);
  assert.match(embed, /lab\.retry/);
  assert.match(embed, /LabSlotEmpty/);
  assert.match(panels, /LabSlotEmpty/);
  assert.match(embed, /lab\.emptyFacilitator/);
  assert.match(embed, /lab\.emptyLearner/);
});

test('F2/F7 postMessage contract documented; no Judge0 / second sandbox', () => {
  assert.match(docs, /type: 'ready'/);
  assert.match(docs, /type: 'complete'/);
  assert.match(docs, /type: 'error'/);
  assert.match(docs, /Teacher config chrome/);
  assert.doesNotMatch(docs, /Judge0/i);
  assert.doesNotMatch(main, /Judge0/i);
  assert.doesNotMatch(embed, /Judge0/i);
  assert.match(docs, /apps\/arcade-lab/);
});

test('AET-87 i18n keys present EN+NL', () => {
  for (const key of [
    'lab.play',
    'lab.readyToPlay',
    'lab.timeout',
    'lab.retry',
    'lab.emptyFacilitator',
    'lab.emptyLearner',
    'fac.lab',
    'fac.labNone',
    'fac.labOpen',
  ]) {
    assert.ok(en[key], `missing EN ${key}`);
    assert.ok(nl[key], `missing NL ${key}`);
  }
});
