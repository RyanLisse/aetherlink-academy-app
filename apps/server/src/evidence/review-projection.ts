import {Effect} from 'effect';
import {EvidenceStore} from './evidence-store.ts';
import {ProgressStore} from './progress-store.ts';
import {SelfCheckStore} from './self-check-store.ts';
import {
  type FacilitatorParticipantProjection,
  type ProgressMember,
  type ReviewLayoutPayload,
} from './types.ts';
import {assertNoAnswerOrScoreKeys} from './debrief.ts';

/**
 * Review slide payload for live-sync consumers (AET-26 stream).
 * Does not mutate live/; hosts publish via LiveStore themselves.
 */
export const buildReviewLayoutPayload = (
  roomId: string,
  members: ReadonlyArray<ProgressMember>,
  assignmentId: string | null,
  lessonId: string | null,
): Effect.Effect<ReviewLayoutPayload, never, EvidenceStore> =>
  Effect.gen(function* () {
    const evidence = yield* EvidenceStore;
    const all = yield* evidence.listEvidence(roomId);
    const filtered = all.filter((e) => {
      if (assignmentId != null) return e.assignmentId === assignmentId;
      if (lessonId != null) return e.lessonId === lessonId;
      return true;
    });
    const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? id;
    const payload: ReviewLayoutPayload = {
      layout: 'review',
      assignmentId,
      lessonId,
      submissions: filtered.map((e) => ({
        participantId: e.participantId,
        name: e.name || nameOf(e.participantId),
        evidenceId: e.id,
        finding: e.finding,
        status: e.status,
        at: e.at,
      })),
    };
    assertNoAnswerOrScoreKeys(payload);
    return payload;
  });

/**
 * Facilitator overview projection (R8): practised + submissions + hintsOpened.
 * Literally asserts absence of answer/score keys on the returned object.
 */
export const buildFacilitatorProjection = (
  roomId: string,
  members: ReadonlyArray<ProgressMember>,
  days: ReadonlyArray<number> = [1, 2, 3, 4, 5],
): Effect.Effect<
  ReadonlyArray<FacilitatorParticipantProjection>,
  never,
  EvidenceStore | ProgressStore | SelfCheckStore
> =>
  Effect.gen(function* () {
    const evidence = yield* EvidenceStore;
    const progress = yield* ProgressStore;
    const selfCheck = yield* SelfCheckStore;
    const rows: FacilitatorParticipantProjection[] = [];
    for (const member of members) {
      const practised = (yield* progress.listPractised(roomId, member.id)).map((m) => ({
        targetKind: m.targetKind,
        targetId: m.targetId,
      }));
      const items = yield* evidence.listEvidence(roomId, member.id);
      const hintsOpenedByAssignment: Record<string, number[]> = {};
      for (const item of items) {
        if (item.assignmentId) {
          hintsOpenedByAssignment[item.assignmentId] = [
            ...(yield* progress.hintsOpened(roomId, member.id, item.assignmentId)),
          ];
        }
      }
      const dayProgress = [];
      for (const day of days) {
        dayProgress.push(yield* progress.dayProgress(roomId, member.id, day));
      }
      // Touch SelfCheckStore only for attempt counts — never pull answers/scores into projection.
      const attempts = yield* selfCheck.listAttempts(roomId, member.id);
      const attemptCountsOnly = attempts.map((a) => ({
        lessonId: a.lessonId,
        attempt: a.attempt,
        at: a.at,
      }));
      void attemptCountsOnly;
      const row: FacilitatorParticipantProjection = {
        participantId: member.id,
        name: member.name,
        practised,
        evidence: items.map((e) => ({
          id: e.id,
          day: e.day,
          lessonId: e.lessonId,
          assignmentId: e.assignmentId,
          finding: e.finding,
          status: e.status,
        })),
        hintsOpenedByAssignment,
        dayProgress,
      };
      assertNoAnswerOrScoreKeys(row);
      rows.push(row);
    }
    return rows;
  });
