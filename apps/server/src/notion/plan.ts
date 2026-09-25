import type {ImportSource} from '@academy/schema';
import type {CourseAggregateDraft} from '../db/curriculum-repo.ts';
import {stableUuid} from '../importers/stableUuid.ts';
import type {NotionExport} from './export.ts';

export const importTargets = ['day.schedule', 'day.checklist', 'quiz_question'] as const;
export type ImportTarget = (typeof importTargets)[number];

export interface TargetCounts {
  readonly created: number;
  readonly unchanged: number;
  readonly skipped: number;
}

export interface ImportPlan {
  readonly aggregate: CourseAggregateDraft;
  readonly counts: Readonly<Record<ImportTarget, TargetCounts>>;
  readonly skipped: ReadonlyArray<{readonly target: ImportTarget; readonly source: ImportSource; readonly reason: string}>;
  readonly changes: number;
}

type Day = CourseAggregateDraft['days'][number];
type Quiz = CourseAggregateDraft['quizQuestions'][number];

/** Postgres jsonb reorders object keys, so equality must ignore key order. */
export const canonicalJson = (value: unknown): string =>
  JSON.stringify(value, (_key, inner: unknown) =>
    inner && typeof inner === 'object' && !Array.isArray(inner)
      ? Object.fromEntries(Object.entries(inner).sort(([a], [b]) => a.localeCompare(b)))
      : inner,
  );

export const encodeQuizSource = (source: ImportSource): string => canonicalJson(source);

const isEmpty = (value: readonly unknown[] | null | undefined) => !value || value.length === 0;

/**
 * Merge a Notion export into the latest course aggregate. Import is one-time:
 * a target that already holds different content belongs to the Academy and is
 * skipped, never overwritten, so a rerun converges on zero changes.
 */
export const planImport = (courseId: string, base: CourseAggregateDraft, notion: NotionExport): ImportPlan => {
  const days = base.days.map((day) => ({...day}));
  const quizQuestions: Quiz[] = [...base.quizQuestions];
  const counts = Object.fromEntries(importTargets.map((target) => [target, {created: 0, unchanged: 0, skipped: 0}])) as Record<ImportTarget, {created: number; unchanged: number; skipped: number}>;
  const skipped: Array<ImportPlan['skipped'][number]> = [];

  const skip = (target: ImportTarget, source: ImportSource, reason: string) => {
    counts[target].skipped += 1;
    skipped.push({target, source, reason});
  };

  const dayFor = (ordinal: number, target: ImportTarget, source: ImportSource): Day | undefined => {
    const matches = days.filter((day) => day.ordinal === ordinal);
    if (matches.length === 1) return matches[0];
    skip(target, source, matches.length === 0 ? `no day with ordinal ${ordinal} in course` : `ambiguous: ${matches.length} days with ordinal ${ordinal}`);
    return undefined;
  };

  const fill = <K extends 'schedule' | 'checklist'>(target: ImportTarget, field: K, day: Day, incoming: NonNullable<Day[K]>, source: ImportSource) => {
    const existing = day[field];
    if (incoming.length === 0) return skip(target, source, 'page has no importable entries');
    if (isEmpty(existing)) {
      day[field] = incoming;
      counts[target].created += 1;
    } else if (canonicalJson(existing) === canonicalJson(incoming)) {
      counts[target].unchanged += 1;
    } else {
      skip(target, source, `day ${day.ordinal} ${field} already holds Academy content`);
    }
  };

  for (const page of notion.schedules) {
    const day = dayFor(page.day, 'day.schedule', page.source);
    if (day) fill('day.schedule', 'schedule', day, page.entries, page.source);
  }
  for (const page of notion.checklists) {
    const day = dayFor(page.day, 'day.checklist', page.source);
    if (day) fill('day.checklist', 'checklist', day, page.items, page.source);
  }

  const seen = new Set<string>();
  for (const question of notion.quiz) {
    const day = dayFor(question.day, 'quiz_question', question.source);
    if (!day) continue;
    const dayLessons = base.lessons.filter((lesson) => lesson.dayId === day.id);
    const lesson = question.lessonSlug
      ? dayLessons.find((candidate) => candidate.slug === question.lessonSlug)
      : dayLessons.length === 1 ? dayLessons[0] : undefined;
    if (!lesson) {
      skip('quiz_question', question.source, question.lessonSlug ? `no lesson '${question.lessonSlug}' on day ${question.day}` : `day ${question.day} has ${dayLessons.length} lessons; add a Les column`);
      continue;
    }
    const id = stableUuid(`notion:${courseId}:quiz:${question.source.pageUrl}:${question.question.en}`);
    if (seen.has(id)) {
      skip('quiz_question', question.source, 'duplicate question in export');
      continue;
    }
    seen.add(id);
    const row: Quiz = {id, lessonId: lesson.id, question: question.question, options: question.options, answer: question.answer, source: encodeQuizSource(question.source)};
    const existing = quizQuestions.find((candidate) => candidate.id === id);
    if (!existing) {
      quizQuestions.push(row);
      counts.quiz_question.created += 1;
    } else if (canonicalJson(existing) === canonicalJson(row)) {
      counts.quiz_question.unchanged += 1;
    } else {
      skip('quiz_question', question.source, 'already imported; the Academy owns later edits');
    }
  }

  const changes = importTargets.reduce((sum, target) => sum + counts[target].created, 0);
  return {aggregate: {...base, days, quizQuestions}, counts, skipped, changes};
};
