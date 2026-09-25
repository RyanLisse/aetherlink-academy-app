import {createHash} from 'node:crypto';
import {encodeSlide, type Slide} from '@academy/schema';

/** Stable hash of decoded slide content (identity fields stripped). Used for idempotent draft writes. */
export const contentHashSlides = (slides: ReadonlyArray<Slide>): string => {
  const canonical = slides.map((slide) => {
    const encoded = encodeSlide(slide) as Record<string, unknown>;
    const {id: _id, lessonId: _lessonId, ordinal: _ordinal, ...body} = encoded;
    return body;
  });
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
};
