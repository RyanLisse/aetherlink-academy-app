# Solo 04 — Hooks: guarantees vs sticky notes

Remember beat 01: CLAUDE.md is usually followed — like sticky notes. Some rules must happen every time.

STOP: Ready for sticky notes vs guarantees?

USER: Yes / ready

---

## Uitleg

A **hook** is an automatic rule attached to a moment in Claude Code (for example after an edit, on stop, on session start). Hooks give **deterministic** control: the action runs because the system runs it, not because the model remembered the sticky note.

Use CLAUDE.md when "usually" is enough.
Use a hook when "every time" is the product requirement (backup on edit, block stop while typecheck is red, refuse a path).

STOP: Finish this sentence: Instructions are requests; hooks are _____.

USER: guarantees / deterministic / must-happen

---

## Voordoen

ACTION: Create `artifacts/04-hooks-card.html` — HTML card with two rows: **Sticky note (CLAUDE.md)** vs **Guarantee (hook)**, one classroom-safe example each (no production destruction). Tell the learner to open it.

Then walk Proof:

ACTION: Ensure `proof/PROOF.md` and `proof/artifact-card.html` exist as templates. If empty sections need learner answers, leave clear placeholders. Tell the learner they will fill Proof next.

STOP: Pick one rule from your own work that should be a hook, not a sticky note — or mark OPEN.

USER: A must-happen rule or OPEN

---

## Zelf doen — Proof

Have the learner fill `proof/PROOF.md` with short answers:

1. CLAUDE.md belongs / does not belong (two bullets each)
2. Skill vs agent one-liner + one example each
3. First MCP plug + why read-only
4. One hook-worthy rule vs one sticky-note rule

Also tick the checklist on `proof/artifact-card.html`.

STOP: When Proof is saved, celebrate. Trail complete. Paste Proof / artifact card back into Academy Review for Classroom 1–2.

USER: Confirms Proof written

## Success criteria
- Learner contrasts sticky notes vs hooks
- Learner names one hook-worthy rule (or OPEN)
- `artifacts/04-hooks-card.html` exists
- `proof/PROOF.md` filled; artifact card checklist touched
