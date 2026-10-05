import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  isLegacySite,
  resolveLegacyUrl,
} from '../../apps/web/src/redirects/legacy.ts';

export function registerSpaRoutes(app, deps) {
  const { root } = deps;
  const webDist = path.join(root, 'apps/web/dist');
  const arcadeLabDist = path.join(root, 'apps/arcade-lab/dist');
  app.use(
    '/arcade-lab',
    express.static(arcadeLabDist, { index: false, fallthrough: true }),
  );
  app.get(['/arcade-lab', '/arcade-lab/'], (_req, res) => {
    const index = path.join(arcadeLabDist, 'index.html');
    if (!existsSync(index))
      return res.status(503).type('text').send('arcade-lab not built');
    return res.sendFile(index);
  });
  // apps/web SPA (Classroom / deck / workshop / lesson / live) — AET-75+ routes live in apps/web, not root dist/
  const webIndex = path.join(webDist, 'index.html');
  const isWebSpaPath = (p) =>
    p === '/deck' ||
    p === '/reference' ||
    p.startsWith('/reference/') ||
    p === '/archive' ||
    p.startsWith('/archive/') ||
    p.startsWith('/classroom/') ||
    p.startsWith('/workshop/') ||
    p === '/harness' ||
    p === '/lesson' ||
    p.startsWith('/lesson/') ||
    p.startsWith('/live/') ||
    p.startsWith('/decks/');
  app.get('/legacy-redirect', (req, res) => {
    const site = req.query.site;
    if (!isLegacySite(site))
      return res.status(400).type('text').send('unknown legacy site');
    return res.redirect(
      301,
      resolveLegacyUrl(
        site,
        typeof req.query.from === 'string' ? req.query.from : '/',
      ),
    );
  });
  app.use(express.static(webDist, { index: false, fallthrough: true }));
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (!isWebSpaPath(req.path)) return next();
    if (!existsSync(webIndex))
      return res.status(503).type('text').send('apps/web not built');
    return res.sendFile(webIndex);
  });
  app.use(express.static(path.join(root, 'dist')));
  // /facilitator is the legacy SPA's dedicated facilitator admin (squads + Wave cohorts).
  app.get(['/', '/facilitator'], (_req, res) =>
    res.sendFile(path.join(root, 'dist/index.html')),
  );
  app.use((req, res, next) => {
    if (
      req.method === 'GET' &&
      (req.path === '/arcade' || req.path.startsWith('/arcade/'))
    )
      return res.sendFile(path.join(root, 'dist/index.html'));
    return next();
  });
}
