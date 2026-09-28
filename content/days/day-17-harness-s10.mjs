import {diagram,link,question} from './model.mjs';

const MIT_EN="Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code";
const MIT_NL="Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code";

const en = {
 title:"Harness · s10 Task System",
 tag:'Harness',
 blurb:"File-persisted task graph — blockedBy, owner, recoverable progress.",
 kicker:"Harness Engineering · s10",
 lessonTitle:"Task System — From Checklist to Coordinated Task State",
 motto:"Break big goals into small tasks, order them, persist",
 leerdoel:"You explain the Task System mechanism, state the motto, and step the ConceptSim without API keys.",
 narrative:[
  "TodoWrite tracks the current checklist but not dependencies or ownership across sessions.",
  "The Task System adds IDs, status, blockedBy, and owner, persisted under .tasks/.",
  "Claim fails while blocked; completing a prerequisite can unblock downstream work.",
  "Harness layer: Tasks — persisted goals, recoverable progress."
 ],
 workedExample:"Mechanism: create/update/claim/complete task tools + .tasks/{id}.json + blockedBy checks.",
 loop:[{label:"Mechanism",prompt:"What is the harness layer for this chapter?"},{label:"Signals",prompt:"Which runtime signals or tools did you observe?"},{label:"Step",prompt:"Can you narrate the ConceptSim without an API key?"},{label:"Contrast",prompt:"How does this differ from the previous chapter?"}],
 solo:[{id:"s10-motto",badge:"1",title:"State the motto",goal:"Write the s10 motto and name the harness layer.",doneWhen:"Motto and harness layer named."},{id:"s10-mech",badge:"2",title:"Name the mechanism",goal:"In two sentences, explain what this chapter adds to the loop.",doneWhen:"Mechanism explained without a slide wall."},{id:"s10-sim",badge:"3",title:"Step the ConceptSim",goal:"Step the Task System ConceptSim end-to-end.",doneWhen:"You can narrate each step without an API key."}],
 materials:[link('diagram',"Task system overview","/diagrams/harness/s10-task-system-overview.svg","EN SVG · MIT shareAI Lab"),link('diagram',"Task DAG","/diagrams/harness/s10-task-dag.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s10 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s10_task_system","Reference only — do not iframe learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s10-task-system-overview.svg","Task system overview","Persisted goals and blockedBy"),diagram("/diagrams/harness/s10-task-dag.svg","Task DAG","Dependencies between tasks")],
 simTitles:{s10:"Concept sim · Task System"},
 proof:["Motto and harness layer stated (s10).","Mechanism explained.","ConceptSim stepped without API keys."],
 quiz:[question("What does blockedBy record?",["Slide numbers","Prerequisite task IDs","MCP server names"],1),question("Where is task state persisted?",["Only in messages[]","In .tasks/{id}.json on disk","In the SVG"],1),question("TodoWrite vs Task System?",["Identical","Checklist vs persisted dependency graph with ownership","Task System removes tools"],1)],
 mission:{
  id:"HARNESS-S10",
  title:"Explain and step Task System",
  minutes:20,
  goal:"Name the s10 mechanism and step the ConceptSim end-to-end.",
  allowed:["Use the in-lesson diagram and ConceptSim only.","No live model API required for the concept path."],
  starterFiles:[],
  hints:["Use the diagram and ConceptSim only.","No live model API required for the concept path."]
 },
 demo:{
  slides:[],
  script:["Show the s10 diagram, then step the ConceptSim.","Emphasize: no API key for the concept path — scenario is preauthored."],
  open:"Harness chapters teach via narrative + SVG + ConceptSim (no Worldline deck slides required)."
 },
 attribution:"Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code",
 openItems:[]
};

const nl = {
 title:"Harness · s10 Task System",
 tag:'Harness',
 blurb:"Op schijf bewaarde task-grafiek — blockedBy, owner, herstelbare voortgang.",
 kicker:"Harness Engineering · s10",
 lessonTitle:"Task System — van checklist naar gecoördineerde task-status",
 motto:"Breek grote doelen in kleine taken, orden ze, bewaar ze",
 leerdoel:"Je legt het mechanisme Task System uit, noemt het motto, en stapt de ConceptSim zonder API-sleutels.",
 narrative:[
  "TodoWrite volgt de huidige checklist maar niet afhankelijkheden of eigenaarschap over sessies.",
  "Het Task System voegt IDs, status, blockedBy en owner toe, bewaard onder .tasks/.",
  "Claim faalt zolang geblokkeerd; afronden van een voorwaarde kan downstream deblokkeren.",
  "Harness-laag: Tasks — bewaarde doelen, herstelbare voortgang."
 ],
 workedExample:"Mechanisme: create/update/claim/complete task-tools + .tasks/{id}.json + blockedBy-checks.",
 loop:[{label:"Mechanisme",prompt:"Wat is de harness-laag van dit hoofdstuk?"},{label:"Signalen",prompt:"Welke runtime-signalen of tools zag je?"},{label:"Stappen",prompt:"Kun je de ConceptSim navertellen zonder API-sleutel?"},{label:"Contrast",prompt:"Hoe verschilt dit van het vorige hoofdstuk?"}],
 solo:[{id:"s10-motto",badge:"1",title:"Noem het motto",goal:"Schrijf het s10-motto en noem de harness-laag.",doneWhen:"Motto en harness-laag genoemd."},{id:"s10-mech",badge:"2",title:"Noem het mechanisme",goal:"Leg in twee zinnen uit wat dit hoofdstuk aan de loop toevoegt.",doneWhen:"Mechanisme uitgelegd zonder dia-muur."},{id:"s10-sim",badge:"3",title:"Stap de ConceptSim",goal:"Stap de Task System ConceptSim van begin tot eind.",doneWhen:"Je kunt elke stap navertellen zonder API-sleutel."}],
 materials:[link('diagram',"Task-system-overzicht","/diagrams/harness/s10-task-system-overview.svg","EN SVG · MIT shareAI Lab"),link('diagram',"Task-DAG","/diagrams/harness/s10-task-dag.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s10 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s10_task_system","Alleen referentie — geen iframe naar learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s10-task-system-overview.svg","Task-system-overzicht","Bewaarde doelen en blockedBy"),diagram("/diagrams/harness/s10-task-dag.svg","Task-DAG","Afhankelijkheden tussen taken")],
 simTitles:{s10:"Concept-sim · Task System"},
 proof:["Motto en harness-laag genoemd (s10).","Mechanisme uitgelegd.","ConceptSim gestapt zonder API-sleutels."],
 quiz:[question("Wat legt blockedBy vast?",["Dianummers","IDs van voorwaardetaken","MCP-servernamen"],1),question("Waar blijft task-status bewaard?",["Alleen in messages[]","In .tasks/{id}.json op schijf","In de SVG"],1),question("TodoWrite versus Task System?",["Identiek","Checklist versus bewaarde dependency-grafiek met eigenaarschap","Task System verwijdert tools"],1)],
 mission:{
  id:"HARNESS-S10",
  title:"Leg Task System uit en stap het",
  minutes:20,
  goal:"Noem het s10-mechanisme en stap de ConceptSim van begin tot eind.",
  allowed:["Gebruik alleen het diagram en de ConceptSim in de les.","Geen live model-API nodig voor het conceptpad."],
  starterFiles:[],
  hints:["Gebruik alleen het diagram en de ConceptSim.","Geen live model-API nodig voor het conceptpad."]
 },
 demo:{
  slides:[],
  script:["Toon het s10-diagram en stap daarna de ConceptSim.","Benadruk: geen API-sleutel voor het conceptpad — scenario is voorgeprogrammeerd."],
  open:"Harness-hoofdstukken werken via narratief + SVG + ConceptSim (geen Worldline-deckdia’s vereist)."
 },
 attribution:"Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code",
 openItems:[]
};

export default {
 day:17,
 kind:'harness',
 deck:'harness',
 localeComplete:true,
 requireLocales:true,
 copy:{en,nl},
 // Structural defaults (EN) for lint / FAQ index
 ...en,
 sims:[{id:"s10",title:"Concept sim · Task System"}],
 skipAutoDeckLink:true
};
