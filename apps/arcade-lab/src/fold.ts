import type { Assert, Lesson, LessonFile, Op, Stop, TraceLine, WorkspaceState } from './schema';

export const applyOp = (text: string, op: { p: number; d: number; i: string }): string =>
  text.slice(0, op.p) + op.i + text.slice(op.p + op.d);

export const cloneFiles = (files: LessonFile[]): LessonFile[] =>
  files.map((f) => ({ name: f.name, text: f.text }));

export const diffOp = (a: string, b: string): { p: number; d: number; i: string } => {
  let p = 0;
  const min = Math.min(a.length, b.length);
  while (p < min && a[p] === b[p]) p++;
  let s = 0;
  while (s < min - p && a[a.length - 1 - s] === b[b.length - 1 - s]) s++;
  return { p, d: a.length - p - s, i: b.slice(p, b.length - s) };
};

/**
 * Pure fold of lesson ops up to time `t` (ms). Deterministic, seekable, Node-safe.
 * Exported for CI / agents (Phase 2).
 */
export function foldLesson(lesson: Lesson, t: number): WorkspaceState {
  const target = Math.min(Math.max(0, t), lesson.duration);
  const files = cloneFiles(lesson.files);
  let tab = 0;
  let caret: number | null = 0;
  let caption = '';
  const trace: TraceLine[] = [];
  let stop: Stop | null = null;

  for (const op of lesson.ops) {
    if (op.t > target) break;
    applyOne(files, op, {
      setTab: (v) => {
        tab = v;
      },
      setCaret: (v) => {
        caret = v;
      },
      setCaption: (v) => {
        caption = v;
      },
      pushTrace: (line) => {
        trace.push(line);
      },
      clearTrace: () => {
        trace.length = 0;
      },
      setStop: (s) => {
        stop = s;
      },
    });
  }

  return { files, tab, caret, caption, trace, stop, t: target };
}

type Mut = {
  setTab: (n: number) => void;
  setCaret: (n: number | null) => void;
  setCaption: (s: string) => void;
  pushTrace: (l: TraceLine) => void;
  clearTrace: () => void;
  setStop: (s: Stop) => void;
};

function applyOne(files: LessonFile[], op: Op, m: Mut): void {
  if ('tab' in op && op.tab !== undefined) m.setTab(op.tab);
  else if ('c' in op && op.c !== undefined) m.setCaret(op.c);
  else if ('say' in op && op.say !== undefined) m.setCaption(op.say);
  else if ('out' in op && op.out !== undefined) m.pushTrace({ out: op.out, cls: op.cls });
  else if ('clear' in op && op.clear) m.clearTrace();
  else if ('chapter' in op) {
    /* chapter markers are timeline-only in headless fold */
  } else if ('stop' in op && op.stop) m.setStop(op.stop);
  else if ('f' in op && 'p' in op && 'd' in op && 'i' in op) {
    const file = files[op.f];
    if (!file) throw new Error(`fold: missing file index ${op.f} at t=${op.t}`);
    file.text = applyOp(file.text, op);
    m.setCaret(op.p + op.i.length);
    m.setTab(op.f);
  } else {
    throw new Error(`fold: unknown op at t=${(op as Op).t}`);
  }
}

/** Evaluate optional checkpoint assert against a workspace state. */
export function evaluateAssert(state: WorkspaceState, assert: Assert): { ok: boolean; detail: string } {
  const file = state.files.find((f) => f.name === assert.file);
  if (!file) return { ok: false, detail: `missing file ${assert.file}` };
  if (assert.includes !== undefined && !file.text.includes(assert.includes)) {
    return { ok: false, detail: `${assert.file} missing includes` };
  }
  if (assert.regex !== undefined) {
    const re = new RegExp(assert.regex);
    if (!re.test(file.text)) return { ok: false, detail: `${assert.file} failed regex` };
  }
  return { ok: true, detail: 'ok' };
}

/** Run all stop.assert contracts that fire at or before final t. */
export function evaluateLessonAsserts(lesson: Lesson): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  for (const op of lesson.ops) {
    if (!('stop' in op) || !op.stop?.assert) continue;
    const state = foldLesson(lesson, op.t);
    const r = evaluateAssert(state, op.stop.assert);
    if (!r.ok) failures.push(`${lesson.id} @t=${op.t} (${op.stop.title}): ${r.detail}`);
  }
  return { ok: failures.length === 0, failures };
}
