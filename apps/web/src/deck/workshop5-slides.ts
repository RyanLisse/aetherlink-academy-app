/** AET-77 Workshop day 5 — Apple keynote + lab through-line + pedagogy rhythm.
 *  SoT: APPLE · LAB-THROUGHLINE A1–A6 · PEDAGOGY-RHYTHM (uitleg → voordoen → zelf doen)
 *  Vehicle: https://github.com/RyanLisse/aetherlink-daily-brief-lab-s1 (empty main on purpose)
 *  Soft cue: https://github.com/RyanLisse/claude-code-skills-pack
 *  Definitions: 11. Timers/checklists → presenter notes only.
 *  Forbidden: Classroom 1–2 rewrite; Eve dual-track; finished agent on lab main.
 */
export const workshop5SourceSlides: ReadonlyArray<Record<string, unknown>> = [

/* ========== Framing ========== */

{ // 1 — A1 lab vehicle
  lessonId: "workshop-5",
  title: "Clone the lab. Empty main on purpose.",
  kicker: "Workshop 5 · vehicle",
  type: "context",
  visual: { keynote: true, popOut: 0, chipIcons: ["🔗"] },
  cards: [
    { title: "Lab", body: "github.com/RyanLisse/aetherlink-daily-brief-lab-s1" }
  ],
  notes: "Through-line: attendees clone/fork aetherlink-daily-brief-lab-s1 and walk SOLO 1–7. main is empty on purpose — templates + package skeleton only; do not ship a finished agent on main. Full URL: https://github.com/RyanLisse/aetherlink-daily-brief-lab-s1. Rhythm today: uitleg → voordoen → zelf doen on their own machines."
},

{ // 2
  lessonId: "workshop-5",
  title: "Code is no longer the bottleneck",
  kicker: "Uitleg · why we change the process",
  type: "concept",
  layout: "compare",
  visual: { keynote: true },
  columns: [
    { title: "What sped up", items: ["Typing the change", "Boilerplate diffs", "First draft of tests"], foot: "Build collapses" },
    { title: "What did not", items: ["Accepting intent", "Risk review", "Production approval", "Maintain triage"], foot: "Human gates remain" }
  ],
  notes: "Uitleg. Agents collapse Build; Plan / Test / Deploy / Maintain stay human-speed. Rebuild the loop inside aetherlink-daily-brief-lab-s1."
},

{ // 3 — A3 chain
  lessonId: "workshop-5",
  title: "The artifact chain",
  kicker: "Uitleg · lab filenames",
  type: "concept",
  layout: "steps",
  visual: { keynote: true, stepKeys: true },
  items: [
    { label: "intent.md", caption: "Plan", detail: "Accepted intent" },
    { label: "docs/spec.md", caption: "Design", detail: "Testable contract" },
    { label: "docs/plan.md", caption: "Design / Build", detail: "Ordered proof plan" },
    { label: "diff + tests", caption: "Build", detail: "Verified change" },
    { label: "PR review", caption: "Test", detail: "Evidence in git" },
    { label: "docs/gate.md", caption: "Deploy", detail: "Named approval" },
    { label: "new intent.md", caption: "Maintain", detail: "Loop closes" }
  ],
  notes: "Uitleg. Lab chain exactly: intent.md → docs/spec.md → docs/plan.md → diff+tests → PR → docs/gate.md → new intent.md."
},

{ // 4 — AI-native SDLC def
  lessonId: "workshop-5",
  title: "AI-native SDLC",
  kicker: "Definition · lab through-line",
  type: "concept",
  layout: "steps",
  visual: { keynote: true, stepKeys: true, art: "loop", loopCaptions: true },
  items: [
    { label: "Plan", caption: "intent" },
    { label: "Design", caption: "spec · plan" },
    { label: "Build", caption: "diff · tests" },
    { label: "Test", caption: "evidence" },
    { label: "Deploy", caption: "gate" },
    { label: "Maintain", caption: "new intent" }
  ],
  notes: "Uitleg / definition. The loop you walk in aetherlink-daily-brief-lab-s1. Artifacts + gates. Agents collapse Build — not judgment."
},

/* ========== Cycle SOLO 1 — Plan / intent ========== */

{ // 5 — intent.md def
  lessonId: "workshop-5",
  title: "intent.md",
  kicker: "Uitleg · Definition · root · SOLO 1",
  type: "concept",
  visual: {
    keynote: true,
    popOut: 0,
    chipGrid: 1,
    chipIcons: ["❗", "✅", "🛑", "👤", "🔗"]
  },
  cards: [
    { title: "sections", body: "Problem\nOutcome\nConstraints / stop\nRoster\nArtifact chain" }
  ],
  notes: "Uitleg. Lab locus: root intent.md (SOLO 1). Soft cue: skills-pack examples/intent.md. Gate: wish ≠ rule."
},

{ // 6 — voordoen SOLO 1
  lessonId: "workshop-5",
  title: "Watch: interview into intent.md",
  kicker: "Voordoen · SOLO 1",
  type: "concept",
  visual: { keynote: true, popOut: 0, chipIcons: ["👁"] },
  cards: [
    { title: "Path", body: "intent.md" }
  ],
  notes: "Voordoen. Facilitator demo: open lab intent.md; Claude Code interviews one question at a time; facilitator cuts live (boundary must be a rule, not a wish). Attendees watch on projector — then they do it on their machine."
},

{ // 7 — SOLO 1
  lessonId: "workshop-5",
  title: "Write the outcome a stranger can verify.",
  kicker: "SOLO 1 / 7 · Zelf doen",
  type: "practice",
  timer: 15,
  visual: { keynote: true, popOut: 0, chipIcons: ["📄"] },
  cards: [
    { title: "Path", body: "intent.md" }
  ],
  notes: "Zelf doen — fill intent.md (SOLO 1 / 7). Open lab path: intent.md (repo root). Claude interviews one question at a time; human cuts. Timer: 15 min. Checklist: (1) one outcome sentence (2) three stranger-verifiable success checks (3) hard boundary — what the agent may never touch (4) owners (5) ≥1 OPEN — do not invent certainty. Gate: read the boundary aloud — wish ≠ rule → NEEDS REVISION, no step 2. Map: SOLO step 1 · tag step-1-intent."
},

/* ========== Cycle SOLO 2 — Spec ========== */

{ // 8 — spec.md
  lessonId: "workshop-5",
  title: "spec.md",
  kicker: "Uitleg · Definition · docs/spec.md · SOLO 2",
  type: "concept",
  visual: {
    keynote: true,
    mdfile: 0,
    mdName: "docs/spec.md",
    runner: [{ label: "schema red", tone: "red" }, { label: "schema green", tone: "green" }]
  },
  cards: [
    { title: "docs/spec.md", body: "Quoted fields\ntest/schema.test.ts\nsrc/brief.ts" }
  ],
  notes: "Uitleg. Lab locus: docs/spec.md (SOLO 2). Testable contract — red before green."
},

{ // 9 — voordoen SOLO 2
  lessonId: "workshop-5",
  title: "Watch: red schema → green",
  kicker: "Voordoen · SOLO 2",
  type: "concept",
  visual: { keynote: true, popOut: 0, chipIcons: ["👁"] },
  cards: [
    { title: "Path", body: "docs/spec.md" }
  ],
  notes: "Voordoen. Facilitator demo: quote one field from reference/ into docs/spec.md; show test/schema.test.ts fail red; then green with src/brief.ts. Emphasize test commit before brief.ts."
},

{ // 10 — SOLO 2
  lessonId: "workshop-5",
  title: "Quoted examples → red schema → green.",
  kicker: "SOLO 2 / 7 · Zelf doen",
  type: "practice",
  timer: 25,
  visual: { keynote: true, popOut: 0, chipIcons: ["📄"] },
  cards: [
    { title: "Path", body: "docs/spec.md" }
  ],
  notes: "Zelf doen — docs/spec.md + schema test (SOLO 2 / 7). Open lab path: docs/spec.md (also test/schema.test.ts · src/brief.ts · sample/brief.sample.json). Timer: 25 min. Checklist: (1) quote one example per field from reference/ PDFs into docs/spec.md (2) write test/schema.test.ts so it fails red (3) add src/brief.ts + sample/brief.sample.json until npm test green (4) confirm test commit before brief.ts in git log. Check: test commit before brief.ts in git log. yes/no. Map: SOLO step 2 · tag step-2-spec."
},

/* ========== Cycle SOLO 3 — Design / plan ========== */

{ // 11 — plan.md
  lessonId: "workshop-5",
  title: "plan.md",
  kicker: "Uitleg · Definition · docs/plan.md · SOLO 3",
  type: "concept",
  visual: { keynote: true, art: "gate", mdfile: 0, mdName: "docs/plan.md" },
  cards: [
    { title: "docs/plan.md", body: "Steps · Paths · Proof · Rollback · Gate" }
  ],
  notes: "Uitleg. Lab locus: docs/plan.md (SOLO 3 also writes docs/design.md + ADR under docs/decisions/). Read-only until accept."
},

{ // 12 — voordoen SOLO 3
  lessonId: "workshop-5",
  title: "Watch: plan mode until accept",
  kicker: "Voordoen · SOLO 3",
  type: "concept",
  visual: { keynote: true, popOut: 0, chipIcons: ["👁"] },
  cards: [
    { title: "Path", body: "docs/plan.md" }
  ],
  notes: "Voordoen. Facilitator demo: stay in plan mode; sketch docs/plan.md with one proof command per step; pause at the human accept gate before any build files."
},

{ // 13 — SOLO 3
  lessonId: "workshop-5",
  title: "Stay in plan mode until a human accepts.",
  kicker: "SOLO 3 / 7 · Zelf doen",
  type: "practice",
  timer: 15,
  visual: { keynote: true, popOut: 0, chipIcons: ["📄"] },
  cards: [
    { title: "Path", body: "docs/plan.md" }
  ],
  notes: "Zelf doen — design + ADR + plan (SOLO 3 / 7). Open lab path: docs/plan.md (also docs/design.md · docs/decisions/). Timer: 15 min. Checklist: (1) write docs/design.md (2) one real ADR under docs/decisions/ (3) docs/plan.md with ordered steps, exact paths, one proof command per step, rollback, gate before build (4) remain in plan mode until human accepts. Check: every step has a proof command + rollback. yes/no. Map: SOLO step 3 · tag step-3-design."
},

/* ========== Tooling uitleg before Build (not a defs wall — short cluster) ========== */

{ // 14 — skills
  lessonId: "workshop-5",
  title: "skills",
  kicker: "Uitleg · Definition · when SOLO needs a slash skill",
  type: "concept",
  visual: {
    keynote: true,
    popOut: 0,
    chipGrid: 1,
    chipIcons: ["🧠", "🧹", "✅", "🚢", "🗺", "📋"]
  },
  cards: [
    { title: "slash", body: "/eli5\n/deslop\n/verify-this\n/review-and-ship\n/archify\n/handoff" }
  ],
  notes: "Uitleg. Optional when a later SOLO needs a reusable method. Soft cue: claude-code-skills-pack. Does not replace the daily-brief walk."
},

{ // 15 — CLAUDE.md
  lessonId: "workshop-5",
  title: "CLAUDE.md",
  kicker: "Uitleg · Definition · root · agent instructions",
  type: "concept",
  visual: { keynote: true, popOut: 0, chipIcons: ["📎"] },
  cards: [
    { title: "Path", body: "CLAUDE.md" }
  ],
  notes: "Uitleg. Lab always-on: root CLAUDE.md (with AGENTS.md · progress.md · SOLO.md). Humans own it; agents read it."
},

{ // 16 — progress.md
  lessonId: "workshop-5",
  title: "progress.md",
  kicker: "Uitleg · Definition · root · append each SOLO",
  type: "concept",
  visual: { keynote: true, popOut: 0, chipIcons: ["📜"] },
  cards: [
    { title: "Path", body: "progress.md" }
  ],
  notes: "Uitleg. Lab locus: root progress.md — append-only build log. Cue: skills-pack PROGRESS.md. Append after each SOLO; not a file dump on the face."
},

/* ========== Cycle SOLO 4 — Build render ========== */

{ // 17 — build concept
  lessonId: "workshop-5",
  title: "Build with a feedback loop",
  kicker: "Uitleg · Build · lab SOLO 4–5",
  type: "concept",
  layout: "pillars",
  visual: { keynote: true, pillarIcons: true, bot: "head", place: "under" },
  items: [
    { label: "Agent checks", caption: "tests / build / shot" },
    { label: "Human reviews", caption: "intent + risk" },
    { label: "Bound today", caption: "no shell / no write" }
  ],
  notes: "Uitleg. Lab SOLO 4 render then SOLO 5 agent. Bound today: no shell, no write on the brief agent."
},

{ // 18 — voordoen SOLO 4
  lessonId: "workshop-5",
  title: "Watch: brief:sample → out/latest.html",
  kicker: "Voordoen · SOLO 4",
  type: "concept",
  visual: { keynote: true, popOut: 0, chipIcons: ["👁"] },
  cards: [
    { title: "Path", body: "out/latest.html" }
  ],
  notes: "Voordoen. Facilitator demo: red render test → green; npm run brief:sample writes out/latest.html; open next to the PDF. No API keys."
},

{ // 19 — SOLO 4
  lessonId: "workshop-5",
  title: "Red render test → green sample HTML.",
  kicker: "SOLO 4 / 7 · Zelf doen",
  type: "practice",
  timer: 25,
  visual: { keynote: true, popOut: 0, chipIcons: ["🖥"] },
  cards: [
    { title: "Path", body: "out/latest.html" }
  ],
  notes: "Zelf doen — render the sample (SOLO 4 / 7). Open lab path: out/latest.html (also test/render.test.ts · src/render.ts · src/main.ts). Timer: 25 min. Checklist: (1) test/render.test.ts red (2) src/render.ts + sample main until green (3) npm run brief:sample → out/latest.html (4) change one house-style rule test-first (5) keep 1440×900 screenshot for evidence. Check: npm run brief:sample produces out/latest.html. yes/no. Map: SOLO step 4 · tag step-4-build-render."
},

/* ========== Cycle SOLO 5 — Agent ========== */

{ // 20 — subagents
  lessonId: "workshop-5",
  title: "subagents",
  kicker: "Uitleg · Definition · lab agent loop · SOLO 5",
  type: "concept",
  layout: "compare",
  visual: { keynote: true, art: "flow", bot: "multiarm", place: "slot" },
  columns: [
    { title: "Parent", items: ["Owns intent", "Accepts plan", "Named gate"], foot: "Judgment stays here" },
    { title: "Subagent", items: ["One clear job", "Bounded tools", "Reports back"], foot: "No unsupervised swarm" }
  ],
  notes: "Uitleg. Lab locus: SOLO 5 (src/agent.ts · src/sources.ts). Delegate the work — not the accept."
},

{ // 21 — MCP
  lessonId: "workshop-5",
  title: "MCP",
  kicker: "Uitleg · Definition · only if a lab step needs a server",
  type: "concept",
  visual: { keynote: true, plugs: 1 },
  cards: [
    { title: "MCP", body: "resources\nprompts\ntools" }
  ],
  notes: "Uitleg. Lab: only if a SOLO introduces an approved outside server. Daily-brief sources are env tokens + local files otherwise. n8n→Claude lock stays."
},

{ // 22 — voordoen SOLO 5
  lessonId: "workshop-5",
  title: "Watch: one read-only tool",
  kicker: "Voordoen · SOLO 5",
  type: "concept",
  visual: { keynote: true, popOut: 0, chipIcons: ["👁"] },
  cards: [
    { title: "Path", body: "src/agent.ts" }
  ],
  notes: "Voordoen. Facilitator demo: catch up reference sources/agent; add one read-only tool(); show no shell / no write; one sentence traced to run.log."
},

{ // 23 — SOLO 5
  lessonId: "workshop-5",
  title: "One read-only tool. No shell, no write.",
  kicker: "SOLO 5 / 7 · Zelf doen",
  type: "practice",
  timer: 20,
  visual: { keynote: true, popOut: 0, chipIcons: ["🔌"] },
  cards: [
    { title: "Path", body: "src/agent.ts" }
  ],
  notes: "Zelf doen — agent loop + one read-only tool (SOLO 5 / 7). Open lab path: src/agent.ts (also src/sources.ts · run.log). Timer: 20 min + live run. Checklist: (1) catch up from reference sources.ts / agent.ts (2) add one read-only tool (tool() + guarded()) (3) live npm run brief (4) every sentence traces to a run.log tool call. Check: no shell tool, no write tool; every sentence traceable. yes/no. Map: SOLO step 5 · tag step-5-build-agent."
},

/* ========== Cycle SOLO 6 — Evidence ========== */

{ // 24 — evidence
  lessonId: "workshop-5",
  title: "Evidence is not a vibes check",
  kicker: "Uitleg · Test · docs/evidence.md · SOLO 6",
  type: "concept",
  visual: {
    keynote: true,
    mdfile: 0,
    mdName: "docs/evidence.md",
    runner: [
      { label: "typecheck", tone: "green" },
      { label: "test", tone: "green" },
      { label: "brief", tone: "green" }
    ]
  },
  cards: [
    { title: "docs/evidence.md", body: "exit codes\nquoted lines\nscreenshot path\nreviewer" }
  ],
  notes: "Uitleg. Lab locus: docs/evidence.md (also append progress.md). Commands · exit codes · screenshot · named reviewer."
},

{ // 25 — voordoen SOLO 6
  lessonId: "workshop-5",
  title: "Watch: three commands + screenshot",
  kicker: "Voordoen · SOLO 6",
  type: "concept",
  visual: { keynote: true, popOut: 0, chipIcons: ["👁"] },
  cards: [
    { title: "Path", body: "docs/evidence.md" }
  ],
  notes: "Voordoen. Facilitator demo: run typecheck · test · brief; paste exit codes + one quoted line each into docs/evidence.md; drop screenshot path; name a reviewer."
},

{ // 26 — SOLO 6
  lessonId: "workshop-5",
  title: "Proof a stranger can re-run.",
  kicker: "SOLO 6 / 7 · Zelf doen",
  type: "practice",
  timer: 15,
  visual: { keynote: true, popOut: 0, chipIcons: ["📄"] },
  cards: [
    { title: "Path", body: "docs/evidence.md" }
  ],
  notes: "Zelf doen — docs/evidence.md (SOLO 6 / 7). Open lab path: docs/evidence.md (also append progress.md · screenshot under docs/evidence/). Timer: 15 min. Checklist: (1) run typecheck · test · brief (or sample); record exit codes (2) quote one line each (3) screenshot under docs/evidence/ (4) name the reviewer (or \"self next day\"). Check: three commands + screenshot path + reviewer name. yes/no. Map: SOLO step 6 · tag step-6-evidence."
},

/* ========== Cycle SOLO 7 — Gate / deploy ========== */

{ // 27 — gate
  lessonId: "workshop-5",
  title: "Human gate, then schedule",
  kicker: "Uitleg · Deploy · docs/gate.md · SOLO 7",
  type: "concept",
  visual: { keynote: true, art: "gate", mdfile: 0, mdName: "docs/gate.md" },
  cards: [
    { title: "docs/gate.md", body: "PASS · FAIL · OPEN" }
  ],
  notes: "Uitleg. Lab locus: docs/gate.md (+ gitlab-ci.example.yml). Named approval required."
},

{ // 28 — hooks
  lessonId: "workshop-5",
  title: "hooks",
  kicker: "Uitleg · Definition · at docs/gate.md",
  type: "concept",
  visual: { keynote: true, art: "gate" },
  notes: "Uitleg. Think hooks near the human gate — optional ideas, not mandatory. Soft cue: skills-pack hooks-notes. Hooks ≠ named production approval."
},

{ // 29 — workflows
  lessonId: "workshop-5",
  title: "workflows",
  kicker: "Uitleg · Definition · SOLO 1–7 reusable path",
  type: "concept",
  layout: "steps",
  visual: { keynote: true, stepKeys: true, art: "loop" },
  items: [
    { label: "intent", caption: "align" },
    { label: "skill / agent", caption: "method" },
    { label: "proof", caption: "checks" },
    { label: "gate", caption: "human" },
    { label: "ship", caption: "PR / schedule" }
  ],
  notes: "Uitleg. The seven SOLO steps in aetherlink-daily-brief-lab-s1 are the reusable workflow."
},

{ // 30 — voordoen SOLO 7
  lessonId: "workshop-5",
  title: "Watch: fill gate + open the PR",
  kicker: "Voordoen · SOLO 7",
  type: "concept",
  visual: { keynote: true, popOut: 0, chipIcons: ["👁"] },
  cards: [
    { title: "Path", body: "docs/gate.md" }
  ],
  notes: "Voordoen. Facilitator demo: fill docs/gate.md PASS/FAIL/OPEN with quotes; refuse PASS on unread checks; point at gitlab-ci.example.yml; open a PR shape (no secrets)."
},

{ // 31 — SOLO 7
  lessonId: "workshop-5",
  title: "Fill the gate. Open the PR.",
  kicker: "SOLO 7 / 7 · Zelf doen",
  type: "practice",
  timer: 15,
  visual: { keynote: true, popOut: 0, chipIcons: ["🚪"] },
  cards: [
    { title: "Path", body: "docs/gate.md" }
  ],
  notes: "Zelf doen — gate + schedule (SOLO 7 / 7). Open lab path: docs/gate.md (also gitlab-ci.example.yml · open the PR). Timer: 15 min. Checklist: (1) fill docs/gate.md with PASS/FAIL/OPEN and quotes (2) refuse PASS on unread checks (3) credentials not in repo (4) schedule shape from gitlab-ci.example.yml or GH Actions (5) open the PR. Check: gate filled; no secrets in repo; PR open. yes/no. Map: SOLO step 7 · tag step-7-gate-deploy."
},

/* ========== Close ========== */

{ // 32
  lessonId: "workshop-5",
  title: "Close the loop",
  kicker: "Maintain → new intent.md",
  type: "concept",
  layout: "steps",
  visual: { keynote: true, stepKeys: true, art: "loop", loopCaptions: true },
  items: [
    { label: "Run today", caption: "merged brief" },
    { label: "Signal", caption: "footnote" },
    { label: "New intent", caption: "tomorrow" },
    { label: "Triage", caption: "fix / schedule / dismiss" }
  ],
  notes: "Production signal becomes the next intent.md in aetherlink-daily-brief-lab-s1."
},

{ // 33 — A6 recap
  lessonId: "workshop-5",
  title: "Recap + Proof",
  kicker: "aetherlink-daily-brief-lab-s1 · done when",
  type: "recap",
  layout: "recap",
  visual: { keynote: true, levelUp: true },
  items: [
    { label: "intent.md", caption: "Plan accepted" },
    { label: "docs/spec.md", caption: "Contract + red→green" },
    { label: "docs/plan.md", caption: "Proof plan + ADR" },
    { label: "out/latest.html", caption: "Sample / live brief" },
    { label: "docs/evidence.md", caption: "Commands + screenshot" },
    { label: "docs/gate.md", caption: "Human decision" },
    { label: "PR open", caption: "Stranger can review" }
  ],
  notes: "Done when: seven lab files · one brief you did not write · a gate you decided — inside github.com/RyanLisse/aetherlink-daily-brief-lab-s1. Rhythm held: uitleg → voordoen → zelf doen."
},

];
