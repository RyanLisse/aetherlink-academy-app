/** Evidence + progress + private self-check (AET-29). */

export type EvidenceStatus = 'pending' | 'accepted' | 'revise' | 'open';
export type HelpRoute = 'guided' | 'standard' | 'stretch';

export interface ProgressMember {
  readonly id: string;
  readonly name: string;
}

export const COMPARISON_CRITERIA = [
  'fraudFound',
  'falsePositives',
  'explanation',
  'simplicity',
  'efficiency',
  'creativity',
] as const;
export type ComparisonCriterion = (typeof COMPARISON_CRITERIA)[number];

export interface EvidenceRecord {
  readonly id: string;
  readonly requestId: string;
  readonly roomId: string;
  readonly participantId: string;
  readonly name: string;
  readonly day: number;
  readonly lessonId: string | null;
  readonly assignmentId: string | null;
  readonly finding: string;
  readonly command: string;
  readonly observed: string;
  readonly limitation: string;
  readonly source: 'participant' | 'mcp';
  readonly at: string;
  status: EvidenceStatus;
  review: EvidenceReview | null;
}

export interface EvidenceReview {
  readonly by: string;
  readonly note: string;
  readonly status: EvidenceStatus;
  readonly at: string;
}

export interface HandoffRecord {
  readonly id: string;
  readonly requestId: string;
  readonly roomId: string;
  readonly day: number;
  readonly by: string;
  readonly decision: string;
  readonly checked: string;
  readonly open: string;
  readonly next: string;
  readonly at: string;
}

export interface ReflectionRecord {
  readonly learned: string;
  readonly next: string;
  readonly at: string;
}

/** Public progress (facilitator-safe). Never carries quiz answers or scores. */
export interface DayProgressPublic {
  readonly day: number;
  readonly route: HelpRoute | null;
  readonly hasRoute: boolean;
  readonly evidenceCount: number;
  readonly hasEvidence: boolean;
  readonly reviewedCount: number;
  readonly acceptedCount: number;
  readonly hasReview: boolean;
  readonly hasHandoff: boolean;
  readonly practised: boolean;
  readonly hintsOpened: ReadonlyArray<number>;
  readonly reflection: ReflectionRecord | null;
  readonly hasReflection: boolean;
}

export interface PractisedMark {
  readonly roomId: string;
  readonly participantId: string;
  readonly targetKind: 'lesson' | 'assignment';
  readonly targetId: string;
  readonly practised: boolean;
  readonly at: string;
}

export interface HintOpenRecord {
  readonly roomId: string;
  readonly participantId: string;
  readonly assignmentId: string;
  readonly stepIndex: number;
  readonly at: string;
}

export interface SelfCheckAttempt {
  readonly id: string;
  readonly roomId: string;
  readonly participantId: string;
  readonly lessonId: string;
  readonly day: number;
  /** Private — never exported to facilitator / debrief. */
  readonly answers: ReadonlyArray<number>;
  /** Private — never exported to facilitator / debrief. */
  readonly score: number;
  readonly explanations: ReadonlyArray<string>;
  readonly at: string;
  readonly attempt: number;
}

/** Facilitator projection of a participant: practice + submissions only. */
export interface FacilitatorParticipantProjection {
  readonly participantId: string;
  readonly name: string;
  readonly practised: ReadonlyArray<{readonly targetKind: 'lesson' | 'assignment'; readonly targetId: string}>;
  readonly evidence: ReadonlyArray<{
    readonly id: string;
    readonly day: number;
    readonly lessonId: string | null;
    readonly assignmentId: string | null;
    readonly finding: string;
    readonly status: EvidenceStatus;
  }>;
  readonly hintsOpenedByAssignment: Readonly<Record<string, ReadonlyArray<number>>>;
  readonly dayProgress: ReadonlyArray<DayProgressPublic>;
}

export interface ComparisonScores {
  readonly roomId: string;
  readonly day: number;
  readonly participantId: string;
  readonly scores: Partial<Record<ComparisonCriterion, number | null>>;
  readonly scoredBy: string;
  readonly at: string;
}

export interface ReviewLayoutPayload {
  readonly layout: 'review';
  readonly assignmentId: string | null;
  readonly lessonId: string | null;
  readonly submissions: ReadonlyArray<{
    readonly participantId: string;
    readonly name: string;
    readonly evidenceId: string;
    readonly finding: string;
    readonly status: EvidenceStatus;
    readonly at: string;
  }>;
}

export interface DebriefJson {
  readonly roomId: string;
  readonly roomName: string;
  readonly exportedAt: string;
  readonly note: string;
  readonly days: ReadonlyArray<{
    readonly day: number;
    readonly members: ReadonlyArray<{
      readonly participantId: string;
      readonly name: string;
      readonly progress: DayProgressPublic;
      readonly comparison: Partial<Record<ComparisonCriterion, number | null>> | null;
    }>;
    readonly handoffs: ReadonlyArray<HandoffRecord>;
  }>;
}

export const keyParticipant = (roomId: string, participantId: string): string =>
  `${roomId}::${participantId}`;

export const keyDay = (roomId: string, participantId: string, day: number): string =>
  `${roomId}::${participantId}::${day}`;

export const keyTarget = (
  roomId: string,
  participantId: string,
  targetKind: 'lesson' | 'assignment',
  targetId: string,
): string => `${roomId}::${participantId}::${targetKind}::${targetId}`;

export const keyAssignment = (roomId: string, participantId: string, assignmentId: string): string =>
  `${roomId}::${participantId}::${assignmentId}`;

export const keyComparison = (roomId: string, day: number, participantId: string): string =>
  `${roomId}::${day}::${participantId}`;
