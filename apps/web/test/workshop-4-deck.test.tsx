import {existsSync, readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import {workshop4SourceSlides} from '../src/deck/workshop4-slides.ts';
import {W4_SOLO_COMPANIONS} from '../src/deck/workshop4-companions.ts';
import {normalizeSlides} from '../src/deck/normalize.ts';
import {isWorkshop3Path, isWorkshop4Path, isWorkshop5Path} from '../src/routes.tsx';
import {sourceSlides} from '../src/deck/slides.ts';
import {workshop3SourceSlides} from '../src/deck/workshop3-slides.ts';
import {workshop5SourceSlides} from '../src/deck/workshop5-slides.ts';
import {expectWorkshopClassroomContract} from './workshop-classroom-contract.ts';

const introTitles = [
  'Welcome to Workshop 4 · Support agents with the Claude Agent SDK',
  'Yesterday’s recap · Workshop 3 · Agents in n8n',
  'Today · agenda',
];

const conceptRecapTitles = [
  'n8n ↔ Agent SDK at a glance',
  'Agent and agent loop',
  'System prompt',
  'Tools',
  'MCP: external data',
  'Control: hooks and approval',
  'Subagents',
  'Skills',
  'Fixed workflow vs. dynamic agent',
];

const conceptRecapImages = [
  '00-overview.png',
  '01-agent-loop.png',
  '02-systeemprompt.png',
  '03-tools.png',
  '04-mcp.png',
  '05-hooks.png',
  '06-subagents.png',
  '07-skills.png',
  '08-workflows-vs-dynamisch.png',
];

const titles = [
  ...introTitles,
  "Yesterday's n8n. Today's Agent SDK.",
  'Map n8n to the Agent SDK.',
  ...conceptRecapTitles,
  'Get the workshop package.',
  'Lesson 1: one agent reads CLAUDE.md.',
  'Watch one agent classify a message.',
  'Run Lesson 1 and test the tone trap.',
  'Discuss: what does the main agent know?',
  'Lesson 2: delegate to two subagents.',
  'Watch the orchestrator save a draft.',
  'Run the orchestrator and inspect the draft.',
  'Lesson 3: look up transaction data through MCP.',
  'Watch an MCP transaction lookup.',
  'Run Lesson 3 with transaction messages.',
  'Discuss: tools and external data.',
  'Complete the acceptance table and Proof.',
  'Close: keep a human in the loop.',
];

const addedTitles = new Set([...introTitles, ...conceptRecapTitles]);
const visualOf = (slide: Record<string, unknown> | undefined): Record<string, unknown> =>
  slide?.visual && typeof slide.visual === 'object' ? slide.visual as Record<string, unknown> : {};

describe('Workshop 4 Agent SDK classroom deck', () => {
  const slides = normalizeSlides(workshop4SourceSlides);
  const practice = workshop4SourceSlides.filter((slide) => slide.type === 'practice');
  /** The 16 lesson slides; the 3 intro and 9 concept-recap slides mirror the live room deck and have their own checks. */
  const lessonSlides = workshop4SourceSlides.filter((slide) => !addedTitles.has(String(slide.title)));

  it('has the requested 28-slide sequence', () => {
    expect(workshop4SourceSlides).toHaveLength(28);
    expect(slides).toHaveLength(28);
    expect(lessonSlides).toHaveLength(16);
    expect(workshop4SourceSlides.every((slide) => slide.lessonId === 'workshop-4')).toBe(true);
    expect(workshop4SourceSlides.map((slide) => String(slide.title))).toEqual(titles);
  });

  it('opens with the three intro slides, then the bridge, then nine concept-recap visuals', () => {
    expect(workshop4SourceSlides.slice(0, 3).map((slide) => String(slide.title))).toEqual(introTitles);
    expect(workshop4SourceSlides.slice(3, 5).map((slide) => String(slide.title))).toEqual([
      "Yesterday's n8n. Today's Agent SDK.",
      'Map n8n to the Agent SDK.',
    ]);
    expect(workshop4SourceSlides.slice(5, 14).map((slide) => String(slide.title))).toEqual(conceptRecapTitles);
    expect(workshop4SourceSlides[14]?.title).toBe('Get the workshop package.');
    expect(workshop4SourceSlides[1]).toMatchObject({type: 'recap', layout: 'recap'});
    expect(workshop4SourceSlides[2]).toMatchObject({type: 'context'});
    for (const slide of workshop4SourceSlides.slice(0, 14)) {
      expect(String(slide.notes ?? '').trim(), String(slide.title)).not.toBe('');
      expect(String(slide.kicker ?? '').trim(), String(slide.title)).not.toBe('');
    }
  });

  it('gives each concept-recap slide a committed English visual and an n8n | Agent SDK compare', () => {
    workshop4SourceSlides.slice(5, 14).forEach((slide, index) => {
      const title = String(slide.title);
      const visual = visualOf(slide);
      expect(visual.opener, title).toBe('showcase');
      expect(visual.image, title).toBe(`workshop-4/${conceptRecapImages[index]}`);
      expect(visual.bot, title).toBeUndefined();
      const file = new URL(`../public/workshop-4/${conceptRecapImages[index]}`, import.meta.url);
      expect(existsSync(file), title).toBe(true);
      expect(readFileSync(file).subarray(1, 4).toString('latin1'), title).toBe('PNG');
      expect(slide.layout, title).toBe('compare');
      const columns = slide.columns as ReadonlyArray<{title: string; items: ReadonlyArray<string>}>;
      expect(columns.map((column) => column.title), title).toEqual(['n8n · Workshop 3', 'Claude Agent SDK · Workshop 4']);
      for (const column of columns) expect(column.items.length, title).toBeGreaterThan(0);
      expect(String(slide.subtitle ?? ''), title).toMatch(/[.!?]$/);
    });
  });

  it('links the workshop package on the agenda and SOLO 0 slides', () => {
    const pkg = 'https://github.com/RyanLisse/aetherlink-academy-app/tree/main/training-lab/w4-support-agent-sdk';
    expect(workshop4SourceSlides[0]?.subtitle).toMatch(/10:00–16:00/);
    expect(workshop4SourceSlides[2]?.keyPoints).toContain(`Workshop package: ${pkg}`);
    expect(workshop4SourceSlides[2]?.keyPoints).toContain('Bonus n8n bridge: https://github.com/RyanLisse/aetherlink-day5-n8n-to-agent');
    const cards = workshop4SourceSlides[14]?.cards as ReadonlyArray<{title: string; body: string}>;
    const packageCard = cards.find((card) => card.title === 'Workshop package');
    expect(packageCard?.body).toContain(pkg);
    expect(packageCard?.body).toContain('git clone --depth 1 --filter=blob:none --sparse https://github.com/RyanLisse/aetherlink-academy-app.git w4-support');
    expect(packageCard?.body).toContain('git sparse-checkout set training-lab/w4-support-agent-sdk');
  });

  it('keeps the intro and concept-recap slides in English', () => {
    const blob = JSON.stringify(workshop4SourceSlides.slice(0, 14));
    expect(blob).not.toMatch(/\b(?:Welkom|Vandaag|gisteren|Werkvorm|één|beeld|Vaste|dynamische|Systeemprompt|externe|goedkeuring|oefening|niet)\b/);
  });

  it('teaches the Agent SDK package, mapping, and four questions', () => {
    const blob = JSON.stringify(workshop4SourceSlides);
    expect(blob).toMatch(/training-lab\/w4-support-agent-sdk/);
    expect(blob).toMatch(/settingSources/);
    expect(blob).toMatch(/ticket-analyst/);
    expect(blob).toMatch(/email-responder/);
    expect(blob).toMatch(/get_transaction/);
    expect(blob).toMatch(/stdio/);

    const notes = workshop4SourceSlides.map((slide) => String(slide.notes ?? '')).join('\n');
    for (const question of [
      'What does the main agent know?',
      'What belongs to a subagent?',
      'When is a tool needed?',
      'What information came from external data?',
    ]) {
      expect(notes).toContain(question);
    }
  });

  it('gives every practice slide a timer, checklist, expected outcome, and point pose', () => {
    expect(practice).toHaveLength(5);
    expect(practice.map((slide) => String(slide.kicker))).toEqual([
      'SOLO 0 · Your turn',
      'SOLO 1 · Your turn',
      'SOLO 2 · Your turn',
      'SOLO 3 · Your turn',
      'SOLO 4 · Your turn · Proof',
    ]);

    for (const slide of practice) {
      expect(slide.layout, String(slide.title)).toBe('exercise');
      expect(typeof slide.timer, String(slide.title)).toBe('number');
      expect(Array.isArray(slide.steps) && slide.steps.length, String(slide.title)).toBeGreaterThanOrEqual(3);
      expect(String(slide.expected ?? '').trim(), String(slide.title)).not.toBe('');
      expect(String(slide.notes ?? '').trim(), String(slide.title)).not.toBe('');
      expect(Array.isArray(slide.keyPoints) && slide.keyPoints.length, String(slide.title)).toBeGreaterThanOrEqual(3);
      expect(slide.visual).toMatchObject({bot: 'point', place: 'beside'});
    }
  });

  it('gives each concept and context slide notes, cards, and key points', () => {
    const concepts = lessonSlides.filter((slide) => slide.type === 'concept' || slide.type === 'context');
    expect(concepts.length).toBeGreaterThan(0);

    for (const slide of concepts) {
      expect(String(slide.subtitle ?? '').trim(), String(slide.title)).not.toBe('');
      expect(String(slide.notes ?? '').trim(), String(slide.title)).not.toBe('');
      expect(Array.isArray(slide.keyPoints) && slide.keyPoints.length, String(slide.title)).toBeGreaterThanOrEqual(3);
      expect(Array.isArray(slide.keyPoints) && slide.keyPoints.length, String(slide.title)).toBeLessThanOrEqual(5);
      expect(Array.isArray(slide.cards) && slide.cards.length, String(slide.title)).toBeGreaterThanOrEqual(2);
    }
  });

  it('keeps Workshop 3 labels and human review without leaking a support answer key', () => {
    const blob = JSON.stringify(workshop4SourceSlides);
    expect(blob).toMatch(/LOW, MEDIUM, and HIGH|LOW.*MEDIUM.*HIGH/);
    expect(blob).toMatch(/human review/i);
    expect(blob).not.toMatch(/\bEve\b/);
    expect(blob).not.toMatch(/aetherlink-daily-brief-lab-s1|intent\.md|progress\.md|step-1-plan|docs\/gate\.md/);
    expect(blob).not.toMatch(/Plan → Design → Build|one lesson per SDLC/i);
    expect(blob).not.toMatch(/MSG-\d{2}\W{1,3}(?:low|medium|high)\b/i);
    expect(blob).not.toMatch(/\b(?:low|medium|high)\W{1,3}MSG-\d{2}/i);
  });

  it('uses the classroom contract and keeps the bridge and companion routes', () => {
    expectWorkshopClassroomContract(lessonSlides);
    expect(workshop4SourceSlides.at(-1)?.kicker).toMatch(/Workshop 5/);
    expect(isWorkshop4Path('/workshop/4')).toBe(true);
    expect(isWorkshop4Path('/lesson/workshop-4')).toBe(true);
    expect(isWorkshop4Path('/workshop/3')).toBe(false);
    expect(isWorkshop4Path('/workshop/5')).toBe(false);
    expect(isWorkshop3Path('/workshop/4')).toBe(false);
    expect(isWorkshop5Path('/workshop/4')).toBe(false);
    expect(W4_SOLO_COMPANIONS.map((companion) => companion.href)).toEqual([
      '/courses/weather-agent-sdk/index.html',
      '/courses/aetherlink-day5-n8n-to-agent/index.html',
      '/courses/council-agent-sdk/index.html',
    ]);
    expect(W4_SOLO_COMPANIONS[1]?.label).toMatch(/optional parity bonus/i);
    expect(sourceSlides).toHaveLength(113);
    expect(workshop3SourceSlides).toHaveLength(18);
    expect(workshop3SourceSlides.every((slide) => slide.lessonId === 'workshop-3')).toBe(true);
    expect(workshop5SourceSlides).toHaveLength(49);
    expect(workshop5SourceSlides.every((slide) => slide.lessonId === 'workshop-5')).toBe(true);
  });
});
