# council-agent-sdk

Thin **Claude Agent SDK** starter for AetherLink Academy Agent Arcade (L2 LLM Council parity).

Fan-out → structured judge/reduce. Quest hook: edit the **judge rule** in `instructions.md` only.

Linear: **AET-63** (historically LIS-65).

## Requirements

- Node.js 18+
- pnpm

## Setup

```bash
git clone https://github.com/RyanLisse/council-agent-sdk.git
cd council-agent-sdk
pnpm i
```

### API key (env only — never commit)

```bash
cp .env.example .env
export ANTHROPIC_API_KEY=sk-ant-...
```

Live multi-model spend is **not** required for the lab path — tests use fixture members + local reduce.

## Run

```bash
pnpm start
# or
pnpm exec node --import tsx src/agent.ts "Moeten we een paraplu meenemen?"
```

## Mini-quest (L2 judge)

1. Open **`instructions.md`**.
2. Edit **only** the judge rule (e.g. strenger bij vage claims / Nederlands / max woorden).
3. Re-run:

```bash
pnpm quest:judge
pnpm test
```

Arcade checkpoint: `mini-quest-judge`.

## Tests (no live multi-model spend)

```bash
pnpm test
```

## Layout

| Path | Role |
|------|------|
| `instructions.md` | Fan-out + **judge** quest hook |
| `src/council.ts` | Fixture fan-out + structured reduce |
| `src/schemas.ts` | Judge/agreement types |
| `src/agent.ts` | Runner + optional live `query()` |

## Interactive course

`course/` holds a self-contained HTML course that walks through this repo in plain language: fan-out, the judge's scoring, the `instructions.md` quest hook, and fixture vs live SDK. Includes animations, code↔English translations and quizzes. No install needed:

```bash
open course/index.html
```

Rebuild after editing a module: `cd course && bash build.sh`.

## License

MIT
