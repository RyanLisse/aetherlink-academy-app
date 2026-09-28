import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const publicRoot = path.join(repoRoot, 'public/learn-claude-code');
const catalog = JSON.parse(await readFile(path.join(repoRoot, 'content/learn-claude-code/catalog.json'), 'utf8'));
const manifest = JSON.parse(await readFile(path.join(repoRoot, 'content/learn-claude-code/manifest.json'), 'utf8'));

async function exists(file) {
  return stat(file).then(() => true, () => false);
}

test('catalog covers current, archived, and reference English content', () => {
  assert.equal(catalog.revision, 'ce8f9f186058939da54c9d6fead78dfb5d0fd6c3');
  assert.equal(catalog.chapters.filter((entry) => entry.kind === 'chapter').length, 17);
  assert.equal(catalog.chapters.filter((entry) => entry.kind === 'archive').length, 12);
  assert.equal(catalog.chapters.filter((entry) => entry.kind === 'reference').length, 8);
  assert.equal(new Set(catalog.chapters.map((entry) => entry.id)).size, catalog.chapters.length);
  assert.equal(catalog.filePaths.length, 214);
  assert.deepEqual(
    catalog.chapters.filter((entry) => entry.kind === 'chapter').map((entry) => entry.id),
    Array.from({ length: 17 }, (_, index) => `s${String(index + 1).padStart(2, '0')}`),
  );
  assert.deepEqual(
    catalog.chapters.filter((entry) => entry.kind === 'archive').map((entry) => entry.id),
    Array.from({ length: 12 }, (_, index) => `legacy-s${String(index + 1).padStart(2, '0')}`),
  );
  assert.ok(catalog.chapters.every((entry) => entry.path && entry.markdownUrl && entry.sourceUrl));
});

test('every catalog chapter, code sample, and resource resolves to an imported original', async () => {
  const urls = [
    ...catalog.chapters.map((entry) => entry.markdownUrl),
    ...catalog.chapters.flatMap((entry) => entry.code.map((code) => code.url)),
    catalog.licenseFileUrl,
  ];
  for (const url of urls) {
    assert.ok(url.startsWith('/learn-claude-code/files/'), `unexpected imported URL: ${url}`);
    assert.ok(await exists(path.join(publicRoot, url.slice('/learn-claude-code/'.length))), `missing imported file: ${url}`);
  }
  for (const resource of catalog.resources) {
    if (resource.url.startsWith('/learn-claude-code/files/')) {
      assert.ok(await exists(path.join(publicRoot, resource.url.slice('/learn-claude-code/'.length))), `missing resource: ${resource.url}`);
    } else {
      assert.equal(resource.url, manifest.files.find((file) => file.path === resource.path)?.sourceUrl, `unexpected external resource: ${resource.path}`);
    }
  }
  for (const entry of catalog.chapters) {
    assert.ok(entry.code.length > 0 || entry.kind === 'reference', `${entry.id} has no downloadable code example`);
  }
});

test('source manifest accounts for every imported file and verifies byte-for-byte hashes', async () => {
  assert.equal(manifest.revision, catalog.revision);
  assert.equal(manifest.license, 'MIT');
  assert.equal(manifest.counts.importedFiles, manifest.files.length);
  assert.equal(new Set(manifest.files.map((file) => file.path)).size, manifest.files.length);
  assert.equal(manifest.files.filter((file) => /^s\d{2}_[^/]+\//.test(file.path)).length, 85);
  assert.equal(manifest.files.filter((file) => file.path.startsWith('docs/en/')).length, 12);
  assert.equal(manifest.files.filter((file) => file.path.startsWith('agents/')).length, 14);
  assert.equal(manifest.files.filter((file) => file.path.startsWith('skills/')).length, 9);
  assert.equal(manifest.files.filter((file) => file.path.startsWith('web/')).length, 89);
  assert.ok(manifest.files.some((file) => file.path === 'skills/agent-builder/SKILL.md'));
  assert.ok(catalog.chapters.some((entry) => entry.path === 'skills/agent-builder/SKILL.md'));
  assert.ok(catalog.chapters.some((entry) => entry.path === 'skills/agent-builder/references/agent-philosophy.md'));
  assert.ok(catalog.filePaths.includes('.env.example'));
  assert.ok(catalog.filePaths.includes('requirements.txt'));
  assert.equal(catalog.filePaths.length, manifest.files.length);
  assert.ok(manifest.files.some((file) => file.path === 'web/src/data/generated/docs.json'));
  assert.ok(manifest.files.some((file) => file.path === 'web/src/data/annotations/s17.json'));
  assert.ok(manifest.files.some((file) => file.path === 'web/src/data/scenarios/s17.json'));
  assert.ok(manifest.files.some((file) => file.path === 'web/public/course-assets/s17_goal_loop/goal-loop-overview.svg'));
  assert.ok(manifest.files.some((file) => file.path === 'agents/s_full.py'));
  for (const chapter of catalog.chapters.filter((entry) => entry.kind === 'chapter')) {
    const folder = chapter.path.split('/')[0];
    assert.ok(manifest.files.some((file) => file.path === `${folder}/README.md`));
    assert.ok(manifest.files.some((file) => file.path === `${folder}/code.py`));
  }

  for (const file of manifest.files) {
    assert.ok(!/(^|\/)(ja|zh)\//.test(file.path), `translated tree included: ${file.path}`);
    assert.ok(!/\.(ja|zh)\.(md|svg)$/i.test(file.path), `translated file included: ${file.path}`);
    const bytes = await readFile(path.join(publicRoot, file.url.slice('/learn-claude-code/'.length)));
    assert.equal(bytes.byteLength, file.bytes, `byte count changed: ${file.path}`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, `hash changed: ${file.path}`);
  }
});

test('original MIT license and provenance notes are present', async () => {
  const license = await readFile(path.join(publicRoot, 'files/LICENSE'), 'utf8');
  const provenance = await readFile(path.join(repoRoot, 'content/learn-claude-code/README.md'), 'utf8');
  assert.match(license, /MIT License/);
  assert.match(provenance, /ce8f9f186058939da54c9d6fead78dfb5d0fd6c3/);
  assert.match(provenance, /SHA-256/);
});

test('public source manifest is served from the URL referenced in the catalog', async () => {
  const publicManifest = JSON.parse(await readFile(path.join(publicRoot, 'manifest.json'), 'utf8'));
  assert.equal(publicManifest.revision, catalog.revision);
  assert.deepEqual(publicManifest.files, manifest.files);
});
