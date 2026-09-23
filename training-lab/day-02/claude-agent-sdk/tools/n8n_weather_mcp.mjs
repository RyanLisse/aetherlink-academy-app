/** Agent SDK tool wrapper around the day-1 n8n MCP stand-in. */
export {
  callN8nDay1Weather as execute,
  mcpToolName as name,
  mcpToolDescription as description,
  inputSchema,
} from "../mcp/n8n-day1-weather.mjs";
