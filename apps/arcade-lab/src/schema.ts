import { z } from 'zod';

/** Optional auto-grade contract on a checkpoint (Phase 2). */
export const AssertSchema = z
  .object({
    file: z.string().min(1),
    includes: z.string().optional(),
    regex: z.string().optional(),
  })
  .refine((v) => v.includes !== undefined || v.regex !== undefined, {
    message: 'assert requires includes or regex',
  });

export const StopSchema = z.object({
  title: z.string(),
  q: z.string(),
  options: z.array(z.string()).optional(),
  correct: z.number().int().optional(),
  explain: z.string().optional(),
  assert: AssertSchema.optional(),
});

export const OpSchema = z
  .object({ t: z.number() })
  .and(
    z.union([
      z.object({ f: z.number(), p: z.number(), d: z.number(), i: z.string() }),
      z.object({ c: z.number() }),
      z.object({ tab: z.number() }),
      z.object({ say: z.string() }),
      z.object({ out: z.string(), cls: z.string().optional() }),
      z.object({ clear: z.literal(true) }),
      z.object({ chapter: z.string() }),
      z.object({ stop: StopSchema }),
    ]),
  );

export const FileSchema = z.object({
  name: z.string().min(1),
  text: z.string(),
});

export const LessonSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  kind: z.enum(['web', 'trace']),
  files: z.array(FileSchema).min(1),
  ops: z.array(OpSchema),
  duration: z.number().nonnegative(),
  audio: z.string().nullable().optional(),
  builtin: z.boolean().optional(),
  createdAt: z.string().optional(),
});

export type Assert = z.infer<typeof AssertSchema>;
export type Stop = z.infer<typeof StopSchema>;
export type Op = z.infer<typeof OpSchema>;
export type LessonFile = z.infer<typeof FileSchema>;
export type Lesson = z.infer<typeof LessonSchema>;

export type TraceLine = { out: string; cls?: string };

export type WorkspaceState = {
  files: LessonFile[];
  tab: number;
  caret: number | null;
  caption: string;
  trace: TraceLine[];
  /** Last stop hit at or before t (if any). */
  stop: Stop | null;
  t: number;
};
