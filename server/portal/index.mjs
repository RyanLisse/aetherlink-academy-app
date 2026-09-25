import {loadAppsManifest, listLauncherApps} from './manifest.mjs';
import {createOwnershipRegistry} from './ownership.mjs';
import {createPublishAdapter} from './adapters.mjs';
import {createLaunchTicketService} from './launch.mjs';

export function createPortal({signingSecret, academyOrigin, manifestPath, readCanonical} = {}) {
  const manifest = loadAppsManifest(manifestPath);
  const ownership = createOwnershipRegistry();
  const adapters = createPublishAdapter({readCanonical});
  const launch = createLaunchTicketService({signingSecret, academyOrigin});

  function inventory() {
    return {
      betterAuth: false,
      academyAuth: ['google-oidc-facilitator', 'host-key-facilitator', 'room-browser-session', 'mcp-participant-token'],
      googleSsoDependency: 'AET-6',
      apps: listLauncherApps(manifest),
      brandingIssue: 'AET-51',
      chatEmbedCoordination: 'AET-56 HMAC tickets on poc tip; portal delegates when AGENT_CHAT_* set',
    };
  }

  return {manifest, ownership, adapters, launch, inventory, listLauncherApps: () => listLauncherApps(manifest)};
}

export {loadAppsManifest, listLauncherApps, createOwnershipRegistry, createPublishAdapter, createLaunchTicketService};
