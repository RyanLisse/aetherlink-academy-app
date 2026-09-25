import {describe, expect, it} from 'vitest';
import {sourceSlides} from '../src/deck/slides.ts';
import {normalizeSlides} from '../src/deck/normalize.ts';
import {isClassroom1Path} from '../src/routes.tsx';

describe('AET-75 classroom deck sync', () => {
  const slides = normalizeSlides(sourceSlides);

  it('syncs 91 SoT slides (abde6d1b tip)', () => {
    expect(sourceSlides).toHaveLength(91);
    expect(slides).toHaveLength(91);
    expect(slides[0]?.title).toBe('Welcome to the course!');
    expect(slides[43]?.title).toBe('Day 1 recap');
    expect(slides[44]?.title).toBe('Reusable and connected AI workflows');
  });

  it('cuts Day 1 as the 44 slides before the TEACHING DAY 2 divider', () => {
    const day1 = slides.filter((s) => s.lessonId === 'teaching-day-1');
    expect(day1).toHaveLength(44);
    expect(slides.slice(0, 44).every((s) => s.lessonId === 'teaching-day-1')).toBe(true);
  });

  it('exposes Classroom 1 facilitator paths', () => {
    expect(isClassroom1Path('/classroom/1')).toBe(true);
    expect(isClassroom1Path('/lesson/classroom-1')).toBe(true);
    expect(isClassroom1Path('/deck')).toBe(false);
    expect(isClassroom1Path('/lesson')).toBe(false);
  });
});
