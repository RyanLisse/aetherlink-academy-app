import {Context, Effect, Layer, Ref} from 'effect';
import {applyControl, remainingSeconds, roleForIndex} from './control.ts';
import {hashToken, mintSecret, newId, newRoomCode} from './crypto.ts';
import {SquadError, squadFail} from './errors.ts';
import {
  KTD12,
  MAX_SQUAD_SIZE,
  ONLINE_MS,
  SESSION_TTL_MS,
  type AuthContext,
  type CreateResult,
  type CreatedBy,
  type JoinResult,
  type Member,
  type Room,
  type RoomProof,
  type SessionKind,
  type SessionRecord,
} from './types.ts';

export {KTD12, remainingSeconds, roleForIndex, SquadError};

export interface SquadStoreShape {
  readonly create: (name: string, proof: RoomProof, createdBy?: CreatedBy | null) => Effect.Effect<CreateResult, SquadError>;
  readonly join: (code: string, name: string) => Effect.Effect<JoinResult, SquadError>;
  readonly auth: (token: string, kind?: SessionKind) => Effect.Effect<AuthContext, SquadError>;
  readonly control: (room: Room, action: string, value?: unknown, now?: number) => Effect.Effect<void, SquadError>;
  readonly view: (room: Room, session: SessionRecord) => Effect.Effect<Record<string, unknown>>;
  readonly overview: () => Effect.Effect<ReadonlyArray<Record<string, unknown>>>;
  readonly attachFacilitator: (roomId: string, displayName?: string) => Effect.Effect<CreateResult, SquadError>;
  readonly remaining: (room: Room, now?: number) => Effect.Effect<number>;
  readonly mintSession: (roomId: string, personId: string, kind: SessionKind, displayName?: string) => Effect.Effect<string>;
  readonly revokeSessions: (roomId: string, personId: string, kind: SessionKind) => Effect.Effect<number>;
  readonly touchPresence: (personId: string, at?: number) => Effect.Effect<void>;
  readonly getRoom: (roomId: string) => Effect.Effect<Room, SquadError>;
  readonly saveRoom: (room: Room) => Effect.Effect<void>;
}

export class SquadStore extends Context.Service<SquadStore, SquadStoreShape>()('@academy/server/SquadStore') {}

interface State {
  rooms: Map<string, Room>;
  sessions: Map<string, SessionRecord>;
  live: Map<string, number>;
}

const blank = (): State => ({rooms: new Map(), sessions: new Map(), live: new Map()});

const makeMember = (name: string): Member => ({
  id: newId(), name, help: false, quiz: null, route: 'standard', progressByDay: {}, lastMcp: null,
});

const makeRoom = (name: string, proof: RoomProof, createdBy: CreatedBy | null): Room => ({
  id: newId(), code: newRoomCode(), name, proof, createdBy, createdAt: Date.now(),
  roundSeconds: 1500, members: [], driver: 0, round: 1, phase: 'Plan', day: 1, mode: 'lesson',
  running: false, remaining: 1500, deadline: null, evidence: [], handoffs: [], version: 1,
});

export const SquadStoreMemory = (): Layer.Layer<SquadStore> =>
  Layer.effect(SquadStore, Effect.gen(function* () {
    const state = yield* Ref.make(blank());

    const mintSession = (roomId: string, personId: string, kind: SessionKind, displayName?: string) =>
      Effect.gen(function* () {
        const token = mintSecret();
        const record: SessionRecord = {
          roomId, personId, kind, expiresAt: Date.now() + SESSION_TTL_MS,
          ...(displayName !== undefined ? {displayName} : {}),
        };
        yield* Ref.update(state, (s) => {
          const sessions = new Map(s.sessions);
          sessions.set(hashToken(token), record);
          return {...s, sessions};
        });
        return token;
      });

    const getRoom = (roomId: string) => Effect.gen(function* () {
      const s = yield* Ref.get(state);
      const room = s.rooms.get(roomId);
      if (!room) return yield* Effect.fail(squadFail(404, 'Kamer bestaat niet.'));
      return room;
    });

    const saveRoom = (room: Room) => Ref.update(state, (s) => {
      const rooms = new Map(s.rooms);
      rooms.set(room.id, room);
      return {...s, rooms};
    });

    const shape: SquadStoreShape = {
      mintSession, getRoom, saveRoom,
      touchPresence: (personId, at = Date.now()) => Ref.update(state, (s) => {
        const live = new Map(s.live); live.set(personId, at); return {...s, live};
      }),
      revokeSessions: (roomId, personId, kind) => Effect.gen(function* () {
        let removed = 0;
        yield* Ref.update(state, (s) => {
          const sessions = new Map(s.sessions);
          for (const [key, session] of sessions) {
            if (session.roomId === roomId && session.personId === personId && session.kind === kind) {
              sessions.delete(key); removed++;
            }
          }
          return {...s, sessions};
        });
        return removed;
      }),
      create: (name, proof, createdBy = null) => Effect.gen(function* () {
        const room = makeRoom(name, proof, createdBy);
        yield* saveRoom(room);
        const token = yield* mintSession(room.id, 'facilitator', 'browser', createdBy?.name);
        return {token, roomId: room.id, code: room.code};
      }),
      join: (code, name) => Effect.gen(function* () {
        const s = yield* Ref.get(state);
        const room = [...s.rooms.values()].find((r) => r.code === code.toUpperCase());
        if (!room) return yield* Effect.fail(squadFail(404, 'Kamercode niet gevonden.'));
        const existing = room.members.find((m) => m.name.toLowerCase() === name.toLowerCase());
        if (existing) {
          const token = yield* mintSession(room.id, existing.id, 'browser');
          return {token, roomId: room.id, rejoined: true};
        }
        if (room.members.length >= MAX_SQUAD_SIZE) {
          return yield* Effect.fail(squadFail(409, `Squad is vol (maximaal ${MAX_SQUAD_SIZE}).`));
        }
        const member = makeMember(name);
        room.members.push(member); room.version++;
        yield* saveRoom(room);
        const token = yield* mintSession(room.id, member.id, 'browser');
        return {token, roomId: room.id};
      }),
      auth: (token, kind) => Effect.gen(function* () {
        const s = yield* Ref.get(state);
        const session = s.sessions.get(hashToken(token || ''));
        if (!session || session.expiresAt < Date.now() || (kind && session.kind !== kind)) {
          return yield* Effect.fail(squadFail(401, 'Geen geldige toegang. Meld je opnieuw aan.'));
        }
        const room = s.rooms.get(session.roomId);
        if (!room) return yield* Effect.fail(squadFail(401, 'Kamer bestaat niet.'));
        return {s: session, r: room, p: room.members.find((m) => m.id === session.personId)};
      }),
      control: (room, action, value, now = Date.now()) =>
        Effect.try({
          try: () => { applyControl(room, action, value, now); },
          catch: (e) => (e instanceof SquadError ? e : squadFail(500, String(e))),
        }).pipe(Effect.andThen(saveRoom(room))),
      remaining: (room, now = Date.now()) => Effect.succeed(remainingSeconds(room, now)),
      attachFacilitator: (roomId, displayName) => Effect.gen(function* () {
        const room = yield* getRoom(roomId);
        const token = yield* mintSession(room.id, 'facilitator', 'browser', displayName);
        return {token, roomId: room.id, code: room.code};
      }),
      view: (room, session) => Effect.gen(function* () {
        const s = yield* Ref.get(state);
        const online = (id: string) => (s.live.get(id) || 0) > Date.now() - ONLINE_MS;
        const members = room.members.map((m, i) => ({
          id: m.id, name: m.name, role: roleForIndex(room, i), online: online(m.id), help: m.help,
          ...(session.personId === 'facilitator' ? {quiz: m.quiz, route: m.route} : {}),
        }));
        const me = session.personId === 'facilitator'
          ? {id: 'facilitator', name: session.displayName || 'Facilitator', role: 'Facilitator' as const}
          : (() => {
              const idx = room.members.findIndex((m) => m.id === session.personId);
              const member = room.members[idx];
              return member ? {...member, role: roleForIndex(room, idx)} : {id: session.personId, name: '?', role: null};
            })();
        return {
          id: room.id, name: room.name, code: room.code, round: room.round, phase: room.phase,
          day: room.day, mode: room.mode, running: room.running, remaining: remainingSeconds(room),
          roundSeconds: room.roundSeconds || 1500, serverTime: Date.now(), deadline: room.deadline,
          version: room.version, documentSlug: room.proof.slug, members, me,
          evidence: room.evidence, handoffs: room.handoffs,
        };
      }),
      overview: () => Effect.gen(function* () {
        const s = yield* Ref.get(state);
        const online = (id: string) => (s.live.get(id) || 0) > Date.now() - ONLINE_MS;
        return [...s.rooms.values()]
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
          .map((r) => ({
            id: r.id, name: r.name, code: r.code, createdBy: r.createdBy || null, createdAt: r.createdAt || null,
            round: r.round, phase: r.phase, day: r.day, mode: r.mode, running: r.running,
            remaining: remainingSeconds(r), roundSeconds: r.roundSeconds || 1500,
            driver: r.members[r.driver]?.name || null,
            members: r.members.map((m, i) => ({
              id: m.id, name: m.name,
              role: roleForIndex(r, i) ?? (r.mode === 'squad' ? 'Navigator' : null),
              online: online(m.id), help: m.help, lastMcp: m.lastMcp || null,
            })),
            evidence: r.evidence.length, handoffs: r.handoffs.length,
          }));
      }),
    };
    return shape;
  }));

export const runSquad = <A, E = never>(effect: Effect.Effect<A, E, SquadStore>): Promise<A> =>
  Effect.runPromise(Effect.provide(effect, SquadStoreMemory()));
