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

test('day 4 English instructions include the required repository commands', () => {
  const instructions = projectPackLocale(day4, 'en').steps
    .flatMap((step) => step.instructions)
    .join('\n');

  for (const literal of [
    'git clone https://github.com/RyanLisse/aetherlink-day5-n8n-to-agent.git',
    'npm install',
    'npm run triage -- fixtures/ticket.json --dry-run',
    'npm run verify',
  ]) {
    assert.ok(instructions.includes(literal), `day 4 instructions include ${literal}`);
  }
});

test('day 3 English instructions name the L1 starter and credential placeholder', () => {
  const instructions = projectPackLocale(day3, 'en').steps
    .flatMap((step) => step.instructions)
    .join('\n');

  assert.ok(instructions.includes('n8n-triage-l1-switch.json'));
  assert.ok(instructions.includes('REPLACE_ME'));
});
