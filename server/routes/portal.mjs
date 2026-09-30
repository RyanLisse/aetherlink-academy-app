import { timingSafeEqual } from 'node:crypto';
import { hash, fail } from '../store.mjs';
import { namedCookie, text } from './shared.mjs';

export function registerPortalRoutes(app, deps) {
  const { portal, publicUrl, hostKey, store, browser, wrap } = deps;

  const resolvePortalActor = async (req) => {
    const facilitator = await store.facilitator(
      namedCookie(req, 'academy-facilitator'),
    );
    if (facilitator)
      return {
        ownerId: facilitator.sub || facilitator.email,
        role: 'facilitator',
        name: facilitator.name,
        email: facilitator.email,
        roomId: null,
        via: 'facilitator-cookie',
      };
    if (typeof req.body?.hostKey === 'string' && req.body.hostKey) {
      const key = Buffer.from(hash(req.body.hostKey));
      if (timingSafeEqual(key, Buffer.from(hash(hostKey))))
        return {
          ownerId: 'host-key',
          role: 'facilitator',
          name: 'Facilitator',
          email: null,
          roomId: null,
          via: 'host-key',
        };
    }
    try {
      const { r, s, p } = await browser(req);
      if (s.personId === 'facilitator')
        return {
          ownerId: 'room-facilitator:' + r.id,
          role: 'facilitator',
          name: s.displayName || 'Facilitator',
          email: null,
          roomId: r.id,
          via: 'room-session',
        };
      return {
        ownerId: p?.id || s.personId,
        role: 'participant',
        name: p?.name || s.displayName || 'Deelnemer',
        email: null,
        roomId: r.id,
        via: 'room-session',
      };
    } catch {
      fail(
        401,
        'Sign in as a facilitator or open a room to use the portal.',
      );
    }
  };
  app.get(
    '/game/apps',
    wrap(async (_req, res) =>
      res.json({
        apps: portal.listLauncherApps(),
        inventory: portal.inventory(),
      }),
    ),
  );
  app.post(
    '/game/apps/:appId/launch',
    wrap(async (req, res) => {
      const actor = await resolvePortalActor(req);
      portal.ownership.assertCanLaunch({ appId: req.params.appId, actor });
      const appMeta = portal
        .listLauncherApps()
        .find((a) => a.id === req.params.appId);
      if (!appMeta) fail(404, 'Unknown app.');
      if (!appMeta.launchable)
        fail(
          409,
          appMeta.blockedBy
            ? `App geblokkeerd door ${appMeta.blockedBy}.`
            : 'App cannot be launched yet.',
        );
      const grant = portal.ownership.grant({
        appId: req.params.appId,
        ownerKind: actor.role === 'facilitator' ? 'facilitator' : 'participant',
        ownerId: actor.ownerId,
        orgId: req.body?.orgId || null,
        resourceId: req.body?.resourceId || actor.roomId || null,
        role: actor.role,
        grantedBy: actor.ownerId,
      });
      const returnTo =
        typeof req.body?.returnTo === 'string' &&
        req.body.returnTo.startsWith(publicUrl.origin)
          ? req.body.returnTo
          : publicUrl.origin + '/?view=apps';
      const ticket = portal.launch.mint({
        appId: req.params.appId,
        actor,
        returnTo,
        grantId: grant.id,
        targetOrigin: appMeta.origin || publicUrl.origin,
      });
      res.json({ grantId: grant.id, launch: ticket, backToAcademy: returnTo });
    }),
  );
  app.post(
    '/game/apps/grants/:grantId/revoke',
    wrap(async (req, res) => {
      const actor = await resolvePortalActor(req);
      res.json(
        portal.ownership.revoke({
          grantId: req.params.grantId,
          actorId: actor.ownerId,
        }),
      );
    }),
  );
  app.post(
    '/game/apps/:appId/publish',
    wrap(async (req, res) => {
      const actor = await resolvePortalActor(req);
      if (actor.role !== 'facilitator')
        fail(
          403,
          'Only the facilitator publishes immutable Academy versions.',
        );
      const contentRef = req.body?.contentRef || {
        kind: 'day-pack',
        day: Number(req.body?.day || 1),
      };
      const artifact = await portal.adapters.publishImmutable({
        appId: req.params.appId,
        contentRef,
        actor,
        resourceId: req.body?.resourceId || null,
      });
      res.status(201).json({
        id: artifact.id,
        contentSha256: artifact.contentSha256,
        publishedAt: artifact.publishedAt,
        publisher: artifact.publisher,
        sourceRef: artifact.sourceRef,
      });
    }),
  );
  app.post(
    '/game/apps/:appId/pin',
    wrap(async (req, res) => {
      const actor = await resolvePortalActor(req);
      const roomId = text(req.body?.roomId || actor.roomId || '', 60);
      res.json(
        portal.adapters.pinClassroom({
          roomId,
          publishedId: text(req.body?.publishedId, 80),
          actor,
        }),
      );
    }),
  );
  app.get(
    '/game/apps/:appId/published/:publishedId',
    wrap(async (req, res) => {
      const artifact = portal.adapters.getPublished(req.params.publishedId);
      if (!artifact || artifact.appId !== req.params.appId)
        fail(404, 'Publication not found.');
      res.json({
        id: artifact.id,
        appId: artifact.appId,
        contentSha256: artifact.contentSha256,
        publishedAt: artifact.publishedAt,
        publisher: artifact.publisher,
        sourceRef: artifact.sourceRef,
        body: artifact.body,
      });
    }),
  );
  app.post(
    '/game/portal/verify-ticket',
    wrap(async (req, res) => {
      const claims = portal.launch.verify(req.body?.ticket);
      res.json({ claims, backToAcademy: claims.returnTo });
    }),
  );
}
