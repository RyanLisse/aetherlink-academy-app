import express from 'express';
import http from 'node:http';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { secret, hash, fail } from './store.mjs';
import { LocalStore } from './local-store.mjs';
import { getDayPack } from './content.mjs';
import { participantDayPack } from './quiz.mjs';
import { createGoogleSso } from './google-sso.mjs';
import { createSlidesService } from './slides/runtime.ts';
import { createFileStorage } from './storage/runtime.ts';
import { readChatConfig } from './chat-embed.mjs';
import { createMailTransport } from './email-login.mjs';
import { createPortal } from './portal/index.mjs';
import { courseDays, releasedDays } from './release.mjs';
import { labGradingKeys } from './lab-keys.mjs';
import { readCoachConfig } from './coach.mjs';
import { bearer, cookie, namedCookie } from './routes/shared.mjs';
import {
  registerRequestMiddleware,
  registerErrorHandler,
} from './routes/middleware.mjs';
import { registerAuthRoutes } from './routes/auth.mjs';
import { registerCohortRoutes } from './routes/cohort.mjs';
import { registerRoomRoutes, registerLiveRoutes } from './routes/game.mjs';
import {
  registerContentRoutes,
  registerStarterRoute,
} from './routes/content.mjs';
import { registerSlidesRoutes } from './routes/slides.mjs';
import { registerFileRoutes } from './routes/files.mjs';
import { registerMcpRoutes } from './routes/mcp.mjs';
import { registerPortalRoutes } from './routes/portal.mjs';
import { registerHealthRoute } from './routes/health.mjs';
import { registerSpaRoutes } from './routes/spa.mjs';

export function createApp({
  dir,
  repository,
  presence,
  root = process.cwd(),
  hostKey,
  publicBaseUrl = process.env.ACADEMY_PUBLIC_URL ||
    `http://127.0.0.1:${process.env.PORT || 4317}`,
  googleClientId = process.env.GOOGLE_CLIENT_ID,
  googleClientSecret = process.env.GOOGLE_CLIENT_SECRET,
  facilitatorDomains = process.env.ACADEMY_FACILITATOR_DOMAINS,
  signingSecret = process.env.ACADEMY_SIGNING_SECRET ||
    process.env.PROOF_COLLAB_SIGNING_SECRET,
  fetchImpl = fetch,
  slidesService,
  fileStorageService,
  labOrigins = process.env.ACADEMY_LAB_ORIGINS,
  labsForDay = (day) => getDayPack(day)?.labs,
  labKeys = labGradingKeys,
  trustProxy = process.env.ACADEMY_TRUST_PROXY,
  chatConfig = readChatConfig(),
  coachConfig = readCoachConfig(),
  mailer = createMailTransport(),
} = {}) {
  const publicUrl = new URL(publicBaseUrl);
  if (
    !['http:', 'https:'].includes(publicUrl.protocol) ||
    publicUrl.username ||
    publicUrl.password ||
    publicUrl.search ||
    publicUrl.hash ||
    publicUrl.pathname !== '/'
  )
    throw Error(
      'ACADEMY_PUBLIC_URL moet een HTTP(S)-origin zonder pad of credentials zijn.',
    );
  const store = repository || new LocalStore(dir);
  const slides =
    slidesService ||
    createSlidesService(
      repository
        ? { pool: repository.pool, schema: repository.schema }
        : { dir },
    );
  const files =
    fileStorageService ||
    createFileStorage(
      repository ? { pool: repository.pool, schema: repository.schema } : {},
    );
  const app = express();
  const token = (req) => bearer(req) || cookie(req);
  const browser = (req) => store.auth(bearer(req) || cookie(req), 'browser');
  const readableDays = ({ r, s }) =>
    s.personId === 'facilitator'
      ? courseDays(r)
      : releasedDays(r, { readOnly: s.readOnly });
  // ?day=N (or body.day) rereads a released day without moving the room; r.day stays the facilitator's live pointer.
  const chosenDay = (context, raw) => {
    if (raw === undefined || raw === null || raw === '') return context.r.day;
    const day = Number(raw);
    if (!Number.isInteger(day) || !getDayPack(day))
      fail(404, `Geen contentpakket voor dag ${String(raw).slice(0, 8)}.`);
    if (!courseDays(context.r).includes(day))
      fail(404, `Dag ${day} zit niet in de cursus.`);
    if (!readableDays(context).includes(day))
      fail(403, `Dag ${day} is nog niet vrijgegeven.`);
    return day;
  };
  const hostFile = path.join(dir, 'host-key');
  if (hostKey === undefined || hostKey === null) {
    if (!existsSync(hostFile))
      writeFileSync(hostFile, secret(), { mode: 0o600 });
    hostKey = readFileSync(hostFile, 'utf8').trim();
  }
  if (!hostKey.trim())
    throw new Error('ACADEMY_HOST_KEY of .data/host-key is leeg.');
  const googleSso = createGoogleSso({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      allowedDomains: facilitatorDomains,
      publicUrl: publicUrl.origin,
      fetchImpl,
    }),
    authSecure = publicUrl.protocol === 'https:',
    loginSecret = createHmac('sha256', signingSecret || hostKey)
      .update('academy-login-state')
      .digest();
  const portal = createPortal({
    signingSecret: signingSecret || hostKey,
    academyOrigin: publicUrl.origin,
    readCanonical: async (ref) => {
      if (ref?.kind === 'day-pack') {
        const pack = getDayPack(ref.day);
        if (!pack) fail(404, `Geen contentpakket voor dag ${ref.day}.`);
        return {
          body: JSON.stringify(participantDayPack(pack)),
          sourceRef: `day-pack:${ref.day}`,
          contentType: 'application/json',
        };
      }
      if (typeof ref?.body === 'string')
        return {
          body: ref.body,
          sourceRef: ref.sourceRef || 'inline',
          contentType: ref.contentType || 'text/plain',
        };
      fail(400, 'Onbekende content-ref.');
    },
  });
  const requireFacilitator = async (req) => {
    const key = Buffer.from(hash(req.body?.hostKey || ''));
    if (timingSafeEqual(key, Buffer.from(hash(hostKey)))) return null;
    const identity = await store.facilitator(
      namedCookie(req, 'academy-facilitator'),
    );
    if (identity) return identity;
    fail(403, 'Ongeldige facilitator-startsleutel.');
  };
  app.disable('x-powered-by');
  if (trustProxy)
    app.set(
      'trust proxy',
      /^\d+$/.test(String(trustProxy)) ? Number(trustProxy) : trustProxy,
    );
  app.use((req, res, next) => {
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    const origin = req.headers.origin;
    if (
      origin &&
      origin !== publicUrl.origin &&
      origin !== `${req.protocol}://${req.headers.host}`
    )
      return res.status(403).json({ error: 'Andere origin niet toegestaan.' });
    next();
  });
  const wrap = (fn) => async (req, res, next) => {
    try {
      await fn(req, res);
    } catch (e) {
      next(e);
    }
  };
  const setSession = (res, result) => {
    res.cookie('academy', result.token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: publicUrl.protocol === 'https:',
      path: '/',
    });
    res.json(result);
  };
  registerRequestMiddleware(app, { browser, store, token });
  registerAuthRoutes(app, {
    store,
    token,
    googleSso,
    loginSecret,
    authSecure,
    requireFacilitator,
    wrap,
    setSession,
    mailer,
    chatConfig,
  });
  registerCohortRoutes(app, {
    store,
    token,
    publicUrl,
    requireFacilitator,
    wrap,
    setSession,
  });
  registerRoomRoutes(app, {
    store,
    browser,
    token,
    setSession,
    wrap,
    publicUrl,
    presence,
    chosenDay,
    requireFacilitator,
  });
  registerContentRoutes(app, {
    store,
    token,
    browser,
    publicUrl,
    labOrigins,
    labsForDay,
    labKeys,
    readableDays,
    chosenDay,
    wrap,
    fetchImpl,
    coachConfig,
  });
  const { screens, evidence } = registerLiveRoutes(app, {
    store,
    browser,
    token,
    wrap,
    publicUrl,
    presence,
    chosenDay,
    fetchImpl,
    chatConfig,
  });
  const { deckActor, overlayDay } = registerSlidesRoutes(app, {
    store,
    slides,
    token,
    browser,
    wrap,
  });
  registerFileRoutes(app, { files, deckActor, browser, wrap });
  registerMcpRoutes(app, {
    store,
    slides,
    token,
    browser,
    wrap,
    publicUrl,
    screens,
    evidence,
    deckActor,
    overlayDay,
  });
  registerStarterRoute(app, { browser, wrap, root });
  registerPortalRoutes(app, {
    portal,
    publicUrl,
    hostKey,
    store,
    browser,
    wrap,
  });
  registerHealthRoute(app, { wrap });
  registerSpaRoutes(app, { root });
  registerErrorHandler(app);
  const server = http.createServer(app);
  return { app, server, store, slides, files, portal };
}
