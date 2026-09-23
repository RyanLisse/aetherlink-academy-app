import {Context, Effect, Layer, Ref} from 'effect';

export interface LessonRecord {
  readonly id: string;
  readonly title: string;
  readonly day: number;
  readonly slides: ReadonlyArray<{
    readonly id: string;
    readonly index: number;
    readonly title: string;
    readonly body: string;
    readonly assignmentId: string | null;
  }>;
  readonly publishedRevision: number;
}

export interface AssignmentRecord {
  readonly id: string;
  readonly lessonId: string;
  readonly title: string;
  readonly prompt: string;
  readonly hints: ReadonlyArray<string>;
}

export interface ProgressRecord {
  readonly lessonId: string;
  readonly completed: boolean;
  readonly evidenceCount: number;
  readonly lastSlideIndex: number;
}

export interface EvidenceRecord {
  readonly id: string;
  readonly requestId: string;
  readonly participantId: string;
  readonly roomId: string;
  readonly lessonId: string;
  readonly finding: string;
  readonly command: string;
  readonly observed: string;
  readonly limitation: string;
  readonly at: string;
}

export interface AcademyContentShape {
  readonly getLesson: (lessonId: string) => Effect.Effect<LessonRecord | null>;
  readonly getAssignment: (assignmentId: string) => Effect.Effect<AssignmentRecord | null>;
  readonly getProgress: (roomId: string, participantId: string) => Effect.Effect<ReadonlyArray<ProgressRecord>>;
  readonly submitEvidence: (row: Omit<EvidenceRecord, 'id' | 'at'> & {readonly id?: string}) => Effect.Effect<EvidenceRecord>;
  readonly listEvidence: (roomId: string, participantId: string) => Effect.Effect<ReadonlyArray<EvidenceRecord>>;
  readonly openHint: (assignmentId: string, index: number) => Effect.Effect<{readonly hint: string; readonly index: number} | null>;
  readonly connectionState: (
    roomId: string,
    participantId: string,
  ) => Effect.Effect<'configured' | 'connected' | 'verified'>;
  readonly setConnectionState: (
    roomId: string,
    participantId: string,
    state: 'configured' | 'connected' | 'verified',
  ) => Effect.Effect<void>;
  /** Legacy compat */
  readonly getMission: (roomId: string, participantId: string) => Effect.Effect<Record<string, unknown>>;
  readonly getDocument: (roomId: string) => Effect.Effect<Record<string, unknown>>;
  readonly searchKnowledge: (query: string) => Effect.Effect<{readonly lessons: ReadonlyArray<{readonly id: string; readonly title: string}>}>;
  readonly suggestDocument: (input: {
    readonly roomId: string;
    readonly participantId: string;
    readonly requestId: string;
    readonly quote: string;
    readonly content: string;
  }) => Effect.Effect<Record<string, unknown>>;
}

export class AcademyContent extends Context.Service<AcademyContent, AcademyContentShape>()(
  '@academy/actions/AcademyContent',
) {}

export const AcademyContentMemory = (seed?: {
  readonly lessons?: ReadonlyArray<LessonRecord>;
  readonly assignments?: ReadonlyArray<AssignmentRecord>;
}): Effect.Effect<AcademyContentShape> =>
  Effect.gen(function* () {
    const lessons = new Map((seed?.lessons ?? []).map((l) => [l.id, l]));
    const assignments = new Map((seed?.assignments ?? []).map((a) => [a.id, a]));
    const evidence = yield* Ref.make<EvidenceRecord[]>([]);
    const progress = yield* Ref.make(new Map<string, ProgressRecord[]>());
    const connections = yield* Ref.make(new Map<string, 'configured' | 'connected' | 'verified'>());
    const documents = yield* Ref.make(new Map<string, {markdown: string}>());
    const suggestions = yield* Ref.make<Record<string, unknown>[]>([]);

    const ck = (roomId: string, participantId: string) => `${roomId}::${participantId}`;

    return {
      getLesson: (lessonId) => Effect.succeed(lessons.get(lessonId) ?? null),
      getAssignment: (assignmentId) => Effect.succeed(assignments.get(assignmentId) ?? null),
      getProgress: (roomId, participantId) =>
        Ref.get(progress).pipe(Effect.map((m) => m.get(ck(roomId, participantId)) ?? [])),
      submitEvidence: (row) =>
        Effect.gen(function* () {
          const record: EvidenceRecord = {
            id: row.id ?? crypto.randomUUID(),
            requestId: row.requestId,
            participantId: row.participantId,
            roomId: row.roomId,
            lessonId: row.lessonId,
            finding: row.finding,
            command: row.command,
            observed: row.observed,
            limitation: row.limitation,
            at: new Date().toISOString(),
          };
          yield* Ref.update(evidence, (xs) => [...xs, record]);
          yield* Ref.update(progress, (m) => {
            const next = new Map(m);
            const key = ck(row.roomId, row.participantId);
            const cur = next.get(key) ?? [];
            const existing = cur.find((p) => p.lessonId === row.lessonId);
            const updated: ProgressRecord = existing
              ? {...existing, evidenceCount: existing.evidenceCount + 1}
              : {lessonId: row.lessonId, completed: false, evidenceCount: 1, lastSlideIndex: 0};
            next.set(key, [...cur.filter((p) => p.lessonId !== row.lessonId), updated]);
            return next;
          });
          return record;
        }),
      listEvidence: (roomId, participantId) =>
        Ref.get(evidence).pipe(
          Effect.map((xs) => xs.filter((e) => e.roomId === roomId && e.participantId === participantId)),
        ),
      openHint: (assignmentId, index) =>
        Effect.sync(() => {
          const a = assignments.get(assignmentId);
          if (!a || index < 0 || index >= a.hints.length) return null;
          return {hint: a.hints[index]!, index};
        }),
      connectionState: (roomId, participantId) =>
        Ref.get(connections).pipe(Effect.map((m) => m.get(ck(roomId, participantId)) ?? 'configured')),
      setConnectionState: (roomId, participantId, state) =>
        Ref.update(connections, (m) => {
          const next = new Map(m);
          next.set(ck(roomId, participantId), state);
          return next;
        }),
      getMission: (roomId, participantId) =>
        Effect.succeed({
          session: {roomId, participantId},
          mission: {id: 'ATLAS-REVIEW-01', title: 'Atlas review'},
          coach: 'Cite lesson IDs. Hints first. No browser model calls.',
        }),
      getDocument: (roomId) =>
        Ref.get(documents).pipe(
          Effect.map((m) => {
            const doc = m.get(roomId) ?? {markdown: `Document ${roomId}`};
            return {...doc, marks: {}};
          }),
        ),
      searchKnowledge: (query) =>
        Effect.sync(() => {
          const q = query.trim().toLowerCase();
          const all = [...lessons.values()].map((l) => ({id: l.id, title: l.title}));
          return {lessons: q ? all.filter((l) => l.title.toLowerCase().includes(q) || l.id.toLowerCase().includes(q)) : all};
        }),
      suggestDocument: (input) =>
        Effect.gen(function* () {
          const suggestion = {
            id: crypto.randomUUID(),
            status: 'pending',
            ...input,
            at: new Date().toISOString(),
          };
          yield* Ref.update(suggestions, (xs) => [...xs, suggestion]);
          return suggestion;
        }),
    } satisfies AcademyContentShape;
  });

export const AcademyContentLive = (seed?: {
  readonly lessons?: ReadonlyArray<LessonRecord>;
  readonly assignments?: ReadonlyArray<AssignmentRecord>;
}): Layer.Layer<AcademyContent> => Layer.effect(AcademyContent, AcademyContentMemory(seed));
