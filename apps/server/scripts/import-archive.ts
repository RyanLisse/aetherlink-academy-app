#!/usr/bin/env node
import {execFileSync} from 'node:child_process';
import {copyFileSync, mkdirSync, rmSync, statSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {ARCHIVE_IMAGE_BASE, importTrainingSiteArchive} from '../src/importers/index.ts';

const imageDir = path.resolve(import.meta.dirname, '../../web/public', `.${ARCHIVE_IMAGE_BASE}`);
const [checkout, out = path.resolve(import.meta.dirname, '../../../content/archive/training-site.json')] = process.argv.slice(2).filter((arg) => arg !== '--');
if (!checkout) {
  console.error('usage: pnpm --filter @academy/server import-archive -- <aetherlink-training-site checkout> [out.json]');
  process.exit(2);
}

const git = (...args: string[]) => execFileSync('git', ['-C', checkout, ...args], {encoding: 'utf8'}).trim();
if (git('status', '--porcelain', '--', 'dist')) {
  console.error(`${checkout} has uncommitted changes under dist/; provenance must name a commit`);
  process.exit(1);
}
const repo = git('remote', 'get-url', 'origin').replace(/^.*github\.com[:/]/, '').replace(/\.git$/, '');
const archive = importTrainingSiteArchive(checkout, {repo, commit: git('rev-parse', 'HEAD')});

mkdirSync(path.dirname(out), {recursive: true});
writeFileSync(out, `${JSON.stringify(archive, null, 1)}\n`);

const images = new Map<string, string>();
for (const {slide, source} of archive.decks.flatMap((deck) => deck.slides)) {
  if (slide.image && source.image) images.set(path.basename(slide.image), source.image);
}
rmSync(imageDir, {recursive: true, force: true});
mkdirSync(imageDir, {recursive: true});
for (const [served, source] of images) {
  const from = path.join(checkout, source);
  const to = path.join(imageDir, served);
  if (path.extname(served) === '.webp') execFileSync('cwebp', ['-quiet', '-q', '82', '-metadata', 'none', from, '-o', to]);
  else copyFileSync(from, to);
}
const imageBytes = [...images.keys()].reduce((sum, served) => sum + statSync(path.join(imageDir, served)).size, 0);

console.log(JSON.stringify({out, courseVersion: archive.courseVersion, slideCount: archive.slideCount, decks: archive.decks.map((deck) => `s${deck.squad}d${deck.day}:${deck.slides.length}`), imageDir, images: images.size, imageBytes}));
