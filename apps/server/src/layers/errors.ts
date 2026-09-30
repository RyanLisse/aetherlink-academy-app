import {Data} from 'effect';

export class ConfigError extends Data.TaggedError('ConfigError')<{
  readonly key: string;
  readonly message: string;
}> {}

export class PostgresUnreachable extends Data.TaggedError('PostgresUnreachable')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class RedisUnreachable extends Data.TaggedError('RedisUnreachable')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ChildProcessError extends Data.TaggedError('ChildProcessError')<{
  readonly label: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}
