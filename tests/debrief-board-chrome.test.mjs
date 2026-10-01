import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const main = readFileSync(join(root, 'src/main.jsx'), 'utf8');
const panels = readFileSync(join(root, 'src/panels.jsx'), 'utf8');
const debriefBoard = readFileSync(join(root, 'server/debrief-board.mjs'), 'utf8');
const gameRoutes = readFileSync(join(root, 'server/routes/game.mjs'), 'utf8');
const css = readFileSync(join(root, 'src/style.css'), 'utf8');
const en = JSON.parse(readFileSync(join(root, 'src/i18n/en.json'), 'utf8'));
const nl = JSON.parse(readFileSync(join(root, 'src/i18n/nl.json'), 'utf8'));

test('F1 open debrief from room chrome ≤2 clicks (teach bar + debrief panel)', () => {
  assert.match(main, /data-testid="fac-board-open"/);
  assert.match(main, /onOpenBoard=\{\(\)=>action/);
  assert.match(main, /const navigate=useCallback\(\(next,\{page='lesson',day\}=\{\}\)=>\{\s*setView\(next\);/);
  assert.match(main, /onOpenBoard=\{\(\)=>action\(async\(\)=>\{navigate\('board'\);/);
  assert.match(main, /api\('board',\{action:'open'\}\)/);
  const teachIdx = main.indexOf('facilitator-teach');
  const dialsIdx = main.indexOf('facilitator-dials');
  assert.ok(main.slice(teachIdx, dialsIdx).includes('fac-board-open'), 'board open belongs in teach bar');
  assert.match(panels, /data-testid="debrief-open-board"/);
  assert.match(panels, /debrief\.openBoard/);
});

test('F2/F3 board is Academy room state — no embedded collaboration stack', () => {
  assert.equal(existsSync(join(root, 'src/board-doc.js')), false);
  assert.equal(existsSync(join(root, 'server/proof.mjs')), false);
  assert.match(main, /api\('board\/card',\{column:index,text\}\)/);
  assert.match(gameRoutes, /'\/game\/board\/card'/);
  assert.match(gameRoutes, /addBoardCard\(r,/);
  assert.doesNotMatch(main, /@hocuspocus|from 'yjs'|collab-session|websocket\.io|partykit|liveblocks|figjam|tldraw|excalidraw/i);
  assert.doesNotMatch(debriefBoard, /proof|roomDocument|hocuspocus|yjs/i);
});

test('F4 thin toolbar ≤5 tools + start-debrief empty copy', () => {
  assert.match(main, /data-testid="board-toolbar"/);
  assert.match(main, /board\.toolbar/);
  for (const tool of ['sticky', 'text', 'close', 'open', 'export']) assert.match(main, new RegExp(`data-tool="${tool}"`));
  const toolbar = main.slice(main.indexOf('board-toolbar'), main.indexOf('board-toolbar') + 1600);
  const tools = [...toolbar.matchAll(/data-tool="([^"]+)"/g)].map(m => m[1]);
  assert.ok(tools.length <= 5, `expected ≤5 tools, got ${tools.join(',')}`);
  assert.match(main, /board\.startDebrief/);
  assert.match(main, /board\.startDebriefHelp/);
  assert.match(main, /board\.emptyCardsHelp/);
  assert.match(en['board.startDebrief'], /Start debrief/i);
  assert.match(nl['board.startDebrief'], /Start debrief/i);
});

test('F5 close/persist — reopen keeps the same cards', () => {
  assert.match(main, /board\.reopen/);
  assert.match(en['board.reopen'], /same content|Reopen/i);
  assert.match(debriefBoard, /if\(!r\.board\)\{/);
  assert.match(debriefBoard, /r\.board\.cards\?\?=\[\];/);
  assert.match(debriefBoard, /r\.board\.status=status/);
  assert.match(gameRoutes, /applyBoardAction\(r, req\.body\?\.action/);
});

test('F7 no FigJam / LearnHouse boards fork', () => {
  assert.doesNotMatch(main, /learnhouse|figjam|miro|tldraw|excalidraw/i);
  assert.doesNotMatch(css, /learnhouse|figjam|miro|tldraw|excalidraw/i);
});

test('AET-90 i18n keys present EN+NL', () => {
  for (const key of [
    'fac.boardOpen',
    'fac.boardReopen',
    'fac.boardView',
    'board.startDebrief',
    'board.startDebriefHelp',
    'board.emptyCardsHelp',
    'board.toolbar',
    'board.tool.sticky',
    'board.tool.text',
    'debrief.openBoard',
    'debrief.reopenBoard',
    'debrief.viewBoard',
  ]) {
    assert.ok(en[key], `missing EN ${key}`);
    assert.ok(nl[key], `missing NL ${key}`);
  }
});
