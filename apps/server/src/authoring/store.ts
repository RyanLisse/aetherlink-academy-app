import {randomUUID} from 'node:crypto';
import {mkdir, readFile, rename, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {DeckCreationBlocked} from './errors.ts';

export interface DeckSummary {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly slideCount: number;
  readonly revision: string;
}

export interface SnapshotSummary {
  readonly title: string;
  readonly slideCount: number;
  readonly revision: string;
  readonly capturedAt: string;
}

export interface SnapshotRecord extends SnapshotSummary {
  readonly content: ReadonlyArray<SnapshotSlide>;
}

export interface DeckCreationState {
  readonly status: 'pending' | 'uncertain';
  readonly startedAt: string;
}

export interface SnapshotSlide {
  readonly id: string;
  readonly content: string;
  readonly notes: string | null;
}

export interface Lesson {
  readonly id: string;
  readonly title: string;
  readonly objective: string;
  readonly outline: ReadonlyArray<string>;
  readonly deck: DeckSummary | null;
  readonly deckCreation: DeckCreationState | null;
  readonly snapshot: SnapshotSummary | null;
  readonly snapshotHistory: ReadonlyArray<SnapshotSummary>;
}

export interface LessonInput {
  readonly title: string;
  readonly objective: string;
  readonly outline: ReadonlyArray<string>;
}

interface LessonRecord extends Lesson {
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly snapshotContent: ReadonlyArray<SnapshotSlide> | null;
  readonly snapshotHistory: ReadonlyArray<SnapshotRecord>;
  readonly deckCreation: DeckCreationState | null;
}

interface StoreFile {
  readonly lessons: Record<string, LessonRecord>;
}

const EMPTY_STORE: StoreFile = {lessons: {}};

const toPublicLesson = (record: LessonRecord): Lesson => ({
  id: record.id,
  title: record.title,
  objective: record.objective,
  outline: record.outline,
  deck: record.deck,
  deckCreation: record.deckCreation,
  snapshot: record.snapshot,
  snapshotHistory: record.snapshotHistory.map(({content: _content, ...summary}) => summary),
});

const isStoreFile = (value: unknown): value is StoreFile =>
  !!value && typeof value === 'object' && typeof (value as {lessons?: unknown}).lessons === 'object';

const normalizeSnapshot = (value: unknown): SnapshotRecord | null => {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.title !== 'string' ||
    typeof record.slideCount !== 'number' ||
    typeof record.revision !== 'string' ||
    typeof record.capturedAt !== 'string' ||
    !Array.isArray(record.content)
  ) return null;
  return {
    title: record.title,
    slideCount: record.slideCount,
    revision: record.revision,
    capturedAt: record.capturedAt,
    content: record.content as ReadonlyArray<SnapshotSlide>,
  };
};

const normalizeRecord = (record: LessonRecord): LessonRecord => {
  const legacyContent = Array.isArray(record.snapshotContent) ? record.snapshotContent : null;
  const storedHistory = Array.isArray(record.snapshotHistory)
    ? record.snapshotHistory.map(normalizeSnapshot).filter((item): item is SnapshotRecord => item !== null)
    : [];
  const history = storedHistory.length > 0
    ? storedHistory
    : record.snapshot && legacyContent
      ? [{...record.snapshot, content: legacyContent}]
      : [];
  return {
    ...record,
    deckCreation: record.deckCreation ?? null,
    snapshotHistory: history,
    snapshotContent: history.at(-1)?.content ?? legacyContent,
  };
};

class Mutex {
  private tail: Promise<unknown> = Promise.resolve();

  run<T>(fn: () => Promise<T>): Promise<T> {
    const result = this.tail.then(fn, fn);
    this.tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}

/**
 * Single JSON file, single writer. The mutex is held across the upstream
 * network call inside `ensureDeck` on purpose: that is what makes concurrent
 * `POST /lessons/:id/deck` calls collapse into one upstream create instead of
 * racing. This is a single-operator local PoC, so serializing all lesson
 * writes behind one lock is an acceptable trade for that guarantee.
 */
export class AuthoringStore {
  private readonly file: string;
  private readonly mutex = new Mutex();

  constructor(dataDir: string) {
    this.file = path.join(path.resolve(dataDir), 'lessons.json');
  }

  private async load(): Promise<StoreFile> {
    try {
      const raw = await readFile(this.file, 'utf8');
      const parsed: unknown = JSON.parse(raw);
      return isStoreFile(parsed)
        ? {lessons: Object.fromEntries(Object.entries(parsed.lessons).map(([id, record]) => [id, normalizeRecord(record)]))}
        : EMPTY_STORE;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return EMPTY_STORE;
      throw error;
    }
  }

  private async save(store: StoreFile): Promise<void> {
    const dir = path.dirname(this.file);
    await mkdir(dir, {recursive: true});
    const tmp = path.join(dir, `.lessons.${randomUUID()}.tmp`);
    await writeFile(tmp, JSON.stringify(store, null, 2), 'utf8');
    await rename(tmp, this.file);
  }

  listLessons(): Promise<ReadonlyArray<Lesson>> {
    return this.mutex.run(async () => {
      const store = await this.load();
      return Object.values(store.lessons).map(toPublicLesson);
    });
  }

  createLesson(input: LessonInput): Promise<Lesson> {
    return this.mutex.run(async () => {
      const store = await this.load();
      const now = new Date().toISOString();
      const record: LessonRecord = {
        id: randomUUID(),
        title: input.title,
        objective: input.objective,
        outline: input.outline,
        deck: null,
        deckCreation: null,
        snapshot: null,
        snapshotContent: null,
        snapshotHistory: [],
        createdAt: now,
        updatedAt: now,
      };
      await this.save({lessons: {...store.lessons, [record.id]: record}});
      return toPublicLesson(record);
    });
  }

  getLesson(id: string): Promise<Lesson | null> {
    return this.mutex.run(async () => {
      const store = await this.load();
      const record = store.lessons[id];
      return record ? toPublicLesson(record) : null;
    });
  }

  /**
   * Returns `null` when the lesson doesn't exist. Otherwise creates the deck
   * upstream only if the lesson doesn't already have one; a lesson that
   * already has a deck returns it unchanged (`created: false`), never
   * overwriting or duplicating it.
   */
  ensureDeck(
    id: string,
    create: (lesson: Lesson) => Promise<DeckSummary>,
  ): Promise<{lesson: Lesson; created: boolean} | null> {
    return this.mutex.run(async () => {
      const store = await this.load();
      const record = store.lessons[id];
      if (!record) return null;
      if (record.deck) return {lesson: toPublicLesson(record), created: false};
      if (record.deckCreation) {
        throw new DeckCreationBlocked({
          message: 'Deck creation is already in progress or its upstream outcome is unknown. Check the Slides service and reconcile it before retrying.',
        });
      }

      // Write the intent before the network call. A process crash now leaves a
      // durable marker, so a later process cannot blindly create a second deck.
      const pending: LessonRecord = {
        ...record,
        deckCreation: {status: 'pending', startedAt: new Date().toISOString()},
        updatedAt: new Date().toISOString(),
      };
      await this.save({lessons: {...store.lessons, [id]: pending}});

      try {
        const deck = await create(toPublicLesson(pending));
        const updated: LessonRecord = {
          ...pending,
          deck,
          deckCreation: null,
          updatedAt: new Date().toISOString(),
        };
        await this.save({lessons: {...store.lessons, [id]: updated}});
        return {lesson: toPublicLesson(updated), created: true};
      } catch (error) {
        // Once a create has been attempted, transport failures, malformed
        // responses and local persistence errors can all hide a remote success.
        // Preserve the fence until an operator reconciles the remote state.
        const uncertain: LessonRecord = {
          ...pending,
          deckCreation: {status: 'uncertain', startedAt: pending.deckCreation!.startedAt},
          updatedAt: new Date().toISOString(),
        };
        await this.save({lessons: {...store.lessons, [id]: uncertain}});
        throw error;
      }
    });
  }

  updateDeckSummary(id: string, deck: DeckSummary): Promise<Lesson | null> {
    return this.mutex.run(async () => {
      const store = await this.load();
      const record = store.lessons[id];
      if (!record) return null;
      const updated: LessonRecord = {...record, deck, updatedAt: new Date().toISOString()};
      await this.save({lessons: {...store.lessons, [id]: updated}});
      return toPublicLesson(updated);
    });
  }

  /**
   * Attach a deck found during manual reconciliation. The upstream lookup is
   * deliberately performed by the caller before entering this mutex; this
   * method is the atomic local compare-and-set that prevents overwriting a
   * deck or clearing a fence that no longer applies.
   */
  reconcileDeck(id: string, deck: DeckSummary): Promise<{lesson: Lesson; attached: boolean} | null> {
    return this.mutex.run(async () => {
      const store = await this.load();
      const record = store.lessons[id];
      if (!record) return null;
      if (record.deck || !record.deckCreation) return {lesson: toPublicLesson(record), attached: false};
      const updated: LessonRecord = {
        ...record,
        deck,
        deckCreation: null,
        updatedAt: new Date().toISOString(),
      };
      await this.save({lessons: {...store.lessons, [id]: updated}});
      return {lesson: toPublicLesson(updated), attached: true};
    });
  }

  saveSnapshot(
    id: string,
    snapshot: SnapshotSummary,
    content: ReadonlyArray<SnapshotSlide>,
  ): Promise<Lesson | null> {
    return this.mutex.run(async () => {
      const store = await this.load();
      const record = store.lessons[id];
      if (!record) return null;
      const updated: LessonRecord = {
        ...record,
        snapshot,
        snapshotContent: content,
        snapshotHistory: [
          ...record.snapshotHistory,
          { ...snapshot, content: content.map((slide) => ({...slide})) },
        ],
        updatedAt: new Date().toISOString(),
      };
      await this.save({lessons: {...store.lessons, [id]: updated}});
      return toPublicLesson(updated);
    });
  }
}
