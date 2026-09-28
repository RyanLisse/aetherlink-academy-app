import {diagram,link,question} from './model.mjs';

const MIT_EN='Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code';
const MIT_NL='Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code';

const en = {
 title:'Harness · s01 Agent Loop',
 tag:'Harness',
 blurb:'One loop & Bash is all you need — messages, while True, tool_use.',
 kicker:'Harness Engineering · s01',
 lessonTitle:'The Agent Loop — One Loop Is All You Need',
 motto:'One loop & Bash is all you need',
 leerdoel:'You explain why an agent needs a loop around the model, name the tool_use vs final-answer signals, and step a preauthored agent loop without API keys.',
 narrative:[
  'You ask the model to list files and run a script. It can output a bash command, but once it finishes outputting it stops — it will not execute the command or keep reasoning on the result.',
  'You could run each command yourself, paste the output back, and repeat. Every round-trip, you are the middle layer. Automating that handoff is the agent loop.',
  'A while True loop keeps going when the model emits a tool_use block, and stops when it does not. Append the assistant turn, execute tools, append tool_result messages, call the model again.',
  'Harness layer: The Loop — the first bridge between the model and the real world.'
 ],
 workedExample:'Mechanism: messages = [{role:user, content:query}]; while True: response = model(messages, tools); messages.append(assistant); if no tool_use blocks → break; else execute tools, append tool_result, continue. Motto: one tool + one loop = one agent.',
 loop:[
  {label:'User message',prompt:'What task enters the messages list?'},
  {label:'Model turn',prompt:'Did the response contain a tool_use block?'},
  {label:'Execute',prompt:'What did the tool return, and did you append tool_result?'},
  {label:'Continue or stop',prompt:'tool_use → loop again; otherwise answer the user'}
 ],
 solo:[
  {id:'s01-motto',badge:'1',title:'State the motto',goal:'Write the s01 motto and name the harness layer in one sentence.',doneWhen:'Motto and harness layer named without copying a slide wall.'},
  {id:'s01-signal',badge:'2',title:'Name the loop signals',goal:'List the two response signals (tool_use present / absent) and the loop action for each.',doneWhen:'Both signals and actions written.'},
  {id:'s01-sim',badge:'3',title:'Step the ConceptSim',goal:'Play or step the Agent Loop sim through tool_call → tool_result → final answer.',doneWhen:'You can narrate each step without an API key.'}
 ],
 materials:[
  link('diagram','Agent loop diagram','/diagrams/harness/s01-agent-loop.svg','EN SVG · MIT shareAI Lab'),
  link('naslag','Upstream s01 README','https://github.com/shareAI-lab/learn-claude-code/tree/main/s01_agent_loop','Reference only — do not iframe learn.shareai.run')
 ],
 diagrams:[diagram('/diagrams/harness/s01-agent-loop.svg','Agent loop','while True: tool_use continues, otherwise stop')],
 simTitles:{s01:'Concept sim · Agent Loop'},
 proof:[
  'Motto and harness layer stated (s01).',
  'tool_use vs no-tool_use signals named with loop actions.',
  'ConceptSim stepped without API keys.'
 ],
 quiz:[
  question('What keeps the agent loop running?',['A larger model','A tool_use block in the model response','A longer system prompt'],1),
  question('When does the loop stop?',['After every tool result','When the response has no tool_use block','Only when bash exits non-zero'],1),
  question('Why is the concept sim useful here?',['It needs a live Anthropic key','It shows messages → tool_use → results without API keys','It replaces the permission system'],1)
 ],
 mission:{
  id:'HARNESS-S01',
  title:'Explain and step the agent loop',
  minutes:20,
  goal:'Name the loop signals and step the preauthored Agent Loop ConceptSim end-to-end.',
  allowed:['Use the in-lesson diagram and ConceptSim only.','No live model API required for the concept path.'],
  starterFiles:[],
  hints:['Look for tool_use blocks in the assistant turn.','tool_result is appended before the next model call.']
 },
 demo:{
  slides:[],
  script:[
   'Show the agent-loop diagram, then step the ConceptSim: user task → bash tool_use → result → verify → final answer.',
   'Emphasize: no API key is required for the concept path — the scenario is preauthored.'
  ],
  open:'Harness chapters teach via narrative + SVG + ConceptSim (no Worldline deck slides required).'
 },
 attribution:MIT_EN,
 openItems:[]
};

const nl = {
 title:'Harness · s01 Agent-loop',
 tag:'Harness',
 blurb:'Eén loop & Bash is alles wat je nodig hebt — messages, while True, tool_use.',
 kicker:'Harness Engineering · s01',
 lessonTitle:'De agent-loop — één loop is genoeg',
 motto:'Eén loop & Bash is alles wat je nodig hebt',
 leerdoel:'Je legt uit waarom een agent een loop om het model nodig heeft, noemt de signalen tool_use versus eindantwoord, en stapt een voorgeprogrammeerde agent-loop zonder API-sleutels.',
 narrative:[
  'Je vraagt het model om bestanden te tonen en een script te draaien. Het kan een bash-commando uitschrijven, maar zodra de tekst klaar is stopt het — het voert het commando niet uit en redeneert niet verder op het resultaat.',
  'Je kunt elk commando zelf draaien, de uitvoer terugplakken en herhalen. Elke ronde ben jij de middelste laag. Die handoff automatiseren is de agent-loop.',
  'Een while True-loop gaat door wanneer het model een tool_use-blok uitzendt, en stopt wanneer dat niet zo is. Voeg de assistant-beurt toe, voer tools uit, voeg tool_result-berichten toe, roep het model opnieuw aan.',
  'Harness-laag: De Loop — de eerste brug tussen het model en de echte wereld.'
 ],
 workedExample:'Mechanisme: messages = [{role:user, content:query}]; while True: response = model(messages, tools); messages.append(assistant); geen tool_use-blokken → break; anders tools uitvoeren, tool_result toevoegen, doorgaan. Motto: één tool + één loop = één agent.',
 loop:[
  {label:'Gebruikersbericht',prompt:'Welke taak komt in de messages-lijst?'},
  {label:'Modelbeurt',prompt:'Zat er een tool_use-blok in het antwoord?'},
  {label:'Uitvoeren',prompt:'Wat gaf de tool terug, en heb je tool_result toegevoegd?'},
  {label:'Doorgaan of stoppen',prompt:'tool_use → opnieuw loopen; anders de gebruiker antwoorden'}
 ],
 solo:[
  {id:'s01-motto',badge:'1',title:'Noem het motto',goal:'Schrijf het s01-motto en noem de harness-laag in één zin.',doneWhen:'Motto en harness-laag genoemd zonder een dia-muur te kopiëren.'},
  {id:'s01-signal',badge:'2',title:'Noem de loopsignalen',goal:'Noem de twee antwoordsignalen (tool_use aanwezig / afwezig) en de loopactie per signaal.',doneWhen:'Beide signalen en acties opgeschreven.'},
  {id:'s01-sim',badge:'3',title:'Stap de ConceptSim',goal:'Speel of stap de Agent-loop-sim: tool_call → tool_result → eindantwoord.',doneWhen:'Je kunt elke stap navertellen zonder API-sleutel.'}
 ],
 materials:[
  link('diagram','Diagram agent-loop','/diagrams/harness/s01-agent-loop.svg','EN SVG · MIT shareAI Lab'),
  link('naslag','Upstream s01 README','https://github.com/shareAI-lab/learn-claude-code/tree/main/s01_agent_loop','Alleen referentie — geen iframe naar learn.shareai.run')
 ],
 diagrams:[diagram('/diagrams/harness/s01-agent-loop.svg','Agent-loop','while True: tool_use gaat door, anders stop')],
 simTitles:{s01:'Concept-sim · Agent-loop'},
 proof:[
  'Motto en harness-laag genoemd (s01).',
  'Signalen tool_use versus geen tool_use met loopacties genoemd.',
  'ConceptSim gestapt zonder API-sleutels.'
 ],
 quiz:[
  question('Wat houdt de agent-loop draaiende?',['Een groter model','Een tool_use-blok in het modelantwoord','Een langere system prompt'],1),
  question('Wanneer stopt de loop?',['Na elk tool-resultaat','Wanneer het antwoord geen tool_use-blok heeft','Alleen als bash met een foutcode stopt'],1),
  question('Waarom is de concept-sim hier nuttig?',['Die vereist een live Anthropic-sleutel','Die toont messages → tool_use → resultaten zonder API-sleutels','Die vervangt het permissiesysteem'],1)
 ],
 mission:{
  id:'HARNESS-S01',
  title:'Leg de agent-loop uit en stap hem',
  minutes:20,
  goal:'Noem de loopsignalen en stap de voorgeprogrammeerde Agent-loop ConceptSim van begin tot eind.',
  allowed:['Gebruik alleen het diagram en de ConceptSim in de les.','Geen live model-API nodig voor het conceptpad.'],
  starterFiles:[],
  hints:['Zoek naar tool_use-blokken in de assistant-beurt.','tool_result wordt toegevoegd vóór de volgende modelaanroep.']
 },
 demo:{
  slides:[],
  script:[
   'Toon het agent-loop-diagram en stap daarna de ConceptSim: gebruikerstaak → bash tool_use → resultaat → controle → eindantwoord.',
   'Benadruk: voor het conceptpad is geen API-sleutel nodig — het scenario is voorgeprogrammeerd.'
  ],
  open:'Harness-hoofdstukken werken via narratief + SVG + ConceptSim (geen Worldline-deckdia’s vereist).'
 },
 attribution:MIT_NL,
 openItems:[]
};

export default {
 day:8,
 kind:'harness',
 deck:'harness',
 localeComplete:true,
 requireLocales:true,
 copy:{en,nl},
 // Structural defaults (EN) for lint / FAQ index
 ...en,
 sims:[{id:'s01',title:'Concept sim · Agent Loop'}],
 skipAutoDeckLink:true
};
