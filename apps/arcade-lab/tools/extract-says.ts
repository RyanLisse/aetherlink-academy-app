/**
 * extract-says.ts — pull every caption (`say` op) out of the built-in lessons in index.html.
 *
 *   npx tsx tools/extract-says.ts > voice/says.json
 *
 * Runs the page headlessly (Playwright) so the lesson DSL produces the same ops the player sees.
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type LessonSays = { id: string; title: string; says: string[] };

const page = readFileSync(resolve("index.html"), "utf8");
const wrapped = `<!doctype html><html><head><meta charset="utf-8"></head><body>${page}</body></html>`;
const tmp = resolve(".aetherlab-extract.html");
writeFileSync(tmp, wrapped);

const browser = await chromium.launch();
const tab = await browser.newPage();
await tab.goto(`file://${tmp}`);
const says = await tab.evaluate((): LessonSays[] =>
  (globalThis as any).lessons
    .filter((l: any) => l.builtin)
    .map((l: any) => ({ id: l.id, title: l.title, says: l.ops.filter((o: any) => o.say !== undefined).map((o: any) => o.say) }))
);
await browser.close();
process.stdout.write(JSON.stringify(says, null, 1));
