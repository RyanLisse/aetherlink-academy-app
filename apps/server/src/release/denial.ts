/**
 * Shared locked-lesson denial for HTTP and MCP (AET-28 AC).
 * Shape is intentional 404 so locked vs missing is not distinguishable to participants.
 */
export const LOCKED_LESSON_DENIAL = {
  status: 404,
  code: 'lesson_locked',
  message: 'Lesson not found.',
} as const;

export type LockedLessonDenial = typeof LOCKED_LESSON_DENIAL;

/** Body returned by HTTP handlers and MCP tools for an unreleased lesson. */
export const lockedLessonDenialBody = (): {
  readonly error: {readonly code: typeof LOCKED_LESSON_DENIAL.code; readonly message: typeof LOCKED_LESSON_DENIAL.message};
} => ({
  error: {code: LOCKED_LESSON_DENIAL.code, message: LOCKED_LESSON_DENIAL.message},
});

/** Identical denial object for MCP tool results (same fields as HTTP JSON body + status). */
export const lockedLessonMcpDenial = (): LockedLessonDenial & {
  readonly body: ReturnType<typeof lockedLessonDenialBody>;
} => ({
  ...LOCKED_LESSON_DENIAL,
  body: lockedLessonDenialBody(),
});

/** Identical denial object for HTTP responses. */
export const lockedLessonHttpDenial = (): LockedLessonDenial & {
  readonly body: ReturnType<typeof lockedLessonDenialBody>;
} => ({
  ...LOCKED_LESSON_DENIAL,
  body: lockedLessonDenialBody(),
});
