#!/usr/bin/env node
import path from 'node:path';
import {DraftLedger, importSlidesJs} from '../src/importers/index.ts';

const args = process.argv.slice(2).filter((a) => a !== '--');
const dryRun = args.includes('--dry-run');
const filtered = args.filter((a) => a !== '--dry-run');
const courseIdx = filtered.indexOf('--course');
const courseId = courseIdx >= 0 ? filtered[courseIdx + 1] : undefined;
const positional = filtered.filter((_, i) => i !== courseIdx && i !== courseIdx + 1);
const [source, sourcePath] = positional;

const usage = 'usage: pnpm --filter @academy/server import <slides-js> <path> --course <id> [--dry-run]';
if (!source || !sourcePath || !courseId) {
  console.error(usage);
  process.exit(2);
}

if (source !== 'slides-js') {
  console.error(`unsupported source '${source}' in this slice (supported: slides-js)`);
  process.exit(2);
}

const imported = importSlidesJs(path.resolve(sourcePath));
const summary = {
  source,
  courseId,
  path: imported.sourcePath,
  count: imported.slides.length,
  titles: imported.titles,
  contentHash: imported.contentHash,
};

if (dryRun) {
  console.log(JSON.stringify({...summary, mode: 'dry-run', note: 'no draft written'}, null, 2));
  process.exit(0);
}

const ledger = new DraftLedger();
const first = ledger.writeDraft(courseId, imported.slides);
const second = ledger.writeDraft(courseId, imported.slides);
console.log(JSON.stringify({
  ...summary,
  mode: 'write-draft',
  first,
  second,
  drafts: ledger.list(courseId),
  note: 'in-process ledger only; never publishes. Reimport is idempotent on content hash.',
}, null, 2));
