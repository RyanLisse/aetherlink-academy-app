# Slide decks (Effect-TS module)

Squad presentations inside Academy, reverse-engineered from the agent-native
[`templates/slides`](https://github.com/BuilderIO/agent-native/tree/main/templates/slides)
template and re-implemented in Effect-TS under `server/slides/`. The upstream
template is ~160k lines welded to the agent-native runtime (Dispatch, A2A,
Creative Context, TipTap/Yjs editor, Drizzle). Academy keeps the part that
matters for a workshop: the deck/slide model, the agent-facing action contract,
the wrapper/template HTML idiom, hash-guarded edits and the standalone HTML
export. The optional facilitator deck assistant (below) is the only model call;
without `OPENROUTER_API_KEY` the module needs no external service.

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
| `generate-slides-ai` + agent chat editing the open deck | Facilitator deck assistant (`server/deck-assistant.mjs`) | Model proposes operations as JSON; the server applies them through `createDeck` / `patchDeck` |
| Presenter view | `/decks/:deckId` in `apps/web` (`@academy/deck`) | Classroom-parity presenter, reveals, quiz, timers, Plan B, hidden slides |
| Sharing / org visibility, comments, versions, design-system indexing, image generation, PDF/PPTX/DOCX/URL import, PPTX & Google Slides export, real-time Yjs editing, A2A / Dispatch | not ported | Academy scopes a deck to one squad room; the "agent" is the participant's own Claude Code over the existing MCP bridge |

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

**MCP tools (participant or facilitator token):** `list_decks`, `get_deck`, `create_deck`,
`add_slide`, `update_slide`, `patch_deck`, `export_deck_html`. The Claude
instructions in `server/agent-setup.mjs` name them. Recommended agent loop, as
upstream: `create_deck` with an empty list, then `add_slide` per slide, read a
slide with `get_deck slideId` before `update_slide` and pass its `contentHash`
as `baseContentHash`.

Facilitators open **My learning coach → Copy for your Claude** from their room
on the public HTTPS app, then use the instructions in their own Claude Code.
`get_mission` confirms the room and facilitator role. `pin_classroom_deck`
selects an existing room deck for a classroom day and requires facilitator
access. It changes a mutable room overlay, not an immutable curriculum publication.
Copying fresh connection instructions revokes that room principal's previous MCP
token; access expires with the issuing browser session. This feature does not
start an embedded model or require an Anthropic API key.

**UI:** sidebar entry "Slide decks": list / create / duplicate / delete, slide
rail, scaled stage, keyboard navigation, fullscreen present, HTML export,
speaker notes subject to the server's facilitator/creator permissions. Decks refresh every few seconds so a
squad watches Claude's slides land.

## Authorisation

The actor is always derived from the Academy session, never from the payload:
`roomId` scopes every read and write, `role` is `facilitator` for the host seat
and `participant` otherwise, `source` is `ai` for MCP calls. Decks from another
room answer 404. Delete requires facilitator or creator. Stored HTML is
sanitised on every write (scripts, iframes, handlers, `javascript:` URLs,
`<style>`).

Full deck and single-slide responses include notes only for the facilitator or
deck creator. Other room participants may collaborate on slide content, but may
not edit existing notes; duplicating a deck removes notes they cannot read.
Participant exports omit notes; facilitator exports retain them and should be
treated as presenter material. This does not make squad deck content a private
curriculum draft; curriculum publication and hosted chat adapters remain separate
work tracked in AET-119.

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

## Classroom slides and the facilitator deck assistant

A slide can carry a structured `classroom` object with the same fields as
[`aetherlink-classroom-slides`](https://github.com/jyse/aetherlink-classroom-slides):
`title`, `kicker`, `subtitle`, `type` (context, concept, practice, review, quiz,
recap, pause), `layout` (cards, pillars, steps, compare, exercise, recap), `cards`,
`items`, `columns`, `steps`, `expected`, `check`, `prompt`, `tagline`, `keyPoints`,
`hidden`, `dark` and a validated `visual` subset (quiz answer, click reveal,
step-through, countdown/quiet timers, highlights). The server renders it to a static
`.fmd-slide` for thumbnails and HTML export, and keeps the structure for presenting.

- `keyPoints` and `visual.quiz.answer` are presenter data: like `notes`, only the
  facilitator or deck owner reads or writes them. Participants get the slide without them.
- An HTML edit (`updateSlide`, or `patch-slide` with `content`) makes the HTML
  authoritative and drops the structure. A `patch-slide` with `classroom` re-renders
  the HTML and keeps existing `keyPoints` when the patch omits them.
- `/game/decks/:deckId/present` redirects decks with classroom slides to `/decks/:deckId`,
  the `@academy/deck` renderer (projector, `?mode=presenter`, `?mode=follow`,
  `?mode=reader`). `?html=1` keeps the static viewer. The classroom overlay pin uses the same path.

The deck assistant is the facilitator's in-app chat on the Decks page (new deck) and
in the deck editor (current deck and slide):

1. `POST /game/decks/assistant` `{message, deckId?, slideId?, history?, locale?}` —
   facilitator session only; participants get 403.
2. The server sends the redacted request plus the deck state (titles and structure,
   the active slide in full, never `notes` or `keyPoints`) to a `:free` OpenRouter
   model with `data_collection: deny`.
3. The model answers with JSON operations (`add-slide`, `update-slide`,
   `delete-slide`, `reorder-slides`, optional `title`). `update-slide` merges onto the
   stored slide. Unknown slide ids or actions are rejected (502), not guessed.
4. The server applies them with `createDeck` or one `patchDeck` call guarded by the
   deck revision it showed the model, so schema, room scope, notes permission and
   conflicts behave as in the editor and MCP.

Configuration: `OPENROUTER_API_KEY` (shared with the leercoach),
`ACADEMY_DECK_ASSISTANT_MODEL` (defaults to `ACADEMY_COACH_MODEL`, must end in
`:free`), `ACADEMY_DECK_ASSISTANT_DAILY_CAP` (30 per room facilitator) and
`ACADEMY_DECK_ASSISTANT_TIMEOUT_MS` (45000). Calls count towards
`ACADEMY_COACH_PLATFORM_DAILY_CAP`. Without a key the panel explains that the
facilitator's own Claude Code can build decks over MCP (`create_deck`, `add_slide`,
`patch_deck` accept the same `classroom` object).
