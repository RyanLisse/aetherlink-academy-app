import {useMemo, useState, useEffect} from 'react';
import {ArrowLeft, ArrowRight, ExternalLink, CheckCircle2, BookOpen, FlaskConical} from 'lucide-react';
import {LanguageToggle} from '../i18n';
import {parseLessonMarkdown, matchArcadeRoute, isArcadePath} from './parse.mjs';
import manifestJson from '../../content/arcade/arcade-manifest.json';
import weatherMd from '../../content/arcade/l1-weather.md?raw';
import councilMd from '../../content/arcade/l2-council.md?raw';
import sdkBridgeMd from '../../content/arcade/sdk-bridge.md?raw';
import facilitatorNotes from '../../content/arcade/facilitator-notes.md?raw';
import './arcade.css';

const LESSON_MARKDOWN = {
  'l1-weather': weatherMd,
  'l2-council': councilMd,
  'sdk-bridge': sdkBridgeMd,
};

export {isArcadePath, matchArcadeRoute, parseLessonMarkdown};

function startersArePending(status) {
  return Boolean(status && String(status).toUpperCase().includes('PENDING'));
}

function startersAreAvailable(status) {
  return Boolean(status && String(status).toLowerCase() === 'available');
}

export function ArcadeApp({themeButton}) {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  useEffect(() => {
    const onPop = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const navigate = (path) => {
    if (path === pathname) return;
    history.pushState(null, '', path);
    setPathname(path);
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

function ArcadeHub({navigate}) {
  const lessons = [...(manifestJson.lessons || [])].sort((a, b) => a.order - b.order);
  return (
    <section className="arcade-panel arcade-hub">
      <p className="cyan">{manifestJson.linearEpic || 'AET-58'} · Agent Arcade</p>
      <h1>{manifestJson.title}</h1>
      <p className="lede">Scrimba-achtige guided lesson: coach + playground + dual captions. Thin slice — deep-link playground, geen hosted embed.</p>
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
          </article>
        ))}
      </div>
      <div className="arcade-hub-links">
        <a href="/" onClick={(e) => { e.preventDefault(); location.href = '/'; }}>← Day packs / kamer</a>
        <button type="button" className="text-button" onClick={() => navigate('/arcade/facilitator')}>
          <BookOpen size={16} /> Facilitator notes
        </button>
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

  return (
    <section className="arcade-panel arcade-lesson">
      <div className="arcade-lesson-nav">
        <button type="button" className="text-button" onClick={() => navigate('/arcade')}>
          <ArrowLeft size={16} /> Hub
        </button>
        <p className="cyan">{lesson.linear} · {lesson.track}</p>
      </div>
      <h1>{parsed.title || lesson.title}</h1>
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
    </section>
  );
}
