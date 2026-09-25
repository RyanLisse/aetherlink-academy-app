# apps/server/src/search

F3 full-text search (AET-32). Postgres `tsvector` columns with the `english` and `dutch` configurations, GIN-indexed, behind the `search_content` action in `@academy/actions`.

## Shape

- `documents.ts` lists the searchable fields per table and audience. It generates both the stored vectors in `db/schema.ts` (migration `0004_search_tsvector.sql`) and the query-time snippet text, so matching and snippets read the same fields.
- `public` fields are what the participant projection already exposes. `private` fields (`slides.notes`, `assignments.hints`) live in separate `private_search_*` columns that only a facilitator query reads. Slide `visual` (can hold a quiz answer) and `quiz_questions` are never indexed.
- `search-repo.ts` implements `ContentSearch` over the current published version of each course. A participant search takes the released-lesson allowlist as part of its `SearchAudience`, applied in the SQL `WHERE`. The `search_content` action builds that allowlist through `ReleasePolicy.isReleased` for `caller.roomId`, the same gate `get_lesson` uses.
- Hits carry `type`, `day`, `lessonId`, `lessonTitle`, `slideAnchor` (`slide-<lessonSlug>-<ordinal>`), `title`, a `ts_headline` snippet delimited by `<mark>`, and `rank`. Clients split the snippet into text runs and never parse it as HTML.

## Testing

```sh
pnpm --filter @academy/server run test:search-db   # real isolated Postgres, requires Docker
```

The fixture in `test/fixtures/search-curriculum.ts` is trimmed verbatim from `content/courses/worldline-wave-2/teaching-1/`.

## Gaps

- Glossary: `glossary_terms` exists (versioned, publish-immutable, indexed) but no importer writes it and `CourseAggregateDraft` has no glossary field. It stays empty until the importers issue supplies a source; nothing is invented.
- Transport: `search_content` is in the action registry but not in the MCP `inputSchemas` allowlist, and the server serves no HTTP action endpoint yet. The web reference view therefore searches its bundled decks through the same hit shape (`apps/web/src/reference/search.ts`).
- Version: search reads each course's `current_version`, not a room's pinned version.
- Glossary hits are course-level and not release-gated.
- Deck reader mode (`packages/deck`, unchanged) renders reading articles without ids and does not mount source visuals, so keynote-only slides read as titles. The web reference view attaches `slide-*` anchors by position.
