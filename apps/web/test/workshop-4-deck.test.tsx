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
  'Welcome to Workshop 4 · From n8n to Claude Agents SDK',
  'Yesterday’s recap · Maarten’s n8n build',
  'Today · agenda',
  'Goal of today',
];

const conceptRecapImages: Record<string, string> = {
  'n8n ↔ Agent SDK at a glance': '00-overview.png',
  'Agent and agent loop': '01-agent-loop.png',
  'System prompt': '02-systeemprompt.png',
  Tools: '03-tools.png',
  Subagents: '06-subagents.png',
  'MCP: external data': '04-mcp.png',
  'Control: hooks and approval': '05-hooks.png',
  'Fixed workflow vs. dynamic agent': '08-workflows-vs-dynamisch.png',
  Skills: '07-skills.png',
};

const conceptRecapTitles = Object.keys(conceptRecapImages);
const bridgeTitles = [
  "Yesterday's n8n. Today's Agent SDK.",
  'Why move the flow to code?',
];
const outputVisualImages: Record<string, string> = {
  'What good looks like (1/2): offline checks': '10-good-offline.png',
  'What good looks like (2/2): live runs': '11-good-live.png',
};
const outputVisualTitles = Object.keys(outputVisualImages);
const onePointConceptTitles = new Set([
  'Two ways to run the same agent',
  'Step 1 · Structured priority output and chat memory',
  'Demo · Step 1: schema, route, and memory',
  'Demo · Step 2: trace the two agents',
  'Step 3 · Read-only customer and transaction MCP tools',
  'Step 5 · Build your own agent',
]);
const practiceKeyPointCounts: Record<string, number> = {
  'Get the workshop package.': 3,
  'Run Step 1 and test chat memory.': 1,
  'Run the orchestrator and inspect the draft.': 1,
  'Run Step 3 customer and transaction lookups.': 3,
  'Step 4 · Acceptance table and npm run check': 1,
  'Extend the MCP: tools, agent, hooks.': 3,
  'Your turn · build your own agent': 3,
};

const titles = [
  ...introTitles,
  "Yesterday's n8n. Today's Agent SDK.",
  'Why move the flow to code?',
  'n8n ↔ Agent SDK at a glance',
  'Agent and agent loop',
  'System prompt',
  'Two ways to run the same agent',
  'Demo · Step 0: the offline path',
  'Get the workshop package.',
  'Short break',
  'Structured output: parser to JSON schema',
  'Memory is the session',
  'Step 1 · Structured priority output and chat memory',
  'Demo · Step 1: schema, route, and memory',
  'Run Step 1 and test chat memory.',
  'Discuss: what makes the route predictable?',
  'Lunch',
  'Tools',
  'Subagents',
  'Step 2 · Risk analysis and customer reply agents',
  'Demo · Step 2: trace the two agents',
  'Run the orchestrator and inspect the draft.',
  'Discuss: which facts came from a tool?',
  'MCP: external data',
  'Step 3 · Read-only customer and transaction MCP tools',
  'Demo · Step 3: read-only customer and transaction lookups',
  'Run Step 3 customer and transaction lookups.',
  'Discuss: tools and external data.',
  'Step 4 · Acceptance table and npm run check',
  'Short break',
  'Control: hooks and approval',
  'Fixed workflow vs. dynamic agent',
  'Assignment · Extend the MCP',
  'Not every agent has every tool',
  'Quiz: who may change a transaction?',
  'When does the hook ask?',
  'Where you change what, and why (1/2)',
  'Where you change what, and why (2/2)',
  'Demo · Assignment: one write, three outcomes',
  'What good looks like (1/2): offline checks',
  'What good looks like (2/2): live runs',
  'Extend the MCP: tools, agent, hooks.',
  'Discuss: who can change data, and when?',
  'Skills',
  'Step 5 · Build your own agent',
  'Demo · Step 5: run the starter',
  'Your turn · build your own agent',
  'Close: keep a human in the loop.',
];

const coreIntroTitles = introTitles.filter((title) => title !== 'Goal of today' && !title.startsWith('Quiz:'));
const addedTitles = new Set([...introTitles, ...bridgeTitles, ...conceptRecapTitles]);
const rhythmTypes = new Set(['quiz', 'pause']);
const isRhythm = (slide: Record<string, unknown>): boolean => rhythmTypes.has(String(slide.type)) || slide.title === 'Goal of today';
const visualOf = (slide: Record<string, unknown> | undefined): Record<string, unknown> =>
  slide?.visual && typeof slide.visual === 'object' ? slide.visual as Record<string, unknown> : {};

describe('Workshop 4 Agent SDK classroom deck', () => {
  const slides = normalizeSlides(workshop4SourceSlides);
  const practice = workshop4SourceSlides.filter((slide) => slide.type === 'practice');
  /** The 32 lesson slides; the opening, bridge, and concept recap slides have dedicated checks. */
  const coreSlides = workshop4SourceSlides.filter((slide) => !isRhythm(slide));
  const lessonSlides = coreSlides.filter((slide) => !addedTitles.has(String(slide.title)));

  it('keeps the day rhythm: one transaction quiz, a goal, two short breaks, and lunch', () => {
    const pauses = workshop4SourceSlides.filter((slide) => slide.type === 'pause');
    expect(pauses.map((slide) => visualOf(slide).countdown)).toEqual([15, 60, 15]);
    expect(pauses.map((slide) => (slide.cards as Array<{title: string}>)[0]?.title)).toEqual(['Back at 11:15', 'Back at 13:00', 'Back at 15:00']);
    expect(workshop4SourceSlides.filter((slide) => slide.type === 'quiz').map((slide) => slide.title)).toEqual([
      'Quiz: who may change a transaction?',
    ]);
  });

  it('has the requested 51-slide sequence', () => {
    expect(workshop4SourceSlides).toHaveLength(51);
    expect(slides).toHaveLength(51);
    expect(lessonSlides).toHaveLength(32);
    expect(workshop4SourceSlides.every((slide) => slide.lessonId === 'workshop-4')).toBe(true);
    expect(workshop4SourceSlides.map((slide) => String(slide.title))).toEqual(titles);
  });

  it('opens with three intro slides, the goal, and the bridge into the lesson', () => {
    expect(workshop4SourceSlides.slice(0, 6).map((slide) => String(slide.title))).toEqual([
      'Welcome to Workshop 4 · From n8n to Claude Agents SDK',
      'Yesterday’s recap · Maarten’s n8n build',
      'Today · agenda',
      'Goal of today',
      "Yesterday's n8n. Today's Agent SDK.",
      'Why move the flow to code?',
    ]);
    expect(coreSlides.slice(0, 3).map((slide) => String(slide.title))).toEqual(coreIntroTitles);
    expect(coreSlides.slice(3, 5).map((slide) => String(slide.title))).toEqual([
      "Yesterday's n8n. Today's Agent SDK.",
      'Why move the flow to code?',
    ]);
    expect(coreSlides[3]?.keyPoints).toHaveLength(3);
    expect(coreSlides[3]?.cards).toHaveLength(2);
    expect(coreSlides[4]?.keyPoints).toEqual([
      'n8n showed the flow. Code lets you test it, limit it and control it.',
    ]);
    expect(coreSlides[4]?.cards).toHaveLength(4);
    expect(coreSlides.slice(5, 8).map((slide) => String(slide.title))).toEqual([
      'n8n ↔ Agent SDK at a glance',
      'Agent and agent loop',
      'System prompt',
    ]);
    expect(coreSlides.slice(8, 11).map((slide) => String(slide.title))).toEqual([
      'Two ways to run the same agent',
      'Demo · Step 0: the offline path',
      'Get the workshop package.',
    ]);
    expect(coreSlides[1]).toMatchObject({type: 'recap', layout: 'recap'});
    expect(coreSlides[2]).toMatchObject({type: 'context'});
    for (const slide of coreSlides.slice(0, 11)) {
      expect(String(slide.notes ?? '').trim(), String(slide.title)).not.toBe('');
      expect(String(slide.kicker ?? '').trim(), String(slide.title)).not.toBe('');
    }
  });

  it('keeps each concept visual beside the lesson that uses it', () => {
    const imageSlides = workshop4SourceSlides.filter((slide) => conceptRecapTitles.includes(String(slide.title)));
    expect(imageSlides.map((slide) => String(slide.title))).toEqual(conceptRecapTitles);

    imageSlides.forEach((slide) => {
      const title = String(slide.title);
      const visual = visualOf(slide);
      expect(visual.opener, title).toBe('showcase');
      expect(visual.image, title).toBe(`workshop-4/${conceptRecapImages[title]}`);
      expect(visual.bot, title).toBeUndefined();
      const file = new URL(`../public/workshop-4/${conceptRecapImages[title]}`, import.meta.url);
      expect(existsSync(file), title).toBe(true);
      expect(readFileSync(file).subarray(1, 4).toString('latin1'), title).toBe('PNG');
      expect(slide.layout, title).toBe('compare');
      const columns = slide.columns as ReadonlyArray<{title: string; items: ReadonlyArray<string>}>;
      expect(columns.map((column) => column.title), title).toEqual(['n8n · Workshop 3', 'Claude Agent SDK · Workshop 4']);
      for (const column of columns) expect(column.items.length, title).toBeGreaterThan(0);
      expect(String(slide.subtitle ?? ''), title).toMatch(/[.!?]$/);
    });
  });

  it('keeps both assignment output visuals and their image assets', () => {
    const outputSlides = workshop4SourceSlides.filter((slide) => outputVisualTitles.includes(String(slide.title)));
    expect(outputSlides.map((slide) => String(slide.title))).toEqual(outputVisualTitles);

    outputSlides.forEach((slide) => {
      const title = String(slide.title);
      const visual = visualOf(slide);
      expect(visual.opener, title).toBe('showcase');
      expect(visual.image, title).toBe(`workshop-4/${outputVisualImages[title]}`);
      const file = new URL(`../public/workshop-4/${outputVisualImages[title]}`, import.meta.url);
      expect(existsSync(file), title).toBe(true);
      expect(readFileSync(file).subarray(1, 4).toString('latin1'), title).toBe('PNG');
    });
  });

  it('links the workshop repo on the agenda and SOLO 0 slides', () => {
    const repo = 'https://github.com/RyanLisse/aetherlink-day5-n8n-to-agent';
    expect(workshop4SourceSlides[0]?.subtitle).toMatch(/10:00–16:00/);
    expect(coreSlides[2]?.keyPoints).toContain(`Workshop repo: ${repo}`);
    const packageSlide = workshop4SourceSlides.find((slide) => slide.title === 'Get the workshop package.');
    const cards = packageSlide?.cards as ReadonlyArray<{title: string; body: string}>;
    const repoCard = cards.find((card) => card.title === 'Workshop repo');
    expect(repoCard?.body).toContain(`git clone ${repo}.git`);
    expect(repoCard?.body).toContain('npm run lesson1 -- MSG-01 --dry-run');
    expect(JSON.stringify(coreSlides[18])).not.toMatch(/sparse/);
  });

  it('separates offline inspection from live or labelled sample results', () => {
    const step1Demo = workshop4SourceSlides.find((slide) => slide.title === 'Demo · Step 1: schema, route, and memory');
    const step1Practice = workshop4SourceSlides.find((slide) => slide.type === 'practice' && String(slide.kicker ?? '').startsWith('SOLO 1'));
    const step2Demo = workshop4SourceSlides.find((slide) => slide.title === 'Demo · Step 2: trace the two agents');
    const step2Practice = workshop4SourceSlides.find((slide) => slide.type === 'practice' && String(slide.kicker ?? '').startsWith('SOLO 2'));
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
    const step3Titles = new Set([
      'Step 3 · Read-only customer and transaction MCP tools',
      'Demo · Step 3: read-only customer and transaction lookups',
      'Run Step 3 customer and transaction lookups.',
      'Discuss: tools and external data.',
    ]);
    const step3Text = JSON.stringify(workshop4SourceSlides.filter((slide) => step3Titles.has(String(slide.title))));

    expect(step3Text).toContain('mcp__customers__get_customer');
    expect(step3Text).toContain('mcp__transactions__get_transaction');
    expect(step3Text).toContain('list_transactions');
    expect(step3Text).toMatch(/human review/i);
    expect(step3Text).not.toMatch(/clerk|approval gate|Staff instruction|add_transaction|update_transaction|delete_transaction/i);
  });

  it('explains backend selection in the Step 0 slides', () => {
    const backendTitles = new Set([
      'Two ways to run the same agent',
      'Demo · Step 0: the offline path',
      'Get the workshop package.',
    ]);
    const backendText = JSON.stringify(workshop4SourceSlides.filter((slide) => backendTitles.has(String(slide.title))));

    expect(backendText).toContain('ANTHROPIC_API_KEY is set in your shell');
    expect(backendText).toContain('the runner picks sdk');
    expect(backendText).toContain('force one with --backend');
    const sameFlow = workshop4SourceSlides.find((slide) => slide.title === 'Two ways to run the same agent');
    expect(sameFlow?.visual).toMatchObject({bot: 'think', place: 'beside'});
  });

  it('keeps the intro and concept-recap slides in English', () => {
    const blob = JSON.stringify(workshop4SourceSlides.filter((slide) => addedTitles.has(String(slide.title))));
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
    expect(blob).toMatch(/PreToolUse hook/);
    expect(blob).toMatch(/risk-agent/);
    expect(blob).toMatch(/customer-reply-agent/);
    expect(blob).toMatch(/customer-context-agent/);
    expect(blob).not.toMatch(/ticket-analyst|email-responder/);
    expect(blob).toMatch(/mcp__customers__get_customer/);
    expect(blob).toMatch(/get_transaction/);
    expect(blob).toMatch(/stdio/);

    const deckText = JSON.stringify(workshop4SourceSlides);
    for (const question of [
      'Which agent has which tool, and when a person must approve',
      'Which fields and values does the schema allow?',
      'Which part chooses the next action?',
      'What changes when the session is resumed?',
    ]) {
      expect(deckText).toContain(question);
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
    expect(practice).toHaveLength(7);
    expect(practice.map((slide) => String(slide.kicker))).toEqual([
      'SOLO 0 · Your turn',
      'SOLO 1 · Your turn',
      'SOLO 2 · Your turn',
      'SOLO 3 · Your turn',
      'SOLO 4 · Your turn',
      'SOLO 6 · Your turn',
      'SOLO 5 · Your turn',
    ]);

    for (const slide of practice) {
      const title = String(slide.title);
      const expectedKeyPointCount = practiceKeyPointCounts[title];
      expect(expectedKeyPointCount, title).toBeDefined();
      expect(slide.layout, title).toBe('exercise');
      expect(typeof slide.timer, title).toBe('number');
      expect(Array.isArray(slide.steps) && slide.steps.length, title).toBeGreaterThanOrEqual(3);
      expect(String(slide.expected ?? '').trim(), title).not.toBe('');
      expect(String(slide.notes ?? '').trim(), title).not.toBe('');
      expect(Array.isArray(slide.keyPoints), title).toBe(true);
      expect(slide.keyPoints, title).toHaveLength(expectedKeyPointCount ?? 0);
      expect(slide.visual).toMatchObject({bot: 'point', place: 'beside'});
    }
  });

  it('gives each concept and context slide notes, cards, and key points', () => {
    const concepts = lessonSlides.filter(
      (slide) => (slide.type === 'concept' || slide.type === 'context') && visualOf(slide).opener !== 'showcase',
    );
    expect(concepts.length).toBeGreaterThan(0);

    for (const slide of concepts) {
      const title = String(slide.title);
      expect(String(slide.subtitle ?? '').trim(), String(slide.title)).not.toBe('');
      expect(String(slide.notes ?? '').trim(), String(slide.title)).not.toBe('');
      expect(Array.isArray(slide.keyPoints), title).toBe(true);
      const keyPointCount = (slide.keyPoints as ReadonlyArray<string>).length;
      expect(keyPointCount, title).toBeGreaterThanOrEqual(onePointConceptTitles.has(title) ? 1 : 3);
      expect(Array.isArray(slide.keyPoints) && slide.keyPoints.length, String(slide.title)).toBeLessThanOrEqual(5);
      if (onePointConceptTitles.has(title)) expect(keyPointCount, title).toBe(1);
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
    const singlePointSlides = new Set(onePointConceptTitles);
    singlePointSlides.add('Demo · Assignment: one write, three outcomes');
    const contractSlides = [
      workshop4SourceSlides.find((slide) => slide.title === bridgeTitles[0])!,
      ...lessonSlides.filter((slide) => slide.type !== 'practice' && !singlePointSlides.has(String(slide.title))),
    ];
    expectWorkshopClassroomContract(contractSlides);
    const assignmentDemo = workshop4SourceSlides.find(
      (slide) => slide.title === 'Demo · Assignment: one write, three outcomes',
    );
    expect(assignmentDemo?.visual).toMatchObject({bot: 'point', place: 'beside'});
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
