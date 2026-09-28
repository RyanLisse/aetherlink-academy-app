import {diagram,link,question} from './model.mjs';

const MIT_EN="Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code";
const MIT_NL="Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code";

const en = {
 title:"Harness · s09 Memory",
 tag:'Harness',
 blurb:"File storage + index + relevance selection + on-demand recall.",
 kicker:"Harness Engineering · s09",
 lessonTitle:"Memory — Keep Useful Knowledge Across Sessions",
 motto:"Keep information that later tasks will need",
 leerdoel:"You explain the Memory mechanism, state the motto, and step the ConceptSim without API keys.",
 narrative:[
  "A new session starts without prior messages. Preferences and project facts still matter.",
  "Putting everything in the system prompt does not scale. Memory stores records outside the conversation.",
  "Four parts: storage, recall, extraction, consolidation — short index available, full content on demand (like skills, but agent-writable).",
  "Harness layer: Memory stores reusable knowledge outside the conversation and recalls it for related tasks."
 ],
 workedExample:"Mechanism: .memory/*.md records + index + relevance select + on-demand recall/extract.",
 loop:[{label:"Mechanism",prompt:"What is the harness layer for this chapter?"},{label:"Signals",prompt:"Which runtime signals or tools did you observe?"},{label:"Step",prompt:"Can you narrate the ConceptSim without an API key?"},{label:"Contrast",prompt:"How does this differ from the previous chapter?"}],
 solo:[{id:"s09-motto",badge:"1",title:"State the motto",goal:"Write the s09 motto and name the harness layer.",doneWhen:"Motto and harness layer named."},{id:"s09-mech",badge:"2",title:"Name the mechanism",goal:"In two sentences, explain what this chapter adds to the loop.",doneWhen:"Mechanism explained without a slide wall."},{id:"s09-sim",badge:"3",title:"Step the ConceptSim",goal:"Step the Memory ConceptSim end-to-end.",doneWhen:"You can narrate each step without an API key."}],
 materials:[link('diagram',"Memory overview","/diagrams/harness/s09-memory-overview.svg","EN SVG · MIT shareAI Lab"),link('diagram',"Memory subsystems","/diagrams/harness/s09-memory-subsystems.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s09 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s09_memory","Reference only — do not iframe learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s09-memory-overview.svg","Memory overview","Store and recall across sessions"),diagram("/diagrams/harness/s09-memory-subsystems.svg","Memory subsystems","Storage, recall, extraction, consolidation")],
 simTitles:{s09:"Concept sim · Memory"},
 proof:["Motto and harness layer stated (s09).","Mechanism explained.","ConceptSim stepped without API keys."],
 quiz:[question("Where does durable memory live?",["Only inside messages[]","Outside the conversation (e.g. .memory files)","In the SVG"],1),question("How is memory like skills?",["Both are always fully in the system prompt","Short index first; load full content when needed","Both require MCP"],1),question("Why not dump the whole memory file every turn?",["Files are read-only","Unrelated records waste tokens and context","Memory cannot be selected"],1)],
 mission:{
  id:"HARNESS-S09",
  title:"Explain and step Memory",
  minutes:20,
  goal:"Name the s09 mechanism and step the ConceptSim end-to-end.",
  allowed:["Use the in-lesson diagram and ConceptSim only.","No live model API required for the concept path."],
  starterFiles:[],
  hints:["Use the diagram and ConceptSim only.","No live model API required for the concept path."]
 },
 demo:{
  slides:[],
  script:["Show the s09 diagram, then step the ConceptSim.","Emphasize: no API key for the concept path — scenario is preauthored."],
  open:"Harness chapters teach via narrative + SVG + ConceptSim (no Worldline deck slides required)."
 },
 attribution:"Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code",
 openItems:[]
};

const nl = {
 title:"Harness · s09 Memory",
 tag:'Harness',
 blurb:"Bestandsopslag + index + relevantieselectie + on-demand recall.",
 kicker:"Harness Engineering · s09",
 lessonTitle:"Memory — bewaar nuttige kennis over sessies heen",
 motto:"Bewaar informatie die latere taken nodig hebben",
 leerdoel:"Je legt het mechanisme Memory uit, noemt het motto, en stapt de ConceptSim zonder API-sleutels.",
 narrative:[
  "Een nieuwe sessie start zonder eerdere messages. Voorkeuren en projectfeiten blijven ertoe doen.",
  "Alles in de system prompt zetten schaalt niet. Memory bewaart records buiten het gesprek.",
  "Vier delen: opslag, recall, extractie, consolidatie — korte index beschikbaar, volledige inhoud on-demand (zoals skills, maar door de agent beschrijfbaar).",
  "Harness-laag: Memory bewaart herbruikbare kennis buiten het gesprek en haalt die op voor verwante taken."
 ],
 workedExample:"Mechanisme: .memory/*.md-records + index + relevantieselectie + on-demand recall/extractie.",
 loop:[{label:"Mechanisme",prompt:"Wat is de harness-laag van dit hoofdstuk?"},{label:"Signalen",prompt:"Welke runtime-signalen of tools zag je?"},{label:"Stappen",prompt:"Kun je de ConceptSim navertellen zonder API-sleutel?"},{label:"Contrast",prompt:"Hoe verschilt dit van het vorige hoofdstuk?"}],
 solo:[{id:"s09-motto",badge:"1",title:"Noem het motto",goal:"Schrijf het s09-motto en noem de harness-laag.",doneWhen:"Motto en harness-laag genoemd."},{id:"s09-mech",badge:"2",title:"Noem het mechanisme",goal:"Leg in twee zinnen uit wat dit hoofdstuk aan de loop toevoegt.",doneWhen:"Mechanisme uitgelegd zonder dia-muur."},{id:"s09-sim",badge:"3",title:"Stap de ConceptSim",goal:"Stap de Memory ConceptSim van begin tot eind.",doneWhen:"Je kunt elke stap navertellen zonder API-sleutel."}],
 materials:[link('diagram',"Memory-overzicht","/diagrams/harness/s09-memory-overview.svg","EN SVG · MIT shareAI Lab"),link('diagram',"Memory-subsystemen","/diagrams/harness/s09-memory-subsystems.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s09 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s09_memory","Alleen referentie — geen iframe naar learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s09-memory-overview.svg","Memory-overzicht","Opslaan en ophalen over sessies"),diagram("/diagrams/harness/s09-memory-subsystems.svg","Memory-subsystemen","Opslag, recall, extractie, consolidatie")],
 simTitles:{s09:"Concept-sim · Memory"},
 proof:["Motto en harness-laag genoemd (s09).","Mechanisme uitgelegd.","ConceptSim gestapt zonder API-sleutels."],
 quiz:[question("Waar leeft duurzaam geheugen?",["Alleen in messages[]","Buiten het gesprek (bijv. .memory-bestanden)","In de SVG"],1),question("Hoe lijkt memory op skills?",["Beide staan altijd volledig in de system prompt","Eerst korte index; laad volledige inhoud wanneer nodig","Beide vereisen MCP"],1),question("Waarom niet het hele memory-bestand elke beurt dumpen?",["Bestanden zijn read-only","Irrelevante records verspillen tokens en context","Memory kan niet geselecteerd worden"],1)],
 mission:{
  id:"HARNESS-S09",
  title:"Leg Memory uit en stap het",
  minutes:20,
  goal:"Noem het s09-mechanisme en stap de ConceptSim van begin tot eind.",
  allowed:["Gebruik alleen het diagram en de ConceptSim in de les.","Geen live model-API nodig voor het conceptpad."],
  starterFiles:[],
  hints:["Gebruik alleen het diagram en de ConceptSim.","Geen live model-API nodig voor het conceptpad."]
 },
 demo:{
  slides:[],
  script:["Toon het s09-diagram en stap daarna de ConceptSim.","Benadruk: geen API-sleutel voor het conceptpad — scenario is voorgeprogrammeerd."],
  open:"Harness-hoofdstukken werken via narratief + SVG + ConceptSim (geen Worldline-deckdia’s vereist)."
 },
 attribution:"Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code",
 openItems:[]
};

export default {
 day:16,
 kind:'harness',
 deck:'harness',
 localeComplete:true,
 requireLocales:true,
 copy:{en,nl},
 // Structural defaults (EN) for lint / FAQ index
 ...en,
 sims:[{id:"s09",title:"Concept sim · Memory"}],
 skipAutoDeckLink:true
};
