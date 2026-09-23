import {useCallback, useState} from 'react';

export interface PractisedToggleProps {
  readonly targetKind: 'lesson' | 'assignment';
  readonly targetId: string;
  readonly initiallyPractised?: boolean;
  readonly onChange?: (practised: boolean) => void | Promise<void>;
}

/** R8: participant marks lesson/assignment practised and can undo. */
export function PractisedToggle({
  targetKind,
  targetId,
  initiallyPractised = false,
  onChange,
}: PractisedToggleProps) {
  const [practised, setPractised] = useState(initiallyPractised);
  const toggle = useCallback(async () => {
    const next = !practised;
    setPractised(next);
    await onChange?.(next);
  }, [practised, onChange]);

  return (
    <button
      type="button"
      className="practised-toggle"
      data-practised={practised}
      data-target-kind={targetKind}
      data-target-id={targetId}
      aria-pressed={practised}
      onClick={() => void toggle()}
    >
      {practised ? 'Practised (undo)' : 'Mark practised'}
    </button>
  );
}
