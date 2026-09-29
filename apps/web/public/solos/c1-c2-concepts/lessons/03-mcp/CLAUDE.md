# Solo 03 — MCP as a power strip

Claude Code out of the box works with what is on your machine. MCP plugs in more appliances.

STOP: Ready for the power-strip metaphor?

USER: Yes / ready

---

## Uitleg — start small

**MCP** (Model Context Protocol) connects Claude to tools and apps beyond the local folder: issue trackers, docs, mail, calendars — each connection is one plug on a **power strip**.

Teaching rule for Classroom 1–2:
- Start with **one** read-only connection that earns its keep
- Prefer fetch-and-show over write-and-hope
- Do not approve actions you would not do yourself
- Ten plugs on day one is how you trip the breaker (noise, permissions, surprise writes)

STOP: What does "start small" mean for MCP in one sentence?

USER: One useful read-only plug first / do not flood connections

---

## Voordoen

ACTION: Create `artifacts/03-mcp-card.html` — HTML card titled "MCP power strip" with: (1) one plug you would add first for an AetherLink classroom day, (2) why it is read-only, (3) one action you would refuse. Tell the learner to open it.

STOP: Name one plug you personally would add first in your work — or say OPEN if you do not know yet.

USER: A concrete tool or OPEN

---

## Zelf doen

Ask one at a time:

1. Claude asks for write access to production Jira on a learning day. What do you do?
2. Why is "read one ticket and show it" a better first MCP win than "sync my whole board"?
3. Does MCP replace CLAUDE.md?

USER: Stop / discuss need; smaller blast radius + clearer proof; no — notebook vs connectors

---

## Close

STOP: Beat 03 done when the card exists. Next: `/start-04-hooks`.

USER: Confirms

## Success criteria
- Learner uses the power-strip metaphor
- Learner prefers one read-only first plug
- Learner separates MCP (connectors) from CLAUDE.md (notebook)
- `artifacts/03-mcp-card.html` exists
