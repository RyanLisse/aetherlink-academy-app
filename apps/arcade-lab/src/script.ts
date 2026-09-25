import { applyOp } from './fold';
import type { Lesson, LessonFile, Op, Stop } from './schema';
import { LessonSchema } from './schema';

export type ScriptApi = {
  pause: (ms: number) => void;
  say: (text: string, hold?: number) => void;
  chapter: (name: string) => void;
  tab: (f: number) => void;
  at: (f: number, marker: string, after?: boolean) => void;
  end: (f: number) => void;
  type: (f: number, text: string, lps?: number) => void;
  replace: (f: number, from: string, to: string) => void;
  out: (text: string, cls?: string, gap?: number) => void;
  cmd: (c: string, lines?: Array<[string, string?, number?]>) => void;
  clear: () => void;
  stop: (s: Stop) => void;
};

export type ScriptInput = {
  id: string;
  title: string;
  kind: 'web' | 'trace';
  files: LessonFile[];
  build: (api: ScriptApi) => void;
};

/** Authoring DSL → typed Lesson (same semantics as aetherlab monolith). */
export function script(input: ScriptInput): Lesson {
  const state = input.files.map((f) => f.text);
  const ops: Op[] = [];
  const cur = input.files.map(() => 0);
  let t = 600;
  let tab = 0;
  const T = () => Math.round(t);

  const api: ScriptApi = {
    pause: (ms) => {
      t += ms;
    },
    say: (text, hold = 0) => {
      ops.push({ t: T(), say: text });
      t += hold || Math.min(9000, 1500 + text.length * 45);
    },
    chapter: (name) => {
      ops.push({ t: T(), chapter: name });
    },
    tab: (f) => {
      if (f !== tab) {
        ops.push({ t: T(), tab: f });
        tab = f;
        t += 500;
      }
    },
    at: (f, marker, after = true) => {
      api.tab(f);
      const k = marker ? state[f]!.indexOf(marker) : state[f]!.length;
      cur[f] = k < 0 ? state[f]!.length : k + (after ? marker.length : 0);
      ops.push({ t: T(), c: cur[f]! });
      t += 300;
    },
    end: (f) => api.at(f, ''),
    type: (f, text, lps = 1) => {
      api.tab(f);
      const lines = text.split('\n');
      lines.forEach((line, k) => {
        const chunk = line + (k < lines.length - 1 ? '\n' : '');
        if (!chunk) return;
        const p = cur[f]!;
        ops.push({ t: T(), f, p, d: 0, i: chunk });
        state[f] = applyOp(state[f]!, { p, d: 0, i: chunk });
        cur[f] = p + chunk.length;
        t += (140 + chunk.length * 22) / lps;
      });
    },
    replace: (f, from, to) => {
      api.tab(f);
      const p = state[f]!.indexOf(from);
      if (p < 0) throw new Error('marker not found: ' + from);
      ops.push({ t: T(), c: p });
      t += 400;
      ops.push({ t: T(), f, p, d: from.length, i: '' });
      state[f] = applyOp(state[f]!, { p, d: from.length, i: '' });
      cur[f] = p;
      t += 350;
      api.type(f, to);
    },
    out: (text, cls = 'dim', gap = 350) => {
      ops.push({ t: T(), out: text, cls });
      t += gap;
    },
    cmd: (c, lines = []) => {
      api.out(c, 'cmd', 700);
      lines.forEach(([txt, cls, gap]) => api.out(txt, cls || 'dim', gap || 450));
    },
    clear: () => {
      ops.push({ t: T(), clear: true });
      t += 200;
    },
    stop: (s) => {
      ops.push({ t: T(), stop: s });
      t += 200;
    },
  };

  input.build(api);
  t += 1500;
  const lesson = {
    id: input.id,
    title: input.title,
    kind: input.kind,
    files: input.files,
    ops,
    duration: T(),
    audio: null as string | null,
    builtin: true,
  };
  return LessonSchema.parse(lesson);
}
