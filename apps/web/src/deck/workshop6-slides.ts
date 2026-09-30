/** AET-81 Workshop day 6 — ultra-minimal keynote (carry W5 density SoT).
 *  OUTLINE-AET-81 · PRODUCT-ACCEPT-OUTLINE-AET-81 · PEDAGOGY-RHYTHM · ULTRA-MINIMAL
 *  Vehicle: attendee’s own/team use-case from Classroom 2 (thin slice).
 *  Stack choice: n8n OR Claude Agents SDK (carry W3/W4). No dual-track required path.
 *  Face bar: eyebrow chip + one short huge sentence + ≤1 chip.
 *  Timers/checklists → presenter notes only. Pedagogy: Explain → Demo → Your turn per cycle.
 *  Forbidden: finished agent on day 6; dual-track required path; Classroom 2 rewrite; W5 SDLC as day-6 vehicle; secrets.
 */
export const workshop6SourceSlides: ReadonlyArray<Record<string, unknown>> = [

/* ========== Open ========== */

{ // 1
  lessonId: "workshop-6",
  title: "Your thin slice starts today.",
  kicker: "Workshop 6 · Day 6 · eigen opdracht",
  type: "concept",
  visual: { keynote: true },
  notes: "Open. Day goal = start your own thin slice — not finish an agent. Rhythm: I explain → I show → you do on your laptop. Stack = n8n OR Claude Agents SDK from W3/W4. No dual-track required path. Classroom 2 use-case is the vehicle; do not invent a new curriculum fantasy."
},

{ // 2
  lessonId: "workshop-6",
  title: "Classroom 2 use-case — not a new fantasy.",
  kicker: "Vehicle · Classroom 2 thin slice",
  type: "context",
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Stack", body: "n8n OR Claude Agents SDK" }
  ],
  notes: "Vehicle = attendee’s own/team use-case from Classroom 2, thin-sliced. Soft stack choice: n8n or Claude Agents SDK (carry W3/W4 skills). Chip shows stack choice only — no W5 lab URL, Do not rewrite Classroom 2; do not block on AET-76 soft."
},

{ // 3
  lessonId: "workshop-6",
  title: "Smallest useful version wins.",
  kicker: "Explain · Open",
  type: "concept",
  visual: { keynote: true },
  notes: "Explain — What “smallest useful” means. Thin-slice rule: one outcome a stranger can point at. Not a roadmap. Not a finished agent on day 6."
},

{ // 4
  lessonId: "workshop-6",
  title: "Watch: one thin-slice example.",
  kicker: "Demo · Open",
  type: "concept",
  visual: { keynote: true },
  notes: "Demo — show one thin-slice example aloud (e.g. one inbox triage step, one draft reply, one status ping). Name the outcome in one sentence. Room watches; does not pick yet."
},

{ // 5
  lessonId: "workshop-6",
  title: "Lock your use-case on your machine.",
  kicker: "SOLO · Your turn · Open",
  type: "practice",
  timer: 10,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "SOLO · lock use-case" }
  ],
  notes: "Your turn — pick use-case on your machine. Timer: 10 min. Checklist: (1) Classroom 2 use-case named (2) thin-slice rule held — one outcome (3) stack choice n8n OR Claude written (4) no new fantasy product. Gate before intent."
},

/* ========== Intent ========== */

{ // 6
  lessonId: "workshop-6",
  title: "Intent is the gate.",
  kicker: "Explain · Intent",
  type: "concept",
  visual: { keynote: true },
  notes: "Explain — Intent as gate. One outcome sentence + who benefits + what is out of scope. Intent before plan before build."
},

{ // 7
  lessonId: "workshop-6",
  title: "Watch: intent in five minutes.",
  kicker: "Demo · Intent",
  type: "concept",
  visual: { keynote: true },
  notes: "Demo — facilitator writes one intent aloud in ~5 min (outcome sentence + who benefits + out of scope). Room watches."
},

{ // 8
  lessonId: "workshop-6",
  title: "Write your intent sentence.",
  kicker: "SOLO · Your turn · Intent",
  type: "practice",
  timer: 10,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "SOLO · write intent" }
  ],
  notes: "Your turn — write own intent / outcome sentence. Timer: 10 min. Checklist: (1) one outcome sentence (2) who benefits (3) out-of-scope line (4) still thin. Gate before plan."
},

/* ========== Plan + First build ========== */

{ // 9
  lessonId: "workshop-6",
  title: "Plan before you build.",
  kicker: "Explain · Plan",
  type: "concept",
  visual: { keynote: true },
  notes: "Explain — Plan before build. Short plan + human gate. Prefer a short plan.md or plan mode — not a wall of tickets. Day 6 stops at first thin slice, not polish."
},

{ // 10
  lessonId: "workshop-6",
  title: "Watch: a short plan aloud.",
  kicker: "Demo · Plan",
  type: "concept",
  visual: { keynote: true },
  notes: "Demo — demo plan mode / short plan.md. Facilitator shows steps, gate, and stop-line for today. Then a 10-min first-build peek on n8n OR Claude (carry W3/W4). Room watches."
},

{ // 11
  lessonId: "workshop-6",
  title: "Plan and build your thin slice.",
  kicker: "SOLO · Your turn · Plan + build",
  type: "practice",
  timer: 25,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "SOLO · plan + first build" }
  ],
  notes: "Your turn — draft plan + first build (n8n or Claude) on your machine. Timer: 25 min. Checklist: (1) short plan + gate written (2) thin slice runs once (3) human reviewed (4) no secrets committed (5) stop before polish — W7 owns finish. Combined plan+build face per OUTLINE slide 11. No finished agent today."
},

/* ========== Proof draft ========== */

{ // 12
  lessonId: "workshop-6",
  title: "Proof needs a draft today.",
  kicker: "Explain · Proof draft",
  type: "concept",
  visual: { keynote: true },
  notes: "Explain — What Proof needs today. Show Proof skeleton (facilitator): intent, path (n8n|Claude), what ran, human gate, next steps for W7. Final Proof + present = Workshop 7."
},

{ // 13
  lessonId: "workshop-6",
  title: "Fill your Proof draft.",
  kicker: "SOLO · Your turn · Proof",
  type: "practice",
  timer: 15,
  visual: { keynote: true, popOut: 0 },
  cards: [
    { title: "Path", body: "SOLO · Proof draft" }
  ],
  notes: "Your turn — Proof draft on your machine. Timer: 15 min. Checklist: (1) intent pasted (2) stack path noted (3) what ran / screenshot or link (4) human gate (5) park polish + present for W7."
},

/* ========== Close → W7 ========== */

{ // 14
  lessonId: "workshop-6",
  title: "Tomorrow: polish, gate, present.",
  kicker: "Done when · bridge → Workshop 7",
  type: "recap",
  visual: { keynote: true },
  notes: "Close. W6 Done = thin slice started + Proof draft (not a finished agent). W7 = polish · review gate · Proof final · 5-min present. Outline ≠ Linear Done. Rhythm held: uitleg → voordoen → zelf doen. No dual-track required path. No W5 SDLC as day-6 vehicle."
},

];
