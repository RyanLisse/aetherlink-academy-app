import {diagram,link,question,slide} from './model.mjs';

const d='classroom-1';

const DIAGRAM_EN=diagram(
 '/diagrams/classroom/c1-explore-plan-change-verify-commit.svg',
 'Claude Code loop · explore → plan → change → verify → commit',
 'Repo → explore (read) → plan (approve) → change (one edit) → verify (real checks) → commit / handoff'
);
const DIAGRAM_NL=diagram(
 '/diagrams/classroom/c1-explore-plan-change-verify-commit.svg',
 'Claude Code-loop · explore → plan → change → verify → commit',
 'Repo → explore (lezen) → plan (akkoord) → change (één wijziging) → verify (echte checks) → commit / handoff'
);

const DEMO_SLIDES=[
 slide(d,26,'Repository exploration'),
 slide(d,27,'What Claude Code did'),
];

const SOLO=[
 {id:'c1-setup',badge:'0',title:'Set up the practice repository',goal:'Clone aetherlink-classroom-starter, run npm install and npm start, open http://localhost:3000 and start claude in a second terminal.',doneWhen:'The app is running; Profiles, Glossary and Library are empty; only the Game works.',slide:slide(d,34,'Practice repository setup')},
 {id:'c1-a1',badge:'A1',title:'Assignment 1 · Repository explorer',goal:'Have Claude Code explore the repository without changing anything: what the app does, where profile and glossary data live, start and validation commands, and risky files.',doneWhen:'A repository card with evidence. No code changed; unknowns marked OPEN.',slide:slide(d,35,'Assignment 1: Repository explorer')},
 {id:'c1-a2',badge:'A2',title:'Assignment 2 · Participant profile',goal:'Have it inspect the structure first, answer Claude’s questions, and approve the plan before any file changes. No confidential or unnecessary personal data.',doneWhen:'Your profile is on a working Profiles page and passes validation; the plan was approved before the first change.',slide:slide(d,37,'Assignment 2: Participant profile')},
 {id:'c1-a3',badge:'A3',title:'Assignment 3 · Glossary contribution',goal:'Pick one AI term that is still missing, follow the existing structure, and review the draft before the repository changes.',doneWhen:'A new glossary entry on a working Glossary page, reviewed as a draft before adding.',slide:slide(d,40,'Assignment 3: Glossary contribution')},
 {id:'c1-a4',badge:'A4',title:'Assignment 4 · Enriched concept card',goal:'Turn one glossary term into a full concept card. Open and read every source; a search result is not a check. Wait for approval, then run the checks.',doneWhen:'One verified concept card on a working Library page, with review PASS, REVISE or OPEN.',slide:slide(d,41,'Assignment 4: Enriched concept card')}
];

const SOLO_NL=[
 {id:'c1-setup',badge:'0',title:'Oefenrepository opzetten',goal:'Clone aetherlink-classroom-starter, draai npm install en npm start, open http://localhost:3000 en start claude in een tweede terminal.',doneWhen:'De app draait; Profiles, Glossary en Library zijn leeg, alleen de Game werkt.',slide:slide(d,34,'Practice repository setup')},
 {id:'c1-a1',badge:'A1',title:'Opdracht 1 · Repository-verkenner',goal:'Laat Claude Code de repository verkennen zonder iets te wijzigen: wat de app doet, waar profiel- en glossarydata staan, start- en validatiecommando’s en risicovolle bestanden.',doneWhen:'Een repository-kaart met bewijs. Geen code gewijzigd; onbekenden staan als OPEN.',slide:slide(d,35,'Assignment 1: Repository explorer')},
 {id:'c1-a2',badge:'A2',title:'Opdracht 2 · Deelnemersprofiel',goal:'Laat eerst de structuur inspecteren, beantwoord de vragen van Claude en keur het plan goed vóór een bestand verandert. Geen vertrouwelijke of onnodige persoonsgegevens.',doneWhen:'Je profiel staat op een werkende Profiles-pagina en slaagt voor de validatie; het plan was goedgekeurd vóór de eerste wijziging.',slide:slide(d,37,'Assignment 2: Participant profile')},
 {id:'c1-a3',badge:'A3',title:'Opdracht 3 · Glossary-bijdrage',goal:'Kies één AI-term die nog ontbreekt, volg de bestaande structuur en bekijk het concept vóór de repository verandert.',doneWhen:'Een nieuwe glossary-entry op een werkende Glossary-pagina, als concept gereviewd vóór toevoegen.',slide:slide(d,40,'Assignment 3: Glossary contribution')},
 {id:'c1-a4',badge:'A4',title:'Opdracht 4 · Verrijkte conceptkaart',goal:'Maak van één glossary-term een volledige conceptkaart. Open en lees elke bron; een zoekresultaat is geen controle. Wacht op akkoord en draai daarna de checks.',doneWhen:'Eén geverifieerde conceptkaart op een werkende Library-pagina, met review PASS, REVISE of OPEN.',slide:slide(d,41,'Assignment 4: Enriched concept card')}
];

const en = {
 title:'Classroom 1 · AI and Claude Code',
 tag:'Class',
 blurb:'From AI basics to working safely with Claude Code: explore, plan, change, verify, and commit / handoff.',
 kicker:'Classroom 1 · explore → commit',
 lessonTitle:'Working with Claude Code in a repository',
 motto:'explore → plan → change → verify → commit',
 leerdoel:'You use Claude Code in your own copy of the Aether Library following Explore → Plan → Create → Test → Human review → Handoff. You read first, approve the plan before anything changes, and mark what you cannot confirm as OPEN. The product mechanism cue is explore → plan → change → verify → commit (Create maps to change, Test to verify, Handoff to commit).',
 narrative:[
  'Classroom 1 teaches the Claude Code loop on the Aether Library practice repo: explore the tree with evidence, plan the smallest change, change only after approval, verify with a real command, then commit / handoff with file · command · result · owner.',
  'Tokens, context windows, and hallucinations are supporting beats. The mechanism is the loop — never silent edits, never invent OPEN facts.',
  'Keep the Apple bar rhythm — Uitleg → Voordoen → Zelf doen — and solos A1–A4. The new loop diagram and ConceptSim teach explore→plan→change→verify→commit; Jessy/Cons TD1 stays the pedagogy SoT.',
 ],
 workedExample:'Mechanism: Claude Code loop explore→plan→change→verify→commit on aetherlink-classroom-starter. Motto: explore → plan → change → verify → commit. Step the ConceptSim without API keys, then run A1–A4 on your machine.',
 loop:[
  {label:'Explore',prompt:'What does the repository do? Which files prove that?'},
  {label:'Plan',prompt:'What is the smallest change and what stays out of scope?'},
  {label:'Create',prompt:'Which one change do you make after the plan is approved? (maps to change)'},
  {label:'Test',prompt:'Which check did you actually run? (maps to verify)'},
  {label:'Human review',prompt:'PASS, REVISE or OPEN — on what evidence?'},
  {label:'Handoff',prompt:'What must a fresh reader know and who takes over? (maps to commit)'}
 ],
 demo:{
  slides:DEMO_SLIDES,
  script:[
   'Show slide 26 and run the prompt once on the demo machine: “Explore this repository without changing anything. Explain what the application does, how it is structured and how I can verify your explanation. Support your claims with evidence from the files. Mark anything you cannot confirm as OPEN.”',
   'With slide 27 discuss what Claude Code did: which files it read, which evidence it gave, and what stayed OPEN.',
   'Show the explore→plan→change→verify→commit diagram; map Create→change, Test→verify, Handoff→commit.',
   'Step the ConceptSim (glossary hallucination task through the loop) — no API key required.',
  ]
 },
 solo:SOLO,
 materials:[
  link('vehicle','Practice repo aetherlink-classroom-starter','https://github.com/jyse/aetherlink-classroom-starter','Slide 34'),
  link('naslag','Claude Code 101','https://anthropic.skilljar.com/claude-code-101','Anthropic Academy; lesson-plan reference'),
  link('naslag','Claude Code in Action','https://anthropic.skilljar.com/claude-code-in-action','Anthropic Academy; lesson-plan reference'),
  link('diagram','Claude Code loop diagram','/diagrams/classroom/c1-explore-plan-change-verify-commit.svg','Classroom 1 · AET-129 P3 retrofit')
 ],
 diagrams:[DIAGRAM_EN],
 simTitles:{'c1-agent-loop':'Concept sim · explore → commit'},
 proof:[
  'Repository card with evidence from the files; no code changed and unknowns marked OPEN (assignment 1, slide 35).',
  'Plan approved before the first file change (assignment 2, slide 37).',
  'Check run with the real command and observed outcome (assignment 4, slide 41).',
  'Review decision PASS, REVISE or OPEN with reason (slides 36 and 42).',
  'Handoff to a fresh reader: file, command, outcome, limitation and next owner.',
  'Loop diagram viewed; ConceptSim stepped explore→plan→change→verify→commit without API keys.'
 ],
 quiz:[
  question('Claude wants to “improve the repository”. What is missing first?',['An extra tool','A bounded goal with a check','A larger model'],1),
  question('The local mission does not need Jira data. Claude still asks for access. What do you do?',['Stop and discuss whether it is needed','Grant all permissions','Share a colleague’s token'],0),
  question('What is a strong handoff?',['“Everything works”','A persuasive agent summary','File, command run, outcome, limitation and next owner'],2)
 ],
 mission:{
  id:'CLASSROOM-01',
  title:'Explore and improve the Aether Library',
  minutes:25,
  goal:'Complete assignments 1 through 4 in your own copy of the Aether Library: read first, then an approved plan, one change per assignment, a real check and a review decision.',
  allowed:['Work only in your own local copy of aetherlink-classroom-starter.','Have Claude read and show a plan first; change only after approval.','Submit evidence; a human decides acceptance.'],
  starterFiles:[],
  hints:['Start with assignment 1: change nothing, only a card with evidence.','Ask Claude to show the plan before any file changes.','What you cannot confirm stays OPEN.'],
  stretch:'Have another participant review your concept card with PASS, REVISE or OPEN (slide 42).'
 },
 openItems:[]
};

const nl = {
 title:'Classroom 1 · AI en Claude Code',
 tag:'Klas',
 blurb:'Van AI-basis naar veilig werken met Claude Code: verkennen, plannen, maken, testen, reviewen en overdragen.',
 kicker:'Classroom 1 · explore → commit',
 lessonTitle:'Werken met Claude Code in een repository',
 motto:'explore → plan → change → verify → commit',
 leerdoel:'Je gebruikt Claude Code in je eigen kopie van de Aether Library volgens Explore → Plan → Create → Test → Human review → Handoff. Je laat eerst lezen, keurt het plan goed vóór er iets verandert en markeert wat je niet kunt bevestigen als OPEN. De product-mechanisme-cue is explore → plan → change → verify → commit (Create mapt op change, Test op verify, Handoff op commit).',
 narrative:[
  'Classroom 1 leert de Claude Code-loop op de Aether Library-oefenrepo: explore de boom met bewijs, plan de kleinste wijziging, change pas na akkoord, verify met een echt commando, daarna commit / handoff met bestand · commando · uitkomst · eigenaar.',
  'Tokens, contextvensters en hallucinaties zijn ondersteunende beats. Het mechanisme is de loop — nooit stille edits, nooit OPEN-feiten verzinnen.',
  'Houd het Apple-bar-ritme — Uitleg → Voordoen → Zelf doen — en solos A1–A4. Het nieuwe loopdiagram en de ConceptSim leren explore→plan→change→verify→commit; Jessy/Cons TD1 blijft de pedagogie-SoT.',
 ],
 workedExample:'Mechanisme: Claude Code-loop explore→plan→change→verify→commit op aetherlink-classroom-starter. Motto: explore → plan → change → verify → commit. Stap de ConceptSim zonder API-sleutels, daarna A1–A4 op je machine.',
 loop:[
  {label:'Explore',prompt:'Wat doet de repository? Welke bestanden bewijzen dat?'},
  {label:'Plan',prompt:'Wat is de kleinste wijziging en wat blijft buiten scope?'},
  {label:'Create',prompt:'Welke ene wijziging voer je uit na akkoord op het plan? (mapt op change)'},
  {label:'Test',prompt:'Welke controle heb je werkelijk gedraaid? (mapt op verify)'},
  {label:'Human review',prompt:'PASS, REVISE of OPEN, en op basis van welk bewijs?'},
  {label:'Handoff',prompt:'Wat moet een verse lezer weten en wie neemt het over? (mapt op commit)'}
 ],
 demo:{
  slides:DEMO_SLIDES,
  script:[
   'Toon dia 26 en voer de prompt één keer uit op de demomachine: “Explore this repository without changing anything. Explain what the application does, how it is structured and how I can verify your explanation. Support your claims with evidence from the files. Mark anything you cannot confirm as OPEN.”',
   'Bespreek met dia 27 wat Claude Code deed: welke bestanden het las, welk bewijs het gaf en wat OPEN bleef.',
   'Toon het explore→plan→change→verify→commit-diagram; map Create→change, Test→verify, Handoff→commit.',
   'Stap de ConceptSim (glossary-hallucination-taak door de loop) — geen API-sleutel nodig.',
  ]
 },
 solo:SOLO_NL,
 materials:[
  link('vehicle','Oefenrepository aetherlink-classroom-starter','https://github.com/jyse/aetherlink-classroom-starter','Dia 34'),
  link('naslag','Claude Code 101','https://anthropic.skilljar.com/claude-code-101','Anthropic Academy; lesplan-naslag'),
  link('naslag','Claude Code in Action','https://anthropic.skilljar.com/claude-code-in-action','Anthropic Academy; lesplan-naslag'),
  link('diagram','Claude Code-loopdiagram','/diagrams/classroom/c1-explore-plan-change-verify-commit.svg','Classroom 1 · AET-129 P3-retrofit')
 ],
 diagrams:[DIAGRAM_NL],
 simTitles:{'c1-agent-loop':'Concept-sim · explore → commit'},
 proof:[
  'Repository-kaart met bewijs uit de bestanden; geen code gewijzigd en onbekenden als OPEN (opdracht 1, dia 35).',
  'Plan goedgekeurd vóór de eerste bestandswijziging (opdracht 2, dia 37).',
  'Uitgevoerde controle met het echte commando en de waargenomen uitkomst (opdracht 4, dia 41).',
  'Reviewbesluit PASS, REVISE of OPEN met reden (dia 36 en 42).',
  'Overdracht aan een verse lezer: bestand, commando, uitkomst, beperking en volgende eigenaar.',
  'Loopdiagram bekeken; ConceptSim explore→plan→change→verify→commit gestapt zonder API-sleutels.'
 ],
 quiz:[
  question('Claude wil “de repository verbeteren”. Wat ontbreekt eerst?',['Een extra tool','Een begrensd doel met een controle','Een groter model'],1),
  question('De lokale missie vraagt geen Jira-data. Claude vraagt toch toegang. Wat doe je?',['Stoppen en de noodzaak bespreken','Alle permissies geven','Een collega-token delen'],0),
  question('Wat is een sterke overdracht?',['“Alles werkt”','Een overtuigende agentsamenvatting','Bestand, uitgevoerd commando, uitkomst, beperking en volgende eigenaar'],2)
 ],
 mission:{
  id:'CLASSROOM-01',
  title:'Verken en verbeter de Aether Library',
  minutes:25,
  goal:'Werk opdracht 1 tot en met 4 af in je eigen kopie van de Aether Library: eerst lezen, dan een goedgekeurd plan, één wijziging per opdracht, een echte controle en een reviewbesluit.',
  allowed:['Werk alleen in je eigen lokale kopie van aetherlink-classroom-starter.','Laat Claude eerst lezen en een plan tonen; wijzig pas na akkoord.','Dien bewijs in; een mens beslist over acceptatie.'],
  starterFiles:[],
  hints:['Begin met opdracht 1: niets wijzigen, alleen een kaart met bewijs.','Vraag Claude om het plan te tonen vóór een bestand verandert.','Wat je niet kunt bevestigen blijft OPEN.'],
  stretch:'Laat een andere deelnemer je conceptkaart reviewen met PASS, REVISE of OPEN (dia 42).'
 },
 openItems:[]
};

export default {
 day:1,
 kind:'classroom',
 deck:d,
 localeComplete:true,
 requireLocales:true,
 copy:{en,nl},
 // Structural defaults (NL) for lint / FAQ index — deck citations live here
 ...nl,
 sims:[{id:'c1-agent-loop',title:'Concept-sim · explore → commit'}],
};
