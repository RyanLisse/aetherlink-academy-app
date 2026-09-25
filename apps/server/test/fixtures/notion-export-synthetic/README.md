# SYNTHETIC Notion export fixture

This directory is **synthetic**. It is not a real Notion export and contains no
real names, e-mail addresses, customer data, schedules, guardrails or quiz
questions. Every value is an obvious placeholder, and the page ids are
sequential fake ids (`0000…0001`), not real Notion page ids.

It exists to exercise `apps/server/src/notion/` (AET-33): file-name routing,
provenance, the untrusted-text rule, idempotency and the participant read
path. `notion-export.json` carries `"synthetic": true`, so the CLI refuses a
real (non-dry) run of this export unless `--allow-synthetic` and a scratch
`--manual` are passed.

Layout mirrors a Notion "Markdown & CSV" export:

- `Draaiboek Dag N <id>.md` has a Markdown table with `Start | Eind | Onderdeel` and maps to `day.schedule`.
- `Checklist Dag N <id>.md` has `- [ ]` to-dos and maps to `day.checklist`. `Dag 0` is deliberately present: no `days` row has ordinal 0, so it is reported as skipped.
- `Kahoot vragenbank <id>.csv` has Kahoot-template columns plus `Dag` and `Les` and maps to draft `quiz_question` rows.
- `Guardrails <id>.md` has bullets and maps to the guardrail section of `docs/handleiding-facilitator-v2.md`.
- `Losse notities <id>.md` matches no route and is reported as ignored.

Some lines contain planted prompt-injection text and hidden HTML so tests can
prove they are stripped.
