/** Verbatim source block from aetherlab monolith (id=src-eve-cost). */
export default "// Illustrative: a real warehouse exposes a dry-run byte estimate.\nexport function estimateScanGb(sql: string): number {\n  return /\\bwhere\\b/i.test(sql) ? 1 : 200; // unfiltered scans are the expensive ones\n}\n" as string;
