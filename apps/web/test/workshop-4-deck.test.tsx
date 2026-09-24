import {describe, expect, it} from 'vitest';
import {workshop4SourceSlides} from '../src/deck/workshop4-slides.ts';
import {normalizeSlides} from '../src/deck/normalize.ts';
import {isWorkshop3Path, isWorkshop4Path, isWorkshop5Path} from '../src/routes.tsx';
import {sourceSlides} from '../src/deck/slides.ts';
import {workshop3SourceSlides} from '../src/deck/workshop3-slides.ts';
import {workshop5SourceSlides} from '../src/deck/workshop5-slides.ts';

describe('AET-80 workshop 4 ultra-minimal n8n→Claude Agent SDK deck', () => {
  const slides = normalizeSlides(workshop4SourceSlides);
  const practice = workshop4SourceSlides.filter((s) => s.type === 'practice');
  const visualOf = (s: Record<string, unknown>): Record<string, unknown> =>
    s.visual && typeof s.visual === 'object' && !Array.isArray(s.visual)
      ? (s.visual as Record<string, unknown>)
      : {};

  it('ships workshop-4 ultra-minimal faces (16 ±2)', () => {
    expect(workshop4SourceSlides.length).toBeGreaterThanOrEqual(14);
    expect(workshop4SourceSlides.length).toBeLessThanOrEqual(18);
    expect(slides).toHaveLength(workshop4SourceSlides.length);
    expect(slides.every((s) => s.lessonId === 'workshop-4')).toBe(true);
    expect(slides[0]?.title).toMatch(/Same triage|Claude Agent SDK/i);
    expect(slides[slides.length - 1]?.title).toMatch(/different repo|Tomorrow/i);
  });

  it('vehicle is day5-n8n-to-agent flat SOLO 0→4 (not SDLC / not Eve / not W5 lab as vehicle)', () => {
    const blob = JSON.stringify(workshop4SourceSlides);
    expect(blob).toMatch(/aetherlink-day5-n8n-to-agent/);
    expect(blob).toMatch(/SOLO 0/);
    expect(blob).toMatch(/SOLO 2/);
    expect(blob).toMatch(/systemPrompt|prompt/i);
    expect(blob).toMatch(/Low|Med|High|L\/M\/H|labels/i);
    expect(blob).not.toMatch(/\bEve\b/);
    expect(blob).not.toMatch(/intent\.md|progress\.md|step-1-plan|docs\/gate\.md/);
    expect(blob).not.toMatch(/Plan → Design → Build|one lesson per SDLC/i);
    // W5 lab may be named only on the close/bridge face — never as the W4 vehicle chip
    const vehicle = workshop4SourceSlides.find((s) => String(s.kicker ?? '').startsWith('Vehicle'));
    expect(JSON.stringify(vehicle)).toMatch(/aetherlink-day5-n8n-to-agent/);
    expect(JSON.stringify(vehicle)).not.toMatch(/aetherlink-daily-brief-lab-s1/);
    const body = workshop4SourceSlides.slice(0, -1); // exclude close
    expect(JSON.stringify(body)).not.toMatch(/aetherlink-daily-brief-lab-s1/);
  });

  it('pedagogy: Open/Parity/First-agent/Stretch/Acceptance cycles (uitleg→voordoen→zelf doen)', () => {
    const demos = workshop4SourceSlides.filter((s) => String(s.kicker ?? '').startsWith('Voordoen'));
    expect(demos.length).toBeGreaterThanOrEqual(3);
    expect(practice.length).toBeGreaterThanOrEqual(4); // SOLO 0 1 2 3 (+4)
    for (const solo of ['SOLO 0', 'SOLO 1', 'SOLO 2', 'SOLO 3']) {
      const demoIdx = workshop4SourceSlides.findIndex((s) => String(s.kicker ?? '') === `Voordoen · ${solo}`);
      const zelfIdx = workshop4SourceSlides.findIndex(
        (s) => String(s.kicker ?? '').startsWith(solo) && String(s.kicker ?? '').includes('Zelf doen'),
      );
      expect(demoIdx, `demo ${solo}`).toBeGreaterThanOrEqual(0);
      expect(zelfIdx, `zelf ${solo}`).toBe(demoIdx + 1);
    }
    // First practice (SOLO 0) arrives before first-agent uitleg — no theory-dump then practice
    const firstPractice = workshop4SourceSlides.findIndex((s) => s.type === 'practice');
    const fundamentals = workshop4SourceSlides.findIndex((s) =>
      String(s.kicker ?? '').includes('four fundamentals'),
    );
    expect(firstPractice).toBeGreaterThanOrEqual(0);
    expect(fundamentals).toBeGreaterThan(firstPractice);
  });

  it('clone URL chip on vehicle face; SOLO chips on zelf-doen faces', () => {
    const vehicle = workshop4SourceSlides.find((s) => String(s.kicker ?? '').startsWith('Vehicle'));
    expect(vehicle).toBeTruthy();
    const vCards = Array.isArray(vehicle!.cards) ? vehicle!.cards : [];
    expect(vCards).toHaveLength(1);
    expect(String((vCards[0] as {body?: string}).body ?? '')).toMatch(
      /github\.com\/RyanLisse\/aetherlink-day5-n8n-to-agent/,
    );
    expect(visualOf(vehicle!).popOut).toBe(0);

    const expectedChips = ['SOLO 0', 'SOLO 1', 'SOLO 2', 'SOLO 3', 'SOLO 4'];
    expect(practice).toHaveLength(5);
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
    for (const slide of workshop4SourceSlides) {
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

  it('solo bar ≥ SOLO 2; SOLO 3 stretch; bridge to W5 different repo', () => {
    const solo2 = workshop4SourceSlides.find((s) => String(s.kicker ?? '').includes('SOLO 2') && String(s.kicker ?? '').includes('solo bar'));
    expect(solo2).toBeTruthy();
    expect(String(solo2!.notes)).toMatch(/required|solo bar|≥\s*SOLO 2/i);
    const solo3 = workshop4SourceSlides.find((s) => String(s.kicker ?? '').includes('SOLO 3') && String(s.kicker ?? '').includes('optional'));
    expect(solo3).toBeTruthy();
    const close = workshop4SourceSlides[workshop4SourceSlides.length - 1]!;
    const blob = `${close.title}\n${close.notes ?? ''}`;
    expect(blob).toMatch(/Workshop 5|W5|daily-brief|different repo/i);
    expect(blob).toMatch(/do not drag SDLC|not.*this repo|different/i);
  });

  it('exposes Workshop 4 facilitator paths (not W3/W5)', () => {
    expect(isWorkshop4Path('/workshop/4')).toBe(true);
    expect(isWorkshop4Path('/lesson/workshop-4')).toBe(true);
    expect(isWorkshop4Path('/workshop/3')).toBe(false);
    expect(isWorkshop4Path('/workshop/5')).toBe(false);
    expect(isWorkshop4Path('/classroom/1')).toBe(false);
    expect(isWorkshop3Path('/workshop/4')).toBe(false);
    expect(isWorkshop5Path('/workshop/4')).toBe(false);
  });

  it('does not break Classroom 1 SoT, Workshop 3, or Workshop 5 packs', () => {
    expect(sourceSlides).toHaveLength(86);
    const classroom = normalizeSlides(sourceSlides);
    expect(classroom.filter((s) => s.lessonId === 'teaching-day-1')).toHaveLength(44);
    expect(classroom.filter((s) => s.lessonId === 'workshop-4')).toHaveLength(0);
    expect(workshop3SourceSlides.length).toBe(18);
    expect(workshop3SourceSlides.every((s) => s.lessonId === 'workshop-3')).toBe(true);
    expect(workshop5SourceSlides.length).toBe(48);
    expect(workshop5SourceSlides.every((s) => s.lessonId === 'workshop-5')).toBe(true);
  });
});
