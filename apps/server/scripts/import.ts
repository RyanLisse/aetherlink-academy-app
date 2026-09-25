#!/usr/bin/env node
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readNotionExport, type ImportLocale} from '../src/notion/export.ts';
import {spliceGuardrails} from '../src/notion/manual.ts';
import {importTargets} from '../src/notion/plan.ts';

const usage = `usage: pnpm --filter @academy/server import notion <export-dir> [--course <id>] [--dry-run] [--manual <path>] [--locale nl|en] [--allow-synthetic]

One-time import of an authorized Notion Markdown/CSV export. Never contacts Notion.
  --dry-run          print counts per target; writes nothing
  --course <id>      course to merge into; required with DATABASE_URL
  --manual <path>    facilitator manual to fill (default docs/handleiding-facilitator-v2.md)
  --locale nl|en     language of the exported text (default nl)
  --allow-synthetic  permit a real run of an export whose manifest says "synthetic": true

Examples:
  pnpm --filter @academy/server import notion ./export --dry-run
  DATABASE_URL=postgres://... pnpm --filter @academy/server import notion ./export --course <uuid>`;

const fail = (message: string): never => {
  console.error(`${message}\n\n${usage}`);
  process.exit(2);
};

const args = process.argv.slice(2).filter((arg) => arg !== '--');
const flag = (name: string) => args.includes(name);
const option = (name: string) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const valued = new Set(['--course', '--manual', '--locale']);
const positional = args.filter((arg, index) => !arg.startsWith('--') && !valued.has(args[index - 1] ?? ''));

if (flag('--help') || flag('-h')) {
  console.log(usage);
  process.exit(0);
}
const [command, exportDir] = positional;
if (command !== 'notion') fail(`unknown import source '${command ?? ''}' (supported: notion)`);
if (!exportDir) fail('missing <export-dir>');

const dryRun = flag('--dry-run');
const courseId = option('--course');
const locale = (option('--locale') ?? 'nl') as ImportLocale;
if (locale !== 'nl' && locale !== 'en') fail(`--locale must be nl or en, got '${locale}'`);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const manualPath = path.resolve(option('--manual') ?? path.join(repoRoot, 'docs/handleiding-facilitator-v2.md'));
const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl && !courseId) fail('--course is required when DATABASE_URL is set');
if (!dryRun && !databaseUrl) fail('a real run needs DATABASE_URL and --course; use --dry-run to preview without a database');

const notion = await readNotionExport(path.resolve(exportDir!), locale);
if (notion.synthetic && !dryRun && !flag('--allow-synthetic')) fail('refusing a real run of a synthetic export (manifest has "synthetic": true); pass --allow-synthetic only against a throwaway database');
if (notion.synthetic && !dryRun && !option('--manual')) fail('a synthetic export must not fill the real facilitator manual; pass --manual <scratch copy>');

const manual = spliceGuardrails(await readFile(manualPath, 'utf8'), notion.guardrails);
const guardrailItems = notion.guardrails.reduce((sum, page) => sum + page.items.length, 0);

const parsedOnly = {
  'day.schedule': notion.schedules.length,
  'day.checklist': notion.checklists.length,
  quiz_question: notion.quiz.length,
};

const report: Record<string, unknown> = {
  source: 'notion-export',
  exportDir: path.resolve(exportDir!),
  retrievedAt: notion.retrievedAt,
  synthetic: notion.synthetic,
  mode: dryRun ? 'dry-run' : 'write',
  ignoredFiles: notion.ignored,
  rejectedRows: notion.rejected.map(({source, reason}) => ({page: source.pageUrl, locator: source.locator, reason})),
  droppedLines: notion.dropped,
};

let databaseChanges = 0;
if (databaseUrl) {
  const {PgClient} = await import('@effect/sql-pg');
  const {Effect, Layer, Redacted} = await import('effect');
  const {CurriculumRepoLive} = await import('../src/db/curriculum-repo.ts');
  const {importNotionExport} = await import('../src/notion/repo.ts');
  const pgLayer = PgClient.layer({url: Redacted.make(databaseUrl), maxConnections: 4, minConnections: 0, connectTimeout: '5 seconds'});
  const layer = Layer.mergeAll(pgLayer, CurriculumRepoLive.pipe(Layer.provide(pgLayer)));
  const result = await Effect.runPromise(importNotionExport(courseId!, notion, {dryRun}).pipe(Effect.provide(layer)));
  databaseChanges = result.plan.changes;
  report.courseId = courseId;
  report.baseVersion = result.baseVersion;
  report.targets = Object.fromEntries(importTargets.map((target) => [target, result.plan.counts[target]]));
  report.skipped = result.plan.skipped.map(({target, source, reason}) => ({target, page: source.pageUrl, locator: source.locator, reason}));
  report.draft = result.written ?? (dryRun ? 'dry-run: nothing written' : 'no changes: nothing written');
} else {
  report.targets = parsedOnly;
  report.note = 'no DATABASE_URL: counts are parsed records, not planned changes';
}

if (!dryRun && manual.changed) await writeFile(manualPath, manual.text);
report.manual = {path: manualPath, guardrailPages: notion.guardrails.length, guardrailItems, changed: manual.changed};
report.changes = databaseChanges + (manual.changed ? 1 : 0);

console.log(JSON.stringify(report, null, 2));
