import {describe, expect, it} from 'vitest';
import {matchRoomDeck, roomDeckSlides, withClassroomStyle} from '../src/room-deck/room-deck.ts';
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
      {id: 's1', kind: 'classroom', textPreview: 'x', notes: 'Stel jezelf voor.', classroom: {title: 'Oefening', layout: 'exercise', steps: ['Open Claude'], keyPoints: ['Kort'], timer: 10, visual: {countdown: 10}}},
      {id: 's2', kind: 'html', textPreview: 'Oude slide. Met uitleg.'},
      {id: 's3', kind: 'classroom', textPreview: 'Concept', classroom: {title: 'Concept', type: 'concept'}},
    ]});
    expect(slides.map((slide) => [slide.id, slide.ordinal, slide.type, slide.title])).toEqual([
      ['s1', 1, 'practice', 'Oefening'],
      ['s2', 2, 'context', 'Oude slide.'],
      ['s3', 3, 'concept', 'Concept'],
    ]);
    expect(slides[0]).toMatchObject({notes: 'Stel jezelf voor.', keyPoints: ['Kort'], steps: ['Open Claude'], timer: 10, visual: {countdown: 10}});
    expect(slides[1]).toMatchObject({subtitle: 'Met uitleg.', visual: {bot: 'wave', place: 'beside'}});
    expect(slides[2]).toMatchObject({visual: {bot: 'think', place: 'beside'}});
  });

  it('keeps a showcase image on a room deck slide without adding a bot', () => {
    const visual = {opener: 'showcase', image: 'workshop-4/00-overview.png', imageLink: 'n8n ↔ Agent SDK at a glance'};
    const [slide] = roomDeckSlides({id, title: 'W4', revision: 1, slides: [
      {id: 's1', kind: 'classroom', textPreview: 'x', classroom: {title: 'n8n ↔ Agent SDK at a glance', type: 'concept', layout: 'compare', visual}},
    ]});
    expect(slide?.visual).toEqual(visual);
  });

  it('uses the bot pose for eligible classroom slides and preserves explicit/specialized styling', () => {
    const guarded = {title: 'Guardrails', visual: {bot: 'head'}};
    const exercise = {title: 'Exercise', layout: 'exercise'};
    const quiz = {title: 'Quiz', type: 'quiz'};
    expect(withClassroomStyle(guarded, 'concept')).toBe(guarded);
    expect(withClassroomStyle(exercise, 'practice')).toBe(exercise);
    expect(withClassroomStyle(quiz, 'quiz')).toBe(quiz);
  });
});
