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
  'Welcome to Workshop 4 · Support agents with Claude Code and the Agent SDK',
  'Yesterday’s recap · Maarten’s n8n build',
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
  'Structured output: parser to JSON schema',
  'Memory is the session',
  'Two ways to run the same agent',
  'Demo · Step 0: the offline path',
  'Get the workshop package.',
  'Step 1 · Structured priority output and chat memory',
  'Demo · Step 1: schema, route, and memory',
  'Run Step 1 and test chat memory.',
  'Discuss: what makes the route predictable?',
  'Step 2 · Risk analysis and customer reply agents',
  'Demo · Step 2: trace the two agents',
  'Run the orchestrator and inspect the draft.',
  'Discuss: which facts came from a tool?',
  'Step 3 · Read-only customer and transaction MCP tools',
  'Demo · Step 3: read-only customer and transaction lookups',
  'Run Step 3 customer and transaction lookups.',
  'Discuss: tools and external data.',
  'Step 4 · Acceptance table and npm run check',
  'Step 5 · Build your own agent',
  'Demo · Step 5: run the starter',
  'Your turn · build your own agent',
  'Close: keep a human in the loop.',
];

const addedTitles = new Set([...introTitles, ...conceptRecapTitles]);
const visualOf = (slide: Record<string, unknown> | undefined): Record<string, unknown> =>
  slide?.visual && typeof slide.visual === 'object' ? slide.visual as Record<string, unknown> : {};

describe('Workshop 4 Agent SDK classroom deck', () => {
  const slides = normalizeSlides(workshop4SourceSlides);
  const practice = workshop4SourceSlides.filter((slide) => slide.type === 'practice');
  /** The 24 lesson slides; the 3 intro and 9 visual concept-recap slides have their own checks. */
  const lessonSlides = workshop4SourceSlides.filter((slide) => !addedTitles.has(String(slide.title)));

  it('has the requested 36-slide sequence', () => {
    expect(workshop4SourceSlides).toHaveLength(36);
    expect(slides).toHaveLength(36);
    expect(lessonSlides).toHaveLength(24);
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
    expect(workshop4SourceSlides.slice(14, 18).map((slide) => String(slide.title))).toEqual([
      'Structured output: parser to JSON schema',
      'Memory is the session',
      'Two ways to run the same agent',
      'Demo · Step 0: the offline path',
    ]);
    expect(workshop4SourceSlides[18]?.title).toBe('Get the workshop package.');
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

  it('links the workshop repo on the agenda and SOLO 0 slides', () => {
    const repo = 'https://github.com/RyanLisse/aetherlink-day5-n8n-to-agent';
    expect(workshop4SourceSlides[0]?.subtitle).toMatch(/10:00–16:00/);
    expect(workshop4SourceSlides[2]?.keyPoints).toContain(`Workshop repo: ${repo}`);
    const cards = workshop4SourceSlides[18]?.cards as ReadonlyArray<{title: string; body: string}>;
    const repoCard = cards.find((card) => card.title === 'Workshop repo');
    expect(repoCard?.body).toContain(`git clone ${repo}.git`);
    expect(repoCard?.body).toContain('npm run lesson1 -- MSG-01 --dry-run');
    expect(JSON.stringify(workshop4SourceSlides[18])).not.toMatch(/sparse/);
  });

  it('separates offline inspection from live or labelled sample results', () => {
    const step1Demo = workshop4SourceSlides.find((slide) => slide.title === 'Demo · Step 1: schema, route, and memory');
    const step1Practice = workshop4SourceSlides.find((slide) => slide.type === 'practice' && slide.kicker?.startsWith('SOLO 1'));
    const step2Demo = workshop4SourceSlides.find((slide) => slide.title === 'Demo · Step 2: trace the two agents');
    const step2Practice = workshop4SourceSlides.find((slide) => slide.type === 'practice' && slide.kicker?.startsWith('SOLO 2'));
    expect(step1Practice).toBeDefined();
    expect(step2Practice).toBeDefined();
    const step1Text = JSON.stringify([step1Demo, step1Practice]);
    const step2Text = JSON.stringify([step2Demo, step2Practice]);

    expect(step1Text).toContain('01-single-agent/priority-schema.mjs');
    expect(step1Text).toContain('outputFormat');
    expect(step1Text).toContain('lib/switch.mjs');
    expect(step1Text).toContain('docs/sample-trace.md');
    expect(step1Text).toContain('does not produce');
    expect(step1Text).toContain('live run (Claude Code login, or --backend sdk with a key)');
    expect(step2Text).toContain('docs/sample-trace.md');
    expect(step2Text).toContain('MSG-10');
    expect(step2Text).toContain('live run (Claude Code login, or --backend sdk with a key)');
    expect(step2Text).not.toMatch(/MSG-10 --dry-run/);
  });

  it('keeps Step 3 read-only and reserves human review for reply drafts', () => {
    const step3Text = JSON.stringify(workshop4SourceSlides.slice(27, 31));

    expect(step3Text).toContain('mcp__customers__get_customer');
    expect(step3Text).toContain('mcp__transactions__get_transaction');
    expect(step3Text).toContain('list_transactions');
    expect(step3Text).toMatch(/human review/i);
    expect(step3Text).not.toMatch(/clerk|approval gate|Staff instruction|add_transaction|update_transaction|delete_transaction/i);
  });

  it('explains backend selection on slides 17–19', () => {
    const backendText = JSON.stringify(workshop4SourceSlides.slice(16, 19));

    expect(backendText).toContain('ANTHROPIC_API_KEY is set in your shell');
    expect(backendText).toContain('the runner picks sdk');
    expect(backendText).toContain('force one with --backend');
  });

  it('keeps the intro and concept-recap slides in English', () => {
    const blob = JSON.stringify(workshop4SourceSlides.slice(0, 14));
    expect(blob).not.toMatch(/\b(?:Welkom|Vandaag|gisteren|Werkvorm|één|beeld|Vaste|dynamische|Systeemprompt|externe|goedkeuring|oefening|niet)\b/);
  });

  it('teaches the Agent SDK package, mapping, and four questions', () => {
    const blob = JSON.stringify(workshop4SourceSlides);
    expect(blob).toMatch(/aetherlink-day5-n8n-to-agent/);
    expect(blob).toMatch(/settingSources/);
    expect(blob).toMatch(/outputFormat: json_schema/);
    expect(blob).toMatch(/Simple Memory.*session resume|session resume.*Simple Memory/);
    expect(blob).toMatch(/claude-code/);
    expect(blob).toMatch(/--max-turns/);
    expect(blob).toMatch(/--agents/);
    expect(blob).toMatch(/--mcp-config/);
    expect(blob).toMatch(/--json-schema/);
    expect(blob).toMatch(/--resume/);
    expect(blob).toMatch(/canUseTool is SDK-only/);
    expect(blob).toMatch(/risk-agent/);
    expect(blob).toMatch(/customer-reply-agent/);
    expect(blob).toMatch(/customer-context-agent/);
    expect(blob).not.toMatch(/ticket-analyst|email-responder/);
    expect(blob).toMatch(/mcp__customers__get_customer/);
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

  it('keeps the offline setup, acceptance table, and Step 5 commands in the lesson', () => {
    const blob = JSON.stringify(workshop4SourceSlides);
    const step0Demo = workshop4SourceSlides.find((slide) => slide.title === 'Demo · Step 0: the offline path');
    expect(JSON.stringify(step0Demo)).toMatch(/docs\/SETUP\.md/);
    expect(JSON.stringify(step0Demo)).toMatch(/npm ci/);
    expect(JSON.stringify(step0Demo)).toMatch(/npm run doctor/);
    expect(JSON.stringify(step0Demo)).toMatch(/npm run verify/);
    expect(JSON.stringify(step0Demo)).toMatch(/--dry-run/);
    expect(JSON.stringify(step0Demo)).toMatch(/backend:/);
    expect(JSON.stringify(step0Demo)).toMatch(/Claude Code equivalent:/);
    expect(blob).toMatch(/docs\/SETUP\.md/);
    expect(blob).toMatch(/npm run doctor/);
    expect(blob).toMatch(/npm run verify/);
    expect(blob).toMatch(/backend:/);
    expect(blob).toMatch(/Claude Code equivalent:/);
    expect(blob).toMatch(/acceptance table/i);
    expect(blob).toMatch(/npm run check/);
    expect(blob).toMatch(/participant-output\//);
    expect(blob).toMatch(/05-build-your-own/);
    expect(blob).toMatch(/Find and fix the bug in utils\.js/);
    expect(blob).toMatch(/Workshop 5/);
    expect(blob).not.toMatch(/\bProof\b/);
  });

  it('gives every practice slide a timer, checklist, expected outcome, and point pose', () => {
    expect(practice).toHaveLength(6);
    expect(practice.map((slide) => String(slide.kicker))).toEqual([
      'SOLO 0 · Your turn',
      'SOLO 1 · Your turn',
      'SOLO 2 · Your turn',
      'SOLO 3 · Your turn',
      'SOLO 4 · Your turn',
      'SOLO 5 · Your turn',
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
    expect(blob).not.toMatch(/aetherlink-daily-brief-lab-s1|progress\.md|step-1-plan|docs\/gate\.md/);
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
