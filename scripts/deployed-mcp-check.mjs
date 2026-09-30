import {randomUUID} from 'node:crypto';
import {chmodSync, mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {Client,StreamableHTTPClientTransport} from '@modelcontextprotocol/client';

const academyUrl = process.env.ACADEMY_URL;
const hostKey = process.env.ACADEMY_HOST_KEY;
if (!academyUrl) {
  console.error('ACADEMY_URL is required.');
  process.exit(1);
}
if (!hostKey) {
  console.error('ACADEMY_HOST_KEY is required.');
  process.exit(1);
}

let baseUrl;
try {
  baseUrl = new URL(academyUrl);
  if (baseUrl.protocol !== 'https:' || baseUrl.pathname !== '/' || baseUrl.search || baseUrl.hash) throw new Error('must be an HTTPS origin');
} catch (error) {
  console.error(`ACADEMY_URL must be a valid HTTPS origin: ${error.message}`);
  process.exit(1);
}

const evidenceDir = path.resolve(process.env.EVIDENCE_DIR || 'test-results');
const checks = [];
const secrets = new Set([hostKey]);
const state = {};

const redact = value => {
  let detail = String(value ?? 'Unknown error');
  for (const secret of secrets) {
    if (secret) detail = detail.split(secret).join('[redacted]');
  }
  return detail;
};

const printCheck = result => {
  console.log(result.passed ? `PASS ${result.name}` : `FAIL ${result.name}: ${result.detail}`);
};

const check = async (name, fn) => {
  try {
    const detail = await fn();
    const result = {name, passed: true, detail: detail || 'ok'};
    checks.push(result);
    printCheck(result);
  } catch (error) {
    const result = {name, passed: false, detail: redact(error?.message)};
    checks.push(result);
    printCheck(result);
  }
};

const fetchJson = async (route, options = {}) => {
  const response = await fetch(new URL(route, baseUrl), {
    ...options,
    signal: AbortSignal.timeout(30000),
  });
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return {response, body};
};

const expectJson = async (route, options = {}) => {
  const {response, body} = await fetchJson(route, options);
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${route} returned HTTP ${response.status}`);
  if (!body || typeof body !== 'object') throw new Error(`${options.method || 'GET'} ${route} returned invalid JSON`);
  return body;
};

const postJson = (route, body, headers = {}) => expectJson(route, {
  method: 'POST',
  headers: {'content-type': 'application/json', ...headers},
  body: JSON.stringify(body),
});

const authHeaders = token => ({authorization: `Bearer ${token}`});
const requireString = (value, field) => {
  if (typeof value !== 'string' || !value) throw new Error(`missing ${field}`);
  return value;
};

const setup = async () => {
  const squadA = await postJson('/game/create', {name: `MCP check A ${Date.now()}`, hostKey});
  state.codeA = requireString(squadA.code, 'codeA');
  state.hostTokenA = requireString(squadA.token, 'hostTokenA');
  secrets.add(state.hostTokenA);
  const participantA1 = await postJson('/game/join', {code: state.codeA, name: 'A1'});
  const participantA2 = await postJson('/game/join', {code: state.codeA, name: 'A2'});
  state.a1Token = requireString(participantA1.token, 'A1 token');
  state.a2Token = requireString(participantA2.token, 'A2 token');
  secrets.add(state.a1Token);
  secrets.add(state.a2Token);
  const squadB = await postJson('/game/create', {name: `MCP check B ${Date.now()}`, hostKey});
  state.codeB = requireString(squadB.code, 'codeB');
  state.hostTokenB = requireString(squadB.token, 'hostTokenB');
  secrets.add(state.hostTokenB);
  const participantB1 = await postJson('/game/join', {code: state.codeB, name: 'B1'});
  state.b1Token = requireString(participantB1.token, 'B1 token');
  secrets.add(state.b1Token);
  const mcpA1 = await postJson('/game/mcp-token', {}, authHeaders(state.a1Token));
  const mcpB1 = await postJson('/game/mcp-token', {}, authHeaders(state.b1Token));
  state.mcpA1 = requireString(mcpA1.token, 'A1 MCP token');
  state.mcpB1 = requireString(mcpB1.token, 'B1 MCP token');
  secrets.add(state.mcpA1);
  secrets.add(state.mcpB1);
  return `squads ${state.codeA}, ${state.codeB}`;
};

await check('setup', setup);

const callTool = async (client, name, args = {}) => {
  const result = await client.callTool({name, arguments: args});
  if (result.isError) throw new Error(`${name} returned an MCP error`);
  const text = result.content?.[0]?.text;
  if (typeof text !== 'string') throw new Error(`${name} returned no text content`);
  return JSON.parse(text);
};

const mcpUrl = new URL('/mcp', baseUrl);
const checkEra = async (name, versionNegotiation, expectedEra) => check(name, async () => {
  const eraClient = new Client({name: `deployed-mcp-check-${expectedEra}`, version: '1'}, versionNegotiation ? {versionNegotiation} : undefined);
  try {
    await eraClient.connect(new StreamableHTTPClientTransport(mcpUrl, {requestInit: {headers: authHeaders(state.mcpA1)}}));
    const tools = (await eraClient.listTools()).tools || [];
    if (tools.length !== 5 || tools.some(tool => /accept|rotate|rewrite/i.test(tool.name))) throw new Error(`expected exactly 5 allowed tools, got ${tools.length}`);
    const mission = await callTool(eraClient, 'get_mission');
    if (mission.mission?.id !== 'ATLAS-REVIEW-01') throw new Error('mission shape mismatch');
    const era = eraClient.getProtocolEra();
    if (era !== expectedEra) throw new Error(`expected protocol era ${expectedEra}, got ${era}`);
    return `era ${era}, 5 tools, mission ${mission.mission.id}`;
  } finally {
    await eraClient.close().catch(() => {});
  }
});
await checkEra('era_modern_2026_07_28', {mode: {pin: '2026-07-28'}}, 'modern');
await checkEra('era_legacy_2025', undefined, 'legacy');
const client = new Client({name: 'deployed-mcp-check', version: '1'});
let clientError = null;
try {
  if (!state.mcpA1) throw new Error('setup did not produce an A1 MCP token');
  const transport = new StreamableHTTPClientTransport(mcpUrl, {requestInit: {headers: authHeaders(state.mcpA1)}});
  await client.connect(transport);
  await check('list_tools_exact', async () => {
    const result = await client.listTools();
    const tools = result.tools || [];
    if (tools.length !== 5 || tools.some(tool => /accept|rotate|rewrite/i.test(tool.name))) throw new Error(`expected exactly 5 allowed tools, got ${tools.length}`);
    return '5 tools';
  });
  await check('get_mission_shape', async () => {
    const result = await callTool(client, 'get_mission');
    if (result.mission?.id !== 'ATLAS-REVIEW-01') throw new Error('mission shape mismatch');
    return `mission ${result.mission.id}`;
  });
  await check('search_knowledge_all', async () => {
    const result = await callTool(client, 'search_knowledge', {query: ''});
    if (!Array.isArray(result.lessons) || result.lessons.length !== 10) throw new Error(`expected 10 lessons, got ${result.lessons?.length ?? 'invalid'}`);
    return '10 lessons';
  });
  await check('search_knowledge_mcp', async () => {
    const result = await callTool(client, 'search_knowledge', {query: 'MCP'});
    if (!result.lessons?.some(lesson => lesson.id === 'L2-MCP')) throw new Error('L2-MCP was not returned');
    return 'L2-MCP present';
  });
  await check('get_mission_intent', async () => {
    const link = 'https://example.test/deployed-mcp-check/intent.md';
    await postJson('/game/intent', {url: link}, authHeaders(state.hostTokenA));
    const result = await callTool(client, 'get_mission');
    if (result.intent?.url !== link || result.intent?.file !== 'intent.md') throw new Error('mission does not expose the room intent link');
    return 'intent link and intent.md fallback present';
  });
  await check('submit_evidence_idempotent', async () => {
    const payload = {
      requestId: randomUUID(),
      finding: 'Automated deployed-MCP check synthetic finding; not a learner submission.',
      command: 'Automated deployed-MCP check synthetic command.',
      observed: 'Automated deployed-MCP check synthetic observation.',
      limitation: 'Automated deployed-MCP check synthetic limitation.',
    };
    const first = await callTool(client, 'submit_evidence', payload);
    const second = await callTool(client, 'submit_evidence', payload);
    if (!first.id || first.id !== second.id) throw new Error('retry did not return the same evidence id');
    const roomState = await expectJson('/game/state', {headers: authHeaders(state.a2Token)});
    if (!Array.isArray(roomState.evidence) || roomState.evidence.length !== 1) throw new Error(`expected exactly 1 evidence item, got ${roomState.evidence?.length ?? 'invalid'}`);
    return `idempotent evidence id length ${first.id.length}`;
  });
} catch (error) {
  clientError = error;
  const positiveNames = ['list_tools_exact', 'get_mission_shape', 'search_knowledge_all', 'search_knowledge_mcp', 'get_mission_intent', 'submit_evidence_idempotent'];
  for (const name of positiveNames) {
    if (!checks.some(result => result.name === name)) await check(name, async () => { throw clientError; });
  }
} finally {
  await client.close().catch(() => {});
}

const initializeBody = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {protocolVersion: '2024-11-05', capabilities: {}, clientInfo: {name: 'deployed-mcp-check', version: '1'}},
};

const rawMcp = async (token, extraHeaders = {}, method = 'POST') => fetchJson('/mcp', {
  method,
  headers: {'accept': 'application/json, text/event-stream', ...(method === 'POST' ? {'content-type': 'application/json'} : {}), ...(token ? authHeaders(token) : {}), ...extraHeaders},
  body: method === 'POST' ? JSON.stringify(initializeBody) : undefined,
});

await check('no_auth_rejected', async () => {
  const {response} = await rawMcp();
  if (response.status !== 401 || !response.headers.get('www-authenticate')) throw new Error(`expected HTTP 401 with WWW-Authenticate, got ${response.status}`);
  return 'HTTP 401 with challenge';
});
await check('invalid_token_rejected', async () => {
  const {response} = await rawMcp('ci-invalid');
  if (response.status !== 401) throw new Error(`expected HTTP 401, got ${response.status}`);
  return 'HTTP 401';
});
await check('participant_token_rejected', async () => {
  if (!state.a1Token) throw new Error('setup did not produce participant token');
  const {response} = await rawMcp(state.a1Token);
  if (![401, 403].includes(response.status)) throw new Error(`expected HTTP 401 or 403, got ${response.status}`);
  return `HTTP ${response.status}`;
});
await check('revoked_token_rejected', async () => {
  if (!state.a1Token || !state.mcpA1) throw new Error('setup did not produce A1 tokens');
  const replacement = await postJson('/game/mcp-token', {}, authHeaders(state.a1Token));
  state.mcpA1Replacement = requireString(replacement.token, 'replacement MCP token');
  secrets.add(state.mcpA1Replacement);
  const {response} = await rawMcp(state.mcpA1);
  if (response.status !== 401) throw new Error(`expected revoked token HTTP 401, got ${response.status}`);
  return 'HTTP 401';
});
await check('cross_squad_isolation', async () => {
  if (!state.mcpB1) throw new Error('setup did not produce B1 MCP token');
  const bClient = new Client({name: 'deployed-mcp-check-b', version: '1'});
  try {
    await bClient.connect(new StreamableHTTPClientTransport(mcpUrl, {requestInit: {headers: authHeaders(state.mcpB1)}}));
    const missionB = await callTool(bClient, 'get_mission');
    if (missionB.intent?.url) throw new Error('squad B token reached squad A intent link');
    const roomA = await expectJson('/game/state', {headers: authHeaders(state.a1Token)});
    const roomB = await expectJson('/game/state', {headers: authHeaders(state.b1Token)});
    if (!roomA.id || !roomB.id || roomA.id === roomB.id) throw new Error('squad rooms are not isolated');
    const cross = await fetchJson('/game/intent', {method: 'POST', headers: {'content-type': 'application/json', ...authHeaders(state.b1Token)}, body: JSON.stringify({url: 'https://example.test/cross.md'})});
    const roomAAfter = await expectJson('/game/state', {headers: authHeaders(state.a1Token)});
    if (roomAAfter.intentUrl === 'https://example.test/cross.md') throw new Error('squad B changed squad A intent link');
    return `distinct rooms, squad B intent write HTTP ${cross.response.status}`;
  } finally {
    await bClient.close().catch(() => {});
  }
});
await check('mcp_get_not_allowed', async () => {
  if (!state.mcpA1Replacement) throw new Error('replacement MCP token was not created');
  const {response} = await rawMcp(state.mcpA1Replacement, {}, 'GET');
  if (response.status !== 405) throw new Error(`expected HTTP 405, got ${response.status}`);
  return 'HTTP 405';
});

mkdirSync(evidenceDir, {recursive: true});
const handlesPath = path.join(evidenceDir, 'deployed-mcp-handles.json');
writeFileSync(handlesPath, JSON.stringify({codeA: state.codeA, codeB: state.codeB, hostTokenA: state.hostTokenA, mcpA1Participant: state.a1Token}, null, 2) + '\n', {mode: 0o600});
chmodSync(handlesPath, 0o600);
console.log(`Wrote ${handlesPath}`);

let revision = null;
try {
  const health = await expectJson('/game/health');
  revision = health.revision ?? null;
} catch {
  revision = null;
}
const evidencePath = path.join(evidenceDir, 'deployed-mcp-check.json');
const passed = checks.filter(result => result.passed).length;
writeFileSync(evidencePath, JSON.stringify({target: academyUrl, at: new Date().toISOString(), revision, checks, summary: {passed, total: checks.length}}, null, 2) + '\n');
console.log(`Wrote ${evidencePath}`);

if (passed !== checks.length) process.exit(1);
