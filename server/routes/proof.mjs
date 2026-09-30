import { roomDocument } from '../debrief-board.mjs';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fail } from '../store.mjs';
import { READ_ONLY_MESSAGE } from '../cohort.mjs';
import { cookie } from './shared.mjs';

export function registerProofGateway(app, deps) {
  const { root, store, proxy, suggestionReviewer } = deps;
  const webDist = path.join(root, 'apps/web/dist'),
    webAssetsDir = path.join(webDist, 'assets');
  // apps/web/public/assets shares the /assets prefix with Proof's editor bundle;
  // only files the web build shipped bypass the Proof session.
  const webPublicAssets = new Set(
    existsSync(webAssetsDir)
      ? readdirSync(webAssetsDir, { recursive: true, withFileTypes: true })
          .filter((e) => e.isFile())
          .map(
            (e) =>
              '/assets/' +
              path
                .relative(webAssetsDir, path.join(e.parentPath, e.name))
                .split(path.sep)
                .join('/'),
          )
      : [],
  );
  // Proof retains the single authoritative Yjs document. Only authenticated room paths pass this gateway.
  app.use(async (req, res, next) => {
    if (
      !/^\/(d\/|api\/|documents\/|assets\/|ws\b)/.test(req.path) ||
      webPublicAssets.has(req.path)
    )
      return next();
    try {
      const session = await store.auth(cookie(req), 'browser');
      const { r } = session;
      const slug = req.path.match(
        /^\/(?:d|documents|api\/documents|api\/agent)\/([^/]+)/,
      )?.[1];
      const doc = roomDocument(r, slug);
      if (!doc) fail(403, 'Dit document hoort bij een andere kamer.');
      const docSlug = doc.proof.slug;
      if (session.s.readOnly && !['GET', 'HEAD'].includes(req.method))
        fail(403, READ_ONLY_MESSAGE);
      const allowed =
        (['GET', 'PUT'].includes(req.method) &&
          req.path === `/api/documents/${docSlug}`) ||
        req.path.startsWith('/assets/') ||
        req.path === `/d/${docSlug}` ||
        req.path === '/api/capabilities' ||
        new RegExp(
          `^/api/documents/${docSlug}/(open-context|collab-session|collab-refresh|info|presence|marks|content|title)$`,
        ).test(req.path);
      const agentAllowed = new RegExp(
        `^/api/agent/${docSlug}/(state|events/pending|presence/disconnect|marks/(comment|reply|resolve|unresolve|accept|reject|suggest-insert|suggest-replace|suggest-delete))$`,
      ).test(req.path);
      if (!allowed && !agentAllowed)
        fail(403, 'Deze Proof-route is niet beschikbaar via de game.');
      if (
        !doc.writable &&
        !['GET', 'HEAD'].includes(req.method) &&
        req.path !== `/api/documents/${docSlug}/collab-refresh`
      )
        fail(403, 'Het debriefbord is gesloten; alleen lezen is mogelijk.');
      if (
        new RegExp(`^/api/agent/${docSlug}/marks/(accept|reject)$`).test(
          req.path,
        )
      )
        suggestionReviewer(session);
      if (req.path.startsWith('/d/'))
        req.url = req.path + '?token=' + doc.token;
      req.headers.authorization = `Bearer ${doc.token}`;
      req.headers['x-share-token'] = doc.token;
      proxy.web(req, res);
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message });
    }
  });
}

export function attachProofUpgrade(server, deps) {
  const { browser, liveSockets, proxy } = deps;
  server.on('upgrade', async (req, socket, head) => {
    try {
      const { r, s } = await browser(req);
      if (s.readOnly) fail(403, READ_ONLY_MESSAGE);
      const url = new URL(req.url, 'http://localhost');
      if (
        req.headers.origin &&
        req.headers.origin !== `http://${req.headers.host}` &&
        req.headers.origin !== `https://${req.headers.host}`
      )
        fail(403, 'Origin');
      if (
        url.pathname !== '/ws' ||
        !url.searchParams.get('slug') ||
        !roomDocument(r, url.searchParams.get('slug'))
      )
        fail(403, 'Kamer');
      if (s.expiresAt) {
        const sockets = liveSockets.get(s.personId) || new Set();
        liveSockets.set(s.personId, sockets.add(socket));
        const expiry = setTimeout(
          () => socket.destroy(),
          Math.max(0, s.expiresAt - Date.now()),
        );
        socket.once('close', () => {
          clearTimeout(expiry);
          sockets.delete(socket);
          if (!sockets.size) liveSockets.delete(s.personId);
        });
      }
      proxy.ws(req, socket, head);
    } catch (e) {
      console.warn(
        'WS denied',
        new URL(req.url, 'http://localhost').pathname,
        e.message,
      );
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
    }
  });
}
