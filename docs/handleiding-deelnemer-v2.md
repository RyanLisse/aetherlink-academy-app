# Handleiding voor deelnemers (v2) — Claude Code via MCP

Eén copy-paste blok om je eigen Claude Code te koppelen aan AetherLink Academy.
Geen Anthropic API-key in de browser. Geen modelaanroep vanuit de deelnemersview.

## Wat je nodig hebt

1. Browser-sessie als **deelnemer** in je squad (volg-view open).
2. Eigen Claude Code (terminal of VS Code), al ingelogd.
3. Publieke HTTPS Academy-URL (remote MCP), of lokale lab-URL voor oefenen.

## Verbindingstatus in de app

In de follow-view zie je MCP-status:

| Status | Betekenis |
|--------|-----------|
| **configured** | Instructie/token klaargezet |
| **connected** | Token uitgegeven / transport bereikbaar |
| **verified** | Minstens één geslaagde MCP-toolaanroep |

## Copy-paste: Claude Code koppelen

1. Open **Mijn leercoach** → **Claude Code verbinden**.
2. Klik **Maak MCP-token** (als deelnemer). Een nieuwe token trekt de vorige in.
3. Kopieer het gegenereerde blok (of plak onderstaande sjabloon met jouw waarden).

```sh
# Plak je persoonlijke token stil (komt niet in shell-history als je read -s gebruikt):
read -rs ACADEMY_TOKEN
export ACADEMY_TOKEN

# Streamable HTTP MCP (vervang ORIGIN door je Academy HTTPS-origin):
claude mcp add --transport http --scope local academy-SESSION \
  "$ACADEMY_ORIGIN/mcp" \
  --header "Authorization: Bearer $ACADEMY_TOKEN"

unset ACADEMY_TOKEN
```

`$ACADEMY_ORIGIN` is de publieke origin (bijv. `https://academy.example`).
De UI vult sessienaam, origin en header al in via **Claude Code koppelcommando**.

4. In Claude Code: `/mcp` → controleer dat de server connected is.
5. Roep `get_current_slide` aan. Die moet **dezelfde slide + revisie** tonen als je browser follow-view.
6. Bij twijfel: herstart Claude Code één keer in hetzelfde project en zeg “Ga verder met mijn Academy-sessie.”

## Beschikbare tools (action registry)

| Tool | Intent | Doel |
|------|--------|------|
| `get_lesson` | read | Vrijgegeven lesmetadata |
| `get_current_slide` | read | Slide in je browser (viewed + latest published revision) |
| `get_assignment` | read | Opdracht bij huidige slide |
| `submit_evidence` | **explicit** | Bewijs indienen (menselijke bevestiging in browser; boolean van model ≠ consent) |
| `open_hint` | read | Hint openen op index |
| `get_my_progress` | read | Eigen voortgang |
| `get_connection_state` | read | configured / connected / verified |

**Legacy (blijven tot migratie):** `get_mission`, `get_document`, `search_knowledge`, `submit_evidence`, `suggest_document`.

## Regels (kort)

- Context is gebonden aan jou, je squad en je browsertab (KTD5). Twee tabs met verschillende slides → MCP vraagt om te kiezen, pikt geen stilzwijgende winnaar.
- Niet-vrijgegeven lessen: zelfde denial via MCP én HTTP (`404` / `lesson_locked` / `Lesson not found.`).
- Token intrekken in de UI → volgende MCP-call faalt; opnieuw verbinden vereist een nieuwe token.
- Geen ruwe coaching-transcripts in Academy (KTD13).

## Lab zonder live Claude Code

Voor CI / verificatie zonder Claude Code-abonnement: start de MCP lab fixture
(`apps/server/src/mcp/lab-server.ts`) en draai `apps/server/test/mcp/remote-mcp.test.ts`.
Die fixture bewijst token-auth, revoke, unreleased denial-pariteit en slide-parity met `/lab/browser-view`.
