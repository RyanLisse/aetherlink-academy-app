#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PINNED_REVISION = 'ce8f9f186058939da54c9d6fead78dfb5d0fd6c3';
const UPSTREAM_URL = 'https://github.com/shareAI-lab/learn-claude-code';
const LICENSE_URL = `${UPSTREAM_URL}/blob/${PINNED_REVISION}/LICENSE`;
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');
const CONTENT_DIR = path.join(REPO_ROOT, 'content/learn-claude-code');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public/learn-claude-code');
const OUTPUT_FILES = path.join(PUBLIC_DIR, 'files');

function git(source, ...args) {
  return execFileSync('git', ['-C', source, ...args], { encoding: 'utf8' }).trim();
}

function isEnglishPath(relativePath) {
  const normalized = relativePath.replaceAll(path.sep, '/');
  if (normalized.startsWith('docs/ja/') || normalized.startsWith('docs/zh/')) return false;
  if (/(^|\/)(README|[^/]+)\.(ja|zh)\.md$/i.test(normalized)) return false;
  if (/(^|\/)[^/]+\.(ja|zh)\.svg$/i.test(normalized)) return false;

  return normalized === 'README.md'
    || normalized === 'CONTRIBUTING.md'
    || normalized === 'LICENSE'
    || normalized === '.env.example'
    || normalized === 'requirements.txt'
    || normalized === 'web/README.md'
    || normalized.startsWith('agents/')
    || normalized.startsWith('docs/en/')
    || normalized.startsWith('skills/')
    || /^s\d{2}_[^/]+\//.test(normalized)
    || normalized.startsWith('web/src/data/')
    || normalized === 'web/src/i18n/messages/en.json'
    || normalized.startsWith('web/public/course-assets/');
}

function sourceUrl(relativePath) {
  return `${UPSTREAM_URL}/blob/${PINNED_REVISION}/${relativePath.split(path.sep).join('/')}`;
}

function publicUrl(relativePath) {
  return `/learn-claude-code/files/${relativePath.split(path.sep).join('/')}`;
}

function titleFromMarkdown(markdown, fallback) {
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return heading ? heading.replace(/^s\d{2}:\s*/i, '') : fallback;
}

function codeEntry(relativePath, label, language = 'python') {
  return { label, url: publicUrl(relativePath), language };
}

function chapterEntry({ id, title, kind, markdownPath, codePaths = [] }) {
  return {
    id,
    title,
    kind,
    path: markdownPath,
    markdownUrl: publicUrl(markdownPath),
    sourceUrl: sourceUrl(markdownPath),
    code: codePaths.map(({ path: codePath, label }) => codeEntry(codePath, label)),
  };
}

async function main() {
  const sourceArg = process.argv[2] ?? '../learn-claude-code-content';
  const source = path.resolve(REPO_ROOT, sourceArg);
  const sourceStat = await stat(source).catch(() => null);
  if (!sourceStat?.isDirectory()) {
    throw new Error(`Upstream checkout not found: ${source}\nPass the pinned local checkout path as the first argument.`);
  }

  const revision = git(source, 'rev-parse', 'HEAD');
  if (revision !== PINNED_REVISION) {
    throw new Error(`Expected upstream ${PINNED_REVISION}, found ${revision}`);
  }
  const dirty = git(source, 'status', '--porcelain');
  if (dirty) throw new Error('Upstream checkout has local changes; sync requires a clean pinned checkout.');

  const tracked = git(source, 'ls-tree', '-r', '--name-only', 'HEAD').split('\n').filter(Boolean);
  const imported = tracked.filter(isEnglishPath);
  if (!imported.includes('LICENSE')) throw new Error('Pinned upstream LICENSE is missing.');

  await rm(OUTPUT_FILES, { recursive: true, force: true });
  await mkdir(OUTPUT_FILES, { recursive: true });
  const files = [];
  for (const relativePath of imported) {
    const normalized = relativePath.split('/').join(path.sep);
    const from = path.join(source, normalized);
    const to = path.join(OUTPUT_FILES, normalized);
    await mkdir(path.dirname(to), { recursive: true });
    await cp(from, to);
    const bytes = await readFile(to);
    files.push({
      path: relativePath,
      url: publicUrl(relativePath),
      bytes: bytes.byteLength,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      sourceUrl: sourceUrl(relativePath),
    });
  }

  const chapters = [];
  const canonicalDirs = [...new Set(imported
    .map((p) => p.split('/')[0])
    .filter((p) => /^s\d{2}_[^/]+$/.test(p)))].sort();
  for (const folder of canonicalDirs) {
    const markdownPath = `${folder}/README.md`;
    const sourceMarkdown = await readFile(path.join(source, markdownPath), 'utf8');
    const match = folder.match(/^(s\d{2})_/);
    if (!match) continue;
    const codePaths = [`${folder}/code.py`, ...imported.filter((p) => p.startsWith(`${folder}/example/`) && p.endsWith('.py'))]
      .filter((p) => imported.includes(p))
      .map((p) => ({ path: p, label: p.endsWith('/code.py') ? 'Chapter example' : path.basename(p) }));
    chapters.push(chapterEntry({
      id: match[1],
      title: titleFromMarkdown(sourceMarkdown, folder),
      kind: 'chapter',
      markdownPath,
      codePaths,
    }));
  }

  const legacyDocs = imported.filter((p) => p.startsWith('docs/en/') && p.endsWith('.md')).sort();
  for (const markdownPath of legacyDocs) {
    const filename = path.basename(markdownPath, '.md');
    const number = filename.match(/^(s\d{2})-/)?.[1];
    if (!number) throw new Error(`Legacy document does not have an sNN id: ${markdownPath}`);
    const codePath = imported.find((p) => p.startsWith(`agents/${number}_`) && p.endsWith('.py'));
    const sourceMarkdown = await readFile(path.join(source, markdownPath), 'utf8');
    chapters.push(chapterEntry({
      id: `legacy-${number}`,
      title: titleFromMarkdown(sourceMarkdown, filename),
      kind: 'archive',
      markdownPath,
      codePaths: codePath ? [{ path: codePath, label: 'Legacy chapter example' }] : [],
    }));
  }

  const referencePaths = [
    'README.md',
    'CONTRIBUTING.md',
    'web/README.md',
    ...imported.filter((p) => p.startsWith('skills/') && p.endsWith('.md')),
  ];
  for (const markdownPath of referencePaths) {
    if (!imported.includes(markdownPath)) continue;
    const md = await readFile(path.join(source, markdownPath), 'utf8');
    const basename = path.basename(markdownPath).toLowerCase();
    const id = markdownPath === 'README.md'
      ? 'reference-project-readme'
      : markdownPath === 'CONTRIBUTING.md'
        ? 'reference-contributing'
        : markdownPath === 'web/README.md'
          ? 'reference-web-setup'
          : `reference-${markdownPath.toLowerCase().replace(/\.md$/, '').replace(/[^a-z0-9]+/g, '-')}`;
    chapters.push(chapterEntry({
      id,
      title: markdownPath === 'web/README.md'
        ? 'Web course setup guide'
        : titleFromMarkdown(md, basename.replace(/\.md$/, '')),
      kind: 'reference',
      markdownPath,
    }));
  }
  chapters.sort((a, b) => {
    const rank = { chapter: 0, archive: 1, reference: 2 };
    return rank[a.kind] - rank[b.kind] || a.id.localeCompare(b.id);
  });

  const chapterMarkdownPaths = new Set(chapters.map((chapter) => chapter.path));
  const resources = imported
    .filter((p) => !chapterMarkdownPaths.has(p))
    .map((p) => ({
      path: p,
      // Static-file servers commonly hide dotfiles, so link this original to its pinned source.
      url: p.startsWith('.') ? sourceUrl(p) : publicUrl(p),
      label: p,
    }));

  const catalog = {
    title: 'Learn Claude Code',
    revision: PINNED_REVISION,
    sourceUrl: `${UPSTREAM_URL}/tree/${PINNED_REVISION}`,
    licenseUrl: LICENSE_URL,
    licenseFileUrl: publicUrl('LICENSE'),
    sourceFilesManifestUrl: '/learn-claude-code/manifest.json',
    filePaths: imported,
    chapters,
    resources,
  };
  const manifest = {
    title: 'Learn Claude Code English content import',
    source: UPSTREAM_URL,
    revision: PINNED_REVISION,
    license: 'MIT',
    licenseUrl: LICENSE_URL,
    selection: 'English educational content, examples, diagrams, skills, and web course data; translated ja/zh files and application implementation are excluded.',
    counts: {
      canonicalChapters: chapters.filter((c) => c.kind === 'chapter').length,
      archivedEnglishChapters: chapters.filter((c) => c.kind === 'archive').length,
      referenceDocuments: chapters.filter((c) => c.kind === 'reference').length,
      importedFiles: files.length,
    },
    files,
  };
  await mkdir(CONTENT_DIR, { recursive: true });
  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(path.join(CONTENT_DIR, 'catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`);
  await writeFile(path.join(CONTENT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(path.join(PUBLIC_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(path.join(CONTENT_DIR, 'README.md'), [
    '# Learn Claude Code source import',
    '',
    `This directory is generated from [${UPSTREAM_URL}](${UPSTREAM_URL}) at commit \`${PINNED_REVISION}\`.`,
    '',
    'Run `node scripts/sync-learn-claude-code.mjs ../learn-claude-code-content` from the academy repository root to refresh it offline from a clean checkout at the pinned revision.',
    '',
    'The exact MIT license is copied to `/learn-claude-code/files/LICENSE`. `manifest.json` records every imported upstream path, byte size, and SHA-256 digest; a public copy is served at `/learn-claude-code/manifest.json`. English educational text, Python examples, diagrams, skills, setup files, and the upstream web course data are retained. Translated Japanese and Chinese files and web application code are excluded.',
    '',
    'The upstream root README includes a Mermaid diagram with HTML labels and a remotely hosted badge. Those source sections are preserved unchanged; a standard safe Markdown renderer may show the Mermaid source or omit inline HTML instead of reproducing the upstream rendering. Language-switch links in the originals still name the excluded Japanese and Chinese files. The web course annotations, generated documents, execution-flow data, scenarios, and SVG assets are included. Its interactive simulator, visualizations, and application behavior are not content files and are not imported.',
    '',
  ].join('\n'));
  console.log(`Imported ${files.length} files: ${manifest.counts.canonicalChapters} current chapters, ${manifest.counts.archivedEnglishChapters} archived English chapters, ${manifest.counts.referenceDocuments} references.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
