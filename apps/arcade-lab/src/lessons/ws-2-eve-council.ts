import type { Lesson } from '../schema';
import { LessonSchema } from '../schema';

/** Built-in lesson `ws-2-eve-council` — preserved exact id (lesson-id contract). */
export const lesson: Lesson = LessonSchema.parse({
  "id": "ws-2-eve-council",
  "title": "4 \u00b7 Eve \u00b7 Council: one prompt, four independent views",
  "kind": "trace",
  "files": [
    {
      "name": "agent/instructions.md",
      "text": "# Council coordinator\n\nCondensed for this lesson \u2014 open the template's agent/instructions.md for the source.\n\n- Call all four members (claude, grok, kimi, openai) exactly once.\n- Send each member the same complete question. Never forward another member's answer.\n- Wait until all four have answered before judging.\n- Judge on evidence and accuracy, not majority vote.\n- Return a summary within 75 words and an agreement score (0\u2013100) per member.\n"
    },
    {
      "name": "agent/lib/schemas.ts",
      "text": "import { z } from \"zod\";\n\n// Output contract as described in the lesson.\n// Open the template's agent/lib/schemas.ts for the source revision.\nexport const CouncilResult = z.object({\n  summary: z.string(),\n  agreementScores: z.object({\n    claude: z.number().int().min(0).max(100),\n    grok: z.number().int().min(0).max(100),\n    kimi: z.number().int().min(0).max(100),\n    openai: z.number().int().min(0).max(100),\n  }),\n});\n"
    }
  ],
  "ops": [
    {
      "t": 600,
      "chapter": "Setup"
    },
    {
      "t": 600,
      "say": "The council is a **separate project**. Copy the template at the pinned revision so you don't run the repository's contributor scripts."
    },
    {
      "t": 8130,
      "out": "git clone --filter=blob:none https://github.com/vercel/eve.git eve-source",
      "cls": "cmd"
    },
    {
      "t": 8830,
      "out": "Cloning into 'eve-source'\u2026",
      "cls": "dim"
    },
    {
      "t": 9530,
      "out": "git -C eve-source checkout dea2ced59e8c7ed5a41b9a1c432f5fcd080999d9",
      "cls": "cmd"
    },
    {
      "t": 10230,
      "out": "HEAD is now at dea2ced",
      "cls": "dim"
    },
    {
      "t": 10730,
      "out": "cp -R eve-source/apps/templates/eve-llm-council-template council-agent && cd council-agent",
      "cls": "cmd"
    },
    {
      "t": 11430,
      "say": "Use pnpm 12.4.2 \u2014 the version the template declares. Link the project to retrieve AI Gateway credentials, then confirm your workshop spending limit before the first question."
    },
    {
      "t": 20430,
      "out": "npm install --global pnpm@12.4.2",
      "cls": "cmd"
    },
    {
      "t": 21130,
      "out": "pnpm install",
      "cls": "cmd"
    },
    {
      "t": 21830,
      "out": "Done",
      "cls": "dim"
    },
    {
      "t": 22330,
      "out": "pnpm exec eve link",
      "cls": "cmd"
    },
    {
      "t": 23030,
      "out": "Linked to Vercel project \u00b7 AI Gateway credentials retrieved",
      "cls": "dim"
    },
    {
      "t": 23830,
      "out": "pnpm dev",
      "cls": "cmd"
    },
    {
      "t": 24530,
      "out": "\u25b2 Next.js ready on http://localhost:3000 (open via port forwarding)",
      "cls": "dim"
    },
    {
      "t": 25530,
      "chapter": "Four members"
    },
    {
      "t": 25530,
      "say": "Open agent/subagents/: Claude, Grok, Kimi and OpenAI. Then the coordinator's instructions."
    },
    {
      "t": 33580,
      "say": "Call all four once. Send each the same complete question. Wait for all four. Judge on evidence, **not majority vote**. Model IDs are version-specific \u2014 record any substitution."
    },
    {
      "t": 42580,
      "chapter": "Predict, then ask"
    },
    {
      "t": 42580,
      "stop": {
        "title": "Predict the answer",
        "q": "An outdoor workshop has 24 participants. Each table seats 6 people.\nHow many tables are needed? Explain the calculation in one sentence.\n\nWrite your own answer and the calculation before submitting.",
        "explain": "Four tables, because 24 \u00f7 6 = 4. A verifiable arithmetic question tests the flow without asking the models to look up live facts."
      }
    },
    {
      "t": 42780,
      "clear": true
    },
    {
      "t": 42980,
      "out": "An outdoor workshop has 24 participants. Each table seats 6 people.\nHow many tables are needed? Explain the calculation in one sentence.",
      "cls": "you"
    },
    {
      "t": 44480,
      "out": "fan-out \u2192 claude \u00b7 grok \u00b7 kimi \u00b7 openai   (same complete question, independently)",
      "cls": "dim"
    },
    {
      "t": 45680,
      "out": "claude  \u21e2 \"Four tables. 24 participants \u00f7 6 seats per table = 4.\"",
      "cls": "tool"
    },
    {
      "t": 46580,
      "out": "kimi    \u21e2 \"4 tables \u2014 24 divided by 6 is exactly 4.\"",
      "cls": "tool"
    },
    {
      "t": 47280,
      "out": "openai  \u21e2 \"Four tables: 24 \u00f7 6 = 4.\"",
      "cls": "tool"
    },
    {
      "t": 48080,
      "out": "grok    \u21e2 \"You need 4 tables, since 24 / 6 = 4.\"",
      "cls": "tool"
    },
    {
      "t": 48980,
      "out": "judge   \u21e0 4/4 member answers",
      "cls": "dim"
    },
    {
      "t": 49880,
      "out": "{ \"summary\": \"Four tables are needed because 24 participants divided by 6 seats per table equals 4.\", \"agreementScores\": { \"claude\": 100, \"grok\": 100, \"kimi\": 100, \"openai\": 100 } }",
      "cls": "res"
    },
    {
      "t": 51380,
      "say": "Observe the four member responses arriving independently \u2014 read them **before** the summary."
    },
    {
      "t": 57020,
      "chapter": "Inspect the judge"
    },
    {
      "t": 57020,
      "tab": 1
    },
    {
      "t": 57520,
      "say": "The result contract: a summary plus four integer scores from 0 to 100. The instructions ask for \u226475 words; the schema does not enforce that limit."
    },
    {
      "t": 65590,
      "stop": {
        "title": "Knowledge check",
        "q": "What does an agreement score mean?",
        "options": [
          "How closely a member agrees with the judge summary's factual conclusions",
          "The probability that the member is correct"
        ],
        "correct": 0,
        "explain": "A score of 80 is not an 80% chance of truth. The scores are the judge's assessment of agreement with its own conclusions. Four models can agree on the same mistake."
      }
    },
    {
      "t": 65790,
      "chapter": "Introduce uncertainty"
    },
    {
      "t": 65790,
      "clear": true
    },
    {
      "t": 65990,
      "out": "We need a location for a 24-person workshop next month.\nShould we book an outdoor venue? We have no city, date, forecast, or backup plan yet.\nState what can be concluded and what information is missing.",
      "cls": "you"
    },
    {
      "t": 67790,
      "out": "fan-out \u2192 claude \u00b7 grok \u00b7 kimi \u00b7 openai",
      "cls": "dim"
    },
    {
      "t": 68790,
      "out": "claude  \u21e2 \"Cannot recommend yet: no city, date or forecast. Decide venue after a forecast and a backup plan exist.\"",
      "cls": "tool"
    },
    {
      "t": 69590,
      "out": "grok    \u21e2 \"Outdoor is possible but unknowable now \u2014 missing city, date, weather data, contingency.\"",
      "cls": "tool"
    },
    {
      "t": 70390,
      "out": "kimi    \u21e2 \"Insufficient information. Needed: location, date, forecast, indoor fallback.\"",
      "cls": "tool"
    },
    {
      "t": 71190,
      "out": "openai  \u21e2 \"No conclusion is possible without a date and location; secure a backup venue first.\"",
      "cls": "tool"
    },
    {
      "t": 72090,
      "out": "{ \"summary\": \"No venue decision can be made yet. Missing: city, date, a forecast for that date, and a backup plan. Choose once those exist.\", \"agreementScores\": { \"claude\": 95, \"grok\": 90, \"kimi\": 95, \"openai\": 90 } }",
      "cls": "res"
    },
    {
      "t": 73590,
      "say": "The summary identifies missing information rather than inventing a forecast. The council has **no weather or web tool** \u2014 a confident answer would not supply that evidence."
    },
    {
      "t": 82590,
      "chapter": "Independence"
    },
    {
      "t": 82590,
      "say": "Verify in the run trace that each member received the complete same prompt and none saw another's answer. Count **four** completed members before accepting a result; three is an incomplete run."
    },
    {
      "t": 91590,
      "chapter": "Change a rule"
    },
    {
      "t": 91590,
      "say": "Change the summary limit from 75 to 40 words. Run the table question again in a fresh conversation and count the words."
    },
    {
      "t": 98445,
      "tab": 0
    },
    {
      "t": 98945,
      "c": 394
    },
    {
      "t": 99345,
      "f": 0,
      "p": 394,
      "d": 8,
      "i": ""
    },
    {
      "t": 99695,
      "f": 0,
      "p": 394,
      "d": 0,
      "i": "40 words"
    },
    {
      "t": 100011,
      "clear": true
    },
    {
      "t": 100211,
      "out": "An outdoor workshop has 24 participants. Each table seats 6 people.\nHow many tables are needed? Explain the calculation in one sentence.",
      "cls": "you"
    },
    {
      "t": 101511,
      "out": "fan-out \u2192 claude \u00b7 grok \u00b7 kimi \u00b7 openai",
      "cls": "dim"
    },
    {
      "t": 102511,
      "out": "{ \"summary\": \"Four tables: 24 divided by 6 equals 4.\", \"agreementScores\": { \"claude\": 100, \"grok\": 100, \"kimi\": 100, \"openai\": 100 } }",
      "cls": "res"
    },
    {
      "t": 103911,
      "say": "Members still get the same question; your change affected the **judge**. If the judge exceeds the limit, you've exposed the difference between an instruction and a code-enforced constraint."
    },
    {
      "t": 112911,
      "stop": {
        "title": "Explain the effect",
        "q": "Which part of the system did your change affect, and how would you enforce the word limit in code rather than in prose?",
        "explain": "Only the judge's output changed. To enforce it, validate the word count after parsing the result \u2014 the Claude Agent SDK lesson does exactly that."
      }
    }
  ],
  "duration": 114611,
  "audio": null,
  "builtin": true
});
export default lesson;
