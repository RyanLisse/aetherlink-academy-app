import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const {normalizeContentLocale, projectPackLocale} = await import(
  pathToFileURL(join(root, 'content/days/locale.mjs')).href
);
const {DAY_PACKS} = await import(pathToFileURL(join(root, 'content/days/index.mjs')).href);
const {getDayPack} = await import(pathToFileURL(join(root, 'content/days/index.mjs')).href).catch(() => ({}));

function packFor(day) {
  return DAY_PACKS.find((p) => p.day === day);
}

test('122-1 content locale defaults to EN (fresh / unknown)', () => {
  assert.equal(normalizeContentLocale(undefined), 'en');
  assert.equal(normalizeContentLocale(null), 'en');
  assert.equal(normalizeContentLocale('fr'), 'en');
  assert.equal(normalizeContentLocale('en'), 'en');
  assert.equal(normalizeContentLocale('nl'), 'nl');
});

test('122-1 projectPackLocale default locale is EN', () => {
  const pack = packFor(4);
  assert.ok(pack);
  const projected = projectPackLocale(pack);
  assert.equal(projected.locale, 'en');
  assert.match(projected.title, /Workshop 4|Claude Agent SDK/i);
});

test('122-2 workshop day 4 ships one paired TS/Python identity', () => {
  const pack = packFor(4);
  assert.ok(pack?.codeExamples?.length >= 1, 'day 4 needs ≥1 codeExamples');
  const ex = pack.codeExamples[0];
  assert.equal(ex.id, 'w4-agent-sdk-mcp-options');
  assert.ok(ex.typescript && ex.python);
  assert.match(ex.typescript, /query\(\{\s*prompt,\s*options\s*\}\)/);
  assert.match(ex.python, /query\(prompt=prompt,\s*options=options\)/);
  assert.match(ex.typescript, /mcpServers[\s\S]*mcp__transactions__get_transaction/);
  assert.match(ex.python, /mcp_servers[\s\S]*mcp__transactions__get_transaction/);
  assert.equal(ex.slide?.slide, 23);
  assert.equal(ex.slide?.title, 'Lesson 3: look up transaction data through MCP.');
  assert.doesNotMatch(`${ex.typescript}\n${ex.python}`, /\b(?:LOW|MEDIUM|HIGH)\b/);
});

test('122-2 PairedCodeExample + Copy wire present in UI', () => {
  const exercises = readFileSync(join(root, 'src/exercises.jsx'), 'utf8');
  assert.match(exercises, /export function PairedCodeExample/);
  assert.match(exercises, /data-testid=\"code-copy\"/);
  assert.match(exercises, /navigator\.clipboard\.writeText\(code\)/);
  const panels = readFileSync(join(root, 'src/panels.jsx'), 'utf8');
  assert.match(panels, /PairedCodeExample/);
  assert.match(panels, /lesson-code-examples/);
  assert.match(panels, /pack\.codeExamples/);
});

test('122-3 no whole-lesson body duplication per programming language', () => {
  const pack = packFor(4);
  const projected = projectPackLocale(pack, 'en');
  // One lesson body; codeExamples are variants under one identity, not duplicated narratives
  assert.equal(projected.lesson.narrative?.length, pack.copy.en.narrative.length);
  assert.ok(projected.codeExamples.length >= 1);
  assert.equal(projected.codeExamples[0].id, 'w4-agent-sdk-mcp-options');
});

test('122-4 nl projection still differs from EN (no silent EN leak on content)', () => {
  const pack = packFor(4);
  const en = projectPackLocale(pack, 'en');
  const nl = projectPackLocale(pack, 'nl');
  assert.equal(en.locale, 'en');
  assert.equal(nl.locale, 'nl');
  assert.notEqual(JSON.stringify(en.lesson.narrative), JSON.stringify(nl.lesson.narrative));
  // codeExamples stay language-neutral (same identity under both UI locales)
  assert.deepEqual(en.codeExamples, nl.codeExamples);
});

test('122-4 paired-code chrome keys exist in EN and NL', () => {
  const en = JSON.parse(readFileSync(join(root, 'src/i18n/en.json'), 'utf8'));
  const nl = JSON.parse(readFileSync(join(root, 'src/i18n/nl.json'), 'utf8'));
  for (const key of [
    'code.aria',
    'code.title',
    'code.displayOnly',
    'code.langGroup',
    'code.lang.typescript',
    'code.lang.python',
    'code.copy',
    'code.copied',
  ]) {
    assert.ok(en[key], `missing en ${key}`);
    assert.ok(nl[key], `missing nl ${key}`);
  }
  assert.notEqual(en['code.copy'], nl['code.copy']);
  assert.notEqual(en['code.displayOnly'], nl['code.displayOnly']);
});

test('122-5 no auto-migrate hooks for saved decks', () => {
  const localeSrc = readFileSync(join(root, 'content/days/locale.mjs'), 'utf8');
  assert.doesNotMatch(localeSrc, /auto-?migrat|auto-?translat|bulk.*nl.*en/i);
  const app = readFileSync(join(root, 'server/app.mjs'), 'utf8');
  assert.doesNotMatch(app, /auto-?migrat|auto-?translat.*deck/i);
});
