# Weather decision skill (Claude Agent SDK)

Same rule as Eve and day-1 n8n:

- Call **Get Weather** (local tool) or **n8n_day1_weather** (MCP stand-in for the day-1 workflow).
- `precipitationProbability >= 60` → `bring umbrella`.
- Always return a draft; human gate before any send.
