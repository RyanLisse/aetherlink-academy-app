# weather-agent-sdk

Thin **Claude Agent SDK** starter for AetherLink Academy Agent Arcade (L1 weather parity).

Promoted from Academy `training-lab/day-02/claude-agent-sdk/` (+ day-01 decision contract). Same tool idea as Eve weather-agent-fixture; this kit uses `@anthropic-ai/claude-agent-sdk`.

Linear: **AET-63** (historically LIS-65).

## Requirements

- Node.js 18+
- pnpm (or npm/yarn)

## Setup

```bash
git clone https://github.com/RyanLisse/weather-agent-sdk.git
cd weather-agent-sdk
pnpm i
```

### API key (env only — never commit)

```bash
cp .env.example .env
# put ANTHROPIC_API_KEY in .env or export it in your shell
export ANTHROPIC_API_KEY=sk-ant-...
```

`.env` is gitignored. No secrets in the repo.

## Run

Fixture / lab path (no API key required):

```bash
pnpm start
# or
pnpm exec node --import tsx src/agent.ts Amsterdam 2026-09-21
```

Live Claude Agent SDK path (needs `ANTHROPIC_API_KEY`):

```bash
export ANTHROPIC_API_KEY=...
pnpm start
```

## Mini-quest (L1 clothing advice)

1. Open editable **`instructions.md`** (quest hook).
2. Ensure clothing advice is present (jas / geen jas / paraplu) — already seeded; edit tone if you like.
3. Re-run:

```bash
pnpm quest:clothing
pnpm test
```

Do **not** add a new tool for the clothing quest — instruction-only delta (Arcade checkpoint `mini-quest-clothing`).

## Tests (no API key)

```bash
pnpm test
```

Uses a deterministic weather fixture so CI/labs pass without network or model spend.

## Layout

| Path | Role |
|------|------|
| `instructions.md` | Always-on system prompt / quest hook |
| `src/tools/get_weather.ts` | Typed tool + fixture |
| `src/decide.ts` | Shared decision contract from Academy day-01/02 |
| `src/agent.ts` | Fixture runner + optional `query()` SDK path |

## Interactive course

`course/` holds a self-contained HTML walkthrough of this kit for non-engineers: the tool-call round trip, the tool definition, fixtures vs live, and the clothing quest. Each module has animations, code-to-English translations and a short quiz.

```bash
open course/index.html
```

No server or build step needed to read it. To rebuild after editing `course/modules/*.html`, run `bash build.sh` inside `course/`.

## License

MIT
