import {diagram,link,question} from './model.mjs';

const MIT_EN="Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code";
const MIT_NL="Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code";

const en = {
 title:"Harness · s16 Workflow Runtime",
 tag:'Harness',
 blurb:"Saved multi-agent scripts with a journal — model picks the workflow, host runs it.",
 kicker:"Harness Engineering · s16",
 lessonTitle:"Workflow Runtime — Script Orchestration Above the Loop",
 motto:"One tool_use runs an entire orchestration",
 leerdoel:"You explain the Workflow Runtime mechanism, state the motto, and step the ConceptSim without API keys.",
 narrative:[
  "Some procedures have a fixed shape even when the goal is open-ended (e.g. multi-lens review).",
  "The Workflow tool starts a recoverable script runtime that coordinates many agent calls.",
  "Lifecycle events and a journal checkpoint progress; the main loop can continue with the tool_result.",
  "Harness layer: Orchestration — run saved multi-agent scripts above the single-agent loop."
 ],
 workedExample:"Mechanism: Workflow tool → async script runtime → journal/checkpoints → tool_result back to messages[].",
 loop:[{label:"Mechanism",prompt:"What is the harness layer for this chapter?"},{label:"Signals",prompt:"Which runtime signals or tools did you observe?"},{label:"Step",prompt:"Can you narrate the ConceptSim without an API key?"},{label:"Contrast",prompt:"How does this differ from the previous chapter?"}],
 solo:[{id:"s16-motto",badge:"1",title:"State the motto",goal:"Write the s16 motto and name the harness layer.",doneWhen:"Motto and harness layer named."},{id:"s16-mech",badge:"2",title:"Name the mechanism",goal:"In two sentences, explain what this chapter adds to the loop.",doneWhen:"Mechanism explained without a slide wall."},{id:"s16-sim",badge:"3",title:"Step the ConceptSim",goal:"Step the Workflow Runtime ConceptSim end-to-end.",doneWhen:"You can narrate each step without an API key."}],
 materials:[link('diagram',"Workflow runtime overview","/diagrams/harness/s16-workflow-runtime-overview.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s16 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s16_workflow_runtime","Reference only — do not iframe learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s16-workflow-runtime-overview.svg","Workflow runtime overview","Script orchestration above the loop")],
 simTitles:{s16:"Concept sim · Workflow Runtime"},
 proof:["Motto and harness layer stated (s16).","Mechanism explained.","ConceptSim stepped without API keys."],
 quiz:[question("What does one Workflow tool_use start?",["A single bash command only","An entire recoverable orchestration script","A new UI locale"],1),question("Why a journal?",["Decoration","Checkpoint progress as the script runs","To replace permissions"],1),question("Who supplies trusted workflow metadata?",["The model invents it each time","The host registry","The SVG"],1)],
 mission:{
  id:"HARNESS-S16",
  title:"Explain and step Workflow Runtime",
  minutes:20,
  goal:"Name the s16 mechanism and step the ConceptSim end-to-end.",
  allowed:["Use the in-lesson diagram and ConceptSim only.","No live model API required for the concept path."],
  starterFiles:[],
  hints:["Use the diagram and ConceptSim only.","No live model API required for the concept path."]
 },
 demo:{
  slides:[],
  script:["Show the s16 diagram, then step the ConceptSim.","Emphasize: no API key for the concept path — scenario is preauthored."],
  open:"Harness chapters teach via narrative + SVG + ConceptSim (no Worldline deck slides required)."
 },
 attribution:"Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code",
 openItems:[]
};

const nl = {
 title:"Harness · s16 Workflow Runtime",
 tag:'Harness',
 blurb:"Opgeslagen multi-agent-scripts met journal — model kiest de workflow, host draait hem.",
 kicker:"Harness Engineering · s16",
 lessonTitle:"Workflow Runtime — scriptorkestratie boven de loop",
 motto:"Eén tool_use draait een hele orkestratie",
 leerdoel:"Je legt het mechanisme Workflow Runtime uit, noemt het motto, en stapt de ConceptSim zonder API-sleutels.",
 narrative:[
  "Sommige procedures hebben een vaste vorm, ook als het doel open is (bijv. review vanuit meerdere lenzen).",
  "De Workflow-tool start een herstelbare script-runtime die veel agentaanroepen coördineert.",
  "Lifecycle-events en een journal checkpointen voortgang; de hoofdloop kan doorgaan met het tool_result.",
  "Harness-laag: Orkestratie — draai opgeslagen multi-agent-scripts boven de single-agent-loop."
 ],
 workedExample:"Mechanisme: Workflow-tool → async script-runtime → journal/checkpoints → tool_result terug naar messages[].",
 loop:[{label:"Mechanisme",prompt:"Wat is de harness-laag van dit hoofdstuk?"},{label:"Signalen",prompt:"Welke runtime-signalen of tools zag je?"},{label:"Stappen",prompt:"Kun je de ConceptSim navertellen zonder API-sleutel?"},{label:"Contrast",prompt:"Hoe verschilt dit van het vorige hoofdstuk?"}],
 solo:[{id:"s16-motto",badge:"1",title:"Noem het motto",goal:"Schrijf het s16-motto en noem de harness-laag.",doneWhen:"Motto en harness-laag genoemd."},{id:"s16-mech",badge:"2",title:"Noem het mechanisme",goal:"Leg in twee zinnen uit wat dit hoofdstuk aan de loop toevoegt.",doneWhen:"Mechanisme uitgelegd zonder dia-muur."},{id:"s16-sim",badge:"3",title:"Stap de ConceptSim",goal:"Stap de Workflow Runtime ConceptSim van begin tot eind.",doneWhen:"Je kunt elke stap navertellen zonder API-sleutel."}],
 materials:[link('diagram',"Workflow-runtime-overzicht","/diagrams/harness/s16-workflow-runtime-overview.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s16 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s16_workflow_runtime","Alleen referentie — geen iframe naar learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s16-workflow-runtime-overview.svg","Workflow-runtime-overzicht","Scriptorkestratie boven de loop")],
 simTitles:{s16:"Concept-sim · Workflow Runtime"},
 proof:["Motto en harness-laag genoemd (s16).","Mechanisme uitgelegd.","ConceptSim gestapt zonder API-sleutels."],
 quiz:[question("Wat start één Workflow tool_use?",["Alleen één bash-commando","Een heel herstelbaar orkestratiescript","Een nieuwe UI-locale"],1),question("Waarom een journal?",["Decoratie","Voortgang checkpointen terwijl het script loopt","Om permissies te vervangen"],1),question("Wie levert vertrouwde workflow-metadata?",["Het model verzint die elke keer","Het host-register","De SVG"],1)],
 mission:{
  id:"HARNESS-S16",
  title:"Leg Workflow Runtime uit en stap het",
  minutes:20,
  goal:"Noem het s16-mechanisme en stap de ConceptSim van begin tot eind.",
  allowed:["Gebruik alleen het diagram en de ConceptSim in de les.","Geen live model-API nodig voor het conceptpad."],
  starterFiles:[],
  hints:["Gebruik alleen het diagram en de ConceptSim.","Geen live model-API nodig voor het conceptpad."]
 },
 demo:{
  slides:[],
  script:["Toon het s16-diagram en stap daarna de ConceptSim.","Benadruk: geen API-sleutel voor het conceptpad — scenario is voorgeprogrammeerd."],
  open:"Harness-hoofdstukken werken via narratief + SVG + ConceptSim (geen Worldline-deckdia’s vereist)."
 },
 attribution:"Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code",
 openItems:[]
};

export default {
 day:23,
 kind:'harness',
 deck:'harness',
 localeComplete:true,
 requireLocales:true,
 copy:{en,nl},
 // Structural defaults (EN) for lint / FAQ index
 ...en,
 sims:[{id:"s16",title:"Concept sim · Workflow Runtime"}],
 skipAutoDeckLink:true
};
