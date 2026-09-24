/** Client-side screen-state shape mirroring MCP `get_screen_state` (AET-98). */
export interface ParticipantScreenState {
  readonly lessonId: string | null;
  readonly route: string | null;
  readonly slideIndex: number;
  readonly viewedRevision: number | null;
  readonly latestPublishedRevision: number | null;
  readonly assignmentId: string | null;
  readonly proof: {readonly open: boolean; readonly section: string | null};
  readonly quiz: {
    readonly id: string | null;
    readonly status: string | null;
    readonly itemIndex: number | null;
  } | null;
  readonly room: {
    readonly id: string;
    readonly phase: string | null;
    readonly releasedLessonIds: ReadonlyArray<string>;
  };
  readonly browserSessionId: string;
}

export const buildScreenStateFromLive = (input: {
  readonly roomId: string;
  readonly browserSessionId: string;
  readonly lessonId?: string | null;
  readonly route?: string | null;
  readonly slideIndex: number;
  readonly viewedRevision?: number | null;
  readonly latestPublishedRevision?: number | null;
  readonly assignmentId?: string | null;
  readonly proofOpen?: boolean;
  readonly proofSection?: string | null;
  readonly quizId?: string | null;
  readonly quizStatus?: string | null;
  readonly quizItemIndex?: number | null;
  readonly roomPhase?: string | null;
  readonly releasedLessonIds?: ReadonlyArray<string> | null;
}): ParticipantScreenState => ({
  lessonId: input.lessonId ?? null,
  route: input.route ?? null,
  slideIndex: input.slideIndex,
  viewedRevision: input.viewedRevision ?? null,
  latestPublishedRevision: input.latestPublishedRevision ?? null,
  assignmentId: input.assignmentId ?? null,
  proof: {
    open: Boolean(input.proofOpen),
    section: input.proofOpen ? (input.proofSection ?? null) : null,
  },
  quiz: input.quizId
    ? {
        id: input.quizId,
        status: input.quizStatus ?? null,
        itemIndex: input.quizItemIndex ?? null,
      }
    : null,
  room: {
    id: input.roomId,
    phase: input.roomPhase ?? null,
    releasedLessonIds: [...(input.releasedLessonIds ?? [])],
  },
  browserSessionId: input.browserSessionId,
});
