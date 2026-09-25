#!/usr/bin/env node
import {execFileSync, spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {closeSync, existsSync, mkdirSync, openSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {PORTS, compose, currentPointer, evidenceRoot, fetchJson, gitHead, portIsFree, readCurrentRun, repoRoot, runsRoot} from './lib.mjs';

const args = process.argv.slice(2);
const withWave = args.includes('--wave');
if (args.some((arg) => arg !== '--wave')) {
  console.error('Usage: start.mjs [--wave]');
  process.exit(2);
}

const existing = readCurrentRun();
if (existing) {
  console.error(`Run ${existing.runId} is still recorded. Run helpers/cleanup.mjs first.`);
  process.exit(1);
}

const builds = ['dist/index.html', 'apps/web/dist/index.html', 'vendor/proof-sdk/node_modules', ...(withWave ? ['apps/server/dist/main.js'] : [])];
const missing = builds.filter((rel) => !existsSync(path.join(repoRoot, rel)));
if (missing.length) {
  console.error(`Build output missing (${missing.join(', ')}). Run: node scripts/setup.mjs`);
  process.exit(1);
}

const wanted = ['academy', 'proof', 'postgres', 'redis', ...(withWave ? ['wave'] : [])];
const busy = [];
for (const name of wanted) if (!(await portIsFree(PORTS[name]))) busy.push(`${name}:${PORTS[name]}`);
if (busy.length) {
  console.error(`Refusing to start, verification ports in use: ${busy.join(', ')}. Another run or another stack owns them; do not kill it.`);
  process.exit(1);
}

const runId = `${Date.now().toString(36)}-${randomBytes(3).toString('hex')}`;
const runDir = path.join(runsRoot, runId);
const evidenceDir = path.join(evidenceRoot, runId);
const dataDir = path.join(runDir, 'academy-data');
const tlsDir = path.join(runDir, 'tls');
mkdirSync(dataDir, {recursive: true, mode: 0o700});
mkdirSync(tlsDir, {recursive: true, mode: 0o755});
mkdirSync(evidenceDir, {recursive: true, mode: 0o700});

const manifest = {
  runId,
  project: `academy-verify-${runId}`,
  revision: gitHead(),
  repoRoot,
  runDir,
  dataDir,
  tlsDir,
  evidenceDir,
  ports: {academy: PORTS.academy, proof: PORTS.proof, postgres: PORTS.postgres, redis: PORTS.redis, ...(withWave ? {wave: PORTS.wave} : {})},
  pids: {},
  logs: {academy: path.join(runDir, 'academy.log'), ...(withWave ? {wave: path.join(runDir, 'wave.log')} : {})},
  startedAt: new Date().toISOString(),
};
const save = () => writeFileSync(path.join(runDir, 'run.json'), `${JSON.stringify(manifest, null, 2)}\n`, {mode: 0o600});
save();
writeFileSync(currentPointer, `${runId}\n`, {mode: 0o600});

const fail = (message) => {
  console.error(`${message}\nRun ${runId} is recorded; run helpers/cleanup.mjs before retrying.`);
  process.exit(1);
};

try {
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-sha256', '-nodes', '-days', '2', '-subj', '/CN=localhost',
    '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1', '-keyout', path.join(tlsDir, 'server.key'), '-out', path.join(tlsDir, 'server.crt')], {stdio: 'ignore'});
  compose(manifest, ['up', '--detach', '--wait']);
} catch (error) {
  fail(`docker compose up failed: ${String(error.stderr || error.message).trim().split('\n').slice(-3).join(' | ')}`);
}

const databaseUrl = `postgresql://academy:verify-only-placeholder@127.0.0.1:${PORTS.postgres}/academy`;
const redisUrl = `rediss://127.0.0.1:${PORTS.redis}`;
const baseEnv = {PATH: process.env.PATH, HOME: process.env.HOME, TMPDIR: process.env.TMPDIR ?? '/tmp', LANG: process.env.LANG ?? 'en_US.UTF-8', NODE_EXTRA_CA_CERTS: path.join(tlsDir, 'server.crt')};

function launch(name, argv, env) {
  const fd = openSync(manifest.logs[name], 'a', 0o600);
  const child = spawn(process.execPath, argv, {cwd: repoRoot, detached: true, env: {...baseEnv, ...env}, stdio: ['ignore', fd, fd]});
  closeSync(fd);
  child.unref();
  manifest.pids[name] = child.pid;
  save();
}

async function waitFor(url, ready, seconds) {
  for (let i = 0; i < seconds * 2; i++) {
    try {
      if (ready(await fetchJson(url, 1500))) return true;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

launch('academy', ['scripts/start.mjs'], {
  ACADEMY_STORAGE: 'postgres',
  DATABASE_URL: databaseUrl,
  REDIS_URL: redisUrl,
  ACADEMY_DATA: dataDir,
  PORT: String(PORTS.academy),
  PROOF_PORT: String(PORTS.proof),
  HOST: '127.0.0.1',
  ACADEMY_PUBLIC_URL: `http://127.0.0.1:${PORTS.academy}`,
  SOURCE_REVISION: manifest.revision,
});
if (!(await waitFor(`http://127.0.0.1:${PORTS.academy}/game/health`, (r) => r.json?.ok === true && r.json?.proof === true, 120))) {
  fail(`Academy did not report ok+proof within 120 s. Log: ${manifest.logs.academy}`);
}

if (withWave) {
  launch('wave', ['apps/server/dist/main.js'], {
    DATABASE_URL: databaseUrl,
    REDIS_URL: redisUrl,
    PORT: String(PORTS.wave),
    HOST: '127.0.0.1',
    PROOF_URL: `http://127.0.0.1:${PORTS.proof}`,
    ACADEMY_WEB_DIST: path.join(repoRoot, 'apps/web/dist'),
    ACADEMY_PUBLIC_URL: `http://127.0.0.1:${PORTS.wave}`,
    SOURCE_REVISION: manifest.revision,
  });
  if (!(await waitFor(`http://127.0.0.1:${PORTS.wave}/health`, (r) => r.status === 200, 60))) {
    fail(`Wave runtime did not answer /health 200 within 60 s. Log: ${manifest.logs.wave}`);
  }
}

manifest.readyAt = new Date().toISOString();
save();
console.log(`READY run=${runId} academy=http://127.0.0.1:${PORTS.academy}${withWave ? ` wave=http://127.0.0.1:${PORTS.wave}` : ''} evidence=${evidenceDir}`);
