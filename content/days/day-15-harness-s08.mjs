import {diagram,link,question} from './model.mjs';

const MIT_EN="Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code";
const MIT_NL="Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code";

const en = {
 title:"Harness · s08 Context Compact",
 tag:'Harness',
 blurb:"Compaction budgets — reduce tool output first, summarize only when needed.",
 kicker:"Harness Engineering · s08",
 lessonTitle:"Context Compact — Make Room Before the Context Fills Up",
 motto:"Context will fill up, so the harness needs a way to make room",
 leerdoel:"You explain the Context Compact mechanism, state the motto, and step the ConceptSim without API keys.",
 narrative:[
  "Every file read and command result stays in messages until the window overflows.",
  "A four-step pipeline runs from lower cost to higher cost: shrink recoverable tool output before summarizing history.",
  "Summaries lose detail and cost a model call — so tool results are the first target.",
  "Harness layer: Compaction keeps a limited context useful throughout a long task."
 ],
 workedExample:"Mechanism: micro-compact → drop/ref recoverable results → auto-compact summary when still over budget.",
 loop:[{label:"Mechanism",prompt:"What is the harness layer for this chapter?"},{label:"Signals",prompt:"Which runtime signals or tools did you observe?"},{label:"Step",prompt:"Can you narrate the ConceptSim without an API key?"},{label:"Contrast",prompt:"How does this differ from the previous chapter?"}],
 solo:[{id:"s08-motto",badge:"1",title:"State the motto",goal:"Write the s08 motto and name the harness layer.",doneWhen:"Motto and harness layer named."},{id:"s08-mech",badge:"2",title:"Name the mechanism",goal:"In two sentences, explain what this chapter adds to the loop.",doneWhen:"Mechanism explained without a slide wall."},{id:"s08-sim",badge:"3",title:"Step the ConceptSim",goal:"Step the Context Compact ConceptSim end-to-end.",doneWhen:"You can narrate each step without an API key."}],
 materials:[link('diagram',"Context compact overview","/diagrams/harness/s08-compact-overview.svg","EN SVG · MIT shareAI Lab"),link('diagram',"Compaction layers","/diagrams/harness/s08-compaction-layers.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s08 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s08_context_compact","Reference only — do not iframe learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s08-compact-overview.svg","Context compact overview","Make room before context fills"),diagram("/diagrams/harness/s08-compaction-layers.svg","Compaction layers","Lower cost first")],
 simTitles:{s08:"Concept sim · Context Compact"},
 proof:["Motto and harness layer stated (s08).","Mechanism explained.","ConceptSim stepped without API keys."],
 quiz:[question("What should shrink first?",["The system prompt","Recoverable tool results","The user motto"],1),question("Why delay full history summary?",["Summaries are illegal","They lose detail and cost another model call","Hooks forbid it"],1),question("What happens without compaction?",["Nothing","prompt_too_long / overflow ends useful work","Tools get faster"],1)],
 mission:{
  id:"HARNESS-S08",
  title:"Explain and step Context Compact",
  minutes:20,
  goal:"Name the s08 mechanism and step the ConceptSim end-to-end.",
  allowed:["Use the in-lesson diagram and ConceptSim only.","No live model API required for the concept path."],
  starterFiles:[],
  hints:["Use the diagram and ConceptSim only.","No live model API required for the concept path."]
 },
 demo:{
  slides:[],
  script:["Show the s08 diagram, then step the ConceptSim.","Emphasize: no API key for the concept path — scenario is preauthored."],
  open:"Harness chapters teach via narrative + SVG + ConceptSim (no Worldline deck slides required)."
 },
 attribution:"Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code",
 openItems:[]
};

const nl = {
 title:"Harness · s08 Context Compact",
 tag:'Harness',
 blurb:"Compaction-budgetten — eerst tooluitvoer verkleinen, pas daarna samenvatten.",
 kicker:"Harness Engineering · s08",
 lessonTitle:"Context Compact — maak ruimte voordat de context vol raakt",
 motto:"Context raakt vol, dus de harness moet ruimte kunnen maken",
 leerdoel:"Je legt het mechanisme Context Compact uit, noemt het motto, en stapt de ConceptSim zonder API-sleutels.",
 narrative:[
  "Elke fileread en commandresultaat blijft in messages tot het venster overloopt.",
  "Een vierstappenpijplijn loopt van lagere naar hogere kosten: verklein herstelbare tooluitvoer vóór je geschiedenis samenvat.",
  "Samenvattingen verliezen detail en kosten een modelaanroep — daarom zijn toolresultaten het eerste doel.",
  "Harness-laag: Compaction houdt een begrensde context bruikbaar tijdens een lange taak."
 ],
 workedExample:"Mechanisme: micro-compact → drop/ref herstelbare resultaten → auto-compact-samenvatting als budget nog overschreden is.",
 loop:[{label:"Mechanisme",prompt:"Wat is de harness-laag van dit hoofdstuk?"},{label:"Signalen",prompt:"Welke runtime-signalen of tools zag je?"},{label:"Stappen",prompt:"Kun je de ConceptSim navertellen zonder API-sleutel?"},{label:"Contrast",prompt:"Hoe verschilt dit van het vorige hoofdstuk?"}],
 solo:[{id:"s08-motto",badge:"1",title:"Noem het motto",goal:"Schrijf het s08-motto en noem de harness-laag.",doneWhen:"Motto en harness-laag genoemd."},{id:"s08-mech",badge:"2",title:"Noem het mechanisme",goal:"Leg in twee zinnen uit wat dit hoofdstuk aan de loop toevoegt.",doneWhen:"Mechanisme uitgelegd zonder dia-muur."},{id:"s08-sim",badge:"3",title:"Stap de ConceptSim",goal:"Stap de Context Compact ConceptSim van begin tot eind.",doneWhen:"Je kunt elke stap navertellen zonder API-sleutel."}],
 materials:[link('diagram',"Context-compact-overzicht","/diagrams/harness/s08-compact-overview.svg","EN SVG · MIT shareAI Lab"),link('diagram',"Compaction-lagen","/diagrams/harness/s08-compaction-layers.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s08 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s08_context_compact","Alleen referentie — geen iframe naar learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s08-compact-overview.svg","Context-compact-overzicht","Maak ruimte voordat de context vol raakt"),diagram("/diagrams/harness/s08-compaction-layers.svg","Compaction-lagen","Eerst lagere kosten")],
 simTitles:{s08:"Concept-sim · Context Compact"},
 proof:["Motto en harness-laag genoemd (s08).","Mechanisme uitgelegd.","ConceptSim gestapt zonder API-sleutels."],
 quiz:[question("Wat moet eerst krimpen?",["De system prompt","Herstelbare toolresultaten","Het gebruikersmotto"],1),question("Waarom volledige geschiedenissamenvatting uitstellen?",["Samenvattingen zijn verboden","Ze verliezen detail en kosten een extra modelaanroep","Hooks verbieden het"],1),question("Wat gebeurt er zonder compaction?",["Niets","prompt_too_long / overflow stopt bruikbaar werk","Tools worden sneller"],1)],
 mission:{
  id:"HARNESS-S08",
  title:"Leg Context Compact uit en stap het",
  minutes:20,
  goal:"Noem het s08-mechanisme en stap de ConceptSim van begin tot eind.",
  allowed:["Gebruik alleen het diagram en de ConceptSim in de les.","Geen live model-API nodig voor het conceptpad."],
  starterFiles:[],
  hints:["Gebruik alleen het diagram en de ConceptSim.","Geen live model-API nodig voor het conceptpad."]
 },
 demo:{
  slides:[],
  script:["Toon het s08-diagram en stap daarna de ConceptSim.","Benadruk: geen API-sleutel voor het conceptpad — scenario is voorgeprogrammeerd."],
  open:"Harness-hoofdstukken werken via narratief + SVG + ConceptSim (geen Worldline-deckdia’s vereist)."
 },
 attribution:"Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code",
 openItems:[]
};

export default {
 day:15,
 kind:'harness',
 deck:'harness',
 localeComplete:true,
 requireLocales:true,
 copy:{en,nl},
 // Structural defaults (EN) for lint / FAQ index
 ...en,
 sims:[{id:"s08",title:"Concept sim · Context Compact"}],
 skipAutoDeckLink:true
};
