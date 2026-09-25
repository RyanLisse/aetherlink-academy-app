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

### Images

The 37 `image` slides use 12 diagrams from `dist/assets/` at the pinned commit. The importer rewrites each slide's `image` to the Academy's served copy under `/archive/training-site/` and keeps the original file in the slide's provenance as `source.image` (for example `dist/assets/intent-md.svg`). The import script copies the files into `apps/web/public/archive/training-site/`: SVGs byte for byte, the one PNG re-encoded as WebP (`cwebp -q 82`, 237,544 to 52,252 bytes; `cwebp` must be on `PATH` when you re-run the import). Alt text and captions are the old site's `imageAlt` and `imageCaption`; the deck reader falls back to the slide title only when a slide has no `imageAlt`, which no archived slide needs.
