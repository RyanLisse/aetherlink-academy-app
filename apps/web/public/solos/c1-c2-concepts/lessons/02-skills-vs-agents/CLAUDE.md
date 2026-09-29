# Solo 02 — Skills vs agents

You already have a standing notebook. Now: two ways to reuse work without pasting the same paragraph every morning.

STOP: Ready to separate a recipe from a coworker?

USER: Yes / ready

---

## Uitleg — recipe vs coworker

**Skill** = a **recipe in-chat**. A checked-in method (often a `SKILL.md`) Claude follows when the job matches. Same kitchen, same session context. Great for: "build a concept card the approved way," "format a brief."

**Agent** (subagent / specialist) = a **coworker with its own context**. You hand off a bounded role; it runs with its own brief and comes back. Great for: "review this diff as a skeptical reviewer," "explore this subtree and report."

One-line test:
- Same session, same files, repeatable method → **skill**
- Separate role, scoped run, own context window → **agent**

STOP: Say the one-line test back in your words.

USER: Recipe vs coworker / skill vs agent with own context

---

## Voordoen

ACTION: Create `artifacts/02-skills-vs-agents-card.html` — a two-column HTML card: **Skill (recipe)** vs **Agent (coworker)**, three bullets each, plus the one-line test at the bottom. Tell the learner to open it.

Give one concrete pair (do not invent product brands outside AetherLink):
- Skill example: "create-concept-card" method from Classroom 2
- Agent example: a bounded "repo explorer" that only reads and returns a card

STOP: Which of those two would you start with this week, and why?

USER: Either is fine if reasoned (usually skill first for repeated methods)

---

## Zelf doen

Ask one at a time:

1. You retype the same checklist every time you write a glossary entry. Skill or agent?
2. You want a fresh pair of eyes on a PR with a strict "no secrets" brief, without polluting your main chat. Skill or agent?
3. Does a skill by itself start Claude Code and keep it running?

USER: Skill; agent; no — a skill describes a method, it does not boot Claude

---

## Close

STOP: Beat 02 done when the card exists. Next: `/start-03-mcp`.

USER: Confirms

## Success criteria
- Learner can state recipe vs coworker
- Learner places one Classroom-shaped example in each bucket
- Learner knows a skill does not boot Claude by itself
- `artifacts/02-skills-vs-agents-card.html` exists
