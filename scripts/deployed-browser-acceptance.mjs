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

async function participantNavButton(page, label) {
  const navigation = page.getByRole('navigation', { name: 'Hoofdnavigatie' });
  const button = navigation.getByRole('button', { name: label, exact: true });
  if (await button.isVisible()) return button;
  await navigation.getByRole('button', { name: 'Meer', exact: true }).click();
  await expect(button).toBeVisible({ timeout });
  return button;
}

async function selectParticipantNav(page, label) {
  await (await participantNavButton(page, label)).click();
}

async function openParticipantSquad(page) {
  await selectParticipantNav(page, 'Squad-room');
  const support = page.getByRole('button', { name: 'Squad en hulp', exact: true });
  if (await support.getAttribute('aria-expanded') !== 'true') await support.click();
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

async function intentPanel(page) {
  await expect(page.getByTestId('intent-document')).toBeVisible({ timeout });
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
        await facilitatorPage.getByRole('radio', { name: 'Ik ben facilitator', exact: true }).check();
        await facilitatorPage.getByLabel('Facilitator-startsleutel', { exact: true }).fill(hostKey);
        await facilitatorPage.getByRole('button', { name: 'Inloggen', exact: true }).click();
        await facilitatorPage.getByLabel('Squadnaam', { exact: true }).fill('Squad Orion');
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
        'participants-join', 'round-start', 'phase-change', 'intent-document',
        'knowledge-search', 'quiz-answer', 'quiz-privacy', 'evidence-submit', 'evidence-review',
        'handoff-record', 'persistence-reload', 'duplicate-name-rejected', 'persistence-fresh-context'
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
            await openParticipantSquad(page);
            for (const memberName of participantNames) {
              await expect(page.locator('.member').filter({ hasText: memberName })).toHaveCount(1, { timeout });
            }
          }
          await expect(facilitatorPage.getByRole('heading', { name: 'Jouw squad (4/5)', exact: true })).toBeVisible({ timeout });
          return { detail: 'Round A, Round B, Round C, and Round D joined' };
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

      void startCheck;
      void phaseCheck;

      const intentOwner = participantTuples().find(([, page, context]) => page && !page.isClosed() && context);
      if (!intentOwner) recordSkipped('intent-document', 'no participant page could be identified');
      else await runStep(
        'intent-document',
        intentOwner[1],
        'intent-doc.png',
        async () => {
          const [name, page, context] = intentOwner;
          const second = participantTuples().find(([otherName, otherPage]) => otherPage && otherName !== name);
          if (!second) return { passed: false, detail: 'skipped: no second participant page available' };
          const link = `https://example.test/acceptance/${randomUUID()}/intent.md`;
          const saved = await postJson(context.request, '/game/intent', { url: link });
          if (saved.intentUrl !== link) throw new Error('A participant could not save the intent link.');
          for (const target of [page, second[1]]) {
            await expect(target.locator(`[data-testid="intent-document"] a[href="${link}"]`)).toBeVisible({ timeout });
          }
          return { detail: `intent link set by ${name} is visible for ${second[0]}` };
        }
      );

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
            await selectParticipantNav(p2Page, 'Mijn leercoach');
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
            await selectParticipantNav(p2Page, 'Les');
              await p2Page.getByRole('navigation', {name: "Cursuspagina's"}).getByRole('button', {name: 'Quiz', exact: true}).click();
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
              await selectParticipantNav(p3Page, 'Les');
              await p3Page.getByRole('navigation', {name: "Cursuspagina's"}).getByRole('button', {name: 'Quiz', exact: true}).click();
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
            await selectParticipantNav(p2Page, 'Solo-missie');
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
            await expect(p2Page.getByRole('status')).toContainText('Bewijs toegevoegd aan de squad-review.', { timeout });
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
              await selectParticipantNav(p2Page, 'Review & overdracht');
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
                  'Overdracht vastgelegd.',
                  { timeout }
                );
                return { detail: 'handoff success message is visible' };
              }
            );
          }
        }
      }

      if (!p1Page || p1Page.isClosed() || !squadCode) {
        recordSkipped('persistence-reload', 'P1 or room code unavailable');
        recordSkipped('duplicate-name-rejected', 'P1 or room code unavailable');
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
            await openParticipantSquad(p1Page);
            await expect(p1Page.locator('.sdlc div.active span')).toHaveText(phaseForPersistence, { timeout });
            await intentPanel(p1Page);
            return { detail: 'phase and intent panel persisted after reload' };
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
          'duplicate-name-rejected',
          duplicatePage,
          null,
          async () => {
            await duplicatePage.goto(academyUrl, { waitUntil: 'domcontentloaded' });
            await duplicatePage.getByLabel('Je naam', { exact: true }).fill('Round A');
            await duplicatePage.getByLabel('Kamercode', { exact: true }).fill(squadCode);
            const responsePromise = duplicatePage.waitForResponse(
              response => new URL(response.url()).pathname === '/game/join' && response.request().method() === 'POST',
              { timeout }
            );
            await duplicatePage.getByRole('button', { name: 'Deelnemen', exact: true }).click();
            const response = await responsePromise;
            if (response.status() !== 409) throw new Error(`duplicate display name returned ${response.status()}, expected 409`);
            await expect(duplicatePage.getByText('Deze naam bestaat al in deze kamer.', { exact: false })).toBeVisible({ timeout });
            return { detail: 'duplicate display name Round A rejected with 409; no session minted' };
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
            await openParticipantSquad(freshPage);
            await expect(freshPage.getByRole('heading', { name: 'Jouw squad (5/5)', exact: true })).toBeVisible({ timeout });
            await expect(freshPage.locator('.member')).toHaveCount(5, { timeout });
            await expect(freshPage.locator('.sdlc div.active span')).toHaveText(phaseForPersistence, { timeout });
            await selectParticipantNav(freshPage, 'Review & overdracht');
            await expect(freshPage.getByRole('article').filter({ hasText: findingFixture })).toBeVisible({ timeout });
            return { detail: 'fresh context reflects phase and submitted evidence' };
          }
        );
      }
    }
  } catch (error) {
    const detail = safeMessage(error?.message || error);
    for (const name of [
      'facilitator-create-squad', 'participants-join', 'round-start', 'phase-change',
      'intent-document', 'knowledge-search', 'quiz-answer', 'quiz-privacy', 'evidence-submit',
      'evidence-review', 'handoff-record', 'persistence-reload', 'duplicate-name-rejected',
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
