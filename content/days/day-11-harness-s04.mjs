import {diagram,link,question} from './model.mjs';

const MIT_EN="Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code";
const MIT_NL="Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code";

const en = {
 title:"Harness · s04 Hook System",
 tag:'Harness',
 blurb:"Hang on the loop — Pre/PostToolUse extension points.",
 kicker:"Harness Engineering · s04",
 lessonTitle:"Hooks — Hang on the Loop, Don't Write into It",
 motto:"Hang on the loop, don't write into it",
 leerdoel:"You explain why hooks hang outside the agent loop, name PreToolUse vs PostToolUse, and step the Hooks ConceptSim without API keys.",
 narrative:[
  "The s03 agent has permission checks. But every new check — log every bash call, auto git add after writes — means editing agent_loop itself.",
  "What you want to extend is behavior; what you keep modifying is the loop. The loop should stay a stable core; extensions hang on the outside.",
  "Hooks inject logic before and after tool execution (and around prompt submit / stop) without rewriting while True.",
  "Harness layer: Hooks — extension points that do not invade the loop."
 ],
 workedExample:"Mechanism: trigger_hooks(PreToolUse) before handler; PostToolUse after result; UserPromptSubmit / Stop around the turn. Motto: hang on the loop, don't write into it.",
 loop:[{label:"Prompt submit",prompt:"Did UserPromptSubmit hooks run before the LLM call?"},{label:"PreToolUse",prompt:"Which hooks ran before execute — allow, deny, or annotate?"},{label:"Execute",prompt:"Did the handler run only after hooks allowed it?"},{label:"PostToolUse",prompt:"What did PostToolUse see before the model got the result?"}],
 solo:[{id:"s04-motto",badge:"1",title:"State the motto",goal:"Write the s04 motto and name the harness layer.",doneWhen:"Motto and harness layer named."},{id:"s04-prepost",badge:"2",title:"Pre vs Post",goal:"Contrast PreToolUse and PostToolUse in one sentence each.",doneWhen:"Both contrasts written."},{id:"s04-sim",badge:"3",title:"Step the ConceptSim",goal:"Step Hooks sim through prompt → PreToolUse → result → PostToolUse.",doneWhen:"You can narrate each hook without an API key."}],
 materials:[link('diagram',"Hooks overview","/diagrams/harness/s04-hooks-overview.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s04 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s04_hooks","Reference only — do not iframe learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s04-hooks-overview.svg","Hooks overview","Pre/PostToolUse hang outside the loop")],
 simTitles:{s04:"Concept sim · Hooks"},
 proof:["Motto and harness layer stated (s04).","PreToolUse vs PostToolUse contrasted.","ConceptSim stepped without API keys."],
 quiz:[question("Where should logging and permission extensions live?",["Inside while True next to every handler","On hooks around the stable loop","Only in the system prompt"],1),question("When does PreToolUse run?",["After tool_result returns to the model","Before the tool handler executes","Only on Stop"],1),question("Why avoid writing into the loop?",["Hooks are slower","The loop stays a stable core; extensions hang outside","Models cannot see hooks"],1)],
 mission:{
  id:"HARNESS-S04",
  title:"Explain and step hooks",
  minutes:20,
  goal:"Name Pre/PostToolUse and step the Hooks ConceptSim end-to-end.",
  allowed:["Use the in-lesson diagram and ConceptSim only.","No live model API required for the concept path."],
  starterFiles:[],
  hints:["Look for trigger_hooks system events.","Handlers run only after PreToolUse allows."]
 },
 demo:{
  slides:[],
  script:["Show the hooks overview SVG, then step ConceptSim: UserPromptSubmit → tool_call → PreToolUse → result → PostToolUse.","Emphasize: extensions hang on the loop; the while True body stays thin."],
  open:"Harness chapters teach via narrative + SVG + ConceptSim (no Worldline deck slides required)."
 },
 attribution:"Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code",
 openItems:[]
};

const nl = {
 title:"Harness · s04 Hook-systeem",
 tag:'Harness',
 blurb:"Hang aan de loop — Pre/PostToolUse-uitbreidingspunten.",
 kicker:"Harness Engineering · s04",
 lessonTitle:"Hooks — hang aan de loop, schrijf er niet in",
 motto:"Hang aan de loop, schrijf er niet in",
 leerdoel:"Je legt uit waarom hooks buiten de agent-loop hangen, noemt PreToolUse versus PostToolUse, en stapt de Hooks ConceptSim zonder API-sleutels.",
 narrative:[
  "De s03-agent heeft permissiechecks. Maar elke nieuwe check — log elke bash-aanroep, auto git add na writes — betekent agent_loop zelf aanpassen.",
  "Wat je wilt uitbreiden is gedrag; wat je blijft wijzigen is de loop. De loop moet een stabiele kern blijven; uitbreidingen hangen eraan.",
  "Hooks injecteren logica vóór en na tooluitvoering (en rond prompt-submit / stop) zonder while True te herschrijven.",
  "Harness-laag: Hooks — uitbreidingspunten die de loop niet binnendringen."
 ],
 workedExample:"Mechanisme: trigger_hooks(PreToolUse) vóór de handler; PostToolUse na het resultaat; UserPromptSubmit / Stop rond de beurt. Motto: hang aan de loop, schrijf er niet in.",
 loop:[{label:"Prompt-submit",prompt:"Draaiden UserPromptSubmit-hooks vóór de LLM-aanroep?"},{label:"PreToolUse",prompt:"Welke hooks draaiden vóór execute — toestaan, weigeren of annoteren?"},{label:"Uitvoeren",prompt:"Draaide de handler pas nadat hooks toestonden?"},{label:"PostToolUse",prompt:"Wat zag PostToolUse vóór het model het resultaat kreeg?"}],
 solo:[{id:"s04-motto",badge:"1",title:"Noem het motto",goal:"Schrijf het s04-motto en noem de harness-laag.",doneWhen:"Motto en harness-laag genoemd."},{id:"s04-prepost",badge:"2",title:"Pre versus Post",goal:"Contrast PreToolUse en PostToolUse in elk één zin.",doneWhen:"Beide contrasten opgeschreven."},{id:"s04-sim",badge:"3",title:"Stap de ConceptSim",goal:"Stap de Hooks-sim: prompt → PreToolUse → resultaat → PostToolUse.",doneWhen:"Je kunt elke hook navertellen zonder API-sleutel."}],
 materials:[link('diagram',"Hooks-overzicht","/diagrams/harness/s04-hooks-overview.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s04 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s04_hooks","Alleen referentie — geen iframe naar learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s04-hooks-overview.svg","Hooks-overzicht","Pre/PostToolUse hangen buiten de loop")],
 simTitles:{s04:"Concept-sim · Hooks"},
 proof:["Motto en harness-laag genoemd (s04).","PreToolUse versus PostToolUse gecontrasteerd.","ConceptSim gestapt zonder API-sleutels."],
 quiz:[question("Waar horen logging- en permissie-uitbreidingen?",["In while True naast elke handler","Aan hooks rond de stabiele loop","Alleen in de system prompt"],1),question("Wanneer draait PreToolUse?",["Nadat tool_result terugkomt bij het model","Vóór de tool-handler uitvoert","Alleen bij Stop"],1),question("Waarom niet in de loop schrijven?",["Hooks zijn trager","De loop blijft stabiele kern; uitbreidingen hangen erbuiten","Modellen zien hooks niet"],1)],
 mission:{
  id:"HARNESS-S04",
  title:"Leg hooks uit en stap ze",
  minutes:20,
  goal:"Noem Pre/PostToolUse en stap de Hooks ConceptSim van begin tot eind.",
  allowed:["Gebruik alleen het diagram en de ConceptSim in de les.","Geen live model-API nodig voor het conceptpad."],
  starterFiles:[],
  hints:["Zoek naar trigger_hooks-systeemevents.","Handlers draaien pas nadat PreToolUse toestaat."]
 },
 demo:{
  slides:[],
  script:["Toon de hooks-overview-SVG en stap daarna ConceptSim: UserPromptSubmit → tool_call → PreToolUse → resultaat → PostToolUse.","Benadruk: uitbreidingen hangen aan de loop; de while True-body blijft dun."],
  open:"Harness-hoofdstukken werken via narratief + SVG + ConceptSim (geen Worldline-deckdia’s vereist)."
 },
 attribution:"Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code",
 openItems:[]
};

export default {
 day:11,
 kind:'harness',
 deck:'harness',
 localeComplete:true,
 requireLocales:true,
 copy:{en,nl},
 // Structural defaults (EN) for lint / FAQ index
 ...en,
 sims:[{id:"s04",title:"Concept sim · Hooks"}],
 skipAutoDeckLink:true
};
