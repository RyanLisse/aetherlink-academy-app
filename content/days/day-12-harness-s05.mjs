import {diagram,link,question} from './model.mjs';

const MIT_EN="Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code";
const MIT_NL="Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code";

const en = {
 title:"Harness · s05 TodoWrite",
 tag:'Harness',
 blurb:"Plan-then-execute — list steps, then work the checklist.",
 kicker:"Harness Engineering · s05",
 lessonTitle:"TodoWrite — An Agent Without a Plan Drifts Off Course",
 motto:"An agent without a plan goes wherever the wind blows",
 leerdoel:"Observe TodoWrite in Claude Code, explain what the harness adds, and step the ConceptSim; the optional run uses your own API key.",
 narrative:[
  "Give the agent a complex rename-and-test task and it starts improvising: after a few tool results the original goal dilutes in context.",
  "TodoWrite adds a planning tool on the same dispatch path. The checklist stays visible; after several tool rounds without an update the harness reminds the model.",
  "todo_write only updates planning state — existing tools still do the work.",
  "Harness layer: Planning — let the agent think before it acts."
 ],
 workedExample:"Mechanism: TodoManager + todo_write + reminder after N tool rounds without a plan update. The checklist changes planning state; existing tools do the work.",
 loop:[{label:"Mechanism",prompt:"What is the harness layer for this chapter?"},{label:"Signals",prompt:"Which runtime signals or tools did you observe?"},{label:"Step",prompt:"Can you narrate the ConceptSim without an API key?"},{label:"Contrast",prompt:"How does this differ from the previous chapter?"}],
 solo:[
  {
   id:"s05-see",badge:"1",level:"required",timerMinutes:10,title:"See TodoWrite in Claude Code",
   goal:"Give Claude Code a multi-step job and catch the todo list it writes before it acts.",
   instructions:["Make a scratch folder and a small file to refactor (commands below).","Start Claude Code in that folder with `claude` and paste the first prompt.","Before the first edit, Claude Code shows a todo list. Count the items and note which one is in progress.","Paste the second prompt and watch how items move from pending to in progress to completed."],
   run:["mkdir -p ~/academy/s05 && cd ~/academy/s05","printf 'def add(a, b):\\n    return a + b\\n\\nprint(add(2, 3))\\n' > hello.py","claude"],
   prompts:["Refactor hello.py: add type hints, a docstring and a main guard.","Now add a test file for hello.py and run it."],
   watchFor:"Does the todo list appear before the first edit? Is exactly one item in progress at a time? Are items marked completed as the work happens, or all at the end?",
   doneWhen:"Your evidence names how many todo items appeared, which one ran first, and when the last one was completed."
  },
  {
   id:"s05-sim",badge:"2",level:"required",timerMinutes:10,title:"Step the ConceptSim",
   goal:"Step the TodoWrite ConceptSim end to end and explain what the harness adds.",
   instructions:["Open the Lesson and scroll to the ConceptSim.","Step through it and stop where the reminder fires.","Write two sentences: what does the todo tool add to the s01 loop, and why does only one item run at a time?"],
   watchFor:"The reminder: what happens when the model goes several rounds without updating its plan?",
   doneWhen:"Mechanism explained in two sentences, no API key needed."
  },
  {
   id:"s05-run",badge:"3",level:"stretch",timerMinutes:20,title:"Run the s05 teaching harness",
   goal:"Run the small s05 agent from learn-claude-code with your own API key and compare it with Claude Code.",
   instructions:["Clone learn-claude-code and install its requirements (commands below).","Copy .env.example to .env and fill in your own ANTHROPIC_API_KEY and MODEL_ID. Never paste a key into chat or evidence.","Run the s05 agent and try the prompts below.","Open s05_todo_write/code.py and find where the reminder is injected."],
   run:["git clone https://github.com/shareAI-lab/learn-claude-code","cd learn-claude-code","pip install -r requirements.txt","cp .env.example .env","python s05_todo_write/code.py"],
   prompts:["Refactor s05_todo_write/example/hello.py: add type hints, docstrings, and a main guard","Create a Python package under s05_todo_write/example/demo_pkg with __init__.py, utils.py, and tests/test_utils.py","Review Python files under s05_todo_write/example and fix any style issues"],
   watchFor:"Was the first tool call todo_write? How many steps were listed? Did statuses move from pending to in_progress to completed during execution?",
   doneWhen:"Your evidence quotes the first tool call and the line in code.py where the reminder is added."
  }
 ],
 materials:[link('diagram',"TodoWrite overview","/diagrams/harness/s05-todo-overview.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s05 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s05_todo_write","Reference only — do not iframe learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s05-todo-overview.svg","TodoWrite overview","Plan then execute")],
 simTitles:{s05:"Concept sim · TodoWrite"},
 proof:["Todo list observed before Claude Code's first edit; item count and first active item recorded.","TodoWrite's addition to the s01 loop explained in two sentences after stepping the ConceptSim.","Optional harness run compares the first tool call and locates the reminder in code.py."],
 quiz:[question("What does todo_write change?",["The agent loop structure","Planning state only; other tools do the work","The permission gates"],1),question("Why remind after several tool rounds?",["To slow the model down","Because the plan can leave attention without updates","To force a subagent"],1),question("TodoWrite vs later Task System?",["They are identical","TodoWrite is a session checklist; Task System adds persisted dependencies","TodoWrite uses MCP"],1)],
 mission:{
  id:"HARNESS-S05",
  title:"Observe and explain TodoWrite",
  minutes:20,
  goal:"Observe TodoWrite before Claude Code acts, explain the mechanism in the ConceptSim, and optionally compare the s05 teaching harness.",
  allowed:["Use a scratch folder for the Claude Code task; no existing project files are needed.","The ConceptSim and first two tasks need no live model API.","The stretch run needs your own API key. Never paste keys into chat or evidence."],
  stop:"Stop before entering or sharing an API key. The first two tasks need no key. If clone, installation, or execution is unavailable, mark that stretch attempt OPEN; never invent output.",
  starterFiles:[],
  hints:["Look for Claude Code's todo list before its first edit and note the single in-progress item.","In the ConceptSim, watch for the reminder after several tool rounds without a plan update.","The optional harness run is a stretch; compare its first tool call and find the reminder injection in code.py."]
 },
 demo:{
  slides:[],
  script:["Show the s05 diagram, then step the ConceptSim.","Emphasize: no API key for the concept path — scenario is preauthored."],
  open:"Harness chapters teach via narrative + SVG + ConceptSim (no Worldline deck slides required)."
 },
 attribution:"Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code",
 openItems:[]
};

const nl = {
 title:"Harness · s05 TodoWrite",
 tag:'Harness',
 blurb:"Plan-then-execute — zet stappen op de lijst, voer daarna uit.",
 kicker:"Harness Engineering · s05",
 lessonTitle:"TodoWrite — een agent zonder plan dwaalt af",
 motto:"Een agent zonder plan waait met alle winden mee",
 leerdoel:"Observeer TodoWrite in Claude Code, leg uit wat de harness toevoegt en stap de ConceptSim; de optionele run gebruikt je eigen API-sleutel.",
 narrative:[
  "Geef de agent een complexe hernoem-en-testtaak en hij gaat improviseren: na een paar toolresultaten verwatert het oorspronkelijke doel in de context.",
  "TodoWrite voegt een planningstool toe op hetzelfde dispatch-pad. De checklist blijft zichtbaar; na enkele toolrondes zonder update herinnert de harness het model.",
  "todo_write werkt alleen planningsstatus bij — bestaande tools doen nog steeds het werk.",
  "Harness-laag: Planning — laat de agent denken voordat hij handelt."
 ],
 workedExample:"Mechanisme: TodoManager + todo_write + herinnering na N toolrondes zonder planupdate. De checklist verandert de planningsstatus; bestaande tools doen het werk.",
 loop:[{label:"Mechanisme",prompt:"Wat is de harness-laag van dit hoofdstuk?"},{label:"Signalen",prompt:"Welke runtime-signalen of tools zag je?"},{label:"Stappen",prompt:"Kun je de ConceptSim navertellen zonder API-sleutel?"},{label:"Contrast",prompt:"Hoe verschilt dit van het vorige hoofdstuk?"}],
 solo:[
  {
   id:"s05-see",badge:"1",level:"required",timerMinutes:10,title:"Bekijk TodoWrite in Claude Code",
   goal:"Geef Claude Code een taak met meerdere stappen en vang de todo-lijst op voordat het begint.",
   instructions:["Maak een tijdelijke map en een klein bestand om te refactoren (commando’s hieronder).","Start Claude Code in die map met `claude` en plak de eerste prompt.","Vóór de eerste wijziging toont Claude Code een todo-lijst. Tel de items en noteer welk item bezig is.","Plak de tweede prompt en let op hoe items van pending naar in progress naar completed gaan."],
   run:["mkdir -p ~/academy/s05 && cd ~/academy/s05","printf 'def add(a, b):\\n    return a + b\\n\\nprint(add(2, 3))\\n' > hello.py","claude"],
   prompts:["Refactor hello.py: voeg typehints, een docstring en een main-guard toe.","Voeg nu een testbestand voor hello.py toe en voer het uit."],
   watchFor:"Verschijnt de todo-lijst vóór de eerste wijziging? Is er steeds precies één item bezig? Worden items tijdens het werk voltooid of pas aan het einde?",
   doneWhen:"Je bewijs noemt hoeveel todo-items verschenen, welk item eerst bezig was en wanneer het laatste werd voltooid."
  },
  {
   id:"s05-sim",badge:"2",level:"required",timerMinutes:10,title:"Doorloop de ConceptSim",
   goal:"Doorloop de TodoWrite ConceptSim van begin tot eind en leg uit wat de harness toevoegt.",
   instructions:["Open de les en scrol naar de ConceptSim.","Doorloop de simulatie en stop waar de herinnering verschijnt.","Schrijf twee zinnen: wat voegt de todo-tool toe aan de s01-loop, en waarom is er steeds maar één item bezig?"],
   watchFor:"De herinnering: wat gebeurt er als het model meerdere rondes geen planupdate geeft?",
   doneWhen:"Het mechanisme uitgelegd in twee zinnen, zonder API-sleutel."
  },
  {
   id:"s05-run",badge:"3",level:"stretch",timerMinutes:20,title:"Voer de s05-les-harness uit",
   goal:"Voer de kleine s05-agent van learn-claude-code uit met je eigen API-sleutel en vergelijk die met Claude Code.",
   instructions:["Clone learn-claude-code en installeer de vereisten (commando’s hieronder).","Kopieer .env.example naar .env en vul je eigen ANTHROPIC_API_KEY en MODEL_ID in. Plak een sleutel nooit in chat of bewijs.","Voer de s05-agent uit en probeer de prompts hieronder.","Open s05_todo_write/code.py en zoek waar de herinnering wordt ingevoegd."],
   run:["git clone https://github.com/shareAI-lab/learn-claude-code","cd learn-claude-code","pip install -r requirements.txt","cp .env.example .env","python s05_todo_write/code.py"],
   prompts:["Refactor s05_todo_write/example/hello.py: voeg typehints, docstrings en een main-guard toe","Maak een Python-package onder s05_todo_write/example/demo_pkg met __init__.py, utils.py en tests/test_utils.py","Controleer de Python-bestanden onder s05_todo_write/example en los stijlproblemen op"],
   watchFor:"Was de eerste tool-aanroep todo_write? Hoeveel stappen stonden op de lijst? Veranderden statussen tijdens het werk van pending naar in_progress naar completed?",
   doneWhen:"Je bewijs citeert de eerste tool-aanroep en de regel in code.py waar de herinnering wordt toegevoegd."
  }
 ],
 materials:[link('diagram',"TodoWrite-overzicht","/diagrams/harness/s05-todo-overview.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s05 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s05_todo_write","Alleen referentie — geen iframe naar learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s05-todo-overview.svg","TodoWrite-overzicht","Eerst plannen, dan uitvoeren")],
 simTitles:{s05:"Concept-sim · TodoWrite"},
 proof:["Todo-lijst vóór Claude Code’s eerste wijziging gezien; aantal items en eerste actieve item genoteerd.","De toevoeging van TodoWrite aan de s01-loop in twee zinnen uitgelegd na de ConceptSim.","Optionele harness-run vergelijkt de eerste tool-aanroep en vindt de herinnering in code.py."],
 quiz:[question("Wat verandert todo_write?",["De structuur van de agent-loop","Alleen planningsstatus; andere tools doen het werk","De permissiepoorten"],1),question("Waarom herinneren na enkele toolrondes?",["Om het model te vertragen","Omdat het plan uit de aandacht kan verdwijnen zonder updates","Om een subagent te forceren"],1),question("TodoWrite versus later Task System?",["Ze zijn identiek","TodoWrite is sessiechecklist; Task System voegt bewaarde afhankelijkheden toe","TodoWrite gebruikt MCP"],1)],
 mission:{
  id:"HARNESS-S05",
  title:"Observeer en leg TodoWrite uit",
  minutes:20,
  goal:"Observeer TodoWrite voordat Claude Code begint, leg het mechanisme uit in de ConceptSim en vergelijk optioneel de s05-les-harness.",
  allowed:["Gebruik een tijdelijke map voor de Claude Code-taak; bestaande projectbestanden zijn niet nodig.","De ConceptSim en de eerste twee taken hebben geen live model-API nodig.","Voor de stretch-run is je eigen API-sleutel nodig. Plak nooit sleutels in chat of bewijs."],
  stop:"Stop voordat je een API-sleutel invult of deelt. De eerste twee taken hebben geen sleutel nodig. Als clonen, installeren of uitvoeren niet lukt, markeer die stretch-poging als OPEN; verzin geen uitvoer.",
  starterFiles:[],
  hints:["Let op Claude Codes todo-lijst vóór de eerste wijziging en noteer het enige actieve item.","Let in de ConceptSim op de herinnering na meerdere toolrondes zonder planupdate.","De optionele harness-run is een stretch; vergelijk de eerste tool-aanroep en zoek de herinneringsinjectie in code.py."]
 },
 demo:{
  slides:[],
  script:["Toon het s05-diagram en stap daarna de ConceptSim.","Benadruk: geen API-sleutel voor het conceptpad — scenario is voorgeprogrammeerd."],
  open:"Harness-hoofdstukken werken via narratief + SVG + ConceptSim (geen Worldline-deckdia’s vereist)."
 },
 attribution:"Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code",
 openItems:[]
};

export default {
 day:12,
 kind:'harness',
 deck:'harness',
 localeComplete:true,
 requireLocales:true,
 copy:{en,nl},
 // Structural defaults (EN) for lint / FAQ index
 ...en,
 sims:[{id:"s05",title:"Concept sim · TodoWrite"}],
 skipAutoDeckLink:true
};
