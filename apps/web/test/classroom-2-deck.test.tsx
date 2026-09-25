import {describe, expect, it} from 'vitest';
import {sourceSlides} from '../src/deck/slides.ts';
import {normalizeSlides} from '../src/deck/normalize.ts';
import {isClassroom1Path, isClassroom2Path} from '../src/routes.tsx';

describe('AET-76 Classroom 2 deck', () => {
  const day2 = normalizeSlides(sourceSlides).filter((s) => s.lessonId === 'teaching-day-2');

  it('tags the 47 slides from the TEACHING DAY 2 divider on as teaching-day-2', () => {
    expect(day2).toHaveLength(47);
    expect(day2[0]?.kicker).toBe('TEACHING DAY 2');
    expect(day2[0]?.title).toBe('Reusable and connected AI workflows');
    expect(day2[0]?.ordinal).toBe(45);
    expect(day2.at(-1)?.title).toBe('Final reflection');
  });

  it('carries Day 2 assignments 5–13 plus three warm-up exercises', () => {
    const assignments = day2.filter((s) => /^Assignment \d+:/.test(s.title)).map((s) => s.title.split(':')[0]);
    expect(assignments).toEqual(['Assignment 5', 'Assignment 6', 'Assignment 7', 'Assignment 8', 'Assignment 9', 'Assignment 10', 'Assignment 11', 'Assignment 12', 'Assignment 13']);
    expect(day2.filter((s) => s.layout === 'exercise')).toHaveLength(12);
  });

  it('derives the cut from the divider, not a fixed index', () => {
    const extra = {title: 'Inserted Day 1 slide', kicker: 'DAY 1 · EXTRA', type: 'context'};
    const shifted = normalizeSlides([sourceSlides[0]!, extra, ...sourceSlides.slice(1)]);
    expect(shifted.filter((s) => s.lessonId === 'teaching-day-1')).toHaveLength(45);
    expect(shifted[45]?.kicker).toBe('TEACHING DAY 2');
    expect(shifted[45]?.lessonId).toBe('teaching-day-2');
  });

  it('refuses to guess lessonId when the divider is missing', () => {
    expect(() => normalizeSlides(sourceSlides.filter((s) => s.kicker !== 'TEACHING DAY 2'))).toThrow('no "TEACHING DAY 2" divider');
  });

  it('exposes Classroom 2 facilitator paths', () => {
    expect(isClassroom2Path('/classroom/2')).toBe(true);
    expect(isClassroom2Path('/lesson/classroom-2')).toBe(true);
    expect(isClassroom2Path('/classroom/1')).toBe(false);
    expect(isClassroom1Path('/classroom/2')).toBe(false);
  });
});
