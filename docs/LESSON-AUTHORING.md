# Academy Lesson Authoring checklist (Must B bar)

**SoT for new lessons:** every new Academy lesson (workshop day, course lesson, Arcade-taught concept stop) must include **all four** elements below before merge. Facilitators and Herdr gate PRs against this list ([AET-116](https://linear.app/aetherlink/issue/AET-116) · [AET-118](https://linear.app/aetherlink/issue/AET-118)).

Pattern inspired by [shareAI-lab/learn-claude-code](https://github.com/shareAI-lab/learn-claude-code) (MIT) — one mechanism, narrative first, diagrams, step-through sim. **Do not** iframe `learn.shareai.run` in production.

## Required elements (reject if any missing)

| # | Element | What “good” looks like | Out |
|---|---|---|---|
| **1** | **One mechanism** | Clear motto; progressive stack on a stable loop / vehicle (not a topic salad). | Slide walls of unrelated tips |
| **2** | **Mental-model narrative** | Short prose or speaker spine that explains *why* before slides/code (`lesson.lede` / worked example / README beat). | Dumping a blog post as a deck |
| **3** | **≥1 explanatory diagram** | SVG or interactive diagram that teaches structure (not decorative stock only). | Screenshot-only “Voordoen” with no diagram |
| **4** | **Concept simulation or step-through** | Learner can step a **preauthored** scenario (messages → tool_use → results, workflow beat, etc.) **without live API keys** for the concept path. Use Academy `ConceptSim` / `content/sims/*.json` (see below) or an in-room Lab that is itself a concept sim. | Hosted LLM required for the concept beat; production iframe to learn.shareai.run |

Keep Apple bar / Uitleg → Voordoen → Zelf doen rhythm when retrofitting workshop days — **add** diagram + sim; do not delete pedagogy vehicles.

## Attaching a step-through sim (Slice 0 surface)

1. Add scenario JSON under `content/sims/<id>.json` matching `@academy/concept-sim` (`version`, `title`, `description`, `steps[]`). Keep MIT `attribution` when porting from learn-claude-code.
2. Reference it from the day pack: `sims:[{id:'<id>',title:'…'}]` (see `content/days/model.mjs` — passed through `projectDayPack`).
3. Lesson panel renders `ConceptSimSlot` in-room (Academy-native; **not** LabEmbed iframe). Labs (Arcade) stay a separate slot under Lesson ([AET-87](https://linear.app/aetherlink/issue/AET-87) / [AET-115](https://linear.app/aetherlink/issue/AET-115)).
4. Catalog: authenticated `GET /game/sim-catalog`.

Future Harness Engineering chapters **s01–s17** attach the same way (Slice 1+). Filename id should match chapter id (`s01`, …).

## PR DoD (B2)

New lesson / day-pack PRs must:

- [ ] Link this checklist (`docs/LESSON-AUTHORING.md`)
- [ ] Call out the four elements (mechanism · narrative · diagram · concept sim) with file paths
- [ ] Confirm no production iframe to `learn.shareai.run`
- [ ] Retain MIT attribution on ported scenario/diagram assets

Failing the bar = **REJECT** until fixed.

## Retrofit priority (Must B · not Slice 0)

P0 Workshop 5 (AET-77) → P1 Workshop 4 (AET-80) → P2 Workshop 3 (AET-79). W6/W7 not forced. See PRODUCT-ACCEPT for the epic.
