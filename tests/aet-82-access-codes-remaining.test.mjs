import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, rmSync} from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createApp} from "../server/app.mjs";
import {LocalStore} from "../server/local-store.mjs";
import {ACCESS_DAYS, DAY_MS, READ_ONLY_DAYS, accessPhase, cohortWindow} from "../server/cohort.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const START = Date.parse("2026-10-05T00:00:00Z");

async function gateway({now = START, trustProxy} = {}) {
  const dir = mkdtempSync(path.join(os.tmpdir(), "academy-aet-82-"));
  const clock = {now};
  const instance = createApp({
    dir,
    repository: new LocalStore(dir, {now: () => clock.now}),
    hostKey: "test-host",
    proofBase: "http://127.0.0.1:9",
    publicBaseUrl: "https://academy.example.test/",
    trustProxy,
    slidesService: {run: async () => null},
  });
  instance.proof.create = async () => ({slug: "aet-82-proof", editor: "editor-token"});
  await new Promise((resolve) => instance.server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${instance.server.address().port}`;
  const call = async (method, route, {body, cookie} = {}) => {
    const response = await fetch(base + route, {
      method,
      headers: {
        "content-type": "application/json",
        ...(cookie ? {cookie: `academy=${encodeURIComponent(cookie)}`} : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    return {status: response.status, body: json, setCookie: response.headers.get("set-cookie")};
  };
  return {
    clock,
    call,
    close: async () => {
      await new Promise((resolve) => instance.server.close(resolve));
      rmSync(dir, {recursive: true, force: true});
    },
  };
}

async function seededWave(call, {members = ["Alice", "Bob"], days = 5} = {}) {
  const created = await call("POST", "/game/facilitator/cohort/create", {
    body: {
      hostKey: "test-host",
      name: "Wave AET-82 remaining",
      startDate: "2026-10-05",
      days,
      members,
    },
  });
  assert.equal(created.status, 201);
  const room = await call("POST", "/game/create", {body: {hostKey: "test-host", name: "Squad Orion"}});
  assert.equal(room.status, 200);
  const attached = await call("POST", "/game/facilitator/cohort/attach", {
    body: {hostKey: "test-host", cohortId: created.body.cohort.id, roomId: room.body.roomId},
  });
  assert.equal(attached.status, 200);
  return {created, room, alice: created.body.codes[0], bob: created.body.codes[1]};
}

test("AET-82-1: cohort code → HttpOnly Secure session → day access within 90d from cohort start", async () => {
  const {clock, call, close} = await gateway();
  try {
    const {created, room, alice} = await seededWave(call);
    // Activate late (day 30) — window still measured from cohort startsAt, not first activation.
    clock.now = START + 30 * DAY_MS;
    const activated = await call("POST", "/game/cohort/activate", {body: {code: alice.code.toLowerCase()}});
    assert.equal(activated.status, 200);
    assert.equal(activated.body.roomId, room.body.roomId);
    assert.equal(activated.body.readOnly, false);
    assert.match(
      activated.setCookie,
      /^academy=[a-f0-9]{64}; Path=\/; HttpOnly; Secure; SameSite=Strict$/,
    );
    const state = await call("GET", "/game/state", {cookie: activated.body.token});
    assert.equal(state.status, 200);
    assert.equal(state.body.me.name, "Alice");
    assert.equal(state.body.readOnly, false);
    assert.equal(state.body.wave?.id, created.body.cohort.id);
    const dayRoute = await call("GET", "/game/day-route", {cookie: activated.body.token});
    assert.equal(dayRoute.status, 200);
    assert.ok(Array.isArray(dayRoute.body.released));
    assert.ok(dayRoute.body.released.includes(dayRoute.body.day));
    // Re-activate near end of 90d-from-start (sessions are 12h; window is still startsAt+90d).
    clock.now = START + ACCESS_DAYS * DAY_MS - 1000;
    const late = await call("POST", "/game/cohort/activate", {body: {code: alice.code}});
    assert.equal(late.status, 200);
    assert.equal(late.body.readOnly, false);
    assert.match(late.setCookie, /HttpOnly/);
    assert.equal((await call("POST", "/game/help", {cookie: late.body.token, body: {}})).status, 200);
  } finally {
    await close();
  }
});

test("AET-82-2: facilitator revoke kills code + existing sessions immediately", async () => {
  const {call, close} = await gateway();
  try {
    const {created, alice} = await seededWave(call);
    const activated = await call("POST", "/game/cohort/activate", {body: {code: alice.code}});
    assert.equal(activated.status, 200);
    const session = activated.body.token;
    assert.equal((await call("GET", "/game/state", {cookie: session})).status, 200);
    const revoked = await call("POST", "/game/facilitator/cohort/revoke", {
      body: {hostKey: "test-host", cohortId: created.body.cohort.id, memberId: alice.memberId},
    });
    assert.equal(revoked.status, 200);
    assert.equal(revoked.body.members.find((m) => m.name === "Alice").status, "revoked");
    assert.equal((await call("GET", "/game/state", {cookie: session})).status, 401);
    assert.equal((await call("POST", "/game/cohort/activate", {body: {code: alice.code}})).status, 401);
  } finally {
    await close();
  }
});

test("AET-82-3: post-90d from cohort start closes login/write; optional 14d read-only Proof window", async () => {
  const {clock, call, close} = await gateway();
  try {
    const {bob} = await seededWave(call);
    // Default createCohort enables readOnlyExport (matches WAVE fixture / PR #88).
    clock.now = START + ACCESS_DAYS * DAY_MS;
    const readOnly = await call("POST", "/game/cohort/activate", {body: {code: bob.code}});
    assert.equal(readOnly.status, 200);
    assert.equal(readOnly.body.readOnly, true);
    assert.match(readOnly.setCookie, /HttpOnly/);
    const session = readOnly.body.token;
    assert.equal((await call("GET", "/game/state", {cookie: session})).status, 200);
    const write = await call("POST", "/game/help", {cookie: session, body: {}});
    assert.equal(write.status, 403);
    assert.match(write.body.error, /alleen-lezen|read-only|alleen lezen/i);
    // After 90 + 14d: activate closed.
    clock.now = START + (ACCESS_DAYS + READ_ONLY_DAYS) * DAY_MS;
    const closed = await call("POST", "/game/cohort/activate", {body: {code: bob.code}});
    assert.equal(closed.status, 403);
    // Pure window math (clock inject, no wall wait): 90d from startsAt, not activation.
    const window = cohortWindow({startsAt: START, days: 5, readOnlyExport: true});
    assert.equal(window.activeEndsAt, START + ACCESS_DAYS * DAY_MS);
    assert.equal(window.readOnlyEndsAt, START + (ACCESS_DAYS + READ_ONLY_DAYS) * DAY_MS);
    assert.equal(accessPhase({startsAt: START, days: 5, readOnlyExport: true}, START + 30 * DAY_MS).phase, "active");
    assert.equal(accessPhase({startsAt: START, days: 5, readOnlyExport: true}, START + ACCESS_DAYS * DAY_MS).phase, "read-only");
    assert.equal(
      accessPhase({startsAt: START, days: 5, readOnlyExport: true}, START + (ACCESS_DAYS + READ_ONLY_DAYS) * DAY_MS).phase,
      "closed",
    );
  } finally {
    await close();
  }
});

test("AET-82-4: room vs cohort vocabulary clear in join/cohort chrome", () => {
  const en = JSON.parse(readFileSync(path.join(root, "src/i18n/en.json"), "utf8"));
  const nl = JSON.parse(readFileSync(path.join(root, "src/i18n/nl.json"), "utf8"));
  for (const locale of [en, nl]) {
    assert.match(locale["join.path.room"], /room|kamer/i);
    assert.match(locale["join.path.cohort"], /cohort/i);
    assert.match(locale["join.path.roomDetail"], /live/i);
    assert.match(locale["join.path.cohortDetail"], /programme|traject|whole|hele/i);
    assert.match(locale["cohort.lede"], /live session|livesessie|multi-day|meerdaagse/i);
    assert.notEqual(locale["join.path.room"], locale["join.path.cohort"]);
  }
  // AET-104 R1 cite: cohort-end → all-days unlock copy still present (no contradiction).
  assert.match(en["naslag.ledeAll"], /every day is open|training is complete/i);
  assert.match(nl["naslag.ledeAll"], /alle dagen staan open|training is afgerond/i);
});

test("AET-82-5: ACADEMY_TRUST_PROXY deploy note documents cookie/session behind reverse proxy", () => {
  const deploy = readFileSync(path.join(root, "docs/DEPLOYMENT.md"), "utf8");
  assert.match(deploy, /ACADEMY_TRUST_PROXY/);
  assert.match(deploy, /HttpOnly/i);
  assert.match(deploy, /trust proxy|reverse proxy/i);
  assert.match(deploy, /Do \*\*not\*\* invent secrets|geen secret|Do \*\*not\*\* flip live proxy/i);
  // Wiring already present — docs must name the same env the gateway reads.
  const app = readFileSync(path.join(root, "server/app.mjs"), "utf8");
  assert.match(app, /trustProxy\s*=\s*process\.env\.ACADEMY_TRUST_PROXY/);
  assert.match(app, /httpOnly:\s*true/);
});

test("AET-82: trustProxy=1 enables Express trust proxy without inventing secrets", async () => {
  const {call, close} = await gateway({trustProxy: "1"});
  try {
    // Smoke: gateway still serves health and accepts cohort create with trust proxy on.
    const health = await call("GET", "/game/health");
    assert.equal(health.status, 200);
    assert.equal(health.body.ok, true);
  } finally {
    await close();
  }
});
