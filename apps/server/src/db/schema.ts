import type {AnyPgColumn} from 'drizzle-orm/pg-core';
import {boolean, check, customType, foreignKey, index, integer, jsonb, pgSchema, primaryKey, text, timestamp, unique, uuid} from 'drizzle-orm/pg-core';
import {sql} from 'drizzle-orm';
import type {LocalizedText} from '@academy/schema';
import {SEARCH_DOCUMENTS, vectorSql, type SearchDocument} from '../search/documents.ts';

export const curriculum = pgSchema('academy_curriculum');

const globalId = () => uuid('id').primaryKey().defaultRandom();
/**
 * Content rows use a logical `id` that is stable and reused across versions
 * (the same lesson edited in v2 keeps its v1 id); the primary key is the
 * composite `(id, course_id, version)`, not `id` alone.
 */
const contentId = () => uuid('id').notNull().defaultRandom();
const localized = (name: string) => jsonb(name).$type<LocalizedText>();
const createdAt = () => timestamp('created_at', {withTimezone: true}).notNull().defaultNow();

const tsvector = customType<{data: string}>({dataType: () => 'tsvector'});
/**
 * Stored EN + NL vectors per document, split by audience: `search_*` holds only
 * participant-visible text, `private_search_*` holds facilitator-only text.
 * Field lists live in `search/documents.ts`.
 */
const searchColumns = (document: SearchDocument) => ({
  searchEn: tsvector('search_en').notNull().generatedAlwaysAs(sql.raw(vectorSql('english', document.public))),
  searchNl: tsvector('search_nl').notNull().generatedAlwaysAs(sql.raw(vectorSql('dutch', document.public))),
});
const privateSearchColumns = (document: SearchDocument) => ({
  privateSearchEn: tsvector('private_search_en').notNull().generatedAlwaysAs(sql.raw(vectorSql('english', document.private))),
  privateSearchNl: tsvector('private_search_nl').notNull().generatedAlwaysAs(sql.raw(vectorSql('dutch', document.private))),
});

export const courseVersions = curriculum.table(
  'course_versions',
  {
    courseId: uuid('course_id').notNull().references((): AnyPgColumn => courses.id),
    version: integer('version').notNull(),
    status: text('status', {enum: ['draft', 'published']}).notNull().default('draft'),
    contentHash: text('content_hash'),
    publishedAt: timestamp('published_at', {withTimezone: true}),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({columns: [t.courseId, t.version]})],
);

/**
 * `courses.current_version` references this composite key. Postgres skips FK
 * checks when any referencing column is null (MATCH SIMPLE), so a course with
 * no publish yet is unconstrained; once set, it must name a real version row.
 */
export const courses = curriculum.table(
  'courses',
  {
    id: globalId(),
    title: localized('title').notNull(),
    locale: text('locale', {enum: ['en', 'nl']}).notNull(),
    currentVersion: integer('current_version'),
    sourceGitUrl: text('source_git_url').notNull(),
    sourceCommit: text('source_commit').notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({
      name: 'courses_current_version_fkey',
      columns: [t.id, t.currentVersion],
      foreignColumns: [courseVersions.courseId, courseVersions.version],
    }),
  ],
);

export const tracks = curriculum.table(
  'tracks',
  {
    id: contentId(),
    courseId: uuid('course_id').notNull(),
    version: integer('version').notNull(),
    ordinal: integer('ordinal').notNull(),
    name: localized('name').notNull(),
    caseLabel: text('case_label'),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({columns: [t.id, t.courseId, t.version]}),
    foreignKey({columns: [t.courseId, t.version], foreignColumns: [courseVersions.courseId, courseVersions.version]}),
    check('tracks_ordinal_check', sql`${t.ordinal} >= 1`),
  ],
);

export const days = curriculum.table(
  'days',
  {
    id: contentId(),
    trackId: uuid('track_id').notNull(),
    courseId: uuid('course_id').notNull(),
    version: integer('version').notNull(),
    ordinal: integer('ordinal').notNull(),
    kind: text('kind', {enum: ['teaching', 'support']}).notNull(),
    title: localized('title').notNull(),
    ladder: jsonb('ladder').$type<readonly string[]>(),
    schedule: jsonb('schedule').$type<ReadonlyArray<{label: LocalizedText; start?: string; end?: string}>>(),
    checklist: jsonb('checklist').$type<readonly LocalizedText[]>(),
    guideUrl: text('guide_url'),
    participantRepo: text('participant_repo'),
    agentRepo: text('agent_repo'),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({columns: [t.id, t.courseId, t.version]}),
    foreignKey({columns: [t.trackId, t.courseId, t.version], foreignColumns: [tracks.id, tracks.courseId, tracks.version]}),
    foreignKey({columns: [t.courseId, t.version], foreignColumns: [courseVersions.courseId, courseVersions.version]}),
    check('days_ordinal_check', sql`${t.ordinal} between 1 and 7`),
  ],
);

export const lessons = curriculum.table(
  'lessons',
  {
    id: contentId(),
    dayId: uuid('day_id').notNull(),
    courseId: uuid('course_id').notNull(),
    version: integer('version').notNull(),
    slug: text('slug').notNull(),
    title: localized('title').notNull(),
    kicker: text('kicker'),
    mode: text('mode', {enum: ['guided', 'solo', 'squad']}).notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    lede: localized('lede'),
    loop: jsonb('loop').$type<ReadonlyArray<{label: string; prompt: string}>>(),
    workedExample: text('worked_example'),
    source: jsonb('source').$type<{repo: string; commit: string; path?: string}>(),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({columns: [t.id, t.courseId, t.version]}),
    unique('lessons_course_version_slug_key').on(t.courseId, t.version, t.slug),
    foreignKey({columns: [t.dayId, t.courseId, t.version], foreignColumns: [days.id, days.courseId, days.version]}),
    foreignKey({columns: [t.courseId, t.version], foreignColumns: [courseVersions.courseId, courseVersions.version]}),
  ],
);

/**
 * Mirrors `@academy/schema`'s source-preserving `Slide`, extended with the
 * `cards`/`image`/`bars` layout fields the training-template audit found.
 * `notes` is facilitator-only plain text; participant reads select an
 * explicit column allowlist that omits it (see `curriculum-repo.ts`).
 */
export const slides = curriculum.table(
  'slides',
  {
    id: contentId(),
    lessonId: uuid('lesson_id').notNull(),
    courseId: uuid('course_id').notNull(),
    version: integer('version').notNull(),
    ordinal: integer('ordinal').notNull(),
    title: text('title').notNull(),
    kicker: text('kicker'),
    subtitle: text('subtitle'),
    type: text('type', {enum: ['context', 'concept', 'practice', 'review', 'recap', 'pause']}).notNull(),
    layout: text('layout', {enum: ['pillars', 'steps', 'compare', 'exercise', 'recap', 'cards', 'image', 'bars']}),
    cards: jsonb('cards'),
    items: jsonb('items'),
    columns: jsonb('columns'),
    steps: jsonb('steps').$type<readonly string[]>(),
    expected: text('expected'),
    check: text('check'),
    timer: integer('timer'),
    prompt: text('prompt'),
    tagline: text('tagline'),
    dark: boolean('dark'),
    visual: jsonb('visual'),
    image: text('image'),
    imageAlt: text('image_alt'),
    imageCaption: text('image_caption'),
    keepCards: boolean('keep_cards'),
    mascot: boolean('mascot'),
    concepts: jsonb('concepts').$type<readonly string[]>(),
    bars: jsonb('bars').$type<{stages: ReadonlyArray<{name: string; w: number; accent?: boolean; ghost?: boolean}>; scale: string; caption: string}>(),
    planB: text('plan_b'),
    notes: text('notes'),
    ...searchColumns(SEARCH_DOCUMENTS.slides),
    ...privateSearchColumns(SEARCH_DOCUMENTS.slides),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({columns: [t.id, t.courseId, t.version]}),
    unique('slides_course_version_lesson_ordinal_key').on(t.courseId, t.version, t.lessonId, t.ordinal),
    index('slides_search_en_idx').using('gin', t.searchEn),
    index('slides_search_nl_idx').using('gin', t.searchNl),
    index('slides_private_search_en_idx').using('gin', t.privateSearchEn),
    index('slides_private_search_nl_idx').using('gin', t.privateSearchNl),
    foreignKey({columns: [t.lessonId, t.courseId, t.version], foreignColumns: [lessons.id, lessons.courseId, lessons.version]}),
    foreignKey({columns: [t.courseId, t.version], foreignColumns: [courseVersions.courseId, courseVersions.version]}),
    check('slides_ordinal_check', sql`${t.ordinal} >= 1`),
  ],
);

export const assignments = curriculum.table(
  'assignments',
  {
    id: contentId(),
    lessonId: uuid('lesson_id').notNull(),
    slideId: uuid('slide_id'),
    courseId: uuid('course_id').notNull(),
    version: integer('version').notNull(),
    title: localized('title').notNull(),
    minutes: integer('minutes').notNull(),
    goal: localized('goal'),
    steps: jsonb('steps').$type<readonly LocalizedText[]>(),
    expected: text('expected'),
    check: text('check'),
    checks: jsonb('checks').$type<readonly string[]>(),
    allowed: jsonb('allowed').$type<readonly string[]>(),
    stop: text('stop'),
    hints: jsonb('hints').$type<readonly LocalizedText[]>(),
    stretch: text('stretch'),
    starterPath: text('starter_path'),
    starterFiles: jsonb('starter_files').$type<readonly string[]>(),
    lessonIds: jsonb('lesson_ids').$type<readonly string[]>(),
    dataset: text('dataset'),
    ...searchColumns(SEARCH_DOCUMENTS.assignments),
    ...privateSearchColumns(SEARCH_DOCUMENTS.assignments),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({columns: [t.id, t.courseId, t.version]}),
    index('assignments_search_en_idx').using('gin', t.searchEn),
    index('assignments_search_nl_idx').using('gin', t.searchNl),
    index('assignments_private_search_en_idx').using('gin', t.privateSearchEn),
    index('assignments_private_search_nl_idx').using('gin', t.privateSearchNl),
    foreignKey({columns: [t.lessonId, t.courseId, t.version], foreignColumns: [lessons.id, lessons.courseId, lessons.version]}),
    foreignKey({columns: [t.slideId, t.courseId, t.version], foreignColumns: [slides.id, slides.courseId, slides.version]}),
    foreignKey({columns: [t.courseId, t.version], foreignColumns: [courseVersions.courseId, courseVersions.version]}),
  ],
);

/** `answer` is facilitator-only; the participant projection selects an explicit column list that omits it. */
export const quizQuestions = curriculum.table(
  'quiz_questions',
  {
    id: contentId(),
    lessonId: uuid('lesson_id').notNull(),
    courseId: uuid('course_id').notNull(),
    version: integer('version').notNull(),
    question: localized('question').notNull(),
    options: jsonb('options').$type<readonly LocalizedText[]>().notNull(),
    answer: integer('answer').notNull(),
    source: text('source'),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({columns: [t.id, t.courseId, t.version]}),
    foreignKey({columns: [t.lessonId, t.courseId, t.version], foreignColumns: [lessons.id, lessons.courseId, lessons.version]}),
    foreignKey({columns: [t.courseId, t.version], foreignColumns: [courseVersions.courseId, courseVersions.version]}),
  ],
);

/**
 * Course glossary, one row per term per locale. No importer produces glossary
 * entries yet, so this table starts empty; search and the reference view read
 * it without inventing content.
 */
export const glossaryTerms = curriculum.table(
  'glossary_terms',
  {
    id: contentId(),
    courseId: uuid('course_id').notNull(),
    version: integer('version').notNull(),
    locale: text('locale', {enum: ['en', 'nl']}).notNull(),
    term: text('term').notNull(),
    definition: text('definition').notNull(),
    ...searchColumns(SEARCH_DOCUMENTS.glossary_terms),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({columns: [t.id, t.courseId, t.version]}),
    unique('glossary_terms_course_version_locale_term_key').on(t.courseId, t.version, t.locale, t.term),
    foreignKey({columns: [t.courseId, t.version], foreignColumns: [courseVersions.courseId, courseVersions.version]}),
    index('glossary_terms_search_en_idx').using('gin', t.searchEn),
    index('glossary_terms_search_nl_idx').using('gin', t.searchNl),
  ],
);

/**
 * A room pins the version it reads at creation. The FK guarantees the pin
 * names a real revision; triggers in `0002_room_pin_invariants.sql` enforce
 * that the revision is published and that the pin never changes afterward
 * (Postgres has no cross-table `CHECK`, so those two rules are DB-level but
 * not expressible in this file's column DSL).
 */
export const rooms = curriculum.table(
  'rooms',
  {
    id: globalId(),
    courseId: uuid('course_id').notNull(),
    pinnedVersion: integer('pinned_version').notNull(),
    createdAt: createdAt(),
  },
  (t) => [foreignKey({columns: [t.courseId, t.pinnedVersion], foreignColumns: [courseVersions.courseId, courseVersions.version]})],
);

/** Postgres snapshot of the Redis-resident presenter cursor, refreshed on an interval for restart recovery. */
export const presenterState = curriculum.table('presenter_state', {
  roomId: uuid('room_id').primaryKey().references(() => rooms.id),
  slideId: uuid('slide_id').notNull(),
  slideOrdinal: integer('slide_ordinal').notNull(),
  updatedAt: timestamp('updated_at', {withTimezone: true}).notNull().defaultNow(),
});

export const followState = curriculum.table(
  'follow_state',
  {
    id: globalId(),
    roomId: uuid('room_id').notNull().references(() => rooms.id),
    participantId: text('participant_id').notNull(),
    following: boolean('following').notNull().default(true),
    updatedAt: timestamp('updated_at', {withTimezone: true}).notNull().defaultNow(),
  },
  (t) => [unique('follow_state_room_participant_key').on(t.roomId, t.participantId)],
);

export const progress = curriculum.table(
  'progress',
  {
    id: globalId(),
    roomId: uuid('room_id').notNull().references(() => rooms.id),
    participantId: text('participant_id').notNull(),
    lessonId: uuid('lesson_id').notNull(),
    slideId: uuid('slide_id'),
    status: text('status', {enum: ['started', 'completed']}).notNull(),
    updatedAt: timestamp('updated_at', {withTimezone: true}).notNull().defaultNow(),
  },
  (t) => [unique('progress_room_participant_lesson_key').on(t.roomId, t.participantId, t.lessonId)],
);

export const chatThreads = curriculum.table('chat_threads', {
  id: globalId(),
  roomId: uuid('room_id').notNull().references(() => rooms.id),
  title: text('title'),
  createdAt: createdAt(),
});

export const chatMessages = curriculum.table('chat_messages', {
  id: globalId(),
  threadId: uuid('thread_id').notNull().references(() => chatThreads.id),
  authorId: text('author_id').notNull(),
  authorRole: text('author_role', {enum: ['facilitator', 'participant']}).notNull(),
  body: text('body').notNull(),
  createdAt: createdAt(),
});

/**
 * Ciphertext columns only. Decryption is the responsibility of a
 * server-side secret-holding service that is out of scope for this package;
 * no query in this module ever selects this table alongside curriculum content.
 */
export const facilitatorCredentials = curriculum.table('facilitator_credentials', {
  id: globalId(),
  roomId: uuid('room_id').notNull().unique().references(() => rooms.id),
  algorithm: text('algorithm', {enum: ['aes-256-gcm']}).notNull().default('aes-256-gcm'),
  cipherText: text('cipher_text').notNull(),
  nonce: text('nonce').notNull(),
  createdAt: createdAt(),
});
