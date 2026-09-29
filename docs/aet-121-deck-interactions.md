# AET-121 — Classroom 1–2 deck interactions (audit + fix-forward)

**SoT pin:** `jyse/aetherlink-classroom-slides` @ `cons/cursus-aanpassingen` tip **`abde6d1b94f4065cb4ed2927b057d6f7866b3ec0`**
**Base tip:** `aa8b47209b5fbd6cd833d421ddcea09ec81e2ffb`

## Audit (ship start)

| Surface | SoT | Academy before this PR | Verdict |
|---|---|---|---|
| Slide array body | 91 slides | Byte-identical to SoT (`slides.ts` tip abde6d1b) | Already synced |
| Progressive reveals (`visual.reveal`, stepKeys, stagger…) | Yes | `packages/deck` source-visuals + revealStep | Already present |
| Quizzes (`visual.quiz`) | Yes | source-visuals + participant quiz-answer strip | Already present |
| Assignment / break timers (`layout: exercise`, countdown, quietTimer) | Yes | Exercise Timer + PresenterTools + visuals | Already present |
| Prompt panels | `prompt` field + toolbar | Deck prompt dialog + PresenterTools | Already present |
| Chapter nav | Chapters button | Deck chapters dialog | Already present |
| AetherBOT assets + demo fallback | `visual.bot` + `demo-fallback.js` | source-visuals + `demo-fallback.ts` | Already present |
| Teacher fullscreen without login | SoT index.html | `/classroom/{1,2}` DeckDemo — no auth gate | Already present |
| Presenter notes private | Separate `presenter.html` | **Gap:** projector in-page dialog painted notes on shared surface | **Fixed this PR** |
| Structured fields survive encode | SoT fields | `stepsHeading` / `detail` stripped by schema encode | **Fixed this PR** |
| Online platform follow | Optional | Soft residual (not required) | Soft residual OK |

## What this PR changes

1. Projector **Presenter view** / `S` opens a **separate** `?mode=presenter` window (notes never paint on the projector surface).
2. Browser-local presenter sync (BroadcastChannel + localStorage) so the notes window follows projector index.
3. Schema adds `stepsHeading` + `detail` so encode/decode does not silently flatten SoT fields.
4. Tests lock interaction inventory + notes privacy + open-window behaviour.

## Out / non-regress

- No Cons pedagogy rewrite; no Motian/Catapulze; days beyond 1–2 untouched.
- P3 C2 diagram / ConceptSim (AET-129) and day-pack Proof AC (AET-76) not touched.
- Naming remains Classroom 1–2 = `/classroom/1` · `/classroom/2`.
