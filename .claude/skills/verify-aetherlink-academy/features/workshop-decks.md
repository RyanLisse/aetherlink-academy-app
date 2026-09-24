# Workshop decks

Facilitators run the support-day workshops from dedicated deck routes, each a separate slide module with the same deck controls as the classroom deck.

## Sub-features

- `ws3` n8n ticket priority L1 to L3 (`/workshop/3`).
- `ws4` n8n to Claude Agent SDK rebuild (`/workshop/4`).
- `ws5` AI-native SDLC (`/workshop/5`).
- `ws6` eigen opdracht thin slice (`/workshop/6`).
- `ws7` eigen opdracht finish and present (`/workshop/7`).
- `ws-modes` projector, presenter and reader modes behave as in the classroom deck.

## How to get to it (user POV)

- Open `/workshop/<3..7>` or the alias `/lesson/workshop-<3..7>`.
- Add `?mode=presenter|reader` and `&index=<n>` as for the classroom deck.

## Driving it with Playwright

Preconditions:

- Doctor passes.

- **Open each deck.** For N in 3..7, `page.goto('/workshop/' + N)` and wait for `#count`. Text starts with `01 / ` and the total is greater than 1.
- **Distinct content.** Record `#progress [aria-current="step"]` label per N. The five first-slide titles differ from each other and from `/classroom/1`.
- **Navigate.** `getByRole('button', {name: 'Next slide'}).click()`. `#count` starts with `02 / `.
- **Presenter.** `page.goto('/workshop/' + N + '?mode=presenter')`. `getByRole('heading', {name: 'Facilitator notes'})` is visible.
- **Alias.** `page.goto('/lesson/workshop-' + N)`. Same total and first title as `/workshop/N`.
- **Deployed read-only.** Repeat the open step against `http://91.99.78.17:4317`. Same totals as local at the revision you expect.
- **Proof.** One screenshot and ARIA snapshot per deck plus `state.json` listing totals and first titles.

## Gotchas

- Workshop assets live under `apps/web/public/workshop-3` and `workshop-5`; a 404 on those paths means `apps/web` was not rebuilt, not a routing bug.
- `/workshop/1`, `/workshop/2` and `/workshop/8` are not deck routes; the gateway serves the `apps/web` shell for them (heading `Squad room`), not a deck.
- The same `/assets/aetherlink-mark.png` 401 as the classroom deck applies.
- Deployed `/game/health` reports `revision: null` on Hetzner, so you cannot pin which commit production runs from the app. Compare deck totals and titles instead of trusting a revision.
