/**
 * Runtime lesson_release rows in schema `academy_runtime`.
 * Keys by stable lesson id — publishing a new course_version never touches these rows.
 */
import {bigint, integer, pgSchema, primaryKey, text} from 'drizzle-orm/pg-core';
import type {ReleaseState} from './types.ts';

export const runtime = pgSchema('academy_runtime');

export const lessonReleases = runtime.table(
  'lesson_release',
  {
    squadId: text('squad_id').notNull(),
    lessonId: text('lesson_id').notNull(),
    state: text('state').$type<ReleaseState>().notNull(),
    scheduledAt: bigint('scheduled_at', {mode: 'number'}),
    scheduleRevision: integer('schedule_revision'),
    releasedAt: bigint('released_at', {mode: 'number'}),
    releasedBy: text('released_by'),
  },
  (t) => [primaryKey({columns: [t.squadId, t.lessonId]})],
);

export const LESSON_RELEASE_DDL = `
CREATE SCHEMA IF NOT EXISTS academy_runtime;
CREATE TABLE IF NOT EXISTS academy_runtime.lesson_release (
  squad_id text NOT NULL,
  lesson_id text NOT NULL,
  state text NOT NULL CHECK (state IN ('locked', 'scheduled', 'released')),
  scheduled_at bigint,
  schedule_revision integer,
  released_at bigint,
  released_by text,
  PRIMARY KEY (squad_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS lesson_release_scheduled
  ON academy_runtime.lesson_release (state, scheduled_at)
  WHERE state = 'scheduled';
`;
