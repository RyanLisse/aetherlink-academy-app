/** Synced from jyse/aetherlink-classroom-slides @ cons/cursus-aanpassingen tip dc7107bc.
 *  Do not hand-edit curriculum prose — re-sync from SoT. Day1 = slides 1–44 (index < 44).
 */
/* ==========================================================================
   Aetherlink x Worldline — Two-day classroom deck
   86 slides, authored from CURRICULUM.md (2026-09-15 revision) plus its
   "Resolved alignment decisions" section, which overrides three points in
   the base document: Assignment 9's AI feedback is required and needs no
   API credentials (folded into Slide 64 + new Slide 65); Slide 27 carries
   the three-tier SDLC / working-method / agent-loop framing; Part 5's
   Jira/GitLab/Confluence MCP connections are the real, primary path.
   One slide = one object in order. See README.md "How to edit a slide"
   before changing anything here.

   Field reference:
     title     - required. Shown as the big heading.
     kicker    - small text above the title (e.g. "DAY 1 · PART 1").
     subtitle  - one sentence under the title.
     type      - one of: context, concept, practice, review, recap, pause.
                 Controls the colour chip and the footer progress dot.
     dark      - true to render this slide on the dark background variant.
     layout    - optional: "steps" | "pillars" | "compare" | "recap" |
                 "exercise" (assignment slides — timer + "Do this now" panel).
                 Leave out for a plain card grid (the default).
     cards     - array of {title, body} shown as the card grid.
     items     - for layout "steps"/"pillars"/"recap": {label, caption, detail}.
     columns   - for layout "compare": {title, items:[...], foot}.
     steps     - the "Do this now" checklist (plain strings) for exercise slides.
     expected  - one sentence: what a good result looks like.
     check     - the checkpoint question a facilitator/participant confirms.
     timer     - minutes, only when the curriculum states an exact duration.
     prompt    - an exact phrase the facilitator can read aloud or paste.
                 For slides with a CURRICULUM.md "Prompt panel" code block,
                 this is that block verbatim (template literals preserve the
                 original line breaks) — do not paraphrase these.
     tagline   - a short bold line rendered under the slide's main content.
     notes     - facilitator speaker notes (never shown to participants).
     visual    - optional illustration, never changes wording:
                 bot: 'wave'|'think'|'point'|'head' (AetherBOT pose)
                 place: 'left'|'beside'|'under'|'timeline'
                 tool: 'map'|'arm'|'toolbox'|'thought' (comes out of his head)
                 target: CSS selector the tool points at
                 art: 'timeline' · cardArt: { <cardIndex>: 'route' } · pillarIcons
                 highlight: [{ in: 'title'|'subtitle'|'card:N', text, tone:
                              'orange'|'purple'|'mark' }] — text must exist verbatim
                 stagger: 'pop' — cards pop in one by one
                 hero: N — card N becomes one big centred statement
                 popOut: N + place: 'popout' — card N's lines pop out of the bot as chips
                 art: 'nested' + place: 'nest' — steps shown as rings inside each other (+ magnifier)
                 keyLine: N (+ stamp, place: 'key') — card N becomes the big key line, bot stamps it
                 art: 'flow' + place: 'slot' — cards 1+2 flow through the bot into card 3
                 art: 'window' — context-window box filling with tokens beside the cards
                 cardArt: { N: 'sliders'|'thermo' } — small illustration inside card N
                 reveal: 'click' (+ place: 'slot') — cards start closed; click / → opens the next (buttons: true shows buttons)
                 faces: [...] — with reveal: AetherBOT's face per opened card (assets/aetherbot/faces/:
                        verward · dubbel · eigenwijs · slaperig · betrapt · blij · verrast)
                 checklist: N — card N's lines become a list that ticks itself off
                 highlight 'in' may also be 'tagline'
                 quiz: { answer: N } — → strikes the wrong cards one by one, then marks N (checkpoint hidden)
                 spotlight: N — card N lights up, the others dim
                 pairs: true — compare layout shown as row pairs, one per click / →
                 countdown: minutes — pause slide: live countdown + real "Back at" clock time
                 chipIcons: [...] — icons in front of popOut chips
                 bot: 'stretchLeft'|'stretchRight' + place: 'pointer' + pointAt: N — stretch arm reaches card N
                 chipGrid: 3 — popOut chips in a 3-column grid
                 term: [{c}|{o}|{ask}] — terminal beside the cards that types commands, output, then an approval question
                 art: 'gate' — route Explore → Plan → approval gate → Change; click / → opens the gate
                 art: 'prompt' (+ promptMarks) — the slide's prompt typed in a terminal; B shows plan B (demo-fallback.js)
                 stepKeys: true (+ humanStep: N) — steps layout without buttons, → activates the next step
                 reach: true — (with stepKeys) AetherBOT's arm telescopes to the active step
                 art: 'loop' — (with stepKeys) steps drawn as a circle: 4 nodes + "repeat or stop" in the middle
                 art: 'boxes' (+ link) — compare columns drawn as boxes inside boxes; → zooms in, then links items
                 addLine: 'placeholder' — (with checklist) an empty line the trainer can type into live
                 stack: [tags] — cards pop in top to bottom, one by one, each with a tag
                 cmdCards: [N..] — card bodies shown as typing terminal lines (lines ending in ':' or '.' are notes)
                 browser: N — mini browser with the four app pages in card N (Game live, rest empty)
                 lineReveal: N — card N's lines as a numbered list that pops in
                 stamps: ['PASS', …] (+ bot, place: 'stamps') — clickable decision stamps that pop out of AetherBOT's head (checkpoint box hidden)
                 badge: N — card N's lines as an empty profile badge
                 swap: true — two AetherBOT heads passing work to each other (peer review); with stamps: stamps pop between them
                 template: N (+ templateRows) — empty card template (term/definition or the card's own lines)
                 notebook: N — card N's lines as a ruled notebook page
                 quietTimer: minutes — quiet countdown (no "Back at") beside the cards
                 badges: [icons] (+ place 'aside') — title-only cards unlock one by one like achievements
                 dayRoute: [stops] — the shape of the day as a route under the cards
                 art: 'stairs' (+ stepKeys, today: [i]) — levels as a staircase, today's levels tagged
                 art: 'intake' (+ place 'aside', tags) — every card flows into AetherBOT
                 mdfile: N — card N's lines as sections of a CLAUDE.md file
                 guides: [[icon, name, verb], …] — two badges "X guides ≠ Y enforces" above the tagline
                 repeatStack: N — card N repeated as three cards that fly in and fan out like a hand of cards
                 mdName — file name shown on mdfile (default CLAUDE.md)
                 noSkill: N — card N's body becomes a "No skill yet" badge
                 diff: [{title, rows:[{k, miss, odd, note}]}] — two mini cards side by side, differences circled
                 lifespan: [{kind:'now'|'always'|'recurring', icon, label}] — per card a small "how long it lives" track
                 tree: N — card N's path as a folder tree ending in an empty file
                 fence: N — card N's lines as signs on a fence around a bouncing AetherBOT (bounded autonomy)
                 conveyor: N — card N becomes a belt: terms go into AetherBOT, READY/REVISE/OPEN cards come out
                 loopCaptions: true — (with art 'loop') show the active step's caption under the loop
                 perCard: [stamps] — row of mini cards, each with its own decision stamp (checkpoint hidden)
                 gameFlow: true — cards as one round of the game with a loop-back arrow
                 gameMock: true — mini game screen beside the cards, feedback area empty ("you build this")
                 phrase: '…' — a chat bubble with the exact phrase to say
                 catChips: N — card N's lines as coloured rating labels
                 runner: [{label, tone}] — card 0's lines as test cases that "run" and show their expected result (checkpoint hidden)
                 plugs: N — MCP picture: AetherBOT plugged into an MCP server via card N's lines
                 zones: [left, right, [chips]] — compare layout as 'your laptop' vs 'outside' behind an MCP gate
                 pending: [title, text] — visible placeholder for content that still has to be added
                 sourceTiles: N — card N's lines as source tiles with a read-only lock
                 planB: 'WINDOW_VAR' (+ planBLabel) — B shows a captured example (see demo-fallback.js)
                 menu: N — card N's lines as clickable chips (pick one)
                 pipes: true (+ same: [k]) — compare columns 'A → B → C → D' as two aligned pipelines; same stages glow
                 recapKeys: true — recap items pop in one by one with a trophy (no buttons, no clicking)
                 levelUp: true — recap items tick off with a progress bar filling up
                 supportDays: true — (with art 'timeline') the two teaching days marked done
                 doneSteps: N — (with stepKeys) first N steps done ✓, the next one pulses
                 handover: 'text' — compare: AetherBOT on the AI side, 👤 on the people side, then a big closing line
                 sentences: true — cards as open sentences on a notebook page
   stepsHeading (slide field) — heading above the steps; default "Your prompt must ask Claude Code to:"
   ========================================================================== */
export const sourceSlides = [

/* ---------------------------------------------------------------------- */
/* TEACHING DAY 1 — AI foundations and working with Claude Code            */
/* ---------------------------------------------------------------------- */

{ // Slide 1
  title: "Welcome to the course!",
  kicker: "AETHERLINK × WORLDLINE · WELCOME",
  subtitle: "",
  type: "context",
  visual: { opener: 'welcome', bot: 'wave', place: 'beside' },
  notes: "Have this on screen while people walk in. Once everyone is seated, give a warm welcome — keep it to a few sentences. The programme itself is introduced at slide 5."
},

{ // Slide 2
  title: "How many of you have already used AI?",
  kicker: "WELCOME · WARM-UP",
  subtitle: "",
  type: "context",
  visual: { opener: 'ask', bot: 'multiarm', place: 'beside' },
  notes: "Ask it literally and let the hands go up — say roughly how many you see. Follow-up question out loud: 'and how many of you use it every week?' This is a quick read of the room, not a discussion: note whether you mostly have beginners or regular users and adjust your pace in Part 1."
},

{ // Slide 3
  title: "A few agreements",
  kicker: "WELCOME · AGREEMENTS",
  subtitle: "So we get the most out of these two days.",
  type: "context",
  visual: { opener: 'agree', stagger: 'pop', bot: 'point', place: 'beside' },
  cards: [
    { title: "Be on time", body: "" },
    { title: "Be open-minded", body: "" },
    { title: "Be curious", body: "" },
    { title: "Listen first, then ask", body: "" }
  ],
  notes: "Name the four agreements, one sentence each. 'Listen first, then ask' matters most today: many questions are answered a few slides later, so invite people to hold them until the explanation is done."
},

{ // Slide 4
  title: "Who we are",
  kicker: "WELCOME · TEAM",
  subtitle: "We are what we do.",
  type: "context",
  visual: { opener: 'team', stagger: 'pop' },
  cards: [
    { title: "Jessy The", body: "" },
    { title: "Constance van der Vlist", body: "" },
    { title: "Maarten Nauw", body: "" },
    { title: "Ryan Lisse", body: "" }
  ],
  notes: "Each trainer introduces themselves in one or two sentences: who you are and what you do in this programme. Keep it short — 'we are what we do': the room gets to know you over the next two days."
},

{ // Slide 5
  title: "Aetherlink × Worldline",
  kicker: "TEACHING DAY 1",
  subtitle: "Working with AI and Claude Code — from AI foundations to your first tested change.",
  type: "context",
  visual: { bot: 'wave', place: 'left', tool: 'map', target: '.cards .card:nth-child(2)', cardArt: { 1: 'route' },
    highlight: [{ in: 'subtitle', text: 'first tested change', tone: 'orange' }, { in: 'card:0', text: 'together', tone: 'purple' }] },
  dark: true,
  cards: [
    { title: "What we're doing", body: "Building useful, safe, verifiable and reusable AI-supported workflows together." },
    { title: "Today", body: "AI foundations, Claude Code, the working method, and your first assignments in the Aether Library." }
  ],
  notes: "Open on time. Welcome the room, introduce yourself, and name the shape of the seven days: two teaching days, then five support days. Keep this short — the real content starts at slide 6."
},

{ // Slide 6
  title: "The seven-day programme",
  kicker: "DAY 1 · WELCOME",
  subtitle: "Two teaching days establish the foundation. Five support days apply the method to agent workflows and team work.",
  type: "context",
  visual: { art: 'timeline', bot: 'head', place: 'timeline', tool: 'arm', target: '.tl-arrow',
    highlight: [{ in: 'subtitle', text: 'foundation', tone: 'purple' }, { in: 'subtitle', text: 'apply', tone: 'orange' }] },
  cards: [
    { title: "Teaching Days 1–2", body: "Understand and practise." },
    { title: "Support Days 1–5", body: "Deepen and apply." }
  ],
  notes: "Visually distinguish the two teaching days from the five support days, but don't explain all seven days in detail now — that temptation wastes time here. One sentence per phase is enough; the support days belong to a different facilitator."
},

{ // Slide 7
  title: "Programme outcome",
  kicker: "DAY 1 · WELCOME",
  subtitle: "By the end of the programme, participants can help design, build and review an AI-supported workflow that other people can understand and reuse.",
  type: "context",
  visual: { bot: 'head', place: 'under', tool: 'toolbox', pillarIcons: true,
    highlight: [{ in: 'subtitle', text: 'understand and reuse', tone: 'orange' }] },
  layout: "pillars",
  items: [
    { label: "Useful" },
    { label: "Safe" },
    { label: "Verifiable" },
    { label: "Reusable" }
  ],
  notes: "Read the subtitle exactly as written — it's the north star for both teaching days. The four words are the test you'll come back to throughout: is what we built useful, safe, verifiable and reusable?"
},

{ // Slide 8
  title: "Work that could improve",
  kicker: "DAY 1 · WELCOME",
  subtitle: "Which recurring task costs you time or creates unnecessary uncertainty?",
  type: "context",
  visual: { bot: 'think', place: 'beside', tool: 'thought',
    highlight: [{ in: 'title', text: 'improve', tone: 'orange' }, { in: 'subtitle', text: 'time', tone: 'mark' }, { in: 'subtitle', text: 'uncertainty', tone: 'purple' }] },
  cards: [
    { title: "Describe the problem", body: "Leave the solution open for now." }
  ],
  prompt: "Which recurring task costs you time or creates unnecessary uncertainty? Describe the current problem. Leave the solution open for now.",
  notes: "Very short opening discussion — two or three minutes, a handful of voices, do not let it become a design session. The point is to surface real frustration before any tooling talk starts."
},

{ // Slide 9
  title: "Day 1 outcome",
  kicker: "DAY 1 · WELCOME",
  subtitle: "By 16:00, you can use Claude Code to:",
  type: "context",
  visual: { stagger: 'pop' },
  cards: [
    { title: "Explore", body: "understand an existing project" },
    { title: "Plan", body: "make a plan for a small change" },
    { title: "Create", body: "create the change" },
    { title: "Test", body: "test the result" },
    { title: "Review", body: "review the evidence" }
  ],
  notes: "This previews the working method that gets named explicitly at slide 29 — the red thread for the rest of the day. Don't teach it yet, just point at the shape so it feels familiar when it returns."
},

/* ---------------------------------------------------------------------- */
/* DAY 1 — Part 1: AI foundations                                          */
/* ---------------------------------------------------------------------- */

{ // Slide 10
  title: "Artificial intelligence",
  kicker: "DAY 1 · PART 1 · AI FOUNDATIONS",
  subtitle: "Not one technology — a broad field.",
  type: "concept",
  visual: { hero: 0, popOut: 1, bot: 'head', place: 'popout',
    highlight: [{ in: 'card:0', text: 'broad field', tone: 'purple' }, { in: 'card:0', text: 'human intelligence', tone: 'orange' }] },
  cards: [
    { title: "Definition", body: "Artificial intelligence is the broad field of building systems that perform tasks associated with human intelligence." },
    { title: "Examples", body: "recognising patterns\nmaking predictions\ngenerating content\nselecting actions" }
  ],
  notes: "Keep this brief and plain-language — the room includes non-engineers. Resist the pull to go deeper into AI history or academic definitions; the goal is a shared floor, not a lecture."
},

{ // Slide 11
  title: "The AI landscape",
  kicker: "DAY 1 · PART 1 · AI FOUNDATIONS",
  subtitle: "Each one sits inside the one before it.",
  type: "concept",
  layout: "steps",
  visual: { art: 'nested', bot: 'point', place: 'nest', stepKeys: true },
  items: [
    { label: "Artificial intelligence", caption: "The broad field." },
    { label: "Machine learning", caption: "Finds patterns from data." },
    { label: "Deep learning", caption: "Learns with many-layered neural networks." },
    { label: "Generative AI", caption: "Creates new content." },
    { label: "Large language models", caption: "Generate and process language." }
  ],
  notes: "Click through the five rings live so the nesting is visible: each term sits inside the one before it. Deep learning is the layer people usually skip — it is why today's generative AI works: the models behind it are deep neural networks. This is scaffolding for slide 12, not a separate lesson."
},

{ // Slide 12
  title: "Large language models",
  kicker: "DAY 1 · PART 1 · AI FOUNDATIONS",
  subtitle: "Sounding right is not the same as being right.",
  type: "concept",
  visual: { keyLine: 1, stamp: 'VERIFY', bot: 'head', place: 'key',
    highlight: [{ in: 'card:1', text: 'verification', tone: 'mark' }] },
  cards: [
    { title: "Definition", body: "An LLM generates a response from patterns learned during training and the context available in the current interaction." },
    { title: "Key line", body: "A plausible response still requires verification." }
  ],
  notes: "Say the key line slowly and let it land — it's the single most important sentence of Part 1, and everything about verification and human review later depends on the room accepting it now."
},

{ // Slide 13
  title: "Input, context and output",
  kicker: "DAY 1 · PART 1 · AI FOUNDATIONS",
  subtitle: "What goes in shapes what comes out.",
  type: "concept",
  visual: { art: 'flow', bot: 'head', place: 'slot',
    highlight: [{ in: 'tagline', text: 'Evidence', tone: 'orange' }] },
  cards: [
    { title: "Input", body: "Your instruction, question or goal." },
    { title: "Context", body: "Relevant information available to the model." },
    { title: "Output", body: "The response or proposed action." }
  ],
  tagline: "Useful context improves the response. Evidence determines whether you can trust it.",
  notes: "Draw the arrow on the whiteboard if you have one: input+context → model → output. This sets up 'context' as a concept that returns constantly on Day 2."
},

{ // Slide 14
  title: "Tokens and context windows",
  kicker: "DAY 1 · PART 1 · AI FOUNDATIONS",
  subtitle: "The model can only consider so much at once.",
  type: "concept",
  visual: { art: 'window',
    highlight: [{ in: 'tagline', text: 'Relevant', tone: 'orange' }, { in: 'tagline', text: 'current', tone: 'purple' }, { in: 'tagline', text: 'permitted', tone: 'mark' }] },
  cards: [
    { title: "Tokens", body: "Models process text as tokens." },
    { title: "Context window", body: "A context window limits how much information the model can consider at once." },
    { title: "Distraction", body: "Irrelevant context can distract from the task." }
  ],
  tagline: "Relevant, current and permitted context works best.",
  notes: "The tagline is the takeaway to repeat: relevant, current, permitted. It resurfaces almost word-for-word in Day 2's CLAUDE.md and context slides."
},

{ // Slide 15
  title: "Model choice",
  kicker: "DAY 1 · PART 1 · AI FOUNDATIONS",
  subtitle: "Pick the model that fits the task.",
  type: "concept",
  visual: { cardArt: { 0: 'sliders', 1: 'thermo' },
    highlight: [{ in: 'card:1', text: 'does not make an answer more truthful', tone: 'orange' }] },
  cards: [
    { title: "Model choice", body: "Different models offer different balances of capability, speed and cost." },
    { title: "Temperature", body: "Temperature influences variation in generated responses. It does not make an answer more truthful." }
  ],
  notes: "Keep this slide brief — participants do not configure model APIs during Day 1. Thirty seconds, then move on."
},

{ // Slide 16
  title: "AI failure modes",
  kicker: "DAY 1 · PART 1 · AI FOUNDATIONS",
  subtitle: "How does AI get it wrong?",
  type: "concept",
  visual: { reveal: 'click', bot: 'head', place: 'slot', faces: ['verward', 'dubbel', 'eigenwijs', 'slaperig', 'betrapt'] },
  cards: [
    { title: "Missing context", body: "The model did not have what it needed to answer well." },
    { title: "Ambiguous instructions", body: "The request could reasonably mean more than one thing." },
    { title: "Unsupported assumptions", body: "The model filled a gap with a guess instead of asking." },
    { title: "Outdated information", body: "What the model learned no longer matches reality." },
    { title: "Fabricated details", body: "A confident-sounding answer that isn't actually true." }
  ],
  tagline: "Treat AI output as a proposal until you verify it.",
  notes: "Ask the room for a personal example of AI being confidently wrong before you reveal the list — recognition lands harder than the definition alone."
},

{ // Slide 17
  title: "A reliable request",
  kicker: "DAY 1 · PART 1 · AI FOUNDATIONS",
  subtitle: "A useful request gives Claude:",
  type: "concept",
  visual: { checklist: 0, bot: 'point', place: 'left' },
  cards: [
    { title: "Checklist", body: "the intended outcome\nrelevant context\nconstraints\nsuccess criteria\nthe required output\na validation method" }
  ],
  notes: "This is the checklist behind every well-formed prompt panel in the deck — point forward to it as the pattern participants will see repeated in every assignment."
},

{ // Slide 18
  title: "Knowledge check",
  kicker: "DAY 1 · PART 1 · KNOWLEDGE CHECK",
  subtitle: "Which statement is most accurate?",
  type: "review",
  visual: { quiz: { answer: 1 }, bot: 'stretchLeft', place: 'pointer', pointAt: 1 },
  cards: [
    { title: "A", body: "An LLM retrieves a guaranteed correct answer." },
    { title: "B", body: "An LLM generates a response that still needs verification." },
    { title: "C", body: "More context always produces a better answer." },
    { title: "D", body: "Temperature controls factual accuracy." }
  ],
  check: "Answer: B",
  notes: "Let the room vote (show of hands or chat) before revealing the answer. If anyone argues for C, connect it back to slide 14's 'more is not automatically better' point."
},

{ // Slide 19
  title: "Short break",
  kicker: "DAY 1 · BREAK",
  subtitle: "Return in 15 minutes.",
  type: "pause",
  visual: { countdown: 15, bot: 'wave', place: 'beside' },
  cards: [
    { title: "Return in 15 minutes", body: "Continuing with: Claude chat and Claude Code." }
  ],
  notes: "State the actual clock time you'll resume, out loud and (if possible) on screen — 'return in 15 minutes' only works if people know what time that is. Use the break to check your own Claude Code auth is working before the live demo in Part 2."
},

/* ---------------------------------------------------------------------- */
/* DAY 1 — Part 2: Claude and Claude Code                                  */
/* ---------------------------------------------------------------------- */

{ // Slide 20
  title: "Claude interfaces",
  kicker: "DAY 1 · PART 2 · CLAUDE & CLAUDE CODE",
  subtitle: "Four ways to work with Claude.",
  type: "concept",
  visual: { spotlight: 1, bot: 'stretchLeft', place: 'pointer', pointAt: 1 },
  cards: [
    { title: "Claude chat", body: "Conversation, thinking and content." },
    { title: "Claude Code", body: "Agentic work inside technical projects." },
    { title: "Claude API", body: "Claude capabilities inside an application." },
    { title: "Connected tools", body: "Approved access to other information and systems." }
  ],
  notes: "Land on Claude Code — that's where the room lives for the rest of the day. No need to dwell on the API or connected-tools rows yet; they return properly in Day 2 Parts 3–4."
},

{ // Slide 21
  title: "Claude chat and Claude Code",
  kicker: "DAY 1 · PART 2 · CLAUDE & CLAUDE CODE",
  subtitle: "Claude Code works inside your project, not just in conversation with you.",
  type: "concept",
  layout: "compare",
  visual: { pairs: true, highlight: [{ in: 'subtitle', text: 'inside your project', tone: 'orange' }] },
  columns: [
    { title: "Claude chat", items: [
      "Works mainly through conversation",
      "Uses the context you provide",
      "Produces responses",
      "Helps you think and write"
    ] },
    { title: "Claude Code", items: [
      "Works inside a project",
      "Can inspect approved project files",
      "Can use tools and run commands",
      "Can plan, change and validate work"
    ] }
  ],
  notes: "Pair each Claude chat row with its Claude Code counterpart when you talk through this — same order on both sides is deliberate."
},

{ // Slide 22
  title: "AI agents",
  kicker: "DAY 1 · PART 2 · CLAUDE & CLAUDE CODE",
  subtitle: "Not just answering — acting toward a goal.",
  type: "concept",
  visual: { hero: 0, popOut: 1, chipIcons: ['▶', '↻', '■', '✋'],
    highlight: [{ in: 'card:0', text: 'works toward a goal', tone: 'orange' }] },
  cards: [
    { title: "Definition", body: "An AI agent works toward a goal by gathering context, choosing actions, using tools and checking results." },
    { title: "It can", body: "continue\nadjust\nstop\nask for human input" }
  ],
  notes: "Keep this abstract and short — it sets up the next slide's concrete claim that Claude Code already is one of these."
},

{ // Slide 23
  title: "Claude Code as an agentic tool",
  kicker: "DAY 1 · PART 2 · CLAUDE & CLAUDE CODE",
  subtitle: "You are using an agent — not building one (yet).",
  type: "concept",
  visual: { popOut: 0, bot: 'head', place: 'popout', chipGrid: 3, chipIcons: ['🔍', '🗺', '✏️', '▶', '👁', '↻'],
    highlight: [{ in: 'tagline', text: 'existing agentic tool', tone: 'orange' }] },
  cards: [
    { title: "Claude Code can", body: "inspect a repository\nform a plan\nread and edit files\nrun commands and tests\ninspect results\nadjust its approach" }
  ],
  tagline: "Using Claude Code means using an existing agentic tool.",
  notes: "Important clarification, say it explicitly: using Claude Code today does not mean the room has built a standalone agent. That distinction becomes central in Day 2 Part 3 — plant it now."
},

{ // Slide 24
  title: "The terminal",
  kicker: "DAY 1 · PART 2 · CLAUDE & CLAUDE CODE",
  subtitle: "Where Claude Code does its work.",
  type: "concept",
  visual: { term: [{ c: 'ls' }, { o: 'README.md  data  public  server.js' }, { c: 'git status' }, { o: 'On branch main · nothing to commit' }, { ask: 'Allow Claude to run npm test? (y/n)' }],
    highlight: [{ in: 'tagline', text: 'understand what you approve', tone: 'orange' }] },
  cards: [
    { title: "What the terminal gives you", body: "The terminal lets you interact with your computer and project through commands." },
    { title: "Same tools developers use", body: "Claude Code uses the same project tools developers already use for files, Git, applications and tests." }
  ],
  tagline: "You do not need to memorise every command. You must understand what you approve.",
  notes: "If anyone in the room is terminal-anxious, name it directly: they don't need to memorise commands, they need to understand what they're approving. That's the whole bar."
},

{ // Slide 25
  title: "Permissions and Plan Mode",
  kicker: "DAY 1 · PART 2 · CLAUDE & CLAUDE CODE",
  subtitle: "Look first. Change later.",
  type: "concept",
  visual: { art: 'gate' },
  cards: [
    { title: "Permissions", body: "Permissions control which actions Claude Code may perform without further approval." },
    { title: "Plan Mode", body: "Plan Mode lets Claude investigate and prepare a plan before implementation." }
  ],
  tagline: "Start with exploration. Review the plan before allowing changes.",
  notes: "This is the working rule that governs every assignment for the rest of the two days — say it as a rule, not a suggestion."
},

{ // Slide 26
  title: "Repository exploration",
  kicker: "DAY 1 · PART 2 · LIVE DEMO",
  subtitle: "Watch Claude Code inspect a small project without changing it.",
  type: "concept",
  dark: true,
  visual: { art: 'prompt', promptMarks: ['without changing anything', 'evidence', 'OPEN'] },
  cards: [
    { title: "Explore", body: "Explore this repository without changing anything." },
    { title: "Explain", body: "Explain what the application does, how it is structured and how I can verify your explanation." },
    { title: "Evidence", body: "Support your claims with evidence from the files." },
    { title: "Uncertainty", body: "Mark anything you cannot confirm as OPEN." }
  ],
  prompt: `Explore this repository without changing anything.

Explain what the application does, how it is structured and how I can verify your explanation. Support your claims with evidence from the files. Mark anything you cannot confirm as OPEN.`,
  notes: "HIGH RISK — no one else on-site to rescue a live break. Before the room arrives, run this exact prompt once on the demo machine and keep a screenshot/terminal capture of the output ready. If the live demo fails (no network, no auth, a crash): say so plainly, show the captured screenshot instead, and walk through it exactly as if it were live — the teaching point (explore, explain, evidence, no changes) survives either way."
},

{ // Slide 27
  title: "What Claude Code did",
  kicker: "DAY 1 · PART 2 · DEMO REVIEW",
  subtitle: "Which of these actions would a normal chat interface be unable to perform without access to the project?",
  type: "review",
  visual: { reveal: 'click' },
  cards: [
    { title: "Read project files", body: "Not a description of the project — the actual files." },
    { title: "Gathered context", body: "Built up what it needed before answering." },
    { title: "Used tools", body: "Ran commands rather than only producing text." },
    { title: "Connected claims to evidence", body: "Tied its explanation to what it actually found." },
    { title: "Marked uncertainty", body: "Flagged what it couldn't confirm as OPEN." },
    { title: "Remained read-only", body: "Did all of this without changing anything." }
  ],
  notes: "Let the room answer the question themselves before you reveal the six points — the answer ('it could look at the real files') is the whole bridge into Part 3."
},

{ // Slide 28
  title: "Lunch",
  kicker: "DAY 1 · LUNCH",
  subtitle: "Enjoy your lunch.",
  type: "pause",
  visual: { countdown: 60, bot: 'wave', place: 'beside' },
  cards: [
    { title: "Back at 13:00", body: "We continue with the working method and the Aether Library." }
  ],
  notes: "Exact resume time: 13:00. Use the break to double-check the practice repo clones cleanly on the demo machine and that your own MCP-independent setup still works — the afternoon's assignments start immediately after lunch."
},

/* ---------------------------------------------------------------------- */
/* DAY 1 — Part 3: Working method                                          */
/* ---------------------------------------------------------------------- */

{ // Slide 29
  title: "Human and AI working method",
  kicker: "DAY 1 · PART 3 · WORKING METHOD",
  subtitle: "One method, six steps — the red thread for both days.",
  type: "concept",
  layout: "steps",
  visual: { stepKeys: true, humanStep: 4, reach: true },
  items: [
    { label: "Explore", caption: "Understand before acting." },
    { label: "Plan", caption: "Agree the intended change." },
    { label: "Create", caption: "Make the smallest useful change." },
    { label: "Test", caption: "Evidence, not confidence." },
    { label: "Human review", caption: "The human decides." },
    { label: "Handoff", caption: "Someone else can pick this up." }
  ],
  tagline: "The human owns the goal, boundaries and final decision.",
  notes: "Name it once, precisely: this is the human and AI working method — Explore, Plan, Create, Test, Human review, Handoff. Every later reference to 'the method' or 'human review' points back to this exact slide, so get the wording right here. It's this doc's own label — do not revert to any older 'human in the loop' wording unless asked."
},

{ // Slide 30
  title: "Agent loop",
  kicker: "DAY 1 · PART 3 · WORKING METHOD",
  subtitle: "A loop, not a line.",
  type: "concept",
  layout: "steps",
  visual: { stepKeys: true, art: 'loop' },
  items: [
    { label: "Observe" },
    { label: "Decide" },
    { label: "Act" },
    { label: "Check" },
    { label: "Repeat or stop" }
  ],
  tagline: "The agent loop happens within a bounded task.",
  notes: "Five steps, all of them stay including 'Decide' — this is the confirmed final wording. Keep this slide focused on the loop itself; the relationship between this loop and the working method just taught is the very next slide."
},

{ // Slide 31
  title: "Three views of the same work",
  kicker: "DAY 1 · PART 3 · WORKING METHOD",
  subtitle: "Zoom in: lifecycle → task → loop.",
  type: "concept",
  layout: "compare",
  visual: { art: 'boxes', link: { 0: ['Build', 'Test'], 1: ['Create', 'Test'] } },
  columns: [
    { title: "SDLC — outer", items: [
      "Plan", "Design", "Build", "Test", "Deploy", "Maintain"
    ], foot: "Contains the working method ↓" },
    { title: "Working method — middle", items: [
      "Explore", "Plan", "Create", "Test", "Human review", "Handoff"
    ], foot: "Contains the agent loop ↓" },
    { title: "Agent loop — inner", items: [
      "Observe", "Decide", "Act", "Check", "Repeat or stop"
    ] }
  ],
  tagline: "The agent loop happens within a task. A task sits within the team's software lifecycle.",
  notes: "This is the reconciled three-tier diagram — say the nesting out loud, left to right: Build+Test of the SDLC (outer) contains Create+Test of the working method (middle), which contains the whole agent loop (inner). The middle tier is this course's own working method from slide 29, unchanged; the inner tier is slide 30's agent loop, unchanged. Only the outer SDLC ring is new context — it places one bounded assignment inside the team's whole software lifecycle. Close on the tagline exactly as written; it's the sentence to leave the room with before moving to slide 32."
},

{ // Slide 32
  title: "Working agreement",
  kicker: "DAY 1 · PART 3 · WORKING METHOD",
  subtitle: "During the exercises, Claude must:",
  type: "context",
  visual: { checklist: 0, addLine: 'add your own…' },
  cards: [
    { title: "Our agreement", body: "investigate before changing\nshow the plan first\nmake small changes\nrun relevant checks\nshow evidence\nmark uncertainty as OPEN\nwait for human approval before committing" }
  ],
  notes: "Frame this as the room's own working agreement with Claude Code, not a rule imposed from outside — ask if anyone wants to add anything before moving into the Aether Library."
},

/* ---------------------------------------------------------------------- */
/* DAY 1 — Part 4: Aether Library                                       */
/* ---------------------------------------------------------------------- */

{ // Slide 33
  title: "Aether Library",
  kicker: "DAY 1 · PART 4 · AETHER LIBRARY",
  subtitle: "A small AI knowledge library that grows throughout the two teaching days.",
  type: "context",
  visual: { stack: ['Day 1 · Assignment 2', 'Day 1 · Assignment 3', 'Day 1–2 · Assignments 4, 6, 7, 8', 'Day 2 · Assignment 9 · AI feedback'],
    highlight: [{ in: 'subtitle', text: 'grows', tone: 'orange' }] },
  cards: [
    { title: "Participant profiles", body: "Who is here, and what they're working on." },
    { title: "An AI glossary", body: "Shared definitions the whole group can rely on." },
    { title: "Enriched concept cards", body: "Definitions turned into complete, sourced explanations." },
    { title: "A learning game", body: "Explain It Back — practise recalling and applying the terms." }
  ],
  notes: "The Aether Library is only introduced now — participants understand Claude Code and the working method first. Point participants to clone their own copy right after this slide."
},

{ // Slide 34
  title: "Practice repository setup",
  kicker: "DAY 1 · PART 4 · AETHER LIBRARY",
  subtitle: "Every participant works solo, in their own local copy.",
  type: "context",
  visual: { cmdCards: [0, 2], browser: 3 },
  cards: [
    { title: "1 · Clone and run", body: "git clone https://github.com/jyse/aetherlink-classroom-starter.git\ncd aetherlink-classroom-starter\nnpm install\nnpm start" },
    { title: "2 · Open it", body: "Open http://localhost:3000." },
    { title: "3 · Start Claude Code", body: "In a second terminal, run:\nclaude" },
    { title: "Expected starting state", body: "Profiles, Glossary and Library are empty — only the Game works." }
  ],
  prompt: "Clone https://github.com/jyse/aetherlink-classroom-starter.git, then run npm install and npm start. Open http://localhost:3000 — Profiles, Glossary and Library are empty; only the Game works. Then open a second terminal in the same folder and run claude. Put a checkmark in chat once both are running.",
  notes: "Facilitator-led step, not self-paced — walk the room through it together and watch chat for stragglers before moving on. The GitHub repo name stays aetherlink-classroom-practice; only the product's on-screen branding is Aether Library, so don't be thrown if the clone URL doesn't match the name on screen. If someone's npm install hangs, pair them with a neighbour to keep pace rather than debugging live for everyone."
},

/* ---------------------------------------------------------------------- */
/* DAY 1 — Assignment block 1                                              */
/* ---------------------------------------------------------------------- */

{ // Slide 35
  title: "Assignment 1: Repository explorer",
  kicker: "DAY 1 · ASSIGNMENT 1 · 25 MIN",
  subtitle: "Use Claude Code to understand the project without changing it.",
  type: "practice",
  layout: "exercise",
  timer: 25,
  cards: [
    { title: "Deliver", body: "app purpose\nproject structure\nrelevant files\nstart and validate commands\nprotected areas\nOPEN questions" }
  ],
  steps: [
    "Explore the repository without changing anything.",
    "Explain what the app does and how it's structured.",
    "Find where profiles and glossary data live.",
    "Find the start and validate commands.",
    "Flag files that could break something if changed carelessly.",
    "Mark anything unverifiable as OPEN rather than guessing."
  ],
  expected: "An evidence-based repository map. No code changed, and unknowns are marked OPEN rather than guessed.",
  notes: "First solo assignment of the day — expect questions about basic terminal use in the first five minutes, that's normal. Start the timer visibly. At 5 minutes remaining, give a verbal warning. If someone finishes early, have them dig into one OPEN question rather than move ahead."
},

{ // Slide 36
  title: "Assignment 1 review",
  kicker: "DAY 1 · ASSIGNMENT 1 · REVIEW",
  subtitle: "Compare Claude's explanation with the repository.",
  type: "review",
  visual: { lineReveal: 0, stamps: ['PASS', 'REVISE', 'OPEN'], bot: 'head', place: 'stamps' },
  cards: [
    { title: "Compare", body: "Which claims came from actual files?\nWhich claims were assumptions?\nDid Claude change anything?\nDid it find the correct commands?\nWhat remains OPEN?" }
  ],
  check: "Decision: PASS, REVISE or OPEN",
  notes: "Pull two or three real answers from the room rather than talking in the abstract — ask someone to read out one OPEN question their Claude session raised."
},

/* ---------------------------------------------------------------------- */
/* DAY 1 — Assignment block 2                                              */
/* ---------------------------------------------------------------------- */

{ // Slide 37
  title: "Assignment 2: Participant profile",
  kicker: "DAY 1 · ASSIGNMENT 2 · 30 MIN",
  subtitle: "Add your profile — and the page that shows it.",
  type: "practice",
  visual: { badge: 0 },
  layout: "exercise",
  timer: 30,
  cards: [
    { title: "Include", body: "name\nrole\nteam\nexperience\nlearning goal\none workflow you'd like AI to improve" }
  ],
  steps: [
    "Inspect the existing structure first.",
    "Ask you for anything it doesn't know — no invented details.",
    "Propose both the profile data and the page that displays it.",
    "Show the plan before changing anything.",
    "Leave out confidential or unnecessary personal information.",
    "Confirm the profile is visible on the Profiles page afterward."
  ],
  expected: "Your profile appears on a working Profiles page and passes validation, with the plan approved before any file changed.",
  notes: "Watch for participants who skip straight to editing the file — redirect them back to explore/plan without being heavy-handed about it, this is the first time they'll feel the method in their own hands. Remind them explicitly: no confidential or unnecessary personal information."
},

{ // Slide 38
  title: "Profile review",
  kicker: "DAY 1 · ASSIGNMENT 2 · REVIEW",
  subtitle: "Check:",
  type: "review",
  tagline: "Swap with your neighbour — 2 minutes each way.",
  visual: { checklist: 0, swap: true },
  cards: [
    { title: "Peer review", body: "The profile follows the existing structure.\nThe content is appropriate to share.\nThe profile appears correctly.\nNo unrelated files changed.\nThe participant reviewed the diff." }
  ],
  notes: "Pair participants up briefly for the peer-review line item — two minutes each way is enough, this is a light touch, not a formal code review."
},

{ // Slide 39
  title: "Short break",
  kicker: "DAY 1 · BREAK",
  subtitle: "Return in 15 minutes.",
  type: "pause",
  visual: { countdown: 15, bot: 'wave', place: 'beside' },
  cards: [
    { title: "Return in 15 minutes", body: "We continue with the glossary contribution." }
  ],
  notes: "State the actual clock time you'll resume. Use the break to skim a couple of participants' profiles if you haven't already — it helps you call on real examples once Assignment 3 starts."
},

/* ---------------------------------------------------------------------- */
/* DAY 1 — Assignment block 3                                              */
/* ---------------------------------------------------------------------- */

{ // Slide 40
  title: "Assignment 3: Glossary contribution",
  kicker: "DAY 1 · ASSIGNMENT 3 · 30 MIN",
  subtitle: "Choose one AI term and add it to the glossary.",
  type: "practice",
  visual: { template: 0, templateRows: ['Term', 'Definition'] },
  layout: "exercise",
  timer: 30,
  cards: [
    { title: "Add", body: "a plain-language definition — 1–2 sentences, in English" }
  ],
  steps: [
    "Choose one AI term not already in the glossary.",
    "Follow the existing glossary structure, written for someone new to agentic AI.",
    "Show the draft before touching the repository.",
    "Avoid claims that can't be backed up.",
    "Build the Glossary page too, if it doesn't already display entries."
  ],
  expected: "A new glossary entry appears on a working Glossary page, reviewed as a draft before it was added.",
  notes: "The verification step is the whole point of this assignment — if someone's first draft goes straight in unchecked, stop and ask them to verify it against today's material first."
},

{ // Slide 41
  title: "Assignment 4: Enriched concept card",
  kicker: "DAY 1 · ASSIGNMENT 4 · 45 MIN",
  subtitle: "Turn one glossary term into a complete concept card.",
  type: "practice",
  visual: { template: 0 },
  layout: "exercise",
  timer: 45,
  cards: [
    { title: "Include", body: "plain-language explanation\npractical example\ncommon misunderstanding\nessential points\nrelated concepts\nreliable resources (official docs or research)" }
  ],
  steps: [
    "Inspect the existing data structure and application design first.",
    "Propose the card content and the smallest plan — including the Library page, if it doesn't exist yet.",
    "Open and read each source — a search result is not a check.",
    "Wait for approval before changing files.",
    "Run the relevant checks afterward."
  ],
  expected: "One enriched concept card appears on a working Library page, verified and checked.",
  notes: "Longest assignment of the morning — the room will feel the jump from a basic glossary entry to a fully sourced card. Circulate and coach on 'verify the factual explanation' specifically; that's the step people are tempted to skip under time pressure."
},

{ // Slide 42
  title: "Concept card review",
  kicker: "DAY 1 · ASSIGNMENT 4 · REVIEW",
  subtitle: "Review the card with another participant:",
  type: "review",
  visual: { lineReveal: 0, stamps: ['PASS', 'REVISE', 'OPEN'], swap: true },
  cards: [
    { title: "Check together", body: "Is the definition accurate?\nDoes the example make the concept clearer?\nAre the sources appropriate?\nWhich sentence comes from which source?\nDid Claude invent anything?\nDoes the card follow the required structure?" }
  ],
  check: "Decision: PASS, REVISE or OPEN",
  notes: "Same three-way decision as slide 36 — by now the room should start producing it without prompting."
},

/* ---------------------------------------------------------------------- */
/* DAY 1 — Closing                                                          */
/* ---------------------------------------------------------------------- */

{ // Slide 43
  title: "Day 1 learning note",
  kicker: "DAY 1 · CLOSING",
  subtitle: "Five quiet minutes — in your own words.",
  type: "recap",
  visual: { notebook: 0, quietTimer: 5, highlight: [{ in: 'tagline', text: 'OPEN', tone: 'orange' }] },
  cards: [
    { title: "Record", body: "what you created\nhow you used Claude Code\nwhat you tested\nwhat you learned\nwhat remains unclear\nwhat you want to try tomorrow" }
  ],
  tagline: "Write the note yourself. Preserve uncertainty as OPEN.",
  notes: "Day 2 doesn't ask participants to revisit this note directly (Day 2 works from concept cards, not this note), but the habit of writing a raw, honest note — not one polished by Claude — is worth protecting today. Give people genuinely quiet time to write it, five minutes is enough."
},

{ // Slide 44
  title: "Day 1 recap",
  kicker: "DAY 1 · CLOSING",
  subtitle: "Today you:",
  type: "recap",
  visual: { badges: ['🧠', '🤖', '🔍', '✅', '🃏', '👤'], bot: 'happy', place: 'aside',
    highlight: [{ in: 'tagline', text: 'reusable skill', tone: 'orange' }] },
  cards: [
    { title: "Learned the AI foundations", body: "" },
    { title: "Used Claude Code as an agentic tool", body: "" },
    { title: "Explored an unfamiliar repository", body: "" },
    { title: "Made and validated small changes", body: "" },
    { title: "Created the first concept card", body: "" },
    { title: "Applied human review", body: "" }
  ],
  tagline: "Tomorrow: turn the repeated method into a reusable skill and use it to build the rest of the Library.",
  notes: "Preview only — do not explain skills, MCP or bounded agentic work in depth tonight, that's Day 2's entire structure. End on the tagline, not on details."
},

/* ==========================================================================
   TEACHING DAY 2 — Reusable methods, agentic work and connected context
   ========================================================================== */

{ // Slide 45
  title: "Reusable and connected AI workflows",
  kicker: "TEACHING DAY 2",
  subtitle: "From one concept card to a repeatable method.",
  type: "context",
  visual: { bot: 'wave', place: 'left', dayRoute: ['Warm-up', 'Recap', 'Context', 'Skills', 'Bounded work', 'Game', 'MCP', 'Closing'] },
  cards: [
    { title: "What we're doing", body: "Turning yesterday's method into something reusable, bounded and connected." },
    { title: "Today", body: "Skills, bounded agentic work, the learning game, and approved workplace connections." }
  ],
  notes: "Short re-welcome — most of the room was here yesterday, so this can be brief. Point at the day's shape (warm-up → recap → context → skills → bounded work → game → MCP → closing). The warm-up comes first: Stekkie, LibreChat bio, the action-figure avatar and putting it on your profile — then the retrieval check."
},

{ // Slide 46
  title: "Built with AI: Stekkie",
  kicker: "DAY 2 · SHOW & TELL",
  subtitle: "My own AI garden coach — vibe coded, live at app.stekkie.ai.",
  type: "context",
  visual: { opener: 'showcase', image: 'assets/stekkie.webp', imageLink: 'app.stekkie.ai', stagger: 'pop', compact: true },
  cards: [
    { title: "An idea", body: "A garden coach: what to sow, when to harvest, what's wrong with a leaf." },
    { title: "A conversation with AI", body: "Built by describing what I wanted — no traditional development team." },
    { title: "A live app", body: "Real users, real data, real bugs to fix." }
  ],
  tagline: "Vibe coding gets you a working app. Today is about making it reliable.",
  notes: "Constance demos Stekkie live (app.stekkie.ai) — 3 to 5 minutes, no more. Show one flow end to end, e.g. plant something and harvest it. Then land the tagline: vibe coding got this app live, but what makes it trustworthy is exactly today's material — context, repeatable methods, bounded work and checks. If the site or wifi fails, stay on this slide and tell the story with the image."
},

{ // Slide 47
  title: "LibreChat: teach it who you are",
  kicker: "DAY 2 · WARM-UP · LIBRECHAT",
  subtitle: "Fill in your bio so every answer starts from you.",
  type: "practice",
  layout: "exercise",
  timer: 10,
  stepsHeading: "In LibreChat:",
  visual: { badge: 0 },
  cards: [
    { title: "Your bio covers", body: "role and team\nwhat you work on\nhow you like answers\nlanguage" }
  ],
  steps: [
    "Open LibreChat and go to Settings.",
    "Find the personalisation / bio section.",
    "Write a short bio: role, team, what you work on, and how you like answers (short, with examples, which language).",
    "Nothing confidential — no customer data, no credentials.",
    "Test it: start a new chat and ask \"What do you know about me?\""
  ],
  expected: "LibreChat describes you correctly — without you telling it again in the chat.",
  tagline: "Your bio is personal context. CLAUDE.md, later today, is the same idea for a project.",
  notes: "Ten minutes, hands on. Walk the room and check people actually find the setting. The tagline is the bridge: the bio is context about you, and slides 52–53 (Sources of context, CLAUDE.md) return to exactly this idea for a project. Worth showing in two minutes if time allows — don't make it a LibreChat course: (1) the Prompts library — saved prompts with variables, the LibreChat version of a repeated method (→ skills, slide 57); (2) Agents — your own assistant with instructions and files, level 4–5 on the Levels of AI use slide; (3) choosing a model per conversation; (4) uploading a file to ask about it — only what is relevant, current and permitted."
},

{ // Slide 48
  title: "Warm-up: your action-figure avatar",
  kicker: "DAY 2 · WARM-UP · 5 MIN",
  subtitle: "Create the coolest action-figure picture of yourself in LibreChat.",
  type: "practice",
  layout: "exercise",
  timer: 5,
  stepsHeading: "Your prompt must ask LibreChat to:",
  visual: { compact: true, cardImages: ['assets/avatars/avatar-cartoon.webp', 'assets/avatars/avatar-superhero.webp', 'assets/avatars/avatar-jipjanneke.webp'] },
  cards: [
    { title: "Cartoon", body: "Create a square cartoon avatar of me as an action figure: [describe yourself — hair, glasses, outfit], holding a laptop and a coffee. Bright colours, no text." },
    { title: "Superhero", body: "Create a square comic-book superhero portrait of me: [describe yourself]. Cape, city skyline at night, no text." },
    { title: "Jip and Janneke", body: "Create a square avatar of me as a Dutch Jip and Janneke silhouette: black on a plain coloured background. [describe yourself]. No text." }
  ],
  steps: [
    "Make an image of you — describe yourself, no real photo needed.",
    "Pick a style: cartoon, superhero, Jip and Janneke — or your own.",
    "Square, plain background, no text.",
    "Download the one you like best — you need it in Claude Code next."
  ],
  expected: "A square avatar you'd happily put on your profile.",
  tagline: "Bonus: make it your LibreChat avatar too.",
  notes: "Five minutes, keep the energy high — this is meant to be fun. The three examples are starting points; encourage people to change them. Jip and Janneke is a well-known Dutch children's-book style (Fiep Westendorp): black silhouettes — explain it in one sentence for non-Dutch participants. Everyone describes themselves instead of uploading a real photo. Make sure everyone has actually downloaded the file before moving on. Bonus (tagline): LibreChat avatar via Settings → Account. The three thumbnails are AetherBOT made with these same prompts (nano-banana-pro, chest logo put back from the original asset) — proof the prompts work."
},

{ // Slide 49
  title: "Your avatar in the Aether Library",
  kicker: "DAY 2 · WARM-UP · CLAUDE CODE",
  subtitle: "Profiles don't have a photo yet — ask Claude Code to add one.",
  type: "practice",
  layout: "exercise",
  visual: { badge: 0 },
  cards: [
    { title: "Your profile", body: "photo\nname\nrole\nlearning goal" }
  ],
  steps: [
    "Explore how profiles are stored and shown on the Profiles page.",
    "Plan an optional photo for a profile: the image in public/avatars/, initials when there is none.",
    "Show the plan before editing.",
    "Add your own avatar to your profile.",
    "Test it: one profile with a photo, one without — both still look right."
  ],
  expected: "Your profile shows your avatar; profiles without a photo still show initials.",
  tagline: "Keep it local — don't commit your picture to a public repository.",
  notes: "Back to Claude Code, and back to the working method from Day 1 in miniature: explore, plan, approve, change, test. First make sure everyone has moved the downloaded image into their project (public/avatars/). The fallback to initials is the part people forget — that's the 'test' step: check a profile without a photo too. Watch for participants who let Claude edit without showing a plan first."
},

{ // Slide 50
  title: "Retrieval check",
  kicker: "DAY 2 · RECAP",
  subtitle: "Without looking at yesterday's slides, explain:",
  type: "recap",
  tagline: "Answer from memory first — no peeking.",
  visual: { reveal: 'click', bot: 'peek', place: 'slot', noReact: true },
  cards: [
    { title: "Why is Claude Code agentic?", body: "" },
    { title: "What is context?", body: "" },
    { title: "What happens during human review?", body: "" },
    { title: "What is the difference between a claim and evidence?", body: "" },
    { title: "What are the six steps in our working method?", body: "" }
  ],
  notes: "Genuinely make them answer without looking back at Day 1's deck — cold retrieval, not open-book. If the room struggles with the six steps, that's useful signal: slow down Part 1 rather than push ahead."
},

{ // Slide 51
  title: "Levels of AI use",
  kicker: "DAY 2 · RECAP",
  subtitle: "From asking a model to building an agent.",
  type: "concept",
  layout: "steps",
  visual: { stepKeys: true, art: 'stairs', today: [2, 3] },
  items: [
    { label: "Ask a model", caption: "Ask a model for a response." },
    { label: "Use Claude Code", caption: "Use Claude Code to work inside a project." },
    { label: "Customise Claude Code", caption: "With project instructions and skills." },
    { label: "Design a bounded workflow", caption: "With tools and checks." },
    { label: "Build a deployed agent", caption: "A separately deployed agent application." }
  ],
  tagline: "Today focuses on levels 3 and 4.",
  notes: "This is the map for the whole day: Part 1 lives at level 2–3 (context, CLAUDE.md), Part 2 at level 3 (skills), Part 3–5 at level 4 (bounded agentic work, the game, MCP). Point forward to today's parts as you introduce each level."
},

/* ---------------------------------------------------------------------- */
/* DAY 2 — Part 1: Context and CLAUDE.md                                   */
/* ---------------------------------------------------------------------- */

{ // Slide 52
  title: "Sources of context",
  kicker: "DAY 2 · PART 1 · CONTEXT & CLAUDE.MD",
  subtitle: "Where context can come from.",
  type: "concept",
  visual: { art: 'intake', bot: 'head', place: 'aside', tags: { 4: 'later today' } },
  cards: [
    { title: "Current conversation", body: "The task requested now." },
    { title: "Project instructions", body: "CLAUDE.md" },
    { title: "Task files", body: "Brief, ticket or plan." },
    { title: "Repository", body: "Code, tests and documentation." },
    { title: "Connected system", body: "Jira, GitLab or Confluence through approved tools." }
  ],
  notes: "The last row is the one to underline — it's the seed for Part 5's MCP content later today."
},

{ // Slide 53
  title: "CLAUDE.md",
  kicker: "DAY 2 · PART 1 · CONTEXT & CLAUDE.MD",
  subtitle: "The briefing Claude reads at the start of every session.",
  type: "concept",
  visual: { mdfile: 1, guides: [['🧭', 'CLAUDE.md', 'guides Claude'], ['🔒', 'Permissions', 'enforce access']] },
  cards: [
    { title: "Purpose", body: "CLAUDE.md provides persistent project instructions to Claude Code." },
    { title: "Useful contents", body: "project purpose and structure\nconventions\napproved commands\nprivacy boundaries\nvalidation requirements\nhuman approval points" }
  ],
  tagline: "It guides Claude. Permissions and technical controls enforce access.",
  notes: "The tagline matters as much as the contents list — CLAUDE.md is deliberately not a prompt landfill, and it isn't an access-control mechanism either. Point participants to their seed CLAUDE.md now."
},

{ // Slide 54
  title: "Assignment 5: Project instructions",
  kicker: "DAY 2 · ASSIGNMENT 5 · 30 MIN",
  subtitle: "Review and improve the repository's CLAUDE.md.",
  type: "practice",
  visual: { mdfile: 0 },
  layout: "exercise",
  timer: 30,
  cards: [
    { title: "Cover", body: "project purpose\nrelevant structure\nconventions\napproved commands\nprivacy\nvalidation\nhuman approval" }
  ],
  steps: [
    "Review the repository and its current CLAUDE.md.",
    "Propose the minimum persistent instructions needed: purpose, structure, conventions, approved commands, privacy, validation, human approval — but keep what a stranger needs: data shapes and commands.",
    "Leave out temporary assignment notes or personal preferences.",
    "Show the proposed changes before editing."
  ],
  expected: "A CLAUDE.md that a stranger's Claude Code session could rely on without you explaining anything out loud.",
  notes: "Watch for participants pasting today's entire to-do list into CLAUDE.md — redirect with slide 53's contents list: it isn't a prompt landfill or a temporary notes file."
},

{ // Slide 55
  title: "Fresh-session test",
  kicker: "DAY 2 · ASSIGNMENT 5 · REVIEW",
  subtitle: "Start a fresh Claude Code session.",
  type: "review",
  tagline: "Type /clear — your files stay. Your neighbour asks the five questions and decides.",
  visual: { lineReveal: 0, stamps: ['PASS', 'REVISE', 'OPEN'], swap: true, highlight: [{ in: 'tagline', text: '/clear', tone: 'orange' }] },
  cards: [
    { title: "Can Claude determine", body: "what the project does\nwhere content belongs\nhow to validate changes\nwhich boundaries apply\nwhen human approval is required" }
  ],
  check: "Decision: PASS, REVISE or OPEN",
  notes: "No laptop swap. Everyone types /clear in their own session — the files stay, the conversation is gone. The neighbour on their right then asks the five questions and decides PASS, REVISE or OPEN. If Claude can answer from CLAUDE.md alone, the project instructions work — the single most convincing proof of the morning."
},

{ // Slide 56
  title: "Short break",
  kicker: "DAY 2 · BREAK",
  subtitle: "Return in 15 minutes.",
  type: "pause",
  visual: { countdown: 15, bot: 'wave', place: 'beside' },
  cards: [
    { title: "Return in 15 minutes", body: "We continue with turning a repeated method into a skill." }
  ],
  notes: "State the actual clock time you'll resume. This is the pivot point of the morning — from individual CLAUDE.md edits to the shared skill-building work of Part 2."
},

/* ---------------------------------------------------------------------- */
/* DAY 2 — Part 2: From repeated prompt to skill                          */
/* ---------------------------------------------------------------------- */

{ // Slide 57
  title: "A repeated method",
  kicker: "DAY 2 · PART 2 · PROMPT TO SKILL",
  subtitle: "The same six instructions — every single time.",
  type: "context",
  visual: { repeatStack: 0, bot: 'sleepy', place: 'aside' },
  cards: [
    { title: "Yesterday, one concept card required instructions for", body: "structure\nsource checking\nexamples\nmissing information\nvalidation\nhuman approval" }
  ],
  tagline: "The next card requires the same method.",
  notes: "This bridges directly from yesterday's concept-card assignment into the skill-building work of this whole part — say that connection out loud."
},

{ // Slide 58
  title: "Assignment 6: Create a second card",
  kicker: "DAY 2 · ASSIGNMENT 6 · 25 MIN",
  subtitle: "Create a second concept card with an ordinary prompt. Do not use a skill yet.",
  type: "practice",
  visual: { noSkill: 0 },
  layout: "exercise",
  timer: 25,
  cards: [
    { title: "Do this with a plain prompt", body: "Use the same requirements and validation method as yesterday's approved card." }
  ],
  steps: [
    "Choose a second term — add it to the glossary first if it isn't there yet.",
    "Use the same requirements and validation method as yesterday's approved card — an ordinary, one-off prompt, no skill.",
    "Show the draft and plan before changing anything.",
    "Confirm the card renders correctly on the existing Library page.",
    "Note which instructions you had to repeat from scratch."
  ],
  expected: "A second concept card created through another one-off prompt — plus a clear sense of what had to be repeated.",
  notes: "Important: this must stay a normal, ad-hoc prompt — not a skill. The inconsistency this creates between people's results is exactly what motivates building a skill next. Don't let anyone jump ahead to Assignment 7 yet."
},

{ // Slide 59
  title: "Compare the two runs",
  kicker: "DAY 2 · ASSIGNMENT 6 · REVIEW",
  subtitle: "Which parts should become a shared method?",
  type: "review",
  visual: { lineReveal: 0, diff: [
    { title: 'Run 1 · yesterday', rows: [{ k: 'Explanation' }, { k: 'Example' }, { k: 'Misunderstanding' }, { k: 'Key points' }, { k: 'Related' }, { k: 'Sources', note: '3' }] },
    { title: 'Run 2 · today', rows: [{ k: 'Explanation' }, { k: 'Example', odd: true, note: 'longer' }, { k: 'Misunderstanding', miss: true, note: 'missing' }, { k: 'Key points' }, { k: 'Related', miss: true, note: 'missing' }, { k: 'Sources', odd: true, note: '1' }] }] },
  cards: [
    { title: "Compare", body: "Which instructions did you repeat?\nDid the cards follow the same structure?\nDid Claude perform the same checks?\nWhich parts should become a shared method?\nWhat must still require human judgement?" }
  ],
  notes: "This discussion creates the need for a reusable method — collect two or three genuinely different outcomes from the room out loud before moving to slide 60, the contrast is the point."
},

{ // Slide 60
  title: "Claude Code skills",
  kicker: "DAY 2 · PART 2 · PROMPT TO SKILL",
  subtitle: "Teach Claude a method once — reuse it every time.",
  type: "concept",
  visual: { mdfile: 1, mdName: 'SKILL.md', highlight: [{ in: 'tagline', text: 'does not start Claude Code or run continuously', tone: 'orange' }] },
  cards: [
    { title: "Definition", body: "A skill packages a reusable method for a recurring task." },
    { title: "A skill can define", body: "when it applies\nrequired input\nprocedure\noutput format\nboundaries\nstop conditions" }
  ],
  tagline: "A skill does not start Claude Code or run continuously.",
  notes: "The tagline is a real guardrail worth repeating — a skill is a packaged method Claude Code applies when relevant, not a background process or its own agent."
},

{ // Slide 61
  title: "Prompt, CLAUDE.md and skill",
  kicker: "DAY 2 · PART 2 · PROMPT TO SKILL",
  subtitle: "Three different mechanisms, three different jobs.",
  type: "concept",
  visual: { lifespan: [{ kind: 'now', icon: '💬', label: 'now' }, { kind: 'always', icon: '📄', label: 'every session' }, { kind: 'recurring', icon: '🧰', label: 'whenever that task comes up' }] },
  cards: [
    { title: "Prompt", body: "The task Claude should perform now." },
    { title: "CLAUDE.md", body: "Project instructions that apply across sessions." },
    { title: "Skill", body: "A reusable method for one type of task." }
  ],
  notes: "This table is the exact distinction Assignment 7 asks participants to build — point back to it once the room starts working."
},

{ // Slide 62
  title: "Create Concept Card skill",
  kicker: "DAY 2 · PART 2 · PROMPT TO SKILL",
  subtitle: "You build this skill from nothing — this is where it lives.",
  type: "context",
  visual: { tree: 0 },
  cards: [
    { title: "Create, test and improve", body: ".claude/skills/create-concept-card/SKILL.md" }
  ],
  notes: "Preparing an incomplete skill is safer and clearer than asking every participant to invent the structure from nothing. Point out where the file lives before Assignment 7 starts so nobody spends their first five minutes just finding it."
},

{ // Slide 63
  title: "Assignment 7: Teach Claude the method",
  kicker: "DAY 2 · ASSIGNMENT 7 · 45 MIN",
  subtitle: "Build the Create Concept Card skill.",
  type: "practice",
  visual: { mdfile: 0, mdName: 'SKILL.md' },
  layout: "exercise",
  timer: 45,
  cards: [
    { title: "The skill must cover", body: "required source information\ncard structure\nfactual verification\nmissing information\nvalidation\nhuman approval" }
  ],
  steps: [
    "Use the approved card(s) as evidence of what \"good\" looks like.",
    "Create the skill at .claude/skills/create-concept-card/SKILL.md.",
    "Require real sources before trusting any factual claim.",
    "Follow the exact existing concept-card structure.",
    "Keep uncertainty as OPEN rather than inventing content.",
    "Validate its output, then stop for human approval before writing to data/concept-cards.json.",
    "Only ever write to data/concept-cards.json — never touch glossary or profiles."
  ],
  expected: "A complete create-concept-card skill, tested against the approved cards.",
  notes: "This is the room's first time authoring their own skill — expect it to take longer than the slide's implied pace. Your job here is coaching, not demoing a pre-built answer; circulate and check each skill still stops for human approval rather than finishing unattended."
},

{ // Slide 64
  title: "Lunch",
  kicker: "DAY 2 · LUNCH",
  subtitle: "Enjoy your lunch.",
  type: "pause",
  visual: { countdown: 60, bot: 'wave', place: 'beside' },
  cards: [
    { title: "Back at 13:00", body: "We continue with bounded agentic work — using the skill across every term at once." }
  ],
  notes: "Exact resume time: 13:00. This is the natural point to check in with anyone whose skill from Assignment 7 isn't quite working yet — a quick word over lunch is easier than derailing the afternoon's start."
},

/* ---------------------------------------------------------------------- */
/* DAY 2 — Part 3: Bounded agentic work                                    */
/* ---------------------------------------------------------------------- */

{ // Slide 65
  title: "Bounded autonomy",
  kicker: "DAY 2 · PART 3 · BOUNDED AGENTIC WORK",
  subtitle: "One goal, many steps — inside a fence.",
  type: "concept",
  visual: { fence: 1 },
  cards: [
    { title: "Definition", body: "Claude Code can perform several steps after receiving one goal." },
    { title: "Boundaries define", body: "what it may read\nwhat it may change\nwhich checks it must run\nwhen it must stop\nwhich decisions remain human" }
  ],
  notes: "This is the concept Assignment 8 puts into practice immediately — a single instruction that processes many terms, still bounded by explicit stop conditions."
},

{ // Slide 66
  title: "Assignment 8: Build the card library",
  kicker: "DAY 2 · ASSIGNMENT 8 · 45 MIN",
  subtitle: "Use one instruction to process every approved glossary term.",
  type: "practice",
  visual: { conveyor: 0 },
  layout: "exercise",
  timer: 45,
  cards: [
    { title: "For each term", body: "read the glossary entry\ncheck sufficiency\ncreate the concept card\nvalidate the required fields\nrecord READY, REVISE or OPEN\ncontinue with the next term" }
  ],
  steps: [
    "First add 4 new terms to the glossary — definitions only, no cards.",
    "Use the create-concept-card skill on every remaining approved glossary term, one at a time.",
    "For each: read the entry, check whether information and sources are sufficient, create the card, validate required fields.",
    "Record READY, REVISE or OPEN for each one.",
    "Never invent missing information. Never commit anything.",
    "Approve each card as it comes — then ask for one summary with READY, REVISE or OPEN per term."
  ],
  expected: "Draft concept cards for all suitable terms, plus a status report ready for human review.",
  notes: "It's explicitly low infra-risk to prepare since participants build and run it themselves — your job here is circulating and checking each run actually stops to report rather than committing unattended. Watch especially for terms it should have marked OPEN instead of guessing."
},

{ // Slide 67
  title: "Agentic behaviour in the assignment",
  kicker: "DAY 2 · PART 3 · BOUNDED AGENTIC WORK",
  subtitle: "The agent loop inside Assignment 8.",
  type: "concept",
  layout: "steps",
  visual: { stepKeys: true, art: 'loop', loopCaptions: true },
  items: [
    { label: "Observe", caption: "Read the next term and source." },
    { label: "Decide", caption: "Determine whether the information is sufficient." },
    { label: "Act", caption: "Create or revise the card." },
    { label: "Check", caption: "Validate the card." },
    { label: "Repeat or stop", caption: "Continue, mark OPEN or request human input." }
  ],
  notes: "This is the agent loop from slide 30, now made concrete in the exact assignment the room is running. Use it as a live diagnostic while circulating: ask a stuck participant which of these five steps their session is stuck on."
},

{ // Slide 68
  title: "Batch review",
  kicker: "DAY 2 · ASSIGNMENT 8 · REVIEW",
  subtitle: "Review the batch before accepting it.",
  type: "review",
  tagline: "Human decision: accept, revise or reject each card.",
  visual: { lineReveal: 0, perCard: ['ACCEPT', 'REVISE', 'ACCEPT', 'REJECT'], highlight: [{ in: 'tagline', text: 'each card', tone: 'orange' }] },
  cards: [
    { title: "Check each card", body: "Did the skill apply consistently?\nWhich cards lack reliable sources?\nWhich claims require correction?\nDid Claude report actual test results?\nWhich items remain OPEN?" }
  ],
  check: "Human decision: accept, revise or reject each card.",
  notes: "This is a per-card decision, not one decision for the whole batch — make that explicit before the room starts reviewing."
},

{ // Slide 69
  title: "Short break",
  kicker: "DAY 2 · BREAK",
  subtitle: "Return in 15 minutes.",
  type: "pause",
  visual: { countdown: 15, bot: 'wave', place: 'beside' },
  cards: [
    { title: "Return in 15 minutes", body: "We continue with the Explain It Back learning game." }
  ],
  notes: "State the actual clock time you'll resume. The afternoon's remaining assignments (9 and 10) are the two most substantial of the whole programme — use this break to reset your own energy too."
},

/* ---------------------------------------------------------------------- */
/* DAY 2 — Part 4: Learning game                                          */
/* ---------------------------------------------------------------------- */

{ // Slide 70
  title: "Explain It Back",
  kicker: "DAY 2 · PART 4 · LEARNING GAME",
  subtitle: "The Library now contains enough structured knowledge to support a learning game.",
  type: "concept",
  visual: { gameFlow: true },
  cards: [
    { title: "One AI term", body: "Shown from the approved concept cards." },
    { title: "An answer field", body: "The participant types their own explanation." },
    { title: "The approved concept card", body: "Revealed after the explanation is submitted." },
    { title: "Feedback or self-review", body: "Checked against what a good explanation contains." },
    { title: "The next term", body: "Continue through the deck of approved cards." }
  ],
  notes: "This is the payoff of Parts 2–3 — every card the room built now feeds this game. Say that connection explicitly before moving to the starter state."
},

{ // Slide 71
  title: "Game starter state",
  kicker: "DAY 2 · PART 4 · LEARNING GAME",
  subtitle: "The game works — only the feedback is missing.",
  type: "concept",
  visual: { checklist: 0, gameMock: true },
  cards: [
    { title: "Already available", body: "game page and visual design\nterm card\nanswer field\nSubmit button\nempty feedback area\napproved concept-card data" }
  ],
  tagline: "Participants complete the behaviour.",
  notes: "Point out explicitly what's missing: the game doesn't yet do anything when Submit is clicked. That gap is exactly what Assignment 9 fills."
},

{ // Slide 73 (shown before 64: explains checklist.md + categories first)
  title: "checklist.md and the term-checker skill",
  kicker: "DAY 2 · PART 4 · LEARNING GAME",
  subtitle: "What a good explanation must contain — and how Claude Code checks it.",
  type: "concept",
  visual: { mdfile: 0, mdName: 'checklist.md', catChips: 1 },
  cards: [
    { title: "checklist.md checks", body: "central meaning\nimportant elements\npractical example\nincorrect claims\nmissing information\nrecommended resources" },
    { title: "Feedback categories", body: "Strong explanation\nPartially complete\nReview this concept\nUnable to evaluate" },
    { title: "Skill #2: term-checker", body: "Reads checklist.md and the latest submission, compares them, and writes structured feedback. The criteria live in checklist.md, not hardcoded in the skill." }
  ],
  notes: "checklist.md lives at the repo root, separate from the skill file — it's participant- and class-authored, and people may edit or extend it. This is deliberately the same pattern as create-concept-card (Skill #1): the reusable method stays generic, the specific criteria live in their own file. Say explicitly that this is required behaviour for Assignment 9, not an optional extra — there is no separate 'AI Concept Coach' assignment; this is it."
},

{ // Slide 72 (now after 65)
  title: "Assignment 9: Learning game",
  kicker: "DAY 2 · ASSIGNMENT 9 · 60 MIN",
  subtitle: "The game already works. Build checklist.md and the term-checker skill, then use them.",
  type: "practice",
  visual: { mdfile: 0, mdName: 'checklist.md', phrase: 'Check my latest submission using the term-checker skill.' },
  layout: "exercise",
  timer: 60,
  cards: [
    { title: "Part A — a good explanation has", body: "central meaning\nessential points\na practical example\nno incorrect claims\nno missing information\nrelevant resources" }
  ],
  steps: [
    "Part A: propose what a good \"explain this term back\" answer contains, based on the approved concept cards — including the four rating categories: Strong explanation · Partially complete · Review this concept · Unable to evaluate. Write it to checklist.md once approved.",
    "Part B: create .claude/skills/term-checker/SKILL.md — it reads checklist.md and the latest submission, compares against the matching concept card, and writes structured feedback.",
    "The skill must read checklist.md generically (never hardcode criteria) and never call an external API or model.",
    "Part C: say the exact phrase — \"Check my latest submission using the term-checker skill.\""
  ],
  expected: "A working game where AI feedback comes entirely from your own authenticated Claude Code session — no API credentials, no external model calls, no database.",
  notes: "Longest single assignment of the two days — give it the full 60 minutes and don't rush the wrap-up. Do NOT let anyone rebuild the game itself — it already works; the real work is Parts A and B, then actually saying Part C's exact phrase at least once. The key thing to protect: no API keys, no external model calls, no database — feedback comes entirely from the participant's own already-authenticated Claude Code session reading and writing local files. Watch for people who build checklist.md and the skill but skip Part C because time is short."
},

{ // Slide 74
  title: "Game review",
  kicker: "DAY 2 · ASSIGNMENT 9 · REVIEW",
  subtitle: "Test with:",
  type: "review",
  tagline: "Goal: useful feedback, without inventing facts, from the participant's own Claude Code session.",
  visual: { runner: [{ label: 'Strong explanation', tone: 'green' }, { label: 'Partially complete', tone: 'orange' }, { label: 'Review this concept', tone: 'red' }, { label: 'Unable to evaluate', tone: 'grey' }, { label: 'clear empty state — no crash', tone: 'cyan' }] },
  cards: [
    { title: "Test cases", body: "a strong explanation\nan incomplete explanation\nan incorrect explanation\nan empty answer\na Check feedback click before Claude Code has processed the submission" }
  ],
  check: "Goal: useful feedback, without inventing facts, from the participant's own Claude Code session.",
  notes: "The last test case is the one people forget — clicking Check feedback before ever asking Claude Code to check the submission should show a clear empty state, not a crash or stale data. If it doesn't, that's a real bug worth fixing before calling the assignment done."
},

/* ---------------------------------------------------------------------- */
/* DAY 2 — Part 5: MCP and workplace systems                              */
/* ---------------------------------------------------------------------- */

{ // Slide 75
  title: "Model Context Protocol",
  kicker: "DAY 2 · PART 5 · MCP & WORKPLACE SYSTEMS",
  subtitle: "One standard plug for approved connections.",
  type: "concept",
  visual: { plugs: 1, highlight: [{ in: 'tagline', text: 'does not remove permissions or human responsibility', tone: 'orange' }] },
  cards: [
    { title: "Definition", body: "MCP standardises how AI applications connect to approved information and capabilities." },
    { title: "An MCP server may expose", body: "resources\nreusable prompts\ntools" }
  ],
  tagline: "Connecting a server does not remove permissions or human responsibility.",
  notes: "Say the tagline explicitly and connect it back to the working agreement (slide 32) — being connected to something is not the same as being allowed to change it."
},

{ // Slide 76
  title: "Repository access and MCP",
  kicker: "DAY 2 · PART 5 · MCP & WORKPLACE SYSTEMS",
  subtitle: "Files are local. MCP is for everything outside.",
  type: "concept",
  layout: "compare",
  visual: { zones: ['your laptop', 'outside', ['Jira', 'GitLab', 'Confluence']] },
  columns: [
    { title: "Local repository", items: [
      "Claude Code uses built-in tools to read files and run project commands."
    ] },
    { title: "External system", items: [
      "MCP can provide approved access to Jira, GitLab or Confluence."
    ], foot: "The repository itself does not require MCP." }
  ],
  notes: "Keep this distinction crisp: everything the room has done since slide 33 used only built-in file tools. MCP is what's new starting with this part."
},

{ // Slide 77
  title: "Approved connections",
  kicker: "DAY 2 · PART 5 · MCP & WORKPLACE SYSTEMS",
  subtitle: "Connect the approved Worldline services.",
  type: "context",
  visual: { pending: ['Setup steps follow', 'The approved instructions are added after the technical check.'] },
  cards: [
    { title: "Services", body: "Jira\nGitLab\nConfluence" },
    { title: "Inside Claude Code, use", body: "/mcp" }
  ],
  prompt: "/mcp",
  notes: "Worldline's MCP access for Jira, GitLab and Confluence is confirmed — this is the real, primary path for Assignment 10, not a stretch goal. Insert the exact Worldline-approved setup instructions here after technical preflight; do not place credentials on this slide. Still keep the local-fixture fallback ready as a safety net in case one participant's connection fails on the day, but plan and pace the room around the real connections working."
},

{ // Slide 78
  title: "Assignment 10: Connected context",
  kicker: "DAY 2 · ASSIGNMENT 10 · 30 MIN",
  subtitle: "Retrieve one authorised item in read-only mode.",
  type: "practice",
  visual: { sourceTiles: 0, planB: 'DEMO_FALLBACK_A10', planBLabel: 'fixture fallback: fixtures/jira-EX-142.json (fictional)' },
  layout: "exercise",
  timer: 30,
  cards: [
    { title: "Choose one", body: "one Jira ticket\none GitLab issue or merge request\none Confluence page" }
  ],
  steps: [
    "Retrieve one authorised item using the approved connection, read-only.",
    "Explain what information was retrieved and which fields support it.",
    "Note what remains unclear.",
    "List which actions the connection could perform that you did not approve.",
    "Do not modify the external system in any way."
  ],
  expected: "No external changes. A sourced, plain-language explanation of one connected item, with unclear points marked OPEN.",
  notes: "Highest infra-risk moment of the two days — verify the MCP connection end-to-end yourself before class. Fallback: if a participant's connection fails, have them use the local fixture files instead and explain those — the teaching point (retrieve, explain, do not modify) survives without a live round-trip. Keep a captured example ready to show the room if several people need the fallback at once."
},

{ // Slide 79
  title: "Transfer to workplace information",
  kicker: "DAY 2 · ASSIGNMENT 10 · REVIEW",
  subtitle: "For the item you retrieved, decide:",
  type: "review",
  visual: { menu: 1 },
  cards: [
    { title: "Decide", body: "1. What is the trusted source?\n2. What output would help your work?\n3. What reusable method could create it?\n4. What should Claude verify?\n5. Which action requires human approval?" },
    { title: "Possible outputs", body: "ticket brief\nfeature explanation\ntechnical guide\nmerge-request summary\nacceptance-criteria review\nonboarding article" }
  ],
  notes: "This is where the Aether Library's whole method (source → structured output → validation → human approval) gets pointed at real Worldline work — give the room a few minutes to actually answer these five questions for their own retrieved item, not just read them."
},

{ // Slide 80
  title: "The same pattern across systems",
  kicker: "DAY 2 · PART 5 · MCP & WORKPLACE SYSTEMS",
  subtitle: "Two systems, one method.",
  type: "concept",
  layout: "compare",
  visual: { pipes: true, same: [2, 3] },
  columns: [
    { title: "Aether Library", items: [
      "Glossary source → concept card → validation → human approval"
    ] },
    { title: "Workplace system", items: [
      "Jira, GitLab or Confluence source → useful work output → validation → human approval"
    ] }
  ],
  tagline: "The source and output change. The design questions remain the same.",
  notes: "This is the whole two days compressed into one sentence — let it land before moving into the closing sequence."
},

/* ---------------------------------------------------------------------- */
/* DAY 2 — Closing                                                          */
/* ---------------------------------------------------------------------- */

{ // Slide 81
  title: "What you built",
  kicker: "DAY 2 · CLOSING",
  subtitle: "Together, we created:",
  type: "recap",
  layout: "recap",
  visual: { recapKeys: true, bot: 'happy', place: 'aside' },
  items: [
    { label: "Participant profile" },
    { label: "AI glossary contribution" },
    { label: "Enriched concept cards" },
    { label: "Improved CLAUDE.md" },
    { label: "Reusable create-concept-card and term-checker skills" },
    { label: "Bounded multi-card agentic run" },
    { label: "Explain It Back learning game, with real AI feedback" },
    { label: "Approved external connection" }
  ],
  notes: "The items appear on their own, one by one — no clicking needed. Let them come in without talking over them, and let the room recognise their own two days of work in the list."
},

{ // Slide 82
  title: "What you can now do",
  kicker: "DAY 2 · CLOSING",
  subtitle: "How Claude Code works, and why the boundaries matter.",
  type: "recap",
  layout: "recap",
  visual: { levelUp: true },
  items: [
    { label: "Use Claude Code inside a repository." },
    { label: "Provide context and boundaries." },
    { label: "Review plans, changes and evidence." },
    { label: "Distinguish prompts, project instructions and skills." },
    { label: "Recognise bounded agentic behaviour." },
    { label: "Explain what MCP provides." },
    { label: "Preserve human review and handoff." }
  ],
  notes: "This is the understanding checklist, not the artefact checklist (that was slide 81) — the distinction is worth naming out loud."
},

{ // Slide 83
  title: "The five support days",
  kicker: "PREVIEW · SUPPORT DAYS",
  subtitle: "The support programme builds on this foundation.",
  type: "context",
  tagline: "Preview only — the support days go deeper.",
  visual: { art: 'timeline', supportDays: true },
  cards: [
    { title: "1 · AI-native SDLC foundations", body: "" },
    { title: "2 · Planning, testing, review and handoff", body: "" },
    { title: "3 · Agent workflow in n8n", body: "" },
    { title: "4 · Agent workflow in Claude Code with deeper controls", body: "" },
    { title: "5 · Application to a small team issue", body: "" }
  ],
  notes: "Preview only, matching slide 44's pattern — this is a different facilitator's territory starting next time, don't get pulled into detail questions here."
},

{ // Slide 84
  title: "Complete progression",
  kicker: "DAY 2 · CLOSING",
  subtitle: "From your first Claude Code conversation to applying the method during the support days.",
  type: "recap",
  layout: "steps",
  visual: { stepKeys: true, doneSteps: 6 },
  items: [
    { label: "Understand", caption: "Understand AI and Claude Code." },
    { label: "One change", caption: "Make one safe, tested change." },
    { label: "A skill", caption: "Turn a repeated method into a skill." },
    { label: "Bounded work", caption: "Let Claude perform a bounded sequence of work." },
    { label: "Interactive feature", caption: "Build an interactive AI-supported feature." },
    { label: "Connect", caption: "Connect approved workplace information." },
    { label: "Apply it", caption: "Apply the method during the support days." }
  ],
  notes: "The first six steps are exactly what the room just did across the two teaching days — say that explicitly before pointing at the last one, which belongs to the support days."
},

{ // Slide 85
  title: "Human responsibility",
  kicker: "DAY 2 · CLOSING",
  subtitle: "AI can inspect, propose, create, transform and check.",
  type: "context",
  layout: "compare",
  visual: { handover: 'People remain responsible.' },
  columns: [
    { title: "AI can", items: [
      "inspect",
      "propose",
      "create",
      "transform",
      "check"
    ] },
    { title: "People remain responsible for", items: [
      "the goal",
      "permitted context",
      "approval boundaries",
      "factual and technical review",
      "the impact of the final decision"
    ] }
  ],
  notes: "This is the single sentence to leave the room with above all others — slow down here, don't rush it because it's near the end of a long two days."
},

{ // Slide 86
  title: "Final reflection",
  kicker: "DAY 2 · CLOSING",
  subtitle: "Complete these statements.",
  type: "recap",
  tagline: "Complete each statement for yourself.",
  visual: { sentences: true, quietTimer: 3 },
  cards: [
    { title: "I can now…", body: "" },
    { title: "I still need help with…", body: "" },
    { title: "One workflow I want to investigate is…", body: "" },
    { title: "The source of truth would be…", body: "" },
    { title: "The human decision must remain…", body: "" }
  ],
  notes: "End here, in silence for a minute if the room will tolerate it, before any closing announcements — let people actually write their five sentences rather than rushing to logistics."
}

];
