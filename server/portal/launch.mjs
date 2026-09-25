import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {fail} from '../store.mjs';

const TICKET_TTL_MS = 60_000;

function sign(secret, bodyText) {
  return `v1=${createHmac('sha256', secret).update(bodyText).digest('hex')}`;
}

function same(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Controlled deeplink tickets — no browser-wide static admin keys.
 * Secret is derived server-side; never placed in the launch URL as raw secret.
 */
export function createLaunchTicketService({signingSecret, academyOrigin}) {
  if (!signingSecret || !String(signingSecret).length) throw new Error('portal launch signing secret required');
  // Always HMAC-expand so short host-key fixtures and production secrets both work.
  const secret = createHmac('sha256', String(signingSecret)).update('academy-portal-launch-v1').digest();

  function mint({appId, actor, returnTo, grantId = null, targetOrigin = null}) {
    if (!appId) fail(400, 'App-id verplicht.');
    if (!actor?.ownerId || !actor?.role) fail(403, 'Geen geldige portal-identiteit.');
    // Never allow hostKey / secrets into claims
    const forbidden = JSON.stringify(actor);
    if (/hostKey|AGENT_CHAT_SHARED_SECRET|PROOF_|BEGIN [A-Z]+ PRIVATE KEY/i.test(forbidden)) {
      fail(400, 'Secrets horen niet in launch-claims.');
    }
    const issuedAt = Date.now();
    const claims = {
      version: 1,
      audience: `academy-app:${appId}`,
      appId,
      ownerId: actor.ownerId,
      role: actor.role,
      roomId: actor.roomId || null,
      grantId,
      returnTo: returnTo || new URL('/', academyOrigin).href,
      issuedAt,
      expiresAt: issuedAt + TICKET_TTL_MS,
      nonce: randomBytes(16).toString('hex'),
    };
    const bodyText = JSON.stringify({claims});
    const signature = sign(secret, bodyText);
    const ticket = Buffer.from(JSON.stringify({claims, signature})).toString('base64url');
    const origin = targetOrigin || academyOrigin;
    const startUrl = new URL('/_academy/portal/start', origin);
    startUrl.searchParams.set('ticket', ticket);
    return {
      startUrl: startUrl.toString(),
      expiresAt: claims.expiresAt,
      claims: {
        appId: claims.appId,
        role: claims.role,
        ownerId: claims.ownerId,
        roomId: claims.roomId,
        returnTo: claims.returnTo,
        expiresAt: claims.expiresAt,
      },
    };
  }

  function verify(ticket) {
    let parsed;
    try {
      parsed = JSON.parse(Buffer.from(String(ticket || ''), 'base64url').toString('utf8'));
    } catch {
      fail(401, 'Ongeldig launch-ticket.');
    }
    const bodyText = JSON.stringify({claims: parsed.claims});
    const expected = sign(secret, bodyText);
    if (!same(expected, parsed.signature)) fail(401, 'Launch-ticket handtekening ongeldig.');
    if (!parsed.claims || parsed.claims.expiresAt < Date.now()) fail(401, 'Launch-ticket verlopen.');
    return parsed.claims;
  }

  return {mint, verify, ticketTtlMs: TICKET_TTL_MS};
}
