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

const DEMO_SLIDES=[
 slide(d,2,'Map n8n to the Agent SDK.'),
 slide(d,5,'Watch one agent classify a message.'),
 slide(d,9,'Watch the orchestrator save a draft.'),
 slide(d,12,'Watch an MCP transaction lookup.'),
];

const en = {
 title:'Workshop 4 · Support agents with the Claude Agent SDK',
 tag:'Workshop',
 blurb:'Build a support workflow with one agent, specialist subagents, and a transaction lookup through MCP.',
 kicker:'Workshop 4 · SOLO 0 → 4',
 lessonTitle:'Support agents with the Claude Agent SDK',
 motto:'CLAUDE.md → subagents → MCP — one query() at a time',
 leerdoel:'Build and inspect three support-agent lessons with the Claude Agent SDK. Keep Workshop 3’s LOW, MEDIUM, and HIGH labels, specialist split, and human review gate. Use new customer messages and transaction data through MCP.',
 narrative:[
  'Workshop 3 uses n8n. Workshop 4 carries its LOW, MEDIUM, and HIGH labels, specialist split, and human review gate into a new support workflow. The customer messages and transaction workbook are different.',
  'Work through one agent with CLAUDE.md, an orchestrator with two subagents, and a transaction lookup through MCP. Customer text is data, not instructions. Review each draft before it reaches a customer.',
  'Use the same rhythm in every lesson: explain, demonstrate, let participants try, then discuss. The diagram and ConceptSim show a tool call becoming a priority. The day-5 n8n-to-agent HTML lesson is an optional parity bonus, not the Workshop 4 vehicle.',
 ],
 workedExample:'Trace one support message through the Agent SDK: project instructions load from CLAUDE.md, specialists split analysis from reply writing, and the transaction lesson sends external data through get_transaction. Step the ConceptSim without an API key, then complete SOLO 0–4 in the Agent SDK package.',
 loop:[
  {label:'SOLO 0',prompt:'Can you install the package and inspect its resolved options without making a model call?'},
  {label:'SOLO 1',prompt:'What does the main agent know from CLAUDE.md and the customer message?'},
  {label:'SOLO 2',prompt:'What does ticket-analyst decide, and what does email-responder write?'},
  {label:'SOLO 3',prompt:'When does the analyst need get_transaction, and what facts came from it?'},
  {label:'SOLO 4',prompt:'Can a human review the drafts and the source of each external fact?'}
 ],
 demo:{
  slides:DEMO_SLIDES,
  script:[
   'Open Map n8n to the Agent SDK. Point to query(), CLAUDE.md, agents, MCP get_transaction, and the human review gate.',
   'Open Watch one agent classify a message. Show how settingSources loads the project instructions and how impact matters more than tone.',
   'Open Watch the orchestrator save a draft. Follow the Agent trace and inspect the file in 02-subagents/claude-project/output/.',
   'Open Watch an MCP transaction lookup. Show the stdio trace, the external-data line, and the workbook outside claude-project.',
   'Return to the four questions on the mapping slide after participants try each lesson.'
  ]
 },
 solo:[
  {id:'w4-solo0',badge:'S0',level:'required',timerMinutes:10,title:'SOLO 0 · Get the package',goal:'Clone the sparse workshop package, install its dependencies, and print a dry-run prompt and options without making a model call.',instructions:['Check `node --version`; use Node.js 20 or newer.','Run `git clone --depth 1 --filter=blob:none --sparse https://github.com/RyanLisse/aetherlink-academy-app.git w4-support`.','Run `cd w4-support && git sparse-checkout set training-lab/w4-support-agent-sdk`.','Run `cd training-lab/w4-support-agent-sdk && npm install`.','Run `npm run lesson1 -- MSG-01 --dry-run` and inspect the prompt and options.','Set `ANTHROPIC_API_KEY` in your shell only before a real run; a dry run is not model evidence.'],doneWhen:'The package installs and the dry run prints the resolved prompt and options without a model call.',slide:slide(d,3,'Get the workshop package.')},
  {id:'w4-solo1',autograde:'support',badge:'S1',level:'required',timerMinutes:15,title:'SOLO 1 · Lesson 1: one agent and CLAUDE.md',goal:'Run Lesson 1 on the first six messages, test how the project definitions affect tone, and enter your labels in the support check.',instructions:['With `ANTHROPIC_API_KEY` set in your shell, run `npm run lesson1 -- MSG-01` through `npm run lesson1 -- MSG-06`.',"Read `01-single-agent/claude-project/CLAUDE.md` and note how `settingSources: ['project']` loads the project instructions.",'Temporarily remove `## Priority definitions`, then rerun the loud-tone and tone-trap messages, `MSG-01` and `MSG-06`.','Restore the original file with `git restore 01-single-agent/claude-project/CLAUDE.md`.','Enter one label per message in the `support` check.'],doneWhen:'You ran all six messages, compared the tone-trap runs, restored CLAUDE.md, and submitted labels for the support check.',slide:slide(d,6,'Run Lesson 1 and test the tone trap.')},
  {id:'w4-solo2',badge:'S2',level:'required',timerMinutes:20,title:'SOLO 2 · Orchestrator and subagents',goal:'Trace how the orchestrator delegates analysis and reply writing, saves the draft, and reports missing information.',instructions:['Run `npm run lesson2 -- MSG-05` and watch for `Agent → ticket-analyst`, then `Agent → email-responder`.','Open `02-subagents/claude-project/output/MSG-05.md` and inspect the combined result.','Confirm that the orchestrator delegated both specialist jobs instead of classifying or writing the reply itself.','Run `npm run lesson2 -- MSG-10` and inspect the request for missing information.','Keep each saved draft behind the human review gate.'],doneWhen:'You can identify both specialist calls, open the saved draft, and explain how the orchestrator handles missing information.',slide:slide(d,10,'Run the orchestrator and inspect the draft.')},
  {id:'w4-solo3',badge:'S3',level:'required',timerMinutes:20,title:'SOLO 3 · MCP and transaction data',goal:'Install the transaction server dependencies and inspect how the analyst receives transaction facts through the MCP tool.',instructions:['Run `cd 03-mcp/transaction-mcp && npm install`; this installs dependencies but does not start the server.','Run `npm run lesson3 -- MSG-08`, then run it with `MSG-07` and `MSG-09`.','Follow the `mcp → mcp__transactions__get_transaction` trace for each transaction lookup.','Find the `External data:` line in each result and note which facts came from the tool.','Confirm that `transactions.xlsx` and `server.js` are outside `03-mcp/claude-project`; the SDK starts the server over stdio when needed.'],doneWhen:'You can trace each lookup through MCP and explain why the workbook stays outside claude-project.',slide:slide(d,13,'Run Lesson 3 with transaction messages.')},
  {id:'w4-solo4',autograde:'support-mcp',badge:'S4',level:'required',timerMinutes:15,title:'SOLO 4 · Acceptance table and Proof',goal:'Record the message, your agent label, and facts from external data, then submit labels and leave drafts for human review.',instructions:['Build an acceptance table with columns for message, agent label, and facts from external data.','Enter labels for MSG-01 through MSG-09 in the `support-mcp` check.','Review the drafts in `02-subagents/claude-project/output/` and `03-mcp/claude-project/output/` before any customer-facing use.','Attach your table and a run trace to your Proof. Mark dry-run output as setup evidence, not model evidence.','Name the human review gate and record the Workshop 4 lessons you completed.'],doneWhen:'Your acceptance table, label check, run trace, and human review gate are recorded in Proof.',slide:slide(d,15,'Complete the acceptance table and Proof.')},
 ],
 materials:[
  link('solo','Weather Agent SDK · HTML companion','/courses/weather-agent-sdk/index.html','Instruction quest in instructions.md · Arcade companion'),
  link('solo','Optional parity bonus · day5 n8n→agent','/courses/aetherlink-day5-n8n-to-agent/index.html','Optional comparison with Workshop 3; not the Workshop 4 vehicle'),
  link('solo','Council Agent SDK · HTML companion','/courses/council-agent-sdk/index.html','Judge rule in instructions.md'),
  link('vehicle','Workshop 4 Agent SDK package','https://github.com/RyanLisse/aetherlink-academy-app/tree/main/training-lab/w4-support-agent-sdk','Three lessons · query(), subagents, and MCP'),
  starter('customer-messages.md','Customer messages for the three lessons'),
  link('naslag','Agent SDK overview','https://code.claude.com/docs/en/agent-sdk/overview','Agent SDK reference'),
  link('naslag','Agents documentation','https://code.claude.com/docs/en/agents','Subagent reference'),
  link('naslag','Introduction to Subagents','https://academy.claude.com/courses/introduction-to-subagents','Anthropic Academy'),
  link('diagram','Customer message → tool_use → priority diagram','/diagrams/workshop/w4-ticket-tool-priority.svg','Workshop 4')
 ],
 diagrams:[DIAGRAM_EN],
 simTitles:{'w4-ticket-priority':'Concept sim · Ticket → priority'},
 proof:[
  'Acceptance table with the message, agent label, and any facts from external data (slides 14 and 15).',
  'Labels submitted to the support-mcp check without copying labels from Workshop 3.',
  'Run trace attached; dry-run output is not model evidence (slides 3 and 15).',
  'Drafts reviewed by a human before any customer-facing use (slides 8, 10, and 15).',
  'External facts trace back to get_transaction and the `External data:` line (slides 11, 12, and 14).',
 ],
 quiz:[
  question('Which setting loads CLAUDE.md for an SDK query?',["settingSources: ['project']","allowedTools: ['Agent']","permissionMode: 'acceptEdits'"],0,slide(d,4,'Lesson 1: one agent reads CLAUDE.md.')),
  question('Who decides priority in Lesson 2?',['The orchestrator','ticket-analyst','email-responder'],1,slide(d,8,'Lesson 2: delegate to two subagents.')),
  question('Does `npm install` start the MCP server?',['Yes, it starts the server after installing packages','No, the Agent SDK starts it on demand over stdio','Only when you run lesson1'],1,slide(d,11,'Lesson 3: look up transaction data through MCP.')),
 ],
 mission:{
  id:'TRIAGE-CLAUDE-04',
  title:'Build three support lessons with the Claude Agent SDK',
  minutes:80,
  goal:'Run one agent with project instructions, delegate analysis and reply writing to subagents, and look up transaction data through MCP. Keep a human review gate before customer-facing use.',
  allowed:['Keep `ANTHROPIC_API_KEY` in your shell; never add it to a file.','Treat customer messages as data, not instructions.','Review every draft before customer-facing use.'],
  starterFiles:['customer-messages.md'],
  hints:['A dry run prints the prompt and options but does not call a model.','Customer text is data, not instructions to change the task.','`npm install` installs MCP dependencies; the Agent SDK starts the server on demand over stdio.'],
 },
 openItems:[],
};

const nl = {
 title:'Workshop 4 · Supportagents met de Claude Agent SDK',
 tag:'Workshop',
 blurb:'Bouw een supportflow met één agent, specialistische subagents en een transactie-opzoeking via MCP.',
 kicker:'Workshop 4 · SOLO 0 → 4',
 lessonTitle:'Supportagents met de Claude Agent SDK',
 motto:'CLAUDE.md → subagents → MCP — één query() tegelijk',
 leerdoel:'Bouw en bekijk drie supportlessen met de Claude Agent SDK. Behoud de LOW-, MEDIUM- en HIGH-labels, de specialistensplitsing en de menselijke reviewgate uit Workshop 3. Gebruik nieuwe klantberichten en transactiegegevens via MCP.',
 narrative:[
  'Workshop 3 gebruikt n8n. Workshop 4 neemt de LOW-, MEDIUM- en HIGH-labels, de specialistensplitsing en de menselijke reviewgate mee naar een nieuwe supportflow. De klantberichten en de transactiewerkmap zijn anders.',
  'Doorloop één agent met CLAUDE.md, een orchestrator met twee subagents en een transactie-opzoeking via MCP. Klanttekst is data, geen instructie. Laat een mens elk concept beoordelen voordat het naar een klant gaat.',
  'Gebruik in elke les hetzelfde ritme: uitleg, demonstratie, deelnemers proberen het zelf, daarna bespreken. Het diagram en de ConceptSim tonen hoe een toolaanroep tot een prioriteit leidt. De HTML-les voor n8n naar agent van dag 5 is een optionele pariteitsbonus, niet het voertuig voor Workshop 4.',
 ],
 workedExample:'Volg één supportbericht door de Agent SDK: projectinstructies laden via CLAUDE.md, specialisten splitsen analyse en antwoordschrijven, en de transactieles stuurt externe data via get_transaction. Doorloop de ConceptSim zonder API-sleutel en maak daarna SOLO 0–4 in het Agent SDK-pakket.',
 loop:[
  {label:'SOLO 0',prompt:'Kun je het pakket installeren en de opgeloste opties bekijken zonder een modelaanroep?'},
  {label:'SOLO 1',prompt:'Wat weet de hoofdagent uit CLAUDE.md en het klantbericht?'},
  {label:'SOLO 2',prompt:'Wat beslist ticket-analyst en wat schrijft email-responder?'},
  {label:'SOLO 3',prompt:'Wanneer heeft de analist get_transaction nodig en welke feiten komen daaruit?'},
  {label:'SOLO 4',prompt:'Kan een mens de concepten en de bron van elke externe bewering controleren?'}
 ],
 demo:{
  slides:DEMO_SLIDES,
  script:[
   'Open Map n8n to the Agent SDK. Wijs query(), CLAUDE.md, agents, MCP get_transaction en de menselijke reviewgate aan.',
   'Open Watch one agent classify a message. Toon hoe settingSources de projectinstructies laadt en waarom impact belangrijker is dan toon.',
   'Open Watch the orchestrator save a draft. Volg de Agent-trace en bekijk het bestand in 02-subagents/claude-project/output/.',
   'Open Watch an MCP transaction lookup. Toon de stdio-trace, de regel voor externe data en de werkmap buiten claude-project.',
   'Stel na elke les opnieuw de vier vragen van de overzichtsdia.'
  ]
 },
 solo:[
  {id:'w4-solo0',badge:'S0',level:'required',timerMinutes:10,title:'SOLO 0 · Haal het pakket op',goal:'Clone het sparse workshop-pakket, installeer de afhankelijkheden en toon een dry-runprompt met opties zonder een modelaanroep.',instructions:['Controleer `node --version`; gebruik Node.js 20 of hoger.','Voer `git clone --depth 1 --filter=blob:none --sparse https://github.com/RyanLisse/aetherlink-academy-app.git w4-support` uit.','Voer `cd w4-support && git sparse-checkout set training-lab/w4-support-agent-sdk` uit.','Voer `cd training-lab/w4-support-agent-sdk && npm install` uit.','Voer `npm run lesson1 -- MSG-01 --dry-run` uit en bekijk de prompt en opties.','Zet `ANTHROPIC_API_KEY` alleen in je shell voor een echte run; een dry-run is geen modelbewijs.'],doneWhen:'Het pakket installeert en de dry-run toont de opgeloste prompt en opties zonder een modelaanroep.',slide:slide(d,3,'Get the workshop package.')},
  {id:'w4-solo1',autograde:'support',badge:'S1',level:'required',timerMinutes:15,title:'SOLO 1 · Les 1: één agent en CLAUDE.md',goal:'Voer les 1 uit op de eerste zes berichten, test hoe de projectdefinities toon beïnvloeden en voer je labels in bij de supportcheck.',instructions:['Zet `ANTHROPIC_API_KEY` in je shell en voer `npm run lesson1 -- MSG-01` tot en met `npm run lesson1 -- MSG-06` uit.',"Lees `01-single-agent/claude-project/CLAUDE.md` en bekijk hoe `settingSources: ['project']` de projectinstructies laadt.",'Verwijder tijdelijk `## Priority definitions` en voer daarna de luidruchtige berichten `MSG-01` en `MSG-06` opnieuw uit.','Herstel het oorspronkelijke bestand met `git restore 01-single-agent/claude-project/CLAUDE.md`.','Voer één label per bericht in bij de `support`-check.'],doneWhen:'Je hebt alle zes berichten uitgevoerd, de toontrapruns vergeleken, CLAUDE.md hersteld en de labels voor de supportcheck ingediend.',slide:slide(d,6,'Run Lesson 1 and test the tone trap.')},
  {id:'w4-solo2',badge:'S2',level:'required',timerMinutes:20,title:'SOLO 2 · Orchestrator en subagents',goal:'Volg hoe de orchestrator analyse en antwoordschrijven delegeert, het concept opslaat en ontbrekende informatie meldt.',instructions:['Voer `npm run lesson2 -- MSG-05` uit en let op `Agent → ticket-analyst`, daarna `Agent → email-responder`.','Open `02-subagents/claude-project/output/MSG-05.md` en bekijk het gecombineerde resultaat.','Controleer dat de orchestrator beide specialisttaken delegeerde in plaats van zelf de prioriteit te bepalen of het antwoord te schrijven.','Voer `npm run lesson2 -- MSG-10` uit en bekijk welke ontbrekende informatie wordt opgevraagd.','Houd elk opgeslagen concept achter de menselijke reviewgate.'],doneWhen:'Je kunt beide specialistaanroepen aanwijzen, het opgeslagen concept openen en uitleggen hoe de orchestrator ontbrekende informatie behandelt.',slide:slide(d,10,'Run the orchestrator and inspect the draft.')},
  {id:'w4-solo3',badge:'S3',level:'required',timerMinutes:20,title:'SOLO 3 · MCP en transactiegegevens',goal:'Installeer de afhankelijkheden van de transactieserver en bekijk hoe de analist transactiefeiten via de MCP-tool ontvangt.',instructions:['Voer `cd 03-mcp/transaction-mcp && npm install` uit; dit installeert afhankelijkheden maar start de server niet.','Voer `npm run lesson3 -- MSG-08` uit en daarna met `MSG-07` en `MSG-09`.','Volg voor elke transactie-opzoeking de trace `mcp → mcp__transactions__get_transaction`.','Zoek in elk resultaat de regel `External data:` en noteer welke feiten uit de tool komen.','Controleer dat `transactions.xlsx` en `server.js` buiten `03-mcp/claude-project` staan; de SDK start de server via stdio wanneer die nodig is.'],doneWhen:'Je kunt elke opzoeking via MCP volgen en uitleggen waarom de werkmap buiten claude-project blijft.',slide:slide(d,13,'Run Lesson 3 with transaction messages.')},
  {id:'w4-solo4',autograde:'support-mcp',badge:'S4',level:'required',timerMinutes:15,title:'SOLO 4 · Acceptatietabel en Proof',goal:'Leg het bericht, je agentlabel en feiten uit externe data vast, dien labels in en laat concepten klaarstaan voor menselijke review.',instructions:['Maak een acceptatietabel met kolommen voor bericht, agentlabel en feiten uit externe data.','Voer labels voor MSG-01 tot en met MSG-09 in bij de `support-mcp`-check.','Beoordeel de concepten in `02-subagents/claude-project/output/` en `03-mcp/claude-project/output/` voordat ze naar een klant gaan.','Voeg de tabel en een runtrace toe aan je Proof. Markeer dry-runuitvoer als setupbewijs, niet als modelbewijs.','Noem de menselijke reviewgate en noteer welke Workshop 4-lessen je hebt afgerond.'],doneWhen:'Je acceptatietabel, labelcheck, runtrace en menselijke reviewgate staan in je Proof.',slide:slide(d,15,'Complete the acceptance table and Proof.')},
 ],
 materials:[
  link('solo','Weather Agent SDK · HTML-companion','/courses/weather-agent-sdk/index.html','Instructieopdracht in instructions.md · Arcade-companion'),
  link('solo','Optionele pariteitsbonus · day5 n8n→agent','/courses/aetherlink-day5-n8n-to-agent/index.html','Optionele vergelijking met Workshop 3; niet het voertuig voor Workshop 4'),
  link('solo','Council Agent SDK · HTML-companion','/courses/council-agent-sdk/index.html','Juryregel in instructions.md'),
  link('vehicle','Workshop 4 Agent SDK-pakket','https://github.com/RyanLisse/aetherlink-academy-app/tree/main/training-lab/w4-support-agent-sdk','Drie lessen · query(), subagents en MCP'),
  starter('customer-messages.md','Klantberichten voor de drie lessen'),
  link('naslag','Agent SDK-overzicht','https://code.claude.com/docs/en/agent-sdk/overview','Agent SDK-referentie'),
  link('naslag','Agentdocumentatie','https://code.claude.com/docs/en/agents','Subagentreferentie'),
  link('naslag','Introduction to Subagents','https://academy.claude.com/courses/introduction-to-subagents','Anthropic Academy'),
  link('diagram','Klantbericht → tool_use → prioriteit-diagram','/diagrams/workshop/w4-ticket-tool-priority.svg','Workshop 4')
 ],
 diagrams:[DIAGRAM_NL],
 simTitles:{'w4-ticket-priority':'Concept-sim · Ticket → prioriteit'},
 proof:[
  'Acceptatietabel met het bericht, het agentlabel en eventuele feiten uit externe data (dia 14 en 15).',
  'Labels ingediend bij de support-mcp-check zonder labels uit Workshop 3 over te nemen.',
  'Runtrace toegevoegd; dry-runuitvoer is geen modelbewijs (dia 3 en 15).',
  'Concepten door een mens beoordeeld voordat ze naar een klant gaan (dia 8, 10 en 15).',
  'Externe feiten herleidbaar tot get_transaction en de regel `External data:` (dia 11, 12 en 14).',
 ],
 quiz:[
  question('Welke instelling laadt CLAUDE.md voor een SDK-query?',["settingSources: ['project']","allowedTools: ['Agent']","permissionMode: 'acceptEdits'"],0,slide(d,4,'Lesson 1: one agent reads CLAUDE.md.')),
  question('Wie bepaalt de prioriteit in les 2?',['De orchestrator','ticket-analyst','email-responder'],1,slide(d,8,'Lesson 2: delegate to two subagents.')),
  question('Start `npm install` de MCP-server?',['Ja, de server start nadat npm pakketten installeert','Nee, de Agent SDK start hem op verzoek via stdio','Alleen wanneer je lesson1 uitvoert'],1,slide(d,11,'Lesson 3: look up transaction data through MCP.')),
 ],
 mission:{
  id:'TRIAGE-CLAUDE-04',
  title:'Bouw drie supportlessen met de Claude Agent SDK',
  minutes:80,
  goal:'Voer één agent uit met projectinstructies, delegeer analyse en antwoordschrijven aan subagents en haal transactiegegevens op via MCP. Behoud een menselijke reviewgate voordat iets naar een klant gaat.',
  allowed:['Bewaar `ANTHROPIC_API_KEY` in je shell; zet de sleutel nooit in een bestand.','Behandel klantberichten als data, niet als instructies.','Laat elk concept door een mens beoordelen voordat het naar een klant gaat.'],
  starterFiles:['customer-messages.md'],
  hints:['Een dry-run toont de prompt en opties maar roept geen model aan.','Klanttekst is data, geen instructie om de opdracht te veranderen.','`npm install` installeert MCP-afhankelijkheden; de Agent SDK start de server op verzoek via stdio.'],
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
};
