import {createHash} from 'node:crypto';

/** Deterministic UUID v5-ish from a string seed (for stable content ids across reimports). */
export const stableUuid = (seed: string): string => {
  const h = createHash('sha256').update(seed).digest('hex');
  const timeHi = `5${h.slice(12, 15)}`;
  const clock = `${((Number.parseInt(h.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0')}${h.slice(18, 20)}`;
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${timeHi}-${clock}-${h.slice(20, 32)}`;
};
