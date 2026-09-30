# Intent, evidence and review

Each squad links one external intent document (a Proof cloud document or `intent.md` in the squad repo); participants submit observed evidence (from the solo mission or via MCP), it appears as an attributed pending review item, and the facilitator or driver judges it. The debrief board is native Academy room state.

## Sub-features

- `intent-link` the squad room shows `Our intent` (badge `Intent document`). Driver or facilitator saves an `https://` link; everyone sees `Open intent document`, which opens in a new tab.
- `intent-template` without a link the panel shows `No intent link yet` and offers `Download intent.md template` (`/game/intent.md`).
- `evidence-submit` participant fills the solo mission form and chooses `Submit evidence`.
- `review-decide` facilitator opens `Review & handoff`, picks `Sufficiently supported` or `More evidence needed`, writes a note and chooses `Save review`.
- `review-readback` the item status changes from `Awaiting review` to `Human-reviewed`.
- `debrief-board` facilitator opens the board; members add cards per column; close and reopen keep the cards; `Export` downloads the debrief.

## How to get to it (user POV)

- Squad room view (`Squad room` in `Main navigation`) shows the intent panel.
- `Solo mission` in `Main navigation` holds the evidence form.
- `Review & handoff` in `Main navigation` lists evidence for review.
- The facilitator teach bar has the debrief board button (`data-testid="fac-board-open"`).

## Driving it with Playwright

Preconditions:

- A squad with a facilitator and at least one participant from squad-room.md, each in their own context.

- **Intent link.** As Driver, fill `Link to the intent document` with a unique `https://example.test/<uuid>/intent.md` and choose `Save link`. Reload a Navigator's page; `[data-testid="intent-document"] a[href="<link>"]` is present and has `target="_blank"`. A Navigator sees no edit controls.
- **Invalid link.** `http://…`, `intent.md` or a link with credentials is refused with `Enter a full https:// link to the intent document.`
- **Submit evidence.** Participant: `Solo mission`, fill the finding, command, observed and limitation fields, choose `Submit evidence`. `Evidence added to the squad review.` appears.
- **Review.** Facilitator: `Review & handoff`. `Evidence (1)` lists the item as `Awaiting review`. Choose `Sufficiently supported`, fill `Your check and decision`, choose `Save review`.
- **Read back.** Reload the facilitator page and open the participant's `Review & handoff`. The item reads `Human-reviewed` in both.
- **Debrief board.** Facilitator opens the board; a participant adds a card; the facilitator's view shows it after the next poll. Close, reopen, the card is still there.
- **Proof.** Screenshots before and after each write, ARIA snapshot of the review list, `state.json` with the link, evidence text and final status.

## Gotchas

- The Academy hosts no editor. `/d/*`, `/api/documents/*`, `/game/document` and `/game/suggestions` return 404.
- Only the Driver or facilitator sets the link (403 otherwise); MCP tokens cannot set it (401).
- Evidence is a squad contribution awaiting human review, not an accepted conclusion.
