import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {JSDOM} from 'jsdom';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const en = JSON.parse(readFileSync(join(root, 'src/i18n/en.json'), 'utf8'));
const nl = JSON.parse(readFileSync(join(root, 'src/i18n/nl.json'), 'utf8'));

const {
  DEFAULT_LOCALE,
  STORAGE_KEY,
  normalizeLocale,
  readStoredLocale,
  writeStoredLocale,
  createTranslate,
  applyDocumentLang,
} = await import(pathToFileURL(join(root, 'src/i18n/core.mjs')).href);

const translate = createTranslate({en, nl});

test('default locale is English', () => {
  assert.equal(DEFAULT_LOCALE, 'en');
  assert.equal(normalizeLocale(undefined), 'en');
  assert.equal(normalizeLocale('fr'), 'en');
  assert.equal(normalizeLocale('nl'), 'nl');
});

test('cleared storage resolves to English (no browser-locale force)', () => {
  const storage = {getItem() { return null; }, setItem() {}};
  assert.equal(readStoredLocale(storage), 'en');
});

test('preference persists across read/write', () => {
  const store = new Map();
  const storage = {
    getItem(k) { return store.has(k) ? store.get(k) : null; },
    setItem(k, v) { store.set(k, String(v)); },
  };
  writeStoredLocale('nl', storage);
  assert.equal(store.get(STORAGE_KEY), 'nl');
  assert.equal(readStoredLocale(storage), 'nl');
  writeStoredLocale('en', storage);
  assert.equal(readStoredLocale(storage), 'en');
});

test('toggle catalogs: NL chrome differs from EN', () => {
  assert.equal(translate('en', 'nav.route'), 'My route');
  assert.equal(translate('nl', 'nav.route'), 'Mijn route');
  assert.equal(translate('en', 'join.submitJoin'), 'Join');
  assert.equal(translate('nl', 'join.submitJoin'), 'Deelnemen');
});

test('missing keys fall back to English (never blank)', () => {
  const ghost = 'definitely.missing.key.xyz';
  assert.equal(translate('nl', ghost), ghost);
  assert.ok(translate('en', 'nav.squad').length > 0);
  assert.ok(translate('nl', 'nav.squad').length > 0);
  // Explicit EN fallback when NL blank
  const catalogs = {en: {hello: 'Hello'}, nl: {hello: ''}};
  const t2 = createTranslate(catalogs);
  assert.equal(t2('nl', 'hello'), 'Hello');
});

test('interpolation works', () => {
  assert.equal(translate('en', 'room.supportDay', {day: 3}), 'Day 3');
  assert.equal(translate('nl', 'room.supportDay', {day: 3}), 'Dag 3');
});

test('html lang follows locale', () => {
  const dom = new JSDOM('<!doctype html><html lang="xx"><head></head><body></body></html>');
  globalThis.document = dom.window.document;
  assert.equal(applyDocumentLang('nl'), 'nl');
  assert.equal(document.documentElement.lang, 'nl');
  assert.equal(applyDocumentLang('en'), 'en');
  assert.equal(document.documentElement.lang, 'en');
  delete globalThis.document;
});

test('EN and NL catalogs share the same key set', () => {
  assert.deepEqual(Object.keys(en).sort(), Object.keys(nl).sort());
  assert.ok(Object.keys(en).length > 100);
});

test('index.html defaults to lang=en', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  assert.match(html, /<html lang="en">/);
});

test('i18n modules do not force browser locale', () => {
  const core = readFileSync(join(root, 'src/i18n/core.mjs'), 'utf8');
  const jsx = readFileSync(join(root, 'src/i18n.jsx'), 'utf8');
  assert.equal(/navigator\.language/.test(core + jsx), false);
  assert.match(core, /DEFAULT_LOCALE = 'en'/);
  assert.match(core, /STORAGE_KEY = 'academy-locale'/);
});
