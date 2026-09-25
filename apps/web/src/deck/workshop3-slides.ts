/** AET-79 Workshop day 3 — ultra-minimal keynote (carry W5 density SoT).
 *  OUTLINE-AET-79 · PRODUCT-ACCEPT-OUTLINE-AET-79 · PEDAGOGY-RHYTHM · ULTRA-MINIMAL
 *  Vehicle: n8n support ticket → priority Low/Med/High · L1 Switch → L2 AI Agent+memory → L3 Reply+Risk
 *  Face bar: eyebrow chip + one short huge sentence + ≤1 chip.
 *  Timers/checklists → presenter notes only. Pedagogy: Uitleg → Voordoen → Zelf doen per ladder rung.
 *  Forbidden: Classroom 1–2 rewrite; Eve dual-track; W5 SDLC into this deck; secrets on screen.
 */
export const workshop3SourceSlides: ReadonlyArray<Record<string, unknown>> = [

/* ========== Open ========== */

{ // 1
  lessonId: "workshop-3",
  title: "One ticket. Three agency levels.",
  kicker: "Workshop 3 · Day 3 · L1→L3",
  type: "concept",
  visual: { keynote: true },
  notes: "Open. One scenario, three agency levels on n8n. Rhythm all day: I explain → I show → you do on your laptop. Goal ≥L2; stretch L3. Day 4 rebuilds acceptance on Claude Agents SDK. n8n→Claude lock; no dual-track required path."
},

{ // 2
  lessonId: "workshop-3",
  title: "Ticket in. Low / Med / High out.",
  kicker: "Vehicle · one ticket · three levels",
  type: "context",
  visual: { keynote: true },
  notes: "The vehicle. Ticket in → Low/Med/High out (+ optional reply at L3). Point at the workshop n8n instance + screenshot pack under /workshop-3/. No vehicle = fail the through-line. Soft: AET-84 starter JSON when ready — does not block today."
},

{ // 3
  lessonId: "workshop-3",
  title: "Automation is not an agent.",
  kicker: "Uitleg · why the ladder",
  type: "concept",
  visual: { keynote: true },
  notes: "Uitleg. L1 = business rule without LLM. L2 = judgment (one AI Agent + memory). L3 = specialists (Reply + Risk). Human gate before “done” / customer-facing."
},

{ // 4
  lessonId: "workshop-3",
  title: "Same tickets all day.",
  kicker: "Scenario · shared fixture",
  type: "concept",
  visual: { keynote: true },
  notes: "Shared fixture. ≥3 example tickets with expected L/M/H. Labels return on day 4. No prod writes. Secrets off screen."
},

/* ========== Cycle L1 — Switch ========== */

{ // 5
  lessonId: "workshop-3",
  title: "L1 is a Switch — no LLM.",
  kicker: "Uitleg · L1 · deterministic routing",
  type: "concept",
  visual: { keynote: true },
  notes: "Uitleg — L1 Switch / rules. Ticket → Switch → L/M/H. No LLM. Cover input, branches, and error path."
},

{ // 6
  lessonId: "workshop-3",
  title: "Watch: L1 Switch routes the ticket.",
  kicker: "Voordoen · L1",
  type: "concept",
  visual: {
    keynote: true,
    opener: "showcase",
    image: "workshop-3/01-n8n.jpeg",
    imageLink: "n8n · L1 Switch"
  },
  notes: "Voordoen — L1. Facilitator walks screenshot 01-n8n.jpeg or live import. Room watches; does not build yet. Script: open flow → show Switch branches → run one fixture ticket → label matches."
},

{ // 7
  lessonId: "workshop-3",
  title: "Build or inspect L1 on your machine.",
  kicker: "L1 · Zelf doen",
  type: "practice",
  timer: 15,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Level", body: "L1" }
  ],
  notes: "Zelf doen — L1 on your machine. Timer: 15 min. Checklist: (1) flow runs (2) label matches fixture (3) steps noted (4) human confirms branch. Gate before L2 — required."
},

/* ========== Cycle L2 — AI Agent + memory ========== */

{ // 8
  lessonId: "workshop-3",
  title: "L2 adds one AI Agent with memory.",
  kicker: "Uitleg · L2 · judgment enters",
  type: "concept",
  visual: { keynote: true },
  notes: "Uitleg — L2. Same chain + one bounded AI Agent. Agent drafts priority; human reviews. Capture trace/settings. OpenAI node in screenshots OK — day 4 swaps stack."
},

{ // 9
  lessonId: "workshop-3",
  title: "Watch: L2 Agent drafts priority.",
  kicker: "Voordoen · L2",
  type: "concept",
  visual: {
    keynote: true,
    opener: "showcase",
    image: "workshop-3/02-n8n.jpeg",
    imageLink: "n8n · L2 AI Agent + memory"
  },
  notes: "Voordoen — L2. Screenshot 02-n8n.jpeg or live. Show Agent + memory, draft priority, human review pause. Room watches."
},

{ // 10
  lessonId: "workshop-3",
  title: "Reach L2 on your own machine.",
  kicker: "L2 · Zelf doen · solo bar",
  type: "practice",
  timer: 20,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Level", body: "L2" }
  ],
  notes: "Zelf doen — L2. Solo bar = ≥L2 required. Timer: 20 min. Checklist: (1) AI run recorded (2) human reviewed priority (3) no silent auto-send (4) Proof fields started."
},

/* ========== Cycle L3 — Multi-agent (stretch) ========== */

{ // 11
  lessonId: "workshop-3",
  title: "L3 splits Reply and Risk.",
  kicker: "Uitleg · L3 · specialists · one gate",
  type: "concept",
  visual: { keynote: true },
  notes: "Uitleg — L3. Split reply vs risk/priority; orchestrate; document who does what; human gate before done. Stretch — not required for solo bar."
},

{ // 12
  lessonId: "workshop-3",
  title: "Watch: L3 specialists, one gate.",
  kicker: "Voordoen · L3",
  type: "concept",
  visual: {
    keynote: true,
    opener: "showcase",
    image: "workshop-3/03-n8n.jpeg",
    imageLink: "n8n · L3 Reply + Risk"
  },
  notes: "Voordoen — L3. Screenshot 03-n8n.jpeg or live. Stretch demo — not required for solo bar. Name two roles and the human gate."
},

{ // 13
  lessonId: "workshop-3",
  title: "Stretch L3 — same tickets.",
  kicker: "L3 · Zelf doen · optional",
  type: "practice",
  timer: 15,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Level", body: "L3" }
  ],
  notes: "Zelf doen — L3 stretch (optional). Timer: 15 min. Checklist: (1) two roles named (2) joint output (3) human gate explicit."
},

/* ========== Proof + bridge ========== */

{ // 14
  lessonId: "workshop-3",
  title: "Proof is not vibes.",
  kicker: "Uitleg · export · rules · gate",
  type: "concept",
  visual: { keynote: true },
  notes: "Uitleg — Proof. Working flow + export/screenshot + short routing explanation. Same labels day 4 will re-run."
},

{ // 15
  lessonId: "workshop-3",
  title: "Export your Proof pack before you leave.",
  kicker: "Proof · Zelf doen",
  type: "practice",
  timer: 10,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Pack", body: "Proof" }
  ],
  notes: "Zelf doen — Proof pack on your machine before you leave. Timer: 10 min. Checklist: (1) screenshot/export (2) L/M/H rules in one paragraph (3) human gate named (4) level reached."
},

{ // 16
  lessonId: "workshop-3",
  title: "Day 4 rebuilds this on Claude.",
  kicker: "Bridge · → Workshop 4",
  type: "concept",
  visual: { keynote: true },
  notes: "Bridge. Day 4 = Claude Agents SDK on the same acceptance fixture. Keep tickets + labels. Dual-track not required. n8n→Claude lock."
},

{ // 17
  lessonId: "workshop-3",
  title: "Workshop instance. No prod.",
  kicker: "Guardrails",
  type: "concept",
  visual: { keynote: true },
  notes: "Guardrails. No real Jira/payments; no secrets on screen; import ≠ model-run proof without trace."
},

/* ========== Close ========== */

{ // 18
  lessonId: "workshop-3",
  title: "L1 rules. L2 judgment. L3 specialists.",
  kicker: "Done when · ladder recap",
  type: "recap",
  visual: { keynote: true },
  notes: "Close. Recap L1 rules · L2 judgment · L3 specialists. Outline ≠ Linear Done. Linear Done = live /workshop/3 + Proof AC (export/screenshot + routing rules). Rhythm held: uitleg → voordoen → zelf doen."
},

];
