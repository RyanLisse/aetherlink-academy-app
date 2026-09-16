# Progress — AetherLink Academy

Last updated: 2026-09-16 (Europe/Amsterdam) — AET-12 thin slice + AET-18 Vercel takedown guide

## Live

| Item | Status |
| --- | --- |
| App health | `GET http://91.99.78.17:4317/game/health` → `{"ok":true,"proof":true}` |
| Host | Hetzner CX33 NBG1 `aetherlink-academy` / `91.99.78.17` |
| Data | On-box TLS Postgres + Redis (`academy-net`); not Neon/Upstash |
| Deploy path | Sibling Docker + `/root/aetherlink-academy/rebuild-from-git.sh`; GitHub Actions on `main` (`ACADEMY_HETZNER_*` secrets) |
| Tip at cutover | Image/SHA tracked on VPS; Actions PRs #14 / #15 landed the workflow |

## In flight (Linear https://linear.app/aetherlink)

| ID | Title | Status |
| --- | --- | --- |
| AET-5 | C7 Classroom mode (PR #11) | In Review |
| AET-6 | A1 Google login verify (PR #12) | In Review |
| AET-7 | Epic B day packs / day 3 n8n (PR #13) | In Review |
| AET-8 | Epic C UI/UX polish | Backlog |
| AET-9 | Epic E verification / docs / Notion sync | Backlog |
| AET-10 | i18n English default + EN/NL toggle | In Progress |
| AET-12 | Thin slice: flexible squad + shuffle + soft rejoin | In Progress |
| AET-18 | Plan + takedown Vercel Academy (guide only) | In Progress |

## Blocked / parked

- **Openship edge + auto-deploy:** project linked to GitHub, but free `.opsh.io` routing needs Openship Cloud or a **custom domain** — sibling Docker remains deploy SoT until then
- **Vercel Hobby:** account/deployments paused (Fluid Active CPU / related limits) — leave alone until Hetzner cutover is accepted
- **Google facilitator SSO on Hetzner:** needs redirect URIs + env for `91.99.78.17:4317` (or future HTTPS domain) — see AET-6

## Recently decided

- Academy Linear SoT = https://linear.app/aetherlink (not `aetherlink-academy`)
- On-box everything for PG/Redis on the Academy VPS
- GitHub → rebuild sibling Docker (not Openship ship) until domain exists

## Next / related

- **AET-11** domain guide in-repo (`docs/domain-godaddy.md`) — **guide only**; live GoDaddy A record + TLS cutover is a follow-up (Ryan does registrar; ops/Herdr does VPS proxy). Do **not** mutate DNS from this PR.
- **AET-18** Vercel Academy takedown guide (`docs/vercel-academy-takedown.md`) — **guide only**; do **not** delete the Vercel project until Ryan GO. Leave apex/www alone.
- **AET-12** thin slice: lift hard cap 5→soft max 12, shuffle Driver/Navigator, soft rejoin by name+code. Phase advance already works (Plan→Maintain) — no code change.
- Related: AET-6 OAuth redirects once `https://academy.aetherlink.ai` is live; Openship edge remains blocked until custom domain attached.
