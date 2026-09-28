import {diagram,link,question} from './model.mjs';

const MIT_EN="Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code";
const MIT_NL="Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code";

const en = {
 title:"Harness · s17 Goal Loop",
 tag:'Harness',
 blurb:"Independent stop evaluation — unfinished work returns through the same loop.",
 kicker:"Harness Engineering · s17",
 lessonTitle:"Goal Loop — Independent Stop Evaluation",
 motto:"The model may want to stop; a separate evaluator decides if the goal is done",
 leerdoel:"You explain the Goal Loop mechanism, state the motto, and step the ConceptSim without API keys.",
 narrative:[
  "No more tool_use means one turn wants to stop — not that the whole goal is complete.",
  "An independent evaluator reads the conversation and may block stop, appending a continue reason.",
  "The same while True continues until the evaluator reports the goal achieved.",
  "Harness layer: Goal evaluation — separate stop judgment from the model's turn-ending habit."
 ],
 workedExample:"Mechanism: /goal stores completion condition; on Stop, evaluator ok? → clear goal : append reason and continue.",
 loop:[{label:"Mechanism",prompt:"What is the harness layer for this chapter?"},{label:"Signals",prompt:"Which runtime signals or tools did you observe?"},{label:"Step",prompt:"Can you narrate the ConceptSim without an API key?"},{label:"Contrast",prompt:"How does this differ from the previous chapter?"}],
 solo:[{id:"s17-motto",badge:"1",title:"State the motto",goal:"Write the s17 motto and name the harness layer.",doneWhen:"Motto and harness layer named."},{id:"s17-mech",badge:"2",title:"Name the mechanism",goal:"In two sentences, explain what this chapter adds to the loop.",doneWhen:"Mechanism explained without a slide wall."},{id:"s17-sim",badge:"3",title:"Step the ConceptSim",goal:"Step the Goal Loop ConceptSim end-to-end.",doneWhen:"You can narrate each step without an API key."}],
 materials:[link('diagram',"Goal loop overview","/diagrams/harness/s17-goal-loop-overview.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s17 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s17_goal_loop","Reference only — do not iframe learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s17-goal-loop-overview.svg","Goal loop overview","Independent stop evaluation")],
 simTitles:{s17:"Concept sim · Goal Loop"},
 proof:["Motto and harness layer stated (s17).","Mechanism explained.","ConceptSim stepped without API keys."],
 quiz:[question("What does no tool_use mean?",["The whole goal is always done","This turn wants to stop; the evaluator may disagree","Cron must fire"],1),question("Who decides goal completion?",["Only the model text","An independent evaluator reading the conversation","The SVG"],1),question("Where does unfinished work go?",["A separate queue always","Back through the same agent loop with a continue reason","Into Linear Done"],1)],
 mission:{
  id:"HARNESS-S17",
  title:"Explain and step Goal Loop",
  minutes:20,
  goal:"Name the s17 mechanism and step the ConceptSim end-to-end.",
  allowed:["Use the in-lesson diagram and ConceptSim only.","No live model API required for the concept path."],
  starterFiles:[],
  hints:["Use the diagram and ConceptSim only.","No live model API required for the concept path."]
 },
 demo:{
  slides:[],
  script:["Show the s17 diagram, then step the ConceptSim.","Emphasize: no API key for the concept path — scenario is preauthored."],
  open:"Harness chapters teach via narrative + SVG + ConceptSim (no Worldline deck slides required)."
 },
 attribution:"Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code",
 openItems:[]
};

const nl = {
 title:"Harness · s17 Goal Loop",
 tag:'Harness',
 blurb:"Onafhankelijke stop-evaluatie — onvoltooid werk keert terug via dezelfde loop.",
 kicker:"Harness Engineering · s17",
 lessonTitle:"Goal Loop — onafhankelijke stop-evaluatie",
 motto:"Het model wil misschien stoppen; een aparte evaluator bepaalt of het doel klaar is",
 leerdoel:"Je legt het mechanisme Goal Loop uit, noemt het motto, en stapt de ConceptSim zonder API-sleutels.",
 narrative:[
  "Geen tool_use meer betekent dat één beurt wil stoppen — niet dat het hele doel klaar is.",
  "Een onafhankelijke evaluator leest het gesprek en kan stop blokkeren, met een doorgaan-reden.",
  "Dezelfde while True gaat door tot de evaluator rapporteert dat het doel is bereikt.",
  "Harness-laag: Doel-evaluatie — scheid stopoordeel van de stopgewoonte van het model."
 ],
 workedExample:"Mechanisme: /goal bewaart voltooiingsvoorwaarde; bij Stop, evaluator ok? → wis doel : voeg reden toe en ga door.",
 loop:[{label:"Mechanisme",prompt:"Wat is de harness-laag van dit hoofdstuk?"},{label:"Signalen",prompt:"Welke runtime-signalen of tools zag je?"},{label:"Stappen",prompt:"Kun je de ConceptSim navertellen zonder API-sleutel?"},{label:"Contrast",prompt:"Hoe verschilt dit van het vorige hoofdstuk?"}],
 solo:[{id:"s17-motto",badge:"1",title:"Noem het motto",goal:"Schrijf het s17-motto en noem de harness-laag.",doneWhen:"Motto en harness-laag genoemd."},{id:"s17-mech",badge:"2",title:"Noem het mechanisme",goal:"Leg in twee zinnen uit wat dit hoofdstuk aan de loop toevoegt.",doneWhen:"Mechanisme uitgelegd zonder dia-muur."},{id:"s17-sim",badge:"3",title:"Stap de ConceptSim",goal:"Stap de Goal Loop ConceptSim van begin tot eind.",doneWhen:"Je kunt elke stap navertellen zonder API-sleutel."}],
 materials:[link('diagram',"Goal-loop-overzicht","/diagrams/harness/s17-goal-loop-overview.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s17 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s17_goal_loop","Alleen referentie — geen iframe naar learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s17-goal-loop-overview.svg","Goal-loop-overzicht","Onafhankelijke stop-evaluatie")],
 simTitles:{s17:"Concept-sim · Goal Loop"},
 proof:["Motto en harness-laag genoemd (s17).","Mechanisme uitgelegd.","ConceptSim gestapt zonder API-sleutels."],
 quiz:[question("Wat betekent geen tool_use?",["Het hele doel is altijd klaar","Deze beurt wil stoppen; de evaluator kan het oneens zijn","Cron moet afgaan"],1),question("Wie bepaalt of het doel klaar is?",["Alleen de modeltekst","Een onafhankelijke evaluator die het gesprek leest","De SVG"],1),question("Waar gaat onvoltooid werk heen?",["Altijd een aparte wachtrij","Terug door dezelfde agent-loop met een doorgaan-reden","Naar Linear Done"],1)],
 mission:{
  id:"HARNESS-S17",
  title:"Leg Goal Loop uit en stap het",
  minutes:20,
  goal:"Noem het s17-mechanisme en stap de ConceptSim van begin tot eind.",
  allowed:["Gebruik alleen het diagram en de ConceptSim in de les.","Geen live model-API nodig voor het conceptpad."],
  starterFiles:[],
  hints:["Gebruik alleen het diagram en de ConceptSim.","Geen live model-API nodig voor het conceptpad."]
 },
 demo:{
  slides:[],
  script:["Toon het s17-diagram en stap daarna de ConceptSim.","Benadruk: geen API-sleutel voor het conceptpad — scenario is voorgeprogrammeerd."],
  open:"Harness-hoofdstukken werken via narratief + SVG + ConceptSim (geen Worldline-deckdia’s vereist)."
 },
 attribution:"Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code",
 openItems:[]
};

export default {
 day:24,
 kind:'harness',
 deck:'harness',
 localeComplete:true,
 requireLocales:true,
 copy:{en,nl},
 // Structural defaults (EN) for lint / FAQ index
 ...en,
 sims:[{id:"s17",title:"Concept sim · Goal Loop"}],
 skipAutoDeckLink:true
};
