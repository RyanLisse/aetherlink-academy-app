/** Squad runtime types. Driver/Navigator only when room.mode === 'squad'. */

export const MAX_SQUAD_SIZE = 12;
export const MIN_PRACTICE_SIZE = 4;
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
export const ONLINE_MS = 12_000;

export type SessionKind = 'browser' | 'mcp';
export type RoomPhase = 'Plan' | 'Design' | 'Build' | 'Test' | 'Deploy' | 'Maintain';
export type RoomMode = 'lesson' | 'solo' | 'squad' | 'review';
export type ConnectionState = 'configured' | 'connected' | 'verified';

export interface DayProgress {
  readonly route?: string;
  readonly quizScore?: number;
  readonly quizAt?: number;
}

export interface Member {
  readonly id: string;
  name: string;
  help: boolean;
  quiz: {score: number; at: number; day: number} | null;
  route: string;
  progressByDay: Record<string, DayProgress>;
  lastMcp: number | null;
}

export interface RoomProof {
  readonly slug: string;
  readonly [key: string]: unknown;
}

export interface CreatedBy {
  readonly name?: string;
  readonly email?: string;
  readonly sub?: string;
}

export interface Room {
  readonly id: string;
  readonly code: string;
  name: string;
  proof: RoomProof;
  createdBy: CreatedBy | null;
  createdAt: number;
  roundSeconds: number;
  members: Member[];
  driver: number;
  round: number;
  phase: RoomPhase;
  day: number;
  mode: RoomMode;
  running: boolean;
  remaining: number;
  deadline: number | null;
  evidence: Array<Record<string, unknown>>;
  handoffs: Array<Record<string, unknown>>;
  version: number;
}

export interface SessionRecord {
  readonly roomId: string;
  readonly personId: string;
  readonly kind: SessionKind;
  readonly displayName?: string;
  readonly expiresAt: number;
}

export interface AuthContext {
  readonly s: SessionRecord;
  readonly r: Room;
  readonly p: Member | undefined;
}

export interface CreateResult {
  readonly token: string;
  readonly roomId: string;
  readonly code: string;
}

export interface JoinResult {
  readonly token: string;
  readonly roomId: string;
  readonly rejoined?: boolean;
}

/** KTD12 — display-name rejoin is room-scoped convenience, never cross-room auth. */
export const KTD12 =
  'Display-name matching is convenience for rejoin inside one room only; it never authorizes attaching private data across rooms or to a new email identity.';
