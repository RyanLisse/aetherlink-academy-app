import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const slides = readFileSync(join(root, 'src/slides.jsx'), 'utf8');
const css = readFileSync(join(root, 'src/style.css'), 'utf8');
const en = JSON.parse(readFileSync(join(root, 'src/i18n/en.json'), 'utf8'));
const nl = JSON.parse(readFileSync(join(root, 'src/i18n/nl.json'), 'utf8'));
const pkgEn = readFileSync(join(root, 'packages/i18n/src/en.json'), 'utf8');
const pkgNl = readFileSync(join(root, 'packages/i18n/src/nl.json'), 'utf8');

test('F1 hierarchy trail labels current position', () => {
  assert.match(slides, /deck-trail/);
  assert.match(slides, /decks\.trailAria/);
  assert.match(slides, /decks\.trailRoot/);
  assert.match(slides, /decks\.position/);
  assert.match(slides, /decks\.youAreHere/);
  assert.match(slides, /deck-structure/);
  assert.match(css, /\.deck-trail/);
  assert.match(css, /\.deck-structure/);
});

test('F2 create + reorder siblings persist via deck APIs', () => {
  assert.match(slides, /api\(`decks\/\$\{deckId\}\/slides`/);
  assert.match(slides, /op:'reorder-slides'/);
  assert.match(slides, /op:'patch-deck-fields'/);
  assert.match(slides, /decks\.addSlide/);
  assert.match(slides, /decks\.moveUp/);
  assert.match(slides, /decks\.moveDown/);
  assert.match(slides, /decks\.rename/);
});

test('F3 preview opens present view without leaving editor', () => {
  assert.match(slides, /deck-preview-overlay/);
  assert.match(slides, /setPreview\(true\)/);
  assert.match(slides, /\/game\/decks\/\$\{deckId\}\/present/);
  assert.match(slides, /decks\.previewClose/);
  assert.match(css, /\.deck-preview-overlay/);
});

test('F4/F7 Effect SoT gate — no BuilderIO / LearnHouse / LMS catalog', () => {
  assert.doesNotMatch(slides, /builder\.io|BuilderIO|learnhouse|LearnHouse/i);
  assert.doesNotMatch(slides, /templates\/slides/);
  assert.doesNotMatch(slides, /course.?catalog|stripe.?cart|seo.?landing/i);
  assert.match(slides, /api\('decks'/);
  assert.match(slides, /api\(`decks\/\$\{deckId\}`/);
});

test('F5 pin / overlay chrome still present', () => {
  assert.match(slides, /classroom-overlay/);
  assert.match(slides, /decks\.pinOverlay/);
  assert.match(slides, /decks\.unpinOverlay/);
  assert.match(slides, /classroomOverlayDeckId/);
});

test('F6 empty + load-failure use StatusState with next action', () => {
  assert.match(slides, /StatusState kind="empty"/);
  assert.match(slides, /StatusState kind="error"/);
  assert.match(slides, /decks\.emptyHelp/);
  assert.match(slides, /decks\.loadFailed/);
  assert.match(slides, /decks\.noSlidesHelp/);
  assert.match(slides, /status\.retry/);
});

test('AET-109 i18n keys present EN+NL and package parity', () => {
  const keys = [
    'decks.emptyHelp',
    'decks.loadFailed',
    'decks.loadFailedHelp',
    'decks.trailAria',
    'decks.trailRoot',
    'decks.position',
    'decks.noSlidesShort',
    'decks.noSlidesHelp',
    'decks.structure',
    'decks.youAreHere',
    'decks.rename',
    'decks.renameLabel',
    'decks.renameSave',
    'decks.renameCancel',
    'decks.preview',
    'decks.previewTitle',
    'decks.previewHint',
    'decks.previewClose',
    'decks.presentFullscreen',
  ];
  for (const key of keys) {
    assert.ok(en[key], `missing EN ${key}`);
    assert.ok(nl[key], `missing NL ${key}`);
  }
  assert.match(en['decks.preview'], /Preview/i);
  assert.match(nl['decks.preview'], /Voorbeeld/i);
  assert.equal(pkgEn, readFileSync(join(root, 'src/i18n/en.json'), 'utf8'));
  assert.equal(pkgNl, readFileSync(join(root, 'src/i18n/nl.json'), 'utf8'));
});
