import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';
import {workshop5SourceSlides} from '../src/deck/workshop5-slides.ts';
import {normalizeSlides} from '../src/deck/normalize.ts';
import {isWorkshop5Path} from '../src/routes.tsx';
import {sourceSlides} from '../src/deck/slides.ts';

describe('AET-77 workshop 5 ultra-minimal AI-native SDLC deck', () => {
  const slides = normalizeSlides(workshop5SourceSlides);
  const practice = workshop5SourceSlides.filter((s) => s.type === 'practice');
  const kicker = (s: Record<string, unknown> | undefined): string => String(s?.kicker ?? '');
  const visualOf = (s: Record<string, unknown>): Record<string, unknown> =>
    s.visual && typeof s.visual === 'object' && !Array.isArray(s.visual)
      ? (s.visual as Record<string, unknown>)
      : {};
  const definitions = workshop5SourceSlides.filter((s) => visualOf(s).opener === 'definition');
  const terms = definitions.map((s) => kicker(s));

  const REQUIRED_TERMS = [
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

  it('opens welcome → plan → warm-up → line vs loop → definition → shifts, and closes on the recap', () => {
    expect(slides).toHaveLength(workshop5SourceSlides.length);
    expect(slides.every((s) => s.lessonId === 'workshop-5')).toBe(true);
    expect(visualOf(workshop5SourceSlides[0]!).opener).toBe('welcome');
    expect(String(visualOf(workshop5SourceSlides[1]!).image)).toBe('workshop-5/agenda-dark.png');
    expect(slides[2]?.title).toMatch(/your SDLC look like today/i);
    expect(slides[3]?.title).toMatch(/line vs the loop/i);
    expect(kicker(workshop5SourceSlides[4])).toBe('AI-native SDLC');
    expect(String(visualOf(workshop5SourceSlides[5]!).image)).toBe('workshop-5/shifts-dark.png');
    expect(slides[slides.length - 1]?.title).toMatch(/Seven files|One brief|One gate/i);
  });

  it('the line vs loop face is the Academy-dark diagram', () => {
    const face = workshop5SourceSlides.find((s) => String(visualOf(s).image ?? '').includes('line-vs-loop'))!;
    const visual = visualOf(face);
    expect(visual.keynote).toBe(true);
    expect(visual.opener).toBe('showcase');
    expect(String(visual.image ?? '')).toMatch(/workshop-5\/line-vs-loop-dark\.png/);
    expect(face.cards).toBeUndefined();
  });

  it('the AI-native SDLC definition follows the loop and says loop + AI at each point', () => {
    const def = workshop5SourceSlides.find((s) => kicker(s) === 'AI-native SDLC')!;
    expect(kicker(def)).toBe('AI-native SDLC');
    expect(visualOf(def).opener).toBe('definition');
    expect(String(def.title)).toMatch(/loop/i);
    expect(String(def.title)).toMatch(/AI embedded at each point/i);
  });

  it('A1: lab vehicle URL is loud and main is empty on purpose', () => {
    const vehicle = workshop5SourceSlides.find((s) => kicker(s) === 'Workshop 5 · vehicle')!;
    expect(JSON.stringify(vehicle)).toMatch(/RyanLisse\/aetherlink-daily-brief-lab-s1/);
    expect(String(vehicle.notes ?? '')).toMatch(/main is empty/i);
    expect(String(vehicle.title ?? '')).toMatch(/Clone the lab/i);
    expect(visualOf(vehicle).popOut).toBe(0);
  });

  it('A3: the loop face names the lab artifact chain in its notes', () => {
    const loop = workshop5SourceSlides.find((s) => kicker(s) === 'Look · the loop')!;
    const notes = String(loop.notes ?? '');
    for (const name of ['intent.md', 'docs/spec.md', 'docs/plan.md', 'docs/gate.md']) {
      expect(notes).toContain(name);
    }
  });

  it('the gap quote replaces the artifact-chain face, with its source', () => {
    const gap = workshop5SourceSlides.find((s) => kicker(s) === 'Explain · the gap')!;
    expect(visualOf(gap).opener).toBe('quote');
    expect(JSON.stringify(gap.cards)).toContain('Louis Claxton · The AI-Native SDLC playbook');
    expect(String(gap.title)).toMatch(/processes around the code haven't changed/);
    expect(workshop5SourceSlides.indexOf(gap)).toBe(8);
  });

  it('keeps every required definition, each once', () => {
    for (const required of REQUIRED_TERMS) expect(terms, required).toContain(required);
    expect(new Set(terms).size).toBe(terms.length);
  });

  it('definition faces are dictionary entries: headword kicker, the definition as the face', () => {
    for (const def of definitions) {
      const term = kicker(def);
      expect(term.length, term).toBeLessThanOrEqual(20);
      expect(String(def.title), term).not.toBe(term);
      expect(String(def.title).split(/\s+/).length, term).toBeGreaterThanOrEqual(7);
      expect(String(def.title).length, term).toBeLessThanOrEqual(130);
    }
  });

  it('pedagogy: every SOLO runs Look → Definition → Demo → Your turn', () => {
    expect(practice).toHaveLength(7);
    for (let n = 1; n <= 7; n++) {
      const demoIdx = workshop5SourceSlides.findIndex((s) => kicker(s) === `Demo · SOLO ${n}`);
      const lookIdx = workshop5SourceSlides.findIndex((s) => kicker(s) === `Look · SOLO ${n}`);
      expect(demoIdx, `demo SOLO ${n}`).toBeGreaterThanOrEqual(0);
      expect(kicker(workshop5SourceSlides[demoIdx + 1]), `your turn SOLO ${n}`).toBe(`SOLO ${n} / 7 · Your turn`);
      expect(visualOf(workshop5SourceSlides[demoIdx - 1]!).opener, `definition SOLO ${n}`).toBe('definition');
      expect(lookIdx, `look SOLO ${n}`).toBe(demoIdx - 2);
    }
  });

  it('every Look face is a showcase diagram that exists in public/', () => {
    const looks = workshop5SourceSlides.filter((s) => visualOf(s).opener === 'showcase');
    expect(looks.length).toBeGreaterThanOrEqual(10);
    for (const face of looks) {
      const image = String(visualOf(face).image ?? '');
      expect(image, String(face.title)).toMatch(/^workshop-5\/.+-dark\.png$/);
      expect(existsSync(fileURLToPath(new URL(`../public/${image}`, import.meta.url))), image).toBe(true);
    }
  });

  it('every face is English: no Dutch rhythm labels left', () => {
    for (const slide of workshop5SourceSlides) {
      const face = `${slide.kicker ?? ''} ${slide.title ?? ''} ${slide.notes ?? ''}`;
      expect(face, String(slide.title)).not.toMatch(/Uitleg|Voordoen|Zelf doen/i);
    }
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
      expect(kicker(slide), String(slide.title)).toMatch(new RegExp(`^SOLO ${n} / 7`));
      expect(String(slide.title).length, String(slide.title)).toBeGreaterThan(10);
      const cards = Array.isArray(slide.cards) ? slide.cards : [];
      expect(cards).toHaveLength(1);
      expect(String((cards[0] as {body?: string}).body ?? '')).toBe(expectedPaths[i]);
      expect(visualOf(slide).popOut, String(slide.title)).toBe(0);
      expect(slide.layout, String(slide.title)).not.toBe('exercise');
      expect(slide.steps, String(slide.title)).toBeUndefined();
    });
  });

  it('ultra-minimal: every face is keynote; no card walls / compare / steps layouts', () => {
    for (const slide of workshop5SourceSlides) {
      expect(visualOf(slide).keynote, String(slide.title)).toBe(true);
      expect(slide.subtitle, String(slide.title)).toBeUndefined();
      expect(slide.layout, String(slide.title)).toBeUndefined();
      const cards = Array.isArray(slide.cards) ? slide.cards : [];
      expect(cards.length, String(slide.title)).toBeLessThanOrEqual(1);
      if (cards.length === 1) {
        expect(visualOf(slide).popOut, String(slide.title)).toBe(0);
        expect(String((cards[0] as {body?: string}).body ?? '')).not.toMatch(/\n/);
      }
    }
  });

  it('A5: presenter notes keep timers/checklists and open lab path lines', () => {
    for (const slide of practice) {
      const notes = String(slide.notes ?? '');
      expect(notes, String(slide.title)).toMatch(/Timer:\s*\d+\s*min/i);
      expect(typeof slide.timer, String(slide.title)).toBe('number');
      expect(notes.toLowerCase()).toMatch(/checklist:|check:|gate:/);
      expect(notes, String(slide.title)).toMatch(/Open lab path:/i);
      expect(notes, String(slide.title)).toMatch(/Your turn/);
    }
  });

  it('A6: recap names seven lab files + lab repo (in notes; face stays one sentence)', () => {
    const recap = workshop5SourceSlides[workshop5SourceSlides.length - 1]!;
    expect(recap.title).toMatch(/Seven files|One brief|One gate/i);
    expect(kicker(recap)).toMatch(/aetherlink-daily-brief-lab-s1/);
    const notes = String(recap.notes ?? '');
    for (const name of ['intent.md', 'docs/spec.md', 'docs/plan.md', 'out/latest.html', 'docs/evidence.md', 'docs/gate.md', 'PR open']) {
      expect(notes).toContain(name);
    }
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
