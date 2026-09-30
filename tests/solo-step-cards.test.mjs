import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const panels = readFileSync(join(root, 'src/panels.jsx'), 'utf8');
const en = JSON.parse(readFileSync(join(root, 'src/i18n/en.json'), 'utf8'));
const nl = JSON.parse(readFileSync(join(root, 'src/i18n/nl.json'), 'utf8'));
const solo = panels.slice(panels.indexOf('export function Solo('), panels.indexOf('\nexport function Review('));

test('Solo renders step cards instead of repeating the path and task list', () => {
  assert.match(panels, /function StepTaskList\(\{steps,tasks,action,busy,onGraded,onSubmitEvidence\}\)/);
  assert.match(panels, /data-testid="step-card"/);
  assert.match(solo, /hasSteps\?[\s\S]*<StepTaskList/);
  assert.match(solo, /:\s*participant&&\(tasks\?<TaskList/);
  assert.doesNotMatch(solo, /ProgressivePath/);
});

test('Solo step-card translations exist in English and Dutch', () => {
  for (const key of ['steps.progress', 'steps.minutes', 'steps.submitEvidence']) {
    assert.equal(typeof en[key], 'string', `English translation exists for ${key}`);
    assert.equal(typeof nl[key], 'string', `Dutch translation exists for ${key}`);
  }
});
