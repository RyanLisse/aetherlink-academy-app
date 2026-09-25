import type { Lesson } from '../schema';
import { LessonSchema } from '../schema';

/** Built-in lesson `ws-3-eve-approval` — preserved exact id (lesson-id contract). */
export const lesson: Lesson = LessonSchema.parse({
  "id": "ws-3-eve-approval",
  "title": "3 \u00b7 Eve \u00b7 Guard the spend: human-in-the-loop approval",
  "kind": "trace",
  "files": [
    {
      "name": "agent/lib/cost.ts",
      "text": ""
    },
    {
      "name": "agent/tools/run_sql.ts",
      "text": "import { defineTool } from \"eve/tools\";\nimport { z } from \"zod\";\nimport { runReadOnlySql } from \"../lib/sample-db\";\nexport default defineTool({\n  description: \"Run a read-only SQL query against the analytics tables.\",\n  inputSchema: z.object({ sql: z.string().max(10_000) }),\n  async execute({ sql }) {\n    const { columns, rows } = await runReadOnlySql(sql);\n    return { columns, rows: rows.slice(0, 500), truncated: rows.length > 500 };\n  },\n});\n"
    }
  ],
  "ops": [
    {
      "t": 600,
      "chapter": "The gate"
    },
    {
      "t": 600,
      "say": "In lesson 1 the weather tool used approval: never() \u2014 fixed data, no risk. Now the opposite case: make the agent **stop and ask** before an expensive query."
    },
    {
      "t": 9120,
      "say": "approval runs before execute. Return \"user-approval\" and the turn parks on an approval request; you answer, and the run picks up from that exact step."
    },
    {
      "t": 17370,
      "chapter": "Estimate, then gate"
    },
    {
      "t": 17370,
      "say": "A cheap, illustrative estimator: unfiltered scans are the expensive ones. A real warehouse exposes a dry-run estimate."
    },
    {
      "t": 24180,
      "f": 0,
      "p": 0,
      "d": 0,
      "i": "// Illustrative: a real warehouse exposes a dry-run byte estimate.\n"
    },
    {
      "t": 25794,
      "f": 0,
      "p": 67,
      "d": 0,
      "i": "export function estimateScanGb(sql: string): number {\n"
    },
    {
      "t": 27122,
      "f": 0,
      "p": 121,
      "d": 0,
      "i": "  return /\\bwhere\\b/i.test(sql) ? 1 : 200; // unfiltered scans are the expensive ones\n"
    },
    {
      "t": 29154,
      "f": 0,
      "p": 207,
      "d": 0,
      "i": "}\n"
    },
    {
      "t": 29338,
      "say": "Now gate run_sql on it. One field on the tool \u2014 the function receives the tool input, so the decision can be cost-based."
    },
    {
      "t": 36238,
      "tab": 1
    },
    {
      "t": 36738,
      "c": 65
    },
    {
      "t": 37138,
      "f": 1,
      "p": 65,
      "d": 51,
      "i": ""
    },
    {
      "t": 37488,
      "f": 1,
      "p": 65,
      "d": 0,
      "i": "import { runReadOnlySql } from \"../lib/sample-db\";\n"
    },
    {
      "t": 38750,
      "f": 1,
      "p": 116,
      "d": 0,
      "i": "import { estimateScanGb } from \"../lib/cost\";\n"
    },
    {
      "t": 39902,
      "f": 1,
      "p": 162,
      "d": 0,
      "i": "const THRESHOLD_GB = 50;\n"
    },
    {
      "t": 40592,
      "c": 289
    },
    {
      "t": 40992,
      "f": 1,
      "p": 289,
      "d": 58,
      "i": ""
    },
    {
      "t": 41342,
      "f": 1,
      "p": 289,
      "d": 0,
      "i": "  inputSchema: z.object({ sql: z.string().max(10_000) }),\n"
    },
    {
      "t": 42758,
      "f": 1,
      "p": 347,
      "d": 0,
      "i": "  // Cost-based gate: only the expensive queries need a human yes.\n"
    },
    {
      "t": 44372,
      "f": 1,
      "p": 414,
      "d": 0,
      "i": "  approval: ({ toolInput }) =>\n"
    },
    {
      "t": 45194,
      "f": 1,
      "p": 445,
      "d": 0,
      "i": "    estimateScanGb(toolInput?.sql ?? \"\") > THRESHOLD_GB ? \"user-approval\" : \"not-applicable\",\n"
    },
    {
      "t": 47402,
      "say": "Cheap queries run straight through. A query estimated above the threshold trips the gate."
    },
    {
      "t": 52907,
      "stop": {
        "title": "Predict",
        "q": "You ask: \"Total revenue across all customers, all time, broken out by day.\" Does this trip the gate? Why?",
        "explain": "Yes. The natural SQL has no WHERE clause, so estimateScanGb returns 200 GB > 50. The turn parks on an approval request before execute runs."
      }
    },
    {
      "t": 53107,
      "chapter": "Pause, ask, resume"
    },
    {
      "t": 53107,
      "out": "npm run dev",
      "cls": "cmd"
    },
    {
      "t": 53807,
      "out": "dev server ready",
      "cls": "dim"
    },
    {
      "t": 54607,
      "out": "Total revenue across all customers, all time, broken out by day.",
      "cls": "you"
    },
    {
      "t": 56007,
      "out": "tool call   run_sql   {\"sql\":\"SELECT created_at, SUM(amount_cents)/100.0 AS revenue FROM orders GROUP BY created_at\"}",
      "cls": "tool"
    },
    {
      "t": 57007,
      "out": "approval \u2192 \"user-approval\"   (estimated scan 200 GB > 50 GB)",
      "cls": "dim"
    },
    {
      "t": 57907,
      "out": "event  input.requested",
      "cls": "dim"
    },
    {
      "t": 58407,
      "out": "event  session.waiting   \u2014 turn parked, waiting for you",
      "cls": "err"
    },
    {
      "t": 59907,
      "say": "The stream emits input.requested, then session.waiting. How the prompt looks depends on the channel: buttons in the TUI, Block Kit in Slack, a control on the web. Approve it."
    },
    {
      "t": 68907,
      "out": "[you] approve",
      "cls": "you"
    },
    {
      "t": 69907,
      "out": "turn resumed from the parked step",
      "cls": "ok"
    },
    {
      "t": 70707,
      "out": "tool result {\"columns\":[\"created_at\",\"revenue\"],\"rows\":[[\"2026-05-01\",42],[\"2026-05-03\",15],[\"2026-05-04\",99],[\"2026-05-06\",8]],\"truncated\":false}",
      "cls": "res"
    },
    {
      "t": 72007,
      "out": "Daily revenue: May 1 $42, May 3 $15, May 4 $99, May 6 $8 \u2014 $164 in total.",
      "cls": "ans"
    },
    {
      "t": 73307,
      "say": "Deny it instead and the tool is skipped, with the model told why. Each session has exactly one active continuation \u2014 a stale handle is rejected, so a parked turn can't be resumed twice."
    },
    {
      "t": 82307,
      "stop": {
        "title": "Knowledge check",
        "q": "Where does the yes/no decision live?",
        "options": [
          "In the prompt \u2014 the model decides when to ask",
          "In your code \u2014 approval() runs before execute, outside the model"
        ],
        "correct": 1,
        "explain": "The gate is host code, not a prompt rule. That is the difference between an instruction and a code-enforced constraint \u2014 the same lesson as the council word limit."
      }
    },
    {
      "t": 82507,
      "say": "The same machinery backs the built-in ask_question tool and per-connection approval via approval: once(). Next: the council \u2014 many agents, one judge."
    }
  ],
  "duration": 92212,
  "audio": null,
  "builtin": true
});
export default lesson;
