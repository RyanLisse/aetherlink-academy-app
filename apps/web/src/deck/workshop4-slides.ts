/** AET-80 Workshop 4 · Claude Agent SDK lessons · classroom deck.
 *  36 slides: 3 intro · 2 bridge · 12 concepts · 19 lesson slides.
 *  Intro + concept-recap text mirrors the live room deck (EN, 2026-10-08).
 */
export const workshop4SourceSlides: ReadonlyArray<Record<string, unknown>> = [
  /* ===== Intro (live room deck since 2026-10-08) ===== */
  {
    lessonId: "workshop-4",
    title: "Welcome to Workshop 4 · Support agents with Claude Code and the Agent SDK",
    kicker: "Workshop 4 · Thu 8 Oct",
    type: "concept",
    visual: { bot: "wave", place: "beside" },
    subtitle: "Thu 8 Oct · 10:00–16:00 · today we rebuild yesterday’s n8n ticket flow in code.",
    notes: "Welcome (10:00; session 10:00–16:00). Today: the same ticket flow as yesterday in n8n, now in code with the Claude Agent SDK.",
  },
  {
    lessonId: "workshop-4",
    title: "Yesterday’s recap · Maarten’s n8n build",
    kicker: "Recap · Maarten's flow, node by node",
    type: "recap",
    layout: "recap",
    items: [
      { label: "Ticket Input", caption: "Ticket Input → Switch routes LOW, MEDIUM, or HIGH." },
      { label: "Chat + memory", caption: "Chat trigger + Simple Memory; test it with your favourite colour." },
      { label: "AI Agent", caption: "Priority Parser returns structured output." },
      { label: "Specialists + data", caption: "Risk, Customer Reply, and Customer Context use the Data Table from customer_context.csv." },
      { label: "Human", caption: "The assignment is chat in → chat out, with human review." },
    ],
    notes: "Recap Maarten's Workshop 3 build: Ticket Input → Switch; Chat trigger + Simple Memory with the favourite-colour test; AI Agent + Priority Parser; Risk, Customer Reply, and Customer Context subagents + Data Table imported from customer_context.csv; assignment chat in → chat out.",
  },
  {
    lessonId: "workshop-4",
    title: "Quiz: yesterday's n8n flow",
    kicker: "Recap · Quiz",
    type: "quiz",
    subtitle: "Which n8n node makes the priority structured?",
    visual: {
      quiz: {
        answer: 1
      },
      bot: "stretchLeft",
      place: "pointer",
      pointAt: 1
    },
    cards: [
      {
        title: "A",
        body: "The Switch node."
      },
      {
        title: "B",
        body: "The Priority Parser (Structured Output Parser)."
      },
      {
        title: "C",
        body: "Simple Memory."
      },
      {
        title: "D",
        body: "The Chat trigger."
      }
    ],
    check: "Answer: B",
    keyPoints: [
      "Vote first.",
      "Answer: B.",
      "Today: outputFormat with a JSON schema does this."
    ],
    notes: "Let the room vote first. Then press → to strike the wrong answers. The answer is B. The Switch routes after the parser. Today the same job is outputFormat with a JSON schema in Step 1."
  },
  {
    lessonId: "workshop-4",
    title: "Today · agenda",
    kicker: "Run of show · 10:00–16:00",
    type: "context",
    subtitle: "I show it, you do it.",
    visual: { bot: "point", place: "beside" },
    cards: [
      { title: "10:00–11:00 · Start", body: "Welcome, recap and goal. n8n → Agent SDK. Step 0: set up." },
      { title: "11:15–12:00 · Step 1", body: "Break 11:00–11:15. Then structured output and memory." },
      { title: "13:00–14:45 · Steps 2–4", body: "Lunch 12:00–13:00. Then subagents, MCP tools and the check." },
      { title: "15:00–16:00 · Assignment", body: "Break 14:45–15:00. Extend the MCP. Close at 15:50." },
    ],
    keyPoints: ["10:00 Welcome, recap, goal · 10:15 Concepts n8n → Agent SDK · 10:45 Step 0 · 11:00 Break · 11:15 Step 1 · 12:00 Lunch","13:00 Step 2 · subagents · 13:40 Step 3 · MCP · 14:20 Step 4 · check · 14:45 Break · 15:00 Assignment · extend the MCP · 15:50 Close","Step 5 (build your own agent) is optional: do it at home.","Workshop repo: https://github.com/RyanLisse/aetherlink-day5-n8n-to-agent","Fell behind? Fetch first, then switch to step-1 … step-4 for the finished state."],
    notes: "Run of show 10:00–16:00 (break 11:00–11:15, lunch 12:00–13:00, break 14:45–15:00). Format: I show it, you do it.",
  },
  /* ===== Bridge from Workshop 3 ===== */
  {
    lessonId: "workshop-4",
    title: "Goal of today",
    kicker: "Welcome · Goal of today",
    type: "context",
    subtitle: "At 16:00 you have your own controlled agent system.",
    visual: {
      bot: "wave",
      place: "beside"
    },
    cards: [
      {
        title: "Morning",
        body: "Rebuild Maarten's n8n flow in code: one agent, structured output, memory."
      },
      {
        title: "Afternoon",
        body: "Add subagents and MCP tools, then extend the MCP with writes, hooks and a workflow."
      },
      {
        title: "You can explain",
        body: "Which agent has which tool, and when a person must approve."
      }
    ],
    keyPoints: [
      "One flow, from n8n to code.",
      "Least privilege for each agent.",
      "A person approves risky writes."
    ],
    notes: "Say the goal in one sentence: at 16:00 each participant has an agent system that they built and can explain. Point at the agenda times. Say when the breaks are."
  },
  {
    lessonId: "workshop-4",
    title: "Yesterday's n8n. Today's Agent SDK.",
    kicker: "Workshop 4 · Day 4 · five steps",
    type: "concept",
    visual: { bot: "wave", place: "beside" },
    subtitle: "Carry Maarten’s n8n flow into Claude Code and the Agent SDK, then make a small agent of your own.",
    keyPoints: ["Keep LOW, MEDIUM, and HIGH.", "Separate analysis from reply writing.", "Review drafts before they reach a customer."],
    cards: [
      { title: "Workshop 3", body: "n8n routes a support message." },
      { title: "Workshop 4", body: "The same flow uses Claude Code or query(), JSON schema, subagents, MCP, and a human gate." },
    ],
    notes: "Open with Maarten’s Workshop 3 build, then explain, demo, let participants try, and discuss. Keep the labels, specialist split, and human review gate.",
  },
  {
    lessonId: "workshop-4",
    title: "Map n8n to the Agent SDK.",
    kicker: "Concept · the four questions",
    type: "context",
    visual: { bot: "wave", place: "beside" },
    subtitle: "The Agent SDK keeps familiar roles while changing how you configure and run them.",
    keyPoints: ["AI Agent node → query().", "System message → CLAUDE.md via settingSources.", "Specialists, tools, and human review keep their roles."],
    cards: [
      { title: "Start with the message", body: "Chat trigger → npm run chat · query({ prompt, options })" },
      { title: "Structure and memory", body: "Prompt, parser, memory → CLAUDE.md, outputFormat, resume." },
      { title: "Delegate and look up facts", body: "Risk, Reply, Context → subagents + MCP tools" },
      { title: "Route and review", body: "Switch → lib/switch.mjs · a person reviews every draft" },
    ],
    notes: "Ask four questions throughout the day: What does the main agent know? What belongs to a subagent? When is a tool needed? What information came from external data? The next slide maps the Workshop 3 nodes to the final participant chain.",
  },
  /* ===== Concept recap: n8n ↔ Agent SDK, one visual each (public/workshop-4) ===== */
  {
    lessonId: "workshop-4",
    title: "n8n ↔ Agent SDK at a glance",
    kicker: "Concept recap · overview",
    type: "concept",
    layout: "compare",
    visual: { opener: "showcase", image: "workshop-4/00-overview.png", imageLink: "n8n ↔ Agent SDK at a glance: n8n left, Claude Agent SDK right" },
    subtitle: "Same labels, same specialists, same human at the end.",
    keyPoints: ["Same labels, same specialists, same human at the end."],
    columns: [
      {
        title: "n8n · Workshop 3",
        items: [
          "Chat trigger",
          "AI Agent",
          "System Message",
          "Options → Max Iterations",
          "Simple Memory",
          "Structured Output Parser / Priority Parser",
          "Description",
          "Customer Context Agent + Data Table",
          "Transaction workbook lookup",
          "Switch",
        ],
      },
      {
        title: "Claude Agent SDK · Workshop 4",
        items: [
          "npm run chat → query()",
          "CLAUDE.md",
          "maxTurns",
          "session resume",
          "outputFormat: json_schema",
          "frontmatter description",
          "customer-context-agent → customers MCP get_customer",
          "risk-agent → transactions MCP get_transaction",
          "lib/switch.mjs",
          "human reviews each draft",
        ],
      },
    ],
    notes: "Map the final participant README table row by row: Chat trigger → npm run chat; AI Agent → query(); System Message → CLAUDE.md; Max Iterations → maxTurns; Simple Memory → session resume; Priority Parser → outputFormat json_schema; n8n Description → frontmatter description; Customer Context Agent + Data Table → customer-context-agent → customers MCP get_customer over customer_context.csv; transaction workbook lookup → risk-agent → transactions MCP get_transaction over transactions.xlsx; Switch → lib/switch.mjs. Every draft has human review.",
  },
  {
    lessonId: "workshop-4",
    title: "Agent and agent loop",
    kicker: "Concept 1 · Agent",
    type: "concept",
    layout: "compare",
    visual: { opener: "showcase", image: "workshop-4/01-agent-loop.png", imageLink: "Agent and agent loop: n8n left, Claude Agent SDK right" },
    subtitle: "The AI Agent node becomes a loop in code: think, tool, observe, repeat, answer.",
    keyPoints: ["The AI Agent node becomes a loop in code: think, tool, observe, repeat, answer."],
    columns: [
      { title: "n8n · Workshop 3", items: ["AI Agent node with Chat Model, Memory and Tools", "Options → Max Iterations", "One run per click"] },
      {
        title: "Claude Agent SDK · Workshop 4",
        items: [
          "for await (… of query({ prompt, options }))",
          "prompt → model turn → tool_use → tool_result → next turn → result message",
          "Events: [system:init] · [assistant] · [tool_use] · [tool_result] · [result]",
          "result prints its subtype, turns, time, and cost; structured output shows parsed JSON",
          "maxTurns limits model turns; n8n Options → Max Iterations",
        ],
      },
    ],
    notes: "The loop is prompt → model turn → tool calls → tool results → next turn → result message. The runner prints [system:init], [assistant], [tool_use], [tool_result], and [result]. The result subtype is printed with turn count, duration, and cost; structured_output is printed before the deterministic Switch route. maxTurns limits the model turns; it maps to n8n Max Iterations. docs/sample-trace.md is illustrative, not model evidence.",
  },
  {
    lessonId: "workshop-4",
    title: "System prompt",
    kicker: "Concept 2 · System prompt",
    type: "concept",
    layout: "compare",
    visual: { opener: "showcase", image: "workshop-4/02-systeemprompt.png", imageLink: "System prompt: n8n left, Claude Agent SDK right" },
    subtitle: "The system message now lives in a file next to the code.",
    keyPoints: ["The system message now lives in a file next to the code."],
    columns: [
      {
        title: "n8n · Workshop 3",
        items: [
          "AI Agent → Options → System Message",
          "One text field in the node",
          "W3: \"Always talk with the Customer Reply Agent and with the Risk Agent\"",
        ],
      },
      {
        title: "Claude Agent SDK · Workshop 4",
        items: [
          "CLAUDE.md: Purpose · Rules · Priority definitions",
          "settingSources: ['project'] loads CLAUDE.md",
          "systemPrompt: preset 'claude_code'",
          "Alternative: systemPrompt as a string (day5)",
        ],
      },
    ],
    notes: "n8n text verbatim from day5 n8n/support-triage.json (AI Agent options.systemMessage). SDK: 01-single-agent/options.mjs:8-11 (cwd, settingSources, systemPrompt preset); 01-single-agent/claude-project/CLAUDE.md (Priority definitions l.13-16, Required output l.18-20). day5: src/prompts.ts COORDINATOR_SYSTEM + settingSources: [] in src/agent.ts. Live: Step 1 (tone trap). Visual: concepts/visuals/02-systeemprompt.png (light: visuals/light/02-systeemprompt.png).",
  },
  {
    lessonId: "workshop-4",
    title: "Tools",
    kicker: "Concept 3 · Tools",
    type: "concept",
    layout: "compare",
    visual: { opener: "showcase", image: "workshop-4/03-tools.png", imageLink: "Tools: n8n left, Claude Agent SDK right" },
    subtitle: "In code you state exactly which tools exist and which are allowed.",
    keyPoints: ["In code you state exactly which tools exist and which are allowed."],
    columns: [
      { title: "n8n · Workshop 3", items: ["You attach tools to the AI Agent", "Customer Reply Agent and Risk Agent as tools", "Everything attached is allowed"] },
      {
        title: "Claude Agent SDK · Workshop 4",
        items: [
          "tools: what exists (Lesson 1: [] · Lesson 2: ['Agent','Write'])",
          "allowedTools: what runs without asking",
          "disallowedTools: ['WebSearch','WebFetch','Bash']",
        ],
      },
    ],
    notes: "SDK: 01-single-agent/options.mjs:12-13 (tools: [], disallowedTools); 02-subagents/options.mjs:13-15 (tools/allowedTools/disallowedTools); 03-mcp/options.mjs:17-20 (allowedTools incl. mcp__transactions__get_transaction and list_transactions). day5: src/tools.ts COORDINATOR_TOOLS = ['Agent']. Live: Steps 1–3. Visual: concepts/visuals/03-tools.png (light: visuals/light/03-tools.png).",
  },
  {
    lessonId: "workshop-4",
    title: "MCP: external data",
    kicker: "Concept 4 · MCP",
    type: "concept",
    layout: "compare",
    visual: { opener: "showcase", image: "workshop-4/04-mcp.png", imageLink: "MCP: external data: n8n left, Claude Agent SDK right" },
    subtitle: "The MCP server owns the data. The agent only sees what the tool returns.",
    keyPoints: ["The MCP server owns the data. The agent only sees what the tool returns."],
    columns: [
      { title: "n8n · Workshop 3", items: ["HTTP Request node per API", "External service", "(Concept: the W3 export has no HTTP node)"] },
      {
        title: "Claude Agent SDK · Workshop 4",
        items: [
          "docs/transactions.xlsx → server.js (MCP, stdio)",
          "The SDK starts the server on demand",
          "customers MCP get_customer reads docs/customer_context.csv",
          "transactions MCP get_transaction reads docs/transactions.xlsx",
          "customer-context-agent and risk-agent report \"External data:\"",
        ],
      },
    ],
    notes: "The customers MCP server reads docs/customer_context.csv and exposes get_customer; the transactions MCP server reads docs/transactions.xlsx and exposes get_transaction. The Agent SDK starts both over stdio. Claude Code reads the equivalent .mcp.json. The W3 export has no HTTP Request node; its n8n side is conceptual. Run npm run smoke:mcp to test the servers without a model.",
  },
  {
    lessonId: "workshop-4",
    title: "Control: hooks and approval",
    kicker: "Concept 5 · Control",
    type: "concept",
    layout: "compare",
    visual: { opener: "showcase", image: "workshop-4/05-hooks.png", imageLink: "Control: hooks and approval: n8n left, Claude Agent SDK right" },
    subtitle: "A human or a rule decides before a tool changes anything.",
    keyPoints: ["A human or a rule decides before a tool changes anything."],
    columns: [
      { title: "n8n · Workshop 3", items: ["IF node: check before the action", "Wait node: wait for approval", "Error Workflow: on failure"] },
      {
        title: "Claude Agent SDK · Workshop 4",
        items: [
          "PreToolUse hook: allow, ask, or deny per call",
          "Human review stays on reply drafts",
          "permissionMode: 'acceptEdits' → --permission-mode acceptEdits",
          "Assignment: hooks gate writes by situation",
        ],
      },
    ],
    notes: "Hooks run in both backends: the SDK hooks option and .claude/settings.json for Claude Code. In the assignment a PreToolUse hook allows reads, auto-allows small updates and asks a person before large updates, adds and deletes; a PostToolUse hook writes the audit log. Human review still applies to every reply draft. permissionMode maps to --permission-mode.",
  },
  {
    lessonId: "workshop-4",
    title: "Subagents",
    kicker: "Concept 6 · Subagents",
    type: "concept",
    layout: "compare",
    visual: { opener: "showcase", image: "workshop-4/06-subagents.png", imageLink: "Subagents: n8n left, Claude Agent SDK right" },
    subtitle: "The orchestrator delegates. Each specialist does one task.",
    keyPoints: ["The orchestrator delegates. Each specialist does one task."],
    columns: [
      { title: "n8n · Workshop 3", items: ["AI Agent as coordinator", "Customer Reply Agent + Risk Agent (own model + memory)", "Code → Switch afterwards"] },
      {
        title: "Claude Agent SDK · Workshop 4",
        items: [
          "Orchestrator follows CLAUDE.md: delegate, don't do it yourself",
          "Agent → risk-agent (priority)",
          "Agent → customer-reply-agent (draft email)",
          "Agent → customer-context-agent (customer facts)",
          "output/MSG-05.md = draft for the human",
        ],
      },
    ],
    notes: "The final chain maps n8n Description to frontmatter description and System Message to the prompt body. Step 2 delegates first to risk-agent, then customer-reply-agent; Step 3 adds customer-context-agent. Claude Code reads the same .claude/agents/*.md files directly.",
  },
  {
    lessonId: "workshop-4",
    title: "Skills",
    kicker: "Concept 7 · Skills",
    type: "concept",
    layout: "compare",
    visual: { opener: "showcase", image: "workshop-4/07-skills.png", imageLink: "Skills: n8n left, Claude Agent SDK right" },
    subtitle: "A skill is a recipe Claude picks up by itself when it fits.",
    keyPoints: ["A skill is a recipe Claude picks up by itself when it fits."],
    columns: [
      { title: "n8n · Workshop 3", items: ["Execute Workflow node calls a sub-workflow", "Reusable sub-workflow or template", "You choose when it runs"] },
      {
        title: "Claude Agent SDK · Workshop 4",
        items: [
          ".claude/skills/<name>/SKILL.md (name + description)",
          "At start: only the description",
          "Claude picks the skill → full content loads",
          "settingSources: ['project'] · option skills",
        ],
      },
    ],
    notes: "NOT in the exercise: neither repo has .claude/skills or the skills option. Concept only. Source: docs.claude.com/en/docs/agent-sdk/skills ('Extend agents with skills'): skills are SKILL.md files, loaded via settingSources, model-invoked, scoped with the skills option; no programmatic API like agents. No live step. Visual: concepts/visuals/07-skills.png (light: visuals/light/07-skills.png).",
  },
  {
    lessonId: "workshop-4",
    title: "Fixed workflow vs. dynamic agent",
    kicker: "Concept 8 · Workflows",
    type: "concept",
    layout: "compare",
    visual: { opener: "showcase", image: "workshop-4/08-workflows-vs-dynamisch.png", imageLink: "Fixed workflow vs. dynamic agent: n8n left, Claude Agent SDK right" },
    subtitle: "Code where it must. The agent chooses where it may. Always a human at the end.",
    keyPoints: ["Code where it must. The agent chooses where it may. Always a human at the end."],
    columns: [
      { title: "n8n · Workshop 3", items: ["Input → Switch → Low / Medium / High", "You draw every path up front", "Works well for fixed rules"] },
      {
        title: "Claude Agent SDK · Workshop 4",
        items: [
          "Fixed code: npm run check (check.mjs)",
          "Agent chooses: which subagent, which tool",
          "Fixed = rules, money, compliance · Agent = open questions",
        ],
      },
    ],
    notes: "The n8n Switch rules are fixed: priority equals low, medium, or high. In the final participant chain, lib/switch.mjs maps structured priority to a fixed action and check.mjs validates labels. The Step 2 orchestrator dynamically delegates to specialist agents. Discuss: when do you choose a fixed route or agent delegation?",
  },
  {
    lessonId: "workshop-4",
    title: "Structured output: parser to JSON schema",
    kicker: "Concept · structured output",
    type: "concept",
    visual: { bot: "think", place: "beside" },
    subtitle: "The parser becomes a schema; the Switch stays deterministic code.",
    keyPoints: ["Structured Output Parser / Priority Parser defines the shape.", "outputFormat uses json_schema.", "lib/switch.mjs routes the parsed priority."],
    cards: [
      { title: "n8n · Workshop 3", body: "Structured Output Parser → Priority Parser" },
      { title: "Agent SDK", body: "outputFormat: { type: 'json_schema', schema }" },
      { title: "Claude Code", body: "claude -p --json-schema" },
      { title: "Route", body: "Switch → priority → lib/switch.mjs" },
    ],
    notes: "Map the Structured Output Parser / Priority Parser to outputFormat with type json_schema and to Claude Code's --json-schema flag. The runner prints structured output, then lib/switch.mjs maps low, medium, and high to a fixed action and team.",
  },
  {
    lessonId: "workshop-4",
    title: "Memory is the session",
    kicker: "Concept · memory",
    type: "concept",
    visual: { bot: "point", place: "beside" },
    subtitle: "Chat resumes a session; a fresh session starts when memory is off.",
    keyPoints: ["Simple Memory carries a favourite-colour test across turns.", "npm run chat resumes with the previous sessionId.", "--no-memory starts each turn without resume."],
    cards: [
      { title: "n8n · Workshop 3", body: "Simple Memory → test it by asking for a favourite colour." },
      { title: "Participant chain", body: "npm run chat resumes the session; npm run chat -- --no-memory starts fresh." },
    ],
    notes: "The session is the memory in chat: lib/chat.mjs passes resume: sessionId to the next turn unless --no-memory is set. In n8n, the Chat trigger uses Simple Memory; Maarten's favourite-colour test makes the cross-turn behavior visible.",
  },
  {
    lessonId: "workshop-4",
    title: "Two ways to run the same agent",
    kicker: "Concept · choose a backend",
    type: "concept",
    visual: { bot: "think", place: "beside" },
    subtitle: "Claude Code is the default; the SDK backend is available when you need it.",
    keyPoints: ["claude-code is the default; if ANTHROPIC_API_KEY is set in your shell the runner picks sdk; force one with --backend.", "sdk runs query() with an API key; sdk-login is an opt-in local path.", "The CLI option mappings mirror the Agent SDK options."],
    cards: [
      { title: "claude-code · default", body: "claude -p · your own Claude Code login · no API key" },
      { title: "sdk · sdk-login", body: "sdk: query() + ANTHROPIC_API_KEY\nsdk-login: opt-in, your Claude Code login" },
      { title: "Same options, CLI flags", body: "maxTurns → --max-turns · agents → --agents\nmcpServers → --mcp-config\noutputFormat → --json-schema · resume → --resume" },
    ],
    notes: "claude-code is the default, but if ANTHROPIC_API_KEY is set in your shell the runner picks sdk; force one with --backend. The SDK backend uses query() with ANTHROPIC_API_KEY; sdk-login is opt-in for local learning. The CLI mappings are maxTurns/--max-turns, agents/--agents, mcpServers/--mcp-config, outputFormat/--json-schema, and resume/--resume.",
  },
  /* ===== Lessons ===== */
  {
    lessonId: "workshop-4",
    title: "Demo · Step 0: the offline path",
    kicker: "Demo · Step 0",
    type: "concept",
    visual: { bot: "point", place: "beside" },
    subtitle: "Choose your platform in docs/SETUP.md, then prove setup without a model call.",
    keyPoints: ["Windows · WSL · Linux/macOS · Docker → docs/SETUP.md.", "npm ci installs; npm run doctor checks the selected backend.", "claude-code is the default, but if ANTHROPIC_API_KEY is set in your shell the runner picks sdk; force one with --backend."],
    cards: [
      { title: "Facilitator demo", body: "Choose a platform in docs/SETUP.md\nnpm ci\nnpm run doctor\nnpm run verify\nnpm run lesson1 -- MSG-01 --dry-run" },
      { title: "Point at the trace", body: "backend: claude-code (claude -p)\nClaude Code equivalent: claude -p ..." },
    ],
    notes: "Choose the platform instructions in docs/SETUP.md. Run the facilitator commands exactly as in SOLO.md. Point to the backend: line and Claude Code equivalent: line; claude-code is the default, but if ANTHROPIC_API_KEY is set in your shell the runner picks sdk; force one with --backend. A dry run is not model evidence.",
  },
  {
    lessonId: "workshop-4",
    title: "Get the workshop package.",
    kicker: "SOLO 0 · Your turn",
    type: "practice",
    layout: "exercise",
    timer: 10,
    visual: { bot: "point", place: "beside" },
    cards: [
      { title: "Level", body: "SOLO 0" },
      { title: "Workshop repo", body: "https://github.com/RyanLisse/aetherlink-day5-n8n-to-agent\ngit clone https://github.com/RyanLisse/aetherlink-day5-n8n-to-agent.git\ncd aetherlink-day5-n8n-to-agent\nnpm ci\nnpm run doctor\nnpm run verify\nnpm run lesson1 -- MSG-01 --dry-run\nnpm run chat -- --dry-run" },
    ],
    steps: [
      "Choose Windows, WSL, Linux/macOS, or Docker in docs/SETUP.md.",
      "Run npm ci, npm run doctor, and npm run verify.",
      "Run npm run lesson1 -- MSG-01 --dry-run and inspect the backend: line.",
      "Run npm run chat -- --dry-run and inspect the Claude Code equivalent: line.",
      "claude-code is the default, but if ANTHROPIC_API_KEY is set in your shell the runner picks sdk; force one with --backend.",
    ],
    expected: "npm run verify shows fail 0, and the dry run prints the prompt and options and ends with dry run — no model call, not model evidence.",
    subtitle: "Choose your platform, install with npm ci, and inspect a dry run before a model call.",
    keyPoints: ["Use docs/SETUP.md for Windows, WSL, Linux/macOS, or Docker.", "main is Step 0; step-1 through step-4 contain the finished steps.", "claude-code is the default, but if ANTHROPIC_API_KEY is set in your shell the runner picks sdk; force one with --backend."],
    notes: "Participants follow docs/SETUP.md, then the exact Step 0 commands in SOLO.md. Confirm npm ci, doctor, verify, and both dry runs finish without ANTHROPIC_API_KEY. The output includes backend: and Claude Code equivalent:. claude-code is the default, but if ANTHROPIC_API_KEY is set in your shell the runner picks sdk; force one with --backend.",
  },
  {
    lessonId: "workshop-4",
    title: "Short break",
    kicker: "Day 4 · Break",
    type: "pause",
    subtitle: "Return in 15 minutes.",
    visual: {
      countdown: 15,
      bot: "wave",
      place: "beside"
    },
    cards: [
      {
        title: "Back at 11:15",
        body: "Next: Step 1 · structured priority and chat memory."
      }
    ],
    keyPoints: [
      "Say the return time: 11:15.",
      "Press ▶ Start on the timer.",
      "Check that everyone passed Step 0."
    ],
    notes: "Say the return time out loud: 11:15. Use the break to help people who did not pass npm run verify in Step 0."
  },
  {
    lessonId: "workshop-4",
    title: "Step 1 · Structured priority output and chat memory",
    kicker: "Explain · one agent",
    type: "concept",
    visual: { bot: "think", place: "beside", stepThrough: true },
    subtitle: "The agent returns a priority schema, then deterministic code routes it.",
    keyPoints: ["Structured Output Parser / Priority Parser → outputFormat json_schema.", "Switch → lib/switch.mjs maps the parsed priority to an action.", "Simple Memory becomes a resumed chat session."],
    cards: [
      { title: "Schema", body: "outputFormat: { type: 'json_schema', schema }" },
      { title: "Route", body: "Switch → lib/switch.mjs" },
      { title: "Memory", body: "npm run chat resumes the session; --no-memory starts fresh." },
    ],
    notes: "Explain Step 1 using the final chain. The n8n Structured Output Parser / Priority Parser maps to outputFormat json_schema, and Switch maps to lib/switch.mjs. Simple Memory maps to session resume in npm run chat; --no-memory starts without resume. The main agent reads the project instructions and supplied message.",
  },
  {
    lessonId: "workshop-4",
    title: "Demo · Step 1: schema, route, and memory",
    kicker: "Demo · Step 1",
    type: "concept",
    visual: { bot: "point", place: "beside", cmdCards: [0,2] },
    subtitle: "Inspect the offline setup, then show a live or clearly labelled sample result.",
    keyPoints: ["Inspect the schema, dry-run outputFormat, and lib/switch.mjs.", "A JSON result and Switch → line require a live run (Claude Code login, or --backend sdk with a key) or a clearly labelled sample trace.", "Test chat memory with a favourite colour."],
    cards: [
      { title: "Offline inspection", body: "npm run lesson1 -- MSG-01 --dry-run\npriority-schema.mjs · outputFormat · lib/switch.mjs" },
      { title: "Completed result", body: "Structured output: + Switch → low\nLive run, or docs/sample-trace.md (sample)" },
      { title: "Chat memory", body: "npm run chat · share a colour, ask again" },
    ],
    notes: "Run npm run lesson1 -- MSG-01 --dry-run and point out the prompt, options, and Claude Code equivalent. The dry run does not produce model JSON or a Switch → result. Inspect 01-single-agent/priority-schema.mjs, outputFormat in the dry-run options, and lib/switch.mjs offline. Then show a live run (Claude Code login, or --backend sdk with a key) or docs/sample-trace.md explicitly labelled as an illustrative sample; point out Structured output: and Switch → low. Start npm run chat, ask for a favourite colour, then ask for it again to show resumed session memory. Compare with npm run chat -- --no-memory.",
  },
  {
    lessonId: "workshop-4",
    title: "Run Step 1 and test chat memory.",
    kicker: "SOLO 1 · Your turn",
    type: "practice",
    layout: "exercise",
    timer: 15,
    visual: { bot: "point", place: "beside" },
    cards: [{ title: "Level", body: "SOLO 1" }],
    steps: [
      "Dry run: npm run lesson1 -- MSG-01 --dry-run. Open priority-schema.mjs and lib/switch.mjs.",
      "Find the JSON and Switch → line in a live run or docs/sample-trace.md.",
      "npm run chat: share a favourite colour, then ask for it again.",
      "Repeat with npm run chat -- --no-memory and compare.",
    ],
    expected: "You can point to the schema and the route, show a live or sample Switch → line, and explain why only the resumed chat remembers the colour.",
    subtitle: "Inspect the offline configuration and compare chat with and without session memory.",
    keyPoints: ["Inspect the configured schema, outputFormat, and lib/switch.mjs.", "Use a live run or labelled sample for JSON and Switch results.", "Compare the same-session follow-up with --no-memory."],
    notes: "Give participants 15 minutes. Offline, inspect 01-single-agent/priority-schema.mjs, outputFormat in the dry-run options, and lib/switch.mjs. Do not present dry-run output as model JSON or a Switch → result; show those only from a live run (Claude Code login, or --backend sdk with a key) or docs/sample-trace.md, labelled as an illustrative sample. Then compare a favourite-colour follow-up in the same chat with --no-memory.",
  },
  {
    lessonId: "workshop-4",
    title: "Discuss: what makes the route predictable?",
    kicker: "Discuss · Step 1",
    type: "review",
    visual: { bot: "peek", place: "slot", reveal: "click", noReact: true },
    subtitle: "Separate model judgment from the fixed priority route and session state.",
    keyPoints: ["The schema constrains the agent's output.", "lib/switch.mjs routes the parsed priority.", "Chat session resume carries memory across turns."],
    cards: [
      { title: "Structured output", body: "Which fields and values does the schema allow?" },
      { title: "Routing", body: "Which part chooses the next action?" },
      { title: "Memory", body: "What changes when the session is resumed?" },
    ],
    notes: "Discuss how a schema differs from a routing rule and from chat memory. Ask participants which behavior is model output, which is deterministic code, and which depends on session resume.",
  },
  {
    lessonId: "workshop-4",
    title: "Lunch",
    kicker: "Day 4 · Lunch",
    type: "pause",
    subtitle: "Enjoy your lunch.",
    visual: {
      countdown: 60,
      bot: "wave",
      place: "beside"
    },
    cards: [
      {
        title: "Back at 13:00",
        body: "Next: Step 2 · subagents for risk and the customer reply."
      }
    ],
    keyPoints: [
      "Lunch: back at 13:00.",
      "Fell behind? Switch to step-1 after lunch.",
      "Check your Claude Code login."
    ],
    notes: "Say the return time: 13:00. Participants who fell behind can catch up with git switch step-1 after lunch."
  },
  {
    lessonId: "workshop-4",
    title: "Step 2 · Risk analysis and customer reply agents",
    kicker: "Explain · orchestrator and agents",
    type: "concept",
    visual: { bot: "think", place: "beside", stepThrough: true },
    subtitle: "The orchestrator delegates analysis and reply writing to separate agents.",
    keyPoints: ["risk-agent analyzes and decides the priority.", "customer-reply-agent writes the reply draft.", "The orchestrator delegates in order and saves a file."],
    cards: [
      { title: "risk-agent", body: "Analyzes the message and returns priority and risk." },
      { title: "customer-reply-agent", body: "Writes a short draft using the original message and risk-agent result." },
      { title: "Prompt mapping", body: "n8n Description ↔ frontmatter description · System Message ↔ prompt body" },
    ],
    notes: "Explain Step 2. The final names are risk-agent and customer-reply-agent. The orchestrator delegates first to Agent → risk-agent, then Agent → customer-reply-agent. In n8n terms, Description maps to frontmatter description and System Message maps to the prompt body.",
  },
  {
    lessonId: "workshop-4",
    title: "Demo · Step 2: trace the two agents",
    kicker: "Demo · Step 2",
    type: "concept",
    visual: { bot: "point", place: "beside", cmdCards: [0] },
    subtitle: "Inspect the dry-run setup, then trace a live or clearly labelled sample run.",
    keyPoints: ["A dry run shows configuration, not Agent calls or model results.", "A live run calls risk-agent, then customer-reply-agent.", "Review a live draft before customer-facing use."],
    cards: [
      { title: "Commands", body: "npm run lesson2 -- MSG-05 --dry-run\nnpm run lesson2 -- MSG-05" },
      { title: "First agent call", body: "[tool_use] Agent → risk-agent\nLive run, or docs/sample-trace.md (sample)" },
      { title: "Second call + draft", body: "[tool_use] Agent → customer-reply-agent\nLive draft: 02-subagents/claude-project/output/MSG-05.md" },
    ],
    notes: "Run npm run lesson2 -- MSG-05 --dry-run, then run it live (Claude Code login, or --backend sdk with a key). The dry run prints the Claude Code equivalent and setup only; it does not call agents or produce a model result. Show the completed trace or docs/sample-trace.md, explicitly labelled as an illustrative sample. Point out [tool_use] Agent → risk-agent before [tool_use] Agent → customer-reply-agent, then the draft written for human review. The description test shows why n8n Description maps to the agent frontmatter description.",
  },
  {
    lessonId: "workshop-4",
    title: "Run the orchestrator and inspect the draft.",
    kicker: "SOLO 2 · Your turn",
    type: "practice",
    layout: "exercise",
    timer: 20,
    visual: { bot: "point", place: "beside" },
    cards: [{ title: "Level", body: "SOLO 2" }],
    steps: [
      "Dry run: npm run lesson2 -- MSG-05 --dry-run (setup only, no agent calls).",
      "Live run or docs/sample-trace.md: find Agent → risk-agent, then customer-reply-agent.",
      "After a live run, open 02-subagents/claude-project/output/MSG-05.md.",
      "Compare each agent's description with its prompt body; then try MSG-10 live.",
    ],
    expected: "risk-agent runs before customer-reply-agent, and you reviewed the draft before using it.",
    subtitle: "Inspect offline setup, then use a live or labelled sample trace for agent results.",
    keyPoints: ["Dry runs do not call agents.", "Inspect the live or sample Agent trace and draft.", "Review every live draft before customer-facing use."],
    notes: "Give participants 20 minutes. A dry run only shows setup and the backend command. The expected live or sample order is Agent → risk-agent followed by Agent → customer-reply-agent; the MSG-10 missing-information path also requires a live run (Claude Code login, or --backend sdk with a key) or the clearly labelled sample trace. Ask them to point to the frontmatter description and prompt body. Keep the output as a draft for human review.",
  },
  {
    lessonId: "workshop-4",
    title: "Discuss: which facts came from a tool?",
    kicker: "Discuss · Step 2",
    type: "review",
    visual: { bot: "peek", place: "slot", reveal: "click", noReact: true },
    subtitle: "Trace each claim to the input, a specialist, or an MCP tool.",
    keyPoints: ["risk-agent provides the priority and risk analysis.", "customer-reply-agent uses the original message and risk-agent result.", "A human reviews every draft before it goes to a customer."],
    cards: [
      { title: "Delegation", body: "Agent → risk-agent → Agent → customer-reply-agent" },
      { title: "Prompt mapping", body: "n8n Description ↔ frontmatter description · System Message ↔ prompt body" },
    ],
    notes: "Discuss how the two subagents divide the work. Ask what the orchestrator passes to the reply agent and why the draft remains subject to human review.",
  },
  {
    lessonId: "workshop-4",
    title: "Step 3 · Read-only customer and transaction MCP tools",
    kicker: "Explain · stdio MCP",
    type: "concept",
    visual: { bot: "think", place: "beside", stepThrough: true },
    subtitle: "Read-only MCP lookups supply customer and transaction facts; human review stays on reply drafts.",
    keyPoints: ["customer-context-agent → mcp__customers__get_customer.", "risk-agent → mcp__transactions__get_transaction and list_transactions.", "A person reviews each reply draft before it is sent."],
    cards: [
      { title: "Customer context", body: "customer_context.csv → customers MCP → get_customer" },
      { title: "Transaction lookup", body: "transactions.xlsx → transactions MCP → get_transaction" },
      { title: "Draft review", body: "customer-reply-agent → human review before sending" },
    ],
    notes: "Explain Step 3. The customer CSV is read by the customers MCP server and get_customer is assigned to customer-context-agent. transactions.xlsx is read by the transactions MCP server; get_transaction and list_transactions are read-only lookups assigned to risk-agent. Both servers use stdio and return external data. The reply remains a draft for human review before sending.",
  },
  {
    lessonId: "workshop-4",
    title: "Demo · Step 3: read-only customer and transaction lookups",
    kicker: "Demo · Step 3",
    type: "concept",
    visual: { bot: "point", place: "beside" },
    subtitle: "Follow customer and transaction facts from each MCP tool to the specialist.",
    keyPoints: ["customer-context-agent calls get_customer.", "risk-agent uses get_transaction and list_transactions.", "Review the customer-reply-agent draft before sending."],
    cards: [
      { title: "MCP setup and smoke", body: "(cd 03-mcp/transaction-mcp && npm ci)\nnpm run smoke:mcp" },
      { title: "Customer tool", body: "mcp → mcp__customers__get_customer" },
      { title: "Transaction tool", body: "mcp → mcp__transactions__get_transaction" },
    ],
    notes: "Run (cd 03-mcp/transaction-mcp && npm ci), then npm run smoke:mcp; it verifies the servers without a model. Demo a live lesson3 customer and transaction lookup, point to both MCP tool traces and the External data: line. Keep the generated reply as a draft for human review. Do not treat dry-run output as model evidence.",
  },
  {
    lessonId: "workshop-4",
    title: "Run Step 3 customer and transaction lookups.",
    kicker: "SOLO 3 · Your turn",
    type: "practice",
    layout: "exercise",
    timer: 20,
    visual: { bot: "point", place: "beside" },
    cards: [{ title: "Level", body: "SOLO 3" }],
    steps: [
      "Once: (cd 03-mcp/transaction-mcp && npm ci), then npm run smoke:mcp (no model).",
      "Dry run: npm run lesson3 -- MSG-08 --dry-run; check both MCP servers.",
      "Live or sample trace: find mcp__customers__get_customer and mcp__transactions__get_transaction.",
      "Tie every customer and transaction fact to an MCP result; a person reviews the draft.",
    ],
    expected: "Both MCP servers show in the dry run, the trace shows the read-only lookups, and the draft waits for human review.",
    subtitle: "Trace the read tools and review the reply draft.",
    keyPoints: ["Smoke-test without a model.", "Trace get_customer, get_transaction, and list_transactions.", "A person reviews the draft before sending."],
    notes: "Give participants 20 minutes. Start with npm run smoke:mcp, then run the lesson 3 dry run to inspect the MCP configuration. For real results, use a live run (Claude Code login, or --backend sdk with a key). Keep customer and transaction facts tied to the read-only MCP results, and have a person review the reply draft before sending.",
  },
  {
    lessonId: "workshop-4",
    title: "Discuss: tools and external data.",
    kicker: "Discuss · Step 3",
    type: "review",
    visual: { bot: "peek", place: "slot", reveal: "click", noReact: true },
    subtitle: "Name when a tool is needed, where each fact came from, and who reviews the draft.",
    keyPoints: ["Use get_customer for customer context.", "Use get_transaction or list_transactions for transaction facts.", "A person reviews reply drafts before they are sent."],
    cards: [
      { title: "Read-only tools", body: "Customer and transaction lookups return external facts." },
      { title: "Human review", body: "A person reviews the reply draft before sending." },
    ],
    notes: "Discuss when each lookup tool is needed and which facts came from customer_context.csv or transactions.xlsx. The tool result is external data. All customer and transaction tools are read-only; a person reviews the reply draft before it is sent.",
  },
  {
    lessonId: "workshop-4",
    title: "Step 4 · Acceptance table and npm run check",
    kicker: "SOLO 4 · Your turn",
    type: "practice",
    layout: "exercise",
    timer: 15,
    visual: { bot: "point", place: "beside" },
    cards: [{ title: "Level", body: "SOLO 4" }],
    steps: [
      "Complete the acceptance table for MSG-01, MSG-05, MSG-07, MSG-08, and MSG-09.",
      "Take customer and transaction facts from get_customer and get_transaction.",
      "Run npm run check; fill labels.json and run npm run check again.",
      "Save the acceptance table in participant-output/ or the squad's intent.md.",
      "A dry run is not model evidence; have a person review every draft.",
    ],
    expected: "The acceptance table is complete, labels pass npm run check, and results are saved in participant-output/ or the squad's intent.md.",
    subtitle: "Complete the acceptance table, then run the offline label check.",
    keyPoints: ["Fill the five-row acceptance table.", "Run npm run check.", "Save results in participant-output/ or intent.md."],
    notes: "Give participants 15 minutes to complete the acceptance table and run npm run check. Save the acceptance table and check results in participant-output/ or the squad's intent.md. A dry run is not model evidence.",
  },
  {
    lessonId: "workshop-4",
    title: "Step 5 · Build your own agent",
    kicker: "Explain · Step 5",
    type: "concept",
    visual: { bot: "think", place: "beside", stepThrough: true },
    subtitle: "Build a small code-fixing agent and find its prompt, tools, and result handling.",
    keyPoints: ["Yesterday: connect nodes; today: compose a prompt, tools, and a query loop.", "05-build-your-own/ carries the starter on step-4.", "The allowed-tools list limits actions; the permission mode controls edits."],
    cards: [
      { title: "Starter", body: "05-build-your-own/agent.mjs" },
      { title: "Loop", body: "prompt → tool_use → result" },
      { title: "Compare", body: "n8n nodes ↔ code, tools, and query loop" },
    ],
    notes: "Explain the final Step 5 in the step-4 branch. The starter is 05-build-your-own/agent.mjs. Participants identify the prompt, allowed tools, and result handling.",
  },
  {
    lessonId: "workshop-4",
    title: "Demo · Step 5: run the starter",
    kicker: "Demo · Step 5",
    type: "concept",
    visual: { bot: "point", place: "beside", cmdCards: [1] },
    subtitle: "Show the offline dry run, then the Claude Code equivalent.",
    keyPoints: ["The dry run makes no model call.", "The CLI command uses Read, Edit, and Glob.", "The permission mode accepts edits within that scope."],
    cards: [
      { title: "From step-4", body: "cd 05-build-your-own\nnode agent.mjs --dry-run" },
      { title: "Claude Code equivalent", body: "claude -p \"Find and fix the bug in utils.js. Explain the change.\" --allowedTools Read,Edit,Glob --permission-mode acceptEdits" },
    ],
    notes: "Run the exact Step 5 demo commands from SOLO.md. Point out that the dry run is not model evidence and then show the Claude Code equivalent command.",
  },
  {
    lessonId: "workshop-4",
    title: "Your turn · build your own agent",
    kicker: "SOLO 5 · Your turn",
    type: "practice",
    layout: "exercise",
    timer: 20,
    visual: { bot: "point", place: "beside" },
    cards: [{ title: "Level", body: "SOLO 5" }],
    steps: [
      "Catch up with git switch step-4; Step 5 is carried by step-4.",
      "Follow 05-build-your-own/README.md to initialize the folder and install the SDK.",
      "Run node agent.mjs --dry-run and inspect the Claude Code equivalent.",
      "If logged into Claude Code, run the command shown in the Step 5 demo.",
      "Identify the prompt, allowed tools, tool-use message, and final result.",
    ],
    expected: "The starter dry run is understood and participants can point to the prompt, tool scope, tool-use event, and result.",
    subtitle: "Build or inspect the starter, then explain its tool call and result.",
    keyPoints: ["Follow the starter README.", "Keep model calls optional.", "Explain the tool-use and result messages."],
    notes: "Give participants 15–20 minutes. Keep the API key optional: without a model call they can use the dry run; participants with a Claude Code login can use the equivalent CLI command.",
  },
  {
    lessonId: "workshop-4",
    title: "Short break",
    kicker: "Day 4 · Break",
    type: "pause",
    subtitle: "Return in 15 minutes.",
    visual: {
      countdown: 15,
      bot: "wave",
      place: "beside"
    },
    cards: [
      {
        title: "Back at 15:00",
        body: "Next: the assignment · extend the MCP with tools, agents and hooks."
      }
    ],
    keyPoints: [
      "Say the return time: 15:00.",
      "Press ▶ Start on the timer.",
      "Fell behind? Switch to step-4."
    ],
    notes: "Say the return time: 15:00. The assignment starts from step-4. Participants who fell behind switch to step-4 now."
  },
  {
    lessonId: "workshop-4",
    title: "Assignment · Extend the MCP",
    kicker: "Explain · Assignment",
    type: "concept",
    visual: { bot: "think", place: "beside", stepThrough: true },
    subtitle: "Add write tools, give them to one agent, and control each write with a hook.",
    keyPoints: [
      "Step 3 stays read-only.",
      "The assignment adds writes to a working copy.",
      "A hook and a person control each write."
    ],
    cards: [
      {
        title: "1 · Tools",
        body: "CRUD tools → working copy. save_reply_draft → drafts."
      },
      {
        title: "2 · Agents",
        body: "Make transaction-agent and fraud-check-agent. Give each only its tools."
      },
      {
        title: "3 · CLAUDE.md",
        body: "Only transaction-agent writes. Fraud check first. Denied is final."
      },
      {
        title: "4 · Hooks and workflow",
        body: "PreToolUse decides. PostToolUse logs. npm run resolve runs the chain."
      }
    ],
    notes: "Explain the final assignment. Step 3 stays read-only. The assignment adds add_transaction, update_transaction and delete_transaction to the transactions MCP server. These tools write only to participant-output/transactions.working.json; docs/transactions.xlsx does not change. A new drafts MCP server adds save_reply_draft: it writes the reply draft to participant-output/drafts/. Participants make transaction-agent and fraud-check-agent, add rules to CLAUDE.md, write the PreToolUse and PostToolUse hooks, and run the npm run resolve workflow. npm run reset:mcp removes the working copy and the drafts."
  },
  {
    lessonId: "workshop-4",
    title: "Not every agent has every tool",
    kicker: "Explain · Permissions",
    type: "concept",
    visual: { bot: "point", place: "beside", stepThrough: true },
    subtitle: "Four layers decide if a tool call can run.",
    keyPoints: [
      "Each agent gets only the tools it needs.",
      "The orchestrator delegates writes.",
      "The hook decides; a person approves."
    ],
    cards: [
      {
        title: "1 · Agent tools list",
        body: "risk-, customer-context-, fraud-check-agent: read only.\ncustomer-reply-agent: save_reply_draft only.\ntransaction-agent: get, update, add."
      },
      {
        title: "2 · allowedTools",
        body: "The orchestrator has no write tools.\nIt must delegate a change to transaction-agent."
      },
      {
        title: "3 · PreToolUse hook → 4 · person",
        body: "The hook allows, asks or denies each write.\nOnly the orchestrator has AskUserQuestion."
      }
    ],
    notes: "Show the layers in order. The tools list in the agent frontmatter limits what each agent can call. The orchestrator allowedTools has no write tools, so it must delegate. The PreToolUse hook in 03-mcp/hooks/transaction-guard.mjs then allows, asks or denies each call. When the hook asks, a person answers y or N. The same hook runs in the SDK hooks option and in .claude/settings.json for Claude Code. AskUserQuestion is the built-in ask-a-person tool. Only the orchestrator has it; subagents do not get it."
  },
  {
    lessonId: "workshop-4",
    title: "Quiz: who may change a transaction?",
    kicker: "Assignment · Quiz",
    type: "quiz",
    subtitle: "Which agent may call update_transaction?",
    visual: {
      quiz: {
        answer: 1
      },
      bot: "stretchLeft",
      place: "pointer",
      pointAt: 1
    },
    cards: [
      {
        title: "A",
        body: "risk-agent"
      },
      {
        title: "B",
        body: "transaction-agent"
      },
      {
        title: "C",
        body: "customer-reply-agent"
      },
      {
        title: "D",
        body: "The orchestrator"
      }
    ],
    check: "Answer: B",
    keyPoints: [
      "Vote first.",
      "Answer: B.",
      "The orchestrator delegates; it does not write."
    ],
    notes: "Vote first. The answer is B. Only transaction-agent has the write tools in its list. The orchestrator has no write tools in allowedTools, so it must delegate. customer-reply-agent only has save_reply_draft."
  },
  {
    lessonId: "workshop-4",
    title: "When does the hook ask?",
    kicker: "Explain · Hook triggers",
    type: "concept",
    subtitle: "The hook asks only in some situations. Each card is one situation.",
    keyPoints: [
      "Reads, drafts and small updates do not ask.",
      "Large updates, adds and deletes ask a person.",
      "No person to ask means deny."
    ],
    notes: "Read the cards one by one. The threshold is one constant: AUTO_APPROVE_TRANSACTION_AMOUNT = 100 in 03-mcp/hooks/transaction-guard.mjs. In interactive claude the hook returns ask and Claude Code shows the prompt. When fraud-check-agent says medium, or a fact is missing, the orchestrator asks the person with AskUserQuestion. Under claude -p, or in the SDK without a terminal, no person can answer: the write is denied. A denied write is final: the agent reports it and stops.",
    cards: [
      {
        title: "risk-agent tries a write",
        body: "Blocked: the tool is not in its list."
      },
      {
        title: "A read, a draft, or an update below 100",
        body: "Allowed. Each write gets one audit line."
      },
      {
        title: "Update of 100 or more, add, delete, or fraud medium",
        body: "A person decides: y/N, or AskUserQuestion."
      },
      {
        title: "Fraud hold, claude -p, or the answer N",
        body: "No write. Report ESCALATE. No retry, no other agent."
      }
    ],
    visual: { bot: "think", place: "beside", stepThrough: true }
  },
  {
    lessonId: "workshop-4",
    title: "Where you change what, and why (1/2)",
    kicker: "Explain · Where and why",
    type: "concept",
    visual: { bot: "point", place: "beside", stepThrough: true },
    subtitle: "Each change has one file and one reason.",
    keyPoints: [
      "Tools go in the MCP servers.",
      "Agents go in .claude/agents/.",
      "Each agent gets only its tools."
    ],
    cards: [
      {
        title: "03-mcp/transaction-mcp/server.js",
        body: "Add the write tools. Why: the working copy keeps the workbook unchanged."
      },
      {
        title: "03-mcp/transaction-mcp/drafts-server.js",
        body: "Add save_reply_draft. Why: a person reads the draft before it is sent."
      },
      {
        title: "03-mcp/claude-project/.claude/agents/",
        body: "Make transaction-agent and fraud-check-agent. Why: least privilege."
      }
    ],
    notes: "Show each file in the editor. server.js gets add_transaction, update_transaction and delete_transaction; they write to participant-output/transactions.working.json. drafts-server.js gets save_reply_draft; it writes participant-output/drafts/MSG-0N.md. The agent files list the tools for each agent. The SDK agents definition uses the same tool lists."
  },
  {
    lessonId: "workshop-4",
    title: "Where you change what, and why (2/2)",
    kicker: "Explain · Where and why",
    type: "concept",
    visual: { bot: "think", place: "beside", stepThrough: true },
    subtitle: "Rules tell the model; code makes sure.",
    keyPoints: [
      "CLAUDE.md gives the rules.",
      "The hook makes the decision in code.",
      "The workflow fixes the order."
    ],
    cards: [
      {
        title: "03-mcp/claude-project/CLAUDE.md",
        body: "Add the write rules. Why: the orchestrator must know who writes and when to stop."
      },
      {
        title: "03-mcp/hooks/transaction-guard.mjs + .claude/settings.json",
        body: "Add the hooks. Why: code decides each write, not the model."
      },
      {
        title: "03-mcp/resolve.mjs",
        body: "Add the workflow. Why: the same safe order runs every time."
      }
    ],
    notes: "CLAUDE.md is advice to the model: the model can make a mistake. The tools list and the hook are code: the model cannot go around them. The SDK loads the hook through the hooks option. Claude Code loads the same file through .claude/settings.json. resolve.mjs runs lookup, fraud check, update, hook and draft in a fixed order."
  },
  {
    lessonId: "workshop-4",
    title: "Demo · Assignment: one write, three outcomes",
    kicker: "Demo · Assignment",
    type: "concept",
    visual: { bot: "point", place: "beside", cmdCards: [0,1] },
    subtitle: "Run the check, run the workflow, and read the audit log.",
    keyPoints: [
      "npm run check:assignment fails on step-4.",
      "MSG-07 shows ask, allow and deny.",
      "MSG-08 and MSG-09 show hold and ask."
    ],
    cards: [
      {
        title: "Check first",
        body: "npm run check:assignment\nOn step-4 it fails and gives hints."
      },
      {
        title: "Small and large writes",
        body: "npm run hook:demo -- small\nnpm run resolve -- MSG-07: answer y, then N."
      },
      {
        title: "Hold and ask",
        body: "MSG-08: fraud hold → ESCALATE.\nMSG-09: AskUserQuestion."
      }
    ],
    notes: "Run npm run check:assignment on step-4 and read the hints. Switch to the solution. Run npm run hook:demo -- small: the hook allows the update of TX-1002 (49.99) with no question. Run npm run resolve -- MSG-07 and answer y: the working copy changes, audit.jsonl gets one line and drafts/MSG-07.md is saved. Run npm run reset:mcp. Run MSG-07 again and answer N: the agent reports the denied write and stops. Run MSG-08: fraud-check-agent says hold, so no write. Run MSG-09: the customer and the transaction do not match, so the orchestrator asks you with AskUserQuestion."
  },
  {
    lessonId: "workshop-4",
    title: "What good looks like (1/2): offline checks",
    kicker: "Assignment · Expected output",
    type: "concept",
    visual: { opener: "showcase", image: "workshop-4/10-good-offline.png", imageLink: "Terminal: check:assignment passes, the small update is allowed, the large update asks" },
    subtitle: "Compare your terminal with this screen.",
    keyPoints: [
      "check:assignment says: Assignment check passed.",
      "hook:demo small: Decision allow. No question.",
      "hook:demo large: Decision ask. The reason shows amount and limit.",
    ],
    cards: [
      { title: "check:assignment", body: "Assignment check passed. A failure names the file to fix." },
      { title: "hook:demo small", body: "TX-1002, 49.99: Decision allow. No question." },
      { title: "hook:demo large", body: "TX-1007, 899: Decision ask. Amount and limit in the reason." },
    ],
    notes: "Show this screen after the participants run npm run check:assignment and npm run hook:demo -- small and -- large. These checks run offline and need no key. If check:assignment fails, read the hints: each hint names a file. The fixtures do not call the tool and do not change data.",
  },
  {
    lessonId: "workshop-4",
    title: "What good looks like (2/2): live runs",
    kicker: "Assignment · Expected output",
    type: "concept",
    visual: { opener: "showcase", image: "workshop-4/11-good-live.png", imageLink: "Terminal: MSG-07 denied write, MSG-08 fraud hold, MSG-09 AskUserQuestion" },
    subtitle: "Three tickets, three safe stops.",
    keyPoints: [
      "MSG-07, answer N: the hook denies. The agent stops. No retry.",
      "MSG-08: fraud-check-agent holds. No write.",
      "MSG-09: the agent asks you with AskUserQuestion. Choose 1: no write.",
    ],
    cards: [
      { title: "MSG-07 · answer N", body: "The hook denies. The agent reports it and stops. No retry." },
      { title: "MSG-08 · fraud flag", body: "fraud-check-agent holds. ESCALATE. No write." },
      { title: "MSG-09 · mismatch", body: "AskUserQuestion. Choose 1: ESCALATE. No write." },
    ],
    notes: "These are real runs on the solution branch. The model words can differ, but the stops must be the same. Check participant-output/audit.jsonl: each applied write and each saved draft has one line. A denied write adds no line. After MSG-07 with y, a draft is in participant-output/drafts/MSG-07.md and starts with DRAFT. Run npm run reset:mcp to start again.",
  },
  {
    lessonId: "workshop-4",
    title: "Extend the MCP: tools, agent, hooks.",
    kicker: "SOLO 6 · Your turn",
    type: "practice",
    layout: "exercise",
    timer: 45,
    visual: {
      bot: "point",
      place: "beside"
    },
    cards: [
      {
        title: "Level",
        body: "SOLO 6 · Assignment"
      }
    ],
    steps: [
      "Add the write tools to server.js. Add save_reply_draft to drafts-server.js.",
      "Make transaction-agent and fraud-check-agent in .claude/agents/. Give each only its tools.",
      "Give customer-reply-agent save_reply_draft. Add the write rules to CLAUDE.md.",
      "Write the PreToolUse and PostToolUse hooks in 03-mcp/hooks/transaction-guard.mjs.",
      "Run npm run check:assignment until it passes. Then run npm run resolve -- MSG-07."
    ],
    expected: "npm run check:assignment passes, drafts/ has the reply draft, audit.jsonl shows each write, and a denied write stops the run.",
    subtitle: "Add the write tools, give them to one agent, and control them with hooks.",
    keyPoints: [
      "Writes go to the working copy only.",
      "Only transaction-agent writes.",
      "A denied write is final."
    ],
    notes: "Give participants 45 minutes. They work on step-4. npm run check:assignment runs without a model and shows what is missing. The solution branch has the reference answer. A live run needs a Claude Code login or --backend sdk with a key. Run npm run reset:mcp after each test."
  },
  {
    lessonId: "workshop-4",
    title: "Discuss: who can change data, and when?",
    kicker: "Discuss · Assignment",
    type: "review",
    visual: { bot: "peek", place: "slot", reveal: "click", noReact: true },
    subtitle: "Compare the n8n Wait node with the hook and the person.",
    keyPoints: [
      "Which agent needs write tools?",
      "Which writes need a person?",
      "Where do you put the rule?"
    ],
    cards: [
      {
        title: "Least privilege",
        body: "Which agent needs write tools? Which agent needs none?"
      },
      {
        title: "Threshold",
        body: "Which amount needs a person? Who sets that number?"
      },
      {
        title: "Rule location",
        body: "CLAUDE.md, the tools list or the hook: which rule goes where?"
      }
    ],
    notes: "Ask each squad for one answer per card. A rule in CLAUDE.md is advice to the model. A tools list and a hook are code: the model cannot go around them. In n8n, the Wait node and the IF node do this work."
  },
  {
    lessonId: "workshop-4",
    title: "Close: keep a human in the loop.",
    kicker: "Done when · bridge to Workshop 5",
    type: "recap",
    layout: "recap",
    visual: { recapKeys: true, bot: "point", place: "beside" },
    items: [
      { label: "Structured output", caption: "Priority Parser → JSON schema → deterministic Switch route." },
      { label: "Three agents", caption: "risk-agent, customer-reply-agent, and customer-context-agent." },
      { label: "MCP + approval", caption: "Customer and transaction lookups; staff writes need human review." },
      { label: "Build your own", caption: "Carry the chat-in/chat-out assignment into Workshop 5." },
    ],
    notes: "Close with the chat-in/chat-out assignment: npm run chat -- --lesson 3, or claude from the repository. Bridge from this agent loop to Workshop 5.",
  },
] satisfies ReadonlyArray<Record<string, unknown>>;
