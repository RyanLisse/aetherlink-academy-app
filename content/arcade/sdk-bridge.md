# SDK Bridge — Eve → Claude Agent SDK

**Route:** `/arcade/sdk-bridge`  
**Track:** sdk  
**Linear:** AET-62 (bridge) · starters **AET-63**  
**Duration:** ~35–45 min  
**Source:** https://github.com/anthropics/claude-agent-sdk-typescript  

**Starters:** **available** — `weather-agent-sdk` + `council-agent-sdk` (Herdr AET-63).

Toggle captions: **Mensentaal** | **Tech**

---

## Audience split

| Rol | Pad |
|-----|-----|
| **Non-tech** | Watch/skip toegestaan. Blijf op Eve UI. Lees mapping als “woordenboek”. Geen SDK install verplicht. |
| **Tech** | Eve sneller doorlopen → SDK labs **required** (starters beschikbaar). |

### coach_mensentaal
Dit is de brug. Zelfde ideeën, andere gereedschapskist. Non-tech: kijken mag. Tech: jij bouwt het in de SDK-starters.

### coach_tech
Concept parity first. Port weather + council mini-quests on the Herdr kits. Do not invent starter APIs — use the clone URLs from the manifest.

---

## Stap 1 — Mapping table (10 min)

### coach_mensentaal
Leer de woorden naast elkaar. Als je Eve snapt, snapt je de SDK-richting.

### coach_tech
Gebruik onderstaande mapping als lescontract. Details in de SDK-repo kunnen wijzigen — check README bij start van de lab.

| Eve (Track A) | Claude Agent SDK (Track B) | Notitie |
|---------------|----------------------------|---------|
| `defineAgent` / agent config | Agent/query options in SDK | Model + limits vs SDK options |
| `instructions.md` | System / instruction string of file fed to agent | Always-on gedrag |
| Typed tool (`get_weather`) | SDK tool definition (name, input schema, handler) | Executable capability |
| Markdown skill | Prompt/procedure text of project skill doc | Guidance, geen code-exec |
| Eve TUI / `pnpm dev` | SDK CLI/app runner uit starter | Runtime surface |
| Subagents (council members) | Parallel agents / multi-call orchestration in starter | Fan-out pattern |
| Judge + agreement schema | Structured output / scoring step in starter | Reduce step |
| `eve link` + AI Gateway | SDK auth/env per starter README | No secrets in git |

### checkpoint
`mapping-table`

### expected
Deelnemer koppelt minstens: instructions ↔ system/instructions, tool ↔ tool, skill ↔ procedure text.

### playground
Clone starters when ready for labs; mapping table stays the contract.

---

## Stap 2 — Same mini-quests (intent) (10 min)

### coach_mensentaal
Zelfde opdrachten als L1/L2:
1. Weather: kledingadvies via instructie.
2. Council: rechter-regel aanscherpen.

Op Eve deed je ze al. Op SDK doe je ze **identiek** in de starters.

### coach_tech
Parity quests — behavior change via instructions first; tools second. Starters preserve quest hooks (`instructions.md` clothing path + judge instruction path).

### checkpoint
`same-mini-quests`

### expected
Deelnemer kan beide quests in één zin herhalen zonder Eve-specifieke bestandsnamen te hoeven noemen.

### playground
Weather: edit `instructions.md` → `pnpm quest:clothing` / `pnpm test`. Council: edit judge rule → `pnpm quest:judge` / `pnpm test`.

---

## Stap 3 — Audience gate (5 min)

### coach_mensentaal
Non-tech: je mag stoppen of meekijken. Tech: je gaat door naar starters.

### coach_tech
Gate on `startersStatus === available` — now true. Tech track continues into starter labs.

### checkpoint
`audience-split`

### expected
Facilitator noteert per deelnemer: watch | skip | ready-for-starters | in-progress.

### playground
UI toggle: Non-tech / Tech.

---

## Stap 4 — Starters labs (AET-63) (rest)

### coach_mensentaal
Open weather-SDK, herhaal kleding-quest; open council-SDK, herhaal judge-quest. Badge “SDK bridge” voor tech daarna.

### coach_tech
Starter IDs: `weather-agent-sdk`, `council-agent-sdk`.

```bash
git clone https://github.com/RyanLisse/weather-agent-sdk.git
cd weather-agent-sdk && pnpm i && pnpm test

git clone https://github.com/RyanLisse/council-agent-sdk.git
cd council-agent-sdk && pnpm i && pnpm test
```

Set `ANTHROPIC_API_KEY` in env only for live `query()` path. Fixture tests pass without a key.

### checkpoint
`starters-gate`

### expected
Both mini-quests green on SDK starters (tests + instruction edits).

### playground
Clone URLs from manifest `starters[]`. No invented metrics.

---

## Exit criteria

- [ ] Mapping table begrepen
- [ ] Mini-quest parity uitgelegd
- [ ] Non-tech watch/skip of tech starters gekozen
- [ ] Starters: available + quests completed (tech)

**Geen secrets. Geen verzonnen starter-metrics.**
