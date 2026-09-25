import {Effect, Schema} from 'effect';
import {defineAction} from '../action.ts';
import {AcademyContent} from './academy-content.ts';
import {ReleasePolicy} from './release-policy.ts';
import {requireReleased} from './release-gate.ts';

export const getLesson = defineAction({
  name: 'get_lesson',
  input: Schema.Struct({lessonId: Schema.String}),
  output: Schema.Struct({
    id: Schema.String,
    title: Schema.String,
    day: Schema.Number,
    publishedRevision: Schema.Number,
    slideCount: Schema.Number,
  }),
  scope: 'participant',
  intent: 'read',
  run: (input, caller) =>
    Effect.gen(function* () {
      const policy = yield* ReleasePolicy;
      yield* requireReleased(policy, caller.roomId, input.lessonId);
      const content = yield* AcademyContent;
      const lesson = yield* content.getLesson(input.lessonId);
      if (!lesson) return yield* Effect.fail(new Error('Lesson not found.'));
      return {
        id: lesson.id,
        title: lesson.title,
        day: lesson.day,
        publishedRevision: lesson.publishedRevision,
        slideCount: lesson.slides.length,
      };
    }),
});
