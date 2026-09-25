import {Schema} from 'effect';
import {CourseId, CourseVersion, DayId, TrackId} from './ids.ts';
import {LocalizedText} from './shared.ts';

export const DayKind = Schema.Literals(['teaching', 'support']);

export const Course = Schema.Struct({
  id: CourseId,
  title: LocalizedText,
  locale: Schema.Literals(['en', 'nl']),
  currentVersion: Schema.optional(CourseVersion),
  sourceGitUrl: Schema.String,
  sourceCommit: Schema.String,
});
export type Course = Schema.Schema.Type<typeof Course>;

export const Track = Schema.Struct({
  id: TrackId,
  courseId: CourseId,
  version: CourseVersion,
  ordinal: Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(1))),
  name: LocalizedText,
  caseLabel: Schema.optional(Schema.String),
});
export type Track = Schema.Schema.Type<typeof Track>;

/** Where an imported value came from. Only one-time imports set it; Academy-authored values omit it. */
export const ImportSource = Schema.Struct({
  system: Schema.Literal('notion'),
  pageUrl: Schema.String,
  retrievedAt: Schema.String,
  locator: Schema.optional(Schema.String),
});
export type ImportSource = Schema.Schema.Type<typeof ImportSource>;

export const DayScheduleEntry = Schema.Struct({
  label: LocalizedText,
  start: Schema.optional(Schema.String),
  end: Schema.optional(Schema.String),
  source: Schema.optional(ImportSource),
});
export type DayScheduleEntry = Schema.Schema.Type<typeof DayScheduleEntry>;

export const DayChecklistItem = Schema.Struct({...LocalizedText.fields, source: Schema.optional(ImportSource)});
export type DayChecklistItem = Schema.Schema.Type<typeof DayChecklistItem>;

export const Day = Schema.Struct({
  id: DayId,
  trackId: TrackId,
  courseId: CourseId,
  version: CourseVersion,
  ordinal: Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(1)), Schema.check(Schema.isLessThanOrEqualTo(7))),
  kind: DayKind,
  title: LocalizedText,
  ladder: Schema.optional(Schema.Array(Schema.String)),
  schedule: Schema.optional(Schema.Array(DayScheduleEntry)),
  checklist: Schema.optional(Schema.Array(DayChecklistItem)),
  guideUrl: Schema.optional(Schema.String),
  participantRepo: Schema.optional(Schema.String),
  agentRepo: Schema.optional(Schema.String),
});
export type Day = Schema.Schema.Type<typeof Day>;

export const decodeCourse = (input: unknown): Course => Schema.decodeUnknownSync(Course)(input);
export const decodeTrack = (input: unknown): Track => Schema.decodeUnknownSync(Track)(input);
export const decodeDay = (input: unknown): Day => Schema.decodeUnknownSync(Day)(input);
