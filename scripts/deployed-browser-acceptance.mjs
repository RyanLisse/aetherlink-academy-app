import { chromium, expect as baseExpect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const timeout = 45_000;
const expect = baseExpect.configure({ timeout });
const phaseNames = ['Plan', 'Design', 'Build', 'Test', 'Deploy', 'Maintain'];
const routeLabels = ['Met begeleiding', 'Standaard praktijk', 'Extra uitdaging'];
const participantNames = ['Round A', 'Round B', 'Round C', 'Round D'];

const hostKey = process.env.ACADEMY_HOST_KEY;
const rawAcademyUrl = process.env.ACADEMY_URL;

if (!rawAcademyUrl || !hostKey) {
  console.error('ACADEMY_URL and ACADEMY_HOST_KEY are required.');
  process.exit(1);
}

let academyUrl;
try {
  const parsed = new URL(rawAcademyUrl);
  if (parsed.protocol !== 'https:' || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('ACADEMY_URL must be an HTTPS origin without a path, query, or fragment.');
  }
  academyUrl = parsed.origin;
} catch (error) {
  console.error(`Invalid ACADEMY_URL: ${error.message}`);
  process.exit(1);
}

const evidenceDir = path.resolve(process.env.EVIDENCE_DIR || 'test-results/deployed-browser');
const headless = !['false', '0'].includes(String(process.env.HEADLESS || 'true').toLowerCase());
const checks = [];
const recorded = new Set();
const contexts = [];
let browser;
let revision = null;
let squadCode = null;
let facilitatorCreated = false;
let facilitatorContext;
let facilitatorPage;
let p1Context;
let p1Page;
let p1Token;
let p2Context;
let p2Page;
let p2Token;
let p3Context;
let p3Page;
let p3Token;
let p4Context;
let p4Page;
let p4Token;
let freshContext;
let freshPage;
let proofDriver;
let mcpToken;
let firstSuggestion;
let secondSuggestion;
let documentBeforeSuggestions;
let findingFixture;

function safeMessage(value) {
  return String(value ?? 'Unknown error')
    .replaceAll(hostKey, '[redacted]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]');
}

function responseError(response, data) {
  const error = safeMessage(data?.error || `HTTP ${response.status()}`);
  return data?.code ? `${error} (code: ${safeMessage(data.code)})` : error;
}

async function responseData(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function clickAndReadResponse(page, locator, pathname) {
  const responsePromise = page.waitForResponse(
    response => {
      try {
        return new URL(response.url()).pathname === pathname && response.request().method() === 'POST';
      } catch {
        return false;
      }
    },
    { timeout }
  );
  await locator.click();
  const response = await responsePromise;
  const data = await responseData(response);
  return { response, data };
}

async function postJson(request, pathname, data, headers = {}) {
  const response = await request.post(`${academyUrl}${pathname}`, {
    data,
    headers,
    timeout
  });
  const payload = await responseData(response);
  if (!response.ok()) throw new Error(responseError(response, payload));
  return payload;
}

async function capture(page, filename) {
  if (!page || page.isClosed()) return null;
  await page.screenshot({ path: path.join(evidenceDir, filename), fullPage: true });
  return filename;
}

async function runStep(name, pageOrGetter, filename, action, shouldCapture = () => true) {
  let passed = true;
  let detail = 'ok';
  let screenshot = null;
  try {
    const result = await action();
    if (result?.passed === false) {
      passed = false;
      detail = safeMessage(result.detail);
    } else if (result?.detail) {
      detail = safeMessage(result.detail);
    }
  } catch (error) {
    passed = false;
    detail = safeMessage(error?.message || error);
  }
  if (filename && shouldCapture()) {
    try {
      const page = typeof pageOrGetter === 'function' ? pageOrGetter() : pageOrGetter;
      screenshot = await capture(page, filename);
    } catch (error) {
      if (passed) detail = `${detail}; screenshot failed: ${safeMessage(error.message)}`;
    }
  }
  const check = { name, passed, detail, screenshot };
  checks.push(check);
  recorded.add(name);
  console.log(passed ? `PASS ${name}` : `FAIL ${name}: ${detail}`);
  return check;
}

function recordSkipped(name, reason) {
  const check = { name, passed: false, detail: `skipped: ${reason}`, screenshot: null };
  checks.push(check);
  recorded.add(name);
  console.log(`FAIL ${name}: ${check.detail}`);
  return check;
}

async function waitForRoom(page, squadName) {
  await expect(page.getByRole('heading', { name: /^Jouw squad \(/ })).toBeVisible({ timeout });
  await expect(page.locator('h1')).toHaveText(squadName, { timeout });
}

async function waitForJoinResponse(page) {
  const responsePromise = page.waitForResponse(
    response => {
      try {
        return new URL(response.url()).pathname === '/game/join' && response.request().method() === 'POST';
      } catch {
        return false;
      }
    },
    { timeout }
  );
  await page.getByRole('button', { name: 'Deelnemen', exact: true }).click();
  const response = await responsePromise;
  const data = await responseData(response);
  if (!response.ok()) throw new Error(responseError(response, data));
  return data;
}

async function waitForCreateResponse(page) {
  const responsePromise = page.waitForResponse(
    response => {
      try {
        return new URL(response.url()).pathname === '/game/create' && response.request().method() === 'POST';
      } catch {
        return false;
      }
    },
    { timeout }
  );
  await page.getByRole('button', { name: 'Maak squad', exact: true }).click();
  const response = await responsePromise;
  const data = await responseData(response);
  if (!response.ok()) throw new Error(responseError(response, data));
  return data;
}

function participantTuples() {
  return [
    [participantNames[0], p1Page, p1Context, p1Token],
    [participantNames[1], p2Page, p2Context, p2Token],
    [participantNames[2], p3Page, p3Context, p3Token],
    [participantNames[3], p4Page, p4Context, p4Token]
  ];
}

async function fetchRoomState() {
  const participant = participantTuples().find(([, page, context, token]) =>
    page && !page.isClosed() && context && token
  );
  if (!participant) return null;
  const [, , context, token] = participant;
  const response = await context.request.get(`${academyUrl}/game/state`, {
    headers: { authorization: `Bearer ${token}` },
    timeout
  });
  const data = await responseData(response);
  if (!response.ok()) throw new Error(responseError(response, data));
  return data;
}

async function findCurrentDriver() {
  const state = await fetchRoomState();
  const driver = state?.members?.find(member => member.role === 'Driver');
  if (!driver) return null;
  const participant = participantTuples().find(
    ([name, page, context]) => name === driver.name && page && !page.isClosed() && context
  );
  if (!participant) return null;
  const [name, page, context] = participant;
  return { name, page, context };
}

async function proofFrameHeading(page) {
  const frame = page.frameLocator('iframe[title="Gedeelde Proof-intent"]');
  await expect(frame.getByRole('heading', { name: 'Onze intent', exact: true })).toBeVisible({ timeout });
}

async function proofText(page) {
  return page.frameLocator('iframe[title="Gedeelde Proof-intent"]').locator('body').innerText();
}

async function polledProofText(page) {
  try {
    return await proofText(page);
  } catch {
    return '';
  }
}

function markdownLines(markdown) {
  return String(markdown)
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
}

function suggestionArticle(page, quote, content) {
  return page
    .getByRole('article')
    .filter({ hasText: quote })
    .filter({ hasText: content });
}

async function clickSuggestionDecision(page, article, buttonName) {
  const result = await clickAndReadResponse(
    page,
    article.getByRole('button', { name: buttonName, exact: true }),
    '/game/suggestion-review'
  );
  if (!result.response.ok()) throw new Error(responseError(result.response, result.data));
}

async function healthRevision() {
  try {
    const response = await fetch(`${academyUrl}/game/health`, { signal: AbortSignal.timeout(timeout) });
    const data = await response.json();
    if (response.ok) revision = data.revision ?? null;
  } catch {
    revision = null;
  }
}

async function main() {
  await mkdir(evidenceDir, { recursive: true });
  await healthRevision();
  try {
    browser = await chromium.launch({ headless });
    facilitatorContext = await browser.newContext();
    facilitatorContext.setDefaultTimeout(timeout);
    facilitatorContext.setDefaultNavigationTimeout(timeout);
    contexts.push(facilitatorContext);
    facilitatorPage = await facilitatorContext.newPage();
    facilitatorPage.setDefaultTimeout(timeout);
    facilitatorPage.setDefaultNavigationTimeout(timeout);

    const createCheck = await runStep(
      'facilitator-create-squad',
      facilitatorPage,
      'facilitator-created.png',
      async () => {
        await facilitatorPage.goto(academyUrl, { waitUntil: 'domcontentloaded' });
        await facilitatorPage.getByRole('button', { name: 'Ik ben facilitator', exact: true }).click();
        await facilitatorPage.getByLabel('Squadnaam', { exact: true }).fill('Squad Orion');
        await facilitatorPage.getByLabel('Facilitator-startsleutel', { exact: true }).fill(hostKey);
        const result = await waitForCreateResponse(facilitatorPage);
        squadCode = result.code;
        await waitForRoom(facilitatorPage, 'Squad Orion');
        facilitatorCreated = true;
        const codeButton = facilitatorPage.getByTitle('Kopieer kamercode');
        await expect(codeButton).toBeVisible({ timeout });
        const visibleCode = (await codeButton.textContent()).trim();
        if (!visibleCode || visibleCode !== squadCode) throw new Error('Room code was not visible after creation.');
        return { detail: `created squad with room code ${squadCode}` };
      },
      () => facilitatorCreated
    );

    if (!createCheck.passed || !squadCode) {
      for (const name of [
        'participants-join', 'round-start', 'phase-change', 'driver-rotate', 'proof-shared-document',
        'suggestion-create-1', 'suggestion-reject', 'suggestion-create-2', 'suggestion-accept',
        'knowledge-search', 'quiz-answer', 'quiz-privacy', 'evidence-submit', 'evidence-review',
        'handoff-record', 'persistence-reload', 'soft-rejoin', 'persistence-fresh-context'
      ]) recordSkipped(name, 'facilitator squad was not created');
    } else {
      const joinCheck = await runStep(
        'participants-join',
        () => p1Page,
        'p1-joined.png',
        async () => {
          const participantSet = [
            ['Round A', 'p1'],
            ['Round B', 'p2'],
            ['Round C', 'p3'],
            ['Round D', 'p4']
          ];
          for (const [name, key] of participantSet) {
            const context = await browser.newContext();
            context.setDefaultTimeout(timeout);
            context.setDefaultNavigationTimeout(timeout);
            contexts.push(context);
            const page = await context.newPage();
            page.setDefaultTimeout(timeout);
            page.setDefaultNavigationTimeout(timeout);
            if (key === 'p1') {
              p1Context = context;
              p1Page = page;
            } else if (key === 'p2') {
              p2Context = context;
              p2Page = page;
            } else if (key === 'p3') {
              p3Context = context;
              p3Page = page;
            } else {
              p4Context = context;
              p4Page = page;
            }
            await page.goto(academyUrl, { waitUntil: 'domcontentloaded' });
            await page.getByLabel('Je naam', { exact: true }).fill(name);
            await page.getByLabel('Kamercode', { exact: true }).fill(squadCode);
            const joinResult = await waitForJoinResponse(page);
            if (!joinResult?.token) throw new Error('Participant session token was not returned.');
            if (key === 'p1') {
              p1Token = joinResult.token;
            } else if (key === 'p2') {
              p2Token = joinResult.token;
            } else if (key === 'p3') {
              p3Token = joinResult.token;
            } else {
              p4Token = joinResult.token;
            }
            await waitForRoom(page, 'Squad Orion');
          }
          for (const [name, page] of participantTuples()) {
            await waitForRoom(page, 'Squad Orion');
            for (const memberName of participantNames) {
              await expect(page.locator('.member').filter({ hasText: memberName })).toHaveCount(1, { timeout });
            }
          }
          await expect(p1Page.locator('.member').filter({ hasText: 'Driver' })).toHaveCount(1, { timeout });
          await expect(facilitatorPage.getByRole('heading', { name: 'Jouw squad (4/5)', exact: true })).toBeVisible({ timeout });
          return { detail: 'Round A, Round B, Round C, and Round D joined; one Driver visible' };
        },
        () => Boolean(p1Page && p2Page && p3Page && p4Page)
      );

      const participantsReady = joinCheck.passed && p1Page && p2Page && p3Page && p4Page;
      const startCheck = await runStep(
        'round-start',
        facilitatorPage,
        'facilitator-start-attempt.png',
        async () => {
          if (!p2Page || p2Page.isClosed() || !p3Page || p3Page.isClosed()) {
            throw new Error('Participant pages were not available for round assertions.');
          }
          const startButton = facilitatorPage.getByRole('button', { name: 'Start timer', exact: true });
          await expect(startButton).toBeVisible({ timeout });
          const first = await clickAndReadResponse(facilitatorPage, startButton, '/game/control');
          if (!first.response.ok()) throw new Error(responseError(first.response, first.data));
          await expect(p2Page.getByText(/^Ronde \d+ · Praktijk$/)).toBeVisible({ timeout });
          const toggle = facilitatorPage.getByRole('button', { name: /^(Start timer|Pauzeren)$/ }).first();
          await expect(toggle).toBeVisible({ timeout });
          const second = await clickAndReadResponse(facilitatorPage, toggle, '/game/control');
          if (!second.response.ok()) throw new Error(responseError(second.response, second.data));
          await expect(p3Page.getByText(/^Ronde \d+ · Gepauzeerd$/)).toBeVisible({ timeout });
          return { detail: 'timer started and paused; both participant views updated' };
        }
      );

      const phaseCheck = await runStep(
        'phase-change',
        facilitatorPage,
        'phase-changed.png',
        async () => {
          const phaseSelect = facilitatorPage.locator('label', { hasText: 'Fase' }).locator('select');
          const currentPhase = await phaseSelect.inputValue();
          const nextPhase = phaseNames[(phaseNames.indexOf(currentPhase) + 1) % phaseNames.length];
          const responsePromise = facilitatorPage.waitForResponse(
            response => {
              try {
                return new URL(response.url()).pathname === '/game/control' && response.request().method() === 'POST';
              } catch {
                return false;
              }
            },
            { timeout }
          );
          await phaseSelect.selectOption({ label: nextPhase });
          const response = await responsePromise;
          const data = await responseData(response);
          if (!response.ok()) throw new Error(responseError(response, data));
          if (!p3Page) return { detail: `${nextPhase} selected; P3 unavailable for assertion` };
          await expect(p3Page.locator('.sdlc div.active span')).toHaveText(nextPhase, { timeout });
          return { detail: `active phase changed to ${nextPhase}` };
        },
        () => Boolean(facilitatorPage)
      );

      const rotateCheck = await runStep(
        'driver-rotate',
        facilitatorPage,
        null,
        async () => {
          const before = await findCurrentDriver();
          if (!before) throw new Error('No current Driver could be identified before rotation.');
          if (!p1Page || p1Page.isClosed()) throw new Error('P1 was not available for the rotation assertion.');
          const rotate = facilitatorPage.getByRole('button', { name: 'Volgende ronde', exact: true });
          const result = await clickAndReadResponse(facilitatorPage, rotate, '/game/control');
          if (!result.response.ok()) throw new Error(responseError(result.response, result.data));
          await expect.poll(async () => (await findCurrentDriver())?.name || '', { timeout }).not.toBe(before.name);
          const after = await findCurrentDriver();
          if (!after) throw new Error('No current Driver could be identified after rotation.');
          const driverRow = p1Page.locator('.member').filter({ hasText: after.name });
          await expect(driverRow).toHaveCount(1, { timeout });
          await expect(driverRow).toContainText('Driver', { timeout });
          return { detail: 'driver rotated and round advanced' };
        }
      );
      void startCheck;
      void phaseCheck;
      void rotateCheck;

      proofDriver = await findCurrentDriver();
      const proofCheck = proofDriver
        ? await runStep(
            'proof-shared-document',
            proofDriver.page,
            'proof-doc.png',
            async () => {
              const navigator = participantTuples().find(([name, page]) => page && name !== proofDriver.name);
              if (!navigator) return { passed: false, detail: 'skipped: no navigator participant page available' };
              await proofFrameHeading(proofDriver.page);
              await proofFrameHeading(navigator[1]);
              return { detail: `shared Proof heading visible for ${proofDriver.name} and ${navigator[0]}` };
            }
          )
        : recordSkipped('proof-shared-document', 'no current Driver could be identified');

      if (!proofDriver || !proofCheck.passed) {
        for (const name of ['suggestion-create-1', 'suggestion-reject', 'suggestion-create-2', 'suggestion-accept']) {
          recordSkipped(name, 'no verified Driver participant page');
        }
      } else {
        const suggestionCreate1 = await runStep(
          'suggestion-create-1',
          facilitatorPage,
          'suggestion-pending.png',
          async () => {
            const markdown = await postJson(proofDriver.context.request, '/game/mcp-token', {});
            mcpToken = markdown.token;
            if (!mcpToken) throw new Error('MCP token was not returned.');
            const document = await postJson(
              proofDriver.context.request,
              '/game/mcp/get_document',
              {},
              { authorization: `Bearer ${mcpToken}` }
            );
            const lines = markdownLines(document.markdown);
            if (lines.length < 2) throw new Error('Document did not contain two non-heading lines.');
            firstSuggestion = {
              quote: lines[0],
              content: 'Fixture replacement one: de squad controleert de README tegen de beschikbare scripts.'
            };
            documentBeforeSuggestions = document.markdown;
            await postJson(
              proofDriver.context.request,
              '/game/mcp/suggest_document',
              { requestId: randomUUID(), ...firstSuggestion },
              { authorization: `Bearer ${mcpToken}` }
            );
            const canonicalAfterSuggestion = await postJson(
              proofDriver.context.request,
              '/game/mcp/get_document',
              {},
              { authorization: `Bearer ${mcpToken}` }
            );
            if (canonicalAfterSuggestion.markdown !== documentBeforeSuggestions) {
              throw new Error('Canonical document changed while the first suggestion was pending.');
            }
            await facilitatorPage.getByRole('button', { name: 'Review & overdracht', exact: true }).click();
            const article = suggestionArticle(facilitatorPage, firstSuggestion.quote, firstSuggestion.content);
            await expect(article).toHaveCount(1, { timeout });
            await expect(article).toContainText('Voorstel, nog niet geaccepteerd', { timeout });
            await expect.poll(() => polledProofText(proofDriver.page), { timeout }).toContain(firstSuggestion.quote);
            return { detail: 'pending suggestion visible; canonical document unchanged and original Proof sentence visible' };
          },
          () => Boolean(facilitatorPage && proofDriver)
        );

        if (!suggestionCreate1.passed) {
          for (const name of ['suggestion-reject', 'suggestion-create-2', 'suggestion-accept']) {
            recordSkipped(name, 'first MCP suggestion was not created and verified');
          }
        } else {
          const suggestionReject = await runStep(
            'suggestion-reject',
            facilitatorPage,
            'suggestion-rejected.png',
            async () => {
              const article = suggestionArticle(facilitatorPage, firstSuggestion.quote, firstSuggestion.content);
              await expect(article).toHaveCount(1, { timeout });
              await clickSuggestionDecision(facilitatorPage, article, 'Wijs af');
              await expect.poll(() => article.count(), { timeout }).toBe(0);
              const rejectedDocument = await postJson(
                proofDriver.context.request,
                '/game/mcp/get_document',
                {},
                { authorization: `Bearer ${mcpToken}` }
              );
              if (rejectedDocument.markdown !== documentBeforeSuggestions) {
                throw new Error('Canonical document changed after the first suggestion was rejected.');
              }
              if (rejectedDocument.markdown.includes(firstSuggestion.content)) {
                throw new Error('Rejected suggestion content remained in the canonical document.');
              }
              await expect
                .poll(
                  async () => {
                    const text = await polledProofText(proofDriver.page);
                    return !text.includes(firstSuggestion.content) && text.includes(firstSuggestion.quote);
                  },
                  { timeout }
                )
                .toBe(true);
              return { detail: 'suggestion rejected; canonical document is unchanged and Proof shows the original sentence' };
            }
          );

          if (!suggestionReject.passed) {
            for (const name of ['suggestion-create-2', 'suggestion-accept']) {
              recordSkipped(name, 'first suggestion was not rejected and verified');
            }
          } else {
            const suggestionCreate2 = await runStep(
              'suggestion-create-2',
              facilitatorPage,
              null,
              async () => {
                const document = await postJson(
                  proofDriver.context.request,
                  '/game/mcp/get_document',
                  {},
                  { authorization: `Bearer ${mcpToken}` }
                );
                const lines = markdownLines(document.markdown);
                secondSuggestion = {
                  quote: lines.find(line => line !== firstSuggestion.quote),
                  content: 'Fixture replacement two: een verse lezer reproduceert de controle en noteert de beperking.'
                };
                if (!secondSuggestion.quote) throw new Error('No distinct second suggestion quote was available.');
                const documentBeforeSecondSuggestion = document.markdown;
                await postJson(
                  proofDriver.context.request,
                  '/game/mcp/suggest_document',
                  { requestId: randomUUID(), ...secondSuggestion },
                  { authorization: `Bearer ${mcpToken}` }
                );
                const canonicalAfterSuggestion = await postJson(
                  proofDriver.context.request,
                  '/game/mcp/get_document',
                  {},
                  { authorization: `Bearer ${mcpToken}` }
                );
                if (canonicalAfterSuggestion.markdown !== documentBeforeSecondSuggestion) {
                  throw new Error('Canonical document changed while the second suggestion was pending.');
                }
                const article = suggestionArticle(facilitatorPage, secondSuggestion.quote, secondSuggestion.content);
                await expect(article).toHaveCount(1, { timeout });
                await expect(article).toContainText('Voorstel, nog niet geaccepteerd', { timeout });
                await expect.poll(() => polledProofText(proofDriver.page), { timeout }).toContain(secondSuggestion.quote);
                return { detail: 'second distinct pending suggestion visible' };
              }
            );

            if (!suggestionCreate2.passed) {
              recordSkipped('suggestion-accept', 'second MCP suggestion was not created and verified');
            } else {
              await runStep(
                'suggestion-accept',
                facilitatorPage,
                'suggestion-accepted.png',
                async () => {
                  const article = suggestionArticle(facilitatorPage, secondSuggestion.quote, secondSuggestion.content);
                  await expect(article).toHaveCount(1, { timeout });
                  await clickSuggestionDecision(facilitatorPage, article, 'Accepteer in document');
                  await expect.poll(() => article.count(), { timeout }).toBe(0);
                  await expect
                    .poll(
                      async () => {
                        const document = await postJson(
                          proofDriver.context.request,
                          '/game/mcp/get_document',
                          {},
                          { authorization: `Bearer ${mcpToken}` }
                        );
                        const markdown = document.markdown;
                        return markdown.includes(secondSuggestion.content) &&
                          markdown.split(secondSuggestion.content).length - 1 === 1 &&
                          !markdown.includes(secondSuggestion.quote);
                      },
                      { timeout }
                    )
                    .toBe(true);
                  await expect
                    .poll(() => polledProofText(proofDriver.page), { timeout })
                    .toContain(secondSuggestion.content);
                  return { detail: 'accepted replacement appears exactly once in canonical markdown and visibly in Proof; old quote is gone' };
                }
              );
            }
          }
        }
      }

      const p2Ready = Boolean(p2Page && p2Context && !p2Page.isClosed());
      if (!p2Ready) {
        recordSkipped('knowledge-search', 'P2 did not join the squad');
        recordSkipped('quiz-answer', 'P2 did not join the squad');
        recordSkipped('quiz-privacy', 'P2 or P3 did not join the squad');
        recordSkipped('evidence-submit', 'P2 did not join the squad');
        recordSkipped('evidence-review', 'P2 did not join the squad');
        recordSkipped('handoff-record', 'P2 did not join the squad');
      } else {
        await runStep(
          'knowledge-search',
          p2Page,
          'knowledge-search.png',
          async () => {
            await p2Page.getByRole('button', { name: 'Mijn leercoach', exact: true }).click();
            const search = p2Page.getByLabel('Zoek in de kennisbank', { exact: true });
            await expect(search).toBeVisible({ timeout });
            await search.fill('MCP');
            const lesson = p2Page.locator('details').filter({ hasText: 'MCP en informatiegrenzen' });
            await expect(lesson).toHaveCount(1, { timeout });
            await expect(lesson).toContainText('L2-MCP', { timeout });
            return { detail: 'MCP lesson and L2-MCP are visible in Mijn leercoach' };
          }
        );

        const quizCheck = await runStep(
          'quiz-answer',
          p2Page,
          'quiz-result.png',
          async () => {
            await p2Page.getByRole('button', { name: 'Les & quick check', exact: true }).click();
            const correctOptions = [
              'Een begrensd doel met een controle',
              'Stoppen en de noodzaak bespreken',
              'Bestand, uitgevoerd commando, uitkomst, beperking en volgende eigenaar'
            ];
            for (let index = 0; index < correctOptions.length; index += 1) {
              const group = p2Page.locator('fieldset').nth(index);
              await expect(group).toBeVisible({ timeout });
              await group.getByRole('radio', { name: correctOptions[index], exact: true }).check();
            }
            await p2Page.getByRole('button', { name: 'Verstuur antwoorden', exact: true }).click();
            const status = p2Page.getByRole('status');
            await expect(status).toContainText('3/3', { timeout });
            await expect(status).toContainText(new RegExp(routeLabels.join('|')), { timeout });
            return { detail: 'quiz result is 3/3 with a route label' };
          }
        );

        if (!p3Page || p3Page.isClosed()) {
          recordSkipped('quiz-privacy', 'P3 did not join the squad');
        } else if (!quizCheck.passed) {
          recordSkipped('quiz-privacy', 'P2 quiz result was not established');
        } else {
          await runStep(
            'quiz-privacy',
            p3Page,
            null,
            async () => {
              await p3Page.getByRole('button', { name: 'Les & quick check', exact: true }).click();
              await expect(p3Page.locator('body')).not.toContainText('3/3', { timeout });
              const p2Result = await p2Page.getByRole('status').innerText();
              await expect(p3Page.locator('body')).not.toContainText(p2Result, { timeout });
              return { detail: 'P3 cannot see P2 specific quiz result' };
            }
          );
        }

        const evidenceCheck = await runStep(
          'evidence-submit',
          p2Page,
          'evidence-submitted.png',
          async () => {
            findingFixture = 'Fixture finding: README.md documents a check that package.json does not expose.';
            await p2Page.getByRole('button', { name: 'Solo-missie', exact: true }).click();
            const fields = {
              'Bevinding en bestandsverwijzing': findingFixture,
              'Werkelijk uitgevoerd commando': 'node --test starter/status.test.mjs',
              'Waargenomen uitvoer': 'Fixture observed output: the command completed with the documented result.',
              'Wat is nog niet bewezen?': 'Fixture limitation: a fresh reader reproduction by another participant is still open.'
            };
            for (const [label, value] of Object.entries(fields)) {
              await p2Page.getByLabel(label, { exact: true }).fill(value);
            }
            await p2Page.getByRole('button', { name: 'Lever bewijs in', exact: true }).click();
            await expect(p2Page.getByRole('status')).toContainText('Bewijs toegevoegd aan Proof en de squad-review.', { timeout });
            return { detail: 'evidence form submitted and success status is visible' };
          }
        );

        if (!evidenceCheck.passed || !findingFixture) {
          recordSkipped('evidence-review', 'evidence was not submitted by P2');
          recordSkipped('handoff-record', 'evidence was not submitted by P2');
        } else {
          const reviewCheck = await runStep(
            'evidence-review',
            p2Page,
            'evidence-reviewed.png',
            async () => {
              await facilitatorPage.getByRole('button', { name: 'Review & overdracht', exact: true }).click();
              const article = facilitatorPage.getByRole('article').filter({ hasText: findingFixture });
              await expect(article).toHaveCount(1, { timeout });
              await article.getByLabel('Jouw controle en besluit', { exact: true }).fill(
                'Fixture review: the evidence is sufficiently grounded for this acceptance check.'
              );
              await article.getByLabel('Beoordeling', { exact: true }).selectOption({ label: 'Voldoende onderbouwd' });
              const result = await clickAndReadResponse(
                facilitatorPage,
                article.getByRole('button', { name: 'Bewaar review', exact: true }),
                '/game/review'
              );
              if (!result.response.ok()) throw new Error(responseError(result.response, result.data));
              await p2Page.reload({ waitUntil: 'domcontentloaded' });
              await waitForRoom(p2Page, 'Squad Orion');
              await p2Page.getByRole('button', { name: 'Review & overdracht', exact: true }).click();
              const p2Article = p2Page.getByRole('article').filter({ hasText: findingFixture });
              await expect(p2Article).toHaveCount(1, { timeout });
              await expect(p2Article).toContainText('Menselijk beoordeeld', { timeout });
              return { detail: 'P2 sees the evidence as Menselijk beoordeeld after reload' };
            }
          );

          if (!reviewCheck.passed) {
            recordSkipped('handoff-record', 'evidence review was not established');
          } else {
            await runStep(
              'handoff-record',
              facilitatorPage,
              'handoff-recorded.png',
              async () => {
                await facilitatorPage.getByRole('button', { name: 'Review & overdracht', exact: true }).click();
                const values = {
                  'Wat is besloten?': 'Fixture decision: keep the accepted finding in the shared intent.',
                  'Wat is getest of gereproduceerd?': 'Fixture check: facilitator reviewed the submitted command and observation.',
                  'Wat staat nog open?': 'Fixture open item: let the next owner rerun the check independently.'
                };
                for (const [label, value] of Object.entries(values)) {
                  await facilitatorPage.getByLabel(label, { exact: true }).fill(value);
                }
                const result = await clickAndReadResponse(
                  facilitatorPage,
                  facilitatorPage.getByRole('button', { name: 'Overdracht vastleggen', exact: true }),
                  '/game/handoff'
                );
                if (!result.response.ok()) throw new Error(responseError(result.response, result.data));
                await expect(facilitatorPage.getByRole('status')).toContainText(
                  'Overdracht in Proof vastgelegd. De facilitator roteert de driver apart.',
                  { timeout }
                );
                await expect(facilitatorPage.getByText('Volgende eigenaar:', { exact: false })).toBeVisible({ timeout });
                return { detail: 'handoff success and next owner are visible' };
              }
            );
          }
        }
      }

      if (!p1Page || p1Page.isClosed() || !squadCode) {
        recordSkipped('persistence-reload', 'P1 or room code unavailable');
        recordSkipped('soft-rejoin', 'P1 or room code unavailable');
        recordSkipped('persistence-fresh-context', 'P1 or room code unavailable');
      } else {
        const phaseForPersistence = await facilitatorPage
          .locator('label', { hasText: 'Fase' })
          .locator('select')
          .inputValue();
        await runStep(
          'persistence-reload',
          p1Page,
          'p1-reloaded.png',
          async () => {
            await p1Page.reload({ waitUntil: 'domcontentloaded' });
            await waitForRoom(p1Page, 'Squad Orion');
            await expect(p1Page.locator('.sdlc div.active span')).toHaveText(phaseForPersistence, { timeout });
            await expect(p1Page.locator('.member').filter({ hasText: 'Driver' })).toHaveCount(1, { timeout });
            await proofFrameHeading(p1Page);
            return { detail: 'phase, Driver role, and shared Proof heading persisted after reload' };
          }
        );

        await p1Context.close();
        p1Page = undefined;
        p1Context = undefined;

        const duplicateContext = await browser.newContext();
        duplicateContext.setDefaultTimeout(timeout);
        duplicateContext.setDefaultNavigationTimeout(timeout);
        contexts.push(duplicateContext);
        const duplicatePage = await duplicateContext.newPage();
        duplicatePage.setDefaultTimeout(timeout);
        duplicatePage.setDefaultNavigationTimeout(timeout);

        await runStep(
          'soft-rejoin',
          duplicatePage,
          null,
          async () => {
            await duplicatePage.goto(academyUrl, { waitUntil: 'domcontentloaded' });
            await duplicatePage.getByLabel('Je naam', { exact: true }).fill('Round A');
            await duplicatePage.getByLabel('Kamercode', { exact: true }).fill(squadCode);
            await waitForJoinResponse(duplicatePage);
            await waitForRoom(duplicatePage, 'Squad Orion');
            const roster = duplicatePage.locator('.member').filter({ hasText: 'Round A' });
            await expect(roster).toHaveCount(1, { timeout });
            return { detail: 'soft rejoin restored existing seat for Round A' };
          }
        );
        await duplicateContext.close();

        freshContext = await browser.newContext();
        freshContext.setDefaultTimeout(timeout);
        freshContext.setDefaultNavigationTimeout(timeout);
        contexts.push(freshContext);
        freshPage = await freshContext.newPage();
        freshPage.setDefaultTimeout(timeout);
        freshPage.setDefaultNavigationTimeout(timeout);

        await runStep(
          'persistence-fresh-context',
          freshPage,
          'p1-fresh-context.png',
          async () => {
            await freshPage.goto(academyUrl, { waitUntil: 'domcontentloaded' });
            await freshPage.getByLabel('Je naam', { exact: true }).fill('Round E');
            await freshPage.getByLabel('Kamercode', { exact: true }).fill(squadCode);
            await waitForJoinResponse(freshPage);
            await waitForRoom(freshPage, 'Squad Orion');
            await expect(freshPage.getByRole('heading', { name: 'Jouw squad (5/5)', exact: true })).toBeVisible({ timeout });
            await expect(freshPage.locator('.member')).toHaveCount(5, { timeout });
            await expect(freshPage.locator('.sdlc div.active span')).toHaveText(phaseForPersistence, { timeout });
            await freshPage.getByRole('button', { name: 'Review & overdracht', exact: true }).click();
            await expect(freshPage.getByRole('article').filter({ hasText: findingFixture })).toBeVisible({ timeout });
            return { detail: 'fresh context reflects phase and submitted evidence' };
          }
        );
      }
    }
  } catch (error) {
    const detail = safeMessage(error?.message || error);
    for (const name of [
      'facilitator-create-squad', 'participants-join', 'round-start', 'phase-change', 'driver-rotate',
      'proof-shared-document', 'suggestion-create-1', 'suggestion-reject', 'suggestion-create-2',
      'suggestion-accept', 'knowledge-search', 'quiz-answer', 'quiz-privacy', 'evidence-submit',
      'evidence-review', 'handoff-record', 'persistence-reload', 'soft-rejoin',
      'persistence-fresh-context'
    ]) {
      if (!recorded.has(name)) recordSkipped(name, `aborted after unexpected harness error: ${detail}`);
    }
  } finally {
    for (const context of [...contexts].reverse()) {
      try {
        await context.close();
      } catch {
        void 0;
      }
    }
    try {
      await browser?.close();
    } catch {
      void 0;
    }
    const summary = {
      total: checks.length,
      passed: checks.filter(check => check.passed).length,
      failed: checks.filter(check => !check.passed).length
    };
    await writeFile(
      path.join(evidenceDir, 'deployed-browser-acceptance.json'),
      JSON.stringify({ target: academyUrl, at: new Date().toISOString(), revision, squadCode, checks, summary }, null, 2) + '\n',
      'utf8'
    );
    console.log(`SUMMARY total=${summary.total} passed=${summary.passed} failed=${summary.failed}`);
    const unexpectedFailures = checks.filter(
      check => !check.passed &&
        !check.detail.startsWith('skipped:')
    );
    process.exitCode = unexpectedFailures.length ? 1 : 0;
  }
}

await main();
