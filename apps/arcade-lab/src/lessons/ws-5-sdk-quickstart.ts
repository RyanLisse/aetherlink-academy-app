import type { Lesson } from '../schema';
import { LessonSchema } from '../schema';

/** Built-in lesson `ws-5-sdk-quickstart` — preserved exact id (lesson-id contract). */
export const lesson: Lesson = LessonSchema.parse({
  "id": "ws-5-sdk-quickstart",
  "title": "5 \u00b7 SDK \u00b7 Quickstart: an agent that finds and fixes bugs",
  "kind": "trace",
  "files": [
    {
      "name": "utils.ts",
      "text": ""
    },
    {
      "name": "agent.ts",
      "text": ""
    }
  ],
  "ops": [
    {
      "t": 600,
      "chapter": "Setup"
    },
    {
      "t": 600,
      "say": "New runtime, same idea. The Claude Agent SDK bundles the Claude Code binary; you write the prompt, the options, and consume the message stream."
    },
    {
      "t": 8535,
      "out": "mkdir my-agent && cd my-agent",
      "cls": "cmd"
    },
    {
      "t": 9235,
      "out": "npm init -y",
      "cls": "cmd"
    },
    {
      "t": 9935,
      "out": "Wrote to package.json",
      "cls": "dim"
    },
    {
      "t": 10335,
      "out": "npm pkg set type=module",
      "cls": "cmd"
    },
    {
      "t": 11035,
      "out": "npm install @anthropic-ai/claude-agent-sdk",
      "cls": "cmd"
    },
    {
      "t": 11735,
      "out": "added packages",
      "cls": "dim"
    },
    {
      "t": 12335,
      "out": "npm install --save-dev tsx",
      "cls": "cmd"
    },
    {
      "t": 13035,
      "say": "The SDK reads ANTHROPIC_API_KEY from the environment of the process that runs your agent. It does not load .env files."
    },
    {
      "t": 19845,
      "chapter": "A buggy file"
    },
    {
      "t": 19845,
      "say": "First, something for the agent to fix \u2014 the quickstart's utils.py, ported to TypeScript. Two bugs: calculateAverage([]) returns NaN (0/0); getUserName(null) throws a TypeError."
    },
    {
      "t": 28845,
      "f": 0,
      "p": 0,
      "d": 0,
      "i": "export function calculateAverage(numbers: number[]): number {\n"
    },
    {
      "t": 30349,
      "f": 0,
      "p": 62,
      "d": 0,
      "i": "  let total = 0;\n"
    },
    {
      "t": 30863,
      "f": 0,
      "p": 79,
      "d": 0,
      "i": "  for (const num of numbers) {\n"
    },
    {
      "t": 31685,
      "f": 0,
      "p": 110,
      "d": 0,
      "i": "    total += num;\n"
    },
    {
      "t": 32221,
      "f": 0,
      "p": 128,
      "d": 0,
      "i": "  }\n"
    },
    {
      "t": 32449,
      "f": 0,
      "p": 132,
      "d": 0,
      "i": "  return total / numbers.length;\n"
    },
    {
      "t": 33315,
      "f": 0,
      "p": 165,
      "d": 0,
      "i": "}\n"
    },
    {
      "t": 33499,
      "f": 0,
      "p": 167,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 33661,
      "f": 0,
      "p": 168,
      "d": 0,
      "i": "export function getUserName(user: { name: string } | null): string {\n"
    },
    {
      "t": 35319,
      "f": 0,
      "p": 237,
      "d": 0,
      "i": "  return user!.name.toUpperCase();\n"
    },
    {
      "t": 36229,
      "f": 0,
      "p": 272,
      "d": 0,
      "i": "}\n"
    },
    {
      "t": 36413,
      "chapter": "The loop"
    },
    {
      "t": 36413,
      "say": "query() is the entry point that creates the agentic loop. It returns an async iterator, so you stream messages as Claude works."
    },
    {
      "t": 43628,
      "tab": 1
    },
    {
      "t": 44128,
      "f": 1,
      "p": 0,
      "d": 0,
      "i": "import { query } from \"@anthropic-ai/claude-agent-sdk\";\n"
    },
    {
      "t": 45500,
      "f": 1,
      "p": 56,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 45662,
      "f": 1,
      "p": 57,
      "d": 0,
      "i": "// Agentic loop: streams messages as Claude works\n"
    },
    {
      "t": 46902,
      "f": 1,
      "p": 107,
      "d": 0,
      "i": "for await (const message of query({\n"
    },
    {
      "t": 47834,
      "f": 1,
      "p": 143,
      "d": 0,
      "i": "  prompt: \"Review utils.ts for bugs that would cause crashes. Fix any issues you find.\",\n"
    },
    {
      "t": 49932,
      "f": 1,
      "p": 232,
      "d": 0,
      "i": "  options: {\n"
    },
    {
      "t": 50358,
      "f": 1,
      "p": 245,
      "d": 0,
      "i": "    allowedTools: [\"Read\", \"Edit\", \"Glob\"], // Auto-approve these tools\n"
    },
    {
      "t": 52082,
      "f": 1,
      "p": 317,
      "d": 0,
      "i": "    permissionMode: \"acceptEdits\" // Auto-approve file edits\n"
    },
    {
      "t": 53564,
      "f": 1,
      "p": 378,
      "d": 0,
      "i": "  }\n"
    },
    {
      "t": 53792,
      "f": 1,
      "p": 382,
      "d": 0,
      "i": "})) {\n"
    },
    {
      "t": 54064,
      "f": 1,
      "p": 388,
      "d": 0,
      "i": "  // Print human-readable output\n"
    },
    {
      "t": 54930,
      "f": 1,
      "p": 421,
      "d": 0,
      "i": "  if (message.type === \"assistant\" && message.message?.content) {\n"
    },
    {
      "t": 56522,
      "f": 1,
      "p": 487,
      "d": 0,
      "i": "    for (const block of message.message.content) {\n"
    },
    {
      "t": 57784,
      "f": 1,
      "p": 538,
      "d": 0,
      "i": "      if (\"text\" in block) {\n"
    },
    {
      "t": 58562,
      "f": 1,
      "p": 567,
      "d": 0,
      "i": "        console.log(block.text); // Claude's reasoning\n"
    },
    {
      "t": 59912,
      "f": 1,
      "p": 622,
      "d": 0,
      "i": "      } else if (\"name\" in block) {\n"
    },
    {
      "t": 60844,
      "f": 1,
      "p": 658,
      "d": 0,
      "i": "        console.log(`Tool: ${block.name}`); // Tool being called\n"
    },
    {
      "t": 62414,
      "f": 1,
      "p": 723,
      "d": 0,
      "i": "      }\n"
    },
    {
      "t": 62730,
      "f": 1,
      "p": 731,
      "d": 0,
      "i": "    }\n"
    },
    {
      "t": 63002,
      "f": 1,
      "p": 737,
      "d": 0,
      "i": "  } else if (message.type === \"result\") {\n"
    },
    {
      "t": 64066,
      "f": 1,
      "p": 779,
      "d": 0,
      "i": "    console.log(`Done: ${message.subtype}`); // Final result\n"
    },
    {
      "t": 65548,
      "f": 1,
      "p": 840,
      "d": 0,
      "i": "  }\n"
    },
    {
      "t": 65776,
      "f": 1,
      "p": 844,
      "d": 0,
      "i": "}\n"
    },
    {
      "t": 65960,
      "say": "Three parts: **query** (the loop), **prompt** (what to do \u2014 Claude picks the tools), **options** (allowedTools pre-approves Read, Edit, Glob; permissionMode acceptEdits auto-approves file changes)."
    },
    {
      "t": 74960,
      "stop": {
        "title": "Predict",
        "q": "Compare with Eve lesson 1. Who writes the model-to-tool loop here \u2014 you or the runtime? And where do the tools come from?",
        "explain": "The SDK runs the loop; you consume the stream. Read/Edit/Glob are built-in tools of the Claude Code runtime \u2014 in Eve you defined get_weather yourself. Lesson 6 adds a custom tool to the SDK the same way."
      }
    },
    {
      "t": 75160,
      "chapter": "Run"
    },
    {
      "t": 75160,
      "out": "npx tsx agent.ts",
      "cls": "cmd"
    },
    {
      "t": 75860,
      "out": "I'll review utils.py for potential crash bugs.",
      "cls": "ans"
    },
    {
      "t": 76760,
      "out": "Tool: Read",
      "cls": "tool"
    },
    {
      "t": 77460,
      "out": "Found two issues: calculateAverage divides by numbers.length, which is 0 for an empty array, and getUserName dereferences user with a non-null assertion.",
      "cls": "ans"
    },
    {
      "t": 78760,
      "out": "Tool: Edit",
      "cls": "tool"
    },
    {
      "t": 79460,
      "out": "Tool: Edit",
      "cls": "tool"
    },
    {
      "t": 80160,
      "out": "Both functions now handle their edge cases: an empty array returns 0, and a null user returns an empty string.",
      "cls": "ans"
    },
    {
      "t": 81360,
      "out": "Done: success",
      "cls": "ok"
    },
    {
      "t": 82560,
      "say": "Read \u2192 analysed \u2192 Edit. Claude executed the tools directly instead of asking you to implement them. Open utils.ts in your own run to see the defensive code."
    },
    {
      "t": 91080,
      "chapter": "Customize"
    },
    {
      "t": 91080,
      "say": "Change behaviour by changing options: add \"WebSearch\" to allowedTools, set a systemPrompt, or add \"Bash\" and ask it to write unit tests, run them, and fix failures."
    },
    {
      "t": 99960,
      "stop": {
        "title": "Knowledge check",
        "q": "What does allowedTools: [\"Read\", \"Glob\", \"Grep\"] give the agent?",
        "options": [
          "Read-only analysis",
          "Analyze and modify code",
          "Full automation"
        ],
        "correct": 0,
        "explain": "Read, Glob, Grep are read-only. Add Edit for modification; add Bash for full automation. Permission modes then control how much human oversight applies on top."
      }
    }
  ],
  "duration": 101660,
  "audio": null,
  "builtin": true
});
export default lesson;
