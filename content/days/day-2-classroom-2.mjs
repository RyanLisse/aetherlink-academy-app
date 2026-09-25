import {link,openMaterial,question,slide} from './model.mjs';

const d='classroom-2';

export default {
 day:2,
 kind:'classroom',
 deck:d,
 title:'Classroom 2 · Herbruikbare workflows',
 tag:'Klas',
 blurb:'Van losse prompts naar CLAUDE.md, skills, MCP en de kleinste nuttige teamworkflow.',
 kicker:'Classroom 2 · Van prompt naar workflow',
 lessonTitle:'Herbruikbare en verbonden AI-workflows',
 leerdoel:'Je legt vaste afspraken vast in CLAUDE.md, maakt van een herhaalde werkwijze een skill, haalt via MCP read-only context op en ontwerpt de kleinste nuttige teamworkflow. Dat artefact is het vertrekpunt voor Workshop 6 en 7.',
 loop:[
  {label:'CLAUDE.md',prompt:'Welke afspraken moet elke nieuwe sessie kennen zonder uitleg?'},
  {label:'Skill',prompt:'Welke werkwijze herhaal je en hoe maak je die herbruikbaar?'},
  {label:'Bounded run',prompt:'Welke reeks werk mag Claude doen en waar stopt het voor akkoord?'},
  {label:'MCP',prompt:'Welke informatie lees je read-only en welke acties keur je niet goed?'},
  {label:'Workflow',prompt:'Wat is de kleinste nuttige teamworkflow met een menselijk checkpoint?'},
  {label:'Handoff',prompt:'Welke use-case neem je mee naar Workshop 6?'}
 ],
 demo:{
  slides:[],
  script:[],
  open:'De Classroom 2-deck heeft geen aparte live-demo-dia. De facilitator kiest vóór de sessie welk onderdeel hij voordoet (bijvoorbeeld /mcp op dia 80).'
 },
 solo:[
  {id:'c2-a6',badge:'A6',title:'Opdracht 6 · Projectinstructies',goal:'Laat Claude uitzoeken hoe AetherBOT werkt, kies minstens drie eigen regels en vraag om de minimale blijvende instructies. Toon de wijziging vóór het bewerken.',doneWhen:'Een CLAUDE.md waarmee elke nieuwe sessie weet hoe AetherBOT zich moet gedragen, zonder mondelinge uitleg.',slide:slide(d,55,'Assignment 6: Project instructions')},
  {id:'c2-a7',badge:'A7',title:'Opdracht 7 · AetherBOT volgt je regels',goal:'Laat AetherBOT de regels uit CLAUDE.md volgen zonder ze in je prompt te herhalen. Test met vragen die moeten werken en vragen die een regel raken.',doneWhen:'AetherBOT volgt de regels, beantwoordt je nieuwe commando’s en zegt OPEN in plaats van te gokken.',slide:slide(d,57,'Assignment 7: Build AetherBOT from your rules')},
  {id:'c2-a9',badge:'A9',title:'Opdracht 9 · Leer Claude de methode',goal:'Bouw .claude/skills/create-concept-card/SKILL.md op basis van goedgekeurde kaarten. Echte bronnen vereist, onzekerheid blijft OPEN, stop voor menselijk akkoord vóór het schrijven.',doneWhen:'Een complete create-concept-card-skill, getest tegen de goedgekeurde kaarten.',slide:slide(d,66,'Assignment 9: Teach Claude the method')},
  {id:'c2-a10',badge:'A10',title:'Opdracht 10 · Bouw de kaartbibliotheek',goal:'Gebruik de skill op elke resterende goedgekeurde term, één voor één. Leg READY, REVISE of OPEN vast. Verzin niets en commit niets.',doneWhen:'Conceptkaarten voor alle geschikte termen plus een statusrapport voor menselijke review.',slide:slide(d,69,'Assignment 10: Build the card library')},
  {id:'c2-a12',badge:'A12',title:'Opdracht 12 · Verbonden context',goal:'Haal één geautoriseerd item read-only op via de goedgekeurde verbinding. Leg uit wat je ophaalde en welke acties de verbinding kan die je niet goedkeurde.',doneWhen:'Geen externe wijzigingen. Een uitleg in gewone taal met bron; onduidelijke punten als OPEN.',slide:slide(d,81,'Assignment 12: Connected context')},
  {id:'c2-a13',badge:'A13',title:'Opdracht 13 · Day-start-workflow',goal:'Ontwerp uit 2 tot 3 skills (ophalen, sorteren, briefen) een workflow die je dag start. Plan eerst, verander nooit een ticket en test in een verse sessie.',doneWhen:'Een herhaalbare workflow: verbonden, read-only, skills in vaste volgorde met een menselijk checkpoint, getest in een verse sessie.',slide:slide(d,84,'Assignment 13: Day-start workflow')}
 ],
 materials:[
  link('vehicle','Oefenrepository aetherlink-classroom-starter','https://github.com/jyse/aetherlink-classroom-starter','Zelfde kopie als Classroom 1'),
  openMaterial('naslag','Naslag Classroom 2','Het lesplan noemt voor Classroom 2 geen naslagbronnen.')
 ],
 proof:[
  'CLAUDE.md met minstens drie eigen regels die een verse sessie volgt zonder uitleg (opdracht 6 en 7, dia 55 en 57).',
  'Een create-concept-card-skill, getest tegen goedgekeurde kaarten; ontbrekende informatie blijft OPEN (opdracht 9, dia 66).',
  'Statusrapport met READY, REVISE of OPEN per term; niets gecommit (opdracht 10, dia 69).',
  'Eén verbonden item read-only opgehaald, zonder externe wijziging (opdracht 12, dia 81).',
  'Een day-start-workflow met skills in vaste volgorde en een menselijk checkpoint, getest in een verse sessie (opdracht 13, dia 84).',
  'De kleinste nuttige teamworkflow in één zin vastgelegd als use-case voor Workshop 6 (W6 dia 2).'
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
  goal:'Maak CLAUDE.md, een skill en een read-only workflow in je eigen kopie, en leg de kleinste nuttige teamworkflow vast als use-case voor Workshop 6.',
  allowed:['Werk alleen in je eigen lokale kopie van aetherlink-classroom-starter.','Gebruik verbonden systemen alleen read-only via de goedgekeurde verbinding.','Dien bewijs in; een mens beslist over acceptatie.'],
  starterFiles:[],
  hints:['Herhaal de regels uit CLAUDE.md niet in je prompt; test of Claude ze zelf volgt.','Een skill stopt voor menselijk akkoord vóór hij schrijft.','Noteer welke instructies je steeds opnieuw moest geven: dat is je skill.'],
  stretch:'Laat een partner je skills kopiëren en de workflow op eigen tickets draaien (opdracht 13, dia 84).'
 },
 openItems:[
  'Het lesplan noemt subagents en hooks voor Classroom 2; de deck heeft er geen dia voor.',
  'Het lesplan noemt geen naslagbronnen voor Classroom 2.',
  'De deck heeft geen aparte live-demo-dia; de facilitator kiest het demo-onderdeel.',
  'Opdracht 12 en 13 vragen per deelnemer een goedgekeurde Jira-verbinding via MCP (notities dia 80).'
 ]
};
