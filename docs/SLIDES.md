# Slide decks (Effect-TS module)

Squad presentations inside Academy, reverse-engineered from the agent-native
[`templates/slides`](https://github.com/BuilderIO/agent-native/tree/main/templates/slides)
template and re-implemented in Effect-TS under `server/slides/`. The upstream
template is ~160k lines welded to the agent-native runtime (Dispatch, A2A,
Creative Context, TipTap/Yjs editor, Drizzle). Academy keeps the part that
matters for a workshop: the deck/slide model, the agent-facing action contract,
the wrapper/template HTML idiom, hash-guarded edits and the standalone HTML
export. No model call, no API key, no new external service.

## What was ported and what was left out

| Upstream | Academy | Notes |
| --- | --- | --- |
| `decks` row: id, title, `data` JSON, revision lock (`_deck-write.ts`, `withDeckLock`) | `decks` table (`id, room_id, revision, data jsonb`) + `DeckRepository.modify` | Locked read-modify-write; Postgres uses `SELECT … FOR UPDATE`, local mode a semaphore |
| `create-deck`, `add-slide`, `get-deck` (compact / `slideId`), `list-decks` | `createDeck`, `addSlide`, `getDeck`, `listDecks` | Same shapes: `contentHash`, `textPreview`, `slideNumber` 1-based |
| `update-slide` edits: replace (`find`, `occurrence`, `all`, `expectedMatches`), insert-before/after, replace-between, regex-replace, `baseContentHash`, one input mode | `updateSlide` + `server/slides/edits.ts` | Ordered, all-or-nothing; stale hash → 409, no match → 422 |
| `patch-deck` ops: patch-slide, delete-slide, reorder-slides, add-slide, patch-deck-fields; `updatedSlideIds` / `unchangedSlideIds` | `patchDeck` | Adds `expectedRevision` conflict (409) and `addedSlideIds` / `deletedSlideIds` |
| `delete-deck`, `duplicate-deck` | `deleteDeck`, `duplicateDeck` | Delete: facilitator or creator only |
| `export-html` viewer (scale-to-fit, arrows/space/Home/End, `F`, click zones) | `exportHtml` (`export-html.ts`) | Sanitised, inline script only, CSP on the route |
| `hashSlideContent` (FNV-1a), `sanitizeSlideContent`, `ensureUniqueSlideIds`, `.fmd-slide` wrapper with `--deck-*` / `--ds-*` tokens, title / content / two-column / image templates | `html.ts` | Hashes are byte-compatible with upstream |
| Aspect ratios 16:9, 4:3, 1:1, 9:16, 4:5 | `schema.ts` | Same canonical canvas sizes |
| Sharing / org visibility, comments, versions, design-system indexing, image generation, PDF/PPTX/DOCX/URL import, PPTX & Google Slides export, presenter view, real-time Yjs editing, A2A / Dispatch | not ported | Academy scopes a deck to one squad room; the "agent" is the participant's own Claude Code over the existing MCP bridge |

## Module layout

```
server/slides/
  schema.ts       Effect Schema: Deck, Slide, DesignSystem, all action inputs
  errors.ts       Data.TaggedError set + HTTP status mapping
  html.ts         hash, sanitiser, templates, id repair, text preview
  edits.ts        applySlideEdits (Effect<EditOutcome, EditFailed>)
  export-html.ts  renderDeckHtml
  repository.ts   DeckRepository tag; MemoryDeckRepository (JSON file) and PostgresDeckRepository layers
  actions.ts      makeDeckActions: the nine actions as Effect programs
  runtime.ts      createSlidesService → ManagedRuntime + promise adapter for Express/MCP
```

Node 24 strips types natively, so `server/app.mjs` imports `./slides/runtime.ts`
directly; there is no build step for the server. Only erasable TypeScript
syntax is used (no enums, namespaces or parameter properties).

## Surfaces

**HTTP (`/game/decks…`, squad session cookie or bearer):**
`GET /game/decks`, `POST /game/decks`, `GET /game/decks/:id[?slideId=&compact=true]`,
`POST /game/decks/:id/slides`, `PATCH /game/decks/:id/slides/:slideId`,
`PATCH /game/decks/:id`, `POST /game/decks/:id/duplicate`, `DELETE /game/decks/:id`,
`GET /game/decks/:id/export.html`.

**MCP tools (participant token):** `list_decks`, `get_deck`, `create_deck`,
`add_slide`, `update_slide`, `patch_deck`, `export_deck_html`. The Claude
instructions in `server/agent-setup.mjs` name them. Recommended agent loop, as
upstream: `create_deck` with an empty list, then `add_slide` per slide, read a
slide with `get_deck slideId` before `update_slide` and pass its `contentHash`
as `baseContentHash`.

**UI:** sidebar entry "Slide decks": list / create / duplicate / delete, slide
rail, scaled stage, keyboard navigation, fullscreen present, HTML export,
speaker notes for facilitator and driver. Decks refresh every few seconds so a
squad watches Claude's slides land.

## Authorisation

The actor is always derived from the Academy session, never from the payload:
`roomId` scopes every read and write, `role` is `facilitator` for the host seat
and `participant` otherwise, `source` is `ai` for MCP calls. Decks from another
room answer 404. Delete requires facilitator or creator. Stored HTML is
sanitised on every write (scripts, iframes, handlers, `javascript:` URLs,
`<style>`).

## Storage

Postgres: `decks` table in the Academy schema (`server/schema/academy.sql`,
migration `4`, previous `3` accepted for upgrade). Local mode
(`ACADEMY_STORAGE=local`): `.data/decks.json`.

## Tests

```sh
node --test tests/slides-edits.test.ts tests/slides-actions.test.ts tests/slides-routes.test.mjs
DATABASE_URL=… node --test tests/slides-postgres.test.ts
```


## Wave-1 teaching path (facilitators + agents)

Lesson authoring SoT is **Effect Slide decks** (UI + MCP, `server/slides`) — not Google Classroom overlay, and not a BuilderIO `templates/slides` runtime re-import.

1. **Author** the lesson in Slide decks (`/game/decks…`) and/or MCP slide tools (`list_decks`, `get_deck`, `create_deck`, `add_slide`, `update_slide`, `patch_deck`, `export_deck_html`).
2. **Pin** that deck as Classroom overlay for the room day (facilitator UI: "Pin as Classroom" / `PUT /game/classroom-overlay` with `{ deckId, day? }`). Already on main (AET-105 Slice B).
3. **Open Classroom** ("Open Classroom mode" / "Classroom-modus openen") teaches the Effect present view: `GET /game/decks/:id/present` (same HTML as `export.html`, inline, session cookie).
4. **Unpin** (`DELETE /game/classroom-overlay`) → falls back to same-origin `/classroom/{n}` (days 1–2) or `/workshop/{n}` (days 3–7) — Jessy/Cons and workshop packs.
5. **Google overlay deprecated** as teaching SoT. Do not document a Google iframe or `CLASSROOM_DECK_ID` as the Wave-1 path. Facilitator Google SSO login is unrelated and stays documented elsewhere.
6. **Cons** remains content SoT for static `/classroom/{n}` until a day is re-authored in-app and PRODUCT-ACCEPT’d. Pins do **not** promote to static `/classroom` routes.
