import {Effect} from 'effect';
import {EvidenceStore} from './evidence-store.ts';
import {ProgressStore} from './progress-store.ts';
import {
  COMPARISON_CRITERIA,
  type DebriefJson,
  type ProgressMember,
} from './types.ts';

const NOTE =
  'Dit overzicht toont vastgelegd bewijs en oefenstatus, geen certificering, ranglijst, antwoorden of scores.';

/** AE3 / R8: strip any accidental answer/score keys from plain objects. */
export const assertNoAnswerOrScoreKeys = (value: unknown, path = '$'): void => {
  if (value == null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((item, i) => assertNoAnswerOrScoreKeys(item, `${path}[${i}]`));
    return;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const lower = key.toLowerCase();
    if (lower === 'answer' || lower === 'answers' || lower === 'score' || lower === 'quizscore') {
      throw new Error(`Debrief must not contain key "${key}" at ${path}`);
    }
    assertNoAnswerOrScoreKeys(child, `${path}.${key}`);
  }
};

export const exportDebriefJson = (
  roomId: string,
  roomName: string,
  members: ReadonlyArray<ProgressMember>,
  days: ReadonlyArray<number> = [1, 2, 3, 4, 5],
): Effect.Effect<DebriefJson, never, EvidenceStore | ProgressStore> =>
  Effect.gen(function* () {
    const evidence = yield* EvidenceStore;
    const progress = yield* ProgressStore;
    const dayRows = [];
    for (const day of days) {
      const handoffs = yield* evidence.listHandoffs(roomId, day);
      const memberRows = [];
      for (const member of members) {
        const dayProgress = yield* progress.dayProgress(roomId, member.id, day);
        const comparison =
          day === 3 || day === 4
            ? ((yield* progress.getComparisonScores(roomId, day, member.id))?.scores ?? null)
            : null;
        memberRows.push({
          participantId: member.id,
          name: member.name,
          progress: dayProgress,
          comparison,
        });
      }
      dayRows.push({day, members: memberRows, handoffs: [...handoffs]});
    }
    const payload: DebriefJson = {
      roomId,
      roomName,
      exportedAt: new Date().toISOString(),
      note: NOTE,
      days: dayRows,
    };
    assertNoAnswerOrScoreKeys(payload);
    return payload;
  });

export const exportDebriefCsv = (
  roomId: string,
  roomName: string,
  members: ReadonlyArray<ProgressMember>,
  days: ReadonlyArray<number> = [1, 2, 3, 4, 5],
): Effect.Effect<string, never, EvidenceStore | ProgressStore> =>
  Effect.gen(function* () {
    const json = yield* exportDebriefJson(roomId, roomName, members, days);
    const header = [
      'day',
      'participantId',
      'name',
      'evidenceCount',
      'reviewedCount',
      'acceptedCount',
      'practised',
      'hasHandoff',
      'route',
      ...COMPARISON_CRITERIA,
    ];
    const lines = [header.join(',')];
    for (const day of json.days) {
      for (const m of day.members) {
        const row = [
          String(day.day),
          csvEscape(m.participantId),
          csvEscape(m.name),
          String(m.progress.evidenceCount),
          String(m.progress.reviewedCount),
          String(m.progress.acceptedCount),
          m.progress.practised ? '1' : '0',
          m.progress.hasHandoff ? '1' : '0',
          csvEscape(m.progress.route ?? ''),
          ...COMPARISON_CRITERIA.map((c) => {
            const v = m.comparison?.[c];
            return v == null ? '' : String(v);
          }),
        ];
        lines.push(row.join(','));
      }
    }
    const csv = lines.join('\n');
    // Header must not include answer/score columns.
    if (/\b(answer|answers|score|quizScore)\b/i.test(header.join(','))) {
      throw new Error('CSV header leaked answer/score columns');
    }
    return csv;
  });

/** Markdown export mirroring legacy exportDebrief (no quiz/route labels that encode scores). */
export const exportDebriefMarkdown = (
  roomId: string,
  roomName: string,
  members: ReadonlyArray<ProgressMember>,
  days: ReadonlyArray<number> = [1, 2, 3, 4, 5],
): Effect.Effect<string, never, EvidenceStore | ProgressStore> =>
  Effect.gen(function* () {
    const evidence = yield* EvidenceStore;
    const progress = yield* ProgressStore;
    const lines = ['# Squad-overdracht', roomName, '', NOTE];
    for (const day of days) {
      lines.push('', `## Supportdag ${day}`);
      for (const member of members) {
        const p = yield* progress.dayProgress(roomId, member.id, day);
        lines.push(
          '',
          `### ${member.name}`,
          `Bewijs: ${p.evidenceCount}; beoordeeld: ${p.reviewedCount}; geaccepteerd: ${p.acceptedCount}; geoefend: ${p.practised ? 'ja' : 'nee'}.`,
        );
        if (p.reflection) {
          lines.push('Reflectie:', p.reflection.learned, 'Volgende oefening:', p.reflection.next);
        }
      }
      for (const handoff of yield* evidence.listHandoffs(roomId, day)) {
        lines.push(
          '',
          'Besluit:',
          handoff.decision,
          'Gecontroleerd:',
          handoff.checked,
          'Open:',
          handoff.open,
          'Volgende eigenaar:',
          handoff.next,
        );
      }
    }
    const md = lines.join('\n');
    if (/\b(quizScore|answer|answers)\b/i.test(md)) {
      throw new Error('Markdown debrief leaked answer/score text');
    }
    return md;
  });

const csvEscape = (value: string): string => {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
};
