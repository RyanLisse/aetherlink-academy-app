# Migrate legacy Academy rooms to v2

This runbook moves squad rooms from the legacy store (`server/store.mjs` file store or `server/postgres-store.mjs` with `server/schema/academy.sql`) into the v2 runtime table `academy_runtime.squad_rooms` (`apps/server/src/squad/schema.ts`).

The cutover needs Ryan's explicit GO. Nothing in this runbook deletes data. The source is only read, the target only receives inserts, and every record the tool cannot map goes to an exception file for review.

## What the tool does and does not write

`scripts/migrate-v2/run.mjs` inserts one `squad_rooms` row per legacy room it can map. For each row:

- The room `id`, room `code`, and `proof` object (the Proof slug) stay unchanged.
- `data.migration` holds the source identifiers: `sourceRoomId`, `sourceCode`, `sourceProofSlug`, and `sourceFingerprint` (sha256 of the source room JSON).
- `data.migration.historicalLessons` maps each legacy supportdag number the room uses to its historical lesson id, for example `"2": "legacy-v1:day-2"`. The table comes from the legacy day packs in `server/content.mjs` (`LEGACY_DAYS` in `scripts/migrate-v2/plan.mjs`). A legacy day never maps to a v2 curriculum lesson.
- Members who share a display name in one room move to `data.migration.retainedMembers`. They keep their records but lose rejoin access, because v2 `join` matches on display name. A verified ownership mapping keeps one of them joinable.
- The legacy member `access` object, including `access.resumeSecretHash`, is removed. Personal return links issued before cutover stop working. The removed member ids are listed in `data.migration.droppedAccessMemberIds`.
- The file store's embedded `requests` ledger is removed from the row. Its results already live in `evidence` and `handoffs`.

The tool never writes these:

- `academy_runtime.squad_sessions`, `facilitator_sessions`, or `login_states`. Every legacy browser, MCP, and facilitator session is invalidated at cutover. Participants rejoin with the room code and their name. Facilitators sign in again.
- `academy_curriculum.progress`, `academy_runtime.lesson_release`, or `academy_curriculum.rooms` (the course pin). No completion of a v2 lesson is inferred from legacy data.
- Legacy `decks` rows. The report counts them under `notMigrated`.

## Exceptions

`exceptions.json` lists one entry per problem. A room with a room-level exception is held back: it is not written to the target and stays intact in the source.

| `kind` | Room written? | Meaning |
| --- | --- | --- |
| `malformed-room` | no | The room lacks a uuid `id`, an uppercase `code`, `name`, `proof.slug`, a `members` array with string `id` and `name`, or `evidence` and `handoffs` arrays. |
| `unknown-day` | no | `room.day` is not a legacy supportdag 1 to 5. |
| `unknown-day-record` | yes | A `progressByDay` key, `evidence[].day`, or `handoffs[].day` is outside 1 to 5. The record is kept unchanged. |
| `duplicate-display-name` | yes | Two or more members share a display name. They are retained without access unless the ownership map verifies exactly one. |
| `target-conflict` | no | The target already holds this room id with different or missing migration metadata, or another room owns the code. The tool never overwrites it. |

## Prepare an ownership mapping

To keep one of several same-name members joinable, a facilitator confirms who owns which member record. Write the confirmations to a JSON file:

```json
{"verified":[{"roomId":"<room uuid>","memberId":"<member id>","verifiedBy":"<facilitator>","evidence":"<how ownership was confirmed>"}]}
```

Pass it with `--ownership-map <file>`. If the map verifies two members of the same name group, all of them stay retained.

## Run the migration

Run these steps at a fixed, announced moment outside class hours.

1. Get Ryan's GO for the cutover moment. Record it with the timestamp.
2. Freeze the legacy app. Announce the freeze to facilitators, stop new writes by stopping `academy-app` or putting it into maintenance, and note the legacy revision from `GET /game/health`.
3. Take a restorable snapshot of the legacy Postgres and of the v2 target database. Verify that the snapshot restores into a scratch database before you continue. For the file store, copy `rooms.json`.
4. Freeze the source into an export file, so every later step reads the same data:

	```sh
	node scripts/migrate-v2/inventory.mjs --source-url "$LEGACY_DATABASE_URL" --write-export /secure/path/academy-v1-export.json
	```

	The export holds room data, including participant names. Keep it outside the repository and delete it after the rollback window closes.
5. Read the inventory output. Check the per-day counts, the unknown-day counts, and the duplicate-name groups against what facilitators expect.
6. Run a dry run against the target. It reads the target in a read-only transaction and writes only the report:

	```sh
	node scripts/migrate-v2/run.mjs --source /secure/path/academy-v1-export.json --target "$V2_DATABASE_URL" --ownership-map /secure/path/ownership.json --out /secure/path/dry-run
	```

7. Review `report.json` and `exceptions.json` with a facilitator. Resolve duplicate names through the ownership map. Decide, per held room, whether to fix it by hand after cutover or to leave it in the source only.
8. Apply. `--apply` refuses to run without `--target` and `--i-have-a-snapshot`:

	```sh
	node scripts/migrate-v2/run.mjs --apply --i-have-a-snapshot --source /secure/path/academy-v1-export.json --target "$V2_DATABASE_URL" --ownership-map /secure/path/ownership.json --out /secure/path/apply
	```

	The apply takes an advisory lock and runs in one transaction. If it fails, nothing is written. Rerunning it is safe. A room already migrated with the same fingerprint counts as `alreadyMigrated` and is not inserted again.
9. Run the apply command a second time and confirm `inserted` is empty and every room is under `alreadyMigrated`.

Both scripts print usage with `--help`. Exit code 0 means the run finished (exceptions do not change it), 2 means refused or invalid arguments, 1 means an unexpected error.

## Verify before switching traffic

- [ ] `report.json` `rooms.inserted` plus `rooms.heldForReview` covers every legacy room id in the inventory.
- [ ] `SELECT count(*) FROM academy_runtime.squad_rooms WHERE data ? 'migration'` equals the inserted count.
- [ ] A sample room shows the same `id`, `code`, and `proof.slug` as in the legacy store.
- [ ] `academy_runtime.squad_sessions` holds no rows copied from legacy sessions.
- [ ] Every `exceptions.json` entry has an owner and a decision.
- [ ] In a browser against the v2 app, open one migrated squad as facilitator, rejoin as a participant by code and name, and open the room's Proof document.
- [ ] A retained same-name member cannot rejoin by name, and a verified one can.

## Switch the proxy

The Caddy proxy in `infra/proxy/Caddyfile` sends `academy.aetherlink.ai` to `ACADEMY_UPSTREAM`. To cut over, set `ACADEMY_UPSTREAM` to the v2 app upstream, reload Caddy, and repeat the browser checks through the public hostname. Record the old and new upstream values.

## Roll back

Rollback restores the previous state. It never deletes migrated rows by hand.

1. Point the proxy back. Set `ACADEMY_UPSTREAM` to the legacy upstream (default `127.0.0.1:4317`) and reload Caddy.
2. Unfreeze the legacy app. Its data was only read during the migration, so it resumes at the freeze point.
3. If the v2 target must return to its pre-migration state, restore the v2 snapshot from step 3. Do not run `DELETE` against `squad_rooms`.
4. Record operator, timestamp, the reason, and both upstream values. See [Rollback Academy](ROLLBACK.md) for the build rollback.

Writes made in v2 between cutover and rollback are not copied back to the legacy store. Say so to facilitators when you announce the rollback.

## Status

Built and tested against the synthetic fixtures in `scripts/migrate-v2/fixtures/` and a throwaway Postgres (`ACADEMY_MIGRATE_PG_TEST=1` in `tests/migrate-v2.test.mjs`). These remain open and need a production copy and GO: a dry run over a real production export, the migrated-squad browser check, and a rollback rehearsal.
