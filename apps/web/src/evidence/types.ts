export const COMPARISON_CRITERIA = [
  'fraudFound',
  'falsePositives',
  'explanation',
  'simplicity',
  'efficiency',
  'creativity',
] as const;

export type ComparisonCriterion = (typeof COMPARISON_CRITERIA)[number];

export const CRITERION_LABELS: Record<ComparisonCriterion, string> = {
  fraudFound: 'Fraud found',
  falsePositives: 'False positives',
  explanation: 'Explanation',
  simplicity: 'Simplicity',
  efficiency: 'Efficiency',
  creativity: 'Creativity',
};

export interface PractisedView {
  readonly targetKind: 'lesson' | 'assignment';
  readonly targetId: string;
  readonly practised: boolean;
}

export interface EvidenceSubmissionView {
  readonly id: string;
  readonly participantId: string;
  readonly name: string;
  readonly finding: string;
  readonly status: string;
  readonly at: string;
}

export interface FacilitatorRowView {
  readonly participantId: string;
  readonly name: string;
  readonly practised: ReadonlyArray<PractisedView>;
  readonly evidence: ReadonlyArray<EvidenceSubmissionView>;
  readonly comparison: Partial<Record<ComparisonCriterion, number | null>>;
  readonly hintsOpened: ReadonlyArray<number>;
}

export interface SelfCheckQuestionView {
  readonly prompt: string;
  readonly options: ReadonlyArray<string>;
}
