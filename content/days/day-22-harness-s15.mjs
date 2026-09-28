import {diagram,link,question} from './model.mjs';

const MIT_EN="Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code";
const MIT_NL="Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code";

const en = {
 title:"Harness · s15 Integrated Harness",
 tag:'Harness',
 blurb:"Tools, permissions, memory, tasks, teams, and plugins around the same while True.",
 kicker:"Harness Engineering · s15",
 lessonTitle:"Integrated Harness — Many Mechanisms, One Loop",
 motto:"Many mechanisms, one loop",
 leerdoel:"You explain the Integrated Harness mechanism, state the motto, and step the ConceptSim without API keys.",
 narrative:[
  "Earlier chapters each added one mechanism. Release prep needs several at once.",
  "The integrated harness assembles prompt context from memory, tasks, skills, tools, and policy — still one loop.",
  "Teams, background work, MCP, and permissions cooperate without rewriting while True.",
  "Harness layer: Integration — put the mechanisms into one runnable system."
 ],
 workedExample:"Mechanism: one agent loop with hooks, skills, tasks, teams, background, cron, worktrees, and MCP hanging off it.",
 loop:[{label:"Mechanism",prompt:"What is the harness layer for this chapter?"},{label:"Signals",prompt:"Which runtime signals or tools did you observe?"},{label:"Step",prompt:"Can you narrate the ConceptSim without an API key?"},{label:"Contrast",prompt:"How does this differ from the previous chapter?"}],
 solo:[{id:"s15-motto",badge:"1",title:"State the motto",goal:"Write the s15 motto and name the harness layer.",doneWhen:"Motto and harness layer named."},{id:"s15-mech",badge:"2",title:"Name the mechanism",goal:"In two sentences, explain what this chapter adds to the loop.",doneWhen:"Mechanism explained without a slide wall."},{id:"s15-sim",badge:"3",title:"Step the ConceptSim",goal:"Step the Integrated Harness ConceptSim end-to-end.",doneWhen:"You can narrate each step without an API key."}],
 materials:[link('diagram',"Integrated harness architecture","/diagrams/harness/s15-system-architecture.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s15 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s15_integrated_harness","Reference only — do not iframe learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s15-system-architecture.svg","Integrated harness architecture","Many mechanisms, one loop")],
 simTitles:{s15:"Concept sim · Integrated Harness"},
 proof:["Motto and harness layer stated (s15).","Mechanism explained.","ConceptSim stepped without API keys."],
 quiz:[question("What stays constant?",["The number of teammates","The while True agent loop","The MCP server list"],1),question("How do mechanisms attach?",["By forking the loop per feature","By hanging on the same loop (hooks, tools, notifications)","By replacing messages[]"],1),question("Why integrate?",["To remove ConceptSim","So ordinary requests can use several capabilities together","To iframe learn.shareai.run"],1)],
 mission:{
  id:"HARNESS-S15",
  title:"Explain and step Integrated Harness",
  minutes:20,
  goal:"Name the s15 mechanism and step the ConceptSim end-to-end.",
  allowed:["Use the in-lesson diagram and ConceptSim only.","No live model API required for the concept path."],
  starterFiles:[],
  hints:["Use the diagram and ConceptSim only.","No live model API required for the concept path."]
 },
 demo:{
  slides:[],
  script:["Show the s15 diagram, then step the ConceptSim.","Emphasize: no API key for the concept path — scenario is preauthored."],
  open:"Harness chapters teach via narrative + SVG + ConceptSim (no Worldline deck slides required)."
 },
 attribution:"Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code",
 openItems:[]
};

const nl = {
 title:"Harness · s15 Geïntegreerde Harness",
 tag:'Harness',
 blurb:"Tools, permissies, memory, tasks, teams en plugins rond dezelfde while True.",
 kicker:"Harness Engineering · s15",
 lessonTitle:"Geïntegreerde Harness — veel mechanismen, één loop",
 motto:"Veel mechanismen, één loop",
 leerdoel:"Je legt het mechanisme Geïntegreerde Harness uit, noemt het motto, en stapt de ConceptSim zonder API-sleutels.",
 narrative:[
  "Eerdere hoofdstukken voegden elk één mechanisme toe. Releasevoorbereiding vraagt er meerdere tegelijk.",
  "De geïntegreerde harness bouwt promptcontext uit memory, tasks, skills, tools en policy — nog steeds één loop.",
  "Teams, achtergrondwerk, MCP en permissies werken samen zonder while True te herschrijven.",
  "Harness-laag: Integratie — zet de mechanismen in één draaiend systeem."
 ],
 workedExample:"Mechanisme: één agent-loop met hooks, skills, tasks, teams, achtergrond, cron, worktrees en MCP eraan gehangen.",
 loop:[{label:"Mechanisme",prompt:"Wat is de harness-laag van dit hoofdstuk?"},{label:"Signalen",prompt:"Welke runtime-signalen of tools zag je?"},{label:"Stappen",prompt:"Kun je de ConceptSim navertellen zonder API-sleutel?"},{label:"Contrast",prompt:"Hoe verschilt dit van het vorige hoofdstuk?"}],
 solo:[{id:"s15-motto",badge:"1",title:"Noem het motto",goal:"Schrijf het s15-motto en noem de harness-laag.",doneWhen:"Motto en harness-laag genoemd."},{id:"s15-mech",badge:"2",title:"Noem het mechanisme",goal:"Leg in twee zinnen uit wat dit hoofdstuk aan de loop toevoegt.",doneWhen:"Mechanisme uitgelegd zonder dia-muur."},{id:"s15-sim",badge:"3",title:"Stap de ConceptSim",goal:"Stap de Geïntegreerde Harness ConceptSim van begin tot eind.",doneWhen:"Je kunt elke stap navertellen zonder API-sleutel."}],
 materials:[link('diagram',"Geïntegreerde harness-architectuur","/diagrams/harness/s15-system-architecture.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s15 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s15_integrated_harness","Alleen referentie — geen iframe naar learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s15-system-architecture.svg","Geïntegreerde harness-architectuur","Veel mechanismen, één loop")],
 simTitles:{s15:"Concept-sim · Geïntegreerde Harness"},
 proof:["Motto en harness-laag genoemd (s15).","Mechanisme uitgelegd.","ConceptSim gestapt zonder API-sleutels."],
 quiz:[question("Wat blijft constant?",["Het aantal teammates","De while True agent-loop","De MCP-serverlijst"],1),question("Hoe haken mechanismen aan?",["Door de loop per feature te forken","Door aan dezelfde loop te hangen (hooks, tools, notificaties)","Door messages[] te vervangen"],1),question("Waarom integreren?",["Om ConceptSim te verwijderen","Zodat gewone verzoeken meerdere capabilities samen kunnen gebruiken","Om learn.shareai.run te iframes"],1)],
 mission:{
  id:"HARNESS-S15",
  title:"Leg Geïntegreerde Harness uit en stap het",
  minutes:20,
  goal:"Noem het s15-mechanisme en stap de ConceptSim van begin tot eind.",
  allowed:["Gebruik alleen het diagram en de ConceptSim in de les.","Geen live model-API nodig voor het conceptpad."],
  starterFiles:[],
  hints:["Gebruik alleen het diagram en de ConceptSim.","Geen live model-API nodig voor het conceptpad."]
 },
 demo:{
  slides:[],
  script:["Toon het s15-diagram en stap daarna de ConceptSim.","Benadruk: geen API-sleutel voor het conceptpad — scenario is voorgeprogrammeerd."],
  open:"Harness-hoofdstukken werken via narratief + SVG + ConceptSim (geen Worldline-deckdia’s vereist)."
 },
 attribution:"Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code",
 openItems:[]
};

export default {
 day:22,
 kind:'harness',
 deck:'harness',
 localeComplete:true,
 requireLocales:true,
 copy:{en,nl},
 // Structural defaults (EN) for lint / FAQ index
 ...en,
 sims:[{id:"s15",title:"Concept sim · Integrated Harness"}],
 skipAutoDeckLink:true
};
