# SDK Bridge — Eve → Claude Agent SDK

**Route:** `/arcade/sdk-bridge`  
**Track:** sdk  
**Linear:** LIS-63  
**Duration:** ~35–45 min  
**Source:** https://github.com/anthropics/claude-agent-sdk-typescript  

**Starters:** PENDING Herdr **LIS-65** (`weather-agent-sdk`, `council-agent-sdk`).  
Tot starters er zijn: mapping + watch-mode + same mini-quests op Eve blijven geldig; SDK labs geblokkeerd voor hands-on.

Toggle captions: **Mensentaal** | **Tech**

---

## Audience split

| Rol | Pad |
|-----|-----|
| **Non-tech** | Watch/skip toegestaan. Blijf op Eve UI. Lees mapping als “woordenboek”. Geen SDK install verplicht. |
| **Tech** | Eve sneller doorlopen → SDK labs **required** zodra LIS-65 starters beschikbaar zijn. |

### coach_mensentaal
Dit is de brug. Zelfde ideeën, andere gereedschapskist. Non-tech: kijken mag. Tech: jij bouwt het later in de SDK-starters.

### coach_tech
Concept parity first. Port weather + council mini-quests once starters land. Do not invent starter APIs in Academy copy — link Herdr kits only.

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
Geen code tot LIS-65. Toon tabel in UI; optioneel link SDK repo.

---

## Stap 2 — Same mini-quests (intent) (10 min)

### coach_mensentaal
Zelfde opdrachten als L1/L2:
1. Weather: kledingadvies via instructie.
2. Council: rechter-regel aanscherpen.

Op Eve doe je ze nu. Op SDK doe je ze **identiek** zodra de starters er zijn.

### coach_tech
Parity quests — behavior change via instructions first; tools second. Starters MUST preserve quest hooks (instructions path + judge instruction path).

### checkpoint
`same-mini-quests`

### expected
Deelnemer kan beide quests in één zin herhalen zonder Eve-specifieke bestandsnamen te hoeven noemen.

### playground
Als starters PENDING: checkbox “quest intent begrepen” + Eve bewijs volstaat voor non-tech badge path.

---

## Stap 3 — Audience gate (5 min)

### coach_mensentaal
Non-tech: je mag stoppen of meekijken. Tech: je gaat door naar starters (of wacht tot Herdr LIS-65 groen is).

### coach_tech
Gate on `startersStatus === available`. Until then mark lesson *partial complete* for tech track.

### checkpoint
`audience-split`

### expected
Facilitator noteert per deelnemer: watch | skip | wait-LIS-65 | ready-for-starters.

### playground
UI toggle: Non-tech / Tech.

---

## Stap 4 — Starters gate (LIS-65) (rest)

### coach_mensentaal
Zodra de starters er zijn: open weather-SDK, herhaal kleding-quest; open council-SDK, herhaal judge-quest. Badge “SDK bridge” pas daarna voor tech.

### coach_tech
Expected starter IDs (Herdr): `weather-agent-sdk`, `council-agent-sdk`. Wire URLs into manifest when ready. Do not invent clone URLs here.

### checkpoint
`starters-gate`

### expected
- PENDING: lesson status = content ready, labs blocked.  
- READY: both mini-quests green on SDK starters.

### playground
UNKNOWN tot LIS-65 — placeholder panel in Academy: “Starters komen via Herdr (LIS-65).”

---

## Exit criteria

- [ ] Mapping table begrepen
- [ ] Mini-quest parity uitgelegd
- [ ] Non-tech watch/skip of tech wait/ready gekozen
- [ ] Starters: PENDING of completed (niet geclaimd zonder LIS-65)

**Geen secrets. Geen verzonnen starter-metrics.**
