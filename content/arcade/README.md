# Agent Arcade content

Markdown modules loaded by `src/arcade/ArcadeApp.jsx` and listed in `arcade-manifest.json`.

## Routed modules (do not invent extra `/arcade` routes here)

| File | Manifest id | Route |
|---|---|---|
| `l1-weather.md` | `l1-weather` | `/arcade/weather` |
| `l2-council.md` | `l2-council` | `/arcade/council` |
| `sdk-bridge.md` | `sdk-bridge` | `/arcade/sdk-bridge` |
| `facilitator-notes.md` | facilitator | `/arcade` facilitator view |
| `facilitator-solo-note.md` | facilitator solo note | disclosure on solo shell |

## Workshop 4 companions (no new route)

| File | Role |
|---|---|
| `w4-solos-agents-ste100.md` | ≈80% ASD-STE100 English companion for W4 Solos/agents (AET-130) |
| `/academy-assets/w4-agents-council-explainer.mp4` | Explainer video (cut A); file lives in `public/academy-assets/` |

Linked from `l2-council.md` and from `apps/arcade-lab/workshop/05-w4-solos-agents-ste100.md`.

## Media pattern

Put learner-facing videos in `public/academy-assets/`. The hub walkthrough uses `/academy-assets/arcade-walkthrough-en.mp4`. Companions may deep-link the same way without adding `LESSON_MARKDOWN` entries until a product route is ready.
