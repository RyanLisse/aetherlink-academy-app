# Archive

Historical course versions, kept for reading. Nothing here feeds the live 7-day course.

## `training-site.json`

The Squad 1 and Squad 2 day decks from [RyanLisse/aetherlink-training-site](https://github.com/RyanLisse/aetherlink-training-site) at commit `df611554d4e1cc0ab56c8ebc1221edcc7d9ba10b`: 224 slides in ten decks (`dist/days.js` → `window.DAYS`, `dist/squad2.js` → `window.SQUAD2`). The site README's "229 slides" predates that commit; the daily-brief guided lesson in `dist/lesson.js` is not a squad deck and is not archived.

The file is generated. Do not edit it by hand:

```sh
git clone https://github.com/RyanLisse/aetherlink-training-site /tmp/training-site
pnpm --filter @academy/server import-archive -- /tmp/training-site
```

`apps/server/src/importers/trainingSiteArchive.ts` runs each registry through the day-decks importer (`decodeDayDecks`), so every slide decodes against the live `Slide` schema. Each entry keeps its source as `{repo, commit, path, pointer}`, for example `DAYS.day3.slides[4]`. `apps/server/test/importers.test.ts` re-imports the pinned commit and fails if this file drifts.

The Academy reads it at `/archive` and `/archive/squad-<n>/day-<d>` through the deck `reader` mode.

### Layout mapping

No new layouts. The old site stored the same `layout` values the schema already has (`cards`, `image`, `bars`, `compare`, `exercise`, `pillars`, `recap`, or none). Its visual templates in `dist/templates.js` (cover, columns, stack, chain, split, grid, gate, arc, pause, figure) were derived at render time from those fields and are not data, so they map to the existing deck renderers unchanged. Slide `type` is inferred from kicker, title, layout and timer, as the old `slideType()` did.

Open: the deck reader has no image renderer, so the 37 `image` slides show their title and text without the diagram. Their `image`, `imageAlt` and `imageCaption` fields are kept; the files live under `dist/assets/` at the pinned commit.
