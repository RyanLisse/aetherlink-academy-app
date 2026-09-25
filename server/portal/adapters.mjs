import {createHash,randomUUID} from 'node:crypto';
import {fail} from '../store.mjs';

/**
 * Scoped content adapters: read canonical Academy content and publish
 * immutable versions. External edits never mutate published rows.
 */
export function createPublishAdapter({readCanonical} = {}) {
  const published = new Map(); // id -> artifact (append-only)
  const pins = new Map(); // pinKey -> publishedId

  async function resolveCanonical(contentRef) {
    if (typeof readCanonical === 'function') return readCanonical(contentRef);
    if (contentRef && typeof contentRef === 'object' && typeof contentRef.body === 'string') {
      return {body: contentRef.body, sourceRef: contentRef.sourceRef || 'inline', contentType: contentRef.contentType || 'text/plain'};
    }
    fail(400, 'Geen canonieke inhoud.');
  }

  async function publishImmutable({appId, contentRef, actor, resourceId = null}) {
    if (!actor?.ownerId) fail(403, 'Publiceren vereist een eigenaar.');
    if (!appId) fail(400, 'App-id verplicht.');
    const canonical = await resolveCanonical(contentRef);
    const contentSha256 = createHash('sha256').update(canonical.body).digest('hex');
    const id = randomUUID();
    const artifact = Object.freeze({
      id,
      appId,
      resourceId,
      contentSha256,
      contentType: canonical.contentType,
      sourceRef: canonical.sourceRef,
      body: canonical.body,
      publishedAt: Date.now(),
      publisher: {ownerId: actor.ownerId, role: actor.role, name: actor.name || null},
    });
    published.set(id, artifact);
    return {...artifact};
  }

  function getPublished(id) {
    const artifact = published.get(id);
    return artifact ? {...artifact} : null;
  }

  function pinClassroom({roomId, publishedId, actor}) {
    if (!roomId || !publishedId) fail(400, 'Pin mist kamer of publicatie.');
    if (actor?.role !== 'facilitator') fail(403, 'Alleen de facilitator pint een classroom.');
    const artifact = published.get(publishedId);
    if (!artifact) fail(404, 'Publicatie niet gevonden.');
    const key = `${roomId}:${artifact.appId}`;
    pins.set(key, publishedId);
    return {roomId, appId: artifact.appId, publishedId, contentSha256: artifact.contentSha256};
  }

  function readPin(roomId, appId) {
    const publishedId = pins.get(`${roomId}:${appId}`);
    if (!publishedId) return null;
    return getPublished(publishedId);
  }

  /** Simulate external editor mutating a draft — must NOT change published artifact. */
  function mutateExternalDraft(_draftId, _newBody) {
    return {ok: true, note: 'external-draft-only'};
  }

  return {publishImmutable, getPublished, pinClassroom, readPin, mutateExternalDraft, _published: published, _pins: pins};
}
