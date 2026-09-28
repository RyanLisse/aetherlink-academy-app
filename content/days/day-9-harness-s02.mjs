import {diagram,link,question} from './model.mjs';

const MIT_EN='Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code';
const MIT_NL='Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code';

const en = {
 title:'Harness · s02 Tool Use',
 tag:'Harness',
 blurb:'Add a tool, add just one handler — TOOL_HANDLERS dispatch keeps the loop unchanged.',
 kicker:'Harness Engineering · s02',
 lessonTitle:'Tool Use — Add a Tool, Add Just One Line',
 motto:'Add a tool, add just one handler',
 leerdoel:'You keep the s01 loop intact, expand from bash-only to a tool dispatch map, and step a multi-tool ConceptSim without API keys.',
 narrative:[
  's01 has only bash. To read a file the model must spell cat; to write, echo redirects; to edit, sed. That translation wastes tokens and invites errors.',
  's02 keeps the loop word-for-word. The only change is the tool execution line: run_bash() becomes TOOL_HANDLERS[block.name]() lookup.',
  'Adding a tool means two registrations: one entry in TOOLS (schema the model sees) and one mapping in TOOL_HANDLERS (code that runs).',
  'Harness layer: Tool Dispatch — expanding the model\'s reach without rewriting the loop.'
 ],
 workedExample:'Mechanism: TOOLS = [bash, read_file, write_file, edit_file, glob]; TOOL_HANDLERS = {name: fn}. Loop still checks tool_use blocks; only the execute line becomes handler = TOOL_HANDLERS[block.name]; output = handler(**block.input).',
 loop:[
  {label:'Same loop',prompt:'Which s01 steps stay unchanged?'},
  {label:'Define tool',prompt:'What schema entry did you add to TOOLS?'},
  {label:'Register handler',prompt:'Which TOOL_HANDLERS mapping runs for this name?'},
  {label:'Dispatch',prompt:'Did you avoid a hardcoded run_bash call?'}
 ],
 solo:[
  {id:'s02-dispatch',badge:'1',title:'Sketch the dispatch map',goal:'List at least four tool names and the one loop line that looks them up.',doneWhen:'Dispatch map and lookup line written.'},
  {id:'s02-two-steps',badge:'2',title:'Name the two registration steps',goal:'State: (1) TOOLS entry (2) TOOL_HANDLERS mapping.',doneWhen:'Both registration steps named.'},
  {id:'s02-sim',badge:'3',title:'Step the ConceptSim',goal:'Step Tool Use sim through read_file → write_file.',doneWhen:'You can narrate why dedicated tools beat bash-only.'}
 ],
 materials:[
  link('diagram','Tool dispatch diagram','/diagrams/harness/s02-tool-dispatch.svg','EN SVG · MIT shareAI Lab'),
  link('naslag','Upstream s02 README','https://github.com/shareAI-lab/learn-claude-code/tree/main/s02_tool_use','Reference only — do not iframe learn.shareai.run')
 ],
 diagrams:[diagram('/diagrams/harness/s02-tool-dispatch.svg','Tool dispatch','TOOLS + TOOL_HANDLERS leave the loop unchanged')],
 simTitles:{s02:'Concept sim · Tool Use'},
 proof:[
  'Dispatch map sketched with lookup line.',
  'Two registration steps named (TOOLS + TOOL_HANDLERS).',
  'ConceptSim stepped without API keys.'
 ],
 quiz:[
  question('What stays unchanged when you add a tool in s02?',['The while True / tool_use loop','The deny list','The cron scheduler'],0),
  question('What two things does adding a tool require?',['A new model and a new loop','A TOOLS entry and a TOOL_HANDLERS mapping','A permission gate and a subagent'],1),
  question('Why prefer read_file over bash cat?',['It needs an API key','Dedicated tools reduce translation errors and wasted tokens','It bypasses permissions'],1)
 ],
 mission:{
  id:'HARNESS-S02',
  title:'Explain tool dispatch',
  minutes:20,
  goal:'Keep the s01 loop, describe TOOL_HANDLERS dispatch, and step the Tool Use ConceptSim.',
  allowed:['Use the in-lesson diagram and ConceptSim only.','No live model API required for the concept path.'],
  starterFiles:[],
  hints:['The loop body is almost identical to s01.','Only the execute line becomes a dict lookup.']
 },
 demo:{
  slides:[],
  script:[
   'Show the tool-dispatch diagram. Contrast bash-only vs dedicated read/write tools.',
   'Step the ConceptSim: read_file → write_file for greet(name).'
  ],
  open:'Harness chapters teach via narrative + SVG + ConceptSim (no Worldline deck slides required).'
 },
 attribution:MIT_EN,
 openItems:[]
};

const nl = {
 title:'Harness · s02 Toolgebruik',
 tag:'Harness',
 blurb:'Voeg een tool toe, voeg precies één handler toe — TOOL_HANDLERS-dispatch laat de loop ongemoeid.',
 kicker:'Harness Engineering · s02',
 lessonTitle:'Toolgebruik — voeg een tool toe, voeg één regel toe',
 motto:'Voeg een tool toe, voeg precies één handler toe',
 leerdoel:'Je houdt de s01-loop intact, breidt uit van alleen-bash naar een tool-dispatchmap, en stapt een multi-tool ConceptSim zonder API-sleutels.',
 narrative:[
  's01 heeft alleen bash. Om een bestand te lezen moet het model cat uitschrijven; om te schrijven echo-redirects; om te bewerken sed. Die vertaling verspilt tokens en nodigt uit tot fouten.',
  's02 houdt de loop woord-voor-woord. De enige wijziging is de uitvoeringsregel: run_bash() wordt TOOL_HANDLERS[block.name]()-lookup.',
  'Een tool toevoegen betekent twee registraties: één entry in TOOLS (schema dat het model ziet) en één mapping in TOOL_HANDLERS (code die draait).',
  'Harness-laag: Tool-dispatch — het bereik van het model vergroten zonder de loop te herschrijven.'
 ],
 workedExample:'Mechanisme: TOOLS = [bash, read_file, write_file, edit_file, glob]; TOOL_HANDLERS = {name: fn}. De loop checkt nog steeds tool_use-blokken; alleen de uitvoeringsregel wordt handler = TOOL_HANDLERS[block.name]; output = handler(**block.input).',
 loop:[
  {label:'Zelfde loop',prompt:'Welke s01-stappen blijven ongewijzigd?'},
  {label:'Tool definiëren',prompt:'Welke schema-entry voegde je toe aan TOOLS?'},
  {label:'Handler registreren',prompt:'Welke TOOL_HANDLERS-mapping draait voor deze naam?'},
  {label:'Dispatch',prompt:'Heb je een hardcoded run_bash-aanroep vermeden?'}
 ],
 solo:[
  {id:'s02-dispatch',badge:'1',title:'Schets de dispatch-map',goal:'Noem minstens vier toolnamen en de ene loopregel die ze opzoekt.',doneWhen:'Dispatch-map en lookupregel opgeschreven.'},
  {id:'s02-two-steps',badge:'2',title:'Noem de twee registratiestappen',goal:'Stel: (1) TOOLS-entry (2) TOOL_HANDLERS-mapping.',doneWhen:'Beide registratiestappen genoemd.'},
  {id:'s02-sim',badge:'3',title:'Stap de ConceptSim',goal:'Stap de Toolgebruik-sim: read_file → write_file.',doneWhen:'Je kunt uitleggen waarom dedicated tools beter zijn dan alleen bash.'}
 ],
 materials:[
  link('diagram','Diagram tool-dispatch','/diagrams/harness/s02-tool-dispatch.svg','EN SVG · MIT shareAI Lab'),
  link('naslag','Upstream s02 README','https://github.com/shareAI-lab/learn-claude-code/tree/main/s02_tool_use','Alleen referentie — geen iframe naar learn.shareai.run')
 ],
 diagrams:[diagram('/diagrams/harness/s02-tool-dispatch.svg','Tool-dispatch','TOOLS + TOOL_HANDLERS laten de loop ongemoeid')],
 simTitles:{s02:'Concept-sim · Toolgebruik'},
 proof:[
  'Dispatch-map geschetst met lookupregel.',
  'Twee registratiestappen genoemd (TOOLS + TOOL_HANDLERS).',
  'ConceptSim gestapt zonder API-sleutels.'
 ],
 quiz:[
  question('Wat blijft ongewijzigd als je in s02 een tool toevoegt?',['De while True / tool_use-loop','De deny-lijst','De cron-scheduler'],0),
  question('Wat zijn de twee vereisten om een tool toe te voegen?',['Een nieuw model en een nieuwe loop','Een TOOLS-entry en een TOOL_HANDLERS-mapping','Een permissiepoort en een subagent'],1),
  question('Waarom liever read_file dan bash cat?',['Die heeft een API-sleutel nodig','Dedicated tools verminderen vertaalfouten en verspilde tokens','Die omzeilt permissies'],1)
 ],
 mission:{
  id:'HARNESS-S02',
  title:'Leg tool-dispatch uit',
  minutes:20,
  goal:'Houd de s01-loop, beschrijf TOOL_HANDLERS-dispatch, en stap de Toolgebruik ConceptSim.',
  allowed:['Gebruik alleen het diagram en de ConceptSim in de les.','Geen live model-API nodig voor het conceptpad.'],
  starterFiles:[],
  hints:['De loop-body is bijna identiek aan s01.','Alleen de uitvoeringsregel wordt een dict-lookup.']
 },
 demo:{
  slides:[],
  script:[
   'Toon het tool-dispatch-diagram. Contrasteer alleen-bash met dedicated read/write-tools.',
   'Stap de ConceptSim: read_file → write_file voor greet(name).'
  ],
  open:'Harness-hoofdstukken werken via narratief + SVG + ConceptSim (geen Worldline-deckdia’s vereist).'
 },
 attribution:MIT_NL,
 openItems:[]
};

export default {
 day:9,
 kind:'harness',
 deck:'harness',
 localeComplete:true,
 requireLocales:true,
 copy:{en,nl},
 ...en,
 sims:[{id:'s02',title:'Concept sim · Tool Use'}],
 skipAutoDeckLink:true
};
