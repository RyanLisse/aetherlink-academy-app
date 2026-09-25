import {useCallback, useState} from 'react';
import {ReleasePanel} from './ReleasePanel.tsx';
import type {LessonReleaseView, ReleaseState} from './types.ts';

const DEMO_LESSONS: ReadonlyArray<LessonReleaseView> = [
  {
    lessonId: 'day1-l1',
    title: 'Day 1 · Lesson 1',
    state: 'released',
    scheduledAt: null,
    scheduleRevision: null,
    releasedAt: Date.UTC(2026, 8, 22, 8, 0, 0),
    releasedBy: 'system:seed',
  },
  {
    lessonId: 'day1-l2',
    title: 'Day 1 · Lesson 2',
    state: 'locked',
    scheduledAt: null,
    scheduleRevision: null,
    releasedAt: null,
    releasedBy: null,
  },
  {
    lessonId: 'day2-l1',
    title: 'Day 2 · Lesson 1',
    state: 'locked',
    scheduledAt: null,
    scheduleRevision: null,
    releasedAt: null,
    releasedBy: null,
  },
];

const patch = (
  rows: ReadonlyArray<LessonReleaseView>,
  lessonId: string,
  next: Partial<LessonReleaseView> & {readonly state: ReleaseState},
): ReadonlyArray<LessonReleaseView> =>
  rows.map((row) => (row.lessonId === lessonId ? {...row, ...next} : row));

/** Thin facilitator mount for ReleasePanel (AET-28 soft). Local demo state until HTTP ReleaseStore is wired. */
export function FacilitatorReleasePanel() {
  const [lessons, setLessons] = useState<ReadonlyArray<LessonReleaseView>>(DEMO_LESSONS);

  const onRelease = useCallback(async (lessonId: string) => {
    setLessons((prev) =>
      patch(prev, lessonId, {
        state: 'released',
        scheduledAt: null,
        scheduleRevision: null,
        releasedAt: Date.now(),
        releasedBy: 'facilitator:ui',
      }),
    );
  }, []);

  const onSchedule = useCallback(async (lessonId: string, scheduledAt: number) => {
    setLessons((prev) => {
      const current = prev.find((row) => row.lessonId === lessonId);
      const revision = (current?.scheduleRevision ?? 0) + 1;
      return patch(prev, lessonId, {
        state: 'scheduled',
        scheduledAt,
        scheduleRevision: revision,
        releasedAt: null,
        releasedBy: null,
      });
    });
  }, []);

  const onCancelSchedule = useCallback(async (lessonId: string) => {
    setLessons((prev) => {
      const current = prev.find((row) => row.lessonId === lessonId);
      const revision = (current?.scheduleRevision ?? 0) + 1;
      return patch(prev, lessonId, {
        state: 'locked',
        scheduledAt: null,
        scheduleRevision: revision,
        releasedAt: null,
        releasedBy: null,
      });
    });
  }, []);

  return (
    <div className="facilitator-release" data-mounted="release-panel">
      <p className="eyebrow">Facilitator</p>
      <p className="lede">Release, schedule, or cancel lesson access for this squad.</p>
      <ReleasePanel
        lessons={lessons}
        onRelease={onRelease}
        onSchedule={onSchedule}
        onCancelSchedule={onCancelSchedule}
      />
    </div>
  );
}
