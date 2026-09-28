/** Port of server/agent-setup.mjs — behaviour preserved. */

const quote = (value: string): string => "'" + value.replaceAll("'", "'\\''") + "'";

const CLIENTS = new Set(["claude", "codex"] as const);
export type AgentClient = "claude" | "codex";

export function normalizeAgentClient(client: unknown): AgentClient | null {
  const value = typeof client === "string" ? client.trim().toLowerCase() : "claude";
  return CLIENTS.has(value as AgentClient) ? (value as AgentClient) : null;
}

function mcpName(prefix: string, roomId: string, participantId?: string): string {
  return participantId
    ? `${prefix}-${roomId.slice(0, 8)}-${participantId.slice(0, 8)}`
    : `${prefix}-${roomId.slice(0, 8)}`;
}

function bearerEnvName(roomId: string, participantId?: string): string {
  const suffix = (participantId || "facilitator").replace(/[^a-zA-Z0-9]/g, "").slice(0, 12).toUpperCase() || "AGENT";
  return `ACADEMY_MCP_${roomId.slice(0, 8).toUpperCase()}_${suffix}`;
}

function claudeCommand(input: { origin: string; name: string; accessToken: string }): string {
  return `claude mcp add --transport http --scope local ${input.name} ${quote(input.origin + "/mcp")} --header ${quote("Authorization: Bearer " + input.accessToken)}`;
}

function codexCommand(input: { origin: string; name: string; envName: string }): string {
  return `codex mcp add ${input.name} --url ${quote(input.origin + "/mcp")} --bearer-token-env-var ${input.envName}`;
}

export function connectionHint(client: AgentClient): string {
  if (client === "codex") {
    return "Codex reads the bearer from the named environment variable in the process that launches the Codex CLI or desktop app. Set it in that inherited environment before starting Codex; Academy never asks for OpenAI login credentials.";
  }
  return "Claude Code uses your existing Claude login. Paste the configuration command in your current project; claim a connection only after a successful get_mission tool call.";
}

export function facilitatorAgentInstructions(input: {
  readonly origin: string;
  readonly roomId: string;
  readonly accessToken: string;
  readonly client?: AgentClient | string;
}): string {
  const { origin, roomId, accessToken } = input;
  const resolved = normalizeAgentClient(input.client) || "claude";
  const name = mcpName("academy-facilitator", roomId);
  if (resolved === "codex") {
    const envName = bearerEnvName(roomId, "facilitator");
    const command = codexCommand({ origin, name, envName });
    return `Connect my own Codex as facilitator to my AetherLink Academy room.

Use my existing Codex login. Do not ask for OpenAI API keys or OpenAI account credentials in Academy. This private instruction contains temporary room access; do not put it in shared intent, git, logs, or a reply.

Set this environment variable in the shell or desktop launch environment that will start Codex (the CLI/desktop process must inherit it):
export ${envName}=${quote(accessToken)}

Then run this configuration command locally:
${command}

If this exact MCP configuration already exists, replace only ${name}. Do not share the bearer token via config files committed to git. Restart Codex once if the tools do not appear after adding the server.

Call get_mission on ${name} and verify session.roomId=${roomId} and session.role=facilitator. Work only in this room. Use list_decks, get_deck, create_deck, add_slide, update_slide, patch_deck, and export_deck_html for squad decks. Call pin_classroom_deck only when an explicit facilitator instruction asks to show a deck for the classroom day; this changes the active Classroom overlay. Do not ask participants for access tokens or submit evidence on their behalf. Speaker notes on facilitator-owned decks are private; do not repeat them to participants. Claim a connection only after a successful MCP tool call. A wrong-room or wrong-role get_mission result means the wrong token or room — stop and copy a fresh setup from this Academy room.

Academy does not start a model or take over my Codex account. When access expires, I will copy this instruction again from my facilitator room session.`;
  }
  const command = claudeCommand({ origin, name, accessToken });
  return `Connect my own Claude Code as facilitator to my AetherLink Academy room.

Use my existing Claude Code login. Do not ask for an Anthropic API key. This private instruction contains temporary room access; do not put it in shared intent, git, logs, or a reply.

Run this configuration command locally in my current project:
${command}

If this exact MCP configuration already exists, replace only ${name}. Use local scope and do not share the configuration through .mcp.json. Load the connection with /mcp; restart Claude Code once in this project if the tools do not appear.

Call get_mission on ${name} and verify session.roomId=${roomId} and session.role=facilitator. Work only in this room. Use list_decks, get_deck, create_deck, add_slide, update_slide, patch_deck, and export_deck_html for squad decks. Call pin_classroom_deck only when an explicit facilitator instruction asks to show a deck for the classroom day; this changes the active Classroom overlay. Do not ask participants for access tokens or submit evidence on their behalf. Speaker notes on facilitator-owned decks are private; do not repeat them to participants. Claim a connection only after a successful MCP tool call. A wrong-room or wrong-role get_mission result means the wrong token or room — stop and copy a fresh setup from this Academy room.

Academy does not start a model or take over my Claude account. When access expires, I will copy this instruction again from my facilitator room session.`;
}

export function agentInstructions(input: {
  readonly origin: string;
  readonly roomId: string;
  readonly participantId: string;
  readonly accessToken: string;
  readonly client?: AgentClient | string;
}): string {
  const { origin, roomId, participantId, accessToken } = input;
  const resolved = normalizeAgentClient(input.client) || "claude";
  const name = mcpName("academy", roomId, participantId);
  if (resolved === "codex") {
    const envName = bearerEnvName(roomId, participantId);
    const command = codexCommand({ origin, name, envName });
    return `Connect my own Codex to my AetherLink Academy session.

Use my existing Codex login. Do not ask for an OpenAI API key or OpenAI account credentials in Academy. This private instruction contains temporary Academy access: do not put it in shared intent, git, logs, or a reply.

Set this environment variable in the shell or desktop launch environment that will start Codex (the Codex CLI/desktop process must inherit it):
export ${envName}=${quote(accessToken)}

Then run this configuration command locally:
${command}

If this specific MCP configuration already exists, replace only ${name}, without changing other MCP servers. Do not share the bearer via files in git.

Call get_mission on ${name}. Check session.roomId=${roomId} and session.participantId=${participantId}. Stop on a mismatch (wrong room or role): copy a fresh setup from this Academy session. Then read get_document and find relevant explanation with search_knowledge. Confirm my participant name, squad, support day and role, without showing the access key.

Work only in this squad. Cite lesson IDs when explaining. Give hints first and let me check myself. Save contributions via submit_evidence and document proposals via suggest_document. Build and edit lesson decks (squad presentations and Wave-1 lesson material) with list_decks, get_deck, create_deck, add_slide, update_slide, patch_deck and export_deck_html (one slide per call, read back with get_deck before editing a slide). Effect Slide decks + these MCP tools are the lesson-authoring source of truth; do not use a Google Classroom overlay, a Google presentation iframe, or CLASSROOM_DECK_ID as the teaching path. Facilitators pin an Effect deck as Classroom overlay for the room day; Open Classroom then shows the present view /game/decks/:id/present. Pins do not promote to static /classroom routes — Cons/Jessy remains SoT for /classroom/{n} until a day is re-authored in-app. Do not invent test output and do not accept anything on behalf of a human. Read get_mission again on a new assignment: day, role and help choice can change. Only claim a connection after a successful tool call.

If you cannot run local commands, tell me to paste this into Codex. Academy does not start a model and does not take over my Codex account. When access expires I copy again from my Academy session.`;
  }
  const command = claudeCommand({ origin, name, accessToken });
  return `Connect my own Claude Code to my AetherLink Academy session.

Use my existing Claude Code login. Do not ask for an Anthropic API key and do not install other software. This private instruction contains temporary Academy access: do not put it in shared intent, git, logs, or a reply.

Run this configuration command locally in my current project:
${command}

If this specific MCP configuration already exists, replace only ${name}, without changing other MCP servers. Use scope local; do not share the configuration via .mcp.json.

Load the MCP link via /mcp. If this running Claude session cannot load new tools, ask me to restart Claude Code once in the same project and then say: "Continue with my Academy session." Only claim a connection after a successful tool call.

Call get_mission on ${name}. Check session.roomId=${roomId} and session.participantId=${participantId}. Stop on a mismatch (wrong room or role): copy a fresh setup from this Academy session. Then read get_document and find relevant explanation with search_knowledge. Confirm my participant name, squad, support day and role, without showing the access key.

Work only in this squad. Cite lesson IDs when explaining. Give hints first and let me check myself. Save contributions via submit_evidence and document proposals via suggest_document. Build and edit lesson decks (squad presentations and Wave-1 lesson material) with list_decks, get_deck, create_deck, add_slide, update_slide, patch_deck and export_deck_html (one slide per call, read back with get_deck before editing a slide). Effect Slide decks + these MCP tools are the lesson-authoring source of truth; do not use a Google Classroom overlay, a Google presentation iframe, or CLASSROOM_DECK_ID as the teaching path. Facilitators pin an Effect deck as Classroom overlay for the room day; Open Classroom then shows the present view /game/decks/:id/present. Pins do not promote to static /classroom routes — Cons/Jessy remains SoT for /classroom/{n} until a day is re-authored in-app. Do not invent test output and do not accept anything on behalf of a human. Read get_mission again on a new assignment: day, role and help choice can change.

If you cannot run local commands, tell me to paste this into Claude Code. Academy does not start a model and does not take over my Claude account. When access expires I copy again from my Academy session.`;
}
