#!/usr/bin/env node
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const occupied = createServer();
const sockets = new Set();
occupied.on('connection', socket => {
  sockets.add(socket);
  socket.on('close', () => sockets.delete(socket));
});
occupied.listen(48142, '127.0.0.1');
await once(occupied, 'listening');
let child;
let closed;
let timer;
try {
  child = spawn(process.execPath, ['infra/proxy/verify-local.mjs'], {
    env: { ...process.env, PROXY_WAIT_TIMEOUT_MS: '2000' },
    stdio: 'ignore',
  });
  closed = once(child, 'close');
  const result = await Promise.race([
    closed.then(([code]) => code),
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('negative verifier timed out')), 30_000); }),
  ]);
  if (result === 0) throw new Error('verifier passed despite an occupied proxy port');
  console.log('PASS occupied proxy port fails within deadline');
} finally {
  clearTimeout(timer);
  if (child && child.exitCode === null && child.signalCode === null) {
    child.kill('SIGTERM');
    const force = setTimeout(() => child.kill('SIGKILL'), 45_000);
    try { await closed; } finally { clearTimeout(force); }
  }
  for (const socket of sockets) socket.destroy();
  await new Promise(resolve => occupied.close(resolve));
}
