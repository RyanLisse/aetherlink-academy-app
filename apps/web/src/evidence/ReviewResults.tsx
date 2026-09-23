import type {EvidenceSubmissionView} from './types.ts';

export interface ReviewResultsProps {
  readonly assignmentId: string | null;
  readonly submissions: ReadonlyArray<EvidenceSubmissionView>;
}

/** Review layout consumer — shows submitted results for the current assignment (live-sync payload). */
export function ReviewResults({assignmentId, submissions}: ReviewResultsProps) {
  return (
    <section className="review-results" data-layout="review" data-assignment-id={assignmentId ?? ''}>
      <h3>Review submissions{assignmentId ? ` · ${assignmentId}` : ''}</h3>
      {submissions.length === 0 ? (
        <p className="note">No submissions yet.</p>
      ) : (
        <ul>
          {submissions.map((s) => (
            <li key={s.id} data-status={s.status}>
              <strong>{s.name}</strong>: {s.finding} <em>({s.status})</em>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
