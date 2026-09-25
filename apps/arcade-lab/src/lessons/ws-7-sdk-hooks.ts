import type { Lesson } from '../schema';
import { LessonSchema } from '../schema';

/** Built-in lesson `ws-7-sdk-hooks` — preserved exact id (lesson-id contract). */
export const lesson: Lesson = LessonSchema.parse({
  "id": "ws-7-sdk-hooks",
  "title": "7 \u00b7 SDK \u00b7 Hooks: gate a tool before it runs",
  "kind": "trace",
  "files": [
    {
      "name": "hello-world.ts",
      "text": ""
    }
  ],
  "ops": [
    {
      "t": 600,
      "chapter": "The SDK gate"
    },
    {
      "t": 600,
      "say": "Eve's approval field parks the turn. The SDK equivalent is a **PreToolUse hook**: your function runs before the tool, and can allow, block, or (with canUseTool) ask a human."
    },
    {
      "t": 9600,
      "say": "This is the hello-world demo from claude-agent-sdk-demos. It pins an older SDK (0.1.14) and model \"opus\" \u2014 keep your 0.3.278 pin; the hook shape is what matters."
    },
    {
      "t": 18345,
      "f": 0,
      "p": 0,
      "d": 0,
      "i": "import { query } from '@anthropic-ai/claude-agent-sdk';\n"
    },
    {
      "t": 19260,
      "f": 0,
      "p": 56,
      "d": 0,
      "i": "import type { HookJSONOutput } from \"@anthropic-ai/claude-agent-sdk\";\n"
    },
    {
      "t": 20380,
      "f": 0,
      "p": 126,
      "d": 0,
      "i": "import * as path from \"path\";\n"
    },
    {
      "t": 20913,
      "f": 0,
      "p": 156,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 21021,
      "f": 0,
      "p": 157,
      "d": 0,
      "i": "async function main() {\n"
    },
    {
      "t": 21466,
      "f": 0,
      "p": 181,
      "d": 0,
      "i": "  const q = query({\n"
    },
    {
      "t": 21853,
      "f": 0,
      "p": 201,
      "d": 0,
      "i": "    prompt: 'Hello, Claude! Please introduce yourself in one sentence.',\n"
    },
    {
      "t": 23017,
      "f": 0,
      "p": 274,
      "d": 0,
      "i": "    options: {\n"
    },
    {
      "t": 23330,
      "f": 0,
      "p": 289,
      "d": 0,
      "i": "      maxTurns: 100,\n"
    },
    {
      "t": 23732,
      "f": 0,
      "p": 310,
      "d": 0,
      "i": "      cwd: path.join(process.cwd(), 'agent'),\n"
    },
    {
      "t": 24500,
      "f": 0,
      "p": 356,
      "d": 0,
      "i": "      model: \"opus\",\n"
    },
    {
      "t": 24901,
      "f": 0,
      "p": 377,
      "d": 0,
      "i": "      executable: \"node\", // Use the current node binary path\n"
    },
    {
      "t": 25904,
      "f": 0,
      "p": 439,
      "d": 0,
      "i": "      allowedTools: [\n"
    },
    {
      "t": 26320,
      "f": 0,
      "p": 461,
      "d": 0,
      "i": "        \"Task\", \"Bash\", \"Glob\", \"Grep\", \"LS\", \"ExitPlanMode\", \"Read\", \"Edit\", \"MultiEdit\", \"Write\", \"NotebookEdit\",\n"
    },
    {
      "t": 28114,
      "f": 0,
      "p": 577,
      "d": 0,
      "i": "        \"WebFetch\", \"TodoWrite\", \"WebSearch\", \"BashOutput\", \"KillBash\"\n"
    },
    {
      "t": 29249,
      "f": 0,
      "p": 648,
      "d": 0,
      "i": "      ],\n"
    },
    {
      "t": 29474,
      "f": 0,
      "p": 657,
      "d": 0,
      "i": "      hooks: {\n"
    },
    {
      "t": 29788,
      "f": 0,
      "p": 672,
      "d": 0,
      "i": "        PreToolUse: [\n"
    },
    {
      "t": 30204,
      "f": 0,
      "p": 694,
      "d": 0,
      "i": "          {\n"
    },
    {
      "t": 30473,
      "f": 0,
      "p": 706,
      "d": 0,
      "i": "            matcher: \"Write|Edit|MultiEdit\",\n"
    },
    {
      "t": 31226,
      "f": 0,
      "p": 751,
      "d": 0,
      "i": "            hooks: [\n"
    },
    {
      "t": 31628,
      "f": 0,
      "p": 772,
      "d": 0,
      "i": "              async (input: any): Promise<HookJSONOutput> => {\n"
    },
    {
      "t": 32645,
      "f": 0,
      "p": 835,
      "d": 0,
      "i": "                const toolName = input.tool_name;\n"
    },
    {
      "t": 33472,
      "f": 0,
      "p": 885,
      "d": 0,
      "i": "                const toolInput = input.tool_input;\n"
    },
    {
      "t": 34328,
      "f": 0,
      "p": 937,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 34436,
      "f": 0,
      "p": 938,
      "d": 0,
      "i": "                if (!['Write', 'Edit', 'MultiEdit'].includes(toolName)) {\n"
    },
    {
      "t": 35614,
      "f": 0,
      "p": 1012,
      "d": 0,
      "i": "                  return { continue: true };\n"
    },
    {
      "t": 36368,
      "f": 0,
      "p": 1057,
      "d": 0,
      "i": "                }\n"
    },
    {
      "t": 36725,
      "f": 0,
      "p": 1075,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 36833,
      "f": 0,
      "p": 1076,
      "d": 0,
      "i": "                let filePath = '';\n"
    },
    {
      "t": 37440,
      "f": 0,
      "p": 1111,
      "d": 0,
      "i": "                if (toolName === 'Write' || toolName === 'Edit') {\n"
    },
    {
      "t": 38516,
      "f": 0,
      "p": 1178,
      "d": 0,
      "i": "                  filePath = toolInput.file_path || '';\n"
    },
    {
      "t": 39430,
      "f": 0,
      "p": 1234,
      "d": 0,
      "i": "                } else if (toolName === 'MultiEdit') {\n"
    },
    {
      "t": 40330,
      "f": 0,
      "p": 1289,
      "d": 0,
      "i": "                  filePath = toolInput.file_path || '';\n"
    },
    {
      "t": 41245,
      "f": 0,
      "p": 1345,
      "d": 0,
      "i": "                }\n"
    },
    {
      "t": 41602,
      "f": 0,
      "p": 1363,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 41710,
      "f": 0,
      "p": 1364,
      "d": 0,
      "i": "                const ext = path.extname(filePath).toLowerCase();\n"
    },
    {
      "t": 42772,
      "f": 0,
      "p": 1430,
      "d": 0,
      "i": "                if (ext === '.js' || ext === '.ts') {\n"
    },
    {
      "t": 43657,
      "f": 0,
      "p": 1484,
      "d": 0,
      "i": "                  const customScriptsPath = path.join(process.cwd(), 'agent', 'custom_scripts');\n"
    },
    {
      "t": 45173,
      "f": 0,
      "p": 1581,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 45281,
      "f": 0,
      "p": 1582,
      "d": 0,
      "i": "                  if (!filePath.startsWith(customScriptsPath)) {\n"
    },
    {
      "t": 46328,
      "f": 0,
      "p": 1647,
      "d": 0,
      "i": "                    return {\n"
    },
    {
      "t": 46846,
      "f": 0,
      "p": 1676,
      "d": 0,
      "i": "                      decision: 'block',\n"
    },
    {
      "t": 47541,
      "f": 0,
      "p": 1717,
      "d": 0,
      "i": "                      stopReason: `Script files (.js and .ts) must be written to the custom_scripts directory. Please use the path: ${customScriptsPath}/${path.basename(filePath)}`,\n"
    },
    {
      "t": 50304,
      "f": 0,
      "p": 1899,
      "d": 0,
      "i": "                      continue: false\n"
    },
    {
      "t": 50954,
      "f": 0,
      "p": 1937,
      "d": 0,
      "i": "                    };\n"
    },
    {
      "t": 51385,
      "f": 0,
      "p": 1960,
      "d": 0,
      "i": "                  }\n"
    },
    {
      "t": 51772,
      "f": 0,
      "p": 1980,
      "d": 0,
      "i": "                }\n"
    },
    {
      "t": 52129,
      "f": 0,
      "p": 1998,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 52237,
      "f": 0,
      "p": 1999,
      "d": 0,
      "i": "                return { continue: true };\n"
    },
    {
      "t": 52961,
      "f": 0,
      "p": 2042,
      "d": 0,
      "i": "              }\n"
    },
    {
      "t": 53289,
      "f": 0,
      "p": 2058,
      "d": 0,
      "i": "            ]\n"
    },
    {
      "t": 53588,
      "f": 0,
      "p": 2072,
      "d": 0,
      "i": "          }\n"
    },
    {
      "t": 53857,
      "f": 0,
      "p": 2084,
      "d": 0,
      "i": "        ]\n"
    },
    {
      "t": 54097,
      "f": 0,
      "p": 2094,
      "d": 0,
      "i": "      },\n"
    },
    {
      "t": 54322,
      "f": 0,
      "p": 2103,
      "d": 0,
      "i": "    },\n"
    },
    {
      "t": 54518,
      "f": 0,
      "p": 2110,
      "d": 0,
      "i": "  });\n"
    },
    {
      "t": 54700,
      "f": 0,
      "p": 2116,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 54808,
      "f": 0,
      "p": 2117,
      "d": 0,
      "i": "  for await (const message of q) {\n"
    },
    {
      "t": 55414,
      "f": 0,
      "p": 2152,
      "d": 0,
      "i": "    if (message.type === 'assistant' && message.message) {\n"
    },
    {
      "t": 56373,
      "f": 0,
      "p": 2211,
      "d": 0,
      "i": "      const textContent = message.message.content.find((c: any) => c.type === 'text');\n"
    },
    {
      "t": 57742,
      "f": 0,
      "p": 2298,
      "d": 0,
      "i": "      if (textContent && 'text' in textContent) {\n"
    },
    {
      "t": 58569,
      "f": 0,
      "p": 2348,
      "d": 0,
      "i": "        console.log('Claude says:', textContent.text);\n"
    },
    {
      "t": 59469,
      "f": 0,
      "p": 2403,
      "d": 0,
      "i": "      }\n"
    },
    {
      "t": 59680,
      "f": 0,
      "p": 2411,
      "d": 0,
      "i": "    }\n"
    },
    {
      "t": 59861,
      "f": 0,
      "p": 2417,
      "d": 0,
      "i": "  }\n"
    },
    {
      "t": 60013,
      "f": 0,
      "p": 2421,
      "d": 0,
      "i": "}\n"
    },
    {
      "t": 60136,
      "f": 0,
      "p": 2423,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 60244,
      "f": 0,
      "p": 2424,
      "d": 0,
      "i": "main().catch(console.error);\n"
    },
    {
      "t": 60762,
      "say": "The hook matches Write|Edit|MultiEdit, reads tool_input.file_path, and blocks any .js/.ts file outside agent/custom_scripts \u2014 returning decision: \"block\" with a stopReason the model gets to read."
    },
    {
      "t": 69762,
      "stop": {
        "title": "Predict",
        "q": "You change the prompt to: \"Create a helper script greet.ts in the agent folder.\" What happens at the first Write?",
        "explain": "The hook blocks it and returns the stopReason. The model reads that reason and retries with agent/custom_scripts/greet.ts \u2014 the gate shaped the behaviour without a prompt rule."
      }
    },
    {
      "t": 69962,
      "chapter": "Run"
    },
    {
      "t": 69962,
      "out": "mkdir -p agent/custom_scripts",
      "cls": "cmd"
    },
    {
      "t": 70662,
      "out": "npx tsx hello-world.ts",
      "cls": "cmd"
    },
    {
      "t": 71362,
      "out": "[PreToolUse] Write agent/greet.ts \u2192 block: Script files (.js and .ts) must be written to the custom_scripts directory. Please use the path: \u2026/agent/custom_scripts/greet.ts",
      "cls": "err"
    },
    {
      "t": 72962,
      "out": "[PreToolUse] Write agent/custom_scripts/greet.ts \u2192 continue",
      "cls": "ok"
    },
    {
      "t": 73962,
      "out": "Claude says: I created agent/custom_scripts/greet.ts with a greet(name) helper.",
      "cls": "ans"
    },
    {
      "t": 75162,
      "say": "Same primitive as Eve lesson 3, different plumbing: Eve parks a durable step; the SDK hook runs inline in your process. Both are **code-enforced**, not prompt-enforced."
    },
    {
      "t": 84162,
      "stop": {
        "title": "Knowledge check",
        "q": "Which mechanism lets a human decide at runtime in the SDK?",
        "options": [
          "A stronger system prompt",
          "canUseTool / permission prompts, alongside PreToolUse hooks"
        ],
        "correct": 1,
        "explain": "Hooks decide in code; canUseTool routes the decision to a person. A prompt rule guides the model but is not a boundary."
      }
    }
  ],
  "duration": 85862,
  "audio": null,
  "builtin": true
});
export default lesson;
