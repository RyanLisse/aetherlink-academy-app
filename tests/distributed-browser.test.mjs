import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createProofDatabase } from '../vendor/proof-sdk/server/postgres.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function until(check, label, timeout = 20000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const result = await check();
    if (result) return result;
    await delay(100);
  }
  throw new Error(`Timed out: ${label}`);
}

async function untilDeadline(check, label, deadline) {
  return until(check, label, Math.max(1, deadline - Date.now()));
}

// Retry a GET once when the server closed a fresh connection without sending any response
// byte. Mutations are never retried: the server may have processed them before closing.
async function fetchOnceOrRetryUnprocessed(url, init) {
  try {
    return await fetch(url, init);
  } catch (error) {
    const cause = error?.cause;
    if (cause?.code === 'UND_ERR_SOCKET' && cause?.socket?.bytesRead === 0 && (init.method ?? 'GET') === 'GET') {
      console.warn(`[test] retrying unprocessed request to ${url}: ${cause.message}`);
      return fetch(url, init);
    }
    throw error;
  }
}

async function request(base, route, body, token, expected = 200) {
  const response = await fetchOnceOrRetryUnprocessed(base + route, {
    signal: AbortSignal.timeout(15000),
    method: body ? 'POST' : 'GET',
    headers: {
      // No keep-alive reuse: an idle socket closed by the server's keepAliveTimeout while
      // the client reuses it yields 'other side closed' flakes unrelated to the product.
      connection: 'close',
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let result;
  try { result = JSON.parse(text); } catch { result = { error: text }; }
  assert.equal(response.status, expected, `${route}: ${result.error || text || 'unexpected status'}`);
  return result;
}

async function rawRequest(base, route, body, token) {
  const response = await fetchOnceOrRetryUnprocessed(base + route, {
    signal: AbortSignal.timeout(15000),
    method: 'POST',
    headers: {
      // No keep-alive reuse: an idle socket closed by the server's keepAliveTimeout while
      // the client reuses it yields 'other side closed' flakes unrelated to the product.
      connection: 'close',
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let result;
  try { result = JSON.parse(text); } catch { result = null; }
  return { status: response.status, text, result };
}

function markdownLines(markdown) {
  return String(markdown)
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
}

function normalizeText(value) {
  return String(value).trim().replace(/\s+/g, ' ');
}

function occurrences(value, needle) {
  return String(value).split(needle).length - 1;
}

async function proofText(page) {
  // Scope to the rendered editor: the iframe body also carries the server-rendered
  // agent fallback block and a dismissible share notice, neither of which is document content.
  const frame = page.frameLocator('iframe[title="Shared document · Proof"]');
  const editor = frame.locator('.ProseMirror').first();
  if (await editor.count()) return editor.innerText();
  return frame.locator('body').innerText();
}

async function polledProofText(page) {
  try { return await proofText(page); } catch { return ''; }
}

async function proofConnectionState(page) {
  const frame = page.frameLocator('iframe[title="Shared document · Proof"]');
  const [inner, outer] = await Promise.all([
    frame.locator('.share-pill-status-inline .status-label').textContent().catch(() => ''),
    page.locator('.document-status').innerText().catch(() => ''),
  ]);
  return { inner: inner?.trim() || '', outer };
}

function hasOpenCollabSocket(tracker) {
  return tracker.events.some(event => event.closedAt === null && event.isOpen());
}

function collabSocketCloseCount(tracker) {
  return tracker.events.filter(event => event.closedAt !== null).length;
}

async function waitForProofConnected(page, tracker, deadline) {
  let consecutiveMatches = 0;
  return untilDeadline(async () => {
    const status = await proofConnectionState(page);
    if (hasOpenCollabSocket(tracker) && status.inner === 'Saved' && status.outer.includes('Proof connected')) consecutiveMatches += 1;
    else consecutiveMatches = 0;
    return consecutiveMatches >= 3 ? status : false;
  }, 'Proof has an open WebSocket and reports a saved, connected collaboration session', deadline);
}

// A connected editor may briefly report 'Saving...' while its own local update is in
// flight (one server round-trip). That is normal; a room that never returns to 'Saved'
// is the defect. Track per-label how long 'Saving' persists and fail past this budget.
const SAVING_BUDGET_MS = 3000;
const savingSince = new Map();
const savingMaxMs = new Map();

function assertProofStayedConnected(status, tracker, expectedCloseCount, label) {
  assert.equal(collabSocketCloseCount(tracker), expectedCloseCount, `${label}: collaboration WebSocket stays open`);
  assert(hasOpenCollabSocket(tracker), `${label}: collaboration WebSocket remains open`);
  assert(status.outer.includes('Proof connected'), `${label}: outer status remains connected`);
  if (status.inner === 'Saving') {
    const since = savingSince.get(label) ?? Date.now();
    savingSince.set(label, since);
    const elapsed = Date.now() - since;
    savingMaxMs.set(label, Math.max(savingMaxMs.get(label) ?? 0, elapsed));
    assert(elapsed <= SAVING_BUDGET_MS, `${label}: iframe status stuck in Saving for ${elapsed} ms (budget ${SAVING_BUDGET_MS} ms)`);
    return;
  }
  savingSince.delete(label);
  assert.equal(status.inner, 'Saved', `${label}: iframe status remains Saved`);
}

function assertProofSettled(status, label) {
  assert.equal(status.inner, 'Saved', `${label}: iframe status settles on Saved`);
  const maxSaving = savingMaxMs.get(label) ?? 0;
  if (maxSaving > 0) console.log(`[test] ${label}: transient Saving observed, max ${maxSaving} ms`);
}

async function waitForProofTextWhileConnected(page, tracker, expectedCloseCount, check, label, deadline) {
  return untilDeadline(async () => {
    const [text, status] = await Promise.all([polledProofText(page), proofConnectionState(page)]);
    assertProofStayedConnected(status, tracker, expectedCloseCount, label);
    return check(text) ? text : false;
  }, label, deadline);
}

async function monitorProofConnection(page, tracker, expectedCloseCount, label, deadline) {
  let status = null;
  while (Date.now() < deadline) {
    status = await proofConnectionState(page);
    assertProofStayedConnected(status, tracker, expectedCloseCount, label);
    await delay(100);
  }
  // Give an in-flight local update its round-trip, then require the settled state.
  const settleDeadline = Date.now() + SAVING_BUDGET_MS;
  while (status && status.inner !== 'Saved' && Date.now() < settleDeadline) {
    await delay(100);
    status = await proofConnectionState(page);
    assertProofStayedConnected(status, tracker, expectedCloseCount, label);
  }
  if (status) assertProofSettled(status, label);
}

function safeWebSocketUrl(value) {
  try {
    const url = new URL(value);
    for (const key of ['token', 'authorization', 'access_token']) {
      if (url.searchParams.has(key)) url.searchParams.set(key, '[redacted]');
    }
    return url.toString();
  } catch {
    return String(value).replace(/([?&](?:token|authorization|access_token)=)[^&]*/gi, '$1[redacted]');
  }
}

function summarizeWebSocketFrame(payload) {
  if (typeof payload !== 'string') {
    return { kind: 'binary', length: payload?.byteLength ?? payload?.length ?? 0 };
  }
  const redacted = payload
    .replace(/([?&](?:token|authorization|access_token)=)[^&\s]*/gi, '$1[redacted]')
    .replace(/("(?:token|authorization|access_token)"\s*:\s*")[^"]*/gi, '$1[redacted]');
  return { kind: 'text', length: payload.length, preview: redacted.slice(0, 500) };
}

function observeCollabWebSockets(page, slug) {
  const events = [];
  let nextId = 1;
  let eventOrder = 0;
  page.on('websocket', socket => {
    let url;
    try { url = new URL(socket.url()); } catch { return; }
    if (url.pathname !== '/ws' || url.searchParams.get('role') === null || url.searchParams.get('slug') !== slug) return;
    const record = {
      id: nextId++,
      url: safeWebSocketUrl(socket.url()),
      openedAt: Date.now(),
      openedOrder: ++eventOrder,
      closedAt: null,
      closedOrder: null,
      closeCode: null,
      closeReason: null,
      framesReceived: [],
      framesSent: [],
      socketError: null,
      isOpen: () => !socket.isClosed(),
    };
    events.push(record);
    socket.on('socketerror', error => { record.socketError = String(error); });
    socket.on('framereceived', ({ payload }) => {
      record.framesReceived.push({ at: Date.now(), ...summarizeWebSocketFrame(payload) });
      record.framesReceived = record.framesReceived.slice(-5);
    });
    socket.on('framesent', ({ payload }) => {
      record.framesSent.push({ at: Date.now(), ...summarizeWebSocketFrame(payload) });
      record.framesSent = record.framesSent.slice(-5);
    });
    socket.on('close', () => {
      record.closedAt = Date.now();
      record.closedOrder = ++eventOrder;
    });
  });
  return { events, checkpoint: () => eventOrder };
}

async function joinThroughUi(page, base, name, code) {
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Your name', { exact: true }).fill(name);
  await page.getByLabel('Room code', { exact: true }).fill(code);
  const responsePromise = page.waitForResponse(response => {
    try {
      return new URL(response.url()).pathname === '/game/join' && response.request().method() === 'POST';
    } catch {
      return false;
    }
  }, { timeout: 20000 });
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  const response = await responsePromise;
  const text = await response.text();
  let result;
  try { result = JSON.parse(text); } catch { result = null; }
  assert(response.ok(), `/game/join through UI failed with ${response.status()}: ${text}`);
  assert(result?.token, 'UI join response contains the P1 participant token');
  await page.locator('h1').filter({ hasText: 'Distributed browser verification' }).waitFor({ state: 'visible', timeout: 20000 });
  return result;
}

async function printFailureDiagnostics({ baselineMarkdown, afterRejectMarkdown, currentMarkdown, page, webSocketEvents }) {
  let iframe = '<iframe unavailable>';
  try { iframe = await proofText(page); } catch (error) { iframe = `<iframe read failed: ${error.message}>`; }
  let iframeInnerHtmlLength = null;
  let iframeSrc = null;
  let iframeUrl = null;
  try {
    const iframeLocator = page.locator('iframe[title="Shared document · Proof"]');
    iframeSrc = await iframeLocator.getAttribute('src');
    const iframeHandle = await iframeLocator.elementHandle();
    const contentFrame = await iframeHandle?.contentFrame();
    iframeUrl = contentFrame?.url() ?? null;
    iframeInnerHtmlLength = await contentFrame?.locator('html').evaluate(element => element.innerHTML.length) ?? null;
  } catch {
    // Preserve the primary failure if the iframe is unavailable during diagnostics.
  }
  const screenshotPath = path.join(tmpdir(), `academy-distributed-browser-failure-${process.pid}-${Date.now()}.png`);
  let screenshotResult = screenshotPath;
  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
  } catch (error) {
    screenshotResult = `<screenshot failed: ${error.message}>`;
  }
  console.error([
    '=== distributed browser failure diagnostics ===',
    '--- canonical markdown before reject ---',
    baselineMarkdown ?? '<not captured>',
    '--- canonical markdown after reject ---',
    afterRejectMarkdown ?? currentMarkdown ?? '<not captured>',
    '--- canonical markdown after accept/current ---',
    currentMarkdown ?? '<not captured>',
    '--- current Proof iframe body text ---',
    iframe,
    `--- Proof iframe innerHTML length: ${iframeInnerHtmlLength ?? '<unavailable>'} ---`,
    `--- Proof iframe src: ${iframeSrc ?? '<unavailable>'} ---`,
    `--- Proof iframe current URL: ${iframeUrl ?? '<unavailable>'} ---`,
    `--- full-page screenshot: ${screenshotResult} ---`,
    '--- WebSocket close code/reason ---',
    'Playwright page WebSocket close events do not expose close code/reason; null fields are logged below.',
    '--- collaboration WebSocket event log ---',
    JSON.stringify(webSocketEvents, null, 2),
    '=== end distributed browser failure diagnostics ===',
  ].join('\n'));
}

test('browser Proof receives canonical changes in place without merging stale Yjs identities', {
  skip: process.env.ACADEMY_DISTRIBUTED_TEST !== '1', timeout: 180000,
}, async () => {
  assert(process.env.DATABASE_URL && (process.env.REDIS_URL || process.env.KV_URL));
  const id = randomUUID().replaceAll('-', '');
  const academySchema = `academy_browser_test_${id}`;
  const proofSchema = `proof_browser_test_${id}`;
  const temp = await mkdtemp(path.join(tmpdir(), `academy-distributed-browser-${process.pid}-`));
  const hostKey = randomBytes(32).toString('hex');
  const sharedEnv = {
    ...process.env,
    ACADEMY_HOST_KEY: hostKey,
    PROOF_COLLAB_SIGNING_SECRET: randomBytes(32).toString('hex'),
    ACADEMY_STORAGE: 'postgres',
    ACADEMY_DATABASE_SCHEMA: academySchema,
    PROOF_DATABASE_SCHEMA: proofSchema,
    ACADEMY_REDIS_PREFIX: academySchema,
    PROOF_REDIS_PREFIX: proofSchema,
    COLLAB_COMPACTION_EVERY: '2',
    NODE_ENV: 'test',
  };
  delete sharedEnv.VERCEL;
  const processes = [];
  const logs = [];
  const ports = [4351, 4352];
  const bases = ports.map(port => `http://127.0.0.1:${port}`);
  const database = createProofDatabase({ connectionString: process.env.DATABASE_URL, schema: proofSchema });
  let browser;
  let page;
  let primaryError;

  function start(index) {
    const child = spawn(process.execPath, ['scripts/start.mjs'], {
      cwd: root,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...sharedEnv,
        PORT: String(ports[index]),
        PROOF_PORT: String(4451 + index),
        ACADEMY_PUBLIC_URL: bases[index],
        ACADEMY_DATA: path.join(temp, String(index)),
      },
    });
    child.stdout.on('data', chunk => logs.push(chunk.toString()));
    child.stderr.on('data', chunk => logs.push(chunk.toString()));
    child.on('exit', (code, signal) => {
      const line = `[test] server process ${index} (pid ${child.pid}, port ${ports[index]}) exited code=${code} signal=${signal} at ${new Date().toISOString()}\n`;
      logs.push(line);
      console.warn(line.trim());
    });
    processes.push(child);
    return child;
  }

  async function stop(child, signal = 'SIGTERM') {
    if (child.exitCode !== null || child.signalCode !== null) return;
    const exited = new Promise(resolve => child.once('exit', resolve));
    try { process.kill(-child.pid, signal); } catch (error) { if (error.code !== 'ESRCH') throw error; }
    let deadline;
    try {
      await Promise.race([
        exited,
        new Promise(resolve => {
          deadline = setTimeout(() => {
            try { process.kill(-child.pid, 'SIGKILL'); } catch {}
            resolve();
          }, 28000);
        }),
      ]);
    } finally {
      clearTimeout(deadline);
    }
  }

  async function ready(index, child) {
    await until(async () => {
      if (child.exitCode !== null || child.signalCode !== null) throw new Error(`App ${index} exited during startup`);
      try {
        const response = await fetch(bases[index] + '/game/health', { signal: AbortSignal.timeout(1000) });
        return response.ok && (await response.json()).proof;
      } catch {
        return false;
      }
    }, `app ${index} ready`, 40000);
  }

  try {
    const first = start(0);
    const second = start(1);
    await Promise.all([ready(0, first), ready(1, second)]);

    const host = await request(bases[0], '/game/create', {
      name: 'Distributed browser verification',
      hostKey,
    });
    const participants = {};
    for (const name of ['P2', 'P3', 'P4', 'P5']) {
      participants[name] = await request(bases[0], '/game/join', { code: host.code, name });
    }
    await request(bases[0], '/game/control', { action: 'start' }, host.token);
    const room = await request(bases[0], '/game/state', null, participants.P2.token);
    const slug = room.documentSlug;
    assert(slug, 'Room state contains the Proof document slug');

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    context.setDefaultTimeout(20000);
    context.setDefaultNavigationTimeout(20000);
    page = await context.newPage();
    const webSocketTracker = observeCollabWebSockets(page, slug);
    const p1 = await joinThroughUi(page, bases[0], 'P1', host.code);
    const mainNavigation=page.getByRole('navigation',{name:'Main navigation'});
    await mainNavigation.getByRole('button',{name:'Squad room',exact:true}).click();
    await page.getByRole('button',{name:'Squad & help',exact:true}).click();
    assert.equal(await page.locator('.member').count(), 5, 'Browser roster shows all five participants after P1 joins');

    const frame = page.frameLocator('iframe[title="Shared document · Proof"]');
    await frame.getByRole('heading', { name: 'Onze intent', exact: true }).waitFor({ state: 'visible', timeout: 20000 });
    const literalSeedSentence = 'Nieuwe teamleden kunnen de fictieve Atlas-repository niet betrouwbaar opstarten met alleen de README.';
    await until(async () => (await polledProofText(page)).includes(literalSeedSentence), 'seeded Proof sentence is visible');
    await until(() => webSocketTracker.events.length > 0, 'initial browser collaboration WebSocket is observed');
    await waitForProofConnected(page, webSocketTracker, Date.now() + 10000);
    const baselineText = await proofText(page);

    const p1Mcp = await request(bases[0], '/game/mcp-token', {}, p1.token);
    const baselineDocument = await request(bases[0], '/game/mcp/get_document', {}, p1Mcp.token);
    const baselineMarkdown = baselineDocument.markdown;
    const lines = markdownLines(baselineMarkdown);
    assert(lines.length >= 2, 'Canonical markdown contains at least two non-heading lines');
    assert.equal(lines[0], literalSeedSentence, 'Current seeded first non-heading line matches the browser fixture sentence');
    assert(baselineText.includes(lines[0]), 'Proof iframe shows the canonical first non-heading line');
    const scenarioCloseCount = collabSocketCloseCount(webSocketTracker);
    assert.equal(scenarioCloseCount, 0, 'Browser collaboration WebSocket has not closed before the scenario starts');

    const p2Mcp = await request(bases[1], '/game/mcp-token', {}, participants.P2.token);
    let afterRejectMarkdown;
    let currentMarkdown;
    try {
      const firstSuggestion = await request(bases[1], '/game/mcp/suggest_document', {
        requestId: randomUUID(),
        quote: lines[0],
        content: 'Fixture A',
      }, p2Mcp.token);
      const firstMarkId = Object.keys(firstSuggestion.marks || {})
        .find(markId => firstSuggestion.marks[markId]?.content === 'Fixture A');
      assert(firstMarkId, 'First MCP suggestion response contains the Fixture A mark');
      await waitForProofTextWhileConnected(
        page,
        webSocketTracker,
        scenarioCloseCount,
        text => text.includes('Fixture A'),
        'first cross-instance suggestion appears without disconnecting',
        Date.now() + 10000,
      );

      const rejectIssuedAt = Date.now();
      const rejectDeadline = rejectIssuedAt + 10000;
      let afterRejectSuggestions = [];
      let afterRejectIframeText = '';
      await Promise.all([
        request(bases[1], '/game/suggestion-review', {
          id: firstMarkId,
          decision: 'reject',
          requestId: randomUUID(),
        }, host.token),
        monitorProofConnection(
          page,
          webSocketTracker,
          scenarioCloseCount,
          'cross-instance rejection',
          rejectDeadline,
        ),
        (async () => {
          while (Date.now() < rejectDeadline) {
            const document = await request(bases[0], '/game/mcp/get_document', {}, p1Mcp.token);
            afterRejectMarkdown = document.markdown;
            assert.equal(
              afterRejectMarkdown,
              baselineMarkdown,
              'Canonical markdown stays byte-for-byte unchanged throughout rejection propagation',
            );
            await delay(100);
          }
        })(),
        untilDeadline(async () => {
          afterRejectSuggestions = await request(bases[0], '/game/suggestions', null, host.token);
          return Array.isArray(afterRejectSuggestions)
            && !afterRejectSuggestions.some(suggestion => suggestion.status === 'pending');
        }, 'process A reports no pending suggestions after rejection', rejectDeadline),
        waitForProofTextWhileConnected(
          page,
          webSocketTracker,
          scenarioCloseCount,
          text => text.length > 0 && !text.includes('Fixture A'),
          'browser Proof iframe removes Fixture A without disconnecting',
          rejectDeadline,
        ).then(text => { afterRejectIframeText = text; }),
      ]);
      const afterRejectText = await proofText(page);
      assert.equal(normalizeText(afterRejectText), normalizeText(baselineText), 'Proof iframe text is unchanged after in-place rejection propagation');
      assert.equal(occurrences(afterRejectText, lines[0]), 1, 'First canonical sentence occurs exactly once in the Proof iframe after rejection');
      assert.equal(occurrences(afterRejectText, 'Onze intent'), 1, 'Onze intent heading occurs exactly once in the Proof iframe after rejection');
      assert.equal(afterRejectMarkdown, baselineMarkdown, 'Canonical markdown is byte-for-byte unchanged after rejection');
      assert(!afterRejectSuggestions.some(suggestion => suggestion.status === 'pending'), 'Process A has no pending suggestions after rejection');
      assert(!afterRejectIframeText.includes('Fixture A'), 'Proof iframe no longer contains Fixture A after rejection');
      assert.equal(
        collabSocketCloseCount(webSocketTracker),
        scenarioCloseCount,
        'Cross-instance rejection causes zero collaboration WebSocket closes during the 10-second observation window',
      );

      const confirmedLines = markdownLines(afterRejectMarkdown);
      assert(confirmedLines.length >= 2, 'Unchanged canonical markdown still contains a second non-heading line');
      const secondQuote = confirmedLines[1];
      const secondSuggestion = await request(bases[1], '/game/mcp/suggest_document', {
        requestId: randomUUID(),
        quote: secondQuote,
        content: 'Fixture B',
      }, p2Mcp.token);
      const secondMarkId = Object.keys(secondSuggestion.marks || {})
        .find(markId => secondSuggestion.marks[markId]?.content === 'Fixture B');
      assert(secondMarkId, 'Second MCP suggestion response contains the Fixture B mark');
      await waitForProofTextWhileConnected(
        page,
        webSocketTracker,
        scenarioCloseCount,
        text => text.includes('Fixture B'),
        'second cross-instance suggestion appears without disconnecting',
        Date.now() + 10000,
      );

      const acceptIssuedAt = Date.now();
      const acceptance = await rawRequest(bases[1], '/game/suggestion-review', {
        id: secondMarkId,
        decision: 'accept',
        requestId: randomUUID(),
      }, host.token);
      assert.equal(
        acceptance.status,
        200,
        `Second suggestion accept returned HTTP ${acceptance.status}; response body: ${acceptance.text}`,
      );
      const acceptDeadline = acceptIssuedAt + 10000;
      let acceptedIframeText = '';
      await Promise.all([
        untilDeadline(async () => {
          const document = await request(bases[0], '/game/mcp/get_document', {}, p1Mcp.token);
          currentMarkdown = document.markdown;
          return occurrences(currentMarkdown, 'Fixture B') === 1 && !currentMarkdown.includes(secondQuote);
        }, 'process A canonical markdown contains Fixture B exactly once and no old quote', acceptDeadline),
        waitForProofTextWhileConnected(
          page,
          webSocketTracker,
          scenarioCloseCount,
          text => occurrences(text, 'Fixture B') === 1 && !text.includes(secondQuote),
          'browser Proof iframe contains Fixture B exactly once and no old quote without disconnecting',
          acceptDeadline,
        ).then(text => { acceptedIframeText = text; }),
      ]);
      assert.equal(occurrences(currentMarkdown, 'Fixture B'), 1, 'Canonical markdown contains Fixture B exactly once');
      assert(!currentMarkdown.includes(secondQuote), 'Canonical markdown no longer contains the accepted suggestion quote');
      assert.equal(occurrences(acceptedIframeText, 'Fixture B'), 1, 'Proof iframe contains Fixture B exactly once');
      assert(!acceptedIframeText.includes(secondQuote), 'Proof iframe no longer contains the accepted suggestion quote');
      assert.equal(
        collabSocketCloseCount(webSocketTracker),
        scenarioCloseCount,
        'The collaboration WebSocket has zero closes throughout reject and accept propagation',
      );
    } catch (error) {
      try {
        const document = await request(bases[0], '/game/mcp/get_document', {}, p1Mcp.token);
        currentMarkdown = document.markdown;
      } catch (diagnosticError) {
        currentMarkdown = `<get_document failed: ${diagnosticError.message}>`;
      }
      await printFailureDiagnostics({
        baselineMarkdown,
        afterRejectMarkdown,
        currentMarkdown,
        page,
        webSocketEvents: webSocketTracker.events,
      });
      throw error;
    }
  } catch (error) {
    primaryError = error;
  } finally {
    const cleanupErrors = [];
    const clean = async action => {
      try { await action(); } catch (error) { cleanupErrors.push(error); }
    };
    await clean(async () => { if (page && !page.isClosed()) await page.close(); });
    await clean(async () => { await browser?.close(); });
    const stopResults = await Promise.allSettled(processes.map(child => stop(child)));
    for (const result of stopResults) if (result.status === 'rejected') cleanupErrors.push(result.reason);
    await clean(async () => {
      const logDir = process.env.ACADEMY_TEST_LOG_DIR || path.resolve(root, '../../work');
      await mkdir(logDir, { recursive: true });
      await writeFile(path.join(logDir, 'distributed-browser-server.log'), logs.join(''), { mode: 0o600 });
    });
    await clean(async () => { await database.query(`DROP SCHEMA IF EXISTS "${academySchema}" CASCADE`); });
    await clean(async () => { await database.query(`DROP SCHEMA IF EXISTS "${proofSchema}" CASCADE`); });
    await clean(async () => { await database.close(); });
    await clean(async () => { await rm(temp, { recursive: true, force: true }); });
    await clean(async () => {
      assert(
        !/Failed to persist document|Await initializeDatabase before|Transaction scope is not available|fast-quarantined pathological slug|graceful shutdown failed/.test(logs.join('')),
        'Healthy browser collaboration fixture produced persistence, quarantine or shutdown errors; inspect private work/distributed-browser-server.log',
      );
    });
    if (cleanupErrors.length > 0) {
      console.error('Distributed browser cleanup errors:', cleanupErrors);
      if (!primaryError) primaryError = new AggregateError(cleanupErrors, 'Distributed browser test cleanup failed');
    }
  }
  if (primaryError) throw primaryError;
});
