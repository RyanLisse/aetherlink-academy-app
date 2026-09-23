import type {DeckSlide} from '@academy/deck';

const text = (value: unknown): string => (typeof value === 'string' ? value : '');
const steps = (slide: DeckSlide): ReadonlyArray<string> =>
  Array.isArray(slide.steps) ? (slide.steps as ReadonlyArray<string>) : [];

/** Follow-mode assignment card below the slide (goal / steps / expected / checkpoint / timer / prompt). */
export function AssignmentCard({
  slide,
  timerRemaining,
}: {
  readonly slide: DeckSlide;
  readonly timerRemaining: number | null;
}) {
  const fmt = (seconds: number): string =>
    `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return (
    <aside className="live-assignment" data-testid="assignment-card">
      <h2>Opdracht</h2>
      <p data-testid="assignment-goal">
        <strong>Doel:</strong> {text(slide.subtitle) || text(slide.title)}
      </p>
      {steps(slide).length > 0 && (
        <ol data-testid="assignment-steps">
          {steps(slide).map((step) => (
            <li key={step}>
              <label>
                <input type="checkbox" /> {step}
              </label>
            </li>
          ))}
        </ol>
      )}
      {slide.expected && (
        <p data-testid="assignment-expected">
          <strong>Verwacht:</strong> {text(slide.expected)}
        </p>
      )}
      {slide.check && (
        <p data-testid="assignment-checkpoint">
          <strong>Checkpoint:</strong> {text(slide.check)}
        </p>
      )}
      {timerRemaining != null && (
        <p data-testid="assignment-timer">
          Timer: {fmt(timerRemaining)}
        </p>
      )}
      {slide.prompt && (
        <p>
          <button
            type="button"
            data-testid="copy-prompt"
            onClick={() => void navigator.clipboard?.writeText(text(slide.prompt))}
          >
            Copy prompt
          </button>
        </p>
      )}
    </aside>
  );
}
