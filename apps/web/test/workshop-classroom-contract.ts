import {expect} from 'vitest';

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

const list = (value: unknown): ReadonlyArray<unknown> => Array.isArray(value) ? value : [];
const text = (value: unknown): string => String(value ?? '').trim();

export const expectWorkshopClassroomContract = (slides: ReadonlyArray<Record<string, unknown>>): void => {
  let previousConceptBot: 'think' | 'point' | undefined;
  for (const [index, slide] of slides.entries()) {
    const title = String(slide.title ?? '');
    const visual = record(slide.visual);
    expect(visual.keynote, title).toBeUndefined();
    expect(text(slide.notes), title).not.toBe('');

    if (slide.type === 'practice') {
      expect(slide.layout, title).toBe('exercise');
      const steps = list(slide.steps);
      expect(steps.length, title).toBeGreaterThanOrEqual(2);
      for (const step of steps) expect(text(step), title).not.toBe('');
      expect(typeof slide.timer, title).toBe('number');
      expect(text(slide.expected), title).not.toBe('');
      expect(list(slide.keyPoints).length, title).toBeGreaterThanOrEqual(3);
      expect(list(slide.keyPoints).length, title).toBeLessThanOrEqual(5);
      expect(slide.check, title).toBeUndefined();
      if (visual.bot !== undefined) {
        expect(visual.bot, title).toBe('point');
        expect(visual.place, title).toBe('beside');
      }
      continue;
    }

    if (slide.type === 'recap') {
      expect(slide.layout, title).toBe('recap');
      const items = list(slide.items);
      expect(items.length, title).toBeGreaterThanOrEqual(3);
      expect(items.length, title).toBeLessThanOrEqual(5);
      for (const item of items) {
        expect(text(record(item).label), title).not.toBe('');
        expect(text(record(item).caption), title).not.toBe('');
      }
      expect(visual.recapKeys, title).toBe(true);
      if (/^tomorrow\b/i.test(title)) {
        expect(visual.bot, title).toBe('point');
        expect(visual.place, title).toBe('beside');
      }
      continue;
    }

    if (slide.type === 'context' || slide.type === 'concept') {
      if (visual.opener === 'showcase') {
        expect(visual.bot, title).toBeUndefined();
        continue;
      }
      const kicker = text(slide.kicker);
      if (slide.type === 'context' || visual.opener === 'welcome' || index === 0) {
        expect(visual.bot, title).toBe('wave');
      } else if (/guardrail/i.test(kicker)) {
        expect(visual.bot, title).toBe('head');
      } else if (/^Bridge\b|^Tomorrow:/i.test(kicker) || /^Tomorrow[’']/i.test(title)) {
        expect(visual.bot, title).toBe('point');
      } else if (slide.type === 'concept') {
        expect(['think', 'point'], title).toContain(visual.bot);
        if (previousConceptBot !== undefined) expect(visual.bot, title).not.toBe(previousConceptBot);
        if (visual.bot === 'think' || visual.bot === 'point') previousConceptBot = visual.bot;
      } else {
        expect(text(visual.bot), title).not.toBe('');
      }
      expect(visual.place, title).toBe('beside');
      expect(text(slide.subtitle), title).toMatch(/[.!?]$/);
      expect(list(slide.keyPoints).length, title).toBeGreaterThanOrEqual(3);
      expect(list(slide.keyPoints).length, title).toBeLessThanOrEqual(5);

      const cards = list(slide.cards);
      const items = list(slide.items);
      const columns = list(slide.columns);
      expect(cards.length + items.length + columns.length, title).toBeGreaterThan(0);
      if (cards.length > 0) {
        expect(cards.length, title).toBeGreaterThanOrEqual(2);
        expect(cards.length, title).toBeLessThanOrEqual(4);
        for (const item of cards) {
          expect(text(record(item).title), title).not.toBe('');
          expect(text(record(item).body), title).not.toBe('');
        }
      }
    }
  }
};
