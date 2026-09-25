/** AET-85 Workshop day 7 — ultra-minimal keynote (carry W5 density SoT).
 *  OUTLINE-AET-85 · PRODUCT-ACCEPT-OUTLINE-AET-85 · PEDAGOGY-RHYTHM · ULTRA-MINIMAL
 *  Vehicle: same eigen opdracht as W6 — polish · review · Proof final · 5 min present · 90d next steps.
 *  Face bar: eyebrow chip + one short huge sentence + ≤1 chip.
 *  Timers/checklists → presenter notes only. Pedagogy: Uitleg → Voordoen → Zelf doen per cycle.
 *  Forbidden: scope explosion; dual-track required path; Classroom rewrite; new curriculum; secrets.
 */
export const workshop7SourceSlides: ReadonlyArray<Record<string, unknown>> = [

/* ========== Open ========== */

{ // 1
  lessonId: "workshop-7",
  title: "Ship the thin slice.",
  kicker: "Workshop 7 · Day 7 · eigen opdracht",
  type: "concept",
  visual: { keynote: true },
  notes: "Open. Day goal = finish + present the same W6 thin slice — not invent a bigger product. Rhythm: I explain → I show → you do on your laptop. Stack stays n8n OR Claude Agents SDK from W6. No dual-track required path. No scope explosion."
},

{ // 2
  lessonId: "workshop-7",
  title: "Polish · gate · Proof · 5 min.",
  kicker: "Bar · finish shape",
  type: "context",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "same W6 slice · stay thin" }
  ],
  notes: "Bar for the day. Confirm W6 slice is still thin before polish. Present shape = 5-min template (problem → slice → proof → next). Facilitator shows the 5-min template briefly. Room confirms use-case locked from W6 — do not restart with a new fantasy."
},

/* ========== Polish ========== */

{ // 3
  lessonId: "workshop-7",
  title: "Done enough beats perfect.",
  kicker: "Uitleg · Polish",
  type: "concept",
  visual: { keynote: true },
  notes: "Uitleg — What “done enough” means. One polish pass that makes the thin slice demoable. Not a rewrite. Not a new feature. Stop when a stranger can point at the outcome."
},

{ // 4
  lessonId: "workshop-7",
  title: "Watch: one polish pass.",
  kicker: "Voordoen · Polish",
  type: "concept",
  visual: { keynote: true },
  notes: "Voordoen — facilitator demos one polish pass on a thin slice (clarity, one edge case, or demo readiness). Room watches; does not expand scope."
},

{ // 5
  lessonId: "workshop-7",
  title: "Polish your slice on your machine.",
  kicker: "SOLO · Zelf doen · Polish",
  type: "practice",
  timer: 20,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "SOLO · polish pass" }
  ],
  notes: "Zelf doen — polish on your machine. Timer: 20 min. Checklist: (1) W6 thin slice still named (2) one polish pass only (3) still demoable (4) no new feature (5) no secrets committed. Gate before review."
},

/* ========== Review gate ========== */

{ // 6
  lessonId: "workshop-7",
  title: "Human review is the gate.",
  kicker: "Uitleg · Review gate",
  type: "concept",
  visual: { keynote: true },
  notes: "Uitleg — Human review checklist: intent still true? thin? safe? stranger can point at outcome? Gate before Proof final."
},

{ // 7
  lessonId: "workshop-7",
  title: "Watch: review one aloud.",
  kicker: "Voordoen · Review",
  type: "concept",
  visual: { keynote: true },
  notes: "Voordoen — facilitator reviews one build aloud against the checklist. Room watches the gate language."
},

{ // 8
  lessonId: "workshop-7",
  title: "Gate your build.",
  kicker: "SOLO · Zelf doen · Review",
  type: "practice",
  timer: 10,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "SOLO · peer or self gate" }
  ],
  notes: "Zelf doen — peer or self gate on your build. Timer: 10 min. Checklist: (1) intent still true (2) still thin (3) safe / no secrets (4) stranger can point at outcome (5) pass or one fix only. Gate before Proof."
},

/* ========== Proof final ========== */

{ // 9
  lessonId: "workshop-7",
  title: "Proof needs a final today.",
  kicker: "Uitleg · Proof final",
  type: "concept",
  visual: { keynote: true },
  notes: "Uitleg — Final Proof fields: intent, path (n8n|Claude), what ran, human gate, 5-min present hook, 90d next step. Show a completed Proof skeleton. Draft from W6 becomes final today."
},

{ // 10
  lessonId: "workshop-7",
  title: "Finalize your Proof.",
  kicker: "SOLO · Zelf doen · Proof",
  type: "practice",
  timer: 15,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "SOLO · Proof final" }
  ],
  notes: "Zelf doen — Proof final on your machine. Timer: 15 min. Checklist: (1) intent pasted (2) stack path noted (3) what ran / screenshot or link (4) human gate marked (5) present hook + 90d next-step line. Gate before present."
},

/* ========== Present ========== */

{ // 11
  lessonId: "workshop-7",
  title: "Five minutes. One outcome.",
  kicker: "Uitleg · Present",
  type: "concept",
  visual: { keynote: true },
  notes: "Uitleg — 5-min structure: problem → thin slice → what ran → human gate → next 90d. One outcome a stranger can point at. No pitch deck wall."
},

{ // 12
  lessonId: "workshop-7",
  title: "Watch: sixty-second model.",
  kicker: "Voordoen · Present",
  type: "concept",
  visual: { keynote: true },
  notes: "Voordoen — facilitator models ~60 seconds of the 5-min shape (problem → slice → proof → next). Room watches timing and stop-line."
},

{ // 13
  lessonId: "workshop-7",
  title: "Prepare and present your slice.",
  kicker: "SOLO · Zelf doen · Present",
  type: "practice",
  timer: 25,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "SOLO · 5-min present" }
  ],
  notes: "Zelf doen — prepare + deliver present slots. Timer: 25 min (prep + slot). Checklist: (1) 5-min shape rehearsed (2) one outcome named (3) Proof final ready (4) stop at 5 min (5) no scope pitch. Facilitator runs slots; peers listen for stranger-pointable outcome."
},

/* ========== Close ========== */

{ // 14
  lessonId: "workshop-7",
  title: "Ninety days. One next step.",
  kicker: "Done when · 90d next steps",
  type: "recap",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "SOLO · write next-step chip" }
  ],
  notes: "Close. W7 Done = polished thin slice + human gate + Proof final + 5-min present + one 90d next-step chip. Outline ≠ Linear Done. Rhythm held: uitleg → voordoen → zelf doen. Same eigen opdracht as W6. No dual-track required path. No scope explosion. Write next-step chip before you leave."
},

];
