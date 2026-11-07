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

test('day 4 prompts build the starter, specialists and read-only MCP in both languages', () => {
  for (const locale of ['en', 'nl']) {
    const steps = projectPackLocale(day4, locale).steps;
    for (const step of steps) {
      assert.equal(step.prompts.length, 2, `${locale} ${step.id} has a build and follow-up prompt`);
      assert.ok(step.prompts.every((prompt) => prompt.trim().length > 40));
      assert.ok(step.watchFor.trim(), `${locale} ${step.id} explains observable evidence`);
    }
    const prompts = steps.flatMap((step) => step.prompts).join('\n');
    for (const literal of [
      'https://github.com/AetherLink-bv/aetherlink-day4-n8n-to-agent.git',
      'SOLO.md',
      'priority-schema.mjs',
      'risk-agent',
      'customer-reply-agent',
      'get_transaction',
      'get_customer',
      'participant-output/acceptance-table.md',
    ]) assert.ok(prompts.includes(literal), `${locale} prompts include ${literal}`);
    const instructions = steps.flatMap((step) => step.instructions).join('\n');
    assert.ok(!instructions.includes('git sparse-checkout'), 'the assignment uses the same starter as the deck');
    assert.ok(!instructions.includes('npm run clerk'), 'the required MCP exercise never changes records');
    assert.ok(!instructions.includes('git restore'), 'restoring the comparison must preserve participant changes');
  }
});

test('day 3 English instructions name the L1 starter and credential placeholder', () => {
  const instructions = projectPackLocale(day3, 'en').steps
    .flatMap((step) => step.instructions)
    .join('\n');

  assert.ok(instructions.includes('n8n-triage-l1-switch.json'));
  assert.ok(instructions.includes('REPLACE_ME'));
});

 test('day 4 begins with read-only n8n JSON and a bounded rebuild storyline', () => {
  for (const locale of ['en', 'nl']) {
    const steps = projectPackLocale(day4, locale).steps;
    const source = steps[0].prompts.join('\n');
    for (const literal of ['n8n MCP', 'reference/n8n-support-triage.json', '/workshop-4/n8n-support-triage.json', 'connections', 'systemMessages', 'SOLO.md', 'OPEN']) {
      assert.ok(source.includes(literal), `${locale} starts with ${literal}`);
    }
    const instructions = JSON.stringify(steps);
    assert.doesNotMatch(instructions, /git checkout|step-[1-4]|reference branch|referentiebranch/);
    assert.match(steps[2].prompts[0], /reference\/n8n-support-triage.json/);
    assert.match(steps[3].prompts[0], /extension|uitbreiding/);
  }
});

test('day 4 builds from JSON before authoring the SOLO storyline', () => {
  const en = projectPackLocale(day4, 'en').steps[0];
  const nl = projectPackLocale(day4, 'nl').steps[0];
  assert.match(en.prompts[0], /rebuild the matching support app/);
  assert.match(en.prompts[0], /actual diff.*real run/);
  assert.match(en.prompts[1], /^After inspecting the actual app diff and run, list every step/);
  assert.match(nl.prompts[0], /herbouw daarna de gelijkwaardige supportapp/);
  assert.match(nl.prompts[1], /^Bekijk eerst de echte appdiff en run/);
  assert.doesNotMatch(en.prompts[0], /Stop for my review before editing/);
});

test('day 4 reserves the full rebuild for trainer preparation before the ten-minute participant inspection', () => {
  for (const locale of ['en', 'nl']) {
    const step = projectPackLocale(day4, locale).steps[0];
    assert.equal(step.timerMinutes, 10);
    assert.match(step.prompts.join(' '), /trainer preparation|trainervoorbereiding/);
    assert.match(step.instructions.join(' '), /own fictional case|eigen fictieve case/);
    assert.doesNotMatch(step.instructions.join(' '), /Build the mapped|Bouw de vertaalde/);
  }
});
