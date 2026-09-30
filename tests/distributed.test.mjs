import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(check, label, timeout = 20000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await check()) return;
    await delay(100);
  }
  throw new Error(`Timed out: ${label}`);
}
async function request(base, route, body, token, expected = 200) {
  const response = await fetch(base + route, {
    signal: AbortSignal.timeout(15000),
    method: body ? 'POST' : 'GET',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  assert.equal(response.status, expected, `${route}: ${result.error || 'unexpected status'}`);
  return result;
}

test('two real Academy processes share Postgres/Redis state and survive process loss', {
  skip: process.env.ACADEMY_DISTRIBUTED_TEST !== '1', timeout: 150000,
}, async () => {
  assert(process.env.DATABASE_URL && (process.env.REDIS_URL || process.env.KV_URL));
  const id = randomUUID().replaceAll('-', '');
  const academySchema = `academy_test_${id}`;
  const temp = await mkdtemp(path.join(tmpdir(), 'academy-distributed-'));
  const hostKey = randomBytes(32).toString('hex');
  const sharedEnv = { ...process.env, ACADEMY_HOST_KEY: hostKey, ACADEMY_SIGNING_SECRET: randomBytes(32).toString('hex'), ACADEMY_STORAGE: 'postgres', ACADEMY_DATABASE_SCHEMA: academySchema, ACADEMY_REDIS_PREFIX: academySchema, NODE_ENV: 'test' };
  delete sharedEnv.VERCEL;
  const processes = [];
  const logs = [];
  const ports = [4351, 4352];
  const bases = ports.map(port => `http://127.0.0.1:${port}`);
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.delete('sslmode');
  url.searchParams.delete('channel_binding');
  const database = new Pool({ connectionString: url.href, ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: true }, max: 2, connectionTimeoutMillis: 10000 });
  function start(index) {
    const child = spawn(process.execPath, ['scripts/start.mjs'], {
      cwd: root, detached: true, stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...sharedEnv, PORT: String(ports[index]), ACADEMY_PUBLIC_URL: bases[index], ACADEMY_DATA: path.join(temp, String(index)) },
    });
    child.stdout.on('data', chunk => logs.push(chunk.toString()));
    child.stderr.on('data', chunk => logs.push(chunk.toString()));
    processes.push(child);
    return child;
  }
  async function stop(child, signal = 'SIGTERM') {
    if (child.exitCode !== null || child.signalCode !== null) return;
    const exited = new Promise(resolve => child.once('exit', resolve));
    try { process.kill(-child.pid, signal); } catch (error) { if (error.code !== 'ESRCH') throw error; }
    let deadline;
    try {
      await Promise.race([exited, new Promise(resolve => { deadline = setTimeout(() => { try { process.kill(-child.pid, 'SIGKILL'); } catch {} resolve(); }, 28000); })]);
    } finally { clearTimeout(deadline); }
  }
  async function ready(index, child) {
    await until(async () => {
      if (child.exitCode !== null || child.signalCode !== null) throw new Error(`App ${index} exited during startup`);
      try { const response = await fetch(bases[index] + '/game/health', { signal: AbortSignal.timeout(1000) }); return response.ok && (await response.json()).ok === true; } catch { return false; }
    }, `app ${index} ready`, 40000);
  }
  try {
    const first = start(0), second = start(1);
    await Promise.all([ready(0, first), ready(1, second)]);
    const host = await request(bases[0], '/game/create', { name: 'Distributed verification', hostKey });
    const a = await request(bases[0], '/game/join', { code: host.code, name: 'Process A test' });
    const b = await request(bases[1], '/game/join', { code: host.code, name: 'Process B test' });
    assert.equal((await request(bases[1], '/game/state', null, a.token)).members.length, 2, 'process B sees both members');

    const intentUrl = 'https://proof.example.test/d/distributed-intent';
    await request(bases[1], '/game/intent', { url: intentUrl }, host.token);
    await until(async () => (await request(bases[0], '/game/state', null, b.token)).intentUrl === intentUrl, 'process A reads the intent link set on process B');

    await request(bases[0], '/game/board', { action: 'open' }, host.token);
    await request(bases[1], '/game/board/card', { column: 0, text: 'ALPHA from process B' }, b.token);
    await request(bases[0], '/game/board/card', { column: 2, text: 'BETA from process A' }, a.token);
    const cards = state => (state.board?.columns || []).flatMap(column => column.cards);
    await until(async () => {
      const both = await Promise.all(bases.map(base => request(base, '/game/state', null, host.token)));
      return both.every(state => cards(state).includes('ALPHA from process B') && cards(state).includes('BETA from process A'));
    }, 'both processes see both board cards');

    await stop(first, 'SIGKILL');
    const restarted = start(0); await ready(0, restarted);
    const afterLoss = await request(bases[0], '/game/state', null, a.token);
    assert.equal(afterLoss.intentUrl, intentUrl, 'intent link survives process loss');
    assert.deepEqual(cards(afterLoss).sort(), ['ALPHA from process B', 'BETA from process A'], 'board cards survive process loss exactly once');

    const original = await request(bases[0], '/game/mcp-token', {}, a.token);
    await request(bases[1], '/game/mcp-token', {}, a.token);
    await request(bases[0], '/game/mcp/get_mission', {}, original.token, 401);
    console.log('Verified two real processes, shared Postgres/Redis room state, process loss and cross-instance token revocation');
  } finally {
    await Promise.all(processes.map(child => stop(child)));
    const logDir = process.env.ACADEMY_TEST_LOG_DIR || path.resolve(root, '../../work');
    await mkdir(logDir, { recursive: true });
    await writeFile(path.join(logDir, 'distributed-server.log'), logs.join(''), { mode: 0o600 });
    try {
      await database.query(`DROP SCHEMA IF EXISTS "${academySchema}" CASCADE`);
    } finally { await database.end(); await rm(temp, { recursive: true, force: true }); }
  }
});
