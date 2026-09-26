#!/usr/bin/env node
// Read-only: HTTP GETs plus, when DATABASE_URL is set, one SELECT in a read-only transaction.
import {createRequire} from 'node:module';
import {baseOrigin, check, describeError, fetchJson, googleStartChecks, isMain, migrationCheck, parseArgs, report} from './lib.mjs';

const USAGE = 'usage: [DATABASE_URL=...] node scripts/verify/apps-server.mjs <apps-server-base-url> [--public-url <ACADEMY_PUBLIC_URL>] [--revision <sha>] [--skip-google]';

async function healthChecks(base, revision) {
  try {
    const health = await fetchJson(`${base}/health`);
    const body = health.json ?? {};
    const checks = [check('/health ok and proof', health.status === 200 && body.ok === true && body.proof === true, `HTTP ${health.status}, ok=${body.ok}, proof=${body.proof}`)];
    if (revision) checks.push(check('/health revision', body.revision === revision, `serving ${body.revision}, expected ${revision}`));
    const connection = await fetchJson(`${base}/connection`);
    for (const service of ['postgres', 'redis', 'proof']) {
      const probe = connection.json?.[service];
      checks.push(check(`/connection ${service}`, probe?.reachable === true, probe ? `${probe.reachable ? 'reachable' : 'unreachable'} in ${probe.latencyMs} ms${probe.error ? `, ${probe.error}` : ''}` : `HTTP ${connection.status}`));
    }
    return checks;
  } catch (error) {
    return [check('/health ok and proof', false, describeError(error))];
  }
}

function loadPg() {
  try {
    return createRequire(new URL('../../apps/server/package.json', import.meta.url))('pg');
  } catch {
    return null;
  }
}

export async function readMigrationRows(databaseUrl, pg = loadPg()) {
  if (!pg) throw new Error('the pg module is not installed here; run `pnpm install` or use the psql query from the runbook');
  const url = new URL(databaseUrl);
  const sslmode = url.searchParams.get('sslmode');
  url.searchParams.delete('sslmode');
  const client = new pg.Client({connectionString: url.href, ssl: sslmode && sslmode !== 'disable' ? true : undefined, connectionTimeoutMillis: 5000});
  await client.connect();
  try {
    await client.query('begin transaction read only');
    const exists = await client.query("select to_regclass('public.academy_curriculum_migrations') is not null as present");
    if (!exists.rows[0].present) return [];
    return (await client.query('select migration_id, name from academy_curriculum_migrations order by migration_id')).rows;
  } finally {
    await client.query('rollback').catch(() => {});
    await client.end();
  }
}

export async function verifyAppsServer(base, {publicUrl, revision, skipGoogle = false, databaseUrl} = {}) {
  const checks = await healthChecks(base, revision);
  if (!skipGoogle) checks.push(...(await googleStartChecks(base, publicUrl)));
  if (databaseUrl) {
    try {
      checks.push(migrationCheck(await readMigrationRows(databaseUrl)));
    } catch (error) {
      checks.push(check('drizzle migrations applied', false, `${new URL(databaseUrl).host}: ${describeError(error)}`));
    }
  }
  return checks;
}

if (isMain(import.meta)) {
  const {positional, flags} = parseArgs(process.argv.slice(2));
  if (!positional[0]) {
    console.error(USAGE);
    process.exit(2);
  }
  const base = baseOrigin(positional[0]);
  const checks = await verifyAppsServer(base, {
    publicUrl: flags['public-url'],
    revision: flags.revision,
    skipGoogle: 'skip-google' in flags,
    databaseUrl: process.env.DATABASE_URL?.trim() || undefined,
  });
  process.exitCode = report(`apps/server on ${base}`, checks);
}
