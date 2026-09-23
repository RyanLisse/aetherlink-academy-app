/** Mirrored from server live types — keep fields in sync for the follow UI. */
export interface PresenterLiveState {
  readonly roomId: string;
  readonly lesson: string | null;
  readonly slideIndex: number;
  readonly revealStep: number;
  readonly timerStartedAt: string | null;
  readonly timerMinutes: number | null;
  readonly planB: boolean;
  readonly pauseUntil: string | null;
  readonly updatedAt: string;
  readonly revision: number | null;
}

export interface FollowLiveState {
  readonly roomId: string;
  readonly participantId: string;
  readonly displayName: string;
  readonly following: boolean;
  readonly ownIndex: number;
  readonly lastSeenAt: string;
  readonly viewedRevision: number | null;
  readonly evidenceSubmitted: boolean;
}

export interface PresenceSnapshot {
  readonly following: ReadonlyArray<{readonly id: string; readonly name: string}>;
  readonly detached: ReadonlyArray<{readonly id: string; readonly name: string}>;
  readonly evidence: ReadonlyArray<{readonly id: string; readonly name: string}>;
}

export type LiveEvent =
  | {readonly type: 'presenter'; readonly state: PresenterLiveState; readonly timerRemaining?: number | null}
  | {readonly type: 'follow'; readonly state: FollowLiveState}
  | {readonly type: 'presence'; readonly presence: PresenceSnapshot}
  | {readonly type: 'notice'; readonly notice: string; readonly participantId?: string}
  | {readonly type: 'everyoneBackToFollow'; readonly notice: string}
  | {
      readonly type: 'snapshot';
      readonly presenter: PresenterLiveState;
      readonly follow: FollowLiveState | null;
      readonly presence: PresenceSnapshot;
      readonly timerRemaining?: number | null;
    };
