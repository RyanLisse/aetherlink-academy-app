import {execFileSync} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import {createServer} from 'node:net';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const helpersDir = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(helpersDir, '../../../..');
export const verificationRoot = path.join(repoRoot, '.verification');
export const runsRoot = path.join(verificationRoot, 'runs');
export const evidenceRoot = path.join(verificationRoot, 'evidence');
export const currentPointer = path.join(verificationRoot, 'current-run');
export const composeFile = path.join(helpersDir, 'services.compose.yaml');

export const PORTS = Object.freeze({academy: 4731, proof: 4831, wave: 4732, postgres: 4733, redis: 4734});
export const RUN_ID = /^[a-z0-9]+-[a-f0-9]{6}$/;
export const DEPLOYED_ORIGIN = 'http://91.99.78.17:4317';

export function readCurrentRun() {
  if (!existsSync(currentPointer)) return null;
  const runId = readFileSync(currentPointer, 'utf8').trim();
  if (!RUN_ID.test(runId)) throw Error(`current-run pointer holds an invalid run id: ${runId}`);
  const manifestPath = path.join(runsRoot, runId, 'run.json');
  if (!existsSync(manifestPath)) throw Error(`manifest missing for run ${runId}: ${manifestPath}`);
  return JSON.parse(readFileSync(manifestPath, 'utf8'));
}

export function requireCurrentRun() {
  const run = readCurrentRun();
  if (!run) throw Error('No current verification run. Start one with helpers/start.mjs.');
  return run;
}

export async function portIsFree(port) {
  const probe = createServer();
  return new Promise((resolve) => {
    probe.once('error', () => resolve(false));
    probe.listen({host: '127.0.0.1', port}, () => probe.close(() => resolve(true)));
  });
}

export function listenerPids(port) {
  try {
    return execFileSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'], {encoding: 'utf8'}).split('\n').filter(Boolean).map(Number);
  } catch {
    return [];
  }
}

export function processGroupOf(pid) {
  try {
    return Number(execFileSync('ps', ['-o', 'pgid=', '-p', String(pid)], {encoding: 'utf8'}).trim());
  } catch {
    return null;
  }
}

export function groupAlive(pgid) {
  try {
    process.kill(-pgid, 0);
    return true;
  } catch (error) {
    if (error.code === 'ESRCH') return false;
    throw error;
  }
}

export function compose(run, args) {
  return execFileSync('docker', ['compose', '-p', run.project, '-f', composeFile, ...args], {
    encoding: 'utf8',
    env: {...process.env, VERIFY_PG_PORT: String(run.ports.postgres), VERIFY_REDIS_PORT: String(run.ports.redis), VERIFY_TLS_DIR: run.tlsDir},
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

export function projectContainers(project) {
  return execFileSync('docker', ['ps', '-a', '--filter', `label=com.docker.compose.project=${project}`, '--format', '{{.Names}} {{.State}}'], {encoding: 'utf8'})
    .split('\n')
    .filter(Boolean);
}

export async function fetchJson(url, timeoutMs = 3000) {
  const response = await fetch(url, {signal: AbortSignal.timeout(timeoutMs)});
  const body = await response.text();
  let json = null;
  try {
    json = JSON.parse(body);
  } catch {}
  return {status: response.status, json, body};
}

export function gitHead() {
  return execFileSync('git', ['-C', repoRoot, 'rev-parse', '--short', 'HEAD'], {encoding: 'utf8'}).trim();
}
