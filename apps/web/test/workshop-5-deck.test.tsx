import {describe, expect, it} from 'vitest';
import {workshop5SourceSlides} from '../src/deck/workshop5-slides.ts';
import {normalizeSlides} from '../src/deck/normalize.ts';
import {isWorkshop5Path} from '../src/routes.tsx';
import {sourceSlides} from '../src/deck/slides.ts';

describe('AET-77 workshop 5 AI-native SDLC deck', () => {
  const slides = normalizeSlides(workshop5SourceSlides);
  const practice = workshop5SourceSlides.filter((s) => s.type === 'practice');
  const titles = slides.map((s) => s.title);
  const visualOf = (s: Record<string, unknown>): Record<string, unknown> =>
    s.visual && typeof s.visual === 'object' && !Array.isArray(s.visual)
      ? (s.visual as Record<string, unknown>)
      : {};

  it('ships workshop-5 slides from the ACCEPT outline + definition addenda', () => {
    expect(workshop5SourceSlides).toHaveLength(27);
    expect(slides).toHaveLength(27);
    expect(slides.every((s) => s.lessonId === 'workshop-5')).toBe(true);
    expect(slides[0]?.title).toBe('Workshop 5 — AI-native SDLC');
    expect(slides[26]?.title).toBe('Recap + Proof');
  });

  it('leaves slides 1–4 titles intact', () => {
    expect(titles.slice(0, 4)).toEqual([
      'Workshop 5 — AI-native SDLC',
      'Code is no longer the bottleneck',
      'The artifact chain',
      'Intent is a committed artifact',
    ]);
  });

  it('highlights the nine required definition slides', () => {
    for (const required of [
      'AI-native SDLC',
      'intent.md',
      'spec.md',
      'plan.md',
      'skills',
      'CLAUDE.md',
      'hooks',
      'MCP',
      'subagents',
      'workflows',
      'progress.md',
    ]) {
      expect(titles, required).toContain(required);
    }
  });

  it('maps SOLO assignments and keeps the artifact-chain diagram', () => {
    expect(slides[2]?.title).toBe('The artifact chain');
    expect(practice).toHaveLength(7);
    for (const slide of practice) {
      expect(String(slide.kicker ?? ''), String(slide.title)).toMatch(/^SOLO [1-7]$/);
      expect(String(slide.notes ?? ''), String(slide.title)).toMatch(/Map:\s*SOLO step/i);
    }
  });

  it('applies Apple keynote faces from slide 5 onward', () => {
    const defs = workshop5SourceSlides.filter((s) =>
      [
        'AI-native SDLC',
        'intent.md',
        'spec.md',
        'plan.md',
        'skills',
        'CLAUDE.md',
        'hooks',
        'MCP',
        'subagents',
        'workflows',
        'progress.md',
      ].includes(String(s.title)),
    );
    expect(defs).toHaveLength(11);
    for (const slide of [...defs, ...practice]) {
      expect(visualOf(slide).keynote, String(slide.title)).toBe(true);
      expect(slide.subtitle, String(slide.title)).toBeUndefined();
      const cards = Array.isArray(slide.cards) ? slide.cards : [];
      expect(cards.length, String(slide.title)).toBeLessThanOrEqual(1);
    }
    // Opening slides stay non-keynote
    for (const slide of workshop5SourceSlides.slice(0, 4)) {
      expect(visualOf(slide).keynote, String(slide.title)).not.toBe(true);
    }
  });

  it('keeps assignment faces to one large prompt + optional path chip', () => {
    for (const slide of practice) {
      expect(String(slide.title).length, String(slide.title)).toBeGreaterThan(10);
      const cards = Array.isArray(slide.cards) ? slide.cards : [];
      expect(cards).toHaveLength(1);
      expect(visualOf(slide).popOut, String(slide.title)).toBe(0);
    }
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
