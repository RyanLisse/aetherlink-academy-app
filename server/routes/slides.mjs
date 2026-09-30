import { fail } from '../store.mjs';
import { WAVE_DAYS } from '../../content/days/course.mjs';
import { uuid } from './shared.mjs';
import { redactQuestion } from '../coach.mjs';
import { deckAssistantStatus, runDeckAssistant } from '../deck-assistant.mjs';

export function registerSlidesRoutes(app, deps) {
  const { store, slides, token, browser, wrap, fetchImpl, deckAssistantConfig } = deps;

  // Slide decks (Effect-TS module, server/slides). Same squad session, no model call.
  const deckActor = ({ r, s, p }) => ({
    roomId: r.id,
    id: s.personId,
    name: p?.name || s.displayName || 'Facilitator',
    role: s.personId === 'facilitator' ? 'facilitator' : 'participant',
    source: s.kind === 'mcp' ? 'ai' : 'human',
  });
  const deckId = (req) => String(req.params.deckId || '');
  const facilitatorOnly = (context) => {
    if (context.s.personId !== 'facilitator')
      fail(403, 'Alleen de facilitator gebruikt de deck-assistent.');
    return context;
  };
  const assistantPerson = ({ r }) => `${r.id}:facilitator`;
  // Registered before /game/decks/:deckId so "assistant" is never read as a deck id.
  app.get(
    '/game/decks/assistant',
    wrap(async (req, res) => {
      const context = facilitatorOnly(await browser(req));
      res.json(
        await deckAssistantStatus({
          config: deckAssistantConfig,
          store,
          personKey: assistantPerson(context),
        }),
      );
    }),
  );
  app.post(
    '/game/decks/assistant',
    wrap(async (req, res) => {
      const context = facilitatorOnly(await browser(req));
      const { r, s } = context;
      res.json(
        await runDeckAssistant({
          config: deckAssistantConfig,
          store,
          slides,
          fetchImpl,
          actor: deckActor(context),
          personKey: assistantPerson(context),
          input: req.body,
          redact: (q) =>
            redactQuestion(q, {
              names: [...r.members.map((m) => m.name), s.displayName],
              codes: [r.code],
            }),
        }),
      );
    }),
  );
  app.get(
    '/game/decks',
    wrap(async (req, res) =>
      res.json(await slides.run('listDecks', deckActor(await browser(req)))),
    ),
  );
  app.post(
    '/game/decks',
    wrap(async (req, res) =>
      res
        .status(201)
        .json(
          await slides.run(
            'createDeck',
            deckActor(await browser(req)),
            req.body,
          ),
        ),
    ),
  );
  app.get(
    '/game/decks/:deckId',
    wrap(async (req, res) =>
      res.json(
        await slides.run('getDeck', deckActor(await browser(req)), {
          deckId: deckId(req),
          slideId: req.query.slideId || undefined,
          compact: req.query.compact === 'true',
        }),
      ),
    ),
  );
  app.post(
    '/game/decks/:deckId/slides',
    wrap(async (req, res) =>
      res.status(201).json(
        await slides.run('addSlide', deckActor(await browser(req)), {
          ...req.body,
          deckId: deckId(req),
        }),
      ),
    ),
  );
  app.patch(
    '/game/decks/:deckId/slides/:slideId',
    wrap(async (req, res) =>
      res.json(
        await slides.run('updateSlide', deckActor(await browser(req)), {
          ...req.body,
          deckId: deckId(req),
          slideId: String(req.params.slideId),
        }),
      ),
    ),
  );
  app.patch(
    '/game/decks/:deckId',
    wrap(async (req, res) =>
      res.json(
        await slides.run('patchDeck', deckActor(await browser(req)), {
          ...req.body,
          deckId: deckId(req),
        }),
      ),
    ),
  );
  app.post(
    '/game/decks/:deckId/duplicate',
    wrap(async (req, res) =>
      res.status(201).json(
        await slides.run('duplicateDeck', deckActor(await browser(req)), {
          deckId: deckId(req),
        }),
      ),
    ),
  );
  app.delete(
    '/game/decks/:deckId',
    wrap(async (req, res) =>
      res.json(
        await slides.run('deleteDeck', deckActor(await browser(req)), {
          deckId: deckId(req),
        }),
      ),
    ),
  );
  app.get(
    '/game/decks/:deckId/export.html',
    wrap(async (req, res) => {
      const result = await slides.run(
        'exportHtml',
        deckActor(await browser(req)),
        { deckId: deckId(req) },
      );
      res
        .type('text/html')
        .set('Content-Disposition', `attachment; filename="${result.filename}"`)
        .set(
          'Content-Security-Policy',
          "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src https: data:; font-src https: data:",
        )
        .send(result.html);
    }),
  );
  // Inline present viewer for Classroom overlay pin (AET-105 Slice B) — same HTML as export, no attachment.
  app.get(
    '/game/decks/:deckId/present',
    wrap(async (req, res) => {
      const actor = deckActor(await browser(req));
      // Structured classroom decks present in @academy/deck (presenter view, reveals, quiz, timers).
      if (req.query.html !== '1') {
        const compact = await slides.run('getDeck', actor, {
          deckId: deckId(req),
          compact: true,
        });
        if (compact.slides.some((slide) => slide.kind === 'classroom'))
          return res.redirect(
            302,
            `/decks/${encodeURIComponent(compact.id)}`,
          );
      }
      const result = await slides.run('exportHtml', actor, {
        deckId: deckId(req),
      });
      res
        .type('text/html')
        .set('Cache-Control', 'private, no-store')
        .set(
          'Content-Security-Policy',
          "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src https: data:; font-src https: data:",
        )
        .send(result.html);
    }),
  );
  // Pin / unpin an Effect deck as Classroom overlay for a room day (no promote-to-static).
  const overlayDay = (r, raw) => {
    if (raw === undefined || raw === null || raw === '') return r.day;
    const day = Number(raw);
    if (
      r.course
        ? !r.course.days.some((entry) => entry.day === day)
        : !Number.isInteger(day) || !WAVE_DAYS.includes(day)
    )
      fail(
        400,
        r.course
          ? `Dag ${day} zit niet in de cursus.`
          : 'Kies een geldige cursusdag.',
      );
    return day;
  };
  app.put(
    '/game/classroom-overlay',
    wrap(async (req, res) => {
      const pinned = uuid(req.body?.deckId);
      res.json(
        await store.withSession(token(req), 'browser', async ({ r, s, p }) => {
          if (s.personId !== 'facilitator')
            fail(
              403,
              'Alleen de facilitator mag het Classroom-overlay pinnen.',
            );
          const day = overlayDay(r, req.body?.day);
          await slides.run('getDeck', deckActor({ r, s, p }), {
            deckId: pinned,
            compact: true,
          });
          r.classroomOverlayByDay = {
            ...(r.classroomOverlayByDay || {}),
            [String(day)]: pinned,
          };
          r.version++;
          return store.view(r, s);
        }),
      );
    }),
  );
  app.delete(
    '/game/classroom-overlay',
    wrap(async (req, res) => {
      res.json(
        await store.withSession(token(req), 'browser', ({ r, s }) => {
          if (s.personId !== 'facilitator')
            fail(
              403,
              'Alleen de facilitator mag het Classroom-overlay pinnen.',
            );
          const day = overlayDay(r, req.body?.day ?? req.query?.day);
          if (r.classroomOverlayByDay) {
            const next = { ...r.classroomOverlayByDay };
            delete next[String(day)];
            if (Object.keys(next).length) r.classroomOverlayByDay = next;
            else delete r.classroomOverlayByDay;
          }
          r.version++;
          return store.view(r, s);
        }),
      );
    }),
  );
  return { deckActor, overlayDay };
}
