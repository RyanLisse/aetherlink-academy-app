import { dayProgress } from '../progress.mjs';
import { PARTICIPANT_FIXTURES } from '../../content/triage/grade.mjs';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fail } from '../store.mjs';
import {
  getDayPack,
  listRouteDays,
  listDaySummaries,
  courseEntry,
  starterFileNames,
} from '../content.mjs';
import { courseTemplate, courseTemplates } from '../../content/days/course.mjs';
import {
  projectPackLocale,
  normalizeContentLocale,
} from '../../content/days/locale.mjs';
import { participantDayPack } from '../quiz.mjs';
import {
  parseLabAnswer,
  parseLabCompletion,
  parseOriginAllowlist,
  resolveLabs,
} from '../../packages/lab-embed/src/index.ts';
import { listSims, resolvePackSims } from '../sims.mjs';
import {
  gradedStopsPassed,
  parseLabKeys,
  recordAttempt,
} from '../../packages/lab-embed/src/grading.ts';
import { ARCADE_CATALOG, roomLabDeclarations } from '../arcade-catalog.mjs';
import { answerQuestion, rankDocuments } from '../faq.mjs';
import { coachAnswer, coachStatus, redactQuestion } from '../coach.mjs';
import { text } from './shared.mjs';

export function registerContentRoutes(app, deps) {
  const {
    store,
    token,
    browser,
    publicUrl,
    labOrigins,
    labsForDay,
    labKeys,
    readableDays,
    chosenDay,
    wrap,
    fetchImpl,
    coachConfig,
  } = deps;

  // Labs are embeddable only from origins configured here, never from the pack or the client.
  const allowedLabOrigins = parseOriginAllowlist(labOrigins, publicUrl.origin),
    gradingKeys = parseLabKeys(labKeys),
    dayLabs = (day, room) =>
      resolveLabs(
        [...(labsForDay(day) ?? []), ...roomLabDeclarations(room, day)],
        {
          baseUrl: publicUrl.origin,
          allowedOrigins: allowedLabOrigins,
          gradedStopsFor: (id) => [...(gradingKeys.get(id)?.keys() ?? [])],
        },
      );
  // A lab belongs to one day; practising an earlier released day records on that day, not on today.
  const participantLab = (context, labId) => {
    const { r, p } = context;
    if (!p) fail(403, 'Only participants create a lab.');
    const labDay = [r.day, ...readableDays(context)].find((day) =>
      dayLabs(day, r).some((lab) => lab.id === labId),
    );
    if (labDay === undefined)
      fail(404, `Lab ${labId} does not belong to a released day.`);
    const key = String(labDay);
    p.progressByDay ??= {};
    return { key, labDay, day: p.progressByDay[key] || {} };
  };
  const publicDayPack = (pack, room, locale = 'en') => {
    const projected = projectPackLocale(pack, locale);
    return {
      ...participantDayPack(projected),
      labs: dayLabs(pack.day, room),
      sims: resolvePackSims(projected.sims, { locale }),
      locale: normalizeContentLocale(locale),
      localeComplete: Boolean(projected.localeComplete),
    };
  };
  app.get(
    '/game/lab-catalog',
    wrap(async (req, res) => {
      await browser(req);
      res.json({
        labs: ARCADE_CATALOG.map(({ id, title, track, workshop }) => ({
          id,
          title,
          track,
          ...(workshop != null ? { workshop } : {}),
        })),
      });
    }),
  );
  app.get(
    '/game/sim-catalog',
    wrap(async (req, res) => {
      await browser(req);
      res.json({ sims: listSims(normalizeContentLocale(req.query?.locale)) });
    }),
  );
  app.get(
    '/game/day-pack',
    wrap(async (req, res) => {
      const context = await browser(req),
        { r } = context,
        day = chosenDay(context, req.query.day),
        pack = getDayPack(day),
        locale = normalizeContentLocale(req.query?.locale);
      if (!pack) fail(400, `No content pack for support day ${day}.`);
      const entry = courseEntry(r.course, day),
        body = publicDayPack(pack, r, locale);
      res.json(
        entry
          ? {
              ...body,
              title: entry.title ?? body.title,
              course: {
                name: r.course.name,
                position: entry.position,
                count: r.course.days.length,
                date: entry.date,
              },
            }
          : body,
      );
    }),
  );
  app.get(
    '/game/naslag/search',
    wrap(async (req, res) => {
      const context = await browser(req),
        q = String(req.query.q || '').slice(0, 300);
      res.json({
        query: q,
        released: readableDays(context),
        hits: rankDocuments(q, {
          day: context.r.day,
          days: readableDays(context),
          locale: normalizeContentLocale(req.query.locale),
        }).hits,
      });
    }),
  );
  const chatSession = async (req) => {
    const context = await browser(req);
    if (context.s.personId !== 'facilitator' && context.r.chat === false)
      fail(403, 'The facilitator has turned off chat for this room.');
    return context;
  };
  // Cohort members keep one counter across rooms; the facilitator seat counts per room.
  const coachPerson = ({ r, s }) =>
    s.personId === 'facilitator' ? `facilitator:${r.id}` : s.personId;
  app.post(
    '/game/chat',
    wrap(async (req, res) => {
      const { r, s } = await chatSession(req),
        locale = normalizeContentLocale(req.body?.locale),
        faq = answerQuestion({
          day: r.day,
          released: readableDays({ r, s }),
          query: text(req.body?.q, 300),
          locale,
        });
      if (!coachConfig) return res.json(faq);
      res.json(
        await coachAnswer({
          faq,
          config: coachConfig,
          store,
          fetchImpl,
          locale,
          personKey: coachPerson({ r, s }),
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
    '/game/chat/coach',
    wrap(async (req, res) => {
      const context = await chatSession(req);
      res.json(
        coachConfig
          ? await coachStatus({
              config: coachConfig,
              store,
              personKey: coachPerson(context),
            })
          : { enabled: false },
      );
    }),
  );
  app.get(
    '/game/course',
    wrap(async (req, res) => {
      const { r, s } = await browser(req);
      if (s.personId !== 'facilitator')
        fail(403, 'Only the facilitator composes the course.');
      res.json({
        course: r.course ?? null,
        template: courseTemplate(),
        templates: courseTemplates(),
        packs: listDaySummaries(),
      });
    }),
  );
  app.get(
    '/game/day-route',
    wrap(async (req, res) => {
      const context = await browser(req),
        { r, p } = context,
        released = readableDays(context),
        locale = normalizeContentLocale(req.query?.locale);
      res.json({
        day: r.day,
        released,
        locale,
        ...(r.course ? { course: { name: r.course.name } } : {}),
        days: listRouteDays(r.course).map((d) => {
          const pack = getDayPack(d.day);
          const projected = pack ? projectPackLocale(pack, locale) : d;
          const entryTitle = r.course?.days?.find(
            (entry) => entry.day === d.day,
          )?.title;
          return {
            ...d,
            title: entryTitle || projected.title || d.title,
            blurb: projected.blurb ?? d.blurb,
            released: released.includes(d.day),
            labsTotal: dayLabs(d.day, r).length,
            progress: dayProgress(r, p, d.day),
          };
        }),
      });
    }),
  );
  app.post(
    '/game/lab-answer',
    wrap(async (req, res) => {
      const submission = parseLabAnswer(req.body);
      if (!submission) fail(400, 'Invalid lab answer.');
      res.json(
        await store.withSession(token(req), 'browser', (context) => {
          const { p } = context;
          const { key, labDay, day } = participantLab(
              context,
              submission.labId,
            ),
            answerKey = gradingKeys
              .get(submission.labId)
              ?.get(submission.stopId);
          if (!answerKey)
            fail(404, `Stop ${submission.stopId} is not graded.`);
          const stops = day.labStops?.[submission.labId] || {},
            { recorded, stop } = recordAttempt(
              stops[submission.stopId],
              answerKey,
              submission,
              new Date().toISOString(),
            );
          if (recorded)
            p.progressByDay[key] = {
              ...day,
              labStops: {
                ...day.labStops,
                [submission.labId]: { ...stops, [submission.stopId]: stop },
              },
            };
          return { recorded, day: labDay, labId: submission.labId, stop };
        }),
      );
    }),
  );
  app.post(
    '/game/lab-complete',
    wrap(async (req, res) => {
      const completion = parseLabCompletion(req.body);
      if (!completion) fail(400, 'Invalid lab completion.');
      res.json(
        await store.withSession(token(req), 'browser', (context) => {
          const { p } = context;
          const { key, labDay, day } = participantLab(
              context,
              completion.labId,
            ),
            existing = day.labs?.[completion.labId];
          if (existing)
            return {
              recorded: false,
              day: labDay,
              labId: completion.labId,
              lab: existing,
            };
          const graded = gradedStopsPassed(
            gradingKeys.get(completion.labId),
            day.labStops?.[completion.labId],
          );
          if (graded.passed < graded.total)
            fail(
              409,
              `Not all graded stops passed yet (${graded.passed}/${graded.total}).`,
            );
          const lab = graded.total
            ? {
                source: 'server-graded',
                result: {
                  outcome: 'completed',
                  score: { value: graded.passed, max: graded.total },
                },
                evidence: completion.evidence ?? null,
                at: new Date().toISOString(),
              }
            : {
                source: 'lab-reported',
                result: completion.result,
                evidence: completion.evidence ?? null,
                at: new Date().toISOString(),
              };
          p.progressByDay[key] = {
            ...day,
            labs: { ...day.labs, [completion.labId]: lab },
          };
          return { recorded: true, day: labDay, labId: completion.labId, lab };
        }),
      );
    }),
  );
}

export function registerStarterRoute(app, deps) {
  const { root, browser, wrap } = deps;

  app.get(
    '/game/starter/:file',
    wrap(async (req, res) => {
      await browser(req);
      if (!starterFileNames.includes(req.params.file))
        fail(404, 'File not found.');
      res
        .type('text/plain')
        .send(
          req.params.file === 'triage-fixtures.json'
            ? JSON.stringify(PARTICIPANT_FIXTURES, null, 2) + '\n'
            : readFileSync(path.join(root, 'starter', req.params.file), 'utf8'),
        );
    }),
  );
}
