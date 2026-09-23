import {Data} from 'effect';

export class ReleaseError extends Data.TaggedError('ReleaseError')<{
  readonly status: number;
  readonly message: string;
}> {}

export const releaseFail = (status: number, message: string): ReleaseError =>
  new ReleaseError({status, message});
