/**
 * Which columns feed full-text search, per table and per audience. The same
 * field lists generate the stored `tsvector` columns in `db/schema.ts` and the
 * query-time snippet text in `search-repo.ts`, so "what a participant can
 * match" and "what a participant can see in a snippet" cannot drift apart.
 *
 * `public` fields are exactly what the participant projection already exposes.
 * `private` fields are facilitator-only: slide `notes` and progressive
 * assignment `hints`. Slide `visual` is never indexed because it can carry a
 * quiz answer; quiz questions are not indexed at all.
 */

export type FieldKind = 'text' | 'json';
export type Weight = 'A' | 'B' | 'C';

export interface SearchField {
  readonly column: string;
  readonly kind: FieldKind;
  readonly weight: Weight;
}

export interface SearchDocument {
  readonly public: ReadonlyArray<SearchField>;
  readonly private: ReadonlyArray<SearchField>;
}

const text = (column: string, weight: Weight = 'B'): SearchField => ({column, kind: 'text', weight});
const json = (column: string, weight: Weight = 'C'): SearchField => ({column, kind: 'json', weight});

export const SEARCH_DOCUMENTS = {
  slides: {
    public: [
      text('title', 'A'),
      text('kicker'),
      text('subtitle'),
      text('expected'),
      text('check'),
      text('prompt'),
      text('tagline'),
      text('plan_b'),
      text('image_alt'),
      text('image_caption'),
      json('cards'),
      json('items'),
      json('columns'),
      json('steps'),
      json('concepts'),
      json('bars'),
    ],
    private: [text('notes')],
  },
  assignments: {
    public: [
      json('title', 'A'),
      json('goal', 'B'),
      json('steps'),
      json('checks'),
      json('allowed'),
      text('expected'),
      text('check'),
      text('stop'),
      text('stretch'),
    ],
    private: [json('hints')],
  },
  glossary_terms: {
    public: [text('term', 'A'), text('definition')],
    private: [],
  },
} as const satisfies Record<string, SearchDocument>;

export type SearchConfig = 'english' | 'dutch';

const vectorOf = (config: SearchConfig, field: SearchField): string => {
  const source =
    field.kind === 'text'
      ? `to_tsvector('${config}'::regconfig, coalesce("${field.column}", ''))`
      : `jsonb_to_tsvector('${config}'::regconfig, coalesce("${field.column}", '{}'::jsonb), '["string"]'::jsonb)`;
  return `setweight(${source}, '${field.weight}')`;
};

/** Immutable expression, valid inside `GENERATED ALWAYS AS (...) STORED`. */
export const vectorSql = (config: SearchConfig, fields: ReadonlyArray<SearchField>): string =>
  fields.length === 0 ? `''::tsvector` : fields.map((field) => vectorOf(config, field)).join(' || ');

const textOf = (field: SearchField): string =>
  field.kind === 'text'
    ? `coalesce("${field.column}", '')`
    : `coalesce((select string_agg(v #>> '{}', ' ') from jsonb_path_query("${field.column}", 'strict $.** ? (@.type() == "string")') as v), '')`;

/** Plain text for `ts_headline`. Uses subqueries, so it is query-time only, never a generated column. */
export const textSql = (fields: ReadonlyArray<SearchField>): string =>
  fields.length === 0 ? `''` : fields.map(textOf).join(` || ' ' || `);
