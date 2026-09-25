import {Schema} from 'effect';
import {LessonId, LocalizedText, SlideId} from './shared.ts';

export {LessonId, LocalizedText, SlideId};

export const SlideType = Schema.Literals(['context', 'concept', 'practice', 'review', 'recap', 'pause']);
/** 8 named layouts plus an omitted default card-grid, per the training-template + classroom-slides source audit. */
export const SlideLayout = Schema.Literals(['pillars', 'steps', 'compare', 'exercise', 'recap', 'cards', 'image', 'bars']);

const Text = Schema.String;
const Card = Schema.Struct({title: Text, body: Text});
const Item = Schema.Struct({label: Text, caption: Schema.optional(Text), detail: Schema.optional(Text)});
const Column = Schema.Struct({title: Text, items: Schema.Array(Text), foot: Schema.optional(Text)});
const BarStage = Schema.Struct({name: Text, w: Schema.Number, accent: Schema.optional(Schema.Boolean), ghost: Schema.optional(Schema.Boolean)});
const Bars = Schema.Struct({stages: Schema.Array(BarStage), scale: Text, caption: Text});

export type JsonValue = null | boolean | number | string | readonly JsonValue[] | {readonly [key: string]: JsonValue};
const JsonValue: Schema.Codec<JsonValue, JsonValue> = Schema.suspend((): Schema.Codec<JsonValue, JsonValue> => Schema.Union([
  Schema.Null,
  Schema.Boolean,
  Schema.Number,
  Schema.String,
  Schema.Array(JsonValue),
  Schema.Record(Schema.String, JsonValue),
]) as Schema.Codec<JsonValue, JsonValue>);

export const Visual = JsonValue;

const PublicSlideFields = {
  id: SlideId,
  lessonId: LessonId,
  ordinal: Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(1))),
  title: Text,
  kicker: Schema.optional(Text),
  subtitle: Schema.optional(Text),
  type: SlideType,
  layout: Schema.optional(SlideLayout),
  cards: Schema.optional(Schema.Array(Card)),
  items: Schema.optional(Schema.Array(Item)),
  columns: Schema.optional(Schema.Array(Column)),
  steps: Schema.optional(Schema.Array(Text)),
  expected: Schema.optional(Text),
  check: Schema.optional(Text),
  timer: Schema.optional(Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(0)))),
  prompt: Schema.optional(Text),
  tagline: Schema.optional(Text),
  dark: Schema.optional(Schema.Boolean),
  visual: Schema.optional(Visual),
  image: Schema.optional(Text),
  imageAlt: Schema.optional(Text),
  imageCaption: Schema.optional(Text),
  keepCards: Schema.optional(Schema.Boolean),
  mascot: Schema.optional(Schema.Boolean),
  concepts: Schema.optional(Schema.Array(Text)),
  bars: Schema.optional(Bars),
  planB: Schema.optional(Text),
} as const;

export const Slide = Schema.Struct({...PublicSlideFields, notes: Schema.optional(Text)});
export type Slide = Schema.Schema.Type<typeof Slide>;

const ParticipantSlide = Schema.Struct(PublicSlideFields);

const withoutVisualQuizAnswer = (value: JsonValue): JsonValue => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return value;
  if (!('quiz' in value)) return value;
  const quiz = (value as {readonly [key: string]: JsonValue}).quiz;
  if (quiz === null || typeof quiz !== 'object' || Array.isArray(quiz)) return value;
  const {answer: _answer, ...publicQuiz} = quiz as {readonly [key: string]: JsonValue};
  return {...value, quiz: publicQuiz};
};

/** Project through an explicit allowlist and remove hidden visual quiz answers. */
export const participantSlide = (slide: Slide): Schema.Schema.Type<typeof ParticipantSlide> =>
  Schema.decodeUnknownSync(ParticipantSlide)(slide.visual === undefined
    ? slide
    : {...slide, visual: withoutVisualQuizAnswer(slide.visual)});

export const decodeSlide = (input: unknown): Slide => Schema.decodeUnknownSync(Slide)(input);
export const encodeSlide = (slide: Slide): unknown => Schema.encodeSync(Slide)(slide);

export * from './ids.ts';
export * from './course.ts';
export * from './lesson.ts';
export * from './assignment.ts';
export * from './quiz.ts';
export * from './day-quiz.ts';
export * from './room.ts';
export * from './realtime.ts';
export * from './progress.ts';
export * from './chat.ts';
export * from './credential.ts';
