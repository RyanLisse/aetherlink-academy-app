# Intent — AetherLink Academy

## What this is

AetherLink Academy is a Dutch learning environment for squad-based workshops: a real ongoing Proof document, flexible squads (default ~4–5, soft max ~12) with one driver and navigators, facilitator controls, private quiz, source-bound knowledge, and evidence / review / handoff. Participants connect their own Claude Code via a limited MCP bridge. The app does **not** host model chat and does **not** ask for an Anthropic API key.

## Why it exists

Support Worldline / AetherLink Wave workshops (and related academy delivery) with a durable, multi-player learning runtime instead of slide-deck-only sessions.

## Non-goals

- Not a general LMS or LMS replacement
- Not Catapulze Job Intelligence (separate product / host)
- Not Motian runtime
- No open-ended paid spend or secrets in the repo
- Proof-SDK core forks only with an explicit lane

## Runtime / hosting intent

- **Source of truth for code:** this GitHub repo (`main`)
- **Production runtime (current):** Hetzner CX33 sibling Docker (on-box TLS Postgres + Redis); `main` push rebuilds via GitHub Actions
- **Control plane present but not shipping:** Openship on the same box (needs a custom domain before edge/auto-deploy)
- **Vercel Hobby:** paused after Fluid usage limits — do not rely on it until explicitly revived

## Product bar (Done)

Done means live behavior plus evidence (screenshot/video or linked proof), not a narrative-only ticket. Facilitator Google SSO, classroom mode, and day packs land behind review-first PRs until Ryan GO.

## Tracking

- Linear workspace: https://linear.app/aetherlink — project **AetherLink Academy**
- Team onboarding: https://linear.app/aetherlink/document/team-onboarding-aetherlink-academy-linear-7afe92a11071

## Workshop roster (AET-12 thin slice)

- Soft max squad size **12** (no hard fail at 5); practice still starts from **4** members.
- Facilitator **Shuffle roles** randomizes Driver among current members (others remain Navigator).
- Soft rejoin: same display name + room code restores the existing seat/role/progress (no email OTP).
