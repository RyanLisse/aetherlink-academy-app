import {describe, expect, it} from 'vitest';
import {workshop6SourceSlides} from '../src/deck/workshop6-slides.ts';
import {normalizeSlides} from '../src/deck/normalize.ts';
import {isWorkshop3Path, isWorkshop4Path, isWorkshop5Path, isWorkshop6Path} from '../src/routes.tsx';
import {sourceSlides} from '../src/deck/slides.ts';
import {workshop3SourceSlides} from '../src/deck/workshop3-slides.ts';
import {workshop4SourceSlides} from '../src/deck/workshop4-slides.ts';
import {workshop5SourceSlides} from '../src/deck/workshop5-slides.ts';
import {expectWorkshopClassroomContract} from './workshop-classroom-contract.ts';

describe('AET-81 workshop 6 eigen-opdracht thin-slice deck', () => {
  const slides = normalizeSlides(workshop6SourceSlides);
  const practice = workshop6SourceSlides.filter((s) => s.type === 'practice');
  const visualOf = (s: Record<string, unknown>): Record<string, unknown> =>
    s.visual && typeof s.visual === 'object' && !Array.isArray(s.visual)
      ? (s.visual as Record<string, unknown>)
      : {};

  it('ships the workshop-6 faces (~14)', () => {
    expect(workshop6SourceSlides.length).toBeGreaterThanOrEqual(12);
    expect(workshop6SourceSlides.length).toBeLessThanOrEqual(16);
    expect(slides).toHaveLength(workshop6SourceSlides.length);
    expect(slides.every((s) => s.lessonId === 'workshop-6')).toBe(true);
    expect(slides[0]?.title).toMatch(/thin slice|starts today/i);
    expect(slides[slides.length - 1]?.title).toMatch(/Tomorrow|polish|present/i);
  });

  it('vehicle is Classroom 2 thin slice + n8n|Claude (not Eve / not W5 SDLC lab as vehicle)', () => {
    const blob = JSON.stringify(workshop6SourceSlides);
    expect(blob).toMatch(/Classroom 2/);
    expect(blob).toMatch(/n8n/);
    expect(blob).toMatch(/Claude Agents SDK|Claude Agent SDK/i);
    expect(blob).toMatch(/thin slice/i);
    expect(blob).toMatch(/Proof draft|Proof/i);
    expect(blob).not.toMatch(/\bEve\b/);
    // W5 lab must not be the day-6 vehicle chip
    const vehicle = workshop6SourceSlides.find((s) => String(s.kicker ?? '').startsWith('Vehicle'));
    expect(vehicle).toBeTruthy();
    expect(JSON.stringify(vehicle)).toMatch(/Classroom 2|n8n OR Claude/i);
    expect(JSON.stringify(vehicle)).not.toMatch(/aetherlink-daily-brief-lab-s1/);
    expect(JSON.stringify(vehicle)).not.toMatch(/aetherlink-day5-n8n-to-agent/);
    const body = workshop6SourceSlides.slice(0, -1);
    expect(JSON.stringify(body)).not.toMatch(/aetherlink-daily-brief-lab-s1/);
    expect(JSON.stringify(body)).not.toMatch(/Plan → Design → Build|one lesson per SDLC/i);
  });

  it('pedagogy: Open / Intent / Plan / First-build / Proof / Close cycles (uitleg→voordoen→zelf doen)', () => {
    const demos = workshop6SourceSlides.filter((s) => String(s.kicker ?? '').startsWith('Demo'));
    expect(demos.length).toBeGreaterThanOrEqual(3);
    expect(practice.length).toBeGreaterThanOrEqual(3);
    // First practice arrives before late Proof — no theory-dump then practice
    const firstPractice = workshop6SourceSlides.findIndex((s) => s.type === 'practice');
    const proofUitleg = workshop6SourceSlides.findIndex((s) =>
      String(s.kicker ?? '').includes('Proof draft'),
    );
    expect(firstPractice).toBeGreaterThanOrEqual(0);
    expect(proofUitleg).toBeGreaterThan(firstPractice);
    // Each Voordoen has a following Zelf doen nearby in Open / Intent / Plan
    for (const cycle of ['Open', 'Intent', 'Plan']) {
      const demoIdx = workshop6SourceSlides.findIndex(
        (s) => String(s.kicker ?? '') === `Demo · ${cycle}`,
      );
      expect(demoIdx, `demo ${cycle}`).toBeGreaterThanOrEqual(0);
      const zelfAfter = workshop6SourceSlides
        .slice(demoIdx + 1)
        .findIndex((s) => s.type === 'practice' && String(s.kicker ?? '').includes('Your turn'));
      expect(zelfAfter, `zelf after ${cycle}`).toBeGreaterThanOrEqual(0);
    }
  });

  it('stack chip on vehicle face; path chips on zelf-doen faces; timers in notes only', () => {
    const vehicle = workshop6SourceSlides.find((s) => String(s.kicker ?? '').startsWith('Vehicle'));
    expect(vehicle).toBeTruthy();
    const vCards = Array.isArray(vehicle!.cards) ? vehicle!.cards : [];
    expect(vCards.length).toBeGreaterThanOrEqual(2);
    expect(JSON.stringify(vCards)).toMatch(/n8n.*Claude Agents SDK/i);

    expect(practice.length).toBeGreaterThanOrEqual(4);
    practice.forEach((slide) => {
      expect(String(slide.title).length, String(slide.title)).toBeGreaterThan(10);
      const cards = Array.isArray(slide.cards) ? slide.cards : [];
      expect(cards).toHaveLength(1);
      expect(String((cards[0] as {body?: string}).body ?? '')).toMatch(/^SOLO/);
      expect(slide.layout, String(slide.title)).toBe('exercise');
      expect(Array.isArray(slide.steps) && slide.steps.length, String(slide.title)).toBeGreaterThanOrEqual(2);
      expect(String(slide.expected ?? '').trim(), String(slide.title)).not.toBe('');
      const notes = String(slide.notes ?? '');
      expect(notes, String(slide.title)).toMatch(/Timer:\s*\d+\s*min/i);
      expect(typeof slide.timer, String(slide.title)).toBe('number');
      expect(notes.toLowerCase()).toMatch(/checklist:/);
      expect(notes, String(slide.title)).toMatch(/Your turn/i);
    });
  });

  it('uses the Classroom visual and assignment contract', () => {
    expectWorkshopClassroomContract(workshop6SourceSlides);
  });

  it('no finished agent on day 6; bridge to W7 polish + present', () => {
    const blob = JSON.stringify(workshop6SourceSlides);
    expect(blob).toMatch(/not finish|No finished agent|not a finished agent/i);
    const close = workshop6SourceSlides[workshop6SourceSlides.length - 1]!;
    const closeBlob = `${close.title}\n${close.notes ?? ''}\n${close.kicker ?? ''}`;
    expect(closeBlob).toMatch(/Workshop 7|W7/i);
    expect(closeBlob).toMatch(/polish|present/i);
  });

  it('exposes Workshop 6 facilitator paths (not W3/W4/W5)', () => {
    expect(isWorkshop6Path('/workshop/6')).toBe(true);
    expect(isWorkshop6Path('/lesson/workshop-6')).toBe(true);
    expect(isWorkshop6Path('/workshop/3')).toBe(false);
    expect(isWorkshop6Path('/workshop/4')).toBe(false);
    expect(isWorkshop6Path('/workshop/5')).toBe(false);
    expect(isWorkshop6Path('/classroom/1')).toBe(false);
    expect(isWorkshop3Path('/workshop/6')).toBe(false);
    expect(isWorkshop4Path('/workshop/6')).toBe(false);
    expect(isWorkshop5Path('/workshop/6')).toBe(false);
  });

  it('does not break Classroom 1 SoT or Workshop 3/4/5 packs', () => {
    expect(sourceSlides).toHaveLength(113);
    const classroom = normalizeSlides(sourceSlides);
    expect(classroom.filter((s) => s.lessonId === 'teaching-day-1')).toHaveLength(67);
    expect(classroom.filter((s) => s.lessonId === 'workshop-6')).toHaveLength(0);
    expect(workshop3SourceSlides.length).toBe(18);
    expect(workshop3SourceSlides.every((s) => s.lessonId === 'workshop-3')).toBe(true);
    expect(workshop4SourceSlides.length).toBe(28);
    expect(workshop4SourceSlides.every((s) => s.lessonId === 'workshop-4')).toBe(true);
    expect(workshop5SourceSlides.length).toBe(49);
    expect(workshop5SourceSlides.every((s) => s.lessonId === 'workshop-5')).toBe(true);
  });
});
