# Connecting your own agent

Research date: 2026-09-28. Follow-up: AET-126. This is a design decision, not a claim that ACP or Codex onboarding has been implemented or tested.

## Recommendation

Keep authenticated Streamable HTTP MCP as the Academy capability boundary. Make setup explicitly support Claude Code and Codex. The user stays in their own agent, with their own login; Academy supplies scoped lesson, assignment, progress and slide tools.

| Protocol | Academy use | Decision |
| --- | --- | --- |
| MCP | An external agent reads Academy context and invokes authorized actions | Primary connection path now |
| WebMCP | A browser agent invokes structured tools exposed by the open Academy page | Optional enhancement; reuse existing registration |
| ACP (Agent Client Protocol) | Academy chat acts as a client for a locally running coding agent | Separate local-bridge experiment if this interaction is wanted |
| A2A | Independent agents discover each other and delegate tasks | Defer until a real agent-to-agent workflow requires it |

ACP here means **Agent Client Protocol**, not the similarly named Agent Communication Protocol.

## What is already present

`server/agent-setup.mjs` and `apps/server/src/identity/agent-setup.ts` generate Claude Code instructions with room-scoped access and a `get_mission` identity check. They do not yet offer a Codex choice. `apps/web/src/webmcp/register.ts` already feature-detects `navigator.modelContext` and adapts action descriptors; `LiveClassroom.tsx` mounts the registration component. These source findings do not establish browser compatibility or production connection success.

The inspected follow-view mount passes a fixed `configured` state and no action descriptors. The registration component consequently falls back to generic object schemas. Before calling this a complete WebMCP experience, wire real action schemas and observed connection state, and verify registration cleanup and failed-registration handling.

## First delivery

1. Offer **Claude Code** and **Codex** in a single Connect your agent flow.
2. Generate client-specific setup without replacing unrelated MCP configuration. Codex CLI locally exposes `mcp add --url ... --bearer-token-env-var ...`; explicitly account for the environment inherited by the actual CLI or desktop process.
3. Reuse scoped Academy credentials. Never collect personal provider login credentials.
4. Show configured/waiting/verified/expired as distinct states. Mark verified only after a real tool call confirms the expected room and participant or facilitator identity.
5. Pass active day, lesson and assignment context through the existing action boundary. Test both real clients and token revocation before declaring support.

For a later ACP experiment, a paired local companion would run the adapter and handle permission requests, cancellation, reconnect and selected workspace access. A hosted web page cannot directly start the user's local stdio agent. ACP adapter availability alone does not prove that the intended personal-login experience works; verify it for each client without extracting credentials. The internal OpenRouter coach remains a distinct connection from a user's own local agent.

## Sources

- [Claude Code MCP](https://code.claude.com/docs/en/mcp): remote HTTP tools and client setup.
- [Codex MCP](https://developers.openai.com/codex/mcp), plus local `codex mcp add --help`: supported connection configuration.
- [WebMCP early preview](https://developer.chrome.com/blog/webmcp-epp): declarative and imperative website tools. Do not assume universal browser or terminal-agent support.
- [ACP introduction](https://agentclientprotocol.com/get-started/introduction): editor/client-to-agent boundary; local stdio and evolving remote support.
- [ACP agents](https://agentclientprotocol.com/get-started/agents): Claude and Codex listed through adapters; no native or tested Academy support inferred.
- [A2A and MCP](https://a2a-protocol.org/latest/topics/a2a-and-mcp/): agent collaboration versus tool/resource access.
