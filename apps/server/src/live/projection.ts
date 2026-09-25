import {participantSlide, type Slide} from '@academy/schema';

/**
 * Follow / participant projection: strip presenter-only `notes` at the
 * boundary (AET-26 AC). Uses the shared schema allowlist so quiz answers
 * are also excluded. Assert on the literal object — never rely on UI hiding.
 */
export const toFollowSlidePayload = (slide: Slide): Record<string, unknown> => {
  const projected = participantSlide(slide) as Record<string, unknown>;
  // Defensive: even if schema drifts, never leak notes into follow payloads.
  if ('notes' in projected) {
    const {notes: _notes, ...rest} = projected;
    return rest;
  }
  return projected;
};

export const assertNoNotes = (payload: Record<string, unknown>): void => {
  if (Object.prototype.hasOwnProperty.call(payload, 'notes')) {
    throw new Error('follow payload must not contain notes');
  }
};
