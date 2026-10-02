# Workshop 4 — Solos and agents (≈80% ASD-STE100)

**Course:** AetherLink Academy · Agent Arcade  
**Linear:** AET-130 (W4 Solo packs) · Arcade workshop #4 lesson id `ws-2-eve-council`  
**Routes:** `/arcade` · `/arcade/solo?lesson=ws-1-eve-weather` · `/arcade/council` · `/arcade/solo?lesson=ws-2-eve-council` · `/arcade/sdk-bridge`  
**Duration:** ≈45–90 min (Solo timeline + optional live run)  
**Language:** English (source of truth). Captions may still toggle Mensentaal | Tech in the player.  
**Style:** ≈80% ASD-STE100 — short sentences, active voice, simple words where practical. Tech nouns kept.

---

## Companion explainer (video)

**File:** `/academy-assets/w4-agents-council-explainer.mp4`  
**Serve URL:** `/academy-assets/w4-agents-council-explainer.mp4`  
**Length:** ≈77.5s · H.264 + AAC  
**Voice:** ElevenLabs `5l5f8iK3YPeGga21rQIX` (cut A)  
**Pairs with:** Solo `ws-2-eve-council` · route `/arcade/council` · Linear AET-130

Open the mp4 in a new tab from the Arcade hub asset path, or play it before the council Solo. The video covers: Solo vs live runtime → agent = goal + tools + instructions → skill ≠ tool → council fan-out → judge (scores ≠ truth).


---

## 0. Purpose

You learn three skills in Workshop 4:

1. Use an **Arcade Solo** — a timed lesson in the browser.
2. Build and change a **single agent** (weather) with a goal, instructions, and tools.
3. Run a **council** — four independent models, then one judge with agreement scores.

You do not embed secrets in Solo pages. Live Eve or Claude Agent SDK runs stay in your own environment.

---

## 1. What a Solo is

### Facts

- A **Solo** is a Scrimba-style timeline in the browser.
- You can play, pause, fork-edit, and hit checkpoints.
- A Solo is **not** a hosted Eve iframe.
- A Solo is **not** multiplayer editing.
- Default Solo for the hub: `ws-1-eve-weather`.
- Workshop 4 Solo id for council: `ws-2-eve-council`.

### How you start

1. Open `/arcade`.
2. Select **Start solo** or open a lesson page and start its Solo.
3. At a checkpoint, edit if the lesson asks you to edit.
4. Reset before you continue the timeline if the lesson says so.
5. Optional: open the live template or SDK starter when you need a real run.

### Check

You can state in one sentence: “Solo = timed coach + editor in the browser; live runtime stays separate.”

---

## 2. What an agent is

### Facts

- An agent is **not** a free chat buddy.
- An agent has a **goal**.
- An agent has **tools** that do actions.
- An agent has **instructions** that stay on for every turn.
- A **skill** (markdown) guides strategy. A skill does not execute code.
- A **tool** is a typed function. A tool does the action and returns data.

### Loop (remember this shape)

```text
Goal → Model → Tools → Observation → Answer
```

### Check

You can say: “goal + tools + instructions — not free chat.”

---

## 3. Pack A — Weather agent (L1 Solo / SDK)

**Sources:** Eve weather fixture · `weather-agent-sdk` · Solo `ws-1-eve-weather`  
**Learning goal:** Change behavior with one instruction. Understand the `get_weather` tool contract.

### Steps

1. **Warm-up.** State the agent loop. Do not run yet.
2. **Run the fixture.** Start the TUI or Solo timeline. Ask a simple weather question (example: Amsterdam).
3. **Edit one instruction.** Add one sentence about tone or language in `instructions.md`. Run again. Show the difference.
4. **Read the tool.** Name the tool, at least one input, and that output returns to the model.
5. **Skill vs tool.** Open the skill file next to the tool file. Write one sentence for each.
6. **Mini-quest.** Add clothing advice after weather data (coat / no coat / umbrella). Do **not** add a new tool. Capture a screenshot or session link for the badge.

### Exit criteria (weather)

- [ ] Agent = goal + tools explained
- [ ] Fixture or Solo run completed
- [ ] One instruction edit shown
- [ ] `get_weather` contract understood
- [ ] Skill ≠ tool
- [ ] Clothing mini-quest done

---

## 4. Pack B — W3→W4 bridge (day5 / n8n → agent)

**Source pack (AET-130):** `aetherlink-day5-n8n-to-agent`  
**Learning goal:** Keep the same functional task when you move from a workflow canvas to an agent runtime.

### Facts

- Day packs and n8n teach the same **decision contract** (example: umbrella threshold).
- Workshop 4 moves that contract into an **agent** with instructions and tools.
- Drafts stay drafts. Humans approve before any real send or payment write.
- Node names and tool contracts must stay stable across days so evidence compares cleanly.

### Check

You can name one shared contract (example: weather decision) that exists in both the workflow and the agent.

---

## 5. Pack C — LLM Council (Workshop 4 Solo)

**Sources:** Eve LLM council template · Solo `ws-2-eve-council` · stretch `council-agent-sdk`  
**Route:** `/arcade/council` · `/arcade/solo?lesson=ws-2-eve-council`  
**Learning goal:** See independent answers, then a judge summary with agreement scores. Change only the judge rule and measure the effect.

### Architecture

```text
One prompt → four parallel members → judge summary + agreement scores (0–100)
```

Members in the Arcade Solo (fixed for the lesson): Claude · Grok · Kimi · OpenAI.  
Record any model-id substitution if your live template differs.

### Rules the coordinator must follow

1. Call all four members **exactly once**.
2. Send each member the **same complete question**.
3. Do **not** forward one member’s answer to another.
4. Wait until **all four** answers exist before judging.
5. Judge on **evidence and accuracy**, not majority vote.
6. Return a short summary and an agreement score per member.

### Steps

1. **Why multi-model.** One model can be confident and wrong. A council shows agreement and disagreement.
2. **Setup (live path).** Copy the pinned template revision. Install with the declared pnpm version. Link credentials locally. Confirm spend limits. Start `pnpm dev`.
3. **Predict, then ask.** Write your own answer first (example: 24 people, 6 seats → 4 tables). Then run the council.
4. **Read members before the summary.** Watch four independent replies arrive.
5. **Inspect the contract.** Summary + four integer scores 0–100. Know: a score is **not** a probability of truth. Four models can agree on the same mistake.
6. **Introduce uncertainty.** Ask a question with missing facts (no city, date, forecast). The summary must name missing information. The council has **no weather tool** in this lesson — a confident forecast would invent evidence.
7. **Verify independence.** In the trace, each member got the same full prompt. Count **four** completed members. Three is incomplete.
8. **Mini-quest — change a rule.** Change the summary word limit (example: 75 → 40). Rerun the table question in a **fresh** conversation. Count the words. Only the **judge** output should change. Members still get the same question.
9. **Enforce vs instruct.** If the judge exceeds the limit, you expose the gap between a prose instruction and a code-enforced schema check.

### Knowledge checks

| Question | Correct idea |
|----------|----------------|
| What does an agreement score mean? | How closely a member agrees with the **judge’s** conclusions — not “chance correct.” |
| What did your word-limit change affect? | The judge output. Enforce in code by validating after parse. |

### Exit criteria (council)

- [ ] Multi-model “why” explained
- [ ] Fan-out → judge + scores explained
- [ ] One live or facilitator run seen (or full Solo timeline completed)
- [ ] Independence verified (four members, same prompt)
- [ ] Judge-instruction mini-quest done
- [ ] Badge evidence saved (screenshot or session)

---

## 6. Audience split

| Audience | Path |
|----------|------|
| Non-technical | Stay longer on Eve UI / Solo player. Live SDK optional. Mapping table = dictionary. |
| Technical | Finish Eve Solo faster. Complete SDK starters for weather and council mini-quests. |

**SDK bridge mapping (keep parity):**

| Eve | Claude Agent SDK |
|-----|------------------|
| `instructions.md` | System / instruction text |
| Typed tool | SDK tool (name, schema, handler) |
| Markdown skill | Procedure text / skill doc |
| Council subagents | Parallel agents / multi-call |
| Judge + scores | Structured output / scoring step |

---

## 7. Safety and evidence

- Never commit API keys, gateway tokens, or personal credentials.
- Prefer draft-only outputs and human approval gates.
- Evidence = screenshot, Solo checkpoint, or execution log you actually produced.
- Do not invent metrics or scores that the UI did not show.

---

## 8. Badge

**“Workshop 4 — Solos & agents”** when you have:

1. Weather clothing mini-quest evidence, **or** full `ws-1-eve-weather` Solo complete, **and**
2. Council judge mini-quest evidence, **or** full `ws-2-eve-council` Solo complete.

Stretch: same mini-quests on `weather-agent-sdk` and `council-agent-sdk`.

---

## 9. Facilitator one-liners

- Solo first for pace; live run for proof.
- Predict before you ask — tests flow without live-fact lookup.
- Scores ≠ truth probability.
- Incomplete run = fewer than four member answers.
- Instruction change ≠ schema enforcement.
