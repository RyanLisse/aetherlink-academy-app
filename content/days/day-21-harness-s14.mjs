import {diagram,link,question} from './model.mjs';

const MIT_EN="Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code";
const MIT_NL="Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code";

const en = {
 title:"Harness · s14 MCP Plugin",
 tag:'Harness',
 blurb:"MCP discovery and namespaced tools in the agent loop.",
 kicker:"Harness Engineering · s14",
 lessonTitle:"MCP Tools — Discover and Invoke External Tools",
 motto:"Connect, discover, namespace — then call external tools from the same loop",
 leerdoel:"You explain the MCP Plugin mechanism, state the motto, and step the ConceptSim without API keys.",
 narrative:[
  "Built-in tools are not enough when knowledge lives in an external docs or deploy service.",
  "connect_mcp creates a client; discovered tools are normalized to names like mcp__docs__search.",
  "Namespaced tools join the active pool and return results like any other tool_result.",
  "Harness layer: MCP Tools — connect to services, discover tools, and add them to the agent loop."
 ],
 workedExample:"Mechanism: connect_mcp → discover → normalize names → dispatch in the same agent loop.",
 loop:[{label:"Mechanism",prompt:"What is the harness layer for this chapter?"},{label:"Signals",prompt:"Which runtime signals or tools did you observe?"},{label:"Step",prompt:"Can you narrate the ConceptSim without an API key?"},{label:"Contrast",prompt:"How does this differ from the previous chapter?"}],
 solo:[{id:"s14-motto",badge:"1",title:"State the motto",goal:"Write the s14 motto and name the harness layer.",doneWhen:"Motto and harness layer named."},{id:"s14-mech",badge:"2",title:"Name the mechanism",goal:"In two sentences, explain what this chapter adds to the loop.",doneWhen:"Mechanism explained without a slide wall."},{id:"s14-sim",badge:"3",title:"Step the ConceptSim",goal:"Step the MCP Plugin ConceptSim end-to-end.",doneWhen:"You can narrate each step without an API key."}],
 materials:[link('diagram',"MCP architecture","/diagrams/harness/s14-mcp-architecture.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s14 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s14_mcp_plugin","Reference only — do not iframe learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s14-mcp-architecture.svg","MCP architecture","Discover and namespace external tools")],
 simTitles:{s14:"Concept sim · MCP Plugin"},
 proof:["Motto and harness layer stated (s14).","Mechanism explained.","ConceptSim stepped without API keys."],
 quiz:[question("Why namespace MCP tools?",["For prettier logs only","To avoid collisions with built-in tool names","Because hooks require it"],1),question("When are external tools added?",["Always at process boot for every server","When connect_mcp discovers them for a named server","Never"],1),question("How do results return?",["Via a separate UI only","As ordinary tool_result messages in the loop","By rewriting while True"],1)],
 mission:{
  id:"HARNESS-S14",
  title:"Explain and step MCP Plugin",
  minutes:20,
  goal:"Name the s14 mechanism and step the ConceptSim end-to-end.",
  allowed:["Use the in-lesson diagram and ConceptSim only.","No live model API required for the concept path."],
  starterFiles:[],
  hints:["Use the diagram and ConceptSim only.","No live model API required for the concept path."]
 },
 demo:{
  slides:[],
  script:["Show the s14 diagram, then step the ConceptSim.","Emphasize: no API key for the concept path — scenario is preauthored."],
  open:"Harness chapters teach via narrative + SVG + ConceptSim (no Worldline deck slides required)."
 },
 attribution:"Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code",
 openItems:[]
};

const nl = {
 title:"Harness · s14 MCP-plugin",
 tag:'Harness',
 blurb:"MCP-discovery en tools met namespace in de agent-loop.",
 kicker:"Harness Engineering · s14",
 lessonTitle:"MCP Tools — ontdek en roep externe tools aan",
 motto:"Verbind, ontdek, namespace — roep daarna externe tools aan vanuit dezelfde loop",
 leerdoel:"Je legt het mechanisme MCP-plugin uit, noemt het motto, en stapt de ConceptSim zonder API-sleutels.",
 narrative:[
  "Ingebouwde tools volstaan niet wanneer kennis in een externe docs- of deploy-service leeft.",
  "connect_mcp maakt een client; ontdekte tools worden genormaliseerd tot namen als mcp__docs__search.",
  "Tools met namespace komen in de actieve pool en geven resultaten terug als elk ander tool_result.",
  "Harness-laag: MCP Tools — verbind met services, ontdek tools en voeg ze toe aan de agent-loop."
 ],
 workedExample:"Mechanisme: connect_mcp → ontdekken → namen normaliseren → dispatch in dezelfde agent-loop.",
 loop:[{label:"Mechanisme",prompt:"Wat is de harness-laag van dit hoofdstuk?"},{label:"Signalen",prompt:"Welke runtime-signalen of tools zag je?"},{label:"Stappen",prompt:"Kun je de ConceptSim navertellen zonder API-sleutel?"},{label:"Contrast",prompt:"Hoe verschilt dit van het vorige hoofdstuk?"}],
 solo:[{id:"s14-motto",badge:"1",title:"Noem het motto",goal:"Schrijf het s14-motto en noem de harness-laag.",doneWhen:"Motto en harness-laag genoemd."},{id:"s14-mech",badge:"2",title:"Noem het mechanisme",goal:"Leg in twee zinnen uit wat dit hoofdstuk aan de loop toevoegt.",doneWhen:"Mechanisme uitgelegd zonder dia-muur."},{id:"s14-sim",badge:"3",title:"Stap de ConceptSim",goal:"Stap de MCP-plugin ConceptSim van begin tot eind.",doneWhen:"Je kunt elke stap navertellen zonder API-sleutel."}],
 materials:[link('diagram',"MCP-architectuur","/diagrams/harness/s14-mcp-architecture.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s14 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s14_mcp_plugin","Alleen referentie — geen iframe naar learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s14-mcp-architecture.svg","MCP-architectuur","Ontdek en namespace externe tools")],
 simTitles:{s14:"Concept-sim · MCP-plugin"},
 proof:["Motto en harness-laag genoemd (s14).","Mechanisme uitgelegd.","ConceptSim gestapt zonder API-sleutels."],
 quiz:[question("Waarom MCP-tools een namespace geven?",["Alleen voor mooiere logs","Om botsingen met ingebouwde toolnamen te vermijden","Omdat hooks dat eisen"],1),question("Wanneer worden externe tools toegevoegd?",["Altijd bij processtart voor elke server","Wanneer connect_mcp ze ontdekt voor een genoemde server","Nooit"],1),question("Hoe komen resultaten terug?",["Alleen via een aparte UI","Als gewone tool_result-berichten in de loop","Door while True te herschrijven"],1)],
 mission:{
  id:"HARNESS-S14",
  title:"Leg MCP-plugin uit en stap het",
  minutes:20,
  goal:"Noem het s14-mechanisme en stap de ConceptSim van begin tot eind.",
  allowed:["Gebruik alleen het diagram en de ConceptSim in de les.","Geen live model-API nodig voor het conceptpad."],
  starterFiles:[],
  hints:["Gebruik alleen het diagram en de ConceptSim.","Geen live model-API nodig voor het conceptpad."]
 },
 demo:{
  slides:[],
  script:["Toon het s14-diagram en stap daarna de ConceptSim.","Benadruk: geen API-sleutel voor het conceptpad — scenario is voorgeprogrammeerd."],
  open:"Harness-hoofdstukken werken via narratief + SVG + ConceptSim (geen Worldline-deckdia’s vereist)."
 },
 attribution:"Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code",
 openItems:[]
};

export default {
 day:21,
 kind:'harness',
 deck:'harness',
 localeComplete:true,
 requireLocales:true,
 copy:{en,nl},
 // Structural defaults (EN) for lint / FAQ index
 ...en,
 sims:[{id:"s14",title:"Concept sim · MCP Plugin"}],
 skipAutoDeckLink:true
};
