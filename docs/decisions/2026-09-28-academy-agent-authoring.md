# Incremental Academy refactor and agent authoring

Status: user-approved direction, implementation in progress. 28 September 2026.

## Decision

Continue in `RyanLisse/aetherlink-academy-app`. The separate local Slides prototype is research evidence, not a replacement application or a source to copy wholesale. Retain existing identity, course/publication storage, action registry, MCP transports, content importers, releases, progress and collaboration. Verify each path in its actual host before calling it delivered. Keep TypeScript/Effect; a Rust rewrite is not part of this delivery.

Use shadcn/ui for interface controls and AI Elements for the embedded conversational surface. This supersedes the requirement to expose only the standalone upstream Chat UI. Do not change production routes or cut over data as part of this first slice.

## One action layer, multiple clients

Facilitator Claude Code (participant-owned login, through authenticated MCP), embedded chat and UI must call the same authorized Academy actions. Read/create/edit act on drafts with conflict checks. Publication is a separate explicit operation; drafts never mutate a room's pinned publication. Participant credentials must not expose facilitator curriculum-authoring tools, facilitator drafts or private speaker notes. Preserve the existing participant capability to author their own squad presentation decks; squad collaboration is a separate permission boundary. Discovery filtering is additional UX, not the authorization boundary.

Personal Claude Code authentication stays on the user's machine. Hosted chat uses server-side provider credentials and must not extract or share subscription OAuth credentials.

## Context and provider boundaries

The server resolves role, course, lesson, slide, revision and permitted progress. Client context hints are selectors, never authority. Participant context includes released content and their own permitted state; facilitator context can include owned drafts and notes. Chat history and retrieved chunks must respect these same boundaries. Tool output and generated changes are validated before persistence.

OpenRouter is configurable; `thinkingmachines/inkling:free` is an evaluation candidate, not an unconditional default. Its model card currently disallows confidential/personal input and logs prompts/outputs for model improvement. Do not send private notes, identities or customer content to that endpoint. Verify current provider policy and capability support when configuring it. Rate limits and outages must be visible; no promise of continuous inference from free capacity. Paid fallback stays disabled until an explicit budget exists. RuVector retrieval, if used, sits behind these context permissions and is not the source of truth.

## Classroom and content

The main route is a facilitator presenting fullscreen through Teams or a projector. No participant login or server classroom session is required for this route. Browser-local presenter synchronization is sufficient; platform follow/rejoin remains optional.

Reference for classroom days 1 and 2: `jyse/aetherlink-classroom-slides`, branch `cons/cursus-aanpassingen`. Pin a source commit and compare existing import/render support before changes. Preserve reveals, quizzes, timers, prompts, notes, assets and fallback demos; do not silently flatten interactive content.

New content and interface copy default to English. Preserve authored content and explicit language selections. Python/TypeScript are paired displayed/copied examples, executed by the attendee externally. Diagrams are language-neutral; no hosted code runner is implied.

## Delivery map

- [AET-119](https://linear.app/aetherlink/issue/AET-119): shared facilitator authoring actions, MCP and chat adapters (first slice).
- [AET-120](https://linear.app/aetherlink/issue/AET-120): shadcn/ui + AI Elements embedded chat.
- [AET-121](https://linear.app/aetherlink/issue/AET-121): reference classroom interaction parity.
- [AET-122](https://linear.app/aetherlink/issue/AET-122): English defaults and paired code display.
- Existing [AET-25](https://linear.app/aetherlink/issue/AET-25), [AET-30](https://linear.app/aetherlink/issue/AET-30), and [AET-31](https://linear.app/aetherlink/issue/AET-31) retain publication/chat/coach work; updated requirements supersede historical contradictory paragraphs.

No dates or production completion are inferred from issue status. First slice acceptance distinguishes adapter/transport tests, real Claude Code/hosted model use, browser evidence and deployed acceptance.
