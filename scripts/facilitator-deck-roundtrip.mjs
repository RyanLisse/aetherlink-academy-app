#!/usr/bin/env node
/**
 * AET-119 — authenticated facilitator deck draft roundtrip via MCP tool path.
 * Local harness by default; set ACADEMY_URL + ACADEMY_HOST_KEY for a deployed check.
 * Redacts tokens in output. Exit non-zero on failure.
 *
 * MCP is the shared boundary the facilitator Claude/Codex uses (same /game/mcp/:tool
 * tools as the UI). Chat iframe / @academy/actions deck CRUD remains external until AET-120.
 */
import {mkdtempSync, rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';

const secrets = new Set();
const redact = value => {
  let detail = String(value ?? '');
  for (const secret of secrets) {
    if (secret) detail = detail.split(secret).join('[redacted]');
  }
  return detail.replace(/[a-f0-9]{64}/gi, '[redacted-token]');
};

const fail = message => {
  console.error(`FAIL ${redact(message)}`);
  process.exit(1);
};

const pass = message => console.log(`PASS ${message}`);

async function handle(app, route, {bearer, body = {}, params = {}} = {}) {
  const layer = app.router.stack.find(l => l.route?.path === route);
  if (!layer) throw new Error(`route not found: ${route}`);
  const response = {status: 200, body: null};
  await layer.route.stack[0].handle(
    {headers: bearer ? {authorization: 'Bearer ' + bearer} : {}, body, params},
    {json(payload) { response.body = payload; }},
    e => { response.status = e.status || 500; response.body = {error: e.message}; },
  );
  return response;
}

async function localRoundtrip() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'academy-deck-rt-'));
  try {
    const {app, store} = createApp({dir, hostKey: 'test-host', publicBaseUrl: 'https://academy.example.test'});
    const host = store.create('Roundtrip Squad', {slug: 'roundtrip-intent'});
    secrets.add(host.token);

    const setupRes = await handle(app, '/game/agent-setup', {bearer: host.token, body: {client: 'claude'}});
    if (setupRes.status !== 200) fail(`agent-setup ${setupRes.status}: ${setupRes.body?.error}`);
    const tokenMatch = setupRes.body.instructions.match(/Authorization: Bearer ([a-f0-9]{64})/);
    if (!tokenMatch) fail('agent-setup missing bearer');
    const mcpToken = tokenMatch[1];
    secrets.add(mcpToken);

    const mcp = async (tool, body = {}) => {
      const response = await handle(app, '/game/mcp/:tool', {bearer: mcpToken, body, params: {tool}});
      if (response.status !== 200) {
        throw new Error(`${tool} -> HTTP ${response.status}: ${response.body?.error || JSON.stringify(response.body)}`);
      }
      return response.body;
    };

    const mission = await mcp('get_mission');
    if (mission.session?.role !== 'facilitator' || mission.session?.roomId !== host.roomId) {
      fail(`get_mission identity mismatch role=${mission.session?.role} room=${mission.session?.roomId}`);
    }
    pass('get_mission facilitator identity');

    if (!store.data.rooms[host.roomId].facilitatorLastMcp) fail('facilitatorLastMcp not stamped after tool call');
    pass('facilitator lastMcp stamped');

    const created = await mcp('create_deck', {title: 'Facilitator draft roundtrip'});
    if (!created?.id) fail('create_deck missing id');
    pass(`create_deck id=${String(created.id).slice(0, 8)}…`);

    const added = await mcp('add_slide', {deckId: created.id, heading: 'Roundtrip slide', body: ['Draft body']});
    if (!added?.slide?.id) fail('add_slide missing slide');
    pass(`add_slide id=${String(added.slide.id).slice(0, 8)}…`);

    const listed = await mcp('list_decks');
    const decks = Array.isArray(listed?.decks) ? listed.decks : Array.isArray(listed) ? listed : [];
    const found = decks.find(d => d.id === created.id || d.title === 'Facilitator draft roundtrip');
    if (!found) fail(`list_decks missing draft: ${JSON.stringify(listed).slice(0, 200)}`);
    pass('list_decks shows draft');

    const got = await mcp('get_deck', {deckId: created.id});
    if (!got?.slides?.length) fail('get_deck has no slides');
    pass(`get_deck visible slides=${got.slides.length}`);

    console.log('OK facilitator deck roundtrip (local MCP path)');
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
}

async function deployedRoundtrip() {
  const academyUrl = process.env.ACADEMY_URL;
  const hostKey = process.env.ACADEMY_HOST_KEY;
  if (!academyUrl || !hostKey) fail('ACADEMY_URL and ACADEMY_HOST_KEY required for deployed mode');
  secrets.add(hostKey);
  const base = new URL(academyUrl);
  const post = async (route, body, headers = {}) => {
    const response = await fetch(new URL(route, base), {
      method: 'POST',
      headers: {'content-type': 'application/json', ...headers},
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });
    const payload = await response.json().catch(() => null);
    return {response, body: payload};
  };
  const createdRoom = await post('/game/create', {name: 'Deck roundtrip', hostKey});
  if (!createdRoom.response.ok) fail(`create room HTTP ${createdRoom.response.status}`);
  const browserToken = createdRoom.body?.token;
  if (!browserToken) fail('create room missing token');
  secrets.add(browserToken);

  const setup = await post('/game/agent-setup', {client: 'claude'}, {authorization: 'Bearer ' + browserToken});
  if (!setup.response.ok) fail(`agent-setup HTTP ${setup.response.status}: ${setup.body?.error}`);
  const tokenMatch = setup.body.instructions.match(/Authorization: Bearer ([a-f0-9]{64})/);
  if (!tokenMatch) fail('agent-setup missing bearer');
  const mcpToken = tokenMatch[1];
  secrets.add(mcpToken);

  const mcp = async (tool, body = {}) => {
    const {response, body: payload} = await post(`/game/mcp/${tool}`, body, {authorization: 'Bearer ' + mcpToken});
    if (!response.ok) throw new Error(`${tool} HTTP ${response.status}: ${payload?.error || 'error'}`);
    return payload;
  };

  const mission = await mcp('get_mission');
  if (mission.session?.role !== 'facilitator') fail('deployed get_mission not facilitator');
  pass('deployed get_mission');

  const deck = await mcp('create_deck', {title: 'Deployed facilitator draft'});
  await mcp('add_slide', {deckId: deck.id, heading: 'Slide', body: ['ok']});
  const listed = await mcp('list_decks');
  const decks = Array.isArray(listed?.decks) ? listed.decks : Array.isArray(listed) ? listed : [];
  if (!decks.some(d => d.id === deck.id)) fail('deployed list_decks missing deck');
  await mcp('get_deck', {deckId: deck.id});
  pass('deployed create→list→get');
  console.log('OK facilitator deck roundtrip (deployed MCP path)');
}

const mode = process.env.ACADEMY_URL && process.env.ACADEMY_HOST_KEY ? 'deployed' : 'local';
(mode === 'deployed' ? deployedRoundtrip() : localRoundtrip()).catch(error => fail(error?.stack || error?.message || error));
