import type {IncomingMessage, Server, ServerResponse} from 'node:http';
import {createMcpHandler, validateHostHeader, localhostAllowedHostnames} from '@modelcontextprotocol/server';
import {toNodeHandler} from '@modelcontextprotocol/node';
import type {McpServer} from '@modelcontextprotocol/server';
import {Effect} from 'effect';
import {lockedLessonHttpDenial} from './denial.ts';

export interface McpHttpAuth {
  /** Resolve MCP bearer; fail with 401 when invalid/revoked. */
  readonly authenticate: (token: string) => Effect.Effect<{roomId: string; personId: string}, {status: 401; message: string}>;
}

export interface AttachMcpHttpOptions {
  readonly createServer: () => McpServer;
  readonly auth: McpHttpAuth;
  readonly allowedHostnames?: ReadonlyArray<string>;
  readonly publicOrigin?: string | null;
}

const readBearer = (req: IncomingMessage): string => {
  const raw = req.headers.authorization || '';
  const m = /^Bearer\s+(.+)$/i.exec(raw);
  return m?.[1] ?? '';
};

/**
 * Streamable HTTP MCP at `/mcp` (POST). Stdio remains available via `stdio.ts`.
 * Auth: Bearer MCP token. Host/origin checks match the legacy bridge.
 */
export const attachMcpHttp = (server: Server, options: AttachMcpHttpOptions): void => {
  const allowed = [...(options.allowedHostnames ?? localhostAllowedHostnames())];
  if (options.publicOrigin) {
    try {
      allowed.push(new URL(options.publicOrigin).hostname);
    } catch {
      /* ignore */
    }
  }
  const mcpHandler = createMcpHandler(() => options.createServer(), {
    legacy: 'stateless',
    responseMode: 'json',
  });
  const nodeHandler = toNodeHandler(mcpHandler);

  const previous = server.listeners('request');
  server.removeAllListeners('request');

  server.on('request', (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname !== '/mcp') {
      for (const listener of previous) {
        (listener as (q: IncomingMessage, s: ServerResponse) => void)(req, res);
      }
      return;
    }

    void (async () => {
      const hostCheck = validateHostHeader(req.headers.host, allowed);
      if (!hostCheck.ok) {
        res.writeHead(403, {'content-type': 'application/json'});
        res.end(JSON.stringify({error: 'invalid host'}));
        return;
      }
      const origin = req.headers.origin;
      if (origin) {
        try {
          const oh = new URL(origin).hostname;
          if (!allowed.includes(oh) && !allowed.includes(origin)) {
            res.writeHead(403, {'content-type': 'application/json'});
            res.end(JSON.stringify({error: 'invalid origin'}));
            return;
          }
        } catch {
          res.writeHead(403, {'content-type': 'application/json'});
          res.end(JSON.stringify({error: 'invalid origin'}));
          return;
        }
      }

      const token = readBearer(req);
      const auth = await Effect.runPromise(Effect.result(options.auth.authenticate(token)));
      if (auth._tag === 'Failure') {
        res.writeHead(401, {
          'content-type': 'application/json',
          'www-authenticate': 'Bearer realm="academy"',
        });
        res.end(JSON.stringify({error: auth.failure.message}));
        return;
      }

      if (req.method !== 'POST') {
        res.writeHead(405, {allow: 'POST', 'content-type': 'application/json'});
        res.end(JSON.stringify({error: 'Method not allowed'}));
        return;
      }

      await nodeHandler(req as never, res as never);
    })().catch((error) => {
      if (!res.headersSent) {
        res.writeHead(500, {'content-type': 'application/json'});
        res.end(JSON.stringify({error: error instanceof Error ? error.message : String(error)}));
      }
    });
  });
};

/** HTTP denial helper for unreleased lessons — same body as MCP. */
export const sendLockedLessonDenial = (res: ServerResponse): void => {
  const denial = lockedLessonHttpDenial();
  res.writeHead(denial.status, {'content-type': 'application/json; charset=utf-8'});
  res.end(JSON.stringify(denial.body));
};
