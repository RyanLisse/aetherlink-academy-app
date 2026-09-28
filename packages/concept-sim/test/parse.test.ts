import {describe, expect, it} from 'vitest';
import {parseScenario, parseSimRefs, isValidSimId} from '../src/index.ts';

const sample = {
  version: 'fixture-agent-loop',
  title: 'Agent loop (fixture)',
  description: 'Surface proof scenario',
  steps: [
    {type: 'user_message', content: 'Hello', annotation: 'User asks'},
    {type: 'tool_call', content: 'echo hi', toolName: 'bash', annotation: 'Model calls bash'},
    {type: 'tool_result', content: 'hi', toolName: 'bash', annotation: 'Result returns'},
    {type: 'assistant_text', content: 'Done.', annotation: 'Loop ends'},
  ],
  attribution: 'MIT pattern from shareAI-lab/learn-claude-code',
};

describe('parseScenario', () => {
  it('accepts a valid scenario', () => {
    const s = parseScenario(sample);
    expect(s.version).toBe('fixture-agent-loop');
    expect(s.steps).toHaveLength(4);
    expect(s.steps[1].toolName).toBe('bash');
  });

  it('rejects empty steps', () => {
    expect(() => parseScenario({...sample, steps: []})).toThrow(/steps/);
  });

  it('rejects unknown step types', () => {
    expect(() =>
      parseScenario({...sample, steps: [{type: 'nope', content: '', annotation: ''}]}),
    ).toThrow(/type/);
  });
});

describe('parseSimRefs', () => {
  it('accepts string ids and objects', () => {
    expect(parseSimRefs(['fixture-agent-loop', {id: 's01', title: 'Agent Loop'}])).toEqual([
      {id: 'fixture-agent-loop'},
      {id: 's01', title: 'Agent Loop'},
    ]);
  });

  it('rejects bad ids', () => {
    expect(() => parseSimRefs(['Bad Id'])).toThrow(/id/);
  });
});

describe('isValidSimId', () => {
  it('matches catalog ids', () => {
    expect(isValidSimId('s01')).toBe(true);
    expect(isValidSimId('fixture-agent-loop')).toBe(true);
    expect(isValidSimId('../etc')).toBe(false);
  });
});
