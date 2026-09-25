# AET-53 — Academy identity, app launcher, scoped adapters

**Status:** thin verifiable slice on `main` · **When:** 2026-09-23 · **Linear:** AET-53  
**Models:** architect design (executor / Opus-class contested identity); implement Luna/Sonnet-class on crabbox exe-dev `quick-barnacle`.

## Inventory (VERIFIED on tip `2b10463`)

| Surface | What exists | Better Auth? |
|---------|-------------|--------------|
| Google facilitator SSO | `/auth/google/start`, `/auth/google/callback`, `/auth/logout` via `server/google-sso.mjs` (OIDC auth-code + PKCE + JWKS) | **No** |
| Facilitator break-glass | Host creation key (`hostKey`) hashed; never returned by API | **No** |
| Facilitator session | HttpOnly cookie `academy-facilitator` (12h), Postgres or JSON store | **No** |
| Browser room session | Bearer/`academy` cookie, personId facilitator\|participant | **No** |
| Participant MCP | Rotating 256-bit token, five tools, room-scoped | **No** |
| Chat embed (Lane B PoC tip `76899ea`) | HMAC ticket mint → Chat `/_academy/embed/ticket` with `AGENT_CHAT_SHARED_SECRET`; **not** on Hetzner `main` yet | Upstream Chat may use Better Auth; Academy never shares that cookie |

**Conclusion:** Academy does **not** use Better Auth. Upstream agent-native templates do. Cross-app SSO therefore starts as **controlled sign-in / deeplink tickets**, not a shared Better Auth database or browser-wide static admin keys.

## Threat model (thin slice)

Forbidden:

- Putting `hostKey`, MCP tokens, Proof owner secrets, or `AGENT_CHAT_SHARED_SECRET` in URLs, query strings, or `sessionStorage` copied across origins.
- Browser-wide static admin keys for native apps.
- Auto-mutating a published Academy lesson / pinned classroom when an external editor changes a draft.

Allowed:

- Short-lived HMAC launch tickets (≤60s) minted by Academy after facilitator cookie **or** start-key **or** room browser session, scoped to `{appId, ownerId, role, roomId?}`.
- Feature flag `ACADEMY_PORTAL_LAUNCH=1` so Hetzner can ship inventory UI while Google SSO remains Ryan-ops blocked (AET-6).

## Org / owner mapping (per app)

Canonical record (in-memory + durable store):

```
AppOwnership {
  appId: assets|calendar|chat|clips|content|slides
  ownerKind: facilitator | participant | org
  ownerId: facilitator.sub|email OR participantId OR org slug
  orgId?: string
  resourceId?: lessonId|deckId|roomId
  grantedAt, expiresAt, revokedAt?
}
```

Rules:

- Facilitator can grant/revoke org-scoped launches for allowlisted apps in `infra/native-apps/apps.manifest.json`.
- Participant launches inherit room membership; revoke room session → launch grants for that person/room die.
- Lesson/deck ownership stays room-scoped (`slides` actor already enforces facilitator-or-creator delete).

## Scoped adapters + immutable publish

Adapter contract (`server/portal/adapters.mjs`):

1. **readCanonical(contentRef)** — load Academy lesson/day-pack/deck snapshot bytes + sha256.
2. **publishImmutable(appId, contentRef, actor)** — write `PublishedArtifact { contentSha256, publishedAt, publisher, sourceRef }` that is append-only; never update in place.
3. External edit of upstream draft **must not** rewrite `PublishedArtifact`. Pinning a classroom stores the published sha, not a live pointer.

Chat coordination (AET-56): reuse the same ticket shape as `server/chat-embed.mjs` on the PoC branch when that lands on main; portal launch for `chat` delegates to that mint when `AGENT_CHAT_*` is set, otherwise returns `status: unavailable`.

## Test matrix (thin slice)

| Case | Expect |
|------|--------|
| Facilitator vs participant | Participant cannot mint facilitator-scoped org launch; can mint room-scoped participant launch when in room |
| Two accounts | Distinct ownerIds; A cannot revoke B’s grant |
| Lesson/deck ownership | Publish records publisher; non-owner cannot republish over another’s pin |
| Revoke | After revoke, launch mint fails; published artifact remains readable |
| Back-nav | Launch payload includes `returnTo` Academy URL; chrome overlay (AET-51) shows “Back to Academy” |
| Google SSO disabled | `/game/config` → `googleSso:false`; portal still works with start-key path |

## Dependency notes

- **AET-6** Google SSO on Hetzner: Ryan ops (`GOOGLE_CLIENT_*`, `ACADEMY_FACILITATOR_DOMAINS`). Design/adapters land behind flags.
- **Do not** squash-merge diverged `poc/agent-native-app-suite` onto `main` (AET-56 decision). Cherry-pick contracts only.
- **AET-51** branding overlay is separate PR-capable slice sharing `infra/native-apps/` tokens.
