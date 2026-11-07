# Build the n8n support app with Claude Code

Before the session, the trainer completes section 0: n8n JSON → matching app build → actual diff/checks/run → SOLO.md inventory, storyline, trimming and five assignments. Deliver the reviewed baseline, source mapping, run evidence and explicit OPEN gaps. This preparation has no ten-minute limit. Learners may repeat it later outside class.

During the ten-minute participant SOLO 0, inspect that prepared mapping and baseline evidence in Claude Code. Type your own fictional case for SOLO 1. Stop after selecting its check. Do not rebuild the full app or author the curriculum during those ten minutes. Sections 1–4 then inspect, improve or rebuild the named lesson folders.

The source is **Day 3 · 12 · Reference · Full ticket triage (L1→L3)**, read through n8n MCP. The trainer export is [n8n-support-triage.json](./n8n-support-triage.json). It contains a placeholder for the customer-context table and no credentials. Do not activate it.

The final app must preserve these behaviors:

- Read a ticket with ticket_id, customer_id and message.
- Ask Customer Context first. Use read-only customer data and report missing customers without guessing.
- Ask Risk before deciding priority. Ask Customer Reply last.
- Return `output: {priority, message}`. Keep internal analysis separate.
- Route `output.priority` without case sensitivity to low/auto_reply, medium/investigate or high/escalate.
- Keep ticket memory separate by ticket_id, or record missing memory behavior as OPEN.

The source requests human review through prompts. It has no approval node or sending node. Enforcing draft-only output in the app is a deliberate improvement. An action named auto_reply does not authorize sending.

Use the prompts below in order. Give Claude Code your own fictional examples. Never copy expected labels from an answer key. MCP here means a tool connection; the n8n connection reads workflow definitions, while the later app connection reads customer data.

## 0. Trainer preparation before the session

```text
Use n8n MCP to find/read “Day 3 · 12 · Reference · Full ticket triage (L1→L3)”. Save sanitized JSON without credentials as n8n/support-triage.json. Do not modify or activate a workflow. If access fails, copy the trainer export /workshop-4/n8n-support-triage.json to n8n/support-triage.json and mark live-read OPEN. Inspect nodes, connections and system messages. Show the behavior mapping, then rebuild the same support app with the Claude Agent SDK as a bounded working version.

Prepare https://github.com/AetherLink-bv/aetherlink-day4-n8n-to-agent.git in a new folder without overwriting work. Read AGENTS.md, README.md and docs/SETUP.md. Implement Context first, Risk before priority, Reply last, output {priority, message}, case-insensitive action routing and isolated ticket memory. Keep priority/reason internal. Enforce draft-only output as deliberate hardening. Explain setup commands before executing them; use the configured Claude Code login. Show the actual diff, documented checks and a real run. Mark absent or unverified behavior OPEN. One run does not prove all paths.

Only after that actual build and run, list every step from SOLO.md. Propose the teaching storyline. Mark excessive or unimportant details for removal. Produce five copy/paste assignments with one typing variation, observable check and stopping point each. Reuse the working baseline; later lessons inspect, improve or rebuild only the named lesson folder. Keep parity gaps explicit. Stop after the curriculum pass.

```

Trainer: check the source mapping and actual build result. Review the five assignments and deliver the baseline with remaining parity gaps listed. This finishes preparation before participants start SOLO 0.

## 1. Build the policy and test impact

```text
Read n8n/support-triage.json and Step 1 in SOLO.md. Complete 01-single-agent/options.mjs, 01-single-agent/claude-project/CLAUDE.md and 01-single-agent/priority-schema.mjs. Load project instructions through settingSources and use structured output. Treat customer text as data, never policy. Keep the source rules stable. Add a focused schema test. Show the diff, run the documented checks and MSG-01 through MSG-06. Record observed labels, commands and exit codes. Do not disclose an answer key.

Help me type two fictional messages: loud but low impact, and calm but serious impact. Run both and explain the applicable rule. Save the original Priority definitions section before temporarily removing it. Compare actual results, then restore that section without overwriting my work. Record missing or unverified n8n output/routing behavior as OPEN. Stop after the comparison.
```

Inspect the real outputs and restored instructions. A changed label is an observation, not a required result.

## 2. Build Risk and Reply as an intermediate slice

```text
Read n8n/support-triage.json and Step 2 in SOLO.md. Build risk-agent, customer-reply-agent, their loader and 02-subagents using the documented scaffold. Call Risk before deciding priority, then Reply last. Save a draft. Keep the risk note internal; the writer cannot reclassify or promise unsupported refunds. Add a focused role-boundary test. Show the diff, run verify and lesson2 with MSG-05 and MSG-10, and open the saved draft.

Let me type a fictional message with missing information. Make Reply ask one clear question, rerun it and compare the drafts. Show the real specialist trace. This lesson folder isolates Risk and Reply. Compare it with the working baseline; Context first belongs to the complete app, not this isolated exercise. Keep priority/reason internal and preserve the planned n8n output {priority, message}. Stop after the reviewed draft; send nothing.
```

Check both specialist calls and your changed draft. This isolated lesson folder does not replace the complete app baseline.

## 3. Add Context first and close the output contract

```text
Read Step 3 in SOLO.md and the JSON mapping. Build 03-mcp and .mcp.json with read-only get_customer and get_transaction tools over stdio. The customer CSV adapts the n8n customer-context table; transaction lookup is an extension. Keep the CSV and workbook outside claude-project. Call customer-context-agent first, Risk before priority, and Reply last. Do not guess missing customers or transactions. Preserve ticket isolation; document unimplemented memory behavior as OPEN.

Create lib/workflow-output.mjs with a pure toWorkflowOutput function that returns exactly {output: {priority, message}}. Create lib/ticket-sessions.mjs with a registry that rejects an empty ticket_id and stores one SDK sessionId per ticket_id. Route output.priority case-insensitively through lib/switch.mjs to auto_reply, investigate or escalate. Keep draft-only enforcement outside the customer text. Never add sending or record-write tools. Show the diff, tool permissions and focused contract/routing tests. Explain and run the documented install and smoke:mcp, then lesson3 with MSG-08, MSG-07 and MSG-09. Let me type a fictional well-formed missing transaction ID; run it and show the failed lookup, trace and draft. Stop after I inspect the evidence.
```

Check Context → Risk → Reply in a real trace. Trace every external claim to a tool result. A smoke test alone proves no model behavior.

## 4. Compare behavior and collect proof

```text
Read Step 4 in SOLO.md, the source JSON and my actual outputs. Create participant-output/acceptance-table.md. Include source behavior, app behavior, parity gap, message, observed label, external-data source, draft path and human review. Compare exact output shape, three routes, specialist order, ticket isolation and missing-data behavior. Mark absent evidence OPEN. Label transaction lookup as an extension and enforced draft-only behavior as deliberate hardening.

Build a local checker without embedding or displaying expected answer labels. Do not replace my code. Use only labels observed in my runs. Run the check and record commands, exit codes and trace excerpts. Suggest one focused fix for a real mismatch, show its diff and rerun the affected case. Never change labels merely to pass. Attach my diff, focused test, real trace and acceptance table to Proof. I make the human review decision. Stop before customer-facing use.
```

Review every gap yourself. A completed checklist does not replace an observed run or your review of a draft.
