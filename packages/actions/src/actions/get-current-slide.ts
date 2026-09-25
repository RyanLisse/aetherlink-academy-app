import {Effect, Schema} from 'effect';
import {defineAction} from '../action.ts';
import {EmptyInput} from '../schemas.ts';
import {AcademyContent} from './academy-content.ts';
import {
  AmbiguousViewContext,
  ParticipantContext,
  type ParticipantViewBinding,
} from './participant-context.ts';
import {ReleasePolicy} from './release-policy.ts';
import {requireReleased} from './release-gate.ts';

const bindingKey = (b: ParticipantViewBinding) =>
  `${b.lessonId ?? ''}::${b.slideIndex}::${b.viewedRevision ?? ''}::${b.slideId ?? ''}`;

export const getCurrentSlide = defineAction({
  name: 'get_current_slide',
  input: EmptyInput,
  output: Schema.Struct({
    lessonId: Schema.NullOr(Schema.String),
    slideIndex: Schema.Number,
    slideId: Schema.NullOr(Schema.String),
    title: Schema.NullOr(Schema.String),
    body: Schema.NullOr(Schema.String),
    viewedRevision: Schema.NullOr(Schema.Number),
    latestPublishedRevision: Schema.NullOr(Schema.Number),
    browserSessionId: Schema.String,
  }),
  scope: 'participant',
  intent: 'read',
  run: (_input, caller) =>
    Effect.gen(function* () {
      const ctx = yield* ParticipantContext;
      const active = yield* ctx.listActive(caller.roomId, caller.principalId);
      if (active.length === 0) {
        return yield* Effect.fail(new Error('No active browser view for this participant. Open the follow view first.'));
      }
      const keys = new Set(active.map(bindingKey));
      if (keys.size > 1) return yield* Effect.fail(new AmbiguousViewContext(active));
      const binding = active[0]!;
      if (binding.lessonId) {
        const policy = yield* ReleasePolicy;
        yield* requireReleased(policy, caller.roomId, binding.lessonId);
      }
      const content = yield* AcademyContent;
      const lesson = binding.lessonId ? yield* content.getLesson(binding.lessonId) : null;
      const slide = lesson?.slides.find((s) => s.index === binding.slideIndex) ?? lesson?.slides[binding.slideIndex] ?? null;
      return {
        lessonId: binding.lessonId,
        slideIndex: binding.slideIndex,
        slideId: binding.slideId ?? slide?.id ?? null,
        title: slide?.title ?? null,
        body: slide?.body ?? null,
        viewedRevision: binding.viewedRevision,
        latestPublishedRevision: binding.latestPublishedRevision ?? lesson?.publishedRevision ?? null,
        browserSessionId: binding.browserSessionId,
      };
    }),
});
