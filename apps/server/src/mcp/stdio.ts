#!/usr/bin/env node
/**
 * Local stdio MCP entry. Forwards tools to the Academy HTTP `/game/mcp/:tool` bridge
 * (legacy) so Claude Code can run without streamable HTTP in constrained environments.
 * Primary path remains streamable HTTP `/mcp` (see http.ts).
 */
import {serveStdio} from '@modelcontextprotocol/server/stdio';
import {McpServer} from '@modelcontextprotocol/server';
import {z} from 'zod';

const base = process.env.ACADEMY_URL || 'http://127.0.0.1:4317';
const token = process.env.ACADEMY_TOKEN;
if (!token) {
  console.error('ACADEMY_TOKEN ontbreekt. Maak een persoonlijke MCP-token in Mijn leercoach.');
  process.exit(1);
}

const call = async (tool: string, args: unknown) => {
  const response = await fetch(`${base}/game/mcp/${tool}`, {
    method: 'POST',
    headers: {authorization: `Bearer ${token}`, 'content-type': 'application/json'},
    body: JSON.stringify(args ?? {}),
    signal: AbortSignal.timeout(25000),
  });
  const data = await response.json();
  if (!response.ok) throw Error((data as {error?: string}).error || 'Gameverzoek mislukt.');
  return data;
};

const invoke = (name: string, args: unknown) =>
  call(name, args)
    .then((data) => ({content: [{type: 'text' as const, text: JSON.stringify(data, null, 2)}]}))
    .catch((e: Error) => ({content: [{type: 'text' as const, text: e.message}], isError: true as const}));

serveStdio(() => {
  const server = new McpServer({name: 'aetherlink-academy', version: '0.3.0'});
  const Empty = z.object({}).passthrough();
  server.registerTool('get_lesson', {description: 'Read a released lesson.', inputSchema: z.object({lessonId: z.string()})}, (a) => invoke('get_lesson', a));
  server.registerTool('get_current_slide', {description: 'Current slide in the browser follow view.', inputSchema: Empty}, (a) => invoke('get_current_slide', a));
  server.registerTool('get_assignment', {description: 'Assignment for the current slide.', inputSchema: z.object({assignmentId: z.string().optional()})}, (a) => invoke('get_assignment', a));
  server.registerTool('submit_evidence', {description: 'Submit observed evidence (explicit intent).', inputSchema: z.object({requestId: z.string(), finding: z.string(), command: z.string(), observed: z.string(), limitation: z.string(), lessonId: z.string().optional()})}, (a) => invoke('submit_evidence', a));
  server.registerTool('open_hint', {description: 'Open one assignment hint by index.', inputSchema: z.object({assignmentId: z.string().optional(), index: z.number().int().min(0)})}, (a) => invoke('open_hint', a));
  server.registerTool('get_my_progress', {description: 'Own progress in this squad.', inputSchema: Empty}, (a) => invoke('get_my_progress', a));
  server.registerTool('get_connection_state', {description: 'MCP connection state: configured|connected|verified.', inputSchema: Empty}, (a) => invoke('get_connection_state', a));
  server.registerTool('get_mission', {description: 'Legacy: mission and role.', inputSchema: Empty}, (a) => invoke('get_mission', a));
  server.registerTool('get_document', {description: 'Legacy: shared Proof intent.', inputSchema: Empty}, (a) => invoke('get_document', a));
  server.registerTool('search_knowledge', {description: 'Legacy: search curriculum lessons.', inputSchema: z.object({query: z.string().max(200).default('')})}, (a) => invoke('search_knowledge', a));
  server.registerTool('suggest_document', {description: 'Legacy: propose Proof replacement (explicit).', inputSchema: z.object({requestId: z.string(), quote: z.string(), content: z.string()})}, (a) => invoke('suggest_document', a));
  return server;
});
