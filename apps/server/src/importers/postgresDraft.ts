import {Effect} from 'effect';
import type {Slide} from '@academy/schema';
import {CurriculumRepo, type CurriculumRepoShape} from '../db/curriculum-repo.ts';
import {contentHashSlides} from './contentHash.ts';
import {slidesToAggregate} from './slidesAggregate.ts';

export type DraftWriteResult = {
  readonly version: number;
  readonly unchanged: boolean;
  readonly contentHash: string;
};

/** Write imported slides as a Postgres draft version (never publishes). Idempotent on content hash. */
export const writeSlidesDraft = (
  courseId: string,
  slides: ReadonlyArray<Slide>,
  repo?: CurriculumRepoShape,
): Effect.Effect<DraftWriteResult, unknown, CurriculumRepo> =>
  Effect.gen(function* () {
    const curriculum = repo ?? (yield* CurriculumRepo);
    const contentHash = contentHashSlides(slides);
    const draft = slidesToAggregate(courseId, slides);
    return yield* curriculum.writeDraft(courseId, draft, contentHash);
  });
