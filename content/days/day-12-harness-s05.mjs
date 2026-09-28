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
 leerdoel:"You explain the TodoWrite mechanism, state the motto, and step the ConceptSim without API keys.",
 narrative:[
  "Give the agent a complex rename-and-test task and it starts improvising: after a few tool results the original goal dilutes in context.",
  "TodoWrite adds a planning tool on the same dispatch path. The checklist stays visible; after several tool rounds without an update the harness reminds the model.",
  "todo_write only updates planning state — existing tools still do the work.",
  "Harness layer: Planning — let the agent think before it acts."
 ],
 workedExample:"Mechanism: TodoManager + todo_write + reminder after N tool rounds without a plan update. Motto: plan first, then execute.",
 loop:[{label:"Mechanism",prompt:"What is the harness layer for this chapter?"},{label:"Signals",prompt:"Which runtime signals or tools did you observe?"},{label:"Step",prompt:"Can you narrate the ConceptSim without an API key?"},{label:"Contrast",prompt:"How does this differ from the previous chapter?"}],
 solo:[{id:"s05-motto",badge:"1",title:"State the motto",goal:"Write the s05 motto and name the harness layer.",doneWhen:"Motto and harness layer named."},{id:"s05-mech",badge:"2",title:"Name the mechanism",goal:"In two sentences, explain what this chapter adds to the loop.",doneWhen:"Mechanism explained without a slide wall."},{id:"s05-sim",badge:"3",title:"Step the ConceptSim",goal:"Step the TodoWrite ConceptSim end-to-end.",doneWhen:"You can narrate each step without an API key."}],
 materials:[link('diagram',"TodoWrite overview","/diagrams/harness/s05-todo-overview.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s05 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s05_todo_write","Reference only — do not iframe learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s05-todo-overview.svg","TodoWrite overview","Plan then execute")],
 simTitles:{s05:"Concept sim · TodoWrite"},
 proof:["Motto and harness layer stated (s05).","Mechanism explained.","ConceptSim stepped without API keys."],
 quiz:[question("What does todo_write change?",["The agent loop structure","Planning state only; other tools do the work","The permission gates"],1),question("Why remind after several tool rounds?",["To slow the model down","Because the plan can leave attention without updates","To force a subagent"],1),question("TodoWrite vs later Task System?",["They are identical","TodoWrite is a session checklist; Task System adds persisted dependencies","TodoWrite uses MCP"],1)],
 mission:{
  id:"HARNESS-S05",
  title:"Explain and step TodoWrite",
  minutes:20,
  goal:"Name the s05 mechanism and step the ConceptSim end-to-end.",
  allowed:["Use the in-lesson diagram and ConceptSim only.","No live model API required for the concept path."],
  starterFiles:[],
  hints:["Use the diagram and ConceptSim only.","No live model API required for the concept path."]
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
 leerdoel:"Je legt het mechanisme TodoWrite uit, noemt het motto, en stapt de ConceptSim zonder API-sleutels.",
 narrative:[
  "Geef de agent een complexe hernoem-en-testtaak en hij gaat improviseren: na een paar toolresultaten verwatert het oorspronkelijke doel in de context.",
  "TodoWrite voegt een planningstool toe op hetzelfde dispatch-pad. De checklist blijft zichtbaar; na enkele toolrondes zonder update herinnert de harness het model.",
  "todo_write werkt alleen planningsstatus bij — bestaande tools doen nog steeds het werk.",
  "Harness-laag: Planning — laat de agent denken voordat hij handelt."
 ],
 workedExample:"Mechanisme: TodoManager + todo_write + herinnering na N toolrondes zonder planupdate. Motto: eerst plannen, dan uitvoeren.",
 loop:[{label:"Mechanisme",prompt:"Wat is de harness-laag van dit hoofdstuk?"},{label:"Signalen",prompt:"Welke runtime-signalen of tools zag je?"},{label:"Stappen",prompt:"Kun je de ConceptSim navertellen zonder API-sleutel?"},{label:"Contrast",prompt:"Hoe verschilt dit van het vorige hoofdstuk?"}],
 solo:[{id:"s05-motto",badge:"1",title:"Noem het motto",goal:"Schrijf het s05-motto en noem de harness-laag.",doneWhen:"Motto en harness-laag genoemd."},{id:"s05-mech",badge:"2",title:"Noem het mechanisme",goal:"Leg in twee zinnen uit wat dit hoofdstuk aan de loop toevoegt.",doneWhen:"Mechanisme uitgelegd zonder dia-muur."},{id:"s05-sim",badge:"3",title:"Stap de ConceptSim",goal:"Stap de TodoWrite ConceptSim van begin tot eind.",doneWhen:"Je kunt elke stap navertellen zonder API-sleutel."}],
 materials:[link('diagram',"TodoWrite-overzicht","/diagrams/harness/s05-todo-overview.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s05 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s05_todo_write","Alleen referentie — geen iframe naar learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s05-todo-overview.svg","TodoWrite-overzicht","Eerst plannen, dan uitvoeren")],
 simTitles:{s05:"Concept-sim · TodoWrite"},
 proof:["Motto en harness-laag genoemd (s05).","Mechanisme uitgelegd.","ConceptSim gestapt zonder API-sleutels."],
 quiz:[question("Wat verandert todo_write?",["De structuur van de agent-loop","Alleen planningsstatus; andere tools doen het werk","De permissiepoorten"],1),question("Waarom herinneren na enkele toolrondes?",["Om het model te vertragen","Omdat het plan uit de aandacht kan verdwijnen zonder updates","Om een subagent te forceren"],1),question("TodoWrite versus later Task System?",["Ze zijn identiek","TodoWrite is sessiechecklist; Task System voegt bewaarde afhankelijkheden toe","TodoWrite gebruikt MCP"],1)],
 mission:{
  id:"HARNESS-S05",
  title:"Leg TodoWrite uit en stap het",
  minutes:20,
  goal:"Noem het s05-mechanisme en stap de ConceptSim van begin tot eind.",
  allowed:["Gebruik alleen het diagram en de ConceptSim in de les.","Geen live model-API nodig voor het conceptpad."],
  starterFiles:[],
  hints:["Gebruik alleen het diagram en de ConceptSim.","Geen live model-API nodig voor het conceptpad."]
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
