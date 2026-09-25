export interface AuthoringUpstreamConfig {
  readonly origin: string;
  readonly token: string;
}

export interface AuthoringConfig {
  readonly apiKey: string;
  readonly dataDir: string;
  readonly upstream: AuthoringUpstreamConfig;
  readonly upstreamTimeoutMs: number;
}

const DEFAULT_UPSTREAM_TIMEOUT_MS = 15_000;

const parseUpstreamOrigin = (raw: string): string | null => {
  try {
    const url = new URL(raw);
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) return null;
    if (url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
};

const parseTimeout = (raw: string | undefined): number => {
  const value = raw?.trim() ? Number(raw) : NaN;
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_UPSTREAM_TIMEOUT_MS;
};

/**
 * Every field here is required; a missing or malformed one disables the whole
 * PoC surface (`AuthoringLive` mounts no routes) instead of running partially
 * configured.
 */
export const readAuthoringConfig = (env: NodeJS.ProcessEnv): AuthoringConfig | null => {
  if (env.ACADEMY_AUTHORING_ENABLED?.trim() !== 'true') return null;
  const apiKey = env.ACADEMY_AUTHORING_KEY?.trim();
  const dataDir = env.ACADEMY_AUTHORING_DATA_DIR?.trim();
  const upstreamUrl = env.AGENT_SLIDES_URL?.trim();
  const upstreamToken = env.AGENT_SLIDES_TOKEN?.trim();
  if (!apiKey || !dataDir || !upstreamUrl || !upstreamToken) return null;
  const origin = parseUpstreamOrigin(upstreamUrl);
  if (!origin) return null;
  return {
    apiKey,
    dataDir,
    upstream: {origin, token: upstreamToken},
    upstreamTimeoutMs: parseTimeout(env.ACADEMY_AUTHORING_UPSTREAM_TIMEOUT_MS),
  };
};
