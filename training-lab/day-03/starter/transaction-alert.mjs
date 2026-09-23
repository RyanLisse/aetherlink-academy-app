/**
 * Reference CLI for the day-03 transaction-alert service (AET-38).
 * Pipeline: input → AI score → business logic → alert draft (human gate).
 * Fictional Reconciliation only — no live PSP writes.
 */
import { fileURLToPath } from "node:url";
import path from "node:path";

const REVIEW_THRESHOLD_EUR = 9000;
const DEFAULT_MOCK = process.env.MOCK_API_URL || "http://127.0.0.1:48139";

export const analyzeWithAi = (transaction) => {
  const amount = Number(transaction.amountEur ?? 0);
  const channelBoost = transaction.channel === "ecom" ? 0.15 : 0;
  const seededBoost = transaction.seededDeviation ? 0.4 : 0;
  const amountScore = Math.min(1, amount / (REVIEW_THRESHOLD_EUR * 1.5));
  const score = Math.min(1, Number((amountScore * 0.6 + channelBoost + seededBoost).toFixed(3)));
  const summary =
    score >= 0.7
      ? "AI stub flags elevated anomaly vs fictional cohort"
      : "AI stub sees amount within fictional cohort";
  return { score, summary, model: "fictional-ai-stub-v0" };
};

export const applyBusinessRules = (transaction, ai) => {
  const amount = Number(transaction.amountEur ?? 0);
  const amountExceeded = amount >= REVIEW_THRESHOLD_EUR;
  const aiElevated = ai.score >= 0.7;
  const alert = amountExceeded || aiElevated;
  const severity = amountExceeded ? "high" : aiElevated ? "medium" : "low";
  const reason = amountExceeded
    ? "amount exceeds the fictional review threshold"
    : aiElevated
      ? "AI score elevated above fictional cohort"
      : "within the fictional review threshold";
  return { alert, severity, reason, amountExceeded, aiElevated };
};

export const buildAlertDraft = (transaction, ai, rules) => ({
  transactionId: transaction.id,
  alert: rules.alert,
  severity: rules.severity,
  reason: rules.reason,
  ai,
  draft_only: true,
  human_approval_required: true,
  pipeline: "input → AI → business logic → alert draft",
  framing: "Fictional Reconciliation",
});

export const alertForTransaction = (transaction) => {
  const ai = analyzeWithAi(transaction);
  const rules = applyBusinessRules(transaction, ai);
  return buildAlertDraft(transaction, ai, rules);
};

export const fetchTransactions = async (baseUrl = DEFAULT_MOCK) => {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/transactions`);
  if (!response.ok) throw new Error(`mock API ${response.status}`);
  const body = await response.json();
  return body.transactions ?? [];
};

export const runAgainstMock = async (baseUrl = DEFAULT_MOCK, targetId = "TX-FIC-302") => {
  const rows = await fetchTransactions(baseUrl);
  const row = rows.find((item) => item.id === targetId);
  if (!row) throw new Error(`seeded transaction ${targetId} missing from mock`);
  return alertForTransaction(row);
};

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const mode = process.argv[2] || "draft";
  if (mode === "serve") {
    const { createServer } = await import("node:http");
    const port = Number(process.env.PORT || 8080);
    const mock = process.env.MOCK_API_URL || DEFAULT_MOCK;
    const server = createServer(async (request, response) => {
      const url = new URL(request.url ?? "/", `http://127.0.0.1`);
      response.setHeader("content-type", "application/json; charset=utf-8");
      try {
        if (url.pathname === "/health") {
          response.end(JSON.stringify({ ok: true, service: "transaction-alert", draft_only: true }));
          return;
        }
        if (url.pathname === "/alert" || url.pathname === "/") {
          const id = url.searchParams.get("id") || "TX-FIC-302";
          const draft = await runAgainstMock(mock, id);
          response.end(JSON.stringify(draft, null, 2));
          return;
        }
        response.statusCode = 404;
        response.end(JSON.stringify({ error: "Not found", paths: ["/health", "/alert?id=TX-FIC-302"] }));
      } catch (error) {
        response.statusCode = 502;
        response.end(JSON.stringify({ error: String(error?.message ?? error) }));
      }
    });
    server.listen(port, "0.0.0.0", () => {
      console.log(JSON.stringify({ service: "transaction-alert", port, mockApi: mock }));
    });
  } else {
    const draft = await runAgainstMock();
    console.log(JSON.stringify(draft, null, 2));
  }
}
