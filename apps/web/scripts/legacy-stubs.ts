#!/usr/bin/env node
import {mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {legacyStubHtml, type LegacySite} from '../src/redirects/legacy.ts';

/** Every file a visitor could have bookmarked on each old site; each becomes a copy of that site's stub. */
const STUB_FILES: Record<LegacySite, ReadonlyArray<string>> = {
  'training-site': ['index.html', 'glossary.html'],
  'classroom-slides': ['index.html', 'presenter.html'],
};

const [outDir, origin = 'https://academy.aetherlink.ai'] = process.argv.slice(2).filter((arg) => arg !== '--');
if (!outDir) {
  console.error('usage: node --experimental-strip-types apps/web/scripts/legacy-stubs.ts <out-dir> [academy-origin]');
  process.exit(2);
}
for (const [site, files] of Object.entries(STUB_FILES) as Array<[LegacySite, ReadonlyArray<string>]>) {
  mkdirSync(path.join(outDir, site), {recursive: true});
  for (const file of files) writeFileSync(path.join(outDir, site, file), legacyStubHtml(site, origin));
  console.log(`${site}: ${files.map((file) => path.join(outDir, site, file)).join(', ')}`);
}
