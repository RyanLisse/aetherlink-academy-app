import type {ImportedGuardrailPage} from './export.ts';

export const GUARDRAILS_START = '<!-- notion-import:guardrails:start -->';
export const GUARDRAILS_END = '<!-- notion-import:guardrails:end -->';

export class ManualMarkersMissing extends Error {}

const renderPage = (page: ImportedGuardrailPage): string =>
  [
    `### ${page.title}`,
    '',
    `Bron: [Notion-pagina](${page.source.pageUrl}), opgehaald ${page.source.retrievedAt}.`,
    '',
    ...page.items.map((item) => `- ${item}`),
  ].join('\n');

export const renderGuardrails = (pages: readonly ImportedGuardrailPage[]): string => {
  const withItems = pages.filter((page) => page.items.length > 0);
  if (withItems.length === 0) return '_Nog niet geïmporteerd. Deze sectie wordt gevuld door de eenmalige Notion-import._';
  return [...withItems].sort((a, b) => a.title.localeCompare(b.title)).map(renderPage).join('\n\n');
};

/** Replace only the text between the markers, so the hand-written rest of the manual is never touched. */
export const spliceGuardrails = (manual: string, pages: readonly ImportedGuardrailPage[]): {readonly text: string; readonly changed: boolean} => {
  const start = manual.indexOf(GUARDRAILS_START);
  const end = manual.indexOf(GUARDRAILS_END);
  if (start < 0 || end < start) throw new ManualMarkersMissing(`facilitator manual lacks ${GUARDRAILS_START} ... ${GUARDRAILS_END}`);
  const text = `${manual.slice(0, start + GUARDRAILS_START.length)}\n${renderGuardrails(pages)}\n${manual.slice(end)}`;
  return {text, changed: text !== manual};
};
