import {decodeSlide} from '@academy/schema';
import {demoFallback} from './demo-fallback.js';
import type {DeckSlide} from '@academy/deck';

/** Attach controller-owned identity to the reference deck, then validate its public contract. */
export function normalizeSlides(input: ReadonlyArray<Record<string, unknown>>): ReadonlyArray<DeckSlide> {
  return input.map((raw, index) => {
    const type = raw.type ?? (raw.layout === 'exercise' ? 'practice' : raw.layout === 'recap' ? 'recap' : 'context');
    const visual = raw.visual && typeof raw.visual === 'object' && !Array.isArray(raw.visual) ? raw.visual as Record<string, unknown> : undefined;
    const fallbackKey = typeof visual?.planB === 'string' ? visual.planB : visual?.art === 'prompt' && raw.prompt ? 'DEMO_FALLBACK' : undefined;
    const planB = raw.planB ?? (fallbackKey ? demoFallback[fallbackKey] : undefined);
    const slide = decodeSlide({
      ...raw,
      id: raw.id ?? `slide-${index + 1}`,
      lessonId: raw.lessonId ?? (index < 44 ? 'teaching-day-1' : 'teaching-day-2'),
      ordinal: raw.ordinal ?? index + 1,
      type,
      ...(planB === undefined ? {} : {planB}),
    });
    return {...raw, ...slide};
  });
}
