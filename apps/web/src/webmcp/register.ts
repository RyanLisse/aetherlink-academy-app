import {toWebMcpTools, type ActionDescriptor, type RemoteActionInvoke} from '@academy/actions/web-mcp';
import type {ModelContextTool, NavigatorWithModelContext} from './types.ts';

export const PARTICIPANT_TOOL_NAMES = [
  'get_lesson',
  'get_current_slide',
  'get_screen_state',
  'get_assignment',
  'submit_evidence',
  'open_hint',
  'get_my_progress',
  'get_connection_state',
] as const;

/**
 * Register Academy participant tools on `navigator.modelContext` (W3C WebMCP).
 * Same names/schemas as the streamable HTTP MCP bridge via `toWebMcpTools`.
 */
export const registerWebMcpTools = async (options: {
  readonly descriptors: ReadonlyArray<ActionDescriptor>;
  readonly invoke: RemoteActionInvoke;
  readonly toolNames?: ReadonlyArray<string>;
}): Promise<{readonly registered: ReadonlyArray<string>; readonly supported: boolean}> => {
  const nav = navigator as NavigatorWithModelContext;
  if (!nav.modelContext?.registerTool) {
    return {registered: [], supported: false};
  }
  const allow = new Set(options.toolNames ?? PARTICIPANT_TOOL_NAMES);
  const selected = options.descriptors.filter((d) => allow.has(d.name));
  const tools = toWebMcpTools(selected, options.invoke);
  const registered: string[] = [];
  for (const tool of tools) {
    const webTool: ModelContextTool = {
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      execute: async (args) => tool.call(args),
    };
    await nav.modelContext.registerTool(webTool);
    registered.push(tool.name);
  }
  return {registered, supported: true};
};

export {toWebMcpTools};
export type {ActionDescriptor, RemoteActionInvoke};
