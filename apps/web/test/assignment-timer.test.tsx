// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {AssignmentView} from '../../../packages/deck/src/assignment.tsx';
import type {DeckSlide} from '../../../packages/deck/src/Deck.tsx';
import {normalizeSlides} from '../src/deck/normalize.ts';
import {sourceSlides} from '../src/deck/slides.ts';

describe('assignment timer presets', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot> | undefined;

  const normalizeOne = (slide: Record<string, unknown>): DeckSlide => {
    const [normalized] = normalizeSlides([slide]);
    if (!normalized) throw new Error('Expected one normalized slide');
    return normalized;
  };

  const mount = (slide: DeckSlide) => {
    root = createRoot(container);
    act(() => root?.render(<AssignmentView slide={slide} index={0} total={1} hidden={false}/>));
  };

  const openTimer = () => {
    const toggle = container.querySelector<HTMLButtonElement>('.tpill');
    if (!toggle) throw new Error('Timer toggle was not rendered');
    act(() => toggle.click());
    const input = container.querySelector<HTMLInputElement>('.timer-field input');
    if (!input) throw new Error('Timer controls were not opened');
    return input;
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    localStorage.clear();
  });

  afterEach(() => {
    act(() => root?.unmount());
    root = undefined;
    container.remove();
    localStorage.clear();
  });

  it('shows the preset without starting and uses it when started', () => {
    const slide = normalizeOne({
      lessonId: 'workshop-3',
      title: 'Preset exercise',
      type: 'practice',
      layout: 'exercise',
      timer: 20,
      steps: [],
      expected: 'The work is done.',
    });
    mount(slide);

    expect(container.querySelector('.tpill-face')?.textContent).toBe('20:00');
    expect(localStorage.getItem('academy-deck:timer:' + slide.id)).toBeNull();
    expect(openTimer().value).toBe('20');

    const start = container.querySelector<HTMLButtonElement>('.timer-play');
    if (!start) throw new Error('Timer start button was not rendered');
    act(() => start.click());

    expect(JSON.parse(localStorage.getItem('academy-deck:timer:' + slide.id) ?? 'null')).toMatchObject({
      total: 1200,
      left: 1200,
      running: true,
    });
  });

  it('prefers a stored timer over the slide preset', () => {
    const slide = normalizeOne({
      lessonId: 'workshop-3',
      title: 'Stored exercise',
      type: 'practice',
      layout: 'exercise',
      timer: 20,
      steps: [],
      expected: 'The work is done.',
    });
    localStorage.setItem(
      'academy-deck:timer:' + slide.id,
      JSON.stringify({total: 600, left: 480, running: false, endAt: 0}),
    );
    mount(slide);

    expect(container.querySelector('.tpill-face')?.textContent).toBe('08:00');
    expect(openTimer().value).toBe('10');
    expect(JSON.parse(localStorage.getItem('academy-deck:timer:' + slide.id) ?? 'null')).toMatchObject({
      total: 600,
      left: 480,
      running: false,
    });
  });

  it('leaves Classroom exercises without a timer preset unchanged', () => {
    const classroomPractice = sourceSlides.find((slide) => slide.type === 'practice');
    if (!classroomPractice) throw new Error('Classroom practice slide was not found');
    const slide = normalizeOne({...classroomPractice, lessonId: 'teaching-day-1'});
    mount(slide);

    expect(container.querySelector('.tpill-face')?.textContent).toBe('00:00');
    expect(openTimer().value).toBe('');
    expect(localStorage.getItem('academy-deck:timer:' + slide.id)).toBeNull();
  });
});
