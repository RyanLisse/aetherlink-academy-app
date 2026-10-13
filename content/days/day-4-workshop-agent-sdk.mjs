import {diagram,link,question,slide,starter} from './model.mjs';

const d='workshop-4';

const DIAGRAM_EN=diagram(
 '/diagrams/workshop/w4-ticket-tool-priority.svg',
 'Customer message → tool_use → priority',
 'Customer message → tool_use → tool_result → priority label → human gate'
);
const DIAGRAM_NL=diagram(
 '/diagrams/workshop/w4-ticket-tool-priority.svg',
 'Klantbericht → tool_use → prioriteit',
 'Klantbericht → tool_use → tool_result → prioriteitslabel → menselijke gate'
);

const CODE_EXAMPLES = [
  {
    id: 'w4-agent-sdk-mcp-options',
    title: 'Agent SDK MCP options',
    slide: slide(d, 28, 'Step 3 · Read-only customer and transaction MCP tools'),
    typescript: `import { query, type Options } from "@anthropic-ai/claude-agent-sdk";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { agents } from "./agents.mjs";
import { defaultWorkbookPath } from "./transaction-mcp/paths.mjs";

const prompt = "Review the supplied customer message.";
const lessonDirectory = path.dirname(fileURLToPath(import.meta.url));
const transactionServer = path.join(lessonDirectory, "transaction-mcp", "server.js");
const customerServer = path.join(lessonDirectory, "transaction-mcp", "customers.js");
const workbook = defaultWorkbookPath;
const customerContext = path.join(path.dirname(lessonDirectory), "docs", "customer_context.csv");

const options = {
  cwd: path.join(lessonDirectory, "claude-project"),
  settingSources: ["project"],
  systemPrompt: { type: "preset", preset: "claude_code" },
  tools: ["Agent", "Write"],
  agents,
  mcpServers: {
    transactions: {
      type: "stdio",
      command: "node",
      args: [transactionServer],
      env: { TRANSACTIONS_XLSX: workbook },
    },
    customers: {
      type: "stdio",
      command: "node",
      args: [customerServer],
      env: { CUSTOMER_CONTEXT_CSV: customerContext },
    },
  },
  allowedTools: ["Agent", "Write", "mcp__transactions__get_transaction", "mcp__transactions__list_transactions", "mcp__customers__get_customer"],
  disallowedTools: ["WebSearch", "WebFetch", "Bash"],
  permissionMode: "acceptEdits",
  maxTurns: 10,
} satisfies Options;

for await (const message of query({ prompt, options })) {
  console.log(message);
}`,
    python: `import asyncio
from pathlib import Path

from claude_agent_sdk import AgentDefinition, ClaudeAgentOptions, query

risk_prompt = "Look up transaction IDs with get_transaction, then analyze the record and message."
reply_prompt = "Draft a concise reply from the risk-agent result; do not invent facts."
customer_prompt = "Look up the customer ID with get_customer and report only returned customer context."
prompt = "Review the supplied customer message."
lesson_directory = Path(__file__).resolve().parent
repo_root = lesson_directory.parent
transaction_server = (lesson_directory / "transaction-mcp" / "server.js").resolve()
customer_server = (lesson_directory / "transaction-mcp" / "customers.js").resolve()
workbook = (repo_root / "docs" / "transactions.xlsx").resolve()
customer_context = (repo_root / "docs" / "customer_context.csv").resolve()

options = ClaudeAgentOptions(
    cwd=str(lesson_directory / "claude-project"),
    setting_sources=["project"],
    system_prompt={"type": "preset", "preset": "claude_code"},
    tools=["Agent", "Write"],
    agents={
        "risk-agent": AgentDefinition(
            description="Looks up transaction IDs and summarizes record facts.",
            prompt=risk_prompt,
            tools=["mcp__transactions__get_transaction"],
        ),
        "customer-reply-agent": AgentDefinition(
            description="Drafts a customer reply from the risk-agent result.",
            prompt=reply_prompt,
            tools=[],
        ),
        "customer-context-agent": AgentDefinition(
            description="Looks up customer context for the ticket.",
            prompt=customer_prompt,
            tools=["mcp__customers__get_customer"],
        ),
    },
    mcp_servers={
        "transactions": {
            "type": "stdio",
            "command": "node",
            "args": [str(transaction_server)],
            "env": {"TRANSACTIONS_XLSX": str(workbook)},
        },
        "customers": {
            "type": "stdio",
            "command": "node",
            "args": [str(customer_server)],
            "env": {"CUSTOMER_CONTEXT_CSV": str(customer_context)},
        },
    },
    allowed_tools=["Agent", "Write", "mcp__transactions__get_transaction", "mcp__transactions__list_transactions", "mcp__customers__get_customer"],
    disallowed_tools=["WebSearch", "WebFetch", "Bash"],
    permission_mode="acceptEdits",
    max_turns=10,
)

async def main():
    async for message in query(prompt=prompt, options=options):
        print(message)

asyncio.run(main())`,
  },
];

const DEMO_SLIDES=[
 slide(d,5,'Map n8n to the Agent SDK.'),
 slide(d,18,'Demo · Step 0: the offline path'),
 slide(d,21,'Demo · Step 1: schema, route, and memory'),
 slide(d,25,'Demo · Step 2: trace the two agents'),
 slide(d,29,'Demo · Step 3: read-only customer and transaction lookups'),
 slide(d,34,'Demo · Step 5: run the starter'),
];

const en = {
 title:'Workshop 4 · Support agents with Claude Code and the Agent SDK',
 tag:'Workshop',
  blurb:'Rebuild Maarten’s n8n support flow with structured output, subagents, read-only MCP tools, and human review of reply drafts.',
 kicker:'Workshop 4 · SOLO 0 → 5',
 lessonTitle:'Support agents with Claude Code and the Agent SDK',
 motto:'prompt → tools → result · chat in → chat out',
 leerdoel:'Rebuild the support workflow with Claude Code as the default backend, structured priority output, specialist subagents, customer and transaction MCP lookups, and human review.',
 narrative:[
  'Yesterday, Maarten built Ticket Input → Switch, Chat trigger + Simple Memory, AI Agent + Priority Parser, specialist subagents, and a Data Table imported from customer_context.csv.',
  'Today, follow the same support flow in code. Claude Code is the default backend; the SDK backend is optional. Customer text is data, not instructions. Review every draft before it reaches a customer.',
  'Use Explain → Demo → Your turn → Discuss. Finish with the chat-in/chat-out assignment: `npm run chat -- --lesson 3` or run `claude` in the repository, then bridge to Workshop 5. The day-5 n8n-to-agent HTML lesson remains optional.',
 ],
 workedExample:'Trace a support message through structured output, the deterministic Switch, risk-agent, customer-reply-agent, and customer-context-agent. Follow customer and transaction facts through MCP, then review the draft.',
 loop:[
  {label:'SOLO 0',prompt:'Can you install, verify, and inspect a dry run without a model call?'},
  {label:'SOLO 1',prompt:'How do structured output, Switch routing, and chat session memory differ?'},
  {label:'SOLO 2',prompt:'What does risk-agent decide, and what does customer-reply-agent write?'},
  {label:'SOLO 3',prompt:'When do you need get_customer and get_transaction, and what facts came from each?'},
  {label:'SOLO 4',prompt:'Does the acceptance table pass npm run check?'},
  {label:'SOLO 5',prompt:'What prompt, tools, and result handling make up your own agent?'}
 ],
 demo:{
  slides:DEMO_SLIDES,
  script:[
   'Open Yesterday’s recap · Maarten’s n8n build. Trace Ticket Input → Switch, Chat trigger + Simple Memory, Priority Parser, subagents, and the customer context Data Table.',
   'Choose Windows, WSL, Linux/macOS, or Docker in `docs/SETUP.md`; run `npm ci`, `npm run doctor`, `npm run verify`, then `npm run lesson1 -- MSG-01 --dry-run`. Point to `backend:` and `Claude Code equivalent:`.',
   'Show outputFormat json_schema, Switch → lib/switch.mjs, and the favourite-colour chat memory test.',
   'Trace Agent → risk-agent, then Agent → customer-reply-agent; open the saved draft.',
   'Trace customers get_customer and transactions get_transaction/list_transactions; finish by reviewing the reply draft.',
   'From SOLO.md run `cd 05-build-your-own`, `node agent.mjs --dry-run`, then `claude -p "Find and fix the bug in utils.js. Explain the change." --allowedTools Read,Edit,Glob --permission-mode acceptEdits`.'
  ]
 },
 solo:[
  {id:'w4-solo0',badge:'S0',level:'required',timerMinutes:10,title:'SOLO 0 · Setup and dry run',goal:'Install and verify the final participant repo, then inspect a dry run without a model call.',instructions:['Choose Windows, WSL, Linux/macOS, or Docker in `docs/SETUP.md`.','Run `git clone https://github.com/RyanLisse/aetherlink-day5-n8n-to-agent.git`, then `cd aetherlink-day5-n8n-to-agent`.','Run `npm ci`, `npm run doctor`, and `npm run verify`.','Run `npm run lesson1 -- MSG-01 --dry-run` and `npm run chat -- --dry-run`.','Confirm the output includes `backend:` and `Claude Code equivalent:`; dry-run output is not model evidence.'],doneWhen:'The package verifies offline and both dry runs print their backend/CLI trace without a model call.',slide:slide(d,19,'Get the workshop package.')},
  {id:'w4-solo1',autograde:'support',badge:'S1',level:'required',timerMinutes:15,title:'SOLO 1 · Structured output, Switch, and memory',goal:'Inspect the configured priority schema and deterministic route, then compare chat memory with a fresh session.',instructions:['Run `npm run lesson1 -- MSG-01 --dry-run` and inspect `01-single-agent/priority-schema.mjs` plus `outputFormat` in the dry-run options.','Inspect `lib/switch.mjs` to see how the priority maps to an action.','A dry run does not produce the model’s JSON result or a `Switch →` line; use a real run with Claude Code logged in or `docs/sample-trace.md` (illustrative sample) for those results.','Enter one label (low/medium/high) for MSG-01–MSG-06 in the `support` check.','Run `npm run chat`; tell it your favourite colour and ask again in the same session.','Compare with `npm run chat -- --no-memory` and record how session resume maps to n8n Simple Memory.'],doneWhen:'You can explain the configured schema, deterministic Switch, and difference between resumed and fresh chat sessions.',slide:slide(d,22,'Run Step 1 and test chat memory.')},
  {id:'w4-solo2',badge:'S2',level:'required',timerMinutes:20,title:'SOLO 2 · Risk and customer reply agents',goal:'Trace the orchestrator’s ordered delegation and review its saved draft.',instructions:['Run `npm run lesson2 -- MSG-05 --dry-run` to inspect setup only; the dry run does not call either agent.','For the Agent trace and saved draft, run `npm run lesson2 -- MSG-05` with Claude Code logged in, or use `docs/sample-trace.md` as an illustrative sample.','Open `02-subagents/claude-project/output/MSG-05.md` only after a live run; a dry run does not create it.','Compare each agent’s frontmatter `description` with its prompt body.','For MSG-10’s missing-information path, run `npm run lesson2 -- MSG-10` with Claude Code logged in, or inspect the illustrative sample in `docs/sample-trace.md`; do not treat dry-run output as a model result.'],doneWhen:'You can identify both specialist calls in order, explain how their descriptions guide delegation, and distinguish a sample or live result from a dry run.',slide:slide(d,26,'Run the orchestrator and inspect the draft.')},
  {id:'w4-solo3',badge:'S3',level:'required',timerMinutes:20,title:'SOLO 3 · Read-only customer and transaction MCP tools',goal:'Smoke-test both MCP servers, follow read-only customer and transaction lookups, and review the reply draft.',instructions:['Run `(cd 03-mcp/transaction-mcp && npm ci)` once to install the MCP server dependencies.','Run `npm run smoke:mcp`; it calls the read-only MCP tools without a model.','Run `npm run lesson3 -- MSG-08 --dry-run` and inspect both configured MCP servers.','Run `npm run lesson3 -- MSG-08` with Claude Code logged in, or use `--backend sdk` with a key, then follow `mcp → mcp__customers__get_customer` and `mcp → mcp__transactions__get_transaction` in the real trace.','The transaction tools are `get_transaction` and `list_transactions`; both are read-only.','Keep external facts tied to returned tool results, do not guess missing information, and have a person review the reply draft before sending.'],doneWhen:'You can trace the read-only MCP lookups and explain why a person reviews the reply draft.',slide:slide(d,30,'Run Step 3 customer and transaction lookups.')},
  {id:'w4-solo4',autograde:'support-mcp',badge:'S4',level:'required',timerMinutes:15,title:'SOLO 4 · Acceptance table and npm run check',goal:'Complete the acceptance table, run the offline label check, and keep every draft behind human review.',instructions:['Complete the acceptance table for MSG-01, MSG-05, MSG-07, MSG-08, and MSG-09.','Record customer context from `get_customer` and transaction facts from `get_transaction`.','Run `npm run check`; fill `labels.json` with MSG-01 through MSG-09 labels for the `support-mcp` check, then run `npm run check` again.','Save the acceptance table and results in `participant-output/` or the squad’s `intent.md`.','A dry run is not model evidence; have a person review every draft.'],doneWhen:'The acceptance table is complete, `npm run check` passes, and results are saved in `participant-output/` or the squad’s `intent.md`.',slide:slide(d,32,'Step 4 · Acceptance table and npm run check')},
  {id:'w4-solo5',badge:'S5',level:'required',timerMinutes:20,title:'SOLO 5 · Build your own agent',goal:'Use the Step 5 starter to identify the prompt, allowed tools, tool-use event, and result handling.',instructions:['Catch up with `git switch step-4`; Step 5 is carried by `step-4`.','Follow `05-build-your-own/README.md` to initialize the folder and install dependencies.','Run the exact offline demo commands: `cd 05-build-your-own` and `node agent.mjs --dry-run`.','Run `claude -p "Find and fix the bug in utils.js. Explain the change." --allowedTools Read,Edit,Glob --permission-mode acceptEdits`.','Save your result in `participant-output/` or the squad’s `intent.md`.'],doneWhen:'You can point to the prompt, tool scope, tool-use event, and final result.',slide:slide(d,35,'Your turn · build your own agent')},
 ],
 materials:[
  link('solo','Weather Agent SDK · HTML companion','/courses/weather-agent-sdk/index.html','Instruction quest in instructions.md · Arcade companion'),
  link('solo','Optional parity bonus · day5 n8n→agent','/courses/aetherlink-day5-n8n-to-agent/index.html','Optional comparison with Workshop 3; not the Workshop 4 vehicle'),
  link('solo','Council Agent SDK · HTML companion','/courses/council-agent-sdk/index.html','Judge rule in instructions.md'),
  link('solo','Legacy SDK-only package (optional comparison)','https://github.com/RyanLisse/aetherlink-academy-app/tree/main/training-lab/w4-support-agent-sdk','Optional comparison with the earlier SDK-only lessons'),
  link('vehicle','Workshop 4 participant repo · aetherlink-day5-n8n-to-agent','https://github.com/RyanLisse/aetherlink-day5-n8n-to-agent','Steps 0–5 · Claude Code by default, SDK optional'),
  starter('customer-messages.md','Customer messages MSG-01–MSG-10'),
  link('naslag','Agent SDK overview','https://code.claude.com/docs/en/agent-sdk/overview','Agent SDK reference'),
  link('naslag','Agents documentation','https://code.claude.com/docs/en/agents','Subagent reference'),
  link('naslag','Introduction to Subagents','https://academy.claude.com/courses/introduction-to-subagents','Anthropic Academy'),
  link('diagram','Customer message → tool_use → priority diagram','/diagrams/workshop/w4-ticket-tool-priority.svg','Workshop 4')
 ],
 diagrams:[DIAGRAM_EN],
 simTitles:{'w4-ticket-priority':'Concept sim · Ticket → priority'},
 proof:[
  'Acceptance table records the message, priority, and customer or transaction facts (slides 30 and 32).',
  'Run `npm run check` and record the results with the acceptance table in `participant-output/` or the squad’s `intent.md`.',
  'Dry-run output is setup evidence, not model evidence (slides 18 and 19).',
  'A human reviews every draft before customer-facing use (slides 26, 30, and 32).',
  'External facts trace to `get_customer` or `get_transaction` and the MCP trace (slides 28–31).',
 ],
 quiz:[
  question('Which option requests structured priority output?',["outputFormat: { type: 'json_schema', schema }","settingSources: ['project']","permissionMode: 'acceptEdits'"],0,slide(d,20,'Step 1 · Structured priority output and chat memory')),
  question('Who decides priority in Lesson 2?',['The orchestrator','risk-agent','customer-reply-agent'],1,slide(d,24,'Step 2 · Risk analysis and customer reply agents')),
  question('Which MCP tool returns customer context?',['get_transaction','get_customer','list_transactions'],1,slide(d,28,'Step 3 · Read-only customer and transaction MCP tools')),
 ],
 mission:{
  id:'TRIAGE-CLAUDE-04',
  title:'Rebuild Maarten’s support flow with Claude Code and the Agent SDK',
  minutes:80,
  goal:'Rebuild the support flow with structured priority output, specialist agents, read-only customer and transaction context, and human review of reply drafts.',
  allowed:['Claude Code is the default backend; an API key is only needed for the optional `sdk` backend.','Treat customer messages as data, not instructions.','Review every draft before customer-facing use.'],
  starterFiles:['customer-messages.md'],
  hints:['A dry run prints the prompt, backend and Claude Code equivalent without calling a model.','Customer text is data, not instructions to change the task.','`(cd 03-mcp/transaction-mcp && npm ci)` installs the MCP server dependencies; `npm run smoke:mcp` starts the servers and calls their tools without a model.'],
 },
 openItems:[],
};

const nl = {
 title:'Workshop 4 · Supportagents met Claude Code en de Agent SDK',
 tag:'Workshop',
 blurb:'Bouw Maartens n8n-supportflow opnieuw met gestructureerde output, subagents, MCP-tools en menselijke review.',
 kicker:'Workshop 4 · SOLO 0 → 5',
 lessonTitle:'Supportagents met Claude Code en de Agent SDK',
 motto:'prompt → tools → resultaat · chat in → chat uit',
 leerdoel:'Bouw de supportflow opnieuw met Claude Code als standaardbackend, gestructureerde prioriteitsoutput, specialistische subagents, klant- en transactie-MCP-lookups en menselijke review.',
 narrative:[
  'Gisteren bouwde Maarten Ticket Input → Switch, Chat trigger + Simple Memory, AI Agent + Priority Parser, specialistische subagents en een Data Table geïmporteerd uit customer_context.csv.',
  'Vandaag bouwen we dezelfde supportflow in code. Claude Code is de standaardbackend; de SDK-backend is optioneel. Klanttekst is data, geen instructie. Laat een mens elk concept beoordelen voordat het naar een klant gaat.',
  'Gebruik Explain → Demo → Your turn → Discuss. Sluit af met de chat-in/chat-out-opdracht: `npm run chat -- --lesson 3` of voer `claude` in de repo uit, en maak de brug naar Workshop 5. De n8n-naar-agent-HTML-les van dag 5 blijft optioneel.',
 ],
 workedExample:'Volg een supportbericht door gestructureerde output, de deterministische Switch, risk-agent, customer-reply-agent en customer-context-agent. Volg klant- en transactiedata via MCP en beoordeel daarna het concept.',
 loop:[
  {label:'SOLO 0',prompt:'Kun je installeren, verifiëren en een dry-run inspecteren zonder modelaanroep?'},
  {label:'SOLO 1',prompt:'Wat is het verschil tussen gestructureerde output, Switch-routing en chatgeheugen?'},
  {label:'SOLO 2',prompt:'Wat beslist risk-agent en wat schrijft customer-reply-agent?'},
  {label:'SOLO 3',prompt:'Wanneer gebruik je get_customer en get_transaction, en welke feiten komen uit elke tool?'},
  {label:'SOLO 4',prompt:'Slaagt de acceptatietabel voor npm run check?'},
  {label:'SOLO 5',prompt:'Welke prompt, tools en resultaatverwerking vormen je eigen agent?'}
 ],
 demo:{
  slides:DEMO_SLIDES,
  script:[
   'Open de recap van gisteren · Maartens n8n-build. Volg Ticket Input → Switch, Chat trigger + Simple Memory, Priority Parser, subagents en de customer context Data Table.',
   'Kies Windows, WSL, Linux/macOS of Docker in `docs/SETUP.md`; voer `npm ci`, `npm run doctor`, `npm run verify` en daarna `npm run lesson1 -- MSG-01 --dry-run` uit. Wijs `backend:` en `Claude Code equivalent:` aan.',
   'Toon outputFormat json_schema, Switch → lib/switch.mjs en de favoriete-kleur-test met chatgeheugen.',
   'Volg Agent → risk-agent en daarna Agent → customer-reply-agent; open het opgeslagen concept.',
   'Volg read-only customers get_customer en transactions get_transaction/list_transactions; bespreek dat een mens het antwoordconcept controleert.',
   'Voer de commando’s uit SOLO.md uit: `cd 05-build-your-own`, `node agent.mjs --dry-run` en `claude -p "Find and fix the bug in utils.js. Explain the change." --allowedTools Read,Edit,Glob --permission-mode acceptEdits`.'
  ]
 },
 solo:[
  {id:'w4-solo0',badge:'S0',level:'required',timerMinutes:10,title:'SOLO 0 · Setup en dry-run',goal:'Installeer en verifieer de deelnemersrepo en bekijk een dry-run zonder modelaanroep.',instructions:['Kies Windows, WSL, Linux/macOS of Docker in `docs/SETUP.md`.','Voer `git clone https://github.com/RyanLisse/aetherlink-day5-n8n-to-agent.git` uit en daarna `cd aetherlink-day5-n8n-to-agent`.','Voer `npm ci`, `npm run doctor` en `npm run verify` uit.','Voer `npm run lesson1 -- MSG-01 --dry-run` en `npm run chat -- --dry-run` uit.','Controleer of de uitvoer `backend:` en `Claude Code equivalent:` toont; dry-runuitvoer is geen modelbewijs.'],doneWhen:'De repo verifieert offline en beide dry-runs tonen backend/CLI-trace zonder modelaanroep.',slide:slide(d,19,'Get the workshop package.')},
  {id:'w4-solo1',autograde:'support',badge:'S1',level:'required',timerMinutes:15,title:'SOLO 1 · Gestructureerde output, Switch en geheugen',goal:'Bekijk het ingestelde prioriteitsschema en de deterministische route en vergelijk chatgeheugen met een nieuwe sessie.',instructions:['Voer `npm run lesson1 -- MSG-01 --dry-run` uit en bekijk `01-single-agent/priority-schema.mjs` plus `outputFormat` in de dry-runopties.','Bekijk `lib/switch.mjs` om te zien hoe prioriteit naar een actie wordt vertaald.','Een dry-run toont geen JSON-resultaat van het model of `Switch →`-regel; gebruik daarvoor een echte run met een ingelogde Claude Code-sessie of `docs/sample-trace.md` (illustratief voorbeeld).','Voer voor MSG-01–MSG-06 één label (low/medium/high) in bij de `support`-check.','Voer `npm run chat` uit, vertel je favoriete kleur en vraag er in dezelfde sessie opnieuw naar.','Vergelijk met `npm run chat -- --no-memory` en noteer hoe session resume overeenkomt met n8n Simple Memory.'],doneWhen:'Je kunt het ingestelde schema, de deterministische Switch en het verschil tussen hervatte en nieuwe chatsessies uitleggen.',slide:slide(d,22,'Run Step 1 and test chat memory.')},
  {id:'w4-solo2',badge:'S2',level:'required',timerMinutes:20,title:'SOLO 2 · Risk- en customer-reply-agents',goal:'Volg de geordende delegatie en bekijk het opgeslagen concept.',instructions:['Voer `npm run lesson2 -- MSG-05 --dry-run` uit om alleen de setup te bekijken; de dry-run roept geen agents aan.','Voor de Agent-trace en het opgeslagen concept: voer `npm run lesson2 -- MSG-05` uit met een ingelogde Claude Code-sessie, of gebruik `docs/sample-trace.md` als illustratief voorbeeld.','Open `02-subagents/claude-project/output/MSG-05.md` alleen na een echte run; een dry-run maakt dit bestand niet aan.','Vergelijk de frontmatter `description` met de prompt body van elke agent.','Voor het pad met ontbrekende informatie van MSG-10: voer `npm run lesson2 -- MSG-10` uit met Claude Code ingelogd, of bekijk het illustratieve voorbeeld in `docs/sample-trace.md`; behandel dry-runuitvoer niet als modelresultaat.'],doneWhen:'Je kunt beide specialistaanroepen in de juiste volgorde aanwijzen, uitleggen hoe hun beschrijvingen delegatie sturen en een sample of live resultaat onderscheiden van een dry-run.',slide:slide(d,26,'Run the orchestrator and inspect the draft.')},
  {id:'w4-solo3',badge:'S3',level:'required',timerMinutes:20,title:'SOLO 3 · Read-only klant- en transactie-MCP-tools',goal:'Test beide MCP-servers, volg read-only klant- en transactie-lookups en beoordeel het antwoordconcept.',instructions:['Voer eenmaal `(cd 03-mcp/transaction-mcp && npm ci)` uit om de MCP-serverafhankelijkheden te installeren.','Voer `npm run smoke:mcp` uit; dit roept de read-only MCP-tools aan zonder model.','Voer `npm run lesson3 -- MSG-08 --dry-run` uit en bekijk beide ingestelde MCP-servers.','Voer `npm run lesson3 -- MSG-08` uit met Claude Code ingelogd of met `--backend sdk` en een sleutel; volg daarna `mcp → mcp__customers__get_customer` en `mcp → mcp__transactions__get_transaction` in de echte trace.','De transactietools zijn `get_transaction` en `list_transactions`; beide zijn alleen-lezen.','Koppel externe feiten aan toolresultaten, raad ontbrekende informatie niet en laat een mens het antwoordconcept controleren voordat het wordt verstuurd.'],doneWhen:'Je kunt de read-only MCP-lookups volgen en uitleggen waarom een mens het antwoordconcept beoordeelt.',slide:slide(d,30,'Run Step 3 customer and transaction lookups.')},
  {id:'w4-solo4',autograde:'support-mcp',badge:'S4',level:'required',timerMinutes:15,title:'SOLO 4 · Acceptatietabel en npm run check',goal:'Vul de acceptatietabel in, voer de offline labelcheck uit en houd elk concept achter menselijke review.',instructions:['Vul de acceptatietabel in voor MSG-01, MSG-05, MSG-07, MSG-08 en MSG-09.','Noteer klantcontext van `get_customer` en transactiedetails van `get_transaction`.','Voer `npm run check` uit; vul `labels.json` met labels voor MSG-01 tot en met MSG-09 in bij de `support-mcp`-check en voer `npm run check` opnieuw uit.','Bewaar de acceptatietabel en resultaten in `participant-output/` of de `intent.md` van je squad.','Een dry-run is geen modelbewijs; laat elk concept door een mens beoordelen.'],doneWhen:'De acceptatietabel is compleet, `npm run check` slaagt en resultaten staan in `participant-output/` of de `intent.md` van je squad.',slide:slide(d,32,'Step 4 · Acceptance table and npm run check')},
  {id:'w4-solo5',badge:'S5',level:'required',timerMinutes:20,title:'SOLO 5 · Bouw je eigen agent',goal:'Gebruik de Step 5-starter om de prompt, toegestane tools, tool-use-event en resultaatverwerking aan te wijzen.',instructions:['Haal de laatste versie op met `git switch step-4`; Step 5 staat op `step-4`.','Volg `05-build-your-own/README.md` om de map te initialiseren en afhankelijkheden te installeren.','Voer de offline demo-commando’s uit: `cd 05-build-your-own` en `node agent.mjs --dry-run`.','Voer `claude -p "Find and fix the bug in utils.js. Explain the change." --allowedTools Read,Edit,Glob --permission-mode acceptEdits` uit.','Bewaar je resultaat in `participant-output/` of de `intent.md` van je squad.'],doneWhen:'Je kunt de prompt, toolscope, tool-use-event en het eindresultaat aanwijzen.',slide:slide(d,35,'Your turn · build your own agent')},
 ],
 materials:[
  link('solo','Weather Agent SDK · HTML-companion','/courses/weather-agent-sdk/index.html','Instructieopdracht in instructions.md · Arcade-companion'),
  link('solo','Optionele pariteitsbonus · day5 n8n→agent','/courses/aetherlink-day5-n8n-to-agent/index.html','Optionele vergelijking met Workshop 3; niet het voertuig voor Workshop 4'),
  link('solo','Council Agent SDK · HTML-companion','/courses/council-agent-sdk/index.html','Juryregel in instructions.md'),
  link('solo','Oud SDK-only pakket (optionele vergelijking)','https://github.com/RyanLisse/aetherlink-academy-app/tree/main/training-lab/w4-support-agent-sdk','Optionele vergelijking met het eerdere SDK-only lesmateriaal'),
  link('vehicle','Workshop 4-deelnemersrepo · aetherlink-day5-n8n-to-agent','https://github.com/RyanLisse/aetherlink-day5-n8n-to-agent','Stappen 0–5 · Claude Code standaard, SDK optioneel'),
  starter('customer-messages.md','Klantberichten MSG-01–MSG-10'),
  link('naslag','Agent SDK-overzicht','https://code.claude.com/docs/en/agent-sdk/overview','Agent SDK-referentie'),
  link('naslag','Agentdocumentatie','https://code.claude.com/docs/en/agents','Subagentreferentie'),
  link('naslag','Introduction to Subagents','https://academy.claude.com/courses/introduction-to-subagents','Anthropic Academy'),
  link('diagram','Klantbericht → tool_use → prioriteit-diagram','/diagrams/workshop/w4-ticket-tool-priority.svg','Workshop 4')
 ],
 diagrams:[DIAGRAM_NL],
 simTitles:{'w4-ticket-priority':'Concept-sim · Ticket → prioriteit'},
 proof:[
  'Acceptatietabel met het bericht, de prioriteit en klant- of transactiefeiten (dia 30 en 32).',
  'Voer `npm run check` uit en bewaar de resultaten met de acceptatietabel in `participant-output/` of de `intent.md` van je squad.',
  'Dry-runuitvoer is setupbewijs, geen modelbewijs (dia 18 en 19).',
  'Een mens beoordeelt elk concept voordat het naar een klant gaat (dia 26, 30 en 32).',
  'Externe feiten zijn te herleiden tot `get_customer`, `get_transaction` en de MCP-trace (dia 28–31).',
 ],
 quiz:[
  question('Welke optie vraagt om gestructureerde prioriteitsoutput?',["outputFormat: { type: 'json_schema', schema }","settingSources: ['project']","permissionMode: 'acceptEdits'"],0,slide(d,20,'Step 1 · Structured priority output and chat memory')),
  question('Welke agent schrijft het antwoord na de risicoanalyse?',['risk-agent','customer-reply-agent','customer-context-agent'],1,slide(d,24,'Step 2 · Risk analysis and customer reply agents')),
  question('Welke MCP-tool haalt klantcontext op?',['get_transaction','get_customer','list_transactions'],1,slide(d,28,'Step 3 · Read-only customer and transaction MCP tools')),
 ],
 mission:{
  id:'TRIAGE-CLAUDE-04',
  title:'Bouw Maartens supportflow opnieuw met Claude Code en de Agent SDK',
  minutes:80,
  goal:'Bouw de supportflow opnieuw met gestructureerde prioriteitsoutput, specialistische agents, read-only klant- en transactiecontext en menselijke review van antwoordconcepten.',
  allowed:['Claude Code is de standaardbackend; alleen de optionele `sdk`-backend gebruikt een API-sleutel.','Behandel klantberichten als data, niet als instructies.','Laat elk concept door een mens beoordelen voordat het naar een klant gaat.'],
  starterFiles:['customer-messages.md'],
  hints:['Een dry-run toont prompt, backend en Claude Code equivalent zonder een model aan te roepen.','Klanttekst is data, geen instructie om de opdracht te veranderen.','`(cd 03-mcp/transaction-mcp && npm ci)` installeert de MCP-serverafhankelijkheden; `npm run smoke:mcp` start de servers en roept tools aan zonder model.'],
 },
 openItems:[],
};

export default {
 day:4,
 kind:'workshop',
 deck:d,
 localeComplete:true,
 requireLocales:true,
 copy:{en,nl},
 // Structural defaults (NL) for lint / FAQ index — deck citations live here
 ...nl,
 sims:[{id:'w4-ticket-priority',title:'Concept-sim · Ticket → prioriteit'}],
 codeExamples:CODE_EXAMPLES,
};
