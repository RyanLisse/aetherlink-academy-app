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

describe('localized scenarios', () => {
  it('projects EN and NL from locales', async () => {
    const {parseLocalizedScenario, projectScenario, assertScenarioLocaleComplete} = await import('../src/index.ts');
    const localized = parseLocalizedScenario({
      version: 's01',
      attribution: 'MIT',
      locales: {
        en: {
          title: 'The Agent Loop',
          description: 'EN desc',
          steps: [
            {type: 'user_message', content: 'Create hello.py', annotation: 'User asks'},
            {type: 'assistant_text', content: 'Done', annotation: 'End'},
          ],
        },
        nl: {
          title: 'De agent-loop',
          description: 'NL beschrijving',
          attribution: 'Overgenomen uit shareAI-lab/learn-claude-code (MIT).',
          steps: [
            {type: 'user_message', content: 'Maak hello.py', annotation: 'Gebruiker vraagt'},
            {type: 'assistant_text', content: 'Klaar', annotation: 'Einde'},
          ],
        },
      },
    });
    assertScenarioLocaleComplete(localized);
    expect(projectScenario(localized, 'en').title).toBe('The Agent Loop');
    expect(projectScenario(localized, 'nl').title).toBe('De agent-loop');
    expect(projectScenario(localized, 'nl').attribution).toContain('Overgenomen');
    expect(projectScenario(localized, 'en').attribution).toBe('MIT');
  });
});

describe('attribution locale projection', () => {
  it('does not leak top-level EN attribution into NL projection', async () => {
    const {parseLocalizedScenario, projectScenario} = await import('../src/index.ts');
    const localized = parseLocalizedScenario({
      version: 'w5-sdlc-loop',
      attribution:
        'Academy-authored ConceptSim for Workshop 5 / AET-77 (AI-native SDLC). Scenario shape compatible with shareAI-lab/learn-claude-code (MIT). Not a port of an upstream chapter.',
      locales: {
        en: {
          title: 'SDLC loop',
          description: 'EN desc',
          steps: [
            {type: 'user_message', content: 'Ship it', annotation: 'Ask'},
            {type: 'assistant_text', content: 'Shipped', annotation: 'Done'},
          ],
        },
        nl: {
          title: 'SDLC-lus',
          description: 'NL beschrijving',
          attribution:
            'Door Academy geschreven ConceptSim voor Workshop 5 / AET-77 (AI-native SDLC). Scenariovorm compatibel met shareAI-lab/learn-claude-code (MIT). Geen port van een upstream-hoofdstuk.',
          steps: [
            {type: 'user_message', content: 'Ship het', annotation: 'Vraag'},
            {type: 'assistant_text', content: 'Geshipped', annotation: 'Klaar'},
          ],
        },
      },
    });
    const en = projectScenario(localized, 'en');
    const nl = projectScenario(localized, 'nl');
    expect(en.attribution).toContain('Academy-authored');
    expect(nl.attribution).toContain('Door Academy geschreven');
    expect(nl.attribution).not.toContain('Academy-authored');
  });

  it('locale-level attribution wins over top-level for EN', async () => {
    const {parseLocalizedScenario, projectScenario} = await import('../src/index.ts');
    const localized = parseLocalizedScenario({
      version: 's01',
      attribution: 'Top-level EN attribution',
      locales: {
        en: {
          title: 'EN title',
          description: 'EN',
          attribution: 'Locale EN attribution',
          steps: [
            {type: 'user_message', content: 'Hi', annotation: 'A'},
            {type: 'assistant_text', content: 'Yo', annotation: 'B'},
          ],
        },
        nl: {
          title: 'NL titel',
          description: 'NL',
          attribution: 'Locale NL attribution',
          steps: [
            {type: 'user_message', content: 'Hoi', annotation: 'A'},
            {type: 'assistant_text', content: 'Hé', annotation: 'B'},
          ],
        },
      },
    });
    expect(projectScenario(localized, 'en').attribution).toBe('Locale EN attribution');
    expect(projectScenario(localized, 'nl').attribution).toBe('Locale NL attribution');
  });

  it('assertScenarioLocaleComplete requires distinct NL attribution', async () => {
    const {parseLocalizedScenario, assertScenarioLocaleComplete} = await import('../src/index.ts');
    const missingNlAttr = parseLocalizedScenario({
      version: 'w5',
      attribution: 'EN only top',
      locales: {
        en: {
          title: 'EN',
          description: 'EN',
          steps: [
            {type: 'user_message', content: 'A', annotation: 'a'},
            {type: 'assistant_text', content: 'B', annotation: 'b'},
          ],
        },
        nl: {
          title: 'NL',
          description: 'NL',
          steps: [
            {type: 'user_message', content: 'X', annotation: 'x'},
            {type: 'assistant_text', content: 'Y', annotation: 'y'},
          ],
        },
      },
    });
    expect(() => assertScenarioLocaleComplete(missingNlAttr)).toThrow(/locales\.nl\.attribution/);
  });
});
