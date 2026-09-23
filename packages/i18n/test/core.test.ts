import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, expect, test} from 'vitest';
import {
  DEFAULT_LOCALE,
  STORAGE_KEY,
  applyDocumentLang,
  createTranslate,
  catalogs,
  normalizeLocale,
  readStoredLocale,
  translate,
  writeStoredLocale,
} from '../src/index.ts';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');

describe('@academy/i18n core (ported i18n.test scenarios)', () => {
  test('default locale is English', () => {
    expect(DEFAULT_LOCALE).toBe('en');
    expect(normalizeLocale(undefined)).toBe('en');
    expect(normalizeLocale('fr')).toBe('en');
    expect(normalizeLocale('nl')).toBe('nl');
  });

  test('cleared storage resolves to English', () => {
    expect(readStoredLocale({getItem: () => null})).toBe('en');
  });

  test('preference persists across read/write', () => {
    const map = new Map<string, string>();
    const storage = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => { map.set(k, v); },
    };
    writeStoredLocale('nl', storage);
    expect(map.get(STORAGE_KEY)).toBe('nl');
    expect(readStoredLocale(storage)).toBe('nl');
  });

  test('NL chrome differs from EN', () => {
    expect(translate('en', 'nav.route')).toBe('My route');
    expect(translate('nl', 'nav.route')).toBe('Mijn route');
  });

  test('missing keys fall back to English then key', () => {
    const ghost = 'definitely.missing.key.xyz';
    expect(translate('nl', ghost)).toBe(ghost);
    const t2 = createTranslate({en: {hello: 'Hello'}, nl: {hello: ''}});
    expect(t2('nl', 'hello')).toBe('Hello');
  });

  test('interpolation works', () => {
    expect(translate('en', 'room.supportDay', {day: 3})).toBe('Support day 3');
    expect(translate('nl', 'room.supportDay', {day: 3})).toBe('Supportdag 3');
  });

  test('html lang follows locale', () => {
    const doc = {documentElement: {lang: 'xx'}} as unknown as Document;
    expect(applyDocumentLang('nl', doc)).toBe('nl');
    expect(doc.documentElement.lang).toBe('nl');
  });

  test('EN and NL catalogs share the same key set', () => {
    expect(Object.keys(catalogs.en).sort()).toEqual(Object.keys(catalogs.nl).sort());
    expect(Object.keys(catalogs.en).length).toBeGreaterThan(100);
  });

  test('i18n modules do not sniff browser locale', () => {
    const core = readFileSync(join(here, '..', 'src', 'index.ts'), 'utf8');
    expect(/navigator\.language/.test(core)).toBe(false);
    expect(core).toMatch(/DEFAULT_LOCALE/);
    expect(core).toMatch(/STORAGE_KEY/);
  });
});
