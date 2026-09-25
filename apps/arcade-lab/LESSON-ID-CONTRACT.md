# Lesson-id contract — Arcade solo ↔ aetherlab

**Owners:** AetherLink (product) + Herdr (package)  
**Linear:** AET-67 (parent AET-65)  
**Status:** proposed 2026-09-22 — Herdr ACK required before alternate ids  
**SoT of ids:** aetherlab `voice/says.json` / lesson modules (VERIFIED on box)

## Query param

| Key | Rules |
|-----|--------|
| `lesson` | Exact string match to a registered lesson `id`. No aliases, no short forms (`ws-1` alone is invalid). |
| Missing / empty | Load **`ws-1-eve-weather`** and show a soft banner “default lesson”. |
| Unknown id | Soft-fail: banner “unknown lesson”, still load `ws-1-eve-weather`. Do not 404 the shell. |

Canonical URL shape:

```
/arcade/solo?lesson=ws-1-eve-weather
```

Optional later (non-goals v1): `t=` seek seconds, `caption=mensentaal|tech`.

## Canonical lesson ids (do not rename)

| id | Workshop # | Track | Arcade hub entry |
|----|------------|-------|------------------|
| `ws-1-eve-weather` | 1 | Eve | `/arcade/weather` → Start solo |
| `ws-2-eve-state` | 2 | Eve | `/arcade/weather` |
| `ws-3-eve-approval` | 3 | Eve | `/arcade/weather` |
| `ws-2-eve-council` | 4 | Eve | `/arcade/council` |
| `ws-5-sdk-quickstart` | 5 | SDK | `/arcade/sdk-bridge` |
| `ws-3-sdk-weather` | 6 | SDK | `/arcade/sdk-bridge` |
| `ws-7-sdk-hooks` | 7 | SDK | `/arcade/sdk-bridge` |
| `ws-8-sdk-subagents` | 8 | SDK | `/arcade/sdk-bridge` |
| `ws-4-sdk-council` | 9 appendix | SDK | `/arcade/council` (optional) |
| `sample-counter` | sample | demo | hub “demo only” — not cohort path |

**Note:** Numeric prefixes in ids are **not** sequential workshop order (e.g. lesson 4 = `ws-2-eve-council`). Always use the full id string.

## Architecture.md mapping (resolved)

| Arcade route | Solo lesson ids |
|---|---|
| `/arcade/weather` | `ws-1-eve-weather`, `ws-2-eve-state`, `ws-3-eve-approval` |
| `/arcade/council` | `ws-2-eve-council` (+ optional `ws-4-sdk-council`) |
| `/arcade/sdk-bridge` | `ws-5-sdk-quickstart`, `ws-3-sdk-weather`, `ws-7-sdk-hooks`, `ws-8-sdk-subagents` |
| `/arcade` hub | “Start solo” → `/arcade/solo?lesson=ws-1-eve-weather` |

## Package surface (Herdr)

Player must expose a stable way for Academy to select a lesson by id:

1. **Preferred:** query string `?lesson=` on the player entry HTML/JS bundle Academy embeds/serves.
2. **Alt:** `window.__AETHERLAB_LESSON_ID__` set by Academy shell before boot — only if query cannot be forwarded.

Export for CI (Phase 2): `foldLesson(lesson, t)` — id lookup via same registry as the player.

## Forbidden

- Inventing parallel ids (`eve-weather-1`, `lesson-1`, …)
- Putting secrets in lesson `files[].text` or Arcade pages
- Hosted Eve iframe as requirement for solo v1
