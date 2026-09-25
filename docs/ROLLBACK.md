# Rollback Academy

Rollback changes which build is serving; it does not reverse PostgreSQL migrations or restore documents. Before release, record the previous known-good commit and verify that the previous application version can read the current schema. Use additive migrations and keep old fields until the rollback window closes.

## Hetzner procedure

Academy runs on the Hetzner CX33 `aetherlink-academy` as sibling Docker. `main` pushes rebuild `academy-app` through the **Deploy Hetzner Academy** workflow, which SSHes to the box and runs `/root/aetherlink-academy/rebuild-from-git.sh <sha>`. Rollback is the same path driven at an older commit.

1. Identify the failed commit and the previous known-good commit from the release evidence. Note the SHA reported by `GET http://91.99.78.17:4317/game/health` (`revision`) before you change anything.
2. Redeploy the known-good commit, either:
   - **Actions:** run **Deploy Hetzner Academy** via `workflow_dispatch` against the known-good ref. The workflow takes no SHA input — it deploys the commit at the ref you dispatch, so point it at a branch or tag on that commit.
   - **Direct:** SSH to the box and run `/root/aetherlink-academy/rebuild-from-git.sh <known-good-sha>`.
3. The rebuild touches `academy-app` only. It must never wipe `academy-postgres` or `academy-redis` — if a procedure asks you to, stop and escalate.
4. Verify `GET /game/health` returns `{"ok":true,"proof":true}` with `revision` equal to the known-good SHA. Recheck document read/edit, reconnect, room state and MCP authentication.
5. Record operator, timestamp, both SHAs, the smoke artifact and any data compatibility issue.

The first deployment has no previous healthy version: it must remain unaccepted if it fails. Do not invent a recovery target.

Existing WebSockets may stay attached to the old container until they close, so browser/MCP reconnect checks must validate a new connection rather than an already-open tab.

If a schema change prevents safe application rollback, pause the release and escalate to the release owner with the exact incompatibility. Do not delete production data or apply a destructive reverse migration automatically.

## Roll back the v2 data cutover

The legacy to v2 room migration has its own rollback in [Migrate legacy Academy rooms to v2](MIGRATION-V2.md#roll-back). It points the proxy back to the legacy upstream, unfreezes the legacy app, and restores the v2 snapshot only when the target must return to its pre-migration state. The migration never deletes source data, and rollback never deletes migrated rows by hand. The cutover and any rollback of it need Ryan's GO.

## To confirm on the box

`rebuild-from-git.sh` lives on the VPS and is not in this repository, so the following are unverified from here and should be checked by whoever owns the host:

- Whether it retains the previous image for a faster revert than a full rebuild.
- Its behaviour when the requested SHA predates a migration that has already run.

## Retired

Academy no longer deploys to Vercel; the historical takedown is recorded in [Vercel Academy takedown](vercel-academy-takedown.md). Do not use `vercel rollback` / `vercel promote` for Academy. Apex and `www` marketing DNS may still point at Vercel — that is out of scope here.
