# Workshop 4: support agents with the Agent SDK

Build a support workflow in three lessons with the TypeScript Agent SDK and `query()`. Start with one agent and project instructions, then delegate to specialists, then add a transaction lookup through MCP.

## Get the package

Clone the sparse workshop package and install its dependencies:

```sh
git clone --depth 1 --filter=blob:none --sparse https://github.com/RyanLisse/aetherlink-academy-app.git w4-support
cd w4-support && git sparse-checkout set training-lab/w4-support-agent-sdk
cd training-lab/w4-support-agent-sdk && npm install
npm run lesson1 -- MSG-01 --dry-run
```

The dry run prints the prompt and resolved SDK options. It does not call a model and is not model evidence.

Set `ANTHROPIC_API_KEY` in your shell before a real run. Do not put the key in a file. `npm install` installs the Agent SDK; it does not run a lesson or start an agent.

## Lesson 1: one agent and `CLAUDE.md`

Open `01-single-agent/claude-project/CLAUDE.md`. The main session reads the project instructions through `settingSources: ['project']` and classifies each customer message itself.

Run one message, then try another:

```sh
npm run lesson1 -- MSG-01
npm run lesson1 -- MSG-06
```

To test the tone trap, temporarily remove the `## Priority definitions` section from `01-single-agent/claude-project/CLAUDE.md`. Rerun `MSG-01` and `MSG-06`, then restore the original file:

```sh
git restore 01-single-agent/claude-project/CLAUDE.md
```

Compare the results. Angry wording should not determine impact.

## Lesson 2: orchestrator and subagents

Open `02-subagents/claude-project/CLAUDE.md`. The main agent delegates priority analysis to `ticket-analyst`, then delegates the reply draft to `email-responder`. It writes the combined result to `02-subagents/claude-project/output/`.

Run a message and follow the trace:

```sh
npm run lesson2 -- MSG-05
```

Look for `Agent → ticket-analyst`, then `Agent → email-responder`. Open the Markdown file in `02-subagents/claude-project/output/`. Run `MSG-10` to see how the analyst reports missing information.

## Lesson 3: MCP and transaction data

The transaction MCP server and workbook live outside `03-mcp/claude-project`. Install the server's dependencies once:

```sh
cd 03-mcp/transaction-mcp && npm install
```

This command installs packages only. It does not start `server.js`. The Agent SDK starts the server on demand over stdio when a query uses the transaction tool.

Run messages with transaction IDs:

```sh
npm run lesson3 -- MSG-08
npm run lesson3 -- MSG-07
npm run lesson3 -- MSG-09
```

Look for the `mcp → mcp__transactions__get_transaction` trace and the `External data:` line in the result. The transaction analyst sees lookup results through the tool. It does not read the workbook.

The data flow is:

`Excel data → server.js → MCP tool (get_transaction) → Agent SDK query() → ticket-analyst`

## Compare the n8n and SDK workflows

| n8n | Agent SDK workshop |
| --- | --- |
| AI Agent node | `query()` |
| System message | `CLAUDE.md` loaded by `settingSources` |
| Risk and Customer Reply agents | `ticket-analyst` and `email-responder` in `agents` |
| Tool or HTTP node | MCP `get_transaction` |
| Human gate | Draft in `output/` for review |

The workshop keeps the same priority labels, specialist split, and human review gate as Workshop 3. It uses different customer messages.

## Facilitate each lesson

Use the same rhythm for each lesson: explain, demonstrate, let participants try, then discuss. Ask:

- What does the main agent know?
- What belongs to a subagent?
- When is a tool needed?
- What information came from external data?

Pause after each run so participants can read the prompt, trace, tool result, or saved draft before moving on.
