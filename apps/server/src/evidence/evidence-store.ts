import {Context, Effect, Layer, Ref} from 'effect';
import {evidenceFail, type EvidenceError} from './errors.ts';
import {
  type EvidenceRecord,
  type EvidenceReview,
  type EvidenceStatus,
  type HandoffRecord,
} from './types.ts';

export interface SubmitEvidenceInput {
  readonly requestId: string;
  readonly roomId: string;
  readonly participantId: string;
  readonly name: string;
  readonly day: number;
  readonly finding: string;
  readonly command: string;
  readonly observed: string;
  readonly limitation: string;
  readonly lessonId?: string | null;
  readonly assignmentId?: string | null;
  readonly source?: 'participant' | 'mcp';
  readonly id?: string;
  readonly at?: string;
}

export interface ReviewEvidenceInput {
  readonly evidenceId: string;
  readonly roomId: string;
  readonly reviewerId: string;
  readonly status: EvidenceStatus;
  readonly note: string;
  readonly at?: string;
}

export interface HandoffInput {
  readonly requestId: string;
  readonly roomId: string;
  readonly day: number;
  readonly by: string;
  readonly decision: string;
  readonly checked: string;
  readonly open: string;
  readonly next: string;
  readonly id?: string;
  readonly at?: string;
}

export interface EvidenceStoreShape {
  readonly submitEvidence: (input: SubmitEvidenceInput) => Effect.Effect<EvidenceRecord, EvidenceError>;
  readonly reviewEvidence: (input: ReviewEvidenceInput) => Effect.Effect<EvidenceRecord, EvidenceError>;
  readonly handoff: (input: HandoffInput) => Effect.Effect<HandoffRecord, EvidenceError>;
  readonly listEvidence: (roomId: string, participantId?: string) => Effect.Effect<ReadonlyArray<EvidenceRecord>>;
  readonly listHandoffs: (roomId: string, day?: number) => Effect.Effect<ReadonlyArray<HandoffRecord>>;
  readonly getEvidence: (evidenceId: string) => Effect.Effect<EvidenceRecord, EvidenceError>;
}

export class EvidenceStore extends Context.Service<EvidenceStore, EvidenceStoreShape>()(
  '@academy/server/EvidenceStore',
) {}

interface State {
  evidence: Map<string, EvidenceRecord>;
  byRequest: Map<string, string>;
  handoffs: Map<string, HandoffRecord>;
  handoffByRequest: Map<string, string>;
}

const blank = (): State => ({
  evidence: new Map(),
  byRequest: new Map(),
  handoffs: new Map(),
  handoffByRequest: new Map(),
});

const cloneEvidence = (row: EvidenceRecord): EvidenceRecord => ({
  ...row,
  review: row.review ? {...row.review} : null,
});

const cloneHandoff = (row: HandoffRecord): HandoffRecord => ({...row});

export const EvidenceStoreMemory = (): Layer.Layer<EvidenceStore> =>
  Layer.effect(
    EvidenceStore,
    Effect.gen(function* () {
      const state = yield* Ref.make(blank());

      const shape: EvidenceStoreShape = {
        submitEvidence: (input) =>
          Effect.gen(function* () {
            if (!input.requestId?.trim()) return yield* Effect.fail(evidenceFail(400, 'requestId required.'));
            if (!input.finding?.trim() || !input.command?.trim() || !input.observed?.trim() || !input.limitation?.trim()) {
              return yield* Effect.fail(evidenceFail(400, 'finding, command, observed and limitation are required.'));
            }
            const reqKey = `${input.roomId}::${input.requestId}`;
            const s = yield* Ref.get(state);
            const existingId = s.byRequest.get(reqKey);
            if (existingId) {
              const existing = s.evidence.get(existingId);
              if (existing) return cloneEvidence(existing);
            }
            const record: EvidenceRecord = {
              id: input.id ?? crypto.randomUUID(),
              requestId: input.requestId,
              roomId: input.roomId,
              participantId: input.participantId,
              name: input.name,
              day: input.day,
              lessonId: input.lessonId ?? null,
              assignmentId: input.assignmentId ?? null,
              finding: input.finding,
              command: input.command,
              observed: input.observed,
              limitation: input.limitation,
              source: input.source ?? 'participant',
              at: input.at ?? new Date().toISOString(),
              status: 'pending',
              review: null,
            };
            yield* Ref.update(state, (cur) => {
              const evidence = new Map(cur.evidence);
              const byRequest = new Map(cur.byRequest);
              evidence.set(record.id, record);
              byRequest.set(reqKey, record.id);
              return {...cur, evidence, byRequest};
            });
            return cloneEvidence(record);
          }),

        reviewEvidence: (input) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const target = s.evidence.get(input.evidenceId);
            if (!target || target.roomId !== input.roomId) {
              return yield* Effect.fail(evidenceFail(404, 'Bewijs niet gevonden.'));
            }
            if (target.participantId === input.reviewerId) {
              return yield* Effect.fail(evidenceFail(403, 'Laat een andere deelnemer jouw bewijs beoordelen.'));
            }
            if (!['accepted', 'revise', 'open', 'pending'].includes(input.status)) {
              return yield* Effect.fail(evidenceFail(400, 'Ongeldige reviewstatus.'));
            }
            const review: EvidenceReview = {
              by: input.reviewerId,
              note: input.note,
              status: input.status,
              at: input.at ?? new Date().toISOString(),
            };
            const updated: EvidenceRecord = {...target, status: input.status, review};
            yield* Ref.update(state, (cur) => {
              const evidence = new Map(cur.evidence);
              evidence.set(updated.id, updated);
              return {...cur, evidence};
            });
            return cloneEvidence(updated);
          }),

        handoff: (input) =>
          Effect.gen(function* () {
            if (!input.requestId?.trim()) return yield* Effect.fail(evidenceFail(400, 'requestId required.'));
            const reqKey = `${input.roomId}::${input.requestId}`;
            const s = yield* Ref.get(state);
            const existingId = s.handoffByRequest.get(reqKey);
            if (existingId) {
              const existing = s.handoffs.get(existingId);
              if (existing) return cloneHandoff(existing);
            }
            const record: HandoffRecord = {
              id: input.id ?? crypto.randomUUID(),
              requestId: input.requestId,
              roomId: input.roomId,
              day: input.day,
              by: input.by,
              decision: input.decision,
              checked: input.checked,
              open: input.open,
              next: input.next,
              at: input.at ?? new Date().toISOString(),
            };
            yield* Ref.update(state, (cur) => {
              const handoffs = new Map(cur.handoffs);
              const handoffByRequest = new Map(cur.handoffByRequest);
              handoffs.set(record.id, record);
              handoffByRequest.set(reqKey, record.id);
              return {...cur, handoffs, handoffByRequest};
            });
            return cloneHandoff(record);
          }),

        listEvidence: (roomId, participantId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return [...s.evidence.values()]
              .filter((e) => e.roomId === roomId && (participantId == null || e.participantId === participantId))
              .map(cloneEvidence);
          }),

        listHandoffs: (roomId, day) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return [...s.handoffs.values()]
              .filter((h) => h.roomId === roomId && (day == null || h.day === day))
              .map(cloneHandoff);
          }),

        getEvidence: (evidenceId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const row = s.evidence.get(evidenceId);
            if (!row) return yield* Effect.fail(evidenceFail(404, 'Bewijs niet gevonden.'));
            return cloneEvidence(row);
          }),
      };

      return shape;
    }),
  );
