const quote=value=>"'"+value.replaceAll("'","'\\''")+"'";
export function facilitatorAgentInstructions({origin,roomId,accessToken}) {
 const name=`academy-facilitator-${roomId.slice(0,8)}`;
 const command=`claude mcp add --transport http --scope local ${name} ${quote(origin+'/mcp')} --header ${quote('Authorization: Bearer '+accessToken)}`;
 return `Connect my own Claude Code as facilitator to my AetherLink Academy room.

Use my existing Claude Code login. Do not ask for an Anthropic API key. This private instruction contains temporary room access; do not put it in shared intent, git, logs, or a reply.

Run this configuration command locally in my current project:
${command}

If this exact MCP configuration already exists, replace only ${name}. Use local scope and do not share the configuration through .mcp.json. Load the connection with /mcp; restart Claude Code once in this project if the tools do not appear.

Call get_mission on ${name} and verify session.roomId=${roomId} and session.role=facilitator. Work only in this room. Use list_decks, get_deck, create_deck, add_slide, update_slide, patch_deck, and export_deck_html for squad decks. Call pin_classroom_deck only when an explicit facilitator instruction asks to show a deck for the classroom day; this changes the active Classroom overlay. Do not ask participants for access tokens or submit evidence on their behalf. Speaker notes on facilitator-owned decks are private; do not repeat them to participants. Claim a connection only after a successful MCP tool call.

Academy does not start a model or take over my Claude account. When access expires, I will copy this instruction again from my facilitator room session.`;
}

export function agentInstructions({origin,roomId,participantId,accessToken}) {
 const name=`academy-${roomId.slice(0,8)}-${participantId.slice(0,8)}`;
 const command=`claude mcp add --transport http --scope local ${name} ${quote(origin+'/mcp')} --header ${quote('Authorization: Bearer '+accessToken)}`;
 return `Verbind mijn eigen Claude Code met mijn AetherLink Academy-sessie.

Gebruik mijn bestaande Claude Code-login. Vraag geen Anthropic API-key en installeer geen andere software. Deze privé-instructie bevat tijdelijke Academy-toegang: zet die niet in de gedeelde intent, git, logs of een antwoord.

Voer lokaal in mijn huidige project deze configuratieopdracht uit:
${command}

Bestaat deze specifieke MCP-configuratie al? Vervang alleen ${name}, zonder andere MCP-servers te wijzigen. Gebruik scope local; deel de configuratie niet via .mcp.json.

Laad de MCP-koppeling via /mcp. Als deze lopende Claude-sessie nieuwe tools niet kan laden, vraag mij Claude Code één keer te herstarten in hetzelfde project en daarna te zeggen: “Ga verder met mijn Academy-sessie.” Claim pas een verbinding na een geslaagde toolaanroep.

Roep get_mission aan op ${name}. Controleer session.roomId=${roomId} en session.participantId=${participantId}. Stop bij een mismatch. Lees daarna get_document en zoek relevante uitleg met search_knowledge. Noem mijn deelnemernaam, squad, supportdag en rol ter bevestiging, zonder toegangssleutel te tonen.

Werk uitsluitend in deze squad. Citeer les-IDs bij uitleg. Geef eerst hints en laat mij zelf controleren. Bewaar bijdragen via submit_evidence en documentvoorstellen via suggest_document. Bouw en bewerk lessendecks (squad-presentaties én Wave-1 lesmateriaal) met list_decks, get_deck, create_deck, add_slide, update_slide, patch_deck en export_deck_html (één slide per aanroep, lees terug met get_deck voordat je een slide bewerkt). Effect Slide decks + deze MCP-tools zijn de les-authoring source of truth; gebruik geen Google Classroom-overlay, geen Google-presentatie-iframe en geen CLASSROOM_DECK_ID als teaching-pad. Facilitatoren pinnen een Effect-deck als Classroom-overlay voor de kamerdag; daarna toont Open Classroom de present-view /game/decks/:id/present. Pins promoten niet naar statische /classroom-routes — Cons/Jessy blijft SoT voor /classroom/{n} tot een dag in-app is hergeschreven. Verzin geen testuitvoer en accepteer niets namens een mens. Lees get_mission opnieuw bij een nieuwe opdracht: dag, rol en hulpkeuze kunnen veranderen.

Kun je geen lokale opdrachten uitvoeren? Vertel mij dat ik dit in Claude Code moet plakken. De Academy start geen model en neemt mijn Claude-account niet over. Bij verlopen toegang kopieer ik opnieuw vanuit mijn Academy-sessie.`;
}
