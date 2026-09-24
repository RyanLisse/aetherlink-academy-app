# @academy/deck

Controlled React presentation component for the Academy classroom deck. The app
owns slide data, selected index, reveal state and mode. The package does not fetch
curriculum, persist state or connect to live sync.

## Contract

`Deck` consumes shared `@academy/schema` slide data and receives:

- `slides`, `index`, `revealStep`: the current presentation state.
- `mode`: `projector`, `presenter`, `reader`, or `follow`.
- `onIndexChange`, `onRevealStepChange`: requests for the controller to update state.
- `presence`: optional React content supplied by a future live-sync controller.

Projector mode renders one slide. Presenter tools expose notes, prompt copy,
next-slide information and timers. Reader mode renders the selected lesson as a
scrollable page with facilitator notes hidden. Follow mode consumes externally
controlled navigation. Hiding notes in a view is not an authorization boundary:
participant controllers must receive the server's participant projection.

The `/deck` app route is a local source-data demonstration, not an authenticated
participant curriculum route or a live presence integration. Facilitator routes
`/classroom/1` (alias `/lesson/classroom-1`) and `/classroom/2` (alias
`/lesson/classroom-2`) render the same deck filtered to Teaching Day 1 and
Teaching Day 2. The day cut is derived from the SoT's `TEACHING DAY 2` divider
slide in `apps/web/src/deck/normalize.ts`.

## Source and verification

Reference: `jyse/aetherlink-classroom-slides`, branch
`cons/cursus-aanpassingen`, commit
`abde6d1b94f4065cb4ed2927b057d6f7866b3ec0` (91 slides; Day 1 = slides 1–44, Day 2 = slides 45–91).

The parity script compares all 91 slides at 1440×900, 1024×768 and 390×844,
checking target identity, asset loading, screenshot dimensions and pixel output.
The default pixelmatch color threshold is 0.1; any remaining differing pixel or
geometry mismatch fails. A passing subset is not the complete 273-case gate.

With the reference served on port 8787 and the app on port 5178:

```sh
pnpm --filter @academy/deck exec node scripts/behavior.mjs
pnpm --filter @academy/deck exec node scripts/parity.mjs
```

Override `SOURCE_DECK_URL`, `DECK_URL`, `BEHAVIOR_OUTPUT`, and `PARITY_OUTPUT`
for isolated runs. `PARITY_SLIDES=1,5-8` selects a diagnostic subset. Reports and
paired failure images go to the requested output directory. Attach the final
273-case report to the PR and retain its source/implementation provenance.

The Deck acceptance workflow runs behavior against the development fixture and
all 273 screenshot cases against the production build. It uploads reports and
failure images as a commit-specific artifact. Merge requires these checks plus
workspace validation and independent review; a partial run is diagnostic only.
