import {Effect, Exit} from 'effect';
import {describe, expect, test} from 'vitest';
import {SquadError} from '../../src/squad/errors.ts';
import {KTD12, MAX_SQUAD_SIZE, MIN_PRACTICE_SIZE} from '../../src/squad/types.ts';
import {runSquad, SquadStore} from '../../src/squad/store.ts';

const proof = {slug: 'test'};

describe('SquadStore (AET-27 room scenarios)', () => {
  test('soft max 12, one driver, rotation preserves document + SDLC', async () => {
    await runSquad(Effect.gen(function* () {
      const store = yield* SquadStore;
      const host = yield* store.create('Test squad', proof);
      for (const name of ['A', 'B', 'C', 'D', 'E']) yield* store.join(host.code, name);
      let ctx = yield* store.auth(host.token);
      yield* store.control(ctx.r, 'mode', 'squad');
      for (const name of ['F', 'G', 'H', 'I', 'J', 'K', 'L']) yield* store.join(host.code, name);
      ctx = yield* store.auth(host.token);
      expect(ctx.r.members.length).toBe(MAX_SQUAD_SIZE);
      expect(Exit.isFailure(yield* Effect.exit(store.join(host.code, 'M')))).toBe(true);
      yield* store.control(ctx.r, 'phase', 'Test');
      const memberToken = (yield* store.join(host.code, 'A')).token;
      const driven = new Set<string>();
      for (let i = 0; i < 5; i++) {
        const auth = yield* store.auth(memberToken);
        const view = yield* store.view(auth.r, auth.s);
        const drivers = (view.members as Array<{role: string | null; id: string}>).filter((m) => m.role === 'Driver');
        expect(drivers).toHaveLength(1);
        driven.add(drivers[0]!.id);
        yield* store.control(auth.r, 'next');
      }
      expect(driven.size).toBe(5);
      ctx = yield* store.auth(host.token);
      expect(ctx.r.phase).toBe('Test');
      expect(ctx.r.proof.slug).toBe('test');
    }));
  });

  test('soft rejoin restores seat and progress', async () => {
    await runSquad(Effect.gen(function* () {
      const store = yield* SquadStore;
      const host = yield* store.create('Rejoin', proof);
      for (const name of ['A', 'B', 'C', 'D']) yield* store.join(host.code, name);
      const first = yield* store.join(host.code, 'Zoe');
      const auth = yield* store.auth(first.token);
      const person = auth.r.members.find((m) => m.name === 'Zoe')!;
      person.quiz = {score: 2, at: 1, day: 1};
      person.route = 'guided';
      person.progressByDay = {'1': {quizScore: 2}};
      yield* store.saveRoom(auth.r);
      const again = yield* store.join(host.code, 'zoe');
      expect(again.rejoined).toBe(true);
      const room = yield* store.getRoom(host.roomId);
      expect(room.members.filter((m) => m.name.toLowerCase() === 'zoe')).toHaveLength(1);
      const againAuth = yield* store.auth(again.token);
      expect(againAuth.p?.id).toBe(person.id);
      expect(againAuth.p?.route).toBe('guided');
      expect(againAuth.p?.quiz?.score).toBe(2);
    }));
  });

  test('shuffle randomizes driver', async () => {
    await runSquad(Effect.gen(function* () {
      const store = yield* SquadStore;
      const host = yield* store.create('Shuffle', proof);
      for (const name of ['A', 'B', 'C', 'D']) yield* store.join(host.code, name);
      let ctx = yield* store.auth(host.token);
      yield* store.control(ctx.r, 'mode', 'squad');
      const seen = new Set<number>([ctx.r.driver]);
      for (let i = 0; i < 40; i++) {
        ctx = yield* store.auth(host.token);
        yield* store.control(ctx.r, 'shuffle');
        seen.add(ctx.r.driver);
      }
      expect(seen.size).toBeGreaterThan(1);
    }));
  });

  test('timer pause/resume/expiry never rotates', async () => {
    await runSquad(Effect.gen(function* () {
      const store = yield* SquadStore;
      const host = yield* store.create('Timer', proof);
      for (const name of ['A', 'B', 'C', 'D', 'E']) yield* store.join(host.code, name);
      const ctx = yield* store.auth(host.token);
      yield* store.control(ctx.r, 'start', undefined, 1000);
      expect(yield* store.remaining(ctx.r, 11_000)).toBe(1490);
      yield* store.control(ctx.r, 'pause', undefined, 11_000);
      expect(yield* store.remaining(ctx.r, 100_000)).toBe(1490);
      yield* store.control(ctx.r, 'start', undefined, 100_000);
      expect(yield* store.remaining(ctx.r, 1_600_000)).toBe(0);
      expect(ctx.r.round).toBe(1);
      expect(ctx.r.driver).toBe(0);
    }));
  });

  test('private diagnostics + separate MCP credentials', async () => {
    await runSquad(Effect.gen(function* () {
      const store = yield* SquadStore;
      const members = [] as Array<{token: string}>;
      const host = yield* store.create('Mcp', proof);
      for (const name of ['A', 'B', 'C', 'D', 'E']) members.push(yield* store.join(host.code, name));
      const a = yield* store.auth(members[0]!.token);
      a.r.members[1]!.quiz = {score: 1, at: 1, day: 1};
      a.r.members[1]!.route = 'guided';
      yield* store.saveRoom(a.r);
      const view = yield* store.view(a.r, a.s);
      expect((view.members as Array<{quiz?: unknown}>)[1]?.quiz).toBeUndefined();
      expect(Exit.isFailure(yield* Effect.exit(store.auth(members[0]!.token, 'mcp')))).toBe(true);
      const mcpToken = yield* store.mintSession(a.r.id, a.p!.id, 'mcp');
      expect((yield* store.auth(mcpToken, 'mcp')).p?.name).toBe('A');
      expect(Exit.isFailure(yield* Effect.exit(store.auth(mcpToken, 'browser')))).toBe(true);
    }));
  });

  test('cannot start practice before four members', async () => {
    await runSquad(Effect.gen(function* () {
      const store = yield* SquadStore;
      const host = yield* store.create('Small', {slug: 's'});
      yield* store.join(host.code, 'A');
      const ctx = yield* store.auth(host.token);
      const exit = yield* Effect.exit(store.control(ctx.r, 'start'));
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const err = exit.cause;
        expect(String(err)).toMatch(new RegExp(String(MIN_PRACTICE_SIZE)));
      }
    }));
  });

  test('facilitator sets remaining time and round duration', async () => {
    await runSquad(Effect.gen(function* () {
      const store = yield* SquadStore;
      const host = yield* store.create('Time', proof);
      for (const name of ['A', 'B', 'C', 'D', 'E']) yield* store.join(host.code, name);
      const ctx = yield* store.auth(host.token);
      yield* store.control(ctx.r, 'start', undefined, 1000);
      yield* store.control(ctx.r, 'time', 600, 2000);
      expect(ctx.r.remaining).toBe(600);
      expect(ctx.r.deadline).toBe(602_000);
      yield* store.control(ctx.r, 'duration', 900);
      yield* store.control(ctx.r, 'next');
      expect(ctx.r.remaining).toBe(900);
    }));
  });

  test('invalid time/duration fail with status 400', async () => {
    await runSquad(Effect.gen(function* () {
      const store = yield* SquadStore;
      const host = yield* store.create('Invalid', proof);
      for (const name of ['A', 'B', 'C', 'D', 'E']) yield* store.join(host.code, name);
      const ctx = yield* store.auth(host.token);
      for (const value of [-1, 7201, 1.5, '600']) {
        const exit = yield* Effect.exit(store.control(ctx.r, 'time', value));
        expect(Exit.isFailure(exit)).toBe(true);
      }
      for (const value of [0, 59, 7201, 1.5, '900']) {
        const exit = yield* Effect.exit(store.control(ctx.r, 'duration', value));
        expect(Exit.isFailure(exit)).toBe(true);
      }
    }));
  });

  test('facilitator can attach a second session', async () => {
    await runSquad(Effect.gen(function* () {
      const store = yield* SquadStore;
      const host = yield* store.create('Attach', proof);
      for (const name of ['A', 'B', 'C', 'D', 'E']) yield* store.join(host.code, name);
      const attached = yield* store.attachFacilitator(host.roomId);
      expect(attached.token).not.toBe(host.token);
      expect(attached.roomId).toBe(host.roomId);
      const auth = yield* store.auth(attached.token, 'browser');
      expect(auth.s.personId).toBe('facilitator');
      const view = yield* store.view(auth.r, auth.s);
      expect((view.me as {role: string}).role).toBe('Facilitator');
      expect(Exit.isFailure(yield* Effect.exit(store.attachFacilitator('unknown-room')))).toBe(true);
    }));
  });

  test('overview newest first with roles and evidence counts', async () => {
    await runSquad(Effect.gen(function* () {
      const store = yield* SquadStore;
      const first = yield* store.create('First squad', {slug: 'first'});
      const second = yield* store.create('Second squad', {slug: 'second'});
      for (const name of ['A', 'B', 'C', 'D']) yield* store.join(first.code, name);
      for (const name of ['E', 'F', 'G', 'H']) yield* store.join(second.code, name);
      const firstRoom = (yield* store.auth(first.token)).r;
      const secondRoom = (yield* store.auth(second.token)).r;
      yield* store.control(firstRoom, 'mode', 'squad');
      yield* store.control(secondRoom, 'mode', 'squad');
      firstRoom.createdAt = 1000;
      secondRoom.createdAt = 2000;
      secondRoom.driver = 1;
      firstRoom.evidence.push({id: 'e1'});
      secondRoom.evidence.push({id: 'e2'}, {id: 'e3'});
      yield* store.saveRoom(firstRoom);
      yield* store.saveRoom(secondRoom);
      const rooms = yield* store.overview();
      expect(rooms.map((r) => r.name)).toEqual(['Second squad', 'First squad']);
      expect((rooms[0]!.members as Array<{role: string}>).map((m) => m.role)).toEqual([
        'Navigator', 'Driver', 'Navigator', 'Navigator',
      ]);
      expect(rooms[0]!.evidence).toBe(2);
      expect(rooms[1]!.evidence).toBe(1);
    }));
  });

  test('KTD12: same display name in two rooms never shares progress', async () => {
    await runSquad(Effect.gen(function* () {
      const store = yield* SquadStore;
      const roomA = yield* store.create('Room A', {slug: 'a'});
      const roomB = yield* store.create('Room B', {slug: 'b'});
      const joinA = yield* store.join(roomA.code, 'Alex');
      const joinB = yield* store.join(roomB.code, 'Alex');
      const authA = yield* store.auth(joinA.token);
      const authB = yield* store.auth(joinB.token);
      authA.p!.progressByDay = {'1': {quizScore: 99, route: 'guided'}};
      authA.p!.route = 'guided';
      yield* store.saveRoom(authA.r);
      expect(authA.p!.id).not.toBe(authB.p!.id);
      expect(authB.p!.progressByDay).toEqual({});
      expect(authB.p!.route).toBe('standard');
      expect(KTD12.toLowerCase()).toMatch(/never|only/);
    }));
  });

  test('roles hidden unless mode is squad', async () => {
    await runSquad(Effect.gen(function* () {
      const store = yield* SquadStore;
      const host = yield* store.create('Modes', proof);
      for (const name of ['A', 'B', 'C', 'D']) yield* store.join(host.code, name);
      const ctx = yield* store.auth(host.token);
      const lessonView = yield* store.view(ctx.r, ctx.s);
      expect((lessonView.members as Array<{role: string | null}>).every((m) => m.role == null)).toBe(true);
      yield* store.control(ctx.r, 'mode', 'squad');
      const squadView = yield* store.view(ctx.r, ctx.s);
      expect((squadView.members as Array<{role: string | null}>).filter((m) => m.role === 'Driver')).toHaveLength(1);
    }));
  });
});
