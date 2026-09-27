/**
 * Facilitator Classroom overlay — same-origin Academy deck (AET-105).
 * Slice A: room.day → /classroom/{n} or /workshop/{n}.
 * Slice B: optional pinned Effect deck → /game/decks/{id}/present (overrides static day map).
 * Cons/Jessy packs stay content SoT via static routes until a day is re-authored + ACCEPT.
 */

const DECK_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Day → Academy SPA path used by Open Classroom. Unknown/missing → Classroom 1. */
export function classroomPathForDay(day) {
  const n = Number(day);
  if (n === 1) return '/classroom/1';
  if (n === 2) return '/classroom/2';
  if (Number.isInteger(n) && n >= 3 && n <= 7) return `/workshop/${n}`;
  return '/classroom/1';
}

/** Same-origin Effect deck present URL (inline HTML viewer, session cookie). */
export function effectDeckPresentPath(deckId) {
  return `/game/decks/${deckId}/present`;
}

/**
 * iframe src for the overlay.
 * Prefer a room-day pinned Effect deck when `pinnedDeckId` is a UUID;
 * otherwise fall back to the Slice A day → classroom/workshop map.
 */
export function classroomEmbedUrl(day, pinnedDeckId) {
  if (typeof pinnedDeckId === 'string' && DECK_UUID.test(pinnedDeckId)) {
    return effectDeckPresentPath(pinnedDeckId);
  }
  return classroomPathForDay(day);
}

/** Resolve pin for the room's current day from room.classroomOverlayByDay. */
export function pinnedDeckIdForRoom(room) {
  if (!room || typeof room !== 'object') return null;
  if (typeof room.classroomOverlayDeckId === 'string' && DECK_UUID.test(room.classroomOverlayDeckId)) {
    return room.classroomOverlayDeckId;
  }
  const byDay = room.classroomOverlayByDay;
  if (!byDay || typeof byDay !== 'object') return null;
  const id = byDay[String(room.day)];
  return typeof id === 'string' && DECK_UUID.test(id) ? id : null;
}

/**
 * Sandbox for the Academy deck iframe (first-party /classroom|/workshop SPA
 * or Effect present HTML). Scripts + same-origin: our own deck needs both.
 * Deliberately withheld: top-navigation (must never bounce the facilitator out
 * of the room), forms, downloads, modals, pointer-lock.
 */
export const CLASSROOM_SANDBOX =
  'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation';
