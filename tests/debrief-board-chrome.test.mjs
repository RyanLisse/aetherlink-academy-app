import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const main = readFileSync(join(root, 'src/main.jsx'), 'utf8');
const panels = readFileSync(join(root, 'src/panels.jsx'), 'utf8');
const boardDoc = readFileSync(join(root, 'src/board-doc.js'), 'utf8');
const debriefBoard = readFileSync(join(root, 'server/debrief-board.mjs'), 'utf8');
const proof = readFileSync(join(root, 'server/proof.mjs'), 'utf8');
const css = readFileSync(join(root, 'src/style.css'), 'utf8');
const en = JSON.parse(readFileSync(join(root, 'src/i18n/en.json'), 'utf8'));
const nl = JSON.parse(readFileSync(join(root, 'src/i18n/nl.json'), 'utf8'));

test('F1 open debrief from room chrome ≤2 clicks (teach bar + debrief panel)', () => {
  assert.match(main, /data-testid="fac-board-open"/);
  assert.match(main, /fac-board-open/);
  assert.match(main, /onOpenBoard=\{\(\)=>action/);
  assert.match(main, /api\('board',\{action:'open'\}\)/);
  assert.match(main, /setView\('board'\)/);
  const teachIdx = main.indexOf('facilitator-teach');
  const dialsIdx = main.indexOf('facilitator-dials');
  assert.ok(main.slice(teachIdx, dialsIdx).includes('fac-board-open'), 'board open belongs in teach bar');
  assert.match(panels, /data-testid="debrief-open-board"/);
  assert.match(panels, /debrief\.openBoard/);
});

test('F2/F3 Proof/Yjs path only — no second collab stack', () => {
  assert.match(boardDoc, /@hocuspocus\/provider/);
  assert.match(boardDoc, /from 'yjs'/);
  assert.match(boardDoc, /\/api\/documents\/\$\{slug\}\/collab-session/);
  assert.match(boardDoc, /location\.host\}\/ws/);
  assert.match(debriefBoard, /roomDocument/);
  assert.match(proof, /createBoard|fence|pause|resume/s);
  assert.doesNotMatch(main, /websocket\.io|partykit|liveblocks|figjam|tldraw|excalidraw/i);
  assert.doesNotMatch(boardDoc, /partykit|liveblocks|figjam|tldraw|excalidraw/i);
});

test('F4 thin toolbar ≤5 tools + start-debrief empty copy', () => {
  assert.match(main, /data-testid="board-toolbar"/);
  assert.match(main, /board\.toolbar/);
  assert.match(main, /data-tool="sticky"/);
  assert.match(main, /data-tool="text"/);
  assert.match(main, /data-tool="close"/);
  assert.match(main, /data-tool="open"/);
  assert.match(main, /data-tool="export"/);
  const toolbar = main.slice(main.indexOf('board-toolbar'), main.indexOf('board-toolbar') + 1200);
  const tools = [...toolbar.matchAll(/data-tool="([^"]+)"/g)].map(m => m[1]);
  assert.ok(tools.length <= 5, `expected ≤5 tools, got ${tools.join(',')}`);
  assert.match(main, /board\.startDebrief/);
  assert.match(main, /board\.startDebriefHelp/);
  assert.match(main, /board\.emptyCardsHelp/);
  assert.match(en['board.startDebrief'], /Start debrief/i);
  assert.match(nl['board.startDebrief'], /Start debrief/i);
});

test('F5 close/persist — reopen restores same Proof board', () => {
  assert.match(main, /board\.reopen/);
  assert.match(en['board.reopen'], /same content|Reopen/i);
  assert.match(debriefBoard, /if\(!r\.board\)\{/);
  assert.match(debriefBoard, /r\.board\.status=status/);
  // open reuses stored proof; create only when absent (server/routes/game.mjs)
  const gameRoutes = readFileSync(join(root, 'server/routes/game.mjs'), 'utf8');
  assert.match(
    gameRoutes,
    /action\s*===\s*'open'\s*&&\s*!r\.board\s*\?\s*await proof\.createBoard/,
  );
});

test('F6 disconnect shows human reconnect UX', () => {
  assert.match(main, /board\.offlineHelp/);
  assert.match(main, /sync==='offline'\|\|sync==='denied'/);
  assert.match(main, /StatusState kind="offline" title=\{t\('board\.sync\.'\+/);
  assert.match(main, /status\.retry/);
  assert.match(main, /reconnect/);
  assert.match(boardDoc, /onClose:\(\)=>\{onStatus\('offline'\)/);
  assert.ok(en['board.sync.offline']);
  assert.ok(nl['board.sync.offline']);
  assert.ok(en['board.offlineHelp']);
});

test('F7 no FigJam / LearnHouse boards fork', () => {
  assert.doesNotMatch(main, /learnhouse|figjam|miro|tldraw|excalidraw/i);
  assert.doesNotMatch(css, /learnhouse|figjam|miro|tldraw|excalidraw/i);
  assert.doesNotMatch(boardDoc, /learnhouse|figjam/i);
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
    'board.offlineHelp',
    'debrief.openBoard',
    'debrief.reopenBoard',
    'debrief.viewBoard',
  ]) {
    assert.ok(en[key], `missing EN ${key}`);
    assert.ok(nl[key], `missing NL ${key}`);
  }
});
