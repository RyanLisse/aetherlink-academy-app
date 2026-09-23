import {Context, Effect, Layer, Ref} from 'effect';
import type {Locale} from '@academy/i18n';
import {normalizeLocale} from '@academy/i18n';

export interface LocalePrefsShape {
  readonly getUserLocale: (userId: string) => Effect.Effect<Locale>;
  readonly setUserLocale: (userId: string, locale: unknown) => Effect.Effect<Locale>;
  readonly getRoomLocale: (roomId: string) => Effect.Effect<Locale>;
  readonly setRoomLocale: (roomId: string, locale: unknown) => Effect.Effect<Locale>;
  /** Resolve: user preference overrides room preference overrides default. */
  readonly resolve: (userId: string | null | undefined, roomId: string | null | undefined) => Effect.Effect<Locale>;
}

export class LocalePrefs extends Context.Service<LocalePrefs, LocalePrefsShape>()('@academy/server/LocalePrefs') {}

export const LocalePrefsMemory = (): Layer.Layer<LocalePrefs> =>
  Layer.effect(
    LocalePrefs,
    Effect.gen(function* () {
      const users = yield* Ref.make(new Map<string, Locale>());
      const rooms = yield* Ref.make(new Map<string, Locale>());
      const shape: LocalePrefsShape = {
        getUserLocale: (userId) =>
          Ref.get(users).pipe(Effect.map((m) => m.get(userId) ?? ('en' as Locale))),
        setUserLocale: (userId, locale) =>
          Effect.gen(function* () {
            const next = normalizeLocale(locale);
            yield* Ref.update(users, (m) => new Map(m).set(userId, next));
            return next;
          }),
        getRoomLocale: (roomId) =>
          Ref.get(rooms).pipe(Effect.map((m) => m.get(roomId) ?? ('en' as Locale))),
        setRoomLocale: (roomId, locale) =>
          Effect.gen(function* () {
            const next = normalizeLocale(locale);
            yield* Ref.update(rooms, (m) => new Map(m).set(roomId, next));
            return next;
          }),
        resolve: (userId, roomId) =>
          Effect.gen(function* () {
            if (userId) {
              const u = yield* Ref.get(users);
              if (u.has(userId)) return u.get(userId)!;
            }
            if (roomId) {
              const r = yield* Ref.get(rooms);
              if (r.has(roomId)) return r.get(roomId)!;
            }
            return 'en' as Locale;
          }),
      };
      return shape;
    }),
  );
