import { taskTrail } from '../proof-trail.mjs';
import { fail } from '../store.mjs';
import { createAcademyMcpServer } from '../mcp-tools.mjs';
import {
  createMcpHandler,
  validateHostHeader,
} from '@modelcontextprotocol/server';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { mission, searchKnowledge, getDayPack } from '../content.mjs';
import { readScreenState } from '../screen-state.mjs';
import { bearer, text, uuid } from './shared.mjs';

export function registerMcpRoutes(app, deps) {
  const {
    store,
    slides,
    browser,
    wrap,
    publicUrl,
    screens,
    evidence,
    deckActor,
    overlayDay,
  } = deps;

  async function executeMcp(token, tool, input) {
    const a = await store.auth(token, 'mcp');
    const { r, p, s } = a;
    const facilitator = s.personId === 'facilitator';
    if (!p && !facilitator) fail(403, 'No valid Academy role.');
    const requireParticipant = () => {
      if (!p)
        fail(403, 'This MCP action is only available to participants.');
    };
    let result;
    switch (tool) {
      case 'get_mission': {
        const pack = getDayPack(r.day);
        result = facilitator
          ? {
              session: { roomId: r.id, role: 'facilitator', squadName: r.name },
              mission: pack?.mission || mission,
              day: r.day,
              phase: r.phase,
              intent: { url: r.intentUrl || null, file: 'intent.md' },
              coach:
                'You are the facilitator for this room. Manage lesson decks and pin one as the active classroom overlay only when explicitly asked. Academy does not start a model or submit evidence on behalf of participants.',
            }
          : {
              session: {
                roomId: r.id,
                participantId: p.id,
                participantName: p.name,
                squadName: r.name,
              },
              mission: pack?.mission || mission,
              day: r.day,
              phase: r.phase,
              route: p.route,
              tasks: taskTrail(r, p.id, r.day),
              intent: { url: r.intentUrl || null, file: 'intent.md' },
              coach:
                'Explain concepts, cite lesson ids, and match hints to the help choice. Read the shared intent first: intent.url when it is set, otherwise intent.md in the squad repo. No browser chat or model API from the game.',
            };
        break;
      }
      case 'get_screen_state':
        requireParticipant();
        result = await readScreenState(a, screens);
        break;
      case 'search_knowledge':
        result = { lessons: searchKnowledge(String(input.query || '')) };
        break;
      case 'submit_evidence':
        requireParticipant();
        result = await evidence(token, input);
        break;
      case 'list_decks':
      case 'get_deck':
      case 'create_deck':
      case 'add_slide':
      case 'update_slide':
      case 'patch_deck':
      case 'export_deck_html': {
        const action = {
          list_decks: 'listDecks',
          get_deck: 'getDeck',
          create_deck: 'createDeck',
          add_slide: 'addSlide',
          update_slide: 'updateSlide',
          patch_deck: 'patchDeck',
          export_deck_html: 'exportHtml',
        }[tool];
        result = await slides.run(action, deckActor(a), input || {});
        break;
      }
      case 'pin_classroom_deck': {
        if (!facilitator)
          fail(403, 'Only the facilitator can pin the Classroom overlay.');
        const deckIdValue = uuid(input?.deckId);
        const day = overlayDay(r, input?.day);
        await slides.run('getDeck', deckActor(a), {
          deckId: deckIdValue,
          compact: true,
        });
        result = await store.withSession(token, 'mcp', ({ r, s }) => {
          if (s.personId !== 'facilitator')
            fail(403, 'Only the facilitator can pin the Classroom overlay.');
          r.classroomOverlayByDay = {
            ...(r.classroomOverlayByDay || {}),
            [String(day)]: deckIdValue,
          };
          r.version++;
          return { deckId: deckIdValue, day, pinned: true };
        });
        break;
      }
      default:
        fail(404, 'Unknown MCP tool.');
    }
    if (p)
      await store.withSession(token, 'mcp', ({ p }) => {
        if (p) p.lastMcp = new Date().toISOString();
      });
    else if (facilitator)
      await store.withSession(token, 'mcp', ({ r }) => {
        r.facilitatorLastMcp = new Date().toISOString();
      });
    return result;
  }
  app.post(
    '/game/mcp/:tool',
    wrap(async (req, res) =>
      res.json(await executeMcp(bearer(req), req.params.tool, req.body)),
    ),
  );
  app.get(
    '/game/connection',
    wrap(async (req, res) => {
      await browser(req);
      res.json({
        transport: 'streamable-http',
        mcpUrl: publicUrl.origin + '/mcp',
        remoteConfigured: publicUrl.protocol === 'https:',
        status:
          publicUrl.protocol === 'https:'
            ? 'Remote address configured; external reachability not yet verified.'
            : 'Local preview. No public remote MCP has been deployed yet.',
      });
    }),
  );
  const mcpHandler = createMcpHandler(
    () =>
      createAcademyMcpServer((tool, input, ctx) => {
        const auth = ctx.http?.req?.headers.get('authorization') || '';
        return executeMcp(
          auth.startsWith('Bearer ') ? auth.slice(7) : '',
          tool,
          input,
        );
      }),
    { legacy: 'stateless', responseMode: 'json' },
  );
  const mcpNodeHandler = toNodeHandler(mcpHandler);
  app.all(
    '/mcp',
    wrap(async (req, res) => {
      try {
        await store.auth(bearer(req), 'mcp');
      } catch (e) {
        res.setHeader('WWW-Authenticate', 'Bearer realm="academy"');
        throw e;
      }
      if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({
          error: 'Stateless Streamable HTTP only supports POST here.',
        });
      }
      if (!validateHostHeader(req.headers.host, [publicUrl.hostname]).ok)
        return res.status(403).json({ error: 'Invalid Host header.' });
      if (req.headers.origin && req.headers.origin !== publicUrl.origin)
        return res
          .status(403)
          .json({ error: 'Cross-origin requests are not allowed.' });
      await mcpNodeHandler(req, res, req.body);
    }),
  );
}
