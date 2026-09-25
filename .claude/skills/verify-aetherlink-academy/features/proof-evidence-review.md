# Proof evidence and review

Each squad shares one Proof intent document; participants submit observed evidence (from the solo mission or via MCP), it appears as an attributed Proof comment and a pending review item, and the facilitator judges it.

## Sub-features

- `proof-doc` the squad room embeds the shared Proof document (`Our intent`, badge `Shared document · Proof`) with a live sync status.
- `proof-edit` the Driver edits; edits persist across reload and reach a second member.
- `evidence-submit` participant fills the solo mission form and chooses `Submit evidence`.
- `review-decide` facilitator opens `Review & handoff`, picks `Sufficiently supported` or `More evidence needed`, writes a note and chooses `Save review`.
- `review-readback` the item status changes from `Awaiting review` to `Human-reviewed`.

## How to get to it (user POV)

- Squad room view (`Squad room` in `Main navigation`) shows the document.
- `Solo mission` in `Main navigation` holds the evidence form.
- `Review & handoff` in `Main navigation` lists evidence for review.

## Driving it with Playwright

Preconditions:

- A squad with a facilitator and at least one participant from squad-room.md, each in their own context.

- **Document loads.** In the squad room, the Proof iframe loads and the status reads `Proof connected · changes saved`, not `Proof could not load` or `Proof offline`.
- **Edit and read back.** As Driver, type a unique sentence into the editor's `contenteditable`. Wait for `Proof connected · changes saved`. Reload a second member's page; the sentence is present.
- **Submit evidence.** Participant: `Solo mission`, fill the finding, command, observed and limitation fields, choose `Submit evidence`. A confirmation appears.
- **Review.** Facilitator: `Review & handoff`. `Evidence (1)` lists the item as `Awaiting review`. Choose `Sufficiently supported`, fill `Your check and decision`, choose `Save review`.
- **Read back.** Reload the facilitator page and open the participant's `Review & handoff`. The item reads `Human-reviewed` in both.
- **Proof.** Screenshots before and after review, ARIA snapshot of the review list, `state.json` with the evidence text and final status.

## Gotchas

- Proof runs on loopback (`4831` in a verification run) behind the gateway. `/game/health` with `proof:false` means the Proof child died; the gateway exits with it, so check `academy.log`.
- The Proof iframe origin is the gateway; WebSocket upgrades to `/ws?slug=<slug>` are rejected (403) for a different room or a foreign `Origin` header.
- Only the Driver can edit; a Navigator's typing is ignored. Rotate roles first if needed.
- Evidence is a Proof comment plus a squad contribution, not an accepted change to the document text.
- `/assets/*` requests are proxied to Proof with the room session; unauthenticated asset requests 401 by design there (see the classroom-deck known bug).
