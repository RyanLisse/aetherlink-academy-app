import {useEffect, useMemo, useState} from 'react';
import {
  AuthoringApiError,
  createDeck,
  createLesson,
  exportMarkdown,
  listLessons,
  listRevisions,
  publishSnapshot,
  reconcileDeck,
  refreshFromSlides,
  saveSnapshot,
  type Lesson,
  type Revision,
  type RevisionList,
} from './api.ts';
import './authoring.css';

type BusyAction = 'load' | 'create' | 'deck' | 'refresh' | 'snapshot' | 'reconcile' | 'publish' | 'revisions' | 'export' | null;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function revisionAuthor(revision: Revision): string {
  const author = revision.publishedBy ?? revision.createdBy;
  if (author === 'host-key') return 'Host-sleutel';
  return author ?? 'Import (geen auteur)';
}

function revisionTime(revision: Revision): string {
  return new Date(revision.publishedAt ?? revision.createdAt).toLocaleString('nl-NL', {dateStyle: 'medium', timeStyle: 'short'});
}

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
  const [courseId, setCourseId] = useState('');
  const [curriculumLessonId, setCurriculumLessonId] = useState('');
  const [revisions, setRevisions] = useState<RevisionList | null>(null);
  const [busy, setBusy] = useState<BusyAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selected = useMemo(() => lessons.find((lesson) => lesson.id === selectedId) ?? null, [lessons, selectedId]);
  const target = {courseId: courseId.trim(), curriculumLessonId: curriculumLessonId.trim()};
  const targetValid = UUID.test(target.courseId) && UUID.test(target.curriculumLessonId);

  function begin(action: Exclude<BusyAction, null>) {
    setBusy(action);
    setError(null);
    setNotice(null);
  }

  async function load() {
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
    if (!selected) return;
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

  async function loadRevisions() {
    if (!UUID.test(target.courseId)) {
      setError('Vul een geldig cursus-ID (UUID) in.');
      return;
    }
    begin('revisions');
    try {
      setRevisions(await listRevisions(passphrase, target.courseId));
    } catch (loadError) {
      setError(actionError(loadError));
    } finally {
      setBusy(null);
    }
  }

  async function publish() {
    if (!selected || !targetValid) return;
    begin('publish');
    try {
      const publication = await publishSnapshot(passphrase, selected.id, target);
      setNotice(publication.unchanged
        ? `Geen wijzigingen: revisie ${publication.version} blijft actueel.`
        : `Revisie ${publication.version} gepubliceerd (op basis van ${publication.baseVersion}). Lopende sessies blijven op hun eigen versie.`);
      setRevisions(await listRevisions(passphrase, target.courseId));
    } catch (publishError) {
      setError(actionError(publishError));
    } finally {
      setBusy(null);
    }
  }

  async function downloadMarkdown(version: number) {
    if (!UUID.test(target.curriculumLessonId) || !revisions) return;
    begin('export');
    try {
      const markdown = await exportMarkdown(passphrase, revisions.courseId, version, target.curriculumLessonId);
      const url = URL.createObjectURL(new Blob([markdown], {type: 'text/markdown'}));
      const link = document.createElement('a');
      link.href = url;
      link.download = `les-${target.curriculumLessonId}-v${version}.md`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(actionError(exportError));
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
            <p>Ingelogd als facilitator via Google? Laat de passphrase leeg. Een passphrase blijft alleen in dit tabblad in het geheugen.</p>
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
              <button type="button" onClick={() => void load()} disabled={busy !== null}>
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
              <p className="authoring-empty">Nog geen lessen geladen. Klik op Lessen laden om te beginnen.</p>
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

              <button type="submit" className="authoring-primary" disabled={busy !== null}>
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
                        disabled={busy !== null}
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <button type="button" className="authoring-primary" onClick={reconcileExistingDeck} disabled={busy !== null || !reconcileDeckId.trim()}>
                        {busy === 'reconcile' ? 'Koppelen…' : 'Bestaand deck koppelen'}
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="authoring-primary" onClick={() => void runLessonAction('deck', (id) => createDeck(passphrase, id), 'Deck aangemaakt.')} disabled={busy !== null}>
                      {busy === 'deck' ? 'Deck maken…' : 'Maak deck in Slides'}
                    </button>
                  )}
                </div>
                {selected.deck && !selected.snapshot ? (
                  <button type="button" onClick={() => void runLessonAction('snapshot', (id) => saveSnapshot(passphrase, id), 'Snapshot opgeslagen.')} disabled={busy !== null}>
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
                    <button type="button" onClick={() => void runLessonAction('snapshot', (id) => saveSnapshot(passphrase, id), 'Snapshot opgeslagen.')} disabled={busy !== null}>
                      {busy === 'snapshot' ? 'Opslaan…' : 'Snapshot opslaan'}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </section>
        </div>

        <section className="authoring-panel authoring-publish" aria-labelledby="authoring-publish-title">
          <div className="authoring-panel-heading">
            <div>
              <p className="authoring-kicker">Curriculum</p>
              <h2 id="authoring-publish-title">Publiceren en revisies</h2>
            </div>
          </div>
          <p className="authoring-publish-intro">
            Publiceer de laatste snapshot van de geselecteerde les als nieuwe, onveranderlijke revisie. Lopende sessies blijven op hun vastgezette versie.
          </p>
          <div className="authoring-publish-fields">
            <div>
              <label htmlFor="publish-course-id">Cursus-ID</label>
              <input id="publish-course-id" value={courseId} onChange={(event) => setCourseId(event.target.value)} disabled={busy !== null} autoComplete="off" spellCheck={false} />
            </div>
            <div>
              <label htmlFor="publish-lesson-id">Curriculum-les-ID</label>
              <input id="publish-lesson-id" value={curriculumLessonId} onChange={(event) => setCurriculumLessonId(event.target.value)} disabled={busy !== null} autoComplete="off" spellCheck={false} />
            </div>
          </div>
          <div className="authoring-publish-actions">
            <button type="button" className="authoring-primary" onClick={() => void publish()} disabled={busy !== null || !selected?.snapshot || !targetValid}>
              {busy === 'publish' ? 'Publiceren…' : 'Publiceer snapshot'}
            </button>
            <button type="button" onClick={() => void loadRevisions()} disabled={busy !== null || !UUID.test(target.courseId)}>
              {busy === 'revisions' ? 'Laden…' : 'Revisies laden'}
            </button>
          </div>
          {revisions ? (
            revisions.revisions.length === 0 ? (
              <p className="authoring-empty">Deze cursus heeft nog geen revisies.</p>
            ) : (
              <ol className="authoring-revisions" aria-label="Revisies">
                {[...revisions.revisions].reverse().map((revision) => (
                  <li key={revision.version} className={revision.version === revisions.currentVersion ? 'authoring-revision current' : 'authoring-revision'}>
                    <span className="authoring-revision-version">v{revision.version}</span>
                    <span className="authoring-revision-status">
                      {revision.status === 'published' ? 'Gepubliceerd' : 'Concept'}
                      {revision.version === revisions.currentVersion ? ' · actueel' : ''}
                    </span>
                    <span className="authoring-revision-author">{revisionAuthor(revision)}</span>
                    <time className="authoring-revision-time" dateTime={revision.publishedAt ?? revision.createdAt}>{revisionTime(revision)}</time>
                    <button type="button" onClick={() => void downloadMarkdown(revision.version)} disabled={busy !== null || !UUID.test(target.curriculumLessonId)}>
                      Markdown
                    </button>
                  </li>
                ))}
              </ol>
            )
          ) : null}
        </section>
      </main>
      <footer className="authoring-footer">Academy authoring · uitsluitend voor proefgebruik</footer>
    </div>
  );
}
