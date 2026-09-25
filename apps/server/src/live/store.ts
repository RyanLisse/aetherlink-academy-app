import {Context, Effect, Layer, PubSub, Ref, Stream} from 'effect';
import {
  defaultFollow,
  defaultPresenter,
  type FollowLiveState,
  type LiveEvent,
  type PresenceSnapshot,
  type PresenterLiveState,
} from './types.ts';

export interface LiveStoreShape {
  readonly getPresenter: (roomId: string) => Effect.Effect<PresenterLiveState>;
  readonly setPresenter: (state: PresenterLiveState) => Effect.Effect<PresenterLiveState>;
  readonly updatePresenter: (
    roomId: string,
    update: (current: PresenterLiveState) => PresenterLiveState,
  ) => Effect.Effect<PresenterLiveState>;
  readonly getFollow: (roomId: string, participantId: string) => Effect.Effect<FollowLiveState>;
  readonly upsertFollow: (state: FollowLiveState) => Effect.Effect<FollowLiveState>;
  readonly listFollows: (roomId: string) => Effect.Effect<ReadonlyArray<FollowLiveState>>;
  readonly presence: (roomId: string) => Effect.Effect<PresenceSnapshot>;
  readonly publish: (roomId: string, event: LiveEvent) => Effect.Effect<void>;
  readonly subscribe: (roomId: string) => Stream.Stream<LiveEvent>;
  /** Optional durable snapshot hook (Postgres). Best-effort; never blocks live path. */
  readonly onSnapshot?: (roomId: string, presenter: PresenterLiveState, follows: ReadonlyArray<FollowLiveState>) => Effect.Effect<void>;
}

export class LiveStore extends Context.Service<LiveStore, LiveStoreShape>()('@academy/server/LiveStore') {}

interface RoomBucket {
  presenter: PresenterLiveState;
  follows: Map<string, FollowLiveState>;
  bus: PubSub.PubSub<LiveEvent>;
}

const presenceFrom = (follows: ReadonlyArray<FollowLiveState>): PresenceSnapshot => ({
  following: follows.filter((f) => f.following).map((f) => ({id: f.participantId, name: f.displayName})),
  detached: follows.filter((f) => !f.following).map((f) => ({id: f.participantId, name: f.displayName})),
  evidence: follows.filter((f) => f.evidenceSubmitted).map((f) => ({id: f.participantId, name: f.displayName})),
});

/**
 * In-process live store (tests + single-node). RedisLive wraps the same API
 * with Redis hashes + pub/sub when `ACADEMY_LIVE_BACKEND=redis`.
 */
export const LiveStoreMemory = (onSnapshot?: LiveStoreShape['onSnapshot']): Layer.Layer<LiveStore> =>
  Layer.effect(
    LiveStore,
    Effect.gen(function* () {
      const rooms = yield* Ref.make(new Map<string, RoomBucket>());

      const ensure = (roomId: string): Effect.Effect<RoomBucket> =>
        Effect.gen(function* () {
          const map = yield* Ref.get(rooms);
          const existing = map.get(roomId);
          if (existing) return existing;
          const bus = yield* PubSub.unbounded<LiveEvent>();
          const bucket: RoomBucket = {presenter: defaultPresenter(roomId), follows: new Map(), bus};
          yield* Ref.update(rooms, (m) => {
            const next = new Map(m);
            next.set(roomId, bucket);
            return next;
          });
          return bucket;
        });

      const snapshotHook = (roomId: string, bucket: RoomBucket): Effect.Effect<void> =>
        onSnapshot
          ? onSnapshot(roomId, bucket.presenter, [...bucket.follows.values()]).pipe(Effect.ignore)
          : Effect.void;

      const shape: LiveStoreShape = {
        getPresenter: (roomId) => ensure(roomId).pipe(Effect.map((b) => b.presenter)),
        setPresenter: (state) =>
          Effect.gen(function* () {
            const bucket = yield* ensure(state.roomId);
            bucket.presenter = {...state, updatedAt: new Date().toISOString()};
            yield* PubSub.publish(bucket.bus, {type: 'presenter', state: bucket.presenter});
            yield* snapshotHook(state.roomId, bucket);
            return bucket.presenter;
          }),
        updatePresenter: (roomId, update) =>
          Effect.gen(function* () {
            const bucket = yield* ensure(roomId);
            bucket.presenter = {...update(bucket.presenter), updatedAt: new Date().toISOString()};
            yield* PubSub.publish(bucket.bus, {type: 'presenter', state: bucket.presenter});
            yield* snapshotHook(roomId, bucket);
            return bucket.presenter;
          }),
        getFollow: (roomId, participantId) =>
          Effect.gen(function* () {
            const bucket = yield* ensure(roomId);
            return bucket.follows.get(participantId) ?? defaultFollow(roomId, participantId, participantId);
          }),
        upsertFollow: (state) =>
          Effect.gen(function* () {
            const bucket = yield* ensure(state.roomId);
            const next = {...state, lastSeenAt: new Date().toISOString()};
            bucket.follows.set(state.participantId, next);
            yield* PubSub.publish(bucket.bus, {type: 'follow', state: next});
            yield* PubSub.publish(bucket.bus, {type: 'presence', presence: presenceFrom([...bucket.follows.values()])});
            yield* snapshotHook(state.roomId, bucket);
            return next;
          }),
        listFollows: (roomId) => ensure(roomId).pipe(Effect.map((b) => [...b.follows.values()])),
        presence: (roomId) => ensure(roomId).pipe(Effect.map((b) => presenceFrom([...b.follows.values()]))),
        publish: (roomId, event) =>
          Effect.gen(function* () {
            const bucket = yield* ensure(roomId);
            yield* PubSub.publish(bucket.bus, event);
          }),
        subscribe: (roomId) =>
          Stream.unwrap(
            ensure(roomId).pipe(Effect.map((bucket) => Stream.fromPubSub(bucket.bus))),
          ),
        ...(onSnapshot ? {onSnapshot} : {}),
      };
      return shape;
    }),
  );
