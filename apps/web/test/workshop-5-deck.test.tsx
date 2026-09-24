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

  const DEF_TITLES = [
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
  ] as const;

  it('ships workshop-5 slides from the ACCEPT outline + definition addenda', () => {
    expect(workshop5SourceSlides).toHaveLength(27);
    expect(slides).toHaveLength(27);
    expect(slides.every((s) => s.lessonId === 'workshop-5')).toBe(true);
    expect(slides[0]?.title).toMatch(/Clone the lab|aetherlink-daily-brief-lab-s1|Empty main/i);
    expect(slides[26]?.title).toBe('Recap + Proof');
  });

  it('highlights the eleven required definition slides', () => {
    for (const required of DEF_TITLES) {
      expect(titles, required).toContain(required);
    }
  });

  it('A1: opening face carries the lab vehicle URL', () => {
    const opening = workshop5SourceSlides[0]!;
    const blob = JSON.stringify(opening);
    expect(blob).toMatch(/aetherlink-daily-brief-lab-s1/);
    expect(String(opening.notes ?? '')).toMatch(/main is empty|Empty main|empty main/i);
  });

  it('A3: artifact-chain uses lab filenames', () => {
    const chain = workshop5SourceSlides.find((s) => s.title === 'The artifact chain');
    expect(chain).toBeTruthy();
    const labels = (Array.isArray(chain?.items) ? chain!.items : []).map((item) =>
      String((item as {label?: string}).label ?? ''),
    );
    expect(labels).toEqual([
      'intent.md',
      'docs/spec.md',
      'docs/plan.md',
      'diff + tests',
      'PR review',
      'docs/gate.md',
      'new intent.md',
    ]);
  });

  it('A2: every SOLO face is SOLO N/7 + one lab path chip + short prompt', () => {
    expect(practice).toHaveLength(7);
    const expectedPaths = [
      'intent.md',
      'docs/spec.md',
      'docs/plan.md',
      'out/latest.html',
      'src/agent.ts',
      'docs/evidence.md',
      'docs/gate.md',
    ];
    practice.forEach((slide, i) => {
      const n = i + 1;
      expect(String(slide.kicker ?? ''), String(slide.title)).toBe(`SOLO ${n} / 7`);
      expect(String(slide.title).length, String(slide.title)).toBeGreaterThan(10);
      const cards = Array.isArray(slide.cards) ? slide.cards : [];
      expect(cards).toHaveLength(1);
      expect(String((cards[0] as {body?: string}).body ?? '')).toBe(expectedPaths[i]);
      expect(visualOf(slide).popOut, String(slide.title)).toBe(0);
      expect(visualOf(slide).keynote, String(slide.title)).toBe(true);
    });
  });

  it('A4: eleven defs stay Apple one-idea with lab-locus kickers', () => {
    const defs = workshop5SourceSlides.filter((s) => DEF_TITLES.includes(String(s.title) as (typeof DEF_TITLES)[number]));
    expect(defs).toHaveLength(11);
    for (const slide of defs) {
      expect(visualOf(slide).keynote, String(slide.title)).toBe(true);
      expect(slide.subtitle, String(slide.title)).toBeUndefined();
      const cards = Array.isArray(slide.cards) ? slide.cards : [];
      expect(cards.length, String(slide.title)).toBeLessThanOrEqual(1);
      expect(String(slide.kicker ?? ''), String(slide.title)).toMatch(/Definition|lab|SOLO|root|docs\/|gate|slash|agent|append/i);
    }
  });

  it('A5: presenter notes keep timers/checklists and open lab path lines', () => {
    for (const slide of practice) {
      expect(slide.layout, String(slide.title)).not.toBe('exercise');
      expect(slide.steps, String(slide.title)).toBeUndefined();
      expect(slide.check, String(slide.title)).toBeUndefined();
      expect(slide.expected, String(slide.title)).toBeUndefined();
      const notes = String(slide.notes ?? '');
      expect(notes, String(slide.title)).toMatch(/Timer:\s*\d+\s*min/i);
      expect(typeof slide.timer, String(slide.title)).toBe('number');
      expect(notes.toLowerCase()).toMatch(/checklist:|check:|gate:/);
      expect(notes, String(slide.title)).toMatch(/Open lab path:/i);
    }
  });

  it('A6: recap lists seven lab files and the lab repo name', () => {
    const recap = workshop5SourceSlides[workshop5SourceSlides.length - 1]!;
    expect(recap.title).toBe('Recap + Proof');
    expect(String(recap.kicker ?? '')).toMatch(/aetherlink-daily-brief-lab-s1/);
    const labels = (Array.isArray(recap.items) ? recap.items : []).map((item) =>
      String((item as {label?: string}).label ?? ''),
    );
    expect(labels).toEqual([
      'intent.md',
      'docs/spec.md',
      'docs/plan.md',
      'out/latest.html',
      'docs/evidence.md',
      'docs/gate.md',
      'PR open',
    ]);
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
