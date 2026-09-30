import {describe, expect, it} from 'vitest';
import {sourceSlides} from '../src/deck/slides.ts';
import {normalizeSlides} from '../src/deck/normalize.ts';
import {isClassroom1Path, matchProductDeck} from '../src/routes.tsx';

describe('AET-75 classroom deck sync', () => {
  const slides = normalizeSlides(sourceSlides);

  it('syncs 113 SoT slides (bb497e28 tip)', () => {
    expect(sourceSlides).toHaveLength(113);
    expect(slides).toHaveLength(113);
    expect(slides[0]?.title).toBe('Welcome to the course!');
    expect(slides[66]?.title).toBe('Day 1 recap');
    expect(slides[67]?.title).toBe('Reusable and connected AI workflows');
  });

  it('cuts Day 1 as the 67 slides before the TEACHING DAY 2 divider', () => {
    const day1 = slides.filter((s) => s.lessonId === 'teaching-day-1');
    expect(day1).toHaveLength(67);
    expect(slides.slice(0, 67).every((s) => s.lessonId === 'teaching-day-1')).toBe(true);
  });

  it('exposes Classroom 1 facilitator paths', () => {
    expect(isClassroom1Path('/classroom/1')).toBe(true);
    expect(isClassroom1Path('/lesson/classroom-1')).toBe(true);
    expect(isClassroom1Path('/deck')).toBe(false);
    expect(isClassroom1Path('/lesson')).toBe(false);
  });

  it('does not serve Shell for /classroom/1 or /lesson/classroom-1', () => {
    expect(matchProductDeck('/classroom/1')).toBe('classroom-1');
    expect(matchProductDeck('/lesson/classroom-1')).toBe('classroom-1');
    expect(matchProductDeck('/')).toBeNull();
  });
});
