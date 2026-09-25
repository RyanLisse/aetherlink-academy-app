/** Per-squad lesson release policy (AET-28). Independent of content revision. */

export type ReleaseState = 'locked' | 'scheduled' | 'released';

export interface LessonRelease {
  readonly squadId: string;
  readonly lessonId: string;
  state: ReleaseState;
  scheduledAt: number | null;
  /** Bumped on every schedule / cancel; worker no-ops when its revision no longer matches. */
  scheduleRevision: number | null;
  releasedAt: number | null;
  releasedBy: string | null;
}

/** Catalog entry used when seeding a new squad's release rows. */
export interface LessonCatalogEntry {
  readonly lessonId: string;
  /** Day number within the track (1 = day 1). */
  readonly dayOrdinal: number;
  /** Order within the day (1 = first lesson). */
  readonly lessonOrdinal: number;
}

export const keyOf = (squadId: string, lessonId: string): string => `${squadId}::${lessonId}`;

export const firstDayOneLessonId = (lessons: ReadonlyArray<LessonCatalogEntry>): string | null => {
  const dayOne = lessons.filter((l) => l.dayOrdinal === 1);
  if (dayOne.length === 0) return null;
  return [...dayOne].sort((a, b) => a.lessonOrdinal - b.lessonOrdinal)[0]!.lessonId;
};
