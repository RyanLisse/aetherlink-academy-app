import {describe, expect, it} from 'vitest';
import {workshop3SourceSlides} from '../src/deck/workshop3-slides.ts';
import {normalizeSlides} from '../src/deck/normalize.ts';
import {isWorkshop3Path, isWorkshop5Path} from '../src/routes.tsx';
import {sourceSlides} from '../src/deck/slides.ts';
import {workshop5SourceSlides} from '../src/deck/workshop5-slides.ts';

describe('AET-79 workshop 3 ultra-minimal n8n L1→L3 deck', () => {
  const slides = normalizeSlides(workshop3SourceSlides);
  const practice = workshop3SourceSlides.filter((s) => s.type === 'practice');
  const visualOf = (s: Record<string, unknown>): Record<string, unknown> =>
    s.visual && typeof s.visual === 'object' && !Array.isArray(s.visual)
      ? (s.visual as Record<string, unknown>)
      : {};

  it('ships workshop-3 ultra-minimal faces (18 ±2)', () => {
    expect(workshop3SourceSlides.length).toBeGreaterThanOrEqual(16);
    expect(workshop3SourceSlides.length).toBeLessThanOrEqual(20);
    expect(slides).toHaveLength(workshop3SourceSlides.length);
    expect(slides.every((s) => s.lessonId === 'workshop-3')).toBe(true);
    expect(slides[0]?.title).toMatch(/One ticket|Three agency/i);
    expect(slides[slides.length - 1]?.title).toMatch(/L1 rules|L2 judgment|L3 specialists/i);
  });

  it('vehicle is n8n ticket priority ladder (not SDLC / not Eve)', () => {
    const blob = JSON.stringify(workshop3SourceSlides);
    expect(blob).toMatch(/n8n/i);
    expect(blob).toMatch(/L1/);
    expect(blob).toMatch(/L2/);
    expect(blob).toMatch(/L3/);
    expect(blob).toMatch(/Switch|ticket|priority|Low|Med|High/i);
    expect(blob).not.toMatch(/aetherlink-daily-brief-lab-s1/);
    expect(blob).not.toMatch(/\bEve\b/);
    expect(blob).not.toMatch(/intent\.md|docs\/gate\.md/);
  });

  it('pedagogy: three uitleg→voordoen→zelf-doen cycles (L1/L2/L3)', () => {
    const demos = workshop3SourceSlides.filter((s) => String(s.kicker ?? '').startsWith('Voordoen'));
    expect(demos).toHaveLength(3);
    expect(practice.length).toBeGreaterThanOrEqual(3); // L1 L2 L3 (+ Proof)
    for (const level of ['L1', 'L2', 'L3']) {
      const demoIdx = workshop3SourceSlides.findIndex((s) => String(s.kicker ?? '') === `Voordoen · ${level}`);
      const soloIdx = workshop3SourceSlides.findIndex(
        (s) => String(s.kicker ?? '').startsWith(level) && String(s.kicker ?? '').includes('Zelf doen'),
      );
      expect(demoIdx, `demo ${level}`).toBeGreaterThanOrEqual(0);
      expect(soloIdx, `solo ${level}`).toBe(demoIdx + 1);
    }
    // First practice must not be after all theory — L1 zelf doen arrives before L2 uitleg
    const firstPractice = workshop3SourceSlides.findIndex((s) => s.type === 'practice');
    const l2Uitleg = workshop3SourceSlides.findIndex((s) => String(s.kicker ?? '').includes('Uitleg · L2'));
    expect(firstPractice).toBeGreaterThanOrEqual(0);
    expect(l2Uitleg).toBeGreaterThan(firstPractice);
  });

  it('voordoen faces ship n8n screenshot ladder 01–03', () => {
    const expected = [
      'workshop-3/01-n8n.jpeg',
      'workshop-3/02-n8n.jpeg',
      'workshop-3/03-n8n.jpeg',
    ];
    const demos = workshop3SourceSlides.filter((s) => String(s.kicker ?? '').startsWith('Voordoen'));
    expect(demos).toHaveLength(3);
    demos.forEach((slide, i) => {
      const visual = visualOf(slide);
      expect(visual.keynote).toBe(true);
      expect(visual.opener).toBe('showcase');
      expect(String(visual.image ?? '')).toBe(expected[i]);
    });
  });

  it('zelf doen faces: one prompt + ≤1 chip; timers/checklists in notes only', () => {
    const expectedChips = ['L1', 'L2', 'L3', 'Proof'];
    expect(practice).toHaveLength(4);
    practice.forEach((slide, i) => {
      expect(String(slide.title).length, String(slide.title)).toBeGreaterThan(10);
      const cards = Array.isArray(slide.cards) ? slide.cards : [];
      expect(cards).toHaveLength(1);
      expect(String((cards[0] as {body?: string}).body ?? '')).toBe(expectedChips[i]);
      expect(visualOf(slide).popOut, String(slide.title)).toBe(0);
      expect(visualOf(slide).keynote, String(slide.title)).toBe(true);
      expect(slide.layout, String(slide.title)).not.toBe('exercise');
      expect(slide.steps, String(slide.title)).toBeUndefined();
      expect(slide.columns, String(slide.title)).toBeUndefined();
      expect(slide.items, String(slide.title)).toBeUndefined();
      const notes = String(slide.notes ?? '');
      expect(notes, String(slide.title)).toMatch(/Timer:\s*\d+\s*min/i);
      expect(typeof slide.timer, String(slide.title)).toBe('number');
      expect(notes.toLowerCase()).toMatch(/checklist:/);
      expect(notes, String(slide.title)).toMatch(/Zelf doen/i);
    });
  });

  it('ultra-minimal: every face is keynote; no card walls / compare / steps layouts', () => {
    for (const slide of workshop3SourceSlides) {
      expect(visualOf(slide).keynote, String(slide.title)).toBe(true);
      expect(slide.subtitle, String(slide.title)).toBeUndefined();
      expect(slide.layout, String(slide.title)).toBeUndefined();
      expect(['compare', 'steps', 'pillars', 'recap', 'exercise']).not.toContain(slide.layout);
      const cards = Array.isArray(slide.cards) ? slide.cards : [];
      expect(cards.length, String(slide.title)).toBeLessThanOrEqual(1);
      if (cards.length === 1) {
        expect(visualOf(slide).popOut, String(slide.title)).toBe(0);
        expect(String((cards[0] as {body?: string}).body ?? '')).not.toMatch(/\n/);
      }
    }
  });

  it('bridge names Workshop 4 / Claude; n8n→Claude lock', () => {
    const bridge = workshop3SourceSlides.find((s) => String(s.kicker ?? '').includes('Bridge'));
    expect(bridge).toBeTruthy();
    const blob = `${bridge!.title}\n${bridge!.notes ?? ''}`;
    expect(blob).toMatch(/Claude|Workshop 4|day 4/i);
    expect(JSON.stringify(workshop3SourceSlides)).toMatch(/n8n→Claude|n8n->Claude|Claude Agents SDK/i);
  });

  it('exposes Workshop 3 facilitator paths (not W5)', () => {
    expect(isWorkshop3Path('/workshop/3')).toBe(true);
    expect(isWorkshop3Path('/lesson/workshop-3')).toBe(true);
    expect(isWorkshop3Path('/workshop/5')).toBe(false);
    expect(isWorkshop3Path('/classroom/1')).toBe(false);
    expect(isWorkshop5Path('/workshop/3')).toBe(false);
  });

  it('does not break Classroom 1 SoT or Workshop 5 pack', () => {
    expect(sourceSlides).toHaveLength(91);
    const classroom = normalizeSlides(sourceSlides);
    expect(classroom.filter((s) => s.lessonId === 'teaching-day-1')).toHaveLength(44);
    expect(classroom.filter((s) => s.lessonId === 'workshop-3')).toHaveLength(0);
    expect(workshop5SourceSlides.length).toBe(33);
    expect(workshop5SourceSlides.every((s) => s.lessonId === 'workshop-5')).toBe(true);
  });
});
