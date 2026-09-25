# migrate-v2 fixtures (SYNTHETIC)

Every record in this directory is invented for tests. No room, person, e-mail address, session or hash comes from a real Academy instance. Names follow the placeholder pattern `Deelnemer A`, `Facilitator X`, and e-mail addresses use the reserved `example.invalid` domain. Room ids are the obviously fake `00000000-0000-4000-8000-000000000NNN`.

Do not replace these files with a production export. Real exports stay outside the repository.

| File | Shape | Covers |
| --- | --- | --- |
| `legacy-file-store.json` | `rooms.json` written by `server/store.mjs` | duplicate display names in one room (`Deelnemer A` / `deelnemer a `), a room on unknown day 7, a malformed room, progress and evidence on unknown day 9, members with and without `access.resumeSecretHash`, browser/MCP/facilitator sessions that must be dropped, an orphan session, an embedded request ledger |
| `legacy-postgres-export.json` | `academy-v1-postgres-export`, the format `inventory.mjs --write-export` produces from `server/schema/academy.sql` | duplicate names resolved by a verified ownership mapping, session/request/deck counts |
| `ownership-map.json` | `--ownership-map` input | one verified member for the duplicate-name room in the Postgres export |
