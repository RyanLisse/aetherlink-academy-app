#!/usr/bin/env node
import {copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync} from 'node:fs';
import path from 'node:path';
import {RUN_ID, compose, currentPointer, groupAlive, portIsFree, projectContainers, readCurrentRun, runsRoot} from './lib.mjs';

const [flag, value] = process.argv.slice(2);
let run;
if (flag === '--run') {
  if (!RUN_ID.test(value ?? '')) throw Error('Usage: cleanup.mjs [--run <run-id>]');
  run = JSON.parse(readFileSync(path.join(runsRoot, value, 'run.json'), 'utf8'));
} else {
  run = readCurrentRun();
}
if (!run) {
  const stranded = existsSync(runsRoot) ? readdirSync(runsRoot).filter((id) => RUN_ID.test(id)) : [];
  console.log(stranded.length ? `No current run. Stranded run dirs: ${stranded.join(', ')} (clean with --run <id>).` : 'No current run; nothing to clean.');
  process.exit(0);
}

for (const [name, pgid] of Object.entries(run.pids ?? {})) {
  if (!groupAlive(pgid)) continue;
  process.kill(-pgid, 'SIGTERM');
  for (let i = 0; i < 60 && groupAlive(pgid); i++) await new Promise((resolve) => setTimeout(resolve, 500));
  if (groupAlive(pgid)) process.kill(-pgid, 'SIGKILL');
  console.log(`stopped ${name} process group ${pgid}`);
}

try {
  compose(run, ['down', '--volumes', '--remove-orphans', '--timeout', '5']);
} catch (error) {
  console.error(`docker compose down failed for ${run.project}: ${String(error.stderr || error.message).trim()}`);
}

mkdirSync(path.join(run.evidenceDir, 'logs'), {recursive: true});
for (const [name, log] of Object.entries(run.logs ?? {})) {
  if (existsSync(log)) copyFileSync(log, path.join(run.evidenceDir, 'logs', `${name}.log`));
}
copyFileSync(path.join(run.runDir, 'run.json'), path.join(run.evidenceDir, 'run.json'));

if (path.dirname(run.runDir) !== runsRoot || path.basename(run.runDir) !== run.runId) throw Error(`refusing to remove unexpected path ${run.runDir}`);
rmSync(run.runDir, {recursive: true, force: true});
if (existsSync(currentPointer) && readFileSync(currentPointer, 'utf8').trim() === run.runId) rmSync(currentPointer);

const leftovers = [];
for (const [name, port] of Object.entries(run.ports)) if (!(await portIsFree(port))) leftovers.push(`port ${name}:${port} still bound`);
const containers = projectContainers(run.project);
if (containers.length) leftovers.push(`containers remain: ${containers.join('; ')}`);
if (!existsSync(run.evidenceDir)) leftovers.push('evidence dir missing');

console.log(`evidence kept: ${run.evidenceDir} (${readdirSync(run.evidenceDir).join(', ')})`);
console.log(leftovers.length ? `CLEANUP INCOMPLETE: ${leftovers.join(' | ')}` : `CLEANUP OK run=${run.runId}: ports free, ${run.project} removed, scratch deleted`);
process.exit(leftovers.length ? 1 : 0);
