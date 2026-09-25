import {Effect} from 'effect';
import {describe, expect, test} from 'vitest';
import {
  LOCKED_LESSON_DENIAL,
  lockedLessonHttpDenial,
  lockedLessonMcpDenial,
  ReleaseStore,
  runRelease,
  type LessonCatalogEntry,
} from '../../src/release/index.ts';

const catalog: LessonCatalogEntry[] = [
  {lessonId: 'lesson-d1-a', dayOrdinal: 1, lessonOrdinal: 1},
  {lessonId: 'lesson-d1-b', dayOrdinal: 1, lessonOrdinal: 2},
  {lessonId: 'lesson-d2-a', dayOrdinal: 2, lessonOrdinal: 1},
];

describe('ReleaseStore (AET-28)', () => {
  test('new squad: only first lesson of day 1 is released', async () => {
    await runRelease(
      Effect.gen(function* () {
        const store = yield* ReleaseStore;
        const rows = yield* store.seedSquad('squad-1', catalog);
        expect(rows).toHaveLength(3);
        expect(yield* store.isReleased('squad-1', 'lesson-d1-a')).toBe(true);
        expect(yield* store.isReleased('squad-1', 'lesson-d1-b')).toBe(false);
        expect(yield* store.isReleased('squad-1', 'lesson-d2-a')).toBe(false);
        const open = rows.find((r) => r.lessonId === 'lesson-d1-a')!;
        expect(open.state).toBe('released');
        expect(open.releasedBy).toBe('system:seed');
      }),
    );
  });

  test('publishing a new content revision leaves release states unchanged', async () => {
    await runRelease(
      Effect.gen(function* () {
        const store = yield* ReleaseStore;
        yield* store.seedSquad('squad-pub', catalog);
        yield* store.releaseLesson('squad-pub', 'lesson-d1-b', 'facilitator:ryan');
        const before = yield* store.listForSquad('squad-pub');
        yield* store.noteContentRevisionPublished('course-1', 2);
        yield* store.noteContentRevisionPublished('course-1', 3);
        const after = yield* store.listForSquad('squad-pub');
        expect(after).toEqual(before);
        expect(yield* store.isReleased('squad-pub', 'lesson-d1-b')).toBe(true);
        expect(yield* store.isReleased('squad-pub', 'lesson-d2-a')).toBe(false);
      }),
    );
  });

  test('manual release then old scheduled job → one released record / one releasedBy', async () => {
    await runRelease(
      Effect.gen(function* () {
        const store = yield* ReleaseStore;
        yield* store.seedSquad('squad-race', catalog);
        const scheduled = yield* store.scheduleLesson('squad-race', 'lesson-d2-a', Date.now() + 60_000);
        expect(scheduled.state).toBe('scheduled');
        expect(scheduled.scheduleRevision).toBe(1);
        const manual = yield* store.releaseLesson('squad-race', 'lesson-d2-a', 'facilitator:ryan', 1_700_000_000_000);
        expect(manual.state).toBe('released');
        expect(manual.releasedBy).toBe('facilitator:ryan');
        expect(manual.scheduleRevision).toBeNull();
        const fired = yield* store.fireScheduled('squad-race', 'lesson-d2-a', 1, 1_700_000_000_100);
        expect(fired).toBeNull();
        const row = yield* store.get('squad-race', 'lesson-d2-a');
        expect(row.state).toBe('released');
        expect(row.releasedBy).toBe('facilitator:ryan');
        expect(row.releasedAt).toBe(1_700_000_000_000);
        const released = (yield* store.listForSquad('squad-race')).filter(
          (r) => r.state === 'released' && r.lessonId === 'lesson-d2-a',
        );
        expect(released).toHaveLength(1);
      }),
    );
  });

  test('cancelSchedule bumps revision so worker is a no-op', async () => {
    await runRelease(
      Effect.gen(function* () {
        const store = yield* ReleaseStore;
        yield* store.seedSquad('squad-cancel', catalog);
        const scheduled = yield* store.scheduleLesson('squad-cancel', 'lesson-d1-b', Date.now() + 10_000);
        const cancelled = yield* store.cancelSchedule('squad-cancel', 'lesson-d1-b');
        expect(cancelled.state).toBe('locked');
        expect(cancelled.scheduleRevision).toBeGreaterThan(scheduled.scheduleRevision!);
        expect(yield* store.fireScheduled('squad-cancel', 'lesson-d1-b', scheduled.scheduleRevision!)).toBeNull();
        expect(yield* store.isReleased('squad-cancel', 'lesson-d1-b')).toBe(false);
      }),
    );
  });

  test('matching scheduleRevision fires exactly once', async () => {
    await runRelease(
      Effect.gen(function* () {
        const store = yield* ReleaseStore;
        yield* store.seedSquad('squad-fire', catalog);
        const scheduled = yield* store.scheduleLesson('squad-fire', 'lesson-d2-a', Date.now() - 1);
        const first = yield* store.fireScheduled('squad-fire', 'lesson-d2-a', scheduled.scheduleRevision!);
        expect(first?.state).toBe('released');
        expect(first?.releasedBy).toBe('system:scheduler');
        const second = yield* store.fireScheduled('squad-fire', 'lesson-d2-a', scheduled.scheduleRevision!);
        expect(second).toBeNull();
      }),
    );
  });

  test('HTTP and MCP locked-lesson denials share one fixture', () => {
    const http = lockedLessonHttpDenial();
    const mcp = lockedLessonMcpDenial();
    expect(http.status).toBe(LOCKED_LESSON_DENIAL.status);
    expect(mcp.status).toBe(LOCKED_LESSON_DENIAL.status);
    expect(http.body).toEqual(mcp.body);
    expect(http.code).toBe(mcp.code);
    expect(http.message).toBe(mcp.message);
    expect(http.body.error.code).toBe('lesson_locked');
    expect(http.status).toBe(404);
  });
});
