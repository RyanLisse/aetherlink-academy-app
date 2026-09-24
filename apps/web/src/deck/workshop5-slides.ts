/** AET-77 Workshop day 5 — AI-native SDLC (Apple keynote + lab through-line).
 *  SoT: HANDOFF/PRODUCT-ACCEPT AET-77-APPLE + LAB-THROUGHLINE (+ progress/CLAUDE addendum)
 *  Vehicle: https://github.com/RyanLisse/aetherlink-daily-brief-lab-s1 (empty main on purpose)
 *  Soft cue: https://github.com/RyanLisse/claude-code-skills-pack
 *  Projector: big/bold/centered — one visual OR one short text idea per slide.
 *  Definitions: 11. Timers/checklists → presenter notes only.
 *  Forbidden: Classroom 1–2 rewrite; Eve dual-track; finished agent on lab main.
 */
export const workshop5SourceSlides: ReadonlyArray<Record<string, unknown>> = [

/* ---------------------------------------------------------------------- */
/* Opening                                                                 */
/* ---------------------------------------------------------------------- */

{ // 1 — A1 lab vehicle on opening face
  lessonId: "workshop-5",
  title: "Clone the lab. Empty main on purpose.",
  kicker: "Workshop 5 · vehicle",
  type: "context",
  visual: { keynote: true, popOut: 0, chipIcons: ["🔗"] },
  cards: [
    { title: "Lab", body: "github.com/RyanLisse/aetherlink-daily-brief-lab-s1" }
  ],
  notes: "Through-line: attendees clone/fork aetherlink-daily-brief-lab-s1 and walk SOLO 1–7. main is empty on purpose — templates + package skeleton only; do not ship a finished agent on main. Full URL: https://github.com/RyanLisse/aetherlink-daily-brief-lab-s1. Leave with: seven lab files a stranger can point at, one brief they did not hand-write, one gate they decided."
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
  notes: "Agents collapse Build; Plan / Test / Deploy / Maintain stay human-speed. Today we rebuild the loop inside aetherlink-daily-brief-lab-s1 around committed artifacts + gates."
},

{ // 3 — A3 artifact-chain with lab filenames
  lessonId: "workshop-5",
  title: "The artifact chain",
  kicker: "Lab filenames · every stage ends in git",
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
  notes: "Walk the lab chain exactly as README/SOLO: intent.md → docs/spec.md → docs/plan.md → diff+tests → PR → docs/gate.md → new intent.md. Human attention at accept gates. Point at the chain; don't lecture the whole blog."
},

{ // 4
  lessonId: "workshop-5",
  title: "Intent is a committed artifact",
  kicker: "Lab · root intent.md",
  type: "concept",
  visual: { keynote: true, mdfile: 0, mdName: "intent.md" },
  cards: [
    { title: "intent.md", body: "Outcome sentence\nSuccess checks a stranger can verify\nHard boundary\nOwners\n≥1 OPEN" }
  ],
  notes: "Originator's words, versioned, machine-actionable. Product owner accepts before Design. Lab file: intent.md (repo root of aetherlink-daily-brief-lab-s1)."
},

/* ---------------------------------------------------------------------- */
/* Eleven highlight slides — Apple + lab locus                             */
/* ---------------------------------------------------------------------- */

{ // 5 — AI-native SDLC
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
  notes: "One idea: the loop you walk in aetherlink-daily-brief-lab-s1. Artifacts + gates. Agents collapse Build — not judgment. Proof in git; humans at accept gates."
},

{ // 6 — intent.md
  lessonId: "workshop-5",
  title: "intent.md",
  kicker: "Definition · root · SOLO 1",
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
  notes: "Lab locus: root intent.md (SOLO 1). Soft cue: examples/intent.md from github.com/RyanLisse/claude-code-skills-pack. Humans write it; agents work toward it. Gate: wish ≠ rule."
},

{ // 7 — SOLO 1
  lessonId: "workshop-5",
  title: "Write the outcome a stranger can verify.",
  kicker: "SOLO 1 / 7",
  type: "practice",
  timer: 15,
  visual: { keynote: true, popOut: 0, chipIcons: ["📄"] },
  cards: [
    { title: "Path", body: "intent.md" }
  ],
  notes: "Assignment — fill intent.md (SOLO 1 / 7). Open lab path: intent.md (repo root). Claude interviews one question at a time; human cuts. Timer: 15 min. Checklist: (1) one outcome sentence (2) three stranger-verifiable success checks (3) hard boundary — what the agent may never touch (4) owners (5) ≥1 OPEN — do not invent certainty. Gate: read the boundary aloud — wish ≠ rule → NEEDS REVISION, no step 2. Map: SOLO step 1 · tag step-1-intent."
},

{ // 8 — spec.md
  lessonId: "workshop-5",
  title: "spec.md",
  kicker: "Definition · docs/spec.md · SOLO 2",
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
  notes: "Lab locus: docs/spec.md (SOLO 2). Testable contract — red before green. Quote reference/ PDFs. No invented fields."
},

{ // 9 — SOLO 2
  lessonId: "workshop-5",
  title: "Quoted examples → red schema → green.",
  kicker: "SOLO 2 / 7",
  type: "practice",
  timer: 25,
  visual: { keynote: true, popOut: 0, chipIcons: ["📄"] },
  cards: [
    { title: "Path", body: "docs/spec.md" }
  ],
  notes: "Assignment — docs/spec.md + schema test (SOLO 2 / 7). Open lab path: docs/spec.md (also test/schema.test.ts · src/brief.ts · sample/brief.sample.json). Timer: 25 min. Checklist: (1) quote one example per field from reference/ PDFs into docs/spec.md (2) write test/schema.test.ts so it fails red (3) add src/brief.ts + sample/brief.sample.json until npm test green (4) confirm test commit before brief.ts in git log. Check: test commit before brief.ts in git log. yes/no. Map: SOLO step 2 · tag step-2-spec."
},

{ // 10 — plan.md
  lessonId: "workshop-5",
  title: "plan.md",
  kicker: "Definition · docs/plan.md · SOLO 3",
  type: "concept",
  visual: { keynote: true, art: "gate", mdfile: 0, mdName: "docs/plan.md" },
  cards: [
    { title: "docs/plan.md", body: "Steps · Paths · Proof · Rollback · Gate" }
  ],
  notes: "Lab locus: docs/plan.md (SOLO 3 also writes docs/design.md + one ADR under docs/decisions/). Ordered steps + proof; read-only until accept."
},

{ // 11 — SOLO 3
  lessonId: "workshop-5",
  title: "Stay in plan mode until a human accepts.",
  kicker: "SOLO 3 / 7",
  type: "practice",
  timer: 15,
  visual: { keynote: true, popOut: 0, chipIcons: ["📄"] },
  cards: [
    { title: "Path", body: "docs/plan.md" }
  ],
  notes: "Assignment — design + ADR + plan with proof (SOLO 3 / 7). Open lab path: docs/plan.md (also docs/design.md · docs/decisions/). Timer: 15 min. Checklist: (1) write docs/design.md (2) one real ADR under docs/decisions/ (3) docs/plan.md with ordered steps, exact paths, one proof command per step, rollback, gate before build (4) remain in plan mode until human accepts. Check: every step has a proof command + rollback. yes/no. Map: SOLO step 3 · tag step-3-design."
},

{ // 12 — skills
  lessonId: "workshop-5",
  title: "skills",
  kicker: "Definition · when SOLO needs a slash skill",
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
  notes: "Lab locus: optional when a SOLO step needs a reusable method — not a replacement for the daily-brief walk. Soft cue: github.com/RyanLisse/claude-code-skills-pack. Skill ≠ continuous process."
},

{ // 13 — CLAUDE.md
  lessonId: "workshop-5",
  title: "CLAUDE.md",
  kicker: "Definition · root · agent instructions",
  type: "concept",
  visual: { keynote: true, popOut: 0, chipIcons: ["📎"] },
  cards: [
    { title: "Path", body: "CLAUDE.md" }
  ],
  notes: "Lab locus: root CLAUDE.md (always-on with AGENTS.md · progress.md · SOLO.md). Project instructions the agent reads; humans own the file. Not a prompt dump on the face."
},

{ // 14 — hooks
  lessonId: "workshop-5",
  title: "hooks",
  kicker: "Definition · at docs/gate.md",
  type: "concept",
  visual: { keynote: true, art: "gate" },
  notes: "Lab locus: think hooks near the human gate (docs/gate.md) — optional PreToolUse/PostToolUse ideas, not mandatory. Soft cue: skills-pack notes/hooks-notes.md. Hooks ≠ named production approval."
},

{ // 15 — MCP
  lessonId: "workshop-5",
  title: "MCP",
  kicker: "Definition · only if a lab step needs a server",
  type: "concept",
  visual: { keynote: true, plugs: 1 },
  cards: [
    { title: "MCP", body: "resources\nprompts\ntools" }
  ],
  notes: "Lab locus: only if a SOLO step introduces an approved outside server. Daily-brief sources are otherwise env tokens + local files. Connected ≠ allowed. n8n→Claude lock stays."
},

{ // 16 — subagents
  lessonId: "workshop-5",
  title: "subagents",
  kicker: "Definition · lab agent loop · SOLO 5",
  type: "concept",
  layout: "compare",
  visual: { keynote: true, art: "flow", bot: "multiarm", place: "slot" },
  columns: [
    { title: "Parent", items: ["Owns intent", "Accepts plan", "Named gate"], foot: "Judgment stays here" },
    { title: "Subagent", items: ["One clear job", "Bounded tools", "Reports back"], foot: "No unsupervised swarm" }
  ],
  notes: "Lab locus: SOLO 5 agent loop (src/agent.ts · src/sources.ts) — one bounded job; parent/human owns accept. Soft Archify cue optional."
},

{ // 17 — workflows
  lessonId: "workshop-5",
  title: "workflows",
  kicker: "Definition · SOLO 1–7 reusable path",
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
  notes: "Lab locus: the seven SOLO steps in aetherlink-daily-brief-lab-s1 are the reusable workflow. Useful · safe · verifiable · reusable."
},

{ // 18 — build concept
  lessonId: "workshop-5",
  title: "Build with a feedback loop",
  kicker: "Build · lab SOLO 4–5",
  type: "concept",
  layout: "pillars",
  visual: { keynote: true, pillarIcons: true, bot: "head", place: "under" },
  items: [
    { label: "Agent checks", caption: "tests / build / shot" },
    { label: "Human reviews", caption: "intent + risk" },
    { label: "Bound today", caption: "no shell / no write" }
  ],
  notes: "Lab locus: SOLO 4 render + SOLO 5 agent. Agent checks its own work; human reviews intent + risk. Bound for today: no shell, no write on the brief agent."
},

{ // 19 — progress.md
  lessonId: "workshop-5",
  title: "progress.md",
  kicker: "Definition · root · append each SOLO",
  type: "concept",
  visual: { keynote: true, popOut: 0, chipIcons: ["📜"] },
  cards: [
    { title: "Path", body: "progress.md" }
  ],
  notes: "Lab locus: root progress.md — append-only build log (what shipped + evidence), not live status. Cue: skills-pack PROGRESS.md. Append each SOLO; live status stays in the tracker. Projector = title + path chip, NOT a file dump."
},

{ // 20 — SOLO 4
  lessonId: "workshop-5",
  title: "Red render test → green sample HTML.",
  kicker: "SOLO 4 / 7",
  type: "practice",
  timer: 25,
  visual: { keynote: true, popOut: 0, chipIcons: ["🖥"] },
  cards: [
    { title: "Path", body: "out/latest.html" }
  ],
  notes: "Assignment — render the sample (SOLO 4 / 7). Open lab path: out/latest.html (also test/render.test.ts · src/render.ts · src/main.ts). Timer: 25 min. Checklist: (1) test/render.test.ts red (2) src/render.ts + sample main until green (3) npm run brief:sample → out/latest.html (4) change one house-style rule test-first (5) keep 1440×900 screenshot for evidence. Check: npm run brief:sample produces out/latest.html. yes/no. Map: SOLO step 4 · tag step-4-build-render."
},

{ // 21 — SOLO 5
  lessonId: "workshop-5",
  title: "One read-only tool. No shell, no write.",
  kicker: "SOLO 5 / 7",
  type: "practice",
  timer: 20,
  visual: { keynote: true, popOut: 0, chipIcons: ["🔌"] },
  cards: [
    { title: "Path", body: "src/agent.ts" }
  ],
  notes: "Assignment — agent loop + one read-only tool (SOLO 5 / 7). Open lab path: src/agent.ts (also src/sources.ts · run.log). Timer: 20 min + live run. Checklist: (1) catch up from reference sources.ts / agent.ts (2) add one read-only tool (tool() + guarded()) (3) live npm run brief (4) every sentence traces to a run.log tool call. Check: no shell tool, no write tool; every sentence traceable. yes/no. Map: SOLO step 5 · tag step-5-build-agent."
},

{ // 22 — evidence
  lessonId: "workshop-5",
  title: "Evidence is not a vibes check",
  kicker: "Test · docs/evidence.md · SOLO 6",
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
  notes: "Lab locus: docs/evidence.md (SOLO 6 also appends progress.md). Commands · exit codes · screenshot · named reviewer."
},

{ // 23 — SOLO 6
  lessonId: "workshop-5",
  title: "Proof a stranger can re-run.",
  kicker: "SOLO 6 / 7",
  type: "practice",
  timer: 15,
  visual: { keynote: true, popOut: 0, chipIcons: ["📄"] },
  cards: [
    { title: "Path", body: "docs/evidence.md" }
  ],
  notes: "Assignment — docs/evidence.md (SOLO 6 / 7). Open lab path: docs/evidence.md (also append progress.md · screenshot under docs/evidence/). Timer: 15 min. Checklist: (1) run typecheck · test · brief (or sample); record exit codes (2) quote one line each (3) screenshot under docs/evidence/ (4) name the reviewer (or \"self next day\"). Check: three commands + screenshot path + reviewer name. yes/no. Map: SOLO step 6 · tag step-6-evidence."
},

{ // 24 — gate
  lessonId: "workshop-5",
  title: "Human gate, then schedule",
  kicker: "Deploy · docs/gate.md · SOLO 7",
  type: "concept",
  visual: { keynote: true, art: "gate", mdfile: 0, mdName: "docs/gate.md" },
  cards: [
    { title: "docs/gate.md", body: "PASS · FAIL · OPEN" }
  ],
  notes: "Lab locus: docs/gate.md (+ gitlab-ci.example.yml). Agent up to the gate; production needs named approval. No secrets in repo."
},

{ // 25 — SOLO 7
  lessonId: "workshop-5",
  title: "Fill the gate. Open the PR.",
  kicker: "SOLO 7 / 7",
  type: "practice",
  timer: 15,
  visual: { keynote: true, popOut: 0, chipIcons: ["🚪"] },
  cards: [
    { title: "Path", body: "docs/gate.md" }
  ],
  notes: "Assignment — gate + schedule (SOLO 7 / 7). Open lab path: docs/gate.md (also gitlab-ci.example.yml · open the PR). Timer: 15 min. Checklist: (1) fill docs/gate.md with PASS/FAIL/OPEN and quotes (2) refuse PASS on unread checks (3) credentials not in repo (4) schedule shape from gitlab-ci.example.yml or GH Actions (5) open the PR. Check: gate filled; no secrets in repo; PR open. yes/no. Map: SOLO step 7 · tag step-7-gate-deploy."
},

{ // 26 — close
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
  notes: "Lab locus: production signal becomes the next intent.md in aetherlink-daily-brief-lab-s1. Tomorrow's run reads what you merged today."
},

{ // 27 — A6 recap = seven lab files + repo name
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
  notes: "Done when: seven lab files a stranger can point at · one brief you did not write · a gate you decided — all inside github.com/RyanLisse/aetherlink-daily-brief-lab-s1. Soft credit: skills-pack for slash visuals only."
},

];
