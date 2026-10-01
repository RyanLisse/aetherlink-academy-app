# Lesson pages

The legacy Lesson presents existing day-pack fields as short pages, with a compact stepper, diagrams, and page-aware activity navigation for participants and facilitators.

## Sub-features

- Overview, The idea, Try it, optional Code, and Sources pages appear only when their pack fields are nonempty.
- The stepper records visited pages and exposes the current page as a step.
- Hero and extra diagrams open a native dialog with an accessible caption, Escape/close-button dismissal, and focus restoration.
- ConceptSim uses the simulation's own description or summary for its “What to watch for” caption.
- The participant ActivityFrame navigates within Lesson pages before moving between activities; the unframed facilitator Lesson keeps the same page sequence.

## How to get to it (user POV)

1. Start a disposable local Academy run using the verification skill and require a passing doctor.
2. Open the legacy gateway, create a squad, select the Harness Engineering course, and choose day 12.
3. Join the squad as a participant, then open Course → Lesson.
4. Use the lesson stepper to move between Overview, The idea, Try it, and Sources; s05 has no Code page.
5. Open a diagram from Overview or The idea to inspect its enlarged view.
6. For the facilitator path, open Day pack in the facilitator workspace and use the in-card stepper.

## Driving it with Playwright

- Set English locale and open day 12's Harness pack in a disposable run.
- Assert the s05 stepper labels and absence of Code; verify narrative cards are absent on Overview and visible on The idea.
- Move to Sources and use Next to open Assignments; Previous and Next otherwise traverse lesson pages first.
- Click the hero diagram, verify the dialog caption, dismiss with Escape, then repeat with the close button and verify focus returns to the trigger.
- At 390px, verify the document has no horizontal overflow and the stepper can scroll internally.
- Capture the overview, idea, Try it, Sources, mobile Overview and The idea, dark The idea, and zoomed-diagram states.

## Gotchas

- s05's three assignment tasks do not imply a Code page; Code depends only on `codeExamples`.
- The diagram caption and “What to watch for” text must come from the pack or resolved simulation, not newly authored lesson copy.
- On the first lesson page, Previous falls back to the prior activity; on the last lesson page, Next falls back to Assignments.
- The `apps/web` SPA has its own styles and navigation and is not affected by legacy `src/style.css`.
