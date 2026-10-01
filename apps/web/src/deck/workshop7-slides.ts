/** AET-85 Workshop day 7 — classroom-style deck with visible concepts and assignment timers.
 *  OUTLINE-AET-85 · PRODUCT-ACCEPT-OUTLINE-AET-85 · PEDAGOGY-RHYTHM · CLASSROOM-STYLE
 *  Vehicle: same eigen opdracht as W6 — polish · review · Proof final · 5 min present · 90d next steps.
 *  Classroom style: visible concept cards, AetherBOT, and on-slide exercise timers.
 *  Exercises show their steps and timers on-slide; facilitator notes remain.
 *  Forbidden: scope explosion; dual-track required path; Classroom rewrite; new curriculum; secrets.
 */
export const workshop7SourceSlides: ReadonlyArray<Record<string, unknown>> = [

/* ========== Open ========== */

{ // 1
  lessonId: "workshop-7",
  title: "Ship the thin slice.",
  kicker: "Workshop 7 · Day 7 · eigen opdracht",
  type: "concept",
  visual: { bot: 'wave', place: 'beside' },
  subtitle: "Finish and present the same W6 slice without expanding the product.",
  keyPoints: ["Keep the W6 use-case.","Use n8n or Claude from W6.","Do not expand scope."],
  cards: [
    { title: "Same slice", body: "Continue the use-case locked in W6." },
    { title: "Finish", body: "Polish, gate, complete Proof, and present." },
  ],
  notes: "Open. Day goal = finish + present the same W6 thin slice — not invent a bigger product. Rhythm: I explain → I show → you do on your laptop. Stack stays n8n OR Claude Agents SDK from W6. No dual-track required path. No scope explosion."
},

{ // 2
  lessonId: "workshop-7",
  title: "Polish · gate · Proof · 5 min.",
  kicker: "Bar · finish shape",
  type: "context",
  visual: { bot: 'wave', place: 'beside' },
  cards: [
    { title: "Polish", body: "Confirm the W6 slice is still thin before one polish pass." },
    { title: "Present", body: "Problem → slice → proof → next." },
  ],
  subtitle: "Keep the W6 slice thin and use the same five-minute presentation shape.",
  keyPoints: ["Do not restart with a new use-case.","Keep the five-minute structure.","Confirm the W6 lock."],
  notes: "Bar for the day. Confirm W6 slice is still thin before polish. Present shape = 5-min template (problem → slice → proof → next). Facilitator shows the 5-min template briefly. Room confirms use-case locked from W6 — do not restart with a new fantasy."
},

/* ========== Polish ========== */

{ // 3
  lessonId: "workshop-7",
  title: "Done enough beats perfect.",
  kicker: "Explain · Polish",
  type: "concept",
  visual: { bot: 'point', place: 'beside' },
  subtitle: "One polish pass makes the thin slice demoable; stop before a rewrite or new feature.",
  keyPoints: ["Polish once.","Do not rewrite or add a feature.","Make the outcome pointable."],
  cards: [
    { title: "One pass", body: "Improve clarity, one edge case, or demo readiness." },
    { title: "Done enough", body: "Stop when a stranger can point at the outcome." },
  ],
  notes: "Explain — What “done enough” means. One polish pass that makes the thin slice demoable. Not a rewrite. Not a new feature. Stop when a stranger can point at the outcome."
},

{ // 4
  lessonId: "workshop-7",
  title: "Watch: one polish pass.",
  kicker: "Demo · Polish",
  type: "concept",
  visual: { bot: 'think', place: 'beside' },
  subtitle: "Watch one focused pass improve clarity, an edge case, or demo readiness.",
  keyPoints: ["One pass only.","Keep the same slice.","Room watches; scope stays fixed."],
  cards: [
    { title: "Focus", body: "Choose one polish target." },
    { title: "Stop", body: "Keep the slice demoable without expanding scope." },
  ],
  notes: "Demo — facilitator demos one polish pass on a thin slice (clarity, one edge case, or demo readiness). Room watches; does not expand scope."
},

{ // 5
  lessonId: "workshop-7",
  title: "Polish your slice on your machine.",
  kicker: "SOLO · Your turn · Polish",
  type: "practice",
  layout: "exercise",
  timer: 20,
  visual: { bot: 'point', place: 'beside' },
  cards: [
    { title: "Path", body: "SOLO · polish pass" }
  ],
  steps: ["Name the W6 thin slice.","Make one polish pass only.","Keep it demoable.","Do not add a feature.","Keep secrets out of the commit."],
  expected: "The W6 slice remains named and demoable after one polish pass, with no new feature or committed secrets.",
  subtitle: "Make one polish pass on the W6 slice without adding a feature.",
  keyPoints: ["Keep the same slice.","Polish once.","Do not expand scope."],
  notes: "Your turn — polish on your machine. Timer: 20 min. Checklist: (1) W6 thin slice still named (2) one polish pass only (3) still demoable (4) no new feature (5) no secrets committed. Gate before review."
},

/* ========== Review gate ========== */

{ // 6
  lessonId: "workshop-7",
  title: "Human review is the gate.",
  kicker: "Explain · Review gate",
  type: "concept",
  visual: { bot: 'point', place: 'beside' },
  subtitle: "A person checks intent, scope, safety, and the outcome before final Proof.",
  keyPoints: ["Check intent.","Check thinness and safety.","Gate before Proof final."],
  cards: [
    { title: "Intent + scope", body: "Is the intent still true, and is the slice still thin?" },
    { title: "Safety + outcome", body: "Is it safe, and can a stranger point at the outcome?" },
  ],
  notes: "Explain — Human review checklist: intent still true? thin? safe? stranger can point at outcome? Gate before Proof final."
},

{ // 7
  lessonId: "workshop-7",
  title: "Watch: review one aloud.",
  kicker: "Demo · Review",
  type: "concept",
  visual: { bot: 'think', place: 'beside' },
  subtitle: "Watch a build reviewed aloud against the human gate checklist.",
  keyPoints: ["Use the same review checklist.","Make the gate explicit.","Room watches the decision."],
  cards: [
    { title: "Review", body: "Ask whether intent, scope, safety, and outcome still hold." },
    { title: "Gate language", body: "Say the human decision clearly." },
  ],
  notes: "Demo — facilitator reviews one build aloud against the checklist. Room watches the gate language."
},

{ // 8
  lessonId: "workshop-7",
  title: "Gate your build.",
  kicker: "SOLO · Your turn · Review",
  type: "practice",
  layout: "exercise",
  timer: 10,
  visual: { bot: 'point', place: 'beside' },
  cards: [
    { title: "Path", body: "SOLO · peer or self gate" }
  ],
  steps: ["Confirm the intent is still true.","Confirm the slice is still thin.","Check safety and secrets.","Confirm a stranger can point at the outcome.","Pass or make one fix only."],
  expected: "The build passes the intent, scope, safety, and outcome review, or needs only one fix.",
  subtitle: "Review the build against intent, thinness, safety, and the pointable outcome.",
  keyPoints: ["Check intent and scope.","Check safety.","Pass or make one fix."],
  notes: "Your turn — peer or self gate on your build. Timer: 10 min. Checklist: (1) intent still true (2) still thin (3) safe / no secrets (4) stranger can point at outcome (5) pass or one fix only. Gate before Proof."
},

/* ========== Proof final ========== */

{ // 9
  lessonId: "workshop-7",
  title: "Proof needs a final today.",
  kicker: "Explain · Proof final",
  type: "concept",
  visual: { bot: 'point', place: 'beside' },
  subtitle: "Complete the Proof fields and attach a five-minute presentation hook and next step.",
  keyPoints: ["Carry the W6 draft forward.","Make the human gate visible.","Add the present hook and 90-day step."],
  cards: [
    { title: "Proof", body: "Intent, path, what ran, and the human gate." },
    { title: "Next", body: "Add the present hook and one 90-day next step." },
  ],
  notes: "Explain — Final Proof fields: intent, path (n8n|Claude), what ran, human gate, 5-min present hook, 90d next step. Show a completed Proof skeleton. Draft from W6 becomes final today."
},

{ // 10
  lessonId: "workshop-7",
  title: "Finalize your Proof.",
  kicker: "SOLO · Your turn · Proof",
  type: "practice",
  layout: "exercise",
  timer: 15,
  visual: { bot: 'point', place: 'beside' },
  cards: [
    { title: "Path", body: "SOLO · Proof final" }
  ],
  steps: ["Paste the intent.","Note the stack path.","Record what ran with a screenshot or link.","Mark the human gate.","Add the present hook and one 90-day next step."],
  expected: "Final Proof contains intent, stack path, run evidence, a marked human gate, a present hook, and one 90-day next step.",
  subtitle: "Turn the W6 draft into final Proof for the human gate and presentation.",
  keyPoints: ["Carry the W6 intent forward.","Show what ran.","Prepare the present and next step."],
  notes: "Your turn — Proof final on your machine. Timer: 15 min. Checklist: (1) intent pasted (2) stack path noted (3) what ran / screenshot or link (4) human gate marked (5) present hook + 90d next-step line. Gate before present."
},

/* ========== Present ========== */

{ // 11
  lessonId: "workshop-7",
  title: "Five minutes. One outcome.",
  kicker: "Explain · Present",
  type: "concept",
  visual: { bot: 'think', place: 'beside' },
  subtitle: "Tell the problem, thin slice, what ran, human gate, and next 90-day step.",
  keyPoints: ["Keep the presentation to five minutes.","Show one outcome.","End with the next 90-day step."],
  cards: [
    { title: "Five-minute shape", body: "Problem → thin slice → what ran → human gate → next." },
    { title: "One outcome", body: "Name something a stranger can point at." },
  ],
  notes: "Explain — 5-min structure: problem → thin slice → what ran → human gate → next 90d. One outcome a stranger can point at. No pitch deck wall."
},

{ // 12
  lessonId: "workshop-7",
  title: "Watch: sixty-second model.",
  kicker: "Demo · Present",
  type: "concept",
  visual: { bot: 'point', place: 'beside' },
  subtitle: "Watch a short model of the presentation shape and its stop-line.",
  keyPoints: ["Watch the timing.","Keep the slice pointable.","End with the next step."],
  cards: [
    { title: "Model", body: "Problem → slice → proof → next." },
    { title: "Timing", body: "Model about sixty seconds and stop on time." },
  ],
  notes: "Demo — facilitator models ~60 seconds of the 5-min shape (problem → slice → proof → next). Room watches timing and stop-line."
},

{ // 13
  lessonId: "workshop-7",
  title: "Prepare and present your slice.",
  kicker: "SOLO · Your turn · Present",
  type: "practice",
  layout: "exercise",
  timer: 25,
  visual: { bot: 'point', place: 'beside' },
  cards: [
    { title: "Path", body: "SOLO · 5-min present" }
  ],
  steps: ["Rehearse the five-minute shape.","Name one outcome.","Have final Proof ready.","Stop at five minutes.","Do not pitch new scope."],
  expected: "The five-minute presentation names one outcome, uses final Proof, and stops on time without a scope pitch.",
  subtitle: "Rehearse the five-minute shape and deliver the prepared presentation slot.",
  keyPoints: ["Rehearse the structure.","Keep one outcome.","Stop at five minutes."],
  notes: "Your turn — prepare + deliver present slots. Timer: 25 min (prep + slot). Checklist: (1) 5-min shape rehearsed (2) one outcome named (3) Proof final ready (4) stop at 5 min (5) no scope pitch. Facilitator runs slots; peers listen for stranger-pointable outcome."
},

/* ========== Close ========== */

{ // 14
  lessonId: "workshop-7",
  title: "Ninety days. One next step.",
  kicker: "Done when · 90d next steps",
  type: "recap",
  layout: "recap",
  visual: { recapKeys: true },
  items: [
    { label: "Thin slice", caption: "The same W6 slice is polished and demoable." },
    { label: "Human gate", caption: "The build has a human review decision." },
    { label: "Final Proof", caption: "What ran and the five-minute presentation are ready." },
    { label: "Next 90 days", caption: "Write one next-step chip before leaving." },
  ],
  notes: "Close. W7 Done = polished thin slice + human gate + Proof final + 5-min present + one 90d next-step chip. Outline ≠ Linear Done. Rhythm held: uitleg → voordoen → zelf doen. Same eigen opdracht as W6. No dual-track required path. No scope explosion. Write next-step chip before you leave."
},

];
