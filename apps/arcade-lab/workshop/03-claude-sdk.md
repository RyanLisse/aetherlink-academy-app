# Guided lesson: a Claude Agent SDK weather agent and four-model council

Work in pairs. One person types. The other predicts the output, watches the trace, and challenges any claim the trace does not support. The first exercise has fixed data. The second preserves Eve's four independent providers and uses Claude only as the judge.

**Runtime status.** These snippets are source-backed and runtime-unverified here. No dependency was installed and no model was called. The weather fixture and its test cost nothing. Running `weather.ts` does make an Anthropic model request. A council run makes exactly four Gateway member requests, plus an Agent SDK judge run whose model-request count can vary with turns and structured-output retries.

## Before you start

Use Node.js 24, matching Eve's current project baseline. The Agent SDK itself requires Node.js 18 or later. You also need an Anthropic account and an API key available to the process as `ANTHROPIC_API_KEY`. The council needs `AI_GATEWAY_API_KEY` too.

Store both values in your terminal, editor, or hosting platform's protected secret settings. Start the terminal with those settings injected. Do not paste `export ...="key"` commands into shell history, code, or git.

```sh
mkdir first-agent && cd first-agent
npm init -y
npm pkg set type=module
npm install @anthropic-ai/claude-agent-sdk@0.3.278 zod@4
test -n "$ANTHROPIC_API_KEY" || { echo "Set ANTHROPIC_API_KEY in secret settings"; exit 1; }
```

The SDK reads the process environment and does not load `.env` files itself. [Official quickstart](https://code.claude.com/docs/en/agent-sdk/quickstart.md).

## Lesson 1: weather with a deterministic fixture

**Goal.** Teach a first tool call with data everybody can verify. This is simulated weather, not a forecast. The fixture always returns `72°F` and `Sunny`; the Claude agent that chooses and explains the tool call is still a paid API request.

1. Create `weather-fixture.ts`.

```ts
export type Weather = {
  city: string;
  temperatureF: 72;
  condition: "Sunny";
  summary: string;
};

export function weatherFor(city: string): Weather {
  if (!city.trim()) throw new Error("city is required");
  return {
    city,
    temperatureF: 72,
    condition: "Sunny",
    summary: `Sunny in ${city} with a light breeze.`
  };
}
```

2. Create `weather.ts`. `tool()` plus `createSdkMcpServer()` is the documented in-process MCP pattern. `tools: []` removes every built-in tool, leaving only the explicitly approved weather capability. [Custom tools](https://code.claude.com/docs/en/agent-sdk/custom-tools.md).

```ts
import { createSdkMcpServer, query, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { weatherFor } from "./weather-fixture.ts";

const city = process.argv.slice(2).join(" ").trim();

const getWeather = tool(
  "get_weather",
  "Return the fixed teaching weather for one non-empty city. This is fixture data.",
  { city: z.string().trim().min(1).describe("City name") },
  async ({ city }) => {
    const weather = weatherFor(city);
    console.log("[tool result]", weather);
    return { content: [{ type: "text", text: JSON.stringify(weather) }], structuredContent: weather };
  }
);

const weatherServer = createSdkMcpServer({ name: "weather", version: "1.0.0", tools: [getWeather] });

let resultSeen = false;
try {
  for await (const message of query({
    prompt: city ? `What is the weather in ${city}?` : "What is the weather?",
    options: {
      systemPrompt: "You are a concise weather teaching assistant. If no city is supplied, ask for one and do not call a tool. If a city is supplied, call get_weather before answering, call it once, and say the result is simulated fixture data.",
      mcpServers: { weather: weatherServer },
      tools: [],
      allowedTools: ["mcp__weather__get_weather"],
      permissionMode: "dontAsk",
      maxTurns: 3
    }
  })) {
    if (message.type === "assistant") {
      for (const block of message.message.content) {
        if (block.type === "tool_use") console.log("[tool call]", block.name, block.input);
      }
    } else if (message.type === "result") {
      resultSeen = true;
      if (message.subtype !== "success") throw new Error(`SDK result: ${message.subtype}`);
      console.log("[answer]", message.result);
    }
  }
  if (!resultSeen) throw new Error("SDK ended without a result");
} catch (error) {
  console.error("Weather agent failed:", error);
  process.exitCode = 1;
}
```

3. Run the supplied-city path.

```sh
node weather.ts Amsterdam
```

**Check.** The trace must include a `mcp__weather__get_weather` tool call and a tool result containing `temperatureF: 72` and `condition: "Sunny"`. The final wording can vary. It must label the result as simulated fixture data.

4. Run the missing-city behavioral check.

```sh
node weather.ts
```

**Check.** The answer asks for a city. The trace must have no weather tool call or tool result. This check costs a model request.

5. Create the no-model failure test as `weather-fixture.test.ts`.

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { weatherFor } from "./weather-fixture.ts";

test("returns the fixed Amsterdam fixture", () => {
  assert.deepEqual(weatherFor("Amsterdam"), {
    city: "Amsterdam",
    temperatureF: 72,
    condition: "Sunny",
    summary: "Sunny in Amsterdam with a light breeze."
  });
});

test("rejects a missing city", () => {
  assert.throws(() => weatherFor("   "), /city is required/);
});
```

Run `node --test weather-fixture.test.ts`. Expected output is two passing tests. This proves the trust boundary before a model sees the tool.

**Ask your partner.** Which evidence proves the fixed temperature? The `[tool result]` trace, not the fluent final answer.

## Lesson 2: Claude-only agent versus provider parity

The weather agent is a Claude Agent SDK lesson. The SDK's `model` option accepts a Claude alias or full Claude model name. It does not provide a documented cross-provider routing field for OpenAI, Grok, or Kimi. [TypeScript reference](https://code.claude.com/docs/en/agent-sdk/typescript.md), [subagents](https://code.claude.com/docs/en/agent-sdk/subagents.md).

The SDK accepts either a string or an `AsyncIterable<SDKUserMessage>` prompt. This one-turn CLI uses the simpler string form, matching Anthropic's custom-tools example. Use streaming input only when you add a multi-turn interactive UI with queued messages, interruption, or session persistence. [Custom tools](https://code.claude.com/docs/en/agent-sdk/custom-tools.md), [streaming input](https://code.claude.com/docs/en/agent-sdk/streaming-vs-single-mode.md).

The next lesson preserves provider parity outside the agent loop. It does **not** reproduce Eve's durable child sessions or individual child-response streaming. It preserves the four model IDs, the identical question, independent answers, and a Claude judge.

## Lesson 3: deterministic four-provider Gateway fan-out

Before a live run, inject `AI_GATEWAY_API_KEY` through protected secret settings and confirm the workshop spend limit. The bridge sends one identical question to each model once. It has a 30-second network timeout, no automatic retry, and treats any member failure as a partial, unusable council. Other in-flight requests may still finish and bill after the first failure.

Create `council-bridge.ts`.

```ts
const members = {
  claude: "anthropic/claude-opus-5",
  grok: "spacexai/grok-4.7",
  kimi: "moonshotai/kimi-k3",
  openai: "openai/gpt-5.6-sol"
} as const;

export type MemberId = keyof typeof members;
export type CouncilAnswers = Record<MemberId, string>;

function required(name: "AI_GATEWAY_API_KEY" | "ANTHROPIC_API_KEY"): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}; configure protected secret settings first.`);
  return value;
}

async function askGateway(model: string, question: string, apiKey: string): Promise<string> {
  const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(30_000),
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "user", content: question }] })
  });
  if (!response.ok) throw new Error(`${model} returned HTTP ${response.status}`);
  const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const answer = body.choices?.[0]?.message?.content;
  if (typeof answer !== "string" || !answer.trim()) throw new Error(`${model} returned no text`);
  return answer;
}

export async function consultCouncil(question: string): Promise<CouncilAnswers> {
  const prompt = question.trim();
  if (!prompt) throw new Error("question is required");
  const apiKey = required("AI_GATEWAY_API_KEY");
  const entries = Object.entries(members) as Array<[MemberId, string]>;
  const attempts = await Promise.allSettled(entries.map(async ([member, model]) =>
    [member, await askGateway(model, prompt, apiKey)] as const
  ));
  const failures = attempts.flatMap((attempt, index) =>
    attempt.status === "rejected" ? [`${entries[index][0]}: ${String(attempt.reason)}`] : []
  );
  if (failures.length) throw new Error(`Council incomplete. No auto-retry. ${failures.join(" | ")}`);
  return Object.fromEntries(attempts.map((attempt) => (attempt as PromiseFulfilledResult<readonly [MemberId, string]>).value)) as CouncilAnswers;
}

export { required };
```

**Check.** `Promise.allSettled` launches all four functions before it waits. Every `askGateway` receives the same trimmed `prompt`, exactly one fixed model ID, and no member answer. This host code, rather than a model prompt, guarantees the four calls.

## Lesson 4: tool-free Claude judge with enforced output checks

Create `council.ts`. The host completes the four-member fan-out first. Claude receives the four completed answers in its judge prompt and has `tools: []`, so it cannot make another provider call, alter the question, or turn a partial failure into a result.

```ts
import { query } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { consultCouncil, required } from "./council-bridge.ts";

const question = "An outdoor workshop has 24 participants. Each table seats 6 people. How many tables are needed? Explain the calculation in one sentence.";
const CouncilResult = z.object({
  summary: z.string().trim().min(1),
  agreementScores: z.object({
    claude: z.number().int().min(0).max(100),
    grok: z.number().int().min(0).max(100),
    kimi: z.number().int().min(0).max(100),
    openai: z.number().int().min(0).max(100)
  })
});
const schema = z.toJSONSchema(CouncilResult, { target: "draft-7" });
const wordCount = (text: string) => text.trim() ? text.trim().split(/\s+/).length : 0;

let resultSeen = false;
try {
  required("ANTHROPIC_API_KEY");
  const answers = await consultCouncil(question);
  console.log("[member answers]", answers);
  const judgePrompt = [
    "Judge these four independent answers to the stated question. Use evidence and accuracy, not majority vote.",
    "Return only the requested JSON. summary directly answers the question in at most 75 words. Do not quote the member answers.",
    "Each agreementScores value is an integer from 0 to 100 for that member's agreement with the summary's factual conclusions. Judge agreement through correctness and relevance to the question, never writing style or confidence. A score describes answer-to-summary agreement. It is not a calibrated claim that the summary is true.",
    `Question: ${question}`,
    `Answers: ${JSON.stringify(answers)}`
  ].join("\n\n");

  for await (const message of query({
    prompt: judgePrompt,
    options: { model: "claude-opus-5", tools: [], outputFormat: { type: "json_schema", schema }, maxTurns: 3 }
  })) {
    if (message.type !== "result") continue;
    resultSeen = true;
    if (message.subtype !== "success") throw new Error(`Judge SDK result: ${message.subtype}`);
    const result = CouncilResult.parse(message.structured_output);
    if (wordCount(result.summary) > 75) throw new Error("Judge summary exceeds 75 words");
    console.log(result);
  }
  if (!resultSeen) throw new Error("Judge ended without a result");
} catch (error) {
  console.error("Council failed:", error);
  process.exitCode = 1;
}
```

The judge explicitly uses `claude-opus-5`, the Anthropic full model name corresponding to the council member's Gateway ID `anthropic/claude-opus-5`. The SDK documents `model` as a Claude alias or full model name. [TypeScript reference](https://code.claude.com/docs/en/agent-sdk/typescript.md).

Run only after reviewing cost and data handling.

```sh
node council.ts
```

**Check.** Read `[member answers]` before accepting the judge result. It must show four keys, each answering the identical trimmed question. Four tables is the correct conclusion because `24 / 6 = 4`. The exact summary and scores vary. The output must have this shape, and the code rejects a summary longer than 75 words.

```json
{
  "summary": "Four tables are needed because 24 participants divided by 6 seats per table equals 4.",
  "agreementScores": { "claude": 100, "grok": 100, "kimi": 100, "openai": 100 }
}
```

If any Gateway member fails, the host prints `Council incomplete` and exits nonzero. It does not ask Claude to fill in the missing member. If the Agent SDK has a non-success result, no result, invalid JSON, or an overlong summary, the judge path exits nonzero.

## What to carry into a real product

Use the weather fixture before a live data API. Keep provider model IDs in a fixed server-side map. Keep secrets in protected settings. Add a spend budget, consent UI, audit log, and a cancellation strategy before putting the council in front of users.

### Sources

- [Claude Agent SDK quickstart](https://code.claude.com/docs/en/agent-sdk/quickstart.md)
- [Claude custom MCP tools](https://code.claude.com/docs/en/agent-sdk/custom-tools.md)
- [Claude streaming input](https://code.claude.com/docs/en/agent-sdk/streaming-vs-single-mode.md)
- [Claude permissions](https://code.claude.com/docs/en/agent-sdk/permissions.md)
- [Claude structured output](https://code.claude.com/docs/en/agent-sdk/structured-outputs.md)
- [Vercel AI Gateway API quickstart](https://vercel.com/docs/ai-gateway/getting-started)
- [Eve council source, pinned `dea2ced59e8c7ed5a41b9a1c432f5fcd080999d9`](https://github.com/vercel/eve/tree/dea2ced59e8c7ed5a41b9a1c432f5fcd080999d9/apps/templates/eve-llm-council-template)
