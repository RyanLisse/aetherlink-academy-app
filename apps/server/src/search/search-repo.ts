import {PgClient} from '@effect/sql-pg';
import {Effect, Layer} from 'effect';
import {ContentSearch, type ContentSearchShape, type SearchAudience, type SearchHit, type SearchLocale} from '@academy/actions';
import {SEARCH_DOCUMENTS, textSql, type SearchConfig, type SearchDocument} from './documents.ts';

const LOCALES = {
  en: {config: 'english', vector: 'search_en', privateVector: 'private_search_en'},
  nl: {config: 'dutch', vector: 'search_nl', privateVector: 'private_search_nl'},
} as const satisfies Record<SearchLocale, {config: SearchConfig; vector: string; privateVector: string}>;

const HIT_LIMIT = 50;
const HEADLINE_OPTIONS = 'MaxFragments=1, MaxWords=24, MinWords=8, StartSel=<mark>, StopSel=</mark>';

type Locale = (typeof LOCALES)[SearchLocale];

/**
 * Per-document SQL for one audience. Participants match, rank and see snippets
 * from `public` fields only; facilitators add the `private` fields. Every
 * string here is a compile-time constant from `LOCALES` / `SEARCH_DOCUMENTS`,
 * never request input.
 */
const documentSql = (document: SearchDocument, locale: Locale, audience: SearchAudience) => {
  const facilitator = audience.kind === 'facilitator' && document.private.length > 0;
  return {
    match: facilitator ? `(${locale.vector} @@ q.tsq or ${locale.privateVector} @@ q.tsq)` : `${locale.vector} @@ q.tsq`,
    rank: facilitator ? `ts_rank(${locale.vector} || ${locale.privateVector}, q.tsq)::float8` : `ts_rank(${locale.vector}, q.tsq)::float8`,
    text: facilitator ? `${textSql(document.public)} || ' ' || ${textSql(document.private)}` : textSql(document.public),
  };
};

interface HitRow {
  readonly type: SearchHit['type'];
  readonly day: number | null;
  readonly lessonId: string | null;
  readonly lessonTitle: string | null;
  readonly slideAnchor: string | null;
  readonly title: string;
  readonly snippet: string;
  readonly rank: number;
}

export const ContentSearchPostgres: Layer.Layer<ContentSearch, never, PgClient.PgClient> = Layer.effect(
  ContentSearch,
  Effect.gen(function* () {
    const sql = yield* PgClient.PgClient;

    const lessonIds: ContentSearchShape['lessonIds'] = sql<{id: string}>`
      select distinct l.id::text as id
      from academy_curriculum.lessons l
      join academy_curriculum.courses c on c.id = l.course_id and c.current_version = l.version
    `.pipe(Effect.map((rows) => rows.map((row) => row.id)));

    const search: ContentSearchShape['search'] = ({query, locale, audience}) => {
      const loc = LOCALES[locale];
      const slide = documentSql(SEARCH_DOCUMENTS.slides, loc, audience);
      const assignment = documentSql(SEARCH_DOCUMENTS.assignments, loc, audience);
      const glossary = documentSql(SEARCH_DOCUMENTS.glossary_terms, loc, audience);
      const releaseGate =
        audience.kind === 'facilitator'
          ? sql.literal('true')
          : audience.releasedLessonIds.length === 0
            ? sql.literal('false')
            : sql`lesson_id::text in ${sql.in(audience.releasedLessonIds)}`;
      const headline = (text: string) => sql.literal(`ts_headline('${loc.config}'::regconfig, ${text}, q.tsq, '${HEADLINE_OPTIONS}')`);

      return sql<HitRow>`
        with q as (select websearch_to_tsquery(${sql.literal(`'${loc.config}'::regconfig`)}, ${query}) as tsq),
        cur as (
          select id as course_id, current_version as version
          from academy_curriculum.courses
          where current_version is not null
        ),
        hits as (
          select 'slide' as type, course_id, version, lesson_id, ordinal as slide_ordinal, title,
            ${sql.literal(slide.rank)} as rank, ${headline(slide.text)} as snippet
          from academy_curriculum.slides join cur using (course_id, version), q
          where ${sql.literal(slide.match)} and ${releaseGate}
          union all
          select 'assignment', a.course_id, a.version, a.lesson_id,
            (select s.ordinal from academy_curriculum.slides s where s.id = a.slide_id and s.course_id = a.course_id and s.version = a.version),
            coalesce(a.title ->> ${locale}, a.title ->> 'en'),
            ${sql.literal(assignment.rank)}, ${headline(assignment.text)}
          from academy_curriculum.assignments a join cur using (course_id, version), q
          where ${sql.literal(assignment.match)} and ${releaseGate}
          union all
          select 'glossary', course_id, version, null::uuid, null::integer, term,
            ${sql.literal(glossary.rank)}, ${headline(glossary.text)}
          from academy_curriculum.glossary_terms join cur using (course_id, version), q
          where locale = ${locale} and ${sql.literal(glossary.match)}
        )
        select h.type,
          d.ordinal as "day",
          h.lesson_id::text as "lessonId",
          coalesce(l.title ->> ${locale}, l.title ->> 'en') as "lessonTitle",
          case when h.slide_ordinal is not null then 'slide-' || l.slug || '-' || h.slide_ordinal end as "slideAnchor",
          h.title,
          h.snippet,
          h.rank
        from hits h
        left join academy_curriculum.lessons l on l.id = h.lesson_id and l.course_id = h.course_id and l.version = h.version
        left join academy_curriculum.days d on d.id = l.day_id and d.course_id = l.course_id and d.version = l.version
        order by h.rank desc, h.title
        limit ${HIT_LIMIT}
      `;
    };

    return {lessonIds, search} satisfies ContentSearchShape;
  }),
);
