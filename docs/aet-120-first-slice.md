# AET-120 first slice (2026-09-28)

## Landed
- Tailwind 3 + shadcn/ui primitives under `src/components/ui` (`button`, `badge`, `alert`, `label`, `radio-group`, `textarea`, …) with `components.json`.
- AI Elements-style shell under `src/components/ai-elements` (`conversation`, `message`, `prompt-input`) wired into legacy `src/chat.jsx` (FAQ + leercoach).
- Connect/Coach status chrome in `src/panels.jsx` uses shadcn `Alert` / `Badge` / `Button` / `RadioGroup` while keeping `data-testid="agent-connection-status"` and `data-status` (AET-126).

## Residual
- Broader Academy chrome migration (classroom, slides, facilitator workspace) still on existing tokens/CSS.
- Optional `@academy/actions` + `toChatTools` deck bridge not in this slice.
- No production route or data cutover.

## Regression guardrails
- AET-126 verified-after-tool-call UI contract preserved.
- AET-119 MCP deck path unchanged (server/scripts).
