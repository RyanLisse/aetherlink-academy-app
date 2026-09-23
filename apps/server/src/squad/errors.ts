import {Data} from 'effect';

export class SquadError extends Data.TaggedError('SquadError')<{
  readonly status: number;
  readonly message: string;
}> {}

export const squadFail = (status: number, message: string): SquadError =>
  new SquadError({status, message});
