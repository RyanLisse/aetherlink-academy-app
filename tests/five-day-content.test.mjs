import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { getDayPack, listDaySummaries, listRouteDays } from '../server/content.mjs';

test('all five day packs are concrete and uniquely identified', () => {
  const packs = [1, 2, 3, 4, 5].map(day => getDayPack(day));
  assert.equal(packs.length, 5);
  assert.equal(new Set(packs.map(pack => pack.mission.id)).size, 5);
  for (const pack of packs) {
    assert.ok(pack.lesson.title);
    assert.ok(pack.lesson.loop.length >= 4);
    if (pack.day > 1) {
      assert.ok(pack.source.length > 0);assert.equal(pack.sourceLink,'docs/LEARNING-ROUTE.md');
    }
    assert.ok(pack.mission.allowed.length >= 3);
    assert.ok(pack.reviewCriteria.length >= 3);
    assert.equal(pack.quiz.questions.length, pack.quiz.answers.length);
    assert.ok(pack.quiz.questions.every(question => question.source === 'authored-adaptation' || pack.day === 1));
  }
});

test('day two is the complete feedback loop and later days name their boundaries', () => {
  const day2 = getDayPack(2);
  assert.deepEqual(day2.lesson.loop.map(step => step.label), ['Intent', 'Plan', 'Wijziging', 'Test', 'Review', 'Handoff']);
  assert.equal(day2.mission.id, 'ATLAS-FEEDBACK-02');
  assert.match(day2.mission.stop, /Stop/);
  assert.equal(getDayPack(3).scenario.externalWrites, false);
  assert.equal(getDayPack(3).mission.id, 'ATLAS-N8N-03');
  assert.equal(getDayPack(4).mission.id, 'ATLAS-CLAUDE-04');
  assert.equal(getDayPack(5).mission.id, 'ATLAS-TEAM-05');
  assert.ok(getDayPack(3).openGates.includes('live n8n/model smoke test'));
  assert.equal(getDayPack(3).steps.length, 3);
  assert.deepEqual(getDayPack(3).steps.map(s => s.agentCount), [0, 1, 'multi']);
  assert.match(getDayPack(3).lesson.title, /multi-agent|n8n/i);
});

test('route summaries expose all five implemented packs', () => {
  assert.equal(listDaySummaries().length, 5);
  assert.ok(listRouteDays().every(day => day.hasLesson));
});

test('n8n starter is valid JSON and has no credential nodes', async () => {
  const workflow = JSON.parse(await readFile('starter/n8n-repository-review.json', 'utf8'));
  assert.equal(workflow.active, false);
  assert.equal(workflow.nodes.some(node => node.type.includes('credentials')), false);
  assert.equal(workflow.nodes.length, 2);
  assert.match(workflow.nodes[1].parameters.jsCode, /deterministic-fixture-check/);
});
