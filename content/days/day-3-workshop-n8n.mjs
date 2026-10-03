import {TRIAGE_ACCEPTANCE} from '../triage/grade.mjs';
import {diagram,openMaterial,question,slide,starter,link} from './model.mjs';

const d='workshop-3';

const DIAGRAM_EN=diagram(
 '/diagrams/workshop/w3-agency-ladder.svg',
 'Agency ladder · L1 → L2 → L3',
 'Ticket → L1 Switch (no LLM) → L2 AI Agent + memory → L3 Customer Reply + Risk behind one human gate'
);
const DIAGRAM_NL=diagram(
 '/diagrams/workshop/w3-agency-ladder.svg',
 'Agency-ladder · L1 → L2 → L3',
 'Ticket → L1 Switch (geen LLM) → L2 AI Agent + memory → L3 Customer Reply + Risk achter één menselijke gate'
);

const DEMO_SLIDES=[
 slide(d,6,'Watch: L1 Switch routes the ticket.'),
 slide(d,9,'Watch: L2 Agent drafts priority.'),
 slide(d,12,'Watch: L3 specialists, one gate.'),
];

const en = {
 title:'Workshop 3 · Agents in n8n',
 tag:'Workshop',
 blurb:'One support ticket, three agency levels: L1 Switch → L2 AI Agent with memory → L3 Customer Reply + Risk.',
 kicker:'Workshop 3 · L1 → L3',
 lessonTitle:'One ticket, three agency levels',
 motto:'Same tickets · more agency · fixed L/M/H labels',
 leerdoel:'You route a fictional support ticket to Low, Medium, or High on three levels: L1 with rules and no LLM, L2 with one AI Agent plus memory and human review, L3 with Customer Reply and Risk specialists behind one gate. Solo bar is at least L2; L3 is stretch.',
 narrative:[
  'Workshop 3 teaches the agency ladder on a stable n8n vehicle: one fixture ticket climbs L1 (Switch, no LLM), L2 (one AI Agent with memory), and stretch L3 (Customer Reply + Risk behind one human gate).',
  'Labels stay fixed — low, medium, high on the shared fixture. More agency does not invent new exits. A human decides before anything customer-facing; never silent auto-send.',
  'Every block follows the same rhythm: explanation, demonstration, then you do it yourself. The ladder diagram and ConceptSim walk through L1→L2→L3; you build with the n8n starters.',
 ],
 workedExample:'Mechanism: agency ladder L1→L2→L3 on n8n triage starters. Motto: same tickets, more agency, fixed labels. Step the ConceptSim without API keys, then run L1→L2 (L3 stretch) on your machine.',
 loop:[
  {label:'L1 rules',prompt:'Which Switch rule puts this ticket on Low, Medium, or High — without an LLM?'},
  {label:'L2 judgment',prompt:'Which priority does the AI Agent propose, and who reviews it?'},
  {label:'L3 specialists',prompt:'What do Customer Reply and Risk do, and where is the one gate?'},
  {label:'Proof',prompt:'Which export, screenshot, and rule explanation do you leave behind?'},
  {label:'Gate',prompt:'Who decides before anything becomes customer-facing?'}
 ],
 demo:{
  slides:DEMO_SLIDES,
  script:[
   'L1 (slide 6): import n8n-triage-l1-switch.json, open the Switch, show the branches, run fixture tickets and compare each label.',
   'L2 (slide 9): show the AI Agent with memory, the proposed priority, and the pause for human review. This is the solo bar.',
   'L3 (slide 12, stretch): name the two roles Customer Reply and Risk and the one human gate.',
   'Show the agency-ladder diagram: L1 Switch (no LLM) → L2 Agent + memory → L3 Reply + Risk, one human gate; labels stay fixed.',
   'Step the ConceptSim (WL-1026 climbs L1→L2→L3 as high) — no API key required.',
  ]
 },
 solo:[
  {id:'w3-l1',autograde:'triage',badge:'L1',level:'required',timerMinutes:15,title:'L1 · Switch without LLM',goal:'Build or inspect L1 on your own machine: ticket → Switch → Low/Medium/High. No LLM. Name input, branches, and error path.',instructions:['Run n8n on your own machine: in `training-lab/w3-n8n-triage` run `npm run n8n` (Node.js 24), open http://localhost:5678 and create the local owner account. A workshop instance from your facilitator is optional.','Import n8n-triage-l1-switch.json from the package (or download it from Materials): create a new workflow and choose Import from file in the workflow menu.','Open the Priority Switch node and read its rules: which words send a ticket to High, which to Medium, and what falls through to Low.','Click Execute workflow. The Fixture Tickets node sends the four fixture tickets through the Switch.','Open High, Medium and Low Priority Action and note which ticket id landed in each branch.','Enter one label per ticket in the automatic check below, or in `labels.json` and run `npm run check`. A mismatch means: reread the Switch rule, do not change the label.'],doneWhen:'The flow runs and your labels match the fixture; the automatic check then passes the task. Note the steps and have a human confirm the branch: that belongs to the exercise, but is not required for the pass. Gate before L2.',hint:'Import n8n-triage-l1-switch.json; no credential needed.',slide:slide(d,7,'Build or inspect L1 on your machine.')},
  {id:'w3-l2',autograde:'triage',badge:'L2',level:'required',timerMinutes:20,title:'L2 · One AI Agent with memory',goal:'Same chain plus one bounded AI Agent with memory. The agent proposes a priority; a human reviews. Record trace and settings.',instructions:['Import n8n-triage-l2-agent-memory.json as a new workflow (Import from file).','In n8n go to Credentials and create your own OpenAI credential. Never paste a key into the workflow, a Code node, or chat.','Open the OpenAI Chat Model node and replace the placeholder credential (REPLACE_ME) with yours.','Open the AI Agent node: read the system message and prompt, and check that Simple Memory is connected.','Click Execute workflow. Open Parse Decision and the three Priority Action nodes and note each proposed priority.','Review each priority yourself as the human gate: nothing is sent to a customer. Screenshot the execution as your trace.','Enter the labels in the automatic check below. A mismatch is fixed in the prompt, not by changing the label.'],doneWhen:'An AI run recorded, no silent auto-send, Proof fields started, and your labels match the fixture; the automatic check then passes the task. Human review of the priority belongs to the exercise, but is not required for the pass. This is the solo bar.',hint:'Import n8n-triage-l2-agent-memory.json and pick your own credential on the chat model.',slide:slide(d,10,'Reach L2 on your own machine.')},
  {id:'w3-l3',autograde:'triage',badge:'L3',level:'stretch',timerMinutes:15,title:'L3 · Reply and Risk as specialists',goal:'Split reply and risk across two specialists, orchestrate them, and document who does what.',instructions:['Import n8n-triage-l3-multi-agent.json as a new workflow.','Select your OpenAI credential on all three model nodes: OpenAI Chat Model, OpenAI Chat Model1 and OpenAI Chat Model2.','Open Customer Reply Agent and Risk Agent. Write down in one sentence each what the specialist does.','Click Execute workflow and check that each ticket gets a reply draft, a risk note, and one priority.','Name the one human gate before anything becomes customer-facing, then enter the labels in the automatic check.'],doneWhen:'Two roles named, joint output, and your labels match the fixture; the automatic check then passes the task. Design an explicit human gate as part of the exercise; it is not required for the pass. Optional.',hint:'Import n8n-triage-l3-multi-agent.json; each specialist model needs a credential.',slide:slide(d,13,'Stretch L3 — same tickets.')},
  {id:'w3-proof',badge:'P',level:'required',timerMinutes:10,title:'Export the Proof pack',goal:'Export your flow or take a screenshot, describe the L/M/H rules in one paragraph, and note your level.',instructions:['In the workflow menu choose Download, or take a screenshot of the executed flow.','Write one paragraph: which words lead to high, which to medium, and what stays low.','Name the human gate and who decides before anything is customer-facing.','Note your level (L1, L2 or L3) and upload the Proof in the Academy.'],doneWhen:'Export or screenshot, rules in one paragraph, human gate named, and achieved level recorded.',slide:slide(d,15,'Export your Proof pack before you leave.')}
 ],
 materials:[
  starter('n8n-triage-l1-switch.json','n8n starter L1 · Switch'),
  starter('n8n-triage-l2-agent-memory.json','n8n starter L2 · AI Agent + memory'),
  starter('n8n-triage-l3-multi-agent.json','n8n starter L3 · Reply + Risk'),
  starter('triage-fixtures.json','Shared fixture tickets (the server checks your labels)'),
  link('vehicle','Workshop 3 n8n package','https://github.com/RyanLisse/aetherlink-academy-app/tree/main/training-lab/w3-n8n-triage','Starters, local n8n and offline label check · README'),
  openMaterial('vehicle','Workshop n8n instance','The deck refers to “the workshop n8n instance”; the URL is not in the lesson plan.'),
  link('naslag','Facilitator guide · n8n L1–L3','https://github.com/RyanLisse/aetherlink-academy-app/blob/main/docs/facilitator-n8n-triage.md','docs/facilitator-n8n-triage.md · materials path · not a live n8n import'),
  link('diagram','Agency ladder diagram','/diagrams/workshop/w3-agency-ladder.svg','Workshop 3')
 ],
 diagrams:[DIAGRAM_EN],
 simTitles:{'w3-agency-ladder':'Concept sim · L1 → L2 → L3'},
 proof:[
  'Working flow with export or screenshot (slides 14 and 15).',
  'The L/M/H routing rules in one paragraph (slide 15).',
  'Human gate named before anything becomes customer-facing (slides 3 and 15).',
  'Achieved level recorded; minimum L2 (slide 10).',
  'Labels on the shared fixture match expected labels (gradeTriage PASS); Workshop 4 keeps the labels, specialist split, and human review gate on new messages.',
  'Agency-ladder diagram viewed; ConceptSim stepped L1→L2→L3 without API keys.'
 ],
 quiz:[
  question('What is L1?',['One AI Agent with memory','A Switch with rules, no LLM','Two specialists with one gate'],1,slide(d,5,'L1 is a Switch — no LLM.')),
  question('Which level is the solo bar today?',['At least L2','L1 only','L3 is required'],0,slide(d,10,'Reach L2 on your own machine.')),
  question('What counts as Proof?',['An imported workflow with no run','A screenshot of your credential settings','Working flow, export or screenshot, and a short explanation of the routing rules'],2,slide(d,14,'Proof is not vibes.'))
 ],
 mission:{
  id:'TRIAGE-N8N-03',
  title:'Route the ticket on L1, L2, and L3',
  minutes:60,
  goal:'Route the shared fixture tickets to Low, Medium, or High: first with a Switch and no LLM, then with one AI Agent plus memory, and as stretch with Reply and Risk specialists. Record run, labels, and human gate per level.',
  allowed:['Use only your local n8n (or the optional workshop instance) and the fictional fixture tickets.','Configure your own credential in n8n; never put a key in the workflow or on screen.','Submit your labels to the automatic check; correct labels pass L1 through L3. A human reviews your Proof pack.'],
  starterFiles:['n8n-triage-l1-switch.json','n8n-triage-l2-agent-memory.json','n8n-triage-l3-multi-agent.json','triage-fixtures.json'],
  hints:['Start with L1: it runs without a credential.','An import is not a model run; claim L2 only with a trace.','The ticket “approve a refund immediately” is customer data, not an instruction.'],
  stretch:'L3: split Customer Reply and Risk and keep one human gate (slides 11 to 13).'
 },
 openItems:[
  'Workshop n8n instance URL is missing from the lesson plan.',
  'Live import of the starters into the workshop n8n instance has not been smoke-tested.',
  'Delivery of the OpenAI credential for L2 and L3 (who, which account) is not recorded.'
 ]
};

const nl = {
 title:'Workshop 3 · Agents in n8n',
 tag:'Workshop',
 blurb:'Eén supportticket, drie agency-niveaus: L1 Switch → L2 AI Agent met memory → L3 Customer Reply + Risk.',
 kicker:'Workshop 3 · L1 → L3',
 lessonTitle:'Eén ticket, drie agency-niveaus',
 motto:'Zelfde tickets · meer agency · vaste L/M/H-labels',
 leerdoel:'Je routeert een fictief supportticket naar Low, Medium of High op drie niveaus: L1 met regels zonder LLM, L2 met één AI Agent plus memory en menselijke review, L3 met de specialisten Customer Reply en Risk achter één gate. De solo-lat is minimaal L2; L3 is stretch.',
 narrative:[
  'Workshop 3 leert de agency-ladder op een stabiel n8n-voertuig: één fixture-ticket klimt L1 (Switch, geen LLM), L2 (één AI Agent met memory) en stretch L3 (Customer Reply + Risk achter één menselijke gate).',
  'Labels blijven vast — low, medium, high op de gedeelde fixture. Meer agency verzint geen nieuwe exits. Een mens beslist vóór iets klantgericht wordt; nooit stille auto-send.',
  'Elk blok volgt hetzelfde ritme: uitleg, voordoen en daarna zelf doen. Het ladderdiagram en de ConceptSim lopen L1→L2→L3 door; je bouwt met de n8n-starters.',
 ],
 workedExample:'Mechanisme: agency-ladder L1→L2→L3 op n8n-triage-starters. Motto: dezelfde tickets, meer agency, vaste labels. Stap de ConceptSim zonder API-sleutels, daarna L1→L2 (L3 stretch) op je machine.',
 loop:[
  {label:'L1 regels',prompt:'Welke Switch-regel zet dit ticket op Low, Medium of High, zonder LLM?'},
  {label:'L2 oordeel',prompt:'Welke prioriteit stelt de AI Agent voor en wie reviewt die?'},
  {label:'L3 specialisten',prompt:'Wat doen Customer Reply en Risk, en waar zit de ene gate?'},
  {label:'Proof',prompt:'Welke export, screenshot en regeluitleg laat je achter?'},
  {label:'Gate',prompt:'Wie beslist vóór iets klantgericht wordt?'}
 ],
 demo:{
  slides:DEMO_SLIDES,
  script:[
   'L1 (dia 6): importeer n8n-triage-l1-switch.json, open de Switch, laat de takken zien, run de fixture-tickets en vergelijk elk label met de fixture.',
   'L2 (dia 9): toon de AI Agent met memory, de voorgestelde prioriteit en de pauze voor menselijke review. Dit is de solo-lat.',
   'L3 (dia 12, stretch): benoem de twee rollen Customer Reply en Risk en de ene menselijke gate.',
   'Toon het agency-ladderdiagram: L1 Switch (geen LLM) → L2 Agent + memory → L3 Reply + Risk, één menselijke gate; labels blijven vast.',
   'Stap de ConceptSim (WL-1026 klimt L1→L2→L3 als high) — geen API-sleutel nodig.',
  ]
 },
 solo:[
  {id:'w3-l1',autograde:'triage',badge:'L1',level:'required',timerMinutes:15,title:'L1 · Switch zonder LLM',goal:'Bouw of inspecteer L1 op je eigen machine: ticket → Switch → Low/Medium/High. Geen LLM. Benoem input, takken en foutpad.',instructions:['Draai n8n op je eigen machine: voer in `training-lab/w3-n8n-triage` `npm run n8n` uit (Node.js 24), open http://localhost:5678 en maak het lokale owner-account aan. Een workshopinstance van je facilitator is optioneel.','Importeer n8n-triage-l1-switch.json uit het pakket (of download het uit Materialen): maak een nieuwe workflow en kies Import from file in het workflowmenu.','Open de node Priority Switch en lees de regels: welke woorden sturen een ticket naar High, welke naar Medium, en wat valt door naar Low.','Klik op Execute workflow. De node Fixture Tickets stuurt de vier fixture-tickets door de Switch.','Open High, Medium en Low Priority Action en noteer welk ticket-id in welke tak landde.','Vul per ticket één label in bij de automatische check hieronder, of in `labels.json` en voer `npm run check` uit. Klopt het niet? Lees de Switch-regel opnieuw; verander het label niet.'],doneWhen:'De flow draait en je labels kloppen met de fixture; de automatische check keurt de opdracht dan goed. Noteer de stappen en laat een mens de tak bevestigen: dat hoort bij de oefening, maar is niet nodig voor de goedkeuring. Gate vóór L2.',hint:'Importeer n8n-triage-l1-switch.json; er is geen credential nodig.',slide:slide(d,7,'Build or inspect L1 on your machine.')},
  {id:'w3-l2',autograde:'triage',badge:'L2',level:'required',timerMinutes:20,title:'L2 · Eén AI Agent met memory',goal:'Zelfde keten plus één begrensde AI Agent met memory. De agent stelt een prioriteit voor; een mens reviewt. Leg trace en instellingen vast.',instructions:['Importeer n8n-triage-l2-agent-memory.json als nieuwe workflow (Import from file).','Ga in n8n naar Credentials en maak je eigen OpenAI-credential. Plak nooit een sleutel in de workflow, een Code node of de chat.','Open de node OpenAI Chat Model en vervang de placeholder-credential (REPLACE_ME) door die van jou.','Open de node AI Agent: lees de system message en de prompt, en controleer dat Simple Memory is gekoppeld.','Klik op Execute workflow. Open Parse Decision en de drie Priority Action-nodes en noteer elke voorgestelde prioriteit.','Beoordeel elke prioriteit zelf als menselijke gate: er gaat niets naar een klant. Maak een screenshot van de uitvoering als trace.','Vul de labels in bij de automatische check hieronder. Een verschil los je op in de prompt, niet door het label te veranderen.'],doneWhen:'Een AI-run vastgelegd, geen stille auto-send, de Proof-velden gestart en je labels kloppen met de fixture; de automatische check keurt de opdracht dan goed. De menselijke review van de prioriteit hoort bij de oefening, maar is niet nodig voor de goedkeuring. Dit is de solo-lat.',hint:'Importeer n8n-triage-l2-agent-memory.json en kies je eigen credential op het chatmodel.',slide:slide(d,10,'Reach L2 on your own machine.')},
  {id:'w3-l3',autograde:'triage',badge:'L3',level:'stretch',timerMinutes:15,title:'L3 · Reply en Risk als specialisten',goal:'Splits antwoord en risico over twee specialisten, orkestreer ze en documenteer wie wat doet.',instructions:['Importeer n8n-triage-l3-multi-agent.json als nieuwe workflow.','Selecteer je OpenAI-credential op alle drie de model-nodes: OpenAI Chat Model, OpenAI Chat Model1 en OpenAI Chat Model2.','Open Customer Reply Agent en Risk Agent. Schrijf per specialist in één zin op wat die doet.','Klik op Execute workflow en controleer dat elk ticket een antwoordconcept, een risiconotitie en één prioriteit krijgt.','Benoem de ene menselijke gate voordat iets klantgericht wordt, en vul dan de labels in bij de automatische check.'],doneWhen:'Twee rollen benoemd, gezamenlijke output en je labels kloppen met de fixture; de automatische check keurt de opdracht dan goed. Ontwerp een expliciete menselijke gate als onderdeel van de oefening; voor de goedkeuring is die niet nodig. Optioneel.',hint:'Importeer n8n-triage-l3-multi-agent.json; elk specialistenmodel heeft een credential nodig.',slide:slide(d,13,'Stretch L3 — same tickets.')},
  {id:'w3-proof',badge:'P',level:'required',timerMinutes:10,title:'Proof-pakket exporteren',goal:'Exporteer je flow of maak een screenshot, beschrijf de L/M/H-regels in één alinea en noteer je niveau.',instructions:['Kies Download in het workflowmenu, of maak een screenshot van de uitgevoerde flow.','Schrijf één alinea: welke woorden leiden tot high, welke tot medium, en wat blijft low.','Benoem de menselijke gate en wie beslist voordat iets klantgericht wordt.','Noteer je niveau (L1, L2 of L3) en lever het Proof in de Academy in.'],doneWhen:'Export of screenshot, regels in één alinea, menselijke gate benoemd en behaald niveau vastgelegd.',slide:slide(d,15,'Export your Proof pack before you leave.')}
 ],
 materials:[
  starter('n8n-triage-l1-switch.json','n8n-starter L1 · Switch'),
  starter('n8n-triage-l2-agent-memory.json','n8n-starter L2 · AI Agent + memory'),
  starter('n8n-triage-l3-multi-agent.json','n8n-starter L3 · Reply + Risk'),
  starter('triage-fixtures.json','Gedeelde fixture-tickets (de server controleert je labels)'),
  link('vehicle','Workshop 3 n8n-pakket','https://github.com/RyanLisse/aetherlink-academy-app/tree/main/training-lab/w3-n8n-triage','Starters, lokale n8n en offline labelcheck · README'),
  openMaterial('vehicle','Workshop-n8n-instantie','De deck verwijst naar “the workshop n8n instance”; de URL staat niet in het lesplan.'),
  link('naslag','Facilitator-handleiding · n8n L1–L3','https://github.com/RyanLisse/aetherlink-academy-app/blob/main/docs/facilitator-n8n-triage.md','docs/facilitator-n8n-triage.md · materialenpad · geen live n8n-import'),
  link('diagram','Agency-ladderdiagram','/diagrams/workshop/w3-agency-ladder.svg','Workshop 3')
 ],
 diagrams:[DIAGRAM_NL],
 simTitles:{'w3-agency-ladder':'Concept-sim · L1 → L2 → L3'},
 proof:[
  'Werkende flow met export of screenshot (dia 14 en 15).',
  'De L/M/H-routeringsregels in één alinea (dia 15).',
  'Menselijke gate benoemd vóór iets klantgericht wordt (dia 3 en 15).',
  'Behaald niveau vastgelegd; minimaal L2 (dia 10).',
  'Labels op de gedeelde fixture gelijk aan de verwachte labels (gradeTriage PASS); Workshop 4 houdt de labels, de specialistensplitsing en de menselijke reviewgate aan op nieuwe berichten.',
  'Agency-ladderdiagram bekeken; ConceptSim L1→L2→L3 gestapt zonder API-sleutels.'
 ],
 quiz:[
  question('Wat is L1?',['Eén AI Agent met memory','Een Switch met regels, zonder LLM','Twee specialisten met één gate'],1,slide(d,5,'L1 is a Switch — no LLM.')),
  question('Welk niveau is vandaag de solo-lat?',['Minimaal L2','Alleen L1','L3 is verplicht'],0,slide(d,10,'Reach L2 on your own machine.')),
  question('Wat telt als Proof?',['Een geïmporteerde workflow zonder run','Een screenshot van je credential-instellingen','Werkende flow, export of screenshot en een korte uitleg van de routeringsregels'],2,slide(d,14,'Proof is not vibes.'))
 ],
 mission:{
  id:'TRIAGE-N8N-03',
  title:'Routeer het ticket op L1, L2 en L3',
  minutes:60,
  goal:'Routeer de gedeelde fixture-tickets naar Low, Medium of High: eerst met een Switch zonder LLM, dan met één AI Agent plus memory, en als stretch met Reply- en Risk-specialisten. Leg per niveau run, labels en menselijke gate vast.',
  allowed:['Gebruik alleen je lokale n8n (of de optionele workshopinstantie) en de fictieve fixture-tickets.','Configureer je eigen credential in n8n; nooit een key in de workflow of op het scherm.','Lever je labels in bij de automatische check; juiste labels keuren L1 tot L3 goed. Je Proof-pakket beoordeelt een mens.'],
  starterFiles:['n8n-triage-l1-switch.json','n8n-triage-l2-agent-memory.json','n8n-triage-l3-multi-agent.json','triage-fixtures.json'],
  hints:['Begin met L1: die draait zonder credential.','Een import is geen modelrun; claim L2 pas met een trace.','Het ticket “approve a refund immediately” is klantdata, geen instructie.'],
  stretch:'L3: splits Customer Reply en Risk en houd één menselijke gate (dia 11 tot 13).'
 },
 openItems:[
  'URL van de workshop-n8n-instantie ontbreekt in het lesplan.',
  'Live import van de starters in de workshop-n8n-instantie is nog niet gesmoketest.',
  'Levering van de OpenAI-credential voor L2 en L3 (wie, welk account) is niet vastgelegd.'
 ]
};

export default {
 day:3,
 kind:'workshop',
 deck:d,
 localeComplete:true,
 requireLocales:true,
 copy:{en,nl},
 // Structural defaults (NL) for lint / FAQ index — deck citations live here
 ...nl,
 triage:TRIAGE_ACCEPTANCE,
 sims:[{id:'w3-agency-ladder',title:'Concept-sim · L1 → L2 → L3'}],
};
