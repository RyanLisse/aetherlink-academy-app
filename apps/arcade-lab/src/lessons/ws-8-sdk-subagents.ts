import type { Lesson } from '../schema';
import { LessonSchema } from '../schema';

/** Built-in lesson `ws-8-sdk-subagents` — preserved exact id (lesson-id contract). */
export const lesson: Lesson = LessonSchema.parse({
  "id": "ws-8-sdk-subagents",
  "title": "8 \u00b7 SDK \u00b7 Subagents: a lead that only delegates",
  "kind": "trace",
  "files": [
    {
      "name": "research.ts",
      "text": ""
    },
    {
      "name": "prompts/lead-agent.md",
      "text": ""
    }
  ],
  "ops": [
    {
      "t": 600,
      "chapter": "Shape"
    },
    {
      "t": 600,
      "say": "The Eve council was four members plus a judge. The SDK's multi-agent primitive is **AgentDefinition**: each subagent gets its own prompt, tool allowlist and model. The lead's only tool is Task."
    },
    {
      "t": 9600,
      "say": "This is the research-agent demo, ported from Python to TypeScript: agents go in options, and the current SDK exposes delegation as the **Agent** tool (older versions called it Task)."
    },
    {
      "t": 18600,
      "f": 0,
      "p": 0,
      "d": 0,
      "i": "import { query, type AgentDefinition } from \"@anthropic-ai/claude-agent-sdk\";\n"
    },
    {
      "t": 19760,
      "f": 0,
      "p": 78,
      "d": 0,
      "i": "import { readFileSync } from \"node:fs\";\n"
    },
    {
      "t": 20398,
      "f": 0,
      "p": 118,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 20499,
      "f": 0,
      "p": 119,
      "d": 0,
      "i": "const prompt = (name: string) => readFileSync(`prompts/${name}.md`, \"utf8\").trim();\n"
    },
    {
      "t": 21741,
      "f": 0,
      "p": 203,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 21843,
      "f": 0,
      "p": 204,
      "d": 0,
      "i": "// Each subagent: its own prompt, a fixed tool allowlist, its own model.\n"
    },
    {
      "t": 22934,
      "f": 0,
      "p": 277,
      "d": 0,
      "i": "const agents: Record<string, AgentDefinition> = {\n"
    },
    {
      "t": 23709,
      "f": 0,
      "p": 327,
      "d": 0,
      "i": "  researcher: {\n"
    },
    {
      "t": 24016,
      "f": 0,
      "p": 343,
      "d": 0,
      "i": "    description:\n"
    },
    {
      "t": 24338,
      "f": 0,
      "p": 360,
      "d": 0,
      "i": "      \"Gathers information on one subtopic with web search and saves findings to files/research_notes/.\",\n"
    },
    {
      "t": 25883,
      "f": 0,
      "p": 466,
      "d": 0,
      "i": "    prompt: prompt(\"researcher\"),\n"
    },
    {
      "t": 26438,
      "f": 0,
      "p": 500,
      "d": 0,
      "i": "    tools: [\"WebSearch\", \"Write\"],\n"
    },
    {
      "t": 27006,
      "f": 0,
      "p": 535,
      "d": 0,
      "i": "    model: \"haiku\"\n"
    },
    {
      "t": 27355,
      "f": 0,
      "p": 554,
      "d": 0,
      "i": "  },\n"
    },
    {
      "t": 27511,
      "f": 0,
      "p": 559,
      "d": 0,
      "i": "  \"data-analyst\": {\n"
    },
    {
      "t": 27874,
      "f": 0,
      "p": 579,
      "d": 0,
      "i": "    description:\n"
    },
    {
      "t": 28195,
      "f": 0,
      "p": 596,
      "d": 0,
      "i": "      \"Use AFTER researchers finish: reads files/research_notes/, extracts metrics, charts them via Bash into files/charts/.\",\n"
    },
    {
      "t": 30029,
      "f": 0,
      "p": 723,
      "d": 0,
      "i": "    prompt: prompt(\"data-analyst\"),\n"
    },
    {
      "t": 30611,
      "f": 0,
      "p": 759,
      "d": 0,
      "i": "    tools: [\"Glob\", \"Read\", \"Bash\", \"Write\"],\n"
    },
    {
      "t": 31331,
      "f": 0,
      "p": 805,
      "d": 0,
      "i": "    model: \"haiku\"\n"
    },
    {
      "t": 31680,
      "f": 0,
      "p": 824,
      "d": 0,
      "i": "  },\n"
    },
    {
      "t": 31836,
      "f": 0,
      "p": 829,
      "d": 0,
      "i": "  \"report-writer\": {\n"
    },
    {
      "t": 32213,
      "f": 0,
      "p": 850,
      "d": 0,
      "i": "    description:\n"
    },
    {
      "t": 32534,
      "f": 0,
      "p": 867,
      "d": 0,
      "i": "      \"Reads notes, data and charts and writes the final report to files/reports/. Never searches the web.\",\n"
    },
    {
      "t": 34120,
      "f": 0,
      "p": 976,
      "d": 0,
      "i": "    prompt: prompt(\"report-writer\"),\n"
    },
    {
      "t": 34716,
      "f": 0,
      "p": 1013,
      "d": 0,
      "i": "    tools: [\"Write\", \"Glob\", \"Read\", \"Bash\"],\n"
    },
    {
      "t": 35436,
      "f": 0,
      "p": 1059,
      "d": 0,
      "i": "    model: \"haiku\"\n"
    },
    {
      "t": 35785,
      "f": 0,
      "p": 1078,
      "d": 0,
      "i": "  }\n"
    },
    {
      "t": 35928,
      "f": 0,
      "p": 1082,
      "d": 0,
      "i": "};\n"
    },
    {
      "t": 36056,
      "f": 0,
      "p": 1085,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 36158,
      "f": 0,
      "p": 1086,
      "d": 0,
      "i": "const topic = process.argv.slice(2).join(\" \").trim() || \"quantum computing developments in 2025\";\n"
    },
    {
      "t": 37593,
      "f": 0,
      "p": 1184,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 37694,
      "f": 0,
      "p": 1185,
      "d": 0,
      "i": "for await (const message of query({\n"
    },
    {
      "t": 38276,
      "f": 0,
      "p": 1221,
      "d": 0,
      "i": "  prompt: `Research ${topic}`,\n"
    },
    {
      "t": 38790,
      "f": 0,
      "p": 1252,
      "d": 0,
      "i": "  options: {\n"
    },
    {
      "t": 39056,
      "f": 0,
      "p": 1265,
      "d": 0,
      "i": "    systemPrompt: prompt(\"lead-agent\"),\n"
    },
    {
      "t": 39694,
      "f": 0,
      "p": 1305,
      "d": 0,
      "i": "    allowedTools: [\"Agent\"], // the lead can only delegate\n"
    },
    {
      "t": 40593,
      "f": 0,
      "p": 1364,
      "d": 0,
      "i": "    agents,\n"
    },
    {
      "t": 40845,
      "f": 0,
      "p": 1376,
      "d": 0,
      "i": "    permissionMode: \"bypassPermissions\",\n"
    },
    {
      "t": 41496,
      "f": 0,
      "p": 1417,
      "d": 0,
      "i": "    maxTurns: 30\n"
    },
    {
      "t": 41818,
      "f": 0,
      "p": 1434,
      "d": 0,
      "i": "  }\n"
    },
    {
      "t": 41960,
      "f": 0,
      "p": 1438,
      "d": 0,
      "i": "})) {\n"
    },
    {
      "t": 42130,
      "f": 0,
      "p": 1444,
      "d": 0,
      "i": "  const msg = message as any;\n"
    },
    {
      "t": 42630,
      "f": 0,
      "p": 1474,
      "d": 0,
      "i": "  // parent_tool_use_id tells you which subagent a message came from\n"
    },
    {
      "t": 43666,
      "f": 0,
      "p": 1543,
      "d": 0,
      "i": "  const who = msg.parent_tool_use_id ? `SUBAGENT ${msg.parent_tool_use_id.slice(-4)}` : \"LEAD\";\n"
    },
    {
      "t": 45074,
      "f": 0,
      "p": 1639,
      "d": 0,
      "i": "  for (const block of msg.message?.content ?? []) {\n"
    },
    {
      "t": 45876,
      "f": 0,
      "p": 1691,
      "d": 0,
      "i": "    if (block.type === \"tool_use\") {\n"
    },
    {
      "t": 46473,
      "f": 0,
      "p": 1728,
      "d": 0,
      "i": "      const detail = block.name === \"Agent\" ? block.input.subagent_type : JSON.stringify(block.input).slice(0, 60);\n"
    },
    {
      "t": 48155,
      "f": 0,
      "p": 1844,
      "d": 0,
      "i": "      console.log(`[${who}] \u2192 ${block.name}  ${detail}`);\n"
    },
    {
      "t": 49040,
      "f": 0,
      "p": 1902,
      "d": 0,
      "i": "    }\n"
    },
    {
      "t": 49210,
      "f": 0,
      "p": 1908,
      "d": 0,
      "i": "  }\n"
    },
    {
      "t": 49353,
      "f": 0,
      "p": 1912,
      "d": 0,
      "i": "  if (\"result\" in message) console.log(\"[done]\", message.result);\n"
    },
    {
      "t": 50348,
      "f": 0,
      "p": 1978,
      "d": 0,
      "i": "}\n"
    },
    {
      "t": 50463,
      "say": "Note the allowlists: researcher gets WebSearch + Write, data-analyst gets Bash, report-writer only reads and writes files. allowedTools for the lead is just [\"Agent\"]."
    },
    {
      "t": 59463,
      "chapter": "The lead"
    },
    {
      "t": 59463,
      "tab": 1
    },
    {
      "t": 59963,
      "f": 1,
      "p": 0,
      "d": 0,
      "i": "You are a lead research coordinator who orchestrates comprehensive multi-agent research projects.\n"
    },
    {
      "t": 61603,
      "f": 1,
      "p": 98,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 61718,
      "f": 1,
      "p": 99,
      "d": 0,
      "i": "**CRITICAL RULES:**\n"
    },
    {
      "t": 62133,
      "f": 1,
      "p": 119,
      "d": 0,
      "i": "1. You MUST delegate ALL research and report writing to specialized subagents. You NEVER research or write reports yourself.\n"
    },
    {
      "t": 64197,
      "f": 1,
      "p": 244,
      "d": 0,
      "i": "2. Keep ALL responses SHORT - maximum 2-3 sentences. NO greetings, NO emojis, NO explanations unless asked.\n"
    },
    {
      "t": 65994,
      "f": 1,
      "p": 352,
      "d": 0,
      "i": "3. Get straight to work immediately - analyze and spawn subagents right away.\n"
    },
    {
      "t": 67320,
      "f": 1,
      "p": 430,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 67435,
      "f": 1,
      "p": 431,
      "d": 0,
      "i": "<role_definition>\n"
    },
    {
      "t": 67818,
      "f": 1,
      "p": 449,
      "d": 0,
      "i": "- Break user research requests into 2-4 distinct research subtopics\n"
    },
    {
      "t": 68987,
      "f": 1,
      "p": 517,
      "d": 0,
      "i": "- Spawn multiple researcher subagents in parallel to investigate each subtopic\n"
    },
    {
      "t": 70328,
      "f": 1,
      "p": 596,
      "d": 0,
      "i": "- Coordinate the research process and ensure comprehensive coverage\n"
    },
    {
      "t": 71497,
      "f": 1,
      "p": 664,
      "d": 0,
      "i": "- After ALL research is complete, spawn a data-analyst subagent to generate charts and quantitative insights\n"
    },
    {
      "t": 73310,
      "f": 1,
      "p": 773,
      "d": 0,
      "i": "- Finally, spawn a report-writer subagent to synthesize findings with visualizations\n"
    },
    {
      "t": 74745,
      "f": 1,
      "p": 858,
      "d": 0,
      "i": "- Your ONLY tool is Task - you delegate everything to subagents\n"
    },
    {
      "t": 75851,
      "f": 1,
      "p": 922,
      "d": 0,
      "i": "</role_definition>\n"
    },
    {
      "t": 76250,
      "stop": {
        "title": "Knowledge check",
        "q": "Compared with the Eve council, what is different about how independence is enforced here?",
        "options": [
          "Nothing \u2014 both rely on the prompt",
          "The lead physically cannot research: its allowlist is [\"Agent\"], and each subagent's tools are fixed in code"
        ],
        "correct": 1,
        "explain": "Tool allowlists are code-enforced. The prompt still says \"never research yourself\", but the allowlist makes it impossible. Same instruction-vs-constraint lesson, third time."
      }
    },
    {
      "t": 76450,
      "chapter": "Run"
    },
    {
      "t": 76450,
      "out": "npx tsx research.ts quantum computing developments in 2025",
      "cls": "cmd"
    },
    {
      "t": 77150,
      "out": "[LEAD] \u2192 Agent  researcher",
      "cls": "tool"
    },
    {
      "t": 77750,
      "out": "[LEAD] \u2192 Agent  researcher",
      "cls": "tool"
    },
    {
      "t": 78350,
      "out": "[LEAD] \u2192 Agent  researcher",
      "cls": "tool"
    },
    {
      "t": 79150,
      "out": "[SUBAGENT a1f3] \u2192 WebSearch  {\"query\":\"quantum hardware qubit technology 2025\"}",
      "cls": "tool"
    },
    {
      "t": 79650,
      "out": "[SUBAGENT b7c2] \u2192 WebSearch  {\"query\":\"quantum algorithms real-world applications\"}",
      "cls": "tool"
    },
    {
      "t": 80150,
      "out": "[SUBAGENT c9e0] \u2192 WebSearch  {\"query\":\"quantum computing investment 2025\"}",
      "cls": "tool"
    },
    {
      "t": 80850,
      "out": "[SUBAGENT a1f3] \u2192 Write  {\"file_path\":\"files/research_notes/hardware.md\"}",
      "cls": "tool"
    },
    {
      "t": 81250,
      "out": "[SUBAGENT b7c2] \u2192 Write  {\"file_path\":\"files/research_notes/algorithms.md\"}",
      "cls": "tool"
    },
    {
      "t": 81650,
      "out": "[SUBAGENT c9e0] \u2192 Write  {\"file_path\":\"files/research_notes/investment.md\"}",
      "cls": "tool"
    },
    {
      "t": 82450,
      "out": "[LEAD] \u2192 Agent  data-analyst",
      "cls": "tool"
    },
    {
      "t": 83250,
      "out": "[SUBAGENT d44a] \u2192 Bash  {\"command\":\"python3 charts.py\"}",
      "cls": "tool"
    },
    {
      "t": 84150,
      "out": "[LEAD] \u2192 Agent  report-writer",
      "cls": "tool"
    },
    {
      "t": 84950,
      "out": "[SUBAGENT e08b] \u2192 Glob  {\"pattern\":\"files/**/*\"}",
      "cls": "tool"
    },
    {
      "t": 85450,
      "out": "[SUBAGENT e08b] \u2192 Write  {\"file_path\":\"files/reports/quantum-computing-2025.md\"}",
      "cls": "tool"
    },
    {
      "t": 86350,
      "out": "[done] Research complete. Report saved to files/reports/quantum-computing-2025.md",
      "cls": "ans"
    },
    {
      "t": 87650,
      "say": "Every line came from the message stream: tool_use blocks, and parent_tool_use_id tells you which subagent emitted them. Lesson 7's hooks give you the same view before each call. That trace is your evidence \u2014 not the final prose."
    },
    {
      "t": 96650,
      "say": "The original demo also loads a pdf skill from .claude/skills via settingSources: [\"project\"] \u2014 same idea as Eve's load_skill, an on-demand procedure, different plumbing. Left out here to keep the port minimal."
    },
    {
      "t": 105650,
      "stop": {
        "title": "Exit challenge",
        "q": "Sketch a low-risk task from your own work as a lead + one subagent. What is the subagent's tool allowlist, and which single condition should make it ask for help?",
        "explain": "Keep the allowlist minimal and code-enforced; put the ask-for-help condition in a hook or approval, not only in the prompt. Then hand a partner a difficult input and inspect the trace."
      }
    }
  ],
  "duration": 107350,
  "audio": null,
  "builtin": true
});
export default lesson;
