import {Cause, Duration, Effect} from 'effect';

export type Dependency = 'postgres' | 'redis';

export interface ProbeReachable {
  readonly reachable: true;
  readonly latencyMs: number;
  readonly checkedAt: string;
  readonly error: null;
}

export interface ProbeUnreachable {
  readonly reachable: false;
  readonly latencyMs: number;
  readonly checkedAt: string;
  readonly error: string;
}

export type Probe = ProbeReachable | ProbeUnreachable;

export interface ConnectionReport {
  readonly postgres: Probe;
  readonly redis: Probe;
  readonly checkedAt: string;
}

export interface HealthReport {
  readonly ok: boolean;
  readonly revision: string | null;
}

export const PROBE_TIMEOUT: Duration.Duration = Duration.seconds(2);

const redact = (text: string): string => text.replace(/[a-z][a-z0-9+.-]*:\/\/[^\s'"]*@/gi, '<redacted-url>@').replace(/password=[^\s&'"]*/gi, 'password=<redacted>');

export const describeError = (error: unknown): string => redact(describeErrorRaw(error));

const describeErrorRaw = (error: unknown): string => {
  if (error instanceof Cause.TimeoutError) return 'timeout';
  if (error && typeof error === 'object') {
    const record = error as {_tag?: unknown; message?: unknown; cause?: unknown};
    const tag = typeof record._tag === 'string' ? record._tag : undefined;
    const message = typeof record.message === 'string' && record.message !== '' ? record.message : undefined;
    if (tag && message) return `${tag}: ${message}`;
    if (message) return message;
    if (tag) return tag;
    if (record.cause !== undefined) return describeErrorRaw(record.cause);
  }
  if (error instanceof Error) return error.message;
  return String(error);
};

export const probe = <E>(check: Effect.Effect<unknown, E>, timeout: Duration.Duration = PROBE_TIMEOUT): Effect.Effect<Probe> =>
  Effect.gen(function* () {
    const started = performance.now();
    const checkedAt = new Date().toISOString();
    const outcome = yield* check.pipe(Effect.timeout(timeout), Effect.result);
    const latencyMs = Math.round(performance.now() - started);
    if (outcome._tag === 'Success') return {reachable: true, latencyMs, checkedAt, error: null};
    return {reachable: false, latencyMs, checkedAt, error: describeError(outcome.failure)};
  });
