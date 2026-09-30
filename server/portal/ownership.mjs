import {randomUUID} from 'node:crypto';
import {fail} from '../store.mjs';

/** In-memory ownership + launch grants for the thin AET-53 slice. */
export function createOwnershipRegistry() {
  const grants = new Map();

  function listForOwner(ownerId) {
    return [...grants.values()].filter((g) => g.ownerId === ownerId && !g.revokedAt);
  }

  function grant({appId, ownerKind, ownerId, orgId = null, resourceId = null, role, grantedBy, ttlMs = 12 * 60 * 60 * 1000}) {
    if (!appId || !ownerKind || !ownerId || !role) fail(400, 'Grant is missing an app, owner or role.');
    if (!['facilitator', 'participant', 'org'].includes(ownerKind)) fail(400, 'Ongeldige eigenaarsoort.');
    if (!['facilitator', 'participant'].includes(role)) fail(400, 'Invalid launch role.');
    const id = randomUUID();
    const now = Date.now();
    const record = {
      id,
      appId,
      ownerKind,
      ownerId,
      orgId,
      resourceId,
      role,
      grantedBy: grantedBy || ownerId,
      grantedAt: now,
      expiresAt: now + ttlMs,
      revokedAt: null,
    };
    grants.set(id, record);
    return {...record};
  }

  function get(id) {
    const record = grants.get(id);
    if (!record) return null;
    if (record.revokedAt) return null;
    if (record.expiresAt < Date.now()) {
      record.revokedAt = record.expiresAt;
      return null;
    }
    return {...record};
  }

  function revoke({grantId, actorId}) {
    const record = grants.get(grantId);
    if (!record || record.revokedAt) fail(404, 'Grant not found.');
    if (record.ownerId !== actorId && record.grantedBy !== actorId) fail(403, 'Only the owner or publisher revokes access.');
    record.revokedAt = Date.now();
    return {...record};
  }

  function assertCanLaunch({appId, actor}) {
    if (!actor?.ownerId || !actor?.role) fail(403, 'No valid portal identity.');
    if (actor.role === 'facilitator') return;
    if (actor.role === 'participant' && actor.roomId) return;
    fail(403, 'Participants launch apps only from a room.');
  }

  return {grant, get, revoke, listForOwner, assertCanLaunch, _grants: grants};
}
