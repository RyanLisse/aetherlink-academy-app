import {TRIAGE_ACCEPTANCE} from '../triage/grade.mjs';
import {link,question,slide,starter} from './model.mjs';

const d='workshop-4';

export default {
 day:4,
 kind:'workshop',
 deck:d,
 title:'Workshop 4 · Claude Agent SDK',
 tag:'Workshop',
 blurb:'Dezelfde ticket-triage opnieuw gebouwd met de Claude Agent SDK, op dezelfde tickets en labels als in n8n.',
 kicker:'Workshop 4 · SOLO 0 → 4',
 lessonTitle:'Zelfde triage, Claude Agent SDK',
 leerdoel:'Je bouwt de ticket-triage van Workshop 3 opnieuw met de Claude Agent SDK en haalt op de gedeelde fixture dezelfde prioriteitslabels als het n8n-pad. De solo-lat is SOLO 2; SOLO 3 is stretch. Eve is geen verplicht pad.',
 loop:[
  {label:'SOLO 0',prompt:'Heb je de repo gecloned en wijs je Ticket Input, AI Agent, Reply, Risk en Switch aan?'},
  {label:'SOLO 1',prompt:'Welk label verwacht de fixture per ticket?'},
  {label:'SOLO 2',prompt:'Welke prioriteit geeft je eerste agent en wie reviewt die?'},
  {label:'SOLO 3',prompt:'Welke specialist splits je af en waar zit de gate?'},
  {label:'SOLO 4',prompt:'Komt elk Claude-label overeen met het verwachte n8n-label?'}
 ],
 demo:{
  slides:[slide(d,3,'Watch: clone, install, open the export.'),slide(d,6,'Watch: fixture tickets and expected L/M/H.'),slide(d,9,'Watch: first agent, ticket to priority.'),slide(d,12,'Watch: one specialist split.')],
  script:[
   'SOLO 0 (dia 3): git clone, npm install, open n8n/support-triage.json en benoem Ticket Input, AI Agent, Reply en Risk.',
   'SOLO 1 (dia 6): toon de fixture-tickets en de verwachte labels (WL-1026 high, WL-1027 low).',
   'SOLO 2 (dia 9): run npm run triage -- fixtures/ticket.json --dry-run, toon de prioriteit en de menselijke gate vóór acceptatie.',
   'SOLO 3 (dia 12, stretch): demonstreer één specialist (customer-reply of risk) met gezamenlijke output en gate.'
  ]
 },
 solo:[
  {id:'w4-solo0',badge:'S0',level:'required',timerMinutes:10,title:'SOLO 0 · Clone en open de export',goal:'Clone aetherlink-day5-n8n-to-agent, draai npm install, open n8n/support-triage.json en werk op je eigen work/<naam>-branch.',doneWhen:'Installatie werkt en je wijst Ticket Input, AI Agent, Customer Reply Agent, Risk Agent en de Switch aan.',slide:slide(d,4,'Clone and open the n8n export.')},
  {id:'w4-solo1',badge:'S1',level:'required',timerMinutes:10,title:'SOLO 1 · Bevestig de fixture',goal:'Noteer per fixture-ticket het verwachte label. Houd je Proof van Workshop 3 ernaast als je die hebt.',doneWhen:'Minstens twee tickets met hun verwachte L/M/H genoteerd.',slide:slide(d,7,'Confirm the fixture on your machine.')},
  {id:'w4-solo2',badge:'S2',level:'required',timerMinutes:20,title:'SOLO 2 · Eerste agent',goal:'Laat je agent op minstens één fixture-ticket een prioriteit geven met systemPrompt en prompt. Een offline dry-run mag; die is geen modelbewijs.',doneWhen:'Agent draait op een fixture, prioriteit komt eruit, een mens heeft gereviewd en er zijn geen secrets gecommit. Dit is de solo-lat.',hint:'Pas desgewenst src/prompts.ts aan en run opnieuw offline.',slide:slide(d,10,'Run your first agent on a fixture.')},
  {id:'w4-solo3',badge:'S3',level:'stretch',timerMinutes:15,title:'SOLO 3 · Voeg een specialist toe',goal:'Splits Reply of Risk af als subagent of skill, net als L3 in n8n.',doneWhen:'Twee rollen, gezamenlijke output en een gate met draft_only en human_approval_required. Optioneel.',slide:slide(d,13,'Stretch — add a specialist role.')},
  {id:'w4-solo4',badge:'S4',level:'required',timerMinutes:15,title:'SOLO 4 · Acceptatietabel en Proof',goal:'Vul de tabel ticket → verwacht n8n-label → werkelijk Claude-label. Een verschil los je op in prompt of tools, niet met nieuwe labels.',doneWhen:'Acceptatietabel, dry-run of trace, menselijke gate en behaald niveau (2, 3 of 4).',slide:slide(d,15,'Fill the acceptance table. Ship Proof.')}
 ],
 materials:[
  link('vehicle','Rebuild-repository aetherlink-day5-n8n-to-agent','https://github.com/RyanLisse/aetherlink-day5-n8n-to-agent','Dia 2; SOLO.md in de repo'),
  starter('triage-fixtures.json','Gedeelde fixture-tickets met verwachte labels')
 ],
 proof:[
  'Acceptatietabel ticket → verwacht n8n-label → werkelijk Claude-label op dezelfde fixture als Workshop 3 (dia 14 en 15).',
  'Alle labels gelijk (gradeTriage PASS); een verschil wordt in prompt of tools opgelost, niet met een nieuw label (dia 14).',
  'Dry-run of trace bijgevoegd; een offline run is geen modelbewijs (dia 8 en 15).',
  'Menselijke gate vastgelegd vóór acceptatie (dia 10 en 15).',
  'Behaald niveau vastgelegd; minimaal SOLO 2 (dia 10).'
 ],
 triage:TRIAGE_ACCEPTANCE,
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
