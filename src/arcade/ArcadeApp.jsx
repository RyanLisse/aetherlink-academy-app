import {useMemo, useState, useEffect} from 'react';
import {ArrowLeft, ArrowRight, ExternalLink, CheckCircle2, BookOpen, FlaskConical, Play} from 'lucide-react';
import {LanguageToggle} from '../i18n';
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

function soloPlayerSrc(lessonId) {
  const q = new URLSearchParams({lesson: lessonId, embed: '1', mode: 'cohort'});
  return `${SOLO_PLAYER_BASE}?${q.toString()}`;
}

export function ArcadeApp({themeButton}) {
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
          <strong>Agent Arcade</strong>
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
          <h1>Arcade — onbekende route</h1>
          <p className="muted">Geen les voor <code>{pathname}</code>.</p>
          <button type="button" className="gradient" onClick={() => navigate('/arcade')}>
            Terug naar hub <ArrowLeft size={16} />
          </button>
        </section>
      )}
      <p className="arcade-footnote muted">Day 1–5 packs blijven bereikbaar via de normale Academy-kamer · Linear {manifestJson.linearEpic}</p>
    </div>
  );
}

function SoloLessonCards({lessons, navigate, title}) {
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
            <span className="arcade-solo-card-title">{s.title}</span>
            <code className="arcade-solo-id">{s.id}</code>
            {s.demoOnly ? <span className="arcade-pending-pill">demo only</span> : null}
            {s.optional ? <span className="muted">optional</span> : null}
            <span className="arcade-solo-cta"><Play size={14} /> Start solo</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ArcadeHub({navigate}) {
  const lessons = [...(manifestJson.lessons || [])].sort((a, b) => a.order - b.order);
  const cohortSolo = (manifestJson.soloLessons || []).filter((s) => s.cohort);
  const demoSolo = (manifestJson.soloLessons || []).filter((s) => s.demoOnly);
  return (
    <section className="arcade-panel arcade-hub">
      <p className="cyan">{manifestJson.linearEpic || 'AET-65'} · Agent Arcade</p>
      <h1>{manifestJson.title}</h1>
      <p className="lede">Scrimba-achtige guided lesson: coach + playground + dual captions. Solo lab = timeline player in Academy chrome (play + captions + checkpoints).</p>
      <div className="arcade-start-solo">
        <button type="button" className="gradient arcade-start-solo-btn" onClick={() => navigate(START_SOLO_HREF)}>
          <Play size={18} /> Start solo
        </button>
        <p className="muted">Opens <code>{START_SOLO_HREF}</code> · default <code>{DEFAULT_SOLO_LESSON_ID}</code></p>
      </div>
      <div className="arcade-lesson-grid">
        {lessons.map((lesson) => (
          <article key={lesson.id} className="arcade-card">
            <p className="cyan">{lesson.track === 'eve' ? 'Track A · Eve' : 'Track B · SDK'} · ~{lesson.durationMin} min · {lesson.linear}</p>
            <h2>{lesson.title}</h2>
            {startersArePending(lesson.startersStatus) && (
              <p className="arcade-pending-pill">Starters: PENDING ({lesson.startersStatus})</p>
            )}
            {startersAreAvailable(lesson.startersStatus) && (
              <p className="arcade-ready-pill">Starters: available ({(lesson.starters || []).map((s) => s.id).join(', ') || 'ready'})</p>
            )}
            <ul className="arcade-checkpoint-list">
              {(lesson.checkpoints || []).slice(0, 4).map((id) => (
                <li key={id}><CheckCircle2 size={14} /> {id}</li>
              ))}
            </ul>
            <button type="button" className="gradient" onClick={() => navigate(lesson.route)}>
              Open les <ArrowRight size={16} />
            </button>
            <SoloLessonCards
              lessons={soloLessonsForRoute(manifestJson, lesson.route).filter((s) => s.cohort || s.optional)}
              navigate={navigate}
              title="Solo lessons"
            />
          </article>
        ))}
      </div>
      <SoloLessonCards lessons={cohortSolo} navigate={navigate} title="All cohort solo lessons" />
      <SoloLessonCards lessons={demoSolo} navigate={navigate} title="Demo only (not cohort path)" />
      <div className="arcade-hub-links">
        <a href="/" onClick={(e) => { e.preventDefault(); location.href = '/'; }}>← Day packs / kamer</a>
        <button type="button" className="text-button" onClick={() => navigate('/arcade/facilitator')}>
          <BookOpen size={16} /> Facilitator notes
        </button>
      </div>
    </section>
  );
}

function SoloShell({navigate, search}) {
  const rawLesson = useMemo(() => {
    try {
      return new URLSearchParams(search || window.location.search).get('lesson');
    } catch {
      return readLessonQuery();
    }
  }, [search]);
  const resolved = useMemo(() => resolveSoloLessonId(rawLesson, SOLO_IDS), [rawLesson]);
  const [caption, setCaption] = useState('mensentaal');
  const meta = (manifestJson.soloLessons || []).find((s) => s.id === resolved.id);

  useEffect(() => {
    // Prefer query; alt window hook if iframe cannot forward (document for facilitators).
    window.__AETHERLAB_LESSON_ID__ = resolved.id;
    return () => {
      try { delete window.__AETHERLAB_LESSON_ID__; } catch { /* ignore */ }
    };
  }, [resolved.id]);

  const banner =
    resolved.reason === 'missing'
      ? `Default lesson · ${resolved.id}`
      : resolved.reason === 'unknown'
        ? `Unknown lesson · loaded ${resolved.id}`
        : null;

  return (
    <section className="arcade-panel arcade-solo" data-solo-lesson={resolved.id}>
      <div className="arcade-lesson-nav">
        <button type="button" className="text-button" onClick={() => navigate('/arcade')}>
          <ArrowLeft size={16} /> Hub
        </button>
        <p className="cyan">AET-66 · solo · {resolved.id}</p>
      </div>
      <h1>{meta?.title || 'Arcade solo'}</h1>
      <div className="arcade-facilitator-strip" role="note">
        <strong>Facilitator</strong>
        <pre className="arcade-facilitator-strip-body">{facilitatorSoloNote}</pre>
      </div>
      {banner && (
        <div className="arcade-soft-banner" role="status">
          {banner}
        </div>
      )}
      <div className="arcade-caption-toggle" role="group" aria-label="Caption mode">
        <button type="button" className={caption === 'mensentaal' ? 'active' : ''} onClick={() => setCaption('mensentaal')}>Mensentaal</button>
        <button type="button" className={caption === 'tech' ? 'active' : ''} onClick={() => setCaption('tech')}>Tech</button>
      </div>
      <p className="muted arcade-caption-hint">
        Shell caption mode: <strong>{caption === 'tech' ? 'Tech' : 'Mensentaal'}</strong>. Timeline captions follow lesson <code>say</code> ops in the player (cohort = play + checkpoints).
      </p>
      <div className="arcade-solo-frame-wrap">
        <iframe
          key={resolved.id}
          className="arcade-solo-frame"
          title={`Solo lab · ${resolved.id}`}
          src={soloPlayerSrc(resolved.id)}
          allow="autoplay"
        />
      </div>
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
          <ArrowLeft size={16} /> Hub
        </button>
        <p className="cyan">{lesson.linear} · {lesson.track}</p>
      </div>
      <h1>{parsed.title || lesson.title}</h1>
      <SoloLessonCards lessons={soloForLesson} navigate={navigate} title="Start solo for this track" />
      {pending && (
        <div className="arcade-pending" role="status">
          <strong>PENDING — SDK starters</strong>
          <p>Starters nog niet klaar ({lesson.startersStatus}). Geen nep-repos. Hands-on SDK labs wachten op Herdr <strong>AET-63</strong>. Mapping + watch/skip blijven geldig.</p>
        </div>
      )}
      {available && <StartersReadyPanel lesson={lesson} />}
      <div className="arcade-caption-toggle" role="group" aria-label="Caption mode">
        <button type="button" className={caption === 'mensentaal' ? 'active' : ''} onClick={() => setCaption('mensentaal')}>Mensentaal</button>
        <button type="button" className={caption === 'tech' ? 'active' : ''} onClick={() => setCaption('tech')}>Tech</button>
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
            <p className="cyan">Coach · {caption === 'tech' ? 'Tech' : 'Mensentaal'}</p>
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
  return (
    <section className="arcade-panel">
      <button type="button" className="text-button" onClick={() => navigate('/arcade')}>
        <ArrowLeft size={16} /> Hub
      </button>
      <h1>Facilitator notes</h1>
      <pre className="arcade-notes">{facilitatorNotes}</pre>
      <h2>Solo lab</h2>
      <pre className="arcade-notes">{facilitatorSoloNote}</pre>
    </section>
  );
}
