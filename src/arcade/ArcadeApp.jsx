import {useMemo, useState, useEffect} from 'react';
import {ArrowLeft, ArrowRight, ExternalLink, CheckCircle2, BookOpen, FlaskConical, Play} from 'lucide-react';
import {LanguageToggle, useT} from '../i18n';
import {
  parseLessonMarkdown,
  matchArcadeRoute,
  isArcadePath,
  resolveSoloLessonId,
  soloLessonsForRoute,
  DEFAULT_SOLO_LESSON_ID,
} from './parse.mjs';
import manifestJson from '../../content/arcade/arcade-manifest.json';
import weatherMd from '../../content/arcade/l1-weather.md?raw';
import councilMd from '../../content/arcade/l2-council.md?raw';
import sdkBridgeMd from '../../content/arcade/sdk-bridge.md?raw';
import facilitatorNotes from '../../content/arcade/facilitator-notes.md?raw';
import facilitatorSoloNote from '../../content/arcade/facilitator-solo-note.md?raw';
import './arcade.css';

const LESSON_MARKDOWN = {
  'l1-weather': weatherMd,
  'l2-council': councilMd,
  'sdk-bridge': sdkBridgeMd,
};

const SOLO_IDS = (manifestJson.soloLessons || []).map((s) => s.id);
const SOLO_PLAYER_BASE = manifestJson.soloPlayerBase || '/arcade-lab/';
const START_SOLO_HREF = `/arcade/solo?lesson=${DEFAULT_SOLO_LESSON_ID}`;
const WALKTHROUGH_SRC = '/academy-assets/arcade-walkthrough-en.mp4';

const CARD_COPY_KEY = {
  'l1-weather': 'weather',
  'l2-council': 'council',
  'sdk-bridge': 'sdk',
};

export {isArcadePath, matchArcadeRoute, parseLessonMarkdown, resolveSoloLessonId, soloLessonsForRoute, DEFAULT_SOLO_LESSON_ID};

function startersArePending(status) {
  return Boolean(status && String(status).toUpperCase().includes('PENDING'));
}

function startersAreAvailable(status) {
  return Boolean(status && String(status).toLowerCase() === 'available');
}

function readLessonQuery() {
  try {
    return new URLSearchParams(window.location.search).get('lesson');
  } catch {
    return null;
  }
}

function readRoleQuery(search) {
  try {
    return new URLSearchParams(search || window.location.search).get('role');
  } catch {
    return null;
  }
}

function soloPlayerSrc(lessonId) {
  const q = new URLSearchParams({lesson: lessonId, embed: '1', mode: 'cohort'});
  return `${SOLO_PLAYER_BASE}?${q.toString()}`;
}

function friendlySoloTitle(t, lessonId, metaTitle) {
  const keyed = t(`arcade.solo.title.${lessonId}`);
  if (keyed && keyed !== `arcade.solo.title.${lessonId}`) return keyed;
  return metaTitle || 'Arcade solo';
}

export function ArcadeApp({themeButton}) {
  const t = useT();
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [search, setSearch] = useState(() => window.location.search);
  useEffect(() => {
    const onPop = () => {
      setPathname(window.location.pathname);
      setSearch(window.location.search);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const navigate = (path) => {
    const nextPath = path.split('?')[0];
    const nextSearch = path.includes('?') ? `?${path.split('?')[1]}` : '';
    if (nextPath === pathname && nextSearch === search) return;
    history.pushState(null, '', path);
    setPathname(nextPath);
    setSearch(nextSearch);
  };
  const route = matchArcadeRoute(manifestJson, pathname);
  return (
    <div className="arcade-shell" data-arcade="true">
      <header className="arcade-topbar">
        <div className="arcade-brand">
          <a href="/" className="arcade-home-link" onClick={(e) => { e.preventDefault(); location.href = '/'; }}>AetherLink Academy</a>
          <span className="arcade-sep">/</span>
          <strong>{t('arcade.hero.title')}</strong>
        </div>
        <div className="arcade-top-actions">
          <LanguageToggle />
          {themeButton}
        </div>
      </header>
      {route.kind === 'hub' && <ArcadeHub navigate={navigate} />}
      {route.kind === 'solo' && <SoloShell navigate={navigate} search={search} />}
      {route.kind === 'lesson' && (
        <LessonPlayer
          lesson={route.lesson}
          markdown={LESSON_MARKDOWN[route.lesson.id] || ''}
          navigate={navigate}
        />
      )}
      {route.kind === 'facilitator' && <FacilitatorNotes navigate={navigate} />}
      {route.kind === 'unknown' && (
        <section className="arcade-panel">
          <h1>{t('arcade.unknown')}</h1>
          <p className="muted"><code>{pathname}</code></p>
          <button type="button" className="gradient" onClick={() => navigate('/arcade')}>
            {t('arcade.unknown.back')} <ArrowLeft size={16} />
          </button>
        </section>
      )}
      <p className="arcade-footnote muted">{t('arcade.footnote')}</p>
    </div>
  );
}

function SoloLessonCards({lessons, navigate, title}) {
  const t = useT();
  if (!lessons.length) return null;
  return (
    <div className="arcade-solo-block">
      {title ? <p className="cyan">{title}</p> : null}
      <div className="arcade-solo-grid">
        {lessons.map((s) => (
          <button
            key={s.id}
            type="button"
            className="arcade-solo-card"
            onClick={() => navigate(`/arcade/solo?lesson=${encodeURIComponent(s.id)}`)}
          >
            <span className="arcade-solo-card-title">{friendlySoloTitle(t, s.id, s.title)}</span>
            {s.demoOnly ? <span className="arcade-pending-pill">demo only</span> : null}
            {s.optional ? <span className="muted">optional</span> : null}
            <span className="arcade-solo-cta"><Play size={14} /> {t('arcade.cta.startSolo')}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function WalkthroughModal({open, onClose}) {
  const t = useT();
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="arcade-watch-backdrop" role="presentation" onClick={onClose}>
      <div
        className="arcade-watch-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t('arcade.watch.title')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="arcade-watch-header">
          <strong>{t('arcade.watch.title')}</strong>
          <button type="button" className="text-button" onClick={onClose}>{t('arcade.watch.close')}</button>
        </div>
        <video
          className="arcade-watch-video"
          controls
          playsInline
          preload="metadata"
          src={WALKTHROUGH_SRC}
        >
          <a href={WALKTHROUGH_SRC} target="_blank" rel="noreferrer">{t('arcade.watch.openTab')}</a>
        </video>
        <p className="muted arcade-watch-fallback">
          <a href={WALKTHROUGH_SRC} target="_blank" rel="noreferrer">{t('arcade.watch.openTab')}</a>
        </p>
      </div>
    </div>
  );
}

function ArcadeHub({navigate}) {
  const t = useT();
  const [watchOpen, setWatchOpen] = useState(false);
  const [expanded, setExpanded] = useState(() => ({}));
  const lessons = [...(manifestJson.lessons || [])].sort((a, b) => a.order - b.order);
  return (
    <section className="arcade-panel arcade-hub">
      <h1>{t('arcade.hero.title')}</h1>
      <p className="lede">{t('arcade.hero.lede')}</p>
      <div className="arcade-start-solo">
        <button type="button" className="gradient arcade-start-solo-btn" onClick={() => navigate(START_SOLO_HREF)}>
          <Play size={18} /> {t('arcade.cta.startSolo')}
        </button>
        <button
          type="button"
          className="arcade-watch-cta"
          onClick={() => setWatchOpen(true)}
        >
          {t('arcade.cta.watch')}
        </button>
      </div>
      <WalkthroughModal open={watchOpen} onClose={() => setWatchOpen(false)} />
      <div className="arcade-lesson-grid">
        {lessons.map((lesson) => {
          const copyKey = CARD_COPY_KEY[lesson.id] || 'weather';
          const open = Boolean(expanded[lesson.id]);
          return (
            <article key={lesson.id} className="arcade-card">
              <h2>{t(`arcade.card.${copyKey}.title`)}</h2>
              <p className="arcade-card-outcome">{t(`arcade.card.${copyKey}.outcome`)}</p>
              <button
                type="button"
                className="text-button arcade-expand-btn"
                aria-expanded={open}
                onClick={() => setExpanded((prev) => ({...prev, [lesson.id]: !prev[lesson.id]}))}
              >
                {t('arcade.expand')}
              </button>
              {open && (
                <ul className="arcade-checkpoint-list">
                  {(lesson.checkpoints || []).slice(0, 6).map((id) => (
                    <li key={id}><CheckCircle2 size={14} /> {id}</li>
                  ))}
                </ul>
              )}
              <button type="button" className="gradient" onClick={() => navigate(lesson.route)}>
                {t('arcade.cta.openLesson')} <ArrowRight size={16} />
              </button>
            </article>
          );
        })}
      </div>
      <div className="arcade-hub-links">
        <a href="/" onClick={(e) => { e.preventDefault(); location.href = '/'; }}>← {t('arcade.hub.dayPacks')}</a>
        <button type="button" className="text-button" onClick={() => navigate('/arcade/facilitator')}>
          <BookOpen size={16} /> {t('arcade.hub.facilitatorNotes')}
        </button>
      </div>
    </section>
  );
}

function SoloShell({navigate, search}) {
  const t = useT();
  const rawLesson = useMemo(() => {
    try {
      return new URLSearchParams(search || window.location.search).get('lesson');
    } catch {
      return readLessonQuery();
    }
  }, [search]);
  const role = useMemo(() => readRoleQuery(search), [search]);
  const facilitatorForced = role === 'facilitator';
  const resolved = useMemo(() => resolveSoloLessonId(rawLesson, SOLO_IDS), [rawLesson]);
  const [caption, setCaption] = useState('mensentaal');
  const meta = (manifestJson.soloLessons || []).find((s) => s.id === resolved.id);
  const title = friendlySoloTitle(t, resolved.id, meta?.title);

  useEffect(() => {
    window.__AETHERLAB_LESSON_ID__ = resolved.id;
    return () => {
      try { delete window.__AETHERLAB_LESSON_ID__; } catch { /* ignore */ }
    };
  }, [resolved.id]);

  const banner =
    resolved.reason === 'missing'
      ? t('arcade.soft.default')
      : resolved.reason === 'unknown'
        ? t('arcade.soft.unknown')
        : null;

  const facilitatorBody = (
    <div className="arcade-facilitator-strip" role="note">
      <strong>{t('arcade.facilitator')}</strong>
      <pre className="arcade-facilitator-strip-body">{facilitatorSoloNote}</pre>
    </div>
  );

  return (
    <section className="arcade-panel arcade-solo" data-solo-lesson={resolved.id}>
      <div className="arcade-lesson-nav">
        <button type="button" className="text-button" onClick={() => navigate('/arcade')}>
          <ArrowLeft size={16} /> {t('arcade.backHub')}
        </button>
        <div className="arcade-caption-toggle arcade-caption-toolbar" role="group" aria-label="Caption mode">
          <button type="button" className={caption === 'mensentaal' ? 'active' : ''} onClick={() => setCaption('mensentaal')}>{t('arcade.caption.plain')}</button>
          <button type="button" className={caption === 'tech' ? 'active' : ''} onClick={() => setCaption('tech')}>{t('arcade.caption.tech')}</button>
        </div>
      </div>
      <div className="arcade-solo-headline">
        <h1>{title}</h1>
        <a className="gradient arcade-play-affordance" href="#arcade-solo-player">
          <Play size={16} /> {t('arcade.play')}
        </a>
      </div>
      {banner && (
        <div className="arcade-soft-banner" role="status">
          {banner}
        </div>
      )}
      <div id="arcade-solo-player" className="arcade-solo-frame-wrap">
        <iframe
          key={resolved.id}
          className="arcade-solo-frame"
          title={title}
          src={soloPlayerSrc(resolved.id)}
          allow="autoplay"
        />
      </div>
      {facilitatorForced ? facilitatorBody : (
        <details className="arcade-facilitator-disclosure">
          <summary>{t('arcade.facilitator')}</summary>
          {facilitatorBody}
        </details>
      )}
    </section>
  );
}

function StartersReadyPanel({lesson}) {
  const starters = lesson.starters || [];
  return (
    <div className="arcade-ready" role="status" data-starters-status="available">
      <strong>SDK starters ready</strong>
      <p>Herdr <strong>AET-63</strong> kits available. Clone, <code>pnpm i</code>, run tests without an API key, then set <code>ANTHROPIC_API_KEY</code> in env only for the live SDK path.</p>
      <ul className="arcade-starter-list">
        {starters.map((s) => (
          <li key={s.id}>
            <code>{s.id}</code>
            {' — '}
            <a href={s.repoUrl || s.cloneUrl} target="_blank" rel="noreferrer">
              open repo <ExternalLink size={14} />
            </a>
            {s.quest ? <span className="muted"> · quest {s.quest}</span> : null}
            {s.cloneUrl ? (
              <pre className="arcade-clone">git clone {s.cloneUrl}</pre>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LessonPlayer({lesson, markdown, navigate}) {
  const t = useT();
  const parsed = useMemo(() => parseLessonMarkdown(markdown), [markdown]);
  const [caption, setCaption] = useState('mensentaal');
  const [stepIndex, setStepIndex] = useState(0);
  const step = parsed.steps[stepIndex] || null;
  const pending = startersArePending(lesson.startersStatus);
  const available = startersAreAvailable(lesson.startersStatus);
  const coachText = step ? (caption === 'tech' ? step.coach.tech : step.coach.mensentaal) : '';
  const soloForLesson = soloLessonsForRoute(manifestJson, lesson.route);

  return (
    <section className="arcade-panel arcade-lesson">
      <div className="arcade-lesson-nav">
        <button type="button" className="text-button" onClick={() => navigate('/arcade')}>
          <ArrowLeft size={16} /> {t('arcade.backHub')}
        </button>
      </div>
      <h1>{parsed.title || lesson.title}</h1>
      <SoloLessonCards lessons={soloForLesson} navigate={navigate} title={t('arcade.cta.startSolo')} />
      {pending && (
        <div className="arcade-pending" role="status">
          <strong>PENDING — SDK starters</strong>
          <p>Starters nog niet klaar ({lesson.startersStatus}). Geen nep-repos. Hands-on SDK labs wachten op Herdr <strong>AET-63</strong>. Mapping + watch/skip blijven geldig.</p>
        </div>
      )}
      {available && <StartersReadyPanel lesson={lesson} />}
      <div className="arcade-caption-toggle" role="group" aria-label="Caption mode">
        <button type="button" className={caption === 'mensentaal' ? 'active' : ''} onClick={() => setCaption('mensentaal')}>{t('arcade.caption.plain')}</button>
        <button type="button" className={caption === 'tech' ? 'active' : ''} onClick={() => setCaption('tech')}>{t('arcade.caption.tech')}</button>
      </div>
      <div className="arcade-stepper">
        {parsed.steps.map((s, i) => (
          <button
            key={s.heading + i}
            type="button"
            className={i === stepIndex ? 'active' : ''}
            onClick={() => setStepIndex(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>
      {step && (
        <div className="arcade-split">
          <article className="arcade-coach">
            <p className="cyan">Coach · {caption === 'tech' ? t('arcade.caption.tech') : t('arcade.caption.plain')}</p>
            <h2>{step.heading}</h2>
            <p>{coachText || '—'}</p>
            {step.checkpoint && (
              <div className="arcade-checkpoint">
                <p className="cyan">Checkpoint</p>
                <code>{step.checkpoint}</code>
                {step.expected && <p className="arcade-expected"><strong>Expected:</strong> {step.expected}</p>}
              </div>
            )}
          </article>
          <article className="arcade-playground">
            <p className="cyan"><FlaskConical size={14} /> Playground</p>
            <h3>Deep-link + run local</h3>
            {lesson.sourceUrl && (
              <p>
                <a href={lesson.sourceUrl} target="_blank" rel="noreferrer">
                  Open source <ExternalLink size={14} />
                </a>
              </p>
            )}
            <pre className="arcade-playground-body">{step.playground || 'Geen run voor deze stap — zie coach.'}</pre>
            <p className="muted">v1: geen hosted iframe. Clone/open de sourceUrl en volg de run-local instructies.</p>
          </article>
        </div>
      )}
      <div className="arcade-step-actions">
        <button type="button" disabled={stepIndex === 0} onClick={() => setStepIndex((n) => Math.max(0, n - 1))}>Vorige</button>
        <button
          type="button"
          className="gradient"
          disabled={stepIndex >= parsed.steps.length - 1}
          onClick={() => setStepIndex((n) => Math.min(parsed.steps.length - 1, n + 1))}
        >
          Volgende <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}

function FacilitatorNotes({navigate}) {
  const t = useT();
  return (
    <section className="arcade-panel">
      <button type="button" className="text-button" onClick={() => navigate('/arcade')}>
        <ArrowLeft size={16} /> {t('arcade.backHub')}
      </button>
      <h1>{t('arcade.hub.facilitatorNotes')}</h1>
      <pre className="arcade-notes">{facilitatorNotes}</pre>
      <h2>Solo lab</h2>
      <pre className="arcade-notes">{facilitatorSoloNote}</pre>
    </section>
  );
}
