/** AET-79 Workshop day 3 — classroom-style deck with visible concepts and assignment timers.
 *  OUTLINE-AET-79 · PRODUCT-ACCEPT-OUTLINE-AET-79 · PEDAGOGY-RHYTHM · CLASSROOM-STYLE
 *  Vehicle: n8n support ticket → priority Low/Med/High · L1 Switch → L2 AI Agent+memory → L3 Reply+Risk
 *  Classroom style: visible concept cards, AetherBOT, and on-slide exercise timers.
 *  Exercises show their steps and timers on-slide; facilitator notes remain.
 *  Forbidden: Classroom 1–2 rewrite; Eve dual-track; W5 SDLC into this deck; secrets on screen.
 */
export const workshop3SourceSlides: ReadonlyArray<Record<string, unknown>> = [

/* ========== Open ========== */

{ // 1
  lessonId: "workshop-3",
  title: "One ticket. Three agency levels.",
  kicker: "Workshop 3 · Day 3 · L1→L3",
  type: "concept",
  visual: { bot: 'wave', place: 'beside' },
  subtitle: "Workshop 4 carries the labels, specialist split, and human review gate into three Agent SDK lessons.",
  keyPoints: ["Keep the same priority labels.","Keep analysis and reply writing separate.","Review drafts before they reach a customer."],
  cards: [
    { title: "One ticket", body: "Carry the same scenario through the day." },
    { title: "L1 → L2 → L3", body: "Move from business rules to judgment to specialists." },
  ],
  notes: "Open. One scenario, three agency levels on n8n. Rhythm all day: explain, demonstrate, participants try, discuss. Goal ≥L2; stretch L3. Workshop 4 keeps the labels, specialist split, and human review gate while teaching one Agent SDK agent, subagents, and MCP transaction lookup."
},

{ // 2
  lessonId: "workshop-3",
  title: "Ticket in. Low / Med / High out.",
  kicker: "Vehicle · one ticket · three levels",
  type: "context",
  visual: { bot: 'wave', place: 'beside' },
  subtitle: "Keep one n8n ticket in view while routing it to Low, Med, or High.",
  keyPoints: ["One ticket.","Three labels.","Optional reply at L3."],
  cards: [
    { title: "Input", body: "Start with the shared ticket fixture." },
    { title: "Output", body: "Return a Low, Med, or High label." },
  ],
  notes: "The vehicle. Ticket in → Low/Med/High out (+ optional reply at L3). Point at local n8n (run npm install once in training-lab/w3-n8n-triage; on Windows this can take 15–25 minutes, so do it before the workshop, then npm run n8n) or the optional workshop instance + screenshot pack under /workshop-3/. No vehicle = fail the through-line. Soft: AET-84 starter JSON when ready — does not block today."
},

{ // 3
  lessonId: "workshop-3",
  title: "Automation is not an agent.",
  kicker: "Explain · why the ladder",
  type: "concept",
  visual: { bot: 'think', place: 'beside' },
  subtitle: "L1 is a business rule; agent judgment starts at L2.",
  keyPoints: ["L1 has no LLM.","L2 adds an AI Agent and memory.","A human gate stays before done."],
  cards: [
    { title: "L1 · Rules", body: "Route the ticket without an LLM." },
    { title: "L2 · Judgment", body: "A bounded AI Agent drafts priority." },
  ],
  notes: "Explain. L1 = business rule without LLM. L2 = judgment (one AI Agent + memory). L3 = specialists (Reply + Risk). Human gate before “done” / customer-facing."
},

{ // 4
  lessonId: "workshop-3",
  title: "Same tickets all day.",
  kicker: "Scenario · shared fixture",
  type: "concept",
  visual: { bot: 'point', place: 'beside' },
  subtitle: "A shared fixture keeps expected labels stable as agency increases.",
  keyPoints: ["Reuse the fixture.","Keep the expected label visible.","No production writes or secrets on screen."],
  cards: [
    { title: "Examples", body: "Use at least three example tickets." },
    { title: "Expected", body: "Record the expected Low / Med / High label." },
  ],
  notes: "Shared fixture. ≥3 example tickets with expected L/M/H. Workshop 4 uses new messages. No prod writes. Secrets off screen."
},

/* ========== Cycle L1 — Switch ========== */

{ // 5
  lessonId: "workshop-3",
  title: "L1 is a Switch — no LLM.",
  kicker: "Explain · L1 · deterministic routing",
  type: "concept",
  visual: { bot: 'think', place: 'beside' },
  subtitle: "Route each ticket with deterministic Switch rules, without an LLM.",
  keyPoints: ["Use deterministic rules.","Cover the branches.","Show the error path."],
  cards: [
    { title: "Input", body: "Read the ticket fields." },
    { title: "Branches", body: "Route to Low, Med, or High." },
  ],
  notes: "Explain — L1 Switch / rules. Ticket → Switch → L/M/H. No LLM. Cover input, branches, and error path."
},

{ // 6
  lessonId: "workshop-3",
  title: "Watch: L1 Switch routes the ticket.",
  kicker: "Demo · L1",
  type: "concept",
  visual: { opener: "showcase", image: "workshop-3/01-n8n.jpeg", imageLink: "n8n · L1 Switch" },
  notes: "Demo — L1. Facilitator walks screenshot 01-n8n.jpeg or live import. Room watches; does not build yet. Script: open flow → show Switch branches → run one fixture ticket → label matches."
},

{ // 7
  lessonId: "workshop-3",
  title: "Build or inspect L1 on your machine.",
  kicker: "L1 · Your turn",
  type: "practice",
  layout: "exercise",
  timer: 15,
  visual: { bot: 'point', place: 'beside' },
  cards: [
    { title: "Level", body: "L1" }
  ],
  steps: ["Run the flow.","Match the fixture label.","Note the steps.","Ask a human to confirm the branch."],
  expected: "The flow runs, its label matches the fixture, the steps are noted, and a human confirms the branch before L2.",
  subtitle: "Run or inspect the deterministic L1 flow and hold the human gate before L2.",
  keyPoints: ["Run the L1 flow.","Match the expected label.","Confirm the branch with a human."],
  notes: "Your turn — L1 on your machine. Timer: 15 min. Checklist: (1) flow runs (2) label matches fixture (3) steps noted (4) human confirms branch. Gate before L2 — required."
},

/* ========== Cycle L2 — AI Agent + memory ========== */

{ // 8
  lessonId: "workshop-3",
  title: "L2 adds one AI Agent with memory.",
  kicker: "Explain · L2 · judgment enters",
  type: "concept",
  visual: { bot: 'point', place: 'beside' },
  subtitle: "One bounded AI Agent drafts priority while a human reviews it.",
  keyPoints: ["Same ticket chain.","Agent drafts priority.","Human review before sending."],
  cards: [
    { title: "Agent", body: "Add one bounded AI Agent to the same chain." },
    { title: "Memory", body: "Keep the existing ticket context." },
  ],
  notes: "Explain — L2. Same chain + one bounded AI Agent. Agent drafts priority; human reviews. Capture trace/settings. OpenAI node in screenshots OK — day 4 swaps stack."
},

{ // 9
  lessonId: "workshop-3",
  title: "Watch: L2 Agent drafts priority.",
  kicker: "Demo · L2",
  type: "concept",
  visual: { opener: "showcase", image: "workshop-3/02-n8n.jpeg", imageLink: "n8n · L2 AI Agent + memory" },
  notes: "Demo — L2. Screenshot 02-n8n.jpeg or live. Show Agent + memory, draft priority, human review pause. Room watches."
},

{ // 10
  lessonId: "workshop-3",
  title: "Reach L2 on your own machine.",
  kicker: "L2 · Your turn · solo bar",
  type: "practice",
  layout: "exercise",
  timer: 20,
  visual: { bot: 'point', place: 'beside' },
  cards: [
    { title: "Level", body: "L2" }
  ],
  steps: ["Record an AI run.","Have a human review the priority.","Prevent silent auto-send.","Start the Proof fields."],
  expected: "An AI run is recorded, a human reviews the priority, auto-send stays off, and Proof fields are started.",
  subtitle: "Record one AI run and make the human review visible before anything is sent.",
  keyPoints: ["Record the AI run.","Review the priority with a human.","Keep auto-send off."],
  notes: "Your turn — L2. Solo bar = ≥L2 required. Timer: 20 min. Checklist: (1) AI run recorded (2) human reviewed priority (3) no silent auto-send (4) Proof fields started."
},

/* ========== Cycle L3 — Multi-agent (stretch) ========== */

{ // 11
  lessonId: "workshop-3",
  title: "L3 splits Reply and Risk.",
  kicker: "Explain · L3 · specialists · one gate",
  type: "concept",
  visual: { bot: 'think', place: 'beside' },
  subtitle: "L3 separates Reply and Risk specialists but keeps one human gate.",
  keyPoints: ["Split the specialist roles.","Document who does what.","Keep the human gate before done."],
  cards: [
    { title: "Reply", body: "Draft a customer-facing reply." },
    { title: "Risk", body: "Assess risk or priority." },
  ],
  notes: "Explain — L3. Split reply vs risk/priority; orchestrate; document who does what; human gate before done. Stretch — not required for solo bar."
},

{ // 12
  lessonId: "workshop-3",
  title: "Watch: L3 specialists, one gate.",
  kicker: "Demo · L3",
  type: "concept",
  visual: { opener: "showcase", image: "workshop-3/03-n8n.jpeg", imageLink: "n8n · L3 Reply + Risk" },
  notes: "Demo — L3. Screenshot 03-n8n.jpeg or live. Stretch demo — not required for solo bar. Name two roles and the human gate."
},

{ // 13
  lessonId: "workshop-3",
  title: "Stretch L3 — same tickets.",
  kicker: "L3 · Your turn · optional",
  type: "practice",
  layout: "exercise",
  timer: 15,
  visual: { bot: 'point', place: 'beside' },
  cards: [
    { title: "Level", body: "L3" }
  ],
  steps: ["Name two specialist roles.","Produce a joint output.","Make the human gate explicit."],
  expected: "Two specialist roles produce a joint output with an explicit human gate.",
  subtitle: "Stretch the same tickets into two specialist roles with one explicit human gate.",
  keyPoints: ["Name the two roles.","Show their joint output.","Keep the human gate explicit."],
  notes: "Your turn — L3 stretch (optional). Timer: 15 min. Checklist: (1) two roles named (2) joint output (3) human gate explicit."
},

/* ========== Proof + bridge ========== */

{ // 14
  lessonId: "workshop-3",
  title: "Proof is not vibes.",
  kicker: "Explain · export · rules · gate",
  type: "concept",
  visual: { bot: 'point', place: 'beside' },
  subtitle: "A working flow, export or screenshot, and short routing explanation make the result checkable.",
  keyPoints: ["Show the working flow.","Explain the routing rules.","Keep labels for day 4 to rerun."],
  cards: [
    { title: "Working flow", body: "Leave the flow runnable." },
    { title: "Proof pack", body: "Capture an export or screenshot." },
  ],
  notes: "Explain — Proof. Working flow + export/screenshot + short routing explanation. Same labels day 4 will re-run."
},

{ // 15
  lessonId: "workshop-3",
  title: "Export your Proof pack before you leave.",
  kicker: "Proof · Your turn",
  type: "practice",
  layout: "exercise",
  timer: 10,
  visual: { bot: 'point', place: 'beside' },
  cards: [
    { title: "Pack", body: "Proof" }
  ],
  steps: ["Capture a screenshot or export.","Write the L/M/H rules in one paragraph.","Name the human gate.","Record the level reached."],
  expected: "The Proof pack includes an export or screenshot, routing rules, a named human gate, and the level reached.",
  subtitle: "Capture what ran and leave the routing rules and human gate in a checkable Proof pack.",
  keyPoints: ["Capture the flow.","Explain the L/M/H rules.","Name the gate and level."],
  notes: "Your turn — Proof pack on your machine before you leave. Timer: 10 min. Checklist: (1) screenshot/export (2) L/M/H rules in one paragraph (3) human gate named (4) level reached."
},

{ // 16
  lessonId: "workshop-3",
  title: "Workshop 4 takes this pattern to the Agent SDK.",
  kicker: "Bridge · → Workshop 4",
  type: "concept",
  visual: { bot: 'point', place: 'beside' },
  subtitle: "Workshop 4 keeps the labels, specialist split, and human gate while teaching three Agent SDK lessons.",
  keyPoints: ["Keep the same priority labels.","Keep the specialist split and human review gate.","Learn one agent, subagents, and MCP."],
  cards: [
    { title: "Keep", body: "Carry labels, specialist roles, and human review forward." },
    { title: "Learn", body: "Start with one agent, then subagents, then MCP." },
  ],
  notes: "Bridge. Workshop 4 carries the LOW, MEDIUM, and HIGH labels, the specialist split, and the human review gate into the Claude Agent SDK. The three lessons are one agent with CLAUDE.md, an orchestrator with subagents, and MCP transaction lookup. Workshop 4 uses new messages and a separate workbook."
},

{ // 17
  lessonId: "workshop-3",
  title: "Your own n8n. No prod.",
  kicker: "Guardrails",
  type: "concept",
  visual: { bot: 'head', place: 'beside' },
  subtitle: "Keep the exercise on local n8n or the workshop instance and show evidence for model runs.",
  keyPoints: ["Use local n8n or the workshop instance.","Never show secrets.","An import alone is not model-run proof."],
  cards: [
    { title: "No production writes", body: "Do not connect real Jira or payments." },
    { title: "Protect secrets", body: "Keep credentials off screen." },
  ],
  notes: "Guardrails. No real Jira/payments; no secrets on screen; import ≠ model-run proof without trace."
},

/* ========== Close ========== */

{ // 18
  lessonId: "workshop-3",
  title: "L1 rules. L2 judgment. L3 specialists.",
  kicker: "Done when · ladder recap",
  type: "recap",
  layout: "recap",
  visual: { recapKeys: true },
  items: [
    { label: "L1 · Rules", caption: "Deterministic routing without an LLM." },
    { label: "L2 · Judgment", caption: "One AI Agent drafts priority; a human reviews." },
    { label: "L3 · Specialists", caption: "Reply and Risk share one human gate." },
    { label: "Proof", caption: "Export or screenshot plus routing rules on /workshop/3." },
  ],
  notes: "Close. Recap L1 rules · L2 judgment · L3 specialists. Outline ≠ Linear Done. Linear Done = live /workshop/3 + Proof AC (export/screenshot + routing rules). Rhythm held: uitleg → voordoen → zelf doen."
},

];
