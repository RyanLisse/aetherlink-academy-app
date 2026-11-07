# Daily brief agent — lab

You are going to build one agent around the whole AI-native SDLC: an agent
that reads GitLab, Jira, Confluence and the Outlook calendar (or your own GitHub, Linear and Notion) every morning and
writes a one-page brief. `main` is empty on purpose: templates, a package
skeleton and nothing else. Every step of the lesson leaves one artifact here.

Academy Workshop 5 walks this repository as the AI-native SDLC guided lesson (Academy host path `/workshop/5`).

## The steps

| Step | Phase | You write | Proof |
| --- | --- | --- | --- |
| 1 | Plan | `intent.md` | A facilitator accepts the boundary |
| 2 | Plan | `docs/spec.md`, `src/brief.ts`, `sample/brief.sample.json`, `test/schema.test.ts` | `npm test` green on the schema tests |
| 3 | Design | `docs/design.md`, one ADR, `docs/plan.md` | A stranger can follow the plan and name what proves completion |
| 4 | Build | `src/render.ts`, `src/main.ts` | `npm run brief:sample` writes `out/latest.html` |
| 5 | Build | `src/sources.ts`, `src/agent.ts`, live wiring in `src/main.ts` | `npm test`, `npm run typecheck`, and `npm run brief:sample` green; wiring proven without a network |
| 6 | Test | `docs/evidence.md` and one screenshot | Three commands with exit codes and a reviewer |
| 7 | Gate | `docs/gate.md`, inactive schedule, PR preview | PASS / FAIL / OPEN with a quoted line |

## Always-on artifacts

`CLAUDE.md` · `AGENTS.md` · `progress.md` · `SOLO.md` — read before you change anything; append `progress.md` each SOLO.

## How to work

```bash
npm install                 # once, at the start
git switch -c my/<name>     # your own branch from main
```

Work in your branch. Build each step with the prompt in `SOLO.md`. After your
own attempt, you can compare your diff with the reference history:

```bash
git diff main step-2-spec --stat          # what step 2 adds
git diff step-2-spec -- docs/spec.md      # compare your spec with the reference
git log --oneline main..step-7-gate-deploy # the whole route
```

Do not copy solved files from a reference tag into your branch. Ask Claude Code
to show the reference diff only after your own attempt, then fix your work.

Tags: `step-1-intent`, `step-2-spec`, `step-3-design`, `step-4-build-render`,
`step-5-build-agent`, `step-6-evidence`, `step-7-gate-deploy`. The same commits
are reachable as branches `steps/1-intent` … `steps/7-gate-deploy` for browsing
on GitLab or GitHub.

## Rules

- Sample data only. No credential is typed into a prompt or committed. A blocked
  credential is an access result and goes down as `OPEN`, not as a failure.
- Every claim needs a source, a reproduced check and a reviewer. Anything less is
  a hypothesis and is written as `OPEN`.
- Read `intent.md` and `progress.md` before you change anything; `CLAUDE.md`
  loads them for the agent too.
- The empty scaffold has no `src/` or `test/` files. `npm run typecheck` and
  `npm test` become meaningful after SOLO 2 creates the first schema and test.

Step 2 uses the committed canonical references
`reference/The_Tuesday_Brief_-_September_1.pdf` and
`reference/The_Wednesday_Brief_-_August_26.pdf`. The October brief is an extra
example. Read `reference/README.md` before you quote them.

Walking it alone, with your own GitHub, Linear and Notion: `SOLO.md` — each step
includes a paste-ready Claude Code **Prompt** block; all seven are also in
[`docs/prompts.md`](docs/prompts.md).

## Interactive course

`course/` is a self-contained, six-module course that explains this lab's
workflow to someone who has never read a spec: intent, spec, design and plan,
the agent instructions, evidence and the gate, and the SOLO loop. Every code
block quotes a file in this repository exactly. No install, no server:

```bash
open course/index.html
```

To change it, edit `course/modules/*.html` and rebuild with
`cd course && bash build.sh`.
