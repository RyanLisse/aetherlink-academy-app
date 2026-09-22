import type { Lesson } from '../schema';
import { LessonSchema } from '../schema';

/** Built-in lesson `ws-2-eve-state` — preserved exact id (lesson-id contract). */
export const lesson: Lesson = LessonSchema.parse({
  "id": "ws-2-eve-state",
  "title": "2 \u00b7 Eve \u00b7 How it runs: session, turn, step \u2014 and state",
  "kind": "trace",
  "files": [
    {
      "name": "agent/lib/glossary.ts",
      "text": ""
    },
    {
      "name": "agent/tools/define_metric.ts",
      "text": ""
    },
    {
      "name": "agent/tools/recall_metrics.ts",
      "text": ""
    }
  ],
  "ops": [
    {
      "t": 600,
      "chapter": "How it runs"
    },
    {
      "t": 600,
      "say": "For this lesson we borrow the official Eve tutorial's **analytics assistant** \u2014 it has a run_sql tool over a tiny sample dataset. Same primitives, different domain."
    },
    {
      "t": 9480,
      "say": "Three terms describe what happened when you sent one message and got one answer."
    },
    {
      "t": 14580,
      "out": "session   your whole conversation (durable, can span days)",
      "cls": "dim"
    },
    {
      "t": 15480,
      "out": "turn      one message you send and the work it triggers",
      "cls": "dim"
    },
    {
      "t": 16380,
      "out": "step      a durable checkpoint within the turn",
      "cls": "dim"
    },
    {
      "t": 17580,
      "say": "Eve saves each turn's progress at every step. Completed steps never re-run; a step interrupted mid-execution re-runs. A turn waiting on you resumes whenever you answer \u2014 even much later."
    },
    {
      "t": 26580,
      "stop": {
        "title": "Predict",
        "q": "A tool sends an email and the process crashes right after. On replay, does the email go out twice? What does that imply for how you write side-effecting tools?",
        "explain": "A step interrupted mid-execution re-runs, so yes \u2014 unless you make the side effect idempotent or gate it with approval. Completed steps are replayed from the recorded result, not re-executed."
      }
    },
    {
      "t": 26780,
      "say": "You author capabilities \u2014 tools, instructions, channels, skills. Eve drives the model-to-tool loop and decides when a turn continues, waits, or ends. **You never write that loop yourself.**"
    },
    {
      "t": 35780,
      "chapter": "State"
    },
    {
      "t": 35780,
      "say": "Re-explaining house definitions every turn is a waste. defineState(name, initial) creates a typed slot that survives step and turn boundaries within a session."
    },
    {
      "t": 44435,
      "f": 0,
      "p": 0,
      "d": 0,
      "i": "import { defineState } from \"eve/context\";\n"
    },
    {
      "t": 45521,
      "f": 0,
      "p": 43,
      "d": 0,
      "i": "export interface Glossary {\n"
    },
    {
      "t": 46277,
      "f": 0,
      "p": 71,
      "d": 0,
      "i": "  readonly terms: Readonly<Record<string, string>>;\n"
    },
    {
      "t": 47561,
      "f": 0,
      "p": 123,
      "d": 0,
      "i": "}\n"
    },
    {
      "t": 47745,
      "f": 0,
      "p": 125,
      "d": 0,
      "i": "export const glossary = defineState<Glossary>(\"analytics.glossary\", () => ({\n"
    },
    {
      "t": 49579,
      "f": 0,
      "p": 202,
      "d": 0,
      "i": "  terms: {},\n"
    },
    {
      "t": 50005,
      "f": 0,
      "p": 215,
      "d": 0,
      "i": "}));\n"
    },
    {
      "t": 50255,
      "say": "Two tools: one writes the glossary with update(), one reads it with get()."
    },
    {
      "t": 55085,
      "tab": 1
    },
    {
      "t": 55585,
      "f": 1,
      "p": 0,
      "d": 0,
      "i": "import { defineTool } from \"eve/tools\";\n"
    },
    {
      "t": 56605,
      "f": 1,
      "p": 40,
      "d": 0,
      "i": "import { z } from \"zod\";\n"
    },
    {
      "t": 57295,
      "f": 1,
      "p": 65,
      "d": 0,
      "i": "import { glossary } from \"../lib/glossary\";\n"
    },
    {
      "t": 58403,
      "f": 1,
      "p": 109,
      "d": 0,
      "i": "export default defineTool({\n"
    },
    {
      "t": 59159,
      "f": 1,
      "p": 137,
      "d": 0,
      "i": "  description: \"Record the team's definition of a metric so it persists across turns.\",\n"
    },
    {
      "t": 61235,
      "f": 1,
      "p": 225,
      "d": 0,
      "i": "  inputSchema: z.object({ term: z.string(), meaning: z.string() }),\n"
    },
    {
      "t": 62871,
      "f": 1,
      "p": 293,
      "d": 0,
      "i": "  async execute({ term, meaning }) {\n"
    },
    {
      "t": 63825,
      "f": 1,
      "p": 330,
      "d": 0,
      "i": "    glossary.update((g) => ({ terms: { ...g.terms, [term]: meaning } }));\n"
    },
    {
      "t": 65593,
      "f": 1,
      "p": 404,
      "d": 0,
      "i": "    return glossary.get();\n"
    },
    {
      "t": 66327,
      "f": 1,
      "p": 431,
      "d": 0,
      "i": "  },\n"
    },
    {
      "t": 66577,
      "f": 1,
      "p": 436,
      "d": 0,
      "i": "});\n"
    },
    {
      "t": 66805,
      "tab": 2
    },
    {
      "t": 67305,
      "f": 2,
      "p": 0,
      "d": 0,
      "i": "import { defineTool } from \"eve/tools\";\n"
    },
    {
      "t": 68325,
      "f": 2,
      "p": 40,
      "d": 0,
      "i": "import { z } from \"zod\";\n"
    },
    {
      "t": 69015,
      "f": 2,
      "p": 65,
      "d": 0,
      "i": "import { glossary } from \"../lib/glossary\";\n"
    },
    {
      "t": 70123,
      "f": 2,
      "p": 109,
      "d": 0,
      "i": "export default defineTool({\n"
    },
    {
      "t": 70879,
      "f": 2,
      "p": 137,
      "d": 0,
      "i": "  description: \"Read the team's recorded metric definitions.\",\n"
    },
    {
      "t": 72405,
      "f": 2,
      "p": 200,
      "d": 0,
      "i": "  inputSchema: z.object({}),\n"
    },
    {
      "t": 73183,
      "f": 2,
      "p": 229,
      "d": 0,
      "i": "  async execute() {\n"
    },
    {
      "t": 73763,
      "f": 2,
      "p": 249,
      "d": 0,
      "i": "    return glossary.get();\n"
    },
    {
      "t": 74497,
      "f": 2,
      "p": 276,
      "d": 0,
      "i": "  },\n"
    },
    {
      "t": 74747,
      "f": 2,
      "p": 281,
      "d": 0,
      "i": "});\n"
    },
    {
      "t": 74975,
      "chapter": "See it persist"
    },
    {
      "t": 74975,
      "say": "Two separate turns in the same session. Watch the definition survive."
    },
    {
      "t": 79580,
      "out": "npm run dev",
      "cls": "cmd"
    },
    {
      "t": 80280,
      "out": "dev server ready",
      "cls": "dim"
    },
    {
      "t": 81080,
      "out": "For this dataset, a high-value customer has at least $50 in total orders. Remember that.",
      "cls": "you"
    },
    {
      "t": 82580,
      "out": "tool call   define_metric   {\"term\":\"high-value customer\",\"meaning\":\"at least $50 in total orders\"}",
      "cls": "tool"
    },
    {
      "t": 83580,
      "out": "tool result {\"terms\":{\"high-value customer\":\"at least $50 in total orders\"}}",
      "cls": "res"
    },
    {
      "t": 84780,
      "out": "Noted: a high-value customer has at least $50 in total orders.",
      "cls": "ans"
    },
    {
      "t": 85980,
      "out": "How many high-value customers do we have?",
      "cls": "you"
    },
    {
      "t": 87380,
      "out": "tool call   recall_metrics   {}",
      "cls": "tool"
    },
    {
      "t": 88280,
      "out": "tool result {\"terms\":{\"high-value customer\":\"at least $50 in total orders\"}}",
      "cls": "res"
    },
    {
      "t": 89280,
      "out": "tool call   run_sql   {\"sql\":\"SELECT customer_id, SUM(amount_cents)/100.0 AS total FROM orders GROUP BY customer_id HAVING total >= 50\"}",
      "cls": "tool"
    },
    {
      "t": 90380,
      "out": "tool result {\"columns\":[\"customer_id\",\"total\"],\"rows\":[[10,57],[11,99]],\"truncated\":false}",
      "cls": "res"
    },
    {
      "t": 91580,
      "out": "Two high-value customers: Acme ($57) and Globex ($99), using your definition of at least $50 in total orders.",
      "cls": "ans"
    },
    {
      "t": 92980,
      "say": "The second turn recalled the definition, wrote matching SQL, and answered. State checkpoints at step boundaries \u2014 the same durability, now applied to your own data."
    },
    {
      "t": 101860,
      "stop": {
        "title": "Knowledge check",
        "q": "A subagent spawned by this agent asks for the glossary. What does it see?",
        "options": [
          "The parent's glossary \u2014 state is shared",
          "Fresh, empty state \u2014 state is isolated per agent"
        ],
        "correct": 1,
        "explain": "State is scoped to a session and isolated per agent. A subagent starts with fresh state and never sees the parent's. Pass what it needs explicitly."
      }
    }
  ],
  "duration": 103560,
  "audio": null,
  "builtin": true
});
export default lesson;
