import {describe, expect, it} from 'vitest';
import {sourceSlides} from '../src/deck/slides.ts';
import {normalizeSlides} from '../src/deck/normalize.ts';
import {isClassroom1Path} from '../src/routes.tsx';

describe('AET-75 classroom deck sync', () => {
  const slides = normalizeSlides(sourceSlides);

  it('syncs 86 SoT slides (dc7107bc tip)', () => {
    expect(sourceSlides).toHaveLength(86);
    expect(slides).toHaveLength(86);
    expect(slides[0]?.title).toBe('Welcome to the course!');
    expect(slides[43]?.title).toBe('Day 1 recap');
    expect(slides[44]?.title).toBe('Reusable and connected AI workflows');
  });

  it('cuts Day1 as first 44 slides (index < 44 → teaching-day-1)', () => {
    const day1 = slides.filter((s) => s.lessonId === 'teaching-day-1');
    const day2 = slides.filter((s) => s.lessonId === 'teaching-day-2');
    expect(day1).toHaveLength(44);
    expect(day2).toHaveLength(42);
    expect(slides.slice(0, 44).every((s) => s.lessonId === 'teaching-day-1')).toBe(true);
    expect(slides.slice(44).every((s) => s.lessonId === 'teaching-day-2')).toBe(true);
  });

  it('exposes Classroom 1 facilitator paths', () => {
    expect(isClassroom1Path('/classroom/1')).toBe(true);
    expect(isClassroom1Path('/lesson/classroom-1')).toBe(true);
    expect(isClassroom1Path('/deck')).toBe(false);
    expect(isClassroom1Path('/lesson')).toBe(false);
  });
});
