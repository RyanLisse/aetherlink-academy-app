/** Runtime live-sync state (Redis source of truth). PG tables snapshot a subset for restart recovery. */

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
  /** Curriculum revision the room is presenting; participants record viewedRevision for KTD5. */
  readonly revision: number | null;
}

export interface FollowLiveState {
  readonly roomId: string;
  readonly participantId: string;
  readonly displayName: string;
  readonly following: boolean;
  readonly ownIndex: number;
  readonly lastSeenAt: string;
  /** Revision the participant last accepted (KTD5 / AE1). */
  readonly viewedRevision: number | null;
  readonly evidenceSubmitted: boolean;
}

export interface PresenceSnapshot {
  readonly following: ReadonlyArray<{readonly id: string; readonly name: string}>;
  readonly detached: ReadonlyArray<{readonly id: string; readonly name: string}>;
  readonly evidence: ReadonlyArray<{readonly id: string; readonly name: string}>;
}

export type LiveEvent =
  | {readonly type: 'presenter'; readonly state: PresenterLiveState}
  | {readonly type: 'follow'; readonly state: FollowLiveState}
  | {readonly type: 'presence'; readonly presence: PresenceSnapshot}
  | {readonly type: 'notice'; readonly notice: string; readonly participantId?: string}
  | {readonly type: 'everyoneBackToFollow'; readonly notice: string}
  | {readonly type: 'snapshot'; readonly presenter: PresenterLiveState; readonly follow: FollowLiveState | null; readonly presence: PresenceSnapshot};

export const defaultPresenter = (roomId: string): PresenterLiveState => ({
  roomId,
  lesson: null,
  slideIndex: 0,
  revealStep: -1,
  timerStartedAt: null,
  timerMinutes: null,
  planB: false,
  pauseUntil: null,
  updatedAt: new Date().toISOString(),
  revision: null,
});

export const defaultFollow = (roomId: string, participantId: string, displayName: string): FollowLiveState => ({
  roomId,
  participantId,
  displayName,
  following: true,
  ownIndex: 0,
  lastSeenAt: new Date().toISOString(),
  viewedRevision: null,
  evidenceSubmitted: false,
});

/** Timer remaining in whole seconds from server timestamps (reconnect-safe). */
export const timerRemainingSeconds = (state: PresenterLiveState, nowMs = Date.now()): number | null => {
  if (state.timerStartedAt == null || state.timerMinutes == null) return null;
  if (state.pauseUntil != null) {
    const pauseMs = Date.parse(state.pauseUntil);
    if (Number.isFinite(pauseMs) && pauseMs > nowMs) return null;
  }
  const started = Date.parse(state.timerStartedAt);
  if (!Number.isFinite(started)) return null;
  const total = state.timerMinutes * 60;
  const elapsed = Math.floor((nowMs - started) / 1000);
  return Math.max(0, total - elapsed);
};
