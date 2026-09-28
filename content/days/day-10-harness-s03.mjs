import {diagram,link,question} from './model.mjs';

const MIT_EN='Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code';
const MIT_NL='Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code';

const en = {
 title:'Harness · s03 Permission System',
 tag:'Harness',
 blurb:'Check permissions before executing — deny list, rule match, optional user approval.',
 kicker:'Harness Engineering · s03',
 lessonTitle:'Permission — Check Permissions Before Execution',
 motto:'Check permissions before executing',
 leerdoel:'You insert a permission pipeline before tool execution (hard deny → rule match → user approval), and step a ConceptSim that pauses for approval without API keys.',
 narrative:[
  's02 gives the agent five tools. File tools can use safe_path, but bash is unrestricted. Ask it to clean up and it might run rm -rf /.',
  'Safety cannot rely on trusting the model — it needs code: a check before every tool execution.',
  'Keep the s02 loop. Insert check_permission() before execution. Three gates in fixed order: hard deny, soft ask (rule match), then user approval. No match → allow.',
  'Harness layer: Permission — a gate before tool execution.'
 ],
 workedExample:'Mechanism: for each tool_call → Gate1 deny list (block) → Gate2 permission rules (ask) → Gate3 user y/N → else allow → run handler → tool_result. Motto: check permissions before executing.',
 loop:[
  {label:'Propose tool',prompt:'Which tool_call did the model emit?'},
  {label:'Gate 1 deny',prompt:'Is it on the hard deny list?'},
  {label:'Gate 2 rules',prompt:'Does a soft-ask rule match?'},
  {label:'Gate 3 approval',prompt:'Did the user allow or deny before execution?'}
 ],
 solo:[
  {id:'s03-gates',badge:'1',title:'Name the three gates',goal:'Write deny / rule match / user approval and what happens on match.',doneWhen:'All three gates and outcomes named.'},
  {id:'s03-where',badge:'2',title:'Place the gate in the loop',goal:'Point to the single insertion point: before handler execution, after tool_use is parsed.',doneWhen:'Insertion point stated relative to the s02 loop.'},
  {id:'s03-sim',badge:'3',title:'Step the ConceptSim',goal:'Step Permission sim through system_event approval to tool_result.',doneWhen:'You can narrate why the runtime paused.'}
 ],
 materials:[
  link('diagram','Permission overview','/diagrams/harness/s03-permission-overview.svg','EN SVG · MIT shareAI Lab'),
  link('diagram','Permission pipeline','/diagrams/harness/s03-permission-pipeline.svg','EN SVG · MIT shareAI Lab'),
  link('naslag','Upstream s03 README','https://github.com/shareAI-lab/learn-claude-code/tree/main/s03_permission','Reference only — do not iframe learn.shareai.run')
 ],
 diagrams:[
  diagram('/diagrams/harness/s03-permission-overview.svg','Permission overview','deny → ask → allow around tool execution'),
  diagram('/diagrams/harness/s03-permission-pipeline.svg','Permission pipeline','three gates before the handler runs')
 ],
 simTitles:{s03:'Concept sim · Permission'},
 proof:[
  'Three permission gates named with outcomes.',
  'Insertion point before handler execution stated.',
  'ConceptSim stepped without API keys.'
 ],
 quiz:[
  question('Where does the permission check sit?',['After tool_result is appended','Before the tool handler runs','Inside the model weights'],1),
  question('What is Gate 1?',['User free-text chat','A hard deny list that blocks immediately','A cron schedule'],1),
  question('If no gate matches, what happens?',['The tool is denied','The tool executes (allow path)','The loop restarts from scratch'],1)
 ],
 mission:{
  id:'HARNESS-S03',
  title:'Explain the permission pipeline',
  minutes:20,
  goal:'Name the three gates, place check_permission before execution, and step the Permission ConceptSim.',
  allowed:['Use the in-lesson diagrams and ConceptSim only.','No live model API required for the concept path.'],
  starterFiles:[],
  hints:['Deny first, then soft ask, then user approval.','Most routine calls take the allow path.']
 },
 demo:{
  slides:[],
  script:[
   'Show permission overview + pipeline diagrams.',
   'Step the ConceptSim: destructive-looking bash → system_event gates → user approval → tool_result.'
  ],
  open:'Harness chapters teach via narrative + SVG + ConceptSim (no Worldline deck slides required).'
 },
 attribution:MIT_EN,
 openItems:[]
};

const nl = {
 title:'Harness · s03 Permissiesysteem',
 tag:'Harness',
 blurb:'Controleer permissies vóór uitvoering — deny-lijst, regelmatch, optionele gebruikersgoedkeuring.',
 kicker:'Harness Engineering · s03',
 lessonTitle:'Permissies — controleer vóór uitvoering',
 motto:'Controleer permissies vóór uitvoering',
 leerdoel:'Je plaatst een permissiepijplijn vóór tooluitvoering (harde weigering → regelmatch → gebruikersgoedkeuring) en stapt een ConceptSim die pauzeert voor goedkeuring, zonder API-sleutels.',
 narrative:[
  's02 geeft de agent vijf tools. Bestandstools kunnen safe_path gebruiken, maar bash is onbegrensd. Vraag om op te ruimen en het kan rm -rf / draaien.',
  'Veiligheid kun je niet laten rusten op vertrouwen in het model — je hebt code nodig: een check vóór elke tooluitvoering.',
  'Houd de s02-loop. Voeg check_permission() in vóór uitvoering. Drie poorten in vaste volgorde: harde weigering, soft ask (regelmatch), daarna gebruikersgoedkeuring. Geen match → toestaan.',
  'Harness-laag: Permissie — een poort vóór tooluitvoering.'
 ],
 workedExample:'Mechanisme: voor elke tool_call → Poort1 deny-lijst (blokkeer) → Poort2 permissieregels (vraag) → Poort3 gebruiker j/N → anders toestaan → handler draaien → tool_result. Motto: controleer permissies vóór uitvoering.',
 loop:[
  {label:'Tool voorstellen',prompt:'Welke tool_call zond het model uit?'},
  {label:'Poort 1 weigeren',prompt:'Staat het op de harde deny-lijst?'},
  {label:'Poort 2 regels',prompt:'Matched een soft-ask-regel?'},
  {label:'Poort 3 goedkeuring',prompt:'Heeft de gebruiker toegestaan of geweigerd vóór uitvoering?'}
 ],
 solo:[
  {id:'s03-gates',badge:'1',title:'Noem de drie poorten',goal:'Schrijf weigeren / regelmatch / gebruikersgoedkeuring en wat er bij een match gebeurt.',doneWhen:'Alle drie poorten en uitkomsten genoemd.'},
  {id:'s03-where',badge:'2',title:'Plaats de poort in de loop',goal:'Wijs het ene invoegpunt aan: vóór handler-uitvoering, nadat tool_use is geparsed.',doneWhen:'Invoegpunt genoemd ten opzichte van de s02-loop.'},
  {id:'s03-sim',badge:'3',title:'Stap de ConceptSim',goal:'Stap de Permissie-sim via system_event-goedkeuring naar tool_result.',doneWhen:'Je kunt uitleggen waarom de runtime pauzeerde.'}
 ],
 materials:[
  link('diagram','Permissie-overzicht','/diagrams/harness/s03-permission-overview.svg','EN SVG · MIT shareAI Lab'),
  link('diagram','Permissiepijplijn','/diagrams/harness/s03-permission-pipeline.svg','EN SVG · MIT shareAI Lab'),
  link('naslag','Upstream s03 README','https://github.com/shareAI-lab/learn-claude-code/tree/main/s03_permission','Alleen referentie — geen iframe naar learn.shareai.run')
 ],
 diagrams:[
  diagram('/diagrams/harness/s03-permission-overview.svg','Permissie-overzicht','weigeren → vragen → toestaan rond tooluitvoering'),
  diagram('/diagrams/harness/s03-permission-pipeline.svg','Permissiepijplijn','drie poorten vóór de handler draait')
 ],
 simTitles:{s03:'Concept-sim · Permissies'},
 proof:[
  'Drie permissiepoorten met uitkomsten genoemd.',
  'Invoegpunt vóór handler-uitvoering genoemd.',
  'ConceptSim gestapt zonder API-sleutels.'
 ],
 quiz:[
  question('Waar zit de permissiecheck?',['Nadat tool_result is toegevoegd','Vóórdat de tool-handler draait','In de modelgewichten'],1),
  question('Wat is poort 1?',['Vrije chat met de gebruiker','Een harde deny-lijst die meteen blokkeert','Een cron-schema'],1),
  question('Als geen poort matched, wat gebeurt er?',['De tool wordt geweigerd','De tool wordt uitgevoerd (allow-pad)','De loop start opnieuw vanaf nul'],1)
 ],
 mission:{
  id:'HARNESS-S03',
  title:'Leg de permissiepijplijn uit',
  minutes:20,
  goal:'Noem de drie poorten, plaats check_permission vóór uitvoering, en stap de Permissie ConceptSim.',
  allowed:['Gebruik alleen de diagrammen en de ConceptSim in de les.','Geen live model-API nodig voor het conceptpad.'],
  starterFiles:[],
  hints:['Eerst weigeren, dan soft ask, dan gebruikersgoedkeuring.','De meeste routine-aanroepen nemen het allow-pad.']
 },
 demo:{
  slides:[],
  script:[
   'Toon permissie-overzicht + pijplijndiagrammen.',
   'Stap de ConceptSim: destructief ogende bash → system_event-poorten → gebruikersgoedkeuring → tool_result.'
  ],
  open:'Harness-hoofdstukken werken via narratief + SVG + ConceptSim (geen Worldline-deckdia’s vereist).'
 },
 attribution:MIT_NL,
 openItems:[]
};

export default {
 day:10,
 kind:'harness',
 deck:'harness',
 localeComplete:true,
 requireLocales:true,
 copy:{en,nl},
 ...en,
 sims:[{id:'s03',title:'Concept sim · Permission'}],
 skipAutoDeckLink:true
};
