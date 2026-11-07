# Build the daily brief with Claude Code

Build a brief on your own branch through seven prompts. You choose the requirements and inspect each result.
Claude Code is your development helper. It may edit code and run commands after your approval.
The brief-agent you build gets no shell or write tools.

## Prepare your branch

Open Claude Code in the lab repository. If you need the repository, use the clone URL from the workshop.
Paste this prompt before implementing anything.

> Read README.md, CLAUDE.md, and SOLO.md. Check the documented Node version and package scripts. Preserve existing work. Prepare my own branch and install the documented dependencies after I approve the commands. Report the starting files and any blockers. Do not implement a solution yet.

`main` is empty on purpose apart from templates and a package skeleton. Reference tags `step-1-intent` through `step-7-gate-deploy` show one solution.
Use them for comparison only after your own attempt. Ask Claude Code to show a diff before recovering anything.
Keep your changes before recovery. Do not overwrite your branch with reference files.

Keep tokens in the documented local environment or secrets store. Never paste credentials into a prompt or commit them.
SOLO 1 through 4 work without credentials. Missing credentials leave the live checks in SOLO 5 OPEN.
Keep the sample route working throughout the exercise.

## Complete the seven steps

For each step, paste the build prompt first. Inspect the result before using the improvement prompt.
Choose the requested variation yourself. Append observed proof and VERIFIED or OPEN to `progress.md` after each step.
A failed check is FAIL. A check that did not run is OPEN.

### 1 · Draft the intent

Start with the templates on your own branch.

Paste this build prompt into Claude Code.

> Read CLAUDE.md, SOLO.md, and the templates on my branch. Interview me one question at a time. Draft intent.md with one outcome, three observable checks, owners, a hard boundary, and one OPEN. Stop for my review. Do not implement code.

Choose your own variation, then paste this improvement prompt.

> Challenge my weakest check with one concrete counterexample. Revise only intent.md after my answer. Show the diff and stop.

Inspect intent.md yourself. Reject a vague boundary. Stop until you accept the checks; no implementation yet.

### 2 · Build the spec and schema

Start with your accepted intent and the files in `reference/`.

Paste this build prompt into Claude Code.

> Read my accepted intent.md and reference/. Propose docs/spec.md with one quoted example per field. After I accept, write test/schema.test.ts and run it to show the expected red failure. Stop so I can inspect and commit the test. Then build src/brief.ts and sample/brief.sample.json until that test passes. Do not build a renderer or tools.

Choose your own variation, then paste this improvement prompt.

> Add one invalid sample of my choice to test/schema.test.ts. Prove the schema rejects it. Show the spec row, test output, and diff. Stop before SOLO 3.

Inspect the quoted spec rows and the actual red and green output. Commit the failing test before brief.ts. Stop after your invalid sample is rejected.

### 3 · Accept the design and plan

Start with the accepted spec and schema from SOLO 2.

Paste this build prompt into Claude Code.

> In plan mode, read intent.md, docs/spec.md, and the current diff. Propose docs/design.md, one decision under docs/decisions/, and docs/plan.md. Name exact paths, one proof command and rollback per step. Do not edit files or build. Stop for my acceptance.

Choose your own variation, then paste this improvement prompt.

> After I accept the plan, save only those design documents. Challenge one assumption with the case I choose. Show the revised plan and diff. Stop before building.

Plan mode is read-only. Accept the proposal yourself before Claude saves the design documents. No build begins before that acceptance.

### 4 · Build the sample renderer

Start with your accepted design and plan.

Paste this build prompt into Claude Code.

> Use my accepted docs/plan.md. First write test/render.test.ts and show the expected red failure. Then build src/render.ts and a sample-only src/main.ts. Escape untrusted text. Run the sample script and show out/latest.html. Use no API key or model call. Stop for my inspection.

Choose your own variation, then paste this improvement prompt.

> Change one house-style rule I choose. Add a failing test first, then make it pass. Regenerate out/latest.html and show the diff. Stop so I can inspect the page and save a 1440×900 screenshot.

Open out/latest.html yourself. Inspect the escaping test and your changed style rule. Keep the screenshot before continuing.

### 5 · Build one read-only tool

Start with the sample renderer and your accepted plan.

Paste this build prompt into Claude Code.

> Read my accepted plan and schema. Build src/agent.ts, src/sources.ts, and test/agent.test.ts for one read-only tool. Connect src/main.ts to the agent for the live brief command while preserving brief:sample without model calls. Reuse tool() and guarded() if present. Give the brief-agent no shell or write tools. Prove the tool wiring and missing-source behavior with tests. Keep the sample path working. Stop for my review.

Choose your own variation, then paste this improvement prompt.

> Test one missing-source case I choose. Show the diff and observed test output. With configured credentials, run the brief and trace each factual claim to run.log. Without credentials, run the sample and mark the live check OPEN. Never print tokens. Stop for my inspection.

Claude Code builds and runs checks; the built brief-agent gets no shell or write tools. Inspect the tool trace. Missing credentials leave live evidence OPEN.

### 6 · Record and review evidence

Start with your own working code and screenshot from SOLO 4.

Paste this build prompt into Claude Code.

> Run the existing typecheck, test, and brief:sample scripts. Record each actual command, exit code, and one output line in docs/evidence.md. Link my screenshot under docs/evidence/. Mark unrun checks OPEN. Do not change implementation to hide a failure. Stop for my review.

Choose your own variation, then paste this improvement prompt.

> Check the evidence against the extra case I choose. Show missing proof as OPEN. Stop while my reviewer reruns one command and compares the output. Record their actual name and result only afterward.

A reviewer reruns one real command and compares it with docs/evidence.md. Unrun checks stay OPEN. Stop until the screenshot and reviewer are recorded.

### 7 · Decide the gate and prepare the PR

Start with the diff, intent, and reviewed evidence.

Paste this build prompt into Claude Code.

> Read intent.md, the diff, and docs/evidence.md. Draft docs/gate.md with evidence links and proposed FAIL or OPEN entries for missing checks. Leave PASS decisions to me. Prepare a PR description and weekday schedule without activating it. Do not merge, deploy, or publish. Stop for my decision.

Choose your own variation, then paste this improvement prompt.

> Use the OPEN item I choose to propose one new acceptance check. Show the gate diff and PR preview. After I decide the gate and approve publication, open the PR. Stop before merge or deployment.

You decide PASS, FAIL, or OPEN from evidence you read. Inspect the PR preview before publication. Keep deployment and scheduling inactive.

## Finish the handoff

Open the rendered page and read the gate yourself. Keep the schema, renderer, read-only tool, evidence, and PR traceable to your own branch.
Ask a reviewer to rerun one command. If you work alone, rerun it the next day and record that limitation.
A prepared schedule stays inactive until you approve activation. A PR stays unmerged until a person accepts the result.
