import {describe, expect, it} from 'vitest';
import {workshop5SourceSlides} from '../src/deck/workshop5-slides.ts';
import {normalizeSlides} from '../src/deck/normalize.ts';
import {isWorkshop5Path} from '../src/routes.tsx';
import {sourceSlides} from '../src/deck/slides.ts';

describe('AET-77 workshop 5 ultra-minimal AI-native SDLC deck', () => {
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

  it('ships workshop-5 ultra-minimal faces (slide1 diagram + clone CTA)', () => {
    expect(workshop5SourceSlides).toHaveLength(33);
    expect(slides).toHaveLength(33);
    expect(slides.every((s) => s.lessonId === 'workshop-5')).toBe(true);
    expect(slides[0]?.title).toMatch(/line vs the loop/i);
    expect(slides[1]?.title).toMatch(/Clone the lab|empty main/i);
    expect(slides[32]?.title).toMatch(/Seven files|One brief|One gate/i);
  });

  it('keeps the eleven required definition titles', () => {
    for (const required of DEF_TITLES) {
      expect(titles, required).toContain(required);
    }
  });

  it('slide 1 is Academy-dark line vs loop diagram', () => {
    const face = workshop5SourceSlides[0]!;
    const visual = visualOf(face);
    expect(visual.keynote).toBe(true);
    expect(visual.opener).toBe('showcase');
    expect(String(visual.image ?? '')).toMatch(/workshop-5\/line-vs-loop-dark\.png/);
    expect(String(face.notes ?? '')).toMatch(/Traditional|line|loop|Claude/i);
    expect(face.cards).toBeUndefined();
  });

  it('A1: lab vehicle LOCKED URL loud on slide 2', () => {
    const opening = workshop5SourceSlides[1]!;
    expect(JSON.stringify(opening)).toMatch(/RyanLisse\/aetherlink-daily-brief-lab-s1/);
    expect(String(opening.notes ?? '')).toMatch(/main is empty|empty main|Empty main/i);
    expect(String(opening.title ?? '')).toMatch(/Clone the lab|empty main/i);
    expect(visualOf(opening).keynote).toBe(true);
    expect(visualOf(opening).popOut).toBe(0);
  });

  it('A3: artifact-chain names lab filenames (notes or title — no steps wall)', () => {
    const chain = workshop5SourceSlides.find((s) =>
      String(s.title ?? '').includes('intent') && String(s.title ?? '').includes('gate'),
    );
    expect(chain).toBeTruthy();
    const blob = `${chain!.title}\n${chain!.notes ?? ''}`;
    for (const name of ['intent.md', 'docs/spec.md', 'docs/plan.md', 'docs/gate.md']) {
      expect(blob).toContain(name);
    }
    expect(chain!.items).toBeUndefined();
    expect(visualOf(chain!).keynote).toBe(true);
  });

  it('pedagogy: seven uitleg→voordoen→zelf-doen cycles', () => {
    const demos = workshop5SourceSlides.filter((s) => String(s.kicker ?? '').startsWith('Voordoen'));
    expect(demos).toHaveLength(7);
    expect(practice).toHaveLength(7);
    for (let n = 1; n <= 7; n++) {
      const demoIdx = workshop5SourceSlides.findIndex((s) => String(s.kicker ?? '') === `Voordoen · SOLO ${n}`);
      const soloIdx = workshop5SourceSlides.findIndex((s) => String(s.kicker ?? '').startsWith(`SOLO ${n} / 7`));
      expect(demoIdx, `demo SOLO ${n}`).toBeGreaterThanOrEqual(0);
      expect(soloIdx, `solo ${n}`).toBe(demoIdx + 1);
    }
    const firstPractice = workshop5SourceSlides.findIndex((s) => s.type === 'practice');
    const defsBeforeFirst = workshop5SourceSlides
      .slice(0, firstPractice)
      .filter((s) => DEF_TITLES.includes(String(s.title) as (typeof DEF_TITLES)[number]));
    expect(defsBeforeFirst.length).toBeLessThan(11);
  });

  it('A2: every SOLO face is SOLO N/7 + one lab path chip + short prompt', () => {
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
      expect(String(slide.kicker ?? ''), String(slide.title)).toMatch(new RegExp(`^SOLO ${n} / 7`));
      expect(String(slide.title).length, String(slide.title)).toBeGreaterThan(10);
      const cards = Array.isArray(slide.cards) ? slide.cards : [];
      expect(cards).toHaveLength(1);
      expect(String((cards[0] as {body?: string}).body ?? '')).toBe(expectedPaths[i]);
      expect(visualOf(slide).popOut, String(slide.title)).toBe(0);
      expect(visualOf(slide).keynote, String(slide.title)).toBe(true);
      // Ultra-minimal: no exercise chrome on the face
      expect(slide.layout, String(slide.title)).not.toBe('exercise');
      expect(slide.steps, String(slide.title)).toBeUndefined();
      expect(slide.columns, String(slide.title)).toBeUndefined();
      expect(slide.items, String(slide.title)).toBeUndefined();
    });
  });

  it('ultra-minimal: every face is keynote; no card walls / compare / steps layouts', () => {
    for (const slide of workshop5SourceSlides) {
      expect(visualOf(slide).keynote, String(slide.title)).toBe(true);
      expect(slide.subtitle, String(slide.title)).toBeUndefined();
      expect(slide.layout, String(slide.title)).toBeUndefined();
      expect(['compare', 'steps', 'pillars', 'recap', 'exercise']).not.toContain(slide.layout);
      const cards = Array.isArray(slide.cards) ? slide.cards : [];
      expect(cards.length, String(slide.title)).toBeLessThanOrEqual(1);
      if (cards.length === 1) {
        expect(visualOf(slide).popOut, String(slide.title)).toBe(0);
        // single-line chip body only
        expect(String((cards[0] as {body?: string}).body ?? '')).not.toMatch(/\n/);
      }
    }
  });

  it('A4: eleven defs stay one-idea with lab-locus kickers', () => {
    const defs = workshop5SourceSlides.filter((s) => DEF_TITLES.includes(String(s.title) as (typeof DEF_TITLES)[number]));
    expect(defs).toHaveLength(11);
    for (const slide of defs) {
      expect(visualOf(slide).keynote, String(slide.title)).toBe(true);
      expect(String(slide.kicker ?? ''), String(slide.title)).toMatch(/Definition|lab|SOLO|root|docs\/|gate|slash|agent|append|Uitleg|always|when/i);
    }
  });

  it('A5: presenter notes keep timers/checklists and open lab path lines', () => {
    for (const slide of practice) {
      const notes = String(slide.notes ?? '');
      expect(notes, String(slide.title)).toMatch(/Timer:\s*\d+\s*min/i);
      expect(typeof slide.timer, String(slide.title)).toBe('number');
      expect(notes.toLowerCase()).toMatch(/checklist:|check:|gate:/);
      expect(notes, String(slide.title)).toMatch(/Open lab path:/i);
      expect(notes, String(slide.title)).toMatch(/Zelf doen/i);
    }
  });

  it('A6: recap names seven lab files + lab repo (in notes; face stays one sentence)', () => {
    const recap = workshop5SourceSlides[workshop5SourceSlides.length - 1]!;
    expect(recap.title).toMatch(/Seven files|One brief|One gate/i);
    expect(String(recap.kicker ?? '')).toMatch(/aetherlink-daily-brief-lab-s1/);
    const notes = String(recap.notes ?? '');
    for (const name of [
      'intent.md',
      'docs/spec.md',
      'docs/plan.md',
      'out/latest.html',
      'docs/evidence.md',
      'docs/gate.md',
      'PR open',
    ]) {
      expect(notes).toContain(name);
    }
    expect(recap.items).toBeUndefined();
  });

  it('exposes Workshop 5 facilitator paths', () => {
    expect(isWorkshop5Path('/workshop/5')).toBe(true);
    expect(isWorkshop5Path('/lesson/workshop-5')).toBe(true);
    expect(isWorkshop5Path('/classroom/1')).toBe(false);
    expect(isWorkshop5Path('/deck')).toBe(false);
  });

  it('does not break Classroom 1 SoT cut of 86 / Day1=44', () => {
    expect(sourceSlides).toHaveLength(91);
    const classroom = normalizeSlides(sourceSlides);
    expect(classroom.filter((s) => s.lessonId === 'teaching-day-1')).toHaveLength(44);
    expect(classroom.filter((s) => s.lessonId === 'workshop-5')).toHaveLength(0);
  });
});
