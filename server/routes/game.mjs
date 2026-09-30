import {
  agentInstructions,
  facilitatorAgentInstructions,
  normalizeAgentClient,
  connectionHint,
} from '../agent-setup.mjs';
import { debrief, exportDebrief } from '../progress.mjs';
import {
  findTask,
  taskStatus,
  taskTrail,
  reviewQueue,
  peerQueue,
  transition,
  reviewEvent,
  reviewerRole,
  authorizeTaskReview,
  submitAutograde,
} from '../proof-trail.mjs';
import {
  applyBoardAction,
  boardMarkdown,
  boardView,
  parseBoard,
} from '../debrief-board.mjs';
import { randomUUID } from 'node:crypto';
import { Store, hash, fail } from '../store.mjs';
import { mission, searchKnowledge, getDayPack } from '../content.mjs';
import {
  openQuizAttempt,
  requireDayQuiz,
  submitQuizAttempt,
} from '../quiz.mjs';
import { createChatEmbedStartUrl, chatEmbedErrorHtml } from '../chat-embed.mjs';
import { createScreenStore, screenBinding } from '../screen-state.mjs';
import { bearer, namedCookie, text } from './shared.mjs';

export function registerRoomRoutes(app, deps) {
  const {
    store,
    proof,
    token,
    browser,
    chosenDay,
    suggestionReviewer,
    requireFacilitator,
    publicUrl,
    presence,
    wrap,
    setSession,
  } = deps;

  app.post(
    '/game/facilitator/overview',
    wrap(async (req, res) => {
      await requireFacilitator(req);
      res.json(await store.overview());
    }),
  );
  app.post(
    '/game/facilitator/attach',
    wrap(async (req, res) => {
      const identity = await requireFacilitator(req);
      setSession(
        res,
        await store.attachFacilitator(
          text(req.body.roomId, 60),
          identity?.name,
        ),
      );
    }),
  );
  app.post(
    '/game/logout',
    wrap(async (req, res) => {
      await store.logout(token(req));
      res.clearCookie('academy', { path: '/' });
      res.json({ ok: true });
    }),
  );
  app.get(
    '/game/suggestions',
    wrap(async (req, res) => {
      const { r } = await browser(req);
      const d = await proof.state(r);
      res.json(
        Object.entries(d.marks || {})
          .filter(([, m]) => ['insert', 'replace', 'delete'].includes(m.kind))
          .map(([id, m]) => ({ id, ...m })),
      );
    }),
  );
  app.post(
    '/game/suggestion-review',
    wrap(async (req, res) => {
      const { r, s } = await browser(req);
      suggestionReviewer({ r, s });
      if (!['accept', 'reject'].includes(req.body.decision))
        fail(400, 'Ongeldig besluit.');
      const id = text(req.body.id, 100);
      const result = await proof.suggestionReview(
        r,
        req.body.decision,
        id,
        `human:${s.personId}`,
        text(req.body.requestId, 100),
      );
      res.json(result);
    }),
  );
  app.post(
    '/game/resume',
    wrap(async (req, res) => {
      await browser(req);
      res.cookie('academy', bearer(req), {
        httpOnly: true,
        sameSite: 'strict',
        secure: publicUrl.protocol === 'https:',
        path: '/',
      });
      res.json({ ok: true });
    }),
  );
  app.get(
    '/game/state',
    wrap(async (req, res) => {
      const { r, s, p } = await browser(req);
      if (p) {
        if (presence) await presence.touch(r.id, p.id);
        else store.live.set(p.id, Date.now());
      }
      const view = store.view(r, s);
      if (presence) {
        const online = await presence.members(
          r.id,
          r.members.map((m) => m.id),
        );
        view.members.forEach((m) => (m.online = online.has(m.id)));
      }
      res.json(view);
    }),
  );
  app.post(
    '/game/control',
    wrap(async (req, res) =>
      res.json(
        await store.withSession(token(req), 'browser', ({ r, s }) => {
          if (s.personId !== 'facilitator')
            fail(403, 'Alleen de facilitator bedient de ronde.');
          const value = ['time', 'duration'].includes(req.body.action)
            ? Number(req.body.value)
            : req.body.value;
          Store.prototype.control.call(
            { remaining: store.remaining, save() {} },
            r,
            req.body.action,
            value,
          );
          return store.view(r, s);
        }),
      ),
    ),
  );
  app.get(
    '/game/knowledge',
    wrap(async (req, res) => {
      const pack = getDayPack(chosenDay(await browser(req), req.query.day));
      res.json({
        lessons: searchKnowledge(String(req.query.q || '')),
        mission: pack?.mission || mission,
      });
    }),
  );
}

export function registerLiveRoutes(app, deps) {
  const {
    store,
    proof,
    token,
    browser,
    chosenDay,
    publicUrl,
    fetchImpl,
    chatConfig,
    presence,
    wrap,
  } = deps;

  app.post(
    '/game/reflection',
    wrap(async (req, res) =>
      res.json(
        await store.withSession(token(req), 'browser', ({ r, p }) => {
          if (!p) fail(403, 'Alleen deelnemers schrijven een eigen reflectie.');
          const reflection = {
            learned: text(req.body.learned),
            next: text(req.body.next),
            at: new Date().toISOString(),
          };
          p.progressByDay ??= {};
          p.progressByDay[String(r.day)] = {
            ...p.progressByDay[String(r.day)],
            reflection,
          };
          return reflection;
        }),
      ),
    ),
  );
  app.get(
    '/game/debrief',
    wrap(async (req, res) => {
      const { r, s } = await browser(req);
      if (s.personId !== 'facilitator')
        fail(403, 'Alleen de facilitator bekijkt de debrief.');
      res.json(debrief(r));
    }),
  );
  app.get(
    '/game/debrief/export',
    wrap(async (req, res) => {
      const { r, s } = await browser(req);
      if (s.personId !== 'facilitator')
        fail(403, 'Alleen de facilitator exporteert de debrief.');
      const board = r.board
        ? parseBoard((await proof.state({ proof: r.board.proof })).markdown)
        : null;
      res
        .type('text/markdown')
        .set(
          'Content-Disposition',
          'attachment; filename="squad-overdracht.md"',
        )
        .send(exportDebrief(r, board));
    }),
  );
  // Fencing drops Proof's loaded doc, so wait until its debounced persist has stored every card that is already live.
  async function settleBoard(p) {
    for (let attempt = 0; attempt < 25; attempt++) {
      const [live, stored] = await Promise.all([
        proof.state({ proof: p }),
        proof.stored(p),
      ]);
      if (
        JSON.stringify(parseBoard(live.markdown)) ===
        JSON.stringify(parseBoard(stored.markdown))
      )
        return;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    fail(503, 'Proof slaat het bord nog op. Sluit het bord opnieuw.');
  }
  app.post(
    '/game/board',
    wrap(async (req, res) => {
      const { r, s } = await browser(req);
      if (s.personId !== 'facilitator')
        fail(403, 'Alleen de facilitator opent of sluit het debriefbord.');
      const action = req.body?.action,
        created =
          action === 'open' && !r.board
            ? await proof.createBoard(
                boardMarkdown(),
                `${r.name} — Debriefbord`,
              )
            : null;
      const board = await store.withSession(
        token(req),
        'browser',
        ({ r, s }) => {
          if (s.personId !== 'facilitator')
            fail(403, 'Alleen de facilitator opent of sluit het debriefbord.');
          return applyBoardAction(r, action, {
            created,
            at: new Date().toISOString(),
            by: s.displayName || 'Facilitator',
          });
        },
      );
      if (board.status === 'closed') {
        await settleBoard(board.proof);
        await proof.fence(board.proof);
      }
      res.json(boardView(board));
    }),
  );
  app.get(
    '/game/document',
    wrap(async (req, res) => {
      const { r } = await browser(req);
      res.json(await proof.state(r));
    }),
  );
  const screens = createScreenStore(presence);
  app.post(
    '/game/screen-state',
    wrap(async (req, res) => {
      await screens.save(screenBinding(await browser(req), req.body));
      res.status(204).end();
    }),
  );
  app.post(
    '/game/help',
    wrap(async (req, res) =>
      res.json(
        await store.withSession(token(req), 'browser', ({ p }) => {
          if (!p) fail(400, 'De facilitator heeft geen solo-profiel.');
          p.help = !p.help;
          return { help: p.help };
        }),
      ),
    ),
  );
  const quizDay = (context, body) => {
    if (!context.p) fail(400, 'Alleen deelnemers.');
    return chosenDay(context, body?.day);
  };
  app.post(
    '/game/quiz/start',
    wrap(async (req, res) =>
      res.json(
        await store.withSession(token(req), 'browser', (context) => {
          const day = quizDay(context, req.body);
          requireDayQuiz(getDayPack(day).quiz);
          return openQuizAttempt(context.p, day, Date.now());
        }),
      ),
    ),
  );
  app.post(
    '/game/quiz',
    wrap(async (req, res) =>
      res.json(
        await store.withSession(token(req), 'browser', (context) => {
          const day = quizDay(context, req.body);
          return submitQuizAttempt(
            context.p,
            day,
            getDayPack(day).quiz,
            req.body,
            Date.now(),
            context.r.day,
          );
        }),
      ),
    ),
  );
  app.post(
    '/game/route',
    wrap(async (req, res) => {
      if (!['guided', 'standard', 'stretch'].includes(req.body.route))
        fail(400, 'Ongeldige hulpkeuze.');
      await store.withSession(token(req), 'browser', ({ r, p }) => {
        if (!p) fail(400, 'Alleen deelnemers.');
        p.route = req.body.route;
        p.progressByDay ??= {};
        p.progressByDay[String(r.day)] = {
          ...p.progressByDay[String(r.day)],
          route: p.route,
        };
      });
      res.json({ ok: true });
    }),
  );
  app.post(
    '/game/agent-setup',
    wrap(async (req, res) => {
      const { r, p, s } = await browser(req);
      const facilitator = s.personId === 'facilitator';
      if (!p && !facilitator)
        fail(
          403,
          'Neem als facilitator of deelnemer deel om je eigen Claude te verbinden.',
        );
      if (publicUrl.protocol !== 'https:')
        fail(
          409,
          'De agentkoppeling is beschikbaar op de publieke HTTPS-versie.',
        );
      const requested = req.body?.client;
      const client =
        requested == null || requested === ''
          ? 'claude'
          : normalizeAgentClient(requested);
      if (!client) fail(400, 'client must be claude or codex');
      const access = await store.rotateMcpToken(token(req));
      const principalId = p?.id ?? 'facilitator';
      const instructions = facilitator
        ? facilitatorAgentInstructions({
            origin: publicUrl.origin,
            roomId: r.id,
            accessToken: access.token,
            client,
          })
        : agentInstructions({
            origin: publicUrl.origin,
            roomId: r.id,
            participantId: principalId,
            accessToken: access.token,
            client,
          });
      res.json({
        client,
        instructions,
        expiresAt: s.expiresAt,
        participantId: principalId,
        role: facilitator ? 'facilitator' : 'participant',
        roomId: r.id,
        connectionHint: connectionHint(client),
      });
    }),
  );
  app.post(
    '/game/mcp-token',
    wrap(async (req, res) => res.json(await store.rotateMcpToken(token(req)))),
  );
  app.get(
    '/game/chat/embed',
    wrap(async (req, res) => {
      const { r, p, s } = await browser(req);
      if (!p || s.readOnly) {
        res.status(403).type('text/html').send(chatEmbedErrorHtml());
        return;
      }
      try {
        res.redirect(
          302,
          await createChatEmbedStartUrl(
            { roomId: r.id, participantId: p.id },
            { config: chatConfig, fetchImpl },
          ),
        );
      } catch (e) {
        console.warn('[academy] chat embed failed', { code: e.code || null });
        res.status(502).type('text/html').send(chatEmbedErrorHtml());
      }
    }),
  );
  function reviewer({ r, s }) {
    if (s.personId !== 'facilitator' && s.personId !== r.members[r.driver]?.id)
      fail(403, 'Driver of facilitator beoordeelt het bewijs.');
  }
  async function commentQuote(r) {
    const state = await proof.state(r);
    const quote = state.markdown
      .split('\n')
      .find((line) => line.trim())
      ?.replace(/^#+\s*/, '')
      .trim();
    if (!quote) fail(409, 'Het document heeft nog geen tekst voor commentaar.');
    return quote;
  }
  async function evidence(token, input) {
    const { r, p, s } = await store.auth(token);
    if (!p) fail(403, 'Alleen een deelnemer kan bewijs indienen.');
    const taskId =
      input.taskId == null || input.taskId === ''
        ? undefined
        : findTask(r.day, text(input.taskId, 100)).id;
    const key = text(input.requestId, 100),
      fields = {
        finding: text(input.finding),
        command: text(input.command, 1000),
        observed: text(input.observed),
        limitation: text(input.limitation),
        ...(taskId ? { taskId } : {}),
      };
    const fingerprint = hash(JSON.stringify(fields));
    const canSubmit = ({ r, p }, e) => {
      if (e.taskId) transition(taskStatus(r, p.id, e.taskId, e.day), 'submit');
    };
    const reserved = await store.reserveRequest(
      token,
      'evidence',
      key,
      fingerprint,
      {
        value: {
          id: randomUUID(),
          requestId: key,
          personId: p.id,
          name: p.name,
          source: s.kind === 'mcp' ? 'MCP-client' : 'Deelnemer',
          ...fields,
          day: r.day,
          at: new Date().toISOString(),
          status: 'pending',
        },
        actor: `${s.kind === 'mcp' ? 'ai' : 'human'}:${p.name}:${p.id}`,
        quote: await commentQuote(r),
      },
      (context) => {
        if (!context.p) fail(403, 'Alleen deelnemers.');
        canSubmit(context, { taskId, day: context.r.day });
      },
    );
    if (reserved.completed) return reserved.result;
    const { value: e, actor, quote } = reserved.intent;
    await proof.comment(
      r,
      actor,
      `Bewijs ${e.id}\n${e.finding}\nControle: ${e.command}\nWaargenomen: ${e.observed}\nBeperking: ${e.limitation}\n${e.taskId ? `Opdracht: ${e.taskId}\n` : ''}Status: ingediend, nog niet door een mens beoordeeld.`,
      quote,
      `${p.id}:${key}`,
    );
    return store.completeRequest(
      token,
      'evidence',
      key,
      fingerprint,
      ({ r, p }) => {
        canSubmit({ r, p }, e);
        r.evidence.push(e);
        if (p) {
          p.progressByDay = p.progressByDay || {};
          const keyDay = String(e.day);
          const prev = p.progressByDay[keyDay] || {};
          p.progressByDay[keyDay] = {
            ...prev,
            evidenceCount: (prev.evidenceCount || 0) + 1,
            evidenceAt: e.at,
          };
        }
        return e;
      },
    );
  }
  app.post(
    '/game/evidence',
    wrap(async (req, res) => {
      await browser(req);
      res.json(await evidence(token(req), req.body));
    }),
  );
  app.get(
    '/game/tasks',
    wrap(async (req, res) => {
      const { r, p } = await browser(req);
      if (!p) fail(403, 'Alleen deelnemers hebben een eigen opdrachtenlijst.');
      res.json({ day: r.day, tasks: taskTrail(r, p.id, r.day) });
    }),
  );
  app.post(
    '/game/tasks/:taskId/autograde',
    wrap(async (req, res) =>
      res.json(
        await store.withSession(token(req), 'browser', ({ r, p }) => {
          if (!p)
            fail(
              403,
              'Alleen deelnemers leveren labels in voor automatische beoordeling.',
            );
          return submitAutograde(
            r,
            p,
            findTask(r.day, String(req.params.taskId)),
            req.body,
            new Date().toISOString(),
          );
        }),
      ),
    ),
  );
  app.get(
    '/game/tasks/peer',
    wrap(async (req, res) => {
      const { r, p } = await browser(req);
      if (!p) fail(403, 'Alleen deelnemers beoordelen elkaars opdrachten.');
      res.json(peerQueue(r, p.id));
    }),
  );
  app.get(
    '/game/tasks/queue',
    wrap(async (req, res) => {
      const { r, s } = await browser(req);
      if (s.personId !== 'facilitator')
        fail(403, 'Alleen de facilitator ziet de beoordelingswachtrij.');
      res.json(reviewQueue(r));
    }),
  );
  app.post(
    '/game/review',
    wrap(async (req, res) => {
      const { r, s, p } = await browser(req);
      if (!['accepted', 'needs-work'].includes(req.body.status))
        fail(400, 'Ongeldige beoordeling.');
      const fields = {
          id: text(req.body.id, 100),
          status: req.body.status,
          note: text(req.body.note),
        },
        key = text(req.body.requestId, 100),
        fingerprint = hash(JSON.stringify(fields));
      const sso =
        s.personId === 'facilitator'
          ? await store.facilitator(namedCookie(req, 'academy-facilitator'))
          : null;
      const reviewedBy = {
        role: reviewerRole(s),
        name: sso?.name || p?.name || s.displayName || 'Facilitator',
        email: sso?.email || null,
      };
      const canReview = (context, e) => {
        if (!e.taskId) return;
        authorizeTaskReview(context);
        transition(
          taskStatus(context.r, e.personId, e.taskId, e.day),
          reviewEvent(fields.status),
        );
      };
      const saved = await store.reserveRequest(
        token(req),
        'review',
        key,
        fingerprint,
        {
          value: {
            ...fields,
            by: s.personId,
            reviewer: reviewedBy,
            at: new Date().toISOString(),
          },
          actor: `human:${s.personId}`,
          quote: await commentQuote(r),
        },
        (context) => {
          const e = context.r.evidence.find((e) => e.id === fields.id);
          if (!e?.taskId) reviewer(context);
          if (!e) fail(404, 'Bewijs niet gevonden.');
          if (e.personId === context.s.personId)
            fail(403, 'Laat een andere deelnemer jouw bewijs beoordelen.');
          canReview(context, e);
        },
      );
      if (saved.completed) return res.json(saved.result);
      const { value: intent, actor, quote } = saved.intent;
      await proof.comment(
        r,
        actor,
        `Review bewijs ${intent.id}: ${intent.status}\n${intent.note}`,
        quote,
        `review:${s.personId}:${key}`,
      );
      res.json(
        await store.completeRequest(
          token(req),
          'review',
          key,
          fingerprint,
          (context) => {
            const target = context.r.evidence.find((x) => x.id === intent.id);
            if (!target) fail(404, 'Bewijs niet gevonden.');
            canReview(context, target);
            target.status = intent.status;
            target.review = {
              by: intent.by,
              reviewer: intent.reviewer,
              note: intent.note,
              at: intent.at,
            };
            return target;
          },
        ),
      );
    }),
  );
  app.post(
    '/game/handoff',
    wrap(async (req, res) => {
      const { r, s } = await browser(req);
      const fields = {
          decision: text(req.body.decision),
          checked: text(req.body.checked),
          open: text(req.body.open),
        },
        key = text(req.body.requestId, 100),
        fingerprint = hash(JSON.stringify(fields));
      const saved = await store.reserveRequest(
        token(req),
        'handoff',
        key,
        fingerprint,
        {
          value: {
            id: randomUUID(),
            day: r.day,
            by: s.personId,
            ...fields,
            next:
              r.members[(r.driver + 1) % r.members.length]?.name ||
              'Nog te bepalen',
            at: new Date().toISOString(),
          },
          actor: `human:${s.personId}`,
          quote: await commentQuote(r),
        },
        reviewer,
      );
      if (saved.completed) return res.json(saved.result);
      const { value: h, actor, quote } = saved.intent;
      await proof.comment(
        r,
        actor,
        `Overdracht\nBesluit: ${h.decision}\nGecontroleerd: ${h.checked}\nOpen: ${h.open}\nVolgende eigenaar: ${h.next}`,
        quote,
        h.id,
      );
      res.json(
        await store.completeRequest(
          token(req),
          'handoff',
          key,
          fingerprint,
          (context) => {
            context.r.handoffs.push(h);
            return h;
          },
        ),
      );
    }),
  );
  return { screens, evidence };
}
