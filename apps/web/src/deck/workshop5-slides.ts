/** AET-77 Workshop day 5 — classroom-style deck with visible concepts and assignment timers.
 *  Vehicle LOCKED: https://github.com/RyanLisse/aetherlink-daily-brief-lab-s1 (empty main)
 *  Rhythm per concept: Look (one diagram) → Definition (the definition is the face) → Demo → Your turn.
 *  Classroom style: visible concept cards, AetherBOT, and on-slide exercise timers.
 *  Stages follow Anthropic's AI-native SDLC playbook: SOLO 1 Plan · 2 Design · 3–5 Build · 6 Test · 7 Deploy.
 *  All faces English. Forbidden: Classroom 1–2 rewrite; Eve dual-track; finished agent on lab main.
 */
const LESSON = "workshop-5";

/** Look face: one Academy-dark diagram from public/workshop-5, no definition yet. */
const look = (solo: number, title: string, image: string, notes: string): Record<string, unknown> => ({
  lessonId: LESSON,
  title,
  kicker: `Look · SOLO ${solo}`,
  type: "concept",
  visual: { opener: "showcase", image: `workshop-5/${image}`, imageLink: image },
  notes,
});

interface DefinitionContent {
  readonly subtitle: string;
  readonly cards: ReadonlyArray<{readonly title: string; readonly body: string}>;
  readonly keyPoints: ReadonlyArray<string>;
}

const definitionContent = {
  "AI-native SDLC": {
    subtitle: "AI sits at each stage of a loop while the old control objectives remain in force.",
    cards: [
      {title: "Loop", body: "The linear flow becomes a loop, with AI embedded at each point."},
      {title: "Judgment", body: "Agents collapse Build, not judgment."},
    ],
    keyPoints: ["Keep the old control objectives.", "Embed AI at each point.", "Agents collapse Build, not judgment."],
  },
  "intent.md": {
    subtitle: "The outcome, checks, boundary, and owners set the standard for every later step.",
    cards: [
      {title: "Proof", body: "Write three stranger-verifiable checks, including at least one OPEN."},
      {title: "Boundary", body: "Name what the agent may never touch; a wish is not a rule."},
    ],
    keyPoints: ["One outcome.", "Three checks and at least one OPEN.", "A hard boundary and named owners."],
  },
  "spec.md": {
    subtitle: "Quote reference examples before tests and build the structured output.",
    cards: [
      {title: "Red first", body: "test/schema.test.ts fails red before the implementation."},
      {title: "Green", body: "src/brief.ts and sample/brief.sample.json make npm test green."},
    ],
    keyPoints: ["Quote each field from reference/.", "Prove the schema test fails red.", "Build the schema-backed output."],
  },
  "plan.md": {
    subtitle: "A person accepts ordered steps before any build begins.",
    cards: [
      {title: "Ordered steps", body: "Name exact paths, a proof command per step, and rollback."},
      {title: "Human gate", body: "Stay in plan mode until a person accepts the plan."},
    ],
    keyPoints: ["Order the steps.", "Pair each step with proof and rollback.", "Wait for human acceptance."],
  },
  "CLAUDE.md": {
    subtitle: "The briefing every session reads first carries the conventions people maintain.",
    cards: [
      {title: "Always on", body: "Root CLAUDE.md sits alongside AGENTS.md, progress.md, and SOLO.md."},
      {title: "People write it", body: "Keep conventions, commands, and mistakes not to repeat."},
    ],
    keyPoints: ["Read the briefing first.", "Keep team conventions together.", "People write; agents follow."],
  },
  "progress.md": {
    subtitle: "Append what each SOLO proved and whether its status is VERIFIED or OPEN.",
    cards: [
      {title: "Append only", body: "Add progress after each SOLO; do not rewrite the history."},
      {title: "Record proof", body: "Include the step, proof command, and status."},
    ],
    keyPoints: ["Keep an append-only log.", "Record the proof command.", "Mark VERIFIED or OPEN."],
  },
  skills: {
    subtitle: "Claude loads a reusable method only when a later step needs it.",
    cards: [
      {title: "When needed", body: "Use an optional slash skill for a repeatable method such as security or brand rules."},
      {title: "Not a replacement", body: "A skill does not replace the daily-brief walk."},
    ],
    keyPoints: ["Load a method only when needed.", "Use the security or brand example.", "Keep the daily-brief walk."],
  },
  "vertical slice": {
    subtitle: "Start with one real page rendered from sample data.",
    cards: [
      {title: "Run", body: "npm run brief:sample writes out/latest.html without an API key or model call."},
      {title: "Trust boundary", body: "Model text is untrusted; the renderer escapes everything."},
    ],
    keyPoints: ["Render one working page.", "Use sample data without a model call.", "Escape untrusted model text."],
  },
  MCP: {
    subtitle: "Connect Claude to a source only when a step needs that system.",
    cards: [
      {title: "Connected sources", body: "They appear on the mcp=[…] line in run.log."},
      {title: "Brief agent", body: "Its sources are in-process MCP tools in src/sources.ts."},
    ],
    keyPoints: ["Add a source when needed.", "Check run.log for connected sources.", "Keep the brief agent's sources in src/sources.ts."],
  },
  subagents: {
    subtitle: "Delegate a planned parallel read, never the human's acceptance.",
    cards: [
      {title: "Own context", body: "A helper session has its own context."},
      {title: "Delegate work", body: "Spawn only when docs/plan.md names a parallel read."},
    ],
    keyPoints: ["Give the helper its own context.", "Name parallel reads in the plan.", "Keep acceptance with a person."],
  },
  tool: {
    subtitle: "The agent may call a guarded function, but this lab's tools only read.",
    cards: [
      {title: "Allowed tools", body: "Use only allowedTools matching mcp__<source>__*; there is no shell or file access."},
      {title: "After the run", body: "A guarded error becomes a note, not a guess; a human reviews the result."},
    ],
    keyPoints: ["Expose read-only tools.", "Turn errors into notes, not guesses.", "Keep the human after the run."],
  },
  evidence: {
    subtitle: "Make it possible for a stranger to repeat and review what ran.",
    cards: [
      {title: "Rerun", body: "Record the three commands and their exit codes."},
      {title: "Witness", body: "Add one quoted line per command, a screenshot, and a named reviewer."},
    ],
    keyPoints: ["Record commands and exit codes.", "Quote one line from each run.", "Name the reviewer."],
  },
  hooks: {
    subtitle: "A hook may stop or ask on an agent event, but it never approves.",
    cards: [
      {title: "Optional guard", body: "Use a stop/ask hook near the human gate."},
      {title: "Not approval", body: "Hooks are not named production approval."},
    ],
    keyPoints: ["Guard an agent event.", "Use stop or ask.", "Leave approval to the human gate."],
  },
  workflows: {
    subtitle: "Reuse the seven SOLO steps, then add the weekday schedule.",
    cards: [
      {title: "Seven steps", body: "SOLO 1 to 7 form the repeatable workflow in this lab."},
      {title: "Schedule", body: "SOLO 7 adds the weekday schedule with Actions or cron."},
    ],
    keyPoints: ["Reuse SOLO 1–7.", "Keep the workflow repeatable.", "Schedule with Actions or cron."],
  },
  gate: {
    subtitle: "A person compares the PR with intent.md and records PASS, FAIL, or OPEN.",
    cards: [
      {title: "Decision", body: "Write the status and the line that decided it in docs/gate.md."},
      {title: "Separation", body: "The code-writing agent never approves; green CI is an observation, not approval."},
    ],
    keyPoints: ["Compare the PR with intent.md.", "Quote the deciding line.", "Keep credentials in secrets."],
  },
  finding: {
    subtitle: "Turn a lesson from the running system into a change to intent.md.",
    cards: [
      {title: "Maintain", body: "At scale, an alert can trigger read-only diagnosis and a proposed PR."},
      {title: "Loop back", body: "Turn one OPEN from gate.md into a check in intent.md."},
    ],
    keyPoints: ["Name what the system taught you.", "Diagnose read-only.", "Carry the OPEN back into intent.md."],
  },
} satisfies Readonly<Record<string, DefinitionContent>>;

/** Definition face: the term is the hero card and the definition is its body. */
const define = (term: keyof typeof definitionContent, sentence: string, notes: string, path?: string): Record<string, unknown> => ({
  lessonId: LESSON,
  title: sentence,
  kicker: term,
  type: "concept",
  visual: { hero: 0 },
  subtitle: definitionContent[term].subtitle,
  cards: [
    {title: term, body: sentence},
    ...(path ? [{title: "Path", body: path}] : []),
    ...definitionContent[term].cards,
  ],
  keyPoints: definitionContent[term].keyPoints,
  notes,
});

const classroomBotRhythm = (slides: ReadonlyArray<Record<string, unknown>>): ReadonlyArray<Record<string, unknown>> => {
  let previousConceptBot: "think" | "point" = "point";
  return slides.map((slide) => {
    const rawVisual = slide.visual;
    const visual = rawVisual && typeof rawVisual === "object" && !Array.isArray(rawVisual)
      ? rawVisual as Record<string, unknown>
      : {};
    if (visual.opener === "showcase" || slide.type === "recap") return slide;
    const kicker = typeof slide.kicker === "string" ? slide.kicker : "";
    let bot: "wave" | "think" | "point" | "head" | undefined;
    if (slide.type === "context" || visual.opener === "welcome") bot = "wave";
    else if (slide.type === "practice") bot = "point";
    else if (slide.type === "pause") bot = "wave";
    else if (slide.type === "concept" && /guardrails|guardrail/i.test(kicker)) bot = "head";
    else if (
      slide.type === "concept" &&
      (/^Bridge\b|^Tomorrow:/i.test(kicker) || (typeof slide.title === "string" && /^Tomorrow[’']/i.test(slide.title)))
    ) bot = "point";
    else if (slide.type === "concept") {
      bot = previousConceptBot === "think" ? "point" : "think";
      previousConceptBot = bot;
    }
    return bot ? {...slide, visual: {...visual, bot, place: "beside"}} : slide;
  });
};

export const workshop5SourceSlides: ReadonlyArray<Record<string, unknown>> = classroomBotRhythm([

/* ========== Opening ========== */

{ // Welcome
  lessonId: LESSON,
  title: "Welcome to Workshop 5",
  kicker: "Workshop 5 · AI-native SDLC",
  type: "context",
  visual: { opener: 'welcome', bot: 'wave', place: 'beside' },
  subtitle: "Build one agent and walk its daily brief through the AI-native SDLC.",
  keyPoints: ["One agent.","One daily brief.","One end-to-end SDLC walk."],
  cards: [
    { title: "Build", body: "Make one agent." },
    { title: "Walk", body: "Move through the whole SDLC." },
  ],
  notes: "On screen while people walk in. One sentence of welcome; today we build one agent, a daily brief, and walk the whole AI-native SDLC with it."
},

{ // Plan of the day
  lessonId: LESSON,
  title: "The plan for today",
  kicker: "Workshop 5 · the day",
  type: "context",
  visual: { opener: "showcase", image: "workshop-5/agenda-dark.png", imageLink: "Morning · afternoon" },
  notes: "Morning: why AI-native and the loop, then SOLO 1–4 (Plan, Design, Build the plan, the first page). Break after SOLO 4 (as in the lab's SOLO.md). Afternoon: SOLO 5–7 (the agent, evidence, the gate), then Maintain: the next intent. Each SOLO runs look → definition → demo → your turn; the minutes are the hands-on part."
},

{ // Warm-up question
  lessonId: LESSON,
  title: "What does your SDLC look like today?",
  kicker: "Warm-up · your turn",
  type: "context",
  visual: { bot: 'wave', place: 'beside' },
  subtitle: "Map where requirements, tests, and review happen before comparing the loop.",
  keyPoints: ["Where do requirements live?","Who writes tests, and when?","Where does review happen?"],
  cards: [
    { title: "Requirements", body: "Tickets, docs, or people’s heads?" },
    { title: "Quality + review", body: "Who writes tests, when, and who can say no?" },
  ],
  notes: "Ask the room, 5 minutes. Prompts if it stays quiet: Where do requirements live today — tickets, docs, heads? Who writes the tests, and when? How long from idea to production? Where does review happen, and who can say no? Collect three answers on the board; we map them onto the table of shifts right after the definition."
},

/* ========== Framing ========== */

{ // Traditional line vs AI-native loop
  lessonId: LESSON,
  title: "The line vs the loop",
  kicker: "Workshop 5 · AI-native SDLC",
  type: "concept",
  visual: { opener: "showcase", image: "workshop-5/line-vs-loop-dark.png", imageLink: "Traditional — the line · AI-native — the loop" },
  notes: "Look. Left: Plan→Design→Build→Test→Deploy→Maintain as a vertical line. Right: the same stages as a loop with Claude in the middle. Humans stay above the loop: they instigate, direct and govern. Next: the definition."
},

define("AI-native SDLC",
  "A reimagined process: the old control objectives, new enforcement. Not a line but a loop, with AI embedded at each point.",
  "Definition, verbatim for the room: 'The AI-native SDLC is a reimagined process that combines the old control objectives with new enforcement. Instead of a linear flow, the process becomes a loop, and AI is embedded at each point.' Agents collapse Build, not judgment."),

{ // Traditional vs AI-native, per stage
  lessonId: LESSON,
  title: "The shifts across the six stages",
  kicker: "Explain · traditional vs AI-native",
  type: "concept",
  visual: { opener: "showcase", image: "workshop-5/shifts-dark.png", imageLink: "Traditional SDLC · AI-native SDLC" },
  notes: "Explain. The two ends of the spectrum, stage by stage; most organizations sit somewhere between the two columns. Map the room's warm-up answers onto the left column, then point at the right column: that is what we build today. Source: Anthropic, The AI-native SDLC playbook."
},

{ // The loop, after the definition
  lessonId: LESSON,
  title: "Hours, not weeks.",
  kicker: "Look · the loop",
  type: "concept",
  visual: { opener: "showcase", image: "workshop-5/loop-arrows-dark.png", imageLink: "AI-native — the loop" },
  notes: "Look. Walk the arrows clockwise: Plan → Design → Build → Test → Deploy → Maintain → Plan. Each stage leaves a file the next one reads — in the lab: intent.md → docs/spec.md → docs/plan.md → diff+tests → PR → docs/gate.md → new intent.md. Claude sits in the middle of every stage; humans stay above the loop, instigating, directing and governing. Diagram after Anthropic's AI-native SDLC playbook."
},

{ // Why
  lessonId: LESSON,
  title: "Code is no longer the bottleneck.",
  kicker: "Explain · why we change",
  type: "concept",
  visual: { opener: "showcase", image: "workshop-5/bottleneck-dark.png", imageLink: "Before agents · after agents" },
  notes: "Explain. Diagram after Anthropic's AI-native SDLC playbook: before agents every stage runs at human speed; after agents Build shrinks to a sliver and the cycle time is reclaimed. Agents collapse Build. Plan, Test, Deploy and Maintain stay human-speed; that is where the time goes now. Every stage ends with a committed file the next stage reads."
},

{ // The gap
  lessonId: LESSON,
  title: "Organizations have started using AI to write code at a speed unthinkable one year ago, yet the processes around the code haven't changed at the same pace.",
  kicker: "Explain · the gap",
  type: "concept",
  visual: {"phrase":"Organizations have started using AI to write code at a speed unthinkable one year ago, yet the processes around the code haven't changed at the same pace."},
  cards: [
    { title: "Source", body: "Louis Claxton · The AI-Native SDLC playbook" },
    { title: "Ask", body: "Where did the last feature wait longest?" },
  ],
  subtitle: "Code accelerates while the process around it lags; locate where the last feature waited.",
  keyPoints: ["Code moves faster.","The surrounding process has not kept pace.","Walk each stage with one agent."],
  notes: "Quote from the introduction of The AI-Native SDLC playbook (Louis Claxton, Claude by Anthropic), under 'Code is no longer the bottleneck'. Let it land, then ask: where did your last feature wait longest — writing the code, or everything around it? Today closes that gap by walking every stage with one agent."
},

{ // Vehicle
  lessonId: LESSON,
  title: "Clone the lab, empty main on purpose.",
  kicker: "Workshop 5 · vehicle",
  type: "context",
  visual: { bot: 'wave', place: 'beside' },
  cards: [
    { title: "Lab", body: "github.com/RyanLisse/aetherlink-daily-brief-lab-s1" },
    { title: "Branch", body: "Create your own branch; main is empty on purpose." },
  ],
  subtitle: "Use the empty-main daily-brief lab on your branch to walk SOLO 1–7.",
  keyPoints: ["Clone the locked lab.","Work on your branch.","Use the SOLO reference tags."],
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
  visual: { bot: 'point', place: 'beside' },
  cards: [
    { title: "Interview", body: "Fill intent.md one question at a time." },
    { title: "Push back", body: "Challenge a check that is only a wish." },
  ],
  subtitle: "Watch a one-question-at-a-time interview turn weak checks into tests.",
  keyPoints: ["Ask one question at a time.","Reject a wish as a check.","Compare the step-1-intent diff."],
  notes: "Demo. Prompt: 'Interview me one question at a time to fill intent.md in place. Push back when a check is a wish, not a test.' Accept one weak check on purpose, then catch it. Compare: git diff step-1-intent -- intent.md."
},

{
  lessonId: LESSON,
  title: "Write the outcome a stranger can verify.",
  kicker: "SOLO 1 / 7 · Your turn",
  type: "practice",
  layout: "exercise",
  timer: 15,
  visual: { bot: 'point', place: 'beside' },
  cards: [
    { title: "Path", body: "intent.md" }
  ],
  steps: ["Write one outcome sentence.","Add three stranger-verifiable success checks.","Name the hard boundary.","Name the owners.","Keep at least one check OPEN."],
  expected: "The intent has one outcome, three checks including an OPEN, a hard boundary, and named owners.",
  subtitle: "Write the intent fields before moving to the next SOLO.",
  keyPoints: ["Make the outcome pointable.","Include one OPEN check.","State what the agent may never touch."],
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
  visual: { bot: 'think', place: 'beside' },
  cards: [
    { title: "Quote", body: "Use an example for each field." },
    { title: "Test", body: "See test/schema.test.ts fail red before the implementation." },
  ],
  subtitle: "Quote the examples, prove the schema test fails, then make the implementation green.",
  keyPoints: ["Start from reference examples.","Prove the red test.","Run npm test to green."],
  notes: "Demo. Quote one field from reference/ into docs/spec.md; show test/schema.test.ts fail red; then green with src/brief.ts. Point at .describe(): prompt text living in the schema. Test commit before brief.ts."
},

{
  lessonId: LESSON,
  title: "Quoted examples → red schema → green.",
  kicker: "SOLO 2 / 7 · Your turn",
  type: "practice",
  layout: "exercise",
  timer: 25,
  visual: { bot: 'point', place: 'beside' },
  cards: [
    { title: "Path", body: "docs/spec.md" }
  ],
  steps: ["Quote one reference example per field in docs/spec.md.","Make test/schema.test.ts fail red.","Update src/brief.ts and sample/brief.sample.json until npm test is green.","Put the test commit before brief.ts in git log."],
  expected: "The test commit appears before brief.ts in git log.",
  subtitle: "Build the schema-backed brief from quoted reference examples.",
  keyPoints: ["Quote every field.","Prove the schema test fails red.","Commit the test before implementation."],
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
  visual: { bot: 'point', place: 'beside' },
  cards: [
    { title: "Plan mode", body: "Sketch docs/plan.md before build files." },
    { title: "Accept", body: "Pause at the human gate before any build." },
  ],
  subtitle: "Use plan mode to write proof-backed steps and pause for human acceptance.",
  keyPoints: ["Add a proof command per step.","Reject a step without proof.","Wait for human acceptance."],
  notes: "Demo. Shift+Tab into plan mode; sketch docs/plan.md with one proof command per step; reject a step without one; pause at the human accept gate before any build files."
},

{
  lessonId: LESSON,
  title: "Stay in plan mode until a human accepts.",
  kicker: "SOLO 3 / 7 · Your turn",
  type: "practice",
  layout: "exercise",
  timer: 15,
  visual: { bot: 'point', place: 'beside' },
  cards: [
    { title: "Path", body: "docs/plan.md" }
  ],
  steps: ["Write docs/design.md.","Add one real ADR under docs/decisions/.","Write ordered docs/plan.md steps with exact paths, proof commands, rollback, and a gate.","Stay in plan mode until a human accepts."],
  expected: "Every plan step has a proof command and rollback, and a human accepts before build.",
  subtitle: "Write the design and ordered plan, then wait for human acceptance.",
  keyPoints: ["Record the design.","Add one ADR.","Keep the proof and rollback on every step."],
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
  visual: { bot: 'think', place: 'beside' },
  cards: [
    { title: "Test first", body: "Prove the render test fails before the fix." },
    { title: "Sample", body: "Write out/latest.html without API keys or a model call." },
  ],
  subtitle: "Run the sample renderer after a red test and inspect the safe output.",
  keyPoints: ["Keep the render test test-first.","Use the sample path.","Capture the screenshot as evidence."],
  notes: "Demo. Red render test → green; the escape test: assert.ok(!html.includes('<script>alert')). npm run brief:sample writes out/latest.html; open it next to the PDF. No API keys."
},

{
  lessonId: LESSON,
  title: "Red render test → green sample HTML.",
  kicker: "SOLO 4 / 7 · Your turn",
  type: "practice",
  layout: "exercise",
  timer: 25,
  visual: { bot: 'point', place: 'beside' },
  cards: [
    { title: "Path", body: "out/latest.html" }
  ],
  steps: ["Make test/render.test.ts fail red.","Implement src/render.ts and a sample-only src/main.ts until green.","Run npm run brief:sample to write out/latest.html.","Change one house-style rule test-first.","Keep a 1440×900 screenshot as evidence."],
  expected: "npm run brief:sample produces out/latest.html and a 1440×900 screenshot is saved.",
  subtitle: "Build the sample renderer test-first and capture the 1440×900 result.",
  keyPoints: ["Start with a red render test.","Use the sample-only entry point.","Capture the rendered evidence."],
  notes: "Your turn — render the sample (SOLO 4 / 7). Open lab path: out/latest.html (also test/render.test.ts · src/render.ts · src/main.ts). Timer: 25 min. Checklist: (1) test/render.test.ts red (2) src/render.ts + sample-only src/main.ts until green (3) npm run brief:sample → out/latest.html (4) change one house-style rule test-first (5) keep 1440×900 screenshot for evidence. Check: npm run brief:sample produces out/latest.html. yes/no. Map: SOLO step 4 · tag step-4-build-render."
},

{ // Break after SOLO 4
  lessonId: "workshop-5",
  title: "Break",
  kicker: "Workshop 5 · afternoon",
  type: "pause",
  visual: { countdown: 15, bot: 'wave', place: 'beside' },
  notes: "Break after SOLO 4, as scheduled in the Workshop 5 plan. Afternoon resumes with SOLO 5."
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
  visual: { bot: 'point', place: 'beside' },
  cards: [
    { title: "Read-only", body: "Show one tool call and no shell or write tool." },
    { title: "Trace", body: "Tie each sentence to a run.log tool call." },
  ],
  subtitle: "Add one read-only tool and trace every agent sentence to run.log.",
  keyPoints: ["Use guarded() for the tool.","Keep the agent read-only.","Trace output to run.log."],
  notes: "Demo. Catch up reference src/sources.ts · src/agent.ts · src/main.ts · test/agent.test.ts; add one read-only tool(); show no shell / no write; trace one sentence to run.log."
},

{
  lessonId: LESSON,
  title: "One read-only tool. No shell, no write.",
  kicker: "SOLO 5 / 7 · Your turn",
  type: "practice",
  layout: "exercise",
  timer: 20,
  visual: { bot: 'point', place: 'beside' },
  cards: [
    { title: "Path", body: "src/agent.ts" }
  ],
  steps: ["Check out the step-5-build-agent reference files.","Add one read-only tool with tool() and guarded().","Run npm run brief live.","Trace every sentence to a run.log tool call."],
  expected: "The live run uses no shell or write tool, and every sentence traces to run.log.",
  subtitle: "Add one guarded read-only source and trace the live brief to its evidence.",
  keyPoints: ["Keep the tool read-only.","Run the brief live.","Trace every sentence to a tool call."],
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
  visual: { bot: 'think', place: 'beside' },
  cards: [
    { title: "Run", body: "Execute typecheck, test, and brief:sample." },
    { title: "Record", body: "Write exit codes and one quoted line per command." },
  ],
  subtitle: "Record command exit codes, quoted output, and a screenshot a stranger can rerun.",
  keyPoints: ["Record what ran.","Mark anything not run OPEN.","Rerun one command by hand."],
  notes: "Demo. Let Claude run typecheck · test · brief:sample and write docs/evidence.md (command, exit code, one quoted line, anything not run is OPEN). Then rerun one command by hand and compare."
},

{
  lessonId: LESSON,
  title: "Proof a stranger can re-run.",
  kicker: "SOLO 6 / 7 · Your turn",
  type: "practice",
  layout: "exercise",
  timer: 15,
  visual: { bot: 'point', place: 'beside' },
  cards: [
    { title: "Path", body: "docs/evidence.md" }
  ],
  steps: ["Run typecheck, test, and brief or sample; record exit codes.","Quote one output line per command.","Save a screenshot under docs/evidence/.","Name the reviewer."],
  expected: "Three commands, their quoted output, a screenshot path, and a reviewer are recorded.",
  subtitle: "Make the run and its evidence repeatable for a named reviewer.",
  keyPoints: ["Record exit codes.","Capture a screenshot.","Name who reran it."],
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
  visual: { bot: 'point', place: 'beside' },
  cards: [
    { title: "Gate", body: "Refuse PASS on unread checks." },
    { title: "PR", body: "Show the weekday schedule and open the PR." },
  ],
  subtitle: "Fill PASS, FAIL, or OPEN with quotes, then open a PR without secrets.",
  keyPoints: ["Quote the deciding evidence.","Keep unread checks OPEN.","Keep credentials out of the repo."],
  notes: "Demo. Fill docs/gate.md PASS/FAIL/OPEN with quotes; refuse PASS on unread checks; point at gitlab-ci.example.yml; open a PR (no secrets). Reference decision: OPEN, decided by `tools: [],` in src/agent.ts. An honest OPEN beats a hopeful PASS."
},

{
  lessonId: LESSON,
  title: "Fill the gate. Open the PR.",
  kicker: "SOLO 7 / 7 · Your turn",
  type: "practice",
  layout: "exercise",
  timer: 15,
  visual: { bot: 'point', place: 'beside' },
  cards: [
    { title: "Path", body: "docs/gate.md" }
  ],
  steps: ["Fill docs/gate.md with PASS, FAIL, or OPEN and quotes.","Refuse PASS on unread checks.","Keep credentials out of the repo.","Record the schedule from gitlab-ci.example.yml or GH Actions.","Open the PR."],
  expected: "The gate is filled, secrets stay out of the repo, and the PR is open.",
  subtitle: "Record the human gate and schedule, then open the PR.",
  keyPoints: ["Quote the gate evidence.","Keep unread checks OPEN.","Open the PR with the schedule."],
  notes: "Your turn — gate + schedule (SOLO 7 / 7). Open lab path: docs/gate.md (also gitlab-ci.example.yml · open the PR). Timer: 15 min. Checklist: (1) fill docs/gate.md with PASS/FAIL/OPEN and quotes (2) refuse PASS on unread checks (3) credentials not in repo (4) schedule shape from gitlab-ci.example.yml or GH Actions (5) open the PR. Check: gate filled; no secrets in repo; PR open. yes/no. Map: SOLO step 7 · tag step-7-gate-deploy."
},

/* ========== Maintain + close ========== */

{ // Maintain look
  lessonId: LESSON,
  title: "Tomorrow's run reads what you merged today.",
  kicker: "Look · Maintain → new intent.md",
  type: "concept",
  visual: { opener: "showcase", image: "workshop-5/loop-dark.png", imageLink: "loop-dark.png" },
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
  layout: "recap",
  visual: { recapKeys: true },
  items: [
    { label: "Seven files", caption: "Intent, spec, plan, rendered brief, evidence, gate, and PR." },
    { label: "One brief", caption: "The brief is not written by the participant." },
    { label: "One gate", caption: "A person decides from the evidence." },
    { label: "Next intent", caption: "Carry the next finding back into the loop." },
  ],
  notes: "Recap + proof. Done when seven lab files a stranger can point at: intent.md · docs/spec.md · docs/plan.md · out/latest.html · docs/evidence.md · docs/gate.md · PR open — plus one brief you did not write and a gate you decided — inside github.com/RyanLisse/aetherlink-daily-brief-lab-s1. Rhythm held: look → definition → demo → your turn."
},

]);
