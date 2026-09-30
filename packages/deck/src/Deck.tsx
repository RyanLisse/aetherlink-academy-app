import {useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {JsonValue, Slide} from '@academy/schema';
import {mountSourceVisuals, type SourceVisualMount} from './source-visuals.js';
import {Instructions, LayoutRenderer} from './renderers.js';
import {deckNavBlockedByTarget} from './nav-keys.js';
import {AssignmentView, assignmentUsesMini} from './assignment.js';
import {isHiddenStorageKey, isSlideHidden, toggleSlideHidden, visibleFrom} from './hidden.js';

export type DeckMode = 'projector' | 'presenter' | 'reader' | 'follow';
export type DeckSlide = Slide & Record<string, unknown>;
export interface DeckProps { readonly slides: ReadonlyArray<DeckSlide>; readonly index: number; readonly revealStep: number; readonly mode: DeckMode; readonly onIndexChange: (index: number) => void; readonly onRevealStepChange: (step: number) => void; readonly presence?: ReactNode; readonly companions?: ReadonlyArray<{readonly label: string; readonly href: string}>; }

/** Browser-local presenter sync (AET-121) — projector drives; presenter window follows. Online follow remains optional. */
const PRESENTER_SYNC_CHANNEL = 'academy-deck-presenter-sync';
const PRESENTER_SYNC_KEY = 'academy-deck-presenter-index';

function openPresenterWindow(index: number): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set('mode', 'presenter');
  url.searchParams.set('index', String(index));
  window.open(url.toString(), 'academy-deck-presenter', 'noopener,noreferrer');
}

function publishPresenterIndex(index: number): void {
  if (typeof window === 'undefined') return;
  try {
    const channel = new BroadcastChannel(PRESENTER_SYNC_CHANNEL);
    channel.postMessage({type: 'slide', index});
    channel.close();
  } catch { /* BroadcastChannel unavailable */ }
  try {
    localStorage.setItem(PRESENTER_SYNC_KEY, JSON.stringify({index, at: Date.now()}));
  } catch { /* private mode */ }
}

const text = (value: unknown): string => typeof value === 'string' ? value : '';
const array = <T,>(value: unknown): ReadonlyArray<T> => Array.isArray(value) ? value as ReadonlyArray<T> : [];
const visual = (slide: DeckSlide): Record<string, unknown> => slide.visual && typeof slide.visual === 'object' && !Array.isArray(slide.visual) ? slide.visual as Record<string, unknown> : {};
/** Mini cards beside an assignment: one column, without bot, compact or thumbnail decorations. */
const assignmentVisual = (slide: DeckSlide): JsonValue => {
  const source = slide.visual;
  const out: {[key: string]: JsonValue} = {oneCol: true};
  if (source && typeof source === 'object' && !Array.isArray(source)) for (const [key, item] of Object.entries(source)) if (!['bot', 'compact', 'cardImages'].includes(key)) out[key] = item;
  return out;
};
const typeLabel = (slide: DeckSlide): string => text(slide.type) || (text(slide.layout) === 'exercise' ? 'practice' : text(slide.layout) === 'recap' ? 'recap' : 'context');
const typeDisplay = (type: string): string => ({practice: 'Assignment', concept: 'Concept', review: 'Review', quiz: 'Quiz', recap: 'Recap', pause: 'Break', context: 'Context'}[type] ?? type);

function PresenterTools({slide, next, presence, onPlanBToggle}: {readonly slide: DeckSlide; readonly next?: DeckSlide; readonly presence?: ReactNode; readonly onPlanBToggle?: () => void}) {
  const presetMinutes = typeof slide.timer === 'number' ? String(slide.timer) : '';
  const minutesToSeconds = (value: string): number => Math.max(0, Math.min(180, Math.floor(Number(value) || 0))) * 60;
  const [elapsed, setElapsed] = useState(0); const [minutes, setMinutes] = useState(presetMinutes); const [remaining, setRemaining] = useState(minutesToSeconds(presetMinutes)); const [running, setRunning] = useState(false);
  const showTimer = text(slide.layout) === 'exercise' || presetMinutes !== '';
  useEffect(() => { setRunning(false); setMinutes(presetMinutes); setRemaining(minutesToSeconds(presetMinutes)); }, [slide.id, presetMinutes]);
  useEffect(() => { const started = Date.now(); const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000); return () => window.clearInterval(id); }, []);
  useEffect(() => { if (!running || remaining <= 0) return; const id = window.setInterval(() => setRemaining((value) => Math.max(value - 1, 0)), 1000); return () => window.clearInterval(id); }, [running, remaining]);
  const fmt = (seconds: number): string => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return <aside className="presenter-tools deck-presenter-tools">{presence && <div className="presence deck-presence" aria-label="Participants">{presence}</div>}<p>Elapsed {fmt(elapsed)}</p>{showTimer && <p>Assignment timer {fmt(remaining)} <label><input type="number" min="0" max="180" step="1" placeholder="0" aria-label="Minutes for this assignment" value={minutes} disabled={running} onChange={(event) => { setMinutes(event.target.value); if (!running) setRemaining(minutesToSeconds(event.target.value)); }}/> min</label> <button type="button" onClick={() => setRunning((value) => !value)} disabled={remaining === 0}>{running ? 'Pause' : 'Start'}</button> <button type="button" onClick={() => { setRunning(false); setRemaining(minutesToSeconds(minutes)); }}>Reset</button></p>}{array<string>(slide.keyPoints).length > 0 && <section className="key-points"><h2>Key points</h2><ul>{array<string>(slide.keyPoints).map((point) => <li key={point}>{point}</li>)}</ul></section>}<section><h2>Facilitator notes</h2><p>{text(slide.notes) || 'No facilitator notes on this slide.'}</p></section>{slide.prompt && <section><h2>Exact prompt</h2><textarea readOnly value={slide.prompt} aria-label="Copy-ready example prompt"/><button type="button" onClick={() => void navigator.clipboard?.writeText(text(slide.prompt))}>Copy prompt</button></section>}<p>Next slide: {next ? next.title : 'This is the last slide.'}</p>{(visual(slide).planB || slide.planB) && <section><h2>Plan B</h2><p>{text(slide.planB)}</p><button type="button" onClick={onPlanBToggle}>Toggle Plan B</button></section>}</aside>;
}

export function Deck(props: DeckProps) {
  const slide = props.slides[props.index] ?? props.slides[0];
  if (!slide) return null;
  return <DeckContent {...props}/>;
}

function DeckContent({slides, index, revealStep, mode, onIndexChange, onRevealStepChange, presence, companions}: DeckProps) {
  const slide = slides[index] ?? slides[0]; const total = slides.length; if (!slide) return null; const activeSlide = slide; const type = typeLabel(activeSlide);
  const [promptOpen, setPromptOpen] = useState(false); const [chaptersOpen, setChaptersOpen] = useState(false);
  const [hiddenVersion, setHiddenVersion] = useState(0);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => { if (isHiddenStorageKey(event.key)) setHiddenVersion((n) => n + 1); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  const hiddenFlags = useMemo(() => slides.map((item) => isSlideHidden(item)), [slides, hiddenVersion]);
  const hiddenAt = (i: number): boolean => hiddenFlags[i] === true;
  const isHiddenSlide = (item: DeckSlide): boolean => hiddenAt(slides.indexOf(item));
  const toggleHidden = (i: number): void => { const item = slides[i]; if (!item) return; toggleSlideHidden(item); setHiddenVersion((n) => n + 1); };
  const isAssignment = type === 'practice' && text(activeSlide.layout) === 'exercise' && !activeSlide.check;
  const stageRef = useRef<HTMLElement>(null); const bodyRef = useRef<HTMLDivElement>(null); const mainRef = useRef<HTMLDivElement>(null); const mountRef = useRef<SourceVisualMount | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(() => typeof document !== 'undefined' && !!document.fullscreenElement);
  useEffect(() => {
    const sync = () => setIsFullscreen(!!document.fullscreenElement);
    sync();
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  const fullscreenLabel = isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen';
  const revealStepChangeRef = useRef(onRevealStepChange);
  revealStepChangeRef.current = onRevealStepChange;
  // AET-121: projector publishes index; presenter window follows via BroadcastChannel (+ localStorage fallback).
  useEffect(() => {
    if (mode !== 'projector') return;
    publishPresenterIndex(index);
  }, [mode, index]);
  useEffect(() => {
    if (mode !== 'presenter' || typeof window === 'undefined') return;
    const onMessage = (data: {type?: string; index?: number}) => {
      if (data?.type === 'slide' && typeof data.index === 'number' && Number.isInteger(data.index)) {
        onIndexChange(Math.max(0, Math.min(data.index, total - 1)));
      }
    };
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(PRESENTER_SYNC_CHANNEL);
      channel.onmessage = (event) => onMessage(event.data as {type?: string; index?: number});
    } catch { channel = null; }
    const onStorage = (event: StorageEvent) => {
      if (event.key !== PRESENTER_SYNC_KEY || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue) as {index?: number};
        if (typeof parsed.index === 'number') onMessage({type: 'slide', index: parsed.index});
      } catch { /* ignore */ }
    };
    window.addEventListener('storage', onStorage);
    // URL index wins on first paint (SoT: URL param, then storage). Avoid clobbering ?index=N.
    const urlHasIndex = new URLSearchParams(window.location.search).has('index');
    if (!urlHasIndex) {
      try {
        const stored = JSON.parse(localStorage.getItem(PRESENTER_SYNC_KEY) || 'null') as {index?: number} | null;
        if (stored && typeof stored.index === 'number') onMessage({type: 'slide', index: stored.index});
      } catch { /* ignore */ }
    }
    return () => {
      channel?.close();
      window.removeEventListener('storage', onStorage);
    };
  }, [mode, total, onIndexChange]);
  const step = (dir: 1 | -1): void => { if (mode === 'follow') return; const target = visibleFrom(slides, index + dir, dir, isHiddenSlide); if (target !== null) onIndexChange(target); };
  const next = () => step(1); const previous = () => step(-1);
  const revealable = (target: DeckSlide): boolean => { const v = visual(target); return v.reveal === 'click' || v.stepKeys === true || text(target.layout) === 'steps' || (text(target.layout) === 'recap' && !v.recapKeys && !v.levelUp); };
  const revealCount = (target: DeckSlide): number => Math.max(array(target.items).length, array(target.cards).length);
  const reveal = (): boolean => { if (mountRef.current?.reveal()) return true; if (!revealable(activeSlide)) return false; const count = revealCount(activeSlide); if (revealStep >= count - 1) return false; onRevealStepChange(revealStep + 1); return true; };
  useEffect(() => { document.title = `${activeSlide.title} · Aetherlink classroom`; }, [activeSlide.id, activeSlide.title]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const root = stageRef.current?.closest('.academy-deck');
      const target = event.target instanceof Element ? event.target : null;
      const targetDeck = target?.closest('.academy-deck');
      if (!root || (targetDeck ? targetDeck !== root : document.querySelector('.academy-deck') !== root)) return;
      if (event.key === 'Escape') {
        setPromptOpen(false); setChaptersOpen(false);
        return;
      }
      // Nav keys (Arrow/Page/Space/Home/End) must work even when a toolbar button
      // still holds focus — Space advances, it must not activate ⛶ (AET-106).
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
          deckNavBlockedByTarget(target, event.key) ||
          promptOpen || chaptersOpen || mode === 'follow') return;
      if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
        event.preventDefault(); if (!reveal()) next();
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault(); previous();
      } else if (event.key === 'Home') {
        event.preventDefault(); onIndexChange(visibleFrom(slides, 0, 1, isHiddenSlide) ?? 0);
      } else if (event.key === 'End') {
        event.preventDefault(); onIndexChange(visibleFrom(slides, total - 1, -1, isHiddenSlide) ?? total - 1);
      } else if (event.key.toLowerCase() === 's' || event.key.toLowerCase() === 'p') {
        if (mode === 'projector') { event.preventDefault(); openPresenterWindow(index); }
      } else if (event.key.toLowerCase() === 'b' && (visual(activeSlide).planB || activeSlide.planB)) {
        event.preventDefault(); mountRef.current?.togglePlanB();
      } else if (event.key.toLowerCase() === 'h' && mode !== 'reader') {
        event.preventDefault(); toggleHidden(index);
      } else if (event.key.toLowerCase() === 'c') setChaptersOpen(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const staticHeadingMarkup = renderToStaticMarkup(<><div className="heading-top"><p className="eyebrow"><span className="type-chip">{typeDisplay(typeLabel(activeSlide))}</span><span className="kicker-text">{text(activeSlide.kicker)}</span>{hiddenAt(index) && <span className="hidden-chip">Hidden · H to show</span>}</p><p className="slide-count">{`${index + 1} / ${total}`}</p></div><h1>{activeSlide.title}</h1>{activeSlide.subtitle && <p className="subtitle">{activeSlide.subtitle}</p>}</>);
  const staticMainMarkup = isAssignment ? renderToStaticMarkup(<LayoutRenderer slide={{...activeSlide, layout: undefined}} revealStep={-1}/>) : renderToStaticMarkup(<><LayoutRenderer slide={activeSlide} revealStep={-1}/>{activeSlide.tagline && <p className="tagline">{activeSlide.tagline}</p>}</>);
  const mountSlide: DeckSlide = isAssignment ? {...activeSlide, visual: assignmentVisual(activeSlide)} : activeSlide;
  useLayoutEffect(() => {
    const stageNode = stageRef.current;
    if (mode === 'reader') {
      mountRef.current?.cleanup();
      mountRef.current = null;
      return;
    }
    if (isAssignment && !assignmentUsesMini(activeSlide)) {
      mountRef.current?.cleanup();
      mountRef.current = null;
      return;
    }
    const bodyNode = stageNode?.querySelector<HTMLDivElement>(isAssignment ? '.asg-body' : '.slide-body') ?? null;
    const mainNode = stageNode?.querySelector<HTMLDivElement>('.slide-main') ?? null;
    if (!stageNode || !bodyNode || !mainNode) return;
    const mount = mountSourceVisuals(stageNode, bodyNode, mainNode, mountSlide, {initialMarkup: staticMainMarkup, ...(isAssignment ? {} : {initialHeadingMarkup: staticHeadingMarkup}), revealStep, onRevealStepChange: (step) => revealStepChangeRef.current(step)});
    mountRef.current = mount;
    return () => {
      mount.cleanup();
      if (mountRef.current === mount) mountRef.current = null;
    };
  }, [slide, index, mode, isAssignment]);
  useLayoutEffect(() => { mountRef.current?.syncRevealStep(revealStep); }, [revealStep]);
  const progress = useMemo(() => slides.map((item, i) => <button type="button" key={item.id || i} className={`seg ${i === index ? 'current' : i < index ? 'done' : ''}${hiddenFlags[i] ? ' is-hidden' : ''}`} data-type={typeLabel(item)} aria-label={`${i + 1}. ${item.title}`} aria-current={i === index ? 'step' : undefined} disabled={mode === 'follow'} onClick={() => onIndexChange(i)} />), [slides, index, onIndexChange, mode, hiddenFlags]);
  if (!slide) return null;
  const readerSlides = slides.filter((item) => item.lessonId === activeSlide.lessonId);
  const hasInstructionVisual = ['quiz', 'stamps', 'perCard', 'runner'].some((key) => visual(activeSlide)[key] !== undefined);
  return <div className={`academy-deck mode-${mode} deck-type-${type}${activeSlide.dark ? " spotlight" : ""}${visual(activeSlide).keynote === true ? " keynote" : ""}`} data-type={type} data-lesson={activeSlide.lessonId} data-face={visual(activeSlide).keynote === true ? "keynote" : undefined} data-opener={typeof visual(activeSlide).opener === 'string' ? visual(activeSlide).opener : ''} data-index={index} data-total={total}>
    <a className="skip" href="#stage">Skip to presentation</a><header className="toolbar"><a className="brand" href="#1" aria-label="Aetherlink, slide 1"><img className="brand-mark" src="/aetherlink-mark.png" alt="" width="44" height="44"/>AETHER<span>LINK</span><small>WORLDLINE · CLASSROOM</small></a><div className="tools"><button type="button" id="chapters" disabled={mode === 'follow'} onClick={() => setChaptersOpen(true)}>Chapters <span>≡</span></button><button type="button" id="prompt" onClick={() => setPromptOpen(true)}>Example prompt</button><button type="button" id="presenter" className="presenter-btn" disabled={mode === 'reader' || mode === 'follow'} onClick={() => { if (mode === 'projector') openPresenterWindow(index); }}>Presenter view ↗</button><button type="button" id="fullscreen" aria-label={fullscreenLabel} title={fullscreenLabel} onClick={(event) => { const btn = event.currentTarget; const refocus = () => { btn.blur(); stageRef.current?.focus?.(); }; try { if (window !== window.top) { refocus(); return; } } catch { refocus(); return; } if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen(); refocus(); }}>⛶</button></div></header>{companions && companions.length > 0 && (<nav className="deck-companions" aria-label="HTML Solo companions" data-testid="deck-solo-companions">{companions.map((c) => <a key={c.href} className="deck-companion-link" href={c.href} target="_blank" rel="noreferrer">{c.label}</a>)}</nav>)}
    <main key={`${activeSlide.id}-${mode}`} id="stage" ref={stageRef} tabIndex={-1} inert={mode === 'follow'}>{type === 'practice' && !isAssignment && <div className="assignment-banner"><span className="dot"/>Assignment in progress</div>}{mode !== 'reader' && isAssignment && <AssignmentView slide={activeSlide} index={index} total={total} hidden={hiddenAt(index)}/>}{mode !== 'reader' && !isAssignment && <><section className="heading"/><div ref={bodyRef} className={`slide-body${!hasInstructionVisual && (array<string>(activeSlide.steps).length > 0 || activeSlide.expected || activeSlide.check) && text(activeSlide.layout) !== 'steps' ? ' with-side' : ''}`}><div ref={mainRef} className="slide-main"/>{!hasInstructionVisual && text(activeSlide.layout) !== 'steps' && <Instructions slide={activeSlide}/>}</div></>}{mode === 'reader' && <section className="reader-lesson" aria-label="Lesson reading">{readerSlides.map((lessonSlide) => <article key={lessonSlide.id}><h2>{lessonSlide.title}</h2>{lessonSlide.subtitle && <p>{lessonSlide.subtitle}</p>}<LayoutRenderer slide={lessonSlide} revealStep={Number.MAX_SAFE_INTEGER}/></article>)}</section>}{mode === 'presenter' && <PresenterTools presence={presence} onPlanBToggle={() => { mountRef.current?.togglePlanB(); }} slide={activeSlide} {...(slides[index + 1] ? {next: slides[index + 1]} : {})}/>}</main>
    <footer className="controls"><div className="position"><span id="count">{`${String(index + 1).padStart(2, '0')} / ${total}`}</span><nav id="progress" className="progress" aria-label="Deck overview, one segment per slide">{progress}</nav><span className="kbd-hint"><kbd>←</kbd> <kbd>→</kbd> navigate · <kbd>S</kbd> presenter view · <kbd>H</kbd> hide slide</span></div><nav className="arrows" aria-label="Slide navigation"><button type="button" id="prev" aria-label="Previous slide" onClick={(event) => { previous(); event.currentTarget.blur(); stageRef.current?.focus?.(); }} disabled={mode === 'follow' || index === 0}>←</button><button type="button" id="next" aria-label="Next slide" onClick={(event) => { next(); event.currentTarget.blur(); stageRef.current?.focus?.(); }} disabled={mode === 'follow' || index === total - 1}>→</button></nav></footer>
    {promptOpen && <dialog open className="deck-dialog"><button type="button" onClick={() => setPromptOpen(false)}>Close</button><h2>Example prompt · {activeSlide.title}</h2>{activeSlide.prompt ? <><p>Read this aloud, or paste it into Claude Code.</p><textarea readOnly value={activeSlide.prompt} aria-label="Copy-ready example prompt"/><button type="button" onClick={() => void navigator.clipboard?.writeText(text(activeSlide.prompt))}>Copy prompt</button></> : <p>This slide has no exact read-aloud prompt.</p>}</dialog>}
    {chaptersOpen && <dialog open className="deck-dialog"><button type="button" onClick={() => setChaptersOpen(false)}>Close</button><h2>Chapters</h2><nav className="chapter-list deck-chapters" aria-label={`All ${total} slides`}>{slides.map((item, i) => <div key={item.id || i} className={`chapter-row${hiddenFlags[i] ? ' is-hidden' : ''}`}><button type="button" className="chapter-link" onClick={() => { if (mode !== 'follow') onIndexChange(i); setChaptersOpen(false); }}>{String(i + 1).padStart(2, '0')} <strong>{item.title}</strong></button>{mode !== 'follow' && mode !== 'reader' && <button type="button" className="chapter-hide" aria-pressed={hiddenFlags[i] === true} aria-label={`${hiddenFlags[i] ? 'Show' : 'Hide'} slide ${i + 1}`} onClick={() => toggleHidden(i)}>{hiddenFlags[i] ? 'Show' : 'Hide'}</button>}</div>)}</nav></dialog>}
    
  </div>;
}

export type {ReactNode};
