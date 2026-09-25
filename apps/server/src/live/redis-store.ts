import {Redis as IORedis} from 'ioredis';
import {Effect, Layer} from 'effect';
import {LiveStore, LiveStoreMemory, type LiveStoreShape} from './store.ts';
import type {FollowLiveState, PresenterLiveState} from './types.ts';

const presenterKey = (roomId: string) => `academy:live:${roomId}:presenter`;
const followKey = (roomId: string, participantId: string) => `academy:live:${roomId}:follow:${participantId}`;
const followIndexKey = (roomId: string) => `academy:live:${roomId}:follows`;
const channelKey = (roomId: string) => `academy:live:${roomId}:events`;

/** Persist room state to Redis and publish a fan-out hint (best-effort). */
export const makeRedisSnapshot = (client: IORedis): NonNullable<LiveStoreShape['onSnapshot']> => {
  return (roomId, presenter, follows) =>
    Effect.tryPromise({
      try: async () => {
        const multi = client.multi();
        multi.set(presenterKey(roomId), JSON.stringify(presenter));
        multi.del(followIndexKey(roomId));
        for (const follow of follows) {
          multi.set(followKey(roomId, follow.participantId), JSON.stringify(follow));
          multi.sadd(followIndexKey(roomId), follow.participantId);
        }
        await multi.exec();
        await client.publish(channelKey(roomId), JSON.stringify({type: 'presenter', state: presenter}));
      },
      catch: (error) => error as Error,
    }).pipe(Effect.ignore);
};

/**
 * Prefer Redis snapshotting when the URL is reachable; otherwise plain memory.
 * In-process PubSub still drives Effect Stream to local WS/SSE clients.
 */
export const LiveStoreLive = (redisUrl: string | null): Layer.Layer<LiveStore> => {
  if (!redisUrl) return LiveStoreMemory();
  return Layer.unwrap(
    Effect.promise(async () => {
      const client = new IORedis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 1500,
        enableOfflineQueue: false,
      });
      client.on('error', () => {});
      try {
        await client.connect();
        await client.ping();
        return LiveStoreMemory(makeRedisSnapshot(client));
      } catch {
        try {
          client.disconnect();
        } catch {
          /* ignore */
        }
        return LiveStoreMemory();
      }
    }),
  );
};

export type {PresenterLiveState, FollowLiveState};
