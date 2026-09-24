/** AET-77 Workshop day 5 — ultra-minimal keynote (Ryan HTML density SoT).
 *  PRODUCT-ACCEPT-AET-77-ULTRA-MINIMAL · SLIDE1-LINE-LOOP · LAB-THROUGHLINE · PEDAGOGY-RHYTHM
 *  Vehicle LOCKED: https://github.com/RyanLisse/aetherlink-daily-brief-lab-s1 (empty main)
 *  Face bar: eyebrow chip + one short huge sentence + ≤1 path/repo chip.
 *  Timers/checklists → presenter notes only. SOLO paths audited vs lab SOLO.md.
 *  Forbidden: Classroom 1–2 rewrite; Eve dual-track; card walls; finished agent on lab main.
 */
export const workshop5SourceSlides: ReadonlyArray<Record<string, unknown>> = [

/* ========== Framing ========== */

{ // 1 — Traditional line vs AI-native loop
  lessonId: "workshop-5",
  title: "The line vs the loop",
  kicker: "Workshop 5 · AI-native SDLC",
  type: "concept",
  visual: {
    keynote: true,
    opener: "showcase",
    image: "workshop-5/line-vs-loop-dark.png",
    imageLink: "Traditional — the line · AI-native — the loop"
  },
  notes: "Face = Traditional line vs AI-native loop (Academy-dark remake). Captions in notes only. Left: Plan→Design→Build→Test→Deploy→Maintain as a vertical line. Right: same stages as a Claude-centered clockwise loop. Humans above the loop instigate, direct, govern. Next: clone the lab."
},

{ // 2 — A1 lab vehicle (LOCKED URL)
  lessonId: "workshop-5",
  title: "Clone the lab, empty main on purpose.",
  kicker: "Workshop 5 · vehicle",
  type: "context",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Lab", body: "github.com/RyanLisse/aetherlink-daily-brief-lab-s1" }
  ],
  notes: "Through-line A1. Clone/fork https://github.com/RyanLisse/aetherlink-daily-brief-lab-s1 — main is empty on purpose (templates + package skeleton only). Walk SOLO 1–7 on your branch. Rhythm: uitleg → voordoen → zelf doen."
},

{ // 3
  lessonId: "workshop-5",
  title: "Code is no longer the bottleneck.",
  kicker: "Uitleg · why we change",
  type: "concept",
  visual: { keynote: true },
  notes: "Uitleg. Agents collapse Build. Plan, Test, Deploy, Maintain stay human-speed. Rebuild the loop inside aetherlink-daily-brief-lab-s1."
},

{ // 4 — AI-native SDLC def
  lessonId: "workshop-5",
  title: "AI-native SDLC",
  kicker: "Uitleg · Definition · the loop",
  type: "concept",
  visual: { keynote: true },
  notes: "Uitleg / definition. Plan · Design · Build · Test · Deploy · Maintain — artifacts + gates. Agents collapse Build, not judgment. Lab chain: intent.md → docs/spec.md → docs/plan.md → diff+tests → PR → docs/gate.md → new intent.md."
},

{ // 5 — artifact chain as one sentence (no steps wall)
  lessonId: "workshop-5",
  title: "intent → spec → plan → diff → PR → gate → intent.",
  kicker: "Uitleg · lab filenames",
  type: "concept",
  visual: { keynote: true },
  notes: "Uitleg · The artifact chain. Lab filenames exactly: intent.md → docs/spec.md → docs/plan.md → diff+tests → PR → docs/gate.md → new intent.md. Human attention at accept gates."
},

/* ========== Cycle SOLO 1 — Plan / intent ========== */

{ // 6 — intent.md def
  lessonId: "workshop-5",
  title: "intent.md",
  kicker: "Uitleg · Definition · SOLO 1",
  type: "concept",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "intent.md" }
  ],
  notes: "Uitleg. Lab locus: root intent.md (SOLO 1). Outcome · three stranger-verifiable checks · hard boundary · owners · ≥1 OPEN. Gate: wish ≠ rule."
},

{ // 7 — voordoen SOLO 1
  lessonId: "workshop-5",
  title: "Watch: interview into intent.md",
  kicker: "Voordoen · SOLO 1",
  type: "concept",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "intent.md" }
  ],
  notes: "Voordoen. Open lab intent.md; Claude Code interviews one question at a time; facilitator cuts live — boundary must be a rule, not a wish."
},

{ // 8 — SOLO 1
  lessonId: "workshop-5",
  title: "Write the outcome a stranger can verify.",
  kicker: "SOLO 1 / 7 · Zelf doen",
  type: "practice",
  timer: 15,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "intent.md" }
  ],
  notes: "Zelf doen — fill intent.md (SOLO 1 / 7). Open lab path: intent.md (repo root). Timer: 15 min. Checklist: (1) one outcome sentence (2) three stranger-verifiable success checks (3) hard boundary — what the agent may never touch (4) owners (5) ≥1 OPEN. Gate: read the boundary aloud — wish ≠ rule → NEEDS REVISION, no step 2. Map: SOLO step 1 · tag step-1-intent."
},

/* ========== Cycle SOLO 2 — Spec ========== */

{ // 9 — spec.md
  lessonId: "workshop-5",
  title: "spec.md",
  kicker: "Uitleg · Definition · SOLO 2",
  type: "concept",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "docs/spec.md" }
  ],
  notes: "Uitleg. Lab locus: docs/spec.md (SOLO 2). Quote reference/ PDFs → test/schema.test.ts red → src/brief.ts + sample/brief.sample.json green. No renderer yet."
},

{ // 10 — voordoen SOLO 2
  lessonId: "workshop-5",
  title: "Watch: red schema → green",
  kicker: "Voordoen · SOLO 2",
  type: "concept",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "docs/spec.md" }
  ],
  notes: "Voordoen. Quote one field from reference/ into docs/spec.md; show test/schema.test.ts fail red; then green with src/brief.ts. Test commit before brief.ts."
},

{ // 11 — SOLO 2
  lessonId: "workshop-5",
  title: "Quoted examples → red schema → green.",
  kicker: "SOLO 2 / 7 · Zelf doen",
  type: "practice",
  timer: 25,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "docs/spec.md" }
  ],
  notes: "Zelf doen — docs/spec.md + schema test (SOLO 2 / 7). Open lab path: docs/spec.md (also test/schema.test.ts · src/brief.ts · sample/brief.sample.json). Timer: 25 min. Checklist: (1) quote one example per field from reference/ into docs/spec.md (2) test/schema.test.ts fails red (3) src/brief.ts + sample/brief.sample.json until npm test green (4) test commit before brief.ts in git log. Check: test commit before brief.ts. yes/no. Map: SOLO step 2 · tag step-2-spec."
},

/* ========== Cycle SOLO 3 — Design / plan ========== */

{ // 12 — plan.md
  lessonId: "workshop-5",
  title: "plan.md",
  kicker: "Uitleg · Definition · SOLO 3",
  type: "concept",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "docs/plan.md" }
  ],
  notes: "Uitleg. Lab locus: docs/plan.md (SOLO 3 also writes docs/design.md + one ADR under docs/decisions/). Ordered steps · exact paths · one proof command per step · rollback · gate before build. Read-only until accept."
},

{ // 13 — voordoen SOLO 3
  lessonId: "workshop-5",
  title: "Watch: plan mode until accept",
  kicker: "Voordoen · SOLO 3",
  type: "concept",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "docs/plan.md" }
  ],
  notes: "Voordoen. Stay in plan mode; sketch docs/plan.md with one proof command per step; pause at the human accept gate before any build files."
},

{ // 14 — SOLO 3
  lessonId: "workshop-5",
  title: "Stay in plan mode until a human accepts.",
  kicker: "SOLO 3 / 7 · Zelf doen",
  type: "practice",
  timer: 15,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "docs/plan.md" }
  ],
  notes: "Zelf doen — design + ADR + plan (SOLO 3 / 7). Open lab path: docs/plan.md (also docs/design.md · docs/decisions/). Timer: 15 min. Checklist: (1) docs/design.md (2) one real ADR under docs/decisions/ (3) docs/plan.md with ordered steps, exact paths, one proof command per step, rollback, gate before build (4) remain in plan mode until human accepts. Check: every step has a proof command + rollback. yes/no. Map: SOLO step 3 · tag step-3-design. Soft cue: subagents only when plan names a parallel read."
},

/* ========== Tooling cluster (sparse one-word faces) ========== */

{ // 15 — skills
  lessonId: "workshop-5",
  title: "skills",
  kicker: "Uitleg · Definition · when SOLO needs one",
  type: "concept",
  visual: { keynote: true },
  notes: "Uitleg. Optional slash skill when a later SOLO needs a reusable method. Soft cue: claude-code-skills-pack. Does not replace the daily-brief walk."
},

{ // 16 — CLAUDE.md
  lessonId: "workshop-5",
  title: "CLAUDE.md",
  kicker: "Uitleg · Definition · always-on",
  type: "concept",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "CLAUDE.md" }
  ],
  notes: "Uitleg. Lab always-on: root CLAUDE.md (with AGENTS.md · progress.md · SOLO.md). Humans own it; agents read it."
},

{ // 17 — progress.md
  lessonId: "workshop-5",
  title: "progress.md",
  kicker: "Uitleg · Definition · append each SOLO",
  type: "concept",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "progress.md" }
  ],
  notes: "Uitleg. Lab locus: root progress.md — append-only build log. Append after each SOLO."
},

/* ========== Cycle SOLO 4 — Build render ========== */

{ // 18 — voordoen SOLO 4 (uitleg folded into watch sentence)
  lessonId: "workshop-5",
  title: "Watch: brief:sample → out/latest.html",
  kicker: "Voordoen · SOLO 4",
  type: "concept",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "out/latest.html" }
  ],
  notes: "Voordoen / Build uitleg. Red render test → green; npm run brief:sample writes out/latest.html; open next to the PDF. No API keys. Bound today: no shell, no write on the brief agent."
},

{ // 19 — SOLO 4
  lessonId: "workshop-5",
  title: "Red render test → green sample HTML.",
  kicker: "SOLO 4 / 7 · Zelf doen",
  type: "practice",
  timer: 25,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "out/latest.html" }
  ],
  notes: "Zelf doen — render the sample (SOLO 4 / 7). Open lab path: out/latest.html (also test/render.test.ts · src/render.ts · src/main.ts). Timer: 25 min. Checklist: (1) test/render.test.ts red (2) src/render.ts + sample-only src/main.ts until green (3) npm run brief:sample → out/latest.html (4) change one house-style rule test-first (5) keep 1440×900 screenshot for evidence. Check: npm run brief:sample produces out/latest.html. yes/no. Map: SOLO step 4 · tag step-4-build-render."
},

/* ========== Cycle SOLO 5 — Agent ========== */

{ // 20 — subagents
  lessonId: "workshop-5",
  title: "subagents",
  kicker: "Uitleg · Definition · SOLO 5",
  type: "concept",
  visual: { keynote: true },
  notes: "Uitleg. Lab locus: SOLO 5 (src/agent.ts · src/sources.ts). Spawn only when docs/plan.md names a parallel read. Delegate the work — not the accept."
},

{ // 21 — MCP
  lessonId: "workshop-5",
  title: "MCP",
  kicker: "Uitleg · Definition · only if needed",
  type: "concept",
  visual: { keynote: true },
  notes: "Uitleg. Lab: connected sources already show on the mcp=[…] line in run.log; add a server only if this step needs one. Daily-brief sources are env tokens + local files otherwise. n8n→Claude lock stays."
},

{ // 22 — voordoen SOLO 5
  lessonId: "workshop-5",
  title: "Watch: one read-only tool",
  kicker: "Voordoen · SOLO 5",
  type: "concept",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "src/agent.ts" }
  ],
  notes: "Voordoen. Catch up reference src/sources.ts · src/agent.ts · src/main.ts · test/agent.test.ts; add one read-only tool(); show no shell / no write; one sentence traced to run.log."
},

{ // 23 — SOLO 5
  lessonId: "workshop-5",
  title: "One read-only tool. No shell, no write.",
  kicker: "SOLO 5 / 7 · Zelf doen",
  type: "practice",
  timer: 20,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "src/agent.ts" }
  ],
  notes: "Zelf doen — agent loop + one read-only tool (SOLO 5 / 7). Open lab path: src/agent.ts (also src/sources.ts · run.log). Timer: 20 min + live run. Checklist: (1) git checkout step-5-build-agent -- src/sources.ts src/agent.ts src/main.ts test/agent.test.ts (2) add one read-only tool (tool() + guarded()) (3) live npm run brief (4) every sentence traces to a run.log tool call. Check: no shell tool, no write tool; every sentence traceable. yes/no. Map: SOLO step 5 · tag step-5-build-agent."
},

/* ========== Cycle SOLO 6 — Evidence ========== */

{ // 24 — evidence uitleg as one sentence (defs stay as named faces elsewhere)
  lessonId: "workshop-5",
  title: "Evidence is not a vibes check.",
  kicker: "Uitleg · Test · SOLO 6",
  type: "concept",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "docs/evidence.md" }
  ],
  notes: "Uitleg. Lab locus: docs/evidence.md. Three commands with exit codes + one quoted line each · screenshot under docs/evidence/ · named reviewer. Differences from PDFs are OPEN."
},

{ // 25 — voordoen SOLO 6
  lessonId: "workshop-5",
  title: "Watch: three commands + screenshot",
  kicker: "Voordoen · SOLO 6",
  type: "concept",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "docs/evidence.md" }
  ],
  notes: "Voordoen. Run typecheck · test · brief; paste exit codes + one quoted line each into docs/evidence.md; drop screenshot path; name a reviewer."
},

{ // 26 — SOLO 6
  lessonId: "workshop-5",
  title: "Proof a stranger can re-run.",
  kicker: "SOLO 6 / 7 · Zelf doen",
  type: "practice",
  timer: 15,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "docs/evidence.md" }
  ],
  notes: "Zelf doen — docs/evidence.md (SOLO 6 / 7). Open lab path: docs/evidence.md (also append progress.md · screenshot under docs/evidence/). Timer: 15 min. Checklist: (1) run typecheck · test · brief (or sample); record exit codes (2) quote one line each (3) screenshot under docs/evidence/ (4) name the reviewer (or \"self next day\"). Check: three commands + screenshot path + reviewer name. yes/no. Map: SOLO step 6 · tag step-6-evidence."
},

/* ========== Cycle SOLO 7 — Gate / deploy ========== */

{ // 27 — gate
  lessonId: "workshop-5",
  title: "Human gate, then schedule.",
  kicker: "Uitleg · Deploy · SOLO 7",
  type: "concept",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "docs/gate.md" }
  ],
  notes: "Uitleg. Lab locus: docs/gate.md (+ gitlab-ci.example.yml or GH Actions weekday schedule). PASS / FAIL / OPEN with quoted lines. Named approval required. Credentials in secrets only."
},

{ // 28 — hooks
  lessonId: "workshop-5",
  title: "hooks",
  kicker: "Uitleg · Definition · at docs/gate.md",
  type: "concept",
  visual: { keynote: true },
  notes: "Uitleg. Think hooks near the human gate — optional stop/ask when needed. Soft cue: skills-pack. Hooks ≠ named production approval."
},

{ // 29 — workflows
  lessonId: "workshop-5",
  title: "workflows",
  kicker: "Uitleg · Definition · SOLO 1–7 path",
  type: "concept",
  visual: { keynote: true },
  notes: "Uitleg. The seven SOLO steps in aetherlink-daily-brief-lab-s1 are the reusable workflow. Weekday schedule is SOLO 7 (Actions / cron)."
},

{ // 30 — voordoen SOLO 7
  lessonId: "workshop-5",
  title: "Watch: fill gate + open the PR",
  kicker: "Voordoen · SOLO 7",
  type: "concept",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "docs/gate.md" }
  ],
  notes: "Voordoen. Fill docs/gate.md PASS/FAIL/OPEN with quotes; refuse PASS on unread checks; point at gitlab-ci.example.yml; open a PR shape (no secrets)."
},

{ // 31 — SOLO 7
  lessonId: "workshop-5",
  title: "Fill the gate. Open the PR.",
  kicker: "SOLO 7 / 7 · Zelf doen",
  type: "practice",
  timer: 15,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "docs/gate.md" }
  ],
  notes: "Zelf doen — gate + schedule (SOLO 7 / 7). Open lab path: docs/gate.md (also gitlab-ci.example.yml · open the PR). Timer: 15 min. Checklist: (1) fill docs/gate.md with PASS/FAIL/OPEN and quotes (2) refuse PASS on unread checks (3) credentials not in repo (4) schedule shape from gitlab-ci.example.yml or GH Actions (5) open the PR. Check: gate filled; no secrets in repo; PR open. yes/no. Map: SOLO step 7 · tag step-7-gate-deploy."
},

/* ========== Close ========== */

{ // 32
  lessonId: "workshop-5",
  title: "Tomorrow's run reads what you merged today.",
  kicker: "Maintain → new intent.md",
  type: "concept",
  visual: { keynote: true },
  notes: "Close the loop. Production signal / footnote becomes the next intent.md in aetherlink-daily-brief-lab-s1."
},

{ // 33 — A6 recap (one sentence; seven files in notes)
  lessonId: "workshop-5",
  title: "Seven files. One brief. One gate.",
  kicker: "aetherlink-daily-brief-lab-s1 · done when",
  type: "recap",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Lab", body: "github.com/RyanLisse/aetherlink-daily-brief-lab-s1" }
  ],
  notes: "Recap + Proof. Done when seven lab files a stranger can point at: intent.md · docs/spec.md · docs/plan.md · out/latest.html · docs/evidence.md · docs/gate.md · PR open — plus one brief you did not write and a gate you decided — inside github.com/RyanLisse/aetherlink-daily-brief-lab-s1. Rhythm held: uitleg → voordoen → zelf doen."
},

];
