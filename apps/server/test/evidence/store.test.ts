import {Effect, Exit} from 'effect';
import {describe, expect, test} from 'vitest';
import {
  assertNoAnswerOrScoreKeys,
  buildFacilitatorProjection,
  buildReviewLayoutPayload,
  EvidenceStore,
  exportDebriefCsv,
  exportDebriefJson,
  exportDebriefMarkdown,
  ProgressStore,
  runEvidence,
  SelfCheckStore,
  type SelfCheckQuestion,
} from '../../src/evidence/index.ts';

const questions: SelfCheckQuestion[] = [
  {
    prompt: 'Wat bewijst een lokale deterministic-run?',
    options: ['Alleen een README', 'Input, output en foutpad vastgelegd', 'Een productieclaim'],
    answer: 1,
    explanation: 'Deterministic-run toont input, output en foutpad zonder LLM.',
  },
  {
    prompt: 'Wat is verplicht vóór acceptatie?',
    options: ['Automatisch accepteren', 'Menselijke gate', 'XP-punten'],
    answer: 1,
    explanation: 'Human gate blijft verplicht; geen gamification.',
  },
  {
    prompt: 'Wat mag je niet claimen zonder run?',
    options: ['OPEN-status', 'Een uitgevoerde AI-run', 'Een mock'],
    answer: 1,
    explanation: 'Claim geen onuitgevoerde AI-run.',
  },
];

describe('EvidenceStore / ProgressStore / SelfCheckStore (AET-29)', () => {
  test('legacy learning-progress scenarios: five-day evidence, review, handoff, reflection, scoped debrief', async () => {
    await runEvidence(
      Effect.gen(function* () {
        const evidence = yield* EvidenceStore;
        const progress = yield* ProgressStore;
        const roomId = 'room-learn';
        const alice = {id: 'alice', name: 'Alice'};
        const bob = {id: 'bob', name: 'Bob'};
        const facilitator = 'facilitator';

        for (let day = 1; day <= 5; day++) {
          yield* progress.setRoute(roomId, alice.id, day, 'guided');
          yield* progress.setReflection(roomId, alice.id, day, {
            learned: `Geleerd op dag ${day}`,
            next: `Oefening ${day}`,
            at: new Date().toISOString(),
          });
          const row = yield* evidence.submitEvidence({
            requestId: `e${day}`,
            roomId,
            participantId: alice.id,
            name: alice.name,
            day,
            finding: 'Een aanname gecontroleerd',
            command: 'node --test',
            observed: 'Testresultaat',
            limitation: 'Geen productiecontrole',
            lessonId: `lesson-d${day}`,
          });
          expect(row.day).toBe(day);
          expect(row.status).toBe('pending');
          yield* evidence.reviewEvidence({
            evidenceId: row.id,
            roomId,
            reviewerId: facilitator,
            status: 'accepted',
            note: 'Herhaald door tweede lezer',
          });
          yield* evidence.handoff({
            requestId: `h${day}`,
            roomId,
            day,
            by: facilitator,
            decision: `Dag ${day} afgerond`,
            checked: 'Tweede lezer',
            open: 'Productie',
            next: 'Bob',
          });
        }

        for (let day = 1; day <= 5; day++) {
          const p = yield* progress.dayProgress(roomId, alice.id, day);
          expect(p.route).toBe('guided');
          expect(p.acceptedCount).toBe(1);
          expect(p.hasHandoff).toBe(true);
          expect(p.reflection?.learned).toBe(`Geleerd op dag ${day}`);
          // Facilitator-safe: no quizScore on public progress
          expect('quizScore' in p).toBe(false);
          expect('score' in p).toBe(false);
        }

        const bobDay1 = yield* progress.dayProgress(roomId, bob.id, 1);
        expect(bobDay1.evidenceCount).toBe(0);
        expect(bobDay1.reflection).toBeNull();

        const md = yield* exportDebriefMarkdown(roomId, 'Test squad', [alice, bob]);
        expect(md).toMatch(/Supportdag 5/);
        expect(md).not.toMatch(/quizScore|guided|stretch/);

        const json = yield* exportDebriefJson(roomId, 'Test squad', [alice, bob]);
        assertNoAnswerOrScoreKeys(json);
        const csv = yield* exportDebriefCsv(roomId, 'Test squad', [alice, bob]);
        expect(csv).not.toMatch(/\b(answer|answers|score|quizScore)\b/i);
      }),
    );
  });

  test('legacy solo-progress-day: evidence stamps day; per-day isolation; route without leaking scores to export', async () => {
    await runEvidence(
      Effect.gen(function* () {
        const evidence = yield* EvidenceStore;
        const progress = yield* ProgressStore;
        const selfCheck = yield* SelfCheckStore;
        const roomId = 'room-solo';
        const p = {id: 'deelnemer', name: 'Deelnemer'};

        // Day 1 self-check (private) — does not write score into ProgressStore
        const r1 = yield* selfCheck.answerSelfCheck({
          roomId,
          participantId: p.id,
          lessonId: 'lesson-d1',
          day: 1,
          answers: [1, 1, 1],
          questions,
        });
        expect(r1.private.score).toBe(3);
        yield* progress.setRoute(roomId, p.id, 1, 'stretch');
        const ev1 = yield* evidence.submitEvidence({
          requestId: 'ev-day1',
          roomId,
          participantId: p.id,
          name: p.name,
          day: 1,
          finding: 'README wijkt af van package.json',
          command: 'node --test',
          observed: '1 failing',
          limitation: 'Nog geen tweede lezer',
          lessonId: 'lesson-d1',
        });
        expect(ev1.day).toBe(1);

        const d1 = yield* progress.dayProgress(roomId, p.id, 1);
        expect(d1.hasEvidence).toBe(true);
        expect(d1.evidenceCount).toBe(1);
        expect(d1.route).toBe('stretch');
        expect(d1.hasRoute).toBe(true);

        // Day 2 self-check must not overwrite day 1 private attempts or day progress
        const r2 = yield* selfCheck.answerSelfCheck({
          roomId,
          participantId: p.id,
          lessonId: 'lesson-d2',
          day: 2,
          answers: [0, 0, 0],
          questions,
        });
        expect(r2.private.score).toBe(0);
        yield* progress.setRoute(roomId, p.id, 2, 'guided');
        const ev2 = yield* evidence.submitEvidence({
          requestId: 'ev-day2',
          roomId,
          participantId: p.id,
          name: p.name,
          day: 2,
          finding: 'Capability-map gekoppeld',
          command: 'node --test',
          observed: 'ok',
          limitation: 'Nog geen peer-check',
          lessonId: 'lesson-d2',
        });
        expect(ev2.day).toBe(2);

        const after1 = yield* progress.dayProgress(roomId, p.id, 1);
        const after2 = yield* progress.dayProgress(roomId, p.id, 2);
        expect(after1.route).toBe('stretch');
        expect(after1.evidenceCount).toBe(1);
        expect(after2.route).toBe('guided');
        expect(after2.evidenceCount).toBe(1);

        const attemptsD1 = yield* selfCheck.listAttempts(roomId, p.id, 'lesson-d1');
        expect(attemptsD1).toHaveLength(1);
        expect(attemptsD1[0]!.score).toBe(3);
      }),
    );
  });

  test('AC: self-check ×3 + practised → facilitator projection has practised, no answers/scores; debrief clean', async () => {
    await runEvidence(
      Effect.gen(function* () {
        const evidence = yield* EvidenceStore;
        const progress = yield* ProgressStore;
        const selfCheck = yield* SelfCheckStore;
        const roomId = 'room-ac';
        const learner = {id: 'learner-1', name: 'Sam'};
        const lessonId = 'lesson-ac';

        for (let i = 0; i < 3; i++) {
          const result = yield* selfCheck.answerSelfCheck({
            roomId,
            participantId: learner.id,
            lessonId,
            day: 1,
            answers: i === 2 ? [1, 1, 1] : [0, 0, 0],
            questions,
          });
          expect(result.attempt).toBe(i + 1);
          expect(result.note).toMatch(/geen cijfer|Onbeperkt/i);
        }
        expect(yield* selfCheck.attemptCount(roomId, learner.id, lessonId)).toBe(3);

        yield* progress.markPractised(roomId, learner.id, 'lesson', lessonId);
        expect(yield* progress.isPractised(roomId, learner.id, 'lesson', lessonId)).toBe(true);
        yield* progress.unmarkPractised(roomId, learner.id, 'lesson', lessonId);
        expect(yield* progress.isPractised(roomId, learner.id, 'lesson', lessonId)).toBe(false);
        yield* progress.markPractised(roomId, learner.id, 'lesson', lessonId);

        yield* evidence.submitEvidence({
          requestId: 'ac-ev',
          roomId,
          participantId: learner.id,
          name: learner.name,
          day: 3,
          finding: 'Fraud signal caught',
          command: 'node analyze.mjs',
          observed: '2 seeded cases',
          limitation: 'Ceiling = reference FP',
          lessonId,
          assignmentId: 'assign-fraud',
        });
        yield* progress.recordHintOpened(roomId, learner.id, 'assign-fraud', 0);
        yield* progress.recordHintOpened(roomId, learner.id, 'assign-fraud', 1);
        yield* progress.setComparisonScores(
          roomId,
          3,
          learner.id,
          {fraudFound: 2, falsePositives: 1, explanation: 3, simplicity: 2, efficiency: 2, creativity: 1},
          'facilitator',
        );

        const projection = yield* buildFacilitatorProjection(roomId, [learner]);
        expect(projection).toHaveLength(1);
        const row = projection[0]!;
        expect(row.practised).toEqual([{targetKind: 'lesson', targetId: lessonId}]);
        assertNoAnswerOrScoreKeys(row);
        const literal = JSON.parse(JSON.stringify(row)) as Record<string, unknown>;
        assertNoAnswerOrScoreKeys(literal);
        expect(JSON.stringify(literal)).not.toMatch(/"answer"|"answers"|"score"|"quizScore"/);

        const review = yield* buildReviewLayoutPayload(roomId, [learner], 'assign-fraud', lessonId);
        expect(review.layout).toBe('review');
        expect(review.submissions).toHaveLength(1);
        assertNoAnswerOrScoreKeys(review);

        const json = yield* exportDebriefJson(roomId, 'AC room', [learner]);
        assertNoAnswerOrScoreKeys(json);
        const csv = yield* exportDebriefCsv(roomId, 'AC room', [learner]);
        expect(csv.split('\n')[0]).not.toMatch(/\b(answer|score)\b/i);
        expect(csv).toContain('fraudFound');
      }),
    );
  });

  test('peer cannot review own evidence; idempotent requestId', async () => {
    await runEvidence(
      Effect.gen(function* () {
        const evidence = yield* EvidenceStore;
        const roomId = 'room-peer';
        const first = yield* evidence.submitEvidence({
          requestId: 'same',
          roomId,
          participantId: 'a',
          name: 'A',
          day: 1,
          finding: 'f',
          command: 'c',
          observed: 'o',
          limitation: 'l',
        });
        const second = yield* evidence.submitEvidence({
          requestId: 'same',
          roomId,
          participantId: 'a',
          name: 'A',
          day: 1,
          finding: 'f2',
          command: 'c',
          observed: 'o',
          limitation: 'l',
        });
        expect(second.id).toBe(first.id);
        const selfReview = yield* Effect.exit(
          evidence.reviewEvidence({
            evidenceId: first.id,
            roomId,
            reviewerId: 'a',
            status: 'accepted',
            note: 'self',
          }),
        );
        expect(Exit.isFailure(selfReview)).toBe(true);
      }),
    );
  });
});
