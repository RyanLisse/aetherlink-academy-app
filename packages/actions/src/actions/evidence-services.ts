import {Context, Effect} from 'effect';

/** Host-provided evidence/progress/self-check. Server wires Memory stores behind this. */
export interface EvidenceServicesShape {
  readonly submitEvidence: (input: {
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
  }) => Effect.Effect<{readonly id: string; readonly requestId: string; readonly at: string; readonly status: 'pending'}>;
  readonly reviewEvidence: (input: {
    readonly evidenceId: string;
    readonly roomId: string;
    readonly reviewerId: string;
    readonly status: 'pending' | 'accepted' | 'revise' | 'open';
    readonly note: string;
  }) => Effect.Effect<{readonly id: string; readonly status: string}>;
  readonly handoff: (input: {
    readonly requestId: string;
    readonly roomId: string;
    readonly day: number;
    readonly by: string;
    readonly decision: string;
    readonly checked: string;
    readonly open: string;
    readonly next: string;
  }) => Effect.Effect<{readonly id: string; readonly day: number}>;
  readonly markPractised: (
    roomId: string,
    participantId: string,
    targetKind: 'lesson' | 'assignment',
    targetId: string,
  ) => Effect.Effect<{readonly practised: true}>;
  readonly unmarkPractised: (
    roomId: string,
    participantId: string,
    targetKind: 'lesson' | 'assignment',
    targetId: string,
  ) => Effect.Effect<{readonly practised: false}>;
  readonly answerSelfCheck: (input: {
    readonly roomId: string;
    readonly participantId: string;
    readonly lessonId: string;
    readonly day: number;
    readonly answers: ReadonlyArray<number>;
  }) => Effect.Effect<{
    readonly attempt: number;
    readonly explanations: ReadonlyArray<string>;
    readonly note: string;
  }>;
  readonly exportDebrief: (
    roomId: string,
    format: 'json' | 'csv' | 'markdown',
  ) => Effect.Effect<string | Record<string, unknown>>;
}

export class EvidenceServices extends Context.Service<EvidenceServices, EvidenceServicesShape>()(
  '@academy/actions/EvidenceServices',
) {}
