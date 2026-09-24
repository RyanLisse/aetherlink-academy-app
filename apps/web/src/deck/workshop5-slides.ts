/** AET-77 Workshop day 5 — AI-native SDLC.
 *  Outline SoT: handoffs/2026-09-24-academy-deploy-sdlc/OUTLINE-AET-77.md (PRODUCT-ACCEPT).
 *  Separate from Classroom teaching-day-1/2 cut — do not append into sourceSlides length.
 *  Lab pack: aetherlink-daily-brief-lab-s1 SOLO.md (7 steps). Concept: Anthropic AI-Native SDLC playbook.
 *  Forbidden: Classroom 1–2 curriculum rewrite; Eve dual-track.
 */
export const workshop5SourceSlides: ReadonlyArray<Record<string, unknown>> = [

/* ---------------------------------------------------------------------- */
/* Opening                                                                 */
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

/* ---------------------------------------------------------------------- */
/* Plan — SOLO 1                                                           */
/* ---------------------------------------------------------------------- */

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

{ // 5 — SOLO 1
  lessonId: "workshop-5",
  title: "Assignment — fill intent.md (SOLO 1)",
  kicker: "15 min · gate before step 2",
  subtitle: "Claude interviews one question at a time; human cuts.",
  type: "practice",
  layout: "exercise",
  timer: 15,
  visual: { tree: 0 },
  cards: [
    { title: "Path chip", body: "intent.md" }
  ],
  steps: [
    "Write one outcome sentence.",
    "List three stranger-verifiable success checks.",
    "State the hard boundary (what the agent may never touch).",
    "Name owners.",
    "Leave ≥1 OPEN — do not invent certainty."
  ],
  expected: "A committed intent.md a stranger can read and challenge.",
  check: "Gate: read the boundary aloud — wish ≠ rule → NEEDS REVISION, no step 2. yes/no",
  notes: "One outcome sentence · three stranger-verifiable success checks · hard boundary (what the agent may never touch) · owners · ≥1 OPEN. Claude interviews one question at a time; human cuts. Gate: read the boundary aloud — wish ≠ rule → NEEDS REVISION, no step 2. Map: SOLO step 1."
},

/* ---------------------------------------------------------------------- */
/* Spec — SOLO 2                                                           */
/* ---------------------------------------------------------------------- */

{ // 6
  lessonId: "workshop-5",
  title: "Spec + contract, test first",
  kicker: "Design compressed · still a gate",
  subtitle: "Keep a testable contract. Schema goes red before implementation green.",
  type: "concept",
  layout: "steps",
  visual: { stepKeys: true },
  items: [
    { label: "Quote sources", caption: "Spec cites reference/", detail: "No invented fields" },
    { label: "Schema test red", caption: "test/schema.test.ts", detail: "Fails before code" },
    { label: "Implement green", caption: "src/brief.ts + sample", detail: "npm test passes" }
  ],
  tagline: "Spec quotes sources; red before green.",
  notes: "Playbook collapses requirements+design into one session guided by skills; here we keep a testable contract. Spec quotes sources; schema test goes red before implementation green."
},

{ // 7 — SOLO 2
  lessonId: "workshop-5",
  title: "Assignment — docs/spec.md + schema test (SOLO 2)",
  kicker: "25 min · no renderer yet",
  subtitle: "Quoted examples → red schema test → green brief + sample.",
  type: "practice",
  layout: "exercise",
  timer: 25,
  visual: { tree: 0 },
  cards: [
    { title: "Path chips", body: "docs/spec.md\ntest/schema.test.ts\nsrc/brief.ts\nsample/brief.sample.json" }
  ],
  steps: [
    "For each field, quote one example from reference/ PDFs into docs/spec.md.",
    "Write test/schema.test.ts so it fails (red).",
    "Add src/brief.ts + sample/brief.sample.json until npm test is green.",
    "Confirm the test commit appears before brief.ts in git log."
  ],
  expected: "Spec with quoted sources; schema test green; test commit before implementation.",
  check: "Check: test commit before brief.ts in git log. yes/no",
  notes: "One quoted example per field from reference/ PDFs → test/schema.test.ts red → src/brief.ts + sample/brief.sample.json until npm test green. Check: test commit before brief.ts in git log. Map: SOLO step 2."
},

/* ---------------------------------------------------------------------- */
/* Design / plan mode — SOLO 3                                             */
/* ---------------------------------------------------------------------- */

{ // 8
  lessonId: "workshop-5",
  title: "Plan mode before any edit",
  kicker: "Build starts with plan.md",
  subtitle: "Claude Code plan mode = read-only until human accepts.",
  type: "concept",
  visual: { art: "gate" },
  cards: [
    { title: "Plan names", body: "Files\nOrder\nProof commands\nRisks" },
    { title: "After accept", body: "Approved plan is the audit trail\nthe PR later checks against" }
  ],
  tagline: "No edits until the gate opens.",
  notes: "Claude Code plan mode = read-only until human accepts. Plan names files, order, proof commands, risks. Approved plan is the audit trail the PR later checks against."
},

{ // 9 — SOLO 3
  lessonId: "workshop-5",
  title: "Assignment — design + ADR + plan with proof (SOLO 3)",
  kicker: "15 min · stranger could implement from the plan",
  subtitle: "Stay in plan mode until accept.",
  type: "practice",
  layout: "exercise",
  timer: 15,
  visual: { tree: 0 },
  cards: [
    { title: "Path chips", body: "docs/design.md\ndocs/decisions/\ndocs/plan.md" }
  ],
  steps: [
    "Write docs/design.md.",
    "Add one real ADR under docs/decisions/.",
    "Write docs/plan.md: ordered steps, exact paths, one proof command per step, rollback, gate before build.",
    "Remain in plan mode until a human accepts."
  ],
  expected: "A stranger could implement from the plan without guessing.",
  check: "Check: every step has a proof command + rollback. yes/no",
  notes: "docs/design.md · one real ADR in docs/decisions/ · docs/plan.md with ordered steps, exact paths, one proof command per step, rollback, gate before build. Plan mode until accept. Map: SOLO step 3."
},

/* ---------------------------------------------------------------------- */
/* Build — SOLO 4–5                                                        */
/* ---------------------------------------------------------------------- */

{ // 10
  lessonId: "workshop-5",
  title: "Build with a feedback loop",
  kicker: "Session verifies before you review",
  subtitle: "Give the agent a way to check its own work.",
  type: "concept",
  layout: "pillars",
  items: [
    { label: "Agent checks", caption: "tests / build / screenshot", detail: "Session verifies before you review" },
    { label: "Human reviews", caption: "intent + risk", detail: "Not every keystroke" },
    { label: "Today's bound", caption: "no shell / no write", detail: "for the brief agent" }
  ],
  tagline: "Proof in the session; judgment with the human.",
  notes: "Playbook: give the agent a way to check its own work (tests / build / screenshot). Humans review intent + risk, not every keystroke. Still: no shell/write for the brief agent today."
},

{ // 11 — SOLO 4
  lessonId: "workshop-5",
  title: "Assignment — render the sample (SOLO 4)",
  kicker: "25 min · first artifact, no API keys",
  subtitle: "Red render test → green sample HTML.",
  type: "practice",
  layout: "exercise",
  timer: 25,
  visual: { tree: 0 },
  cards: [
    { title: "Path chips", body: "test/render.test.ts\nsrc/render.ts\nout/latest.html" }
  ],
  steps: [
    "Write test/render.test.ts so it fails (red).",
    "Implement src/render.ts + sample main until green.",
    "Run npm run brief:sample → out/latest.html.",
    "Change one house-style rule test-first.",
    "Keep a 1440×900 screenshot for evidence."
  ],
  expected: "out/latest.html from the sample path; screenshot saved for evidence.",
  check: "Check: npm run brief:sample produces out/latest.html. yes/no",
  notes: "test/render.test.ts red → src/render.ts + sample main. npm run brief:sample → out/latest.html. Change one house-style rule test-first. Keep 1440×900 screenshot for evidence. Map: SOLO step 4."
},

{ // 12 — SOLO 5
  lessonId: "workshop-5",
  title: "Assignment — agent loop + one read-only tool (SOLO 5)",
  kicker: "20 min + live run · human after the run",
  subtitle: "Catch-up from reference sources.ts / agent.ts. Model: no shell, no write.",
  type: "practice",
  layout: "exercise",
  timer: 20,
  visual: { tree: 0 },
  cards: [
    { title: "Path chips", body: "reference/sources.ts\nreference/agent.ts\nrun.log" }
  ],
  steps: [
    "Catch up from reference sources.ts / agent.ts.",
    "Add one read-only tool (tool() + guarded()).",
    "Live npm run brief.",
    "Confirm every sentence traces to a run.log tool call."
  ],
  expected: "A live brief where every claim maps to a tool call in run.log.",
  check: "Check: no shell tool, no write tool; every sentence traceable. yes/no",
  notes: "Catch-up from reference sources.ts / agent.ts. Add one read-only tool (tool() + guarded()). Live npm run brief; every sentence traceable to run.log tool call. Model: no shell, no write. Map: SOLO step 5."
},

/* ---------------------------------------------------------------------- */
/* Test + Deploy — SOLO 6–7                                                */
/* ---------------------------------------------------------------------- */

{ // 13
  lessonId: "workshop-5",
  title: "Evidence is not a vibes check",
  kicker: "Test · continuous proof",
  subtitle: "Three real commands + screenshot + a reviewer who reran one command.",
  type: "concept",
  visual: { runner: [{ label: "exit 0", tone: "green" }, { label: "exit 0", tone: "green" }, { label: "exit 0", tone: "green" }] },
  cards: [
    { title: "Commands", body: "typecheck\ntest\nbrief (or sample)" },
    { title: "Evidence means", body: "Exit codes\nOne quoted line each\nScreenshot under docs/evidence/\nNamed reviewer (or self next day)" },
    { title: "Differences from PDFs", body: "Mark OPEN\nNever silent FAIL" }
  ],
  notes: "Playbook: continuous evals / session feedback. Lab: three real commands + screenshot + a reviewer who reran one command. Differences from PDFs = OPEN, not silent FAIL."
},

{ // 14 — SOLO 6
  lessonId: "workshop-5",
  title: "Assignment — docs/evidence.md (SOLO 6)",
  kicker: "15 min",
  subtitle: "Record proof a stranger can re-run.",
  type: "practice",
  layout: "exercise",
  timer: 15,
  visual: { mdfile: 0, mdName: "docs/evidence.md" },
  cards: [
    { title: "Path chips", body: "docs/evidence.md\ndocs/evidence/" }
  ],
  steps: [
    "Run typecheck · test · brief (or sample); record exit codes.",
    "Quote one line of output for each command.",
    "Save a screenshot under docs/evidence/.",
    "Name the reviewer (or write \"self next day\")."
  ],
  expected: "docs/evidence.md with commands, exit codes, quotes, screenshot path, reviewer.",
  check: "Check: three commands + screenshot path + reviewer name. yes/no",
  notes: "typecheck · test · brief (or sample) with exit codes + one quoted line each; screenshot under docs/evidence/; name the reviewer (or \"self next day\"). Map: SOLO step 6."
},

{ // 15
  lessonId: "workshop-5",
  title: "Human gate, then schedule",
  kicker: "Deploy · hooks as approval, humans at production",
  subtitle: "Agent acts up to the gate; production needs named approval.",
  type: "concept",
  layout: "steps",
  visual: { stepKeys: true, art: "gate" },
  items: [
    { label: "PR vs intent.md", caption: "Does the change match intent?" },
    { label: "docs/gate.md", caption: "PASS / FAIL / OPEN with quotes" },
    { label: "Schedule", caption: "cron / Actions weekday brief", detail: "Secrets only in vault" }
  ],
  tagline: "No PASS on unread checks. Credentials never in repo.",
  notes: "Playbook: agent acts up to the gate; production needs named approval. Lab: PR vs intent.md → docs/gate.md PASS/FAIL/OPEN with quotes → cron / Actions for weekday brief; secrets only in vault."
},

{ // 16 — SOLO 7
  lessonId: "workshop-5",
  title: "Assignment — gate + schedule (SOLO 7)",
  kicker: "15 min · open the PR",
  subtitle: "Fill the gate. Schedule from the example CI shape.",
  type: "practice",
  layout: "exercise",
  timer: 15,
  visual: { mdfile: 0, mdName: "docs/gate.md" },
  cards: [
    { title: "Path chips", body: "docs/gate.md\ngitlab-ci.example.yml\n.github/workflows/" }
  ],
  steps: [
    "Fill docs/gate.md with PASS / FAIL / OPEN and quotes.",
    "Refuse PASS on unread checks.",
    "Confirm credentials are not in the repo.",
    "Shape the schedule from gitlab-ci.example.yml or GH Actions.",
    "Open the PR."
  ],
  expected: "Gate recorded; PR open; schedule shape committed or linked.",
  check: "Check: gate filled; no secrets in repo; PR open. yes/no",
  notes: "Fill docs/gate.md; no PASS on unread checks; credentials never in repo. Schedule shape from gitlab-ci.example.yml / GH Actions. Map: SOLO step 7."
},

/* ---------------------------------------------------------------------- */
/* Close                                                                   */
/* ---------------------------------------------------------------------- */

{ // 17
  lessonId: "workshop-5",
  title: "Close the loop",
  kicker: "Maintain → new intent",
  subtitle: "Production signal / footnote becomes the next intent.md.",
  type: "concept",
  layout: "steps",
  visual: { stepKeys: true, art: "loop", loopCaptions: true },
  items: [
    { label: "Run today", caption: "Merged brief in production" },
    { label: "Signal / footnote", caption: "What broke or surprised" },
    { label: "New intent.md", caption: "Tomorrow's Plan starts here" },
    { label: "Human triage", caption: "fix-now / schedule / dismiss" }
  ],
  tagline: "Tomorrow's run reads what you merged today.",
  notes: "Playbook Stage 6: production signal / footnote becomes the next intent.md. Tomorrow's run reads what you merged today. Human still triages fix-now / schedule / dismiss."
},

{ // 18
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
  notes: "Seven files a stranger can point at · one brief you did not write · a gate you decided. Proof acceptance: intent + plan + verify-output + human gate recorded. Point to lab README / SOLO \"When you are done.\" Soft: templates (intent/plan/gate/review checklist) land with Herdr pack — Linear Done needs live screenshot of /workshop/5, not outline alone."
},

];
