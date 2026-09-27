import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  CLASSROOM_NAV_KEYS,
  deckFullscreenAllowed,
  forwardClassroomNavKey,
  isClassroomNavKey,
  isDeckEditableTarget,
  shouldForwardClassroomNavKey,
} from '../src/classroom.js';

test('isClassroomNavKey covers arrow/page/space used by SPA + Effect present', () => {
  for (const key of CLASSROOM_NAV_KEYS) {
    assert.equal(isClassroomNavKey(key), true, key);
  }
  assert.equal(isClassroomNavKey('Escape'), false);
  assert.equal(isClassroomNavKey('Tab'), false);
  assert.equal(isClassroomNavKey('Enter'), false);
  assert.equal(isClassroomNavKey('f'), false);
  assert.equal(isClassroomNavKey('Space'), false); // DOM key is ' ', not 'Space'
});

test('isDeckEditableTarget matches input/textarea/select/contenteditable', () => {
  assert.equal(isDeckEditableTarget(null), false);
  assert.equal(isDeckEditableTarget({tagName: 'INPUT'}), true);
  assert.equal(isDeckEditableTarget({tagName: 'TEXTAREA'}), true);
  assert.equal(isDeckEditableTarget({tagName: 'SELECT'}), true);
  assert.equal(isDeckEditableTarget({tagName: 'DIV', isContentEditable: true}), true);
  assert.equal(isDeckEditableTarget({tagName: 'DIV', isContentEditable: false}), false);
  assert.equal(
    isDeckEditableTarget({
      tagName: 'SPAN',
      closest: (sel) => (sel.includes('textarea') ? {tagName: 'TEXTAREA'} : null),
    }),
    true,
  );
  assert.equal(
    isDeckEditableTarget({
      tagName: 'BUTTON',
      closest: () => null,
    }),
    false,
  );
});

test('shouldForwardClassroomNavKey skips editable iframe focus (K6)', () => {
  assert.equal(shouldForwardClassroomNavKey('ArrowRight', null), true);
  assert.equal(shouldForwardClassroomNavKey(' ', {tagName: 'INPUT'}), false);
  assert.equal(shouldForwardClassroomNavKey('PageDown', {tagName: 'TEXTAREA'}), false);
  assert.equal(shouldForwardClassroomNavKey('Escape', null), false);
});

test('forwardClassroomNavKey dispatches bubbling keydown on iframe document', () => {
  const dispatched = [];
  class FakeKeyboardEvent {
    constructor(type, init) {
      this.type = type;
      Object.assign(this, init);
    }
  }
  const doc = {
    activeElement: {tagName: 'BODY', closest: () => null},
    dispatchEvent(event) {
      dispatched.push(event);
      return true;
    },
  };
  const iframe = {contentDocument: doc, contentWindow: {}};
  assert.equal(forwardClassroomNavKey(iframe, 'ArrowRight', FakeKeyboardEvent), true);
  assert.equal(dispatched.length, 1);
  assert.equal(dispatched[0].type, 'keydown');
  assert.equal(dispatched[0].key, 'ArrowRight');
  assert.equal(dispatched[0].code, 'ArrowRight');
  assert.equal(dispatched[0].bubbles, true);

  assert.equal(forwardClassroomNavKey(iframe, ' ', FakeKeyboardEvent), true);
  assert.equal(dispatched[1].key, ' ');
  assert.equal(dispatched[1].code, 'Space');

  // Editable focus → no dispatch
  doc.activeElement = {tagName: 'TEXTAREA'};
  assert.equal(forwardClassroomNavKey(iframe, 'ArrowLeft', FakeKeyboardEvent), false);
  assert.equal(dispatched.length, 2);

  // Missing iframe / cross-origin
  assert.equal(forwardClassroomNavKey(null, 'ArrowRight', FakeKeyboardEvent), false);
  assert.equal(
    forwardClassroomNavKey(
      {
        get contentDocument() {
          throw new Error('cross-origin');
        },
      },
      'ArrowRight',
      FakeKeyboardEvent,
    ),
    false,
  );
});

test('deckFullscreenAllowed is false when framed (F4)', () => {
  const top = {};
  assert.equal(deckFullscreenAllowed({top, get self() { return this; }}), false);
  // Simulate top-level: win === win.top
  const topWin = {};
  topWin.top = topWin;
  assert.equal(deckFullscreenAllowed(topWin), true);
  // Cross-origin parent access throws
  assert.equal(
    deckFullscreenAllowed({
      get top() {
        throw new Error('Blocked a frame');
      },
    }),
    false,
  );
});

test('ClassroomOverlay effect does not depend on onClose (FS thrash fix)', () => {
  const main = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
  const start = main.indexOf('function ClassroomOverlay');
  const end = main.indexOf('function Brand()');
  assert.ok(start >= 0 && end > start);
  const overlay = main.slice(start, end);
  assert.match(overlay, /onCloseRef/);
  assert.match(overlay, /onCloseRef\.current\s*=\s*onClose/);
  // Mount effect must not list onClose in deps (empty deps = mount once).
  assert.match(overlay, /\},\[\]\);/);
  assert.doesNotMatch(overlay, /\},\[onClose\]\);/);
  assert.match(overlay, /forwardClassroomNavKey/);
  assert.match(overlay, /isClassroomNavKey/);
  // Belt-and-suspenders: App uses stable closeClassroom
  assert.match(main, /closeClassroom\s*=\s*useCallback/);
  assert.match(main, /onClose=\{closeClassroom\}/);
});

test('framed deck FS guards land in Deck package + Effect present HTML', () => {
  const deck = readFileSync(new URL('../packages/deck/src/Deck.tsx', import.meta.url), 'utf8');
  assert.match(deck, /window\s*!==\s*window\.top/);
  const present = readFileSync(new URL('../server/slides/export-html.ts', import.meta.url), 'utf8');
  assert.match(present, /window\s*!==\s*window\.top/);
  assert.match(present, /function toggleFullscreen/);
});

import {
  DECK_NAV_KEYS,
  deckNavBlockedByTarget,
  isDeckNavKey,
} from '../packages/deck/src/nav-keys.ts';

test('deckNavBlockedByTarget: toolbar button does not steal Arrow/Space (VERIFIED path)', () => {
  const button = {
    closest(sel) {
      if (sel.includes('button')) return this;
      return null;
    },
  };
  for (const key of DECK_NAV_KEYS) {
    assert.equal(deckNavBlockedByTarget(button, key), false, `nav key ${JSON.stringify(key)}`);
  }
  // Non-nav still blocked on button (e.g. presenter shortcut)
  assert.equal(deckNavBlockedByTarget(button, 's'), true);
  assert.equal(deckNavBlockedByTarget(button, 'c'), true);
});

test('deckNavBlockedByTarget: input/textarea still steal keys (K6)', () => {
  const input = {
    closest(sel) {
      if (sel.includes('input')) return this;
      return null;
    },
  };
  assert.equal(deckNavBlockedByTarget(input, 'ArrowRight'), true);
  assert.equal(deckNavBlockedByTarget(input, ' '), true);
  assert.equal(isDeckNavKey(' '), true);
});

test('Deck.tsx uses deckNavBlockedByTarget and blurs toolbar after activate', () => {
  const deck = readFileSync(new URL('../packages/deck/src/Deck.tsx', import.meta.url), 'utf8');
  assert.match(deck, /deckNavBlockedByTarget/);
  assert.doesNotMatch(deck, /closest\('input, textarea, select, button, a/);
  assert.match(deck, /event\.currentTarget\.blur\(\)/);
  assert.match(deck, /stageRef\.current\?\.focus/);
});

test('Effect present no longer skips Space on focused button', () => {
  const present = readFileSync(new URL('../server/slides/export-html.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(present, /e\.key === ' ' && e\.target\.closest && e\.target\.closest\('button'\)/);
  assert.match(present, /refocusStage/);
  assert.match(present, /preventDefault\(\); show\(current \+ 1\)/);
});

test('AET-107 fullscreen label flips with fullscreenElement (Deck + Effect present)', () => {
  const deck = readFileSync(new URL('../packages/deck/src/Deck.tsx', import.meta.url), 'utf8');
  assert.match(deck, /fullscreenchange/);
  assert.match(deck, /Exit fullscreen/);
  assert.match(deck, /Enter fullscreen/);
  assert.match(deck, /fullscreenLabel/);
  assert.match(deck, /aria-label=\{fullscreenLabel\}/);
  assert.match(deck, /title=\{fullscreenLabel\}/);
  // Framed early-return must still blur so overlay focus ring does not stick.
  assert.match(deck, /if \(window !== window\.top\) \{ refocus\(\); return; \}/);
  const present = readFileSync(new URL('../server/slides/export-html.ts', import.meta.url), 'utf8');
  assert.match(present, /syncFullscreenLabel/);
  assert.match(present, /Exit fullscreen/);
  assert.match(present, /fullscreenchange/);
});

test('AET-107 Classroom overlay chrome ⛶ flips label and blurs after enter-FS', () => {
  const main = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
  const start = main.indexOf('function ClassroomOverlay');
  const end = main.indexOf('function Brand()');
  assert.ok(start >= 0 && end > start);
  const overlay = main.slice(start, end);
  assert.match(overlay, /classroom-overlay-fullscreen/);
  assert.match(overlay, /classroom\.enterFullscreen/);
  assert.match(overlay, /classroom\.exitFullscreen/);
  assert.match(overlay, /fullscreenchange/);
  assert.match(overlay, /event\.currentTarget\.blur\(\)/);
  assert.match(overlay, /frameRef\.current\?\.focus/);
});
