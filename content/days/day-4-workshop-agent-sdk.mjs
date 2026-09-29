import {TRIAGE_ACCEPTANCE} from '../triage/grade.mjs';
import {diagram,link,question,slide,starter} from './model.mjs';

const d='workshop-4';

const DIAGRAM_EN=diagram(
 '/diagrams/workshop/w4-ticket-tool-priority.svg',
 'Ticket → tool_use → priority',
 'Ticket enters messages → tool_use (TOOL_HANDLERS) → tool_result → priority label → human gate'
);
const DIAGRAM_NL=diagram(
 '/diagrams/workshop/w4-ticket-tool-priority.svg',
 'Ticket → tool_use → prioriteit',
 'Ticket komt in messages → tool_use (TOOL_HANDLERS) → tool_result → prioriteitslabel → menselijke gate'
);

const DEMO_SLIDES=[
 slide(d,3,'Watch: clone, install, open the export.'),
 slide(d,6,'Watch: fixture tickets, predict L/M/H.'),
 slide(d,9,'Watch: first agent, ticket to priority.'),
 slide(d,12,'Watch: one specialist split.'),
];

const en = {
 title:'Workshop 4 · Claude Agent SDK',
 tag:'Workshop',
 blurb:'Rebuild the same ticket triage with the Claude Agent SDK — same tickets and labels as the n8n path.',
 kicker:'Workshop 4 · SOLO 0 → 4',
 lessonTitle:'Same triage, Claude Agent SDK',
 motto:'Ticket → tool_use → priority — labels stay fixed',
 leerdoel:'You rebuild Workshop 3 ticket triage with the Claude Agent SDK and hit the same priority labels on the shared fixture as the n8n path. Solo bar is SOLO 2; SOLO 3 is stretch. Eve is not a required path.',
 narrative:[
  'Workshop 4 is s01–s02 territory on a familiar vehicle: a support ticket enters the agent loop as messages, the model emits tool_use, TOOL_HANDLERS dispatch, and a tool_result becomes a priority label — low, medium, or high.',
  'The acceptance set does not move. Claude must match the n8n labels on the shared fixture. A mismatch means fix prompt or tools — never invent a new label. An offline dry-run proves the chain; it is not model proof.',
  'Keep the Apple bar rhythm — Uitleg → Voordoen → Zelf doen — on the Worldline deck. The new diagram and ConceptSim teach ticket→tool_use→priority; SOLO 0–4 and the aetherlink-day5-n8n-to-agent vehicle stay.',
 ],
 workedExample:'Mechanism: ticket→tool_use→priority on aetherlink-day5-n8n-to-agent. Motto: labels stay fixed to the shared fixture. Step the ConceptSim without API keys, walk the HTML Solos under /courses/ (weather L1 · day5 bridge · council L2 stretch), then run SOLO 0–4 on your branch if you clone the vehicle.',
 loop:[
  {label:'SOLO 0',prompt:'Have you cloned the repo and can you point to Ticket Input, AI Agent, Reply, Risk, and Switch?'},
  {label:'SOLO 1',prompt:'Which label do you predict per fixture ticket, and what does the automatic check say?'},
  {label:'SOLO 2',prompt:'Which priority does your first agent return, and who reviews it?'},
  {label:'SOLO 3',prompt:'Which specialist do you split off, and where is the gate?'},
  {label:'SOLO 4',prompt:'Does every Claude label match the expected n8n label?'}
 ],
 demo:{
  slides:DEMO_SLIDES,
  script:[
   'Show the ticket→tool_use→priority diagram: messages loop, TOOL_HANDLERS dispatch, fixed labels, human gate before accept.',
   'Step the ConceptSim (WL-1026 → keyword_priority → high) — no API key required.',
   'SOLO 0 (slide 3): git clone, npm install, open n8n/support-triage.json and name Ticket Input, AI Agent, Reply, and Risk.',
   'SOLO 1 (slide 6): show fixture tickets; the room predicts a label per ticket; the Academy automatic check confirms.',
   'SOLO 2 (slide 9): run npm run triage -- fixtures/ticket.json --dry-run, show priority and the human gate before accept. This is the solo bar.',
   'SOLO 3 (slide 12, stretch): demonstrate one specialist (customer-reply or risk) with joint output and gate.',
  ]
 },
 solo:[
  {id:'w4-solo0',badge:'S0',level:'required',timerMinutes:10,title:'SOLO 0 · Clone and open the export',goal:'Clone aetherlink-day5-n8n-to-agent, run npm install, open n8n/support-triage.json, and work on your own work/<name> branch.',doneWhen:'Install works and you can point to Ticket Input, AI Agent, Customer Reply Agent, Risk Agent, and the Switch.',slide:slide(d,4,'Clone and open the n8n export.')},
  {id:'w4-solo1',autograde:'triage',badge:'S1',level:'required',timerMinutes:10,title:'SOLO 1 · Predict and check the labels',goal:'Predict the label (low, medium, or high) per fixture ticket and check your prediction with the automatic check. Keep your Workshop 3 Proof beside you if you have it.',doneWhen:'Your prediction for every fixture ticket is submitted to the automatic check and every label matches; the check then passes the task.',slide:slide(d,7,'Confirm the fixture on your machine.')},
  {id:'w4-solo2',badge:'S2',level:'required',timerMinutes:20,title:'SOLO 2 · First agent',goal:'Have your agent assign a priority on at least one fixture ticket with systemPrompt and prompt. An offline dry-run is allowed; it is not model proof.',doneWhen:'Agent runs on a fixture, a priority comes out, a human has reviewed, and no secrets were committed. This is the solo bar.',hint:'Optionally edit src/prompts.ts and re-run offline.',slide:slide(d,10,'Run your first agent on a fixture.')},
  {id:'w4-solo3',badge:'S3',level:'stretch',timerMinutes:15,title:'SOLO 3 · Add a specialist',goal:'Split Reply or Risk off as a subagent or skill, just like L3 in n8n.',doneWhen:'Two roles, joint output, and a gate with draft_only and human_approval_required. Optional.',slide:slide(d,13,'Stretch — add a specialist role.')},
  {id:'w4-solo4',autograde:'triage',badge:'S4',level:'required',timerMinutes:15,title:'SOLO 4 · Acceptance table and Proof',goal:'Fill the table ticket → expected n8n label → actual Claude label. Resolve a mismatch in prompt or tools, not with new labels.',doneWhen:'Acceptance table, dry-run or trace, human gate, and achieved level (2, 3, or 4).',slide:slide(d,15,'Fill the acceptance table. Ship Proof.')}
 ],
 materials:[
  link('solo','HTML Solo · weather-agent-sdk (L1)','/courses/weather-agent-sdk/index.html','AET-130 · instruction-quest in instructions.md · Arcade companion'),
  link('solo','HTML Solo · day5 n8n→agent (core W3→W4)','/courses/aetherlink-day5-n8n-to-agent/index.html','AET-130 · SOLO.md + fixtures offline lane'),
  link('solo','HTML Solo · council-agent-sdk (L2 stretch)','/courses/council-agent-sdk/index.html','AET-130 · judge rule in instructions.md'),
  link('vehicle','Rebuild repo aetherlink-day5-n8n-to-agent','https://github.com/RyanLisse/aetherlink-day5-n8n-to-agent','Slide 2; SOLO.md in the repo'),
  starter('triage-fixtures.json','Shared fixture tickets (the server checks your labels)'),
  link('naslag','Agent SDK overview','https://code.claude.com/docs/en/agent-sdk/overview','NASLAG.md Support Day 4 · code.claude.com'),
  link('naslag','Agents docs','https://code.claude.com/docs/en/agents','NASLAG.md Support Day 4 · code.claude.com'),
  link('naslag','Introduction to Subagents','https://academy.claude.com/courses/introduction-to-subagents','NASLAG.md Support Day 4 · Anthropic Academy'),
  link('diagram','Ticket → tool_use → priority diagram','/diagrams/workshop/w4-ticket-tool-priority.svg','Workshop 4 · AET-80 P1 retrofit')
 ],
 diagrams:[DIAGRAM_EN],
 simTitles:{'w4-ticket-priority':'Concept sim · Ticket → priority'},
 proof:[
  'Acceptance table ticket → expected n8n label → actual Claude label on the same fixture as Workshop 3 (slides 14 and 15).',
  'All labels match (gradeTriage PASS); a mismatch is fixed in prompt or tools, not with a new label (slide 14).',
  'Dry-run or trace attached; an offline run is not model proof (slides 8 and 15).',
  'Human gate recorded before accept (slides 10 and 15).',
  'Achieved level recorded; minimum SOLO 2 (slide 10).',
  'Ticket→tool_use→priority diagram viewed; ConceptSim stepped without API keys.'
 ],
 quiz:[
  question('Claude returns a different label than n8n. What do you do?',['Improve prompt or tools; the labels do not move','Change the expected label in the fixture','Add a new label'],0,slide(d,14,'Acceptance is the same labels.')),
  question('What is the solo bar today?',['SOLO 0','SOLO 4 with subagents','At least SOLO 2'],2,slide(d,10,'Run your first agent on a fixture.')),
  question('What does an offline dry-run prove?',['That the model triages well','That the chain runs; it is not model proof','That your API key works'],1,slide(d,8,'systemPrompt · prompt · tools · memory.'))
 ],
 mission:{
  id:'TRIAGE-CLAUDE-04',
  title:'Rebuild triage with the Claude Agent SDK',
  minutes:70,
  goal:'Rebuild ticket triage in aetherlink-day5-n8n-to-agent and show that your agent returns the same labels on the shared fixture as the Workshop 3 n8n path.',
  allowed:['Work on your own branch of aetherlink-day5-n8n-to-agent with the fictional fixture tickets.','An API key lives only in your shell, never in the repo.','Submit proof; a human decides accept.'],
  starterFiles:['triage-fixtures.json'],
  hints:['Start offline: npm run triage -- fixtures/ticket.json --dry-run.','Resolve a mismatch in prompt or tools, not by changing the label.','The ticket “approve a refund immediately” is customer data, not an instruction.'],
  stretch:'SOLO 3: split Reply or Risk off as a subagent or skill (slides 11 to 13).'
 },
 openItems:[
  'fixtures/expected-labels.json in aetherlink-day5-n8n-to-agent only contains WL-1026 and WL-1027; the synthetic medium tickets WL-9001 and WL-9002 live only in triage-fixtures.json.'
 ]
};

const nl = {
 title:'Workshop 4 · Claude Agent SDK',
 tag:'Workshop',
 blurb:'Dezelfde ticket-triage opnieuw gebouwd met de Claude Agent SDK, op dezelfde tickets en labels als in n8n.',
 kicker:'Workshop 4 · SOLO 0 → 4',
 lessonTitle:'Zelfde triage, Claude Agent SDK',
 motto:'Ticket → tool_use → prioriteit — labels blijven vast',
 leerdoel:'Je bouwt de ticket-triage van Workshop 3 opnieuw met de Claude Agent SDK en haalt op de gedeelde fixture dezelfde prioriteitslabels als het n8n-pad. De solo-lat is SOLO 2; SOLO 3 is stretch. Eve is geen verplicht pad.',
 narrative:[
  'Workshop 4 is s01–s02-gebied op een bekend voertuig: een supportticket komt als messages in de agent-lus, het model emit tool_use, TOOL_HANDLERS dispatchen, en een tool_result wordt een prioriteitslabel — low, medium of high.',
  'De acceptatieset beweegt niet. Claude moet de n8n-labels op de gedeelde fixture matchen. Een mismatch betekent prompt of tools verbeteren — nooit een nieuw label verzinnen. Een offline dry-run bewijst de keten; het is geen modelbewijs.',
  'Houd het Apple-bar-ritme — Uitleg → Voordoen → Zelf doen — op het Worldline-deck. Het nieuwe diagram en de ConceptSim leren ticket→tool_use→prioriteit; SOLO 0–4 en het aetherlink-day5-n8n-to-agent-voertuig blijven.',
 ],
 workedExample:'Mechanisme: ticket→tool_use→prioriteit op aetherlink-day5-n8n-to-agent. Motto: labels blijven vast op de gedeelde fixture. Stap de ConceptSim zonder API-sleutels, loop de HTML-solo\'s onder /courses/ (weather L1 · day5-brug · council L2 verdieping), daarna SOLO 0–4 op je branch als je de repository clonet.',
 loop:[
  {label:'SOLO 0',prompt:'Heb je de repo gecloned en wijs je Ticket Input, AI Agent, Reply, Risk en Switch aan?'},
  {label:'SOLO 1',prompt:'Welk label voorspel je per fixture-ticket, en wat zegt de automatische check?'},
  {label:'SOLO 2',prompt:'Welke prioriteit geeft je eerste agent en wie reviewt die?'},
  {label:'SOLO 3',prompt:'Welke specialist splits je af en waar zit de gate?'},
  {label:'SOLO 4',prompt:'Komt elk Claude-label overeen met het verwachte n8n-label?'}
 ],
 demo:{
  slides:DEMO_SLIDES,
  script:[
   'Toon het ticket→tool_use→prioriteit-diagram: messages-lus, TOOL_HANDLERS-dispatch, vaste labels, menselijke gate vóór acceptatie.',
   'Stap de ConceptSim (WL-1026 → keyword_priority → high) — geen API-sleutel nodig.',
   'SOLO 0 (dia 3): git clone, npm install, open n8n/support-triage.json en benoem Ticket Input, AI Agent, Reply en Risk.',
   'SOLO 1 (dia 6): toon de fixture-tickets en laat de zaal per ticket een label voorspellen; de automatische check in de Academy bevestigt of het klopt.',
   'SOLO 2 (dia 9): run npm run triage -- fixtures/ticket.json --dry-run, toon de prioriteit en de menselijke gate vóór acceptatie. Dit is de solo-lat.',
   'SOLO 3 (dia 12, stretch): demonstreer één specialist (customer-reply of risk) met gezamenlijke output en gate.',
  ]
 },
 solo:[
  {id:'w4-solo0',badge:'S0',level:'required',timerMinutes:10,title:'SOLO 0 · Clone en open de export',goal:'Clone aetherlink-day5-n8n-to-agent, draai npm install, open n8n/support-triage.json en werk op je eigen work/<naam>-branch.',doneWhen:'Installatie werkt en je wijst Ticket Input, AI Agent, Customer Reply Agent, Risk Agent en de Switch aan.',slide:slide(d,4,'Clone and open the n8n export.')},
  {id:'w4-solo1',autograde:'triage',badge:'S1',level:'required',timerMinutes:10,title:'SOLO 1 · Voorspel en check de labels',goal:'Voorspel per fixture-ticket het label (low, medium of high) en check je voorspelling met de automatische check. Houd je Proof van Workshop 3 ernaast als je die hebt.',doneWhen:'Je voorspelling voor elk fixture-ticket is ingeleverd bij de automatische check en elk label klopt; de check keurt de opdracht dan goed.',slide:slide(d,7,'Confirm the fixture on your machine.')},
  {id:'w4-solo2',badge:'S2',level:'required',timerMinutes:20,title:'SOLO 2 · Eerste agent',goal:'Laat je agent op minstens één fixture-ticket een prioriteit geven met systemPrompt en prompt. Een offline dry-run mag; die is geen modelbewijs.',doneWhen:'Agent draait op een fixture, prioriteit komt eruit, een mens heeft gereviewd en er zijn geen secrets gecommit. Dit is de solo-lat.',hint:'Pas desgewenst src/prompts.ts aan en run opnieuw offline.',slide:slide(d,10,'Run your first agent on a fixture.')},
  {id:'w4-solo3',badge:'S3',level:'stretch',timerMinutes:15,title:'SOLO 3 · Voeg een specialist toe',goal:'Splits Reply of Risk af als subagent of skill, net als L3 in n8n.',doneWhen:'Twee rollen, gezamenlijke output en een gate met draft_only en human_approval_required. Optioneel.',slide:slide(d,13,'Stretch — add a specialist role.')},
  {id:'w4-solo4',autograde:'triage',badge:'S4',level:'required',timerMinutes:15,title:'SOLO 4 · Acceptatietabel en Proof',goal:'Vul de tabel ticket → verwacht n8n-label → werkelijk Claude-label. Een verschil los je op in prompt of tools, niet met nieuwe labels.',doneWhen:'Acceptatietabel, dry-run of trace, menselijke gate en behaald niveau (2, 3 of 4).',slide:slide(d,15,'Fill the acceptance table. Ship Proof.')}
 ],
 materials:[
  link('solo','HTML-solo · weather-agent-sdk (L1)','/courses/weather-agent-sdk/index.html','AET-130 · instructie-opdracht in instructions.md · Arcade-companion'),
  link('solo','HTML-solo · day5 n8n→agent (kern · W3→W4)','/courses/aetherlink-day5-n8n-to-agent/index.html','AET-130 · SOLO.md + fixtures · offline-pad'),
  link('solo','HTML-solo · council-agent-sdk (L2 verdieping)','/courses/council-agent-sdk/index.html','AET-130 · juryregel in instructions.md'),
  link('vehicle','Rebuild-repository aetherlink-day5-n8n-to-agent','https://github.com/RyanLisse/aetherlink-day5-n8n-to-agent','Dia 2; SOLO.md in de repo'),
  starter('triage-fixtures.json','Gedeelde fixture-tickets (de server controleert je labels)'),
  link('naslag','Agent SDK overview','https://code.claude.com/docs/en/agent-sdk/overview','NASLAG.md Support Day 4 · code.claude.com'),
  link('naslag','Agents-docs','https://code.claude.com/docs/en/agents','NASLAG.md Support Day 4 · code.claude.com'),
  link('naslag','Introduction to Subagents','https://academy.claude.com/courses/introduction-to-subagents','NASLAG.md Support Day 4 · Anthropic Academy'),
  link('diagram','Ticket → tool_use → prioriteit-diagram','/diagrams/workshop/w4-ticket-tool-priority.svg','Workshop 4 · AET-80 P1-retrofit')
 ],
 diagrams:[DIAGRAM_NL],
 simTitles:{'w4-ticket-priority':'Concept-sim · Ticket → prioriteit'},
 proof:[
  'Acceptatietabel ticket → verwacht n8n-label → werkelijk Claude-label op dezelfde fixture als Workshop 3 (dia 14 en 15).',
  'Alle labels gelijk (gradeTriage PASS); een verschil wordt in prompt of tools opgelost, niet met een nieuw label (dia 14).',
  'Dry-run of trace bijgevoegd; een offline run is geen modelbewijs (dia 8 en 15).',
  'Menselijke gate vastgelegd vóór acceptatie (dia 10 en 15).',
  'Behaald niveau vastgelegd; minimaal SOLO 2 (dia 10).',
  'Ticket→tool_use→prioriteit-diagram bekeken; ConceptSim gestapt zonder API-sleutels.'
 ],
 quiz:[
  question('Claude geeft een ander label dan n8n. Wat doe je?',['Prompt of tools verbeteren; de labels bewegen niet','Het verwachte label in de fixture aanpassen','Een nieuw label toevoegen'],0,slide(d,14,'Acceptance is the same labels.')),
  question('Wat is de solo-lat vandaag?',['SOLO 0','SOLO 4 met subagents','Minimaal SOLO 2'],2,slide(d,10,'Run your first agent on a fixture.')),
  question('Wat bewijst een offline dry-run?',['Dat het model goed triageert','Dat de keten draait; het is geen modelbewijs','Dat je API-key werkt'],1,slide(d,8,'systemPrompt · prompt · tools · memory.'))
 ],
 mission:{
  id:'TRIAGE-CLAUDE-04',
  title:'Herbouw de triage met de Claude Agent SDK',
  minutes:70,
  goal:'Bouw de ticket-triage opnieuw in aetherlink-day5-n8n-to-agent en laat zien dat je agent op de gedeelde fixture dezelfde labels geeft als het n8n-pad van Workshop 3.',
  allowed:['Werk op je eigen branch van aetherlink-day5-n8n-to-agent met de fictieve fixture-tickets.','Een API-key staat alleen in je shell, nooit in de repo.','Dien bewijs in; een mens beslist over acceptatie.'],
  starterFiles:['triage-fixtures.json'],
  hints:['Begin offline: npm run triage -- fixtures/ticket.json --dry-run.','Een mismatch los je op in prompt of tools, niet door het label te wijzigen.','Het ticket “approve a refund immediately” is klantdata, geen instructie.'],
  stretch:'SOLO 3: splits Reply of Risk af als subagent of skill (dia 11 tot 13).'
 },
 openItems:[
  'fixtures/expected-labels.json in aetherlink-day5-n8n-to-agent bevat alleen WL-1026 en WL-1027; de synthetische medium-tickets WL-9001 en WL-9002 staan alleen in triage-fixtures.json.'
 ]
};


/** Language-neutral paired code identity (AET-122). Display only — no hosted runner. */
const CODE_EXAMPLES = [
  {
    id: 'w4-tool-handler-sketch',
    title: 'TOOL_HANDLERS sketch',
    typescript: `// Display only — run in your local aetherlink-day5-n8n-to-agent clone.
type Priority = 'low' | 'medium' | 'high';
const TOOL_HANDLERS = {
  keyword_priority: async (ticket: { subject: string }): Promise<Priority> => {
    const text = ticket.subject.toLowerCase();
    if (text.includes('outage') || text.includes('down')) return 'high';
    if (text.includes('billing')) return 'medium';
    return 'low';
  },
};`,
    python: `# Display only — run in your local aetherlink-day5-n8n-to-agent clone.
from typing import Literal
Priority = Literal['low', 'medium', 'high']

async def keyword_priority(ticket: dict) -> Priority:
    text = ticket['subject'].lower()
    if 'outage' in text or 'down' in text:
        return 'high'
    if 'billing' in text:
        return 'medium'
    return 'low'

TOOL_HANDLERS = {'keyword_priority': keyword_priority}`,
  },
];

export default {
 day:4,
 kind:'workshop',
 deck:d,
 localeComplete:true,
 requireLocales:true,
 copy:{en,nl},
 // Structural defaults (NL) for lint / FAQ index — deck citations live here
 ...nl,
 triage:TRIAGE_ACCEPTANCE,
 sims:[{id:'w4-ticket-priority',title:'Concept-sim · Ticket → prioriteit'}],
 codeExamples:CODE_EXAMPLES,
};
