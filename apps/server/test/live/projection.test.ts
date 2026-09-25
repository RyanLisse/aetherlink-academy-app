import {describe, expect, test} from 'vitest';
import {decodeSlide} from '@academy/schema';
import {assertNoNotes, toFollowSlidePayload} from '../../src/live/projection.ts';

describe('follow projection (AET-26)', () => {
  test('follow payload for a slide with notes contains no notes key', () => {
    const slide = decodeSlide({
      id: 'slide-notes-1',
      lessonId: 'lesson-1',
      ordinal: 1,
      title: 'Secret notes slide',
      type: 'concept',
      notes: 'Facilitator-only coaching tip — never leak',
      prompt: 'Say this aloud',
      steps: ['One', 'Two'],
    });
    const payload = toFollowSlidePayload(slide);
    expect(Object.prototype.hasOwnProperty.call(payload, 'notes')).toBe(false);
    expect(payload).not.toHaveProperty('notes');
    expect(payload.title).toBe('Secret notes slide');
    expect(payload.prompt).toBe('Say this aloud');
    assertNoNotes(payload);
    // Literal object snapshot for AC
    expect(JSON.parse(JSON.stringify(payload))).toEqual(payload);
    expect(JSON.stringify(payload)).not.toContain('"notes"');
  });
});
