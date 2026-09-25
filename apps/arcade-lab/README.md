# @academy/arcade-lab

Aetherlab solo lesson runtime for Agent Arcade (Phase 1+2).

## Commands

```sh
pnpm --filter @academy/arcade-lab install   # from monorepo root, or pnpm install here
pnpm --filter @academy/arcade-lab run check # headless fold + secret lint + asserts
pnpm --filter @academy/arcade-lab run dev   # http://localhost:4173
```

## Lesson id contract

Exact ids only via `?lesson=<id>` (see `LESSON-ID-CONTRACT.md`). Default / unknown → `ws-1-eve-weather` with soft banner. Alt: `window.__AETHERLAB_LESSON_ID__`.

## Room embed

With `embed=1` inside an Academy iframe, the lab reports progress and completion to the room over `@academy/lab-embed`. See `docs/LAB-EMBED.md`.

## Agent API

```ts
import { foldLesson, getLesson } from '@academy/arcade-lab';
const state = foldLesson(getLesson('ws-1-eve-weather'), /* t ms */ 12_000);
```

Authoring: see `SKILL.md`. Merge gate: `pnpm run check`.
