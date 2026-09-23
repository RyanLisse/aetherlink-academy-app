import {Effect, Layer} from 'effect';
import {EvidenceStore, EvidenceStoreMemory} from './evidence-store.ts';
import {ProgressStore, ProgressStoreMemory} from './progress-store.ts';
import {SelfCheckStore, SelfCheckStoreMemory} from './self-check-store.ts';

/** Memory stack used by tests and single-node hosts. */
export const EvidenceStackMemory: Layer.Layer<EvidenceStore | ProgressStore | SelfCheckStore> =
  ProgressStoreMemory().pipe(
    Layer.provideMerge(EvidenceStoreMemory()),
    Layer.provideMerge(SelfCheckStoreMemory()),
  );

export const runEvidence = <A, E = never>(
  effect: Effect.Effect<A, E, EvidenceStore | ProgressStore | SelfCheckStore>,
): Promise<A> => Effect.runPromise(Effect.provide(effect, EvidenceStackMemory));
