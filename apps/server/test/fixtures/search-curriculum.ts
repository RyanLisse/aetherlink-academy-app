import type {CourseAggregateDraft} from '../../src/db/curriculum-repo.ts';

/**
 * Trimmed verbatim from repo curriculum content, not synthetic:
 * - lesson A: content/courses/worldline-wave-2/teaching-1/02-scout-and-plan.md
 * - lesson B: content/courses/worldline-wave-2/teaching-1/03-atlas-review.md
 * Only the EN speaker notes are kept (the importer stores notes as plain text).
 * The "Mission contract" slide of lesson B is dropped because its Stop card
 * says "secrets" publicly, which would blur the notes-only acceptance term.
 */
export const searchCurriculumDraft = (ids: {
  readonly trackId: string;
  readonly dayId: string;
  readonly lessonA: string;
  readonly lessonB: string;
  readonly slideA1: string;
  readonly slideA2: string;
  readonly slideB1: string;
  readonly assignmentA: string;
  readonly assignmentB: string;
}): CourseAggregateDraft => ({
  tracks: [{id: ids.trackId, ordinal: 1, name: {en: 'Teaching'}}],
  days: [{id: ids.dayId, trackId: ids.trackId, ordinal: 1, kind: 'teaching', title: {en: 'Teaching day 1'}}],
  lessons: [
    {
      id: ids.lessonA,
      dayId: ids.dayId,
      slug: 'scout-and-plan',
      title: {en: 'Scout first, then the smallest useful plan', nl: 'Eerst scouten, dan het kleinste nuttige plan'},
      mode: 'guided',
      durationMinutes: 30,
    },
    {
      id: ids.lessonB,
      dayId: ids.dayId,
      slug: 'atlas-review',
      title: {en: 'Solo — Atlas repository review', nl: 'Solo — Atlas repository-review'},
      mode: 'solo',
      durationMinutes: 25,
    },
  ],
  slides: [
    {
      id: ids.slideA1,
      lessonId: ids.lessonA,
      ordinal: 1,
      kicker: 'Concept',
      type: 'concept',
      layout: 'steps',
      title: 'Read-only repository scout',
      steps: [
        'Ask for paths, concrete observations, and a stop rule',
        'Treat README claims as claims until checked against files and runnable scripts',
        'Return three paths, one uncertainty, and what you will not do yet',
      ],
      expected: 'A scout note that a navigator can re-run without changing files',
      notes: 'L1-SCOUT. Emphasise stop rules — no secrets, no client systems, no push.',
    },
    {
      id: ids.slideA2,
      lessonId: ids.lessonA,
      ordinal: 2,
      kicker: 'Practice',
      type: 'practice',
      layout: 'exercise',
      title: 'Produce a scout note and a one-step plan',
      timer: 20,
      notes: 'Do not edit files in this lesson — edits land in lesson 03.',
    },
    {
      id: ids.slideB1,
      lessonId: ids.lessonB,
      ordinal: 1,
      kicker: 'Practice',
      type: 'practice',
      layout: 'exercise',
      title: 'Deliver one reproducible Atlas finding',
      timer: 25,
      notes: 'Quiz from content.mjs day1Questions can be used verbally — bounded goal first; refuse unneeded Jira; strong handoff cites file/command/outcome.',
    },
  ],
  assignments: [
    {
      id: ids.assignmentA,
      lessonId: ids.lessonA,
      slideId: ids.slideA2,
      title: {en: 'Scout note + smallest plan', nl: 'Scout-notitie + kleinste plan'},
      minutes: 20,
      starterPath: 'teaching/day-1/starter',
      steps: [
        {en: 'List three concrete paths under teaching/day-1/starter', nl: 'Noteer drie concrete paden onder teaching/day-1/starter'},
        {en: 'Write one uncertainty and one stop rule', nl: 'Schrijf één onzekerheid en één stopregel'},
        {en: 'Plan one README correction with its verification command', nl: 'Plan één README-correctie met het verificatiecommando'},
        {en: 'State what is explicitly out of scope', nl: 'Noem wat expliciet buiten scope valt'},
      ],
      expected: 'Scout + plan a second participant can execute without guessing',
      check: 'Three paths; uncertainty; stop rule; one planned check named',
      hints: [{en: 'Prefer node --test from package.json over inventing new scripts', nl: 'Kies node --test uit package.json boven nieuwe scripts verzinnen'}],
    },
    {
      id: ids.assignmentB,
      lessonId: ids.lessonB,
      slideId: ids.slideB1,
      title: {en: 'Atlas review — one evidence-backed finding', nl: 'Atlas-review — één evidence-based bevinding'},
      minutes: 25,
      starterPath: 'teaching/day-1/starter',
      steps: [
        {en: 'Compare README.md with scripts in package.json', nl: 'Vergelijk README.md met de scripts in package.json'},
        {en: 'Run the available test with node --test in your copy', nl: 'Voer de beschikbare test uit met node --test in je kopie'},
      ],
      expected: 'Finding cites a concrete file; command+output present; human gate still open',
      check: 'Path + command + observed output + limitation + next owner named',
      hints: [{en: 'A failed command is still evidence — record the real error', nl: 'Een mislukt commando is ook bewijs — noteer de echte fout'}],
    },
  ],
  quizQuestions: [],
});
