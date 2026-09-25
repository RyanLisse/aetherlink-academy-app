/**
 * Reference-style analyzer for the fictional day-04 fraud challenge.
 * Output shape per transaction: Risk / Reason / Recommended action.
 * Training fiction only — drafts for human review; no live PSP writes.
 */

const HIGH_AMOUNT_EUR = 4000;

/**
 * @param {Record<string, string>} transaction CSV row fields
 * @returns {{ risk: "high" | "low", reason: string, recommendedAction: string }}
 */
export function analyzeTransaction(transaction) {
  const amount = Number(transaction.amount_eur);
  const histAvg = Number(transaction.history_avg_eur);
  const histCount = Number(transaction.history_24h_count);
  const newDevice = transaction.device === "new-device";
  const hour = Number(String(transaction.time || "").slice(11, 13));
  const night = Number.isFinite(hour) && (hour < 6 || hour >= 22);

  const signals = [];
  if (newDevice && amount >= HIGH_AMOUNT_EUR) {
    signals.push("new device with high amount");
  }
  if (night && amount >= HIGH_AMOUNT_EUR && newDevice) {
    signals.push("night-time high amount on new device");
  }
  if (
    transaction.payment_method === "bank-transfer" &&
    transaction.merchant_category === "gaming" &&
    newDevice
  ) {
    signals.push("gaming bank-transfer on new device");
  }
  if (histCount <= 1 && histAvg > 0 && amount >= HIGH_AMOUNT_EUR && amount > histAvg * 50) {
    signals.push("amount far above personal history");
  }

  const suspicious = signals.length > 0;
  return {
    risk: suspicious ? "high" : "low",
    reason: suspicious ? signals.join("; ") : "known pattern or within history",
    recommendedAction: suspicious ? "human review" : "allow",
  };
}

/** Format required learner output line: Risk / Reason / Recommended action */
export function formatResult(transaction, analysis = analyzeTransaction(transaction)) {
  return `${transaction.id}: ${analysis.risk} / ${analysis.reason} / ${analysis.recommendedAction}`;
}
