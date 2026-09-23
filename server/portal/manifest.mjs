import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const DEFAULT_MANIFEST = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../infra/native-apps/apps.manifest.json');

export function loadAppsManifest(manifestPath = DEFAULT_MANIFEST) {
  const raw = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (!Array.isArray(raw.apps)) throw new Error('apps.manifest.json missing apps[]');
  return raw;
}

export function listLauncherApps(manifest = loadAppsManifest(), {includeDeferred = false} = {}) {
  const active = new Set(manifest.activeScope || []);
  return manifest.apps
    .filter((app) => includeDeferred || active.has(app.app) || !manifest.deferredScope?.includes(app.app))
    .map((app) => ({
      id: app.app,
      status: app.status,
      origin: app.proposedOrigin || null,
      linearIssue: app.linearIssue || null,
      blockedBy: app.blockedBy || null,
      releaseRequirements: app.releaseRequirements || [],
      launchable: !app.blockedBy && !String(app.status || '').startsWith('deferred'),
    }));
}
