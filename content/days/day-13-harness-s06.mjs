import {diagram,link,question} from './model.mjs';

const MIT_EN="Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code";
const MIT_NL="Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code";

const en = {
 title:"Harness · s06 Subagent",
 tag:'Harness',
 blurb:"Fresh messages for focused work — conversation isolation, not process isolation.",
 kicker:"Harness Engineering · s06",
 lessonTitle:"Subagent — Give a Subtask Its Own Context",
 motto:"A subagent starts with a fresh messages[]; only its final text returns",
 leerdoel:"You explain the Subagent mechanism, state the motto, and step the ConceptSim without API keys.",
 narrative:[
  "Deep tracing fills parent messages[] with intermediate reads the parent no longer needs.",
  "Calling task runs a nested agent loop with fresh messages[]. Final text becomes the parent tool_result.",
  "Same process and WORKDIR — message isolation, not filesystem isolation. Subagent has base tools but no nested task.",
  "Harness layer: Delegation — focused work in a separate conversation context."
 ],
 workedExample:"Mechanism: run_subagent(prompt) with fresh messages and capped iterations; return final text only.",
 loop:[{label:"Mechanism",prompt:"What is the harness layer for this chapter?"},{label:"Signals",prompt:"Which runtime signals or tools did you observe?"},{label:"Step",prompt:"Can you narrate the ConceptSim without an API key?"},{label:"Contrast",prompt:"How does this differ from the previous chapter?"}],
 solo:[{id:"s06-motto",badge:"1",title:"State the motto",goal:"Write the s06 motto and name the harness layer.",doneWhen:"Motto and harness layer named."},{id:"s06-mech",badge:"2",title:"Name the mechanism",goal:"In two sentences, explain what this chapter adds to the loop.",doneWhen:"Mechanism explained without a slide wall."},{id:"s06-sim",badge:"3",title:"Step the ConceptSim",goal:"Step the Subagent ConceptSim end-to-end.",doneWhen:"You can narrate each step without an API key."}],
 materials:[link('diagram',"Subagent overview","/diagrams/harness/s06-subagent-overview.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s06 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s06_subagent","Reference only — do not iframe learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s06-subagent-overview.svg","Subagent overview","Fresh messages; final text returns")],
 simTitles:{s06:"Concept sim · Subagent"},
 proof:["Motto and harness layer stated (s06).","Mechanism explained.","ConceptSim stepped without API keys."],
 quiz:[question("What returns to the parent?",["Every subagent tool_call","Only the subagent final text as tool_result","A new process PID"],1),question("Do parent and subagent share WORKDIR?",["No — separate sandboxes","Yes — same process and workspace","Only if hooks allow"],1),question("Why use a subagent?",["To skip permissions","To keep intermediate context out of parent messages","To disable tools"],1)],
 mission:{
  id:"HARNESS-S06",
  title:"Explain and step Subagent",
  minutes:20,
  goal:"Name the s06 mechanism and step the ConceptSim end-to-end.",
  allowed:["Use the in-lesson diagram and ConceptSim only.","No live model API required for the concept path."],
  starterFiles:[],
  hints:["Use the diagram and ConceptSim only.","No live model API required for the concept path."]
 },
 demo:{
  slides:[],
  script:["Show the s06 diagram, then step the ConceptSim.","Emphasize: no API key for the concept path — scenario is preauthored."],
  open:"Harness chapters teach via narrative + SVG + ConceptSim (no Worldline deck slides required)."
 },
 attribution:"Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code",
 openItems:[]
};

const nl = {
 title:"Harness · s06 Subagent",
 tag:'Harness',
 blurb:"Verse messages voor gericht werk — gespreksisolatie, geen procesisolatie.",
 kicker:"Harness Engineering · s06",
 lessonTitle:"Subagent — geef een subtaak een eigen context",
 motto:"Een subagent start met verse messages[]; alleen de eindtekst keert terug",
 leerdoel:"Je legt het mechanisme Subagent uit, noemt het motto, en stapt de ConceptSim zonder API-sleutels.",
 narrative:[
  "Diep traceren vult ouder-messages[] met tussentijdse reads die de ouder niet meer nodig heeft.",
  "De task-tool start een geneste agent-loop met verse messages[]. De eindtekst wordt het tool_result van de ouder.",
  "Zelfde proces en WORKDIR — berichtisolatie, geen filesystem-isolatie. De subagent heeft basistools maar geen geneste task.",
  "Harness-laag: Delegatie — gericht werk in een aparte gesprekscontext."
 ],
 workedExample:"Mechanisme: run_subagent(prompt) met verse messages en begrensde iteraties; geef alleen eindtekst terug.",
 loop:[{label:"Mechanisme",prompt:"Wat is de harness-laag van dit hoofdstuk?"},{label:"Signalen",prompt:"Welke runtime-signalen of tools zag je?"},{label:"Stappen",prompt:"Kun je de ConceptSim navertellen zonder API-sleutel?"},{label:"Contrast",prompt:"Hoe verschilt dit van het vorige hoofdstuk?"}],
 solo:[{id:"s06-motto",badge:"1",title:"Noem het motto",goal:"Schrijf het s06-motto en noem de harness-laag.",doneWhen:"Motto en harness-laag genoemd."},{id:"s06-mech",badge:"2",title:"Noem het mechanisme",goal:"Leg in twee zinnen uit wat dit hoofdstuk aan de loop toevoegt.",doneWhen:"Mechanisme uitgelegd zonder dia-muur."},{id:"s06-sim",badge:"3",title:"Stap de ConceptSim",goal:"Stap de Subagent ConceptSim van begin tot eind.",doneWhen:"Je kunt elke stap navertellen zonder API-sleutel."}],
 materials:[link('diagram',"Subagent-overzicht","/diagrams/harness/s06-subagent-overview.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s06 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s06_subagent","Alleen referentie — geen iframe naar learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s06-subagent-overview.svg","Subagent-overzicht","Verse messages; eindtekst keert terug")],
 simTitles:{s06:"Concept-sim · Subagent"},
 proof:["Motto en harness-laag genoemd (s06).","Mechanisme uitgelegd.","ConceptSim gestapt zonder API-sleutels."],
 quiz:[question("Wat keert terug naar de ouder?",["Elke subagent-tool_call","Alleen de eindtekst als tool_result","Een nieuw proces-PID"],1),question("Delen ouder en subagent WORKDIR?",["Nee — aparte sandboxes","Ja — zelfde proces en workspace","Alleen als hooks dat toestaan"],1),question("Waarom een subagent?",["Om permissies over te slaan","Om tussentijdse context buiten de ouder-messages te houden","Om tools uit te schakelen"],1)],
 mission:{
  id:"HARNESS-S06",
  title:"Leg Subagent uit en stap het",
  minutes:20,
  goal:"Noem het s06-mechanisme en stap de ConceptSim van begin tot eind.",
  allowed:["Gebruik alleen het diagram en de ConceptSim in de les.","Geen live model-API nodig voor het conceptpad."],
  starterFiles:[],
  hints:["Gebruik alleen het diagram en de ConceptSim.","Geen live model-API nodig voor het conceptpad."]
 },
 demo:{
  slides:[],
  script:["Toon het s06-diagram en stap daarna de ConceptSim.","Benadruk: geen API-sleutel voor het conceptpad — scenario is voorgeprogrammeerd."],
  open:"Harness-hoofdstukken werken via narratief + SVG + ConceptSim (geen Worldline-deckdia’s vereist)."
 },
 attribution:"Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code",
 openItems:[]
};

export default {
 day:13,
 kind:'harness',
 deck:'harness',
 localeComplete:true,
 requireLocales:true,
 copy:{en,nl},
 // Structural defaults (EN) for lint / FAQ index
 ...en,
 sims:[{id:"s06",title:"Concept sim · Subagent"}],
 skipAutoDeckLink:true
};
