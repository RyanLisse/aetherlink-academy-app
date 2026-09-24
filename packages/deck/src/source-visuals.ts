import type {JsonValue, Slide} from '@academy/schema';

type ArtKind = 'sliders' | 'thermo' | 'route' | 'timeline' | 'thought';
type BotName = 'multiarm' | 'wave' | 'think' | 'point' | 'head' | 'stretchLeft' | 'sleepy' | 'happy' | 'peek' | 'stretchUp' | 'stretchRight';
type BotPlace = 'left' | 'beside' | 'under' | 'popout' | 'nest' | 'key' | 'slot' | 'stamps' | 'aside' | 'stack' | 'pointer' | 'timeline';
type ToolName = 'map' | 'arm' | 'toolbox' | 'thought';
type VisualArt = ArtKind | 'flow' | 'window' | 'gate' | 'prompt' | 'nested' | 'loop' | 'boxes' | 'stairs' | 'intake';

interface HighlightSpec {
  readonly in: string;
  readonly text: string;
  readonly tone: string;
}

interface TermLine {
  readonly c: string | undefined;
  readonly o: string | undefined;
  readonly ask: string | undefined;
}

interface DiffRun {
  readonly title: string;
  readonly rows: ReadonlyArray<{readonly k: string; readonly miss?: boolean; readonly odd?: boolean; readonly note?: string}>;
}

interface LifespanSpec {
  readonly kind: string;
  readonly icon: string;
  readonly label: string;
}

interface QuizSpec {
  readonly answer: number;
}

interface RunnerSpec {
  readonly label: string;
  readonly tone: string;
}

interface VisualData {
  readonly art: VisualArt | undefined;
  readonly bot: BotName | undefined;
  readonly place: BotPlace | undefined;
  readonly tool: ToolName | undefined;
  readonly target: string | undefined;
  readonly cardArt: Readonly<Record<string, ArtKind>> | undefined;
  readonly pillarIcons: boolean | undefined;
  readonly stagger: string | undefined;
  readonly hero: number | undefined;
  readonly keynote: boolean | undefined;
  readonly popOut: number | undefined;
  readonly chipIcons: ReadonlyArray<string> | undefined;
  readonly chipGrid: number | undefined;
  readonly keyLine: number | undefined;
  readonly stamp: string | undefined;
  readonly reveal: 'click' | undefined;
  readonly faces: ReadonlyArray<string> | undefined;
  readonly noReact: boolean | undefined;
  readonly buttons: boolean | undefined;
  readonly quiz: QuizSpec | undefined;
  readonly countdown: number | undefined;
  readonly spotlight: number | undefined;
  readonly pointAt: number | undefined;
  readonly pointH: number | undefined;
  readonly pairs: boolean | undefined;
  readonly term: ReadonlyArray<TermLine> | undefined;
  readonly gateLabel: string | undefined;
  readonly promptMarks: ReadonlyArray<string> | undefined;
  readonly stepKeys: boolean | undefined;
  readonly humanStep: number | undefined;
  readonly reach: boolean | undefined;
  readonly loopCaptions: boolean | undefined;
  readonly link: Readonly<Record<string, ReadonlyArray<string>>> | undefined;
  readonly stack: ReadonlyArray<string> | undefined;
  readonly cmdCards: ReadonlyArray<number> | undefined;
  readonly browser: number | undefined;
  readonly lineReveal: number | undefined;
  readonly stamps: ReadonlyArray<string> | undefined;
  readonly badge: number | undefined;
  readonly swap: boolean | undefined;
  readonly template: number | undefined;
  readonly templateRows: ReadonlyArray<string> | undefined;
  readonly notebook: number | undefined;
  readonly quietTimer: number | undefined;
  readonly badges: ReadonlyArray<string> | undefined;
  readonly dayRoute: ReadonlyArray<string> | undefined;
  readonly today: ReadonlyArray<number> | undefined;
  readonly tags: Readonly<Record<string, string>> | undefined;
  readonly mdfile: number | undefined;
  readonly mdName: string | undefined;
  readonly guides: ReadonlyArray<readonly [string, string, string]> | undefined;
  readonly repeatStack: number | undefined;
  readonly noSkill: number | undefined;
  readonly diff: ReadonlyArray<DiffRun> | undefined;
  readonly lifespan: ReadonlyArray<LifespanSpec> | undefined;
  readonly tree: number | undefined;
  readonly fence: number | undefined;
  readonly conveyor: number | undefined;
  readonly perCard: ReadonlyArray<string> | undefined;
  readonly gameFlow: boolean | undefined;
  readonly gameMock: boolean | undefined;
  readonly phrase: string | undefined;
  readonly catChips: number | undefined;
  readonly runner: ReadonlyArray<RunnerSpec> | undefined;
  readonly plugs: number | undefined;
  readonly zones: readonly [string, string, ReadonlyArray<string>] | undefined;
  readonly pending: readonly [string, string] | undefined;
  readonly sourceTiles: number | undefined;
  readonly planB: string | undefined;
  readonly planBLabel: string | undefined;
  readonly menu: number | undefined;
  readonly pipes: boolean | undefined;
  readonly same: ReadonlyArray<number> | undefined;
  readonly recapKeys: boolean | undefined;
  readonly levelUp: boolean | undefined;
  readonly supportDays: boolean | undefined;
  readonly doneSteps: number | undefined;
  readonly handover: string | undefined;
  readonly sentences: boolean | undefined;
  readonly checklist: number | undefined;
  readonly addLine: string | undefined;
  readonly highlight: ReadonlyArray<HighlightSpec> | undefined;
  readonly opener: string | undefined;
  readonly image: string | undefined;
  readonly imageLink: string | undefined;
  readonly cardImages: ReadonlyArray<string> | undefined;
  readonly compact: boolean | undefined;
}

interface BotData {
  readonly src: string;
  readonly hatch?: readonly [number, number];
  readonly tip?: readonly [number, number];
  readonly ratio?: number;
}

interface RenderExtras {
  readonly aim: HTMLElement[];
  row: HTMLElement | undefined;
  slot: HTMLElement | undefined;
  react: ((index: number) => void) | undefined;
  steps: HTMLElement[] | undefined;
  pointer: HTMLElement | undefined;
  stampRow: HTMLElement | undefined;
  aside: HTMLElement | undefined;
}

interface NestVisual {
  readonly row: HTMLElement;
  readonly labels: SVGTextElement[];
  onChange: (() => void) | null;
  readonly current: () => number;
}

const isRecord = (value: JsonValue | undefined): value is {readonly [key: string]: JsonValue} =>
  value !== undefined && value !== null && typeof value === 'object' && !Array.isArray(value);
const stringValue = (value: JsonValue | undefined): string | undefined => typeof value === 'string' ? value : undefined;
const numberValue = (value: JsonValue | undefined): number | undefined => typeof value === 'number' && Number.isFinite(value) ? value : undefined;
const booleanValue = (value: JsonValue | undefined): boolean | undefined => typeof value === 'boolean' ? value : undefined;
const stringArray = (value: JsonValue | undefined): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const result = value.filter((item): item is string => typeof item === 'string');
  return result.length === value.length ? result : undefined;
};
const numberArray = (value: JsonValue | undefined): number[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const result = value.filter((item): item is number => typeof item === 'number' && Number.isFinite(item));
  return result.length === value.length ? result : undefined;
};
const literal = <T extends string>(value: JsonValue | undefined, values: readonly T[]): T | undefined => {
  const text = stringValue(value);
  return text !== undefined && values.includes(text as T) ? text as T : undefined;
};
const indexedStrings = (value: JsonValue | undefined): Readonly<Record<string, string>> | undefined => {
  if (!isRecord(value)) return undefined;
  const result: Record<string, string> = {};
  for (const [key, item] of Object.entries(value)) {
    const text = stringValue(item);
    if (text === undefined) return undefined;
    result[key] = text;
  }
  return result;
};
const indexedStringArrays = (value: JsonValue | undefined): Readonly<Record<string, ReadonlyArray<string>>> | undefined => {
  if (!isRecord(value)) return undefined;
  const result: Record<string, ReadonlyArray<string>> = {};
  for (const [key, item] of Object.entries(value)) {
    const values = stringArray(item);
    if (values === undefined) return undefined;
    result[key] = values;
  }
  return result;
};
const tuple3 = (value: JsonValue | undefined): readonly [string, string, string] | undefined => {
  const values = stringArray(value);
  if (values?.length !== 3) return undefined;
  const [first, second, third] = values;
  return first !== undefined && second !== undefined && third !== undefined ? [first, second, third] : undefined;
};
const tuple2 = (value: JsonValue | undefined): readonly [string, string] | undefined => {
  const values = stringArray(value);
  if (values?.length !== 2) return undefined;
  const [first, second] = values;
  return first !== undefined && second !== undefined ? [first, second] : undefined;
};
const zonesValue = (value: JsonValue | undefined): readonly [string, string, ReadonlyArray<string>] | undefined => {
  if (!Array.isArray(value) || value.length !== 3) return undefined;
  const first = stringValue(value[0]); const second = stringValue(value[1]); const third = stringArray(value[2]);
  return first !== undefined && second !== undefined && third !== undefined ? [first, second, third] : undefined;
};
const parseVisual = (value: JsonValue | undefined): VisualData | undefined => {
  if (!isRecord(value)) return undefined;
  const terms = Array.isArray(value.term) ? value.term.flatMap((item): TermLine[] => {
    if (!isRecord(item)) return [];
    const line: TermLine = {c: stringValue(item.c), o: stringValue(item.o), ask: stringValue(item.ask)};
    return [line];
  }) : undefined;
  const quizValue = isRecord(value.quiz) ? numberValue(value.quiz.answer) : undefined;
  const guides = Array.isArray(value.guides) ? value.guides.flatMap((item): Array<readonly [string, string, string]> => {
    const tuple = tuple3(item);
    return tuple ? [tuple] : [];
  }) : undefined;
  const diff = Array.isArray(value.diff) ? value.diff.flatMap((item): DiffRun[] => {
    if (!isRecord(item)) return [];
    const title = stringValue(item.title);
    if (title === undefined || !Array.isArray(item.rows)) return [];
    const rows = item.rows.flatMap((row): Array<{readonly k: string; readonly miss?: boolean; readonly odd?: boolean; readonly note?: string}> => {
      if (!isRecord(row)) return [];
      const k = stringValue(row.k);
      if (k === undefined) return [];
      const parsed: {k: string; miss?: boolean; odd?: boolean; note?: string} = {k};
      const miss = booleanValue(row.miss); const odd = booleanValue(row.odd); const note = stringValue(row.note);
      if (miss !== undefined) parsed.miss = miss;
      if (odd !== undefined) parsed.odd = odd;
      if (note !== undefined) parsed.note = note;
      return [parsed];
    });
    return rows.length === item.rows.length ? [{title, rows}] : [];
  }) : undefined;
  const lifespan = Array.isArray(value.lifespan) ? value.lifespan.flatMap((item): LifespanSpec[] => {
    if (!isRecord(item)) return [];
    const kind = stringValue(item.kind); const icon = stringValue(item.icon); const label = stringValue(item.label);
    return kind !== undefined && icon !== undefined && label !== undefined ? [{kind, icon, label}] : [];
  }) : undefined;
  const runner = Array.isArray(value.runner) ? value.runner.flatMap((item): RunnerSpec[] => {
    if (!isRecord(item)) return [];
    const label = stringValue(item.label); const tone = stringValue(item.tone);
    return label !== undefined && tone !== undefined ? [{label, tone}] : [];
  }) : undefined;
  const cardArt = indexedStrings(value.cardArt);
  const typedCardArt = cardArt ? Object.fromEntries(Object.entries(cardArt).flatMap(([key, item]) => {
    const kind = literal(item, ['sliders', 'thermo', 'route', 'timeline', 'thought']);
    return kind ? [[key, kind]] : [];
  })) : undefined;
  return {
    art: literal(value.art, ['sliders', 'thermo', 'route', 'timeline', 'thought', 'flow', 'window', 'gate', 'prompt', 'nested', 'loop', 'boxes', 'stairs', 'intake']),
    bot: literal(value.bot, ['multiarm', 'wave', 'think', 'point', 'head', 'stretchLeft', 'sleepy', 'happy', 'peek', 'stretchUp', 'stretchRight']),
    place: literal(value.place, ['left', 'beside', 'under', 'popout', 'nest', 'key', 'slot', 'stamps', 'aside', 'stack', 'pointer', 'timeline']),
    tool: literal(value.tool, ['map', 'arm', 'toolbox', 'thought']), target: stringValue(value.target),
    cardArt: typedCardArt, pillarIcons: booleanValue(value.pillarIcons), stagger: stringValue(value.stagger),
    hero: numberValue(value.hero), keynote: booleanValue(value.keynote), popOut: numberValue(value.popOut), chipIcons: stringArray(value.chipIcons), chipGrid: numberValue(value.chipGrid),
    keyLine: numberValue(value.keyLine), stamp: stringValue(value.stamp), reveal: literal(value.reveal, ['click']), faces: stringArray(value.faces), noReact: booleanValue(value.noReact),
    quiz: quizValue === undefined ? undefined : {answer: quizValue}, countdown: numberValue(value.countdown), spotlight: numberValue(value.spotlight), pointAt: numberValue(value.pointAt), pointH: numberValue(value.pointH), pairs: booleanValue(value.pairs), buttons: booleanValue(value.buttons),
    term: terms, gateLabel: stringValue(value.gateLabel), promptMarks: stringArray(value.promptMarks), stepKeys: booleanValue(value.stepKeys), humanStep: numberValue(value.humanStep),
    reach: booleanValue(value.reach), loopCaptions: booleanValue(value.loopCaptions), link: indexedStringArrays(value.link), stack: stringArray(value.stack), cmdCards: numberArray(value.cmdCards), browser: numberValue(value.browser),
    lineReveal: numberValue(value.lineReveal), stamps: stringArray(value.stamps), badge: numberValue(value.badge), swap: booleanValue(value.swap), template: numberValue(value.template), templateRows: stringArray(value.templateRows),
    notebook: numberValue(value.notebook), quietTimer: numberValue(value.quietTimer), badges: stringArray(value.badges), dayRoute: stringArray(value.dayRoute), today: numberArray(value.today), tags: indexedStrings(value.tags),
    mdfile: numberValue(value.mdfile), mdName: stringValue(value.mdName), guides, repeatStack: numberValue(value.repeatStack), noSkill: numberValue(value.noSkill), diff, lifespan, tree: numberValue(value.tree), fence: numberValue(value.fence), conveyor: numberValue(value.conveyor),
    perCard: stringArray(value.perCard), gameFlow: booleanValue(value.gameFlow), gameMock: booleanValue(value.gameMock), phrase: stringValue(value.phrase), catChips: numberValue(value.catChips), runner, plugs: numberValue(value.plugs),
    zones: zonesValue(value.zones), pending: tuple2(value.pending),
    sourceTiles: numberValue(value.sourceTiles), planB: stringValue(value.planB), planBLabel: stringValue(value.planBLabel), menu: numberValue(value.menu), pipes: booleanValue(value.pipes), same: numberArray(value.same), recapKeys: booleanValue(value.recapKeys),
    levelUp: booleanValue(value.levelUp), supportDays: booleanValue(value.supportDays), doneSteps: numberValue(value.doneSteps), handover: stringValue(value.handover), sentences: booleanValue(value.sentences), checklist: numberValue(value.checklist), addLine: stringValue(value.addLine),
    highlight: Array.isArray(value.highlight) ? value.highlight.flatMap((item): HighlightSpec[] => { if (!isRecord(item)) return []; const inside = stringValue(item.in); const text = stringValue(item.text); const tone = stringValue(item.tone); return inside !== undefined && text !== undefined && tone !== undefined ? [{in: inside, text, tone}] : []; }) : undefined,
    opener: stringValue(value.opener),
    image: stringValue(value.image),
    imageLink: stringValue(value.imageLink),
    cardImages: stringArray(value.cardImages),
    compact: booleanValue(value.compact),
  };
};

export interface SourceVisualMount {
  readonly cleanup: () => void;
  readonly reveal: () => boolean;
  readonly syncRevealStep: (step: number) => void;
  readonly togglePlanB: () => boolean;
}

export interface SourceVisualOptions {
  /** Static React markup is inserted once; this mount owns all descendants afterwards. */
  readonly initialMarkup?: string;
  readonly initialHeadingMarkup?: string;
  readonly revealStep?: number;
  readonly onRevealStepChange?: (step: number) => void;
}

/**
 * Source-faithful port of classroom-slides/app.js visual decorations.
 * Provenance: /tmp/academy-wave-next/classroom-slides/app.js lines 121-671.
 * The port is imperative and scoped to the supplied stage; cleanup aborts
 * listeners/observers/timers and removes every node created by this mount.
 */
function createSourceVisualMount(stage: HTMLElement, body: HTMLElement, main: HTMLElement, slide: Slide, options: SourceVisualOptions = {}): SourceVisualMount {
  const doc = stage.ownerDocument;
  const heading = stage.querySelector<HTMLElement>('.heading');
  const initialBodyClassName = body.className;
  const initialMainClassName = main.className;
  if (options.initialMarkup !== undefined) main.innerHTML = options.initialMarkup;
  if (heading && options.initialHeadingMarkup !== undefined) heading.innerHTML = options.initialHeadingMarkup;
  const controller = new AbortController();
  const revealFns: Array<() => boolean> = [];
  let revealCursor = -1;
  let planBToggle: () => boolean = () => false;
  const rafs = new Set<number>();
  const view = doc.defaultView;
  const raf = (fn: FrameRequestCallback): number => { const id = view?.requestAnimationFrame(fn) ?? 0; if (id) rafs.add(id); return id; };
  const requestAnimationFrame = raf;
  const cancelAnimationFrame = (id: number) => { if (id) { view?.cancelAnimationFrame(id); rafs.delete(id); } };
  const s = slide;
  const visual = parseVisual(s.visual);
  const node = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string | null, text?: string | null): HTMLElementTagNameMap[K] => {
    const element = doc.createElement(tag);
    if (cls) element.className = cls;
    if (text !== undefined && text !== null) element.textContent = text;
    return element;
  };
  const svg = (viewBox: string, inner: string, cls?: string): SVGSVGElement => {
    const element = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    element.setAttribute('viewBox', viewBox); element.setAttribute('aria-hidden', 'true'); element.setAttribute('focusable', 'false');
    if (cls) element.setAttribute('class', cls); element.innerHTML = inner; return element;
  };
  const rel = (el: Element, root: HTMLElement): {x: number; y: number; w: number; h: number} => { const a = el.getBoundingClientRect(), b = root.getBoundingClientRect(); return {x: a.left-b.left+root.scrollLeft, y: a.top-b.top, w: a.width, h: a.height}; };
  const SVGNS = 'http://www.w3.org/2000/svg';
  const slideController = controller;
  const document = doc;
  const registerReveal = (fn: () => boolean): (() => boolean) => { revealFns.push(fn); return fn; };
  const slideItems = Array.isArray(s.items) ? s.items as ReadonlyArray<Record<string, unknown>> : [];
  const staticReveal = (step: number): void => {
    const steps = Array.from(main.querySelectorAll<HTMLElement>('.step-item'));
    if (steps.length) {
      const selected = step >= steps.length ? steps.length : Math.min(Math.max(step, -1), steps.length - 1);
      steps.forEach((item, index) => {
        const active = selected === steps.length || index === selected;
        item.classList.toggle('active', active);
        item.querySelector<HTMLButtonElement>('.step-btn')?.setAttribute('aria-pressed', String(active));
      });
      const detail = main.querySelector<HTMLElement>('.steps-detail');
      const detailIndex = selected === steps.length ? -1 : selected;
      const item = detailIndex >= 0 ? slideItems[detailIndex] : undefined;
      const detailValue = (s as unknown as Record<string, unknown>).detail;
      const detailText = typeof item?.detail === 'string' ? item.detail : typeof item?.caption === 'string' ? item.caption : typeof item?.label === 'string' ? item.label : typeof detailValue === 'string' ? detailValue : '';
      if (detail) detail.textContent = detailText;
      const controls = main.querySelector<HTMLElement>('.steps-wrap .widget-controls');
      const buttons = controls ? Array.from(controls.querySelectorAll<HTMLButtonElement>('button')) : [];
      const next = buttons[0]; if (next) next.disabled = selected >= steps.length - 1;
      const all = buttons[1]; if (all) all.disabled = selected >= steps.length;
    }
    const recap = main.querySelector<HTMLElement>('.recap-list');
    if (recap && !visual?.recapKeys && !visual?.levelUp) {
      const entries = Array.from(recap.children).filter((element): element is HTMLElement => element instanceof HTMLElement);
      const shown = Math.min(Math.max(step + 1, 0), entries.length);
      entries.forEach((entry, index) => {
        const visible = index < shown;
        entry.classList.toggle('hidden-item', !visible);
        entry.setAttribute('aria-hidden', String(!visible));
        const check = entry.querySelector<HTMLElement>('.recap-check');
        if (check) check.textContent = visible ? '✓' : String(index + 1);
      });
      const button = main.querySelector<HTMLButtonElement>('.recap-list + .widget-controls button');
      if (button) {
        button.disabled = shown >= entries.length;
        button.textContent = shown >= entries.length ? 'All shown' : shown === 0 ? `Reveal (${entries.length})` : `Reveal (${entries.length - shown} left)`;
      }
    }
  };
  let timerLeft = Number(s.timer ?? 0) * 60;
  let timerRunning = false;
  let timerId: number | undefined;
  const renderTimer = (): void => {
    const timer = main.querySelector<HTMLElement>('.timer');
    if (!timer) return;
    const minutes = Number(s.timer ?? 0) || 0;
    const face = timer.querySelector<HTMLElement>('.timer-face');
    const fill = timer.querySelector<HTMLElement>('.timer-fill');
    const controls = timer.querySelectorAll<HTMLButtonElement>('.widget-controls button');
    const late = timerLeft <= 60;
    timer.classList.toggle('timer-late', late);
    if (face) face.textContent = timerLeft <= 0 ? 'TIME' : `${String(Math.floor(timerLeft / 60)).padStart(2, '0')}:${String(timerLeft % 60).padStart(2, '0')}`;
    if (fill) fill.style.width = `${minutes > 0 ? 100 * (1 - timerLeft / (minutes * 60)) : 0}%`;
    const start = controls[0]; if (start) { start.disabled = timerLeft === 0; start.textContent = timerRunning ? 'Pause' : timerLeft < minutes * 60 ? 'Resume' : `Start ${minutes} min`; }
  };
  const stopTimer = (): void => { if (timerId !== undefined) { view?.clearInterval(timerId); timerId = undefined; } timerRunning = false; };
  const startTimer = (): void => {
    if (timerLeft <= 0 || timerId !== undefined) return;
    timerRunning = true;
    timerId = view?.setInterval(() => { timerLeft = Math.max(timerLeft - 1, 0); if (timerLeft === 0) stopTimer(); renderTimer(); }, 1000);
    renderTimer();
  };
  let suppressRevealCallback = false;
  const onMainClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const stepButton = target.closest<HTMLButtonElement>('.step-btn');
    if (stepButton && main.contains(stepButton)) {
      const item = stepButton.closest<HTMLElement>('.step-item');
      const index = item ? Array.from(main.querySelectorAll('.step-item')).indexOf(item) : -1;
      if (index >= 0 && !suppressRevealCallback) options.onRevealStepChange?.(index);
      return;
    }
    const controlsButton = target.closest<HTMLButtonElement>('.widget-controls button');
    if (!controlsButton || !main.contains(controlsButton)) return;
    if (controlsButton.closest('.steps-wrap')) {
      const steps = Array.from(main.querySelectorAll('.step-item'));
      const selected = steps.findIndex((item) => item.classList.contains('active'));
      const buttons = Array.from(controlsButton.parentElement?.querySelectorAll('button') ?? []);
      const index = buttons.indexOf(controlsButton) === 0 ? Math.min(selected + 1, steps.length - 1) : steps.length;
      if (index >= 0 && !suppressRevealCallback) options.onRevealStepChange?.(index);
    } else if (controlsButton.closest('.recap-list + .widget-controls')) {
      const entries = Array.from(main.querySelectorAll('.recap-item'));
      const index = entries.findIndex((item) => item.classList.contains('hidden-item'));
      if (index >= 0 && !suppressRevealCallback) options.onRevealStepChange?.(index);
    } else if (controlsButton.closest('.timer')) {
      const buttons = Array.from(controlsButton.parentElement?.querySelectorAll('button') ?? []);
      if (buttons.indexOf(controlsButton) === 0) { if (timerRunning) stopTimer(); else startTimer(); }
      else { stopTimer(); timerLeft = (Number(s.timer ?? 0) || 0) * 60; renderTimer(); }
    }
  };
  main.addEventListener('click', onMainClick, {signal: controller.signal});
  const REACT: readonly string[] = ['?', '⇄', '…?', '⌛', '!!'];
  const BOTS: Record<BotName, BotData> = {
  wave:  { src: '/aetherbot/aetherbot-wave.webp',  hatch: [58.4, 12.6] },
  multiarm: { src: '/aetherbot/aetherbot-multiarm.webp' },
  think: { src: '/aetherbot/aetherbot-think.webp', hatch: [51.3, 14.8] },
  point: { src: '/aetherbot/aetherbot-point.webp', hatch: [32.6, 14.6] },
  head:  { src: '/aetherbot/aetherbot-head.webp',  hatch: [49.6, 25.8] },
  // stretch-arm poses: tip = fingertip position in % of the image (used by place: 'pointer')
  stretchLeft:  { src: '/aetherbot/stretch/aetherbot-stretch-links.webp',  tip: [0.1, 48], ratio: 900 / 541 },
  sleepy:       { src: '/aetherbot/faces/aetherbot-face-slaperig.webp' },
  happy:        { src: '/aetherbot/faces/aetherbot-face-blij.webp' },
  peek:         { src: '/aetherbot/aetherbot-peek.webp' },
  stretchUp:    { src: '/aetherbot/stretch/aetherbot-stretch-omhoog.webp', ratio: 336 / 1100 },
  stretchRight: { src: '/aetherbot/stretch/aetherbot-stretch-rechts.webp', tip: [99.7, 48.5], ratio: 900 / 551 }
};
const PILLAR_ICONS: readonly string[] = [
  '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3"/>',
  '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/><path d="M7.5 10.5l2 2 3.5-4"/>',
  '<path d="M4 12a8 8 0 0 1 14-5l2 2"/><path d="M20 4v5h-5"/><path d="M20 12a8 8 0 0 1-14 5l-2-2"/><path d="M4 20v-5h5"/>'];
const ART: Record<ArtKind, () => SVGSVGElement> = {
  sliders: () => svg('0 0 300 96', [0, 1, 2].map(i => '<g class="sl" style="--i:' + i + '"><path class="sl-track" d="M20 ' + (18 + i * 30) + 'H280"/><circle class="sl-knob" cx="' + [210, 120, 70][i] + '" cy="' + (18 + i * 30) + '" r="10"/></g>').join(''), 'art art-sliders'),
  thermo: () => svg('0 0 300 96', '<rect class="th-tube" x="22" y="10" width="20" height="62" rx="10"/><circle class="th-bulb" cx="32" cy="78" r="14"/><rect class="th-fill" x="27" y="22" width="10" height="56" rx="5"/>' +
    '<path class="th-wave" d="M70 48c15-26 30 26 45 0s30 26 45 0 30 26 45 0 30 26 45 0"/>', 'art art-thermo'),
  route: () => svg('0 0 400 70',
    '<path class="art-path" d="M35 35H365"/>' +
    [35, 145, 255, 365].map((x, i) => '<g transform="translate(' + x + ' 35)"><g class="art-stop" style="--i:' + i + '"><circle r="24"/>' + [
      '<path d="M-6 9h12M-4 14h8M-9 2a10 10 0 1 1 18 0c-2 2-3 4-3 6h-12c0-2-1-4-3-6z"/>',
      '<rect x="-13" y="-10" width="26" height="20" rx="3"/><path d="M-7 -3l5 4-5 4M1 6h6"/>',
      '<path d="M-10 0a10 10 0 0 1 17-7l3 3M10 -9v5h-5M10 0a10 10 0 0 1-17 7l-3-3M-10 9v-5h5"/>',
      '<path d="M-13 11h26M-11 11v-20M-5 11v-16M1 11v-19M7 11l-4-17M11 11v-14"/>'][i] + '</g></g>').join(''), 'art art-route'),
  timeline: () => svg('0 0 760 96',
    [0, 1].map(i => '<g class="tl-block tl-teach" style="--i:' + i + '"><rect x="' + (i * 96) + '" y="20" width="84" height="56" rx="12"/><text x="' + (i * 96 + 42) + '" y="56">' + (i + 1) + '</text></g>').join('') +
    '<path class="tl-arrow" d="M196 48h40m-10-9 10 9-10 9"/>' +
    [0, 1, 2, 3, 4].map(i => '<g class="tl-block tl-support" style="--i:' + (i + 2) + '"><rect x="' + (256 + i * 101) + '" y="20" width="89" height="56" rx="12"/><text x="' + (256 + i * 101 + 44.5) + '" y="56">' + (i + 1) + '</text></g>').join(''), 'art art-timeline'),
  thought: () => svg('0 0 260 210',
    '<circle class="bubble" style="--i:0" cx="22" cy="198" r="7"/><circle class="bubble" style="--i:1" cx="46" cy="174" r="11"/>' +
    '<g transform="translate(262 0) scale(-1 1)"><path class="cloud" style="--i:2" d="M58 142c-26 0-44-18-44-40 0-20 15-36 34-39 5-24 26-41 51-41 19 0 36 10 45 25 6-3 13-5 21-5 27 0 48 21 48 47 0 2 0 4-1 6 12 6 20 18 20 32 0 20-16 35-36 35z"/></g>' +
    '<g class="cloud-ico" style="--i:3"><path class="loop" d="M96 60a36 36 0 1 1-26 12"/><path class="loop" d="M62 64l8 8 9-6"/><circle cx="96" cy="94" r="20"/><path d="M96 94V82M96 94h9"/><circle class="clock-dot" cx="96" cy="94" r="2.6"/></g>' +
    '<text class="cloud-q" x="168" y="120">?</text>', 'gadget gadget-thought')
};
const LID = '<svg class="lid" viewBox="0 0 60 24" aria-hidden="true"><defs><linearGradient id="lidg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b5cd6"/><stop offset="1" stop-color="#2b2f6b"/></linearGradient></defs><rect x="2" y="6" width="56" height="14" rx="7" fill="url(#lidg)" stroke="#161d3a" stroke-width="2"/><circle cx="8" cy="13" r="3.4" fill="#FF7A1A"/></svg>';

function highlight(root: HTMLElement, v: VisualData): void {
  (v.highlight || []).forEach(h => {
    let host = null;
    if (h.in === 'title') host = root.querySelector('.heading h1');
    else if (h.in === 'subtitle') host = root.querySelector('.heading .subtitle');
    else if (h.in === 'tagline') host = root.querySelector('.tagline');
    else if (/^card:\d+$/.test(h.in)) host = root.querySelectorAll('.card p')[Number(h.in.split(':')[1])];
    if (!host) return;
    const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    for (let candidate = walker.nextNode(); candidate; candidate = walker.nextNode()) {
      if (candidate.nodeType !== Node.TEXT_NODE) continue;
      const t = candidate as Text;
      const value = t.nodeValue; if (value === null) continue;
      const i = value.indexOf(h.text); if (i < 0) continue;
      const span = node('span', 'hl hl-' + h.tone, h.text);
      const before = value.slice(0, i); const after = value.slice(i + h.text.length);
      t.replaceWith(...(before ? [document.createTextNode(before)] : []), span, ...(after ? [document.createTextNode(after)] : [])); break;
    }
  });
}
// slides 8-13: extra layouts, all keep the slide text verbatim
function renderExtras(stage: HTMLElement, main: HTMLElement, s: Slide, v: VisualData, advanceReveal?: (step?: number) => void): RenderExtras {
  const x: RenderExtras = {aim: [], row: undefined, slot: undefined, react: undefined, steps: undefined, pointer: undefined, stampRow: undefined, aside: undefined};
  const cards = Array.from(main.querySelectorAll<HTMLElement>('.card')); const grid = main.querySelector<HTMLElement>('.cards') ?? main;
  const sourceBody = (index: number): string => s.cards?.[index]?.body ?? '';
  const sourceTitle = (index: number): string => s.cards?.[index]?.title ?? '';
  if (v.keyLine != null) {                 // 8: calm lead + key line that gets stamped
    const key = cards[v.keyLine]; if (!key) return x;
    main.classList.add('has-key'); cards.forEach((c, i) => { if (i !== v.keyLine) c.classList.add('card-lead'); });
    key.classList.add('card-key'); const row = node('div', 'key-row'); key.replaceWith(row); row.append(key);
    const stamp = node('span', 'stamp'); stamp.append(node('span', 'stamp-in', v.stamp || 'VERIFY')); key.append(stamp); x.aim.push(stamp); x.row = row;
  }
  if (v.art === 'flow' && cards.length >= 3) {                  // 9: input + context -> model -> output
    const first = cards[0]; const second = cards[1]; const third = cards[2];
    if (!first || !second || !third) return x;
    grid.classList.add('flow'); const left = node('div', 'flow-in'); left.append(first, second);
    const slot = node('div', 'flow-bot'); third.classList.add('flow-out');
    grid.replaceChildren(left, node('span', 'flow-arrow a1'), slot, node('span', 'flow-arrow a2'), third); x.slot = slot;
  }
  if (v.art === 'window') {                                    // 10: the context window fills up, noise distracts
    main.classList.add('with-window'); const win = node('div', 'ctxwin'); const box = node('div', 'ctxwin-box');
    const kinds = 'gggggggngnnn'; [...kinds].forEach((k, i) => { const t = node('span', 'tok tok-' + k); t.style.setProperty('--i', String(i)); t.style.gridRow = String(3 - Math.floor(i / 4)); t.style.gridColumn = String(i % 4 + 1); if ([5, 8].includes(i)) t.classList.add('tok-dim'); box.append(t); });
    const meter = node('div', 'ctxwin-meter'); meter.append(node('span', 'ctxwin-fill'));
    win.append(box, meter); grid.after(win);
  }
  if (v.reveal === 'click') {                                  // 12: cards open one by one, so the room answers first
    grid.classList.add('reveal-grid'); let reacted = null;
    const open = (i: number): boolean => { const c = cards[i]; if (!c || !c.classList.contains('closed')) return false; c.classList.remove('closed'); c.setAttribute('aria-hidden', 'false'); x.react?.(i); return true; };
    cards.forEach((c, i) => { c.classList.add('closed'); c.setAttribute('aria-hidden', 'true'); const cover = node('span', 'card-cover', String(i + 1)); c.append(cover); c.addEventListener('click', () => { if (open(i)) advanceReveal?.(); }); });
    const next = () => open(cards.findIndex(c => c.classList.contains('closed')));
    const ctrl = node('div', 'widget-controls reveal-controls'); const b1 = node('button', null, 'Reveal next →'); b1.addEventListener('click', () => { if (next()) advanceReveal?.(); });
    const b2 = node('button', 'secondary', 'Show all'); b2.addEventListener('click', () => { cards.forEach((c, i) => open(i)); advanceReveal?.(cards.length - 1); });
    ctrl.append(b1, b2); if (v.buttons) grid.after(ctrl); registerReveal(next); slideController.signal.addEventListener('abort', () => { revealFns.splice(revealFns.indexOf(next), 1); });
    x.slot = grid;
  }
  if (v.quiz) {                                                  // 14: vote first, then wrong answers drop out
    const quiz = v.quiz; main.classList.add('narrow'); const order = cards.map((_c, i) => i).filter(i => i !== quiz.answer); let k = 0;
    const next = () => {
      if (k < order.length) { const index = order[k]; k += 1; if (index === undefined) return false; const card = cards[index]; if (!card) return false; card.classList.add('quiz-out'); return true; }
      if (k === order.length) { k++; const answer = cards[quiz.answer]; if (!answer) return false; answer.classList.add('quiz-right'); x.pointer?.classList.add('show'); return true; }
      return false;
    };
    cards.forEach(c => c.addEventListener('click', () => { if (next()) advanceReveal?.(); })); registerReveal(next);
    slideController.signal.addEventListener('abort', () => { revealFns.splice(revealFns.indexOf(next), 1); });
  }
  if (v.spotlight != null) {               // 16: land on one card
    const card = cards[v.spotlight]; if (card) { main.classList.add('narrow', 'spot'); card.classList.add('spot-on'); }
  }
  if (v.pairs) {                                                 // 17: rows come in as pairs, one per click / →
    const cmp = main.querySelector('.compare'); const cols = s.columns || []; const leftCol = cols[0]; const rightCol = cols[1];
    if (!leftCol || !rightCol) return x;
    const g = node('div', 'pairs'); g.append(node('h2', 'pair-head', leftCol.title), node('span'), node('h2', 'pair-head', rightCol.title));
    const rows: HTMLElement[][] = []; const n = Math.max(leftCol.items.length, rightCol.items.length);
    for (let i = 0; i < n; i++) { const l = node('div', 'pair-l', leftCol.items[i] || ''), m = node('span', 'pair-link'), r = node('div', 'pair-r', rightCol.items[i] || ''); [l, m, r].forEach((e: HTMLElement) => e.classList.add('pending')); g.append(l, m, r); rows.push([l, m, r]); }
    cmp?.replaceWith(g); let k = 0;
    const next = (): boolean => { if (k >= rows.length) return false; rows[k++]?.forEach((e: HTMLElement) => e.classList.remove('pending')); return true; };
    g.addEventListener('click', () => { if (next()) advanceReveal?.(); }); registerReveal(next);
    slideController.signal.addEventListener('abort', () => { revealFns.splice(revealFns.indexOf(next), 1); });
  }
  if (v.countdown) {                                             // pauses: live countdown + real clock time
    const box = node('div', 'pause-box'); const face = node('div', 'pause-clock'); const back = node('p', 'pause-back');
    const end = Date.now() + v.countdown * 60000; const hhmm = new Date(end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    back.append(document.createTextNode('Back at '), node('strong', null, hhmm));
    const tick = () => { const left = Math.max(0, Math.round((end - Date.now()) / 1000)); face.textContent = String(Math.floor(left / 60)).padStart(2, '0') + ':' + String(left % 60).padStart(2, '0'); box.classList.toggle('late', left <= 60); box.classList.toggle('done', left === 0); };
    tick(); const iv = view?.setInterval(tick, 1000); slideController.signal.addEventListener('abort', () => view?.clearInterval(iv));
    box.append(face, back); const nextBody = sourceBody(0); if (nextBody) box.append(node('p', 'pause-next', nextBody));
    grid.replaceWith(box);
  }
  if (v.term) {                                                  // 20: a terminal that types a few commands, then asks
    main.classList.add('with-window'); const t = node('div', 'term'); const bar = node('div', 'term-bar'); bar.append(node('i'), node('i'), node('i')); t.append(bar);
    const body = node('div', 'term-body'); v.term.forEach((ln: TermLine, i: number) => { const row = node('div', 'term-line ' + (ln.c ? 'cmd' : ln.ask ? 'ask' : 'out')); row.style.setProperty('--i', String(i));
      if (ln.c) { row.append(node('span', 'prompt-sign', '$ ')); const ty = node('span', 'typed', ln.c); ty.style.setProperty('--n', String(ln.c.length)); row.append(ty); } else row.textContent = ln.o || ln.ask || ''; body.append(row); });
    t.append(body); grid.after(t);
  }
  if (v.art === 'gate') {                                        // 21: explore -> plan -> (gate) -> change
    const route = node('div', 'route'); const st = (ico: string, label: string, cls?: string): HTMLDivElement => { const d = node('div', 'station ' + (cls || '')); d.append(node('span', 'st-ico', ico), node('span', 'st-label', label)); return d; };
    const gate = node('div', 'station gate'); gate.append(node('span', 'bar'), node('span', 'st-label', v.gateLabel || 'your approval'));
    route.append(st('🔍', 'Explore', 's1'), node('span', 'rt-line l1'), st('📋', 'Plan', 's2'), node('span', 'rt-line l2'), gate, node('span', 'rt-line l3'), st('✏️', 'Change', 's4'));
    (main.querySelector('.tagline') || grid).before(route); let open = false;
    const next = () => { if (open) return false; open = true; route.classList.add('open'); return true; };
    route.addEventListener('click', () => { if (next()) advanceReveal?.(); }); registerReveal(next); slideController.signal.addEventListener('abort', () => { revealFns.splice(revealFns.indexOf(next), 1); });
  }
  if (v.art === 'prompt' && s.prompt) {                          // 22: the demo prompt, typed; B = plan B (captured output)
    const t = node('div', 'term term-wide'); const bar = node('div', 'term-bar'); bar.append(node('i'), node('i'), node('i'), node('span', 'term-title', 'claude'));
    const body = node('div', 'term-body'); const pre = node('div', 'term-prompt'); pre.append(node('span', 'prompt-sign', '> '));
    const txt = node('span', 'tp-text', s.prompt); pre.append(txt); body.append(pre); t.append(bar, body); grid.replaceWith(t);
    (v.promptMarks || []).forEach((mark: string) => { const walker = document.createTreeWalker(txt, NodeFilter.SHOW_TEXT); for (let candidate = walker.nextNode(); candidate; candidate = walker.nextNode()) { if (candidate.nodeType !== Node.TEXT_NODE) continue; const text = candidate as Text; const value = text.nodeValue; if (value === null) continue; const i = value.indexOf(mark); if (i < 0) continue; const mid = text.splitText(i); mid.splitText(mark.length); const span = node('span', 'hl hl-orange'); mid.replaceWith(span); span.append(mid); break; } });
  }
  if (v.stepKeys) {                                             // steps without buttons: → activates the next step
    const items = Array.from(main.querySelectorAll<HTMLElement>('.step-item')); const ctrl = main.querySelector<HTMLElement>('.steps-wrap .widget-controls'); if (ctrl) ctrl.style.display = 'none';
    if (v.humanStep != null) { const item = items[v.humanStep]; const circle = item?.querySelector<HTMLElement>('.step-circle'); if (item && circle) { item.classList.add('human'); circle.textContent = '👤'; } }
    const next = (): boolean => { const a = items.findIndex((li: HTMLElement) => li.classList.contains('active')); const button = items[a + 1]?.querySelector<HTMLButtonElement>('button'); if (a >= items.length - 1 || !button) return false; button.click(); return true; };
    registerReveal(next); slideController.signal.addEventListener('abort', () => { revealFns.splice(revealFns.indexOf(next), 1); });
    x.steps = items;
  }
  if (v.reach && x.steps) {                                      // 25: AetherBOT's arm telescopes to the active step
    const wrap = main.querySelector<HTMLElement>('.steps-wrap'); if (!wrap) return x; wrap.classList.add('has-reach');
    const r = node('div', 'reach'); r.setAttribute('aria-hidden', 'true');
    const body = document.createElement('img'); body.src = '/aetherbot/stretch/arm-body.webp'; body.className = 'reach-body'; body.alt = '';
    const tube = node('span', 'reach-tube'); const hand = document.createElement('img'); hand.src = '/aetherbot/stretch/arm-hand.webp'; hand.className = 'reach-hand'; hand.alt = '';
    r.append(body, tube, hand); stage.append(r);
    const H = 200, k = H / 551;
    const steps = x.steps;
    const place = () => {
      const firstCircle = steps?.[0]?.querySelector<HTMLElement>('.step-circle'); if (!firstCircle) return; const first = rel(firstCircle, stage);
      const left = first.x - 300 * k - 26, top = first.y + first.h / 2 - 22 - 280 * k;
      r.style.left = left + 'px'; r.style.top = top + 'px'; r.style.height = H + 'px';
      const a = steps?.findIndex((li: HTMLElement) => li.classList.contains('active')) ?? -1;
      const activeCircle = a >= 0 ? steps?.[a]?.querySelector<HTMLElement>('.step-circle') : undefined;
      const tipX = a < 0 || !activeCircle ? left + 300 * k + 10 : rel(activeCircle, stage).x + 14;
      const w = Math.max(0, tipX - (left + 300 * k) - 150 * k); tube.style.width = w + 'px'; hand.style.setProperty('--tube', w + 'px');
    };
    r.style.setProperty('--k', String(k)); requestAnimationFrame(() => requestAnimationFrame(place));
    const mo = new (view?.MutationObserver ?? MutationObserver)(place); steps?.forEach((li: HTMLElement) => mo.observe(li, { attributes: true, attributeFilter: ['class'] }));
    slideController.signal.addEventListener('abort', () => mo.disconnect()); view?.addEventListener('resize', place, { signal: slideController.signal });
  }
  if (v.art === 'loop' && x.steps) {                             // 26: the agent loop as a circle
    const chain = main.querySelector<HTMLElement>('.steps-chain'); if (!chain) return x; chain.classList.add('nest-hidden');
    const labels: string[] = (s.items || []).map((item) => item.label); const box = node('div', 'loop');
    const pos: ReadonlyArray<readonly [number, number]> = [[50, 4], [92, 50], [50, 96], [8, 50]];
    const ring = svg('0 0 400 400', '<defs><marker id="lp-ar" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs>' +
      [[200, 16, 384, 200], [384, 200, 200, 384], [200, 384, 16, 200], [16, 200, 200, 16]].map((p: readonly number[], i: number) => '<path class="lp-arc lp-arc' + i + '" marker-end="url(#lp-ar)" d="M' + p[0] + ' ' + p[1] + ' A184 184 0 0 1 ' + p[2] + ' ' + p[3] + '"/>').join(''), 'loop-ring');
    box.append(ring);
    labels.slice(0, 4).forEach((l: string, i: number) => { const position = pos[i]; if (!position) return; const n = node('span', 'lp-node', l); n.style.left = position[0] + '%'; n.style.top = position[1] + '%'; n.style.setProperty('--i', String(i)); box.append(n); });
    const mid = node('div', 'lp-mid'); mid.append(node('span', 'lp-mid-ico', '↻ ■'), node('span', 'lp-mid-label', labels[4] || '')); box.append(mid);
    const orb = node('div', 'lp-orbit'); const head = document.createElement('img'); head.src = BOTS.head.src; head.alt = ''; orb.append(head); box.append(orb);
    if (v.loopCaptions) box.classList.add('show-cap'); chain.after(box); const nodes: Element[] = [...box.querySelectorAll('.lp-node'), mid]; const steps = x.steps;
    const sync = () => steps?.forEach((li: HTMLElement, i: number) => nodes[i]?.classList.toggle('on', li.classList.contains('active')));
    const mo = new (view?.MutationObserver ?? MutationObserver)(sync); steps?.forEach((li: HTMLElement) => mo.observe(li, { attributes: true, attributeFilter: ['class'] }));
    nodes.forEach((n: Element, i: number) => n.addEventListener('click', () => steps?.[i]?.querySelector<HTMLButtonElement>('button')?.click()));
    slideController.signal.addEventListener('abort', () => mo.disconnect());
  }
  if (v.art === 'boxes') {                                       // 27: SDLC ⊃ working method ⊃ agent loop, zoom in per →
    const cmp = main.querySelector('.compare'); const cols = s.columns || [];
    const mk = (c: NonNullable<typeof cols[number]>, i: number): HTMLDivElement => { const b = node('div', 'nb nb' + i); const h = node('div', 'nb-head'); h.append(node('span', 'nb-title', c.title));
      const row = node('div', 'nb-items'); c.items.forEach((t: string) => { const it = node('span', 'nb-item', t); if ((v.link?.[String(i)] || []).includes(t)) it.classList.add('nb-link'); row.append(it); }); h.append(row); b.append(h); return b; };
    const col0 = cols[0]; const col1 = cols[1]; const col2 = cols[2]; if (!col0 || !col1 || !col2) return x;
    const b0 = mk(col0, 0), b1 = mk(col1, 1), b2 = mk(col2, 2); b1.append(b2); b0.append(b1); cmp?.replaceWith(b0);
    let k = 0; const steps = [() => b1.classList.add('in'), () => b2.classList.add('in'), () => b0.classList.add('linked')];
    const next = (): boolean => { if (k >= steps.length) return false; steps[k++]?.(); return true; };
    b0.addEventListener('click', () => { if (next()) advanceReveal?.(); }); registerReveal(next); slideController.signal.addEventListener('abort', () => { revealFns.splice(revealFns.indexOf(next), 1); });
  }
  if (v.stack) {                                                 // 29: the library stacks up block by block
    const stack = v.stack; grid.classList.add('stack'); cards.forEach((c, i) => { const label = stack[i]; const head = c.querySelector<HTMLElement>('.card-head'); if (label && head) head.append(node('span', 'stack-tag', label)); });
    const stackRow = node('div', 'stack-row'); x.slot = stackRow; grid.replaceWith(stackRow); stackRow.append(grid);
  }
  if (v.cmdCards) { main.classList.add('compact');               // 30: command cards look and type like a terminal
    v.cmdCards.forEach(ci => { const c = cards[ci]; if (!c) return; c.classList.add('cmd-card'); const p = c.querySelector('p'); const box = node('div', 'cmd-lines');
    sourceBody(ci).split('\n').forEach((ln, i) => { const isCmd = !/[:.]$/.test(ln.trim()) || /^https?:/.test(ln.trim()); const row = node('div', isCmd ? 'cmd-l' : 'cmd-note');
        row.style.setProperty('--d', (0.5 + ci * 0.9 + i * 0.35) + 's'); if (isCmd) row.append(node('span', 'prompt-sign', '$ '), node('span', null, ln)); else row.textContent = ln; box.append(row); });
      p?.replaceWith(box); });
  }
  if (v.browser != null) {                  // 30: a tiny browser with the starting state
    const browserCard = cards[v.browser]; if (!browserCard) return x;
    const b = node('div', 'mini-browser'); const bar = node('div', 'mb-bar'); bar.append(node('i'), node('i'), node('i'), node('span', 'mb-url', 'localhost:3000'));
    const tabs = node('div', 'mb-tabs'); ['Profiles', 'Glossary', 'Library', 'Game'].forEach((t, i) => { const d = node('div', 'mb-tab' + (i === 3 ? ' live' : '')); d.append(node('span', 'mb-name', t), node('span', 'mb-body')); tabs.append(d); });
    b.append(bar, tabs); browserCard.append(b);
  }
  if (v.lineReveal != null && cards[v.lineReveal]) {            // 32: review questions one per →
    const c = cards[v.lineReveal]; const ul = node('ol', 'q-list'); sourceBody(v.lineReveal).split('\n').forEach((t, i) => { const li = node('li', null, t); li.style.setProperty('--i', String(i)); ul.append(li); });
    c?.querySelector('p')?.replaceWith(ul);
  }
  if (v.stamps) {                                                // 32: decision stamps, click one
    const row = node('div', 'stamps'); row.append(node('span', 'stamps-label', 'Decision'));
    v.stamps.forEach((w, i) => { const wrap = node('span', 'stamp-wrap'); const b = node('button', 'stamp-btn st-' + w.toLowerCase(), w); b.style.setProperty('--i', String(i));
      b.addEventListener('click', () => { row.querySelectorAll('.stamp-btn').forEach(x => x.classList.toggle('picked', x === b)); row.classList.add('has-pick'); }); wrap.append(b); row.append(wrap); x.aim.push(wrap); });
    grid.after(row); x.stampRow = row; main.classList.add('has-stamps'); const stampBox = node('div', 'stamp-box'); row.before(stampBox); stampBox.append(row);
  }
  if (v.badge != null) {                      // 33: "Include" as an empty profile badge
    const c = cards[v.badge]; if (!c) return x; c.classList.add('badge-card'); const bd = node('div', 'badge'); const av = node('div', 'badge-av', '?'); const rows = node('div', 'badge-rows');
    sourceBody(v.badge).split('\n').forEach((t, i) => { const r = node('div', 'badge-row'); r.style.setProperty('--i', String(i)); r.append(node('span', 'badge-k', t), node('span', 'badge-line')); rows.append(r); });
    bd.append(av, rows); c.querySelector('p')?.replaceWith(bd);
  }
  if (v.swap) {                                                  // 34: two AetherBOTs swap their work
    const sw = node('div', 'swap'); sw.setAttribute('aria-hidden', 'true');
    ['sw-a', 'sw-b'].forEach(c => { const im = document.createElement('img'); im.src = BOTS.head.src; im.alt = ''; im.className = c; sw.append(im); });
    sw.append(node('span', 'pkt pkt-ab'), node('span', 'pkt pkt-ba'));
    if (x.stampRow) { x.stampRow.classList.add('with-swap'); x.stampRow.querySelector<HTMLElement>('.stamps-label')?.after(sw); } else { main.classList.add('has-swap'); grid.after(sw); }
  }
  if (v.template != null) {                // 36/37: an empty card template (term/definition, concept card)
    const c = cards[v.template]; if (!c) return x; const lines = v.templateRows || sourceBody(v.template).split('\n'); const t = node('div', 'tpl' + (lines.length > 3 ? ' tpl-grid' : ''));
    lines.forEach((l, i) => { const r = node('div', 'tpl-row'); r.style.setProperty('--i', String(i)); r.append(node('span', 'tpl-k', l), node('span', 'tpl-line'), node('span', 'tpl-line short')); t.append(r); });
    if (v.templateRows) c.append(t); else c.querySelector('p')?.replaceWith(t);
  }
  if (v.notebook != null) {                // 39: the learning note as a notebook page
    const c = cards[v.notebook]; if (!c) return x; c.classList.add('notebook'); const ul = node('ul', 'nb-lines');
    sourceBody(v.notebook).split('\n').forEach((t, i) => { const li = node('li', null, t); li.style.setProperty('--i', String(i)); ul.append(li); }); c.querySelector('p')?.replaceWith(ul);
  }
  if (v.quietTimer) {                                            // 39: a quiet countdown without "Back at"
    main.classList.add('has-quiet'); const box = node('div', 'pause-box quiet'); const face = node('div', 'pause-clock'); const end = Date.now() + v.quietTimer * 60000;
    const tick = () => { const left = Math.max(0, Math.round((end - Date.now()) / 1000)); face.textContent = String(Math.floor(left / 60)).padStart(2, '0') + ':' + String(left % 60).padStart(2, '0'); box.classList.toggle('late', left <= 30 && left > 0); box.classList.toggle('done', left === 0); };
    tick(); const iv = view?.setInterval(tick, 1000); slideController.signal.addEventListener('abort', () => view?.clearInterval(iv));
    box.append(node('span', 'quiet-ico', '✍'), face); grid.after(box);
  }
  if (v.badges) {                                               // 40: achievements unlocking one by one
    const badges = v.badges;
    grid.classList.add('badges'); main.classList.add('side-grid');
    cards.forEach((c, i) => { c.classList.add('badge-tile'); c.style.setProperty('--i', String(i)); const ic = node('span', 'badge-ico', badges[i] || '★'); c.prepend(ic); c.querySelector('p')?.remove(); });
    x.aside = main;
  }
  if (v.dayRoute) {                                              // 41: the shape of the day
    const r = node('div', 'day-route'); v.dayRoute.forEach((t, i) => { const st = node('div', 'dr-stop'); st.style.setProperty('--i', String(i)); st.append(node('span', 'dr-dot', String(i + 1)), node('span', 'dr-label', t)); r.append(st); });
    (main.querySelector('.tagline') || grid).after(r);
  }
  if (v.art === 'stairs' && x.steps) {                           // 43: levels as a staircase
    const steps = x.steps; const chain = main.querySelector<HTMLElement>('.steps-chain'); if (!chain) return x; chain.classList.add('nest-hidden'); const st = node('div', 'stairs');
    (s.items || []).forEach((it, i) => { const b = node('div', 'stair' + ((v.today || []).includes(i) ? ' today' : '')); b.style.setProperty('--i', String(i));
      const top = node('div', 'stair-top'); top.append(node('span', 'stair-n', String(i + 1)), node('span', 'stair-label', it.label)); if ((v.today || []).includes(i)) top.append(node('span', 'stair-tag', 'today'));
      b.append(top, node('span', 'stair-cap', it.caption || '')); b.addEventListener('click', () => steps[i]?.querySelector<HTMLButtonElement>('button')?.click()); st.append(b); });
    chain.after(st); const bl = Array.from(st.children).filter((element): element is HTMLElement => element instanceof HTMLElement);
    const sync = () => steps.forEach((li: HTMLElement, i: number) => bl[i]?.classList.toggle('on', li.classList.contains('active')));
    const mo = new (view?.MutationObserver ?? MutationObserver)(sync); steps.forEach((li: HTMLElement) => mo.observe(li, { attributes: true, attributeFilter: ['class'] })); slideController.signal.addEventListener('abort', () => mo.disconnect());
  }
  if (v.art === 'intake') {                                      // 44: every source of context flows into the model
    main.classList.add('intake'); grid.classList.add('intake-cards'); cards.forEach((c, i) => { c.style.setProperty('--i', String(i)); c.append(node('span', 'intake-arrow')); const tag = v.tags?.[String(i)]; const head = c.querySelector<HTMLElement>('.card-head'); if (tag && head) head.append(node('span', 'stack-tag', tag)); });
    x.aside = main;
  }
  if (v.mdfile != null) {                    // 45/46: the card's lines as a CLAUDE.md file
    const c = cards[v.mdfile]; if (!c) return x; const f = node('div', 'mdfile'); const bar = node('div', 'md-bar'); bar.append(node('i'), node('i'), node('i'), node('span', 'md-name', v.mdName || 'CLAUDE.md')); f.append(bar);
    const body = node('div', 'md-body'); sourceBody(v.mdfile).split('\n').forEach((l, i) => { const r = node('div', 'md-sec'); r.style.setProperty('--i', String(i)); r.append(node('span', 'md-h', '## ' + l), node('span', 'md-l'), node('span', 'md-l short')); body.append(r); });
    f.append(body); c.querySelector('p')?.replaceWith(f);
  }
  if (v.guides) {                                                // 45: guides vs enforces
    const g = node('div', 'ge'); v.guides.forEach((t, i) => { const b = node('div', 'ge-b ge' + i); b.append(node('span', 'ge-ico', t[0]), node('strong', null, t[1]), node('span', null, t[2])); g.append(b); if (i === 0) g.append(node('span', 'ge-vs', '≠')); });
    const tg = main.querySelector('.tagline'); (tg || grid).before(g);
  }
  if (v.repeatStack != null) {          // 49: the same list, again and again
    const c = cards[v.repeatStack]; if (!c) return x; const wrap = node('div', 'rep-hand'); c.replaceWith(wrap);
    ['card 1', 'card 2', 'card 3 …'].forEach((t, i) => { const clone = c.cloneNode(true); const k = i === 2 ? c : clone instanceof HTMLElement ? clone : undefined; if (!k) return; k.classList.add('rep-card', 'rep-c' + i); if (i < 2) k.setAttribute('aria-hidden', 'true');
      k.style.setProperty('--i', String(i)); k.append(node('span', 'rep-tag', t)); wrap.append(k); });
    main.classList.add('side-grid'); x.aside = main;
  }
  if (v.noSkill != null) {                  // 50: plain prompt, no skill
    const c = cards[v.noSkill]; if (!c) return x; const b = node('div', 'noskill'); b.append(node('span', 'ns-ico', '🧰'), node('strong', null, 'No skill yet')); c.querySelector('p')?.replaceWith(b);
  }
  if (v.diff) {                                                  // 51: two runs of the same card, not quite the same
    main.classList.add('side-grid'); const d = node('div', 'diff');
    v.diff.forEach((run, ri) => { const m = node('div', 'mini-card'); m.style.setProperty('--i', String(ri)); m.append(node('span', 'mini-title', run.title));
      run.rows.forEach(r => { const row = node('div', 'mini-row' + (r.miss ? ' miss' : '') + (r.odd ? ' odd' : '')); row.append(node('span', 'mini-k', r.k), node('span', 'mini-l')); if (r.note) row.append(node('span', 'mini-note', r.note)); m.append(row); }); d.append(m); });
    grid.after(d);
  }
  if (v.lifespan) {                                              // 53: how long each mechanism "lives"
    const lifespan = v.lifespan; cards.forEach((c, i) => { const L = lifespan[i]; if (!L) return; const box = node('div', 'life life-' + L.kind); box.append(node('span', 'life-ico', L.icon));
      const track = node('div', 'life-track'); for (let k = 0; k < 12; k++) { const t = node('span', 'life-tick'); t.style.setProperty('--k', String(k)); track.append(t); } box.append(track, node('span', 'life-label', L.label)); c.append(box); });
  }
  if (v.tree != null) {                        // 54: where the skill lives — an empty file
    const c = cards[v.tree]; if (!c) return x; const parts = sourceBody(v.tree).split('/'); const t = node('div', 'ftree');
    parts.forEach((p, i) => { const r = node('div', 'ft-row' + (i === parts.length - 1 ? ' ft-file' : '')); r.style.setProperty('--d', String(i)); r.style.setProperty('--i', String(i));
      r.append(node('span', 'ft-ico', i === parts.length - 1 ? '📄' : '📁'), node('span', 'ft-name', p + (i < parts.length - 1 ? '/' : ''))); if (i === parts.length - 1) r.append(node('span', 'ft-empty', 'empty — you write it'), node('span', 'ft-cursor')); t.append(r); });
    c.querySelector('p')?.replaceWith(t);
  }
  if (v.fence != null) {                      // 57: bounded autonomy — a bot inside a fence
    const c = cards[v.fence]; if (!c) return x; const f = node('div', 'fence'); const yard = node('div', 'yard'); const im = document.createElement('img'); im.src = BOTS.head.src; im.alt = ''; im.className = 'yard-bot'; yard.append(im); f.append(yard);
    sourceBody(v.fence).split('\n').forEach((t, i) => { const sg = node('span', 'fence-sign fs' + i, t); sg.style.setProperty('--i', String(i)); f.append(sg); });
    c.querySelector('p')?.replaceWith(f); c.classList.add('fence-card');
  }
  if (v.conveyor != null) {                // 58: terms on a belt, stamped cards come out
    const c = cards[v.conveyor]; if (!c) return x; const b = node('div', 'belt-wrap'); const belt = node('div', 'belt');
    ['term', 'term', 'term', 'term'].forEach((t, i) => { const k = node('span', 'belt-term', t); k.style.setProperty('--i', String(i)); belt.append(k); });
    const im = document.createElement('img'); im.src = BOTS.head.src; im.alt = ''; im.className = 'belt-bot';
    const out = node('div', 'belt-out'); ['READY', 'REVISE', 'OPEN'].forEach((t, i) => { const o = node('span', 'belt-card st-' + t.toLowerCase(), t); o.style.setProperty('--i', String(i)); out.append(o); });
    b.append(belt, im, out); c.querySelector('p')?.replaceWith(b);
  }
  if (v.perCard) {                                               // 60: every card gets its own decision
    main.classList.add('side-grid'); const row = node('div', 'percard');
    v.perCard.forEach((st, i) => { const m = node('div', 'pc-card'); m.style.setProperty('--i', String(i)); m.append(node('span', 'pc-t', 'card ' + (i + 1)), node('span', 'pc-l'), node('span', 'pc-l short'), node('span', 'pc-stamp st-' + st.toLowerCase(), st)); row.append(m); });
    grid.after(row);
  }
  if (v.gameFlow) {                                              // 62: one round of the game
    grid.classList.add('gameflow'); cards.forEach((c, i) => { c.style.setProperty('--i', String(i)); if (i < cards.length - 1) c.append(node('span', 'gf-arrow', '→')); });
    const back = node('div', 'gf-back'); back.append(node('span', 'gf-back-line'), node('span', 'gf-back-label', '↺ next round')); grid.after(back);
  }
  if (v.gameMock) {                                              // 63: the game screen — only feedback is missing
    main.classList.add('side-grid'); const g = node('div', 'gmock'); const bar = node('div', 'md-bar'); bar.append(node('i'), node('i'), node('i'), node('span', 'md-name', 'Game · Explain It Back')); g.append(bar);
    const b = node('div', 'gm-body'); b.append(node('span', 'gm-term', 'Context window'), node('span', 'gm-field'), node('span', 'gm-btn', 'Submit'));
    const fb = node('div', 'gm-feedback'); fb.append(node('strong', null, 'Feedback'), node('span', null, 'you build this — Assignment 9')); b.append(fb); g.append(b); grid.after(g);
  }
  if (v.phrase) {                                                // 64: the exact phrase to say
    const bub = node('div', 'phrase'); bub.append(node('span', 'phrase-who', 'You'), node('span', 'phrase-text', '“' + v.phrase + '”')); grid.after(bub);
  }
  if (v.catChips != null) {                // 65: rating categories as coloured labels
    const c = cards[v.catChips]; if (!c) return x; const w = node('div', 'cat-chips'); sourceBody(v.catChips).split('\n').forEach((t, i) => { const k = node('span', 'cat-chip cc' + i, t); k.style.setProperty('--i', String(i)); w.append(k); }); c.querySelector('p')?.replaceWith(w);
  }
  if (v.runner) {                                                // 66: test cases run one after another
    const c = cards[0]; if (!c) return x; const runner = v.runner; const list = node('div', 'runner'); sourceBody(0).split('\n').forEach((t, i) => { const r = node('div', 'run-row'); r.style.setProperty('--i', String(i));
      r.append(node('span', 'run-spin'), node('span', 'run-case', t), node('span', 'run-res rr-' + (runner[i]?.tone || 'grey'), runner[i]?.label || '')); list.append(r); });
    c.querySelector('p')?.replaceWith(list);
  }
  if (v.plugs != null) {                      // 67: MCP as one standard plug
    const c = cards[v.plugs]; if (!c) return x; const m = node('div', 'mcp'); const im = document.createElement('img'); im.src = BOTS.head.src; im.alt = ''; im.className = 'mcp-bot';
    const srv = node('div', 'mcp-srv'); srv.append(node('strong', null, 'MCP server'));
    const lines = node('div', 'mcp-plugs'); sourceBody(v.plugs).split('\n').forEach((t, i) => { const pl = node('span', 'mcp-plug', t); pl.style.setProperty('--i', String(i)); lines.append(pl); });
    m.append(im, lines, srv); c.querySelector('p')?.replaceWith(m);
  }
  if (v.zones) {                                                 // 68: local repository vs external systems
    const cmp = main.querySelector('.compare'); const cols = s.columns || []; const z = node('div', 'zones');
    const a = node('div', 'zone z-local'); a.append(node('span', 'zone-label', v.zones[0]), node('div', 'zone-icons', '📁 🔧'), node('h3', null, cols[0]?.title || ''), node('p', null, cols[0]?.items?.[0] || ''));
    const gate = node('div', 'zone-gate'); gate.append(node('span', 'gate-ico', '🔌'), node('span', null, 'MCP'));
    const b = node('div', 'zone z-ext'); const chips = node('div', 'zone-chips'); v.zones[2].forEach(t => chips.append(node('span', 'zchip', t))); b.append(node('span', 'zone-label', v.zones[1]), chips, node('h3', null, cols[1]?.title || ''), node('p', null, cols[1]?.items?.[0] || ''));
    z.append(a, gate, b); cmp?.replaceWith(z);
  }
  if (v.pending) {                                               // 69: visible placeholder for instructions still to come
    const p = node('div', 'pending-box'); p.append(node('span', 'pending-ico', '⏳'), node('strong', null, v.pending[0]), node('span', null, v.pending[1])); grid.after(p);
  }
  if (v.sourceTiles != null) {          // 70: pick one source, read-only
    const c = cards[v.sourceTiles]; if (!c) return x; const t = node('div', 'src-tiles'); const icons = ['🎫', '🦊', '📘'];
    sourceBody(v.sourceTiles).split('\n').forEach((l, i) => { const k = node('div', 'src-tile'); k.style.setProperty('--i', String(i)); k.append(node('span', 'src-ico', icons[i] || '•'), node('span', 'src-name', l), node('span', 'src-lock', '🔒 read-only')); t.append(k); });
    c.querySelector('p')?.replaceWith(t);
  }
  if (s.planB) {                              // plan B overlay on any slide (key B)
    const panel = node('div', 'planb'); const head = node('div', 'planb-head'); head.append(node('strong', null, 'Plan B'), node('span', null, ' · ' + (v.planBLabel || (v.art === 'prompt' ? 'captured run of this exact prompt' : 'captured example')) + ' · press B to close'));
    panel.append(head, node('pre', 'planb-body', s.planB)); stage.append(panel);
    planBToggle = () => { panel.classList.toggle('show'); return panel.classList.contains('show'); };
  }
  if (v.menu != null) {                        // 71: possible outputs as a menu to pick from
    const c = cards[v.menu]; if (!c) return x; const m = node('div', 'menu'); sourceBody(v.menu).split('\n').forEach((t, i) => { const b = node('button', 'menu-chip', t); b.style.setProperty('--i', String(i)); b.addEventListener('click', () => { m.querySelectorAll('.menu-chip').forEach(x => x.classList.toggle('picked', x === b)); m.classList.add('has-pick'); }); m.append(b); });
    c.querySelector('p')?.replaceWith(m);
  }
  if (v.pipes) {                                                 // 72: the same pipeline, two systems
    const cmp = main.querySelector('.compare'); const cols = s.columns || []; const g = node('div', 'pipes');
    cols.forEach((c, r) => { g.append(node('span', 'pipe-label pl' + r, c.title)); String(c.items?.[0] || '').split(/\s*→\s*/).forEach((st, k) => { const cell = node('span', 'pipe-st' + ((v.same || []).includes(k) ? ' same' : ''), st); cell.style.setProperty('--d', (r * 4 + k) * 0.18 + 's'); g.append(cell); }); });
    cmp?.replaceWith(g);
  }
  if (v.recapKeys) {                                             // 73: → reveals the next item, no buttons
    const list = main.querySelector<HTMLElement>('.recap-list'); const ctrl = main.querySelector<HTMLElement>('.widget-controls'); if (ctrl) ctrl.style.display = 'none';
    Array.from(list?.children ?? []).filter((element): element is HTMLElement => element instanceof HTMLElement).forEach((li, i) => { const check = li.querySelector<HTMLElement>('.recap-check'); if (!check) return; check.textContent = '🏆'; li.classList.remove('hidden-item'); li.classList.add('won'); li.removeAttribute('aria-hidden'); li.style.setProperty('--i', String(i)); });
    main.classList.add('side-grid'); x.aside = main;
  }
  if (v.levelUp) {                                               // 74: every item ticks, a progress bar fills
    const list = main.querySelector<HTMLElement>('.recap-list'); const ctrl = main.querySelector<HTMLElement>('.widget-controls'); if (ctrl) ctrl.style.display = 'none';
    list?.classList.add('levelup'); Array.from(list?.children ?? []).filter((element): element is HTMLElement => element instanceof HTMLElement).forEach((li, i) => { const check = li.querySelector<HTMLElement>('.recap-check'); if (!check) return; li.classList.remove('hidden-item'); li.removeAttribute('aria-hidden'); li.style.setProperty('--i', String(i)); check.textContent = '✓'; });
    const bar = node('div', 'lv-bar'); const fill = node('span', 'lv-fill'); fill.style.setProperty('--n', String(list?.children.length || 1)); bar.append(fill, node('span', 'lv-label', 'LEVEL UP')); list?.after(bar);
  }
  if (v.supportDays) main.querySelector('.art-timeline')?.classList.add('teach-done');
  if (v.doneSteps && x.steps) {                                  // 76: the first N steps are done, the next one pulses
    const doneSteps = v.doneSteps; x.steps.forEach((li, i) => { li.classList.toggle('done-step', i < doneSteps); li.classList.toggle('next-step', i === doneSteps); if (i < doneSteps) li.querySelector<HTMLElement>('.step-circle')?.replaceChildren(document.createTextNode('✓')); });
  }
  if (v.handover) {                                              // 77: AI can … people remain responsible
    const cols = main.querySelectorAll('.compare-col'); if (cols[0]) { const im = document.createElement('img'); im.src = BOTS.head.src; im.alt = ''; im.className = 'ho-bot'; cols[0].prepend(im); }
    if (cols[1]) { cols[1].classList.add('ho-people'); cols[1].prepend(node('span', 'ho-person', '👤')); }
    main.append(node('p', 'ho-line', v.handover));
  }
  if (v.sentences) {                                             // 78: five open sentences on a notebook page
    const nb = node('article', 'card notebook sentences'); const ul = node('ul', 'nb-lines');
    cards.forEach((_c, i) => { const li = node('li'); li.style.setProperty('--i', String(i)); li.append(node('span', null, sourceTitle(i)), node('span', 'blank')); ul.append(li); });
    nb.append(ul); grid.replaceWith(nb);
  }
  if (v.checklist != null) {             // 13: the checklist ticks itself off
    grid.classList.add('one-col'); const c = cards[v.checklist]; if (!c) return x; const ul = node('ul', 'checklist');
    sourceBody(v.checklist).split('\n').forEach((t, i) => { const li = node('li'); li.style.setProperty('--i', String(i)); li.append(node('span', 'check-box'), node('span', 'check-text', t)); ul.append(li); });
    if (v.addLine) { const li = node('li', 'check-add'); li.style.setProperty('--i', String(ul.children.length)); const t = node('span', 'check-text', ''); t.contentEditable = 'true'; t.dataset.placeholder = v.addLine; t.addEventListener('keydown', (event: KeyboardEvent) => event.stopPropagation()); li.append(node('span', 'check-plus', '+'), t); ul.append(li); }
    c.querySelector('p')?.replaceWith(ul);
  }
  return x;
}
// slide 7: the steps become nested rings (each term sits inside the one before it)
function buildNest(main: HTMLElement, s: Slide): NestVisual | null {
  const wrap = main.querySelector<HTMLElement>('.steps-wrap'); const chain = wrap?.querySelector<HTMLElement>('.steps-chain'); if (!wrap || !chain) return null;
  const items = Array.from(chain.querySelectorAll<HTMLElement>('.step-item')); chain.classList.add('nest-hidden');
  const five = (s.items || []).length > 4; const R: readonly number[] = five ? [238, 194, 150, 106, 64] : [230, 172, 116, 68], CX = 380, B = 470;
  const g = doc.createElementNS(SVGNS, 'svg'); g.setAttribute('viewBox', '0 0 760 480'); g.setAttribute('class', 'nest'); g.setAttribute('role', 'group');
  const labels: SVGTextElement[] = [];
  (s.items || []).forEach((it, i) => {
    const r = R[i]; if (r === undefined) return; const cy = B - r, grp = doc.createElementNS(SVGNS, 'g'); grp.setAttribute('class', 'ring'); grp.style.setProperty('--i', String(i));
    const c = doc.createElementNS(SVGNS, 'ellipse'); c.setAttribute('cx', String(CX)); c.setAttribute('cy', String(cy)); c.setAttribute('rx', String(r * 1.5)); c.setAttribute('ry', String(r));
    const t = doc.createElementNS(SVGNS, 'text'); t.setAttribute('x', String(CX)); t.setAttribute('class', 'ring-label' + (i === R.length - 1 ? ' ring-label-core' : ''));
    const inner = i === R.length - 1; const words = inner ? it.label.split(' ') : [it.label];
    const lines = inner && words.length > 2 ? [words.slice(0, -1).join(' '), words.at(-1) ?? ''] : [it.label];
    const y0 = inner ? cy - (lines.length - 1) * 11 + 6 : cy - r + (five ? 36 : 52);
    lines.forEach((ln, k) => { const ts = doc.createElementNS(SVGNS, 'tspan'); ts.setAttribute('x', String(CX)); ts.setAttribute('y', String(y0 + k * 20)); ts.textContent = ln; t.append(ts); });
    grp.append(c, t); grp.addEventListener('click', () => items[i]?.querySelector('button')?.click());
    g.append(grp); labels.push(t);
  });
  const row = node('div', 'nest-row'); row.append(g); wrap.insertBefore(row, chain);
  const rings = Array.from(g.querySelectorAll<SVGGElement>('.ring'));
  const api: NestVisual = { row, labels, onChange: null, current: () => { const a = items.map((li: HTMLElement) => li.classList.contains('active')); return a.every(Boolean) ? -1 : a.indexOf(true); } };
  const sync = () => { items.forEach((li: HTMLElement, i: number) => rings[i]?.classList.toggle('on', li.classList.contains('active'))); g.classList.toggle('any-on', items.some((li: HTMLElement) => li.classList.contains('active'))); api.onChange?.(); };
  const mo = new (view?.MutationObserver ?? MutationObserver)(sync); items.forEach(li => mo.observe(li, { attributes: true, attributeFilter: ['class'] }));
  slideController.signal.addEventListener('abort', () => mo.disconnect());
  return api;
}

const assetUrl = (src: string): string => {
  if (/^(?:[a-z]+:|\/)/i.test(src)) return src;
  return '/' + src.replace(/^\.\//, '');
};


const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string | null, text?: string | null): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag);
  if (cls) element.className = cls;
  if (text !== undefined && text !== null) element.textContent = text;
  return element;
};

/** Opening slides 1-4 + Day-2 showcase: port of SoT app.js buildOpener. */
function buildOpener(stage: HTMLElement, main: HTMLElement, s: Slide, v: VisualData): void {
  const head = stage.querySelector('.heading');
  if (v.opener === 'welcome' && head) {
    const logo = el('div', 'opener-logo');
    const img = document.createElement('img');
    img.src = assetUrl('assets/aetherlink-mark.png');
    img.alt = '';
    logo.append(img, el('span', 'opener-word', 'AETHER'), el('span', 'opener-word accent', 'LINK'));
    head.querySelector('.heading-top')?.after(logo);
  }
  if (v.opener === 'showcase' && v.image) {
    const shot = el('figure', 'showcase');
    const bar = el('div', 'showcase-bar');
    bar.append(el('span', 'dots'), el('span', 'showcase-url', v.imageLink || ''));
    const img = document.createElement('img');
    img.src = assetUrl(v.image);
    img.alt = '';
    shot.append(bar, img);
    main.classList.add('with-showcase');
    main.prepend(shot);
  }
  if (v.opener === 'team') {
    main.querySelectorAll('.card').forEach((c) => {
      const name = c.querySelector('h2,h3,strong,.card-title')?.textContent || c.textContent || '';
      const ini = name.split(' ').filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).slice(0, 2).join('');
      c.prepend(el('span', 'team-avatar', ini));
    });
  }
}

function renderVisual(stage: HTMLElement, body: HTMLElement, main: HTMLElement, s: Slide, v: VisualData | undefined, advanceReveal?: (step?: number) => void): void {
  if (!v) return;
  if (v.keynote) { stage.closest('.academy-deck')?.classList.add('keynote'); main.classList.add('keynote-main'); body.classList.add('keynote-body'); }
  if (v.art === 'timeline') main.prepend(ART.timeline());
  if (v.cardArt) { const cards = main.querySelectorAll<HTMLElement>('.card'); Object.entries(v.cardArt).forEach(([index, kind]) => { const card = cards[Number(index)]; if (card) card.append(ART[kind]()); }); }
  if (v.pillarIcons) main.querySelectorAll<HTMLElement>('.pillar').forEach((p, i) => p.prepend(svg('0 0 24 24', PILLAR_ICONS[i % 4] || '', 'pillar-icon')));
  if (v.stagger) main.classList.add('stagger-' + v.stagger);
  if (v.hero != null) { main.classList.add('has-hero'); main.querySelectorAll<HTMLElement>('.card')[v.hero]?.classList.add('card-hero'); }
  let popRow: HTMLElement | null = null, nest: NestVisual | null = null; const ex = renderExtras(stage, main, s, v, advanceReveal);
  if (v.art === 'nested') nest = buildNest(main, s);
  if (v.popOut != null) {
    const src = s.cards?.[v.popOut]; if (!src) return; main.querySelectorAll('.card')[v.popOut]?.remove();
    popRow = node('div', 'pop-row'); const col = node('div', 'pop-col'); const list = node('div', 'pop-chips');
    String(src.body).split('\n').forEach((t, i) => { const c = node('span', 'pop-chip'); const inner = node('span', 'pop-chip-in', t); inner.style.setProperty('--i', String(i)); const icon = v.chipIcons?.[i]; if (icon) inner.prepend(node('span', 'chip-ico', icon)); c.append(inner); list.append(c); });
    if (v.chipGrid) list.classList.add('grid' + v.chipGrid);
    col.append(node('p', 'pop-label', src.title), list); popRow.append(col); const tg = main.querySelector('.tagline'); if (tg) tg.before(popRow); else main.append(popRow);
  }
  highlight(stage, v);
  if (v.compact) main.classList.add('compact-cards');
  if (v.opener) buildOpener(stage, main, s, v);
  // SoT hides empty .slide-main via :empty; React may leave whitespace/comment nodes.
  if (v.opener === 'welcome' || v.opener === 'ask') {
    // CardsRenderer leaves an empty .cards shell on title-only openers; SoT main is truly empty.
    main.querySelectorAll('.cards').forEach((el) => { if (!el.childElementCount) el.remove(); });
    const meaningful = [...main.childNodes].some((n) => n.nodeType === 1 || (n.nodeType === 3 && (n.textContent?.trim() ?? '') !== ''));
    if (!meaningful) { main.replaceChildren(); main.style.display = 'none'; }
  }
  const botName = v.bot; if (!botName) return; const bot = BOTS[botName];
  const fig = node('figure', 'bot bot-' + botName + ' place-' + v.place); fig.setAttribute('aria-hidden', 'true');
  const live = node('div', 'bot-live'); const img = document.createElement('img'); img.src = bot.src; img.alt = ''; img.decoding = 'async';
  const hatch = node('span', 'hatch'); hatch.innerHTML = LID;
  if (bot.hatch) { hatch.style.left = bot.hatch[0] + '%'; hatch.style.top = bot.hatch[1] + '%'; live.append(img, hatch); } else live.append(img);
  fig.append(live);
  if (v.tool === 'thought') fig.append(ART.thought());
  if (v.place === 'left') { body.prepend(fig); body.classList.add('with-bot', 'bot-left'); }
  else if (v.place === 'beside') { body.append(fig); body.classList.add('with-bot', 'bot-beside'); }
  else if (v.place === 'under') { main.append(fig); }
  else if (v.place === 'popout' && popRow) { popRow.prepend(fig); }
  else if (v.place === 'nest' && nest) { nest.row.prepend(fig); }
  else if (v.place === 'key' && ex.row) { ex.row.prepend(fig); }
  else if (v.place === 'slot' && ex.slot) { ex.slot.append(fig); }
  else if (v.place === 'stamps' && ex.stampRow) { ex.stampRow.querySelector('.stamps-label')?.after(fig); }
  else if (v.place === 'aside' && ex.aside) { fig.classList.add('place-aside'); const tg = ex.aside.querySelector(':scope > .tagline'); if (tg) tg.before(fig); else ex.aside.append(fig); }
  else if (v.place === 'stack' && ex.slot) { fig.classList.add('place-stack'); ex.slot.append(fig); }
  else if (v.place === 'pointer') {
    const target = v.pointAt == null ? undefined : main.querySelectorAll<HTMLElement>('.card')[v.pointAt]; fig.classList.add('pointer-bot'); stage.append(fig);
    const H = v.pointH || 230; fig.style.height = H + 'px';
    const put = () => { if (!target || !bot.tip || bot.ratio === undefined) return; const t = rel(target, stage); const W = H * bot.ratio;
      const tipX = W * bot.tip[0] / 100, tipY = H * bot.tip[1] / 100;
      fig.style.left = (bot.tip[0] < 50 ? t.x + t.w - 18 - tipX : t.x + 18 - tipX) + 'px';
      fig.style.top = (t.y + t.h / 2 - tipY) + 'px'; };
    requestAnimationFrame(() => requestAnimationFrame(put)); view?.addEventListener('resize', put, { signal: slideController.signal });
    ex.pointer = fig;
    if (v.spotlight != null) { const tm = view?.setTimeout(() => fig.classList.add('show'), 1600); slideController.signal.addEventListener('abort', () => view?.clearTimeout(tm)); }
  }
  else if (v.place === 'timeline') { const tl = main.querySelector<HTMLElement>('.art-timeline'); if (tl) { const row = node('div', 'tl-row'); tl.replaceWith(row); row.append(tl, fig); } }
  const fx = doc.createElementNS(SVGNS, 'svg'); fx.setAttribute('class', 'fx'); fx.setAttribute('aria-hidden', 'true'); stage.append(fx);
  const draw = () => {
    fx.replaceChildren(); stage.querySelectorAll<HTMLElement>('.fly').forEach((f: HTMLElement) => f.remove());
    const r = stage.getBoundingClientRect(); fx.setAttribute('viewBox', '0 0 ' + r.width + ' ' + stage.scrollHeight); fx.style.height = stage.scrollHeight + 'px';
    const h = rel(hatch, stage);
    const from = { x: h.x, y: h.y };
    const target = v.target ? stage.querySelector(v.target) : null;
    if (v.tool === 'map' && target) {
      const t = rel(target, stage), to = { x: t.x + 70, y: t.y - 8 }, top = Math.min(from.y, to.y) - 110;
      const d = 'M' + from.x + ' ' + from.y + ' C' + (from.x + 30) + ' ' + top + ' ' + (to.x - 120) + ' ' + top + ' ' + to.x + ' ' + to.y;
      fx.innerHTML = '<path class="trail" pathLength="1" d="' + d + '"/><g class="map-pop" transform="translate(' + from.x + ' ' + (from.y - 36) + ')"><g class="map-inner"><path d="M-22-14 -8-18 8-12 22-16V14L8 18-8 12-22 16z"/><path class="fold" d="M-8-18V12M8-12V18"/><circle class="pin" cx="14" cy="-2" r="4"/></g></g>';
    }
    if (v.tool === 'arm' && target) {
      const t = rel(target, stage), to = { x: t.x + t.w / 2, y: t.y + t.h / 2 };
      const d = 'M' + from.x + ' ' + from.y + ' C' + (from.x - 10) + ' ' + (from.y - 150) + ' ' + (to.x + 90) + ' ' + (to.y - 170) + ' ' + to.x + ' ' + (to.y - 30);
      fx.innerHTML = '<defs><mask id="armmask" maskUnits="userSpaceOnUse"><path class="arm-reveal" pathLength="1" d="' + d + '"/></mask></defs>' +
        '<g mask="url(#armmask)"><path class="arm-tube" d="' + d + '"/><path class="arm-rings" d="' + d + '"/></g>' +
        '<g class="arm-tip" transform="translate(' + to.x + ' ' + (to.y - 30) + ')"><circle class="ripple" r="14"/><circle class="ripple r2" r="14"/><path class="claw" d="M-9 -6 -4 10M9 -6 4 10"/><circle class="knuckle" r="9"/></g>';
      target.classList.add('tapped');
    }
    if (v.tool === 'toolbox') {
      main.querySelectorAll<HTMLElement>('.pillar-icon').forEach((ic: HTMLElement, i: number) => {
        const t = rel(ic, stage); const f = node('span', 'fly'); f.style.setProperty('--i', String(i));
        f.style.left = from.x + 'px'; f.style.top = from.y + 'px';
        f.style.setProperty('--dx', (t.x + t.w / 2 - from.x) + 'px'); f.style.setProperty('--dy', (t.y + t.h / 2 - from.y) + 'px');
        f.append(svg('0 0 24 24', PILLAR_ICONS[i % 4] || '')); stage.append(f);
      });
    }
  };
  requestAnimationFrame(() => requestAnimationFrame(draw));
  img.addEventListener('load', () => requestAnimationFrame(draw), { once: true });
  view?.addEventListener('resize', draw, { signal: slideController.signal });
  if (ex.aim.length) {
    const aim = () => { const h = rel(hatch, stage); ex.aim.forEach((el: HTMLElement) => { const t = rel(el, stage); const first = el.firstElementChild; if (!(first instanceof HTMLElement)) return; first.style.setProperty('--dx', (h.x - t.x - t.w / 2) + 'px'); first.style.setProperty('--dy', (h.y - t.y - t.h / 2) + 'px'); }); };
    aim(); const tm = view?.setTimeout(aim, 1000); slideController.signal.addEventListener('abort', () => view?.clearTimeout(tm));
    view?.addEventListener('resize', aim, { signal: slideController.signal });
  }
  if (v.reveal === 'click') {
    const faces = (v.faces || []).map((face: string) => { const src = '/aetherbot/faces/aetherbot-face-' + face + '.webp'; doc.createElement('img').src = src; return src; });
    const bub = node('span', 'react'); if (!faces.length && !v.noReact) fig.append(bub);
    ex.react = (i: number): void => {
      live.classList.remove('jolt'); bub.classList.remove('show'); void live.offsetWidth; live.classList.add('jolt');
      if (faces.length) { const face = faces[i % faces.length]; if (face) img.src = face; } else if (!v.noReact) { bub.textContent = REACT[i % REACT.length] || ''; bub.classList.add('show'); }
    };
  }
  if (nest) {
    const lens = node('span', 'lens'); lens.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="26" cy="26" r="19" class="lens-glass"/><circle cx="26" cy="26" r="19" class="lens-rim"/><path d="M40 40 58 58" class="lens-handle"/><path d="M16 19a12 12 0 0 1 8-6" class="lens-shine"/></svg>';
    stage.append(lens);
    const place = () => {
      const on = nest.current();
      let x, y;
      if (on < 0) { const h = rel(hatch, stage); x = h.x + 18; y = h.y - 46; }
      else { const label = nest.labels[on]; if (!label) return; const t = rel(label, stage); x = t.x - 34; y = t.y + t.h / 2; }
      lens.style.left = x + 'px'; lens.style.top = y + 'px';
    };
    nest.onChange = place; const tm = view?.setTimeout(() => { lens.classList.add('out'); place(); }, 1100);
    slideController.signal.addEventListener('abort', () => view?.clearTimeout(tm));
    view?.addEventListener('resize', place, { signal: slideController.signal });
  }
  if (popRow) {
    // chips start inside the hatch; measured after the bot has finished peeking up
    const aim = () => { const h = rel(hatch, stage); popRow.querySelectorAll<HTMLElement>('.pop-chip').forEach((c: HTMLElement) => { const t = rel(c, stage); const inner = c.firstElementChild; if (!(inner instanceof HTMLElement)) return; inner.style.setProperty('--dx', (h.x - t.x - t.w / 2) + 'px'); inner.style.setProperty('--dy', (h.y - t.y - t.h / 2) + 'px'); }); };
    aim(); const tm = view?.setTimeout(aim, 1000); slideController.signal.addEventListener('abort', () => view?.clearTimeout(tm));
    view?.addEventListener('resize', aim, { signal: slideController.signal });
  }
}

/* ---- slide type -> colour chip, footer segment ---- */
  const advanceReveal = (step?: number): void => {
    revealCursor = step === undefined ? revealCursor + 1 : step;
    options.onRevealStepChange?.(revealCursor);
  };
  renderVisual(stage, body, main, s, visual, advanceReveal);
  if (visual?.cardImages || (visual?.compact && body.classList.contains('with-side'))) {
    const instructions = body.querySelector<HTMLElement>('.exercise-instructions');
    if (visual.compact && instructions) {
      main.querySelectorAll<HTMLElement>(':scope > .timer').forEach((el) => instructions.append(el));
    }
    if (visual.cardImages) {
      const gal = node('div', 'thumb-gallery');
      const row = node('div', 'thumb-row');
      visual.cardImages.forEach((src, i) => {
        const f = node('figure', 'thumb');
        const img = document.createElement('img');
        img.src = assetUrl(src);
        img.alt = '';
        f.style.setProperty('--i', String(i));
        const card = Array.isArray(s.cards) ? s.cards[i] : undefined;
        const caption = card && typeof card === 'object' && card && 'title' in card && typeof (card as {title: unknown}).title === 'string' ? (card as {title: string}).title : '';
        f.append(img, node('figcaption', null, caption));
        row.append(f);
      });
      gal.append(row);
      const host = instructions ?? main;
      const t = instructions?.querySelector<HTMLElement>(':scope > .timer');
      if (t) t.before(gal); else host.append(gal);
    }
  }
  staticReveal(options.revealStep ?? -1);
  renderTimer();
  const baseReveal = () => {
    suppressRevealCallback = true;
    const changed = revealFns.some((fn) => fn());
    suppressRevealCallback = false;
    if (changed) { revealCursor += 1; options.onRevealStepChange?.(revealCursor); }
    return changed;
  };
  const baseSyncRevealStep = (step: number): void => {
    staticReveal(step);
    if (main.querySelector('.step-item, .recap-item')) {
      revealCursor = step;
      return;
    }
    while (revealCursor < step) {
      const changed = revealFns.some((fn) => fn());
      if (!changed) break;
      revealCursor += 1;
    }
  };
  const baseCleanup = () => {
    controller.abort();
    stopTimer();
    rafs.forEach(cancelAnimationFrame);
    rafs.clear();
    stage.querySelectorAll('.hl').forEach((element) => element.replaceWith(...Array.from(element.childNodes)));
    stage.querySelectorAll('.fx, .fly, .planb, .reach, .lens, .bot').forEach((el) => el.remove());
    body.className = initialBodyClassName;
    main.className = initialMainClassName;
    if (heading && options.initialHeadingMarkup !== undefined) heading.innerHTML = options.initialHeadingMarkup;
  };
  const syncRevealStep = (step: number): void => baseSyncRevealStep(step);
  syncRevealStep(options.revealStep ?? -1);
  return {cleanup: baseCleanup, reveal: baseReveal, syncRevealStep, togglePlanB: planBToggle};
}

/** Stable adapter around one disposable source session. Rewinds replace that session in place. */
export function mountSourceVisuals(stage: HTMLElement, body: HTMLElement, main: HTMLElement, slide: Slide, options: SourceVisualOptions = {}): SourceVisualMount {
  let currentStep = options.revealStep ?? -1;
  let current: SourceVisualMount | null = null;
  const create = (step: number): SourceVisualMount => createSourceVisualMount(stage, body, main, slide, {
    ...options,
    revealStep: step,
    onRevealStepChange: (nextStep) => { currentStep = nextStep; options.onRevealStepChange?.(nextStep); },
  });
  current = create(currentStep);
  return {
    cleanup: () => { current?.cleanup(); current = null; },
    reveal: () => current?.reveal() ?? false,
    syncRevealStep: (step) => {
      if (!current) return;
      if (step < currentStep) {
        current.cleanup();
        currentStep = step;
        current = create(step);
      } else {
        current.syncRevealStep(step);
        currentStep = step;
      }
    },
    togglePlanB: () => current?.togglePlanB() ?? false,
  };
}
