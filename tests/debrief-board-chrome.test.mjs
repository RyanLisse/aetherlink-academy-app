import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const main = readFileSync(join(root, 'src/main.jsx'), 'utf8');
const shell = readFileSync(join(root, 'src/classroom-shell.jsx'), 'utf8');
const gameRoutesPath = join(root, 'server/game-routes.mjs');
const gameRoutes = existsSync(gameRoutesPath) ? readFileSync(gameRoutesPath, 'utf8') : '';

test('session chrome is ClassroomShell (no teach-bar debrief entry)', () => {
  assert.match(main, /ClassroomShell/);
  assert.match(shell, /data-testid="classroom-shell"/);
  assert.doesNotMatch(main, /data-testid="fac-board-open"/);
  assert.doesNotMatch(main, /facilitator-teach/);
  assert.doesNotMatch(main, /data-testid="board-toolbar"/);
});

test('no embedded collaboration stack in client', () => {
  assert.equal(existsSync(join(root, 'src/board-doc.js')), false);
  assert.doesNotMatch(main, /@hocuspocus|from 'yjs'|collab-session|partykit|liveblocks|figjam|tldraw|excalidraw/i);
  assert.doesNotMatch(shell, /@hocuspocus|from 'yjs'|partykit|liveblocks/i);
});

test('ClassroomShell provides course grid + outline + mark-complete instead of board chrome', () => {
  assert.match(shell, /data-testid="classroom-course-card"/);
  assert.match(shell, /data-testid="classroom-outline"/);
  assert.match(shell, /mark-complete|markComplete|Mark complete/i);
});
