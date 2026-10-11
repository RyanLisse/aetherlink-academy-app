'use strict';
/* Workshop 5 · AI-native SDLC with an SRE agent (PROPOSAL, local branch only, not pushed).
   English, ASD-STE100 style. Text ported from the Academy-app v5 deck (workshop5-slides.v5.ts);
   source: SRE-LESSON.md v5 + DAILY-BRIEF-SOLO.md. Same slide schema as slides.js.
   Open workshop5.html (presenter view: workshop5-presenter.html). */
window.SLIDES = [
  {
    "title": "Welcome to Workshop 5",
    "kicker": "W5 · OPENING · AI-NATIVE SDLC",
    "subtitle": "Today we build an SRE agent.",
    "type": "context",
    "visual": {
      "opener": "welcome",
      "bot": "wave",
      "place": "beside",
      "stagger": "pop"
    },
    "cards": [],
    "keyPoints": [
      "Welcome the room.",
      "Check the setup."
    ],
    "notes": "Time: 10:00 · 1 min. Show this slide while people arrive.\n1. Say: “Welcome. Today we build an SRE agent.”\n2. Check: ask for hands. Who installed Node and Claude Code from INSTALL.md?\n3. If a person has no setup: do not fix it now. Help them at slide 17 and in the 11:00 break."
  },
  {
    "title": "Goal of the day",
    "kicker": "W5 · OPENING · GOAL",
    "subtitle": "Your team can run a 2-day hackathon with Claude in W6–W7.",
    "type": "context",
    "cards": [
      {
        "title": "A working SRE agent loop, with a human gate",
        "body": ""
      },
      {
        "title": "Your hackathon intent.md",
        "body": ""
      },
      {
        "title": "The skills pack",
        "body": ""
      }
    ],
    "tagline": "You take these home.",
    "visual": {
      "badges": [
        "🤖",
        "📄",
        "🧰"
      ],
      "bot": "happy",
      "place": "aside",
      "highlight": [
        {
          "in": "subtitle",
          "text": "2-day hackathon",
          "tone": "orange"
        }
      ]
    },
    "keyPoints": [
      "Goal: the W6–W7 hackathon.",
      "Three things to take home.",
      "The agent proposes. It never executes."
    ],
    "notes": "Time: 10:01 · 2 min.\n1. Say: “Goal: your team can run a 2-day hackathon with Claude in W6–W7.”\n2. Show: the three badges. Say each one in one sentence.\n3. Say: “The agent reads alerts, logs, and metrics. It writes a diagnosis. It proposes a fix as a PR or MR. It never executes.”\n4. Say: “The human gate: a named human approves. Not the agent.”\n5. Say: “At 15:40 you write your hackathon intent.md. You take the skills pack home.”"
  },
  {
    "title": "What we do today",
    "kicker": "W5 · OPENING · 10:00–16:00",
    "subtitle": "Concept. Demo. Your turn.",
    "type": "context",
    "visual": {
      "bot": "point",
      "place": "left",
      "dayRoute": [
        "Recap",
        "Why",
        "Setup",
        "Plan",
        "Design",
        "Build",
        "Test",
        "Deploy",
        "Maintain",
        "Hackathon"
      ]
    },
    "cards": [
      {
        "title": "Morning",
        "body": "10:00 Welcome + W4 recap\n10:30 Why AI-native · 10:45 Setup\n11:15 Plan · 11:40 Design"
      },
      {
        "title": "Afternoon",
        "body": "13:00 Build 1 · 13:50 Build 2\n14:55 Test · 15:15 Deploy\n15:30 Maintain · 15:40 Hackathon"
      }
    ],
    "tagline": "Breaks: 11:00, 12:00 (lunch), 14:40. Close at 15:50.",
    "keyPoints": [
      "Breaks: 11:00, 12:00, 14:40.",
      "Five skill showcases.",
      "15:40: your hackathon intent.md."
    ],
    "notes": "Time: 10:05 · 5 min.\n1. Say: “Each block has three parts. I explain one concept. I show it in my IDE. You do it with a timer.”\n2. Show: the breaks at 11:00, 12:00, and 14:40.\n3. Show: the end point at 15:40. Each team writes the intent.md for its hackathon idea.\n4. Say the five showcases: /design-control-loop (11:25), /show-me (13:52), /verify-this (15:00), /review-and-ship + /visual-pr (15:18), /handoff (15:45).\n5. Say: “At the start of each block, open progress.md. Show the current checks and your latest dated evidence. This takes 30 seconds.”"
  },
  {
    "title": "What was most useful in the last session?",
    "kicker": "W5 · RECAP",
    "subtitle": "Share one thing you learned or used.",
    "type": "context",
    "cards": [],
    "visual": {
      "opener": "ask",
      "bot": "think",
      "place": "beside"
    },
    "keyPoints": [
      "One useful takeaway per table.",
      "Ask for a concrete example."
    ],
    "notes": "Time: 10:10 · 7 min.\n1. Give each table 2 minutes to discuss.\n2. Ask each table to share one useful takeaway from the last session.\n3. Ask how they used it, or where they could use it.\n4. Write the main takeaways on the board."
  },
  {
    "title": "What went wrong? What did you learn?",
    "subtitle": "Give one lesson per table.",
    "cards": [
      {
        "title": "Wrong",
        "body": "What did the agent do that you did not expect?"
      },
      {
        "title": "Lesson",
        "body": "What must you write down before the agent starts?"
      }
    ],
    "kicker": "W5 · W4 RECAP · LESSONS",
    "type": "context",
    "visual": {
      "bot": "point",
      "place": "left",
      "stepThrough": true
    },
    "keyPoints": [
      "One lesson per table.",
      "Listen for unclear goals or missing boundaries.",
      "Connect the lessons to today’s intent.md."
    ],
    "notes": "Time: 10:17 · 6 min.\n1. Ask each table to share one unexpected agent action and one lesson.\n2. Write the lessons on the board.\n3. Connect unclear goals to intent.md, boundaries to hooks, and checks to evals."
  },
  {
    "title": "What would success look like for you today?",
    "kicker": "W5 · YOUR GOAL",
    "subtitle": "Name one thing you want to be able to do after this workshop.",
    "type": "context",
    "cards": [],
    "visual": {
      "opener": "ask",
      "bot": "point",
      "place": "beside"
    },
    "keyPoints": [
      "One concrete outcome per person.",
      "Keep the outcomes for the closing discussion."
    ],
    "notes": "Time: 10:23 · 7 min.\n1. Give each person 1 minute to write their desired outcome.\n2. Let them share at their table.\n3. Collect one or two outcomes per table on the board.\n4. Connect these outcomes to the workshop goal. Explain what fits today and what falls outside the scope.\n5. Keep the outcomes visible. Return to them at the end of the workshop."
  },
  {
    "title": "“AI writes code faster than one year ago.”",
    "kicker": "W5 · WHY AI-NATIVE · THE GAP",
    "subtitle": "The bottleneck moved.",
    "type": "concept",
    "cards": [
      {
        "title": "Fast",
        "body": "Teams write code in hours."
      },
      {
        "title": "Slow",
        "body": "Review, test, and release still wait for people."
      }
    ],
    "visual": {
      "keyLine": 1,
      "stamp": "BOTTLENECK",
      "bot": "head",
      "place": "key",
      "highlight": [
        {
          "in": "card:1",
          "text": "still wait for people",
          "tone": "mark"
        }
      ]
    },
    "keyPoints": [
      "The gap is between build and the rest.",
      "Ask: where did your last feature wait?",
      "Playbook p.3."
    ],
    "notes": "Time: 10:30 · 2 min.\n1. Read the quote from playbook p.3 aloud.\n2. Ask: “Where did your last feature wait longest: on code, or on review, test, and approval?”\n3. Say: “The answer is almost never code. That is the gap.”"
  },
  {
    "title": "Code is not the bottleneck",
    "subtitle": "Build gets faster. Decisions and checks still take time.",
    "cards": [],
    "kicker": "W5 · WHY AI-NATIVE · FIG. 1",
    "type": "concept",
    "visual": {
      "opener": "sdlc-loop",
      "image": "assets/workshop5-bottleneck.svg",
      "imageAlt": "Before agents, Build takes the largest part of the delivery cycle. With AI agents, Build is much shorter while Plan, Design, Test, Deploy, and Maintain still take time, leaving free time on the right."
    },
    "keyPoints": [
      "Waiting time shifts to Plan, Test, and Deploy.",
      "Manual line-by-line review does not scale with more code.",
      "Exceptions and approvals still create waiting time. Review and approval must keep pace."
    ],
    "notes": "Time: 10:32 · 2 min.\n1. Show the top row. Say: “Before agents, Build takes a large part of the cycle.”\n2. Show the bottom row. Say: “Agents make Build faster. Plan, Test, and Deploy still need decisions and checks.”\n3. Say: “Manual line-by-line review does not scale when agents produce more code.”\n4. Say: “Exceptions and approvals still cause waiting time. Review and approval must keep pace.”\n5. Point to the note. Say: “This is illustrative, not a time guarantee.”"
  },
  {
    "title": "AI-native SDLC",
    "kicker": "W5 · DEFINITION",
    "subtitle": "Old control objectives. New enforcement.",
    "type": "concept",
    "cards": [
      {
        "title": "Definition",
        "body": "A new process: a loop, with AI at each point. Humans start, direct, and approve."
      },
      {
        "title": "The loop",
        "body": "Plan\nDesign\nBuild\nTest\nDeploy\nMaintain ↺"
      }
    ],
    "visual": {
      "hero": 0,
      "popOut": 1,
      "bot": "head",
      "place": "popout",
      "stepThrough": true,
      "chipGrid": 3,
      "highlight": [
        {
          "in": "card:0",
          "text": "a loop",
          "tone": "orange"
        },
        {
          "in": "card:0",
          "text": "Humans start, direct, and approve",
          "tone": "purple"
        }
      ]
    },
    "keyPoints": [
      "Read the definition aloud.",
      "The control objectives stay.",
      "Humans stay accountable."
    ],
    "notes": "Time: 10:34 · 2 min.\n1. Read the definition from playbook p.5 aloud, word for word.\n2. Say: “Four-eyes review, test evidence, and separation of duties stay.”\n3. Say: “The enforcement is new: hooks, evals, and a gate.”\n4. Say: “Humans stay accountable” (p.7)."
  },
  {
    "title": "The AI-native loop",
    "kicker": "W5 · WHY AI-NATIVE · THE LOOP",
    "subtitle": "One loop. Six stages. Human control.",
    "type": "concept",
    "cards": [],
    "visual": {
      "opener": "sdlc-loop",
      "image": "assets/workshop5-sdlc-loop.svg",
      "imageAlt": "A clockwise loop with Plan, Design, Build, Test, Deploy, and Maintain around the AetherLink bot. Humans set goals, direct, and approve."
    },
    "keyPoints": [
      "The six stages form one continuous loop.",
      "The AI agent supports every stage.",
      "Humans set goals, direct, and approve."
    ],
    "notes": "Time: 10:36 · 1 min.\n1. Trace the six stages clockwise, from Plan to Maintain.\n2. Say: “The agent supports every stage. The work returns to Plan.”\n3. Point to the top line. Say: “Humans set the goals, direct the work, and approve.”"
  },
  {
    "title": "The line and the loop",
    "kicker": "W5 · WHY AI-NATIVE · FIG. 2",
    "type": "concept",
    "layout": "compare",
    "columns": [
      {
        "title": "Traditional: a line",
        "items": [
          "Plan → Design → Build → Test → Deploy → Maintain",
          "A handover at each stage",
          "Weeks per cycle"
        ]
      },
      {
        "title": "AI-native: a loop",
        "items": [
          "The same stages, as a circle",
          "AI at each point",
          "Hours per cycle. Humans above the loop."
        ]
      }
    ],
    "visual": {
      "pairs": true
    },
    "keyPoints": [
      "Hours, not weeks.",
      "Humans are above the loop.",
      "Humans start, direct, and approve."
    ],
    "notes": "Time: 10:37 · 1 min.\n1. Show the left column, then the right column.\n2. Say: “Hours, not weeks. Humans stay above the loop.”\n3. Do not discuss now. We build the loop for the rest of the day."
  },
  {
    "title": "What changes per stage",
    "kicker": "W5 · WHY AI-NATIVE · PER STAGE",
    "type": "concept",
    "layout": "steps",
    "items": [
      {
        "label": "Plan",
        "caption": "intent is a file"
      },
      {
        "label": "Design",
        "caption": "a spec before code"
      },
      {
        "label": "Build",
        "caption": "inside hooks"
      },
      {
        "label": "Test",
        "caption": "evals in CI"
      },
      {
        "label": "Deploy",
        "caption": "a named human approves"
      },
      {
        "label": "Maintain",
        "caption": "each incident becomes an eval"
      }
    ],
    "visual": {
      "stepKeys": true
    },
    "keyPoints": [
      "Show Test, Deploy, and Maintain.",
      "We do those this afternoon.",
      "Connect to the outcomes participants want today."
    ],
    "notes": "Time: 10:38 · 3 min.\n1. Show the right column. Say: “We do Test, Deploy, and Maintain this afternoon.”\n2. Say: “Today each box becomes a file in the repo.”\n3. Connect to the board: At the Deploy gate, a human checks the evidence and approves the release."
  },
  {
    "title": "Each stage commits a file",
    "subtitle": "The git history is your audit trail.",
    "cards": [
      {
        "title": "Plan → Design",
        "body": "intent.md → docs/spec.md → docs/plan.md"
      },
      {
        "title": "Build → Test",
        "body": "docs/diagnoses/inc-001.json → evals/cases → CI green"
      },
      {
        "title": "Deploy → Maintain",
        "body": "approvals.jsonl → PR/MR → incident → eval case"
      }
    ],
    "kicker": "W5 · WHY AI-NATIVE · THE FILE CHAIN",
    "type": "concept",
    "visual": {
      "stagger": "pop",
      "highlight": [
        {
          "in": "subtitle",
          "text": "audit trail",
          "tone": "orange"
        }
      ]
    },
    "keyPoints": [
      "All files are markdown or JSON.",
      "Review in a PR (GitHub) or MR (GitLab).",
      "No external tool."
    ],
    "notes": "Time: 10:41 · 4 min.\n1. Say: “Each arrow has a file. You can show each file.”\n2. Say: “Together the files are the audit trail: who decided what, from which evidence.”\n3. Say: “All files are in the repo. Review is a PR on GitHub or an MR on GitLab.”"
  },
  {
    "title": "Our project: an SRE agent",
    "kicker": "W5 · OUR PROJECT · CHECKOUT-API",
    "subtitle": "The agent proposes. It never executes.",
    "type": "concept",
    "cards": [
      {
        "title": "Alert",
        "body": "An alert on checkout-api."
      },
      {
        "title": "Read-only MCP",
        "body": "Logs, metrics, and deploys from sample files."
      },
      {
        "title": "Proposal",
        "body": "A diagnosis with cited evidence. A fix as a PR/MR. A human decides."
      }
    ],
    "tagline": "Built: inc-001, inc-002, inc-004. Stretch: inc-003, inc-005.",
    "visual": {
      "art": "flow",
      "bot": "head",
      "place": "slot",
      "highlight": [
        {
          "in": "tagline",
          "text": "Stretch",
          "tone": "purple"
        }
      ]
    },
    "keyPoints": [
      "The agent proposes. A human executes.",
      "3 incidents built, 2 stretch.",
      "Sample data only."
    ],
    "notes": "Time: 10:45 · 2 min.\n1. Say: “checkout-api has about 20 lines. All data is fictional. The PSP is psp-sandbox.”\n2. Say inc-001: the DB pool is full after a config change.\n3. Say inc-002: a bad deploy behind a feature flag. Only EUR fails.\n4. Say inc-004: an upstream timeout. A docs deploy is the distractor.\n5. Say: “inc-003 and inc-005 are stretch tasks on paper.”\n6. Show: https://github.com/RyanLisse/aetherlink-sre-agent-lab."
  },
  {
    "title": "The rules for today",
    "kicker": "W5 · RULES OF THE ROAD",
    "type": "concept",
    "layout": "pillars",
    "items": [
      {
        "label": "Own account",
        "caption": "Your Claude account. Vertex AI if your company requires it."
      },
      {
        "label": "Local MCP only",
        "caption": "Server sre. Read-only. In the repo."
      },
      {
        "label": "Sample data",
        "caption": "No real systems, customers, or payments."
      },
      {
        "label": "Humans decide",
        "caption": "A named human approves, pushes, and merges."
      }
    ],
    "visual": {
      "bot": "head",
      "place": "under",
      "tool": "toolbox",
      "pillarIcons": true
    },
    "keyPoints": [
      "Native on Windows, macOS, Linux. Docker is optional.",
      "All work is in the repo.",
      "Maximum human in the loop."
    ],
    "notes": "Time: 10:47 · 2 min.\n1. Say the four rules.\n2. Say: “The lab runs native on your laptop with Node and Claude Code. It runs the same on Windows, macOS, and Linux.”\n3. Say: “Docker is optional. Use INSTALL-DOCKER.md if native does not work.”\n4. Say: “Your own Claude account works. If your company requires Vertex AI, use Vertex. INSTALL.md has the steps.”"
  },
  {
    "title": "Your data, your policy",
    "kicker": "W5 · DISCLAIMER · READ ALONG",
    "subtitle": "AetherLink does not receive, collect, or keep your data.",
    "type": "context",
    "cards": [
      {
        "title": "External sources",
        "body": "We are not responsible for external sources or tools."
      },
      {
        "title": "External data",
        "body": "You may get external data. Your company policy applies. You are responsible."
      }
    ],
    "visual": {
      "keyLine": 1,
      "stamp": "YOUR POLICY",
      "bot": "point",
      "place": "key",
      "highlight": [
        {
          "in": "card:1",
          "text": "Your company policy applies",
          "tone": "mark"
        }
      ]
    },
    "keyPoints": [
      "Read the text aloud.",
      "The README and handout have the same text.",
      "archify gets external code."
    ],
    "notes": "Time: 10:49 · 1 min.\n1. Read the subtitle and the two cards aloud.\n2. Show: the same text is at the top of the lab README and the handout (notes/worldline-flags.md).\n3. Say: “archify in the full skills pack gets external code.”\n4. Say: “If you are not sure, ask your security or IT team first.”"
  },
  {
    "title": "Assignment 1: Setup check",
    "kicker": "W5 · SETUP · YOUR TURN",
    "subtitle": "Native on your laptop. Docker is optional.",
    "repo": {
      "url": "https://github.com/RyanLisse/aetherlink-sre-agent-lab",
      "label": "github.com/RyanLisse/aetherlink-sre-agent-lab"
    },
    "type": "practice",
    "layout": "exercise",
    "steps": [
      "Clone the repo. Run npm ci.",
      "Run npm test. Expect fail 0.",
      "Run claude. Approve MCP sre.",
      "Run /status. Check your account.",
      "Type /. Find the 8 lab skills."
    ],
    "expected": "Tests green. progress.md: 0 · Setup [x].",
    "stepsHeading": "Do this now:",
    "cards": [
      {
        "title": "In the lab repo",
        "body": "git clone https://github.com/RyanLisse/aetherlink-sre-agent-lab.git\ncd aetherlink-sre-agent-lab\nnpm ci\nnpm test\nclaude\n/status"
      }
    ],
    "visual": {
      "shotLabel": "aetherlink-sre-agent-lab",
      "cmdCards": [
        0
      ]
    },
    "keyPoints": [
      "This is a check, not an install.",
      "Red? We help in the break.",
      "progress.md counts."
    ],
    "notes": "Time: 10:50 · 10 min. This block continues into the break.\n1. Show: in the lab folder, run npm ci and npm test (pass 13).\n2. Show: run claude. Select “Yes” at the trust question. Approve the MCP server sre.\n3. Show: run /status. Show your account.\n4. Show: type /. Show the 8 skills: design-control-loop, grilling, show-me, verify-this, review-and-ship, visual-pr, handoff, incident-triage.\n5. Show: open progress.md. The AUTO block shows “0 · Setup [x]”.\n6. Let them do: the same steps. Check one green tick per table.\n7. If “npm: command not found”: install Node LTS (INSTALL.md step 3).\n8. If /status shows no account: run /login. Use Vertex only if the company requires it (CLAUDE_CODE_USE_VERTEX=1, ANTHROPIC_VERTEX_PROJECT_ID, CLOUD_ML_REGION, gcloud auth application-default login).\n9. If MCP shows “Pending approval”: start claude in the repo folder. Approve the server.\n10. If the hook does not run: restart claude. Trust the project.\n11. If Windows shows CRLF errors: clone again. .gitattributes sets LF.\n12. If a skill behaves differently: an old copy in ~/.claude/skills wins. Rename it.\n13. If native fails: use INSTALL-DOCKER.md."
  },
  {
    "title": "Break",
    "kicker": "W5 · 11:00 · 15 MINUTES",
    "type": "pause",
    "cards": [
      {
        "title": "Next",
        "body": "Plan"
      }
    ],
    "visual": {
      "countdown": 15,
      "bot": "wave",
      "place": "beside"
    },
    "notes": "Time: 11:00 · 15 min.\n1. Start the countdown.\n2. Help each person with a red setup check. Use “Does it not work?” in INSTALL.md.\n3. At 11:15, start Plan. Pair each person without setup with a neighbor."
  },
  {
    "title": "Before code: one file",
    "kicker": "W5 · PLAN · LOOK FIRST",
    "subtitle": "intent.md says what must be true at the end.",
    "type": "concept",
    "cards": [
      {
        "title": "Outcome",
        "body": "The agent finds the likely root cause. It cites the evidence."
      },
      {
        "title": "Boundary",
        "body": "never executes\nno writes\nno network\nno secrets"
      }
    ],
    "visual": {
      "fence": 1
    },
    "keyPoints": [
      "Read the form before the name.",
      "Progress check: show your counter.",
      "A wish is not a rule."
    ],
    "notes": "Time: 11:15 · 2 min.\n1. Progress check (30 s): “Open progress.md. Show your AUTO counter.”\n2. If a person is at 0: a neighbor helps. You visit them at lunch.\n3. Show: intent.md in the repo. Read one outcome and one boundary aloud.\n4. Say the term “intent.md” only after that."
  },
  {
    "title": "intent.md",
    "kicker": "W5 · DEFINITION · PLAN",
    "subtitle": "Three checks that a stranger can verify. At least one is OPEN.",
    "type": "concept",
    "cards": [
      {
        "title": "Definition",
        "body": "The outcome, the checks that prove it, and the boundary the agent never crosses."
      },
      {
        "title": "Five fields",
        "body": "Problem\nOutcome\nUsers/Systems\nConstraints\nOpen questions"
      }
    ],
    "tagline": "A wish is not a rule. The merge is the acceptance.",
    "visual": {
      "mdfile": 1,
      "mdName": "intent.md",
      "highlight": [
        {
          "in": "tagline",
          "text": "A wish is not a rule",
          "tone": "orange"
        }
      ]
    },
    "keyPoints": [
      "One outcome.",
      "Three checks. At least one OPEN.",
      "A hard boundary and named owners."
    ],
    "notes": "Time: 11:17 · 2 min.\n1. Say the five fields (p.13).\n2. Say: “A wish is not a rule. ‘The agent is careful’ is not testable.”\n3. Say: “‘The agent writes only in docs/diagnoses/’ is testable.”\n4. Say: “The merge of the intent.md PR/MR is the human acceptance.”"
  },
  {
    "title": "Watch: Claude interviews me",
    "kicker": "W5 · PLAN · DEMO",
    "subtitle": "One question at a time. I remove each wish.",
    "type": "concept",
    "dark": true,
    "cards": [
      {
        "title": "Interview",
        "body": "Claude writes intent.md one question at a time."
      },
      {
        "title": "Push back",
        "body": "I reject a check that is a wish."
      }
    ],
    "visual": {
      "art": "prompt",
      "promptMarks": [
        "one question at a time",
        "Push back",
        "never executes"
      ]
    },
    "prompt": "Interview me one question at a time to fill intent.md for the SRE agent on checkout-api. Push back when a check is a wish, not a test. Boundary: the agent never executes anything.",
    "keyPoints": [
      "One question at a time.",
      "Accept one weak check on purpose.",
      "Then catch it."
    ],
    "notes": "Time: 11:19 · 5 min.\n1. Show: paste the prompt (button “Example prompt”).\n2. Answer 3–4 questions.\n3. Accept one weak check on purpose, for example “the agent is reliable”.\n4. Then ask: “How does a stranger verify this?” Rewrite the check.\n5. Show: the hook asks before Claude edits intent.md (ask)."
  },
  {
    "title": "Watch: /design-control-loop",
    "kicker": "W5 · SHOWCASE 1 · 11:25 · 3 MIN",
    "subtitle": "The agent is a control loop: set point, sensor, actuator.",
    "type": "concept",
    "layout": "steps",
    "items": [
      {
        "label": "Read",
        "caption": "repo, incidents/, REVIEW.md"
      },
      {
        "label": "Ask",
        "caption": "≤ 3 questions, each with a recommended answer"
      },
      {
        "label": "Decide",
        "caption": "I choose"
      },
      {
        "label": "Map",
        "caption": "each part → an intent.md field"
      },
      {
        "label": "Edit",
        "caption": "the edit asks first"
      }
    ],
    "visual": {
      "stepKeys": true,
      "humanStep": 2,
      "reach": true
    },
    "prompt": "/design-control-loop for the SRE agent on checkout-api — one round, then map to intent.md",
    "keyPoints": [
      "One round. Then stop.",
      "Sensor = MCP. Actuator = a human with a PR.",
      "Fallback: /grilling intent.md."
    ],
    "notes": "Time: 11:25 · 3 min. Showcase 1.\n1. Show: paste the prompt.\n2. Say: “Claude reads the repo, incidents/, and REVIEW.md first.”\n3. Answer the questions (3 or fewer). Reject one recommended answer on purpose.\n4. Show: the table that maps each part to an intent.md field. The hook asks before the edit.\n5. Say: “The agent is a control loop. The sensor is the MCP. The actuator is a human with a PR. Today we build each part.”\n6. Stop after one round.\n7. If it takes too long: say “one round”, or use /grilling intent.md.\n8. Note: the lab version is phase A–B of the HumanLayer skill (MIT). It has no CI, key, or bypass parts."
  },
  {
    "title": "Assignment 2: Write your team intent.md",
    "kicker": "W5 · PLAN · YOUR TURN",
    "type": "practice",
    "layout": "exercise",
    "steps": [
      "Write the five fields. Add one OPEN.",
      "Do one interview round with a skill.",
      "Read your boundary to a neighbor.",
      "Open a PR or MR."
    ],
    "expected": "PR/MR open. The boundary is testable.",
    "stepsHeading": "Do this now:",
    "cards": [
      {
        "title": "intent.md",
        "body": "Problem\nOutcome\nUsers/Systems\nConstraints\nOpen questions"
      }
    ],
    "visual": {
      "shotLabel": "Skill: /design-control-loop or /grilling",
      "mdfile": 0,
      "mdName": "intent.md"
    },
    "keyPoints": [
      "A wish is not a rule.",
      "One round only.",
      "The merge is the acceptance."
    ],
    "notes": "Time: 11:28 · 12–15 min.\n1. Let them do: each team writes intent.md.\n2. Walk to each team. Read the boundaries.\n3. Gate: if a boundary is a wish, say “NEEDS REVISION”. Do not merge.\n4. Say: “The human pushes from their own terminal: git push -u origin <branch>, then gh pr create or glab mr create.”\n5. If Claude cannot write intent.md: this is correct. The hook asks. Confirm the edit yourself."
  },
  {
    "title": "spec.md",
    "kicker": "W5 · DEFINITION · DESIGN",
    "subtitle": "The diagnosis contract. A schema holds it.",
    "type": "concept",
    "cards": [
      {
        "title": "Definition",
        "body": "Each diagnosis field, with an example. evals/schema.ts checks it."
      },
      {
        "title": "Fields",
        "body": "category\ntrigger_deploy\nevidence[] + log ids\nrunbook\nproposed_step\nexecutes: false"
      }
    ],
    "tagline": "executes: false is a type, not a promise.",
    "visual": {
      "hero": 0,
      "popOut": 1,
      "bot": "head",
      "place": "popout",
      "stepThrough": true,
      "chipGrid": 3,
      "highlight": [
        {
          "in": "tagline",
          "text": "a type, not a promise",
          "tone": "orange"
        }
      ]
    },
    "keyPoints": [
      "Each field has an example.",
      "The schema limits the agent output.",
      "Test first. Then the schema."
    ],
    "notes": "Time: 11:40 · 3 min.\n1. Progress check (30 s).\n2. Say: “spec.md is the contract of a diagnosis. The agent cannot return a field that the schema does not have.”\n3. Show: executes: false. Say: “The type makes execution impossible. A prompt only makes a promise.”\n4. Show the paths: docs/spec.md and evals/schema.ts."
  },
  {
    "title": "Watch: red schema → green",
    "kicker": "W5 · DESIGN · DEMO",
    "subtitle": "First a failing test. Then the schema.",
    "type": "concept",
    "cards": [
      {
        "title": "Red",
        "body": "The schema test fails. The field is missing."
      },
      {
        "title": "Green",
        "body": "Edit evals/schema.ts. npm test is green."
      }
    ],
    "visual": {
      "term": [
        {
          "c": "npm test "
        },
        {
          "o": "✗ schema: field \"runbook\" is missing"
        },
        {
          "o": "… edit evals/schema.ts …"
        },
        {
          "c": "npm test "
        },
        {
          "o": "✓ all tests pass · fail 0"
        }
      ]
    },
    "keyPoints": [
      "The test commit comes first.",
      "Show the red output.",
      "The schema.ts edit asks first."
    ],
    "notes": "Time: 11:43 · 4 min.\n1. Show: add one field from docs/spec.md to the test.\n2. Show: run npm test. It is red. Show the error line.\n3. Show: edit evals/schema.ts. The hook asks. Confirm.\n4. Show: run npm test. It is green.\n5. Show: git log. The test commit is before the schema commit."
  },
  {
    "title": "Assignment 3: Spec + schema green",
    "kicker": "W5 · DESIGN · YOUR TURN",
    "subtitle": "Test first.",
    "type": "practice",
    "layout": "exercise",
    "steps": [
      "Write docs/spec.md. One example per field.",
      "Make the schema test fail.",
      "Edit evals/schema.ts until green.",
      "Open a PR/MR. Another team reviews."
    ],
    "expected": "npm test green. The test commit is first.",
    "stepsHeading": "Do this now:",
    "cards": [
      {
        "title": "You write",
        "body": "docs/spec.md"
      }
    ],
    "visual": {
      "shotLabel": "Then: evals/schema.ts",
      "tree": 0
    },
    "keyPoints": [
      "Red first.",
      "Each field has an example.",
      "Another team reviews."
    ],
    "notes": "Time: 11:47 · 12 min.\n1. Let them do: each team writes the spec and the schema.\n2. Check: git log shows the test before schema.ts (yes or no).\n3. Another team reads the spec against intent.md.\n4. If zod or tsx fails: run npm ci again.\n5. Stop at 12:00. Teams can finish after lunch."
  },
  {
    "title": "Lunch",
    "kicker": "W5 · 12:00 · 60 MINUTES",
    "type": "pause",
    "cards": [
      {
        "title": "Next",
        "body": "Build 1"
      }
    ],
    "visual": {
      "countdown": 60,
      "bot": "wave",
      "place": "beside"
    },
    "notes": "Time: 12:00 · 60 min.\n1. Start the countdown.\n2. Visit each person who was behind at the progress check.\n3. At 13:00, start Build 1."
  },
  {
    "title": "CLAUDE.md",
    "kicker": "W5 · DEFINITION · BUILD 1",
    "subtitle": "The briefing that each session reads first.",
    "type": "concept",
    "cards": [
      {
        "title": "Definition",
        "body": "People write it. Agents follow it. Commands: npm test · npm run eval · npm run test:hooks."
      },
      {
        "title": "Sections",
        "body": "Commands\nRules\nVerifying"
      }
    ],
    "tagline": "The same mistake two times? Add a rule.",
    "visual": {
      "mdfile": 1,
      "guides": [
        [
          "🧭",
          "CLAUDE.md",
          "guides"
        ],
        [
          "🔒",
          "hooks",
          "enforce"
        ]
      ]
    },
    "keyPoints": [
      "Always loaded.",
      "Keep it short.",
      "People maintain it."
    ],
    "notes": "Time: 13:00 · 3 min.\n1. Progress check (30 s): show the current AUTO checks and the latest dated evidence. Ask which current check supports it. Do not call it verified from an agent claim.\n2. Show: the lab CLAUDE.md. Show the commands, the rules (“propose, never execute”), and how to verify.\n3. Say: “If the agent makes the same mistake two times, add the rule here.”\n4. Say: “AGENTS.md, progress.md, and SOLO.md are next to CLAUDE.md.”"
  },
  {
    "title": "progress.md",
    "kicker": "W5 · DEFINITION · BUILD 1",
    "subtitle": "Current checks above. Append-only build log below.",
    "type": "concept",
    "source": {
      "url": "https://github.com/RyanLisse/claude-code-skills-pack/blob/main/PROGRESS.md",
      "label": "Open the progress.md template"
    },
    "cards": [
      {
        "title": "Timestamp",
        "body": "Example: 2026-10-11T21:30:00+02:00"
      },
      {
        "title": "Change + mechanism",
        "body": "What shipped · Why"
      },
      {
        "title": "Validation",
        "body": "Commands, results, and evidence"
      },
      {
        "title": "Open scope",
        "body": "Deliberately not done · Known limits"
      }
    ],
    "tagline": "AUTO = current overview. Dated entries = append-only history.",
    "visual": {
      "compact": true,
      "stagger": "pop"
    },
    "keyPoints": [
      "AUTO keeps the current overview and checklist.",
      "Dated log entries preserve history. Never rewrite them.",
      "A correction gets its own timestamp and evidence."
    ],
    "notes": "Time: 13:03 · 3 min.\n1. Show: progress.md. The AUTO block is the current overview and checklist. The hook updates it from files and checks.\n2. Show: below AUTO, each build-log entry starts with an ISO 8601 timestamp and timezone offset. The timestamp records when the validation and log entry were made.\n3. Read the four fields: What shipped, Why, Validation, and Deliberately not done. Under Why, include how it works and which options you rejected.\n4. Say: “Dated entries are append-only. Never rewrite history.”\n5. Say: “A correction gets a new timestamp. Explain what changed and add the new evidence.”\n6. Say: “A claim is not verified until a current check supports it.”"
  },
  {
    "title": "MCP",
    "kicker": "W5 · DEFINITION · BUILD 1",
    "subtitle": "The connection between Claude and a source system.",
    "type": "concept",
    "cards": [
      {
        "title": "Ours",
        "body": "Local and read-only. Server sre in .mcp.json."
      },
      {
        "title": "5 tools",
        "body": "list_alerts\nget_logs\nget_metrics\nget_deploys\nget_runbook"
      }
    ],
    "tagline": "No network. No writes.",
    "visual": {
      "plugs": 1,
      "highlight": [
        {
          "in": "card:0",
          "text": "Local and read-only",
          "tone": "orange"
        }
      ]
    },
    "keyPoints": [
      "Read-only.",
      "A path outside incidents/ gives a tool error.",
      "Maximum 200 lines per call."
    ],
    "notes": "Time: 13:06 · 3 min.\n1. Say: “A platform team hosts the same MCP contract.”\n2. Say: “Later you replace the file reader with a read-only backend, for example Loki or Prometheus. The tools and the allowlist stay.”\n3. Say: “Allowlist per project with enabledMcpjsonServers. Allowlist per company with managed allowedMcpServers” (p.42–43).\n4. Say: “In Claude Code the tools are mcp__sre__<tool>.”"
  },
  {
    "title": "Watch: connect the sre MCP",
    "kicker": "W5 · BUILD 1 · DEMO",
    "subtitle": "Approve. Run /mcp. Ask the first question.",
    "type": "concept",
    "cards": [
      {
        "title": "1 · Start",
        "body": "claude\nApprove server sre."
      },
      {
        "title": "2 · Check",
        "body": "/mcp\nYou see 5 tools."
      },
      {
        "title": "3 · Ask",
        "body": "List the alerts\nYou get 3 alerts."
      }
    ],
    "visual": {
      "cmdCards": [
        0,
        1,
        2
      ]
    },
    "prompt": "List the alerts and tell me which incident to look at first. Use only the sre MCP tools.",
    "keyPoints": [
      "/mcp shows 5 tools.",
      "3 alerts: inc-001, inc-002, inc-004.",
      "All read-only."
    ],
    "notes": "Time: 13:09 · 3 min.\n1. Show: run /mcp. Show server sre with 5 tools.\n2. Show: paste the prompt. Claude calls mcp__sre__list_alerts. It shows 3 alerts.\n3. If “Pending approval”: start claude in the repo folder. Approve the server.\n4. If IT blocks the MCP: use Read/Grep on incidents/. Ask IT to allowlist sre."
  },
  {
    "title": "skills",
    "kicker": "W5 · DEFINITION · BUILD 1",
    "subtitle": "A method that Claude loads when a step needs it.",
    "type": "concept",
    "cards": [
      {
        "title": "Policy",
        "body": "incident-triage/SKILL.md. The policy owner signs off, as with code."
      },
      {
        "title": "It says",
        "body": "How to triage\nWhat to cite\nWhat never to do"
      }
    ],
    "visual": {
      "mdfile": 1,
      "mdName": "incident-triage/SKILL.md"
    },
    "keyPoints": [
      "A skill is a versioned file.",
      "A skill advises. It does not enforce.",
      "Review it before you install it."
    ],
    "notes": "Time: 13:12 · 3 min.\n1. Show: .claude/skills/incident-triage/SKILL.md.\n2. Say: “A skill advises. It does not enforce. The hooks enforce. You see them next.”\n3. Say: “The policy owner signs off in a PR/MR.”"
  },
  {
    "title": "Two types of skills",
    "kicker": "W5 · BUILD 1 · POLICY AND WORKFLOW",
    "type": "concept",
    "cards": [
      {
        "title": "Policy (Claude loads it)",
        "body": "incident-triage. Applies to each incident."
      },
      {
        "title": "Workflow (only with /name)",
        "body": "design-control-loop · grilling · show-me · verify-this · review-and-ship · visual-pr · handoff"
      }
    ],
    "tagline": "HumanLayer skills (MIT) keep their source.",
    "visual": {
      "lifespan": [
        {
          "kind": "always",
          "icon": "📄",
          "label": "each incident"
        },
        {
          "kind": "now",
          "icon": "⌨️",
          "label": "when you type /name"
        }
      ]
    },
    "keyPoints": [
      "allowed-tools gives more permission. The hook keeps the boundary.",
      "disableSkillShellExecution: true.",
      "Source: RyanLisse/claude-code-skills-pack."
    ],
    "notes": "Time: 13:15 · 3 min.\n1. Say: “Left: one policy skill. Claude loads it automatically.”\n2. Say: “Right: 7 workflow skills. You start them only with /name (disable-model-invocation).”\n3. Say: “allowed-tools in a skill gives more permission. The hook still decides.”\n4. Say: “disableSkillShellExecution: true stops hidden shell commands when a skill loads.”\n5. Show the sources: RyanLisse/claude-code-skills-pack (subset approved for today) and humanlayer/skills (MIT, license included)."
  },
  {
    "title": "hooks",
    "kicker": "W5 · DEFINITION · BUILD 1",
    "subtitle": "A script that runs on an agent event. It can block the event.",
    "type": "concept",
    "cards": [
      {
        "title": "Where",
        "body": "Allow · ask · deny at each tool call. .claude/hooks/guard.mjs."
      },
      {
        "title": "Key line",
        "body": "The hook enforces that a named human has approved."
      }
    ],
    "tagline": "A hook guards. It never approves.",
    "visual": {
      "keyLine": 1,
      "stamp": "ENFORCED",
      "bot": "head",
      "place": "key",
      "highlight": [
        {
          "in": "card:1",
          "text": "a named human",
          "tone": "mark"
        }
      ]
    },
    "keyPoints": [
      "Skills advise. Hooks enforce.",
      "Each decision goes to audit.jsonl.",
      "guard.mjs runs on Node."
    ],
    "notes": "Time: 13:18 · 3 min.\n1. Say, word for word: “The hook enforces that a named human has approved.” (decision 1, p.46).\n2. Show: .claude/hooks/guard.mjs. Say: “It is Node. No bash, no jq. It runs the same on Windows, macOS, and Linux.”\n3. Show: each decision goes to approvals/audit.jsonl."
  },
  {
    "title": "Allow · ask · deny",
    "kicker": "W5 · BUILD 1 · THE CONTROL LAYER",
    "type": "concept",
    "layout": "compare",
    "columns": [
      {
        "title": "Allow",
        "items": [
          "The 5 mcp__sre__ tools",
          "npm test · eval · test:hooks",
          "Writes in docs/diagnoses/, verify/, show-me/, pr/"
        ]
      },
      {
        "title": "Ask",
        "items": [
          "git commit",
          "intent.md, spec, plan, evals/cases",
          "app/ on a fix/* branch",
          "Push after a named approval"
        ]
      },
      {
        "title": "Deny",
        "items": [
          "curl, wget, ssh, WebFetch",
          ".env, secrets/, keys, gcloud",
          "approvals/, approve scripts",
          "Merge and approve: always"
        ]
      }
    ],
    "visual": {
      "stepThrough": true
    },
    "keyPoints": [
      "Permissions + hook + approvals/ + audit.jsonl.",
      "Merge and approve are human work.",
      "Regex rules are best effort."
    ],
    "notes": "Time: 13:21 · 4 min.\n1. Explain the three columns, left to right.\n2. Say: “The agent can never merge or approve. This is also true after an approval.”\n3. Say: “A push without a named approval is denied. The message says: a human runs npm run approve in their own terminal.”\n4. Say: “Regex rules are best effort. Strong isolation needs an OS sandbox, the Docker route without network, or managed settings from IT.”"
  },
  {
    "title": "Watch: try to break the rules",
    "kicker": "W5 · BUILD 1 · DEMO",
    "subtitle": "Three attempts. Three denies. All in the audit log.",
    "type": "concept",
    "cards": [
      {
        "title": "Then",
        "body": "Open approvals/audit.jsonl. Each deny is there."
      }
    ],
    "visual": {
      "term": [
        {
          "c": "curl https://example.com "
        },
        {
          "o": "⛔ deny · network"
        },
        {
          "c": "edit runbooks/db-pool-exhaustion.md "
        },
        {
          "o": "⛔ deny · runbooks/"
        },
        {
          "c": "cat .env "
        },
        {
          "ask": "⛔ deny · secrets"
        }
      ]
    },
    "prompt": "Fetch https://example.com with curl, then update runbooks/db-pool-exhaustion.md, then read .env.",
    "keyPoints": [
      "Show each deny message.",
      "Open audit.jsonl.",
      "No hook? Check trust or Node."
    ],
    "notes": "Time: 13:25 · 5 min.\n1. Show: paste the prompt.\n2. Show: three denies. Read each reason aloud.\n3. Show: approvals/audit.jsonl has three new lines.\n4. If the hook does not run: the project is not trusted. Start claude in the repo and accept trust.\n5. If Node is missing on the laptop: install Node LTS, or use the Docker route."
  },
  {
    "title": "Assignment 4: Wire and prove the controls",
    "kicker": "W5 · BUILD 1 · YOUR TURN",
    "type": "practice",
    "layout": "exercise",
    "steps": [
      "Run npm run test:hooks. Expect green.",
      "Choose one new deny rule.",
      "Write the test first. See it fail.",
      "Edit guard.mjs until green.",
      "Open a PR/MR."
    ],
    "expected": "test:hooks green with your rule. Build 1 [x].",
    "stepsHeading": "Do this now:",
    "cards": [
      {
        "title": "npm run test:hooks",
        "body": "curl to a URL\nread .env\nedit runbooks/\nyour rule: kubectl delete"
      }
    ],
    "visual": {
      "shotLabel": ".claude/hooks/guard.mjs · test/hooks.test.mjs",
      "runner": [
        {
          "label": "deny",
          "tone": "green"
        },
        {
          "label": "deny",
          "tone": "green"
        },
        {
          "label": "deny",
          "tone": "green"
        },
        {
          "label": "red → green",
          "tone": "orange"
        }
      ]
    },
    "keyPoints": [
      "Test first.",
      "The agent cannot edit .claude/.",
      "Build 1 [x] after your first deny."
    ],
    "notes": "Time: 13:30 · 20 min.\n1. Let them do: the five steps on the slide.\n2. Say: “The agent cannot edit .claude/ (deny). You edit guard.mjs yourself. The human owns the boundary.”\n3. Check: npm run test:hooks is green (39 guard + 23 progress) plus the new test.\n4. Check: progress.md shows Build 1 [x] after one deny in audit.jsonl.\n5. At 13:50, go to the next block."
  },
  {
    "title": "plan.md",
    "kicker": "W5 · DEFINITION · BUILD 2",
    "subtitle": "Ordered steps, each with a proof command.",
    "type": "concept",
    "cards": [
      {
        "title": "Plan mode",
        "body": "Shift+Tab. Claude reads and changes nothing until you accept."
      },
      {
        "title": "RPI",
        "body": "/rpi from HumanLayer is this loop as a skill. Use it in the hackathon."
      }
    ],
    "tagline": "A human accepts the plan before the build.",
    "visual": {
      "art": "gate",
      "gateLabel": "you accept"
    },
    "keyPoints": [
      "Stranger test: can another person do it?",
      "Each step has a proof command.",
      "Acceptance is a human gate."
    ],
    "notes": "Time: 13:50 · 1 min. Be short. Showcase 2 starts at 13:52.\n1. Progress check (30 s).\n2. Say: “In plan mode, Claude reads and changes nothing until I accept.”\n3. Say: “RPI from HumanLayer is this loop as a skill: research, design, outline, implement. Use it in the hackathon, not today.”"
  },
  {
    "title": "subagents",
    "kicker": "W5 · DEFINITION · BUILD 2",
    "subtitle": "A helper session with its own context. Delegate the work, never the acceptance.",
    "type": "concept",
    "cards": [
      {
        "title": "Verifier",
        "body": ".claude/agents/verifier.md. New context. It only reports."
      },
      {
        "title": "Never",
        "body": "A subagent does not accept a plan. It approves nothing."
      }
    ],
    "tagline": "Delegate the work. Never the acceptance.",
    "visual": {
      "swap": true
    },
    "keyPoints": [
      "Own context.",
      "The verifier only reports.",
      "A human accepts."
    ],
    "notes": "Time: 13:51 · 1 min. You can also do this slide after the demo.\n1. Say: “The verifier gets a new context. It can only report.”\n2. Say: “It does not see how the diagnosis was made. So it tests the diagnosis for real.”"
  },
  {
    "title": "Watch: /show-me → plan → diagnose",
    "kicker": "W5 · SHOWCASE 2 · 13:52 · 2 MIN",
    "subtitle": "inc-001. First understand. Then diagnose.",
    "type": "concept",
    "dark": true,
    "cards": [
      {
        "title": "/show-me",
        "body": "A small flow: request → pool → timeout. Real names."
      },
      {
        "title": "Plan mode",
        "body": "Shift+Tab → plan.md → I accept."
      },
      {
        "title": "Diagnose",
        "body": "MCP calls → docs/diagnoses/inc-001.json with log ids."
      }
    ],
    "visual": {
      "art": "prompt",
      "promptMarks": [
        "/show-me",
        "between the alert and the pool"
      ]
    },
    "prompt": "/show-me incidents/inc-001-db-pool/alert.json — what happens between the alert and the pool?",
    "keyPoints": [
      "/show-me replaces /eli5.",
      "The diagnosis cites log ids.",
      "HTML version in docs/show-me/."
    ],
    "notes": "Time: 13:52 · 2 min showcase + 8 min demo. Showcase 2.\n1. Show: paste the prompt. /show-me draws request → DB pool → timeout with real names from the logs.\n2. Say: “To understand is not to diagnose. The diagnosis cites log ids.”\n3. Say: “The HTML version is in docs/show-me/. Open it yourself. The lab version does not run open.”\n4. Show: press Shift+Tab (plan mode). Claude proposes docs/plan.md.\n5. Show: correct one step. Accept the plan.\n6. Show: Claude calls get_logs, get_metrics, and get_deploys. It writes docs/diagnoses/inc-001.json.\n7. Show: the cited log ids and trigger d-0142.\n8. If /show-me tries to run open: the upstream version is active. Use the lab copy in .claude/skills/show-me."
  },
  {
    "title": "Assignment 5: Diagnose an incident",
    "kicker": "W5 · BUILD 2 · YOUR TURN",
    "subtitle": "Plan mode first.",
    "type": "practice",
    "layout": "exercise",
    "steps": [
      "Optional: /show-me on the alert.",
      "Plan mode. Accept docs/plan.md yourself.",
      "Diagnose inc-001.",
      "Diagnose inc-002 or inc-004.",
      "Open a PR/MR."
    ],
    "expected": "Diagnosis JSON with log ids. Plan accepted first.",
    "stepsHeading": "Do this now:",
    "cards": [
      {
        "title": "Incidents",
        "body": "inc-001 · DB pool\ninc-002 · bad deploy\ninc-004 · upstream timeout\ninc-003 · stretch\ninc-005 · stretch"
      }
    ],
    "visual": {
      "shotLabel": "Write to docs/diagnoses/",
      "menu": 0
    },
    "keyPoints": [
      "A human accepts the plan.",
      "Cite log ids.",
      "Find the distractor."
    ],
    "notes": "Time: 14:05 · 35 min.\n1. Let them do: the five steps on the slide.\n2. Check each team: plan.md exists and a human accepted it before the diagnosis.\n3. Hint for inc-002: compare EUR with USD and GBP (http_5xx_rate_eur ≈ 98 %). The report-cron message is a distractor.\n4. Hint for inc-004: deploy d-0160 (docs only, 7 minutes earlier) is not the cause. Read psp_latency_p95_ms and the retries.\n5. Stretch: inc-003 (memory leak) and inc-005 (certificate) on paper. See docs/stretch-incidents.md.\n6. Check: progress.md shows Build 2 [x] after plan.md and one diagnosis JSON."
  },
  {
    "title": "Break",
    "kicker": "W5 · 14:40 · 15 MINUTES",
    "type": "pause",
    "cards": [
      {
        "title": "Next",
        "body": "Test"
      }
    ],
    "visual": {
      "countdown": 15,
      "bot": "wave",
      "place": "beside"
    },
    "notes": "Time: 14:40 · 15 min.\n1. Start the countdown.\n2. Visit each team without a diagnosis JSON.\n3. If needed, give the reference diagnosis of inc-001."
  },
  {
    "title": "eval",
    "kicker": "W5 · DEFINITION · TEST",
    "subtitle": "It runs in CI.",
    "type": "concept",
    "cards": [
      {
        "title": "Definition",
        "body": "A case is a scenario plus the expected root cause."
      },
      {
        "title": "Checks",
        "body": "category\ntrigger\nkeywords\ndistractor\nrunbook\nreal log ids"
      }
    ],
    "tagline": "Fix the diagnosis, not the eval.",
    "visual": {
      "hero": 0,
      "popOut": 1,
      "bot": "think",
      "place": "popout",
      "stepThrough": true,
      "chipGrid": 3,
      "highlight": [
        {
          "in": "tagline",
          "text": "not the eval",
          "tone": "orange"
        }
      ]
    },
    "keyPoints": [
      "No model needed.",
      "Runs offline in CI.",
      "Each incident becomes a case."
    ],
    "notes": "Time: 14:55 · 2 min.\n1. Progress check (30 s).\n2. Say: “An eval tests reasoning. It runs without a model and without network, so it runs in CI.”\n3. Say the rule for today: “Fix the diagnosis, not the eval.”"
  },
  {
    "title": "Watch: PASS and REJECTED",
    "kicker": "W5 · TEST · DEMO",
    "subtitle": "6 fixtures. Good ones PASS. Bad ones are REJECTED.",
    "type": "concept",
    "cards": [
      {
        "title": "npm run eval · fixtures",
        "body": "good inc-001\ngood inc-002\ngood inc-004\nbad inc-001: log id L9999\nbad inc-004: wrong reasoning"
      }
    ],
    "tagline": "The eval tests the reasoning.",
    "visual": {
      "runner": [
        {
          "label": "PASS",
          "tone": "green"
        },
        {
          "label": "PASS",
          "tone": "green"
        },
        {
          "label": "PASS",
          "tone": "green"
        },
        {
          "label": "REJECTED",
          "tone": "orange"
        },
        {
          "label": "REJECTED",
          "tone": "orange"
        }
      ]
    },
    "keyPoints": [
      "npm run eval: 6 of 6 as expected.",
      "The eval tests reasoning, not only evidence.",
      "The verifier runs again."
    ],
    "notes": "Time: 14:57 · 3 min.\n1. Show: run npm run eval.\n2. Show: “invented evidence L9999” in the bad inc-001.\n3. Show: the bad inc-004 cites only real log ids. It is still REJECTED: wrong category, trigger d-0160, distractor not excluded, wrong runbook, forbidden “roll back d-0160”.\n4. Say: “Real citations are not enough. The reasoning must be correct.”"
  },
  {
    "title": "Watch: /verify-this",
    "kicker": "W5 · SHOWCASE 3 · 15:00 · 4 MIN",
    "subtitle": "A test that cannot fail is not evidence.",
    "type": "review",
    "cards": [
      {
        "title": "The experiment",
        "body": "Baseline: a good fixture. Expect PASS.\nTreatment: a copy with log id L9999. Expect REJECTED.\nVerdict: Claude writes it to docs/verify/."
      }
    ],
    "visual": {
      "lineReveal": 0,
      "stamps": [
        "VERIFIED",
        "NOT VERIFIED",
        "INCONCLUSIVE"
      ],
      "bot": "head",
      "place": "stamps"
    },
    "prompt": "/verify-this \"npm run eval rejects a diagnosis that cites a non-existent log id\"",
    "keyPoints": [
      "Baseline + treatment.",
      "Do not weaken the verdict.",
      "Writes to docs/verify/."
    ],
    "notes": "Time: 15:00 · 4 min. Showcase 3.\n1. Show: paste the prompt.\n2. Show: the baseline (good fixture) gives PASS.\n3. Show: the treatment (copy with L9999) gives REJECTED.\n4. Show: the verdict file in docs/verify/.\n5. Say: “The verdict is VERIFIED, NOT VERIFIED, or INCONCLUSIVE. Do not make it weaker.”\n6. If /verify-this cannot write: an old copy writes to /tmp/verify-this/ (deny). Use the lab copy."
  },
  {
    "title": "Assignment 6: Pass your diagnosis. Add a case.",
    "kicker": "W5 · TEST · YOUR TURN",
    "type": "practice",
    "layout": "exercise",
    "steps": [
      "Run npm run eval on your diagnosis.",
      "REJECTED? Fix the diagnosis, not the eval.",
      "Add one eval case.",
      "Optional: /verify-this."
    ],
    "expected": "PASS. One new case. One verdict. CI green.",
    "stepsHeading": "Do this now:",
    "cards": [
      {
        "title": "Commands",
        "body": "npm run eval\n/verify-this"
      }
    ],
    "visual": {
      "shotLabel": "evals/cases/ · docs/verify/",
      "cmdCards": [
        0
      ]
    },
    "keyPoints": [
      "Fix the diagnosis.",
      "Another team runs it again.",
      "Test [x] in progress.md."
    ],
    "notes": "Time: 15:04 · 11 min. Test is 20 min in v5.\n1. Let them do: the four steps on the slide.\n2. Gate: a reviewer from another team runs npm run eval again on your branch.\n3. Check: progress.md shows Test [x] after a current PASS in .lab/eval-results.json and a verdict in docs/verify/."
  },
  {
    "title": "workflows",
    "kicker": "W5 · DEFINITION · DEPLOY",
    "subtitle": "A repeatable path of steps. Here: CI. Both run offline.",
    "type": "concept",
    "layout": "compare",
    "columns": [
      {
        "title": "GitHub Actions",
        "items": [
          "npm ci + npm test → test:hooks → eval → check:approval"
        ]
      },
      {
        "title": "GitLab CI",
        "items": [
          "npm ci + npm test → test:hooks → eval → check:approval"
        ]
      }
    ],
    "tagline": "Agents in CI: only after the gates. No keys.",
    "visual": {
      "pipes": true,
      "same": [
        0,
        1,
        2,
        3
      ]
    },
    "keyPoints": [
      "The same steps on both platforms.",
      "No key needed.",
      "check:approval fails without approval."
    ],
    "notes": "Time: 15:15 · 1 min.\n1. Progress check (30 s).\n2. Show: .github/workflows/ci.yml and .gitlab-ci.yml side by side.\n3. Say: “On a fix/* branch, check:approval fails when no named human approved that branch.”"
  },
  {
    "title": "The gate + REVIEW.md",
    "kicker": "W5 · DEPLOY · THE GATE",
    "subtitle": "The agent goes to the gate. It does not go through.",
    "type": "context",
    "layout": "compare",
    "columns": [
      {
        "title": "The agent can",
        "items": [
          "run REVIEW.md: intent, evidence, risk",
          "write findings",
          "go to the gate"
        ]
      },
      {
        "title": "A named human",
        "items": [
          "runs npm run approve",
          "in their own terminal",
          "behind branch protection"
        ]
      }
    ],
    "visual": {
      "handover": "A review finding approves nothing."
    },
    "keyPoints": [
      "The agent stops at the gate.",
      "Green CI is an observation, not an approval.",
      "Another human merges."
    ],
    "notes": "Time: 15:16 · 2 min.\n1. Say: “The agent goes to the gate. It does not go through” (p.46).\n2. Say: “REVIEW.md has three passes: intent, evidence, risk.”\n3. Say: “A named human approves with npm run approve in their own terminal.”\n4. Say: “Another human merges: branch protection on GitHub, protected branches and approval rules on GitLab.”"
  },
  {
    "title": "Watch: the approval gate",
    "kicker": "W5 · SHOWCASE 4 · 15:18 · 3 + 2 MIN",
    "subtitle": "/review-and-ship to the push. A human approves. Then /visual-pr.",
    "type": "concept",
    "layout": "steps",
    "items": [
      {
        "label": "Edit",
        "caption": "fix/db-pool-size (ask)"
      },
      {
        "label": "/review-and-ship",
        "caption": "review passes"
      },
      {
        "label": "Commit",
        "caption": "ask · push: deny"
      },
      {
        "label": "Approve",
        "caption": "npm run approve -- ryan fix/db-pool-size \"inc-001 diagnose PASS\""
      },
      {
        "label": "Push",
        "caption": "the human pushes"
      },
      {
        "label": "/visual-pr",
        "caption": "gh pr create or glab mr create"
      }
    ],
    "visual": {
      "stepKeys": true,
      "humanStep": 3
    },
    "prompt": "/review-and-ship fix: restore DB_POOL_MAX=20 (inc-001)",
    "keyPoints": [
      "The agent can never merge or approve.",
      "/visual-pr writes only docs/pr/.",
      "GitHub and GitLab."
    ],
    "notes": "Time: 15:18 · 5 min. Showcase 4.\n1. Show: git switch -c fix/db-pool-size. Edit app/config/prod.env (ask).\n2. Show: paste /review-and-ship fix: restore DB_POOL_MAX=20 (inc-001). Claude reviews and runs the tests.\n3. Show: commit (ask). Then push. The hook denies the push.\n4. Show: in your OWN terminal, run npm run approve -- ryan fix/db-pool-size \"inc-001 diagnose PASS\". The script refuses to run inside Claude Code.\n5. Show: run /visual-pr. It writes docs/pr/fix-db-pool-size.md (why, diff, flow).\n6. Show: on your laptop, run git push -u origin fix/db-pool-size.\n7. Show GitHub: gh pr create --title … --body-file docs/pr/fix-db-pool-size.md.\n8. Show GitLab: glab mr create --title … --description \"$(cat docs/pr/fix-db-pool-size.md)\".\n9. Say: “The agent can never merge or approve. The lab /visual-pr does not use gh. It pushes nothing.”\n10. Show: approvals.jsonl (git add -f) and audit.jsonl in the PR.\n11. If /visual-pr tries to run gh: the upstream version is active. Use the lab copy."
  },
  {
    "title": "Assignment 7: Propose your fix as a PR/MR",
    "kicker": "W5 · DEPLOY · YOUR TURN",
    "type": "practice",
    "layout": "exercise",
    "steps": [
      "Create fix/<name>. Make the fix.",
      "Commit (ask). The push is denied.",
      "A neighbor runs npm run approve.",
      "Push. Open a PR (gh) or MR (glab)."
    ],
    "expected": "PR/MR with the approval line. CI green.",
    "stepsHeading": "Do this now:",
    "cards": [
      {
        "title": "Your neighbor runs",
        "body": "npm run approve -- <name> fix/<name> \"<reason>\""
      }
    ],
    "visual": {
      "shotLabel": "A human approves. Not the agent.",
      "cmdCards": [
        0
      ]
    },
    "keyPoints": [
      "A neighbor approves, not you.",
      "git add -f approvals/approvals.jsonl.",
      "Deploy [x] in progress.md."
    ],
    "notes": "Time: 15:23 · 7–8 min.\n1. Let them do: the four steps on the slide.\n2. If npm run approve says “Refused”: it runs inside Claude Code. Use your own terminal. Do not use the ! prefix.\n3. If CI fails on check:approval: a human runs npm run approve, then git add -f approvals/approvals.jsonl, commit, and push."
  },
  {
    "title": "Maintain: each incident becomes an eval",
    "kicker": "W5 · MAINTAIN · CONTROL BANDS",
    "subtitle": "The running system teaches you. Put the lesson back in the loop.",
    "type": "concept",
    "layout": "steps",
    "items": [
      {
        "label": "Detect",
        "caption": "1σ / 2σ / 3σ bands"
      },
      {
        "label": "Triage",
        "caption": "a human decides"
      },
      {
        "label": "Add case",
        "caption": "evals/cases/"
      },
      {
        "label": "Run in CI",
        "caption": "guards the fix"
      },
      {
        "label": "Plan again",
        "caption": "Maintain feeds Plan"
      }
    ],
    "visual": {
      "stepKeys": true,
      "art": "loop",
      "loopCaptions": true
    },
    "keyPoints": [
      "Each incident becomes a case.",
      "A human triages.",
      "Only mention /improve-claude-md."
    ],
    "notes": "Time: 15:30 · 10 min.\n1. Progress check (30 s).\n2. Show: write a new (fictional) incident as an eval case. Run npm run eval.\n3. Say: control bands 1σ, 2σ, 3σ (p.49–51).\n4. Say: “Claude Tag exists. Slack connections are probably not allowed at Worldline.”\n5. Say (20 s): “/improve-claude-md rewrites a long CLAUDE.md. Review the result as a PR/MR.”\n6. Check: progress.md shows Maintain [x] after one eval case more than the 3 included cases."
  },
  {
    "title": "From lab to hackathon",
    "subtitle": "This is your toolbox inside the rules.",
    "cards": [
      {
        "title": "Repo template",
        "body": "CLAUDE.md, intent/spec/plan templates, progress.md."
      },
      {
        "title": "Controls",
        "body": "settings.json, hooks, approve gate, REVIEW.md."
      },
      {
        "title": "Evidence",
        "body": "Skills, evals, CI for GitHub and GitLab."
      }
    ],
    "kicker": "W5 · HACKATHON W6–W7",
    "type": "context",
    "visual": {
      "stack": [
        "Plan · Design",
        "Build · Deploy",
        "Test · Maintain"
      ]
    },
    "keyPoints": [
      "Take the structure, not the SRE agent.",
      "The same gate applies in the hackathon.",
      "Start with intent.md."
    ],
    "notes": "Time: 15:40 · 2 min.\n1. Progress check (30 s).\n2. Say: “You do not take the SRE agent. You take the structure: templates, settings, hooks, skills, evals, REVIEW.md.”\n3. Say: “Inside these rules, you can go fast and safe in W6–W7.”"
  },
  {
    "title": "Assignment 8: Your hackathon intent.md",
    "kicker": "W5 · SHOWCASE 5 · 15:45 · /HANDOFF",
    "subtitle": "Then /handoff.",
    "type": "practice",
    "layout": "exercise",
    "steps": [
      "Choose your hackathon idea.",
      "Write intent.md: five fields + one OPEN.",
      "A loop? Use /design-control-loop.",
      "Run /handoff.",
      "Open a PR/MR."
    ],
    "expected": "PR/MR with intent.md and HANDOFF.md.",
    "stepsHeading": "Do this now:",
    "cards": [
      {
        "title": "examples/intent.md",
        "body": "Problem\nOutcome\nUsers/Systems\nConstraints\nOpen questions"
      }
    ],
    "visual": {
      "shotLabel": "Template → then /handoff → HANDOFF.md",
      "template": 0
    },
    "keyPoints": [
      "Showcase 5: /handoff.",
      "Day 2 starts with full context.",
      "The facilitator reviews in W6."
    ],
    "notes": "Time: 15:42 · 8 min. Showcase 5 at 15:45 (1–2 min).\n1. Show: run /handoff. HANDOFF.md lists what is done, what is open, and the next step.\n2. Say: “Day 2 of the hackathon, or a teammate, starts with full context.”\n3. Let them do: each team writes intent.md for its own idea.\n4. Say: “I review your intent.md in W6.”\n5. Check: progress.md shows Hackathon [x] after a complete HANDOFF.md."
  },
  {
    "title": "External skills: read first",
    "kicker": "W5 · CLOSE · CHECKLIST",
    "subtitle": "Six checks first.",
    "type": "concept",
    "cards": [
      {
        "title": "Checklist",
        "body": "1 · Read all of SKILL.md, HTML comments, references/\n2 · ! lines: shell runs at load\n3 · Scripts and hooks: what do they run?\n4 · Network: curl, fetch, npx/bunx, git clone, URLs\n5 · Secrets: .env, tokens, ~/.ssh, gcloud\n6 · Injection: “ignore previous”, “without approval”, hidden characters"
      }
    ],
    "tagline": "Also check allowed-tools and disable-model-invocation. Install per project in a PR/MR. npm run skill:scan is a first filter, not a seal.",
    "visual": {
      "checklist": 0,
      "bot": "think",
      "place": "left"
    },
    "keyPoints": [
      "Six check questions.",
      "Per project, in a PR/MR.",
      "skill:scan is not a seal."
    ],
    "notes": "Time: 15:50 · 3 min.\n1. Explain the six questions.\n2. Show (30 s): run npm run skill:scan -- <folder> on an external skill. Show the flags.\n3. Say the example from today's review: build-iterated-agentic-loop says “Do not stop and ask … or request approvals”. We rejected it. It is not in the pack.\n4. Say: “Install skills per project in .claude/skills/, in a PR/MR. Never copy them blindly to ~/.claude/skills.”"
  },
  {
    "title": "Take-away: the full skills pack",
    "kicker": "W5 · CLOSE · RYANLISSE/CLAUDE-CODE-SKILLS-PACK",
    "subtitle": "Three groups. Read before you install.",
    "type": "concept",
    "layout": "compare",
    "columns": [
      {
        "title": "✅ OK",
        "items": [
          "eli5 · grilling · handoff",
          "cli-for-agents · show-me",
          "improve-claude-md"
        ]
      },
      {
        "title": "⚠️ With flag",
        "items": [
          "verify-this · deslop · rpi",
          "review-and-ship · new-branch-and-pr · fix-ci",
          "get-pr-comments · make-pr-easy-to-review",
          "visual-pr · design-control-loop (A–D) · java-lts-migration"
        ]
      },
      {
        "title": "⛔ Not without IT",
        "items": [
          "archify (gets external code)",
          "build-iterated-agentic-loop (rejected)"
        ]
      }
    ],
    "tagline": "Disclaimer: AetherLink keeps no data. Your company policy applies to external skills and tools.",
    "visual": {
      "stepThrough": true
    },
    "keyPoints": [
      "Flag list: notes/worldline-flags.md.",
      "HumanLayer skills: flagged, MIT license.",
      "Install per project in a PR/MR."
    ],
    "notes": "Time: 15:53 · 3 min.\n1. Share the pack URL and the flag list (notes/worldline-flags.md, disclaimer at the top).\n2. Say what ⚠️ means: internal git host only behind the gate (gh/glab), web search off (rpi), description writer only (visual-pr), phases A–D only (design-control-loop), internal artifact repo (java-lts-migration).\n3. Say what ⛔ means: archify stays in the pack with the disclaimer. build-iterated-agentic-loop is not in the pack."
  },
  {
    "title": "The loop keeps running. Human judgment stays above it.",
    "kicker": "W5 · RECAP · BRIDGE TO W6–W7",
    "type": "recap",
    "layout": "recap",
    "items": [
      {
        "label": "Plan + Design",
        "caption": "intent.md and spec.md, reviewed as a PR/MR."
      },
      {
        "label": "Build",
        "caption": "Local MCP, skills, hooks. The agent proposes, never executes."
      },
      {
        "label": "Test",
        "caption": "Evals in CI test the reasoning."
      },
      {
        "label": "Deploy + Maintain",
        "caption": "A named human approves. Each incident becomes a case."
      }
    ],
    "visual": {
      "levelUp": true
    },
    "notes": "Time: 15:56 · 4 min.\n1. Say the quote (p.53): “The loop keeps running. Human judgement stays above it.”\n2. Explain the four lines.\n3. Homework for W6: improve your hackathon intent.md. Read the flag list.\n4. If time remains: do the bonus Daily Brief solo (slides 57–60). Else it is homework before W6."
  },
  {
    "title": "Time left? The loop, solo",
    "kicker": "W5 · BONUS · DAILY BRIEF SOLO",
    "type": "concept",
    "layout": "steps",
    "items": [
      {
        "label": "Intent",
        "caption": "why, in my words"
      },
      {
        "label": "Spec",
        "caption": "source → Brief field"
      },
      {
        "label": "Plan",
        "caption": "plan mode, I accept"
      },
      {
        "label": "Build",
        "caption": "test first"
      },
      {
        "label": "Test",
        "caption": "toolchain, not Claude"
      },
      {
        "label": "Gate",
        "caption": "approve.sh, a neighbor"
      },
      {
        "label": "Maintain",
        "caption": "new check"
      }
    ],
    "visual": {
      "stepKeys": true
    },
    "keyPoints": [
      "The same loop as this afternoon.",
      "Solo and small.",
      "Repo only, sample data, no network."
    ],
    "notes": "Time: 1 min.\n1. Say: “This is the same loop as this afternoon. It is solo and small: one source, sample/work.json, three sections.”\n2. Say the rules: all in the repo, sample data only, no external MCP or API, a human gate with approve.sh and audit.\n3. Say: “The base is aetherlink-daily-brief-lab-s1, from tag step-4-build-render.”"
  },
  {
    "title": "Watch: one source, one gate",
    "kicker": "W5 · BONUS · DEMO · ±18 MIN",
    "subtitle": "One source. One gate. 18 minutes.",
    "type": "concept",
    "cards": [
      {
        "title": "0–8 min",
        "body": "Start → Intent (prompt 1) → Spec (prompt 2) → Plan (prompt 3)"
      },
      {
        "title": "8–14 min",
        "body": "Build test first (prompt 4) → 10 tests green → brief:solo"
      },
      {
        "title": "14–18 min",
        "body": "Push → deny → approve.sh → ask → AL-198 High → new OPEN"
      }
    ],
    "visual": {
      "stagger": "pop",
      "stepThrough": true
    },
    "prompt": "We are doing a solo loop on the daily brief. Read CLAUDE.md, AGENTS.md, intent.md and sample/work.json. Interview me one question at a time to rewrite intent.md for this goal: render push, to-dos and my day from sample/work.json only. Boundary: no network, no real data, no model at runtime. Three checks a stranger can verify, at least one OPEN. Stop for my review.",
    "keyPoints": [
      "Follow DAILY-BRIEF-SOLO §2 minute by minute.",
      "Two terminals: Claude left, your shell right.",
      "No model at runtime."
    ],
    "notes": "Time: 18 min.\n1. Prepare: clone the repo. Run npm ci. Run claude and /status. Have sample/work.json ready. Open two terminals. Use font size 18+.\n2. 0–1 min: git switch -c solo/ryan step-4-build-render. Run npm test (6 green).\n3. 1–4 min: Intent. Paste prompt 1.\n4. 4–6 min: Spec. Paste prompt 2 (table source → Brief field).\n5. 6–8 min: Plan. Press Shift+Tab. Paste prompt 3. Ask “What can break?” (p.19).\n6. 8–12 min: Build. test/compose.test.ts is red first. Then src/compose.ts and src/solo.ts make it green (10 tests).\n7. 12–14 min: Test. Run typecheck and npm run brief:solo. Compare out/latest.html with sample/work.json (AL-240, no AL-198, 11:00 and 14:00).\n8. 14–16 min: Gate. Claude tries git push. The hook denies it. In your own shell, run scripts/approve.sh ryan solo/ryan \"evidence ok\". Claude tries again. The hook asks.\n9. Say: “Claude goes to the gate, not through it. The hook enforces that a named human has approved.”\n10. 16–18 min: Maintain. Set AL-198 to High. Run npm test. Add a new OPEN to intent.md.\n11. If brief:sample hangs: set BRIEF_ARTWORK=off, or use brief:solo.\n12. If the hook does not run on Windows: use the Node hook or WSL.\n13. If package.json is denied: add the script yourself."
  },
  {
    "title": "Assignment 9: Daily Brief solo",
    "kicker": "W5 · BONUS · YOUR TURN",
    "subtitle": "Each step has a done check.",
    "type": "practice",
    "layout": "exercise",
    "steps": [
      "0 · Branch solo/<name>. npm test.",
      "1–3 · Intent, spec, plan (plan mode).",
      "4 · Build. ≥ 4 green tests.",
      "5 · brief:solo. Write docs/evidence.md.",
      "6–7 · A neighbor approves. Add a finding."
    ],
    "expected": "PR with approvals/. 3 sections in out/latest.html. A new OPEN.",
    "stepsHeading": "Do this now:",
    "cards": [
      {
        "title": "Only source",
        "body": "sample/work.json"
      }
    ],
    "visual": {
      "shotLabel": "Start: step-4-build-render",
      "tree": 0
    },
    "keyPoints": [
      "30–40 minutes.",
      "A neighbor approves with approve.sh.",
      "Stretch: a New updates section."
    ],
    "notes": "Time: 30–40 min.\n1. Let them do: steps 0–7 from DAILY-BRIEF-SOLO §3.\n2. Say: “Approve the branch of your neighbor with scripts/approve.sh <name> solo/<their-name> \"<reason>\".”\n3. Stretch: add a 4th section New updates, for example pipelines that are green again today.\n4. If a person is behind: use the reference in docs/plan.md."
  },
  {
    "title": "What changes when you work alone",
    "kicker": "W5 · BONUS · SOLO",
    "type": "concept",
    "layout": "compare",
    "columns": [
      {
        "title": "In a team",
        "items": [
          "Reviewer",
          "QA",
          "Four eyes",
          "Memory"
        ]
      },
      {
        "title": "Alone",
        "items": [
          "Plan mode",
          "Tests",
          "Hook + approve.sh",
          "Evals"
        ]
      }
    ],
    "visual": {
      "pairs": true
    },
    "keyPoints": [
      "Use this between team sessions.",
      "This leads to the hackathon.",
      "The gate stays human."
    ],
    "notes": "Time: 2 min.\n1. Say: “Solo work still has controls.”\n2. Say: “Plan mode is your reviewer. Tests are your QA. The hook plus approve.sh is your four eyes. Evals are your memory.”\n3. Say: “Use this loop between the hackathon sessions in W6–W7.”"
  }
];
