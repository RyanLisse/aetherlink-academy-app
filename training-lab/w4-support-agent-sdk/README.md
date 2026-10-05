# Workshop 4: support agents with the Agent SDK

Build a support workflow in three lessons with the TypeScript Agent SDK and `query()`. Start with one agent and project instructions, then delegate to specialists, then add a transaction lookup through MCP.

## What you need

- Node.js 22 or newer (`node --version`) and Git.
- An Anthropic API key for real runs. Dry runs, the MCP smoke test, and the label check work without a key.
- About 90 minutes. You do not need the Academy site or a facilitator; this README is the full guide.

## Get the package

Fetch only this folder from the Academy repository, then install. The commands are the same in macOS/Linux terminals, PowerShell, and Command Prompt:

```sh
git clone --depth 1 --filter=blob:none --sparse https://github.com/RyanLisse/aetherlink-academy-app.git w4-support
cd w4-support
git sparse-checkout set training-lab/w4-support-agent-sdk
cd training-lab/w4-support-agent-sdk
npm install
```

`npm install` installs the Agent SDK and, through `postinstall`, the transaction MCP server dependencies for Lesson 3. It does not start a lesson, an agent, or the MCP server.

Check the setup without a model:

```sh
npm run lesson1 -- MSG-01 --dry-run
npm run smoke:mcp
```

The dry run prints the prompt and the resolved SDK options and ends with `dry run — no model call, not model evidence`. The smoke test starts the MCP server over stdio, looks up `TX-1014`, prints the record, and ends with `MCP server OK — no model was called.`

## Set your API key for real runs

Set the key in the terminal where you run the lessons. Do not put it in a file, a commit, or a chat.

| Shell | Command |
| --- | --- |
| macOS/Linux | `export ANTHROPIC_API_KEY=sk-ant-...` |
| Windows PowerShell | `$env:ANTHROPIC_API_KEY = "sk-ant-..."` |
| Windows Command Prompt | `set ANTHROPIC_API_KEY=sk-ant-...` |

Without the key a real run stops with `Set ANTHROPIC_API_KEY in this shell before running a lesson.`

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

Check your labels for `MSG-01` to `MSG-06` (see [Check your work](#check-your-work)).

## Lesson 2: orchestrator and subagents

Open `02-subagents/claude-project/CLAUDE.md`. The main agent delegates priority analysis to `ticket-analyst`, then delegates the reply draft to `email-responder`. It writes the combined result to `02-subagents/claude-project/output/`.

Run a message and follow the trace:

```sh
npm run lesson2 -- MSG-05
```

Look for `Agent → ticket-analyst`, then `Agent → email-responder`. Open the Markdown file in `02-subagents/claude-project/output/`. Run `MSG-10` to see how the analyst reports missing information.

## Lesson 3: MCP and transaction data

The transaction MCP server and workbook live outside `03-mcp/claude-project`. `npm install` already installed the server's dependencies. It did not start `server.js`: the Agent SDK starts the server on demand over stdio when a query uses the transaction tool.

Test the server first. This calls no model:

```sh
npm run smoke:mcp
```

Run messages with transaction IDs:

```sh
npm run lesson3 -- MSG-08
npm run lesson3 -- MSG-07
npm run lesson3 -- MSG-09
```

Look for the `mcp → mcp__transactions__get_transaction` trace and the `External data:` line in the result. The transaction analyst sees lookup results through the tool. It does not read the workbook.

The data flow is:

`Excel data → server.js → MCP tool (get_transaction) → Agent SDK query() → ticket-analyst`

### Part 2: let a subagent change records

The same server also has tools to list, add, update and delete transactions. Only the `transaction-clerk` subagent gets them, and only for a prompt that starts with `Staff instruction:`. The `ticket-analyst` still has `get_transaction` only, so a customer message cannot change a record.

```sh
npm run clerk -- "List all PENDING transactions."
npm run clerk -- "Add a transaction for Nova Bikes: 89.90 EUR, PENDING, 2026-10-01, issue details: customer asked for an invoice copy."
npm run clerk -- "Set the status of TX-1003 to COMPLETED."
npm run clerk -- "Delete TX-1012."
npm run reset:mcp
```

The commands are the same in PowerShell and Command Prompt; use `npm.cmd` in PowerShell if `npm` is blocked.

- Reads (`list_transactions`, `get_transaction`) are in `allowedTools`, so they run without asking.
- Every add, update and delete stops at `Allow this change? [y/N]`. That prompt comes from the `canUseTool` callback in `03-mcp/approval.mjs`. Answer `n` once to see the clerk report that nothing was written, then run the command again and answer `y`.
- Changes go to `03-mcp/data/transactions.working.json`. The workbook is never written. `npm run reset:mcp` deletes the working copy, so the next run starts from `transactions.xlsx` again.
- `npm run smoke:mcp` runs the same list, add, update and delete calls against a temporary copy, without a model.

### What this lesson teaches about MCP

- **The server owns the data.** The agent only sees what a tool returns, and the server assigns new transaction IDs.
- **The input schema is the contract.** Each tool declares its fields with zod. A wrong ID format or a missing field is rejected before the tool runs, and an `isError` result (for example `No transaction TX-9999 in the data`) lets the agent recover instead of guessing.
- **Tool names are namespaced.** The Agent SDK calls the tools `mcp__<server>__<tool>`, such as `mcp__transactions__delete_transaction`.
- **Annotations describe; the host enforces.** `readOnlyHint`, `destructiveHint` and `idempotentHint` tell a client what a tool does. They do not block anything.
- **Enforcement lives in the Agent SDK options.** Each subagent gets only the tools it needs (least privilege), `allowedTools` lets reads run, and `canUseTool` makes a person approve each write.
- **Practice data stays safe.** Writes go to a working copy that you can reset.

## Compare the n8n and SDK workflows

| n8n | Agent SDK workshop |
| --- | --- |
| AI Agent node | `query()` |
| System message | `CLAUDE.md` loaded by `settingSources` |
| Risk and Customer Reply agents | `ticket-analyst` and `email-responder` in `agents` |
| Tool or HTTP node | MCP transaction tools (`get_transaction` for the analyst; list, add, update and delete for the clerk) |
| Human gate | Draft in `output/` for review; a person approves each record change |

The workshop keeps the same priority labels, specialist split, and human review gate as Workshop 3. It uses different customer messages.

## Check your work

Record one label per message: `low`, `medium`, or `high`.

1. Run `npm run check`. The first run creates `labels.json` from `labels.template.json`.
2. Open `labels.json` and fill in the labels your agent gave. Leave a message empty if you have not run it yet.
3. Run `npm run check` again.

```text
MSG-01 correct
MSG-02 revise
Lesson 1 (MSG-01 to MSG-06): 5/6 REVISE
Lesson 3 (MSG-01 to MSG-09): 5/9 REVISE
```

The check passes (exit code 0) when Lesson 1 is 6/6 and no filled-in label is wrong. Lesson 3 passes at 9/9. `MSG-10` is the missing-information case and is not graded. `revise` means: reread the priority definitions and the agent trace; do not change a label just to pass. The answer key stores hashes, so it does not spoil the answers at a glance.

A passing check is not approval. A person reviews every draft in `output/` before anything goes to a customer.

## Reflect

After each lesson, answer these for yourself:

- What does the main agent know?
- What belongs to a subagent?
- When is a tool needed?
- What information came from external data?

Pause after each run and read the prompt, trace, tool result, or saved draft before moving on.
