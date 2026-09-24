# Vercel Academy takedown plan

Last updated 2026-09-21 (Europe/Amsterdam).

This is an operator checklist for the Academy Vercel project. It is intentionally separate from the domain work. No Vercel project is deleted by this change, and no takedown is accepted until Ryan gives an explicit GO after the Hetzner gates pass.

## Current state

PR21 retired Vercel as the Academy runtime and established Hetzner plus GitHub Actions as the runtime and deployment SoT. The production DNS and HTTPS gates for the custom hostname are still open. `academy.aetherlink.ai` currently returns NXDOMAIN, so any remaining Vercel Academy project or URL must remain recoverable until the Hetzner hostname, TLS, browser live-sync, OAuth, and MCP checks are evidenced. The local Caddy verification in [`docs/domain-godaddy.md`](domain-godaddy.md) does not satisfy these production gates.

| Layer | SoT |
| --- | --- |
| Code | `main` in `RyanLisse/aetherlink-academy-app` |
| Runtime | Hetzner CX33 `aetherlink-academy` |
| Deploy | GitHub Actions and the host rebuild script |
| DNS | GoDaddy. The Academy record is still pending |

Leave the apex `aetherlink.ai`, `www`, MX, TXT, SPF, and DMARC records alone. Other Vercel projects are outside this action.

## Preconditions for Ryan GO

Record the source revision and evidence links before touching Vercel.

- `dig +short academy.aetherlink.ai A` returns `91.99.78.17` externally.
- `curl -fsS https://academy.aetherlink.ai/game/health` returns `ok: true` and `proof: true`.
- The browser classroom proves WebSocket and SSE updates through HTTPS.
- Facilitator Google OAuth callback succeeds on `https://academy.aetherlink.ai/auth/google/callback`.
- Participant MCP connects to `https://academy.aetherlink.ai/mcp`.
- The Hetzner GitHub Actions rebuild has a known source SHA and rollback operator.

Until every item is recorded, the production action is **OPEN**. Do not infer acceptance from a successful local build or a `200` response from a different host.

## Takedown steps. Ryan or Vercel operator after GO

1. Open the Vercel team that owns the Academy project and identify only the Academy project. Do not touch the marketing project or the apex and `www` domains.
2. Remove Academy-only custom hostnames from the project if they are still attached.
3. Disconnect the Git integration if the project is being retained for rollback. If the project is being deleted, verify the project name and team one more time.
4. Archive or delete only the Academy project after Ryan’s explicit GO. This document does not authorize that action.
5. Confirm the next `main` push still uses the Hetzner Actions rebuild path.
6. Record the project action, timestamp, operator, and resulting old URL behavior in release evidence.

The apex `aetherlink.ai`, `www`, MX, TXT, SPF, and DMARC records remain outside this task.

## Verification after takedown

Check the Academy hostname health, browser live-sync, Google login, and MCP again. Check that the marketing hostname still serves its own application. An old Academy URL may redirect or return `410`; record which behavior was configured rather than assuming one.

## Rollback

Re-import the repository into Vercel only with a new explicit Ryan GO. Prefer fixing the Hetzner route. Keep the GitHub repository and Hetzner deployment path intact.
