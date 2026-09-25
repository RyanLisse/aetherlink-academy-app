import {Schema} from 'effect';

const Slug = Schema.String.pipe(Schema.check(Schema.isPattern(/^[a-z0-9][a-z0-9-]{0,63}$/)));
const Text = Schema.String.pipe(Schema.check(Schema.isMinLength(1)));

export const DayQuizQuestionId = Slug.pipe(Schema.brand('DayQuizQuestionId'));
export type DayQuizQuestionId = Schema.Schema.Type<typeof DayQuizQuestionId>;
export const DayQuizOptionId = Slug.pipe(Schema.brand('DayQuizOptionId'));
export type DayQuizOptionId = Schema.Schema.Type<typeof DayQuizOptionId>;

const DayQuizOption = Schema.Struct({id: DayQuizOptionId, label: Text});

/** The only question kind present in day-pack content today. A new kind is a new union member with its own key shape and scorer branch. */
export const SingleChoiceQuestion = Schema.Struct({
  id: DayQuizQuestionId,
  kind: Schema.Literal('single-choice'),
  question: Text,
  options: Schema.Array(DayQuizOption).pipe(Schema.check(Schema.isMinLength(2))),
  source: Schema.optional(Schema.Literal('authored-adaptation')),
});
export type SingleChoiceQuestion = Schema.Schema.Type<typeof SingleChoiceQuestion>;

const duplicates = (values: ReadonlyArray<string>): ReadonlyArray<string> =>
  [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];

const DayQuizFields = {
  questions: Schema.Array(SingleChoiceQuestion).pipe(Schema.check(Schema.isMinLength(1))),
  key: Schema.Record(Schema.String, Schema.String),
} as const;

const dayQuizIssues = (quiz: Schema.Schema.Type<Schema.Struct<typeof DayQuizFields>>): ReadonlyArray<string> => {
  const issues: string[] = [];
  const ids = quiz.questions.map((question) => question.id);
  for (const id of duplicates(ids)) issues.push(`duplicate question id "${id}"`);
  for (const question of quiz.questions) {
    const optionIds = question.options.map((option) => option.id);
    for (const id of duplicates(optionIds)) issues.push(`question "${question.id}" has duplicate option id "${id}"`);
    const keyed = quiz.key[question.id];
    if (keyed === undefined) issues.push(`question "${question.id}" has no answer key`);
    else if (!optionIds.includes(keyed as DayQuizOptionId)) issues.push(`answer key for "${question.id}" references unknown option "${keyed}"`);
  }
  for (const id of Object.keys(quiz.key)) if (!ids.includes(id as DayQuizQuestionId)) issues.push(`answer key names unknown question "${id}"`);
  return issues;
};

/** Facilitator/server-only payload: the answer key lives beside the questions, never inside them. */
export const DayQuiz = Schema.Struct(DayQuizFields).pipe(
  Schema.check(Schema.makeFilter((quiz) => {
    const issues = dayQuizIssues(quiz);
    return issues.length > 0 ? issues : undefined;
  })),
);
export type DayQuiz = Schema.Schema.Type<typeof DayQuiz>;

export const ParticipantDayQuiz = Schema.Struct({questions: Schema.Array(SingleChoiceQuestion)});
export type ParticipantDayQuiz = Schema.Schema.Type<typeof ParticipantDayQuiz>;

export const decodeDayQuiz = (input: unknown): DayQuiz => Schema.decodeUnknownSync(DayQuiz)(input);

export const participantDayQuiz = (quiz: DayQuiz): ParticipantDayQuiz => ({questions: quiz.questions});

/** Client payload: the selected option id per question id. */
export const DayQuizAnswers = Schema.Record(Schema.String, Schema.String);
export type DayQuizAnswers = Schema.Schema.Type<typeof DayQuizAnswers>;

export type DayQuizAnswerIssue =
  | {readonly _tag: 'MissingAnswer'; readonly questionId: string}
  | {readonly _tag: 'UnknownQuestion'; readonly questionId: string}
  | {readonly _tag: 'UnknownOption'; readonly questionId: string; readonly optionId: string};

export interface DayQuizScore {
  readonly _tag: 'Scored';
  readonly score: number;
  readonly total: number;
  readonly results: ReadonlyArray<{readonly questionId: DayQuizQuestionId; readonly correct: boolean}>;
}

export type DayQuizScoring = DayQuizScore | {readonly _tag: 'Rejected'; readonly issues: ReadonlyArray<DayQuizAnswerIssue>};

/** Every question must be answered with one of its own option ids; the result reports correctness only, never the key. */
export const scoreDayQuiz = (quiz: DayQuiz, answers: DayQuizAnswers): DayQuizScoring => {
  const issues: DayQuizAnswerIssue[] = [];
  const known = new Set<string>(quiz.questions.map((question) => question.id));
  for (const questionId of Object.keys(answers)) if (!known.has(questionId)) issues.push({_tag: 'UnknownQuestion', questionId});
  for (const question of quiz.questions) {
    const optionId = answers[question.id];
    if (optionId === undefined) issues.push({_tag: 'MissingAnswer', questionId: question.id});
    else if (!question.options.some((option) => option.id === optionId)) issues.push({_tag: 'UnknownOption', questionId: question.id, optionId});
  }
  if (issues.length > 0) return {_tag: 'Rejected', issues};
  const results = quiz.questions.map((question) => ({questionId: question.id, correct: answers[question.id] === quiz.key[question.id]}));
  return {_tag: 'Scored', score: results.filter((result) => result.correct).length, total: results.length, results};
};
