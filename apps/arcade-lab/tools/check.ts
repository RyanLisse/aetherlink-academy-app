/**
 * Headless smoke — import lessons, fold ops in Node, no Playwright.
 * Also secret-lints files[].text and evaluates stop.assert contracts.
 *
 *   pnpm run check
 */
import { LESSONS } from '../src/lessons/index.ts';
import { LessonSchema } from '../src/schema.ts';
import { evaluateLessonAsserts, foldLesson } from '../src/fold.ts';
import { connectArcadeBridge, finishStop, reachEnd, runProgress, startRun } from '../src/embed-bridge.ts';
import { getLesson } from '../src/lessons/index.ts';

const KEY_PATTERNS: RegExp[] = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:sk|rk|pk|api)[-_]live[-_][A-Za-z0-9]{16,}/i,
  /(?:sk|rk|pk)-ant-api\d{2}-[A-Za-z0-9_-]{20,}/i,
  /ANTHROPIC_API_KEY\s*=\s*['\"]?sk-/i,
  /AI_GATEWAY_API_KEY\s*=\s*['\"]?[A-Za-z0-9_-]{20,}/,
  /ghp_[A-Za-z0-9]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]{10,}/,
];

function lintSecrets(lessonId: string, files: { name: string; text: string }[]): string[] {
  const hits: string[] = [];
  for (const f of files) {
    for (const re of KEY_PATTERNS) {
      if (re.test(f.text)) hits.push(`${lessonId} file ${f.name} matched ${re}`);
    }
  }
  return hits;
}

const lines: string[] = [];
let failed = 0;

for (const lesson of LESSONS) {
  try {
    LessonSchema.parse(lesson);
    const secrets = lintSecrets(lesson.id, lesson.files);
    if (secrets.length) {
      failed++;
      lines.push(`SECRET ${lesson.id}: ${secrets.join('; ')}`);
      continue;
    }
    // Also lint intermediate folded file text at end (ops may inject)
    const state = foldLesson(lesson, lesson.duration);
    const endSecrets = lintSecrets(lesson.id + '@end', state.files);
    if (endSecrets.length) {
      failed++;
      lines.push(`SECRET ${lesson.id}@end: ${endSecrets.join('; ')}`);
      continue;
    }
    const asserts = evaluateLessonAsserts(lesson);
    if (!asserts.ok) {
      failed++;
      lines.push(`ASSERT ${lesson.id}: ${asserts.failures.join('; ')}`);
      continue;
    }
    const snap = state.files
      .map((f) => `${f.name}:${f.text.length}`)
      .join(',');
    lines.push(
      `ok    ${lesson.id} · ${Math.round(lesson.duration / 1000)}s · ${lesson.ops.length} ops · files[${snap}]`,
    );
  } catch (e) {
    failed++;
    lines.push(`ERROR ${lesson.id}: ${(e as Error).message}`);
  }
}

{
  const run = startRun(getLesson('sample-counter'));
  const endedEarly = runProgress(reachEnd(run));
  const done = runProgress(reachEnd(finishStop(run, run.stops[0]!)));
  const ok = endedEarly.step === 0 && endedEarly.total === 2 && !endedEarly.complete && done.step === 2 && done.total === 2 && done.complete;
  if (!ok) failed++;
  lines.push(`${ok ? 'ok   ' : 'EMBED'} embed-bridge · skipped checkpoint blocks completion ${JSON.stringify(endedEarly)} · all done ${JSON.stringify(done)}`);
}

{
  const lesson = getLesson('ws-2-eve-state');
  const listeners: ((event: { data: unknown; origin: string; source: unknown }) => void)[] = [];
  const posted: unknown[] = [];
  const parent = { postMessage: (message: unknown) => void posted.push(message) };
  const origin = 'https://academy.example';
  const bridge = connectArcadeBridge({ addEventListener: (_t, l) => void listeners.push(l), removeEventListener: () => {} }, parent, origin, lesson);
  const deliver = (data: unknown) => listeners.forEach((l) => l({ data, origin, source: parent }));
  deliver({ v: 1, type: 'init', minor: 1, labId: 'ws-2-eve-state', config: {}, locale: 'en', gradedStops: ['stop-2'] });
  const [first, second] = startRun(lesson).stops;
  const verdicts: string[] = [];
  const sent = [bridge.submit(second!, 0, () => verdicts.push('a')), bridge.submit(second!, 1, () => verdicts.push('b'))];
  bridge.cancel(second!);
  deliver({ v: 1, type: 'graded', labId: 'ws-2-eve-state', stopId: 'stop-2', passed: false, attempts: 1 });
  sent.push(bridge.submit(second!, 1, () => verdicts.push('c')));
  deliver({ v: 1, type: 'graded', labId: 'ws-2-eve-state', stopId: 'stop-2', passed: true, attempts: 2 });
  const ok = JSON.stringify(sent) === '[true,false,true]' && verdicts.join() === 'c' && !bridge.isGraded(first!) && bridge.isGraded(second!);
  if (!ok) failed++;
  lines.push(`${ok ? 'ok   ' : 'EMBED'} embed-bridge · one answer in flight per stop, cancel drops a late verdict ${JSON.stringify({ sent, verdicts })}`);
}

console.log(lines.join('\n'));
if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log(`\n${LESSONS.length} lessons folded cleanly`);
