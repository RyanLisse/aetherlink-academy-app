# Native app provider and storage contract (AET-54)

This file is the provider, storage and secret-name contract for the native app
suite. It records names and ownership only. No account, bucket, OAuth client or
paid resource has been created for it, and none may be created from it.

Sources: `RUNTIME-AUDIT.md` (upstream BuilderIO/agent-native at
`adec853eb337cbe0ead48464305d6f30cc07806e`), `build/README.md`,
`build/chat-auth.patch`, `../poc/SLIDES.md` and `CAPACITY.md`. The upstream
templates are not checked out locally, so exact upstream env names that these
sources do not spell out are listed as open instead of guessed.

The machine-readable copy is the `providers` block of each app in
`apps.manifest.json`. Each app has a names-only env example in `env/`.
`node infra/native-apps/check-providers.mjs` fails when a required name is
missing from this file or the env example, when an env example carries a value,
when a connection lacks owner, retention, backup or budget, when a release
requirement has no provider contract, or when the Clips worker is enabled.

## Rules

- Production storage is managed object storage or a managed database. Local
  laptop files and host bind mounts of a developer checkout are never container
  persistence.
- Participants never share a personal provider key. A per-user connection
  belongs to that participant. An app-level key belongs to the account owner
  named below and lives only in OpenShip runtime secrets.
- No paid external resource is ordered without a concrete destination (project,
  region, account) and an approved budget line. "TBD by Ryan" blocks ordering.
- Each app keeps its own database and its own stable auth secret. No secret is
  reused across apps.
- Values never enter this repository. Env examples keep every value empty.
- Clips background jobs and the media worker stay disabled until single-worker
  ownership and resource limits are proven. An external media worker flag alone
  does not provision a worker.

## Shared open items

- The Better Auth secret env name for each generated app is not spelled out in
  the local sources. Confirm it against the generated scaffold before release.
- Account owner, retention, backup and budget are "TBD by Ryan" or `open` for
  every connection below.

## slides

Deployed separately (`../poc/SLIDES.md`). Required env: `DATABASE_URL`
(persistent PostgreSQL). Optional import/export/blob and generation providers
need separate acceptance before they are configured. No provider connection is
part of this contract.

## chat

Deployed without a provider connection. Required env: `DATABASE_URL` (dedicated
Chat database) and `AGENT_CHAT_SHARED_SECRET` (HMAC key for the Academy embed
ticket, read by `build/chat-auth.patch`).

| Connection | Scope | Options | Owner | Retention | Backup | Budget |
| --- | --- | --- | --- | --- | --- | --- |
| AI provider | per user | participant-owned provider connection | TBD by Ryan | open | open | TBD by Ryan |

Open: the provider env names in upstream `templates/chat`. Connections are per
participant, never a shared key.

## content

Deferred to AET-55. Required env: `DATABASE_URL`. Notion and Builder
integrations are optional and stay unconfigured until separately accepted.
Durable documents must not depend on laptop paths.

## assets

Required env: `DATABASE_URL` and the S3-compatible `ASSETS_STORAGE_*` family,
or Builder storage instead, for production uploads.

| Connection | Scope | Options | Owner | Retention | Backup | Budget |
| --- | --- | --- | --- | --- | --- | --- |
| Object storage | app | S3-compatible via `ASSETS_STORAGE_*`, or Builder storage | TBD by Ryan | open | open | TBD by Ryan |

Open: the exact `ASSETS_STORAGE_*` keys in upstream `templates/assets`. Image and
video generation providers are not needed for upload acceptance and stay
unconfigured.

## calendar

Deferred to AET-55. Required env: `DATABASE_URL`. Authentication is Google only.

| Connection | Scope | Options | Owner | Retention | Backup | Budget |
| --- | --- | --- | --- | --- | --- | --- |
| Google OAuth client | app | Google Cloud OAuth client (web application) | TBD by Ryan | open | open | TBD by Ryan |

Open: the OAuth env names and callback paths in upstream `templates/calendar`.
Register callbacks only on the final Calendar origin. Request identity scopes
first. Broader Calendar data scopes are requested only after identity login is
accepted. Zoom stays unconfigured. The Academy facilitator login client
(`GOOGLE_CLIENT_ID` in the root README) is a different client and is not reused.

## clips

Deferred to AET-55. Required env: `DATABASE_URL`.

| Connection | Scope | Options | Owner | Retention | Backup | Budget |
| --- | --- | --- | --- | --- | --- | --- |
| Media object storage | app | S3-compatible object storage | TBD by Ryan | open | open | TBD by Ryan |
| Transcription provider | app | open | TBD by Ryan | open | open | TBD by Ryan |

Open: the media storage and transcription env names in upstream
`templates/clips`. Google and Slack integrations are optional and stay
unconfigured.

Background worker gate: disabled by default (`backgroundWorker.enabled: false`
in the manifest). Enable it only after all of these are proven with evidence:

1. Single-worker ownership. Exactly one process runs interval and media jobs.
2. Resource limits. CPU and memory caps are set and observed under a real render.
3. Media capacity measured. Disk growth and render load fit the host
   (`CAPACITY.md`), or the worker runs on a separately approved host.
