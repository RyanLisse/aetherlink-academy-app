import {decodeSlide, type Slide} from '@academy/schema';

const LAYOUTS = new Set(['pillars', 'steps', 'compare', 'exercise', 'recap', 'cards', 'image', 'bars']);

export const asLayout = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || !LAYOUTS.has(value)) return undefined;
  return value;
};

/** Infer Slide.type when the source omits it (day-decks.json, curriculum.md). */
export const inferSlideType = (source: Record<string, unknown>): string => {
  const title = String(source.title ?? '');
  const kicker = String(source.kicker ?? '').toUpperCase();
  const layout = typeof source.layout === 'string' ? source.layout : '';
  if (/break|lunch|pause/i.test(title) || kicker.includes('BREAK')) return 'pause';
  if (kicker.includes('RECAP') || layout === 'recap' || /recap/i.test(title)) return 'recap';
  if (layout === 'exercise' || typeof source.timer === 'number' || /assignment/i.test(title) || kicker.includes('PRACTICE')) {
    return 'practice';
  }
  if (/review|knowledge check/i.test(title) || kicker.includes('REVIEW')) return 'review';
  if (layout === 'cards' || layout === 'pillars' || layout === 'steps' || layout === 'compare' || layout === 'bars' || layout === 'image') {
    return 'concept';
  }
  return 'context';
};

const dropUndefined = (payload: Record<string, unknown>): Record<string, unknown> => {
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) delete payload[key];
  }
  return payload;
};

export interface RawSlideIdentity {
  readonly id: string;
  readonly lessonId: string;
  readonly ordinal: number;
}

/** Map a loosely typed source slide into a decoded Schema Slide. Throws Schema.ParseError on mismatch. */
export const slideFromRaw = (source: Record<string, unknown>, identity: RawSlideIdentity): Slide => {
  const layout = asLayout(source.layout);
  const type = typeof source.type === 'string' ? source.type : inferSlideType(source);
  const payload = dropUndefined({
    id: identity.id,
    lessonId: identity.lessonId,
    ordinal: identity.ordinal,
    title: source.title,
    type,
    kicker: source.kicker,
    subtitle: source.subtitle,
    layout,
    cards: source.cards,
    items: source.items,
    columns: source.columns,
    steps: source.steps,
    expected: source.expected,
    check: source.check,
    timer: source.timer,
    prompt: source.prompt,
    tagline: source.tagline,
    dark: source.dark,
    visual: source.visual,
    image: source.image,
    imageAlt: source.imageAlt,
    imageCaption: source.imageCaption,
    keepCards: source.keepCards,
    mascot: source.mascot,
    concepts: source.concepts,
    bars: source.bars,
    planB: source.planB,
    notes: source.notes,
  });
  return decodeSlide(payload);
};
