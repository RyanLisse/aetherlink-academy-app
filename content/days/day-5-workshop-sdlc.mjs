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
 slide(d,35,'Watch: one read-only tool'),
 slide(d,39,'Watch: three commands + screenshot'),
 slide(d,45,'Watch: fill the gate, open the PR'),
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
  'Two human gates keep the loop honest: accept the plan before build, and fill docs/gate.md (PASS / FAIL / OPEN) with citations before you claim ship. Claude Code is the development helper and may run the checks you approve. The built brief-agent may use one read-only tool; no shell, no write.',
  'Every block follows the same rhythm: explanation, demonstration, then you do it yourself. The diagram and ConceptSim explain the harness; the lab produces the seven files.',
 ],
 workedExample:'Mechanism: Plan→…→gate harness around aetherlink-daily-brief-lab-s1. Motto: human gates keep the harness honest. Step the ConceptSim without API keys, walk the HTML course + Assignments + SOLO under /courses/aetherlink-daily-brief-lab-s1/ (modules 01–06), then run SOLO 1–7 on your branch if you clone the vehicle.',
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
   'SOLO 4–7 (slides 28, 35, 39, 45): render out/latest.html, add one read-only tool, fill docs/evidence.md and docs/gate.md, open the PR.',
  ]
 },
 solo:[
  {id:'w5-solo1',badge:'1',level:'required',timerMinutes:15,title:'SOLO 1 · intent.md',goal:'One outcome sentence, three checks a stranger can run, a hard bound, owners, and at least one OPEN.',prompts:["Read CLAUDE.md, SOLO.md, and the templates on my branch. Interview me one question at a time. Draft intent.md with one outcome, three observable checks, owners, a hard boundary, and one OPEN. Stop for my review. Do not implement code.", "Challenge my weakest check with one concrete counterexample. Revise only intent.md after my answer. Show the diff and stop."],watchFor:"Inspect intent.md yourself. Reject a vague boundary. Stop until you accept the checks; no implementation yet.",doneWhen:'The bound read aloud is a rule. A wish means NEEDS REVISION — no step 2.',slide:slide(d,14,'Write the outcome a stranger can verify.')},
  {id:'w5-solo2',badge:'2',level:'required',timerMinutes:25,title:'SOLO 2 · docs/spec.md and schema test',goal:'Quote an example from reference/ per field, let test/schema.test.ts fail red, then make src/brief.ts plus sample/brief.sample.json green.',prompts:["Read my accepted intent.md and reference/. Propose docs/spec.md with one quoted example per field. After I accept, write test/schema.test.ts and run it to show the expected red failure. Stop so I can inspect and commit the test. Then build src/brief.ts and sample/brief.sample.json until that test passes. Do not build a renderer or tools.", "Add one invalid sample of my choice to test/schema.test.ts. Prove the schema rejects it. Show the spec row, test output, and diff. Stop before SOLO 3."],watchFor:"Inspect the quoted spec rows and the actual red and green output. Commit the failing test before brief.ts. Stop after your invalid sample is rejected.",doneWhen:'npm test is green and the test commit sits before brief.ts in git log.',slide:slide(d,18,'Quoted examples → red schema → green.')},
  {id:'w5-solo3',badge:'3',level:'required',timerMinutes:15,title:'SOLO 3 · design, ADR and plan',goal:'Write docs/design.md, one real ADR under docs/decisions/, and docs/plan.md with ordered steps, exact paths, one proof command per step, and rollback.',prompts:["In plan mode, read intent.md, docs/spec.md, and the current diff. Propose docs/design.md, one decision under docs/decisions/, and docs/plan.md. Name exact paths, one proof command and rollback per step. Do not edit files or build. Stop for my acceptance.", "After I accept the plan, save only those design documents. Challenge one assumption with the case I choose. Show the revised plan and diff. Stop before building."],watchFor:"Plan mode is read-only. Accept the proposal yourself before Claude saves the design documents. No build begins before that acceptance.",doneWhen:'Every step has a proof command and rollback; you stay in plan mode until a human accepts.',slide:slide(d,22,'Stay in plan mode until a human accepts.')},
  {id:'w5-solo4',badge:'4',level:'required',timerMinutes:25,title:'SOLO 4 · render the sample',goal:'Prompt Claude Code to build and test the sample renderer, inspect out/latest.html, then change one house-style rule.',prompts:["Use my accepted docs/plan.md. First write test/render.test.ts and show the expected red failure. Then build src/render.ts and a sample-only src/main.ts. Escape untrusted text. Run the sample script and show out/latest.html. Use no API key or model call. Stop for my inspection.", "Change one house-style rule I choose. Add a failing test first, then make it pass. Regenerate out/latest.html and show the diff. Stop so I can inspect the page and save a 1440×900 screenshot."],watchFor:"Open out/latest.html yourself. Inspect the escaping test and your changed style rule. Keep the screenshot before continuing.",doneWhen:'npm run brief:sample produces out/latest.html; screenshot kept as proof.',slide:slide(d,29,'Red render test → green sample HTML.')},
  {id:'w5-solo5',badge:'5',level:'required',timerMinutes:20,title:'SOLO 5 · one read-only tool',goal:'Prompt Claude Code to build one read-only tool and inspect its tests. Trace live claims to run.log, or keep the live check OPEN.',prompts:["Read my accepted plan and schema. Build src/agent.ts, src/sources.ts, and test/agent.test.ts for one read-only tool. Connect src/main.ts to the agent for the live brief command while preserving brief:sample without model calls. Reuse tool() and guarded() if present. Give the brief-agent no shell or write tools. Prove the tool wiring and missing-source behavior with tests. Keep the sample path working. Stop for my review.", "Test one missing-source case I choose. Show the diff and observed test output. With configured credentials, run the brief and trace each factual claim to run.log. Without credentials, run the sample and mark the live check OPEN. Never print tokens. Stop for my inspection."],watchFor:"Claude Code builds and runs checks; the built brief-agent gets no shell or write tools. Inspect the tool trace. Missing credentials leave live evidence OPEN.",doneWhen:'Tool tests pass. The brief-agent has no shell or write tool. Live claims are traceable, or the live check is OPEN.',slide:slide(d,36,'One read-only tool. No shell, no write.')},
  {id:'w5-solo6',badge:'6',level:'required',timerMinutes:15,title:'SOLO 6 · docs/evidence.md',goal:'Run typecheck, test, and brief; note exit codes and one quoted line per command, a screenshot under docs/evidence/, and a reviewer.',prompts:["Run the existing typecheck, test, and brief:sample scripts. Record each actual command, exit code, and one output line in docs/evidence.md. Link my screenshot under docs/evidence/. Mark unrun checks OPEN. Do not change implementation to hide a failure. Stop for my review.", "Check the evidence against the extra case I choose. Show missing proof as OPEN. Stop while my reviewer reruns one command and compares the output. Record their actual name and result only afterward."],watchFor:"A reviewer reruns one real command and compares it with docs/evidence.md. Unrun checks stay OPEN. Stop until the screenshot and reviewer are recorded.",doneWhen:'A stranger can re-run the three commands; PDF diffs sit as OPEN.',slide:slide(d,40,'Proof a stranger can re-run.')},
  {id:'w5-solo7',badge:'7',level:'required',timerMinutes:15,title:'SOLO 7 · gate and PR',goal:'Fill docs/gate.md with PASS, FAIL, or OPEN and citations; refuse PASS on unread checks; keep credentials out of the repo; open the PR.',prompts:["Read intent.md, the diff, and docs/evidence.md. Draft docs/gate.md with evidence links and proposed FAIL or OPEN entries for missing checks. Leave PASS decisions to me. Prepare a PR description and weekday schedule without activating it. Do not merge, deploy, or publish. Stop for my decision.", "Use the OPEN item I choose to propose one new acceptance check. Show the gate diff and PR preview. After I decide the gate and approve publication, open the PR. Stop before merge or deployment."],watchFor:"You decide PASS, FAIL, or OPEN from evidence you read. Inspect the PR preview before publication. Keep deployment and scheduling inactive.",doneWhen:'Gate filled, no secrets in the repo, and the PR is open.',slide:slide(d,46,'Fill the gate. Open the PR.')}
 ],
 materials:[
  link('solo','HTML course · daily-brief modules 01–06','/courses/aetherlink-daily-brief-lab-s1/index.html','modules 01–06 · empty-main pedagogy'),
  link('assignment','Assignment · intent','/courses/aetherlink-daily-brief-lab-s1/intent.md','intent.md template'),
  link('assignment','Assignment · spec (flight plan)','/courses/aetherlink-daily-brief-lab-s1/docs/spec.md','docs/spec.md (+ design/plan)'),
  link('assignment','Assignment · gate (evidence)','/courses/aetherlink-daily-brief-lab-s1/docs/gate.md','docs/gate.md (+ evidence.md)'),
  link('solo','SOLO · seven-step loop','/courses/aetherlink-daily-brief-lab-s1/SOLO.md','walk alone · preserve empty-main'),
  link('naslag','Rulebook · CLAUDE.md / AGENTS.md / progress.md','/courses/aetherlink-daily-brief-lab-s1/CLAUDE.md','companions learner-reachable'),
  link('vehicle','Lab repo aetherlink-daily-brief-lab-s1','https://github.com/RyanLisse/aetherlink-daily-brief-lab-s1','Slide 2; main is intentionally empty; private repo'),
  link('naslag','AI-native SDLC playbook','https://academy.claude.com/courses/ai-native-sdlc-playbook','NASLAG.md Support Day 1–2 · Anthropic Academy'),
  link('naslag','AI-native SDLC blog playbook','https://claude.com/blog/the-ai-native-sdlc-playbook','NASLAG.md Support Day 1–2 · claude.com/blog'),
  link('diagram','SDLC harness-loop diagram','/diagrams/workshop/w5-harness-loop.svg','Workshop 5')
 ],
 diagrams:[DIAGRAM_EN],
 simTitles:{'w5-sdlc-loop':'Concept sim · Plan → gate'},
 proof:[
  'intent.md with outcome, three verifiable checks, hard bound, owners, and at least one OPEN (slide 14).',
  'docs/spec.md and docs/plan.md, with the plan accepted by a human before build (slides 18 and 22).',
  'out/latest.html produced by npm run brief:sample (slide 29).',
  'docs/evidence.md with three commands, exit codes, quoted lines, screenshot, and reviewer (slide 40).',
  'docs/gate.md with PASS, FAIL, or OPEN and citations, and an open PR without secrets (slide 46).',
  'Together: seven files a stranger can point to (slide 49).',
  'Harness-loop diagram viewed; ConceptSim stepped Plan → gate without API keys.'
 ],
 quiz:[
  question('What order does the lab artifact chain follow?',['intent.md → docs/spec.md → docs/plan.md → diff + tests → PR → docs/gate.md','docs/plan.md → diff → intent.md → PR','PR → docs/gate.md → docs/spec.md → intent.md'],0,slide(d,49,'Seven files. One brief. One gate.')),
  question('When do you leave plan mode?',['As soon as the plan exists','When a human accepts the plan','After the first green test'],1,slide(d,22,'Stay in plan mode until a human accepts.')),
  question('What belongs in docs/evidence.md?',['A summary from the agent','Only a screenshot','Three commands with exit codes, one quoted line each, a screenshot, and a reviewer'],2,slide(d,38,'A command, its exit code, one quoted line, and the name of who reran it.'))
 ],
 mission:{
  id:'SDLC-BRIEF-05',
  title:'Walk the SDLC loop in the daily-brief lab',
  minutes:130,
  goal:'Complete SOLO 1 through 7 on your own branch of aetherlink-daily-brief-lab-s1, with a human accept at every gate, until a PR is open.',
  allowed:['Work on your own branch or fork of aetherlink-daily-brief-lab-s1.','The brief agent gets no shell tool and no write tool.','Credentials only in secrets, never in the repo; a human decides PASS.'],
  starterFiles:[],
  hints:['A bound that sounds like a wish is NEEDS REVISION.','Commit the test before brief.ts.','Refuse PASS on a check you have not read.'],
  stretch:'Pin the weekday schedule with gitlab-ci.example.yml or GitHub Actions (slides 42 and 46).'
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
  'Twee menselijke gates houden de lus eerlijk: accepteer het plan vóór de build, en vul docs/gate.md (PASS / FAIL / OPEN) met citaten vóór je ship claimt. Claude Code helpt bij het bouwen en mag de checks uitvoeren die jij goedkeurt. De gebouwde brief-agent mag één alleen-lezen-tool gebruiken; geen shell, geen write.',
  'Elk blok volgt hetzelfde ritme: uitleg, voordoen en daarna zelf doen. Het diagram en de ConceptSim leggen de harness uit; het lab levert de zeven bestanden.',
 ],
 workedExample:'Mechanisme: Plan→…→gate-harness om aetherlink-daily-brief-lab-s1. Motto: menselijke gates houden de harness eerlijk. Stap de ConceptSim zonder API-sleutels, loop de HTML-cursus + Opdrachten + SOLO onder /courses/aetherlink-daily-brief-lab-s1/ (modules 01–06), daarna SOLO 1–7 op je branch als je de repository clonet.',
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
   'SOLO 4 tot 7 (dia 28, 35, 39, 45): render out/latest.html, voeg één read-only tool toe, vul docs/evidence.md en docs/gate.md en open de PR.',
  ]
 },
 solo:[
  {id:'w5-solo1',badge:'1',level:'required',timerMinutes:15,title:'SOLO 1 · intent.md',goal:'Eén uitkomstzin, drie controles die een vreemde kan uitvoeren, een harde grens, eigenaren en minstens één OPEN.',prompts:["Lees CLAUDE.md, SOLO.md en de sjablonen op mijn branch. Interview mij met één vraag per keer. Maak intent.md met één uitkomst, drie zichtbare checks, eigenaren, een harde grens en één OPEN. Stop voor mijn review. Bouw nog geen code.", "Bestrijd mijn zwakste check met één concreet tegenvoorbeeld. Pas na mijn antwoord alleen intent.md aan. Toon de diff en stop."],watchFor:"Bekijk intent.md zelf. Wijs een vage grens af. Stop tot jij de checks accepteert; bouw nog niets.",doneWhen:'De grens hardop gelezen is een regel. Een wens betekent NEEDS REVISION en geen stap 2.',slide:slide(d,14,'Write the outcome a stranger can verify.')},
  {id:'w5-solo2',badge:'2',level:'required',timerMinutes:25,title:'SOLO 2 · docs/spec.md en schematest',goal:'Citeer per veld een voorbeeld uit reference/, laat test/schema.test.ts rood falen en maak src/brief.ts plus sample/brief.sample.json groen.',prompts:["Lees mijn geaccepteerde intent.md en reference/. Stel docs/spec.md voor met per veld één geciteerd voorbeeld. Schrijf na mijn akkoord test/schema.test.ts en voer die uit tot de verwachte rode fout zichtbaar is. Stop zodat ik de test kan bekijken en committen. Bouw daarna src/brief.ts en sample/brief.sample.json tot die test slaagt. Bouw nog geen renderer of tools.", "Voeg één door mij gekozen ongeldig voorbeeld toe aan test/schema.test.ts. Bewijs dat het schema dit afwijst. Toon de specregel, testuitvoer en diff. Stop vóór SOLO 3."],watchFor:"Bekijk de geciteerde specregels en echte rode en groene uitvoer. Commit de falende test vóór brief.ts. Stop nadat jouw ongeldige voorbeeld is afgewezen.",doneWhen:'npm test is groen en de testcommit staat vóór brief.ts in git log.',slide:slide(d,18,'Quoted examples → red schema → green.')},
  {id:'w5-solo3',badge:'3',level:'required',timerMinutes:15,title:'SOLO 3 · design, ADR en plan',goal:'Schrijf docs/design.md, één echte ADR onder docs/decisions/ en docs/plan.md met geordende stappen, exacte paden, een bewijscommando per stap en rollback.',prompts:["Lees in plan mode intent.md, docs/spec.md en de huidige diff. Stel docs/design.md, één besluit onder docs/decisions/ en docs/plan.md voor. Noem exacte paden, één bewijscommando en herstelstap per stap. Bewerk geen bestanden en bouw niets. Stop voor mijn akkoord.", "Sla na mijn akkoord alleen die ontwerpdocumenten op. Toets één aanname met een door mij gekozen geval. Toon het aangepaste plan en de diff. Stop vóór het bouwen."],watchFor:"Plan mode is alleen-lezen. Accepteer zelf het voorstel voordat Claude de ontwerpdocumenten opslaat. Bouw pas na dat akkoord.",doneWhen:'Elke stap heeft een bewijscommando en rollback; je blijft in plan mode tot een mens akkoord geeft.',slide:slide(d,22,'Stay in plan mode until a human accepts.')},
  {id:'w5-solo4',badge:'4',level:'required',timerMinutes:25,title:'SOLO 4 · render de sample',goal:'Laat Claude Code de voorbeeldrenderer bouwen en testen. Bekijk out/latest.html en verander één huisstijlregel.',prompts:["Gebruik mijn geaccepteerde docs/plan.md. Schrijf eerst test/render.test.ts en toon de verwachte rode fout. Bouw daarna src/render.ts en een src/main.ts die alleen voorbeelddata gebruikt. Escape onbetrouwbare tekst. Voer het voorbeeldscript uit en toon out/latest.html. Gebruik geen API-sleutel of modelaanroep. Stop voor mijn inspectie.", "Verander één door mij gekozen huisstijlregel. Voeg eerst een falende test toe en maak die daarna groen. Genereer out/latest.html opnieuw en toon de diff. Stop zodat ik de pagina kan bekijken en een screenshot van 1440×900 kan opslaan."],watchFor:"Open out/latest.html zelf. Bekijk de escapingtest en jouw gewijzigde huisstijlregel. Bewaar het screenshot voordat je doorgaat.",doneWhen:'npm run brief:sample levert out/latest.html op; screenshot bewaard als bewijs.',slide:slide(d,29,'Red render test → green sample HTML.')},
  {id:'w5-solo5',badge:'5',level:'required',timerMinutes:20,title:'SOLO 5 · één read-only tool',goal:'Laat Claude Code één alleen-lezen-tool bouwen en testen. Herleid liveclaims tot run.log, of houd de livecheck OPEN.',prompts:["Lees mijn geaccepteerde plan en schema. Bouw src/agent.ts, src/sources.ts en test/agent.test.ts voor één alleen-lezen-tool. Verbind src/main.ts met de agent voor het live brief-commando. Behoud brief:sample zonder modelaanroepen. Hergebruik tool() en guarded() als die bestaan. Geef de brief-agent geen shell- of schrijftools. Bewijs de toolkoppeling en ontbrekende bronnen met tests. Houd het voorbeeldpad werkend. Stop voor mijn review.", "Test één door mij gekozen geval met een ontbrekende bron. Toon de diff en echte testuitvoer. Voer met ingestelde credentials de brief uit en herleid elke feitelijke claim tot run.log. Voer zonder credentials het voorbeeld uit en markeer de livecheck OPEN. Toon nooit tokens. Stop voor mijn inspectie."],watchFor:"Claude Code bouwt en controleert; de gebouwde brief-agent krijgt geen shell- of schrijftools. Bekijk de tooltrace. Ontbrekende credentials houden livebewijs OPEN.",doneWhen:'Tooltests slagen. De brief-agent heeft geen shell- of schrijftool. Liveclaims zijn herleidbaar, of de livecheck is OPEN.',slide:slide(d,36,'One read-only tool. No shell, no write.')},
  {id:'w5-solo6',badge:'6',level:'required',timerMinutes:15,title:'SOLO 6 · docs/evidence.md',goal:'Run typecheck, test en brief; noteer exitcodes en één geciteerde regel per commando, een screenshot onder docs/evidence/ en een reviewer.',prompts:["Voer de bestaande scripts typecheck, test en brief:sample uit. Noteer elk echt commando, de exitcode en één uitvoerregel in docs/evidence.md. Link mijn screenshot onder docs/evidence/. Markeer niet-uitgevoerde checks OPEN. Verander geen implementatie om fouten te verbergen. Stop voor mijn review.", "Toets het bewijs aan het extra geval dat ik kies. Markeer ontbrekend bewijs OPEN. Stop terwijl mijn reviewer één commando herhaalt en de uitvoer vergelijkt. Noteer pas daarna de echte naam en het resultaat."],watchFor:"Een reviewer herhaalt één echt commando en vergelijkt dit met docs/evidence.md. Niet-uitgevoerde checks blijven OPEN. Stop tot screenshot en reviewer zijn vastgelegd.",doneWhen:'Een vreemde kan de drie commando’s opnieuw draaien; verschillen met de PDF’s staan als OPEN.',slide:slide(d,40,'Proof a stranger can re-run.')},
  {id:'w5-solo7',badge:'7',level:'required',timerMinutes:15,title:'SOLO 7 · gate en PR',goal:'Vul docs/gate.md met PASS, FAIL of OPEN en citaten, weiger PASS op ongelezen checks, houd credentials buiten de repo en open de PR.',prompts:["Lees intent.md, de diff en docs/evidence.md. Maak een concept van docs/gate.md met bewijslinks en voorgestelde FAIL- of OPEN-regels voor ontbrekende checks. Laat PASS-besluiten aan mij. Bereid een PR-beschrijving en weekdagschema voor zonder het te activeren. Merge, deploy of publiceer niets. Stop voor mijn besluit.", "Gebruik het OPEN-punt dat ik kies om één nieuwe acceptatiecheck voor te stellen. Toon de gatediff en PR-preview. Open de PR pas nadat ik de gate beslis en publicatie goedkeur. Stop vóór merge of deployment."],watchFor:"Jij beslist PASS, FAIL of OPEN op basis van gelezen bewijs. Bekijk de PR-preview vóór publicatie. Activeer deployment en planning nog niet.",doneWhen:'Gate ingevuld, geen secrets in de repo en de PR staat open.',slide:slide(d,46,'Fill the gate. Open the PR.')}
 ],
 materials:[
  link('solo','HTML-cursus · daily-brief modules 01–06','/courses/aetherlink-daily-brief-lab-s1/index.html','modules 01–06 · lege-main-pedagogiek'),
  link('assignment','Opdracht · intent','/courses/aetherlink-daily-brief-lab-s1/intent.md','intent.md-sjabloon'),
  link('assignment','Opdracht · spec (vluchtplan)','/courses/aetherlink-daily-brief-lab-s1/docs/spec.md','docs/spec.md (+ design/plan)'),
  link('assignment','Opdracht · gate (bewijs)','/courses/aetherlink-daily-brief-lab-s1/docs/gate.md','docs/gate.md (+ evidence.md)'),
  link('solo','SOLO · zevenstappenlus','/courses/aetherlink-daily-brief-lab-s1/SOLO.md','alleen lopen · lege main behouden'),
  link('naslag','Rulebook · CLAUDE.md / AGENTS.md / progress.md','/courses/aetherlink-daily-brief-lab-s1/CLAUDE.md','companions bereikbaar voor lerenden'),
  link('vehicle','Lab-repository aetherlink-daily-brief-lab-s1','https://github.com/RyanLisse/aetherlink-daily-brief-lab-s1','Dia 2; main is expres leeg; privé-repository'),
  link('naslag','AI-native SDLC playbook','https://academy.claude.com/courses/ai-native-sdlc-playbook','NASLAG.md Support Day 1–2 · Anthropic Academy'),
  link('naslag','AI-native SDLC blog-playbook','https://claude.com/blog/the-ai-native-sdlc-playbook','NASLAG.md Support Day 1–2 · claude.com/blog'),
  link('diagram','SDLC-harnesslus-diagram','/diagrams/workshop/w5-harness-loop.svg','Workshop 5')
 ],
 diagrams:[DIAGRAM_NL],
 simTitles:{'w5-sdlc-loop':'Concept-sim · Plan → gate'},
 proof:[
  'intent.md met uitkomst, drie controleerbare checks, harde grens, eigenaren en minstens één OPEN (dia 14).',
  'docs/spec.md en docs/plan.md, met het plan geaccepteerd door een mens vóór de build (dia 18 en 22).',
  'out/latest.html gegenereerd door npm run brief:sample (dia 29).',
  'docs/evidence.md met drie commando’s, exitcodes, geciteerde regels, screenshot en reviewer (dia 40).',
  'docs/gate.md met PASS, FAIL of OPEN en citaten, en een open PR zonder secrets (dia 46).',
  'Samen zeven bestanden die een vreemde kan aanwijzen (dia 49).',
  'Harnesslus-diagram bekeken; ConceptSim Plan → gate gestapt zonder API-sleutels.'
 ],
 quiz:[
  question('Welke volgorde heeft de artefactketen in het lab?',['intent.md → docs/spec.md → docs/plan.md → diff + tests → PR → docs/gate.md','docs/plan.md → diff → intent.md → PR','PR → docs/gate.md → docs/spec.md → intent.md'],0,slide(d,49,'Seven files. One brief. One gate.')),
  question('Wanneer verlaat je plan mode?',['Zodra het plan er staat','Als een mens het plan accepteert','Na de eerste groene test'],1,slide(d,22,'Stay in plan mode until a human accepts.')),
  question('Wat hoort in docs/evidence.md?',['Een samenvatting van de agent','Alleen een screenshot','Drie commando’s met exitcodes, één geciteerde regel elk, een screenshot en een reviewer'],2,slide(d,38,'A command, its exit code, one quoted line, and the name of who reran it.'))
 ],
 mission:{
  id:'SDLC-BRIEF-05',
  title:'Doorloop de SDLC-lus in het daily-brief-lab',
  minutes:130,
  goal:'Doorloop SOLO 1 tot en met 7 op je eigen branch van aetherlink-daily-brief-lab-s1, met een menselijk akkoord bij elke gate, tot er een PR openstaat.',
  allowed:['Werk op je eigen branch of fork van aetherlink-daily-brief-lab-s1.','De brief-agent krijgt geen shell- en geen write-tool.','Credentials alleen in secrets, nooit in de repo; een mens beslist over PASS.'],
  starterFiles:[],
  hints:['Een grens die als wens klinkt is NEEDS REVISION.','Commit de test vóór brief.ts.','Weiger PASS op een check die je niet hebt gelezen.'],
  stretch:'Leg de weekday-schedule vast met gitlab-ci.example.yml of GitHub Actions (dia 42 en 46).'
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
