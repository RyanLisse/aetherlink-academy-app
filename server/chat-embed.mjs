import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';

const TICKET_TTL_SECONDS = 60;
const TICKET_PATH = '/_academy/embed/ticket';
const EXPECTED_START_PATH = '/_agent-native/embed/start';
const TARGET_PATH = '/home?embedded=1';

function safeOrigin(rawUrl) {
  let url;
  try { url = new URL(String(rawUrl || '').trim()); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') return null;
  return url.origin;
}

export function readChatConfig(env = process.env) {
  const origin = safeOrigin(env.AGENT_CHAT_URL);
  const secret = String(env.AGENT_CHAT_SHARED_SECRET || '');
  if (!origin || secret.length < 32) return null;
  return {origin, secret};
}

function signBody(secret, bodyText) {
  return `v1=${createHmac('sha256', secret).update(bodyText).digest('hex')}`;
}

function pseudonymousOwnerEmail(secret, roomId, participantId) {
  const digest = createHmac('sha256', secret).update(`${roomId}:${participantId}`).digest('hex').slice(0, 32);
  return `academy-${digest}@academy.invalid`;
}

function validStartUrl(startUrl, config) {
  let parsed;
  try { parsed = new URL(startUrl, config.origin); } catch { return false; }
  if (parsed.origin !== config.origin) return false;
  if (parsed.pathname !== EXPECTED_START_PATH) return false;
  if (parsed.username || parsed.password || parsed.hash) return false;
  const params = [...parsed.searchParams];
  if (params.length !== 1) return false;
  const [key, value] = params[0];
  if (key !== 'ticket' || !value || !value.trim()) return false;
  return true;
}

export async function createChatEmbedStartUrl({roomId, participantId}, {config, env = process.env, fetchImpl = fetch} = {}) {
  config = config !== undefined ? config : readChatConfig(env);
  if (!config) throw Object.assign(new Error('Chat is niet geconfigureerd.'), {code: 'config'});
  const issuedAt = Date.now();
  const claims = {
    version: 1,
    audience: 'academy-chat',
    ownerEmail: pseudonymousOwnerEmail(config.secret, roomId, participantId),
    roomId,
    participantId,
    issuedAt,
    expiresAt: issuedAt + TICKET_TTL_SECONDS * 1000,
    nonce: randomBytes(16).toString('hex'),
    targetPath: TARGET_PATH,
  };
  const bodyText = JSON.stringify({claims});
  const signature = signBody(config.secret, bodyText);
  let response;
  try {
    response = await fetchImpl(config.origin + TICKET_PATH, {
      method: 'POST',
      headers: {'content-type': 'application/json', 'x-academy-signature': signature},
      body: bodyText,
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw Object.assign(new Error('Chat is niet bereikbaar.'), {code: 'upstream'});
  }
  if (!response.ok) throw Object.assign(new Error('Chat wees het verzoek af.'), {code: 'upstream'});
  let payload;
  try { payload = await response.json(); } catch { throw Object.assign(new Error('Ongeldig antwoord van Chat.'), {code: 'upstream'}); }
  const startUrl = payload && typeof payload.startUrl === 'string' ? payload.startUrl : null;
  if (!startUrl) throw Object.assign(new Error('Chat gaf geen geldige start-URL.'), {code: 'upstream'});
  if (!validStartUrl(startUrl, config)) throw Object.assign(new Error('Chat gaf een onverwachte start-URL.'), {code: 'upstream'});
  return new URL(startUrl, config.origin).toString();
}

export function chatEmbedErrorHtml() {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Chat</title><style>body{font-family:system-ui,sans-serif;background:#0c1928;color:#e3ecfa;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}main{max-width:360px;text-align:center;padding:24px}</style></head><body><main><p>Chat kon niet worden geladen. Probeer het later opnieuw.</p></main></body></html>`;
}

export const CHAT_TICKET_PATH = TICKET_PATH;
export const CHAT_TARGET_PATH = TARGET_PATH;
