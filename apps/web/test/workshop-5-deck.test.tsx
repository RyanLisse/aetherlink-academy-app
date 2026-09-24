import {describe, expect, it} from 'vitest';
import {workshop5SourceSlides} from '../src/deck/workshop5-slides.ts';
import {normalizeSlides} from '../src/deck/normalize.ts';
import {isWorkshop5Path} from '../src/routes.tsx';
import {sourceSlides} from '../src/deck/slides.ts';

describe('AET-77 workshop 5 AI-native SDLC deck', () => {
  const slides = normalizeSlides(workshop5SourceSlides);

  it('ships exactly 18 workshop-5 slides from the ACCEPT outline', () => {
    expect(workshop5SourceSlides).toHaveLength(18);
    expect(slides).toHaveLength(18);
    expect(slides.every((s) => s.lessonId === 'workshop-5')).toBe(true);
    expect(slides[0]?.title).toBe('Workshop 5 — AI-native SDLC');
    expect(slides[17]?.title).toBe('Recap + Proof');
  });

  it('maps SOLO assignments and keeps the artifact-chain diagram', () => {
    expect(slides[2]?.title).toBe('The artifact chain');
    expect(slides[4]?.title).toContain('intent.md');
    expect(slides[6]?.title).toContain('docs/spec.md');
    expect(slides[8]?.title).toContain('design + ADR + plan');
    expect(slides[10]?.title).toContain('render the sample');
    expect(slides[11]?.title).toContain('agent loop');
    expect(slides[13]?.title).toContain('docs/evidence.md');
    expect(slides[15]?.title).toContain('gate + schedule');
  });

  it('exposes Workshop 5 facilitator paths', () => {
    expect(isWorkshop5Path('/workshop/5')).toBe(true);
    expect(isWorkshop5Path('/lesson/workshop-5')).toBe(true);
    expect(isWorkshop5Path('/classroom/1')).toBe(false);
    expect(isWorkshop5Path('/deck')).toBe(false);
  });

  it('does not break Classroom 1 SoT cut of 86 / Day1=44', () => {
    expect(sourceSlides).toHaveLength(86);
    const classroom = normalizeSlides(sourceSlides);
    expect(classroom.filter((s) => s.lessonId === 'teaching-day-1')).toHaveLength(44);
    expect(classroom.filter((s) => s.lessonId === 'workshop-5')).toHaveLength(0);
  });
});
