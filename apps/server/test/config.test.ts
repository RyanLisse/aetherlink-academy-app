import {Effect} from 'effect';
import {describe, expect, test} from 'vitest';
import {DEFAULT_PORT, readConfig} from '../src/layers/config.ts';

const base = {DATABASE_URL: 'postgresql://fixture.invalid/academy', REDIS_URL: 'redis://fixture.invalid:6379'};

describe('server configuration', () => {
  test('defaults to app port 4318 on loopback', async () => {
    const config = await Effect.runPromise(readConfig(base));
    expect(config.port).toBe(DEFAULT_PORT);
    expect(config.port).toBe(4318);
    expect(config.revision).toBeNull();
    expect(Object.hasOwn(config, 'proof')).toBe(false);
    expect(config.host).toBe('127.0.0.1');
  });

  test('missing DATABASE_URL or Redis URL fails with a tagged ConfigError', async () => {
    for (const env of [{REDIS_URL: base.REDIS_URL}, {DATABASE_URL: base.DATABASE_URL}]) {
      const result = await Effect.runPromise(readConfig(env).pipe(Effect.result));
      expect(result._tag).toBe('Failure');
      if (result._tag === 'Failure') expect(result.failure._tag).toBe('ConfigError');
    }
    const kv = await Effect.runPromise(readConfig({DATABASE_URL: base.DATABASE_URL, KV_URL: 'rediss://kv.invalid:6380'}));
    expect(kv.redisUrl).toBe('rediss://kv.invalid:6380');
  });

  test('rejects a non-numeric PORT', async () => {
    const result = await Effect.runPromise(readConfig({...base, PORT: 'eighty'}).pipe(Effect.result));
    expect(result._tag).toBe('Failure');
  });
});
