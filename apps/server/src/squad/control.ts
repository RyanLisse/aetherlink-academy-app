import {squadFail} from './errors.ts';
import {MIN_PRACTICE_SIZE, type Room, type RoomMode, type RoomPhase} from './types.ts';

const PHASES: ReadonlyArray<RoomPhase> = ['Plan', 'Design', 'Build', 'Test', 'Deploy', 'Maintain'];
const MODES: ReadonlyArray<RoomMode> = ['lesson', 'solo', 'squad', 'review'];

export const remainingSeconds = (r: Room, now = Date.now()): number =>
  r.running ? Math.max(0, Math.ceil(((r.deadline ?? now) - now) / 1000)) : r.remaining;

export const applyControl = (
  r: Room,
  action: string,
  value: unknown = undefined,
  now = Date.now(),
): void => {
  if (action === 'start') {
    if (r.members.length < MIN_PRACTICE_SIZE) {
      throw squadFail(409, `Wacht op minimaal ${MIN_PRACTICE_SIZE} deelnemers.`);
    }
    if (!r.running) {
      r.deadline = now + r.remaining * 1000;
      r.running = true;
    }
  } else if (action === 'pause') {
    r.remaining = remainingSeconds(r, now);
    r.running = false;
    r.deadline = null;
  } else if (action === 'next') {
    if (r.members.length < MIN_PRACTICE_SIZE) {
      throw squadFail(409, `Wacht op minimaal ${MIN_PRACTICE_SIZE} deelnemers.`);
    }
    r.round++;
    r.running = false;
    r.remaining = r.roundSeconds || 1500;
    r.deadline = null;
  } else if (action === 'time') {
    if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > 7200) {
      throw squadFail(400, 'Kies een tijd tussen 0 en 120 minuten.');
    }
    r.remaining = value as number;
    if (r.running) r.deadline = now + (value as number) * 1000;
  } else if (action === 'duration') {
    if (!Number.isInteger(value) || (value as number) < 60 || (value as number) > 7200) {
      throw squadFail(400, 'Kies een tijd tussen 0 en 120 minuten.');
    }
    r.roundSeconds = value as number;
  } else if (action === 'phase') {
    if (!PHASES.includes(value as RoomPhase)) throw squadFail(400, 'Onbekende fase.');
    r.phase = value as RoomPhase;
  } else if (action === 'day') {
    if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > 5) {
      throw squadFail(400, 'Kies supportdag 1–5.');
    }
    r.day = value as number;
    for (const member of r.members) {
      const progress = member.progressByDay?.[String(value)];
      member.route = progress?.route || 'standard';
      member.quiz =
        progress?.quizScore != null
          ? {score: progress.quizScore, at: progress.quizAt ?? Date.now(), day: value as number}
          : null;
    }
  } else if (action === 'mode') {
    if (!MODES.includes(value as RoomMode)) throw squadFail(400, 'Onbekende werkvorm.');
    r.mode = value as RoomMode;
  } else {
    throw squadFail(400, 'Onbekende actie.');
  }
  r.version++;
};

