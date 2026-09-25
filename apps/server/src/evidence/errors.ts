import {Data} from 'effect';

export class EvidenceError extends Data.TaggedError('EvidenceError')<{
  readonly status: number;
  readonly message: string;
}> {}

export const evidenceFail = (status: number, message: string): EvidenceError =>
  new EvidenceError({status, message});
