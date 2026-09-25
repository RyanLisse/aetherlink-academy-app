import {Data} from 'effect';

export class AuthoringUnauthorized extends Data.TaggedError('AuthoringUnauthorized')<{
  readonly message: string;
}> {}

export class AuthoringNotFound extends Data.TaggedError('AuthoringNotFound')<{
  readonly message: string;
}> {}

export class AuthoringInvalid extends Data.TaggedError('AuthoringInvalid')<{
  readonly message: string;
}> {}

export class AuthoringConflict extends Data.TaggedError('AuthoringConflict')<{
  readonly message: string;
}> {}

/** A create attempt was durably started but its upstream outcome is unknown. */
export class DeckCreationBlocked extends Data.TaggedError('DeckCreationBlocked')<{
  readonly message: string;
}> {}

/** Upstream transport failed; a create may still have reached the service. */
export class UpstreamUnavailable extends Data.TaggedError('UpstreamUnavailable')<{
  readonly message: string;
}> {}

/** Upstream request timed out mid-flight: unknown whether it landed. Never auto-retried. */
export class UpstreamUncertain extends Data.TaggedError('UpstreamUncertain')<{
  readonly message: string;
}> {}

/** Upstream answered 2xx but the payload didn't match the documented create-deck/get-deck shape. */
export class UpstreamContractError extends Data.TaggedError('UpstreamContractError')<{
  readonly message: string;
}> {}

export class UpstreamNotFound extends Data.TaggedError('UpstreamNotFound')<{
  readonly message: string;
}> {}

export type AuthoringDomainError =
  | AuthoringUnauthorized
  | AuthoringNotFound
  | AuthoringInvalid
  | AuthoringConflict
  | DeckCreationBlocked
  | UpstreamUnavailable
  | UpstreamUncertain
  | UpstreamContractError
  | UpstreamNotFound;
