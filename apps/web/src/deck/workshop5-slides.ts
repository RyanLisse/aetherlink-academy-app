/** AET-77 Workshop day 5 — ultra-minimal keynote, AI-native SDLC.
 *  Vehicle LOCKED: https://github.com/RyanLisse/aetherlink-daily-brief-lab-s1 (empty main)
 *  Rhythm per concept: Look (one diagram) → Definition (the definition is the face) → Demo → Your turn.
 *  Face bar: eyebrow chip + one sentence + ≤1 path chip. Timers/checklists → presenter notes only.
 *  Stages follow Anthropic's AI-native SDLC playbook: SOLO 1 Plan · 2 Design · 3–5 Build · 6 Test · 7 Deploy.
 *  All faces English. Forbidden: Classroom 1–2 rewrite; Eve dual-track; card walls; finished agent on lab main.
 */
const LESSON = "workshop-5";

/** Look face: one Academy-dark diagram from public/workshop-5, no definition yet. */
const look = (solo: number, title: string, image: string, notes: string): Record<string, unknown> => ({
  lessonId: LESSON,
  title,
  kicker: `Look · SOLO ${solo}`,
  type: "concept",
  visual: { keynote: true, opener: "showcase", image: `workshop-5/${image}`, imageLink: image },
  notes,
});

/** Definition face, dictionary style: the term is the headword (kicker), the definition is the headline (+ optional path chip). */
const define = (term: string, sentence: string, notes: string, path?: string): Record<string, unknown> => ({
  lessonId: LESSON,
  title: sentence,
  kicker: term,
  type: "concept",
  visual: path ? { keynote: true, opener: "definition", popOut: 0 } : { keynote: true, opener: "definition" },
  ...(path ? { cards: [{ title: "Path", body: path }] } : {}),
  notes,
});

export const workshop5SourceSlides: ReadonlyArray<Record<string, unknown>> = [

/* ========== Framing ========== */

{ // Traditional line vs AI-native loop
  lessonId: LESSON,
  title: "The line vs the loop",
  kicker: "Workshop 5 · AI-native SDLC",
  type: "concept",
  visual: {
    keynote: true,
    opener: "showcase",
    image: "workshop-5/line-vs-loop-dark.png",
    imageLink: "Traditional — the line · AI-native — the loop"
  },
  notes: "Look. Left: Plan→Design→Build→Test→Deploy→Maintain as a vertical line. Right: the same stages as a loop with Claude in the middle. Humans stay above the loop: they instigate, direct and govern. Next: the definition."
},

define("AI-native SDLC",
  "A reimagined process: the old control objectives, new enforcement. Not a line but a loop, with AI embedded at each point.",
  "Definition, verbatim for the room: 'The AI-native SDLC is a reimagined process that combines the old control objectives with new enforcement. Instead of a linear flow, the process becomes a loop, and AI is embedded at each point.' Agents collapse Build, not judgment."),

{ // The loop, after the definition
  lessonId: LESSON,
  title: "Hours, not weeks.",
  kicker: "Look · the loop",
  type: "concept",
  visual: { keynote: true, opener: "showcase", image: "workshop-5/loop-arrows-dark.png", imageLink: "AI-native — the loop" },
  notes: "Look. Walk the arrows clockwise: Plan → Design → Build → Test → Deploy → Maintain → Plan. Claude sits in the middle of every stage; humans stay above the loop, instigating, directing and governing. Diagram after Anthropic's AI-native SDLC playbook."
},

{ // Why
  lessonId: LESSON,
  title: "Code is no longer the bottleneck.",
  kicker: "Explain · why we change",
  type: "concept",
  visual: { keynote: true, opener: "showcase", image: "workshop-5/bottleneck-dark.png", imageLink: "Before agents · after agents" },
  notes: "Explain. Diagram after Anthropic's AI-native SDLC playbook: before agents every stage runs at human speed; after agents Build shrinks to a sliver and the cycle time is reclaimed. Agents collapse Build. Plan, Test, Deploy and Maintain stay human-speed; that is where the time goes now. Every stage ends with a committed file the next stage reads."
},

{ // Artifact chain
  lessonId: LESSON,
  title: "intent → spec → plan → diff → PR → gate → intent.",
  kicker: "Explain · the artifact chain",
  type: "concept",
  visual: { keynote: true },
  notes: "Explain · the artifact chain. Lab filenames exactly: intent.md → docs/spec.md → docs/plan.md → diff+tests → PR → docs/gate.md → new intent.md. Human attention sits at the accept gates."
},

{ // Vehicle
  lessonId: LESSON,
  title: "Clone the lab, empty main on purpose.",
  kicker: "Workshop 5 · vehicle",
  type: "context",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Lab", body: "github.com/RyanLisse/aetherlink-daily-brief-lab-s1" }
  ],
  notes: "Clone https://github.com/RyanLisse/aetherlink-daily-brief-lab-s1 — main is empty on purpose (templates + package skeleton only). git switch -c my/<name> && npm ci. Walk SOLO 1–7 on your branch; tags step-1-intent … step-7-gate-deploy hold the reference. Rhythm: look → definition → demo → your turn."
},

/* ========== SOLO 1 — Plan ========== */

look(1, "Before any code: one file.", "intent-dark.png",
  "Look. Let the room read the shape before you name it: outcome, three checks (one OPEN), a boundary in red, three owners."),

define("intent.md",
  "The outcome, the checks that prove it, and the line the agent never crosses.",
  "Definition. Lab locus: root intent.md (SOLO 1). Outcome · three stranger-verifiable checks · hard boundary · owners · ≥1 OPEN. Every later step is judged against it. Gate: a wish is not a rule.",
  "intent.md"),

{
  lessonId: LESSON,
  title: "Watch: Claude interviews, I cut.",
  kicker: "Demo · SOLO 1",
  type: "concept",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "intent.md" }
  ],
  notes: "Demo. Prompt: 'Interview me one question at a time to fill intent.md in place. Push back when a check is a wish, not a test.' Accept one weak check on purpose, then catch it. Compare: git diff step-1-intent -- intent.md."
},

{
  lessonId: LESSON,
  title: "Write the outcome a stranger can verify.",
  kicker: "SOLO 1 / 7 · Your turn",
  type: "practice",
  timer: 15,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "intent.md" }
  ],
  notes: "Your turn — fill intent.md (SOLO 1 / 7). Open lab path: intent.md (repo root). Timer: 15 min. Checklist: (1) one outcome sentence (2) three stranger-verifiable success checks (3) hard boundary — what the agent may never touch (4) owners (5) ≥1 OPEN. Gate: read the boundary aloud — wish ≠ rule → NEEDS REVISION, no step 2. Map: SOLO step 1 · tag step-1-intent."
},

/* ========== SOLO 2 — Design ========== */

look(2, "A quote becomes a schema becomes a test.", "contract-dark.png",
  "Look. Top: a quoted example in docs/spec.md. Middle: the zod schema. Bottom: the same test, red first, then green."),

define("spec.md",
  "Every field with a quoted example, held by a schema the model must match.",
  "Definition. Lab locus: docs/spec.md (SOLO 2). Quote reference/ PDFs → test/schema.test.ts red → src/brief.ts + sample/brief.sample.json green. The zod schema is also the agent's structured output: the model can only return what we can render. No renderer yet.",
  "docs/spec.md"),

{
  lessonId: LESSON,
  title: "Watch: red schema → green",
  kicker: "Demo · SOLO 2",
  type: "concept",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "docs/spec.md" }
  ],
  notes: "Demo. Quote one field from reference/ into docs/spec.md; show test/schema.test.ts fail red; then green with src/brief.ts. Point at .describe(): prompt text living in the schema. Test commit before brief.ts."
},

{
  lessonId: LESSON,
  title: "Quoted examples → red schema → green.",
  kicker: "SOLO 2 / 7 · Your turn",
  type: "practice",
  timer: 25,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "docs/spec.md" }
  ],
  notes: "Your turn — docs/spec.md + schema test (SOLO 2 / 7). Open lab path: docs/spec.md (also test/schema.test.ts · src/brief.ts · sample/brief.sample.json). Timer: 25 min. Checklist: (1) quote one example per field from reference/ into docs/spec.md (2) test/schema.test.ts fails red (3) src/brief.ts + sample/brief.sample.json until npm test green (4) test commit before brief.ts in git log. Check: test commit before brief.ts. yes/no. Map: SOLO step 2 · tag step-2-spec."
},

/* ========== SOLO 3 — Build: the plan ========== */

look(3, "Every step has a proof.", "plan-dark.png",
  "Look. A plan table where every row carries a proof command, and a human gate before anything gets built."),

define("plan.md",
  "Ordered steps, each with a proof command, accepted by a person before any code.",
  "Definition. Lab locus: docs/plan.md (SOLO 3 also writes docs/design.md + one ADR under docs/decisions/). Ordered steps · exact paths · one proof command per step · rollback · gate before build. Plan mode: Claude reads, edits nothing, until you accept.",
  "docs/plan.md"),

{
  lessonId: LESSON,
  title: "Watch: plan mode until accept",
  kicker: "Demo · SOLO 3",
  type: "concept",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "docs/plan.md" }
  ],
  notes: "Demo. Shift+Tab into plan mode; sketch docs/plan.md with one proof command per step; reject a step without one; pause at the human accept gate before any build files."
},

{
  lessonId: LESSON,
  title: "Stay in plan mode until a human accepts.",
  kicker: "SOLO 3 / 7 · Your turn",
  type: "practice",
  timer: 15,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "docs/plan.md" }
  ],
  notes: "Your turn — design + ADR + plan (SOLO 3 / 7). Open lab path: docs/plan.md (also docs/design.md · docs/decisions/). Timer: 15 min. Checklist: (1) docs/design.md (2) one real ADR under docs/decisions/ (3) docs/plan.md with ordered steps, exact paths, one proof command per step, rollback, gate before build (4) remain in plan mode until a human accepts. Check: every step has a proof command + rollback. yes/no. Map: SOLO step 3 · tag step-3-design. Soft cue: subagents only when the plan names a parallel read."
},

/* ========== Tooling (definition faces, no diagram) ========== */

define("CLAUDE.md",
  "The briefing every session reads first. People write it; agents follow it.",
  "Definition. Lab always-on: root CLAUDE.md (with AGENTS.md · progress.md · SOLO.md). Conventions, commands, the mistakes not to repeat.",
  "CLAUDE.md"),

define("progress.md",
  "An append-only log of what each step proved.",
  "Definition. Lab locus: root progress.md. Append after each SOLO: step, proof command, status (VERIFIED or OPEN).",
  "progress.md"),

define("skills",
  "A reusable method Claude loads only when a step needs it.",
  "Definition. Optional slash skill when a later SOLO needs a repeatable method (e.g. security or brand rules). Soft cue: claude-code-skills-pack. Does not replace the daily-brief walk."),

/* ========== SOLO 4 — Build: render ========== */

look(4, "The first page, before any agent.", "brief-dark.png",
  "Look. The brief as the reader gets it: greeting, what to push, what's waiting, what changed, the day. Rendered from sample data."),

define("vertical slice",
  "The smallest end-to-end result that really works: a real page from sample data.",
  "Definition. SOLO 4: npm run brief:sample writes out/latest.html with no API key and no model call. Model text is untrusted: the renderer escapes everything. Every later step adds data behind this same page.",
  "out/latest.html"),

{
  lessonId: LESSON,
  title: "Watch: brief:sample → out/latest.html",
  kicker: "Demo · SOLO 4",
  type: "concept",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "out/latest.html" }
  ],
  notes: "Demo. Red render test → green; the escape test: assert.ok(!html.includes('<script>alert')). npm run brief:sample writes out/latest.html; open it next to the PDF. No API keys."
},

{
  lessonId: LESSON,
  title: "Red render test → green sample HTML.",
  kicker: "SOLO 4 / 7 · Your turn",
  type: "practice",
  timer: 25,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "out/latest.html" }
  ],
  notes: "Your turn — render the sample (SOLO 4 / 7). Open lab path: out/latest.html (also test/render.test.ts · src/render.ts · src/main.ts). Timer: 25 min. Checklist: (1) test/render.test.ts red (2) src/render.ts + sample-only src/main.ts until green (3) npm run brief:sample → out/latest.html (4) change one house-style rule test-first (5) keep 1440×900 screenshot for evidence. Check: npm run brief:sample produces out/latest.html. yes/no. Map: SOLO step 4 · tag step-4-build-render."
},

/* ========== SOLO 5 — Build: the agent ========== */

define("MCP",
  "The plug between Claude and a source system. Add one only if a step needs it.",
  "Definition. Lab: connected sources show on the mcp=[…] line in run.log; the brief agent's sources are in-process MCP tools in src/sources.ts. n8n→Claude lock stays."),

define("subagents",
  "A helper session with its own context. Delegate the work, never the accept.",
  "Definition. Lab locus: SOLO 5 (src/agent.ts · src/sources.ts). Spawn only when docs/plan.md names a parallel read."),

look(5, "Read-only tools. No shell.", "agent-dark.png",
  "Look. Claude in the middle, four locked read-only tools, shell/files/write struck through, output checked against the contract."),

define("tool",
  "A function the agent may call. Ours only read, and an error becomes a note, not a guess.",
  "Definition. src/agent.ts: tools: [] (no built-ins, no shell, no files) · allowedTools: only mcp__<source>__* · permissionMode: 'dontAsk' · outputFormat: the Brief JSON schema. Every tool is wrapped in guarded(). The human comes after the run, not inside it.",
  "src/agent.ts"),

{
  lessonId: LESSON,
  title: "Watch: one read-only tool",
  kicker: "Demo · SOLO 5",
  type: "concept",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "src/agent.ts" }
  ],
  notes: "Demo. Catch up reference src/sources.ts · src/agent.ts · src/main.ts · test/agent.test.ts; add one read-only tool(); show no shell / no write; trace one sentence to run.log."
},

{
  lessonId: LESSON,
  title: "One read-only tool. No shell, no write.",
  kicker: "SOLO 5 / 7 · Your turn",
  type: "practice",
  timer: 20,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "src/agent.ts" }
  ],
  notes: "Your turn — agent loop + one read-only tool (SOLO 5 / 7). Open lab path: src/agent.ts (also src/sources.ts · run.log). Timer: 20 min + live run. Checklist: (1) git checkout step-5-build-agent -- src/sources.ts src/agent.ts src/main.ts test/agent.test.ts (2) add one read-only tool (tool() + guarded()) (3) live npm run brief (4) every sentence traces to a run.log tool call. Check: no shell tool, no write tool; every sentence traceable. yes/no. Map: SOLO step 5 · tag step-5-build-agent. No token → the source is skipped and named in notes: OPEN, not FAIL."
},

/* ========== SOLO 6 — Test ========== */

look(6, "Three commands. One name.", "terminal-dark.png",
  "Look. Three commands with their exit codes, and the name of the person who reran one."),

define("evidence",
  "A command, its exit code, one quoted line, and the name of who reran it.",
  "Definition. Lab locus: docs/evidence.md. Three commands with exit codes + one quoted line each · screenshot under docs/evidence/ · named reviewer. A green score is not proof. Differences from the PDFs are OPEN.",
  "docs/evidence.md"),

{
  lessonId: LESSON,
  title: "Watch: three commands + screenshot",
  kicker: "Demo · SOLO 6",
  type: "concept",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "docs/evidence.md" }
  ],
  notes: "Demo. Let Claude run typecheck · test · brief:sample and write docs/evidence.md (command, exit code, one quoted line, anything not run is OPEN). Then rerun one command by hand and compare."
},

{
  lessonId: LESSON,
  title: "Proof a stranger can re-run.",
  kicker: "SOLO 6 / 7 · Your turn",
  type: "practice",
  timer: 15,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "docs/evidence.md" }
  ],
  notes: "Your turn — docs/evidence.md (SOLO 6 / 7). Open lab path: docs/evidence.md (also append progress.md · screenshot under docs/evidence/). Timer: 15 min. Checklist: (1) run typecheck · test · brief (or sample); record exit codes (2) quote one line each (3) screenshot under docs/evidence/ (4) name the reviewer (or \"self next day\"). Check: three commands + screenshot path + reviewer name. yes/no. Map: SOLO step 6 · tag step-6-evidence."
},

/* ========== SOLO 7 — Deploy ========== */

define("hooks",
  "A script that runs on an agent event and can block it. It guards; it never approves.",
  "Definition. Optional stop/ask hook near the human gate. Soft cue: skills-pack. Hooks ≠ named production approval."),

define("workflows",
  "A repeatable path of steps. Today: SOLO 1 to 7, then a weekday schedule.",
  "Definition. The seven SOLO steps in aetherlink-daily-brief-lab-s1 are the reusable workflow. The weekday schedule is SOLO 7 (Actions / cron)."),

look(7, "Three stamps. One decides.", "gate-dark.png",
  "Look. A pull request read against intent.md, and three possible decisions. OPEN is highlighted on purpose."),

define("gate",
  "A person reads the PR against intent.md and writes PASS, FAIL or OPEN, with the line that decided it.",
  "Definition. Lab locus: docs/gate.md (+ gitlab-ci.example.yml or a GH Actions weekday schedule). The agent that wrote the code never approves it. Green CI is an observation, not an approval. Credentials in secrets only.",
  "docs/gate.md"),

{
  lessonId: LESSON,
  title: "Watch: fill the gate, open the PR",
  kicker: "Demo · SOLO 7",
  type: "concept",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "docs/gate.md" }
  ],
  notes: "Demo. Fill docs/gate.md PASS/FAIL/OPEN with quotes; refuse PASS on unread checks; point at gitlab-ci.example.yml; open a PR (no secrets). Reference decision: OPEN, decided by `tools: [],` in src/agent.ts. An honest OPEN beats a hopeful PASS."
},

{
  lessonId: LESSON,
  title: "Fill the gate. Open the PR.",
  kicker: "SOLO 7 / 7 · Your turn",
  type: "practice",
  timer: 15,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "docs/gate.md" }
  ],
  notes: "Your turn — gate + schedule (SOLO 7 / 7). Open lab path: docs/gate.md (also gitlab-ci.example.yml · open the PR). Timer: 15 min. Checklist: (1) fill docs/gate.md with PASS/FAIL/OPEN and quotes (2) refuse PASS on unread checks (3) credentials not in repo (4) schedule shape from gitlab-ci.example.yml or GH Actions (5) open the PR. Check: gate filled; no secrets in repo; PR open. yes/no. Map: SOLO step 7 · tag step-7-gate-deploy."
},

/* ========== Maintain + close ========== */

{ // Maintain look
  lessonId: LESSON,
  title: "Tomorrow's run reads what you merged today.",
  kicker: "Look · Maintain → new intent.md",
  type: "concept",
  visual: { keynote: true, opener: "showcase", image: "workshop-5/loop-dark.png", imageLink: "loop-dark.png" },
  notes: "Look + close the loop. An OPEN from gate.md becomes a new success check in intent.md. A footnote that keeps coming back is a finding; it runs the whole loop again."
},

define("finding",
  "Something the running system taught you. It goes back in as a change to intent.md.",
  "Definition. Maintain. At scale: alerts trigger the agent to log, diagnose read-only, then propose a PR. Five-minute exercise: turn one OPEN from your gate.md into a check in intent.md."),

{ // Recap
  lessonId: LESSON,
  title: "Seven files. One brief. One gate.",
  kicker: "aetherlink-daily-brief-lab-s1 · done when",
  type: "recap",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Lab", body: "github.com/RyanLisse/aetherlink-daily-brief-lab-s1" }
  ],
  notes: "Recap + proof. Done when seven lab files a stranger can point at: intent.md · docs/spec.md · docs/plan.md · out/latest.html · docs/evidence.md · docs/gate.md · PR open — plus one brief you did not write and a gate you decided — inside github.com/RyanLisse/aetherlink-daily-brief-lab-s1. Rhythm held: look → definition → demo → your turn."
},

];
