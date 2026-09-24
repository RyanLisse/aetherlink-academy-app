/** AET-77 Workshop day 5 — AI-native SDLC (minimal face pass).
 *  Outline SoT: handoffs/2026-09-24-academy-deploy-sdlc/OUTLINE-AET-77.md
 *  Minimal SoT: HANDOFF-AET-77-MINIMAL.md + Ryan addendum (definition slides).
 *  Projector: title + one idea + optional path chip. Timers/checklists → notes (+ timer field for PresenterTools).
 *  Forbidden: Classroom 1–2 rewrite; Eve dual-track. n8n→Claude lock stays.
 */
export const workshop5SourceSlides: ReadonlyArray<Record<string, unknown>> = [

/* ---------------------------------------------------------------------- */
/* Opening (slides 1–4 unchanged)                                          */
/* ---------------------------------------------------------------------- */

{ // 1
  lessonId: "workshop-5",
  title: "Workshop 5 — AI-native SDLC",
  kicker: "Day 5 · after n8n + Agents SDK",
  subtitle: "One-day spine: artifact chain + human gates, then the daily-brief lab.",
  type: "context",
  visual: { opener: "welcome", bot: "wave", place: "beside" },
  cards: [
    { title: "Leave with", body: "Seven files a stranger can point at\nOne brief you did not hand-write\nOne gate you decided" },
    { title: "Lab", body: "aetherlink-daily-brief-lab-s1\nSOLO.md · seven steps" }
  ],
  notes: "One-day spine. Goal: everyone leaves with seven files a stranger can point at, plus one brief they did not hand-write. Lab = daily-brief solo day."
},

{ // 2
  lessonId: "workshop-5",
  title: "Code is no longer the bottleneck",
  kicker: "Playbook · why we change the process",
  subtitle: "Agents collapse Build. Plan, Test, Deploy, and Maintain stay human-speed.",
  type: "concept",
  layout: "compare",
  columns: [
    { title: "What sped up", items: ["Typing the change", "Boilerplate diffs", "First draft of tests"], foot: "Build collapses" },
    { title: "What did not", items: ["Accepting intent", "Risk review", "Production approval", "Maintain triage"], foot: "Human gates remain" }
  ],
  tagline: "Rebuild the loop around committed artifacts + gates.",
  notes: "Agents collapse Build; Plan / Test / Deploy / Maintain stay human-speed. Controls that assume every line is human-written break. Today we rebuild the loop around committed artifacts + gates."
},

{ // 3 — artifact-chain diagram
  lessonId: "workshop-5",
  title: "The artifact chain",
  kicker: "Every stage ends in git",
  subtitle: "Walk the chain. Human attention concentrates at accept gates.",
  type: "concept",
  layout: "steps",
  visual: { stepKeys: true },
  items: [
    { label: "intent.md", caption: "Plan", detail: "Accepted intent" },
    { label: "spec.md", caption: "Design", detail: "Testable contract" },
    { label: "plan.md", caption: "Design / Build", detail: "Ordered proof plan" },
    { label: "diff + tests", caption: "Build", detail: "Verified change" },
    { label: "PR review", caption: "Test", detail: "Evidence in git" },
    { label: "gate.md", caption: "Deploy", detail: "Named approval" },
    { label: "new intent", caption: "Maintain", detail: "Loop closes" }
  ],
  tagline: "intent → spec → plan → diff/tests → PR → gate → new intent",
  notes: "Walk intent.md → spec.md → plan.md → diff+tests → PR review → production loop → new intent. Human attention concentrates at accept gates, not at typing every file. Point at the chain; don't lecture the whole blog."
},

{ // 4
  lessonId: "workshop-5",
  title: "Intent is a committed artifact",
  kicker: "Plan · playbook intent.md",
  subtitle: "Originator's words, versioned, machine-actionable.",
  type: "concept",
  visual: { mdfile: 0, mdName: "intent.md" },
  cards: [
    { title: "intent.md", body: "Outcome sentence\nSuccess checks a stranger can verify\nHard boundary\nOwners\n≥1 OPEN" }
  ],
  tagline: "Product owner accepts before Design.",
  notes: "Originator's words, versioned, machine-actionable. Product owner accepts before Design. Lab file: intent.md (repo root)."
},

/* ---------------------------------------------------------------------- */
/* Definitions (Ryan addendum) + minimal assignments                       */
/* ---------------------------------------------------------------------- */

{ // 5 — definition: AI-native SDLC
  lessonId: "workshop-5",
  title: "AI-native SDLC",
  kicker: "Definition",
  subtitle: "Committed artifacts + human gates — agents collapse Build, not judgment.",
  type: "concept",
  tagline: "Plan → Design → Build → Test → Deploy → Maintain, with proof in git.",
  notes: "Frame the day: AI-native SDLC = the playbook loop rebuilt around versioned artifacts and accept gates. Build sped up; Plan/Test/Deploy/Maintain stay human-speed. Point back at the chain on slide 3."
},

{ // 6 — definition: intent.md
  lessonId: "workshop-5",
  title: "intent.md",
  kicker: "Definition · Plan",
  subtitle: "Originator intent, versioned in git, accepted before Design.",
  type: "concept",
  visual: { mdfile: 0, mdName: "intent.md" },
  cards: [
    { title: "intent.md", body: "One outcome · checks · boundary · owners · OPEN" }
  ],
  tagline: "Wish ≠ rule. The boundary is the gate.",
  notes: "Highlight file: repo-root intent.md. Outcome sentence, stranger-verifiable checks, hard boundary, owners, ≥1 OPEN. Product owner accepts before anyone starts Design."
},

{ // 7 — SOLO 1 assignment (minimal face)
  lessonId: "workshop-5",
  title: "Assignment — fill intent.md (SOLO 1)",
  kicker: "SOLO 1 · gate before step 2",
  subtitle: "Claude interviews one question at a time; human cuts.",
  type: "practice",
  timer: 15,
  visual: { mdfile: 0, mdName: "intent.md" },
  cards: [
    { title: "intent.md", body: "Write the outcome a stranger can verify." }
  ],
  notes: "Timer: 15 min. Checklist: (1) one outcome sentence (2) three stranger-verifiable success checks (3) hard boundary — what the agent may never touch (4) owners (5) ≥1 OPEN — do not invent certainty. Gate: read the boundary aloud — wish ≠ rule → NEEDS REVISION, no step 2. Map: SOLO step 1."
},

{ // 8 — definition: spec.md
  lessonId: "workshop-5",
  title: "spec.md",
  kicker: "Definition · Design",
  subtitle: "A testable contract. Sources quoted; schema goes red before green.",
  type: "concept",
  visual: { mdfile: 0, mdName: "docs/spec.md" },
  cards: [
    { title: "docs/spec.md", body: "Quote sources · red test · then green" }
  ],
  tagline: "No invented fields. Red before implementation.",
  notes: "Highlight file: docs/spec.md (+ test/schema.test.ts). Spec quotes reference/ sources; schema test fails before brief.ts goes green. Still a human gate even when Design is compressed."
},

{ // 9 — SOLO 2
  lessonId: "workshop-5",
  title: "Assignment — docs/spec.md + schema test (SOLO 2)",
  kicker: "SOLO 2 · no renderer yet",
  subtitle: "Quoted examples → red schema test → green brief + sample.",
  type: "practice",
  timer: 25,
  visual: { mdfile: 0, mdName: "docs/spec.md" },
  cards: [
    { title: "docs/spec.md", body: "test/schema.test.ts · src/brief.ts" }
  ],
  notes: "Timer: 25 min. Checklist: (1) quote one example per field from reference/ PDFs into docs/spec.md (2) write test/schema.test.ts so it fails red (3) add src/brief.ts + sample/brief.sample.json until npm test green (4) confirm test commit before brief.ts in git log. Check: test commit before brief.ts in git log. yes/no. Map: SOLO step 2."
},

{ // 10 — definition: plan.md
  lessonId: "workshop-5",
  title: "plan.md",
  kicker: "Definition · Design / Build",
  subtitle: "Ordered steps, exact paths, proof commands — accepted before any edit.",
  type: "concept",
  visual: { mdfile: 0, mdName: "docs/plan.md" },
  cards: [
    { title: "docs/plan.md", body: "Steps · paths · proof · rollback · gate" }
  ],
  tagline: "Plan mode stays read-only until a human accepts.",
  notes: "Highlight file: docs/plan.md (with docs/design.md + one ADR). Approved plan is the audit trail the PR later checks against. No edits until the gate opens."
},

{ // 11 — SOLO 3
  lessonId: "workshop-5",
  title: "Assignment — design + ADR + plan with proof (SOLO 3)",
  kicker: "SOLO 3 · stranger could implement",
  subtitle: "Stay in plan mode until accept.",
  type: "practice",
  timer: 15,
  visual: { mdfile: 0, mdName: "docs/plan.md" },
  cards: [
    { title: "docs/plan.md", body: "docs/design.md · docs/decisions/" }
  ],
  notes: "Timer: 15 min. Checklist: (1) write docs/design.md (2) one real ADR under docs/decisions/ (3) docs/plan.md with ordered steps, exact paths, one proof command per step, rollback, gate before build (4) remain in plan mode until human accepts. Check: every step has a proof command + rollback. yes/no. Map: SOLO step 3."
},

{ // 12 — build concept (slim)
  lessonId: "workshop-5",
  title: "Build with a feedback loop",
  kicker: "Build",
  subtitle: "Agent checks its own work; human reviews intent + risk.",
  type: "concept",
  tagline: "Today: no shell / no write for the brief agent.",
  notes: "Playbook: give the agent tests / build / screenshot feedback. Humans review intent + risk, not every keystroke. Bound for today: no shell, no write on the brief agent."
},

{ // 13 — SOLO 4
  lessonId: "workshop-5",
  title: "Assignment — render the sample (SOLO 4)",
  kicker: "SOLO 4 · first artifact, no API keys",
  subtitle: "Red render test → green sample HTML.",
  type: "practice",
  timer: 25,
  visual: { mdfile: 0, mdName: "out/latest.html" },
  cards: [
    { title: "out/latest.html", body: "test/render.test.ts · src/render.ts" }
  ],
  notes: "Timer: 25 min. Checklist: (1) test/render.test.ts red (2) src/render.ts + sample main until green (3) npm run brief:sample → out/latest.html (4) change one house-style rule test-first (5) keep 1440×900 screenshot for evidence. Check: npm run brief:sample produces out/latest.html. yes/no. Map: SOLO step 4."
},

{ // 14 — SOLO 5
  lessonId: "workshop-5",
  title: "Assignment — agent loop + one read-only tool (SOLO 5)",
  kicker: "SOLO 5 · live run, then human",
  subtitle: "One read-only tool. No shell, no write.",
  type: "practice",
  timer: 20,
  visual: { tree: 0 },
  cards: [
    { title: "run.log", body: "reference/sources.ts · agent.ts" }
  ],
  notes: "Timer: 20 min + live run. Checklist: (1) catch up from reference sources.ts / agent.ts (2) add one read-only tool (tool() + guarded()) (3) live npm run brief (4) every sentence traces to a run.log tool call. Check: no shell tool, no write tool; every sentence traceable. yes/no. Map: SOLO step 5."
},

{ // 15 — evidence concept (slim)
  lessonId: "workshop-5",
  title: "Evidence is not a vibes check",
  kicker: "Test",
  subtitle: "Commands, exit codes, screenshot, named reviewer.",
  type: "concept",
  visual: { mdfile: 0, mdName: "docs/evidence.md" },
  tagline: "Differences from PDFs = OPEN, never silent FAIL.",
  notes: "Playbook: continuous proof. Lab: typecheck · test · brief (or sample) with exit codes + one quoted line each; screenshot under docs/evidence/; name the reviewer (or self next day)."
},

{ // 16 — SOLO 6
  lessonId: "workshop-5",
  title: "Assignment — docs/evidence.md (SOLO 6)",
  kicker: "SOLO 6 · proof a stranger can re-run",
  subtitle: "Record the three commands and the screenshot path.",
  type: "practice",
  timer: 15,
  visual: { mdfile: 0, mdName: "docs/evidence.md" },
  cards: [
    { title: "docs/evidence.md", body: "docs/evidence/ · reviewer name" }
  ],
  notes: "Timer: 15 min. Checklist: (1) run typecheck · test · brief (or sample); record exit codes (2) quote one line each (3) screenshot under docs/evidence/ (4) name the reviewer (or \"self next day\"). Check: three commands + screenshot path + reviewer name. yes/no. Map: SOLO step 6."
},

{ // 17 — gate concept (slim)
  lessonId: "workshop-5",
  title: "Human gate, then schedule",
  kicker: "Deploy",
  subtitle: "Agent acts up to the gate; production needs named approval.",
  type: "concept",
  visual: { mdfile: 0, mdName: "docs/gate.md" },
  tagline: "No PASS on unread checks. Credentials never in repo.",
  notes: "PR vs intent.md → docs/gate.md PASS/FAIL/OPEN with quotes → cron / Actions for weekday brief; secrets only in vault."
},

{ // 18 — SOLO 7
  lessonId: "workshop-5",
  title: "Assignment — gate + schedule (SOLO 7)",
  kicker: "SOLO 7 · open the PR",
  subtitle: "Fill the gate. Schedule from the example CI shape.",
  type: "practice",
  timer: 15,
  visual: { mdfile: 0, mdName: "docs/gate.md" },
  cards: [
    { title: "docs/gate.md", body: "gitlab-ci.example.yml · Actions" }
  ],
  notes: "Timer: 15 min. Checklist: (1) fill docs/gate.md with PASS/FAIL/OPEN and quotes (2) refuse PASS on unread checks (3) credentials not in repo (4) schedule shape from gitlab-ci.example.yml or GH Actions (5) open the PR. Check: gate filled; no secrets in repo; PR open. yes/no. Map: SOLO step 7."
},

{ // 19 — close
  lessonId: "workshop-5",
  title: "Close the loop",
  kicker: "Maintain → new intent",
  subtitle: "Production signal becomes the next intent.md.",
  type: "concept",
  tagline: "Tomorrow's run reads what you merged today.",
  notes: "Playbook Stage 6: production signal / footnote → next intent.md. Human triages fix-now / schedule / dismiss."
},

{ // 20 — recap
  lessonId: "workshop-5",
  title: "Recap + Proof",
  kicker: "Done when",
  subtitle: "Seven files · one brief you did not write · a gate you decided.",
  type: "recap",
  layout: "recap",
  visual: { levelUp: true },
  items: [
    { label: "intent.md", caption: "Plan accepted" },
    { label: "docs/spec.md", caption: "Contract + red→green" },
    { label: "docs/plan.md", caption: "Proof plan + ADR" },
    { label: "out/latest.html", caption: "Sample / live brief" },
    { label: "docs/evidence.md", caption: "Commands + screenshot" },
    { label: "docs/gate.md", caption: "Human decision" },
    { label: "PR open", caption: "Stranger can review" }
  ],
  tagline: "Proof acceptance: intent + plan + verify-output + human gate recorded.",
  notes: "Seven files a stranger can point at · one brief you did not write · a gate you decided. Point to lab README / SOLO \"When you are done.\""
},

];
