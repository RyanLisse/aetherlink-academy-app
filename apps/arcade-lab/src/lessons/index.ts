import type { Lesson } from '../schema';
import ws_1_eve_weather from './ws-1-eve-weather';
import ws_2_eve_state from './ws-2-eve-state';
import ws_3_eve_approval from './ws-3-eve-approval';
import ws_2_eve_council from './ws-2-eve-council';
import ws_5_sdk_quickstart from './ws-5-sdk-quickstart';
import ws_3_sdk_weather from './ws-3-sdk-weather';
import ws_7_sdk_hooks from './ws-7-sdk-hooks';
import ws_8_sdk_subagents from './ws-8-sdk-subagents';
import ws_4_sdk_council from './ws-4-sdk-council';
import sample_counter from './sample-counter';

/** Canonical registry — exact ids only (LESSON-ID-CONTRACT). */
export const LESSONS: Lesson[] = [
  ws_1_eve_weather,
  ws_2_eve_state,
  ws_3_eve_approval,
  ws_2_eve_council,
  ws_5_sdk_quickstart,
  ws_3_sdk_weather,
  ws_7_sdk_hooks,
  ws_8_sdk_subagents,
  ws_4_sdk_council,
  sample_counter,
];

export const LESSON_BY_ID: Record<string, Lesson> = Object.fromEntries(LESSONS.map((l) => [l.id, l]));

export const DEFAULT_LESSON_ID = 'ws-1-eve-weather';

export function resolveLessonId(raw: string | null | undefined): { id: string; reason: 'exact' | 'missing' | 'unknown' } {
  const id = (raw ?? '').trim();
  if (!id) return { id: DEFAULT_LESSON_ID, reason: 'missing' };
  if (LESSON_BY_ID[id]) return { id, reason: 'exact' };
  return { id: DEFAULT_LESSON_ID, reason: 'unknown' };
}

export function getLesson(id: string): Lesson {
  return LESSON_BY_ID[id] ?? LESSON_BY_ID[DEFAULT_LESSON_ID]!;
}
