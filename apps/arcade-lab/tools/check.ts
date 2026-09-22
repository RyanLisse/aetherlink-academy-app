/**
 * Headless smoke — import lessons, fold ops in Node, no Playwright.
 * Also secret-lints files[].text and evaluates stop.assert contracts.
 *
 *   pnpm run check
 */
import { LESSONS } from '../src/lessons/index.ts';
import { LessonSchema } from '../src/schema.ts';
import { evaluateLessonAsserts, foldLesson } from '../src/fold.ts';

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

console.log(lines.join('\n'));
if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log(`\n${LESSONS.length} lessons folded cleanly`);
