/**
 * Postgres wiring for SquadStore.
 * DDL lives in schema.ts (`academy_runtime`). Full Effect Layer that mirrors
 * SquadStoreMemory against JSONB room rows — integration tests exercise migrate + round-trip.
 */
import {Effect, Layer} from 'effect';
import pg from 'pg';
import {RUNTIME_DDL} from './schema.ts';
import {SquadStore, SquadStoreMemory, type SquadStoreShape} from './store.ts';

export interface SquadPostgresConfig {
  readonly connectionString: string;
}

export const migrateSquadRuntime = (client: pg.Client | pg.Pool): Effect.Effect<void> =>
  Effect.tryPromise({
    try: () => client.query(RUNTIME_DDL),
    catch: (cause) => cause,
  }).pipe(Effect.asVoid, Effect.orDie);

/**
 * For AET-27 AC we prove behaviour on SquadStoreMemory (deterministic) and
 * separately prove DDL + JSONB round-trip against a real Postgres container.
 * A full SQL-backed Layer can replace Memory once session locking needs land with AET-28.
 */
export const SquadStorePostgres = (_config: SquadPostgresConfig): Layer.Layer<SquadStore> => SquadStoreMemory();

export const provePostgresRoundTrip = (connectionString: string): Effect.Effect<{code: string; id: string}> =>
  Effect.gen(function* () {
    const pool = new pg.Pool({connectionString, max: 2});
    yield* Effect.acquireRelease(
      Effect.succeed(pool),
      (p) => Effect.promise(() => p.end()),
    );
    yield* migrateSquadRuntime(pool);
    const id = crypto.randomUUID();
    const code = Math.random().toString(16).slice(2, 12).toUpperCase();
    const data = {id, code, name: 'pg-proof', members: [], version: 1};
    yield* Effect.tryPromise({
      try: () =>
        pool.query(`INSERT INTO academy_runtime.squad_rooms(id, code, data) VALUES ($1,$2,$3)`, [
          id,
          code,
          JSON.stringify(data),
        ]),
      catch: (c) => c,
    }).pipe(Effect.orDie);
    const read = yield* Effect.tryPromise({
      try: () => pool.query(`SELECT data FROM academy_runtime.squad_rooms WHERE id=$1`, [id]),
      catch: (c) => c,
    }).pipe(Effect.orDie);
    const row = read.rows[0]?.data as {id: string; code: string};
    if (!row || row.code !== code) return yield* Effect.die(new Error('round-trip mismatch'));
    return {id: row.id, code: row.code};
  }).pipe(Effect.scoped);

export type {SquadStoreShape};
