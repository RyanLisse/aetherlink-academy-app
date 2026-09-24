# Remote MCP

Each participant connects their own Claude Code to the squad through a personal MCP configuration (URL plus bearer token); their agent reads the mission and Proof document, searches the curriculum, submits evidence and suggests document changes, all attributed and human-reviewed.

## Sub-features

- `mcp-config` the squad room shows `Personal MCP configuration` with the `/mcp` URL and a token; `POST /game/mcp-token` rotates it.
- `mcp-tools` the gateway `/mcp` (server `aetherlink-academy` 0.2.0) exposes `get_mission`, `get_document`, `search_knowledge`, `submit_evidence`, `suggest_document`, `list_decks`, `get_deck`, `create_deck`, `add_slide`, `update_slide`, `patch_deck`, `export_deck_html`.
- `mcp-auth` a missing, rotated or foreign token is rejected with 401.
- `mcp-attribution` `submit_evidence` lands as a pending review item under the participant's name (see proof-evidence-review.md).
- `mcp-coach` `My learning coach` shows `Last successful MCP call: <time>` after a call.

## How to get to it (user POV)

- Participant opens `My learning coach` or the squad room and copies `Personal MCP configuration` into Claude Code.
- A real MCP client connects over Streamable HTTP to `http://127.0.0.1:4731/mcp` with `Authorization: Bearer <token>`.

## Driving it with Playwright

Preconditions:

- A squad with at least one participant (squad-room.md). The participant's token copied from `Personal MCP configuration` in their browser context; keep it in a variable, never in evidence.

- **Unauthenticated.** `curl -s -o /dev/null -w '%{http_code}' -X POST http://127.0.0.1:4731/mcp`. Prints `401`.
- **List tools.** Use `@modelcontextprotocol/client` (root dependency) with a Streamable HTTP transport and the bearer header; call `listTools`. The 12 names above are returned.
- **Read mission.** `callTool('get_mission')`. The result names the squad, the participant and a `Driver` or `Navigator` role.
- **Submit evidence.** `callTool('submit_evidence', {requestId, finding, command, observed, limitation})`. Then in the facilitator's browser context, `Review & handoff` lists it as `Awaiting review` under the participant.
- **Rotation.** Rotate the token from the participant UI, then repeat `get_mission` with the old token. 401.
- **Coach read-back.** Participant `My learning coach` shows `Last successful MCP call:`.
- **Proof.** Redacted transcript (tool names, status codes, result excerpts with the token removed), screenshot of the review item and the coach panel.

## Gotchas

- `get_screen_state`, `get_current_slide`, `get_lesson`, `get_assignment` and friends (server `aetherlink-academy` 0.3.0, `apps/server/src/mcp/tools.ts`) are not served by any runnable process at 768910c. They are only mounted by the in-process fixture `apps/server/src/mcp/lab-server.ts` and exercised by `apps/server/test/mcp/remote-mcp.test.ts`. The wave runtime (`start.mjs --wave`, `:4732`) serves only `/health`, `/connection` and the SPA; its `/mcp` returns the SPA HTML. Report this gap instead of "proving" it through the lab server.
- Release policy (which lessons a participant may open) lives in `apps/server/src/release` and the `apps/web` coach panel (`FacilitatorReleasePanel`). Like `get_screen_state`, it is only reachable through the lab fixture and unit tests today. The gateway has no release endpoint.
- `scripts/deployed-mcp-check.mjs` refuses non-HTTPS origins and creates squads. It cannot run against the local run or Hetzner (`http://`) without violating the read-only rule.
- `/game/connection` on a local `http://` origin reports `remoteConfigured: false` by design.
