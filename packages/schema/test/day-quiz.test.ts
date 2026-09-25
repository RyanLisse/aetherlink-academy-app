import {describe, expect, it} from 'vitest';
import {decodeDayQuiz, participantDayQuiz, scoreDayQuiz} from '../src/day-quiz.ts';

const synthetic = {
  questions: [
    {id: 'syn-q1', kind: 'single-choice', question: 'Synthetische vraag 1', options: [{id: 'a', label: 'A'}, {id: 'b', label: 'B'}]},
    {id: 'syn-q2', kind: 'single-choice', question: 'Synthetische vraag 2', options: [{id: 'a', label: 'A'}, {id: 'b', label: 'B'}, {id: 'c', label: 'C'}]},
  ],
  key: {'syn-q1': 'b', 'syn-q2': 'c'},
};

describe('day quiz', () => {
  it('scores selected option ids and reports per-question correctness', () => {
    expect(scoreDayQuiz(decodeDayQuiz(synthetic), {'syn-q1': 'b', 'syn-q2': 'a'})).toEqual({
      _tag: 'Scored',
      score: 1,
      total: 2,
      results: [{questionId: 'syn-q1', correct: true}, {questionId: 'syn-q2', correct: false}],
    });
  });

  it('rejects missing answers, unknown questions and unknown options', () => {
    expect(scoreDayQuiz(decodeDayQuiz(synthetic), {'syn-q1': 'z', other: 'a'})).toEqual({
      _tag: 'Rejected',
      issues: [
        {_tag: 'UnknownQuestion', questionId: 'other'},
        {_tag: 'UnknownOption', questionId: 'syn-q1', optionId: 'z'},
        {_tag: 'MissingAnswer', questionId: 'syn-q2'},
      ],
    });
  });

  it('keeps the key out of the participant projection', () => {
    expect(JSON.stringify(participantDayQuiz(decodeDayQuiz(synthetic)))).not.toContain('"key"');
  });

  it('rejects a key that points at an option the question does not have', () => {
    expect(() => decodeDayQuiz({...synthetic, key: {'syn-q1': 'b', 'syn-q2': 'd'}})).toThrow('answer key for "syn-q2" references unknown option "d"');
  });

  it('rejects a question kind that day packs do not use', () => {
    expect(() => decodeDayQuiz({...synthetic, questions: [{...synthetic.questions[0], kind: 'ordering'}, synthetic.questions[1]]})).toThrow();
  });
});
