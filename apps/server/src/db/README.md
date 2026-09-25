# apps/server/src/db

Postgres schema and `CurriculumRepo` service for AET-22, backed by the existing `@effect/sql-pg` `PgClient` (no second connection pool, no second driver).

## Package versions

- `drizzle-orm@0.45.3`, `drizzle-kit@0.31.11` (`pg@8.16.3` and `@types/pg` are devDependencies only, required to typecheck `drizzle-orm/node-postgres`'s import of `pg`'s types; no `pg.Pool` is ever constructed).
- `effect@4.0.0-rc.117`, `@effect/sql-pg@4.0.0-rc.117`, `@effect/platform-node@4.0.0-rc.117` (unchanged, catalog-pinned).

## Why not `@effect/sql-drizzle`

The task's original build note called for `@effect/sql-drizzle`. At the time of writing, its latest published version (`0.51.0`) peer-depends on `effect@^3.22.0` and `@effect/sql@^0.52.0`; no `4.0.0-rc.x` release exists (`pnpm view @effect/sql-drizzle versions`). Installing it would pull a second, incompatible `effect` major version into a codebase pinned to Effect 4-rc, so it is not used.

Instead:

- `schema.ts` uses **drizzle-orm's table-definition and query-builder API only**, via `drizzle-kit generate` for migrations and `drizzle.mock({schema})` (a real `NodePgDatabase` bound to a stub client — see `drizzle-orm/node-postgres`'s `drizzle.mock`) to compile SQL. Nothing in this repo ever calls `.execute()` on that object; every call site ends at `.toSQL()`.
- `curriculum-repo.ts` takes `{sql, params}` from `.toSQL()` and runs it through `PgClient.unsafe(sql, params)` **inside the same `Effect.gen` fiber**, so it runs inside `sqlClient.withTransaction(...)` correctly. Running it via `Effect.runPromise` from inside an async callback (the usual `drizzle-orm/pg-proxy` pattern) would start a new fiber outside the ambient transaction's `TransactionConnection` context and silently escape the transaction — this file never does that.

### The `.toSQL()` alias gotcha

`db.select({camelCase: table.snake_case_column}).toSQL()` compiles to `select "snake_case_column" from ...` with **no alias** — the JS object key only matters when drizzle's own `.execute()` reshapes rows by position, which this repo never calls. Since `@effect/sql-pg` hands back rows keyed by the literal Postgres column name, every projection here aliases explicitly: `column.getSQL().as('camelCase')` (see the `as()` helper in `curriculum-repo.ts`). The same applies to computed expressions (`sql\`...\`` needs its own `.as(...)`); without it Postgres names the output column after its outermost function (e.g. `coalesce`), not the intended name.

## Versioning model

- `course_versions` composite PK `(course_id, version)`; `status` is `'draft' | 'published'`.
- `courses.current_version` is a nullable integer with a **composite FK** to `course_versions(course_id, version)` (Postgres skips the check when any column is null, so an unpublished course is unconstrained).
- Content tables (`tracks`, `days`, `lessons`, `slides`, `assignments`, `quiz_questions`) use a **composite primary key `(id, course_id, version)`**, not `id` alone — `id` is a stable logical id that repeats across versions (editing a lesson for v2 keeps its v1 id), and parent/child links are composite FKs `(parent_id, course_id, version) → parent(id, course_id, version)`, so a child can never point at a parent from a different version.
- `rooms.pinned_version` has a composite FK to `course_versions(course_id, version)`.

## Immutability: DB-enforced, not just method names

`0001_immutability_triggers.sql` and `0002_room_pin_invariants.sql` are **hand-authored** (drizzle-orm's schema DSL has no trigger support, so `drizzle-kit generate` cannot produce them) but are tracked in the same migration journal and applied by the same migrator:

- `course_versions`: `BEFORE UPDATE OR DELETE` — once `status = 'published'`, the row cannot change or be deleted.
- Content tables: `BEFORE INSERT OR UPDATE OR DELETE` — a row cannot be inserted into, moved into, updated in, or deleted from an already-published `(course_id, version)`. The check reads `course_versions` with `FOR SHARE`, which takes a row lock that serializes against a concurrent `publish()` transaction's `UPDATE course_versions SET status = 'published' ...` (which needs an exclusive lock on that same row), instead of racing it.
- `rooms`: `BEFORE INSERT` requires the pinned `(course_id, pinned_version)` to already be `'published'`; `BEFORE UPDATE OR DELETE` rejects any change — a room's pin is immutable once created.

A real, easy-to-repeat bug during development: a `BEFORE UPDATE` trigger that does `RETURN OLD` makes the write a silent no-op (the row reverts to its old values) instead of blocking it — only `RAISE EXCEPTION` blocks a write; `RETURN` supplies the row that gets written. Every trigger function here returns `NEW` for allowed `INSERT`/`UPDATE` and `OLD` only for `DELETE`.

## Effect-native migrations

`migrate.ts` reads the same `.sql` files `drizzle-kit generate` writes to `apps/server/drizzle/`, splits each on drizzle's own `--> statement-breakpoint` marker (the extended query protocol `sql.unsafe` uses cannot run more than one statement per call), and runs them through `@effect/sql-pg`'s `PgMigrator` (`effect/unstable/sql/Migrator` under the hood) — no `pg` driver, no drizzle-kit CLI connecting to the database.

One non-obvious adaptation: the shared `Migrator` engine treats migration id `0` as "no migrations applied yet" and silently skips a migration numbered `0` on a fresh database. `drizzle-kit` names its first migration file `0000_...`. The loader keeps drizzle-kit's own `0000`-based filenames (so `drizzle-kit generate` keeps working normally) but shifts the id it hands to the migrator by one (`Number(idText) + 1`).

Run migrations against any reachable Postgres:

```sh
pnpm --filter @academy/server run db:generate   # regenerate drizzle/*.sql from schema.ts after a schema change
```

`migrate.run` (exported from `migrate.ts`) is an `Effect` requiring `SqlClient | PgClient | FileSystem | Path | ChildProcessSpawner`; see `test/curriculum-db.test.ts` for how to provide it.

## Participant vs facilitator projections

`curriculum-repo.ts` selects an **explicit column allowlist** per audience — never `select *`, never a runtime key-strip:

- `readLessonFacilitator` selects plain-text `notes` and the quiz `answer`; `readLessonParticipant` does not select those columns at all. Nullable SQL optionals are omitted before decoding with the shared canonical schemas, while a valid JSON `visual: null` remains present.
- The participant slide projection strips the top-level `visual.quiz.answer` **in SQL** only when both `visual` and `visual.quiz` are JSON objects. Other valid shapes (scalars, null, arrays, quiz arrays, and unrelated nested answers) pass through unchanged. This mirrors `@academy/schema`'s existing `withoutVisualQuizAnswer` scope.
- `readLessonParticipant` returns rows only when the requested `(course_id, version)` is `published`; a draft revision (for example an unreviewed Notion import, AET-33) reads as empty for participants.
- `facilitator_credentials` (ciphertext only, no plaintext column exists) is never selected by any curriculum query in this file.

## Testing

```sh
pnpm --filter @academy/server run typecheck
pnpm --filter @academy/server run test              # unit tests; the real-Postgres suite is skipped by default
pnpm --filter @academy/server run test:curriculum-db # opt-in: starts an isolated Postgres container and fails if Docker is unavailable
```

`test/curriculum-db.test.ts` starts its own `postgres:16` container with a UUID name/owner and a dynamically allocated loopback port. Cleanup removes only a container carrying that exact owner label, so concurrent fixtures and unrelated containers are left untouched. Against that real database it proves:

- publishing v1 then v2 leaves a room pinned to v1 reading v1 content unchanged, a fresh room reads v2, and the same logical `id`s repeat across both versions;
- the participant projection excludes `notes` and the quiz `answer`, including the nested `visual.quiz.answer`, while unrelated nested data (`visual.art.quiz.answer`) is preserved;
- the participant projection preserves scalar, null, array, quiz-array, and unrelated nested JSON visuals, and facilitator/participant rows decode through the shared canonical schemas;
- concurrent `publish()` calls on the same course serialize and never produce a duplicate version;
- a publish that fails partway rolls back completely (pointer and revision list unchanged);
- direct SQL against a published revision — `UPDATE`, `DELETE`, or `INSERT` — is rejected by the triggers, as is flipping `course_versions.status` back to `'draft'`;
- a room cannot pin an unpublished revision and cannot be mutated once created;
- migrations are idempotent (a second run applies zero migrations).

Nothing in this test suite prints credentials or dumps environment variables; the container is removed in `afterAll` even when a test fails, and only its own owned container/port are touched.

## Limitations / out of scope

- `presenter_state`, `follow_state`, `progress`, `chat_threads`, `chat_message`, and `facilitator_credentials` have schemas and tables but no `CurriculumRepo` methods yet — the "Build" section of this issue scopes `CurriculumRepo` to read-by-version, publish, and list-revisions; runtime chat/presence/credential access is other wave work.
- No HTTP wiring: this package is not imported by `apps/server/src/app.ts`; that is out of scope for `apps/server/src/db`.
- `FacilitatorCredential` models ciphertext columns only; no encryption/decryption service exists in this repo (out of scope — "No actual auth/provider credentials").
