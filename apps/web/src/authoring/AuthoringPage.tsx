import {useEffect, useMemo, useState} from 'react';
import {
  AuthoringApiError,
  createDeck,
  createLesson,
  listLessons,
  reconcileDeck,
  refreshFromSlides,
  saveSnapshot,
  type Lesson,
} from './api.ts';
import './authoring.css';

type BusyAction = 'load' | 'create' | 'deck' | 'refresh' | 'snapshot' | 'reconcile' | null;

function actionError(error: unknown): string {
  if (error instanceof AuthoringApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Er ging iets mis. Probeer het opnieuw.';
}

function replaceLesson(lessons: readonly Lesson[], next: Lesson): readonly Lesson[] {
  const index = lessons.findIndex((lesson) => lesson.id === next.id);
  if (index < 0) return [...lessons, next];
  return lessons.map((lesson) => (lesson.id === next.id ? next : lesson));
}

export function AuthoringPage() {
  useEffect(() => {
    const previousLanguage = document.documentElement.lang;
    document.documentElement.lang = 'nl';
    return () => {
      document.documentElement.lang = previousLanguage;
    };
  }, []);

  const [passphrase, setPassphrase] = useState('');
  const [lessons, setLessons] = useState<readonly Lesson[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [outlineText, setOutlineText] = useState('');
  const [reconcileDeckId, setReconcileDeckId] = useState('');
  const [busy, setBusy] = useState<BusyAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selected = useMemo(() => lessons.find((lesson) => lesson.id === selectedId) ?? null, [lessons, selectedId]);
  const ready = passphrase.trim().length > 0;

  function begin(action: Exclude<BusyAction, null>) {
    setBusy(action);
    setError(null);
    setNotice(null);
  }

  async function load() {
    if (!ready) {
      setError('Vul eerst de project-passphrase in.');
      return;
    }
    begin('load');
    try {
      const next = await listLessons(passphrase);
      setLessons(next);
      setSelectedId(next[0]?.id ?? null);
      setNotice(`${next.length} ${next.length === 1 ? 'les' : 'lessen'} geladen.`);
    } catch (loadError) {
      setError(actionError(loadError));
    } finally {
      setBusy(null);
    }
  }

  async function submitLesson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready) {
      setError('Vul eerst de project-passphrase in.');
      return;
    }
    const cleanTitle = title.trim();
    const cleanObjective = objective.trim();
    const outline = outlineText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!cleanTitle || !cleanObjective || outline.length === 0) {
      setError('Vul titel, doel en minstens één outline-regel in.');
      return;
    }
    begin('create');
    try {
      const lesson = await createLesson(passphrase, {title: cleanTitle, objective: cleanObjective, outline});
      setLessons((current) => replaceLesson(current, lesson));
      setSelectedId(lesson.id);
      setTitle('');
      setObjective('');
      setOutlineText('');
      setNotice('Les aangemaakt.');
    } catch (createError) {
      setError(actionError(createError));
    } finally {
      setBusy(null);
    }
  }

  async function runLessonAction(action: Exclude<BusyAction, null>, operation: (lessonId: string) => Promise<Lesson>, success: string) {
    if (!selected || !ready) return;
    begin(action);
    try {
      const lesson = await operation(selected.id);
      setLessons((current) => replaceLesson(current, lesson));
      setNotice(success);
    } catch (operationError) {
      setError(actionError(operationError));
      if (action === 'deck') {
        try {
          setLessons(await listLessons(passphrase));
        } catch {
          // Preserve the original create error when the recovery read also fails.
        }
      }
    } finally {
      setBusy(null);
    }
  }

  function reconcileExistingDeck() {
    const deckId = reconcileDeckId.trim();
    if (!deckId) {
      setError('Vul eerst het bestaande deck-ID in.');
      return;
    }
    void runLessonAction('reconcile', (id) => reconcileDeck(passphrase, id, deckId), 'Bestaand deck gekoppeld.');
  }

  return (
    <div className="authoring-page">
      <header className="authoring-header">
        <div>
          <p className="authoring-kicker">AetherLink Academy</p>
          <h1>Les-auteur</h1>
          <p className="authoring-intro">Maak een les, open de echte BuilderIO Slides-editor en lees een snapshot terug.</p>
        </div>
        <span className="authoring-environment">Proefomgeving</span>
      </header>

      <main className="authoring-main">
        <section className="authoring-access" aria-labelledby="authoring-access-title">
          <div>
            <h2 id="authoring-access-title">Toegang</h2>
            <p>De passphrase blijft alleen in dit tabblad in het geheugen.</p>
          </div>
          <div className="authoring-access-form">
            <label htmlFor="authoring-passphrase">Project-passphrase</label>
            <div className="authoring-access-controls">
              <input
                id="authoring-passphrase"
                type="password"
                value={passphrase}
                onChange={(event) => setPassphrase(event.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              <button type="button" onClick={() => void load()} disabled={busy !== null || !ready}>
                {busy === 'load' ? 'Laden…' : 'Lessen laden'}
              </button>
            </div>
          </div>
        </section>

        <div className="authoring-feedback" aria-live="polite">
          {error ? <p className="authoring-error" role="alert">{error}</p> : null}
          {notice ? <p className="authoring-notice" role="status">{notice}</p> : null}
        </div>

        <div className="authoring-grid">
          <section className="authoring-panel authoring-lessons" aria-labelledby="authoring-lessons-title">
            <div className="authoring-panel-heading">
              <div>
                <p className="authoring-kicker">Bibliotheek</p>
                <h2 id="authoring-lessons-title">Lessen</h2>
              </div>
              <span className="authoring-count">{lessons.length}</span>
            </div>
            {lessons.length === 0 ? (
              <p className="authoring-empty">Nog geen lessen geladen. Gebruik je passphrase om te beginnen.</p>
            ) : (
              <ul className="authoring-lesson-list">
                {lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <button
                      type="button"
                      className={lesson.id === selectedId ? 'authoring-lesson selected' : 'authoring-lesson'}
                      aria-pressed={lesson.id === selectedId}
                      onClick={() => setSelectedId(lesson.id)}
                      disabled={busy !== null}
                    >
                      <strong>{lesson.title}</strong>
                      <span>{lesson.outline.length} {lesson.outline.length === 1 ? 'onderdeel' : 'onderdelen'}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="authoring-panel authoring-create" aria-labelledby="authoring-create-title">
            <p className="authoring-kicker">Nieuw</p>
            <h2 id="authoring-create-title">Les maken</h2>
            <form onSubmit={(event) => void submitLesson(event)}>
              <label htmlFor="lesson-title">Titel</label>
              <input id="lesson-title" value={title} onChange={(event) => setTitle(event.target.value)} disabled={busy !== null} />

              <label htmlFor="lesson-objective">Leerdoel</label>
              <textarea id="lesson-objective" rows={3} value={objective} onChange={(event) => setObjective(event.target.value)} disabled={busy !== null} />

              <label htmlFor="lesson-outline">Outline <span>(één regel per onderdeel)</span></label>
              <textarea id="lesson-outline" rows={6} value={outlineText} onChange={(event) => setOutlineText(event.target.value)} disabled={busy !== null} />

              <button type="submit" className="authoring-primary" disabled={busy !== null || !ready}>
                {busy === 'create' ? 'Aanmaken…' : 'Les aanmaken'}
              </button>
            </form>
          </section>

          <section className="authoring-panel authoring-detail" aria-labelledby="authoring-detail-title">
            <p className="authoring-kicker">Slides-koppeling</p>
            <h2 id="authoring-detail-title">{selected?.title ?? 'Selecteer een les'}</h2>
            {!selected ? (
              <p className="authoring-empty">Kies een les uit de bibliotheek om een deck te maken.</p>
            ) : (
              <>
                <p className="authoring-objective">{selected.objective}</p>
                <div className="authoring-outline" aria-label="Lesoutline">
                  <h3>Outline</h3>
                  <ol>
                    {selected.outline.map((line, index) => <li key={`${selected.id}-${index}`}>{line}</li>)}
                  </ol>
                </div>
                <div className="authoring-actions">
                  {selected.deck ? (
                    <>
                      <div className="authoring-deck-meta">
                        <span>Deck</span>
                        <strong>{selected.deck.title}</strong>
                        <small>{selected.deck.slideCount} slides · revisie {String(selected.deck.revision).slice(0, 12)}</small>
                      </div>
                      <a className="authoring-primary authoring-link" href={selected.deck.url} target="_blank" rel="noreferrer">
                        Open in Slides <span aria-hidden="true">↗</span>
                      </a>
                      <button type="button" onClick={() => void runLessonAction('refresh', (id) => refreshFromSlides(passphrase, id), 'Readback uit Slides opgehaald.')} disabled={busy !== null}>
                        {busy === 'refresh' ? 'Verversen…' : 'Ververs vanuit Slides'}
                      </button>
                    </>
                  ) : selected.deckCreation ? (
                    <div>
                      <div className="authoring-deck-meta">
                        <span>Deckaanmaak</span>
                        <strong>{selected.deckCreation.status === 'uncertain' ? 'Resultaat onbekend' : 'Nog bezig'}</strong>
                        <small>Zoek het deck in Slides en koppel het met het deck-ID.</small>
                      </div>
                      <label htmlFor="reconcile-deck-id">Bestaand deck-ID</label>
                      <input
                        id="reconcile-deck-id"
                        value={reconcileDeckId}
                        onChange={(event) => setReconcileDeckId(event.target.value)}
                        disabled={busy !== null || !ready}
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <button type="button" className="authoring-primary" onClick={reconcileExistingDeck} disabled={busy !== null || !ready || !reconcileDeckId.trim()}>
                        {busy === 'reconcile' ? 'Koppelen…' : 'Bestaand deck koppelen'}
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="authoring-primary" onClick={() => void runLessonAction('deck', (id) => createDeck(passphrase, id), 'Deck aangemaakt.')} disabled={busy !== null || !ready}>
                      {busy === 'deck' ? 'Deck maken…' : 'Maak deck in Slides'}
                    </button>
                  )}
                </div>
                {selected.deck && !selected.snapshot ? (
                  <button type="button" onClick={() => void runLessonAction('snapshot', (id) => saveSnapshot(passphrase, id), 'Snapshot opgeslagen.')} disabled={busy !== null || !ready}>
                    {busy === 'snapshot' ? 'Opslaan…' : 'Snapshot opslaan'}
                  </button>
                ) : null}
                {selected.snapshot ? (
                  <div className="authoring-snapshot" aria-live="polite">
                    <div>
                      <p className="authoring-kicker">Opgeslagen snapshot</p>
                      <h3>{selected.snapshot.title}</h3>
                      <dl>
                        <div><dt>Slides</dt><dd>{selected.snapshot.slideCount}</dd></div>
                        <div><dt>Revisie</dt><dd title={String(selected.snapshot.revision)}>{String(selected.snapshot.revision).slice(0, 12)}</dd></div>
                        <div><dt>Opgehaald</dt><dd>{new Date(selected.snapshot.capturedAt).toLocaleString('nl-NL')}</dd></div>
                      </dl>
                    </div>
                    <button type="button" onClick={() => void runLessonAction('snapshot', (id) => saveSnapshot(passphrase, id), 'Snapshot opgeslagen.')} disabled={busy !== null || !ready}>
                      {busy === 'snapshot' ? 'Opslaan…' : 'Snapshot opslaan'}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </section>
        </div>
      </main>
      <footer className="authoring-footer">Academy authoring · uitsluitend voor proefgebruik</footer>
    </div>
  );
}
