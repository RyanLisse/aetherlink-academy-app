import {hash, fail} from './store.mjs';
import {COACH_DEFAULT_MODEL, amsterdamDate} from './coach.mjs';

// Facilitator deck assistant: the in-app chat turns a request into deck actions. The model only
// proposes operations as JSON; every write goes through the same slides actions (schema, room
// scope, notes permission, revision guard) as the UI and MCP. Notes and keyPoints never leave
// the server, names and room codes are redacted from the request.
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MAX_MESSAGE = 2000;
const MAX_REPLY = 1200;
const MAX_OPERATIONS = 40;
const HISTORY_TURNS = 6;

const positiveInt = (raw, fallback, name) => {
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) throw Error(`${name} must be a positive integer.`);
  return value;
};

export function readDeckAssistantConfig(env = process.env) {
  const apiKey = String(env.OPENROUTER_API_KEY || '').trim();
  if (!apiKey) return null;
  const model = String(env.ACADEMY_DECK_ASSISTANT_MODEL || env.ACADEMY_COACH_MODEL || COACH_DEFAULT_MODEL).trim();
  if (!model.endsWith(':free')) throw Error(`ACADEMY_DECK_ASSISTANT_MODEL must be a free OpenRouter model (id ends in ':free'); got '${model}'.`);
  return {
    apiKey,
    model,
    url: String(env.OPENROUTER_BASE_URL || '').trim() || OPENROUTER_URL,
    facilitatorCap: positiveInt(env.ACADEMY_DECK_ASSISTANT_DAILY_CAP, 30, 'ACADEMY_DECK_ASSISTANT_DAILY_CAP'),
    platformCap: positiveInt(env.ACADEMY_COACH_PLATFORM_DAILY_CAP, 50, 'ACADEMY_COACH_PLATFORM_DAILY_CAP'),
    timeoutMs: positiveInt(env.ACADEMY_DECK_ASSISTANT_TIMEOUT_MS, 45000, 'ACADEMY_DECK_ASSISTANT_TIMEOUT_MS'),
  };
}

// `coach:` keys share the coach's retention sweep and its platform-wide free-model budget.
export const deckAssistantQuotaKeys = ({config, personKey, now}) => {
  const date = amsterdamDate(now);
  return [[`coach:deck:${hash(personKey)}:${date}`, config.facilitatorCap], [`coach:platform:${date}`, config.platformCap]];
};
const usage = (config, counts) => ({limit: config.facilitatorCap, remaining: Math.max(0, config.facilitatorCap - counts[0])});

export async function deckAssistantStatus({config, store, personKey, now = store.now()}) {
  if (!config) return {enabled: false};
  const {counts} = await store.coachQuota(deckAssistantQuotaKeys({config, personKey, now}));
  return {enabled: true, model: config.model, ...usage(config, counts)};
}

const SLIDE_FORMAT = `A slide is a JSON object with these fields (only "title" is required):
title (string), kicker (short uppercase label, e.g. "DAY 1 · PART 2"), subtitle (one sentence),
type: "context"|"concept"|"practice"|"review"|"quiz"|"recap"|"pause",
layout: "cards" (default card grid) | "pillars" | "steps" | "compare" | "exercise" | "recap",
cards: [{title, body}] (2-4 cards, body may contain \\n line breaks),
items: [{label, caption, detail}] for pillars/steps/recap,
columns: [{title, items:[string], foot}] for compare (2 columns),
steps: [string], expected and timer (preset minutes, 1-120) for layout "exercise"; check is optional,
prompt (exact text participants can copy), tagline (short bold closing line),
keyPoints: [3-5 short presenter bullets], notes (full speaker notes, never shown to participants),
dark (boolean), hidden (boolean, starts hidden),
visual: optional {bot:"wave"|"think"|"point"|"head", place:"beside"|"left"|"under",
 quiz:{answer:N} (type "quiz": cards are the options, N is the 0-based correct card),
 reveal:"click" (cards open one per click), stepThrough:true (cards appear one per click),
 stagger:"pop", spotlight:N, hero:N, checklist:N, countdown:minutes (type "pause"), quietTimer:minutes,
 stepKeys:true (steps layout, arrow activates next step), recapKeys:true, levelUp:true, pairs:true, oneCol:true,
 phrase:"...", highlight:[{in:"title"|"subtitle"|"tagline"|"card:N", text:"verbatim substring", tone:"orange"|"purple"|"mark"}]}.
Keep slides presentation-sized: title ≤ 2 lines, ≤ 4 cards, ≤ 6 steps.`;

const STYLE = `Always use the AetherLink classroom style, on every slide you add or change:
- context, concept and review slides: a subtitle, 2-4 cards (or pillars/steps/compare items) and visual {bot, place:"beside"}; bot "wave" for openings and context, "think" or "point" for concepts (alternate between consecutive slides), "point" for review and bridges, "head" for rules and guardrails.
- practice slides: layout "exercise" with 3-6 short imperative steps, expected (one "done when" sentence) and timer in minutes.
- breaks: type "pause" with visual {countdown: minutes, bot:"wave", place:"beside"}.
- quizzes: type "quiz" with 3-4 option cards and visual {quiz:{answer:N}}.
- recaps: layout "recap" with 3-5 items and visual {recapKeys:true}.
- every slide: 3-5 keyPoints and speaker notes.`;

const OPERATIONS = `Reply with JSON only, no other text:
{"reply": string (what you did, max 3 sentences, in the facilitator's language),
 "title": string (only when creating a new deck or renaming),
 "operations": [
  {"op":"add-slide","slide":SLIDE,"afterSlideId":existing id (optional, default: end)},
  {"op":"update-slide","slideId":existing id,"slide":partial SLIDE (fields you change; others are kept)},
  {"op":"delete-slide","slideId":existing id},
  {"op":"reorder-slides","slideIds":[every existing id exactly once]}
 ]}
Only use slide ids from the deck state. Without a deck, only "add-slide" is allowed and "title" is required.
If the request is not about building or changing this deck, return no operations and explain briefly.
Do not invent facts, metrics, URLs, names or dates; leave a clear placeholder instead.`;

const INSTRUCTIONS = {
  nl: 'Je bent de deck-assistent van AetherLink Academy. Je bouwt en wijzigt classroom-slides voor de facilitator, in dezelfde stijl als de AetherLink × Worldline cursusdeck: korte titels, concrete kaarten, oefenslides met stappen en een verwachte uitkomst, quizvragen met één goed antwoord, en pauzes. Schrijf de slide-inhoud in de taal van het verzoek. Elke slide gebruikt de classroom-stijl: AetherBOT, zichtbare conceptkaarten en oefentimers.',
  en: 'You are the AetherLink Academy deck assistant. You build and change classroom slides for the facilitator in the same style as the AetherLink × Worldline course deck: short titles, concrete cards, practice slides with steps and an expected outcome, quiz questions with one correct answer, and pauses. Write slide content in the language of the request. Every slide uses the classroom look: AetherBOT, visible concept cards and exercise timers.',
};

const text = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');
const slideState = (slide, active) => {
  const c = slide.classroom;
  if (!c) return {id: slide.id, kind: 'html', text: slide.textPreview};
  const {keyPoints: _k, ...rest} = c;
  return active ? {id: slide.id, active: true, ...rest} : {id: slide.id, title: c.title, kicker: c.kicker, type: c.type, layout: c.layout};
};

export function deckAssistantRequestBody({config, message, deck, slideId, history, locale}) {
  const lang = locale === 'en' ? 'en' : 'nl';
  const state = deck
    ? {deckTitle: deck.title, slides: deck.slides.map((slide) => slideState(slide, slide.id === slideId))}
    : {deck: null};
  const past = history.slice(-HISTORY_TURNS).flatMap((turn) => [
    {role: 'user', content: text(turn.message, MAX_MESSAGE)},
    {role: 'assistant', content: JSON.stringify({reply: text(turn.reply, MAX_REPLY), operations: []})},
  ]);
  return {
    model: config.model,
    messages: [
      {role: 'system', content: `${INSTRUCTIONS[lang]}\n\n${SLIDE_FORMAT}\n\n${STYLE}\n\n${OPERATIONS}`},
      ...past,
      {role: 'user', content: `Deck state:\n${JSON.stringify(state)}\n\n${lang === 'en' ? 'Request' : 'Verzoek'}: ${message}`},
    ],
    temperature: 0.4,
    max_tokens: 6000,
    response_format: {type: 'json_object'},
    provider: {data_collection: 'deny'},
  };
}

export function parseDeckAssistantReply(content) {
  const raw = String(content || '');
  const start = raw.indexOf('{'), end = raw.lastIndexOf('}');
  if (start < 0 || end < start) return null;
  let reply;
  try { reply = JSON.parse(raw.slice(start, end + 1)); } catch { return null; }
  if (!reply || typeof reply !== 'object') return null;
  const operations = Array.isArray(reply.operations) ? reply.operations.filter((op) => op && typeof op === 'object').slice(0, MAX_OPERATIONS) : [];
  return {reply: text(reply.reply, MAX_REPLY).trim(), title: text(reply.title, 200).trim(), operations};
}

const splitSlide = (slide) => {
  if (!slide || typeof slide !== 'object' || Array.isArray(slide)) return null;
  const {notes, id: _id, ...classroom} = slide;
  return {classroom, notes: typeof notes === 'string' ? notes : undefined};
};

/** Map proposed operations onto slides-action operations. Invalid shapes are rejected, not guessed. */
export function toDeckOperations(operations, deck) {
  const byId = new Map((deck?.slides || []).map((slide) => [slide.id, slide]));
  return operations.map((op) => {
    switch (op.op) {
      case 'add-slide': {
        const parts = splitSlide(op.slide);
        if (!parts) fail(502, 'The assistant returned an invalid slide.');
        return {op: 'add-slide', ...(typeof op.afterSlideId === 'string' && byId.has(op.afterSlideId) ? {afterSlideId: op.afterSlideId} : {}), slide: {classroom: parts.classroom, ...(parts.notes !== undefined ? {notes: parts.notes} : {})}};
      }
      case 'update-slide': {
        const current = byId.get(op.slideId), parts = splitSlide(op.slide);
        if (!current || !parts) fail(502, 'The assistant referred to a slide that does not exist.');
        const classroom = {...(current.classroom || {}), ...parts.classroom};
        if (current.classroom && op.slide.visual && typeof op.slide.visual === 'object') classroom.visual = {...(current.classroom.visual || {}), ...op.slide.visual};
        return {op: 'patch-slide', slideId: op.slideId, fields: {classroom, ...(parts.notes !== undefined ? {notes: parts.notes} : {})}};
      }
      case 'delete-slide':
        if (!byId.has(op.slideId)) fail(502, 'The assistant referred to a slide that does not exist.');
        return {op: 'delete-slide', slideId: op.slideId};
      case 'reorder-slides':
        return {op: 'reorder-slides', slideIds: Array.isArray(op.slideIds) ? op.slideIds : []};
      default:
        return fail(502, `The assistant proposed an unknown action: ${String(op.op).slice(0, 40)}.`);
    }
  });
}

async function callModel({config, fetchImpl, body}) {
  let response;
  try {
    response = await fetchImpl(config.url, {method: 'POST', headers: {authorization: `Bearer ${config.apiKey}`, 'content-type': 'application/json', 'x-title': 'AetherLink Academy'}, body: JSON.stringify(body), signal: AbortSignal.timeout(config.timeoutMs)});
  } catch (error) {
    fail(504, error?.name === 'TimeoutError' || error?.name === 'AbortError' ? 'The deck assistant did not respond in time. Try a smaller request.' : 'The deck assistant is unavailable right now.');
  }
  if (response.status === 429) fail(429, 'The free model is busy. Try again in a minute.');
  if (!response.ok) fail(502, 'The deck assistant is unavailable right now.');
  const content = (await response.json().catch(() => null))?.choices?.[0]?.message?.content;
  const parsed = parseDeckAssistantReply(content);
  if (!parsed) fail(502, 'The deck assistant gave no usable answer. Try again.');
  return parsed;
}

export async function runDeckAssistant({config, store, slides, actor, fetchImpl, input, redact, personKey, now = store.now()}) {
  if (!config) fail(503, 'The deck assistant is off: set OPENROUTER_API_KEY on the server. Your own Claude Code can still build decks over MCP.');
  const message = text(input?.message, MAX_MESSAGE).trim();
  if (!message) fail(400, 'Describe the slides you want.');
  const deckId = typeof input?.deckId === 'string' && input.deckId ? input.deckId : null;
  const deck = deckId ? await slides.run('getDeck', actor, {deckId}) : null;
  const keys = deckAssistantQuotaKeys({config, personKey, now});
  const {allowed, counts} = await store.coachQuota(keys, {consume: true});
  if (!allowed) fail(429, counts[0] >= config.facilitatorCap ? 'You have reached your daily deck assistant limit.' : 'The shared daily limit for the free model has been reached.');
  const history = Array.isArray(input?.history) ? input.history.filter((turn) => turn && typeof turn === 'object') : [];
  const proposal = await callModel({config, fetchImpl, body: deckAssistantRequestBody({config, message: redact(message), deck, slideId: typeof input?.slideId === 'string' ? input.slideId : null, history: history.map((turn) => ({...turn, message: redact(text(turn.message, MAX_MESSAGE))})), locale: input?.locale})});
  const operations = toDeckOperations(proposal.operations, deck);
  const assistant = usage(config, counts);
  if (!deck) {
    if (!operations.length) return {reply: proposal.reply, deckId: null, changes: null, assistant};
    if (operations.some((op) => op.op !== 'add-slide')) fail(502, 'The assistant tried to change a deck that does not exist yet.');
    const created = await slides.run('createDeck', actor, {title: proposal.title || message.slice(0, 80), slides: operations.map((op) => op.slide)});
    return {reply: proposal.reply, deckId: created.id, revision: created.revision, changes: {created: true, added: created.slides.map((slide) => slide.id), updated: [], deleted: []}, assistant};
  }
  const all = proposal.title && proposal.title !== deck.title ? [...operations, {op: 'patch-deck-fields', fields: {title: proposal.title}}] : operations;
  if (!all.length) return {reply: proposal.reply, deckId: deck.id, revision: deck.revision, changes: null, assistant};
  const patched = await slides.run('patchDeck', actor, {deckId: deck.id, expectedRevision: deck.revision, operations: all});
  return {reply: proposal.reply, deckId: deck.id, revision: patched.revision, changes: {created: false, added: patched.addedSlideIds, updated: patched.updatedSlideIds, deleted: patched.deletedSlideIds, renamed: all.some((op) => op.op === 'patch-deck-fields')}, assistant};
}
