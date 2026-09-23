import type {LessonReleaseView} from './types.ts';

export interface ReleasePanelProps {
  readonly lessons: ReadonlyArray<LessonReleaseView>;
  readonly onRelease: (lessonId: string) => void | Promise<void>;
  readonly onSchedule: (lessonId: string, scheduledAt: number) => void | Promise<void>;
  readonly onCancelSchedule: (lessonId: string) => void | Promise<void>;
}

/** Facilitator controls: release / schedule / cancel per lesson (AET-28). */
export function ReleasePanel({lessons, onRelease, onSchedule, onCancelSchedule}: ReleasePanelProps) {
  return (
    <section className="release-panel" aria-label="Lesson release">
      <h2>Lesson release</h2>
      <ul>
        {lessons.map((lesson) => (
          <li key={lesson.lessonId} data-state={lesson.state}>
            <span className="release-lesson-id">{lesson.title ?? lesson.lessonId}</span>
            <span className="release-state">{lesson.state}</span>
            {lesson.state !== 'released' ? (
              <button type="button" onClick={() => void onRelease(lesson.lessonId)}>
                Release now
              </button>
            ) : null}
            {lesson.state === 'locked' ? (
              <button
                type="button"
                onClick={() => void onSchedule(lesson.lessonId, Date.now() + 60 * 60 * 1000)}
              >
                Schedule +1h
              </button>
            ) : null}
            {lesson.state === 'scheduled' ? (
              <button type="button" onClick={() => void onCancelSchedule(lesson.lessonId)}>
                Cancel schedule
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
