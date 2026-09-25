/** AET-80 Workshop day 4 — ultra-minimal keynote (carry W5 density SoT).
 *  OUTLINE-AET-80 · PRODUCT-ACCEPT-OUTLINE-AET-80 · PEDAGOGY-RHYTHM · ULTRA-MINIMAL
 *  Vehicle LOCKED: https://github.com/RyanLisse/aetherlink-day5-n8n-to-agent — flat SOLO 0→4, no SDLC
 *  Parity: same support-ticket L/M/H fixture as Workshop 3
 *  Face bar: eyebrow chip + one short huge sentence + ≤1 chip.
 *  Timers/checklists → presenter notes only. Pedagogy: Uitleg → Voordoen → Zelf doen per cycle.
 *  Forbidden: Eve required; Classroom rewrite; W5 SDLC into this deck; merging W4/W5 vehicles; secrets.
 */
export const workshop4SourceSlides: ReadonlyArray<Record<string, unknown>> = [

/* ========== Open ========== */

{ // 1
  lessonId: "workshop-4",
  title: "Same triage. Claude Agent SDK.",
  kicker: "Workshop 4 · Day 4 · rebuild",
  type: "concept",
  visual: { keynote: true },
  notes: "Open. Yesterday = n8n. Today = same tickets on Claude Agent SDK. Rhythm: I explain → I show → you do on your laptop. No dual-track required path. Solo bar ≥ SOLO 2; SOLO 3 stretch."
},

{ // 2
  lessonId: "workshop-4",
  title: "Clone the rebuild vehicle.",
  kicker: "Vehicle · aetherlink-day5-n8n-to-agent",
  type: "context",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Repo", body: "github.com/RyanLisse/aetherlink-day5-n8n-to-agent" }
  ],
  notes: "Vehicle LOCKED. Same GitHub URL — flat SOLO 0–4, no SDLC. Point /workshop/4, not old Day-5 SDLC deck. W5 SDLC lab is a different repo tomorrow — do not merge vehicles."
},

{ // 3
  lessonId: "workshop-4",
  title: "Watch: clone, install, open the export.",
  kicker: "Voordoen · SOLO 0",
  type: "concept",
  visual: { keynote: true },
  notes: "Voordoen — clone path. Facilitator clones / shows npm install + where n8n/support-triage.json lives. Room watches; does not build yet. Script: git clone → npm install → open export → name Ticket Input / AI Agent / Reply / Risk."
},

{ // 4
  lessonId: "workshop-4",
  title: "Clone and open the n8n export.",
  kicker: "SOLO 0 · Zelf doen",
  type: "practice",
  timer: 10,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Level", body: "SOLO 0" }
  ],
  notes: "Zelf doen — SOLO 0 on your machine. Timer: 10 min. Checklist: (1) clone github.com/RyanLisse/aetherlink-day5-n8n-to-agent (2) npm install (3) open n8n/support-triage.json (4) own work/<name> branch. Gate before parity."
},

/* ========== Parity ========== */

{ // 5
  lessonId: "workshop-4",
  title: "Labels don’t move.",
  kicker: "Uitleg · shared acceptance",
  type: "concept",
  visual: { keynote: true },
  notes: "Uitleg — Labels don’t move. Low/Med/High on the same fixture as Workshop 3. Claude must match n8n expected labels — not invent a new product. fixtures/expected-labels.json is SoT (WL-1026→high, WL-1027→low)."
},

{ // 6
  lessonId: "workshop-4",
  title: "Watch: fixture tickets and expected L/M/H.",
  kicker: "Voordoen · SOLO 1",
  type: "concept",
  visual: { keynote: true },
  notes: "Voordoen — fixture + expected L/M/H. Show fixtures/ticket.json, ticket-followup.json, expected-labels.json. Point at W3 Proof if attendees have it. Room watches."
},

{ // 7
  lessonId: "workshop-4",
  title: "Confirm the fixture on your machine.",
  kicker: "SOLO 1 · Zelf doen",
  type: "practice",
  timer: 10,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Level", body: "SOLO 1" }
  ],
  notes: "Zelf doen — SOLO 1 confirm fixture. Timer: 10 min. Checklist: (1) ≥2 tickets listed (2) expected L/M/H written (3) W3 Proof open if they have it. Gate before first agent."
},

/* ========== First agent (SOLO 2) ========== */

{ // 8
  lessonId: "workshop-4",
  title: "systemPrompt · prompt · tools · memory.",
  kicker: "Uitleg · four fundamentals",
  type: "concept",
  visual: { keynote: true },
  notes: "Uitleg — Four fundamentals. Map n8n AI Agent → SDK fields: systemPrompt, prompt, tools/subagents, markdown memory (+ maxTurns). Today’s bar = ticket → priority with systemPrompt + prompt. Tools/memory deepen in stretch. Dry-run OK (AGENT_MODEL=offline)."
},

{ // 9
  lessonId: "workshop-4",
  title: "Watch: first agent, ticket to priority.",
  kicker: "Voordoen · SOLO 2",
  type: "concept",
  visual: { keynote: true },
  notes: "Voordoen — first agent run. Live or dry-run: npm run triage -- fixtures/ticket.json --dry-run. Show priority out + human gate before accept. Room watches."
},

{ // 10
  lessonId: "workshop-4",
  title: "Run your first agent on a fixture.",
  kicker: "SOLO 2 · Zelf doen · solo bar",
  type: "practice",
  timer: 20,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Level", body: "SOLO 2" }
  ],
  notes: "Zelf doen — SOLO 2 solo bar (required ≥SOLO 2). Timer: 20 min. Checklist: (1) agent runs on ≥1 fixture (2) priority out (3) human reviewed (4) no secrets committed. Optional: edit src/prompts.ts then re-run offline."
},

/* ========== Stretch (SOLO 3) ========== */

{ // 11
  lessonId: "workshop-4",
  title: "Reply and Risk as specialists.",
  kicker: "Uitleg · subagents or skills",
  type: "concept",
  visual: { keynote: true },
  notes: "Uitleg — Reply / Risk specialists. Optional split mirroring n8n L3. Still this ticket vehicle — not SDLC artifacts. Subagents/skills + joint output + human gate."
},

{ // 12
  lessonId: "workshop-4",
  title: "Watch: one specialist split.",
  kicker: "Voordoen · SOLO 3",
  type: "concept",
  visual: { keynote: true },
  notes: "Voordoen — one specialist. Demo subagent/skill (customer-reply or risk) + joint output + gate. Stretch demo — not required for solo bar. Room watches."
},

{ // 13
  lessonId: "workshop-4",
  title: "Stretch — add a specialist role.",
  kicker: "SOLO 3 · Zelf doen · optional",
  type: "practice",
  timer: 15,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Level", body: "SOLO 3" }
  ],
  notes: "Zelf doen — SOLO 3 stretch (optional). Timer: 15 min. Checklist: (1) two roles (2) joint output (3) gate (draft_only + human_approval_required)."
},

/* ========== Acceptance (SOLO 4) + close ========== */

{ // 14
  lessonId: "workshop-4",
  title: "Acceptance is the same labels.",
  kicker: "Uitleg · SOLO 4",
  type: "concept",
  visual: { keynote: true },
  notes: "Uitleg — Acceptance = same labels. Table: ticket → n8n expected → Claude actual. Mismatches = fix prompt/tools, not new labels."
},

{ // 15
  lessonId: "workshop-4",
  title: "Fill the acceptance table. Ship Proof.",
  kicker: "SOLO 4 · Zelf doen · Proof",
  type: "practice",
  timer: 15,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Level", body: "SOLO 4" }
  ],
  notes: "Zelf doen — SOLO 4 + Proof on your machine. Timer: 15 min. Checklist: (1) acceptance table (2) dry-run or trace (3) human gate (4) level reached (2 / 3 / 4)."
},

{ // 16
  lessonId: "workshop-4",
  title: "Tomorrow’s lab is a different repo.",
  kicker: "Done when · bridge → Workshop 5",
  type: "recap",
  visual: { keynote: true },
  notes: "Close. W4 Done = parity on aetherlink-day5-n8n-to-agent (SOLO ≥2). W5 = AI-native SDLC on aetherlink-daily-brief-lab-s1 — do not drag SDLC back into this repo. Outline ≠ Linear Done. Rhythm held: uitleg → voordoen → zelf doen."
},

];
