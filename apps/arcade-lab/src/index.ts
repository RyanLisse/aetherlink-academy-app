export { foldLesson, evaluateAssert, evaluateLessonAsserts, applyOp, cloneFiles, diffOp } from './fold';
export type { WorkspaceState } from './schema';
export {
  LessonSchema,
  OpSchema,
  StopSchema,
  AssertSchema,
  type Lesson,
  type Op,
  type Stop,
  type Assert,
  type LessonFile,
} from './schema';
export { script, type ScriptApi, type ScriptInput } from './script';
export {
  LESSONS,
  LESSON_BY_ID,
  DEFAULT_LESSON_ID,
  resolveLessonId,
  getLesson,
} from './lessons';
