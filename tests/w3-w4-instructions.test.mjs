import assert from 'node:assert/strict';
import test from 'node:test';
import {projectPackLocale} from '../content/days/locale.mjs';
import day3 from '../content/days/day-3-workshop-n8n.mjs';
import day4 from '../content/days/day-4-workshop-agent-sdk.mjs';

for (const [day, pack] of [[3, day3], [4, day4]]) {
  test(`day ${day} solo instructions are complete in English and Dutch`, () => {
    const en = projectPackLocale(pack, 'en').steps;
    const nl = projectPackLocale(pack, 'nl').steps;
    assert.deepEqual(en.map((step) => step.id), nl.map((step) => step.id));

    for (const step of en) {
      const translated = nl.find((candidate) => candidate.id === step.id);
      assert.ok(translated, `day ${day} ${step.id} has a Dutch step`);
      assert.ok(Array.isArray(step.instructions), `day ${day} ${step.id} has English instructions`);
      assert.ok(Array.isArray(translated.instructions), `day ${day} ${step.id} has Dutch instructions`);

      const enInstructions = step.instructions.filter((line) => typeof line === 'string' && line.trim());
      const nlInstructions = translated.instructions.filter((line) => typeof line === 'string' && line.trim());
      assert.ok(enInstructions.length >= 3, `day ${day} ${step.id} has at least three English instructions`);
      assert.ok(nlInstructions.length >= 3, `day ${day} ${step.id} has at least three Dutch instructions`);
      assert.equal(enInstructions.length, nlInstructions.length, `day ${day} ${step.id} has matching instruction counts`);
      assert.equal(enInstructions.length, step.instructions.length, `day ${day} ${step.id} has no empty English instructions`);
      assert.equal(nlInstructions.length, translated.instructions.length, `day ${day} ${step.id} has no empty Dutch instructions`);
    }
  });
}

test('day 4 English instructions include the Agent SDK package and lesson commands', () => {
  const instructions = projectPackLocale(day4, 'en').steps
    .flatMap((step) => step.instructions)
    .join('\n');

  for (const literal of [
    'git clone https://github.com/RyanLisse/aetherlink-day5-n8n-to-agent.git',
    'cd aetherlink-day5-n8n-to-agent',
    'npm ci',
    'npm run doctor',
    'npm run verify',
    'npm run smoke:mcp',
    'npm run check',
    'npm run lesson1 -- MSG-01 --dry-run',
    'npm run lesson2 -- MSG-05 --dry-run',
    'npm run lesson3 -- MSG-08 --dry-run',
    'npm run chat -- --dry-run',
    '(cd 03-mcp/transaction-mcp && npm ci)',
    'git switch step-4',
    '05-build-your-own/README.md',
    'cd 05-build-your-own',
    'node agent.mjs --dry-run',
    'claude -p "Find and fix the bug in utils.js. Explain the change." --allowedTools Read,Edit,Glob --permission-mode acceptEdits',
  ]) {
    assert.ok(instructions.includes(literal), `day 4 instructions include ${literal}`);
  }
  assert.ok(!instructions.includes('ANTHROPIC_API_KEY'), 'Claude Code is the default and an API key is optional');
  assert.ok(instructions.includes('(cd 03-mcp/transaction-mcp && npm ci)'), 'install the nested MCP server dependencies');
});

test('day 4 assignment starts with Core and marks Step 5 as homework in both locales', () => {
  const en = projectPackLocale(day4, 'en');
  const nl = projectPackLocale(day4, 'nl');
  const enAssignment = day4.copy.en.narrative.join('\n');
  const nlAssignment = day4.copy.nl.narrative.join('\n');

  assert.match(enAssignment, /Core Parts 1–2/);
  assert.match(enAssignment, /about 35 minutes/);
  assert.match(enAssignment, /Stretch Parts 3–4/);
  assert.match(enAssignment, /starter files on Step 4/);
  assert.match(enAssignment, /Step 5 as homework/);
  assert.match(nlAssignment, /Core, Parts 1–2/);
  assert.match(nlAssignment, /ongeveer 35 minuten/);
  assert.match(nlAssignment, /Stretch, Parts 3–4/);
  assert.match(nlAssignment, /starters op Step 4/);
  assert.match(nlAssignment, /Step 5 als huiswerk/);

  for (const pack of [en, nl]) {
    const homework = pack.steps.find((step) => step.id === 'w4-solo5');
    assert.equal(homework.level, 'stretch');
  }
});

test('day 3 English instructions name the L1 starter and credential placeholder', () => {
  const instructions = projectPackLocale(day3, 'en').steps
    .flatMap((step) => step.instructions)
    .join('\n');

  assert.ok(instructions.includes('n8n-triage-l1-switch.json'));
  assert.ok(instructions.includes('REPLACE_ME'));
});
