import {Context, Effect, Layer, Ref} from 'effect';

/**
 * KTD5 — browser-bound participant view. Host records each tab's lesson/slide/revision.
 * Ambiguous multi-tab contexts must not silently pick a winner.
 */
export interface ParticipantViewBinding {
  readonly browserSessionId: string;
  readonly roomId: string;
  readonly participantId: string;
  readonly lessonId: string | null;
  readonly slideIndex: number;
  readonly slideId: string | null;
  readonly viewedRevision: number | null;
  readonly latestPublishedRevision: number | null;
  readonly assignmentId: string | null;
  readonly updatedAt: number;
}

export interface ParticipantContextShape {
  readonly upsert: (binding: ParticipantViewBinding) => Effect.Effect<void>;
  readonly listActive: (
    roomId: string,
    participantId: string,
    maxAgeMs?: number,
  ) => Effect.Effect<ReadonlyArray<ParticipantViewBinding>>;
  readonly clear: (roomId: string, participantId: string, browserSessionId?: string) => Effect.Effect<void>;
}

export class ParticipantContext extends Context.Service<ParticipantContext, ParticipantContextShape>()(
  '@academy/actions/ParticipantContext',
) {}

export class AmbiguousViewContext extends Error {
  readonly _tag = 'AmbiguousViewContext' as const;
  readonly sessions: ReadonlyArray<ParticipantViewBinding>;
  constructor(sessions: ReadonlyArray<ParticipantViewBinding>) {
    super('Multiple browser tabs have different lesson/slide context. Select one tab and retry.');
    this.sessions = sessions;
  }
}

const keyOf = (roomId: string, participantId: string, browserSessionId: string) =>
  `${roomId}::${participantId}::${browserSessionId}`;

export const ParticipantContextMemory = (maxAgeMs = 30_000): Effect.Effect<ParticipantContextShape> =>
  Effect.gen(function* () {
    const state = yield* Ref.make(new Map<string, ParticipantViewBinding>());
    return {
      upsert: (binding) =>
        Ref.update(state, (map) => {
          const next = new Map(map);
          next.set(keyOf(binding.roomId, binding.participantId, binding.browserSessionId), binding);
          return next;
        }),
      listActive: (roomId, participantId, age = maxAgeMs) =>
        Effect.gen(function* () {
          const map = yield* Ref.get(state);
          const now = Date.now();
          return [...map.values()].filter(
            (b) => b.roomId === roomId && b.participantId === participantId && now - b.updatedAt <= age,
          );
        }),
      clear: (roomId, participantId, browserSessionId) =>
        Ref.update(state, (map) => {
          const next = new Map(map);
          if (browserSessionId) {
            next.delete(keyOf(roomId, participantId, browserSessionId));
            return next;
          }
          for (const k of [...next.keys()]) {
            if (k.startsWith(`${roomId}::${participantId}::`)) next.delete(k);
          }
          return next;
        }),
    } satisfies ParticipantContextShape;
  });

export const ParticipantContextLive = (maxAgeMs = 30_000): Layer.Layer<ParticipantContext> =>
  Layer.effect(ParticipantContext, ParticipantContextMemory(maxAgeMs));
