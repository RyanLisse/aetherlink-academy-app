#!/usr/bin/env node
import path from 'node:path';
import {
  DraftLedger,
  importContentMjs,
  importCurriculumMd,
  importDayDecksJson,
  importSlidesJs,
  writeSlidesDraft,
  type DraftWriteResult,
} from '../src/importers/index.ts';

const args = process.argv.slice(2).filter((a) => a !== '--');
const dryRun = args.includes('--dry-run');
const usePostgres = args.includes('--postgres');
const filtered = args.filter((a) => a !== '--dry-run' && a !== '--postgres');
const courseIdx = filtered.indexOf('--course');
const courseId = courseIdx >= 0 ? filtered[courseIdx + 1] : undefined;
const dayIdx = filtered.indexOf('--day');
const dayOpt = dayIdx >= 0 ? filtered[dayIdx + 1] : undefined;
const positional = filtered.filter((_, i) => i !== courseIdx && i !== courseIdx + 1 && i !== dayIdx && i !== dayIdx + 1);
const [source, sourcePath] = positional;

const usage = 'usage: pnpm --filter @academy/server import-content -- <slides-js|curriculum-md|day-decks-json|content-mjs> <path> --course <id> [--day N] [--dry-run] [--postgres]';
if (!source || !sourcePath || !courseId) {
  console.error(usage);
  process.exit(2);
}

const resolved = path.resolve(sourcePath);

const load = async () => {
  switch (source) {
    case 'slides-js':
      return importSlidesJs(resolved);
    case 'curriculum-md':
      return importCurriculumMd(resolved);
    case 'day-decks-json': {
      const day = dayOpt ? (dayOpt.startsWith('day') ? dayOpt : `day${dayOpt}`) : undefined;
      return importDayDecksJson(resolved, day ? {day} : {});
    }
    case 'content-mjs': {
      const day = dayOpt ? Number(dayOpt) : undefined;
      return importContentMjs(resolved, day !== undefined && !Number.isNaN(day) ? {day} : {});
    }
    default:
      console.error(`unsupported source '${source}' (supported: slides-js, curriculum-md, day-decks-json, content-mjs)`);
      process.exit(2);
  }
};

const imported = await load();
const summary = {
  source,
  courseId,
  path: imported.sourcePath,
  count: imported.slides.length,
  titles: imported.titles.slice(0, 12),
  titleCount: imported.titles.length,
  contentHash: imported.contentHash,
};

if (dryRun) {
  console.log(JSON.stringify({...summary, mode: 'dry-run', note: 'no draft written'}, null, 2));
  process.exit(0);
}

let first: DraftWriteResult;
let second: DraftWriteResult;
let backend: string;

if (usePostgres || process.env.DATABASE_URL) {
  const {NodeFileSystem, NodePath} = await import('@effect/platform-node');
  const {PgClient} = await import('@effect/sql-pg');
  const {Effect, Layer, Redacted} = await import('effect');
  const {CurriculumRepoLive} = await import('../src/db/curriculum-repo.ts');
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('--postgres requires DATABASE_URL');
    process.exit(2);
  }
  const pgLayer = PgClient.layer({url: Redacted.make(url), maxConnections: 4, minConnections: 0, connectTimeout: '5 seconds'});
  const repoLayer = CurriculumRepoLive.pipe(Layer.provide(pgLayer));
  const platform = Layer.mergeAll(NodeFileSystem.layer, NodePath.layer);
  const full = Layer.mergeAll(pgLayer, repoLayer, platform);
  first = await Effect.runPromise(writeSlidesDraft(courseId, imported.slides).pipe(Effect.provide(full)));
  second = await Effect.runPromise(writeSlidesDraft(courseId, imported.slides).pipe(Effect.provide(full)));
  backend = 'postgres';
} else {
  const ledger = new DraftLedger();
  first = ledger.writeDraft(courseId, imported.slides);
  second = ledger.writeDraft(courseId, imported.slides);
  backend = 'in-process';
}

console.log(JSON.stringify({
  ...summary,
  mode: 'write-draft',
  backend,
  first,
  second,
  note: 'Draft only — never publishes. Reimport is idempotent on content hash.',
}, null, 2));
