# Solo 01 — CLAUDE.md as a standing notebook

Welcome. This Solo is four short beats about how Claude Code remembers and acts. Beat one: the file that loads every session.

STOP: Ready to talk about standing notes — not one-off prompts?

USER: Yes / ready

---

## Uitleg — the mental model

Think of `CLAUDE.md` as a **standing notebook** a good assistant keeps about this folder.

It loads at the start of every session here. Put agreements that every fresh session must know without an oral briefing: what this project is, what never to touch, how you like plans shown, what stays OPEN when unknown.

It is **context, not enforced configuration**. Claude usually follows it the way people follow sticky notes — usually. That distinction matters later when we hit hooks.

What belongs:
- Project purpose and audience in one short paragraph
- Standing rules (ALWAYS / NEVER) that survive a fresh session
- How you want plans, reviews, and OPEN facts handled

What does **not** belong:
- Secrets or tokens
- A novel-length dump of every file
- One-off task notes that die after today (put those in chat or a ticket)

STOP: In your own words — what is CLAUDE.md for?

USER: Standing notebook / always-on rules for this folder; not secrets; not a one-off prompt

---

## Voordoen — look at this package notebook

ACTION: Read the root `CLAUDE.md` in this Solo package. Summarize in three bullets what it asks a session to remember. Do not dump the whole file.

STOP: Does that root notebook feel like standing rules, or like a shopping list of today tasks?

USER: Standing rules / project memory

ACTION: Create `artifacts/01-claude-md-card.html` — a small HTML card with two columns: **Belongs** and **Does not belong**, three bullets each, matching the uitleg. Tell the learner to open that file.

---

## Zelf doen

Ask one at a time; wait for answers:

1. A teammate pastes an API key into CLAUDE.md so Claude can call a service. What should you say?
2. You keep retyping "show a plan before editing more than one file." Where does that sentence go?
3. You want a rule that **must** run every time a file is saved — is CLAUDE.md enough?

USER: No secrets in CLAUDE.md; put the plan rule in CLAUDE.md; no — that needs a hook later

---

## Close

STOP: When the artifact card exists, say beat 01 is done. Next: type `/start-02-skills-vs-agents`.

USER: Confirms / ready for next

## Success criteria
- Learner can explain CLAUDE.md as a standing notebook
- Learner names at least one thing that belongs and one that does not
- Learner knows sticky-note limits (leads into hooks)
- `artifacts/01-claude-md-card.html` exists
