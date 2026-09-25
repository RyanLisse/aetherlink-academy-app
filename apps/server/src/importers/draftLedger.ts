import {contentHashSlides} from './contentHash.ts';
import type {Slide} from '@academy/schema';

export interface DraftRecord {
  readonly version: number;
  readonly contentHash: string;
  readonly status: 'draft';
}

/**
 * In-process draft ledger for idempotent imports.
 * Reimporting the same content hash does not create a second draft version.
 * Postgres-backed writeDraft can replace this later without changing the CLI contract.
 */
export class DraftLedger {
  private readonly byCourse = new Map<string, DraftRecord[]>();

  list(courseId: string): ReadonlyArray<DraftRecord> {
    return this.byCourse.get(courseId) ?? [];
  }

  writeDraft(courseId: string, slides: ReadonlyArray<Slide>): {readonly version: number; readonly unchanged: boolean; readonly contentHash: string} {
    const contentHash = contentHashSlides(slides);
    const existing = [...(this.byCourse.get(courseId) ?? [])];
    const latest = existing.at(-1);
    if (latest && latest.contentHash === contentHash) {
      return {version: latest.version, unchanged: true, contentHash};
    }
    const version = (latest?.version ?? 0) + 1;
    existing.push({version, contentHash, status: 'draft'});
    this.byCourse.set(courseId, existing);
    return {version, unchanged: false, contentHash};
  }
}
