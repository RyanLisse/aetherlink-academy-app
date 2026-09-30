import {diagram,link,question,slide} from './model.mjs';

const d='classroom-2';

const DIAGRAM_EN=diagram(
 '/diagrams/classroom/c2-customize-stack.svg',
 'Customize stack · CLAUDE.md → skills → subagents → MCP/hooks',
 'Session → CLAUDE.md (standing rules) → skills → subagents → MCP/hooks · Agent Capability Map'
);
const DIAGRAM_NL=diagram(
 '/diagrams/classroom/c2-customize-stack.svg',
 'Customize-stack · CLAUDE.md → skills → subagents → MCP/hooks',
 'Sessie → CLAUDE.md (vaste regels) → skills → subagents → MCP/hooks · Agent Capability Map'
);

const SOLO=[
 {id:'c2-a6',badge:'A6',title:'Assignment 6 · Project instructions',goal:'Have Claude figure out how AetherBOT works, pick at least three of your own rules, and ask for the minimal lasting instructions. Show the change before editing.',doneWhen:'A CLAUDE.md that lets every new session know how AetherBOT should behave, without oral briefing.',slide:slide(d,55,'Assignment 6: Project instructions')},
 {id:'c2-a7',badge:'A7',title:'Assignment 7 · AetherBOT follows your rules',goal:'Have AetherBOT follow the rules from CLAUDE.md without repeating them in your prompt. Test with questions that should work and questions that hit a rule.',doneWhen:'AetherBOT follows the rules, answers your new commands, and says OPEN instead of guessing.',slide:slide(d,57,'Assignment 7: Build AetherBOT from your rules')},
 {id:'c2-a9',badge:'A9',title:'Assignment 9 · Teach Claude the method',goal:'Build .claude/skills/create-concept-card/SKILL.md from approved cards. Real sources required, uncertainty stays OPEN, stop for human approval before writing.',doneWhen:'A complete create-concept-card skill, tested against the approved cards.',slide:slide(d,66,'Assignment 9: Teach Claude the method')},
 {id:'c2-a10',badge:'A10',title:'Assignment 10 · Build the card library',goal:'Use the skill on every remaining approved term, one by one. Record READY, REVISE or OPEN. Invent nothing and commit nothing.',doneWhen:'Concept cards for all suitable terms plus a status report for human review.',slide:slide(d,69,'Assignment 10: Build the card library')},
 {id:'c2-a12',badge:'A12',title:'Assignment 12 · Connected context',goal:'Fetch one authorized item read-only via the approved connection. Explain what you fetched and which actions the connection can take that you did not approve.',doneWhen:'No external changes. A plain-language explanation with source; unclear points as OPEN.',slide:slide(d,81,'Assignment 12: Connected context')},
 {id:'c2-a13',badge:'A13',title:'Assignment 13 · Day-start workflow',goal:'Design a workflow from 2 to 3 skills (fetch, sort, brief) that starts your day. Plan first, never change a ticket, and test in a fresh session.',doneWhen:'A repeatable workflow: connected, read-only, skills in fixed order with a human checkpoint, tested in a fresh session.',slide:slide(d,84,'Assignment 13: Day-start workflow')}
];

const SOLO_NL=[
 {id:'c2-a6',badge:'A6',title:'Opdracht 6 · Projectinstructies',goal:'Laat Claude uitzoeken hoe AetherBOT werkt, kies minstens drie eigen regels en vraag om de minimale blijvende instructies. Toon de wijziging vóór het bewerken.',doneWhen:'Een CLAUDE.md waarmee elke nieuwe sessie weet hoe AetherBOT zich moet gedragen, zonder mondelinge uitleg.',slide:slide(d,55,'Assignment 6: Project instructions')},
 {id:'c2-a7',badge:'A7',title:'Opdracht 7 · AetherBOT volgt je regels',goal:'Laat AetherBOT de regels uit CLAUDE.md volgen zonder ze in je prompt te herhalen. Test met vragen die moeten werken en vragen die een regel raken.',doneWhen:'AetherBOT volgt de regels, beantwoordt je nieuwe commando’s en zegt OPEN in plaats van te gokken.',slide:slide(d,57,'Assignment 7: Build AetherBOT from your rules')},
 {id:'c2-a9',badge:'A9',title:'Opdracht 9 · Leer Claude de methode',goal:'Bouw .claude/skills/create-concept-card/SKILL.md op basis van goedgekeurde kaarten. Echte bronnen vereist, onzekerheid blijft OPEN, stop voor menselijk akkoord vóór het schrijven.',doneWhen:'Een complete create-concept-card-skill, getest tegen de goedgekeurde kaarten.',slide:slide(d,66,'Assignment 9: Teach Claude the method')},
 {id:'c2-a10',badge:'A10',title:'Opdracht 10 · Bouw de kaartbibliotheek',goal:'Gebruik de skill op elke resterende goedgekeurde term, één voor één. Leg READY, REVISE of OPEN vast. Verzin niets en commit niets.',doneWhen:'Conceptkaarten voor alle geschikte termen plus een statusrapport voor menselijke review.',slide:slide(d,69,'Assignment 10: Build the card library')},
 {id:'c2-a12',badge:'A12',title:'Opdracht 12 · Verbonden context',goal:'Haal één geautoriseerd item read-only op via de goedgekeurde verbinding. Leg uit wat je ophaalde en welke acties de verbinding kan die je niet goedkeurde.',doneWhen:'Geen externe wijzigingen. Een uitleg in gewone taal met bron; onduidelijke punten als OPEN.',slide:slide(d,81,'Assignment 12: Connected context')},
 {id:'c2-a13',badge:'A13',title:'Opdracht 13 · Day-start-workflow',goal:'Ontwerp uit 2 tot 3 skills (ophalen, sorteren, briefen) een workflow die je dag start. Plan eerst, verander nooit een ticket en test in een verse sessie.',doneWhen:'Een herhaalbare workflow: verbonden, read-only, skills in vaste volgorde met een menselijk checkpoint, getest in een verse sessie.',slide:slide(d,84,'Assignment 13: Day-start workflow')}
];

const en = {
 title:'Classroom 2 · Reusable workflows',
 tag:'Class',
 blurb:'From one-off prompts to CLAUDE.md, skills, subagents, MCP/hooks, and the smallest useful team workflow.',
 kicker:'Classroom 2 · CLAUDE.md → MCP/hooks',
 lessonTitle:'Reusable and connected AI workflows',
 motto:'CLAUDE.md → skills → subagents → MCP/hooks',
 leerdoel:'You capture standing agreements in CLAUDE.md, turn a repeated method into a skill, use bounded subagents when a role should stay scoped, fetch read-only context via MCP with hooks as gates, and design the smallest useful team workflow. That artefact is the starting point for Workshop 6 and 7.',
 narrative:[
  'Classroom 2 teaches the customize stack / Agent Capability Map: CLAUDE.md for always-on rules, skills for methods you re-type, subagents for bounded specialist runs, then MCP read-only context with hooks as stop/allow gates.',
  'Subagents and hooks get little slide time, so the story, diagram and ConceptSim cover the full stack while you practise in assignments A6–A13.',
  'Every block follows the same rhythm: explanation, demonstration, then you do it yourself. The stack diagram and ConceptSim support the assignments.',
 ],
 workedExample:'Mechanism: customize stack CLAUDE.md → skills → subagents → MCP/hooks on aetherlink-classroom-starter. Motto: CLAUDE.md → skills → subagents → MCP/hooks. Step ConceptSim c2-customize-stack (Agent Capability Map / smallest useful workflow) without API keys, then run A6–A13. Proof AC for day 2: use-case one-liner that Workshop 6 starts from + Agent Capability Map + one artefact. Room deck = Academy /classroom/2.',
 loop:[
  {label:'CLAUDE.md',prompt:'Which agreements must every new session know without briefing? (cite: slide 54 CLAUDE.md · A6–A7 slides 55/57)'},
  {label:'Skill',prompt:'Which method do you repeat and how do you make it reusable? (cite: slide 63 skills · A9–A10 slides 66/69)'},
  {label:'Bounded run',prompt:'Which sequence of work may Claude do, and where does it stop for approval? Subagents keep roles bounded (cite: stack diagram /diagrams/classroom/c2-customize-stack.svg · ConceptSim c2-customize-stack — no deck slide)'},
  {label:'MCP',prompt:'Which information do you read read-only, and which actions do you not approve? Hooks gate the rest (cite: slides 80/81 · A12)'},
  {label:'Workflow',prompt:'What is the smallest useful team workflow with a human checkpoint? Name it on your Agent Capability Map (cite: ConceptSim c2-customize-stack · A13 slide 84)'},
  {label:'Handoff',prompt:'Which use-case one-liner do you take to Workshop 6? Proof AC = Agent Capability Map + one artefact (feeds W6)'}
 ],
 demo:{
  slides:[],
  script:[
   'The Classroom 2 deck has no separate live-demo slide. Before the session, pick which piece you will demonstrate (for example /mcp on slide 80).',
   'Show the customize-stack diagram: CLAUDE.md → skills → subagents → MCP/hooks.',
   'Step the ConceptSim (Agent Capability Map / smallest useful workflow) — no API key required.',
   'Call out that subagents and hooks are in the lesson plan even when the deck has no slide for them.',
  ],
  open:'The Classroom 2 deck has no separate live-demo slide. The facilitator chooses before the session which part to demonstrate (for example /mcp on slide 80).'
 },
 solo:SOLO,
 materials:[
  link('solo','Solo-in-Claude · C1–C2 concepts','/solos/c1-c2-concepts/index.html','clone/open → claude → /start-solo → Proof'),
  link('assignment','Proof · artifact card','/solos/c1-c2-concepts/proof/artifact-card.html','paste into Academy Review'),
  link('vehicle','Practice repo aetherlink-classroom-starter','https://github.com/jyse/aetherlink-classroom-starter','Same copy as Classroom 1'),
  link('naslag','Introduction to Agent Skills','https://academy.claude.com/courses/introduction-to-agent-skills','NASLAG.md Teach Day 2 · Anthropic Academy'),
  link('naslag','Introduction to Subagents','https://academy.claude.com/courses/introduction-to-subagents','NASLAG.md Teach Day 2 · Anthropic Academy'),
  link('naslag','Agents / parallel','https://code.claude.com/docs/en/agents','NASLAG.md Teach Day 2 · code.claude.com'),
  link('naslag','Claude Code skills docs','https://code.claude.com/docs/en/skills','Official docs'),
  link('naslag','Sub-agents docs','https://code.claude.com/docs/en/sub-agents','Official docs'),
  link('naslag','Claude Code concepts (Carl)','https://ccforeveryone.com/guides/claude-code-concepts-explained','External guide · CC BY-NC-ND'),
  link('diagram','Customize stack diagram','/diagrams/classroom/c2-customize-stack.svg','Classroom 2')
 ],
 diagrams:[DIAGRAM_EN],
 simTitles:{'c2-customize-stack':'Concept sim · customize stack'},
 proof:[
  'CLAUDE.md with at least three own rules that a fresh session follows without briefing (assignments 6 and 7, slides 55 and 57).',
  'A create-concept-card skill, tested against approved cards; missing information stays OPEN (assignment 9, slide 66).',
  'Status report with READY, REVISE or OPEN per term; nothing committed (assignment 10, slide 69).',
  'One connected item fetched read-only, with no external change (assignment 12, slide 81).',
  'A day-start workflow with skills in fixed order and a human checkpoint, tested in a fresh session (assignment 13, slide 84) — candidate for the one artefact.',
  'Proof AC — use-case one-liner: the smallest useful team workflow in one sentence that Workshop 6 starts from (W6 slide 2 · A13 slide 84).',
  'Proof AC — expected day-2 Proof artefact: Agent Capability Map (CLAUDE.md → skills → subagents → MCP/hooks) + one artefact (CLAUDE.md, skill, or day-start workflow).',
  'Customize-stack diagram viewed (/diagrams/classroom/c2-customize-stack.svg); ConceptSim c2-customize-stack stepped CLAUDE.md → skills → subagents → MCP/hooks without API keys.'
 ],
 quiz:[
  question('What does CLAUDE.md not control?',['Which agreements Claude follows','Access: that is permissions and technical controls','How you test a change'],1,slide(d,54,'CLAUDE.md')),
  question('What does a skill not do by itself?',['Start Claude Code or keep it running','Describe a repeatable method','Point to a checklist'],0,slide(d,63,'Claude Code skills')),
  question('What is the expected result of assignment 12?',['Update the ticket with what you found','Try every action the connection offers','No external change; an explanation with source and OPEN points'],2,slide(d,81,'Assignment 12: Connected context'))
 ],
 mission:{
  id:'CLASSROOM-02',
  title:'From one prompt to a team workflow',
  minutes:25,
  goal:'Create CLAUDE.md, a skill and a read-only workflow in your own copy. Proof AC: the use-case one-liner Workshop 6 starts from + Agent Capability Map + one artefact from the stack.',
  allowed:['Work only in your own local copy of aetherlink-classroom-starter.','Use connected systems only read-only via the approved connection.','Submit evidence; a human decides acceptance.'],
  starterFiles:[],
  hints:['Do not repeat CLAUDE.md rules in your prompt; test whether Claude follows them.','A skill stops for human approval before it writes.','Note which instructions you kept retyping: that is your skill.'],
  stretch:'Have a partner copy your skills and run the workflow on their own tickets (assignment 13, slide 84).'
 },
 openItems:[
  'The lesson plan names subagents and hooks for Classroom 2; the deck has no slide for them — the stack diagram and ConceptSim teach them.',
  'The deck has no separate live-demo slide; the facilitator chooses the demo piece.',
  'Assignments 12 and 13 need an approved Jira connection via MCP per participant (notes slide 80).',
  'The room deck for this day is Academy /classroom/2.'
 ]
};

const nl = {
 title:'Classroom 2 · Herbruikbare workflows',
 tag:'Klas',
 blurb:'Van losse prompts naar CLAUDE.md, skills, subagents, MCP/hooks en de kleinste nuttige teamworkflow.',
 kicker:'Classroom 2 · CLAUDE.md → MCP/hooks',
 lessonTitle:'Herbruikbare en verbonden AI-workflows',
 motto:'CLAUDE.md → skills → subagents → MCP/hooks',
 leerdoel:'Je legt vaste afspraken vast in CLAUDE.md, maakt van een herhaalde werkwijze een skill, gebruikt begrensde subagents wanneer een rol scoped moet blijven, haalt via MCP read-only context op met hooks als gates, en ontwerpt de kleinste nuttige teamworkflow. Dat artefact is het vertrekpunt voor Workshop 6 en 7.',
 narrative:[
  'Classroom 2 leert de customize-stack / Agent Capability Map: CLAUDE.md voor always-on regels, skills voor methodes die je opnieuw typt, subagents voor begrensde specialistenruns, daarna MCP read-only context met hooks als stop/allow-gates.',
  'Subagents en hooks krijgen weinig diatijd, dus het verhaal, het diagram en de ConceptSim behandelen de volle stack terwijl je oefent in opdrachten A6–A13.',
  'Elk blok volgt hetzelfde ritme: uitleg, voordoen en daarna zelf doen. Het stackdiagram en de ConceptSim ondersteunen de opdrachten.',
 ],
 workedExample:'Mechanisme: customize-stack CLAUDE.md → skills → subagents → MCP/hooks op aetherlink-classroom-starter. Motto: CLAUDE.md → skills → subagents → MCP/hooks. Stap ConceptSim c2-customize-stack (Agent Capability Map / kleinste nuttige workflow) zonder API-sleutels, daarna A6–A13. Proof-AC voor dag 2: use-case-one-liner waar Workshop 6 mee start + Agent Capability Map + één artefact. Room-deck = Academy /classroom/2.',
 loop:[
  {label:'CLAUDE.md',prompt:'Welke afspraken moet elke nieuwe sessie kennen zonder uitleg? (cite: dia 54 CLAUDE.md · A6–A7 dia 55/57)'},
  {label:'Skill',prompt:'Welke werkwijze herhaal je en hoe maak je die herbruikbaar? (cite: dia 63 skills · A9–A10 dia 66/69)'},
  {label:'Bounded run',prompt:'Welke reeks werk mag Claude doen en waar stopt het voor akkoord? Subagents houden rollen begrensd (cite: stackdiagram /diagrams/classroom/c2-customize-stack.svg · ConceptSim c2-customize-stack — geen deck-dia)'},
  {label:'MCP',prompt:'Welke informatie lees je read-only en welke acties keur je niet goed? Hooks bewaken de rest (cite: dia 80/81 · A12)'},
  {label:'Workflow',prompt:'Wat is de kleinste nuttige teamworkflow met een menselijk checkpoint? Benoem die op je Agent Capability Map (cite: ConceptSim c2-customize-stack · A13 dia 84)'},
  {label:'Handoff',prompt:'Welke use-case-one-liner neem je mee naar Workshop 6? Proof-AC = Agent Capability Map + één artefact (voedt W6)'}
 ],
 demo:{
  slides:[],
  script:[
   'De Classroom 2-deck heeft geen aparte live-demo-dia. Kies vóór de sessie welk onderdeel je voordoet (bijvoorbeeld /mcp op dia 80).',
   'Toon het customize-stackdiagram: CLAUDE.md → skills → subagents → MCP/hooks.',
   'Stap de ConceptSim (Agent Capability Map / kleinste nuttige workflow) — geen API-sleutel nodig.',
   'Benoem dat subagents en hooks in het lesplan staan, ook als de deck er geen dia voor heeft.',
  ],
  open:'De Classroom 2-deck heeft geen aparte live-demo-dia. De facilitator kiest vóór de sessie welk onderdeel hij voordoet (bijvoorbeeld /mcp op dia 80).'
 },
 solo:SOLO_NL,
 materials:[
  link('solo','Solo-in-Claude · C1–C2-concepten','/solos/c1-c2-concepts/index.html','clone/open → claude → /start-solo → Proof'),
  link('assignment','Proof · artefactkaart','/solos/c1-c2-concepts/proof/artifact-card.html','plak in Academy Review'),
  link('vehicle','Oefenrepository aetherlink-classroom-starter','https://github.com/jyse/aetherlink-classroom-starter','Zelfde kopie als Classroom 1'),
  link('naslag','Introduction to Agent Skills','https://academy.claude.com/courses/introduction-to-agent-skills','NASLAG.md Teach Day 2 · Anthropic Academy'),
  link('naslag','Introduction to Subagents','https://academy.claude.com/courses/introduction-to-subagents','NASLAG.md Teach Day 2 · Anthropic Academy'),
  link('naslag','Agents / parallel','https://code.claude.com/docs/en/agents','NASLAG.md Teach Day 2 · code.claude.com'),
  link('naslag','Claude Code skills-docs','https://code.claude.com/docs/en/skills','Officiële docs'),
  link('naslag','Sub-agents-docs','https://code.claude.com/docs/en/sub-agents','Officiële docs'),
  link('naslag','Claude Code-concepten (Carl)','https://ccforeveryone.com/guides/claude-code-concepts-explained','Externe gids · CC BY-NC-ND'),
  link('diagram','Customize-stackdiagram','/diagrams/classroom/c2-customize-stack.svg','Classroom 2')
 ],
 diagrams:[DIAGRAM_NL],
 simTitles:{'c2-customize-stack':'Concept-sim · customize-stack'},
 proof:[
  'CLAUDE.md met minstens drie eigen regels die een verse sessie volgt zonder uitleg (opdracht 6 en 7, dia 55 en 57).',
  'Een create-concept-card-skill, getest tegen goedgekeurde kaarten; ontbrekende informatie blijft OPEN (opdracht 9, dia 66).',
  'Statusrapport met READY, REVISE of OPEN per term; niets gecommit (opdracht 10, dia 69).',
  'Eén verbonden item read-only opgehaald, zonder externe wijziging (opdracht 12, dia 81).',
  'Een day-start-workflow met skills in vaste volgorde en een menselijk checkpoint, getest in een verse sessie (opdracht 13, dia 84) — kandidaat voor het ene artefact.',
  'Proof-AC — use-case-one-liner: de kleinste nuttige teamworkflow in één zin vastgelegd als use-case waar Workshop 6 mee start (W6 dia 2 · A13 dia 84).',
  'Proof-AC — verwacht dag-2 Proof-artefact: Agent Capability Map (CLAUDE.md → skills → subagents → MCP/hooks) + één artefact (CLAUDE.md, skill of day-start-workflow).',
  'Customize-stackdiagram bekeken (/diagrams/classroom/c2-customize-stack.svg); ConceptSim c2-customize-stack gestapt CLAUDE.md → skills → subagents → MCP/hooks zonder API-sleutels.'
 ],
 quiz:[
  question('Wat regelt CLAUDE.md niet?',['Welke afspraken Claude volgt','Toegang: dat doen permissies en technische controles','Hoe je een wijziging test'],1,slide(d,54,'CLAUDE.md')),
  question('Wat doet een skill niet uit zichzelf?',['Claude Code starten of continu draaien','Een herhaalbare werkwijze beschrijven','Naar een checklist verwijzen'],0,slide(d,63,'Claude Code skills')),
  question('Wat is het verwachte resultaat van opdracht 12?',['Het ticket bijwerken met wat je vond','Alle acties van de verbinding uitproberen','Geen externe wijziging; een uitleg met bron en OPEN-punten'],2,slide(d,81,'Assignment 12: Connected context'))
 ],
 mission:{
  id:'CLASSROOM-02',
  title:'Van één prompt naar een teamworkflow',
  minutes:25,
  goal:'Maak CLAUDE.md, een skill en een read-only workflow in je eigen kopie. Proof-AC: de use-case-one-liner waar Workshop 6 mee start + Agent Capability Map + één artefact uit de stack.',
  allowed:['Werk alleen in je eigen lokale kopie van aetherlink-classroom-starter.','Gebruik verbonden systemen alleen read-only via de goedgekeurde verbinding.','Dien bewijs in; een mens beslist over acceptatie.'],
  starterFiles:[],
  hints:['Herhaal de regels uit CLAUDE.md niet in je prompt; test of Claude ze zelf volgt.','Een skill stopt voor menselijk akkoord vóór hij schrijft.','Noteer welke instructies je steeds opnieuw moest geven: dat is je skill.'],
  stretch:'Laat een partner je skills kopiëren en de workflow op eigen tickets draaien (opdracht 13, dia 84).'
 },
 openItems:[
  'Het lesplan noemt subagents en hooks voor Classroom 2; de deck heeft er geen dia voor — het stackdiagram en de ConceptSim leren ze.',
  'De deck heeft geen aparte live-demo-dia; de facilitator kiest het demo-onderdeel.',
  'Opdracht 12 en 13 vragen per deelnemer een goedgekeurde Jira-verbinding via MCP (notities dia 80).',
  'De room-deck voor deze dag is Academy /classroom/2.'
 ]
};

export default {
 day:2,
 kind:'classroom',
 deck:d,
 localeComplete:true,
 requireLocales:true,
 copy:{en,nl},
 // Structural defaults (NL) for lint / FAQ index — deck citations live here
 ...nl,
 sims:[{id:'c2-customize-stack',title:'Concept-sim · customize-stack'}],
};
