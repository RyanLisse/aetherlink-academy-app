import {diagram,link,question} from './model.mjs';

const MIT_EN="Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code";
const MIT_NL="Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code";

const en = {
 title:"Harness · s11 Background Tasks",
 tag:'Harness',
 blurb:"Threaded bash with notifications — placeholder result first, collect later.",
 kicker:"Harness Engineering · s11",
 lessonTitle:"Background Tasks — Slow Operations Go to the Background",
 motto:"Slow operations go to the background; the agent loop continues",
 leerdoel:"You explain the Background Tasks mechanism, state the motto, and step the ConceptSim without API keys.",
 narrative:[
  "Full test suites and installs can block the loop for minutes.",
  "run_in_background returns a bg_id placeholder so the loop can continue other work.",
  "Completed results arrive as notifications on a later turn.",
  "Harness layer: Background — async execution that does not block the main loop."
 ],
 workedExample:"Mechanism: bash run_in_background → thread + bg_id tool_result → later bg_notify into messages.",
 loop:[{label:"Mechanism",prompt:"What is the harness layer for this chapter?"},{label:"Signals",prompt:"Which runtime signals or tools did you observe?"},{label:"Step",prompt:"Can you narrate the ConceptSim without an API key?"},{label:"Contrast",prompt:"How does this differ from the previous chapter?"}],
 solo:[{id:"s11-motto",badge:"1",title:"State the motto",goal:"Write the s11 motto and name the harness layer.",doneWhen:"Motto and harness layer named."},{id:"s11-mech",badge:"2",title:"Name the mechanism",goal:"In two sentences, explain what this chapter adds to the loop.",doneWhen:"Mechanism explained without a slide wall."},{id:"s11-sim",badge:"3",title:"Step the ConceptSim",goal:"Step the Background Tasks ConceptSim end-to-end.",doneWhen:"You can narrate each step without an API key."}],
 materials:[link('diagram',"Background tasks overview","/diagrams/harness/s11-background-tasks-overview.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s11 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s11_background_tasks","Reference only — do not iframe learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s11-background-tasks-overview.svg","Background tasks overview","Slow work off the main loop")],
 simTitles:{s11:"Concept sim · Background Tasks"},
 proof:["Motto and harness layer stated (s11).","Mechanism explained.","ConceptSim stepped without API keys."],
 quiz:[question("What does the first tool_result contain for background bash?",["Full test output","A placeholder with bg_id","Nothing"],1),question("When do completed results appear?",["Never","As notifications on a later turn","Only in Stop hooks"],1),question("Why background slow commands?",["To skip permissions","So the agent loop can continue unrelated work","To delete the task graph"],1)],
 mission:{
  id:"HARNESS-S11",
  title:"Explain and step Background Tasks",
  minutes:20,
  goal:"Name the s11 mechanism and step the ConceptSim end-to-end.",
  allowed:["Use the in-lesson diagram and ConceptSim only.","No live model API required for the concept path."],
  starterFiles:[],
  hints:["Use the diagram and ConceptSim only.","No live model API required for the concept path."]
 },
 demo:{
  slides:[],
  script:["Show the s11 diagram, then step the ConceptSim.","Emphasize: no API key for the concept path — scenario is preauthored."],
  open:"Harness chapters teach via narrative + SVG + ConceptSim (no Worldline deck slides required)."
 },
 attribution:"Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code",
 openItems:[]
};

const nl = {
 title:"Harness · s11 Achtergrondtaken",
 tag:'Harness',
 blurb:"Threaded bash met notificaties — eerst voorlopig resultaat, later ophalen.",
 kicker:"Harness Engineering · s11",
 lessonTitle:"Achtergrondtaken — trage operaties gaan naar de achtergrond",
 motto:"Trage operaties gaan naar de achtergrond; de agent-loop gaat door",
 leerdoel:"Je legt het mechanisme Achtergrondtaken uit, noemt het motto, en stapt de ConceptSim zonder API-sleutels.",
 narrative:[
  "Volledige testsuites en installs kunnen de loop minuten blokkeren.",
  "run_in_background geeft een voorlopig bg_id-resultaat terug zodat de loop ander werk kan doen.",
  "Voltooide resultaten komen als notificaties in een latere beurt.",
  "Harness-laag: Achtergrond — asynchrone uitvoering die de hoofdloop niet blokkeert."
 ],
 workedExample:"Mechanisme: bash run_in_background → thread + bg_id tool_result → later bg_notify in messages.",
 loop:[{label:"Mechanisme",prompt:"Wat is de harness-laag van dit hoofdstuk?"},{label:"Signalen",prompt:"Welke runtime-signalen of tools zag je?"},{label:"Stappen",prompt:"Kun je de ConceptSim navertellen zonder API-sleutel?"},{label:"Contrast",prompt:"Hoe verschilt dit van het vorige hoofdstuk?"}],
 solo:[{id:"s11-motto",badge:"1",title:"Noem het motto",goal:"Schrijf het s11-motto en noem de harness-laag.",doneWhen:"Motto en harness-laag genoemd."},{id:"s11-mech",badge:"2",title:"Noem het mechanisme",goal:"Leg in twee zinnen uit wat dit hoofdstuk aan de loop toevoegt.",doneWhen:"Mechanisme uitgelegd zonder dia-muur."},{id:"s11-sim",badge:"3",title:"Stap de ConceptSim",goal:"Stap de Achtergrondtaken ConceptSim van begin tot eind.",doneWhen:"Je kunt elke stap navertellen zonder API-sleutel."}],
 materials:[link('diagram',"Achtergrondtaken-overzicht","/diagrams/harness/s11-background-tasks-overview.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s11 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s11_background_tasks","Alleen referentie — geen iframe naar learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s11-background-tasks-overview.svg","Achtergrondtaken-overzicht","Traag werk naast de hoofdloop")],
 simTitles:{s11:"Concept-sim · Achtergrondtaken"},
 proof:["Motto en harness-laag genoemd (s11).","Mechanisme uitgelegd.","ConceptSim gestapt zonder API-sleutels."],
 quiz:[question("Wat bevat het eerste tool_result bij achtergrond-bash?",["Volledige testuitvoer","Een voorlopig resultaat met bg_id","Niets"],1),question("Wanneer verschijnen voltooide resultaten?",["Nooit","Als notificaties in een latere beurt","Alleen in Stop-hooks"],1),question("Waarom trage commando’s naar de achtergrond?",["Om permissies over te slaan","Zodat de agent-loop ander werk kan voortzetten","Om de task-grafiek te wissen"],1)],
 mission:{
  id:"HARNESS-S11",
  title:"Leg Achtergrondtaken uit en stap het",
  minutes:20,
  goal:"Noem het s11-mechanisme en stap de ConceptSim van begin tot eind.",
  allowed:["Gebruik alleen het diagram en de ConceptSim in de les.","Geen live model-API nodig voor het conceptpad."],
  starterFiles:[],
  hints:["Gebruik alleen het diagram en de ConceptSim.","Geen live model-API nodig voor het conceptpad."]
 },
 demo:{
  slides:[],
  script:["Toon het s11-diagram en stap daarna de ConceptSim.","Benadruk: geen API-sleutel voor het conceptpad — scenario is voorgeprogrammeerd."],
  open:"Harness-hoofdstukken werken via narratief + SVG + ConceptSim (geen Worldline-deckdia’s vereist)."
 },
 attribution:"Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code",
 openItems:[]
};

export default {
 day:18,
 kind:'harness',
 deck:'harness',
 localeComplete:true,
 requireLocales:true,
 copy:{en,nl},
 // Structural defaults (EN) for lint / FAQ index
 ...en,
 sims:[{id:"s11",title:"Concept sim · Background Tasks"}],
 skipAutoDeckLink:true
};
