import {Effect, Layer} from 'effect';
import {McpServer} from '@modelcontextprotocol/server';
import {z} from 'zod';
import {
  AmbiguousViewContext,
  CallerResolver,
  ConfirmationStore,
  LessonNotReleased,
  lockedLessonDenialBody,
  registry,
  toMcpTools,
  type ActionRegistry,
} from '@academy/actions';

export const PARTICIPANT_MCP_TOOLS = [
  'get_lesson',
  'get_current_slide',
  'get_screen_state',
  'get_assignment',
  'submit_evidence',
  'open_hint',
  'get_my_progress',
  'get_connection_state',
] as const;

export const LEGACY_MCP_TOOLS = [
  'get_mission',
  'get_document',
  'search_knowledge',
  'submit_evidence',
  'suggest_document',
] as const;

const Empty = z.object({}).passthrough();

const inputSchemas: Record<string, z.ZodType> = {
  get_lesson: z.object({lessonId: z.string()}),
  get_current_slide: Empty,
  get_screen_state: Empty,
  get_assignment: z.object({assignmentId: z.string().optional()}),
  submit_evidence: z.object({
    requestId: z.string().min(1).max(100),
    finding: z.string().min(1).max(4000),
    command: z.string().min(1).max(1000),
    observed: z.string().min(1).max(4000),
    limitation: z.string().min(1).max(4000),
    lessonId: z.string().optional(),
  }),
  open_hint: z.object({
    assignmentId: z.string().optional(),
    index: z.number().int().min(0),
  }),
  get_my_progress: Empty,
  get_connection_state: Empty,
  get_mission: Empty,
  get_document: Empty,
  search_knowledge: z.object({query: z.string().max(200).default('')}),
  suggest_document: z.object({
    requestId: z.string().min(1).max(100),
    quote: z.string().min(1).max(4000),
    content: z.string().min(1).max(4000),
  }),
};

const bearerFromCtx = (ctx: {http?: {req?: {headers?: {get?: (name: string) => string | null}}}}): string => {
  const auth = ctx.http?.req?.headers?.get?.('authorization') || '';
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  return m?.[1] ?? '';
};

const asText = (value: unknown) => ({content: [{type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2)}]});

const unwrapCause = (error: unknown): unknown => {
  if (!error || typeof error !== 'object') return error;
  if ('_tag' in error && (error as {_tag: string})._tag === 'ActionRunFailed' && 'cause' in error) {
    return (error as {cause: unknown}).cause;
  }
  if ('cause' in error && (error as {cause: unknown}).cause) return unwrapCause((error as {cause: unknown}).cause);
  return error;
};

const formatError = (error: unknown): {content: Array<{type: 'text'; text: string}>; isError: true} => {
  const cause = unwrapCause(error);
  if (cause instanceof LessonNotReleased || (cause && typeof cause === 'object' && (cause as {_tag?: string})._tag === 'LessonNotReleased')) {
    return {content: [{type: 'text', text: JSON.stringify(lockedLessonDenialBody())}], isError: true};
  }
  if (cause instanceof AmbiguousViewContext) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: {
              code: 'ambiguous_view_context',
              message: cause.message,
              sessions: cause.sessions.map((s) => ({
                browserSessionId: s.browserSessionId,
                lessonId: s.lessonId,
                slideIndex: s.slideIndex,
                viewedRevision: s.viewedRevision,
              })),
            },
          }),
        },
      ],
      isError: true,
    };
  }
  if (cause instanceof Error) return {content: [{type: 'text', text: cause.message}], isError: true};
  return {content: [{type: 'text', text: JSON.stringify(cause)}], isError: true};
};

export interface CreateAcademyMcpOptions {
  readonly actionRegistry?: ActionRegistry<unknown>;
  readonly dependencies: Layer.Layer<CallerResolver | ConfirmationStore | unknown>;
  readonly confirmationHeader?: string;
}

export const createAcademyMcpServer = (options: CreateAcademyMcpOptions): McpServer => {
  const actionRegistry = options.actionRegistry ?? (registry as ActionRegistry<unknown>);
  const tools = toMcpTools(actionRegistry);
  const byName = new Map(tools.map((t) => [t.name, t]));
  const server = new McpServer({name: 'aetherlink-academy', version: '0.3.0'});
  const confirmationHeader = options.confirmationHeader ?? 'x-confirmation-token';

  for (const name of Object.keys(inputSchemas)) {
    const tool = byName.get(name);
    if (!tool) continue;
    const schema = inputSchemas[name]!;
    server.registerTool(name, {description: tool.description, inputSchema: schema}, async (args, ctx) => {
      const token = bearerFromCtx(ctx as never);
      const confirmationToken =
        (ctx as {http?: {req?: {headers?: {get?: (n: string) => string | null}}}}).http?.req?.headers?.get?.(
          confirmationHeader,
        ) || undefined;
      const exit = await Effect.runPromise(
        Effect.result(
          Effect.provide(
            tool.call({token, payload: args ?? {}, confirmationToken}) as Effect.Effect<
              unknown,
              unknown,
              CallerResolver | ConfirmationStore
            >,
            options.dependencies as Layer.Layer<CallerResolver | ConfirmationStore>,
          ) as Effect.Effect<unknown, unknown>,
        ),
      );
      if (exit._tag === 'Failure') return formatError(exit.failure);
      return asText(exit.success);
    });
  }

  return server;
};
