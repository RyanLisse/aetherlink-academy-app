import express from 'express';
import { READ_ONLY_MESSAGE } from '../cohort.mjs';

export function registerRequestMiddleware(app, deps) {
  const { store, token, browser } = deps;

  // screen-state (presence heartbeat) and chat (FAQ lookup) are reads over POST, so read-only members
  // can keep using the Academy as a reference after the live days.
  const readOnlyExempt = new Set([
    '/game/logout',
    '/game/resume',
    '/game/join',
    '/game/create',
    '/game/participant/resume',
    '/game/cohort/activate',
    '/game/screen-state',
    '/game/chat',
    '/game/email',
    '/game/email/attach/start',
    '/game/email/attach/verify',
    '/game/email/remove',
    '/game/email/login/start',
    '/game/email/login/verify',
  ]);
  // Uploads carry their own content type, including application/json, so the raw
  // parser has to claim /game/files before the global JSON parser consumes it.
  app.use('/game/files', async (req, res, next) => {
    try {
      await browser(req);
      next();
    } catch (e) {
      next(e);
    }
  });
  app.use('/game/files', express.raw({ type: '*/*', limit: '26mb' }));
  app.use('/game/files', (e, req, res, next) => {
    if (e?.status === 413 && e.type === 'entity.too.large')
      return res
        .status(413)
        .json({ error: 'Bestand is te groot; maximaal 25 MiB.' });
    next(e);
  });
  app.use(express.json({ limit: '64kb' }));
  const buckets = new Map();
  app.use(
    ['/game', '/mcp', '/auth', '/verify', '/certificate'],
    (req, res, next) => {
      const k = req.ip;
      const b = buckets.get(k) || { t: Date.now(), n: 0 };
      if (Date.now() - b.t > 60000) {
        b.t = Date.now();
        b.n = 0;
      }
      b.n++;
      buckets.set(k, b);
      if (b.n > 1500)
        return res
          .status(429)
          .json({ error: 'Te veel verzoeken. Wacht even.' });
      next();
    },
  );
  app.use(async (req, res, next) => {
    const route = req.path.toLowerCase().replace(/\/+$/, '');
    if (
      ['GET', 'HEAD'].includes(req.method) ||
      !route.startsWith('/game/') ||
      route.startsWith('/game/facilitator/') ||
      readOnlyExempt.has(route) ||
      !token(req)
    )
      return next();
    try {
      const { s } = await store.auth(token(req));
      if (s.readOnly) return res.status(403).json({ error: READ_ONLY_MESSAGE });
    } catch (e) {
      if (e.status !== 401) return next(e);
    }
    next();
  });
}

export function registerErrorHandler(app) {
  app.use((e, req, res, _next) => {
    if (!e.status)
      console.error('[academy] unhandled', {
        method: req.method,
        path: req.path,
        message: e?.message,
        stack: e?.stack,
      });
    return res.status(e.status || 500).json({
      error: e.status
        ? e.message
        : 'Onverwachte serverfout. Probeer opnieuw; je invoer blijft staan.',
    });
  });
}
