import {describe, expect, it} from 'vitest';
import {matchRoomDeck, roomDeckSlides} from '../src/room-deck/room-deck.ts';
import {matchProductDeck} from '../src/routes.tsx';

const id = '0f8c3a52-7d1e-4f55-9a3b-2c9d4e6f7a81';

describe('room decks in the classroom renderer', () => {
  it('routes /decks/:uuid and nothing else', () => {
    expect(matchRoomDeck(`/decks/${id}`)).toBe(id);
    expect(matchProductDeck(`/decks/${id}`)).toBe('room-deck');
    expect(matchRoomDeck('/decks/assistant')).toBeNull();
    expect(matchRoomDeck(`/decks/${id}/present`)).toBeNull();
  });

  it('maps structured and HTML slides onto the deck contract with notes', () => {
    const slides = roomDeckSlides({id, title: 'Dag 1', revision: 3, slides: [
      {id: 's1', kind: 'classroom', textPreview: 'x', notes: 'Stel jezelf voor.', classroom: {title: 'Oefening', layout: 'exercise', steps: ['Open Claude'], keyPoints: ['Kort'], visual: {countdown: 10}}},
      {id: 's2', kind: 'html', textPreview: 'Oude slide. Met uitleg.'},
    ]});
    expect(slides.map((slide) => [slide.id, slide.ordinal, slide.type, slide.title])).toEqual([
      ['s1', 1, 'practice', 'Oefening'],
      ['s2', 2, 'context', 'Oude slide.'],
    ]);
    expect(slides[0]).toMatchObject({notes: 'Stel jezelf voor.', keyPoints: ['Kort'], steps: ['Open Claude'], visual: {countdown: 10}});
    expect(slides[1]?.subtitle).toBe('Met uitleg.');
  });
});
