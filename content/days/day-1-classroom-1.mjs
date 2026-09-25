import {link,question,slide} from './model.mjs';

const d='classroom-1';

export default {
 day:1,
 kind:'classroom',
 deck:d,
 title:'Classroom 1 · AI en Claude Code',
 tag:'Klas',
 blurb:'Van AI-basis naar veilig werken met Claude Code: verkennen, plannen, maken, testen, reviewen en overdragen.',
 kicker:'Classroom 1 · Explore → Handoff',
 lessonTitle:'Werken met Claude Code in een repository',
 leerdoel:'Je gebruikt Claude Code in je eigen kopie van de Aether Library volgens Explore → Plan → Create → Test → Human review → Handoff. Je laat eerst lezen, keurt het plan goed vóór er iets verandert en markeert wat je niet kunt bevestigen als OPEN.',
 loop:[
  {label:'Explore',prompt:'Wat doet de repository? Welke bestanden bewijzen dat?'},
  {label:'Plan',prompt:'Wat is de kleinste wijziging en wat blijft buiten scope?'},
  {label:'Create',prompt:'Welke ene wijziging voer je uit na akkoord op het plan?'},
  {label:'Test',prompt:'Welke controle heb je werkelijk gedraaid?'},
  {label:'Human review',prompt:'PASS, REVISE of OPEN, en op basis van welk bewijs?'},
  {label:'Handoff',prompt:'Wat moet een verse lezer weten en wie neemt het over?'}
 ],
 demo:{
  slides:[slide(d,26,'Repository exploration'),slide(d,27,'What Claude Code did')],
  script:[
   'Toon dia 26 en voer de prompt één keer uit op de demomachine: “Explore this repository without changing anything. Explain what the application does, how it is structured and how I can verify your explanation. Support your claims with evidence from the files. Mark anything you cannot confirm as OPEN.”',
   'Bespreek met dia 27 wat Claude Code deed: welke bestanden het las, welk bewijs het gaf en wat OPEN bleef.'
  ]
 },
 solo:[
  {id:'c1-setup',badge:'0',title:'Oefenrepository opzetten',goal:'Clone aetherlink-classroom-starter, draai npm install en npm start, open http://localhost:3000 en start claude in een tweede terminal.',doneWhen:'De app draait; Profiles, Glossary en Library zijn leeg, alleen de Game werkt.',slide:slide(d,34,'Practice repository setup')},
  {id:'c1-a1',badge:'A1',title:'Opdracht 1 · Repository-verkenner',goal:'Laat Claude Code de repository verkennen zonder iets te wijzigen: wat de app doet, waar profiel- en glossarydata staan, start- en validatiecommando’s en risicovolle bestanden.',doneWhen:'Een repository-kaart met bewijs. Geen code gewijzigd; onbekenden staan als OPEN.',slide:slide(d,35,'Assignment 1: Repository explorer')},
  {id:'c1-a2',badge:'A2',title:'Opdracht 2 · Deelnemersprofiel',goal:'Laat eerst de structuur inspecteren, beantwoord de vragen van Claude en keur het plan goed vóór een bestand verandert. Geen vertrouwelijke of onnodige persoonsgegevens.',doneWhen:'Je profiel staat op een werkende Profiles-pagina en slaagt voor de validatie; het plan was goedgekeurd vóór de eerste wijziging.',slide:slide(d,37,'Assignment 2: Participant profile')},
  {id:'c1-a3',badge:'A3',title:'Opdracht 3 · Glossary-bijdrage',goal:'Kies één AI-term die nog ontbreekt, volg de bestaande structuur en bekijk het concept vóór de repository verandert.',doneWhen:'Een nieuwe glossary-entry op een werkende Glossary-pagina, als concept gereviewd vóór toevoegen.',slide:slide(d,40,'Assignment 3: Glossary contribution')},
  {id:'c1-a4',badge:'A4',title:'Opdracht 4 · Verrijkte conceptkaart',goal:'Maak van één glossary-term een volledige conceptkaart. Open en lees elke bron; een zoekresultaat is geen controle. Wacht op akkoord en draai daarna de checks.',doneWhen:'Eén geverifieerde conceptkaart op een werkende Library-pagina, met review PASS, REVISE of OPEN.',slide:slide(d,41,'Assignment 4: Enriched concept card')}
 ],
 materials:[
  link('vehicle','Oefenrepository aetherlink-classroom-starter','https://github.com/jyse/aetherlink-classroom-starter','Dia 34'),
  link('naslag','Claude Code 101','https://anthropic.skilljar.com/claude-code-101','Anthropic Academy; lesplan-naslag'),
  link('naslag','Claude Code in Action','https://anthropic.skilljar.com/claude-code-in-action','Anthropic Academy; lesplan-naslag')
 ],
 proof:[
  'Repository-kaart met bewijs uit de bestanden; geen code gewijzigd en onbekenden als OPEN (opdracht 1, dia 35).',
  'Plan goedgekeurd vóór de eerste bestandswijziging (opdracht 2, dia 37).',
  'Uitgevoerde controle met het echte commando en de waargenomen uitkomst (opdracht 4, dia 41).',
  'Reviewbesluit PASS, REVISE of OPEN met reden (dia 36 en 42).',
  'Overdracht aan een verse lezer: bestand, commando, uitkomst, beperking en volgende eigenaar.'
 ],
 quiz:[
  question('Claude wil “de repository verbeteren”. Wat ontbreekt eerst?',['Een extra tool','Een begrensd doel met een controle','Een groter model'],1),
  question('De lokale missie vraagt geen Jira-data. Claude vraagt toch toegang. Wat doe je?',['Stoppen en de noodzaak bespreken','Alle permissies geven','Een collega-token delen'],0),
  question('Wat is een sterke overdracht?',['“Alles werkt”','Een overtuigende agentsamenvatting','Bestand, uitgevoerd commando, uitkomst, beperking en volgende eigenaar'],2)
 ],
 mission:{
  id:'CLASSROOM-01',
  title:'Verken en verbeter de Aether Library',
  minutes:25,
  goal:'Werk opdracht 1 tot en met 4 af in je eigen kopie van de Aether Library: eerst lezen, dan een goedgekeurd plan, één wijziging per opdracht, een echte controle en een reviewbesluit.',
  allowed:['Werk alleen in je eigen lokale kopie van aetherlink-classroom-starter.','Laat Claude eerst lezen en een plan tonen; wijzig pas na akkoord.','Dien bewijs in; een mens beslist over acceptatie.'],
  starterFiles:[],
  hints:['Begin met opdracht 1: niets wijzigen, alleen een kaart met bewijs.','Vraag Claude om het plan te tonen vóór een bestand verandert.','Wat je niet kunt bevestigen blijft OPEN.'],
  stretch:'Laat een andere deelnemer je conceptkaart reviewen met PASS, REVISE of OPEN (dia 42).'
 },
 openItems:[]
};
