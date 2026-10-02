# C1–C2 — Solo-in-Claude concepts (≈80% ASD-STE100)

**Course:** AetherLink Academy · Classroom 1–2 concepts  
**Linear:** AET-132  
**Pattern:** Solo-in-Claude (Carl mechanism only, CC BY-NC-ND — no Basecamp prose fork)  
**Related Arcade:** `/arcade/sdk-bridge` · mapping Eve ↔ Claude Agent SDK  
**Duration:** ≈35–50 min  
**Language:** English (course scripts). Academy chrome follows locale lock.  
**Style:** ≈80% ASD-STE100.


---

## Companion explainer (video)

**File:** `/academy-assets/c1-c2-solo-in-claude-explainer.mp4`  
**Serve URL:** `/academy-assets/c1-c2-solo-in-claude-explainer.mp4`  
**Length:** ≈75s · H.264 + AAC  
**Voice:** ElevenLabs `5l5f8iK3YPeGga21rQIX` (cut A)  
**Pairs with:** Arcade `/arcade/sdk-bridge` · Linear AET-132 · Solo-in-Claude C1–C2 concepts

Open the mp4 from the Arcade asset path, or play it before the SDK bridge Solo path. The video covers: Solo → starter · CLAUDE.md · skill ≠ agent · MCP · hooks (ask vs enforce) · Eve ↔ Claude parity.


---

## 0. Purpose

You learn how **Solo timelines** map onto **Claude Code / Agent SDK** starters. Scope is Classroom 1–2 concepts only — not W4 weather/council packs as the primary path.

Four ideas:

1. **CLAUDE.md** — project standing instructions.
2. **Skills vs agents** — guidance vs goal-directed runners.
3. **MCP** — tools the model can call through a protocol.
4. **Hooks** — gates around tool use and turns.

Naslag = Anthropic Academy link-outs + Carl concepts guide (link-out only). Do not re-host those bodies.

---

## 1. Solo timeline ↔ live starter

### Facts

- An Arcade **Solo** is a Scrimba-style timeline: play, pause, fork-edit, checkpoint.
- A **live** Claude Agent SDK / Claude Code run is separate. Credentials stay local.
- The Solo teaches the shape. The starter proves the same shape with a real runtime.

### Mapping (keep parity)

| Solo / Eve idea | Claude side |
|-----------------|-------------|
| `instructions.md` | CLAUDE.md / system prompt |
| Typed tool | MCP tool or SDK tool |
| Markdown skill | Skill / procedure text |
| Checkpoint | Hook or permission gate |
| Timeline chapter | Lesson step in starter README |

### Check

You can say: “Solo coaches the shape; the starter runs it.”

---

## 2. CLAUDE.md mental model

### Facts

- CLAUDE.md holds **standing rules** for the project.
- It is always on for that workspace — like Eve `instructions.md`.
- Change one rule. Rerun. Show the difference.

### Check

CLAUDE.md = always-on project instructions — not a one-shot chat message.

---

## 3. Skills vs agents

### Facts

- A **skill** guides how to work (markdown procedure). It does not execute by itself.
- An **agent** has a goal, tools, and instructions. It runs a loop until it answers or stops.
- Same Academy rule as L1: skill ≠ tool; skill ≠ agent.

### Check

One sentence each for skill and agent.

---

## 4. MCP

### Facts

- **MCP** (Model Context Protocol) connects the model to tools and servers.
- In teaching starters, weather may arrive as an in-process MCP tool or a stand-in for day-1 n8n.
- You approve which tools the agent may call.

### Check

MCP = how tools arrive at the model — not “another chat window.”

---

## 5. Hooks

### Facts

- **Hooks** run around tool use or turns (approve, block, log, transform).
- They make Solo “checkpoints” real in code: gate a write, require a review, stop a bad call.
- Hooks enforce rules that prose instructions only request.

### Check

Instruction asks; hook can enforce.

---

## 6. Practice path

1. Open the C1–C2 Solo package (or Arcade SDK bridge mapping table).
2. Name CLAUDE.md, one skill, one MCP tool, one hook idea.
3. Optional stretch: clone `weather-agent-sdk` and point to the same decision contract as the Solo.
4. Save evidence (checkpoint screenshot or test PASS).

### Exit criteria

- [ ] Solo ↔ starter mapping stated
- [ ] CLAUDE.md explained
- [ ] Skills vs agents explained
- [ ] MCP explained
- [ ] Hooks explained
- [ ] Evidence saved

**Out of scope:** re-hosting Anthropic course bodies; W4 council as primary C1–C2 path.
