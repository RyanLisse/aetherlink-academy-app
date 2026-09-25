import {Context, Effect, Schema} from 'effect';
import {defineAction} from '../action.ts';
import {ReleasePolicy} from './release-policy.ts';

export const SearchLocale = Schema.Literals(['en', 'nl']);
export type SearchLocale = typeof SearchLocale.Type;

export const SearchHit = Schema.Struct({
  type: Schema.Literals(['slide', 'assignment', 'glossary']),
  day: Schema.NullOr(Schema.Number),
  lessonId: Schema.NullOr(Schema.String),
  lessonTitle: Schema.NullOr(Schema.String),
  /** `slide-<lessonSlug>-<ordinal>`; null for glossary terms and slide-less assignments. */
  slideAnchor: Schema.NullOr(Schema.String),
  title: Schema.String,
  snippet: Schema.String,
  rank: Schema.Number,
});
export type SearchHit = typeof SearchHit.Type;

/**
 * Who the search runs for. A participant search cannot be expressed without
 * the released-lesson allowlist, so the release gate is part of the query
 * contract rather than a post-filter a host could forget.
 */
export type SearchAudience =
  | {readonly kind: 'facilitator'}
  | {readonly kind: 'participant'; readonly releasedLessonIds: ReadonlyArray<string>};

export interface ContentSearchShape {
  /** Lesson ids of the searchable (currently published) curriculum. */
  readonly lessonIds: Effect.Effect<ReadonlyArray<string>, unknown>;
  readonly search: (request: {
    readonly query: string;
    readonly locale: SearchLocale;
    readonly audience: SearchAudience;
  }) => Effect.Effect<ReadonlyArray<SearchHit>, unknown>;
}

export class ContentSearch extends Context.Service<ContentSearch, ContentSearchShape>()('@academy/actions/ContentSearch') {}

export const searchContent = defineAction({
  name: 'search_content',
  input: Schema.Struct({
    query: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(200)),
    locale: SearchLocale,
  }),
  output: Schema.Struct({hits: Schema.Array(SearchHit)}),
  scope: 'both',
  intent: 'read',
  run: (input, caller) =>
    Effect.gen(function* () {
      const content = yield* ContentSearch;
      if (caller.role === 'facilitator') {
        return {hits: yield* content.search({...input, audience: {kind: 'facilitator'}})};
      }
      const policy = yield* ReleasePolicy;
      const lessonIds = yield* content.lessonIds;
      const released = yield* Effect.filter(lessonIds, (lessonId) => policy.isReleased(caller.roomId, lessonId), {concurrency: 'unbounded'});
      return {hits: yield* content.search({...input, audience: {kind: 'participant', releasedLessonIds: released}})};
    }),
});
