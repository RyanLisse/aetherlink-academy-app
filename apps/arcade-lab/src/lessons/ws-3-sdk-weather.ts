import type { Lesson } from '../schema';
import { LessonSchema } from '../schema';

/** Built-in lesson `ws-3-sdk-weather` — preserved exact id (lesson-id contract). */
export const lesson: Lesson = LessonSchema.parse({
  "id": "ws-3-sdk-weather",
  "title": "6 \u00b7 SDK \u00b7 The same weather agent, as a custom tool",
  "kind": "trace",
  "files": [
    {
      "name": "weather-fixture.ts",
      "text": ""
    },
    {
      "name": "weather.ts",
      "text": ""
    },
    {
      "name": "weather-fixture.test.ts",
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
      "say": "Same behaviour, new runtime. Node 24, and ANTHROPIC_API_KEY injected from **protected secret settings** \u2014 never in code, shell history or git."
    },
    {
      "t": 8490,
      "out": "mkdir first-agent && cd first-agent",
      "cls": "cmd"
    },
    {
      "t": 9190,
      "out": "npm init -y",
      "cls": "cmd"
    },
    {
      "t": 9890,
      "out": "Wrote to package.json",
      "cls": "dim"
    },
    {
      "t": 10290,
      "out": "npm pkg set type=module",
      "cls": "cmd"
    },
    {
      "t": 10990,
      "out": "npm install @anthropic-ai/claude-agent-sdk@0.3.278 zod@4",
      "cls": "cmd"
    },
    {
      "t": 11690,
      "out": "added packages \u00b7 lockfile written",
      "cls": "dim"
    },
    {
      "t": 12390,
      "out": "test -n \"$ANTHROPIC_API_KEY\" || { echo \"Set ANTHROPIC_API_KEY in secret settings\"; exit 1; }",
      "cls": "cmd"
    },
    {
      "t": 13090,
      "say": "The SDK reads the process environment; it does not load .env files itself."
    },
    {
      "t": 17920,
      "chapter": "Fixture"
    },
    {
      "t": 17920,
      "say": "First the fixture: a pure function everybody can verify. No model, no cost."
    },
    {
      "t": 22795,
      "f": 0,
      "p": 0,
      "d": 0,
      "i": "export type Weather = {\n"
    },
    {
      "t": 23463,
      "f": 0,
      "p": 24,
      "d": 0,
      "i": "  city: string;\n"
    },
    {
      "t": 23955,
      "f": 0,
      "p": 40,
      "d": 0,
      "i": "  temperatureF: 72;\n"
    },
    {
      "t": 24535,
      "f": 0,
      "p": 60,
      "d": 0,
      "i": "  condition: \"Sunny\";\n"
    },
    {
      "t": 25159,
      "f": 0,
      "p": 82,
      "d": 0,
      "i": "  summary: string;\n"
    },
    {
      "t": 25717,
      "f": 0,
      "p": 101,
      "d": 0,
      "i": "};\n"
    },
    {
      "t": 25923,
      "f": 0,
      "p": 104,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 26085,
      "f": 0,
      "p": 105,
      "d": 0,
      "i": "export function weatherFor(city: string): Weather {\n"
    },
    {
      "t": 27369,
      "f": 0,
      "p": 157,
      "d": 0,
      "i": "  if (!city.trim()) throw new Error(\"city is required\");\n"
    },
    {
      "t": 28763,
      "f": 0,
      "p": 214,
      "d": 0,
      "i": "  return {\n"
    },
    {
      "t": 29145,
      "f": 0,
      "p": 225,
      "d": 0,
      "i": "    city,\n"
    },
    {
      "t": 29505,
      "f": 0,
      "p": 235,
      "d": 0,
      "i": "    temperatureF: 72,\n"
    },
    {
      "t": 30129,
      "f": 0,
      "p": 257,
      "d": 0,
      "i": "    condition: \"Sunny\",\n"
    },
    {
      "t": 30797,
      "f": 0,
      "p": 281,
      "d": 0,
      "i": "    summary: `Sunny in ${city} with a light breeze.`\n"
    },
    {
      "t": 32103,
      "f": 0,
      "p": 334,
      "d": 0,
      "i": "  };\n"
    },
    {
      "t": 32353,
      "f": 0,
      "p": 339,
      "d": 0,
      "i": "}\n"
    },
    {
      "t": 32537,
      "chapter": "Test first"
    },
    {
      "t": 32537,
      "say": "Prove the trust boundary **before** a model ever sees the tool."
    },
    {
      "t": 36872,
      "tab": 2
    },
    {
      "t": 37372,
      "f": 2,
      "p": 0,
      "d": 0,
      "i": "import assert from \"node:assert/strict\";\n"
    },
    {
      "t": 38414,
      "f": 2,
      "p": 41,
      "d": 0,
      "i": "import test from \"node:test\";\n"
    },
    {
      "t": 39214,
      "f": 2,
      "p": 71,
      "d": 0,
      "i": "import { weatherFor } from \"./weather-fixture.ts\";\n"
    },
    {
      "t": 40476,
      "f": 2,
      "p": 122,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 40638,
      "f": 2,
      "p": 123,
      "d": 0,
      "i": "test(\"returns the fixed Amsterdam fixture\", () => {\n"
    },
    {
      "t": 41922,
      "f": 2,
      "p": 175,
      "d": 0,
      "i": "  assert.deepEqual(weatherFor(\"Amsterdam\"), {\n"
    },
    {
      "t": 43074,
      "f": 2,
      "p": 221,
      "d": 0,
      "i": "    city: \"Amsterdam\",\n"
    },
    {
      "t": 43720,
      "f": 2,
      "p": 244,
      "d": 0,
      "i": "    temperatureF: 72,\n"
    },
    {
      "t": 44344,
      "f": 2,
      "p": 266,
      "d": 0,
      "i": "    condition: \"Sunny\",\n"
    },
    {
      "t": 45012,
      "f": 2,
      "p": 290,
      "d": 0,
      "i": "    summary: \"Sunny in Amsterdam with a light breeze.\"\n"
    },
    {
      "t": 46362,
      "f": 2,
      "p": 345,
      "d": 0,
      "i": "  });\n"
    },
    {
      "t": 46634,
      "f": 2,
      "p": 351,
      "d": 0,
      "i": "});\n"
    },
    {
      "t": 46862,
      "f": 2,
      "p": 355,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 47024,
      "f": 2,
      "p": 356,
      "d": 0,
      "i": "test(\"rejects a missing city\", () => {\n"
    },
    {
      "t": 48022,
      "f": 2,
      "p": 395,
      "d": 0,
      "i": "  assert.throws(() => weatherFor(\"   \"), /city is required/);\n"
    },
    {
      "t": 49526,
      "f": 2,
      "p": 457,
      "d": 0,
      "i": "});\n"
    },
    {
      "t": 49754,
      "out": "node --test weather-fixture.test.ts",
      "cls": "cmd"
    },
    {
      "t": 50454,
      "out": "\u2714 returns the fixed Amsterdam fixture",
      "cls": "ok"
    },
    {
      "t": 50954,
      "out": "\u2714 rejects a missing city",
      "cls": "ok"
    },
    {
      "t": 51454,
      "out": "tests 2 \u00b7 pass 2 \u00b7 fail 0",
      "cls": "dim"
    },
    {
      "t": 52354,
      "chapter": "Agent"
    },
    {
      "t": 52354,
      "say": "Now the agent. tool() + createSdkMcpServer() is the documented in-process MCP pattern. tools: [] removes every built-in tool, leaving only the weather capability."
    },
    {
      "t": 61144,
      "tab": 1
    },
    {
      "t": 61644,
      "f": 1,
      "p": 0,
      "d": 0,
      "i": "import { createSdkMcpServer, query, tool } from \"@anthropic-ai/claude-agent-sdk\";\n"
    },
    {
      "t": 63033,
      "f": 1,
      "p": 82,
      "d": 0,
      "i": "import { z } from \"zod\";\n"
    },
    {
      "t": 63525,
      "f": 1,
      "p": 107,
      "d": 0,
      "i": "import { weatherFor } from \"./weather-fixture.ts\";\n"
    },
    {
      "t": 64427,
      "f": 1,
      "p": 158,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 64543,
      "f": 1,
      "p": 159,
      "d": 0,
      "i": "const city = process.argv.slice(2).join(\" \").trim();\n"
    },
    {
      "t": 65475,
      "f": 1,
      "p": 212,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 65591,
      "f": 1,
      "p": 213,
      "d": 0,
      "i": "const getWeather = tool(\n"
    },
    {
      "t": 66084,
      "f": 1,
      "p": 238,
      "d": 0,
      "i": "  \"get_weather\",\n"
    },
    {
      "t": 66451,
      "f": 1,
      "p": 255,
      "d": 0,
      "i": "  \"Return the fixed teaching weather for one non-empty city. This is fixture data.\",\n"
    },
    {
      "t": 67887,
      "f": 1,
      "p": 340,
      "d": 0,
      "i": "  { city: z.string().trim().min(1).describe(\"City name\") },\n"
    },
    {
      "t": 68930,
      "f": 1,
      "p": 400,
      "d": 0,
      "i": "  async ({ city }) => {\n"
    },
    {
      "t": 69407,
      "f": 1,
      "p": 424,
      "d": 0,
      "i": "    const weather = weatherFor(city);\n"
    },
    {
      "t": 70104,
      "f": 1,
      "p": 462,
      "d": 0,
      "i": "    console.log(\"[tool result]\", weather);\n"
    },
    {
      "t": 70880,
      "f": 1,
      "p": 505,
      "d": 0,
      "i": "    return { content: [{ type: \"text\", text: JSON.stringify(weather) }], structuredContent: weather };\n"
    },
    {
      "t": 72598,
      "f": 1,
      "p": 608,
      "d": 0,
      "i": "  }\n"
    },
    {
      "t": 72761,
      "f": 1,
      "p": 612,
      "d": 0,
      "i": ");\n"
    },
    {
      "t": 72908,
      "f": 1,
      "p": 615,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 73024,
      "f": 1,
      "p": 616,
      "d": 0,
      "i": "const weatherServer = createSdkMcpServer({ name: \"weather\", version: \"1.0.0\", tools: [getWeather] });\n"
    },
    {
      "t": 74727,
      "f": 1,
      "p": 718,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 74843,
      "f": 1,
      "p": 719,
      "d": 0,
      "i": "let resultSeen = false;\n"
    },
    {
      "t": 75320,
      "f": 1,
      "p": 743,
      "d": 0,
      "i": "try {\n"
    },
    {
      "t": 75514,
      "f": 1,
      "p": 749,
      "d": 0,
      "i": "  for await (const message of query({\n"
    },
    {
      "t": 76211,
      "f": 1,
      "p": 787,
      "d": 0,
      "i": "    prompt: city ? `What is the weather in ${city}?` : \"What is the weather?\",\n"
    },
    {
      "t": 77553,
      "f": 1,
      "p": 866,
      "d": 0,
      "i": "    options: {\n"
    },
    {
      "t": 77888,
      "f": 1,
      "p": 881,
      "d": 0,
      "i": "      systemPrompt: \"You are a concise weather teaching assistant. If no city is supplied, ask for one and do not call a tool. If a city is supplied, call get_weather before answering, call it once, and say the result is simulated fixture data.\",\n"
    },
    {
      "t": 81870,
      "f": 1,
      "p": 1128,
      "d": 0,
      "i": "      mcpServers: { weather: weatherServer },\n"
    },
    {
      "t": 82693,
      "f": 1,
      "p": 1174,
      "d": 0,
      "i": "      tools: [],\n"
    },
    {
      "t": 83060,
      "f": 1,
      "p": 1191,
      "d": 0,
      "i": "      allowedTools: [\"mcp__weather__get_weather\"],\n"
    },
    {
      "t": 83961,
      "f": 1,
      "p": 1242,
      "d": 0,
      "i": "      permissionMode: \"dontAsk\",\n"
    },
    {
      "t": 84580,
      "f": 1,
      "p": 1275,
      "d": 0,
      "i": "      maxTurns: 3\n"
    },
    {
      "t": 84963,
      "f": 1,
      "p": 1293,
      "d": 0,
      "i": "    }\n"
    },
    {
      "t": 85157,
      "f": 1,
      "p": 1299,
      "d": 0,
      "i": "  })) {\n"
    },
    {
      "t": 85383,
      "f": 1,
      "p": 1307,
      "d": 0,
      "i": "    if (message.type === \"assistant\") {\n"
    },
    {
      "t": 86111,
      "f": 1,
      "p": 1347,
      "d": 0,
      "i": "      for (const block of message.message.content) {\n"
    },
    {
      "t": 87044,
      "f": 1,
      "p": 1400,
      "d": 0,
      "i": "        if (block.type === \"tool_use\") console.log(\"[tool call]\", block.name, block.input);\n"
    },
    {
      "t": 88590,
      "f": 1,
      "p": 1492,
      "d": 0,
      "i": "      }\n"
    },
    {
      "t": 88815,
      "f": 1,
      "p": 1500,
      "d": 0,
      "i": "    } else if (message.type === \"result\") {\n"
    },
    {
      "t": 89607,
      "f": 1,
      "p": 1544,
      "d": 0,
      "i": "      resultSeen = true;\n"
    },
    {
      "t": 90100,
      "f": 1,
      "p": 1569,
      "d": 0,
      "i": "      if (message.subtype !== \"success\") throw new Error(`SDK result: ${message.subtype}`);\n"
    },
    {
      "t": 91645,
      "f": 1,
      "p": 1661,
      "d": 0,
      "i": "      console.log(\"[answer]\", message.result);\n"
    },
    {
      "t": 92484,
      "f": 1,
      "p": 1708,
      "d": 0,
      "i": "    }\n"
    },
    {
      "t": 92678,
      "f": 1,
      "p": 1714,
      "d": 0,
      "i": "  }\n"
    },
    {
      "t": 92841,
      "f": 1,
      "p": 1718,
      "d": 0,
      "i": "  if (!resultSeen) throw new Error(\"SDK ended without a result\");\n"
    },
    {
      "t": 93978,
      "f": 1,
      "p": 1784,
      "d": 0,
      "i": "} catch (error) {\n"
    },
    {
      "t": 94361,
      "f": 1,
      "p": 1802,
      "d": 0,
      "i": "  console.error(\"Weather agent failed:\", error);\n"
    },
    {
      "t": 95231,
      "f": 1,
      "p": 1851,
      "d": 0,
      "i": "  process.exitCode = 1;\n"
    },
    {
      "t": 95708,
      "f": 1,
      "p": 1875,
      "d": 0,
      "i": "}\n"
    },
    {
      "t": 95840,
      "say": "One loop handles every message: print tool_use blocks as they appear, and the result at the end. A non-success result is an error, not an answer."
    },
    {
      "t": 103865,
      "chapter": "Run"
    },
    {
      "t": 103865,
      "say": "Run the supplied-city path. This makes a real Anthropic request."
    },
    {
      "t": 108245,
      "out": "node weather.ts Amsterdam",
      "cls": "cmd"
    },
    {
      "t": 108945,
      "out": "[tool call] mcp__weather__get_weather { city: 'Amsterdam' }",
      "cls": "tool"
    },
    {
      "t": 109945,
      "out": "[tool result] { city: 'Amsterdam', temperatureF: 72, condition: 'Sunny', summary: 'Sunny in Amsterdam with a light breeze.' }",
      "cls": "res"
    },
    {
      "t": 111245,
      "out": "[answer] Simulated fixture data: 72\u00b0F and sunny in Amsterdam. This is not live weather.",
      "cls": "ans"
    },
    {
      "t": 112545,
      "stop": {
        "title": "Ask your partner",
        "q": "Which evidence proves the fixed temperature?",
        "options": [
          "The [tool result] trace line",
          "The fluent final answer"
        ],
        "correct": 0,
        "explain": "The tool result is produced by your code. The answer is the model's paraphrase of it \u2014 fluent, but not evidence."
      }
    },
    {
      "t": 112745,
      "say": "Now the missing-city behavioural check."
    },
    {
      "t": 116000,
      "out": "node weather.ts",
      "cls": "cmd"
    },
    {
      "t": 116700,
      "out": "[answer] Which city would you like the weather for?",
      "cls": "ans"
    },
    {
      "t": 117900,
      "say": "No tool call, no tool result. This check still costs one model request."
    },
    {
      "t": 122595,
      "chapter": "Compare"
    },
    {
      "t": 122595,
      "stop": {
        "title": "Eve vs SDK",
        "q": "What stayed the same between the Eve weather agent and this one \u2014 and what differs in the trace?",
        "explain": "Same: tool input and output, simulated-data labelling, the missing-city follow-up. Different: the SDK exposes the message stream (tool_use blocks, result subtype) and does not provide Eve's runtime facilities such as durable sessions."
      }
    }
  ],
  "duration": 124295,
  "audio": null,
  "builtin": true
});
export default lesson;
