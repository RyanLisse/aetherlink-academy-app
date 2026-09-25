## Live follow-up — 2026-09-21

All five projects are now registered. Chat is deployed with HTTPS and tested
authentication/session persistence, but has no AI provider connection. The other
four remain registered without deployment. Earlier inventory below is the
pre-registration audit, not the final project status.

# Upstream app rollout requirements

Source: BuilderIO/agent-native at `adec853eb337cbe0ead48464305d6f30cc07806e`.
This is source inspection, not successful build/deployment acceptance.

| App | Required release work | Feature dependencies |
| --- | --- | --- |
| Chat | framework/auth/thread DB migrations; node-pty native build tools | Per-user provider connections; Academy tools require adapter |
| Content | framework + content/source DB migrations | Notion/Builder optional; durable documents must not depend on laptop paths |
| Assets | DB migrations; durable object storage; sharp/native dependencies | S3-compatible ASSETS_STORAGE_* or Builder storage for production uploads; image/video providers for generation |
| Calendar | DB migrations; Google-only authentication | Google OAuth client/callbacks; Calendar scopes separately; Zoom optional |
| Clips | DB migrations; durable media storage; ffmpeg/native media | Transcription provider; optional Google/Slack; deliberately operated background/media workers |
| Slides | already deployed separately; preserve existing project | Optional import/export/blob and generation providers need separate acceptance |

Use full monorepo build context for workspace:* dependencies or the official
scaffold with resolved package versions and a frozen lockfile. Copying only a
template folder leaves workspace dependencies unresolved. Node 24 and the
source-pinned package manager are the starting build contract. Each app requires
its own database and stable auth secrets; apply its production migration command
before routing traffic. Verify the generated Nitro Node entrypoint and all
external dependencies in the actual image.

Rollout order: existing Slides health → Chat → Content → Assets → Calendar →
Clips. Gate each on real authenticated browser operations, readback and restart
persistence. Keep Clips interval/background jobs disabled until single-worker
ownership and resource limits are verified. An external media worker flag alone
does not provision a worker.

Current status: only Academy and Slides are deployed. Five new apps have tracked
Linear work and a manifest but no new OpenShip projects or runtime acceptance.
OpenShip API credentials and app-specific provider/storage configuration are
outstanding. Local source checkout lacks dependencies; an `agent-native: command
not found` attempt is not evidence of a source compile failure.
