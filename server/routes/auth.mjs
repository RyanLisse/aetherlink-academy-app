import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { hash, fail } from '../store.mjs';
import { readLoginState, signLoginState } from '../google-sso.mjs';
import {
  EMAIL_LOGIN_SENT_MESSAGE,
  normalizeEmail,
  otpMail,
} from '../email-login.mjs';
import { namedCookie, text } from './shared.mjs';

export function registerAuthRoutes(app, deps) {
  const {
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
  } = deps;
  const sameState = (a, b) => {
    const x = Buffer.from(String(a || '')),
      y = Buffer.from(String(b || ''));
    return x.length === y.length && timingSafeEqual(x, y);
  };
  const stateCheckFailed = (req, reason) => {
    const rawCookie = req.headers.cookie;
    const cookieHeader = typeof rawCookie === 'string' && rawCookie.length > 0;
    const cookieNames = cookieHeader
      ? rawCookie
          .split(';')
          .map((c) => c.trim().split('=')[0])
          .filter(Boolean)
      : [];
    console.warn('[academy] Google-login state check failed', {
      cookieHeader,
      loginCookie: cookieNames.includes('academy-login'),
      cookieNames,
      reason,
      userAgent: String(req.headers['user-agent'] || '').slice(0, 80),
    });
    return Object.assign(new Error('Google-login mislukt (state).'), {
      code: 'state',
    });
  };
  const loginCookie = {
      httpOnly: true,
      sameSite: 'lax',
      secure: authSecure,
      path: '/',
    },
    loginCodes = new Set([
      'state',
      'domain',
      'token',
      'verify',
      'disabled',
      'session',
    ]),
    mapLoginError = (e) => (loginCodes.has(e?.code) ? e.code : 'session'),
    loginError = (res, code, detail = {}) => {
      res.clearCookie('academy-login', loginCookie);
      console.warn('[academy] Google-login mislukt', {
        code,
        reason: detail.reason || null,
        message:
          typeof detail.message === 'string'
            ? detail.message.slice(0, 160)
            : null,
      });
      res.redirect(302, `/?login_error=${code}`);
    };
  app.get(
    '/auth/google/start',
    wrap(async (_req, res) => {
      if (!googleSso.enabled) return loginError(res, 'disabled');
      try {
        const state = randomBytes(32).toString('base64url'),
          nonce = randomBytes(32).toString('base64url'),
          codeVerifier = randomBytes(32).toString('base64url'),
          expiresAt = Date.now() + 10 * 60 * 1000,
          codeChallenge = createHash('sha256')
            .update(codeVerifier)
            .digest('base64url');
        const location = await googleSso.startUrl({
          state,
          nonce,
          codeChallenge,
        });
        await store.loginStateSave({
          stateHash: hash(state),
          nonce,
          codeVerifier,
          expiresAt,
        });
        res.cookie(
          'academy-login',
          signLoginState(
            { state, nonce, codeVerifier, expiresAt },
            loginSecret,
          ),
          { ...loginCookie, maxAge: 10 * 60 * 1000 },
        );
        res.redirect(302, location);
      } catch (e) {
        loginError(res, mapLoginError(e), {
          reason: e.reason,
          message: e.message,
        });
      }
    }),
  );
  app.get(
    '/auth/google/callback',
    wrap(async (req, res) => {
      if (!googleSso.enabled) return loginError(res, 'disabled');
      try {
        const cookieValue = namedCookie(req, 'academy-login');
        let reason,
          loginState = null;
        if (!cookieValue) reason = 'no-cookie';
        else {
          try {
            const candidate = readLoginState(cookieValue, loginSecret);
            if (candidate.expiresAt < Date.now()) reason = 'expired';
            else if (
              typeof req.query?.state !== 'string' ||
              !sameState(req.query.state, candidate.state)
            )
              reason = 'mismatch';
            else loginState = candidate;
          } catch (e) {
            reason = e.reason || 'bad-signature';
          }
        }
        const stateHash =
          typeof req.query?.state === 'string' && req.query.state
            ? hash(req.query.state)
            : null;
        if (loginState && stateHash) await store.loginStateTake(stateHash);
        else if (stateHash) {
          const record = await store.loginStateTake(stateHash);
          if (record)
            loginState = {
              state: req.query.state,
              nonce: record.nonce,
              codeVerifier: record.codeVerifier,
              expiresAt: record.expiresAt,
            };
          else reason = 'no-server-state';
        } else reason = reason || 'no-server-state';
        if (!loginState) throw stateCheckFailed(req, reason);
        const identity = await googleSso.handleCallback(req.query, loginState),
          token = await store.facilitatorLogin(identity);
        res.clearCookie('academy-login', loginCookie);
        res.cookie('academy-facilitator', token, {
          ...loginCookie,
          maxAge: 12 * 60 * 60 * 1000,
        });
        res.redirect(302, '/?facilitator=1');
      } catch (e) {
        loginError(res, mapLoginError(e), {
          reason: e.reason,
          message: e.message,
        });
      }
    }),
  );
  app.post(
    '/auth/logout',
    wrap(async (req, res) => {
      await store.facilitatorLogout(namedCookie(req, 'academy-facilitator'));
      res.clearCookie('academy-facilitator', loginCookie);
      res.status(204).end();
    }),
  );
  app.get('/game/config', (_req, res) =>
    res.json({
      googleSso: googleSso.enabled,
      emailLogin: Boolean(mailer),
      agentChatAvailable: Boolean(chatConfig),
      portal: true,
      portalLaunch: process.env.ACADEMY_PORTAL_LAUNCH !== '0',
    }),
  );
  app.get(
    '/game/facilitator/me',
    wrap(async (req, res) => {
      const identity = await store.facilitator(
        namedCookie(req, 'academy-facilitator'),
      );
      if (!identity)
        return res
          .status(401)
          .json({ error: 'Geen geldige facilitator-login.' });
      res.json({ email: identity.email, name: identity.name });
    }),
  );
  app.post(
    '/game/create',
    wrap(async (req, res) => {
      const identity = await requireFacilitator(req),
        name = text(req.body.name, 60);
      setSession(
        res,
        await store.create(
          name,
          identity && { email: identity.email, name: identity.name },
        ),
      );
    }),
  );
  app.post(
    '/game/join',
    wrap(async (req, res) =>
      setSession(
        res,
        await store.join(text(req.body.code, 15), text(req.body.name, 50)),
      ),
    ),
  );
  app.post(
    '/game/participant/resume',
    wrap(async (req, res) =>
      setSession(
        res,
        await store.resumeParticipant(text(req.body.resumeToken, 128)),
      ),
    ),
  );
  app.post(
    '/game/participant/access',
    wrap(async (req, res) =>
      res.json(await store.rotateParticipantAccess(token(req))),
    ),
  );
  // Email is optional: without a mail transport every email route is absent, not merely hidden.
  const emailRoute = (fn) =>
    wrap(async (req, res) => {
      if (!mailer) return res.status(404).json({ error: 'Niet gevonden.' });
      await fn(req, res);
    });
  const otpCode = (v) => text(v, 12);
  app.get(
    '/game/email',
    emailRoute(async (req, res) =>
      res.json(await store.emailStatus(token(req))),
    ),
  );
  app.post(
    '/game/email/attach/start',
    emailRoute(async (req, res) => {
      const email = normalizeEmail(req.body?.email);
      const { code } = await store.startEmailAttach(token(req), email, {
        ip: req.ip,
      });
      try {
        await mailer.send({ to: email, ...otpMail('attach', code) });
      } catch (error) {
        console.error('academy mail send failed', error?.message);
        fail(
          502,
          'De e-mail kon niet worden verstuurd. Probeer het later opnieuw.',
        );
      }
      res.json({ ok: true });
    }),
  );
  app.post(
    '/game/email/attach/verify',
    emailRoute(async (req, res) =>
      res.json(
        await store.verifyEmailAttach(
          token(req),
          normalizeEmail(req.body?.email),
          otpCode(req.body?.code),
        ),
      ),
    ),
  );
  app.post(
    '/game/email/remove',
    emailRoute(async (req, res) =>
      res.json(await store.removeEmail(token(req))),
    ),
  );
  // Same body, status and timing whether or not the address is bound: the send is not awaited.
  app.post(
    '/game/email/login/start',
    emailRoute(async (req, res) => {
      const email = normalizeEmail(req.body?.email);
      const { code } = await store.startEmailLogin(email, { ip: req.ip });
      if (code)
        Promise.resolve()
          .then(() => mailer.send({ to: email, ...otpMail('login', code) }))
          .catch((error) =>
            console.error('academy mail send failed', error?.message),
          );
      res.json({ ok: true, message: EMAIL_LOGIN_SENT_MESSAGE });
    }),
  );
  app.post(
    '/game/email/login/verify',
    emailRoute(async (req, res) =>
      setSession(
        res,
        await store.verifyEmailLogin(
          normalizeEmail(req.body?.email),
          otpCode(req.body?.code),
        ),
      ),
    ),
  );
}
