/**
 * Notion text is untrusted: it is written by people outside this codebase and
 * later rendered to facilitators and read by agents. The rule is deliberately
 * mechanical so a reviewer can predict every removal:
 *
 * 1. Hidden carriers are deleted: HTML comments, HTML tags, and zero-width or
 *    bidirectional control characters.
 * 2. A line that matches any `injectionPatterns` entry is dropped whole and
 *    reported, never rewritten.
 *
 * Anything else passes through verbatim.
 */
export const injectionPatterns: ReadonlyArray<{readonly id: string; readonly pattern: RegExp}> = [
  {id: 'override-instructions-en', pattern: /\b(ignore|disregard|forget|override)\b.{0,40}\b(previous|prior|above|earlier|all|any)\b.{0,20}\b(instructions?|prompts?|rules?|guidelines?)\b/i},
  {id: 'override-instructions-nl', pattern: /\b(negeer|vergeet|overschrijf)\b.{0,40}\b(vorige|eerdere|bovenstaande|alle)\b.{0,20}\b(instructies?|opdrachten|regels|richtlijnen)\b/i},
  {id: 'prompt-reference', pattern: /\b(system|developer)\s+(prompt|message)\b|\bsysteemprompt\b/i},
  {id: 'role-prefix', pattern: /^\s*(?:[-*>]\s*)?(?:\[[ xX]\]\s*)?(system|assistant|developer)\s*:/i},
  {id: 'persona-reassignment', pattern: /\b(you are now|from now on you are|je bent nu|vanaf nu ben je)\b/i},
];

const hiddenCarriers = [/<!--[\s\S]*?-->/g, /<\/?[a-z][^>]*>/gi, /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g];

export interface SanitizedText {
  readonly text: string;
  readonly dropped: ReadonlyArray<{readonly line: string; readonly rule: string}>;
}

export const sanitizeUntrusted = (input: string): SanitizedText => {
  const unhidden = hiddenCarriers.reduce((text, carrier) => text.replace(carrier, ''), input);
  const dropped: Array<{line: string; rule: string}> = [];
  const kept = unhidden.split('\n').filter((line) => {
    const hit = injectionPatterns.find(({pattern}) => pattern.test(line));
    if (hit) dropped.push({line: line.trim(), rule: hit.id});
    return !hit;
  });
  return {text: kept.join('\n'), dropped};
};
