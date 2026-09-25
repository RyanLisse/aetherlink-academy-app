# Legacy visual regression

`legacy.visual.mjs` screenshots the legacy participant and facilitator app (`src/`, served by the gateway) against a synthetic, fixed-clock fixture (`tests/support/legacy-fixture.mjs`):

| Snapshot | Viewport |
| --- | --- |
| `join-1440`, `join-390` | join screen |
| `participant-room-1440`, `participant-room-390` | participant squad room |
| `facilitator-room-1024` | facilitator room with the control bar |
| `facilitator-overview-1024` | facilitator overview with a cohort |

CI (`legacy-visual` job in `.github/workflows/ci.yml`) runs them inside `mcr.microsoft.com/playwright:v1.63.0-noble` and fails on any changed pixel. Baselines are only valid when rendered in that image, so never commit screenshots taken on macOS.

## Update baselines after an intended UI change

```sh
bash scripts/visual-baselines.sh          # re-render into tests/visual/__screenshots__ (needs Docker)
bash scripts/visual-baselines.sh --check  # compare only, same as CI
```

Look at every changed PNG before committing it. When a failure in CI is unexpected, download the `legacy-visual-*` artifact: the HTML report shows expected, actual and diff side by side.

The script copies tracked and untracked (not ignored) files into the container, so uncommitted edits are included. Bump the image tag in the script, the CI job and `@playwright/test` together.
