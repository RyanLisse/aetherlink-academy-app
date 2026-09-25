import {createHash} from 'node:crypto';
import {Effect} from 'effect';
import type {LocalizedText, QuizQuestion, Slide} from '@academy/schema';
import type {CourseAggregateDraft, CurriculumRepoShape} from '../db/curriculum-repo.ts';
import {canonicalJson} from '../notion/plan.ts';
import {AuthoringConflict, AuthoringNotFound} from './errors.ts';
import type {SnapshotRecord} from './store.ts';

/** `visual.kind` marking a slide whose canonical content is Slides HTML read back from the upstream editor. */
export const AUTHORED_VISUAL_KIND = 'agent-native-slides/html';

type DraftSlide = CourseAggregateDraft['slides'][number];

const ENTITIES: Record<string, string> = {'&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' '};

const decodeEntities = (value: string): string => value.replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity] ?? entity);

/** Plain text lines of an HTML fragment: block boundaries become line breaks, tags are dropped. */
export const htmlToTextLines = (html: string): ReadonlyArray<string> =>
  decodeEntities(
    html
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(h[1-6]|p|div|li|section|article|header|footer|ul|ol|tr)>/gi, '\n')
      .replace(/<[^>]*>/g, ''),
  )
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0);

const firstHeading = (html: string): string | null => {
  const match = /<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/i.exec(html);
  if (!match) return null;
  const text = htmlToTextLines(match[1]!).join(' ');
  return text || null;
};

/** Deterministic UUID-shaped id so re-publishing identical content yields an identical draft (and content hash). */
const derivedId = (...parts: ReadonlyArray<string | number>): string => {
  const hex = createHash('sha256').update(parts.join('|')).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-8${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};

/**
 * Maps a Slides readback snapshot onto curriculum slide rows for one lesson.
 * The HTML stays the canonical content (in `visual`); `title` is derived text
 * so lists, search and Markdown export work. Slide ids are reused by ordinal
 * from the base revision so assignment anchors and stable ids survive.
 */
export const snapshotToSlides = (
  lessonId: string,
  snapshot: Pick<SnapshotRecord, 'revision' | 'content'>,
  baseLessonSlides: ReadonlyArray<Pick<DraftSlide, 'id' | 'ordinal'>>,
): ReadonlyArray<DraftSlide> => {
  const baseIdByOrdinal = new Map(baseLessonSlides.map((slide) => [slide.ordinal, slide.id]));
  return snapshot.content.map((slide, index): DraftSlide => {
    const ordinal = index + 1;
    const lines = htmlToTextLines(slide.content);
    const title = firstHeading(slide.content) ?? lines[0]?.slice(0, 200) ?? `Slide ${ordinal}`;
    return {
      id: baseIdByOrdinal.get(ordinal) ?? derivedId(lessonId, 'authored-slide', ordinal),
      lessonId,
      ordinal,
      title,
      type: ordinal === 1 ? 'context' : 'concept',
      visual: {kind: AUTHORED_VISUAL_KIND, upstreamSlideId: slide.id, deckRevision: snapshot.revision, html: slide.content},
      ...(slide.notes ? {notes: slide.notes} : {}),
    };
  });
};

const byId = <Row extends {readonly id: string}>(rows: ReadonlyArray<Row>): ReadonlyArray<Row> => [...rows].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

/** Order-insensitive: rows are sorted by id and object keys by name before hashing. */
export const aggregateHash = (draft: CourseAggregateDraft): string => {
  const ordered = Object.fromEntries(Object.entries(draft).map(([table, rows]) => [table, byId(rows as ReadonlyArray<{id: string}>)]));
  return `authoring:${createHash('sha256').update(canonicalJson(ordered)).digest('hex')}`;
};

export interface PublishInput {
  readonly courseId: string;
  readonly curriculumLessonId: string;
  readonly snapshot: SnapshotRecord;
  /** Server-resolved facilitator identity; never read from the request body. */
  readonly author: string;
}

export interface PublishResult {
  readonly version: number;
  readonly baseVersion: number;
  readonly unchanged: boolean;
  readonly publishedBy: string | null;
  readonly publishedAt: string | null;
}

/**
 * Snapshot → new immutable revision: clone the course's current published
 * revision, replace one lesson's slides with the snapshot, write it as a draft
 * (content-hashed) and publish that draft. Rooms are never touched: their pin
 * is immutable at the database level (`0002_room_pin_invariants.sql`), and
 * release state lives in the gateway, not here.
 */
export const publishSnapshot = (curriculum: CurriculumRepoShape, input: PublishInput) =>
  Effect.gen(function* () {
    const baseVersion = yield* curriculum.currentVersion(input.courseId);
    if (baseVersion === null) {
      return yield* new AuthoringConflict({message: `Course ${input.courseId} has no published revision to build on.`});
    }
    const base = yield* curriculum.readAggregate(input.courseId, baseVersion);
    if (!base.lessons.some((lesson) => lesson.id === input.curriculumLessonId)) {
      return yield* new AuthoringNotFound({message: `Lesson ${input.curriculumLessonId} is not part of course ${input.courseId} v${baseVersion}.`});
    }
    const baseLessonSlides = base.slides.filter((slide) => slide.lessonId === input.curriculumLessonId);
    const authored = snapshotToSlides(input.curriculumLessonId, input.snapshot, baseLessonSlides);
    const keptIds = new Set(authored.map((slide) => slide.id));
    const orphaned = base.assignments.filter((assignment) => assignment.slideId && baseLessonSlides.some((slide) => slide.id === assignment.slideId) && !keptIds.has(assignment.slideId));
    if (orphaned.length > 0) {
      return yield* new AuthoringConflict({
        message: `Publishing would drop slides that ${orphaned.length} assignment(s) are anchored to; keep at least ${Math.max(...baseLessonSlides.map((slide) => slide.ordinal))} slides or move the assignments first.`,
      });
    }
    const draft: CourseAggregateDraft = {
      ...base,
      slides: [...base.slides.filter((slide) => slide.lessonId !== input.curriculumLessonId), ...authored],
    };
    const contentHash = aggregateHash(draft);
    if (contentHash === aggregateHash(base)) {
      return {version: baseVersion, baseVersion, unchanged: true, publishedBy: null, publishedAt: null} satisfies PublishResult;
    }
    const written = yield* curriculum.writeDraft(input.courseId, draft, contentHash, input.author);
    const published = yield* curriculum.publishDraft(input.courseId, written.version, input.author);
    return {
      version: published.version,
      baseVersion,
      unchanged: false,
      publishedBy: input.author,
      publishedAt: published.publishedAt.toISOString(),
    } satisfies PublishResult;
  });

const bullet = (line: string) => `- ${line}`;

const slideMarkdown = (slide: Slide): ReadonlyArray<string> => {
  const out: Array<string> = [`## ${slide.ordinal}. ${slide.title}`];
  if (slide.kicker) out.push(`_${slide.kicker}_`);
  if (slide.subtitle) out.push(slide.subtitle);
  const visual = slide.visual;
  if (visual && typeof visual === 'object' && !Array.isArray(visual) && (visual as Record<string, unknown>).kind === AUTHORED_VISUAL_KIND) {
    const html = (visual as Record<string, unknown>).html;
    const lines = typeof html === 'string' ? htmlToTextLines(html) : [];
    const body = lines[0] === slide.title ? lines.slice(1) : lines;
    if (body.length > 0) out.push(body.join('\n\n'));
  }
  if (slide.cards?.length) out.push(slide.cards.map((card) => bullet(`**${card.title}** ${card.body}`)).join('\n'));
  if (slide.items?.length) out.push(slide.items.map((item) => bullet([item.label, item.caption, item.detail].filter(Boolean).join(' — '))).join('\n'));
  if (slide.columns?.length) out.push(slide.columns.map((column) => [`**${column.title}**`, ...column.items.map(bullet)].join('\n')).join('\n\n'));
  if (slide.steps?.length) out.push(slide.steps.map((step, index) => `${index + 1}. ${step}`).join('\n'));
  if (slide.prompt) out.push(`> ${slide.prompt}`);
  if (slide.expected) out.push(`**Verwacht:** ${slide.expected}`);
  if (slide.check) out.push(`**Check:** ${slide.check}`);
  if (slide.notes) out.push(`**Facilitatornotities:** ${slide.notes}`);
  return out;
};

/** Dutch when the revision carries it, the source English otherwise. */
const localized = (text: LocalizedText): string => text.nl ?? text.en;

/** Facilitator Markdown export of one lesson in one revision (includes notes and quiz answers). */
export const lessonMarkdown = (
  meta: {readonly courseId: string; readonly version: number; readonly lessonId: string},
  lesson: {readonly slides: ReadonlyArray<Slide>; readonly quizQuestions: ReadonlyArray<QuizQuestion>},
): string => {
  const blocks: Array<string> = [`<!-- course ${meta.courseId} · revision ${meta.version} · lesson ${meta.lessonId} -->`];
  for (const slide of lesson.slides) blocks.push(...slideMarkdown(slide));
  if (lesson.quizQuestions.length > 0) {
    blocks.push('## Quiz');
    for (const question of lesson.quizQuestions) {
      blocks.push([
        `**${localized(question.question)}**`,
        ...question.options.map((option, index) => bullet(`${index === question.answer ? '[x]' : '[ ]'} ${localized(option)}`)),
      ].join('\n'));
    }
  }
  return `${blocks.join('\n\n')}\n`;
};
