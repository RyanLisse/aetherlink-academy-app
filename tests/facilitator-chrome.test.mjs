import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const main = readFileSync(join(root, 'src/main.jsx'), 'utf8');
const shell = readFileSync(join(root, 'src/classroom-shell.jsx'), 'utf8');
const css = readFileSync(join(root, 'src/classroom-shell.css'), 'utf8');

test('session UI is ClassroomShell — legacy teach bar removed', () => {
  assert.match(main, /ClassroomShell/);
  assert.doesNotMatch(main, /facilitator-teach/);
  assert.doesNotMatch(main, /fac-day-label/);
  assert.doesNotMatch(main, /facilitator-dials/);
});

test('ClassroomShell exposes course grid and lesson chrome', () => {
  assert.match(shell, /data-testid="classroom-shell"/);
  assert.match(shell, /data-testid="classroom-course-card"/);
  assert.match(shell, /data-testid="classroom-outline"/);
  assert.match(css, /classroom-shell|classroom-course/i);
});

test('no LearnHouse markers in classroom chrome', () => {
  assert.doesNotMatch(main, /learnhouse/i);
  assert.doesNotMatch(shell, /learnhouse/i);
  assert.doesNotMatch(css, /learnhouse/i);
});

test('facilitator admin path still wired from App', () => {
  assert.match(main, /ADMIN_PATH|\/facilitator/);
  assert.match(main, /FacilitatorAdmin/);
});
