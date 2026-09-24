# Classroom deck

A facilitator presents Teaching Day 1 (44 slides) from `/classroom/1`, on a projector or with a presenter view that shows notes, timers and the next slide; participants can read the whole lesson in reader mode.

## Sub-features

- `deck-projector` renders slide 1 with the `NN / 44` counter and a progress segment per slide.
- `deck-navigate` advances with the `Next slide` button, `ArrowRight`, progress segments and the `Chapters` dialog.
- `deck-presenter` shows `Facilitator notes`, elapsed and assignment timers, `Next slide: <title>` and Plan B when present.
- `deck-reader` lists every slide of the lesson as an article in the `Lesson reading` region.
- `deck-prompt` opens the `Example prompt` dialog with a copy-ready prompt when the slide has one.
- `deck-all` serves every normalized slide (all lessons) at `/deck`.

## How to get to it (user POV)

- Open `/classroom/1` (alias `/lesson/classroom-1`). Default mode is projector.
- Add `?mode=presenter`, `?mode=reader` or `?mode=follow`; add `&index=<n>` (0-based) to open on a slide.
- Press `S` or choose `Presenter view ↗` in the toolbar.
- Open `/deck` for the full, unfiltered deck.

## Driving it with Playwright

Preconditions:

- Doctor passes; `/classroom/1` returns the SPA.

- **Scripted proof.** Run `node .claude/skills/verify-aetherlink-academy/helpers/drive-classroom.mjs`. `DRIVE OK` and `classroom/state.json` with `ok: true`.
- **Open projector.** `page.goto('/classroom/1')`, wait for `#count`. Text is `01 / 44`; `#progress [aria-current="step"]` has label `1. Welcome to the course!`.
- **Advance by button.** `getByRole('button', {name: 'Next slide'}).click()`. `#count` becomes `02 / 44`.
- **Advance by key.** Focus `#stage`, press `ArrowRight`. `#count` becomes `03 / 44`, title `3. A few agreements`.
- **Presenter.** `page.goto('/classroom/1?mode=presenter&index=2')`. `getByRole('heading', {name: 'Facilitator notes'})` is visible and `.presenter-tools p` contains `Next slide: Who we are`.
- **Reader.** `page.goto('/classroom/1?mode=reader')`. `getByRole('region', {name: 'Lesson reading'}).locator(':scope > article')` counts 44.
- **Chapters.** `getByRole('button', {name: /Chapters/}).click()`, then choose a slide in the `All 44 slides` navigation. The dialog closes and `#count` matches.
- **Proof.** Screenshots and ARIA snapshots of projector before and after navigation plus presenter, from `drive-classroom.mjs`.

## Gotchas

- Known bug, reproduced locally and on Hetzner on 2026-09-24: `GET /assets/aetherlink-mark.png` returns 401 because `server/app.mjs` routes `/assets/*` to the authenticated Proof proxy before the `apps/web` static handler. The deck still renders. `drive-classroom.mjs` reports it as `KNOWN BUG` and fails on any other 4xx/5xx; drop it from `KNOWN_BROKEN` once fixed.
- Slides animate in. A screenshot right after navigation shows a faded title and an empty body. Wait for finite `document.getAnimations()` to finish.
- `index` is 0-based while `#count` is 1-based.
- Reader articles contain nested `<article>`s from layout renderers. Count direct children only.
- In `follow` mode the navigation buttons are disabled and `#stage` is inert by design; follow is driven by `/live` (see live-follow.md).
- The presence slot on `/classroom/1` is a static placeholder (`Presence slot`); real presence only exists under `/live`.
