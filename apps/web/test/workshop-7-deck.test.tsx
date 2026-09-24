import {describe, expect, it} from 'vitest';
import {workshop7SourceSlides} from '../src/deck/workshop7-slides.ts';
import {normalizeSlides} from '../src/deck/normalize.ts';
import {
  isWorkshop3Path,
  isWorkshop4Path,
  isWorkshop5Path,
  isWorkshop6Path,
  isWorkshop7Path,
} from '../src/routes.tsx';
import {sourceSlides} from '../src/deck/slides.ts';
import {workshop3SourceSlides} from '../src/deck/workshop3-slides.ts';
import {workshop4SourceSlides} from '../src/deck/workshop4-slides.ts';
import {workshop5SourceSlides} from '../src/deck/workshop5-slides.ts';
import {workshop6SourceSlides} from '../src/deck/workshop6-slides.ts';

describe('AET-85 workshop 7 ultra-minimal eigen-opdracht finish+present deck', () => {
  const slides = normalizeSlides(workshop7SourceSlides);
  const practice = workshop7SourceSlides.filter((s) => s.type === 'practice');
  const visualOf = (s: Record<string, unknown>): Record<string, unknown> =>
    s.visual && typeof s.visual === 'object' && !Array.isArray(s.visual)
      ? (s.visual as Record<string, unknown>)
      : {};

  it('ships workshop-7 ultra-minimal faces (~14)', () => {
    expect(workshop7SourceSlides.length).toBe(14);
    expect(slides).toHaveLength(14);
    expect(slides.every((s) => s.lessonId === 'workshop-7')).toBe(true);
    expect(slides[0]?.title).toMatch(/Ship the thin slice/i);
    expect(slides[slides.length - 1]?.title).toMatch(/Ninety days|next step/i);
  });

  it('vehicle is same W6 eigen opdracht — polish · gate · Proof · present · 90d (not Eve / not new curriculum)', () => {
    const blob = JSON.stringify(workshop7SourceSlides);
    expect(blob).toMatch(/polish/i);
    expect(blob).toMatch(/Proof final|Proof/i);
    expect(blob).toMatch(/5.?min|Five minutes/i);
    expect(blob).toMatch(/90d|Ninety days/i);
    expect(blob).toMatch(/thin slice|W6/i);
    expect(blob).toMatch(/n8n/);
    expect(blob).toMatch(/Claude Agents SDK|Claude/i);
    expect(blob).not.toMatch(/\bEve\b/);
    // No scope explosion / new fantasy product
    expect(blob).toMatch(/No scope explosion|no new feature|stay thin|still thin/i);
    // W5 lab must not be the day-7 vehicle
    expect(blob).not.toMatch(/aetherlink-daily-brief-lab-s1/);
    expect(blob).not.toMatch(/aetherlink-day5-n8n-to-agent/);
    expect(blob).not.toMatch(/Plan → Design → Build|one lesson per SDLC/i);
  });

  it('pedagogy: Polish / Review / Proof / Present cycles (uitleg→voordoen→zelf doen)', () => {
    const demos = workshop7SourceSlides.filter((s) => String(s.kicker ?? '').startsWith('Voordoen'));
    expect(demos.length).toBeGreaterThanOrEqual(3);
    expect(practice.length).toBeGreaterThanOrEqual(3);
    // First practice arrives before late Present — no theory-dump then practice
    const firstPractice = workshop7SourceSlides.findIndex((s) => s.type === 'practice');
    const presentUitleg = workshop7SourceSlides.findIndex((s) =>
      String(s.kicker ?? '').includes('Present') && String(s.kicker ?? '').startsWith('Uitleg'),
    );
    expect(firstPractice).toBeGreaterThanOrEqual(0);
    expect(presentUitleg).toBeGreaterThan(firstPractice);
    // Each Voordoen has a following Zelf doen nearby
    for (const cycle of ['Polish', 'Review', 'Present']) {
      const demoIdx = workshop7SourceSlides.findIndex(
        (s) => String(s.kicker ?? '') === `Voordoen · ${cycle}`,
      );
      expect(demoIdx, `demo ${cycle}`).toBeGreaterThanOrEqual(0);
      const zelfAfter = workshop7SourceSlides
        .slice(demoIdx + 1)
        .findIndex((s) => s.type === 'practice' && String(s.kicker ?? '').includes('Zelf doen'));
      expect(zelfAfter, `zelf after ${cycle}`).toBeGreaterThanOrEqual(0);
    }
  });

  it('path chips on zelf-doen / bar faces; timers in notes only', () => {
    const bar = workshop7SourceSlides.find((s) => String(s.kicker ?? '').startsWith('Bar'));
    expect(bar).toBeTruthy();
    const bCards = Array.isArray(bar!.cards) ? bar!.cards : [];
    expect(bCards).toHaveLength(1);
    expect(String((bCards[0] as {body?: string}).body ?? '')).toMatch(/W6|thin/i);
    expect(visualOf(bar!).popOut).toBe(0);

    expect(practice.length).toBeGreaterThanOrEqual(4);
    practice.forEach((slide) => {
      expect(String(slide.title).length, String(slide.title)).toBeGreaterThan(10);
      const cards = Array.isArray(slide.cards) ? slide.cards : [];
      expect(cards).toHaveLength(1);
      expect(String((cards[0] as {body?: string}).body ?? '')).toMatch(/^SOLO/);
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
    for (const slide of workshop7SourceSlides) {
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

  it('close ships 90d next steps; same W6 vehicle finish+present', () => {
    const close = workshop7SourceSlides[workshop7SourceSlides.length - 1]!;
    const closeBlob = `${close.title}\n${close.notes ?? ''}\n${close.kicker ?? ''}`;
    expect(closeBlob).toMatch(/90d|Ninety days/i);
    expect(closeBlob).toMatch(/next.?step/i);
    expect(closeBlob).toMatch(/W6|Proof final|5-min present/i);
  });

  it('exposes Workshop 7 facilitator paths (not W3/W4/W5/W6)', () => {
    expect(isWorkshop7Path('/workshop/7')).toBe(true);
    expect(isWorkshop7Path('/lesson/workshop-7')).toBe(true);
    expect(isWorkshop7Path('/workshop/6')).toBe(false);
    expect(isWorkshop7Path('/workshop/5')).toBe(false);
    expect(isWorkshop7Path('/classroom/1')).toBe(false);
    expect(isWorkshop3Path('/workshop/7')).toBe(false);
    expect(isWorkshop4Path('/workshop/7')).toBe(false);
    expect(isWorkshop5Path('/workshop/7')).toBe(false);
    expect(isWorkshop6Path('/workshop/7')).toBe(false);
  });

  it('does not break Classroom 1 SoT or Workshop 3/4/5/6 packs', () => {
    expect(sourceSlides).toHaveLength(91);
    const classroom = normalizeSlides(sourceSlides);
    expect(classroom.filter((s) => s.lessonId === 'teaching-day-1')).toHaveLength(44);
    expect(classroom.filter((s) => s.lessonId === 'workshop-7')).toHaveLength(0);
    expect(workshop3SourceSlides.length).toBe(18);
    expect(workshop3SourceSlides.every((s) => s.lessonId === 'workshop-3')).toBe(true);
    expect(workshop4SourceSlides.length).toBe(16);
    expect(workshop4SourceSlides.every((s) => s.lessonId === 'workshop-4')).toBe(true);
    expect(workshop5SourceSlides.length).toBe(33);
    expect(workshop5SourceSlides.every((s) => s.lessonId === 'workshop-5')).toBe(true);
    expect(workshop6SourceSlides.length).toBe(14);
    expect(workshop6SourceSlides.every((s) => s.lessonId === 'workshop-6')).toBe(true);
  });
});
