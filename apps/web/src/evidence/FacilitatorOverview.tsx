import {useMemo, useState} from 'react';
import {ComparisonTable} from './ComparisonTable.tsx';
import {ReviewResults} from './ReviewResults.tsx';
import type {ComparisonCriterion, FacilitatorRowView} from './types.ts';

const DEMO: ReadonlyArray<FacilitatorRowView> = [
  {
    participantId: 'p1',
    name: 'Sam',
    practised: [{targetKind: 'lesson', targetId: 'lesson-d3', practised: true}],
    evidence: [
      {
        id: 'e1',
        participantId: 'p1',
        name: 'Sam',
        finding: 'Caught 2 seeded fraud cases',
        status: 'pending',
        at: '2026-09-23T09:00:00.000Z',
      },
    ],
    comparison: {fraudFound: 2, falsePositives: 1, explanation: 3, simplicity: 2, efficiency: 2, creativity: 1},
    hintsOpened: [0, 1],
  },
  {
    participantId: 'p2',
    name: 'Alex',
    practised: [{targetKind: 'lesson', targetId: 'lesson-d3', practised: false}],
    evidence: [],
    comparison: {},
    hintsOpened: [],
  },
];

/** Facilitator overview: submissions + six-column comparison (no self-check answers/scores). */
export function FacilitatorOverview({initialRows = DEMO}: {readonly initialRows?: ReadonlyArray<FacilitatorRowView>}) {
  const [rows, setRows] = useState(initialRows);
  const day = 3;
  const submissions = useMemo(
    () => rows.flatMap((r) => r.evidence),
    [rows],
  );

  return (
    <section className="facilitator-overview" aria-label="Facilitator evidence overview">
      <h2>Evidence & comparison</h2>
      <ReviewResults submissions={submissions} assignmentId="assign-fraud" />
      <ComparisonTable
        day={day}
        rows={rows}
        editable
        onScoreChange={(participantId, criterion: ComparisonCriterion, value) => {
          setRows((prev) =>
            prev.map((r) =>
              r.participantId === participantId
                ? {...r, comparison: {...r.comparison, [criterion]: value}}
                : r,
            ),
          );
        }}
      />
    </section>
  );
}
