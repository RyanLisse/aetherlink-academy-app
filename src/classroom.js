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

/** Keys the facilitator uses to advance/retreat slides in Classroom overlay. */
export const CLASSROOM_NAV_KEYS = Object.freeze([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  ' ',
]);

const CLASSROOM_NAV_KEY_SET = new Set(CLASSROOM_NAV_KEYS);

/** True when `key` is a slide-nav key (Space is the single character `' '`). */
export function isClassroomNavKey(key) {
  return CLASSROOM_NAV_KEY_SET.has(key);
}

/**
 * True when the deck's focused element should keep arrow/space keys for typing
 * (matches SPA Deck + Effect present guards).
 */
export function isDeckEditableTarget(el) {
  if (!el) return false;
  const tag = typeof el.tagName === 'string' ? el.tagName.toLowerCase() : '';
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (el.isContentEditable === true) return true;
  if (typeof el.closest === 'function') {
    return Boolean(
      el.closest(
        'input, textarea, select, [contenteditable]:not([contenteditable="false"])',
      ),
    );
  }
  return false;
}

/**
 * Decide whether the overlay parent should synthesize a keydown into the iframe.
 * Returns false when the key is not nav, or when the iframe focus is editable.
 */
export function shouldForwardClassroomNavKey(key, iframeActiveElement) {
  if (!isClassroomNavKey(key)) return false;
  if (isDeckEditableTarget(iframeActiveElement)) return false;
  return true;
}

/**
 * Dispatch a bubbling keydown into a same-origin classroom iframe document.
 * SPA Deck listens on window; Effect present listens on document — bubbling
 * from document covers both. Returns true when an event was dispatched.
 */
export function forwardClassroomNavKey(iframe, key, KeyboardEventCtor = globalThis.KeyboardEvent) {
  if (!iframe || !shouldForwardClassroomNavKey(key, null)) return false;
  let doc;
  try {
    doc = iframe.contentDocument;
  } catch {
    return false;
  }
  if (!doc) return false;
  let active = null;
  try {
    active = doc.activeElement;
  } catch {
    active = null;
  }
  if (!shouldForwardClassroomNavKey(key, active)) return false;
  if (typeof KeyboardEventCtor !== 'function') return false;
  const event = new KeyboardEventCtor('keydown', {
    key,
    code: key === ' ' ? 'Space' : key,
    bubbles: true,
    cancelable: true,
  });
  doc.dispatchEvent(event);
  return true;
}

/**
 * Deck/present fullscreen toggle must not duel the overlay's documentElement FS.
 * When embedded (`window !== window.top`), leave FS to the parent overlay.
 */
export function deckFullscreenAllowed(win = globalThis) {
  try {
    return win === win.top;
  } catch {
    // Cross-origin parent access throws — treat as framed / disallow.
    return false;
  }
}
