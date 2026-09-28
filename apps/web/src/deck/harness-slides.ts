/** AET-116 / AET-117 Harness Engineering — thin facilitator deck for s01–s03 (Slice 1).
 *  Primary teach path is in-room Lesson (narrative + SVG + ConceptSim), not this deck.
 *  Content adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab).
 */
export const harnessSourceSlides: ReadonlyArray<Record<string, unknown>> = [

{ // 1
  lessonId: 'harness-s01',
  title: 'One loop & Bash is all you need.',
  kicker: 'Harness · s01 · Agent Loop',
  type: 'concept',
  visual: { keynote: true },
  notes: 'Motto. Harness layer = The Loop. Teach in Lesson: diagram + ConceptSim. No iframe to learn.shareai.run.'
},

{ // 2
  lessonId: 'harness-s01',
  title: 'tool_use continues. No tool_use stops.',
  kicker: 's01 · Loop signals',
  type: 'concept',
  visual: { keynote: true },
  notes: 'while True around model calls. Append assistant, execute tools, append tool_result, call again.'
},

{ // 3
  lessonId: 'harness-s02',
  title: 'Add a tool, add just one handler.',
  kicker: 'Harness · s02 · Tool Use',
  type: 'concept',
  visual: { keynote: true },
  notes: 'Loop unchanged. TOOLS entry + TOOL_HANDLERS mapping. Dispatch replaces hardcoded run_bash.'
},

{ // 4
  lessonId: 'harness-s02',
  title: 'Dispatch keeps the loop stable.',
  kicker: 's02 · Tool dispatch',
  type: 'concept',
  visual: { keynote: true },
  notes: 'bash, read_file, write_file, edit_file, glob — each handler is one map entry.'
},

{ // 5
  lessonId: 'harness-s03',
  title: 'Check permissions before executing.',
  kicker: 'Harness · s03 · Permission',
  type: 'concept',
  visual: { keynote: true },
  notes: 'Insert check_permission before handler. Gate1 deny → Gate2 rules → Gate3 user approval → else allow.'
},

{ // 6
  lessonId: 'harness-s03',
  title: 'Deny. Ask. Allow.',
  kicker: 's03 · Three gates',
  type: 'concept',
  visual: { keynote: true },
  notes: 'Safety is code in the harness, not trust in the model. Step the ConceptSim for the approval pause.'
},

];
