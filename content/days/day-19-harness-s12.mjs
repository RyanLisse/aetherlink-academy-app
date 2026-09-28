import {diagram,link,question} from './model.mjs';

const MIT_EN="Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code";
const MIT_NL="Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code";

const en = {
 title:"Harness · s12 Cron Scheduler",
 tag:'Harness',
 blurb:"Durable scheduling — cron expression + prompt → queue → agent turn.",
 kicker:"Harness Engineering · s12",
 lessonTitle:"Cron Scheduler — Start Work on a Schedule",
 motto:"Store the schedule; deliver the prompt when the agent is idle",
 leerdoel:"You explain the Cron Scheduler mechanism, state the motto, and step the ConceptSim without API keys.",
 narrative:[
  "Background tasks run a command that already started; cron decides when future work should begin.",
  "schedule_cron stores expression + prompt; at match time the scheduler enqueues a pending prompt.",
  "The queue processor waits until the agent is idle, then starts a normal agent-loop turn.",
  "Harness layer: Scheduling — durable prompts that start work later."
 ],
 workedExample:"Mechanism: CronJob store + scheduler thread + cron_queue + idle delivery into the agent loop.",
 loop:[{label:"Mechanism",prompt:"What is the harness layer for this chapter?"},{label:"Signals",prompt:"Which runtime signals or tools did you observe?"},{label:"Step",prompt:"Can you narrate the ConceptSim without an API key?"},{label:"Contrast",prompt:"How does this differ from the previous chapter?"}],
 solo:[{id:"s12-motto",badge:"1",title:"State the motto",goal:"Write the s12 motto and name the harness layer.",doneWhen:"Motto and harness layer named."},{id:"s12-mech",badge:"2",title:"Name the mechanism",goal:"In two sentences, explain what this chapter adds to the loop.",doneWhen:"Mechanism explained without a slide wall."},{id:"s12-sim",badge:"3",title:"Step the ConceptSim",goal:"Step the Cron Scheduler ConceptSim end-to-end.",doneWhen:"You can narrate each step without an API key."}],
 materials:[link('diagram',"Cron scheduler overview","/diagrams/harness/s12-cron-scheduler-overview.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s12 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s12_cron_scheduler","Reference only — do not iframe learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s12-cron-scheduler-overview.svg","Cron scheduler overview","Start work on a schedule")],
 simTitles:{s12:"Concept sim · Cron Scheduler"},
 proof:["Motto and harness layer stated (s12).","Mechanism explained.","ConceptSim stepped without API keys."],
 quiz:[question("What does cron store?",["Only exit codes","A schedule expression and a prompt","SVG paths"],1),question("When is the prompt delivered?",["Immediately always","When due and the agent is idle","Only on Stop"],1),question("Cron vs background tasks?",["Identical","Cron starts future work; background runs an already-started command","Cron deletes tools"],1)],
 mission:{
  id:"HARNESS-S12",
  title:"Explain and step Cron Scheduler",
  minutes:20,
  goal:"Name the s12 mechanism and step the ConceptSim end-to-end.",
  allowed:["Use the in-lesson diagram and ConceptSim only.","No live model API required for the concept path."],
  starterFiles:[],
  hints:["Use the diagram and ConceptSim only.","No live model API required for the concept path."]
 },
 demo:{
  slides:[],
  script:["Show the s12 diagram, then step the ConceptSim.","Emphasize: no API key for the concept path — scenario is preauthored."],
  open:"Harness chapters teach via narrative + SVG + ConceptSim (no Worldline deck slides required)."
 },
 attribution:"Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code",
 openItems:[]
};

const nl = {
 title:"Harness · s12 Cron Scheduler",
 tag:'Harness',
 blurb:"Duurzame planning — cron-expressie + prompt → wachtrij → agentbeurt.",
 kicker:"Harness Engineering · s12",
 lessonTitle:"Cron Scheduler — start werk op schema",
 motto:"Bewaar het schema; lever de prompt wanneer de agent idle is",
 leerdoel:"Je legt het mechanisme Cron Scheduler uit, noemt het motto, en stapt de ConceptSim zonder API-sleutels.",
 narrative:[
  "Achtergrondtaken draaien een commando dat al gestart is; cron beslist wanneer toekomstig werk moet beginnen.",
  "schedule_cron bewaart expressie + prompt; bij een match zet de scheduler een pending prompt in de wachtrij.",
  "De queue-processor wacht tot de agent idle is en start dan een normale agent-loopbeurt.",
  "Harness-laag: Planning — duurzame prompts die later werk starten."
 ],
 workedExample:"Mechanisme: CronJob-opslag + scheduler-thread + cron_queue + idle-levering in de agent-loop.",
 loop:[{label:"Mechanisme",prompt:"Wat is de harness-laag van dit hoofdstuk?"},{label:"Signalen",prompt:"Welke runtime-signalen of tools zag je?"},{label:"Stappen",prompt:"Kun je de ConceptSim navertellen zonder API-sleutel?"},{label:"Contrast",prompt:"Hoe verschilt dit van het vorige hoofdstuk?"}],
 solo:[{id:"s12-motto",badge:"1",title:"Noem het motto",goal:"Schrijf het s12-motto en noem de harness-laag.",doneWhen:"Motto en harness-laag genoemd."},{id:"s12-mech",badge:"2",title:"Noem het mechanisme",goal:"Leg in twee zinnen uit wat dit hoofdstuk aan de loop toevoegt.",doneWhen:"Mechanisme uitgelegd zonder dia-muur."},{id:"s12-sim",badge:"3",title:"Stap de ConceptSim",goal:"Stap de Cron Scheduler ConceptSim van begin tot eind.",doneWhen:"Je kunt elke stap navertellen zonder API-sleutel."}],
 materials:[link('diagram',"Cron-scheduler-overzicht","/diagrams/harness/s12-cron-scheduler-overview.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s12 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s12_cron_scheduler","Alleen referentie — geen iframe naar learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s12-cron-scheduler-overview.svg","Cron-scheduler-overzicht","Start werk op schema")],
 simTitles:{s12:"Concept-sim · Cron Scheduler"},
 proof:["Motto en harness-laag genoemd (s12).","Mechanisme uitgelegd.","ConceptSim gestapt zonder API-sleutels."],
 quiz:[question("Wat bewaart cron?",["Alleen exitcodes","Een schema-expressie en een prompt","SVG-paden"],1),question("Wanneer wordt de prompt geleverd?",["Altijd meteen","Wanneer due en de agent idle is","Alleen bij Stop"],1),question("Cron versus achtergrondtaken?",["Identiek","Cron start toekomstig werk; achtergrond draait een al gestart commando","Cron verwijdert tools"],1)],
 mission:{
  id:"HARNESS-S12",
  title:"Leg Cron Scheduler uit en stap het",
  minutes:20,
  goal:"Noem het s12-mechanisme en stap de ConceptSim van begin tot eind.",
  allowed:["Gebruik alleen het diagram en de ConceptSim in de les.","Geen live model-API nodig voor het conceptpad."],
  starterFiles:[],
  hints:["Gebruik alleen het diagram en de ConceptSim.","Geen live model-API nodig voor het conceptpad."]
 },
 demo:{
  slides:[],
  script:["Toon het s12-diagram en stap daarna de ConceptSim.","Benadruk: geen API-sleutel voor het conceptpad — scenario is voorgeprogrammeerd."],
  open:"Harness-hoofdstukken werken via narratief + SVG + ConceptSim (geen Worldline-deckdia’s vereist)."
 },
 attribution:"Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code",
 openItems:[]
};

export default {
 day:19,
 kind:'harness',
 deck:'harness',
 localeComplete:true,
 requireLocales:true,
 copy:{en,nl},
 // Structural defaults (EN) for lint / FAQ index
 ...en,
 sims:[{id:"s12",title:"Concept sim · Cron Scheduler"}],
 skipAutoDeckLink:true
};
