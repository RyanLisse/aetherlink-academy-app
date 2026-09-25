import {Effect, Layer} from 'effect';
import {describe, expect, test} from 'vitest';
import {ReleasePolicy} from '../src/actions/release-policy.ts';
import {ContentSearch, searchContent, type SearchAudience} from '../src/actions/search-content.ts';
import {registry as academyRegistry} from '../src/actions/index.ts';
import type {Caller} from '../src/caller.ts';
import {ConfirmationStoreLive} from '../src/confirmation.ts';
import {dispatch} from '../src/dispatcher.ts';
import {emptyRegistry, findAction, registerAction} from '../src/registry.ts';

const registry = registerAction(emptyRegistry, searchContent);

const layerFor = (released: ReadonlySet<string>, seen: SearchAudience[]) =>
  Layer.mergeAll(
    ConfirmationStoreLive,
    Layer.succeed(ContentSearch, {
      lessonIds: Effect.succeed(['lesson-a', 'lesson-b', 'lesson-c']),
      search: ({audience}) =>
        Effect.sync(() => {
          seen.push(audience);
          return [];
        }),
    }),
    Layer.succeed(ReleasePolicy, {
      isReleased: (squadId, lessonId) => Effect.succeed(squadId === 'squad-1' && released.has(lessonId)),
      releaseLesson: () => Effect.die('unused'),
      scheduleLesson: () => Effect.die('unused'),
      cancelSchedule: () => Effect.die('unused'),
    }),
  );

const searchAs = async (caller: Caller, released: ReadonlySet<string>) => {
  const seen: SearchAudience[] = [];
  const result = await Effect.runPromise(
    dispatch(registry, {name: 'search_content', payload: {query: 'scout', locale: 'en'}}, caller).pipe(Effect.provide(layerFor(released, seen))),
  );
  return {result, seen};
};

describe('search_content', () => {
  test('is registered once in the academy registry for both roles', () => {
    expect(findAction(academyRegistry, 'search_content')?.scope).toBe('both');
  });

  test('a participant searches only the lessons released for their squad', async () => {
    const {result, seen} = await searchAs({principalId: 'p-1', roomId: 'squad-1', role: 'participant'}, new Set(['lesson-a', 'lesson-c']));
    expect(result).toEqual({hits: []});
    expect(seen).toEqual([{kind: 'participant', releasedLessonIds: ['lesson-a', 'lesson-c']}]);
  });

  test('a participant of another squad gets an empty allowlist', async () => {
    const {seen} = await searchAs({principalId: 'p-2', roomId: 'squad-2', role: 'participant'}, new Set(['lesson-a']));
    expect(seen).toEqual([{kind: 'participant', releasedLessonIds: []}]);
  });

  test('a facilitator searches everything', async () => {
    const {seen} = await searchAs({principalId: 'f-1', roomId: 'squad-1', role: 'facilitator'}, new Set());
    expect(seen).toEqual([{kind: 'facilitator'}]);
  });

  test('empty queries are rejected before the handler runs', async () => {
    const seen: SearchAudience[] = [];
    const exit = await Effect.runPromiseExit(
      dispatch(registry, {name: 'search_content', payload: {query: '', locale: 'en'}}, {principalId: 'f-1', roomId: 'squad-1', role: 'facilitator'}).pipe(
        Effect.provide(layerFor(new Set(), seen)),
      ),
    );
    expect(exit._tag).toBe('Failure');
    expect(seen).toEqual([]);
  });
});
