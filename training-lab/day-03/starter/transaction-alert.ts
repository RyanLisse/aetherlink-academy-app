/**
 * TypeScript starter — same pipeline as transaction-alert.mjs / .go
 * input → AI stub → business logic → alert draft (human gate)
 */
export type Transaction = {
  id: string;
  amountEur: number;
  region: string;
  merchant?: string;
  channel?: string;
  occurredAt?: string;
  seededDeviation?: boolean;
};

export type AiAnalysis = {
  score: number;
  summary: string;
  model: "fictional-ai-stub-v0";
};

export type AlertDraft = {
  transactionId: string;
  alert: boolean;
  severity: "high" | "medium" | "low";
  reason: string;
  ai: AiAnalysis;
  draft_only: true;
  human_approval_required: true;
  pipeline: "input → AI → business logic → alert draft";
  framing: "Fictional Reconciliation";
};

const REVIEW_THRESHOLD_EUR = 9000;

export const analyzeWithAi = (transaction: Transaction): AiAnalysis => {
  const amount = Number(transaction.amountEur ?? 0);
  const channelBoost = transaction.channel === "ecom" ? 0.15 : 0;
  const seededBoost = transaction.seededDeviation ? 0.4 : 0;
  const amountScore = Math.min(1, amount / (REVIEW_THRESHOLD_EUR * 1.5));
  const score = Math.min(1, Number((amountScore * 0.6 + channelBoost + seededBoost).toFixed(3)));
  return {
    score,
    summary:
      score >= 0.7
        ? "AI stub flags elevated anomaly vs fictional cohort"
        : "AI stub sees amount within fictional cohort",
    model: "fictional-ai-stub-v0",
  };
};

export const applyBusinessRules = (transaction: Transaction, ai: AiAnalysis) => {
  const amount = Number(transaction.amountEur ?? 0);
  const amountExceeded = amount >= REVIEW_THRESHOLD_EUR;
  const aiElevated = ai.score >= 0.7;
  const alert = amountExceeded || aiElevated;
  const severity: AlertDraft["severity"] = amountExceeded ? "high" : aiElevated ? "medium" : "low";
  const reason = amountExceeded
    ? "amount exceeds the fictional review threshold"
    : aiElevated
      ? "AI score elevated above fictional cohort"
      : "within the fictional review threshold";
  return { alert, severity, reason };
};

export const alertForTransaction = (transaction: Transaction): AlertDraft => {
  const ai = analyzeWithAi(transaction);
  const rules = applyBusinessRules(transaction, ai);
  return {
    transactionId: transaction.id,
    alert: rules.alert,
    severity: rules.severity,
    reason: rules.reason,
    ai,
    draft_only: true,
    human_approval_required: true,
    pipeline: "input → AI → business logic → alert draft",
    framing: "Fictional Reconciliation",
  };
};

export const runAgainstMock = async (
  baseUrl = process.env.MOCK_API_URL ?? "http://127.0.0.1:48139",
  targetId = "TX-FIC-302",
): Promise<AlertDraft> => {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/transactions`);
  if (!response.ok) throw new Error(`mock API ${response.status}`);
  const body = (await response.json()) as { transactions: Transaction[] };
  const row = body.transactions.find((item) => item.id === targetId);
  if (!row) throw new Error(`seeded transaction ${targetId} missing from mock`);
  return alertForTransaction(row);
};

const isDirectRun = typeof process !== "undefined" && process.argv[1]?.endsWith("transaction-alert.ts");
if (isDirectRun) {
  runAgainstMock()
    .then((draft) => {
      console.log(JSON.stringify(draft, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
