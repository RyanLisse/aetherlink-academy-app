/** Minimal W3C WebMCP surface (webmcp-types). */
export interface ModelContextTool {
  readonly name: string;
  readonly description?: string;
  readonly inputSchema?: unknown;
  execute: (args: unknown) => Promise<unknown>;
}

export interface ModelContext {
  registerTool: (tool: ModelContextTool) => void | Promise<void>;
  unregisterTool?: (name: string) => void | Promise<void>;
}

export type NavigatorWithModelContext = Navigator & {
  readonly modelContext?: ModelContext;
};

export type McpConnectionState = 'configured' | 'connected' | 'verified';
