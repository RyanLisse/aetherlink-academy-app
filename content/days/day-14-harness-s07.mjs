import {diagram,link,question} from './model.mjs';

const MIT_EN="Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code";
const MIT_NL="Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code";

const en = {
 title:"Harness · s07 Skill Loading",
 tag:'Harness',
 blurb:"On-demand skill injection — cheap index, full text via load_skill.",
 kicker:"Harness Engineering · s07",
 lessonTitle:"Skill Loading — Load Skills When Needed",
 motto:"Show the catalog; load the full SKILL.md only when needed",
 leerdoel:"You explain the Skill Loading mechanism, state the motto, and step the ConceptSim without API keys.",
 narrative:[
  "Dumping every style guide into the system prompt wastes tokens on every call.",
  "SkillLoader scans skills/*/SKILL.md at startup and puts name+description in the system prompt.",
  "When needed, load_skill(name) returns the full SKILL.md as a tool_result — not permanently in the prompt.",
  "Harness layer: Knowledge loading — show which skills exist, then load one by name."
 ],
 workedExample:"Mechanism: catalog in system prompt; load_skill injects full SKILL.md on demand.",
 loop:[{label:"Mechanism",prompt:"What is the harness layer for this chapter?"},{label:"Signals",prompt:"Which runtime signals or tools did you observe?"},{label:"Step",prompt:"Can you narrate the ConceptSim without an API key?"},{label:"Contrast",prompt:"How does this differ from the previous chapter?"}],
 solo:[{id:"s07-motto",badge:"1",title:"State the motto",goal:"Write the s07 motto and name the harness layer.",doneWhen:"Motto and harness layer named."},{id:"s07-mech",badge:"2",title:"Name the mechanism",goal:"In two sentences, explain what this chapter adds to the loop.",doneWhen:"Mechanism explained without a slide wall."},{id:"s07-sim",badge:"3",title:"Step the ConceptSim",goal:"Step the Skill Loading ConceptSim end-to-end.",doneWhen:"You can narrate each step without an API key."}],
 materials:[link('diagram',"Skill loading overview","/diagrams/harness/s07-skill-overview.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s07 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s07_skill_loading","Reference only — do not iframe learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s07-skill-overview.svg","Skill loading overview","Catalog cheap; full SKILL.md on demand")],
 simTitles:{s07:"Concept sim · Skill Loading"},
 proof:["Motto and harness layer stated (s07).","Mechanism explained.","ConceptSim stepped without API keys."],
 quiz:[question("What sits in the system prompt at startup?",["Full SKILL.md for every skill","Skill name and description catalog only","Nothing about skills"],1),question("How does full skill text arrive?",["Always in the system prompt","As a tool_result from load_skill","Via MCP only"],1),question("Why not embed all skills always?",["Skills are secret","Unused full text wastes tokens and context","load_skill is slower than bash"],1)],
 mission:{
  id:"HARNESS-S07",
  title:"Explain and step Skill Loading",
  minutes:20,
  goal:"Name the s07 mechanism and step the ConceptSim end-to-end.",
  allowed:["Use the in-lesson diagram and ConceptSim only.","No live model API required for the concept path."],
  starterFiles:[],
  hints:["Use the diagram and ConceptSim only.","No live model API required for the concept path."]
 },
 demo:{
  slides:[],
  script:["Show the s07 diagram, then step the ConceptSim.","Emphasize: no API key for the concept path — scenario is preauthored."],
  open:"Harness chapters teach via narrative + SVG + ConceptSim (no Worldline deck slides required)."
 },
 attribution:"Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code",
 openItems:[]
};

const nl = {
 title:"Harness · s07 Skill Loading",
 tag:'Harness',
 blurb:"On-demand skill-injectie — goedkope index, volledige tekst via load_skill.",
 kicker:"Harness Engineering · s07",
 lessonTitle:"Skill Loading — laad skills wanneer nodig",
 motto:"Toon de catalogus; laad de volledige SKILL.md pas wanneer nodig",
 leerdoel:"Je legt het mechanisme Skill Loading uit, noemt het motto, en stapt de ConceptSim zonder API-sleutels.",
 narrative:[
  "Alle styleguides in de system prompt dumpen verspilt tokens bij elke aanroep.",
  "SkillLoader scant skills/*/SKILL.md bij start en zet naam+beschrijving in de system prompt.",
  "Wanneer nodig geeft load_skill(name) de volledige SKILL.md terug als tool_result — niet permanent in de prompt.",
  "Harness-laag: Kennislading — toon welke skills bestaan, laad er daarna één op naam."
 ],
 workedExample:"Mechanisme: catalogus in system prompt; load_skill injecteert volledige SKILL.md on-demand.",
 loop:[{label:"Mechanisme",prompt:"Wat is de harness-laag van dit hoofdstuk?"},{label:"Signalen",prompt:"Welke runtime-signalen of tools zag je?"},{label:"Stappen",prompt:"Kun je de ConceptSim navertellen zonder API-sleutel?"},{label:"Contrast",prompt:"Hoe verschilt dit van het vorige hoofdstuk?"}],
 solo:[{id:"s07-motto",badge:"1",title:"Noem het motto",goal:"Schrijf het s07-motto en noem de harness-laag.",doneWhen:"Motto en harness-laag genoemd."},{id:"s07-mech",badge:"2",title:"Noem het mechanisme",goal:"Leg in twee zinnen uit wat dit hoofdstuk aan de loop toevoegt.",doneWhen:"Mechanisme uitgelegd zonder dia-muur."},{id:"s07-sim",badge:"3",title:"Stap de ConceptSim",goal:"Stap de Skill Loading ConceptSim van begin tot eind.",doneWhen:"Je kunt elke stap navertellen zonder API-sleutel."}],
 materials:[link('diagram',"Skill-loading-overzicht","/diagrams/harness/s07-skill-overview.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s07 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s07_skill_loading","Alleen referentie — geen iframe naar learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s07-skill-overview.svg","Skill-loading-overzicht","Catalogus goedkoop; volledige SKILL.md on-demand")],
 simTitles:{s07:"Concept-sim · Skill Loading"},
 proof:["Motto en harness-laag genoemd (s07).","Mechanisme uitgelegd.","ConceptSim gestapt zonder API-sleutels."],
 quiz:[question("Wat staat bij start in de system prompt?",["Volledige SKILL.md voor elke skill","Alleen catalogus met naam en beschrijving","Niets over skills"],1),question("Hoe komt de volledige skilltekst binnen?",["Altijd in de system prompt","Als tool_result van load_skill","Alleen via MCP"],1),question("Waarom niet alle skills altijd inbedden?",["Skills zijn geheim","Ongebruikte volledige tekst verspilt tokens en context","load_skill is trager dan bash"],1)],
 mission:{
  id:"HARNESS-S07",
  title:"Leg Skill Loading uit en stap het",
  minutes:20,
  goal:"Noem het s07-mechanisme en stap de ConceptSim van begin tot eind.",
  allowed:["Gebruik alleen het diagram en de ConceptSim in de les.","Geen live model-API nodig voor het conceptpad."],
  starterFiles:[],
  hints:["Gebruik alleen het diagram en de ConceptSim.","Geen live model-API nodig voor het conceptpad."]
 },
 demo:{
  slides:[],
  script:["Toon het s07-diagram en stap daarna de ConceptSim.","Benadruk: geen API-sleutel voor het conceptpad — scenario is voorgeprogrammeerd."],
  open:"Harness-hoofdstukken werken via narratief + SVG + ConceptSim (geen Worldline-deckdia’s vereist)."
 },
 attribution:"Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code",
 openItems:[]
};

export default {
 day:14,
 kind:'harness',
 deck:'harness',
 localeComplete:true,
 requireLocales:true,
 copy:{en,nl},
 // Structural defaults (EN) for lint / FAQ index
 ...en,
 sims:[{id:"s07",title:"Concept sim · Skill Loading"}],
 skipAutoDeckLink:true
};
