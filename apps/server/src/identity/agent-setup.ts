/** Port of server/agent-setup.mjs — behaviour preserved. */

const quote = (value: string): string => "'" + value.replaceAll("'", "'\\''") + "'";

export function agentInstructions(input: {
  readonly origin: string;
  readonly roomId: string;
  readonly participantId: string;
  readonly accessToken: string;
}): string {
  const {origin, roomId, participantId, accessToken} = input;
  const name = `academy-${roomId.slice(0, 8)}-${participantId.slice(0, 8)}`;
  const command = `claude mcp add --transport http --scope local ${name} ${quote(origin + '/mcp')} --header ${quote('Authorization: Bearer ' + accessToken)}`;
  return `Connect my own Claude Code to my AetherLink Academy session.

Use my existing Claude Code login. Do not ask for an Anthropic API key and do not install other software. This private instruction contains temporary Academy access: do not put it in shared intent, git, logs, or a reply.

Run this configuration command locally in my current project:
${command}

If this specific MCP configuration already exists, replace only ${name}, without changing other MCP servers. Use scope local; do not share the configuration via .mcp.json.

Load the MCP link via /mcp. If this running Claude session cannot load new tools, ask me to restart Claude Code once in the same project and then say: "Continue with my Academy session." Only claim a connection after a successful tool call.

Call get_mission on ${name}. Check session.roomId=${roomId} and session.participantId=${participantId}. Stop on a mismatch. Then read get_document and find relevant explanation with search_knowledge. Confirm my participant name, squad, support day and role, without showing the access key.

Work only in this squad. Cite lesson IDs when explaining. Give hints first and let me check myself. Save contributions via submit_evidence and document proposals via suggest_document; build squad presentations with list_decks, get_deck, create_deck, add_slide, update_slide, patch_deck and export_deck_html (one slide per call, read back with get_deck before editing a slide); do not invent test output and do not accept anything on behalf of a human. Read get_mission again on a new assignment: day, role and help choice can change.

If you cannot run local commands, tell me to paste this into Claude Code. Academy does not start a model and does not take over my Claude account. When access expires I copy again from my Academy session.`;
}
