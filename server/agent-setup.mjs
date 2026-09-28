const quote = value => "'" + value.replaceAll("'", "'\\''") + "'";

const CLIENTS = new Set(["claude", "codex"]);
export function normalizeAgentClient(client) {
  const value = typeof client === "string" ? client.trim().toLowerCase() : "claude";
  return CLIENTS.has(value) ? value : null;
}

function mcpName(prefix, roomId, participantId) {
  return participantId
    ? `${prefix}-${roomId.slice(0, 8)}-${participantId.slice(0, 8)}`
    : `${prefix}-${roomId.slice(0, 8)}`;
}

function bearerEnvName(roomId, participantId) {
  const suffix = (participantId || "facilitator").replace(/[^a-zA-Z0-9]/g, "").slice(0, 12).toUpperCase() || "AGENT";
  return `ACADEMY_MCP_${roomId.slice(0, 8).toUpperCase()}_${suffix}`;
}

function claudeCommand({ origin, name, accessToken }) {
  return `claude mcp add --transport http --scope local ${name} ${quote(origin + "/mcp")} --header ${quote("Authorization: Bearer " + accessToken)}`;
}

function codexCommand({ origin, name, envName }) {
  return `codex mcp add ${name} --url ${quote(origin + "/mcp")} --bearer-token-env-var ${envName}`;
}

export function connectionHint(client) {
  if (client === "codex") {
    return "Codex reads the bearer from the named environment variable in the process that launches the Codex CLI or desktop app. Set it in that inherited environment before starting Codex; Academy never asks for OpenAI login credentials.";
  }
  return "Claude Code uses your existing Claude login. Paste the configuration command in your current project; claim a connection only after a successful get_mission tool call.";
}

export function facilitatorAgentInstructions({ origin, roomId, accessToken, client = "claude" }) {
  const resolved = normalizeAgentClient(client) || "claude";
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

export function agentInstructions({ origin, roomId, participantId, accessToken, client = "claude" }) {
  const resolved = normalizeAgentClient(client) || "claude";
  const name = mcpName("academy", roomId, participantId);
  if (resolved === "codex") {
    const envName = bearerEnvName(roomId, participantId);
    const command = codexCommand({ origin, name, envName });
    return `Verbind mijn eigen Codex met mijn AetherLink Academy-sessie.

Gebruik mijn bestaande Codex-login. Vraag geen OpenAI API-key en geen OpenAI-inloggegevens in Academy. Deze privé-instructie bevat tijdelijke Academy-toegang: zet die niet in de gedeelde intent, git, logs of een antwoord.

Zet deze omgevingsvariabele in de shell of desktop-startomgeving die Codex start (het Codex CLI/desktop-proces moet die erven):
export ${envName}=${quote(accessToken)}

Voer daarna lokaal deze configuratieopdracht uit:
${command}

Bestaat deze specifieke MCP-configuratie al? Vervang alleen ${name}, zonder andere MCP-servers te wijzigen. Deel de bearer niet via bestanden in git.

Roep get_mission aan op ${name}. Controleer session.roomId=${roomId} en session.participantId=${participantId}. Stop bij een mismatch (verkeerde kamer of rol): kopieer dan opnieuw vanuit deze Academy-sessie. Lees daarna get_document en zoek relevante uitleg met search_knowledge. Noem mijn deelnemernaam, squad, supportdag en rol ter bevestiging, zonder toegangssleutel te tonen.

Werk uitsluitend in deze squad. Citeer les-IDs bij uitleg. Geef eerst hints en laat mij zelf controleren. Bewaar bijdragen via submit_evidence en documentvoorstellen via suggest_document. Bouw en bewerk lessendecks (squad-presentaties én Wave-1 lesmateriaal) met list_decks, get_deck, create_deck, add_slide, update_slide, patch_deck en export_deck_html (één slide per aanroep, lees terug met get_deck voordat je een slide bewerkt). Effect Slide decks + deze MCP-tools zijn de les-authoring source of truth; gebruik geen Google Classroom-overlay, geen Google-presentatie-iframe en geen CLASSROOM_DECK_ID als teaching-pad. Facilitatoren pinnen een Effect-deck als Classroom-overlay voor de kamerdag; daarna toont Open Classroom de present-view /game/decks/:id/present. Pins promoten niet naar statische /classroom-routes — Cons/Jessy blijft SoT voor /classroom/{n} tot een dag in-app is hergeschreven. Verzin geen testuitvoer en accepteer niets namens een mens. Lees get_mission opnieuw bij een nieuwe opdracht: dag, rol en hulpkeuze kunnen veranderen. Claim pas een verbinding na een geslaagde toolaanroep.

Kun je geen lokale opdrachten uitvoeren? Vertel mij dat ik dit in Codex moet plakken. De Academy start geen model en neemt mijn Codex-account niet over. Bij verlopen toegang kopieer ik opnieuw vanuit mijn Academy-sessie.`;
  }
  const command = claudeCommand({ origin, name, accessToken });
  return `Verbind mijn eigen Claude Code met mijn AetherLink Academy-sessie.

Gebruik mijn bestaande Claude Code-login. Vraag geen Anthropic API-key en installeer geen andere software. Deze privé-instructie bevat tijdelijke Academy-toegang: zet die niet in de gedeelde intent, git, logs of een antwoord.

Voer lokaal in mijn huidige project deze configuratieopdracht uit:
${command}

Bestaat deze specifieke MCP-configuratie al? Vervang alleen ${name}, zonder andere MCP-servers te wijzigen. Gebruik scope local; deel de configuratie niet via .mcp.json.

Laad de MCP-koppeling via /mcp. Als deze lopende Claude-sessie nieuwe tools niet kan laden, vraag mij Claude Code één keer te herstarten in hetzelfde project en daarna te zeggen: “Ga verder met mijn Academy-sessie.” Claim pas een verbinding na een geslaagde toolaanroep.

Roep get_mission aan op ${name}. Controleer session.roomId=${roomId} en session.participantId=${participantId}. Stop bij een mismatch (verkeerde kamer of rol): kopieer dan opnieuw vanuit deze Academy-sessie. Lees daarna get_document en zoek relevante uitleg met search_knowledge. Noem mijn deelnemernaam, squad, supportdag en rol ter bevestiging, zonder toegangssleutel te tonen.

Werk uitsluitend in deze squad. Citeer les-IDs bij uitleg. Geef eerst hints en laat mij zelf controleren. Bewaar bijdragen via submit_evidence en documentvoorstellen via suggest_document. Bouw en bewerk lessendecks (squad-presentaties én Wave-1 lesmateriaal) met list_decks, get_deck, create_deck, add_slide, update_slide, patch_deck en export_deck_html (één slide per aanroep, lees terug met get_deck voordat je een slide bewerkt). Effect Slide decks + deze MCP-tools zijn de les-authoring source of truth; gebruik geen Google Classroom-overlay, geen Google-presentatie-iframe en geen CLASSROOM_DECK_ID als teaching-pad. Facilitatoren pinnen een Effect-deck als Classroom-overlay voor de kamerdag; daarna toont Open Classroom de present-view /game/decks/:id/present. Pins promoten niet naar statische /classroom-routes — Cons/Jessy blijft SoT voor /classroom/{n} tot een dag in-app is hergeschreven. Verzin geen testuitvoer en accepteer niets namens een mens. Lees get_mission opnieuw bij een nieuwe opdracht: dag, rol en hulpkeuze kunnen veranderen.

Kun je geen lokale opdrachten uitvoeren? Vertel mij dat ik dit in Claude Code moet plakken. De Academy start geen model en neemt mijn Claude-account niet over. Bij verlopen toegang kopieer ik opnieuw vanuit mijn Academy-sessie.`;
}
