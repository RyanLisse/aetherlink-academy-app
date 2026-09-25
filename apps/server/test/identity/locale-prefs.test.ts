import {Effect} from 'effect';
import {describe, expect, test} from 'vitest';
import {LocalePrefs, LocalePrefsMemory} from '../../src/identity/locale-prefs.ts';

const run = <A>(effect: Effect.Effect<A, unknown, LocalePrefs>) =>
  Effect.runPromise(Effect.provide(effect, LocalePrefsMemory()));

describe('locale preferences', () => {
  test('per-user and per-room prefs; user overrides room', async () => {
    await run(Effect.gen(function* () {
      const prefs = yield* LocalePrefs;
      expect(yield* prefs.resolve(null, null)).toBe('en');
      yield* prefs.setRoomLocale('room-1', 'nl');
      expect(yield* prefs.resolve(null, 'room-1')).toBe('nl');
      yield* prefs.setUserLocale('user-1', 'en');
      expect(yield* prefs.resolve('user-1', 'room-1')).toBe('en');
    }));
  });
});
