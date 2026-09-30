import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, rmSync} from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createApp} from "../server/app.mjs";
import {answerQuestion} from "../server/faq.mjs";
import {releasedDays} from "../server/release.mjs";
import {DAY_SOURCES} from "../content/days/index.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

async function gateway() {
  const dir = mkdtempSync(path.join(os.tmpdir(), "academy-aet-83-"));
  const instance = createApp({
    dir,
    hostKey: "test-host",
    publicBaseUrl: "https://academy.example.test/",
    slidesService: {run: async () => null},
  });
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
    return {status: response.status, body: json};
  };
  return {
    call,
    close: async () => {
      await new Promise((resolve) => instance.server.close(resolve));
      rmSync(dir, {recursive: true, force: true});
    },
  };
}

async function roomWithParticipant(call) {
  const created = await call("POST", "/game/create", {body: {hostKey: "test-host", name: "AET-83 FAQ"}});
  assert.equal(created.status, 200);
  const hostToken = created.body.token;
  const joined = await call("POST", "/game/join", {body: {code: created.body.code, name: "Deelnemer"}});
  assert.equal(joined.status, 200);
  return {hostToken, participantToken: joined.body.token, roomId: created.body.roomId, code: created.body.code};
}

test("AET-83-1: FAQ hit from released day content carries day + source cite", () => {
  const hit = answerQuestion({day: 5, query: "Heb ik een credential nodig voor L1?"}).hits[0];
  assert.equal(hit.id, "d3:step:w3-l1");
  assert.equal(hit.day, 3);
  assert.ok(hit.source?.label);
  assert.ok(hit.source?.href);
  assert.match(hit.source.href, /\/workshop\/3/);
  // Not yet released: day 2 must not see day-3 content.
  assert.deepEqual(
    answerQuestion({day: 2, query: "Heb ik een credential nodig voor L1?"}).hits.filter((h) => h.id.startsWith("d3:")),
    [],
  );
  // AET-104 cumulative unlock: stepped-back live day keeps reached days searchable.
  assert.deepEqual(releasedDays({day: 3, reachedDay: 5}), [1, 2, 3, 4, 5]);
  const archived = answerQuestion({
    day: 3,
    released: releasedDays({day: 3, reachedDay: 5}),
    query: "Heb ik een credential nodig voor L1?",
  });
  assert.equal(archived.hits[0].id, "d3:step:w3-l1");
  assert.equal(archived.hits[0].day, 3);
});

test("AET-83-1 UI+i18n: day cite rendered on Hit; lede names released days", () => {
  const chat = readFileSync(path.join(root, "src/chat.jsx"), "utf8");
  assert.match(chat, /chat\.dayCite/);
  assert.match(chat, /chat-cite/);
  assert.match(chat, /hit\.day!=null/);
  const en = JSON.parse(readFileSync(path.join(root, "src/i18n/en.json"), "utf8"));
  const nl = JSON.parse(readFileSync(path.join(root, "src/i18n/nl.json"), "utf8"));
  assert.equal(en["chat.dayCite"], "Day {day}");
  assert.equal(nl["chat.dayCite"], "Dag {day}");
  assert.match(en["chat.lede"], /released day/i);
  assert.match(nl["chat.lede"], /vrijgegeven dagen/i);
  assert.match(en["chat.source"], /Source/i);
  assert.match(nl["chat.source"], /Bron/i);
});

test("AET-83-2: conceptual miss → ready-made BYO Claude MCP prompt (not hosted tutor essay)", () => {
  const miss = answerQuestion({day: 3, query: "pizza recept"});
  assert.equal(miss.mode, "handoff");
  assert.deepEqual(miss.hits, []);
  assert.match(miss.handoff.prompt, /get_screen_state/);
  assert.match(miss.handoff.prompt, /get_mission/);
  assert.match(miss.handoff.prompt, /pizza recept/);
  assert.equal(miss.handoff.link.view, "coach");
  assert.doesNotMatch(miss.handoff.prompt, /OpenAI|hosted tutor|anthropic api key/i);

  const why = answerQuestion({day: 3, query: "Waarom is L1 zonder LLM?"});
  assert.equal(why.mode, "handoff");
  assert.match(why.handoff.prompt, /get_screen_state/);
});

test("AET-83-3: facilitator toggle off → participant POST /game/chat returns 403", async () => {
  const {call, close} = await gateway();
  try {
    const {hostToken, participantToken} = await roomWithParticipant(call);
    const ask = (cookie) => call("POST", "/game/chat", {body: {q: "Waar vind ik mijn opdracht?"}, cookie});
    const on = await ask(participantToken);
    assert.equal(on.status, 200);
    assert.equal(on.body.hits[0].id, "nav:solo");

    const off = await call("POST", "/game/control", {
      body: {action: "chat", value: false},
      cookie: hostToken,
    });
    assert.equal(off.status, 200);
    assert.equal(off.body.chat, false);

    const blocked = await ask(participantToken);
    assert.equal(blocked.status, 403);
    assert.match(blocked.body.error, /uitgezet|disabled|off/i);

    // Facilitator keeps preview while participants are blocked.
    assert.equal((await ask(hostToken)).status, 200);
  } finally {
    await close();
  }
});

test("AET-83-4: quiz keys and facilitator demo script never leak in retrieval answers", () => {
  for (const source of DAY_SOURCES.slice(0, 7)) {
    for (const {question, options, answer} of source.quiz) {
      const body = JSON.stringify(answerQuestion({day: source.day, query: `${question} ${options[answer]}`}).hits);
      assert.equal(body.includes(question), false, question);
      assert.equal(body.includes(options[answer]), false, options[answer]);
    }
    for (const line of source.demo.script) {
      const {hits} = answerQuestion({day: source.day, query: line});
      assert.equal(JSON.stringify(hits).includes(line), false, line);
    }
  }
});

test("AET-83 HTTP soft-live: released-only + day cite on chat ask path", async () => {
  const {call, close} = await gateway();
  try {
    const {hostToken, participantToken} = await roomWithParticipant(call);
    // Advance to day 5 so day-3 content is released, then ask.
    assert.equal(
      (await call("POST", "/game/control", {body: {action: "day", value: 5}, cookie: hostToken})).status,
      200,
    );
    const hit = await call("POST", "/game/chat", {
      body: {q: "Heb ik een credential nodig voor L1?", locale: "nl"},
      cookie: participantToken,
    });
    assert.equal(hit.status, 200);
    assert.equal(hit.body.mode, "answer");
    assert.equal(hit.body.hits[0].id, "d3:step:w3-l1");
    assert.equal(hit.body.hits[0].day, 3);
    assert.ok(hit.body.hits[0].source.href);

    // Step back to day 2 after reaching 5 — archive stays open (AET-104).
    assert.equal(
      (await call("POST", "/game/control", {body: {action: "day", value: 2}, cookie: hostToken})).status,
      200,
    );
    const still = await call("POST", "/game/chat", {
      body: {q: "Heb ik een credential nodig voor L1?"},
      cookie: participantToken,
    });
    assert.equal(still.status, 200);
    assert.equal(still.body.hits[0].id, "d3:step:w3-l1");

    // Fresh room stuck on day 1 must not see day-3 content.
    const fresh = await roomWithParticipant(call);
    const blocked = await call("POST", "/game/chat", {
      body: {q: "Heb ik een credential nodig voor L1?"},
      cookie: fresh.participantToken,
    });
    assert.equal(blocked.status, 200);
    assert.deepEqual(
      (blocked.body.hits || []).filter((h) => String(h.id).startsWith("d3:")),
      [],
    );
  } finally {
    await close();
  }
});
