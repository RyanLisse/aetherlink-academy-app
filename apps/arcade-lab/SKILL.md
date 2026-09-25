# Skill: Author an Arcade solo lesson (aetherlab)

## When to use

You are given Eve tutorial snippets, Claude Agent SDK samples, or workshop prose and need a typed `Lesson` module under `apps/arcade-lab/src/lessons/`.

## Output contract

1. Create `src/lessons/<exact-id>.ts` exporting `lesson` / default.
2. Register it in `src/lessons/index.ts`.
3. Use **exact** ids from the lesson-id contract (never short `ws-1`).
4. Run `pnpm --filter @academy/arcade-lab run check` — **merge gate**.

## Ops DSL (`script()`)

```ts
import { script } from '../script';
import { src } from '../lesson-sources'; // optional verbatim sources
import type { Lesson } from '../schema';

export const lesson: Lesson = script({
  id: 'ws-1-eve-weather', // exact
  title: '1 · Eve · …',
  kind: 'trace', // or 'web'
  files: [{ name: 'agent/instructions.md', text: '' }],
  build: (s) => {
    s.chapter('Predict');
    s.say('Caption text with **bold**.');
    s.type(0, src('eve-instructions')); // or inline string
    s.cmd('npm run dev', [['ready', 'dim', 500]]);
    s.out('tool call …', 'tool');
    s.stop({
      title: 'Knowledge check',
      q: '…',
      options: ['A', 'B'],
      correct: 0,
      explain: '…',
      // Phase 2 auto-grade (optional):
      assert: { file: 'agent/instructions.md', includes: 'get_weather' },
    });
  },
});
```

### Op cheat sheet

| API | Effect |
|-----|--------|
| `say(text, hold?)` | Caption |
| `type(fileIdx, text)` | Insert text (line ops) |
| `replace(fileIdx, from, to)` | Delete `from`, type `to` |
| `at` / `end` / `tab` | Caret / file switch |
| `out` / `cmd` / `clear` | Trace panel |
| `chapter` | Chapter marker |
| `stop` | Checkpoint (+ optional `assert`) |
| `pause(ms)` | Advance timeline |

Playback is `foldLesson(lesson, t)` — deterministic.

## Secret lint

`files[].text` (initial **and** folded end state) must not match key-like patterns (`sk-ant-…`, `ghp_…`, PEM, etc.). Put credentials only in env docs outside lesson files.

## Checklist

- [ ] Exact lesson id
- [ ] `LessonSchema` parses via `check`
- [ ] Fold to `duration` throws nothing
- [ ] Asserts (if any) pass at their `stop.t`
- [ ] No CodeMirror 6 / Remotion in this wave
