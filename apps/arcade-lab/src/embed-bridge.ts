import {connectLab, type LabBridge, type MessageHub, type PostTarget} from '@academy/lab-embed';
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

export function runProgress(run: LessonRun): {step: number; total: number; complete: boolean} {
  const total = run.stops.length + 1;
  const complete = run.ended && run.finished.size === run.stops.length;
  return {step: run.finished.size + (complete ? 1 : 0), total, complete};
}

export type ArcadeBridge = {readonly stopDone: (stop: Stop) => void; readonly ended: () => void};

/** Same-origin only: the Academy gateway serves Arcade Lab under /arcade-lab/. */
export function connectArcadeBridge(hub: MessageHub, parent: PostTarget, hostOrigin: string, lesson: Lesson): ArcadeBridge {
  let run = startRun(lesson);
  let bridge: LabBridge | null = null;
  const report = () => {
    const {step, total, complete} = runProgress(run);
    bridge?.progress(step, total);
    if (complete) bridge?.complete({outcome: 'completed'}, `${lesson.id}: ${run.finished.size}/${run.stops.length} checkpoints, end reached`);
  };
  bridge = connectLab(hub, parent, {allowedHostOrigins: [hostOrigin], onInit: report});
  return {
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
