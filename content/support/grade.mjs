import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import fixtures from './support-messages.json' with { type: 'json' };
import { PRIORITIES } from '../triage/grade.mjs';

export const SUPPORT_FIXTURES = fixtures;
export const SUPPORT_IDS = Object.freeze(fixtures.tickets.map(({ ticket }) => ticket.ticket_id));
const ticketById = new Map(fixtures.tickets.map(({ ticket, expected_priority }) => [
  ticket.ticket_id,
  { ticket, expected_priority },
]));

export const PARTICIPANT_SUPPORT_FIXTURES = {
  id: fixtures.id,
  tickets: fixtures.tickets.map(({ ticket }) => ({ ticket })),
  ungraded: fixtures.ungraded,
};

const normalize = (label) => (typeof label === 'string' ? label.trim().toLowerCase() : null);

export function gradeSupport(actualByTicketId, ids) {
  const rows = ids.map((ticketId) => {
    const expected = ticketById.get(ticketId)?.expected_priority;

    if (!expected || fixtures.ungraded.includes(ticketId)) {
      throw new Error(`No expected priority for ${ticketId}`);
    }

    const actual = normalize(actualByTicketId?.[ticketId]);
    const known = PRIORITIES.includes(actual);
    return { ticketId, expected, actual: known ? actual : null, match: known && actual === expected };
  });
  const matched = rows.filter((row) => row.match).length;

  return { fixtureSet: fixtures.id, rows, matched, total: rows.length, pass: matched === rows.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const labelsFile = process.argv[2];

  if (!labelsFile) {
    console.error('usage: node content/support/grade.mjs <labels.json>');
    process.exit(2);
  }

  const labels = JSON.parse(readFileSync(labelsFile, 'utf8'));
  const graded = gradeSupport(labels, SUPPORT_IDS.slice(0, 6));
  console.log(`${graded.matched}/${graded.total} labels match. ${graded.pass ? 'PASS' : 'REVISE'}`);
  process.exit(graded.pass ? 0 : 1);
}
