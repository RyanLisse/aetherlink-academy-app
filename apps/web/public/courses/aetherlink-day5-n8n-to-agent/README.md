# Optional parity bonus · n8n triage to a Claude Agent SDK

**AetherLink Academy · standalone companion to Workshop 4 · not a required Workshop 4 lesson**

This optional exercise compares an n8n support-triage flow with an agent on the
[**Claude Agent SDK**](https://github.com/anthropics/claude-agent-sdk-typescript)
— `systemPrompt` · `prompt` · tools/subagents · markdown memory · `maxTurns`.
It uses this course's own fixtures to explore parity; its fixtures are separate
from Workshop 4's required customer messages and transaction workbook. Complete
the three required lessons in `training-lab/w4-support-agent-sdk`.

Attendee path: **[SOLO.md](SOLO.md)** (SOLO 0 → 4). Pedagogy: Uitleg → Voordoen → Zelf doen.

## Quick start

```bash
git clone https://github.com/RyanLisse/aetherlink-day5-n8n-to-agent.git
cd aetherlink-day5-n8n-to-agent
git switch -c work/<your-name>
npm install                            # Node 20+
npm test                               # includes n8n source pins
npm run triage -- fixtures/ticket.json --dry-run   # offline, no key
```

This course is linked from Academy **`/workshop/4`** as an optional companion.
Do not download ZIPs, credentials, or customer data.

## The four fundamentals

| Fundamental | n8n | Claude Agent SDK |
| --- | --- | --- |
| System message | AI Agent → System Message | `options.systemPrompt` |
| Prompt | AI Agent → Prompt `{{ $json.… }}` | `prompt` |
| Tools | Customer Reply Agent, Risk Agent | `options.tools: ["Agent"]` + `options.agents` |
| Memory | Simple Memory (static keys) | `memory/*.md` rendered into `prompt` |

```ts
for await (const message of query({
  prompt: `${buildTriagePrompt(ticket)}\n\n${renderMemory(memory)}`,
  options: {
    systemPrompt: COORDINATOR_SYSTEM,
    tools: ["Agent"], allowedTools: ["Agent"],
    agents: createSpecialistAgents(),
    outputFormat: { type: "json_schema", schema: DECISION_SCHEMA },
    permissionMode: "dontAsk", settingSources: [],
    maxTurns: 8,
  },
})) { /* stream → trace → validate → route → memory */ }
```

Side by side: [`docs/fundamentals.md`](docs/fundamentals.md) ·
example run: [`docs/examples/live-run-wl-1026.json`](docs/examples/live-run-wl-1026.json).

## Layout

```text
SOLO.md                     attendee path (0–4)
n8n/support-triage.json     source flow (sanitized export) — parity SoT
fixtures/                   WL-1026, WL-1027, adversarial, malformed
fixtures/expected-labels.json   shared L/M/H acceptance with Workshop 3
src/prompts.ts              system message + prompt
src/tools.ts                Reply / Risk subagents
src/memory.ts               markdown memory
src/agent.ts                query() loop + maxTurns
src/runtime.ts              SDK or offline fake
src/cli.ts                  npm run triage
src/contract.ts · router.ts types, schema, routes, checks
src/check.ts                shape/routing checker (not business approval)
memory/MEMORY.md            team lessons the agent reads
.claude/agents/             same specialists as Claude Code files
test/                       node:test suites
```

## Runtimes

| `AGENT_MODEL` | Needs | Use |
| --- | --- | --- |
| `offline` (default) | nothing | whole room; scripted, **not model evidence** |
| `sonnet`, `opus`, `haiku`, or a full model id | `ANTHROPIC_API_KEY` in the shell | real SDK run (a few cents) |

The SDK reads the key from the environment and does not load `.env` files.

## Safety

Fictional data only. Nothing is sent, refunded, escalated, or written to n8n,
GitHub, or a CRM. Coordinator may only use the `Agent` tool; specialists have
no tools. Every result has `draft_only: true` and `human_approval_required: true`.
A checker PASS is never business approval. Keys never go into files, prompts, or commits.

## Interactive course

`course/` is a self-contained HTML course (5 modules) that follows one ticket,
WL-1026, through the n8n node graph and through this TypeScript agent: the
four fundamentals, subagents, the loop budget, the contract, routes and memory.
Quizzes, animations and code ↔ plain-English translations; no build step or
server needed.

```bash
open course/index.html          # read it
(cd course && bash build.sh)    # rebuild after editing course/modules/*.html
```

## Related

- [Claude Agent SDK (TypeScript)](https://github.com/anthropics/claude-agent-sdk-typescript) · [quickstart](https://code.claude.com/docs/en/agent-sdk/quickstart)
- Academy Workshop 4 deck: `/workshop/4`
- Optional parity practice using this course's own fixtures; not Workshop 4's acceptance set
