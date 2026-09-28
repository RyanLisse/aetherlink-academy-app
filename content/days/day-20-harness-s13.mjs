import {diagram,link,question} from './model.mjs';

const MIT_EN="Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code";
const MIT_NL="Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code";

const en = {
 title:"Harness · s13 Agent Teams",
 tag:'Harness',
 blurb:"Persistent teammates, shared tasks, optional worktrees, coordination protocols.",
 kicker:"Harness Engineering · s13",
 lessonTitle:"Agent Teams — Runtime and Coordination Protocols",
 motto:"When one agent cannot hold the whole job, let teammates divide the work",
 leerdoel:"You explain the Agent Teams mechanism, state the motto, and step the ConceptSim without API keys.",
 narrative:[
  "Large refactors benefit from parallel work, but users describe goals — not team design.",
  "Lead proposes teammates, builds the task graph, may attach worktrees, and gates plans before mutating tools.",
  "Idle teammates can claim newly unblocked work; the Lead combines results for the user.",
  "Harness layer: Team — how multiple agents divide work, share state, and stay under Lead control."
 ],
 workedExample:"Mechanism: spawn_teammate + shared task board + plan approval + optional task-bound worktrees.",
 loop:[{label:"Mechanism",prompt:"What is the harness layer for this chapter?"},{label:"Signals",prompt:"Which runtime signals or tools did you observe?"},{label:"Step",prompt:"Can you narrate the ConceptSim without an API key?"},{label:"Contrast",prompt:"How does this differ from the previous chapter?"}],
 solo:[{id:"s13-motto",badge:"1",title:"State the motto",goal:"Write the s13 motto and name the harness layer.",doneWhen:"Motto and harness layer named."},{id:"s13-mech",badge:"2",title:"Name the mechanism",goal:"In two sentences, explain what this chapter adds to the loop.",doneWhen:"Mechanism explained without a slide wall."},{id:"s13-sim",badge:"3",title:"Step the ConceptSim",goal:"Step the Agent Teams ConceptSim end-to-end.",doneWhen:"You can narrate each step without an API key."}],
 materials:[link('diagram',"Agent teams overview","/diagrams/harness/s13-agent-teams-overview.svg","EN SVG · MIT shareAI Lab"),link('diagram',"Team topology","/diagrams/harness/s13-team-topology.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s13 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s13_agent_teams","Reference only — do not iframe learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s13-agent-teams-overview.svg","Agent teams overview","Teammates under Lead control"),diagram("/diagrams/harness/s13-team-topology.svg","Team topology","Lead and teammates")],
 simTitles:{s13:"Concept sim · Agent Teams"},
 proof:["Motto and harness layer stated (s13).","Mechanism explained.","ConceptSim stepped without API keys."],
 quiz:[question("Who proposes the team?",["Any background thread","The Lead, with user confirmation before spawn","The SVG renderer"],1),question("What keeps teammates coordinated?",["Separate unread chats only","Shared task board, claims, and plan gates","Disabling permissions"],1),question("What is a worktree for here?",["Replacing MCP","An optional checkout bound to a task","Deleting blockedBy"],1)],
 mission:{
  id:"HARNESS-S13",
  title:"Explain and step Agent Teams",
  minutes:20,
  goal:"Name the s13 mechanism and step the ConceptSim end-to-end.",
  allowed:["Use the in-lesson diagram and ConceptSim only.","No live model API required for the concept path."],
  starterFiles:[],
  hints:["Use the diagram and ConceptSim only.","No live model API required for the concept path."]
 },
 demo:{
  slides:[],
  script:["Show the s13 diagram, then step the ConceptSim.","Emphasize: no API key for the concept path — scenario is preauthored."],
  open:"Harness chapters teach via narrative + SVG + ConceptSim (no Worldline deck slides required)."
 },
 attribution:"Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code",
 openItems:[]
};

const nl = {
 title:"Harness · s13 Agent Teams",
 tag:'Harness',
 blurb:"Persistente teammates, gedeelde taken, optionele worktrees, coördinatieprotocollen.",
 kicker:"Harness Engineering · s13",
 lessonTitle:"Agent Teams — runtime en coördinatieprotocollen",
 motto:"Als één agent het hele werk niet aankan, laat teammates het verdelen",
 leerdoel:"Je legt het mechanisme Agent Teams uit, noemt het motto, en stapt de ConceptSim zonder API-sleutels.",
 narrative:[
  "Grote refactors profiteren van parallel werk, maar gebruikers beschrijven doelen — niet teamontwerp.",
  "De Lead stelt teammates voor, bouwt de task-grafiek, kan worktrees koppelen en gate’t plannen vóór muterende tools.",
  "Idle teammates kunnen nieuw gedeblokkeerd werk claimen; de Lead combineert resultaten voor de gebruiker.",
  "Harness-laag: Team — hoe meerdere agents werk verdelen, state delen en onder Lead-controle blijven."
 ],
 workedExample:"Mechanisme: spawn_teammate + gedeeld taskboard + plangoedkeuring + optionele task-gebonden worktrees.",
 loop:[{label:"Mechanisme",prompt:"Wat is de harness-laag van dit hoofdstuk?"},{label:"Signalen",prompt:"Welke runtime-signalen of tools zag je?"},{label:"Stappen",prompt:"Kun je de ConceptSim navertellen zonder API-sleutel?"},{label:"Contrast",prompt:"Hoe verschilt dit van het vorige hoofdstuk?"}],
 solo:[{id:"s13-motto",badge:"1",title:"Noem het motto",goal:"Schrijf het s13-motto en noem de harness-laag.",doneWhen:"Motto en harness-laag genoemd."},{id:"s13-mech",badge:"2",title:"Noem het mechanisme",goal:"Leg in twee zinnen uit wat dit hoofdstuk aan de loop toevoegt.",doneWhen:"Mechanisme uitgelegd zonder dia-muur."},{id:"s13-sim",badge:"3",title:"Stap de ConceptSim",goal:"Stap de Agent Teams ConceptSim van begin tot eind.",doneWhen:"Je kunt elke stap navertellen zonder API-sleutel."}],
 materials:[link('diagram',"Agent-teams-overzicht","/diagrams/harness/s13-agent-teams-overview.svg","EN SVG · MIT shareAI Lab"),link('diagram',"Teamtopologie","/diagrams/harness/s13-team-topology.svg","EN SVG · MIT shareAI Lab"),link('naslag',"Upstream s13 README","https://github.com/shareAI-lab/learn-claude-code/tree/main/s13_agent_teams","Alleen referentie — geen iframe naar learn.shareai.run")],
 diagrams:[diagram("/diagrams/harness/s13-agent-teams-overview.svg","Agent-teams-overzicht","Teammates onder Lead-controle"),diagram("/diagrams/harness/s13-team-topology.svg","Teamtopologie","Lead en teammates")],
 simTitles:{s13:"Concept-sim · Agent Teams"},
 proof:["Motto en harness-laag genoemd (s13).","Mechanisme uitgelegd.","ConceptSim gestapt zonder API-sleutels."],
 quiz:[question("Wie stelt het team voor?",["Elke achtergrondthread","De Lead, met gebruikersbevestiging vóór spawn","De SVG-renderer"],1),question("Wat houdt teammates gecoördineerd?",["Alleen aparte ongelezen chats","Gedeeld taskboard, claims en plangoedkeuring","Permissies uitschakelen"],1),question("Waarvoor is een worktree hier?",["MCP vervangen","Een optionele checkout gebonden aan een taak","blockedBy wissen"],1)],
 mission:{
  id:"HARNESS-S13",
  title:"Leg Agent Teams uit en stap het",
  minutes:20,
  goal:"Noem het s13-mechanisme en stap de ConceptSim van begin tot eind.",
  allowed:["Gebruik alleen het diagram en de ConceptSim in de les.","Geen live model-API nodig voor het conceptpad."],
  starterFiles:[],
  hints:["Gebruik alleen het diagram en de ConceptSim.","Geen live model-API nodig voor het conceptpad."]
 },
 demo:{
  slides:[],
  script:["Toon het s13-diagram en stap daarna de ConceptSim.","Benadruk: geen API-sleutel voor het conceptpad — scenario is voorgeprogrammeerd."],
  open:"Harness-hoofdstukken werken via narratief + SVG + ConceptSim (geen Worldline-deckdia’s vereist)."
 },
 attribution:"Overgenomen/aangepast van shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code",
 openItems:[]
};

export default {
 day:20,
 kind:'harness',
 deck:'harness',
 localeComplete:true,
 requireLocales:true,
 copy:{en,nl},
 // Structural defaults (EN) for lint / FAQ index
 ...en,
 sims:[{id:"s13",title:"Concept sim · Agent Teams"}],
 skipAutoDeckLink:true
};
