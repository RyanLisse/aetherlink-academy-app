/** Port of the source deck's timers.js: localStorage-backed, shared across windows, and idle until ▶ Start. */
interface StoredTimer { total: number; left: number; running: boolean; endAt: number }

export interface SourceTimerOptions {
  readonly doc: Document;
  readonly key: string;
  readonly defaultSec?: number;
  readonly minutes?: boolean;
  readonly back?: boolean;
  readonly boxCls?: string;
  readonly faceCls?: string;
  readonly lateCls?: string;
  readonly lateAt?: number;
  readonly doneText?: string;
  readonly prefix?: HTMLElement;
  readonly signal?: AbortSignal;
}

const PREFIX = 'academy-deck:timer:';
const fmt = (sec: number): string => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
const secondsLeft = (t: StoredTimer): number => t.running ? Math.max(0, Math.round((t.endAt - Date.now()) / 1000)) : Math.max(0, t.left);

const read = (key: string, defSec: number): StoredTimer => {
  let t: Partial<StoredTimer> | null = null;
  try { t = JSON.parse(localStorage.getItem(key) || 'null') as Partial<StoredTimer> | null; } catch { t = null; }
  return t && typeof t.total === 'number' && typeof t.left === 'number'
    ? {total: t.total, left: t.left, running: t.running === true, endAt: Number(t.endAt) || 0}
    : {total: defSec, left: defSec, running: false, endAt: 0};
};
const write = (key: string, t: StoredTimer): void => {
  try { localStorage.setItem(key, JSON.stringify(t)); } catch { /* private mode */ }
};

export const sourceTimerKey = (id: string): string => PREFIX + id;

export function mountSourceTimer(o: SourceTimerOptions): HTMLElement {
  const {doc} = o;
  const el = (tag: string, cls?: string, text?: string): HTMLElement => {
    const e = doc.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e;
  };
  const defSec = o.defaultSec ?? 0;
  const box = el('div', o.boxCls ?? 'timer'); const face = el('div', o.faceCls ?? 'timer-face', '00:00');
  const back = el('p', 'pause-back'); back.hidden = true;
  const ctrl = el('div', 'widget-controls timer-controls');
  let input: HTMLInputElement | null = null;
  if (o.minutes) {
    const field = el('label', 'timer-field'); input = doc.createElement('input');
    input.type = 'number'; input.min = '0'; input.max = '180'; input.step = '1'; input.placeholder = '0';
    input.setAttribute('aria-label', 'Minutes'); field.append(input, el('span', undefined, 'min')); ctrl.append(field);
  }
  const button = (cls: string, text: string): HTMLButtonElement => { const b = el('button', cls, text) as HTMLButtonElement; b.type = 'button'; return b; };
  const play = button('timer-play', '▶ Start');
  const minus = button('secondary', '−1 min'), plus = button('secondary', '+1 min'), reset = button('secondary', 'Reset');
  ctrl.append(play, minus, plus, reset);
  const get = (): StoredTimer => read(o.key, defSec);
  const paint = (): void => {
    const t = get(); const l = secondsLeft(t);
    if (t.running && l === 0) { t.running = false; t.left = 0; write(o.key, t); }
    face.textContent = t.total > 0 && l === 0 && o.doneText ? o.doneText : fmt(l);
    box.classList.toggle(o.lateCls ?? 'timer-late', t.total > 0 && l > 0 && l <= (o.lateAt ?? 60));
    box.classList.toggle('done', t.total > 0 && l === 0);
    box.classList.toggle('running', t.running);
    play.textContent = t.running ? '❚❚ Pause' : l > 0 && l < t.total ? '▶ Resume' : '▶ Start';
    if (input && doc.activeElement !== input) input.value = t.total ? String(Math.round(t.total / 60)) : '';
    if (o.back) {
      back.hidden = !t.running;
      if (t.running) back.replaceChildren(doc.createTextNode('Back at '), el('strong', undefined, new Date(t.endAt).toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})));
    }
  };
  const set = (mutate: (t: StoredTimer) => boolean | void): void => {
    const t = get(); t.left = secondsLeft(t);
    if (mutate(t) === false) return;
    if (t.running) t.endAt = Date.now() + t.left * 1000;
    write(o.key, t); paint();
  };
  play.addEventListener('click', () => set((t) => {
    if (t.running) { t.running = false; return; }
    if (t.left <= 0) { if (!t.total) { input?.focus(); return false; } t.left = t.total; }
    t.running = true;
  }));
  minus.addEventListener('click', () => set((t) => { t.total = Math.max(0, t.total - 60); t.left = Math.max(0, t.left - 60); }));
  plus.addEventListener('click', () => set((t) => { t.total += 60; t.left += 60; }));
  reset.addEventListener('click', () => set((t) => { t.running = false; if (!o.minutes) t.total = defSec; t.left = t.total; }));
  if (input) {
    const field = input;
    field.addEventListener('change', () => set((t) => { const m = Math.max(0, Math.min(180, Math.floor(Number(field.value) || 0))); t.total = m * 60; t.left = m * 60; }));
    field.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); field.blur(); field.dispatchEvent(new Event('change')); if (!get().running) play.click(); } });
  }
  if (o.prefix) box.append(o.prefix);
  box.append(face); if (o.back) box.append(back); box.append(ctrl);
  paint();
  const view = doc.defaultView;
  const iv = view?.setInterval(paint, 500);
  const onStorage = (event: StorageEvent): void => { if (event.key === o.key) paint(); };
  view?.addEventListener('storage', onStorage);
  o.signal?.addEventListener('abort', () => { view?.clearInterval(iv); view?.removeEventListener('storage', onStorage); });
  return box;
}
