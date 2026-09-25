import {TRIAGE_ACCEPTANCE} from '../triage/grade.mjs';
import {openMaterial,question,slide,starter} from './model.mjs';

const d='workshop-3';

export default {
 day:3,
 kind:'workshop',
 deck:d,
 title:'Workshop 3 · Agents in n8n',
 tag:'Workshop',
 blurb:'Eén supportticket, drie agency-niveaus: L1 Switch → L2 AI Agent met memory → L3 Customer Reply + Risk.',
 kicker:'Workshop 3 · L1 → L3',
 lessonTitle:'Eén ticket, drie agency-niveaus',
 leerdoel:'Je routeert een fictief supportticket naar Low, Medium of High op drie niveaus: L1 met regels zonder LLM, L2 met één AI Agent plus memory en menselijke review, L3 met de specialisten Customer Reply en Risk achter één gate. De solo-lat is minimaal L2; L3 is stretch.',
 loop:[
  {label:'L1 regels',prompt:'Welke Switch-regel zet dit ticket op Low, Medium of High, zonder LLM?'},
  {label:'L2 oordeel',prompt:'Welke prioriteit stelt de AI Agent voor en wie reviewt die?'},
  {label:'L3 specialisten',prompt:'Wat doen Customer Reply en Risk, en waar zit de ene gate?'},
  {label:'Proof',prompt:'Welke export, screenshot en regeluitleg laat je achter?'},
  {label:'Gate',prompt:'Wie beslist vóór iets klantgericht wordt?'}
 ],
 demo:{
  slides:[slide(d,6,'Watch: L1 Switch routes the ticket.'),slide(d,9,'Watch: L2 Agent drafts priority.'),slide(d,12,'Watch: L3 specialists, one gate.')],
  script:[
   'L1 (dia 6): importeer n8n-triage-l1-switch.json, open de Switch, laat de takken zien, run de fixture-tickets en vergelijk elk label met de fixture.',
   'L2 (dia 9): toon de AI Agent met memory, de voorgestelde prioriteit en de pauze voor menselijke review.',
   'L3 (dia 12, stretch): benoem de twee rollen Customer Reply en Risk en de ene menselijke gate.'
  ]
 },
 solo:[
  {id:'w3-l1',autograde:'triage',badge:'L1',level:'required',timerMinutes:15,title:'L1 · Switch zonder LLM',goal:'Bouw of inspecteer L1 op je eigen machine: ticket → Switch → Low/Medium/High. Geen LLM. Benoem input, takken en foutpad.',doneWhen:'De flow draait en je labels kloppen met de fixture; de automatische check keurt de opdracht dan goed. Noteer de stappen en laat een mens de tak bevestigen: dat hoort bij de oefening, maar is niet nodig voor de goedkeuring. Gate vóór L2.',hint:'Importeer n8n-triage-l1-switch.json; er is geen credential nodig.',slide:slide(d,7,'Build or inspect L1 on your machine.')},
  {id:'w3-l2',autograde:'triage',badge:'L2',level:'required',timerMinutes:20,title:'L2 · Eén AI Agent met memory',goal:'Zelfde keten plus één begrensde AI Agent met memory. De agent stelt een prioriteit voor; een mens reviewt. Leg trace en instellingen vast.',doneWhen:'Een AI-run vastgelegd, geen stille auto-send, de Proof-velden gestart en je labels kloppen met de fixture; de automatische check keurt de opdracht dan goed. De menselijke review van de prioriteit hoort bij de oefening, maar is niet nodig voor de goedkeuring. Dit is de solo-lat.',hint:'Importeer n8n-triage-l2-agent-memory.json en kies je eigen credential op het chatmodel.',slide:slide(d,10,'Reach L2 on your own machine.')},
  {id:'w3-l3',autograde:'triage',badge:'L3',level:'stretch',timerMinutes:15,title:'L3 · Reply en Risk als specialisten',goal:'Splits antwoord en risico over twee specialisten, orkestreer ze en documenteer wie wat doet.',doneWhen:'Twee rollen benoemd, gezamenlijke output en je labels kloppen met de fixture; de automatische check keurt de opdracht dan goed. Ontwerp een expliciete menselijke gate als onderdeel van de oefening; voor de goedkeuring is die niet nodig. Optioneel.',hint:'Importeer n8n-triage-l3-multi-agent.json; elk specialistenmodel heeft een credential nodig.',slide:slide(d,13,'Stretch L3 — same tickets.')},
  {id:'w3-proof',badge:'P',level:'required',timerMinutes:10,title:'Proof-pakket exporteren',goal:'Exporteer je flow of maak een screenshot, beschrijf de L/M/H-regels in één alinea en noteer je niveau.',doneWhen:'Export of screenshot, regels in één alinea, menselijke gate benoemd en behaald niveau vastgelegd.',slide:slide(d,15,'Export your Proof pack before you leave.')}
 ],
 materials:[
  starter('n8n-triage-l1-switch.json','n8n-starter L1 · Switch'),
  starter('n8n-triage-l2-agent-memory.json','n8n-starter L2 · AI Agent + memory'),
  starter('n8n-triage-l3-multi-agent.json','n8n-starter L3 · Reply + Risk'),
  starter('triage-fixtures.json','Gedeelde fixture-tickets (de server controleert je labels)'),
  openMaterial('vehicle','Workshop-n8n-instantie','De deck verwijst naar “the workshop n8n instance”; de URL staat niet in het lesplan.')
 ],
 proof:[
  'Werkende flow met export of screenshot (dia 14 en 15).',
  'De L/M/H-routeringsregels in één alinea (dia 15).',
  'Menselijke gate benoemd vóór iets klantgericht wordt (dia 3 en 15).',
  'Behaald niveau vastgelegd; minimaal L2 (dia 10).',
  'Labels op de gedeelde fixture gelijk aan de verwachte labels (gradeTriage PASS); dag 4 wordt op dezelfde tickets beoordeeld (dia 4 en 16).'
 ],
 triage:TRIAGE_ACCEPTANCE,
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
  allowed:['Gebruik alleen de workshop-n8n-instantie en de fictieve fixture-tickets.','Configureer je eigen credential in n8n; nooit een key in de workflow of op het scherm.','Lever je labels in bij de automatische check; juiste labels keuren L1 tot L3 goed. Je Proof-pakket beoordeelt een mens.'],
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
