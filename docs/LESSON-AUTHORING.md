# Academy Lesson Authoring checklist (Must B bar)

**SoT for new lessons:** every new Academy lesson (workshop day, course lesson, Arcade-taught concept stop) must include **all five** elements below before merge. Facilitators and Herdr gate PRs against this list ([AET-116](https://linear.app/aetherlink/issue/AET-116) · [AET-118](https://linear.app/aetherlink/issue/AET-118)).

Pattern inspired by [shareAI-lab/learn-claude-code](https://github.com/shareAI-lab/learn-claude-code) (MIT) — one mechanism, narrative first, diagrams, step-through sim, locale-complete. **Do not** iframe `learn.shareai.run` in production.

## Required elements (reject if any missing)

| # | Element | What “good” looks like | Out |
|---|---|---|---|
| **1** | **One mechanism** | Clear motto; progressive stack on a stable loop / vehicle (not a topic salad). | Slide walls of unrelated tips |
| **2** | **Mental-model narrative** | Short prose or speaker spine that explains *why* before slides/code (`lesson.lede` / worked example / README beat). | Dumping a blog post as a deck |
| **3** | **≥1 explanatory diagram** | SVG or interactive diagram that teaches structure (not decorative stock only). | Screenshot-only “Voordoen” with no diagram |
| **4** | **Concept simulation or step-through** | Learner can step a **preauthored** scenario (messages → tool_use → results, workflow beat, etc.) **without live API keys** for the concept path. Use Academy `ConceptSim` / `content/sims/*.json` (see below) or an in-room Lab that is itself a concept sim. | Hosted LLM required for the concept beat; production iframe to learn.shareai.run |
| **5** | **Locale-complete content** | For every UI locale Academy ships (`en` and `nl`), learner-facing narrative + sim copy match that locale. Content language = UI locale. | EN-only lessons under `nl` chrome (silent EN leak); placeholder/`TODO` NL; identical EN dump under `nl` |

Keep Apple bar / Uitleg → Voordoen → Zelf doen rhythm when retrofitting workshop days — **add** diagram + sim; do not delete pedagogy vehicles.

## Attaching a step-through sim (Slice 0 surface)

1. Add scenario JSON under `content/sims/<id>.json` matching `@academy/concept-sim`. Prefer `locales:{en,nl}` with real copy in both (required for Harness s01–s17). Flat EN-only fixtures are allowed only for surface proofs (e.g. Slice 0 `fixture-agent-loop`). Keep MIT `attribution` when porting from learn-claude-code.
2. Reference it from the day pack: `sims:[{id:'<id>',title:'…'}]` (see `content/days/model.mjs` — passed through `projectDayPack`).
3. Lesson panel renders `ConceptSimSlot` in-room (Academy-native; **not** LabEmbed iframe). Labs (Arcade) stay a separate slot under Lesson ([AET-87](https://linear.app/aetherlink/issue/AET-87) / [AET-115](https://linear.app/aetherlink/issue/AET-115)).
4. Catalog: authenticated `GET /game/sim-catalog?locale=en|nl`. Day pack: `GET /game/day-pack?locale=en|nl`.

Harness Engineering chapters attach the same way. Slice 1 ships **s01–s03** as day packs 8–10 under the **Harness Engineering** course template (`harnessCourseTemplate()` in `content/days/course.mjs`) with **real EN + real NL** (`copy:{en,nl}` + sim `locales`). Diagrams live under `public/diagrams/harness/` and are declared on the day pack as `diagrams:[{src,title,alt}]`.

## PR DoD (B2)

New lesson / day-pack PRs must:

- [ ] Link this checklist (`docs/LESSON-AUTHORING.md`)
- [ ] Call out the five elements (mechanism · narrative · diagram · concept sim · locale-complete) with file paths
- [ ] Confirm no production iframe to `learn.shareai.run`
- [ ] Retain MIT attribution on ported scenario/diagram assets
- [ ] Soft-live both `en` and `nl` chrome for any new Harness / locale-complete lesson

Failing the bar = **REJECT** until fixed.

## Retrofit priority (Must B · not Slice 0)

P0 Workshop 5 (AET-77) → P1 Workshop 4 (AET-80) → P2 Workshop 3 (AET-79). W6/W7 not forced. See PRODUCT-ACCEPT for the epic.

**P0 status:** Workshop 5 ships harness-loop diagram (`public/diagrams/workshop/w5-harness-loop.svg`) + ConceptSim `w5-sdlc-loop` (EN+NL) while keeping Apple bar / Uitleg→Voordoen→Zelf doen and the daily-brief lab vehicle.

**P1 status:** Workshop 4 ships ticket→tool_use→priority diagram (`public/diagrams/workshop/w4-ticket-tool-priority.svg`) + ConceptSim `w4-ticket-priority` (EN+NL) while keeping Apple bar / Uitleg→Voordoen→Zelf doen and SOLO 0–4 on aetherlink-day5-n8n-to-agent.

**P2 status:** Workshop 3 ships agency-ladder diagram (`public/diagrams/workshop/w3-agency-ladder.svg`) + ConceptSim `w3-agency-ladder` (EN+NL) while keeping Apple bar / Uitleg→Voordoen→Zelf doen and L1→L2 (L3 stretch) on the n8n triage starters. Must B P0–P2 complete.

**AET-76:** Classroom 2 day-pack completeness + Proof AC (use-case → Workshop 6 + Agent Capability Map + one artefact). Loop beats cite slides / P3 `c2-customize-stack`; no Cons slide rewrite.

**P3 status:** Classroom 1–2 retrofit (AET-129). Classroom 1 ships explore→plan→change→verify→commit diagram (`public/diagrams/classroom/c1-explore-plan-change-verify-commit.svg`) + ConceptSim `c1-agent-loop` (EN+NL). Classroom 2 ships customize-stack diagram (`public/diagrams/classroom/c2-customize-stack.svg`) + ConceptSim `c2-customize-stack` (EN+NL). Apple bar / Uitleg→Voordoen→Zelf doen and solos A1–A4 / A6–A13 kept. Do not rename Classroom→Workshop; W6/W7 not forced.
