/** AET-77 Workshop day 5 — AI-native SDLC (Apple keynote polish).
 *  SoT: HANDOFF-AET-77-APPLE.md · PRODUCT-ACCEPT-AET-77-APPLE.md
 *  Visual cue pack: https://github.com/RyanLisse/claude-code-skills-pack
 *  Projector: big/bold/centered — one visual OR one short text idea per slide.
 *  Definitions: 11 (prior 9 + progress.md + CLAUDE.md). ADDENDUM progress/CLAUDE.
 *  Timers/checklists → presenter notes only. Slides 1–4 left intact.
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
/* Eleven highlight slides — Apple keynote (one idea each)                  */
/* ---------------------------------------------------------------------- */

{ // 5 — AI-native SDLC (loop visual)
  lessonId: "workshop-5",
  title: "AI-native SDLC",
  kicker: "Definition",
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
  notes: "One idea: the loop. Artifacts + gates. Agents collapse Build — not judgment. Proof in git; humans at accept gates. Tie to artifact chain on slide 3."
},

{ // 6 — intent.md (section chips = one visual)
  lessonId: "workshop-5",
  title: "intent.md",
  kicker: "Definition · Plan",
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
  notes: "One idea: intent.md sections (chips). Cue: examples/intent.md from github.com/RyanLisse/claude-code-skills-pack. Humans write it; agents work toward it. Gate: wish ≠ rule. If it is not written here, it is not the shared goal."
},

{ // 7 — SOLO 1
  lessonId: "workshop-5",
  title: "Write the outcome a stranger can verify.",
  kicker: "SOLO 1",
  type: "practice",
  timer: 15,
  visual: { keynote: true, popOut: 0, chipIcons: ["📄"] },
  cards: [
    { title: "Path", body: "intent.md" }
  ],
  notes: "Assignment — fill intent.md (SOLO 1). Claude interviews one question at a time; human cuts. Timer: 15 min. Checklist: (1) one outcome sentence (2) three stranger-verifiable success checks (3) hard boundary — what the agent may never touch (4) owners (5) ≥1 OPEN — do not invent certainty. Gate: read the boundary aloud — wish ≠ rule → NEEDS REVISION, no step 2. Map: SOLO step 1."
},

{ // 8 — spec.md (red→green runner = one visual)
  lessonId: "workshop-5",
  title: "spec.md",
  kicker: "Definition · Design",
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
  notes: "One idea: testable contract — red before green. Quote sources. No invented fields. Still a human gate when Design is compressed."
},

{ // 9 — SOLO 2
  lessonId: "workshop-5",
  title: "Quoted examples → red schema → green.",
  kicker: "SOLO 2",
  type: "practice",
  timer: 25,
  visual: { keynote: true, popOut: 0, chipIcons: ["📄"] },
  cards: [
    { title: "Path", body: "docs/spec.md" }
  ],
  notes: "Assignment — docs/spec.md + schema test (SOLO 2). No renderer yet. Timer: 25 min. Checklist: (1) quote one example per field from reference/ PDFs into docs/spec.md (2) write test/schema.test.ts so it fails red (3) add src/brief.ts + sample/brief.sample.json until npm test green (4) confirm test commit before brief.ts in git log. Check: test commit before brief.ts in git log. yes/no. Map: SOLO step 2. Also lands: test/schema.test.ts · src/brief.ts."
},

{ // 10 — plan.md (gate art = one visual)
  lessonId: "workshop-5",
  title: "plan.md",
  kicker: "Definition · Design / Build",
  type: "concept",
  visual: { keynote: true, art: "gate", mdfile: 0, mdName: "docs/plan.md" },
  cards: [
    { title: "docs/plan.md", body: "Steps · Paths · Proof · Rollback · Gate" }
  ],
  notes: "One idea: ordered steps + proof; read-only until accept. Explore → Plan → approval gate → Change. Approved plan is the audit trail the PR later checks against."
},

{ // 11 — SOLO 3
  lessonId: "workshop-5",
  title: "Stay in plan mode until a human accepts.",
  kicker: "SOLO 3",
  type: "practice",
  timer: 15,
  visual: { keynote: true, popOut: 0, chipIcons: ["📄"] },
  cards: [
    { title: "Path", body: "docs/plan.md" }
  ],
  notes: "Assignment — design + ADR + plan with proof (SOLO 3). Stranger could implement. Timer: 15 min. Checklist: (1) write docs/design.md (2) one real ADR under docs/decisions/ (3) docs/plan.md with ordered steps, exact paths, one proof command per step, rollback, gate before build (4) remain in plan mode until human accepts. Check: every step has a proof command + rollback. yes/no. Map: SOLO step 3. Also: docs/design.md · docs/decisions/."
},

{ // 12 — skills (slash chips = one visual)
  lessonId: "workshop-5",
  title: "skills",
  kicker: "Definition · /slash methods",
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
  notes: "One idea: type /name, get a method. Folder + SKILL.md (when · input · procedure · bounds · stop). Cue: github.com/RyanLisse/claude-code-skills-pack. Soft: pack is optional install for the room; lab still uses daily-brief SOLO. Skill ≠ continuous process. Reusable method — not a background agent."
},


{ // CLAUDE.md — agent/project instructions (Apple one-idea)
  lessonId: "workshop-5",
  title: "CLAUDE.md",
  kicker: "Definition · agent instructions",
  type: "concept",
  visual: { keynote: true, popOut: 0, chipIcons: ["📎"] },
  cards: [
    { title: "Path", body: "CLAUDE.md" }
  ],
  notes: "One idea: the agent/project instructions artifact. Project-level CLAUDE.md tells the agent how this repo works — bounds, conventions, stop rules. Soft cue alongside skills-pack. Not a prompt dump on the face — path chip only. Humans own the file; agents read it."
},
{ // 13 — hooks (gate only)
  lessonId: "workshop-5",
  title: "hooks",
  kicker: "Definition · tool events",
  type: "concept",
  visual: { keynote: true, art: "gate" },
  notes: "One idea: deterministic automation around tool events (PreToolUse / PostToolUse / Stop). From skills-pack notes/hooks-notes.md: pack does not ship mandatory hooks; ideas only (remind /deslop, suggest /fix-ci). No secrets in hook scripts. Hooks are optional gates — humans still own production. Tie to Deploy: hooks ≠ named production approval."
},

{ // 14 — MCP (plugs only)
  lessonId: "workshop-5",
  title: "MCP",
  kicker: "Definition · approved plug",
  type: "concept",
  visual: { keynote: true, plugs: 1 },
  cards: [
    { title: "MCP", body: "resources\nprompts\ntools" }
  ],
  notes: "One idea: one standard plug for approved tools and data. Files local; MCP for approved outside. Connected ≠ allowed. /mcp to inspect. n8n→Claude lock stays — no Eve dual-track. Reuse Classroom MCP plug visual."
},

{ // 15 — subagents (compare = one visual)
  lessonId: "workshop-5",
  title: "subagents",
  kicker: "Definition · Agents SDK",
  type: "concept",
  layout: "compare",
  visual: { keynote: true, art: "flow", bot: "multiarm", place: "slot" },
  columns: [
    { title: "Parent", items: ["Owns intent", "Accepts plan", "Named gate"], foot: "Judgment stays here" },
    { title: "Subagent", items: ["One clear job", "Bounded tools", "Reports back"], foot: "No unsupervised swarm" }
  ],
  notes: "One idea: one bounded job each; parent keeps the gate. Day 5 after n8n + Agents SDK. Delegate the work — not the accept. Soft Archify cue: maps help see the split — don't require live Archify."
},

{ // 16 — workflows (chain = one visual)
  lessonId: "workshop-5",
  title: "workflows",
  kicker: "Definition · reusable path",
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
  notes: "One idea: a bounded path other people can reuse. Useful · safe · verifiable · reusable. Workflow = artifact chain + human gate, optionally sped by skills-pack slash methods. Soft Archify: system maps visualize the path — optional."
},

{ // 17 — build concept
  lessonId: "workshop-5",
  title: "Build with a feedback loop",
  kicker: "Build",
  type: "concept",
  layout: "pillars",
  visual: { keynote: true, pillarIcons: true, bot: "head", place: "under" },
  items: [
    { label: "Agent checks", caption: "tests / build / shot" },
    { label: "Human reviews", caption: "intent + risk" },
    { label: "Bound today", caption: "no shell / no write" }
  ],
  notes: "One idea: agent checks its own work; human reviews intent + risk. Proof in the session; judgment with the human. Bound for today: no shell, no write on the brief agent."
},


{ // progress.md — append-only build log (Apple one-idea)
  lessonId: "workshop-5",
  title: "progress.md",
  kicker: "Definition · build log",
  type: "concept",
  visual: { keynote: true, popOut: 0, chipIcons: ["📜"] },
  cards: [
    { title: "Path", body: "progress.md" }
  ],
  notes: "One idea: append-only build log — what shipped + evidence, not live status. Cue: github.com/RyanLisse/claude-code-skills-pack/blob/main/PROGRESS.md (PROGRESS.md / progress.md). Past-tense immutable entries; corrections are new entries. Cite tracker keys, ADRs, PRs. Live status lives in the tracker — this log does not mirror it. Projector = title + path chip, NOT a file dump."
},
{ // 18 — SOLO 4
  lessonId: "workshop-5",
  title: "Red render test → green sample HTML.",
  kicker: "SOLO 4",
  type: "practice",
  timer: 25,
  visual: { keynote: true, popOut: 0, chipIcons: ["🖥"] },
  cards: [
    { title: "Path", body: "out/latest.html" }
  ],
  notes: "Assignment — render the sample (SOLO 4). First artifact, no API keys. Timer: 25 min. Checklist: (1) test/render.test.ts red (2) src/render.ts + sample main until green (3) npm run brief:sample → out/latest.html (4) change one house-style rule test-first (5) keep 1440×900 screenshot for evidence. Check: npm run brief:sample produces out/latest.html. yes/no. Map: SOLO step 4. Also: test/render.test.ts · src/render.ts."
},

{ // 19 — SOLO 5
  lessonId: "workshop-5",
  title: "One read-only tool. No shell, no write.",
  kicker: "SOLO 5",
  type: "practice",
  timer: 20,
  visual: { keynote: true, popOut: 0, chipIcons: ["🔌"] },
  cards: [
    { title: "Path", body: "run.log" }
  ],
  notes: "Assignment — agent loop + one read-only tool (SOLO 5). Live run, then human. Timer: 20 min + live run. Checklist: (1) catch up from reference sources.ts / agent.ts (2) add one read-only tool (tool() + guarded()) (3) live npm run brief (4) every sentence traces to a run.log tool call. Check: no shell tool, no write tool; every sentence traceable. yes/no. Map: SOLO step 5. Also: reference/sources.ts · agent.ts."
},

{ // 20 — evidence
  lessonId: "workshop-5",
  title: "Evidence is not a vibes check",
  kicker: "Test",
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
  notes: "One idea: commands · exit codes · screenshot · named reviewer. Continuous proof. Differences from PDFs = OPEN. Lab: typecheck · test · brief (or sample) with exit codes + one quoted line each; screenshot under docs/evidence/; name the reviewer."
},

{ // 21 — SOLO 6
  lessonId: "workshop-5",
  title: "Proof a stranger can re-run.",
  kicker: "SOLO 6",
  type: "practice",
  timer: 15,
  visual: { keynote: true, popOut: 0, chipIcons: ["📄"] },
  cards: [
    { title: "Path", body: "docs/evidence.md" }
  ],
  notes: "Assignment — docs/evidence.md (SOLO 6). Timer: 15 min. Checklist: (1) run typecheck · test · brief (or sample); record exit codes (2) quote one line each (3) screenshot under docs/evidence/ (4) name the reviewer (or \"self next day\"). Check: three commands + screenshot path + reviewer name. yes/no. Map: SOLO step 6. Also: docs/evidence/ · reviewer name."
},

{ // 22 — gate
  lessonId: "workshop-5",
  title: "Human gate, then schedule",
  kicker: "Deploy",
  type: "concept",
  visual: { keynote: true, art: "gate", mdfile: 0, mdName: "docs/gate.md" },
  cards: [
    { title: "docs/gate.md", body: "PASS · FAIL · OPEN" }
  ],
  notes: "One idea: agent up to the gate; production needs named approval. Quotes required. No PASS on unread checks. No secrets in repo. PR vs intent.md → docs/gate.md → cron / Actions; secrets only in vault. Hooks help in-session; humans approve production."
},

{ // 23 — SOLO 7
  lessonId: "workshop-5",
  title: "Fill the gate. Open the PR.",
  kicker: "SOLO 7",
  type: "practice",
  timer: 15,
  visual: { keynote: true, popOut: 0, chipIcons: ["🚪"] },
  cards: [
    { title: "Path", body: "docs/gate.md" }
  ],
  notes: "Assignment — gate + schedule (SOLO 7). Timer: 15 min. Checklist: (1) fill docs/gate.md with PASS/FAIL/OPEN and quotes (2) refuse PASS on unread checks (3) credentials not in repo (4) schedule shape from gitlab-ci.example.yml or GH Actions (5) open the PR. Check: gate filled; no secrets in repo; PR open. yes/no. Map: SOLO step 7. Also: gitlab-ci.example.yml · Actions."
},

{ // 24 — close
  lessonId: "workshop-5",
  title: "Close the loop",
  kicker: "Maintain → new intent",
  type: "concept",
  layout: "steps",
  visual: { keynote: true, stepKeys: true, art: "loop", loopCaptions: true },
  items: [
    { label: "Run today", caption: "merged brief" },
    { label: "Signal", caption: "footnote" },
    { label: "New intent", caption: "tomorrow" },
    { label: "Triage", caption: "fix / schedule / dismiss" }
  ],
  notes: "One idea: production signal becomes the next intent.md. Tomorrow's run reads what you merged today. Playbook Stage 6. Human triages fix-now / schedule / dismiss."
},

{ // 25 — recap
  lessonId: "workshop-5",
  title: "Recap + Proof",
  kicker: "Done when",
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
  notes: "Done when: seven files · one brief you did not write · a gate you decided. Proof: intent + plan + verify-output + human gate. Point to lab README / SOLO When you are done. Soft credit: skills-pack for slash-method visuals — github.com/RyanLisse/claude-code-skills-pack"
},

];
