/** AET-80 Workshop day 4 — classroom-style deck with visible concepts and assignment timers.
 *  OUTLINE-AET-80 · PRODUCT-ACCEPT-OUTLINE-AET-80 · PEDAGOGY-RHYTHM · CLASSROOM-STYLE
 *  Vehicle LOCKED: https://github.com/RyanLisse/aetherlink-day5-n8n-to-agent — flat SOLO 0→4, no SDLC
 *  Parity: same support-ticket L/M/H fixture as Workshop 3
 *  Classroom style: visible concept cards, AetherBOT, and on-slide exercise timers.
 *  Exercises show their steps and timers on-slide; facilitator notes remain.
 *  Forbidden: Eve required; Classroom rewrite; W5 SDLC into this deck; merging W4/W5 vehicles; secrets.
 */
export const workshop4SourceSlides: ReadonlyArray<Record<string, unknown>> = [

/* ========== Open ========== */

{ // 1
  lessonId: "workshop-4",
  title: "Same triage. Claude Agent SDK.",
  kicker: "Workshop 4 · Day 4 · rebuild",
  type: "concept",
  visual: { bot: 'wave', place: 'beside' },
  subtitle: "Rebuild yesterday’s ticket triage on Claude Agent SDK, using the same labels.",
  keyPoints: ["Same tickets.","Same acceptance labels.","SOLO 2 is required; SOLO 3 is stretch."],
  cards: [
    { title: "Yesterday", body: "n8n routes the shared ticket fixture." },
    { title: "Today", body: "Rebuild that behavior with Claude Agent SDK." },
  ],
  notes: "Open. Yesterday = n8n. Today = same tickets on Claude Agent SDK. Rhythm: I explain → I show → you do on your laptop. No dual-track required path. Solo bar ≥ SOLO 2; SOLO 3 stretch."
},

{ // 2
  lessonId: "workshop-4",
  title: "Clone the rebuild vehicle.",
  kicker: "Vehicle · aetherlink-day5-n8n-to-agent",
  type: "context",
  visual: { bot: 'wave', place: 'beside' },
  cards: [
    { title: "Repository", body: "github.com/RyanLisse/aetherlink-day5-n8n-to-agent" },
    { title: "Shape", body: "Work through SOLO 0–4; this is not an SDLC lab." },
  ],
  subtitle: "Use the separate day-4 repository for the flat SOLO 0–4 rebuild.",
  keyPoints: ["Clone the locked repository.","Follow SOLO 0–4.","Keep the W5 lab separate."],
  notes: "Vehicle LOCKED. Same GitHub URL — flat SOLO 0–4, no SDLC. Point /workshop/4, not old Day-5 SDLC deck. W5 SDLC lab is a different repo tomorrow — do not merge vehicles."
},

{ // 3
  lessonId: "workshop-4",
  title: "Watch: clone, install, open the export.",
  kicker: "Demo · SOLO 0",
  type: "concept",
  visual: { bot: 'think', place: 'beside' },
  subtitle: "Watch the facilitator clone the repo, install it, and inspect the n8n export.",
  keyPoints: ["Find support-triage.json.","Name Ticket Input, AI Agent, Reply, and Risk.","Watch before building."],
  cards: [
    { title: "Clone", body: "Start from the day-4 repository." },
    { title: "Install", body: "Run npm install." },
  ],
  notes: "Demo — clone path. Facilitator clones / shows npm install + where n8n/support-triage.json lives. Room watches; does not build yet. Script: git clone → npm install → open export → name Ticket Input / AI Agent / Reply / Risk."
},

{ // 4
  lessonId: "workshop-4",
  title: "Clone and open the n8n export.",
  kicker: "SOLO 0 · Your turn",
  type: "practice",
  layout: "exercise",
  timer: 10,
  visual: { bot: 'point', place: 'beside' },
  cards: [
    { title: "Level", body: "SOLO 0" }
  ],
  steps: ["Clone the aetherlink-day5-n8n-to-agent repository.","Run npm install.","Open n8n/support-triage.json.","Use your own work/<name> branch."],
  expected: "The n8n export is open locally on an owned work/<name> branch.",
  subtitle: "Set up the local export on your own branch before checking parity.",
  keyPoints: ["Clone the locked repo.","Install and open the export.","Work on your own branch."],
  notes: "Your turn — SOLO 0 on your machine. Timer: 10 min. Checklist: (1) clone github.com/RyanLisse/aetherlink-day5-n8n-to-agent (2) npm install (3) open n8n/support-triage.json (4) own work/<name> branch. Gate before parity."
},

/* ========== Parity ========== */

{ // 5
  lessonId: "workshop-4",
  title: "Labels don’t move.",
  kicker: "Explain · shared acceptance",
  type: "concept",
  visual: { bot: 'point', place: 'beside' },
  subtitle: "Claude reproduces the Low / Med / High labels on the same fixture as Workshop 3.",
  keyPoints: ["Reuse Low / Med / High.","Let the Academy autograder confirm.","Do not say the labels out loud."],
  cards: [
    { title: "Same fixture", body: "Keep the Workshop 3 ticket inputs." },
    { title: "Same labels", body: "Do not invent a new product or answer key." },
  ],
  notes: "Explain — Labels don’t move. Low/Med/High on the same fixture as Workshop 3. Claude must reproduce the n8n labels — not invent a new product. The Academy autograder holds the answer key; never say the labels out loud."
},

{ // 6
  lessonId: "workshop-4",
  title: "Watch: fixture tickets, predict L/M/H.",
  kicker: "Demo · SOLO 1",
  type: "concept",
  visual: { bot: 'think', place: 'beside' },
  subtitle: "Predict each fixture’s label before the Academy autograder confirms it.",
  keyPoints: ["Predict before checking.","Use the Academy autograder.","Open W3 Proof if attendees have it."],
  cards: [
    { title: "Fixtures", body: "Read ticket.json and ticket-followup.json." },
    { title: "Predict", body: "Name a Low / Med / High label for each." },
  ],
  notes: "Demo — fixture tickets, predict L/M/H. Show fixtures/ticket.json and ticket-followup.json; let the room predict a label per ticket without revealing the answer. The autograder in the Academy confirms. Point at W3 Proof if attendees have it."
},

{ // 7
  lessonId: "workshop-4",
  title: "Confirm the fixture on your machine.",
  kicker: "SOLO 1 · Your turn",
  type: "practice",
  layout: "exercise",
  timer: 10,
  visual: { bot: 'point', place: 'beside' },
  cards: [
    { title: "Level", body: "SOLO 1" }
  ],
  steps: ["List at least two fixture tickets.","Predict each Low / Med / High label.","Submit predictions to the autograder.","Open W3 Proof if available."],
  expected: "At least two fixture predictions are submitted and correct, with W3 Proof open when available.",
  subtitle: "Submit predictions for at least two fixture tickets and check them with the autograder.",
  keyPoints: ["List two tickets.","Predict and submit their labels.","Check the autograder result."],
  notes: "Your turn — SOLO 1 predict and check. Timer: 10 min. Checklist: (1) ≥2 tickets listed (2) predicted L/M/H submitted to the autograder and all correct (3) W3 Proof open if they have it. Gate before first agent."
},

/* ========== First agent (SOLO 2) ========== */

{ // 8
  lessonId: "workshop-4",
  title: "systemPrompt · prompt · tools · memory.",
  kicker: "Explain · four fundamentals",
  type: "concept",
  visual: { bot: 'point', place: 'beside' },
  subtitle: "Map the n8n AI Agent to the SDK fields used for today’s ticket-to-priority run.",
  keyPoints: ["Map the four fundamentals.","Today uses systemPrompt and prompt.","maxTurns is part of the SDK map."],
  cards: [
    { title: "systemPrompt + prompt", body: "Set the system instructions and ticket input." },
    { title: "Tools + memory", body: "Tools and subagents deepen in stretch; memory is markdown." },
  ],
  notes: "Explain — Four fundamentals. Map n8n AI Agent → SDK fields: systemPrompt, prompt, tools/subagents, markdown memory (+ maxTurns). Today’s bar = ticket → priority with systemPrompt + prompt. Tools/memory deepen in stretch. Dry-run OK (AGENT_MODEL=offline)."
},

{ // 9
  lessonId: "workshop-4",
  title: "Watch: first agent, ticket to priority.",
  kicker: "Demo · SOLO 2",
  type: "concept",
  visual: { bot: 'think', place: 'beside' },
  subtitle: "Run the agent on a fixture and show its priority before human acceptance.",
  keyPoints: ["Run the fixture.","Show the priority output.","Pause for human review before accept."],
  cards: [
    { title: "Run", body: "Use the live flow or an offline dry-run." },
    { title: "Review", body: "Show the priority and the human gate." },
  ],
  notes: "Demo — first agent run. Live or dry-run: npm run triage -- fixtures/ticket.json --dry-run. Show priority out + human gate before accept. Room watches."
},

{ // 10
  lessonId: "workshop-4",
  title: "Run your first agent on a fixture.",
  kicker: "SOLO 2 · Your turn · solo bar",
  type: "practice",
  layout: "exercise",
  timer: 20,
  visual: { bot: 'point', place: 'beside' },
  cards: [
    { title: "Level", body: "SOLO 2" }
  ],
  steps: ["Run the agent on at least one fixture.","Capture the priority output.","Have a human review it.","Keep secrets out of the repo."],
  expected: "The agent runs on a fixture, returns a priority, receives human review, and adds no secrets to the repo.",
  subtitle: "Run at least one fixture through the agent and show the human review.",
  keyPoints: ["Run one fixture.","Show the priority.","Record human review."],
  notes: "Your turn — SOLO 2 solo bar (required ≥SOLO 2). Timer: 20 min. Checklist: (1) agent runs on ≥1 fixture (2) priority out (3) human reviewed (4) no secrets committed. Optional: edit src/prompts.ts then re-run offline."
},

/* ========== Stretch (SOLO 3) ========== */

{ // 11
  lessonId: "workshop-4",
  title: "Reply and Risk as specialists.",
  kicker: "Explain · subagents or skills",
  type: "concept",
  visual: { bot: 'point', place: 'beside' },
  subtitle: "Optionally split the same ticket work into Reply and Risk specialists.",
  keyPoints: ["Mirror the n8n L3 split.","Show a joint output.","Keep the human gate."],
  cards: [
    { title: "Reply", body: "Draft the customer-reply role." },
    { title: "Risk", body: "Keep risk or priority with its specialist." },
  ],
  notes: "Explain — Reply / Risk specialists. Optional split mirroring n8n L3. Still this ticket vehicle — not SDLC artifacts. Subagents/skills + joint output + human gate."
},

{ // 12
  lessonId: "workshop-4",
  title: "Watch: one specialist split.",
  kicker: "Demo · SOLO 3",
  type: "concept",
  visual: { bot: 'think', place: 'beside' },
  subtitle: "Watch one optional customer-reply or risk specialist produce a joint output.",
  keyPoints: ["This is a stretch demo.","Keep the same ticket vehicle.","Room watches the gate."],
  cards: [
    { title: "Specialist", body: "Use the customer-reply or risk role." },
    { title: "Joint output", body: "Show the combined result and its gate." },
  ],
  notes: "Demo — one specialist. Demo subagent/skill (customer-reply or risk) + joint output + gate. Stretch demo — not required for solo bar. Room watches."
},

{ // 13
  lessonId: "workshop-4",
  title: "Stretch — add a specialist role.",
  kicker: "SOLO 3 · Your turn · optional",
  type: "practice",
  layout: "exercise",
  timer: 15,
  visual: { bot: 'point', place: 'beside' },
  cards: [
    { title: "Level", body: "SOLO 3" }
  ],
  steps: ["Name two specialist roles.","Produce a joint output.","Set draft_only and human_approval_required."],
  expected: "Two roles produce a joint output with draft_only and human_approval_required at the gate.",
  subtitle: "Stretch the same ticket into two roles and an explicit human approval gate.",
  keyPoints: ["Name both roles.","Show the joint output.","Require human approval."],
  notes: "Your turn — SOLO 3 stretch (optional). Timer: 15 min. Checklist: (1) two roles (2) joint output (3) gate (draft_only + human_approval_required)."
},

/* ========== Acceptance (SOLO 4) + close ========== */

{ // 14
  lessonId: "workshop-4",
  title: "Acceptance is the same labels.",
  kicker: "Explain · SOLO 4",
  type: "concept",
  visual: { bot: 'point', place: 'beside' },
  subtitle: "Compare Claude output to the n8n expected labels on the same fixture.",
  keyPoints: ["Use the same labels.","Surface mismatches.","Fix prompt or tools, not the answer key."],
  cards: [
    { title: "Expected", body: "Read the ticket’s n8n label." },
    { title: "Actual", body: "Compare the Claude result." },
  ],
  notes: "Explain — Acceptance = same labels. Table: ticket → n8n expected → Claude actual. Mismatches = fix prompt/tools, not new labels."
},

{ // 15
  lessonId: "workshop-4",
  title: "Fill the acceptance table. Ship Proof.",
  kicker: "SOLO 4 · Your turn · Proof",
  type: "practice",
  layout: "exercise",
  timer: 15,
  visual: { bot: 'point', place: 'beside' },
  cards: [
    { title: "Level", body: "SOLO 4" }
  ],
  steps: ["Fill the acceptance table.","Add a dry-run or trace.","Name the human gate.","Record the level reached (2, 3, or 4)."],
  expected: "The acceptance table, run evidence, human gate, and attained level are recorded.",
  subtitle: "Record parity, the run evidence, and the level reached in the acceptance table.",
  keyPoints: ["Record expected and actual labels.","Attach a trace or dry-run.","Name the gate and level."],
  notes: "Your turn — SOLO 4 + Proof on your machine. Timer: 15 min. Checklist: (1) acceptance table (2) dry-run or trace (3) human gate (4) level reached (2 / 3 / 4)."
},

{ // 16
  lessonId: "workshop-4",
  title: "Tomorrow’s lab is a different repo.",
  kicker: "Done when · bridge → Workshop 5",
  type: "recap",
  layout: "recap",
  visual: { recapKeys: true, bot: 'point', place: 'beside' },
  items: [
    { label: "W4 Done", caption: "Parity on aetherlink-day5-n8n-to-agent at SOLO 2 or higher." },
    { label: "W5", caption: "AI-native SDLC uses a different repository." },
    { label: "Keep separate", caption: "Do not drag SDLC back into the W4 repo." },
  ],
  notes: "Close. W4 Done = parity on aetherlink-day5-n8n-to-agent (SOLO ≥2). W5 = AI-native SDLC on aetherlink-daily-brief-lab-s1 — do not drag SDLC back into this repo. Outline ≠ Linear Done. Rhythm held: uitleg → voordoen → zelf doen."
},

];
