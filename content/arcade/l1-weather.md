# L1 — Weather agent (Eve)

**Route:** `/arcade/weather`  
**Track:** eve  
**Linear:** LIS-61  
**Duration:** ~40–50 min  
**Source:** https://eve.dev/templates/weather-agent-fixture  

**Playground default:** local Eve TUI via `pnpm dev` — **geen credentials nodig voor de TUI**.

**Bestanden in de fixture (oriëntatie):**
- `agent/agent.ts` — modelconfig
- `agent/instructions.md` — altijd-aan instructies
- `agent/tools/get_weather.ts` — typed weather tool
- `agent/skills/get-weather.md` — markdown skill (procedure)

Toggle captions: **Mensentaal** | **Tech**

---

## Stap 0 — Warm-up (2 min)

### coach_mensentaal
Een agent is geen chatbuddy. Een agent heeft een **doel** en **tools** om dat doel te halen. Jij stuurt het doel; de tools doen het werk.

### coach_tech
Agent = goal-directed loop over tools + instructions + model. Geen free-chat zonder contract.

### checkpoint
`agent-goal-tools`

### expected
Deelnemer kan in één zin zeggen: “doel + tools, geen losse chat.”

### playground
Geen run. Toon diagram: Goal → Model → Tools → Observation → antwoord.

---

## Stap 1 — Open & run de fixture (8 min)

### coach_mensentaal
We starten de weather-agent zoals hij is. Eerst kijken, dan pas knutselen. Als hij draait, mag je een simpele vraag stellen over het weer.

### coach_tech
Clone/open de weather-agent-fixture. Root: `pnpm dev` → lokale runtime + interactive TUI. Geen API-keys voor de TUI-smoke. E2E fixtures zitten onder `e2e/fixtures` (niet nodig voor de les).

### checkpoint
`run-fixture-tui`

### expected
TUI start. Deelnemer ziet een antwoord op een simpele weervraag (of een duidelijke tool-call flow).

### playground
```sh
pnpm dev
```
Prompt-voorbeeld: `Wat is het weer in Amsterdam?`

---

## Stap 2 — Edit instructions (één zin) (8 min)

### coach_mensentaal
Nu één verandering. Voeg in `instructions.md` één zin toe over **toon** (kort, vriendelijk, of “antwoord altijd in het Nederlands”). Run opnieuw. Merk je verschil?

### coach_tech
`agent/instructions.md` is always-on system prompt. Diff = één zin. Geen tool-wijziging. Observeer response shape / language / verbosity.

### checkpoint
`edit-instructions`

### expected
Zichtbaar gedragverschil na herstart/herlaad (toon of taal). Deelnemer kan de zin aanwijzen die het veroorzaakte.

### playground
Open `agent/instructions.md` → één zin → opnieuw prompten in TUI.

---

## Stap 3 — Tool `get_weather` (10 min)

### coach_mensentaal
De tool is de **handeling**: “haal weer op”. Input = plek (en wat de tool vraagt). Output = gestructureerde weerdata. De agent *kiest* wanneer hij de tool gebruikt.

### coach_tech
Lees `agent/tools/get_weather.ts`: typed inputs/outputs. Model call → tool invocation → observation terug in de loop. Geen handmatige HTTP in de les; focus op contract.

### checkpoint
`tool-get-weather`

### expected
Deelnemer noemt: tool-naam, minstens één input, en dat output terugkomt naar het model.

### playground
Trigger een prompt die `get_weather` forceert (andere stad). Wijs tool-call in TUI/log aan.

---

## Stap 4 — Skill vs tool (6 min)

### coach_mensentaal
**Tool** = knop die iets doet. **Skill** (markdown) = uitleg/procedure hoe je die knop slim gebruikt. Skill verandert geen API; skill verandert strategie.

### coach_tech
`agent/skills/get-weather.md` = procedurele guidance. `get_weather` tool = executable capability. Skills zijn content; tools zijn typed functions.

### checkpoint
`skill-vs-tool`

### expected
Deelnemer kan skill en tool uit elkaar houden in één zin elk.

### playground
Open skill-bestand naast tool-bestand. Geen edit verplicht.

---

## Stap 5 — Mini-quest: kledingadvies (10–12 min)

### coach_mensentaal
Voeg in `instructions.md` toe: als er weerdata is, geef **kort kledingadvies** (jas / geen jas / paraplu). Geen nieuwe tool. Alleen instructie. Bewijs: screenshot of session-link voor badge.

### coach_tech
Instruction-only delta. Assert: na `get_weather` observation bevat final answer clothing hint. Geen nieuwe tool tenzij facilitator stretch goedkeurt.

### checkpoint
`mini-quest-clothing`

### expected
Antwoord bevat weer + kledingadvies. Badge-bewijs geüpload/getoond.

### playground
Edit instructions → `pnpm dev` → prompt met stad → capture output.

---

## Exit criteria (L1)

- [ ] Agent = doel + tools uitgelegd
- [ ] Fixture gerund zonder creds (TUI)
- [ ] Eén instruction-edit bewezen
- [ ] `get_weather` contract begrepen
- [ ] Skill ≠ tool
- [ ] Mini-quest clothing advice gedaan

**Badge:** “first agent” — session link of screenshot.
