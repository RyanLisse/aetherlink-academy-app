# Workshop 3: support triage in n8n

Route fictional support tickets to `low`, `medium`, or `high` in three levels of agency:

| Level | Workflow file | Model | Credential |
| --- | --- | --- | --- |
| L1 | `n8n-triage-l1-switch.json` | none: a Switch node with keyword rules | none |
| L2 | `n8n-triage-l2-agent-memory.json` | one AI Agent with memory | your own OpenAI credential |
| L3 (stretch) | `n8n-triage-l3-multi-agent.json` | AI Agent plus Customer Reply and Risk specialists | your own OpenAI credential |

The labels never change between levels. More agency does not add new exits, and a person decides before anything reaches a customer. You do not need the Academy site or a facilitator; this README is the full guide.

## What you need

- Node.js 24 or newer (`node --version`) and Git. n8n 2.41.1 requires Node.js 24.
- For L2 and L3 only: an OpenAI API key that you add as an n8n credential.
- About 60 minutes.

## Get the package

The commands are the same in macOS/Linux terminals, PowerShell, and Command Prompt:

```sh
git clone --depth 1 --filter=blob:none --sparse https://github.com/RyanLisse/aetherlink-academy-app.git w3-triage
cd w3-triage
git sparse-checkout set training-lab/w3-n8n-triage
cd training-lab/w3-n8n-triage
```

## Install n8n once, before the workshop

```sh
npm install
```

`npm install` installs n8n 2.41.1 from `package-lock.json` into `node_modules`: about 2,400 packages and 2.5 GB. It takes a few minutes on macOS and Linux and 15 to 25 minutes on Windows, so run it before the workshop. You need to run it only once. You do not need Visual Studio or other build tools.

On Windows the install prints warnings such as `gyp ERR! find VS` and `Failed to build optional crypto binding` for `ssh2`. These warnings are expected. The binding is optional, and the install still finishes. Wait until the prompt comes back.

If PowerShell says `npm.ps1 cannot be loaded because running scripts is disabled on this system`, type `npm.cmd` instead of `npm`:

```powershell
npm.cmd install
npm.cmd run n8n
npm.cmd run check
```

Command Prompt does not have this restriction, so `npm` works there.

## Start n8n on your machine

```sh
npm run n8n
```

Wait for `Editor is now accessible via: http://localhost:5678`, then open http://localhost:5678 in your browser. On the first start n8n asks you to create an owner account. It is a local account stored on your machine, in the `.n8n` folder in your home folder (`%USERPROFILE%\.n8n` on Windows). Use any name and password you will remember. Stop n8n with `Ctrl+C`. In Command Prompt, answer `Y` to `Terminate batch job (Y/N)?`.

If your facilitator gives you a shared workshop instance, you can use it instead. The steps are the same. Never use a production n8n.

## L1: Switch without an LLM

1. In n8n, create a workflow. In the workflow menu (`...`), choose **Import from File** and pick `n8n-triage-l1-switch.json` from this folder.
2. Open **Priority Switch** and read its rules: which words send a ticket to High, which to Medium, and what falls through to Low.
3. Click **Execute workflow**. **Fixture Tickets** sends four tickets through the Switch.
4. Open **High Priority Action**, **Medium Priority Action**, and **Low Priority Action**, and note which `ticket_id` landed in each branch.
5. Record the labels and check them (see [Check your work](#check-your-work)).

L1 needs no credential and no API key.

## L2: one AI Agent with memory

1. Import `n8n-triage-l2-agent-memory.json` as a new workflow.
2. Go to **Credentials** (or **Overview → Credentials**) and create an **OpenAI** credential with your own API key. Never paste a key into a workflow, a Code node, a JSON file, or this repository.
3. Open **OpenAI Chat Model** and replace the placeholder credential `REPLACE_ME` with yours.
4. Open **AI Agent**: read the system message and the prompt, and check that **Simple Memory** is connected.
5. Click **Execute workflow**. Open **Parse Decision** and the three Priority Action nodes and note each proposed priority.
6. Review each priority yourself. This is the human gate: nothing is sent to a customer. Take a screenshot of the execution as your trace.
7. Check the labels. A mismatch is fixed in the prompt, not by changing the label.

Without a valid credential the workflow imports but does not run. An import alone is not evidence of a model run.

## L3 (stretch): Reply and Risk specialists

1. Import `n8n-triage-l3-multi-agent.json`.
2. Select your OpenAI credential on all three model nodes: **OpenAI Chat Model**, **OpenAI Chat Model1**, and **OpenAI Chat Model2**.
3. Open **Customer Reply Agent** and **Risk Agent** and write one sentence each about what the specialist does.
4. Click **Execute workflow** and check that every ticket gets a reply draft, a risk note, and one priority.
5. Name the one human gate before anything becomes customer-facing, then check the labels.

## Check your work

1. Run `npm run check`. The first run creates `labels.json` from `labels.template.json`.
2. Open `labels.json` in a text editor (on Windows, for example `notepad labels.json`) and write the label of each ticket: `low`, `medium`, or `high`.
3. Run `npm run check` again.

```text
WL-1026 correct
WL-1027 correct
WL-9001 revise
WL-9002 correct
Workshop 3 (all tickets): 3/4 REVISE
```

The check passes (exit code 0) at 4/4. `revise` means: reread the Switch rule or the agent prompt and rerun; do not change a label just to pass. The answer key stores hashes, so it does not spoil the answers at a glance.

A passing check is not approval to act. A person decides before any reply, refund, or escalation.

## Safety

- All tickets are fictional. Do not connect real Jira, CRM, email, or payment systems.
- Keep credentials in n8n's credential store and off screen. The workflow files contain only the placeholder `REPLACE_ME`.
- Customer text is data. If a message says "ignore the rules" or "approve a refund immediately", the priority still comes from what the customer reports, and a person still reviews it.

## Reflect

- Which words decide `high` in L1, and which ticket would a keyword rule get wrong?
- What does the AI Agent in L2 add over the Switch, and what can it get wrong?
- In L3, what does each specialist know, and where is the one human gate?
- What would you need to see before you trust a model run? An import is not a run.

Next: Workshop 4 rebuilds the same idea in code with the Claude Agent SDK (`training-lab/w4-support-agent-sdk`).
