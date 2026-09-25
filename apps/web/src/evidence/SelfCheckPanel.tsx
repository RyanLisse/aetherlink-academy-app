import {useCallback, useState} from 'react';
import type {SelfCheckQuestionView} from './types.ts';
import {PractisedToggle} from './PractisedToggle.tsx';

export interface SelfCheckPanelProps {
  readonly lessonId: string;
  readonly questions: ReadonlyArray<SelfCheckQuestionView>;
  readonly onAnswer?: (answers: ReadonlyArray<number>) => Promise<{
    readonly attempt: number;
    readonly explanations: ReadonlyArray<string>;
    readonly note: string;
  }>;
  readonly onMarkPractised?: (practised: boolean) => void | Promise<void>;
}

/** R7/KTD7: private self-check — explanations + unlimited retries; no grade gate in UI. */
export function SelfCheckPanel({lessonId, questions, onAnswer, onMarkPractised}: SelfCheckPanelProps) {
  const [answers, setAnswers] = useState<number[]>(() => questions.map(() => -1));
  const [explanations, setExplanations] = useState<ReadonlyArray<string> | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = useCallback(async () => {
    if (answers.some((a) => a < 0)) return;
    setBusy(true);
    try {
      const result = await onAnswer?.(answers);
      if (result) {
        setAttempt(result.attempt);
        setExplanations(result.explanations);
        setNote(result.note);
      }
    } finally {
      setBusy(false);
    }
  }, [answers, onAnswer]);

  return (
    <section className="self-check-panel" data-lesson-id={lessonId} aria-label="Private self-check">
      <p className="eyebrow">Private self-check · no grade · unlimited retries</p>
      <ol>
        {questions.map((q, qi) => (
          <li key={qi}>
            <p>{q.prompt}</p>
            <div role="radiogroup" aria-label={`Question ${qi + 1}`}>
              {q.options.map((opt, oi) => (
                <label key={oi}>
                  <input
                    type="radio"
                    name={`q-${qi}`}
                    checked={answers[qi] === oi}
                    onChange={() =>
                      setAnswers((prev) => {
                        const next = [...prev];
                        next[qi] = oi;
                        return next;
                      })
                    }
                  />
                  {opt}
                </label>
              ))}
            </div>
            {explanations?.[qi] ? <p className="explanation">{explanations[qi]}</p> : null}
          </li>
        ))}
      </ol>
      <button type="button" disabled={busy || answers.some((a) => a < 0)} onClick={() => void submit()}>
        Check answers{attempt > 0 ? ` (attempt ${attempt})` : ''}
      </button>
      {note ? <p className="note" role="status">{note}</p> : null}
      <PractisedToggle
        targetKind="lesson"
        targetId={lessonId}
        {...(onMarkPractised ? {onChange: onMarkPractised} : {})}
      />
    </section>
  );
}
