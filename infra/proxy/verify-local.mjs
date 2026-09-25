#!/usr/bin/env node
import { createServer } from 'node:http';
import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { connect } from 'node:net';
import { createHash, randomBytes } from 'node:crypto';

const proxyPort = 48142;
const upstreamPort = 48143;
const containerName = `academy-wave-domain-${process.pid}-${randomBytes(4).toString('hex')}`;
const startupTimeout = Number(process.env.PROXY_WAIT_TIMEOUT_MS || 15_000);
check(Number.isFinite(startupTimeout) && startupTimeout > 0, 'invalid proxy startup timeout');
const upstreamSockets = new Set();
const upstream = createServer((req, res) => {
  if (req.url === '/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write('event: verification\ndata: sse-through-caddy\n\n');
    return;
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true, path: req.url, verifier: containerName }));
});
upstream.on('upgrade', (req, socket) => {
  if (req.url !== '/ws') return socket.destroy();
  const key = req.headers['sec-websocket-key'];
  const accept = createHashWebSocketAccept(key);
  socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
  let frameBuffer = Buffer.alloc(0);
  socket.on('data', (data) => {
    frameBuffer = Buffer.concat([frameBuffer, data]);
    const frame = decodeClientTextFrame(frameBuffer);
    if (!frame) return;
    frameBuffer = frame.rest;
    if (frame.payload === 'proxy-ws') socket.write(encodeServerTextFrame('ws-through-caddy'));
  });
});
upstream.on('connection', (socket) => { upstreamSockets.add(socket); socket.on('close', () => upstreamSockets.delete(socket)); });

function createHashWebSocketAccept(key) {
  return createHash('sha1').update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest('base64');
}
function decodeClientTextFrame(data) {
  if (data.length < 2) return null;
  const length = data[1] & 0x7f;
  if (length === 126 || length === 127 || !(data[1] & 0x80)) throw new Error('fixture only accepts short masked text frames');
  if (data.length < 6 + length) return null;
  const mask = data.subarray(2, 6);
  const body = data.subarray(6, 6 + length);
  const decoded = Buffer.from(body);
  for (let i = 0; i < decoded.length; i++) decoded[i] ^= mask[i % 4];
  return { payload: decoded.toString(), rest: data.subarray(6 + length) };
}
function encodeServerTextFrame(text) {
  const body = Buffer.from(text);
  return Buffer.concat([Buffer.from([0x81, body.length]), body]);
}
function check(value, message) { if (!value) throw new Error(message); }
async function withTimeout(promise, message, timeout = 10_000) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), timeout); })]);
  } finally { clearTimeout(timer); }
}
async function waitForPort(port, timeout = startupTimeout) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const socket = connect(port, '127.0.0.1');
    try { await withTimeout(once(socket, 'connect'), `port ${port} connection timed out`, 500); return; } catch {} finally { socket.destroy(); }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`port ${port} did not open`);
}
async function websocketThroughProxy() {
  const socket = new WebSocket(`ws://127.0.0.1:${proxyPort}/ws`);
  await withTimeout(new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); }), 'WebSocket did not open');
  const message = withTimeout(new Promise((resolve, reject) => { socket.addEventListener('message', (event) => resolve(String(event.data)), { once: true }); socket.addEventListener('error', reject, { once: true }); }), 'WebSocket echo timed out');
  socket.send('proxy-ws');
  check(await message === 'ws-through-caddy', 'WebSocket payload did not pass through');
  socket.close();
}

let containerId;
let dockerRun;
let dockerLogs;
let cidDir;
let cleaned = false;
async function cleanup() {
  if (cleaned) return;
  cleaned = true;
  if (dockerLogs && !dockerLogs.killed) dockerLogs.kill('SIGTERM');
  if (dockerRun && dockerRun.exitCode === null && dockerRun.signalCode === null) {
    await withTimeout(once(dockerRun, 'close'), 'Docker start did not settle', 30_000).catch(() => {
      dockerRun.kill('SIGKILL');
    });
  }
  if (!containerId && cidDir) {
    containerId = await readFile(join(cidDir, 'container.id'), 'utf8').then(value => value.trim(), () => undefined);
  }
  try {
    if (containerId) execFileSync('docker', ['rm', '--force', containerId], { stdio: 'ignore', timeout: 10_000 });
  } finally {
    for (const socket of upstreamSockets) socket.destroy();
    await new Promise(resolve => upstream.close(resolve));
    if (cidDir) await rm(cidDir, { recursive: true, force: true });
  }
}
const signalHandler = async () => { await cleanup(); process.exit(130); };
process.once('SIGINT', signalHandler);
process.once('SIGTERM', signalHandler);
await upstream.listen(upstreamPort, '127.0.0.1');
try {
  cidDir = await mkdtemp(join(tmpdir(), 'academy-wave-domain-'));
  dockerRun = spawn('docker', ['run', '--detach', '--name', containerName, '--cidfile', join(cidDir, 'container.id'), '--network', 'host', '-e', `ACADEMY_HOST=http://127.0.0.1:${proxyPort}`, '-e', 'ACADEMY_BIND=127.0.0.1', '-e', 'ACADEMY_ADMIN=off', '-e', `ACADEMY_UPSTREAM=127.0.0.1:${upstreamPort}`, '-v', `${process.cwd()}/infra/proxy/Caddyfile:/etc/caddy/Caddyfile:ro`, 'caddy:2.10-alpine', 'caddy', 'run', '--config', '/etc/caddy/Caddyfile'], { stdio: ['ignore', 'pipe', 'pipe'] });
  const [exitCode] = await withTimeout(once(dockerRun, 'close'), 'Docker container start timed out', 30_000);
  containerId = (await readFile(join(cidDir, 'container.id'), 'utf8')).trim();
  check(exitCode === 0, 'Docker container failed to start');
  dockerLogs = spawn('docker', ['logs', '--follow', containerId], { stdio: ['ignore', 'pipe', 'pipe'] });
  dockerLogs.stderr.on('data', (chunk) => process.stderr.write(chunk));
  await waitForPort(proxyPort);
  const state = JSON.parse(execFileSync('docker', ['inspect', '--format', '{{json .State}}', containerId], { encoding: 'utf8', timeout: 5_000 }));
  check(state.Running, 'Caddy exited before verification');
  const response = await fetch(`http://127.0.0.1:${proxyPort}/health`, { signal: AbortSignal.timeout(10_000) });
  const body = await response.json();
  check(response.ok && body.ok === true && body.verifier === containerName, 'HTTP health did not reach this verifier');
  const sse = await fetch(`http://127.0.0.1:${proxyPort}/events`, { signal: AbortSignal.timeout(10_000) });
  try {
    check(sse.headers.get('content-type')?.startsWith('text/event-stream'), 'SSE content type was changed');
    const reader = sse.body.getReader();
    const { value } = await withTimeout(reader.read(), 'SSE first event timed out');
    check(Buffer.from(value).toString().includes('sse-through-caddy'), 'SSE event did not pass through');
    await reader.cancel();
  } finally { sse.body?.cancel().catch(() => {}); }
  await websocketThroughProxy();
  console.log('PASS HTTP, SSE and WebSocket pass-through via Caddy');
} finally {
  process.removeListener('SIGINT', signalHandler);
  process.removeListener('SIGTERM', signalHandler);
  await cleanup();
}
