/** AET-77 Workshop day 5 — AI-native SDLC (minimal + visual-first).
 *  SoT: HANDOFF-AET-77-MINIMAL.md (addenda 1–3) · OUTLINE-AET-77.md
 *  Visual cue pack: https://github.com/RyanLisse/claude-code-skills-pack
 *  Projector: title + one idea + diagram/chip hero. Timers/checklists → notes.
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
/* Nine highlight slides — visual-first (addenda 1–3)                      */
/* ---------------------------------------------------------------------- */

{ // 5 — AI-native SDLC (diagram)
  lessonId: "workshop-5",
  title: "AI-native SDLC",
  kicker: "Definition",
  subtitle: "Artifacts + gates. Agents collapse Build — not judgment.",
  type: "concept",
  layout: "steps",
  visual: { stepKeys: true, art: "loop", loopCaptions: true },
  items: [
    { label: "Plan", caption: "intent" },
    { label: "Design", caption: "spec · plan" },
    { label: "Build", caption: "diff · tests" },
    { label: "Test", caption: "evidence" },
    { label: "Deploy", caption: "gate" },
    { label: "Maintain", caption: "new intent" }
  ],
  tagline: "Proof in git. Humans at the accept gates.",
  notes: "Visual loop of the AI-native SDLC. Point: Build sped up; Plan/Test/Deploy/Maintain stay human-speed. Tie to artifact chain on slide 3."
},

{ // 6 — intent.md (file hero + section chips from skills-pack examples/intent.md)
  lessonId: "workshop-5",
  title: "intent.md",
  kicker: "Definition · Plan",
  subtitle: "Humans write it. Agents work toward it.",
  type: "concept",
  visual: { mdfile: 0, mdName: "intent.md", chipGrid: 1, chipIcons: ["❗", "✅", "🛑", "👤", "🔗"] },
  cards: [
    { title: "intent.md", body: "Problem\nOutcome\nConstraints / stop\nRoster\nArtifact chain" }
  ],
  tagline: "If it is not written here, it is not the shared goal.",
  notes: "File hero mirrors examples/intent.md from github.com/RyanLisse/claude-code-skills-pack (sections as chips, not full dump). Gate: wish ≠ rule."
},

{ // 7 — SOLO 1
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

{ // 8 — spec.md (file hero)
  lessonId: "workshop-5",
  title: "spec.md",
  kicker: "Definition · Design",
  subtitle: "Testable contract. Quote sources. Red before green.",
  type: "concept",
  visual: { mdfile: 0, mdName: "docs/spec.md", runner: [{ label: "schema red", tone: "red" }, { label: "schema green", tone: "green" }] },
  cards: [
    { title: "docs/spec.md", body: "Quoted fields\ntest/schema.test.ts\nsrc/brief.ts" }
  ],
  tagline: "No invented fields.",
  notes: "Hero file docs/spec.md. Visual: red→green schema. Still a human gate when Design is compressed."
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

{ // 10 — plan.md (gate visual)
  lessonId: "workshop-5",
  title: "plan.md",
  kicker: "Definition · Design / Build",
  subtitle: "Ordered steps + proof. Read-only until accept.",
  type: "concept",
  visual: { art: "gate", mdfile: 0, mdName: "docs/plan.md" },
  cards: [
    { title: "docs/plan.md", body: "Steps\nPaths\nProof commands\nRollback\nGate" }
  ],
  tagline: "Explore → Plan → approval gate → Change.",
  notes: "Gate art: plan mode stays read-only until a human accepts. Approved plan is the audit trail the PR later checks against."
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

{ // 12 — skills (slash-command chips from skills-pack)
  lessonId: "workshop-5",
  title: "skills",
  kicker: "Definition · /slash methods",
  subtitle: "Folder + SKILL.md → type /name, get a method.",
  type: "concept",
  visual: {
    tree: 0,
    chipGrid: 1,
    chipIcons: ["🧠", "🧹", "✅", "🚢", "🗺", "📋"]
  },
  cards: [
    { title: ".claude/skills/…/SKILL.md", body: "/eli5\n/deslop\n/verify-this\n/review-and-ship\n/archify\n/handoff" }
  ],
  tagline: "Reusable method — not a background agent.",
  notes: "Visual: skill folder tree + slash chips from github.com/RyanLisse/claude-code-skills-pack (cite once). Soft: pack is optional install for the room; lab still uses daily-brief SOLO. Skill ≠ continuous process."
},

{ // 13 — hooks (gate on tool event)
  lessonId: "workshop-5",
  title: "hooks",
  kicker: "Definition · tool events",
  subtitle: "Deterministic automation around tool events.",
  type: "concept",
  visual: { art: "gate" },
  cards: [
    { title: "Before / after", body: "PreToolUse\nPostToolUse\nStop / notify" },
    { title: "Idea", body: "Suggest /deslop\nSuggest /fix-ci\nNever ship secrets" }
  ],
  tagline: "Hooks are optional gates — humans still own production.",
  notes: "From skills-pack notes/hooks-notes.md: pack does not ship mandatory hooks; ideas only (remind /deslop, suggest /fix-ci). No secrets in hook scripts. Tie to Deploy: hooks ≠ named production approval."
},

{ // 14 — MCP (plugs visual)
  lessonId: "workshop-5",
  title: "MCP",
  kicker: "Definition · approved plug",
  subtitle: "One standard plug for approved tools and data.",
  type: "concept",
  visual: { plugs: 1 },
  cards: [
    { title: "Local", body: "Files + project commands\nbuilt-in tools" },
    { title: "Outside via MCP", body: "resources\nprompts\ntools" }
  ],
  tagline: "Connected ≠ allowed. /mcp to inspect.",
  notes: "Reuse Classroom MCP plug visual. Files local; MCP for approved outside. n8n→Claude lock stays — no Eve dual-track."
},

{ // 15 — subagents (parent + side worker)
  lessonId: "workshop-5",
  title: "subagents",
  kicker: "Definition · Agents SDK",
  subtitle: "One bounded job each. Parent keeps the gate.",
  type: "concept",
  layout: "compare",
  visual: { art: "flow", bot: "multiarm", place: "slot" },
  columns: [
    { title: "Parent", items: ["Owns intent", "Accepts plan", "Named gate"], foot: "Judgment stays here" },
    { title: "Subagent", items: ["One clear job", "Bounded tools", "Reports back"], foot: "No unsupervised swarm" }
  ],
  tagline: "Delegate the work — not the accept.",
  notes: "Day 5 after n8n + Agents SDK. Subagent = bounded specialist; parent/human owns accept. Soft Archify cue: maps help see the split — don't require live Archify."
},

{ // 16 — workflows (chain / map)
  lessonId: "workshop-5",
  title: "workflows",
  kicker: "Definition · reusable path",
  subtitle: "A bounded path other people can reuse.",
  type: "concept",
  layout: "steps",
  visual: { stepKeys: true, art: "loop" },
  items: [
    { label: "intent", caption: "align" },
    { label: "skill / agent", caption: "method" },
    { label: "proof", caption: "checks" },
    { label: "gate", caption: "human" },
    { label: "ship", caption: "PR / schedule" }
  ],
  tagline: "Useful · safe · verifiable · reusable.",
  notes: "Workflow = the artifact chain + human gate, optionally sped by skills-pack slash methods. Soft Archify: system maps visualize the path — optional."
},

{ // 17 — build concept
  lessonId: "workshop-5",
  title: "Build with a feedback loop",
  kicker: "Build",
  subtitle: "Agent checks its own work; human reviews intent + risk.",
  type: "concept",
  layout: "pillars",
  visual: { pillarIcons: true, bot: "head", place: "under" },
  items: [
    { label: "Agent checks", caption: "tests / build / shot" },
    { label: "Human reviews", caption: "intent + risk" },
    { label: "Bound today", caption: "no shell / no write" }
  ],
  tagline: "Proof in the session; judgment with the human.",
  notes: "Playbook: give the agent a way to check its own work. Bound for today: no shell, no write on the brief agent."
},

{ // 18 — SOLO 4
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

{ // 19 — SOLO 5
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

{ // 20 — evidence
  lessonId: "workshop-5",
  title: "Evidence is not a vibes check",
  kicker: "Test",
  subtitle: "Commands · exit codes · screenshot · named reviewer.",
  type: "concept",
  visual: { mdfile: 0, mdName: "docs/evidence.md", runner: [{ label: "typecheck", tone: "green" }, { label: "test", tone: "green" }, { label: "brief", tone: "green" }] },
  cards: [
    { title: "docs/evidence.md", body: "exit codes\nquoted lines\nscreenshot path\nreviewer" }
  ],
  tagline: "Differences from PDFs = OPEN.",
  notes: "Continuous proof. Lab: typecheck · test · brief (or sample) with exit codes + one quoted line each; screenshot under docs/evidence/; name the reviewer."
},

{ // 21 — SOLO 6
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

{ // 22 — gate
  lessonId: "workshop-5",
  title: "Human gate, then schedule",
  kicker: "Deploy",
  subtitle: "Agent up to the gate; production needs named approval.",
  type: "concept",
  visual: { art: "gate", mdfile: 0, mdName: "docs/gate.md" },
  cards: [
    { title: "docs/gate.md", body: "PASS · FAIL · OPEN\nquotes required" }
  ],
  tagline: "No PASS on unread checks. No secrets in repo.",
  notes: "PR vs intent.md → docs/gate.md → cron / Actions; secrets only in vault. Hooks help in-session; humans approve production."
},

{ // 23 — SOLO 7
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

{ // 24 — close
  lessonId: "workshop-5",
  title: "Close the loop",
  kicker: "Maintain → new intent",
  subtitle: "Production signal becomes the next intent.md.",
  type: "concept",
  layout: "steps",
  visual: { stepKeys: true, art: "loop", loopCaptions: true },
  items: [
    { label: "Run today", caption: "merged brief" },
    { label: "Signal", caption: "footnote" },
    { label: "New intent", caption: "tomorrow" },
    { label: "Triage", caption: "fix / schedule / dismiss" }
  ],
  tagline: "Tomorrow's run reads what you merged today.",
  notes: "Playbook Stage 6. Human triages fix-now / schedule / dismiss."
},

{ // 25 — recap
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
  tagline: "Proof: intent + plan + verify-output + human gate.",
  notes: "Point to lab README / SOLO When you are done. Soft credit: skills-pack for slash-method visuals — github.com/RyanLisse/claude-code-skills-pack"
},

];
