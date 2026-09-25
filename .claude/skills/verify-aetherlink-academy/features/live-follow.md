# Live follow

During a classroom session the facilitator drives the deck from a presenter view and every participant's follow view moves with them; a participant can detach to browse, and the facilitator can pull everyone back.

## Sub-features

- `live-connect` presenter and followers connect over WebSocket (SSE fallback) and show `data-connection="open"`.
- `live-follow` facilitator `next-slide` advances every following participant.
- `live-detach` a participant detaches (`Losgekoppeld`) and is not pulled along.
- `live-back` facilitator `everyone-back` returns detached participants to follow (`Volgend`) with a notice.
- `live-timer` facilitator `start-timer` shows `follow-timer` on followers; it survives a WebSocket reconnect.

## How to get to it (user POV)

- Facilitator opens `/live/<room>/presenter?id=facilitator-1&name=Facilitator`.
- Participant opens `/live/<room>/follow?id=<id>&name=<name>`.
- Projector opens `/live/<room>/projector`.

## Driving it with Playwright

Preconditions:

- The live API (`/live/<room>/ws`, `/sse`, `/command/<cmd>`) is only served by `apps/server/src/live/e2e-server.ts` or `standalone.ts`, not by the gateway or the wave runtime. Use the repo harness on a free port: `ACADEMY_LIVE_PORT=4735 pnpm test:e2e live-sync.spec.ts`.

- **Harness run.** The command above builds `apps/web`, starts the e2e server on 4735 and runs both live-sync tests. `2 passed`.
- **Connect.** Three pages: presenter plus two followers. `getByTestId('live-classroom')` has `data-connection="open"` on all; followers' `getByTestId('follow-status')` reads `Volgend`.
- **Detach.** Follower 2 clicks `getByTestId('detach')`. Its status reads `Losgekoppeld`.
- **Advance.** Presenter clicks `getByTestId('next-slide')`. Presenter and follower 1 `#count` contain `02`; follower 2 stays on `01`.
- **Everyone back.** Presenter clicks `getByTestId('everyone-back')`. Follower 2 shows `getByTestId('live-notice')` containing `terug te volgen`, status `Volgend`, `#count` `02`.
- **Proof.** Playwright writes `facilitator-presence.png`, `follower-following.png`, `detached-pulled-back.png` under `apps/web/test-results/playwright/`; copy them into `.verification/evidence/<run-id>/live-follow/`.

## Gotchas

- On the gateway (`:4731`, and Hetzner `:4317`) `/live/*` returns the SPA, but `/live/<room>/sse` also returns SPA HTML, so the follow view never connects. Live follow is not deployed at 768910c; report it as such rather than as a pass.
- The e2e server keeps rooms in memory. Use a unique room id per run.
- Playwright's `webServer` uses `reuseExistingServer: false`; a busy `ACADEMY_LIVE_PORT` fails the run. Pick a port outside the verification table and other stacks (5178 is the default and often taken).
- Follow status strings are Dutch (`Volgend`, `Losgekoppeld`) regardless of the language toggle.
