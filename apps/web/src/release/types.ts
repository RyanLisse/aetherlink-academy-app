export type ReleaseState = 'locked' | 'scheduled' | 'released';

export interface LessonReleaseView {
  readonly lessonId: string;
  readonly title?: string;
  readonly state: ReleaseState;
  readonly scheduledAt: number | null;
  readonly scheduleRevision: number | null;
  readonly releasedAt: number | null;
  readonly releasedBy: string | null;
}
