import {connectLab, type LabAnswer, type LabBridge, type MessageHub, type PostTarget, type StopId} from '@academy/lab-embed';
import type {Lesson, Stop} from './schema';

/** Steps are the lesson's checkpoints plus reaching the end with every checkpoint done. */
export type LessonRun = {readonly stops: readonly Stop[]; readonly finished: ReadonlySet<Stop>; readonly ended: boolean};

export function startRun(lesson: Lesson): LessonRun {
  const stops = lesson.ops.flatMap(op => ('stop' in op && op.stop ? [op.stop] : []));
  return {stops, finished: new Set(), ended: false};
}

export function finishStop(run: LessonRun, stop: Stop): LessonRun {
  return run.stops.includes(stop) ? {...run, finished: new Set(run.finished).add(stop)} : run;
}

export const reachEnd = (run: LessonRun): LessonRun => ({...run, ended: true});

/** Arcade stops carry no id, so the contract names them by position: `stop-1` is the lesson's first checkpoint. */
export const stopIdOf = (run: LessonRun, stop: Stop): StopId => `stop-${run.stops.indexOf(stop) + 1}` as StopId;

export function runProgress(run: LessonRun): {step: number; total: number; complete: boolean} {
  const total = run.stops.length + 1;
  const complete = run.ended && run.finished.size === run.stops.length;
  return {step: run.finished.size + (complete ? 1 : 0), total, complete};
}

export type Verdict = {readonly passed: boolean; readonly attempts: number};

export type ArcadeBridge = {
  readonly stopDone: (stop: Stop) => void;
  readonly ended: () => void;
  /** True when the host grades this stop on the server; the lab then must not reveal or decide the answer. */
  readonly isGraded: (stop: Stop) => boolean;
  readonly submit: (stop: Stop, answer: LabAnswer, onVerdict: (verdict: Verdict) => void) => boolean;
};

/** Same-origin only: the Academy gateway serves Arcade Lab under /arcade-lab/. */
export function connectArcadeBridge(hub: MessageHub, parent: PostTarget, hostOrigin: string, lesson: Lesson): ArcadeBridge {
  let run = startRun(lesson);
  let bridge: LabBridge | null = null;
  let graded = new Set<StopId>();
  const waiting = new Map<StopId, (verdict: Verdict) => void>();
  const report = () => {
    const {step, total, complete} = runProgress(run);
    bridge?.progress(step, total);
    if (complete) bridge?.complete({outcome: 'completed'}, `${lesson.id}: ${run.finished.size}/${run.stops.length} checkpoints, end reached`);
  };
  bridge = connectLab(hub, parent, {
    allowedHostOrigins: [hostOrigin],
    onInit: init => {
      graded = new Set(init.gradedStops);
      report();
    },
    onVerdict: ({stopId, passed, attempts}) => {
      const deliver = waiting.get(stopId);
      if (!deliver) return;
      waiting.delete(stopId);
      deliver({passed, attempts});
    },
  });
  return {
    isGraded: stop => graded.has(stopIdOf(run, stop)),
    submit: (stop, answer, onVerdict) => {
      const stopId = stopIdOf(run, stop);
      if (!graded.has(stopId) || !bridge?.answer(stopId, answer)) return false;
      waiting.set(stopId, onVerdict);
      return true;
    },
    stopDone: stop => {
      run = finishStop(run, stop);
      report();
    },
    ended: () => {
      run = reachEnd(run);
      report();
    },
  };
}
