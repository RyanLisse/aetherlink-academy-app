import {Context, Effect, Layer, Ref} from 'effect';
import {evidenceFail, type EvidenceError} from './errors.ts';
import {type SelfCheckAttempt} from './types.ts';

export interface SelfCheckQuestion {
  readonly prompt: string;
  readonly options: ReadonlyArray<string>;
  /** Correct option index — never exposed via facilitator projection. */
  readonly answer: number;
  readonly explanation: string;
}

export interface AnswerSelfCheckInput {
  readonly roomId: string;
  readonly participantId: string;
  readonly lessonId: string;
  readonly day: number;
  readonly answers: ReadonlyArray<number>;
  readonly questions: ReadonlyArray<SelfCheckQuestion>;
  readonly at?: string;
}

/** Participant-only response: explanations + retry allowed; no gate. */
export interface SelfCheckParticipantResult {
  readonly attempt: number;
  readonly explanations: ReadonlyArray<string>;
  readonly correctCount: number;
  readonly total: number;
  readonly note: string;
  /** Private detail for the learner only — never put on facilitator projection. */
  readonly private: {
    readonly score: number;
    readonly answers: ReadonlyArray<number>;
  };
}

export interface SelfCheckStoreShape {
  /**
   * R7 / KTD7: unlimited retries, explanations, no grade/threshold/progression gate.
   * Attempts stored separately from ProgressStore.
   */
  readonly answerSelfCheck: (
    input: AnswerSelfCheckInput,
  ) => Effect.Effect<SelfCheckParticipantResult, EvidenceError>;
  readonly listAttempts: (
    roomId: string,
    participantId: string,
    lessonId?: string,
  ) => Effect.Effect<ReadonlyArray<SelfCheckAttempt>>;
  /** Facilitator-safe: attempt counts only — never answers or scores. */
  readonly attemptCount: (
    roomId: string,
    participantId: string,
    lessonId: string,
  ) => Effect.Effect<number>;
}

export class SelfCheckStore extends Context.Service<SelfCheckStore, SelfCheckStoreShape>()(
  '@academy/server/SelfCheckStore',
) {}

interface State {
  attempts: SelfCheckAttempt[];
}

export const SelfCheckStoreMemory = (): Layer.Layer<SelfCheckStore> =>
  Layer.effect(
    SelfCheckStore,
    Effect.gen(function* () {
      const state = yield* Ref.make<State>({attempts: []});

      const shape: SelfCheckStoreShape = {
        answerSelfCheck: (input) =>
          Effect.gen(function* () {
            const {questions, answers} = input;
            if (!Array.isArray(answers) || answers.length !== questions.length) {
              return yield* Effect.fail(
                evidenceFail(400, `Beantwoord alle ${questions.length} vragen.`),
              );
            }
            for (let i = 0; i < answers.length; i++) {
              const a = answers[i]!;
              const opts = questions[i]!.options;
              if (!Number.isInteger(a) || a < 0 || a >= opts.length) {
                return yield* Effect.fail(evidenceFail(400, 'Gebruik een geldige optie voor elke vraag.'));
              }
            }
            const score = answers.filter((a, i) => a === questions[i]!.answer).length;
            const explanations = questions.map((q, i) =>
              answers[i] === q.answer
                ? q.explanation
                : `${q.explanation} (jouw keuze week af — opnieuw proberen mag onbeperkt.)`,
            );
            const s = yield* Ref.get(state);
            const prior = s.attempts.filter(
              (x) =>
                x.roomId === input.roomId &&
                x.participantId === input.participantId &&
                x.lessonId === input.lessonId,
            ).length;
            const attempt = prior + 1;
            const record: SelfCheckAttempt = {
              id: crypto.randomUUID(),
              roomId: input.roomId,
              participantId: input.participantId,
              lessonId: input.lessonId,
              day: input.day,
              answers: [...answers],
              score,
              explanations,
              at: input.at ?? new Date().toISOString(),
              attempt,
            };
            yield* Ref.update(state, (cur) => ({attempts: [...cur.attempts, record]}));
            return {
              attempt,
              explanations,
              correctCount: score,
              total: questions.length,
              note: 'Private self-check — geen cijfer, drempel of voortgangspoort. Onbeperkt opnieuw proberen.',
              private: {score, answers: [...answers]},
            } satisfies SelfCheckParticipantResult;
          }),

        listAttempts: (roomId, participantId, lessonId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return s.attempts.filter(
              (a) =>
                a.roomId === roomId &&
                a.participantId === participantId &&
                (lessonId == null || a.lessonId === lessonId),
            );
          }),

        attemptCount: (roomId, participantId, lessonId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return s.attempts.filter(
              (a) => a.roomId === roomId && a.participantId === participantId && a.lessonId === lessonId,
            ).length;
          }),
      };

      return shape;
    }),
  );
