/** AET-81 Workshop day 6 — classroom-style deck with visible concepts and assignment timers.
 *  OUTLINE-AET-81 · PRODUCT-ACCEPT-OUTLINE-AET-81 · PEDAGOGY-RHYTHM · CLASSROOM-STYLE
 *  Vehicle: attendee’s own/team use-case from Classroom 2 (thin slice).
 *  Stack choice: n8n OR Claude Agents SDK (carry W3/W4). No dual-track required path.
 *  Classroom style: visible concept cards, AetherBOT, and on-slide exercise timers.
 *  Exercises show their steps and timers on-slide; facilitator notes remain.
 *  Forbidden: finished agent on day 6; dual-track required path; Classroom 2 rewrite; W5 SDLC as day-6 vehicle; secrets.
 */
export const workshop6SourceSlides: ReadonlyArray<Record<string, unknown>> = [

/* ========== Open ========== */

{ // 1
  lessonId: "workshop-6",
  title: "Your thin slice starts today.",
  kicker: "Workshop 6 · Day 6 · eigen opdracht",
  type: "concept",
  visual: { bot: 'wave', place: 'beside' },
  subtitle: "Start one Classroom 2 use-case; day 6 is not for finishing an agent.",
  keyPoints: ["Start, do not finish.","Keep the same use-case.","Do not invent a new product."],
  cards: [
    { title: "Vehicle", body: "Use your own or team use-case from Classroom 2." },
    { title: "Stack", body: "Carry n8n or Claude Agents SDK from W3/W4." },
  ],
  notes: "Open. Day goal = start your own thin slice — not finish an agent. Rhythm: I explain → I show → you do on your laptop. Stack = n8n OR Claude Agents SDK from W3/W4. No dual-track required path. Classroom 2 use-case is the vehicle; do not invent a new curriculum fantasy."
},

{ // 2
  lessonId: "workshop-6",
  title: "Classroom 2 use-case — not a new fantasy.",
  kicker: "Vehicle · Classroom 2 thin slice",
  type: "context",
  visual: { bot: 'wave', place: 'beside' },
  cards: [
    { title: "Use-case", body: "Bring your own or team use-case from Classroom 2." },
    { title: "Stack", body: "Choose n8n or Claude Agents SDK." },
  ],
  subtitle: "Thin-slice the existing Classroom 2 use-case and keep the stack choice small.",
  keyPoints: ["Use the Classroom 2 vehicle.","Carry W3/W4 skills.","Do not invent a new curriculum."],
  notes: "Vehicle = attendee’s own/team use-case from Classroom 2, thin-sliced. Soft stack choice: n8n or Claude Agents SDK (carry W3/W4 skills). Chip shows stack choice only — no W5 lab URL, Do not rewrite Classroom 2; do not block on AET-76 soft."
},

{ // 3
  lessonId: "workshop-6",
  title: "Smallest useful version wins.",
  kicker: "Explain · Open",
  type: "concept",
  visual: { bot: 'point', place: 'beside' },
  subtitle: "The slice is one outcome a stranger can point at, not a roadmap or finished agent.",
  keyPoints: ["Make one outcome visible.","Keep the slice thin.","Stop before a finished agent."],
  cards: [
    { title: "One outcome", body: "Name the smallest useful result." },
    { title: "Stop line", body: "Do not turn day 6 into a roadmap or finished agent." },
  ],
  notes: "Explain — What “smallest useful” means. Thin-slice rule: one outcome a stranger can point at. Not a roadmap. Not a finished agent on day 6."
},

{ // 4
  lessonId: "workshop-6",
  title: "Watch: one thin-slice example.",
  kicker: "Demo · Open",
  type: "concept",
  visual: { bot: 'think', place: 'beside' },
  subtitle: "Watch one example outcome before choosing the attendee’s own slice.",
  keyPoints: ["Use one example only.","Name the result in one sentence.","Room watches before picking."],
  cards: [
    { title: "Example", body: "One inbox triage step, draft reply, or status ping." },
    { title: "Outcome", body: "Name it in one sentence." },
  ],
  notes: "Demo — show one thin-slice example aloud (e.g. one inbox triage step, one draft reply, one status ping). Name the outcome in one sentence. Room watches; does not pick yet."
},

{ // 5
  lessonId: "workshop-6",
  title: "Lock your use-case on your machine.",
  kicker: "SOLO · Your turn · Open",
  type: "practice",
  layout: "exercise",
  timer: 10,
  visual: { bot: 'point', place: 'beside' },
  cards: [
    { title: "Path", body: "SOLO · lock use-case" }
  ],
  steps: ["Name the Classroom 2 use-case.","Keep one outcome.","Write n8n or Claude as the stack.","Avoid inventing a new product."],
  expected: "The Classroom 2 use-case is named, one outcome is thin-sliced, a stack is chosen, and no new product is invented.",
  subtitle: "Name the Classroom 2 use-case, hold the thin-slice rule, and choose a stack.",
  keyPoints: ["Name the existing use-case.","Choose one outcome.","Record the stack."],
  notes: "Your turn — pick use-case on your machine. Timer: 10 min. Checklist: (1) Classroom 2 use-case named (2) thin-slice rule held — one outcome (3) stack choice n8n OR Claude written (4) no new fantasy product. Gate before intent."
},

/* ========== Intent ========== */

{ // 6
  lessonId: "workshop-6",
  title: "Intent is the gate.",
  kicker: "Explain · Intent",
  type: "concept",
  visual: { bot: 'point', place: 'beside' },
  subtitle: "Write intent before plan and build, including its beneficiary and out-of-scope line.",
  keyPoints: ["Intent comes first.","Name the beneficiary.","Keep the scope boundary explicit."],
  cards: [
    { title: "Outcome", body: "Write one intent sentence." },
    { title: "Boundary", body: "Name who benefits and what is out of scope." },
  ],
  notes: "Explain — Intent as gate. One outcome sentence + who benefits + what is out of scope. Intent before plan before build."
},

{ // 7
  lessonId: "workshop-6",
  title: "Watch: intent in five minutes.",
  kicker: "Demo · Intent",
  type: "concept",
  visual: { bot: 'think', place: 'beside' },
  subtitle: "Watch a short intent drafted aloud before starting a plan.",
  keyPoints: ["Keep it to five minutes.","Name the beneficiary.","Write the out-of-scope line."],
  cards: [
    { title: "Sentence", body: "Write the outcome in one sentence." },
    { title: "Scope", body: "Name who benefits and what is out of scope." },
  ],
  notes: "Demo — facilitator writes one intent aloud in ~5 min (outcome sentence + who benefits + out of scope). Room watches."
},

{ // 8
  lessonId: "workshop-6",
  title: "Write your intent sentence.",
  kicker: "SOLO · Your turn · Intent",
  type: "practice",
  layout: "exercise",
  timer: 10,
  visual: { bot: 'point', place: 'beside' },
  cards: [
    { title: "Path", body: "SOLO · write intent" }
  ],
  steps: ["Write one outcome sentence.","Name who benefits.","Write the out-of-scope line.","Keep the slice thin."],
  expected: "The intent has one outcome, a named beneficiary, an out-of-scope line, and a thin scope.",
  subtitle: "Capture the outcome, beneficiary, and boundary without expanding the slice.",
  keyPoints: ["State one outcome.","Name who benefits.","Set an out-of-scope boundary."],
  notes: "Your turn — write own intent / outcome sentence. Timer: 10 min. Checklist: (1) one outcome sentence (2) who benefits (3) out-of-scope line (4) still thin. Gate before plan."
},

/* ========== Plan + First build ========== */

{ // 9
  lessonId: "workshop-6",
  title: "Plan before you build.",
  kicker: "Explain · Plan",
  type: "concept",
  visual: { bot: 'point', place: 'beside' },
  subtitle: "Use a short plan and a human gate, then stop before polish.",
  keyPoints: ["Plan before build.","Put a human gate in the plan.","Stop before polish."],
  cards: [
    { title: "Short plan", body: "Use plan.md or plan mode rather than a wall of tickets." },
    { title: "Stop line", body: "Day 6 ends at the first thin slice, not polish." },
  ],
  notes: "Explain — Plan before build. Short plan + human gate. Prefer a short plan.md or plan mode — not a wall of tickets. Day 6 stops at first thin slice, not polish."
},

{ // 10
  lessonId: "workshop-6",
  title: "Watch: a short plan aloud.",
  kicker: "Demo · Plan",
  type: "concept",
  visual: { bot: 'think', place: 'beside' },
  subtitle: "Watch the plan, gate, stop-line, and first-build peek on the chosen stack.",
  keyPoints: ["Keep the plan short.","Name today’s stop-line.","Carry W3/W4 skills."],
  cards: [
    { title: "Plan", body: "Show the steps and the human gate." },
    { title: "Build peek", body: "Preview the first thin slice on n8n or Claude." },
  ],
  notes: "Demo — demo plan mode / short plan.md. Facilitator shows steps, gate, and stop-line for today. Then a 10-min first-build peek on n8n OR Claude (carry W3/W4). Room watches."
},

{ // 11
  lessonId: "workshop-6",
  title: "Plan and build your thin slice.",
  kicker: "SOLO · Your turn · Plan + build",
  type: "practice",
  layout: "exercise",
  timer: 25,
  visual: { bot: 'point', place: 'beside' },
  cards: [
    { title: "Path", body: "SOLO · plan + first build" }
  ],
  steps: ["Write a short plan and gate.","Run the thin slice once.","Have a human review it.","Keep secrets out of the commit.","Stop before polish; W7 owns finish."],
  expected: "A short gated plan and reviewed thin slice are recorded without secrets, and work stops before polish.",
  subtitle: "Write a short gated plan, run the slice once, and stop before polish.",
  keyPoints: ["Write the gate.","Run and review the slice.","Leave polish for W7."],
  notes: "Your turn — draft plan + first build (n8n or Claude) on your machine. Timer: 25 min. Checklist: (1) short plan + gate written (2) thin slice runs once (3) human reviewed (4) no secrets committed (5) stop before polish — W7 owns finish. Combined plan+build face per OUTLINE slide 11. No finished agent today."
},

/* ========== Proof draft ========== */

{ // 12
  lessonId: "workshop-6",
  title: "Proof needs a draft today.",
  kicker: "Explain · Proof draft",
  type: "concept",
  visual: { bot: 'point', place: 'beside' },
  subtitle: "Draft the intent, stack, run evidence, human gate, and next steps for W7.",
  keyPoints: ["Start the Proof skeleton.","Record what ran.","Park polish and presentation for W7."],
  cards: [
    { title: "Draft fields", body: "Intent, path, what ran, and the human gate." },
    { title: "Next", body: "Leave final Proof and the presentation for Workshop 7." },
  ],
  notes: "Explain — What Proof needs today. Show Proof skeleton (facilitator): intent, path (n8n|Claude), what ran, human gate, next steps for W7. Final Proof + present = Workshop 7."
},

{ // 13
  lessonId: "workshop-6",
  title: "Fill your Proof draft.",
  kicker: "SOLO · Your turn · Proof",
  type: "practice",
  layout: "exercise",
  timer: 15,
  visual: { bot: 'point', place: 'beside' },
  cards: [
    { title: "Path", body: "SOLO · Proof draft" }
  ],
  steps: ["Paste the intent.","Note the stack path.","Record what ran with a screenshot or link.","Name the human gate.","Park polish and presentation for W7."],
  expected: "The draft contains intent, stack path, run evidence, human gate, and parked W7 polish and presentation.",
  subtitle: "Leave a W6 Proof draft that makes the slice and its next gate visible.",
  keyPoints: ["Record intent and stack.","Show what ran.","Leave the W7 work visible."],
  notes: "Your turn — Proof draft on your machine. Timer: 15 min. Checklist: (1) intent pasted (2) stack path noted (3) what ran / screenshot or link (4) human gate (5) park polish + present for W7."
},

/* ========== Close → W7 ========== */

{ // 14
  lessonId: "workshop-6",
  title: "Tomorrow: polish, gate, present.",
  kicker: "Done when · bridge → Workshop 7",
  type: "recap",
  layout: "recap",
  visual: { recapKeys: true, bot: 'point', place: 'beside' },
  items: [
    { label: "W6 Done", caption: "A thin slice is started and a Proof draft exists." },
    { label: "Not finished", caption: "Day 6 does not require a finished agent." },
    { label: "W7", caption: "Polish, review gate, final Proof, and a five-minute presentation." },
  ],
  notes: "Close. W6 Done = thin slice started + Proof draft (not a finished agent). W7 = polish · review gate · Proof final · 5-min present. Outline ≠ Linear Done. Rhythm held: uitleg → voordoen → zelf doen. No dual-track required path. No W5 SDLC as day-6 vehicle."
},

];
