export type SquadRole = 'Driver' | 'Navigator' | 'Facilitator' | null;

export interface SquadMemberView {
  readonly id: string;
  readonly name: string;
  readonly role: SquadRole;
  readonly online?: boolean;
  readonly help?: boolean;
}

export interface SquadRoomView {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly mode: string;
  readonly members: ReadonlyArray<SquadMemberView>;
  readonly me: {readonly id: string; readonly name: string; readonly role: SquadRole | 'Facilitator'};
}
