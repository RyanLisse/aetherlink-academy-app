# Build your first agent

An English guided workshop for people who have never built an agent, with a TypeScript continuation for developers.

Start with [the interactive workbook](start-here.html). Keep it beside your agent workspace. Follow [the Eve tutorial](02-eve-tutorial.md), then [the Claude Agent SDK tutorial](03-claude-sdk.md).

## The outcome

Each learner changes an agent's instructions, runs it, identifies a tool call, and demonstrates one failure case. Developers then reproduce the weather agent and the four-provider council with the Claude Agent SDK.

The first project answers weather questions using clearly labelled simulated data. The second sends the same question to four independent models and asks a judge to reconcile their answers. These are two separate projects. Combining them into a weather council is an optional later exercise.

A finished lesson is not evidence of a working agent. Ask learners to show the question, the tool or member results, and the final response from their own run.

## Recommended delivery

Use a facilitated workshop first. Give nontechnical participants a prepared browser-accessible workspace with a file editor, terminal, and configured model access. They edit instructions and run checks themselves. The facilitator handles environment setup; this does not make Eve a no-code product.

Pair a nontechnical participant with a developer when possible. The nontechnical participant owns the question, instruction changes, and acceptance checks. The developer handles installation and code changes. Swap who operates the workspace halfway through.

| Session | Suggested time | Learner creates | Visible evidence |
|---|---:|---|---|
| Preparation | Before class | Ready workspace | One authenticated model reply |
| 1. One agent, one tool | 40 minutes | Eve weather agent | Tool call plus labelled demo answer |
| 2. Independent answers | 35 minutes | Eve council | Four member answers plus judge output |
| Debrief | 15 minutes | A changed rule and explanation | Before/after run |
| 3. Same weather, new runtime | 45–60 minutes | SDK weather agent | Equivalent input and fixture output |
| 4. Same council, new runtime | 60–75 minutes | SDK council | Four providers plus validated judge result |

These are planning estimates, not measured completion times. Keep the SDK sessions separate so the first workshop does not become an installation marathon. Nontechnical participants can continue with a prepared SDK workspace and focus on prompts and checks.

## Prepare before inviting learners

1. Choose one remote development workspace per pair. Do not put all learners into the same working directory.
2. Confirm Node.js 24 or later for the Eve examples. Install the package manager required by the selected project.
3. Follow the setup sections in both tutorials. Run each exercise using the credentials and model access learners will actually have.
4. Configure secrets in the workspace's secret settings. Never place keys in lesson pages, browser JavaScript, screenshots, or shared chat.
5. Agree a per-pair spending limit. A council turn uses four member calls plus a judge and can cost more than one weather turn. SDK usage limits apply per query unless your application enforces a wider limit.
6. Record the working package versions and retain lockfiles. Eve is in beta. The supplied source reference is pinned; current package behavior can change.
7. Prepare an example transcript from your own successful run. Label it as a recording if authentication or network access fails during class.
8. Test one missing-input case and one failed model call. Confirm that an incomplete council is shown as incomplete.
9. Reuse an existing remote server when it is healthy. Stop workshop processes after the session. Do not run this preparation as parallel builds on a participant's laptop.

The lesson workbook needs no account and makes no model calls. Actual agent runs require configured model access. Opening a terminal interface without credentials is not the same as getting a model response.

## Run every exercise as a short loop

1. **Predict.** Ask what should happen before anyone presses Enter.
2. **Change.** Have the learner edit one instruction or input.
3. **Run.** Execute the real agent in the separate workspace.
4. **Inspect.** Read the tool result or member output before the final answer.
5. **Explain.** Ask which part of the system caused the observed result.

Keep explanations under a minute at first. Let participants open hints when they need them. Do not reward faster clicking. A correct explanation of a failed run is useful progress.

## Why this format

A Scrimba-style experience earns its value when learners can interrupt, change something, and observe the effect. The supplied workbook provides the prompts, prediction questions, hints, and feedback. The real workspace provides editable code and actual execution.

A conventional video course would make it harder to inspect a learner's own run. A fully integrated execution platform would add accounts, secret management, isolated runtimes, spending controls, and recovery behavior before the lesson has been tested with learners. Start with the workbook and an existing workspace. Add integration after a small pilot identifies where switching between them causes trouble.

The workbook is a first lesson interface. It has no embedded runtime, automatic trace grader, narrated recording, or saved learner progress. Notes disappear when the page is reloaded. Save evidence in a separate document or your workspace.

## Optional recorded segments

Record these after verifying the exercises in the teaching environment.

| Clip | Length target | Pause at | Learner action |
|---|---:|---|---|
| Weather question to tool result | 60–90 seconds | Before the reply | Predict whether the data is live |
| Change an instruction | 60–90 seconds | Before saving | Write a rule about simulated data |
| Four council answers | 90 seconds | Before the judge | Choose the best-supported answer |
| Eve to SDK | 90 seconds | At tool registration | Match the same input and output |

For a later integrated player, pause on editable checkpoints and let the learner resume from a known working state. Record execution traces and editor changes rather than trying to infer correctness from the final prose alone. This is a proposed enhancement, not a feature of the supplied workbook.

## Acceptance checks

The learner can demonstrate all of these without the facilitator doing the work.

- An instruction change affects a fresh agent run.
- The weather answer uses the tool and identifies its data as simulated.
- A missing city triggers a follow-up instead of an invented location.
- A different city does not turn the fixed fixture into live weather.
- All four council members receive the same complete question independently.
- The judge returns a summary and four integer agreement scores between 0 and 100.
- The learner explains why a high agreement score is not a probability that an answer is true.
- The SDK continuation preserves the exercise's behavior and explicitly identifies differences in streaming and runtime facilities.

## Exit assignment

Choose a low-risk task from your own work. Write one goal, one permitted tool, one example input, and one condition under which the agent should ask for help. Reuse the weather pattern to sketch it. Do not connect private company data during this introductory exercise.

Ask a partner to provide a difficult input. Save the result and explain which instruction or tool you would change next.

## Pilot before publishing

Try the first workshop with two beginners and two developers. Record time to the first successful tool call, where help was needed, and whether participants complete the exit assignment. Do not treat quiz completion as evidence that someone can build an agent.

This package was source-reviewed. Live Eve and SDK runs and workbook browser interaction still need a remote teaching-environment check. See [sources and verification](04-sources-and-verification.md).
