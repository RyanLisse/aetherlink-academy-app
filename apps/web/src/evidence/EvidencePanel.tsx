import {SelfCheckPanel} from './SelfCheckPanel.tsx';
import {PractisedToggle} from './PractisedToggle.tsx';

const DEMO_QUESTIONS = [
  {
    prompt: 'What proves a deterministic run?',
    options: ['README only', 'Input, output and error path recorded', 'A production claim'],
  },
  {
    prompt: 'What is required before acceptance?',
    options: ['Auto-accept', 'Human gate', 'XP points'],
  },
  {
    prompt: 'What must you not claim without a run?',
    options: ['OPEN status', 'An executed AI run', 'A mock'],
  },
];

/** Learner evidence surface: private self-check + practised toggle. */
export function EvidencePanel() {
  return (
    <section className="evidence-panel" aria-label="Evidence and progress">
      <SelfCheckPanel
        lessonId="lesson-demo"
        questions={DEMO_QUESTIONS}
        onAnswer={async (answers) => ({
          attempt: 1,
          explanations: DEMO_QUESTIONS.map((q, i) =>
            answers[i] === 1 ? `OK: ${q.prompt}` : `Retry freely: ${q.prompt}`,
          ),
          note: 'Private self-check — no grade, threshold or progression gate. Unlimited retries.',
        })}
      />
      <PractisedToggle targetKind="assignment" targetId="assign-demo" />
    </section>
  );
}
