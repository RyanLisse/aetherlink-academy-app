import {Effect, Schema} from 'effect';
import {describe, expect, test} from 'vitest';
import {defineAction} from '../src/action.ts';
import {registry} from '../src/actions/index.ts';
import {emptyRegistry, findAction, registerAction} from '../src/registry.ts';

const ping = defineAction({
  name: 'ping',
  input: Schema.Struct({}),
  output: Schema.Struct({pong: Schema.Boolean}),
  scope: 'both',
  intent: 'read',
  run: () => Effect.succeed({pong: true}),
});

describe('registry', () => {
  test('registerAction returns a new array and never mutates the one passed in', () => {
    const before = emptyRegistry;
    const after = registerAction(before, ping);
    expect(before).toHaveLength(0);
    expect(after).toHaveLength(1);
    expect(after).not.toBe(before);
  });

  test('registering a duplicate name throws', () => {
    const withPing = registerAction(emptyRegistry, ping);
    expect(() => registerAction(withPing, ping)).toThrow(/duplicate action name/);
  });

  test('findAction looks up by name and returns undefined for unknown names', () => {
    const withPing = registerAction(emptyRegistry, ping);
    expect(findAction(withPing, 'ping')).toBe(ping);
    expect(findAction(withPing, 'missing')).toBeUndefined();
  });

  test('extending the registry is exactly one `defineAction` plus one `registerAction` call', () => {
    // Minimal fixture: `ping` above is the "one file" (in production, its own
    // module); this line is the "one registry line" — no dispatcher, adapter,
    // or auth code changes to add it.
    const extended = registerAction(registry, ping);
    expect(extended).toHaveLength(registry.length + 1);
    expect(findAction(extended, 'ping')).toBe(ping);
    // The production registry itself is untouched by extending a copy of it.
    expect(findAction(registry, 'ping')).toBeUndefined();
  });

  test('the production registry includes the AET-21 samples and AET-26 live actions', () => {
        expect(registry.map((a) => a.name).sort()).toEqual([
      'answer_self_check',
      'cancelSchedule',
      'detach',
      'everyoneBackToFollow',
      'export_debrief',
      'followAgain',
      'getParticipantCount',
      'getScreenState',
      'get_assignment',
      'get_connection_state',
      'get_current_slide',
      'get_document',
      'get_lesson',
      'get_mission',
      'get_my_progress',
      'gotoSlide',
      'handoff',
      'mark_practised',
      'nextSlide',
      'openLesson',
      'open_hint',
      'pauseUntil',
      'prevSlide',
      'releaseLesson',
      'review_evidence',
      'scheduleLesson',
      'search_knowledge',
      'setReveal',
      'startTimer',
      'submit_evidence',
      'suggest_document',
      'togglePlanB',
      'unmark_practised',
    ]);
  });
});
