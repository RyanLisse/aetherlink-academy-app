import {describe, expect, it} from 'vitest';
import {decodeSlide, encodeSlide, participantSlide} from '../src/index.ts';

const base = {id: 'slide-1', lessonId: 'lesson-1', ordinal: 1, title: 'Title', type: 'context' as const};
const examples = [
  base,
  {...base, id: 'slide-pillars', layout: 'pillars' as const, items: [{label: 'Useful'}]},
  {...base, id: 'slide-steps', layout: 'steps' as const, items: [{label: 'Step', caption: 'Caption'}]},
  {...base, id: 'slide-compare', layout: 'compare' as const, columns: [{title: 'A', items: ['one']}]},
  {...base, id: 'slide-exercise', layout: 'exercise' as const, steps: ['Do it'], timer: 25},
  {...base, id: 'slide-recap', layout: 'recap' as const, items: [{label: 'Done'}]},
  {...base, id: 'slide-cards', layout: 'cards' as const, cards: [{title: 'Plan', body: 'Design before build'}]},
  {
    ...base,
    id: 'slide-image',
    layout: 'image' as const,
    image: 'intent-md.svg',
    imageAlt: 'intent.md brief feeding design, build and review.',
    imageCaption: 'What, why and boundaries feed design, build and review.',
    keepCards: true,
    cards: [],
  },
  {
    ...base,
    id: 'slide-bars',
    layout: 'bars' as const,
    bars: {
      stages: [
        {name: 'Plan', w: 10},
        {name: 'Build', w: 44, accent: true},
        {name: 'Maintain', w: 12, ghost: true},
      ],
      scale: 'Before agents · every stage at human speed',
      caption: 'Build is the long pole.',
    },
  },
  {...base, id: 'slide-mascot', mascot: true, concepts: ['What an agent is — the agentic loop']},
];

describe('Slide schema', () => {
  it('decodes every layout observed in the source fixture, including absent layout', () => {
    for (const example of examples) {
      const decoded = decodeSlide(example);
      expect(encodeSlide(decoded)).toEqual(example);
    }
  });

  it('rejects unknown layouts with a layout path', () => {
    try { decodeSlide({...base, layout: 'invented'}); throw new Error('expected parse failure'); }
    catch (error) { expect(String(error)).toMatch(/layout/); }
  });

  it('keeps prompt whitespace and visual metadata while removing only quiz answers for participants', () => {
    const prompt = 'first line\n  second line\n';
    const slide = decodeSlide({...base, prompt, notes: 'speaker', secret: 'hidden', visual: {quiz: {answer: 2, prompt: 'keep'}, art: {quiz: {answer: 'display label'}}, bot: 'wave', answer: 'legitimate'} });
    const projected = participantSlide(slide);
    expect(projected.prompt).toBe(prompt);
    expect(projected).toEqual({...base, prompt, visual: {quiz: {prompt: 'keep'}, art: {quiz: {answer: 'display label'}}, bot: 'wave', answer: 'legitimate'}});
  });

  it('projects a slide without visual metadata without adding hidden fields', () => {
    const projected = participantSlide(decodeSlide({...base, notes: 'speaker', secret: 'hidden'}));
    expect(projected).toEqual(base);
  });

  it("AET-121 preserves stepsHeading/detail/notes/visual across encode roundtrip (no silent flatten)", () => {
    const slide = decodeSlide({
      ...base,
      id: "slide-exercise-heading",
      layout: "exercise" as const,
      steps: ["Do the thing"],
      stepsHeading: "Your prompt must ask Claude Code to:",
      detail: "Facilitator detail line",
      expected: "A working change",
      check: "Did it pass?",
      notes: "Private facilitator notes",
      prompt: "exact\nprompt",
      visual: {reveal: "click", quiz: {answer: 1}, bot: "wave", countdown: 5, quietTimer: 3, planB: "DEMO_FALLBACK"},
      timer: 15,
    });
    expect(slide.stepsHeading).toBe("Your prompt must ask Claude Code to:");
    expect(slide.detail).toBe("Facilitator detail line");
    expect(slide.notes).toBe("Private facilitator notes");
    expect(slide.visual).toEqual({reveal: "click", quiz: {answer: 1}, bot: "wave", countdown: 5, quietTimer: 3, planB: "DEMO_FALLBACK"});
    expect(encodeSlide(slide)).toEqual({
      ...base,
      id: "slide-exercise-heading",
      layout: "exercise",
      steps: ["Do the thing"],
      stepsHeading: "Your prompt must ask Claude Code to:",
      detail: "Facilitator detail line",
      expected: "A working change",
      check: "Did it pass?",
      notes: "Private facilitator notes",
      prompt: "exact\nprompt",
      visual: {reveal: "click", quiz: {answer: 1}, bot: "wave", countdown: 5, quietTimer: 3, planB: "DEMO_FALLBACK"},
      timer: 15,
    });
    const projected = participantSlide(slide);
    expect("notes" in projected).toBe(false);
    expect((projected.visual as {quiz?: {answer?: unknown}}).quiz?.answer).toBeUndefined();
  });
});
