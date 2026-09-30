import {useEffect, useState, type KeyboardEvent as ReactKeyboardEvent} from 'react';
import type {DeckSlide} from './Deck.js';

interface TimerState { readonly total: number; readonly left: number; readonly running: boolean; readonly endAt: number }

const TIMER_PREFIX = 'academy-deck:timer:';
const DONE_PREFIX = 'academy-deck:done:';
const idle: TimerState = {total: 0, left: 0, running: false, endAt: 0};

const readJson = <T,>(key: string, fallback: T): T => {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
};
const writeJson = (key: string, value: unknown): void => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
};
const readTimer = (key: string): TimerState => {
  const t = readJson<Partial<TimerState> | null>(key, null);
  return t && typeof t.total === 'number' && typeof t.left === 'number' ? {total: t.total, left: t.left, running: t.running === true, endAt: Number(t.endAt) || 0} : idle;
};
const secondsLeft = (t: TimerState): number => t.running ? Math.max(0, Math.round((t.endAt - Date.now()) / 1000)) : Math.max(0, t.left);
export const formatClock = (seconds: number): string => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

/** Assignment timer shared by every window of this browser (localStorage); nothing starts until ▶ Start. */
export function usePersistentTimer(slideId: string) {
  const key = TIMER_PREFIX + slideId;
  const [timer, setTimer] = useState<TimerState>(() => readTimer(key));
  const [, tick] = useState(0);
  useEffect(() => {
    setTimer(readTimer(key));
    const onStorage = (event: StorageEvent) => { if (event.key === key) setTimer(readTimer(key)); };
    window.addEventListener('storage', onStorage);
    const id = window.setInterval(() => tick((n) => n + 1), 500);
    return () => { window.removeEventListener('storage', onStorage); window.clearInterval(id); };
  }, [key]);
  const left = secondsLeft(timer);
  const update = (mutate: (t: {total: number; left: number; running: boolean}) => boolean | void): void => {
    const current = readTimer(key);
    const next = {total: current.total, left: secondsLeft(current), running: current.running};
    if (mutate(next) === false) return;
    const saved: TimerState = {...next, endAt: next.running ? Date.now() + next.left * 1000 : 0};
    writeJson(key, saved); setTimer(saved);
  };
  return {
    total: timer.total, left, running: timer.running && left > 0,
    done: timer.total > 0 && left === 0, late: timer.total > 0 && left > 0 && left <= 60,
    setMinutes: (minutes: number) => update((t) => { const m = Math.max(0, Math.min(180, Math.floor(minutes) || 0)); t.total = m * 60; t.left = m * 60; }),
    toggle: () => update((t) => { if (t.running) { t.running = false; return; } if (t.left <= 0) { if (!t.total) return false; t.left = t.total; } t.running = true; }),
    add: (seconds: number) => update((t) => { t.total = Math.max(0, t.total + seconds); t.left = Math.max(0, t.left + seconds); }),
    reset: () => update((t) => { t.running = false; t.left = t.total; }),
  };
}

function TimerPill({slideId}: {readonly slideId: string}) {
  const timer = usePersistentTimer(slideId);
  const [open, setOpen] = useState(false);
  const [minutes, setMinutes] = useState(() => timer.total ? String(Math.round(timer.total / 60)) : '');
  useEffect(() => setMinutes(timer.total ? String(Math.round(timer.total / 60)) : ''), [timer.total]);
  const commit = () => timer.setMinutes(Number(minutes));
  const face = timer.done ? 'TIME' : formatClock(timer.left);
  const playLabel = timer.running ? '❚❚ Pause' : timer.left > 0 && timer.left < timer.total ? '▶ Resume' : '▶ Start';
  return <div className="tpill-wrap">
    {open && <div className="tpill-bar"><div className="tpill-controls widget-controls timer-controls">
      <label className="timer-field"><input type="number" min="0" max="180" step="1" placeholder="0" aria-label="Minutes" value={minutes} onChange={(event) => setMinutes(event.target.value)} onBlur={commit} onKeyDown={(event: ReactKeyboardEvent<HTMLInputElement>) => { if (event.key === 'Enter') { event.preventDefault(); commit(); if (!timer.running) timer.toggle(); } }}/><span>min</span></label>
      <button type="button" className="timer-play" onClick={timer.toggle}>{playLabel}</button>
      <button type="button" className="secondary" onClick={() => timer.add(-60)}>−1 min</button>
      <button type="button" className="secondary" onClick={() => timer.add(60)}>+1 min</button>
      <button type="button" className="secondary" onClick={timer.reset}>Reset</button>
    </div></div>}
    <button type="button" className={`tpill${timer.running ? ' running' : ''}${timer.late ? ' late' : ''}${timer.done ? ' done' : ''}`} aria-expanded={open} aria-label="Assignment timer: open the controls" onClick={() => setOpen((value) => !value)}><span className="tpill-ico">⏱</span><span className="tpill-face">{face}</span></button>
  </div>;
}

export const assignmentLabel = (slide: DeckSlide): {readonly label: string; readonly title: string} => {
  const match = /^Assignment (\d+[a-z]?):\s*(.*)$/.exec(slide.title || '');
  const day = (/DAY \d/.exec(typeof slide.kicker === 'string' ? slide.kicker : '')?.[0] ?? '').replace('DAY', 'Day');
  return {label: (match ? `Assignment ${match[1]}` : 'Hands-on') + (day ? ` · ${day}` : ''), title: match?.[2] ?? slide.title};
};

const stringList = (value: unknown): ReadonlyArray<string> => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

/** Assignment slide: one label, big tickable steps, "done when", a picture of the result and a timer pill. */
export function AssignmentView({slide, index, total, hidden}: {readonly slide: DeckSlide; readonly index: number; readonly total: number; readonly hidden: boolean}) {
  const {label, title} = assignmentLabel(slide);
  const steps = stringList(slide.steps);
  const doneKey = DONE_PREFIX + slide.id;
  const [done, setDone] = useState<ReadonlyArray<boolean>>(() => readJson<boolean[]>(doneKey, []));
  useEffect(() => setDone(readJson<boolean[]>(doneKey, [])), [doneKey]);
  const flip = (i: number) => setDone((current) => { const next = steps.map((_, n) => n === i ? !current[n] : current[n] === true); writeJson(doneKey, next); return next; });
  const v = slide.visual && typeof slide.visual === 'object' && !Array.isArray(slide.visual) ? slide.visual as Record<string, unknown> : {};
  const shot = typeof v.shot === 'string' ? v.shot : undefined;
  const cardImages = stringList(v.cardImages);
  const cards = Array.isArray(slide.cards) ? slide.cards : [];
  return <>
    <section className="heading asg-head">
      <div className="heading-top"><p className="eyebrow"><span className="type-chip">{label}</span>{hidden && <span className="hidden-chip">Hidden · H to show</span>}</p><div className="asg-top-right"><TimerPill slideId={slide.id}/><p className="slide-count">{`${index + 1} / ${total}`}</p></div></div>
      <h1>{title}</h1>{slide.subtitle && <p className="subtitle">{slide.subtitle}</p>}
    </section>
    <div className="asg-body">
      <div className="asg-main">
        <ol className={`asg-steps${steps.length > 4 ? ' many' : ''}`}>{steps.map((step, i) => <li key={step} className={`asg-step${done[i] ? ' done' : ''}`} style={{['--i' as string]: i}} tabIndex={0} aria-pressed={done[i] === true} onClick={() => flip(i)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); flip(i); } }}><span className="asg-num">{i + 1}</span><span className="asg-text">{step}</span></li>)}</ol>
        {slide.expected && <p className="asg-done"><span className="asg-done-k">Done when</span><span>{slide.expected}</span></p>}
      </div>
      <aside className="asg-side"><p className="asg-side-k">{typeof v.shotLabel === 'string' ? v.shotLabel : 'What it looks like'}</p>
        {shot ? <figure className="asg-shot"><img src={shot.startsWith('/') ? shot : `/${shot}`} alt=""/></figure>
          : cardImages.length > 0 ? <div className="asg-thumbs">{cardImages.map((src, i) => <figure key={src} className="thumb"><img src={src.startsWith('/') ? src : `/${src}`} alt=""/><figcaption>{cards[i]?.title ?? ''}</figcaption></figure>)}</div>
          : cards.length > 0 ? <div className="slide-main asg-mini"/> : null}
      </aside>
    </div>
  </>;
}

/** Assignment layout needs mini source visuals only when the side shows the slide's cards. */
export const assignmentUsesMini = (slide: DeckSlide): boolean => {
  const v = slide.visual && typeof slide.visual === 'object' && !Array.isArray(slide.visual) ? slide.visual as Record<string, unknown> : {};
  return typeof v.shot !== 'string' && stringList(v.cardImages).length === 0 && Array.isArray(slide.cards) && slide.cards.length > 0;
};
