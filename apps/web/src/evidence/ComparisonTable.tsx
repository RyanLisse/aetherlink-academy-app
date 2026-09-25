import {COMPARISON_CRITERIA, CRITERION_LABELS, type ComparisonCriterion, type FacilitatorRowView} from './types.ts';

export interface ComparisonTableProps {
  readonly day: number;
  readonly rows: ReadonlyArray<FacilitatorRowView>;
  readonly editable?: boolean;
  readonly onScoreChange?: (
    participantId: string,
    criterion: ComparisonCriterion,
    value: number | null,
  ) => void;
}

/** Six-criteria comparison table — facilitator manual scores only (days 3–4). */
export function ComparisonTable({day, rows, editable = false, onScoreChange}: ComparisonTableProps) {
  return (
    <div className="comparison-table" data-day={day}>
      <h3>Comparison · day {day}</h3>
      <table>
        <thead>
          <tr>
            <th scope="col">Participant</th>
            {COMPARISON_CRITERIA.map((c) => (
              <th key={c} scope="col">
                {CRITERION_LABELS[c]}
              </th>
            ))}
            <th scope="col">Practised</th>
            <th scope="col">Hints</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.participantId} data-participant={row.participantId}>
              <th scope="row">{row.name}</th>
              {COMPARISON_CRITERIA.map((c) => (
                <td key={c}>
                  {editable ? (
                    <input
                      type="number"
                      min={0}
                      max={5}
                      value={row.comparison[c] ?? ''}
                      aria-label={`${row.name} ${CRITERION_LABELS[c]}`}
                      onChange={(e) => {
                        const raw = e.target.value;
                        onScoreChange?.(row.participantId, c, raw === '' ? null : Number(raw));
                      }}
                    />
                  ) : (
                    (row.comparison[c] ?? '—')
                  )}
                </td>
              ))}
              <td>{row.practised.some((p) => p.practised) ? 'yes' : 'no'}</td>
              <td>{row.hintsOpened.join(',') || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="note">Manual facilitator scores only — no automatic grading. Answers/scores from self-check never appear here.</p>
    </div>
  );
}
