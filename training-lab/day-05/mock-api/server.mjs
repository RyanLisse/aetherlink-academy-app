#!/usr/bin/env node
/**
 * Day-05 fictional transactions mock API (AET-40).
 * No live PSP. Fixtures live in ../data/transactions.json.
 */
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(root, "../data/transactions.json");
const PORT = Number(process.env.PORT || process.env.DAY05_MOCK_PORT || 48140);
const HOST = process.env.HOST || "127.0.0.1";

const loadTransactions = () => JSON.parse(readFileSync(dataPath, "utf8"));

const send = (response, status, body) => {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
  });
  response.end(payload);
};

export const createMockApi = ({ port = 0, host = HOST } = {}) => {
  const server = createServer((request, response) => {
    try {
      const url = new URL(request.url ?? "/", `http://${host}`);
      if (request.method === "GET" && url.pathname === "/health") {
        return send(response, 200, {
          ok: true,
          service: "day-05-application-mock",
          fictional: true,
        });
      }
      if (request.method === "GET" && url.pathname === "/transactions") {
        const rows = loadTransactions();
        const highOnly = url.searchParams.get("highRisk") === "true";
        const filtered = highOnly ? rows.filter((row) => row.seededHighRisk) : rows;
        return send(response, 200, {
          source: "fictional-reconciliation",
          count: filtered.length,
          transactions: filtered,
        });
      }
      const match = url.pathname.match(/^\/transactions\/([^/]+)$/);
      if (request.method === "GET" && match) {
        const row = loadTransactions().find((item) => item.id === match[1]);
        if (!row) {
          return send(response, 404, {
            error: "Transaction not found in fictional fixture",
            id: match[1],
          });
        }
        return send(response, 200, row);
      }
      return send(response, 404, {
        error: "Not found",
        paths: ["/health", "/transactions", "/transactions/:id"],
      });
    } catch {
      return send(response, 400, { error: "Invalid request URL" });
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      const address = server.address();
      const boundPort = typeof address === "object" && address ? address.port : port;
      resolve({
        server,
        port: boundPort,
        host,
        baseUrl: `http://${host}:${boundPort}`,
      });
    });
  });
};

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const started = await createMockApi({ port: PORT, host: HOST });
  console.log(
    JSON.stringify({
      service: "day-05-application-mock",
      baseUrl: started.baseUrl,
      port: started.port,
    }),
  );
  const close = () => started.server.close(() => process.exit(0));
  process.once("SIGINT", close);
  process.once("SIGTERM", close);
}
