import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import {mkdtempSync} from 'node:fs';
import os from 'node:os';
import {createApp} from '../server/app.mjs';
import {QUIZ_ATTEMPT_TTL_MS,QUIZ_BAD_ASSET_MESSAGE,participantDayPack,quizRoomStatus,tryDayQuiz} from '../server/quiz.mjs';
import {getDayPack} from '../server/content.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const panels = readFileSync(join(root, 'src/panels.jsx'), 'utf8');
const css = readFileSync(join(root, 'src/style.css'), 'utf8');
const en = JSON.parse(readFileSync(join(root, 'src/i18n/en.json'), 'utf8'));
const nl = JSON.parse(readFileSync(join(root, 'src/i18n/nl.json'), 'utf8'));
const docs = readFileSync(join(root, 'docs/LEARNING-ROUTE.md'), 'utf8');

test('F3 learner chrome: progress n/N, question index, pass/fail copy', () => {
  assert.match(panels, /lesson\.quizProgress/);
  assert.match(panels, /lesson\.quizQuestion/);
  assert.match(panels, /lesson\.quizPass/);
  assert.match(panels, /lesson\.quizFail/);
  assert.match(panels, /quiz-progress/);
  assert.match(panels, /aria-current/);
  assert.match(css, /quiz-chrome/);
  assert.match(css, /quiz-progress/);
});

test('F4 facilitator chrome: debrief quiz status counts without raw JSON', () => {
  assert.match(panels, /debrief\.quizStatus/);
  assert.match(panels, /debrief\.quizCounts/);
  assert.match(panels, /quiz-status/);
  assert.match(panels, /quizPhase/);
  assert.doesNotMatch(panels, /quizAttempt/);
});

test('F5 bad-asset soft fail surfaces human copy + next action', () => {
  assert.match(panels, /lesson\.quizBadTitle/);
  assert.match(panels, /lesson\.quizBadNext/);
  assert.match(panels, /pack\.quizError/);
  assert.match(panels, /status\.retry/);
});

test('F6 idle timeout documented (30 min) + chrome note', () => {
  assert.equal(QUIZ_ATTEMPT_TTL_MS, 1_800_000);
  assert.match(panels, /lesson\.quizIdle/);
  assert.match(panels, /lesson\.quizExpiredTitle/);
  assert.match(docs, /30 minutes/);
  assert.match(docs, /QUIZ_ATTEMPT_TTL_MS/);
  assert.match(docs, /auto-saved/);
});

test('F7 no LearnHouse/Moodle quiz CMS replace', () => {
  assert.doesNotMatch(panels, /learnhouse/i);
  assert.doesNotMatch(panels, /moodle/i);
  assert.doesNotMatch(css, /learnhouse/i);
});

test('AET-88 i18n keys present EN+NL', () => {
  for (const key of [
    'lesson.quizProgress',
    'lesson.quizQuestion',
    'lesson.quizIdle',
    'lesson.quizPass',
    'lesson.quizFail',
    'lesson.quizBadTitle',
    'lesson.quizExpiredTitle',
    'debrief.quizStatus',
    'debrief.quizCounts',
    'debrief.quizInProgress',
    'debrief.quizCompleted',
  ]) {
    assert.ok(en[key], `missing EN ${key}`);
    assert.ok(nl[key], `missing NL ${key}`);
  }
});

test('F1 schema soft-fail: invalid quiz projects quizError instead of throwing', () => {
  assert.equal(tryDayQuiz({questions: [], key: {}}), null);
  const pack = participantDayPack({day: 99, lesson: {}, quiz: {questions: [], key: {}}});
  assert.equal(pack.quiz, null);
  assert.equal(pack.quizError, QUIZ_BAD_ASSET_MESSAGE);
  const good = participantDayPack(getDayPack(1));
  assert.ok(good.quiz.questions.length >= 1);
  assert.equal(good.quiz.key, undefined);
  assert.equal(good.quizError, undefined);
});

test('F2/F4 quizRoomStatus counts phases for facilitator debrief', () => {
  const now = Date.parse('2026-09-27T12:00:00Z');
  const members = [
    {id: 'a', name: 'Ann', progressByDay: {}, quizAttempt: null},
    {id: 'b', name: 'Bob', progressByDay: {}, quizAttempt: {day: 1, expiresAt: now + 60_000}},
    {id: 'c', name: 'Cat', progressByDay: {'1': {quizScore: 3}}, quizAttempt: {day: 1, expiresAt: now - 1}},
    {id: 'd', name: 'Dan', progressByDay: {}, quizAttempt: {day: 1, expiresAt: now - 1}},
  ];
  const status = quizRoomStatus(members, 1, now);
  assert.deepEqual(
    {notStarted: status.notStarted, inProgress: status.inProgress, completed: status.completed, expired: status.expired, started: status.started, total: status.total},
    {notStarted: 1, inProgress: 1, completed: 1, expired: 1, started: 3, total: 4},
  );
  assert.equal(status.members.find(m => m.id === 'c').phase, 'completed');
  assert.doesNotMatch(JSON.stringify(status), /fingerprint|openedAt/);
});

async function invoke(app, route, {body = {}, params = {}, cookies = {}} = {}) {
  const layer = app.router.stack.find(candidate => candidate.route?.path === route);
  assert.ok(layer, `Missing route ${route}`);
  const response = {statusCode: 200, body: null};
  const req = {body, params, query: {}, headers: {cookie: Object.entries(cookies).map(([name, value]) => `${name}=${value}`).join('; ')}};
  const res = {
    cookie() { return this; }, clearCookie() { return this; },
    status(status) { response.statusCode = status; return this; },
    json(value) { response.body = value; return this; },
    type() { return this; }, send(value) { response.body = value; return this; }, end() { return this; },
  };
  await layer.route.stack[0].handle(req, res, error => {
    response.statusCode = error.status || 500;
    response.body = {error: error.status ? error.message : 'Onverwachte serverfout.'};
  });
  return response;
}

test('F4 debrief endpoint returns quiz status summary', async () => {
  const instance = createApp({dir: mkdtempSync(join(os.tmpdir(), 'academy-quiz-chrome-')), hostKey: 'quiz-host', publicBaseUrl: 'http://127.0.0.1:4317'});
  const host = instance.store.create('Quiz', {slug: 'quiz'});
  const participant = instance.store.join(host.code, 'Deelnemer');
  const as = token => ({cookies: {academy: token}});
  const start = await invoke(instance.app, '/game/quiz/start', as(participant.token));
  assert.equal(start.statusCode, 200);
  assert.equal(start.body.idleTimeoutMs, QUIZ_ATTEMPT_TTL_MS);
  const debrief = await invoke(instance.app, '/game/debrief', as(host.token));
  assert.equal(debrief.statusCode, 200);
  assert.equal(debrief.body.quiz.inProgress, 1);
  assert.equal(debrief.body.quiz.completed, 0);
  assert.equal(debrief.body.members[0].quizPhase, 'in_progress');
  assert.doesNotMatch(JSON.stringify(debrief.body), /fingerprint|"key"/);
});
