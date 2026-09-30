import { fail } from '../store.mjs';
import {
  parseCohortInput,
  parseMemberNames,
  normalizeAccessCode,
  certificateVerifiableUntil,
} from '../cohort.mjs';
import {
  CERTIFICATE_CSP,
  CERTIFICATE_INVALID_MESSAGE,
  publicVerification,
  renderCertificatePage,
  renderVerificationPage,
} from '../certificate.mjs';
import { cookie, namedCookie, text, uuid } from './shared.mjs';

export function registerCohortRoutes(app, deps) {
  const {
    store,
    token,
    publicUrl,
    requireFacilitator,
    wrap,
    setSession,
    liveSockets,
  } = deps;

  const certificateId = (v) => {
    const normalized = normalizeAccessCode(v);
    if (!normalized) fail(404, CERTIFICATE_INVALID_MESSAGE);
    return normalized.match(/.{4}/g).join('-');
  };
  app.post(
    '/game/cohort/activate',
    wrap(async (req, res) =>
      setSession(
        res,
        await store.activateCohortCode(text(req.body.code, 40), { ip: req.ip }),
      ),
    ),
  );
  app.post(
    '/game/facilitator/cohorts',
    wrap(async (req, res) => {
      await requireFacilitator(req);
      res.json(await store.cohortOverview());
    }),
  );
  app.post(
    '/game/facilitator/cohort/create',
    wrap(async (req, res) => {
      const identity = await requireFacilitator(req);
      const input = parseCohortInput(req.body || {}),
        names = req.body?.members?.length
          ? parseMemberNames(req.body.members)
          : [];
      res
        .status(201)
        .json(
          await store.createCohort(
            input,
            names,
            identity && { email: identity.email, name: identity.name },
          ),
        );
    }),
  );
  app.post(
    '/game/facilitator/cohort/members',
    wrap(async (req, res) => {
      await requireFacilitator(req);
      res.json(
        await store.addCohortMembers(
          uuid(req.body.cohortId),
          parseMemberNames(req.body.members),
        ),
      );
    }),
  );
  app.post(
    '/game/facilitator/cohort/attach',
    wrap(async (req, res) => {
      await requireFacilitator(req);
      const cohortId = uuid(req.body.cohortId);
      const roomId = req.body.roomId
        ? uuid(req.body.roomId)
        : uuid(await store.findRoomIdByCode(text(req.body.roomCode, 40)));
      res.json(await store.attachCohortRoom(cohortId, roomId));
    }),
  );
  const closeSockets = (personId) => {
    for (const socket of liveSockets.get(personId) || []) socket.destroy();
    liveSockets.delete(personId);
  };
  app.post(
    '/game/facilitator/cohort/revoke',
    wrap(async (req, res) => {
      await requireFacilitator(req);
      const result = await store.revokeCohortMember(
        uuid(req.body.cohortId),
        uuid(req.body.memberId),
      );
      closeSockets(req.body.memberId);
      res.json(result);
    }),
  );
  app.post(
    '/game/facilitator/cohort/reissue',
    wrap(async (req, res) => {
      await requireFacilitator(req);
      const result = await store.reissueCohortCode(
        uuid(req.body.cohortId),
        uuid(req.body.memberId),
      );
      closeSockets(req.body.memberId);
      res.json(result);
    }),
  );
  app.post(
    '/game/facilitator/cohort/certificate/revoke',
    wrap(async (req, res) => {
      await requireFacilitator(req);
      res.json(
        await store.revokeCertificate(
          uuid(req.body.cohortId),
          certificateId(req.body.certificateId),
        ),
      );
    }),
  );
  app.post(
    '/game/facilitator/cohort/certificate/issue',
    wrap(async (req, res) => {
      const identity = await requireFacilitator(req);
      const issuedBy = identity
        ? { email: identity.email, name: identity.name }
        : null;
      res.json(
        await store.issueCertificate(
          uuid(req.body.cohortId),
          uuid(req.body.memberId),
          issuedBy,
        ),
      );
    }),
  );
  const certLocale = (req) => {
    const raw = req.body?.locale ?? req.query?.locale;
    return raw === 'en' || raw === 'nl' ? raw : 'nl';
  };
  const sendCertificate = (res, certificate, locale) => {
    if (!certificate || certificate.revokedAt)
      fail(404, CERTIFICATE_INVALID_MESSAGE);
    res
      .type('text/html')
      .set('Content-Security-Policy', CERTIFICATE_CSP)
      .set('X-Robots-Tag', 'noindex')
      .send(
        renderCertificatePage(certificate, {
          verifyUrl: `${publicUrl.origin}/verify/${certificate.id}`,
          verifiableUntil: certificateVerifiableUntil(certificate),
          locale,
        }),
      );
  };
  app.post(
    '/game/facilitator/cohort/certificate/view',
    wrap(async (req, res) => {
      await requireFacilitator(req);
      sendCertificate(
        res,
        await store.certificate(certificateId(req.body.certificateId)),
        certLocale(req),
      );
    }),
  );
  app.get(
    '/certificate/:id',
    wrap(async (req, res) => {
      const certificate = await store.certificate(certificateId(req.params.id));
      const facilitator = await store.facilitator(
        namedCookie(req, 'academy-facilitator'),
      );
      if (!facilitator) {
        const { s } = await store.auth(cookie(req), 'browser');
        if (!certificate || s.personId !== certificate.memberId)
          fail(404, CERTIFICATE_INVALID_MESSAGE);
      }
      sendCertificate(res, certificate, certLocale(req));
    }),
  );
  app.get(
    '/game/certificate',
    wrap(async (req, res) => {
      const mine = await store.myCertificate(token(req));
      if (!mine) return res.json({ status: 'no-cohort' });
      res.json({
        ...mine,
        ...(mine.id
          ? {
              certificateUrl: `/certificate/${mine.id}`,
              verifyUrl: `${publicUrl.origin}/verify/${mine.id}`,
            }
          : {}),
      });
    }),
  );
  app.get(
    '/game/badges',
    wrap(async (req, res) => res.json(await store.myBadges(token(req)))),
  );
  app.get(
    '/verify/:id',
    wrap(async (req, res) => {
      const normalized = normalizeAccessCode(req.params.id);
      const verification = normalized
        ? publicVerification(
            await store.certificate(normalized.match(/.{4}/g).join('-')),
          )
        : null;
      res
        .status(verification ? 200 : 404)
        .type('text/html')
        .set('Content-Security-Policy', CERTIFICATE_CSP)
        .set('X-Robots-Tag', 'noindex')
        .send(
          renderVerificationPage(verification, { locale: certLocale(req) }),
        );
    }),
  );
}
