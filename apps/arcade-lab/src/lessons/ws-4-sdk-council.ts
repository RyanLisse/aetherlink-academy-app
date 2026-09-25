import type { Lesson } from '../schema';
import { LessonSchema } from '../schema';

/** Built-in lesson `ws-4-sdk-council` — preserved exact id (lesson-id contract). */
export const lesson: Lesson = LessonSchema.parse({
  "id": "ws-4-sdk-council",
  "title": "9 \u00b7 Appendix \u00b7 Four providers via Gateway, Claude as judge",
  "kind": "trace",
  "files": [
    {
      "name": "council-bridge.ts",
      "text": ""
    },
    {
      "name": "council.ts",
      "text": ""
    }
  ],
  "ops": [
    {
      "t": 600,
      "chapter": "Parity"
    },
    {
      "t": 600,
      "say": "The SDK's model option accepts Claude models only. To keep **four real providers**, the host fans out through the AI Gateway \u2014 then Claude judges."
    },
    {
      "t": 8670,
      "say": "Inject AI_GATEWAY_API_KEY through protected secret settings and confirm the spend limit before any live run."
    },
    {
      "t": 15030,
      "f": 0,
      "p": 0,
      "d": 0,
      "i": "const members = {\n"
    },
    {
      "t": 15413,
      "f": 0,
      "p": 18,
      "d": 0,
      "i": "  claude: \"anthropic/claude-opus-5\",\n"
    },
    {
      "t": 16094,
      "f": 0,
      "p": 55,
      "d": 0,
      "i": "  grok: \"spacexai/grok-4.7\",\n"
    },
    {
      "t": 16650,
      "f": 0,
      "p": 84,
      "d": 0,
      "i": "  kimi: \"moonshotai/kimi-k3\",\n"
    },
    {
      "t": 17221,
      "f": 0,
      "p": 114,
      "d": 0,
      "i": "  openai: \"openai/gpt-5.6-sol\"\n"
    },
    {
      "t": 17809,
      "f": 0,
      "p": 145,
      "d": 0,
      "i": "} as const;\n"
    },
    {
      "t": 18097,
      "f": 0,
      "p": 157,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 18213,
      "f": 0,
      "p": 158,
      "d": 0,
      "i": "export type MemberId = keyof typeof members;\n"
    },
    {
      "t": 19020,
      "f": 0,
      "p": 203,
      "d": 0,
      "i": "export type CouncilAnswers = Record<MemberId, string>;\n"
    },
    {
      "t": 19984,
      "f": 0,
      "p": 258,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 20100,
      "f": 0,
      "p": 259,
      "d": 0,
      "i": "function required(name: \"AI_GATEWAY_API_KEY\" | \"ANTHROPIC_API_KEY\"): string {\n"
    },
    {
      "t": 21426,
      "f": 0,
      "p": 337,
      "d": 0,
      "i": "  const value = process.env[name];\n"
    },
    {
      "t": 22076,
      "f": 0,
      "p": 372,
      "d": 0,
      "i": "  if (!value) throw new Error(`Missing ${name}; configure protected secret settings first.`);\n"
    },
    {
      "t": 23653,
      "f": 0,
      "p": 466,
      "d": 0,
      "i": "  return value;\n"
    },
    {
      "t": 24004,
      "f": 0,
      "p": 482,
      "d": 0,
      "i": "}\n"
    },
    {
      "t": 24136,
      "f": 0,
      "p": 484,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 24251,
      "f": 0,
      "p": 485,
      "d": 0,
      "i": "async function askGateway(model: string, question: string, apiKey: string): Promise<string> {\n"
    },
    {
      "t": 25829,
      "f": 0,
      "p": 579,
      "d": 0,
      "i": "  const response = await fetch(\"https://ai-gateway.vercel.sh/v1/chat/completions\", {\n"
    },
    {
      "t": 27264,
      "f": 0,
      "p": 664,
      "d": 0,
      "i": "    method: \"POST\",\n"
    },
    {
      "t": 27679,
      "f": 0,
      "p": 684,
      "d": 0,
      "i": "    signal: AbortSignal.timeout(30_000),\n"
    },
    {
      "t": 28423,
      "f": 0,
      "p": 725,
      "d": 0,
      "i": "    headers: { Authorization: `Bearer ${apiKey}`, \"Content-Type\": \"application/json\" },\n"
    },
    {
      "t": 29906,
      "f": 0,
      "p": 813,
      "d": 0,
      "i": "    body: JSON.stringify({ model, messages: [{ role: \"user\", content: question }] })\n"
    },
    {
      "t": 31341,
      "f": 0,
      "p": 898,
      "d": 0,
      "i": "  });\n"
    },
    {
      "t": 31536,
      "f": 0,
      "p": 904,
      "d": 0,
      "i": "  if (!response.ok) throw new Error(`${model} returned HTTP ${response.status}`);\n"
    },
    {
      "t": 32924,
      "f": 0,
      "p": 986,
      "d": 0,
      "i": "  const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };\n"
    },
    {
      "t": 34549,
      "f": 0,
      "p": 1083,
      "d": 0,
      "i": "  const answer = body.choices?.[0]?.message?.content;\n"
    },
    {
      "t": 35497,
      "f": 0,
      "p": 1137,
      "d": 0,
      "i": "  if (typeof answer !== \"string\" || !answer.trim()) throw new Error(`${model} returned no text`);\n"
    },
    {
      "t": 37137,
      "f": 0,
      "p": 1235,
      "d": 0,
      "i": "  return answer;\n"
    },
    {
      "t": 37504,
      "f": 0,
      "p": 1252,
      "d": 0,
      "i": "}\n"
    },
    {
      "t": 37636,
      "f": 0,
      "p": 1254,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 37751,
      "f": 0,
      "p": 1255,
      "d": 0,
      "i": "export async function consultCouncil(question: string): Promise<CouncilAnswers> {\n"
    },
    {
      "t": 39140,
      "f": 0,
      "p": 1337,
      "d": 0,
      "i": "  const prompt = question.trim();\n"
    },
    {
      "t": 39774,
      "f": 0,
      "p": 1371,
      "d": 0,
      "i": "  if (!prompt) throw new Error(\"question is required\");\n"
    },
    {
      "t": 40754,
      "f": 0,
      "p": 1427,
      "d": 0,
      "i": "  const apiKey = required(\"AI_GATEWAY_API_KEY\");\n"
    },
    {
      "t": 41624,
      "f": 0,
      "p": 1476,
      "d": 0,
      "i": "  const entries = Object.entries(members) as Array<[MemberId, string]>;\n"
    },
    {
      "t": 42856,
      "f": 0,
      "p": 1548,
      "d": 0,
      "i": "  const attempts = await Promise.allSettled(entries.map(async ([member, model]) =>\n"
    },
    {
      "t": 44260,
      "f": 0,
      "p": 1631,
      "d": 0,
      "i": "    [member, await askGateway(model, prompt, apiKey)] as const\n"
    },
    {
      "t": 45350,
      "f": 0,
      "p": 1694,
      "d": 0,
      "i": "  ));\n"
    },
    {
      "t": 45544,
      "f": 0,
      "p": 1700,
      "d": 0,
      "i": "  const failures = attempts.flatMap((attempt, index) =>\n"
    },
    {
      "t": 46524,
      "f": 0,
      "p": 1756,
      "d": 0,
      "i": "    attempt.status === \"rejected\" ? [`${entries[index][0]}: ${String(attempt.reason)}`] : []\n"
    },
    {
      "t": 48086,
      "f": 0,
      "p": 1849,
      "d": 0,
      "i": "  );\n"
    },
    {
      "t": 48264,
      "f": 0,
      "p": 1854,
      "d": 0,
      "i": "  if (failures.length) throw new Error(`Council incomplete. No auto-retry. ${failures.join(\" | \")}`);\n"
    },
    {
      "t": 49967,
      "f": 0,
      "p": 1956,
      "d": 0,
      "i": "  return Object.fromEntries(attempts.map((attempt) => (attempt as PromiseFulfilledResult<readonly [MemberId, string]>).value)) as CouncilAnswers;\n"
    },
    {
      "t": 52361,
      "f": 0,
      "p": 2102,
      "d": 0,
      "i": "}\n"
    },
    {
      "t": 52493,
      "f": 0,
      "p": 2104,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 52609,
      "f": 0,
      "p": 2105,
      "d": 0,
      "i": "export { required };\n"
    },
    {
      "t": 53039,
      "stop": {
        "title": "Knowledge check",
        "q": "Are four same-model roles equivalent to four model providers?",
        "options": [
          "Yes, because both produce four answers",
          "No \u2014 role diversity is not provider or model diversity"
        ],
        "correct": 1,
        "explain": "Output count does not tell you whether the underlying models differ. The bridge keeps the four fixed model IDs in a server-side map."
      }
    },
    {
      "t": 53239,
      "say": "Promise.allSettled launches all four before it waits. Every call gets the same trimmed prompt and no member answer. Any failure \u2192 \"Council incomplete\", no auto-retry, nonzero exit."
    },
    {
      "t": 62239,
      "chapter": "Judge"
    },
    {
      "t": 62239,
      "say": "The judge receives the four completed answers, has tools: [], and a JSON schema for its output. The **host**, not the prompt, enforces the 75-word limit."
    },
    {
      "t": 70624,
      "tab": 1
    },
    {
      "t": 71124,
      "f": 1,
      "p": 0,
      "d": 0,
      "i": "import { query } from \"@anthropic-ai/claude-agent-sdk\";\n"
    },
    {
      "t": 72104,
      "f": 1,
      "p": 56,
      "d": 0,
      "i": "import { z } from \"zod\";\n"
    },
    {
      "t": 72596,
      "f": 1,
      "p": 81,
      "d": 0,
      "i": "import { consultCouncil, required } from \"./council-bridge.ts\";\n"
    },
    {
      "t": 73702,
      "f": 1,
      "p": 145,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 73818,
      "f": 1,
      "p": 146,
      "d": 0,
      "i": "const question = \"An outdoor workshop has 24 participants. Each table seats 6 people. How many tables are needed? Explain the calculation in one sentence.\";\n"
    },
    {
      "t": 76385,
      "f": 1,
      "p": 303,
      "d": 0,
      "i": "const CouncilResult = z.object({\n"
    },
    {
      "t": 77004,
      "f": 1,
      "p": 336,
      "d": 0,
      "i": "  summary: z.string().trim().min(1),\n"
    },
    {
      "t": 77685,
      "f": 1,
      "p": 373,
      "d": 0,
      "i": "  agreementScores: z.object({\n"
    },
    {
      "t": 78256,
      "f": 1,
      "p": 403,
      "d": 0,
      "i": "    claude: z.number().int().min(0).max(100),\n"
    },
    {
      "t": 79079,
      "f": 1,
      "p": 449,
      "d": 0,
      "i": "    grok: z.number().int().min(0).max(100),\n"
    },
    {
      "t": 79871,
      "f": 1,
      "p": 493,
      "d": 0,
      "i": "    kimi: z.number().int().min(0).max(100),\n"
    },
    {
      "t": 80662,
      "f": 1,
      "p": 537,
      "d": 0,
      "i": "    openai: z.number().int().min(0).max(100)\n"
    },
    {
      "t": 81469,
      "f": 1,
      "p": 582,
      "d": 0,
      "i": "  })\n"
    },
    {
      "t": 81648,
      "f": 1,
      "p": 587,
      "d": 0,
      "i": "});\n"
    },
    {
      "t": 81811,
      "f": 1,
      "p": 591,
      "d": 0,
      "i": "const schema = z.toJSONSchema(CouncilResult, { target: \"draft-7\" });\n"
    },
    {
      "t": 82995,
      "f": 1,
      "p": 660,
      "d": 0,
      "i": "const wordCount = (text: string) => text.trim() ? text.trim().split(/\\s+/).length : 0;\n"
    },
    {
      "t": 84462,
      "f": 1,
      "p": 747,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 84578,
      "f": 1,
      "p": 748,
      "d": 0,
      "i": "let resultSeen = false;\n"
    },
    {
      "t": 85055,
      "f": 1,
      "p": 772,
      "d": 0,
      "i": "try {\n"
    },
    {
      "t": 85249,
      "f": 1,
      "p": 778,
      "d": 0,
      "i": "  required(\"ANTHROPIC_API_KEY\");\n"
    },
    {
      "t": 85868,
      "f": 1,
      "p": 811,
      "d": 0,
      "i": "  const answers = await consultCouncil(question);\n"
    },
    {
      "t": 86754,
      "f": 1,
      "p": 861,
      "d": 0,
      "i": "  console.log(\"[member answers]\", answers);\n"
    },
    {
      "t": 87545,
      "f": 1,
      "p": 905,
      "d": 0,
      "i": "  const judgePrompt = [\n"
    },
    {
      "t": 88022,
      "f": 1,
      "p": 929,
      "d": 0,
      "i": "    \"Judge these four independent answers to the stated question. Use evidence and accuracy, not majority vote.\",\n"
    },
    {
      "t": 89914,
      "f": 1,
      "p": 1043,
      "d": 0,
      "i": "    \"Return only the requested JSON. summary directly answers the question in at most 75 words. Do not quote the member answers.\",\n"
    },
    {
      "t": 92072,
      "f": 1,
      "p": 1174,
      "d": 0,
      "i": "    \"Each agreementScores value is an integer from 0 to 100 for that member's agreement with the summary's factual conclusions. Judge agreement through correctness and relevance to the question, never writing style or confidence. A score describes answer-to-summary agreement. It is not a calibrated claim that the summary is true.\",\n"
    },
    {
      "t": 97421,
      "f": 1,
      "p": 1508,
      "d": 0,
      "i": "    `Question: ${question}`,\n"
    },
    {
      "t": 97976,
      "f": 1,
      "p": 1537,
      "d": 0,
      "i": "    `Answers: ${JSON.stringify(answers)}`\n"
    },
    {
      "t": 98736,
      "f": 1,
      "p": 1579,
      "d": 0,
      "i": "  ].join(\"\\n\\n\");\n"
    },
    {
      "t": 99119,
      "f": 1,
      "p": 1597,
      "d": 0,
      "i": "\n"
    },
    {
      "t": 99235,
      "f": 1,
      "p": 1598,
      "d": 0,
      "i": "  for await (const message of query({\n"
    },
    {
      "t": 99932,
      "f": 1,
      "p": 1636,
      "d": 0,
      "i": "    prompt: judgePrompt,\n"
    },
    {
      "t": 100425,
      "f": 1,
      "p": 1661,
      "d": 0,
      "i": "    options: { model: \"claude-opus-5\", tools: [], outputFormat: { type: \"json_schema\", schema }, maxTurns: 3 }\n"
    },
    {
      "t": 102269,
      "f": 1,
      "p": 1772,
      "d": 0,
      "i": "  })) {\n"
    },
    {
      "t": 102495,
      "f": 1,
      "p": 1780,
      "d": 0,
      "i": "    if (message.type !== \"result\") continue;\n"
    },
    {
      "t": 103302,
      "f": 1,
      "p": 1825,
      "d": 0,
      "i": "    resultSeen = true;\n"
    },
    {
      "t": 103764,
      "f": 1,
      "p": 1848,
      "d": 0,
      "i": "    if (message.subtype !== \"success\") throw new Error(`Judge SDK result: ${message.subtype}`);\n"
    },
    {
      "t": 105372,
      "f": 1,
      "p": 1944,
      "d": 0,
      "i": "    const result = CouncilResult.parse(message.structured_output);\n"
    },
    {
      "t": 106525,
      "f": 1,
      "p": 2011,
      "d": 0,
      "i": "    if (wordCount(result.summary) > 75) throw new Error(\"Judge summary exceeds 75 words\");\n"
    },
    {
      "t": 108055,
      "f": 1,
      "p": 2102,
      "d": 0,
      "i": "    console.log(result);\n"
    },
    {
      "t": 108548,
      "f": 1,
      "p": 2127,
      "d": 0,
      "i": "  }\n"
    },
    {
      "t": 108711,
      "f": 1,
      "p": 2131,
      "d": 0,
      "i": "  if (!resultSeen) throw new Error(\"Judge ended without a result\");\n"
    },
    {
      "t": 109879,
      "f": 1,
      "p": 2199,
      "d": 0,
      "i": "} catch (error) {\n"
    },
    {
      "t": 110262,
      "f": 1,
      "p": 2217,
      "d": 0,
      "i": "  console.error(\"Council failed:\", error);\n"
    },
    {
      "t": 111038,
      "f": 1,
      "p": 2260,
      "d": 0,
      "i": "  process.exitCode = 1;\n"
    },
    {
      "t": 111515,
      "f": 1,
      "p": 2284,
      "d": 0,
      "i": "}\n"
    },
    {
      "t": 111646,
      "chapter": "Run"
    },
    {
      "t": 111646,
      "say": "Run only after reviewing cost and data handling: four Gateway requests plus a judge run."
    },
    {
      "t": 117106,
      "out": "node council.ts",
      "cls": "cmd"
    },
    {
      "t": 117806,
      "out": "[member answers] {",
      "cls": "dim"
    },
    {
      "t": 118706,
      "out": "  claude: \"Four tables are needed: 24 \u00f7 6 = 4.\"",
      "cls": "tool"
    },
    {
      "t": 119306,
      "out": "  grok: \"You need 4 tables, since 24 divided by 6 equals 4.\"",
      "cls": "tool"
    },
    {
      "t": 119906,
      "out": "  kimi: \"4 tables \u2014 24 participants / 6 seats = 4.\"",
      "cls": "tool"
    },
    {
      "t": 120506,
      "out": "  openai: \"Four tables: 24 \u00f7 6 = 4 exactly.\"",
      "cls": "tool"
    },
    {
      "t": 121206,
      "out": "}",
      "cls": "dim"
    },
    {
      "t": 122206,
      "out": "{",
      "cls": "res"
    },
    {
      "t": 122506,
      "out": "  summary: \"Four tables are needed because 24 participants divided by 6 seats per table equals 4.\",",
      "cls": "res"
    },
    {
      "t": 122906,
      "out": "  agreementScores: { claude: 100, grok: 100, kimi: 100, openai: 100 }",
      "cls": "res"
    },
    {
      "t": 123306,
      "out": "}",
      "cls": "res"
    },
    {
      "t": 124506,
      "say": "Read [member answers] first: four keys, each answering the identical question. Only then the judge result \u2014 with the shape the schema demands."
    },
    {
      "t": 132396,
      "chapter": "Failure"
    },
    {
      "t": 132396,
      "say": "Now an unavailable provider."
    },
    {
      "t": 135156,
      "clear": true
    },
    {
      "t": 135356,
      "out": "node council.ts",
      "cls": "cmd"
    },
    {
      "t": 136056,
      "out": "Council failed: Error: Council incomplete. No auto-retry. kimi: Error: moonshotai/kimi-k3 returned HTTP 404",
      "cls": "err"
    },
    {
      "t": 137456,
      "out": "exit code 1",
      "cls": "dim"
    },
    {
      "t": 138256,
      "say": "The host does not ask Claude to fill in the missing member. An incomplete council is reported as incomplete \u2014 other in-flight requests may still finish and bill."
    },
    {
      "t": 147001,
      "chapter": "Exit challenge"
    },
    {
      "t": 147001,
      "stop": {
        "title": "Exit challenge",
        "q": "Change exactly one rule \u2014 for example, ask the judge to name one unresolved disagreement. Predict the trace change before editing. What evidence would prove it worked?",
        "explain": "The judge output changes; the member answers do not. If the schema doesn't allow the new field, CouncilResult.parse throws \u2014 that is the code-enforced constraint doing its job."
      }
    }
  ],
  "duration": 148701,
  "audio": null,
  "builtin": true
});
export default lesson;
