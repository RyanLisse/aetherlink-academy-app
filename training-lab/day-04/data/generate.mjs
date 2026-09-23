#!/usr/bin/env node
/**
 * Deterministic fictional fraud dataset generator.
 * Fixed SEED — regenerating must yield an identical transactions.csv (hash pinned in tests/expected.json).
 * All names/IDs are synthetic training fiction (Fictional Reconciliation). No live PSP data.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

/** Fixed seed — do not change without updating tests/expected.json */
export const SEED = 20260921;

const HEADER = [
  "id",
  "time",
  "region",
  "merchant_name",
  "merchant_category",
  "payment_method",
  "device",
  "history_24h_count",
  "history_avg_eur",
  "amount_eur",
  "expected_risk",
].join(",");

const REGIONS = ["NL-TRAIN", "BE-TRAIN", "LU-TRAIN", "DE-TRAIN"];
const CATEGORIES = ["groceries", "books", "travel", "coffee", "electronics", "gaming", "fuel"];
const METHODS = ["card", "wallet", "card", "wallet"];
const MERCHANTS = [
  "Ari Example Mart",
  "Bo Example Books",
  "Cy Example Café",
  "Di Example Fuel",
  "Ed Example Travel",
  "Fa Example Grocer",
  "Gi Example Transit",
];

/** Mulberry32 — deterministic PRNG from a 32-bit seed */
function mulberry32(a) {
  return function next() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Build the full row set: benign cohort + seeded suspicious cases.
 * Suspicious IDs are fixed so expected.json stays stable.
 */
export function buildRows(seed = SEED) {
  const rng = mulberry32(seed >>> 0);
  const rows = [];

  // 20 benign / low-risk fictional rows
  for (let i = 0; i < 20; i += 1) {
    const n = 401 + i;
    const hour = 8 + Math.floor(rng() * 10); // daytime
    const minute = Math.floor(rng() * 60);
    const amount = round2(8 + rng() * 180);
    const histCount = 1 + Math.floor(rng() * 4);
    const histAvg = round2(amount * (0.7 + rng() * 0.6));
    rows.push([
      `TX-FIC-${n}`,
      `2026-09-21T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`,
      pick(rng, REGIONS),
      pick(rng, MERCHANTS),
      pick(rng, CATEGORIES.slice(0, 4)),
      pick(rng, METHODS),
      "known",
      String(histCount),
      String(histAvg),
      String(amount),
      "low",
    ]);
  }

  // One decoy: high amount but known device + normal history (should stay low if rules are tight)
  rows.push([
    "TX-FIC-421",
    "2026-09-21T14:22:00Z",
    "NL-TRAIN",
    "Ari Example Mart",
    "electronics",
    "card",
    "known",
    "3",
    "2100",
    "4500",
    "low",
  ]);

  // Seeded suspicious cases (fixed IDs — listed in tests/expected.json)
  const suspicious = [
    [
      "TX-FIC-430",
      "2026-09-21T09:12:00Z",
      "NL-TRAIN",
      "Bo Example Gadgets",
      "electronics",
      "card",
      "new-device",
      "1",
      "40",
      "4200",
      "suspicious",
    ],
    [
      "TX-FIC-431",
      "2026-09-21T23:58:00Z",
      "PT-TRAIN",
      "Cy Example Tech",
      "electronics",
      "card",
      "new-device",
      "0",
      "0",
      "7800",
      "suspicious",
    ],
    [
      "TX-FIC-432",
      "2026-09-21T03:03:00Z",
      "BE-TRAIN",
      "Di Example Games",
      "gaming",
      "bank-transfer",
      "new-device",
      "0",
      "12",
      "6100",
      "suspicious",
    ],
    [
      "TX-FIC-433",
      "2026-09-21T02:17:00Z",
      "DE-TRAIN",
      "Ed Example Digital",
      "electronics",
      "wallet",
      "new-device",
      "8",
      "55",
      "9200",
      "suspicious",
    ],
    [
      "TX-FIC-434",
      "2026-09-21T22:41:00Z",
      "LU-TRAIN",
      "Fa Example Arcade",
      "gaming",
      "card",
      "new-device",
      "1",
      "30",
      "5100",
      "suspicious",
    ],
  ];

  for (const row of suspicious) rows.push(row);

  // Stable order by id for identical CSV bytes
  rows.sort((a, b) => a[0].localeCompare(b[0]));
  return rows;
}

export function toCsv(rows = buildRows()) {
  return `${HEADER}\n${rows.map((row) => row.join(",")).join("\n")}\n`;
}

const target = path.join(path.dirname(fileURLToPath(import.meta.url)), "transactions.csv");
writeFileSync(target, toCsv());
console.log(`SEED=${SEED}`);
console.log(target);
