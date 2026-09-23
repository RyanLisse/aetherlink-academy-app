import {Context, Effect, Layer, Ref} from 'effect';
import {evidenceFail, type EvidenceError} from './errors.ts';
import {EvidenceStore} from './evidence-store.ts';
import {
  COMPARISON_CRITERIA,
  keyAssignment,
  keyComparison,
  keyDay,
  keyTarget,
  type ComparisonCriterion,
  type ComparisonScores,
  type DayProgressPublic,
  type HelpRoute,
  type HintOpenRecord,
  type PractisedMark,
  type ReflectionRecord,
} from './types.ts';

export interface ProgressStoreShape {
  readonly markPractised: (
    roomId: string,
    participantId: string,
    targetKind: 'lesson' | 'assignment',
    targetId: string,
    at?: string,
  ) => Effect.Effect<PractisedMark>;
  readonly unmarkPractised: (
    roomId: string,
    participantId: string,
    targetKind: 'lesson' | 'assignment',
    targetId: string,
    at?: string,
  ) => Effect.Effect<PractisedMark>;
  readonly isPractised: (
    roomId: string,
    participantId: string,
    targetKind: 'lesson' | 'assignment',
    targetId: string,
  ) => Effect.Effect<boolean>;
  readonly listPractised: (roomId: string, participantId: string) => Effect.Effect<ReadonlyArray<PractisedMark>>;
  readonly recordHintOpened: (
    roomId: string,
    participantId: string,
    assignmentId: string,
    stepIndex: number,
    at?: string,
  ) => Effect.Effect<HintOpenRecord>;
  readonly hintsOpened: (
    roomId: string,
    participantId: string,
    assignmentId: string,
  ) => Effect.Effect<ReadonlyArray<number>>;
  readonly setRoute: (
    roomId: string,
    participantId: string,
    day: number,
    route: HelpRoute,
  ) => Effect.Effect<void>;
  readonly setReflection: (
    roomId: string,
    participantId: string,
    day: number,
    reflection: ReflectionRecord,
  ) => Effect.Effect<ReflectionRecord, EvidenceError>;
  readonly dayProgress: (
    roomId: string,
    participantId: string,
    day: number,
  ) => Effect.Effect<DayProgressPublic>;
  readonly setComparisonScores: (
    roomId: string,
    day: number,
    participantId: string,
    scores: Partial<Record<ComparisonCriterion, number | null>>,
    scoredBy: string,
    at?: string,
  ) => Effect.Effect<ComparisonScores, EvidenceError>;
  readonly getComparisonScores: (
    roomId: string,
    day: number,
    participantId: string,
  ) => Effect.Effect<ComparisonScores | null>;
}

export class ProgressStore extends Context.Service<ProgressStore, ProgressStoreShape>()(
  '@academy/server/ProgressStore',
) {}

interface DayMeta {
  route: HelpRoute | null;
  reflection: ReflectionRecord | null;
}

interface State {
  practised: Map<string, PractisedMark>;
  hints: Map<string, Set<number>>;
  dayMeta: Map<string, DayMeta>;
  comparison: Map<string, ComparisonScores>;
}

const blank = (): State => ({
  practised: new Map(),
  hints: new Map(),
  dayMeta: new Map(),
  comparison: new Map(),
});

export const ProgressStoreMemory = (): Layer.Layer<ProgressStore, never, EvidenceStore> =>
  Layer.effect(
    ProgressStore,
    Effect.gen(function* () {
      const evidence = yield* EvidenceStore;
      const state = yield* Ref.make(blank());

      const shape: ProgressStoreShape = {
        markPractised: (roomId, participantId, targetKind, targetId, at = new Date().toISOString()) =>
          Effect.gen(function* () {
            const mark: PractisedMark = {
              roomId,
              participantId,
              targetKind,
              targetId,
              practised: true,
              at,
            };
            yield* Ref.update(state, (s) => {
              const practised = new Map(s.practised);
              practised.set(keyTarget(roomId, participantId, targetKind, targetId), mark);
              return {...s, practised};
            });
            return mark;
          }),

        unmarkPractised: (roomId, participantId, targetKind, targetId, at = new Date().toISOString()) =>
          Effect.gen(function* () {
            const mark: PractisedMark = {
              roomId,
              participantId,
              targetKind,
              targetId,
              practised: false,
              at,
            };
            yield* Ref.update(state, (s) => {
              const practised = new Map(s.practised);
              practised.set(keyTarget(roomId, participantId, targetKind, targetId), mark);
              return {...s, practised};
            });
            return mark;
          }),

        isPractised: (roomId, participantId, targetKind, targetId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return s.practised.get(keyTarget(roomId, participantId, targetKind, targetId))?.practised === true;
          }),

        listPractised: (roomId, participantId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return [...s.practised.values()].filter(
              (m) => m.roomId === roomId && m.participantId === participantId && m.practised,
            );
          }),

        recordHintOpened: (roomId, participantId, assignmentId, stepIndex, at = new Date().toISOString()) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => {
              const hints = new Map(s.hints);
              const key = keyAssignment(roomId, participantId, assignmentId);
              const set = new Set(hints.get(key) ?? []);
              set.add(stepIndex);
              hints.set(key, set);
              return {...s, hints};
            });
            return {roomId, participantId, assignmentId, stepIndex, at} satisfies HintOpenRecord;
          }),

        hintsOpened: (roomId, participantId, assignmentId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const set = s.hints.get(keyAssignment(roomId, participantId, assignmentId));
            return set ? [...set].sort((a, b) => a - b) : [];
          }),

        setRoute: (roomId, participantId, day, route) =>
          Ref.update(state, (s) => {
            const dayMeta = new Map(s.dayMeta);
            const key = keyDay(roomId, participantId, day);
            const prev = dayMeta.get(key) ?? {route: null, reflection: null};
            dayMeta.set(key, {...prev, route});
            return {...s, dayMeta};
          }),

        setReflection: (roomId, participantId, day, reflection) =>
          Effect.gen(function* () {
            if (!reflection.learned?.trim() || !reflection.next?.trim()) {
              return yield* Effect.fail(evidenceFail(400, 'Reflection requires learned and next.'));
            }
            yield* Ref.update(state, (s) => {
              const dayMeta = new Map(s.dayMeta);
              const key = keyDay(roomId, participantId, day);
              const prev = dayMeta.get(key) ?? {route: null, reflection: null};
              dayMeta.set(key, {...prev, reflection});
              return {...s, dayMeta};
            });
            return reflection;
          }),

        dayProgress: (roomId, participantId, day) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const meta = s.dayMeta.get(keyDay(roomId, participantId, day)) ?? {route: null, reflection: null};
            const items = yield* evidence.listEvidence(roomId, participantId);
            const forDay = items.filter((e) => e.day === day);
            const reviewed = forDay.filter((e) => e.review != null);
            const accepted = forDay.filter((e) => e.status === 'accepted');
            const handoffs = yield* evidence.listHandoffs(roomId, day);
            const practisedLesson = [...s.practised.values()].some(
              (m) =>
                m.roomId === roomId &&
                m.participantId === participantId &&
                m.practised &&
                m.targetKind === 'lesson',
            );
            const allHints = [...s.hints.entries()]
              .filter(([k]) => k.startsWith(`${roomId}::${participantId}::`))
              .flatMap(([, set]) => [...set]);
            return {
              day,
              route: meta.route,
              hasRoute: meta.route != null,
              evidenceCount: forDay.length,
              hasEvidence: forDay.length > 0,
              reviewedCount: reviewed.length,
              acceptedCount: accepted.length,
              hasReview: reviewed.length > 0,
              hasHandoff: handoffs.length > 0,
              practised: practisedLesson,
              hintsOpened: [...new Set(allHints)].sort((a, b) => a - b),
              reflection: meta.reflection,
              hasReflection: meta.reflection != null,
            } satisfies DayProgressPublic;
          }),

        setComparisonScores: (roomId, day, participantId, scores, scoredBy, at = new Date().toISOString()) =>
          Effect.gen(function* () {
            for (const key of Object.keys(scores)) {
              if (!(COMPARISON_CRITERIA as readonly string[]).includes(key)) {
                return yield* Effect.fail(evidenceFail(400, `Unknown comparison criterion: ${key}`));
              }
            }
            const row: ComparisonScores = {
              roomId,
              day,
              participantId,
              scores: {...scores},
              scoredBy,
              at,
            };
            yield* Ref.update(state, (s) => {
              const comparison = new Map(s.comparison);
              comparison.set(keyComparison(roomId, day, participantId), row);
              return {...s, comparison};
            });
            return row;
          }),

        getComparisonScores: (roomId, day, participantId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return s.comparison.get(keyComparison(roomId, day, participantId)) ?? null;
          }),
      };

      return shape;
    }),
  );
