#!/usr/bin/env node
import {DEPLOYED_ORIGIN, fetchJson, gitHead, groupAlive, listenerPids, processGroupOf, projectContainers, requireCurrentRun} from './lib.mjs';

const checks = [];
const check = (name, ok, detail = '') => checks.push({name, ok: Boolean(ok), detail});

async function probe(url) {
  try {
    return await fetchJson(url, 8000);
  } catch (error) {
    return {status: 0, json: null, body: String(error.cause?.code ?? error.message)};
  }
}

if (process.argv[2] === '--deployed') {
  const health = await probe(`${DEPLOYED_ORIGIN}/game/health`);
  check('deployed /game/health ok+proof', health.json?.ok === true && health.json?.proof === true, health.body.slice(0, 120));
  for (const route of ['/', '/classroom/1', '/workshop/5']) {
    const page = await probe(`${DEPLOYED_ORIGIN}${route}`);
    check(`deployed GET ${route} serves HTML`, page.status === 200 && /<div id="root"/.test(page.body), `HTTP ${page.status}`);
  }
} else {
  if (!process.versions.node.startsWith('24.')) check('node 24', false, process.versions.node);
  const run = requireCurrentRun();
  check('revision matches checkout', run.revision === gitHead(), `run=${run.revision} head=${gitHead()}`);
  for (const [name, pid] of Object.entries(run.pids)) {
    check(`${name} process group ${pid} alive`, groupAlive(pid));
  }
  for (const [name, port] of Object.entries({academy: run.ports.academy, wave: run.ports.wave}).filter(([, port]) => port)) {
    const owners = listenerPids(port).map(processGroupOf);
    check(`port ${port} owned by this run's ${name} group`, owners.length > 0 && owners.every((pgid) => pgid === run.pids[name]), `listener pgids=${owners.join(',') || 'none'}`);
  }
  const containers = projectContainers(run.project);
  check(`containers of ${run.project} running`, containers.length === 2 && containers.every((line) => line.endsWith(' running')), containers.join('; '));
  const health = await probe(`http://127.0.0.1:${run.ports.academy}/game/health`);
  check('academy /game/health ok+proof', health.json?.ok === true && health.json?.proof === true, health.body.slice(0, 120));
  check('academy reports run revision', health.json?.revision === run.revision, `revision=${health.json?.revision}`);
  const classroom = await probe(`http://127.0.0.1:${run.ports.academy}/classroom/1`);
  check('apps/web SPA served at /classroom/1', classroom.status === 200 && /<div id="root"/.test(classroom.body), `HTTP ${classroom.status}`);
  if (run.ports.wave) {
    const wave = await probe(`http://127.0.0.1:${run.ports.wave}/health`);
    check('wave /health 200', wave.status === 200, wave.body.slice(0, 120));
  }
  console.log(`run=${run.runId} evidence=${run.evidenceDir}`);
}

for (const {name, ok, detail} of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`);
const failed = checks.filter((c) => !c.ok).length;
console.log(failed ? `DOCTOR FAILED: ${failed} check(s)` : 'DOCTOR OK');
process.exit(failed ? 1 : 0);
