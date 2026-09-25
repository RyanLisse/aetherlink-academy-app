#!/usr/bin/env node
import {execFileSync} from 'node:child_process';
import {mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {importTrainingSiteArchive} from '../src/importers/index.ts';

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
console.log(JSON.stringify({out, courseVersion: archive.courseVersion, slideCount: archive.slideCount, decks: archive.decks.map((deck) => `s${deck.squad}d${deck.day}:${deck.slides.length}`)}));
