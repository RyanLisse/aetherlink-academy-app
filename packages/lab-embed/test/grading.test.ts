import {describe, expect, it} from 'vitest';
import {gradeAnswer, gradedStopsPassed, parseLabKeys, recordAttempt} from '../src/grading.ts';
import type {StopId} from '../src/index.ts';

// ws-2-eve-state stop-2 is the lesson's real knowledge check (correct: 1). The match key is synthetic.
const KEYS = parseLabKeys({
  'ws-2-eve-state': {'stop-2': {kind: 'choice', correct: 1}},
  'sample-counter': {'stop-1': {kind: 'match', includes: '-=', regex: '^count\\s*-=\\s*1$', flags: 'i'}},
});
const choice = KEYS.get('ws-2-eve-state' as never)!.get('stop-2' as StopId)!;
const match = KEYS.get('sample-counter' as never)!.get('stop-1' as StopId)!;

describe('gradeAnswer', () => {
  it('grades a choice by index and a match by includes and regex', () => {
    expect(gradeAnswer(choice, 1)).toBe(true);
    expect(gradeAnswer(choice, 0)).toBe(false);
    expect(gradeAnswer(choice, '1')).toBe(false);
    expect(gradeAnswer(match, 'COUNT -= 1')).toBe(true);
    expect(gradeAnswer(match, 'count += 1')).toBe(false);
    expect(gradeAnswer(match, 'count -= 1; alert(1)')).toBe(false);
    expect(gradeAnswer(match, 1)).toBe(false);
  });
});

describe('recordAttempt', () => {
  it('counts wrong attempts, then freezes the record once passed', () => {
    const first = recordAttempt(undefined, choice, {stopId: 'stop-2' as StopId, answer: 0}, '2026-09-25T10:00:00.000Z');
    expect(first).toEqual({recorded: true, stop: {stopId: 'stop-2', passed: false, attempts: 1, at: '2026-09-25T10:00:00.000Z', source: 'server-graded'}});
    const second = recordAttempt(first.stop, choice, {stopId: 'stop-2' as StopId, answer: 1}, '2026-09-25T10:01:00.000Z');
    expect(second.stop).toEqual({stopId: 'stop-2', passed: true, attempts: 2, at: '2026-09-25T10:01:00.000Z', source: 'server-graded'});
    const third = recordAttempt(second.stop, choice, {stopId: 'stop-2' as StopId, answer: 0}, '2026-09-25T10:02:00.000Z');
    expect(third).toEqual({recorded: false, stop: second.stop});
  });

  it('counts only passed records toward completion', () => {
    const stops = KEYS.get('ws-2-eve-state' as never);
    expect(gradedStopsPassed(stops, undefined)).toEqual({passed: 0, total: 1});
    const failed = recordAttempt(undefined, choice, {stopId: 'stop-2' as StopId, answer: 0}, 'now').stop;
    expect(gradedStopsPassed(stops, {'stop-2': failed})).toEqual({passed: 0, total: 1});
    expect(gradedStopsPassed(stops, {'stop-2': {...failed, passed: true}})).toEqual({passed: 1, total: 1});
    expect(gradedStopsPassed(undefined, undefined)).toEqual({passed: 0, total: 0});
  });
});

describe('parseLabKeys', () => {
  it('refuses malformed keys so the server fails at boot', () => {
    expect(() => parseLabKeys({'Bad Lab': {}})).toThrow('invalid lab Bad Lab');
    expect(() => parseLabKeys({lab: {'stop 1': {kind: 'choice', correct: 0}}})).toThrow('invalid stop lab/stop 1');
    expect(() => parseLabKeys({lab: {'stop-1': {kind: 'choice', correct: -1}}})).toThrow('choice needs a non-negative integer correct');
    expect(() => parseLabKeys({lab: {'stop-1': {kind: 'match'}}})).toThrow('match needs includes or regex');
    expect(() => parseLabKeys({lab: {'stop-1': {kind: 'match', regex: 'x', flags: 'g'}}})).toThrow('flags may only use i, m, s, u');
    expect(() => parseLabKeys({lab: {'stop-1': {kind: 'exec', code: 'return 1'}}})).toThrow('unknown kind exec');
  });
});
