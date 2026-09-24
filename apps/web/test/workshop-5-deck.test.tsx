import {describe, expect, it} from 'vitest';
import {workshop5SourceSlides} from '../src/deck/workshop5-slides.ts';
import {normalizeSlides} from '../src/deck/normalize.ts';
import {isWorkshop5Path} from '../src/routes.tsx';
import {sourceSlides} from '../src/deck/slides.ts';

describe('AET-77 workshop 5 AI-native SDLC deck', () => {
  const slides = normalizeSlides(workshop5SourceSlides);
  const practice = workshop5SourceSlides.filter((s) => s.type === 'practice');

  it('ships workshop-5 slides from the ACCEPT outline + definition addendum', () => {
    expect(workshop5SourceSlides).toHaveLength(20);
    expect(slides).toHaveLength(20);
    expect(slides.every((s) => s.lessonId === 'workshop-5')).toBe(true);
    expect(slides[0]?.title).toBe('Workshop 5 — AI-native SDLC');
    expect(slides[19]?.title).toBe('Recap + Proof');
  });

  it('highlights AI-native SDLC, intent.md, spec.md, and plan.md as own slides', () => {
    const titles = slides.map((s) => s.title);
    expect(titles).toContain('AI-native SDLC');
    expect(titles).toContain('intent.md');
    expect(titles).toContain('spec.md');
    expect(titles).toContain('plan.md');
  });

  it('maps SOLO assignments and keeps the artifact-chain diagram', () => {
    expect(slides[2]?.title).toBe('The artifact chain');
    const practiceTitles = practice.map((s) => String(s.title));
    expect(practiceTitles.some((t) => t.includes('intent.md') && t.includes('SOLO 1'))).toBe(true);
    expect(practiceTitles.some((t) => t.includes('docs/spec.md') && t.includes('SOLO 2'))).toBe(true);
    expect(practiceTitles.some((t) => t.includes('design + ADR + plan') && t.includes('SOLO 3'))).toBe(true);
    expect(practiceTitles.some((t) => t.includes('render the sample') && t.includes('SOLO 4'))).toBe(true);
    expect(practiceTitles.some((t) => t.includes('agent loop') && t.includes('SOLO 5'))).toBe(true);
    expect(practiceTitles.some((t) => t.includes('docs/evidence.md') && t.includes('SOLO 6'))).toBe(true);
    expect(practiceTitles.some((t) => t.includes('gate + schedule') && t.includes('SOLO 7'))).toBe(true);
  });

  it('keeps timers/checklists off the projector face (presenter notes only)', () => {
    expect(practice).toHaveLength(7);
    for (const slide of practice) {
      expect(slide.layout, String(slide.title)).not.toBe('exercise');
      expect(slide.steps, String(slide.title)).toBeUndefined();
      expect(slide.check, String(slide.title)).toBeUndefined();
      expect(slide.expected, String(slide.title)).toBeUndefined();
      expect(String(slide.kicker ?? ''), String(slide.title)).not.toMatch(/\d+\s*min/i);
      const notes = String(slide.notes ?? '');
      expect(notes, String(slide.title)).toMatch(/Timer:\s*\d+\s*min/i);
      expect(typeof slide.timer, String(slide.title)).toBe('number');
      expect(notes.toLowerCase()).toMatch(/checklist:|check:|gate:/);
    }
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
