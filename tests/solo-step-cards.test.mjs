import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const panels = readFileSync(join(root, 'src/panels.jsx'), 'utf8');
const main = readFileSync(join(root, 'src/main.jsx'), 'utf8');
const activitiesCss = readFileSync(join(root, 'src/learning-activities.css'), 'utf8');
const en = JSON.parse(readFileSync(join(root, 'src/i18n/en.json'), 'utf8'));
const nl = JSON.parse(readFileSync(join(root, 'src/i18n/nl.json'), 'utf8'));
const solo = panels.slice(panels.indexOf('export function Solo('), panels.indexOf('\nexport function Review('));
const assignmentTaskBox = panels.slice(panels.indexOf('function AssignmentTaskBox('), panels.indexOf('\nfunction StepTaskList('));

test('Solo renders assignment boxes with practical try-it guidance and inline evidence', () => {
  assert.match(panels, /function StepTaskList\(\{steps,tasks,action,busy,onGraded,onSubmitted,readOnly\}\)/);
  assert.match(panels, /function AssignmentTaskBox/);
  assert.match(panels, /data-testid="step-card"/);
  assert.match(panels, /data-assignment-task-box/);
  assert.match(panels, /function TaskEvidenceForm/);
  assert.match(panels, /showTitle=true/);
  assert.match(panels, /\{showTitle&&<strong>/);
  assert.match(panels, /assignment\.runThis/);
  assert.match(panels, /assignment\.prompts/);
  assert.match(panels, /assignment\.watchFor/);
  assert.match(panels, /assignment\.submissionHistory/);
  assert.match(solo, /hasSteps\?[\s\S]*<StepTaskList/);
  assert.match(solo, /:\s*participant&&\(tasks\?<TaskList/);
  assert.match(solo, /assignment\.otherEvidence/);
  assert.doesNotMatch(solo, /ProgressivePath/);
});

test('assignment history localizes evidence statuses and omits absent fields', () => {
  assert.ok(assignmentTaskBox.includes("t('review.status.'+submission.status)"), 'submission statuses use evidence-status translations');
  assert.ok(!assignmentTaskBox.includes("t('tasks.status.'+submission.status)"), 'submission statuses do not use task-status translations');
  for (const [field, tag] of [['finding', 'p'], ['command', 'small'], ['observed', 'p'], ['limitation', 'small']]) {
    assert.ok(assignmentTaskBox.includes(`{submission.${field}&&<${tag}>{submission.${field}}</${tag}>}`), `${field} renders only when present`);
  }
});

test('Solo step-card translations exist in English and Dutch', () => {
  for (const key of ['steps.progress', 'steps.minutes', 'steps.submitEvidence', 'activity.progress', 'nav.courseOverview', 'course.overviewLede', 'assignment.goal', 'assignment.runThis', 'assignment.prompts', 'assignment.copy', 'assignment.copied', 'assignment.watchFor', 'assignment.otherEvidence', 'submissionsGrid.title']) {
    assert.equal(typeof en[key], 'string', `English translation exists for ${key}`);
    assert.equal(typeof nl[key], 'string', `Dutch translation exists for ${key}`);
  }
});

test('assignment copy controls cover the run block and each individual prompt', () => {
  assert.match(panels, /t\(copied\?'assignment\.copied':'assignment\.copy'\)/);
  assert.ok(assignmentTaskBox.includes("value={run.join('\\n')}"), 'Run this has one copy control');
  assert.ok(assignmentTaskBox.includes('prompts.map((prompt,index)=><li key={index}><span>{prompt}</span><CopyTextButton value={prompt}/></li>)'), 'each prompt has its own copy control');
  assert.doesNotMatch(assignmentTaskBox, /CopyTextButton value=\{prompts\.join/);
});

test('participant Course overview exposes chapters, activity rows and a Continue action', () => {
  assert.match(panels, /data-testid="course-overview"/);
  assert.match(panels, /className="course-chapter-toggle"/);
  assert.match(panels, /className="course-activity-row"/);
  assert.match(panels, /course\.continueActivity/);
  assert.match(panels, /course\.backToToday/);
});

test('Course stretch marker is a standalone pill; ClassroomShell owns course chrome', () => {
  assert.match(main, /ClassroomShell/);
  assert.match(panels, /className="submission-grid-task-title">\{task\.title\}<\/span>\{!task\.required&&<small className="submission-grid-stretch">/);
  assert.match(activitiesCss, /\.submissions-grid thead th>\.submission-grid-stretch\{display:block/);
  assert.equal(en['route.eyebrow'], 'Course');
  assert.equal(nl['route.eyebrow'], 'Cursus');
});

test('facilitator submission grid links awaiting cells to evidence queue articles', () => {
  assert.match(panels, /function SubmissionsGrid/);
  assert.match(panels, /data-testid="submissions-grid"/);
  assert.match(panels, /latestEvidenceId/);
  assert.match(panels, /href=\{`#queue-\$\{task\.latestEvidenceId\}`\}/);
  assert.match(panels, /id=\{`queue-\$\{item\.evidenceId\}`\}/);
  assert.match(panels, /data\.members&&<SubmissionsGrid members=\{data\.members\}\/>/);
});
