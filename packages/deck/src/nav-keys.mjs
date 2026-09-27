/**
 * Present-mode keyboard policy for .academy-deck (AET-106).
 * Toolbar buttons (⛶, Prev, Next, …) must not permanently steal Arrow/Space —
 * Space advances slides; it must not activate a focused fullscreen toggle.
 */

export const DECK_NAV_KEYS = Object.freeze([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  ' ',
  'Home',
  'End',
]);

const NAV = new Set(DECK_NAV_KEYS);

export function isDeckNavKey(key) {
  return NAV.has(key);
}

/**
 * True when the event target should block this key from deck navigation.
 * Editable fields always block. Buttons/links block only non-nav keys so
 * Arrow/Space still advance after a toolbar click (VERIFIED soft live).
 */
export function deckNavBlockedByTarget(target, key) {
  if (!target || typeof target.closest !== 'function') return false;
  if (
    target.closest(
      'input, textarea, select, [contenteditable]:not([contenteditable="false"])',
    )
  ) {
    return true;
  }
  if (target.closest('dialog')) return true;
  if (isDeckNavKey(key)) return false;
  if (target.closest('button, a')) return true;
  return false;
}
