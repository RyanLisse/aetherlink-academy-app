# L2 — LLM Council (Eve)

**Route:** `/arcade/council`  
**Track:** eve  
**Linear:** LIS-62  
**Duration:** ~40–50 min  
**Source:** https://eve.dev/templates/eve-llm-council-template  

**Playground default:** Next.js app — `pnpm install` → `pnpm exec eve link` → `pnpm dev`.  
`eve link` koppelt een Vercel-project en haalt AI Gateway credentials op. **Facilitator:** credentials blijven lokaal/env — nooit in git of chat.

**Architectuur (bron):**
```text
prompt → four parallel council members → judge answer + agreement scores
```

Council members (template): SpaceXAI Grok 4.7 · Anthropic Claude Opus 5 · OpenAI GPT-5.6 Sol · Moonshot AI Kimi K3.

Oriëntatiebestanden:
- `agent/instructions.md` — fan-out + judging
- `agent/subagents/` — vier vaste members
- `agent/lib/schemas.ts` — final answer + scores
- `app/council-app.tsx` — submit, child streams, render

Toggle captions: **Mensentaal** | **Tech**

---

## Stap 0 — Waarom meerdere models (5 min)

### coach_mensentaal
Eén model kan blind zelfverzekerd zijn. Een **raad** vraagt meerdere meningen, daarna vat een **rechter** samen en geeft **overeenstemmingsscores**. Jij ziet waar ze het eens zijn — en waar niet.

### coach_tech
Parallel fan-out over fixed gateway models → durable child sessions → structured judge output (answer + per-model agreement). Diversiteit = signal; judge = reduction.

### checkpoint
`why-multi-model`

### expected
Deelnemer noemt: parallel antwoorden + judge + scores.

### playground
Toon flow-diagram uit de template. Nog geen run.

---

## Stap 1 — Fan-out, streams, judge-schema (10 min)

### coach_mensentaal
Je stuurt één prompt. Vier antwoorden komen binnen (vaak streaming). Daarna één korte uitspraak van de rechter plus scores per model. Lees eerst de scores; dan de tekst.

### coach_tech
Root agent delegeert naar declared subagents. Client volgt child session streams (`withEve` / `useEveAgent`). Schema in `agent/lib/schemas.ts`. Instructions in `agent/instructions.md` bepalen fan-out + judge gedrag.

### checkpoint
`fanout-judge-schema`

### expected
Deelnemer wijst in de UI/code: members, streams, judge output fields.

### playground
Open `schemas.ts` + `instructions.md` (read-only eerst).

---

## Stap 2 — Run one prompt (12–15 min)

### coach_mensentaal
Installeer, link, start. Stel **één** duidelijke vraag. Wacht tot alle members klaar zijn. Lees scores. Waar is overeenstemming hoog? Waar laag?

### coach_tech
```bash
pnpm install
pnpm exec eve link
pnpm dev
```
Open de lokale Next.js URL. Optioneel later: `pnpm typecheck` / `pnpm build` (niet verplicht in cohort-tijd).

### checkpoint
`run-one-prompt`

### expected
Vier member-outputs zichtbaar + judge answer + agreement scores. Deelnemer noteert hoogste/laagste score (geen verzonnen totalen — alleen wat de UI toont).

### playground
Prompt-voorbeeld: `Leg in 5 zinnen uit wanneer je een single agent vs een council gebruikt.`

**Fallback:** als `eve link`/gateway faalt → facilitator demo-stream of pre-recorded screen; deelnemers doen dan alleen instruction-read + mini-quest op gedeelde sessie.

---

## Stap 3 — Mini-quest: change judge instruction (12–15 min)

### coach_mensentaal
Pas in `instructions.md` **alleen de rechter-regel** aan. Bijvoorbeeld: “wees strenger bij vage claims” of “antwoord altijd in het Nederlands, max 80 woorden”. Zelfde prompt opnieuw. Merk je verschil in samenvatting of scores?

### coach_tech
Instruction delta scoped to judge behavior. Do not retarget subagent models in this quest. Diff review: één intent. Re-run same prompt; compare judge text + score pattern.

### checkpoint
`mini-quest-judge`

### expected
Judge-output verschilt aantoonbaar (toon/lengte/strengheid). Badge-bewijs: before/after of één annotated screenshot.

### playground
Edit judge portion of `agent/instructions.md` → rerun → capture.

---

## Exit criteria (L2)

- [ ] Multi-model “waarom” begrepen
- [ ] Fan-out → judge + scores uitgelegd
- [ ] Eén live (of facilitator) run gezien
- [ ] Judge-instruction mini-quest gedaan

**Badge:** council run bewijs (screenshot of session).
