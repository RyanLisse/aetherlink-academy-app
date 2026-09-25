# Sources and verification

Prepared on 22 September 2026. All learner-facing material is in English.

## What the source actually does

| Item | Finding | Lesson decision |
|---|---|---|
| Eve weather fixture | Always returns 72°F and Sunny for the supplied city | Label the data as simulated; teach tool inspection |
| Eve instructions and skills | Standing instructions and a separate weather procedure | Let beginners edit plain text before changing TypeScript |
| Eve council | Four independent providers, followed by a judge | Preserve all four providers in the SDK continuation |
| Council result schema | Summary plus four integer scores from 0 to 100 | Explain that agreement scores do not prove truth |
| Eve weather setup text | Opening the TUI needs no credentials; model execution does | Separate interface startup from an authenticated model run |
| Claude Agent SDK | A Claude agent runtime with custom tools | Use a custom weather tool and an explicit Gateway bridge for other providers |

## Eve references

The template pages link to source revision `dea2ced59e8c7ed5a41b9a1c432f5fcd080999d9`. Source files were read directly at that revision.

- [Weather template](https://eve.dev/templates/weather-agent-fixture).
- [Original weather tool](https://github.com/vercel/eve/blob/dea2ced59e8c7ed5a41b9a1c432f5fcd080999d9/apps/fixtures/weather-agent/agent/tools/get_weather.ts).
- [Original weather instructions](https://github.com/vercel/eve/blob/dea2ced59e8c7ed5a41b9a1c432f5fcd080999d9/apps/fixtures/weather-agent/agent/instructions.md).
- [Original weather skill](https://github.com/vercel/eve/blob/dea2ced59e8c7ed5a41b9a1c432f5fcd080999d9/apps/fixtures/weather-agent/agent/skills/get-weather.md).
- [LLM council template](https://eve.dev/templates/eve-llm-council-template).
- [Council instructions](https://github.com/vercel/eve/blob/dea2ced59e8c7ed5a41b9a1c432f5fcd080999d9/apps/templates/eve-llm-council-template/agent/instructions.md).
- [Council schema](https://github.com/vercel/eve/blob/dea2ced59e8c7ed5a41b9a1c432f5fcd080999d9/apps/templates/eve-llm-council-template/agent/lib/schemas.ts).
- [Council package manifest](https://github.com/vercel/eve/blob/dea2ced59e8c7ed5a41b9a1c432f5fcd080999d9/apps/templates/eve-llm-council-template/package.json).
- [Eve README and initialisation example](https://github.com/vercel/eve/blob/dea2ced59e8c7ed5a41b9a1c432f5fcd080999d9/README.md).
- [Eve first-agent tutorial and credential requirements](https://eve.dev/docs/tutorial/first-agent).

## Claude and Gateway references

- [Requested TypeScript SDK repository](https://github.com/anthropics/claude-agent-sdk-typescript).
- [SDK quickstart](https://code.claude.com/docs/en/agent-sdk/quickstart.md).
- [Custom tools](https://code.claude.com/docs/en/agent-sdk/custom-tools.md).
- [Input modes](https://code.claude.com/docs/en/agent-sdk/streaming-vs-single-mode.md).
- [Permissions](https://code.claude.com/docs/en/agent-sdk/permissions.md).
- [Structured output](https://code.claude.com/docs/en/agent-sdk/structured-outputs.md).
- [Subagents](https://code.claude.com/docs/en/agent-sdk/subagents.md).
- [Vercel AI Gateway setup](https://vercel.com/docs/ai-gateway/getting-started).

The SDK research identified version 0.3.278. The tutorial pins that baseline. Provider access, package behavior, and model availability still require a check in the environment used for the class.

## Verification boundary

This is a first authored lesson package, not a certified working training environment.

Public template pages and source files were retrieved. The exercise data and council contract were compared with those files. A separate source and static review completed with no open findings. Static artifact checks verify local links and the structure of the workbook.

No Eve installation, authenticated agent execution, paid model run, or remote browser session was performed for this package. The workbook is an HTML learning aid, not a live agent simulator. The agent examples must be smoke-tested before teaching from them. Expected replies are examples or acceptance criteria, not captured execution evidence.

The available review agents are from the same model family. The requested Poteto cross-family review could not be performed with the available model catalog. An independent agent review can catch errors, but does not meet that additional diversity requirement.

## Checks performed on the supplied artifacts

- The HTML structure and local document links passed `python3 work/check-artifacts.py`. The check verifies unique navigation targets, English page language, four quiz answer sets, and balanced Markdown code fences.
- The two exact fixture checks passed with Node.js 24.18.0. They verify the Amsterdam result and rejection of a blank city without a model call.
- All five TypeScript blocks in the SDK tutorial passed syntax parsing after native TypeScript type stripping. This does not verify dependency types or API compatibility at runtime.
- The Gateway bridge module loaded without executing a request.

## Before teaching

1. Open the workbook in the remote teaching browser and exercise each quiz, hint, and navigation link with mouse and keyboard.
2. Follow the installation steps in a clean remote workspace and save the resulting lockfiles.
3. Run Amsterdam, Tokyo, and missing-city weather prompts in both frameworks.
4. Inspect actual tool inputs and outputs. Check simulated-data labelling.
5. Run the table question through both councils. Record four members and the judge result.
6. Test an unavailable provider. Confirm that an incomplete council is not reported as successful.
7. Record the approved spending limit, model IDs, versions, and the observed total usage.
8. Run the lesson with a beginner and revise steps where they need unexplained help.

These checks remain open. They require the teaching environment and its model credentials, rather than additional content generation.
