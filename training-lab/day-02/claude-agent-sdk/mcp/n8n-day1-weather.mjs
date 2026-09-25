/**
 * Day-1 n8n weather agent as an MCP-shaped tool stand-in (AET-37).
 *
 * Classroom path:
 * 1. Keep day-1 weather-agent.json node names (Webhook → … → Draft Message).
 * 2. In n8n, add an MCP Server Trigger that exposes the same Get Weather /
 *    decideWeather contract to Claude Agent SDK via MCP.
 * 3. Until Cloud MCP is wired, this module calls the training-lab weather mock
 *    with the identical decideWeather helper — same fixture, same decision.
 *
 * Does not claim a live n8n MCP Server Trigger session.
 */
import { decideWeather, fetchWeatherDecision } from "../../../day-01/starter/weather-agent.mjs";

export const mcpToolName = "n8n_day1_weather";
export const mcpToolDescription =
  "Call the day-1 n8n weather agent contract (Get Weather + IF Decision) via MCP stand-in.";

export const inputSchema = {
  type: "object",
  required: ["city", "date", "baseUrl"],
  properties: {
    city: { type: "string", description: "Weather Input city" },
    date: { type: "string", description: "Weather Input date (YYYY-MM-DD)" },
    baseUrl: { type: "string", description: "training-lab weather mock base URL" },
  },
};

export async function callN8nDay1Weather({ city, date, baseUrl }) {
  const result = await fetchWeatherDecision({ baseUrl, city, date });
  return {
    tool: mcpToolName,
    source: "day-01/starter/weather-agent.mjs (n8n contract stand-in)",
    stepNames: ["Weather Input", "Get Weather", "Weather Agent", "IF Decision", "Draft Message"],
    weather: result.weather,
    decision: result.decision,
    draft_only: true,
    human_approval_required: true,
    decideWeather,
  };
}
