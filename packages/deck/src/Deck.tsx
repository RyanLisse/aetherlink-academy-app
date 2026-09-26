import {useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {Slide} from '@academy/schema';
import {mountSourceVisuals, type SourceVisualMount} from './source-visuals.js';
import {Instructions, LayoutRenderer} from './renderers.js';

export type DeckMode = 'projector' | 'presenter' | 'reader' | 'follow';
export type DeckSlide = Slide & Record<string, unknown>;
export interface DeckProps { readonly slides: ReadonlyArray<DeckSlide>; readonly index: number; readonly revealStep: number; readonly mode: DeckMode; readonly onIndexChange: (index: number) => void; readonly onRevealStepChange: (step: number) => void; readonly presence?: ReactNode; }
const text = (value: unknown): string => typeof value === 'string' ? value : '';
const array = <T,>(value: unknown): ReadonlyArray<T> => Array.isArray(value) ? value as ReadonlyArray<T> : [];
const visual = (slide: DeckSlide): Record<string, unknown> => slide.visual && typeof slide.visual === 'object' && !Array.isArray(slide.visual) ? slide.visual as Record<string, unknown> : {};
const typeLabel = (slide: DeckSlide): string => text(slide.type) || (text(slide.layout) === 'exercise' ? 'practice' : text(slide.layout) === 'recap' ? 'recap' : 'context');
const typeDisplay = (type: string): string => ({practice: 'Assignment', concept: 'Concept', review: 'Review', recap: 'Recap', pause: 'Break', context: 'Context'}[type] ?? type);

function PresenterTools({slide, next, presence, onPlanBToggle}: {readonly slide: DeckSlide; readonly next?: DeckSlide; readonly presence?: ReactNode; readonly onPlanBToggle?: () => void}) {
  const presetMinutes = typeof slide.timer === 'number' ? String(slide.timer) : '';
  const minutesToSeconds = (value: string): number => Math.max(0, Math.min(180, Math.floor(Number(value) || 0))) * 60;
  const [elapsed, setElapsed] = useState(0); const [minutes, setMinutes] = useState(presetMinutes); const [remaining, setRemaining] = useState(minutesToSeconds(presetMinutes)); const [running, setRunning] = useState(false);
  const showTimer = text(slide.layout) === 'exercise' || presetMinutes !== '';
  useEffect(() => { setRunning(false); setMinutes(presetMinutes); setRemaining(minutesToSeconds(presetMinutes)); }, [slide.id, presetMinutes]);
  useEffect(() => { const started = Date.now(); const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000); return () => window.clearInterval(id); }, []);
  useEffect(() => { if (!running || remaining <= 0) return; const id = window.setInterval(() => setRemaining((value) => Math.max(value - 1, 0)), 1000); return () => window.clearInterval(id); }, [running, remaining]);
  const fmt = (seconds: number): string => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return <aside className="presenter-tools deck-presenter-tools">{presence && <div className="presence deck-presence" aria-label="Participants">{presence}</div>}<p>Elapsed {fmt(elapsed)}</p>{showTimer && <p>Assignment timer {fmt(remaining)} <label><input type="number" min="0" max="180" step="1" placeholder="0" aria-label="Minutes for this assignment" value={minutes} disabled={running} onChange={(event) => { setMinutes(event.target.value); if (!running) setRemaining(minutesToSeconds(event.target.value)); }}/> min</label> <button type="button" onClick={() => setRunning((value) => !value)} disabled={remaining === 0}>{running ? 'Pause' : 'Start'}</button> <button type="button" onClick={() => { setRunning(false); setRemaining(minutesToSeconds(minutes)); }}>Reset</button></p>}<section><h2>Facilitator notes</h2><p>{text(slide.notes) || 'No facilitator notes on this slide.'}</p></section>{slide.prompt && <section><h2>Exact prompt</h2><textarea readOnly value={slide.prompt} aria-label="Copy-ready example prompt"/><button type="button" onClick={() => void navigator.clipboard?.writeText(text(slide.prompt))}>Copy prompt</button></section>}<p>Next slide: {next ? next.title : 'This is the last slide.'}</p>{(visual(slide).planB || slide.planB) && <section><h2>Plan B</h2><p>{text(slide.planB)}</p><button type="button" onClick={onPlanBToggle}>Toggle Plan B</button></section>}</aside>;
}

export function Deck(props: DeckProps) {
  const slide = props.slides[props.index] ?? props.slides[0];
  if (!slide) return null;
  return <DeckContent {...props}/>;
}

function DeckContent({slides, index, revealStep, mode, onIndexChange, onRevealStepChange, presence}: DeckProps) {
  const slide = slides[index] ?? slides[0]; const total = slides.length; if (!slide) return null; const activeSlide = slide; const type = typeLabel(activeSlide);
  const [promptOpen, setPromptOpen] = useState(false); const [chaptersOpen, setChaptersOpen] = useState(false); const [presenterOpen, setPresenterOpen] = useState(false);
  const stageRef = useRef<HTMLElement>(null); const bodyRef = useRef<HTMLDivElement>(null); const mainRef = useRef<HTMLDivElement>(null); const mountRef = useRef<SourceVisualMount | null>(null);
  const revealStepChangeRef = useRef(onRevealStepChange);
  revealStepChangeRef.current = onRevealStepChange;
  const next = () => { if (mode !== 'follow') onIndexChange(Math.min(index + 1, total - 1)); }; const previous = () => { if (mode !== 'follow') onIndexChange(Math.max(index - 1, 0)); };
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
        setPromptOpen(false); setChaptersOpen(false); setPresenterOpen(false);
        return;
      }
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
          target?.closest('input, textarea, select, button, a, [contenteditable]:not([contenteditable="false"]), dialog') ||
          promptOpen || chaptersOpen || presenterOpen || mode === 'follow') return;
      if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
        event.preventDefault(); if (!reveal()) next();
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault(); previous();
      } else if (event.key === 'Home') {
        event.preventDefault(); onIndexChange(0);
      } else if (event.key === 'End') {
        event.preventDefault(); onIndexChange(total - 1);
      } else if (event.key.toLowerCase() === 's' || event.key.toLowerCase() === 'p') {
        if (mode !== 'reader') setPresenterOpen(true);
      } else if (event.key.toLowerCase() === 'b' && (visual(activeSlide).planB || activeSlide.planB)) {
        event.preventDefault(); mountRef.current?.togglePlanB();
      } else if (event.key.toLowerCase() === 'c') setChaptersOpen(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const staticHeadingMarkup = renderToStaticMarkup(<><div className="heading-top"><p className="eyebrow"><span className="type-chip">{typeDisplay(typeLabel(activeSlide))}</span><span className="kicker-text">{text(activeSlide.kicker)}</span></p><p className="slide-count">{`${index + 1} / ${total}`}</p></div><h1>{activeSlide.title}</h1>{activeSlide.subtitle && <p className="subtitle">{activeSlide.subtitle}</p>}</>);
  const staticMainMarkup = renderToStaticMarkup(<><LayoutRenderer slide={activeSlide} revealStep={-1}/>{activeSlide.tagline && <p className="tagline">{activeSlide.tagline}</p>}</>);
  useLayoutEffect(() => {
    const stageNode = stageRef.current;
    if (mode === 'reader') {
      mountRef.current?.cleanup();
      mountRef.current = null;
      return;
    }
    const bodyNode = stageNode?.querySelector<HTMLDivElement>('.slide-body') ?? null;
    const mainNode = stageNode?.querySelector<HTMLDivElement>('.slide-main') ?? null;
    if (!stageNode || !bodyNode || !mainNode) return;
    const mount = mountSourceVisuals(stageNode, bodyNode, mainNode, activeSlide, {initialMarkup: staticMainMarkup, initialHeadingMarkup: staticHeadingMarkup, revealStep, onRevealStepChange: (step) => revealStepChangeRef.current(step)});
    mountRef.current = mount;
    return () => {
      mount.cleanup();
      if (mountRef.current === mount) mountRef.current = null;
    };
  }, [slide, index, mode]);
  useLayoutEffect(() => { mountRef.current?.syncRevealStep(revealStep); }, [revealStep]);
  const progress = useMemo(() => slides.map((item, i) => <button type="button" key={item.id || i} className={`seg ${i === index ? 'current' : i < index ? 'done' : ''}`} data-type={typeLabel(item)} aria-label={`${i + 1}. ${item.title}`} aria-current={i === index ? 'step' : undefined} disabled={mode === 'follow'} onClick={() => onIndexChange(i)} />), [slides, index, onIndexChange, mode]);
  if (!slide) return null;
  const readerSlides = slides.filter((item) => item.lessonId === activeSlide.lessonId);
  const hasInstructionVisual = ['quiz', 'stamps', 'perCard', 'runner'].some((key) => visual(activeSlide)[key] !== undefined);
  return <div className={`academy-deck mode-${mode} deck-type-${type}${activeSlide.dark ? " spotlight" : ""}${visual(activeSlide).keynote === true ? " keynote" : ""}`} data-type={type} data-lesson={activeSlide.lessonId} data-face={visual(activeSlide).keynote === true ? "keynote" : undefined} data-opener={typeof visual(activeSlide).opener === 'string' ? visual(activeSlide).opener : ''} data-index={index} data-total={total}>
    <a className="skip" href="#stage">Skip to presentation</a><header className="toolbar"><a className="brand" href="#1" aria-label="Aetherlink, slide 1"><img className="brand-mark" src="/aetherlink-mark.png" alt="" width="44" height="44"/>AETHER<span>LINK</span><small>WORLDLINE · CLASSROOM</small></a><div className="tools"><button type="button" id="chapters" disabled={mode === 'follow'} onClick={() => setChaptersOpen(true)}>Chapters <span>≡</span></button><button type="button" id="prompt" onClick={() => setPromptOpen(true)}>Example prompt</button><button type="button" id="presenter" className="presenter-btn" disabled={mode === 'reader' || mode === 'follow'} onClick={() => setPresenterOpen(true)}>Presenter view ↗</button><button type="button" id="fullscreen" aria-label="Enter fullscreen" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen(); }}>⛶</button></div></header>
    <main key={`${activeSlide.id}-${mode}`} id="stage" ref={stageRef} tabIndex={-1} inert={mode === 'follow'}>{type === 'practice' && <div className="assignment-banner"><span className="dot"/>Assignment in progress</div>}{mode !== 'reader' && <><section className="heading"/><div ref={bodyRef} className={`slide-body${!hasInstructionVisual && (array<string>(activeSlide.steps).length > 0 || activeSlide.expected || activeSlide.check) && text(activeSlide.layout) !== 'steps' ? ' with-side' : ''}`}><div ref={mainRef} className="slide-main"/>{!hasInstructionVisual && text(activeSlide.layout) !== 'steps' && <Instructions slide={activeSlide}/>}</div></>}{mode === 'reader' && <section className="reader-lesson" aria-label="Lesson reading">{readerSlides.map((lessonSlide) => <article key={lessonSlide.id}><h2>{lessonSlide.title}</h2>{lessonSlide.subtitle && <p>{lessonSlide.subtitle}</p>}<LayoutRenderer slide={lessonSlide} revealStep={Number.MAX_SAFE_INTEGER}/></article>)}</section>}{mode === 'presenter' && <PresenterTools presence={presence} onPlanBToggle={() => { mountRef.current?.togglePlanB(); }} slide={activeSlide} {...(slides[index + 1] ? {next: slides[index + 1]} : {})}/>}</main>
    <footer className="controls"><div className="position"><span id="count">{`${String(index + 1).padStart(2, '0')} / ${total}`}</span><nav id="progress" className="progress" aria-label="Deck overview, one segment per slide">{progress}</nav><span className="kbd-hint"><kbd>←</kbd> <kbd>→</kbd> navigate · <kbd>S</kbd> presenter view</span></div><nav className="arrows" aria-label="Slide navigation"><button type="button" id="prev" aria-label="Previous slide" onClick={previous} disabled={mode === 'follow' || index === 0}>←</button><button type="button" id="next" aria-label="Next slide" onClick={next} disabled={mode === 'follow' || index === total - 1}>→</button></nav></footer>
    {promptOpen && <dialog open className="deck-dialog"><button type="button" onClick={() => setPromptOpen(false)}>Close</button><h2>Example prompt · {activeSlide.title}</h2>{activeSlide.prompt ? <><p>Read this aloud, or paste it into Claude Code.</p><textarea readOnly value={activeSlide.prompt} aria-label="Copy-ready example prompt"/><button type="button" onClick={() => void navigator.clipboard?.writeText(text(activeSlide.prompt))}>Copy prompt</button></> : <p>This slide has no exact read-aloud prompt.</p>}</dialog>}
    {chaptersOpen && <dialog open className="deck-dialog"><button type="button" onClick={() => setChaptersOpen(false)}>Close</button><h2>Chapters</h2><nav className="chapter-list deck-chapters" aria-label={`All ${total} slides`}>{slides.map((item, i) => <button type="button" key={item.id || i} onClick={() => { if (mode !== 'follow') onIndexChange(i); setChaptersOpen(false); }}>{String(i + 1).padStart(2, '0')} <strong>{item.title}</strong></button>)}</nav></dialog>}
    {presenterOpen && mode !== 'reader' && mode !== 'follow' && <dialog open className="deck-dialog presenter-dialog"><button type="button" onClick={() => setPresenterOpen(false)}>Close</button><PresenterTools presence={presence} onPlanBToggle={() => { mountRef.current?.togglePlanB(); }} slide={activeSlide} {...(slides[index + 1] ? {next: slides[index + 1]} : {})}/></dialog>}
  </div>;
}

export type {ReactNode};
