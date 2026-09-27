/**
 * Facilitator Classroom overlay — same-origin Academy deck (AET-105 Slice A).
 * room.day → /classroom/{n} or /workshop/{n} (aligned with apps/web REFERENCE_DAYS).
 * Former Google Slides embed removed; Cons/Jessy packs stay content SoT via those routes.
 */

/** Day → Academy SPA path used by Open Classroom. Unknown/missing → Classroom 1. */
export function classroomPathForDay(day) {
  const n = Number(day);
  if (n === 1) return '/classroom/1';
  if (n === 2) return '/classroom/2';
  if (Number.isInteger(n) && n >= 3 && n <= 7) return `/workshop/${n}`;
  return '/classroom/1';
}

/** iframe src for the overlay — same-origin path (no Google). */
export function classroomEmbedUrl(day) {
  return classroomPathForDay(day);
}

/**
 * Sandbox for the Academy deck iframe (first-party /classroom|/workshop SPA).
 * Scripts + same-origin: our own deck needs both to render.
 * Deliberately withheld: top-navigation (must never bounce the facilitator out
 * of the room), forms, downloads, modals, pointer-lock.
 */
export const CLASSROOM_SANDBOX =
  'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation';
