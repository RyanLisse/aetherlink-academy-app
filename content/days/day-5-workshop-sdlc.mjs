import {diagram,link,question,slide} from './model.mjs';

const d='workshop-5';

const DIAGRAM_EN=diagram(
 '/diagrams/workshop/w5-harness-loop.svg',
 'SDLC harness loop',
 'Intent → Spec → Plan (human gate) → Build → Test → Review → Gate (human) → handoff'
);
const DIAGRAM_NL=diagram(
 '/diagrams/workshop/w5-harness-loop.svg',
 'SDLC-harnesslus',
 'Intent → Spec → Plan (menselijke gate) → Build → Test → Review → Gate (mens) → handoff'
);

const DEMO_SLIDES=[
 slide(d,13,'Watch: Claude interviews, I cut.'),
 slide(d,17,'Watch: red schema → green'),
 slide(d,21,'Watch: plan mode until accept'),
 slide(d,28,'Watch: brief:sample → out/latest.html'),
 slide(d,34,'Watch: one read-only tool'),
 slide(d,38,'Watch: three commands + screenshot'),
 slide(d,44,'Watch: fill the gate, open the PR'),
];

const en = {
 title:'Workshop 5 · AI-native SDLC',
 tag:'Workshop',
 blurb:'From intent to spec, plan, build, test, review and handoff — with human gates in the daily-brief lab.',
 kicker:'Workshop 5 · SOLO 1 → 7',
 lessonTitle:'The line becomes a loop',
 motto:'Human gates keep the harness honest',
 leerdoel:'You walk intent → spec → plan → build → test → review → handoff in aetherlink-daily-brief-lab-s1. A human decides at every gate. At the end, seven files stand that a stranger can point to.',
 narrative:[
  'An AI-native SDLC is not “let the agent loose.” It is a harness loop around a stable lab vehicle: intent, spec, plan, build, test, review, gate — then handoff back into the next intent.',
  'Two human gates keep the loop honest: accept the plan before build, and fill docs/gate.md (PASS / FAIL / OPEN) with citations before you claim ship. The agent may use one read-only tool; no shell, no write.',
  'Keep the Apple bar rhythm — Uitleg → Voordoen → Zelf doen — on the Worldline deck. The new diagram and ConceptSim teach the harness; the lab still produces the seven files.',
 ],
 workedExample:'Mechanism: Plan→…→gate harness around aetherlink-daily-brief-lab-s1. Motto: human gates keep the harness honest. Step the ConceptSim without API keys, then run SOLO 1–7 on your branch.',
 loop:[
  {label:'Intent',prompt:'Which outcome can a stranger verify, and which bound is a rule — not a wish?'},
  {label:'Spec',prompt:'Which quoted example from reference/ turns the schema test red first?'},
  {label:'Plan',prompt:'Does every step have a proof command and a rollback?'},
  {label:'Build',prompt:'Which test went red and then green?'},
  {label:'Test',prompt:'Which three commands, exit codes, and quoted lines land in docs/evidence.md?'},
  {label:'Review',prompt:'PASS, FAIL, or OPEN in docs/gate.md — with citations?'},
  {label:'Handoff',prompt:'Which new intent.md follows from what you merged today?'}
 ],
 demo:{
  slides:DEMO_SLIDES,
  script:[
   'Show the harness-loop diagram: Plan and Gate are human pauses; the lab vehicle stays aetherlink-daily-brief-lab-s1.',
   'Step the ConceptSim (Plan → accept → build → evidence → gate) — no API key required.',
   'SOLO 1 (slide 13): open intent.md; Claude Code interviews one question at a time; the bound must be a rule, not a wish.',
   'SOLO 2 (slide 17): quote one field from reference/ in docs/spec.md, let test/schema.test.ts fail red then go green.',
   'SOLO 3 (slide 21): stay in plan mode, draft docs/plan.md with one proof command per step, pause for human accept.',
   'SOLO 4–7 (slides 28, 34, 38, 44): render out/latest.html, add one read-only tool, fill docs/evidence.md and docs/gate.md, open the PR.',
  ]
 },
 solo:[
  {id:'w5-solo1',badge:'1',level:'required',timerMinutes:15,title:'SOLO 1 · intent.md',goal:'One outcome sentence, three checks a stranger can run, a hard bound, owners, and at least one OPEN.',doneWhen:'The bound read aloud is a rule. A wish means NEEDS REVISION — no step 2.',slide:slide(d,14,'Write the outcome a stranger can verify.')},
  {id:'w5-solo2',badge:'2',level:'required',timerMinutes:25,title:'SOLO 2 · docs/spec.md and schema test',goal:'Quote an example from reference/ per field, let test/schema.test.ts fail red, then make src/brief.ts plus sample/brief.sample.json green.',doneWhen:'npm test is green and the test commit sits before brief.ts in git log.',slide:slide(d,18,'Quoted examples → red schema → green.')},
  {id:'w5-solo3',badge:'3',level:'required',timerMinutes:15,title:'SOLO 3 · design, ADR and plan',goal:'Write docs/design.md, one real ADR under docs/decisions/, and docs/plan.md with ordered steps, exact paths, one proof command per step, and rollback.',doneWhen:'Every step has a proof command and rollback; you stay in plan mode until a human accepts.',slide:slide(d,22,'Stay in plan mode until a human accepts.')},
  {id:'w5-solo4',badge:'4',level:'required',timerMinutes:25,title:'SOLO 4 · render the sample',goal:'Make test/render.test.ts red, then green with src/render.ts, and write out/latest.html with npm run brief:sample.',doneWhen:'npm run brief:sample produces out/latest.html; screenshot kept as proof.',slide:slide(d,29,'Red render test → green sample HTML.')},
  {id:'w5-solo5',badge:'5',level:'required',timerMinutes:20,title:'SOLO 5 · one read-only tool',goal:'Add one read-only tool to the agent, run npm run brief live, and trace every sentence to a tool call in run.log.',doneWhen:'No shell tool and no write tool; every sentence is traceable.',slide:slide(d,35,'One read-only tool. No shell, no write.')},
  {id:'w5-solo6',badge:'6',level:'required',timerMinutes:15,title:'SOLO 6 · docs/evidence.md',goal:'Run typecheck, test, and brief; note exit codes and one quoted line per command, a screenshot under docs/evidence/, and a reviewer.',doneWhen:'A stranger can re-run the three commands; PDF diffs sit as OPEN.',slide:slide(d,39,'Proof a stranger can re-run.')},
  {id:'w5-solo7',badge:'7',level:'required',timerMinutes:15,title:'SOLO 7 · gate and PR',goal:'Fill docs/gate.md with PASS, FAIL, or OPEN and citations; refuse PASS on unread checks; keep credentials out of the repo; open the PR.',doneWhen:'Gate filled, no secrets in the repo, and the PR is open.',slide:slide(d,45,'Fill the gate. Open the PR.')}
 ],
 materials:[
  link('vehicle','Lab repo aetherlink-daily-brief-lab-s1','https://github.com/RyanLisse/aetherlink-daily-brief-lab-s1','Slide 2; main is intentionally empty; private repo'),
  link('naslag','AI-native SDLC playbook','https://academy.claude.com/courses/ai-native-sdlc-playbook','NASLAG.md Support Day 1–2 · Anthropic Academy'),
  link('naslag','AI-native SDLC blog playbook','https://claude.com/blog/the-ai-native-sdlc-playbook','NASLAG.md Support Day 1–2 · claude.com/blog'),
  link('diagram','SDLC harness-loop diagram','/diagrams/workshop/w5-harness-loop.svg','Workshop 5 · AET-77 P0 retrofit')
 ],
 diagrams:[DIAGRAM_EN],
 simTitles:{'w5-sdlc-loop':'Concept sim · Plan → gate'},
 proof:[
  'intent.md with outcome, three verifiable checks, hard bound, owners, and at least one OPEN (slide 14).',
  'docs/spec.md and docs/plan.md, with the plan accepted by a human before build (slides 18 and 22).',
  'out/latest.html produced by npm run brief:sample (slide 29).',
  'docs/evidence.md with three commands, exit codes, quoted lines, screenshot, and reviewer (slide 39).',
  'docs/gate.md with PASS, FAIL, or OPEN and citations, and an open PR without secrets (slide 45).',
  'Together: seven files a stranger can point to (slide 48).',
  'Harness-loop diagram viewed; ConceptSim stepped Plan → gate without API keys.'
 ],
 quiz:[
  question('What order does the lab artifact chain follow?',['intent.md → docs/spec.md → docs/plan.md → diff + tests → PR → docs/gate.md','docs/plan.md → diff → intent.md → PR','PR → docs/gate.md → docs/spec.md → intent.md'],0,slide(d,48,'Seven files. One brief. One gate.')),
  question('When do you leave plan mode?',['As soon as the plan exists','When a human accepts the plan','After the first green test'],1,slide(d,22,'Stay in plan mode until a human accepts.')),
  question('What belongs in docs/evidence.md?',['A summary from the agent','Only a screenshot','Three commands with exit codes, one quoted line each, a screenshot, and a reviewer'],2,slide(d,37,'A command, its exit code, one quoted line, and the name of who reran it.'))
 ],
 mission:{
  id:'SDLC-BRIEF-05',
  title:'Walk the SDLC loop in the daily-brief lab',
  minutes:130,
  goal:'Complete SOLO 1 through 7 on your own branch of aetherlink-daily-brief-lab-s1, with a human accept at every gate, until a PR is open.',
  allowed:['Work on your own branch or fork of aetherlink-daily-brief-lab-s1.','The brief agent gets no shell tool and no write tool.','Credentials only in secrets, never in the repo; a human decides PASS.'],
  starterFiles:[],
  hints:['A bound that sounds like a wish is NEEDS REVISION.','Commit the test before brief.ts.','Refuse PASS on a check you have not read.'],
  stretch:'Pin the weekday schedule with gitlab-ci.example.yml or GitHub Actions (slides 41 and 45).'
 },
 openItems:[
  'aetherlink-daily-brief-lab-s1 is a private repository; per-participant access is not arranged in the lesson plan.'
 ]
};

const nl = {
 title:'Workshop 5 · AI-native SDLC',
 tag:'Workshop',
 blurb:'Van intent naar spec, plan, build, test, review en handoff, met menselijke gates in het daily-brief-lab.',
 kicker:'Workshop 5 · SOLO 1 → 7',
 lessonTitle:'De lijn wordt een lus',
 motto:'Menselijke gates houden de harness eerlijk',
 leerdoel:'Je doorloopt intent → spec → plan → build → test → review → handoff in aetherlink-daily-brief-lab-s1. Bij elke overgang beslist een mens. Aan het eind staan zeven bestanden die een vreemde kan aanwijzen.',
 narrative:[
  'Een AI-native SDLC is niet “laat de agent los.” Het is een harnesslus om een stabiel lab-voertuig: intent, spec, plan, build, test, review, gate — en daarna handoff terug naar de volgende intent.',
  'Twee menselijke gates houden de lus eerlijk: accepteer het plan vóór de build, en vul docs/gate.md (PASS / FAIL / OPEN) met citaten vóór je ship claimt. De agent mag één read-only tool; geen shell, geen write.',
  'Houd het Apple-bar-ritme — Uitleg → Voordoen → Zelf doen — op het Worldline-deck. Het nieuwe diagram en de ConceptSim leren de harness; het lab levert nog steeds de zeven bestanden.',
 ],
 workedExample:'Mechanisme: Plan→…→gate-harness om aetherlink-daily-brief-lab-s1. Motto: menselijke gates houden de harness eerlijk. Stap de ConceptSim zonder API-sleutels, daarna SOLO 1–7 op je branch.',
 loop:[
  {label:'Intent',prompt:'Welke uitkomst kan een vreemde controleren en welke grens is een regel, geen wens?'},
  {label:'Spec',prompt:'Welk geciteerd voorbeeld maakt de schematest eerst rood?'},
  {label:'Plan',prompt:'Heeft elke stap een bewijscommando en een rollback?'},
  {label:'Build',prompt:'Welke test werd rood en daarna groen?'},
  {label:'Test',prompt:'Welke drie commando’s, exitcodes en geciteerde regels staan in docs/evidence.md?'},
  {label:'Review',prompt:'PASS, FAIL of OPEN in docs/gate.md, met citaten?'},
  {label:'Handoff',prompt:'Welke nieuwe intent.md volgt uit wat je vandaag mergede?'}
 ],
 demo:{
  slides:DEMO_SLIDES,
  script:[
   'Toon het harnesslus-diagram: Plan en Gate zijn menselijke pauzes; het lab-voertuig blijft aetherlink-daily-brief-lab-s1.',
   'Stap de ConceptSim (Plan → akkoord → build → bewijs → gate) — geen API-sleutel nodig.',
   'SOLO 1 (dia 13): open intent.md; Claude Code interviewt één vraag per keer; de grens moet een regel zijn, geen wens.',
   'SOLO 2 (dia 17): citeer één veld uit reference/ in docs/spec.md, laat test/schema.test.ts rood falen en daarna groen worden.',
   'SOLO 3 (dia 21): blijf in plan mode, schets docs/plan.md met één bewijscommando per stap en pauzeer bij het menselijke akkoord.',
   'SOLO 4 tot 7 (dia 28, 34, 38, 44): render out/latest.html, voeg één read-only tool toe, vul docs/evidence.md en docs/gate.md en open de PR.',
  ]
 },
 solo:[
  {id:'w5-solo1',badge:'1',level:'required',timerMinutes:15,title:'SOLO 1 · intent.md',goal:'Eén uitkomstzin, drie controles die een vreemde kan uitvoeren, een harde grens, eigenaren en minstens één OPEN.',doneWhen:'De grens hardop gelezen is een regel. Een wens betekent NEEDS REVISION en geen stap 2.',slide:slide(d,14,'Write the outcome a stranger can verify.')},
  {id:'w5-solo2',badge:'2',level:'required',timerMinutes:25,title:'SOLO 2 · docs/spec.md en schematest',goal:'Citeer per veld een voorbeeld uit reference/, laat test/schema.test.ts rood falen en maak src/brief.ts plus sample/brief.sample.json groen.',doneWhen:'npm test is groen en de testcommit staat vóór brief.ts in git log.',slide:slide(d,18,'Quoted examples → red schema → green.')},
  {id:'w5-solo3',badge:'3',level:'required',timerMinutes:15,title:'SOLO 3 · design, ADR en plan',goal:'Schrijf docs/design.md, één echte ADR onder docs/decisions/ en docs/plan.md met geordende stappen, exacte paden, een bewijscommando per stap en rollback.',doneWhen:'Elke stap heeft een bewijscommando en rollback; je blijft in plan mode tot een mens akkoord geeft.',slide:slide(d,22,'Stay in plan mode until a human accepts.')},
  {id:'w5-solo4',badge:'4',level:'required',timerMinutes:25,title:'SOLO 4 · render de sample',goal:'Maak test/render.test.ts rood, dan groen met src/render.ts, en schrijf out/latest.html met npm run brief:sample.',doneWhen:'npm run brief:sample levert out/latest.html op; screenshot bewaard als bewijs.',slide:slide(d,29,'Red render test → green sample HTML.')},
  {id:'w5-solo5',badge:'5',level:'required',timerMinutes:20,title:'SOLO 5 · één read-only tool',goal:'Voeg één read-only tool toe aan de agent, run npm run brief live en herleid elke zin naar een tool-call in run.log.',doneWhen:'Geen shell-tool en geen write-tool; elke zin is herleidbaar.',slide:slide(d,35,'One read-only tool. No shell, no write.')},
  {id:'w5-solo6',badge:'6',level:'required',timerMinutes:15,title:'SOLO 6 · docs/evidence.md',goal:'Run typecheck, test en brief; noteer exitcodes en één geciteerde regel per commando, een screenshot onder docs/evidence/ en een reviewer.',doneWhen:'Een vreemde kan de drie commando’s opnieuw draaien; verschillen met de PDF’s staan als OPEN.',slide:slide(d,39,'Proof a stranger can re-run.')},
  {id:'w5-solo7',badge:'7',level:'required',timerMinutes:15,title:'SOLO 7 · gate en PR',goal:'Vul docs/gate.md met PASS, FAIL of OPEN en citaten, weiger PASS op ongelezen checks, houd credentials buiten de repo en open de PR.',doneWhen:'Gate ingevuld, geen secrets in de repo en de PR staat open.',slide:slide(d,45,'Fill the gate. Open the PR.')}
 ],
 materials:[
  link('vehicle','Lab-repository aetherlink-daily-brief-lab-s1','https://github.com/RyanLisse/aetherlink-daily-brief-lab-s1','Dia 2; main is expres leeg; privé-repository'),
  link('naslag','AI-native SDLC playbook','https://academy.claude.com/courses/ai-native-sdlc-playbook','NASLAG.md Support Day 1–2 · Anthropic Academy'),
  link('naslag','AI-native SDLC blog-playbook','https://claude.com/blog/the-ai-native-sdlc-playbook','NASLAG.md Support Day 1–2 · claude.com/blog'),
  link('diagram','SDLC-harnesslus-diagram','/diagrams/workshop/w5-harness-loop.svg','Workshop 5 · AET-77 P0-retrofit')
 ],
 diagrams:[DIAGRAM_NL],
 simTitles:{'w5-sdlc-loop':'Concept-sim · Plan → gate'},
 proof:[
  'intent.md met uitkomst, drie controleerbare checks, harde grens, eigenaren en minstens één OPEN (dia 14).',
  'docs/spec.md en docs/plan.md, met het plan geaccepteerd door een mens vóór de build (dia 18 en 22).',
  'out/latest.html gegenereerd door npm run brief:sample (dia 29).',
  'docs/evidence.md met drie commando’s, exitcodes, geciteerde regels, screenshot en reviewer (dia 39).',
  'docs/gate.md met PASS, FAIL of OPEN en citaten, en een open PR zonder secrets (dia 45).',
  'Samen zeven bestanden die een vreemde kan aanwijzen (dia 48).',
  'Harnesslus-diagram bekeken; ConceptSim Plan → gate gestapt zonder API-sleutels.'
 ],
 quiz:[
  question('Welke volgorde heeft de artefactketen in het lab?',['intent.md → docs/spec.md → docs/plan.md → diff + tests → PR → docs/gate.md','docs/plan.md → diff → intent.md → PR','PR → docs/gate.md → docs/spec.md → intent.md'],0,slide(d,48,'Seven files. One brief. One gate.')),
  question('Wanneer verlaat je plan mode?',['Zodra het plan er staat','Als een mens het plan accepteert','Na de eerste groene test'],1,slide(d,22,'Stay in plan mode until a human accepts.')),
  question('Wat hoort in docs/evidence.md?',['Een samenvatting van de agent','Alleen een screenshot','Drie commando’s met exitcodes, één geciteerde regel elk, een screenshot en een reviewer'],2,slide(d,37,'A command, its exit code, one quoted line, and the name of who reran it.'))
 ],
 mission:{
  id:'SDLC-BRIEF-05',
  title:'Doorloop de SDLC-lus in het daily-brief-lab',
  minutes:130,
  goal:'Doorloop SOLO 1 tot en met 7 op je eigen branch van aetherlink-daily-brief-lab-s1, met een menselijk akkoord bij elke gate, tot er een PR openstaat.',
  allowed:['Werk op je eigen branch of fork van aetherlink-daily-brief-lab-s1.','De brief-agent krijgt geen shell- en geen write-tool.','Credentials alleen in secrets, nooit in de repo; een mens beslist over PASS.'],
  starterFiles:[],
  hints:['Een grens die als wens klinkt is NEEDS REVISION.','Commit de test vóór brief.ts.','Weiger PASS op een check die je niet hebt gelezen.'],
  stretch:'Leg de weekday-schedule vast met gitlab-ci.example.yml of GitHub Actions (dia 41 en 45).'
 },
 openItems:[
  'aetherlink-daily-brief-lab-s1 is een privé-repository; toegang per deelnemer is niet geregeld in het lesplan.'
 ]
};

export default {
 day:5,
 kind:'workshop',
 deck:d,
 localeComplete:true,
 requireLocales:true,
 copy:{en,nl},
 // Structural defaults (NL) for lint / FAQ index — deck citations live here
 ...nl,
 sims:[{id:'w5-sdlc-loop',title:'Concept-sim · Plan → gate'}],
};
