import {diagram,link,question} from './model.mjs';

const COURSE='/courses/sre-oncall-agent';
const SIM_ID='sre-oncall-loop';
const SOURCE='https://github.com/RyanLisse/sre-oncall-agent';
const STEP_9_PROMPT='Read CLAUDE.md. Make bench case recovered-deploy pass by changing offlineVerdict only; keep all other cases and tests green; show me the plan before you edit';

const RUNS={
 start:[
  'git clone https://github.com/RyanLisse/sre-oncall-agent.git',
  'cd sre-oncall-agent',
  'npm ci',
  'npm run fixtures',
  'npm run check'
 ],
 inspect:[
  'Open fixtures/incidents/bad-deploy.json',
  'Open fixtures/telemetry/bad-deploy.json',
  'Open src/tools.ts'
 ],
 investigate:[
  'npm run investigate -- fixtures/incidents/bad-deploy.json --dry-run',
  'npm run investigate -- fixtures/incidents/slow-dependency.json --dry-run',
  'npm run investigate -- fixtures/incidents/noisy-alert.json --dry-run',
  'npm run investigate -- fixtures/incidents/mystery-errors.json --dry-run'
 ],
 adversarial:[
  'npm run investigate -- fixtures/incidents/adversarial.json --dry-run',
  'npm run investigate -- fixtures/incidents/bad-deploy.json --dry-run --max-turns 2'
 ],
 approval:[
  'npm run investigate -- fixtures/incidents/bad-deploy.json',
  'npm run approve -- fixtures/incidents/bad-deploy.json --by ""',
  'npm run approve -- fixtures/incidents/bad-deploy.json --by "Solo Learner"',
  'npm run watch -- fixtures/incidents/bad-deploy.json --metric error_rate --fix-at 2026-10-05T03:52:00Z --after fixtures/telemetry/after-rollback.json',
  'npm run watch -- fixtures/incidents/bad-deploy.json --metric error_rate --fix-at 2026-10-05T03:52:00Z'
 ],
 lessons:[
  'npm run investigate -- fixtures/incidents/bad-deploy.json --dry-run --show-lessons'
 ],
 bench:[
  'npm run bench',
  'npm run bench -- --raise'
 ],
 live:[
  'npm run doctor',
  'npm run demo',
  'npm run demo -- slow degrade',
  'npm run demo -- errors degrade',
  'npm run demo:watch',
  'npm run watch-deploy -- "Watch the next deployment for five minutes. If it fails, roll back automatically."'
 ],
 step9:[
  'npm run bench',
  'npm run check',
  'Open docs/gate-step-9.md'
 ]
};

const DIAGRAM_EN=[
 diagram(`${COURSE}/docs/diagrams/01-architecture.svg`,'The on-call loop','Alert, evidence, human decision, watch, lesson and ratchet.'),
 diagram(`${COURSE}/docs/diagrams/02-contract.svg`,'The evidence contract','A proposal must carry evidence and satisfy the contract.'),
 diagram(`${COURSE}/docs/diagrams/03-lessons.svg`,'The lessons loop','A human reviews proposed lessons before promotion.'),
 diagram(`${COURSE}/docs/diagrams/04-ratchet.svg`,'The bench ratchet','The bench floor only rises; harmful proposals stay at zero.')
];
const DIAGRAM_NL=[
 diagram(`${COURSE}/docs/diagrams/01-architecture.svg`,'De on-call-lus','Alert, bewijs, menselijk besluit, watch, les en ratchet.'),
 diagram(`${COURSE}/docs/diagrams/02-contract.svg`,'Het bewijscontract','Een voorstel bevat bewijs en voldoet aan het contract.'),
 diagram(`${COURSE}/docs/diagrams/03-lessons.svg`,'De lessenlus','Een mens beoordeelt voorgestelde lessen vóór promotie.'),
 diagram(`${COURSE}/docs/diagrams/04-ratchet.svg`,'De bench-ratchet','De benchgrens gaat alleen omhoog; schadelijke voorstellen blijven nul.')
];

const MATERIALS_EN=[
 link('solo','HTML course · SRE first responder',`${COURSE}/course/index.html`,'Standalone course'),
 link('solo','SOLO.md',`${COURSE}/SOLO.md`,'Steps 0–9'),
 link('naslag','README.md',`${COURSE}/README.md`,'Repository guide'),
 link('naslag','CLAUDE.md',`${COURSE}/CLAUDE.md`,'Project rules'),
 link('assignment','Human gate · Step 9',`${COURSE}/docs/gate-step-9.md`,'PASS / FAIL / OPEN'),
 link('naslag','Reference solution · Step 9',`${COURSE}/docs/solutions/step-9.md`,'compare after you tried'),
 link('vehicle','SRE source repository',SOURCE,'private repo'),
 link('solo','Workshop 5 · AI-native SDLC','/workshop/5','Same loop applied to operations'),
 ...DIAGRAM_EN.map((item,index)=>link('diagram',item.title,item.src,`Diagram ${index+1}`))
];
const MATERIALS_NL=[
 link('solo','HTML-cursus · SRE first responder',`${COURSE}/course/index.html`,'Zelfstandige cursus'),
 link('solo','SOLO.md',`${COURSE}/SOLO.md`,'Stappen 0–9'),
 link('naslag','README.md',`${COURSE}/README.md`,'Repositoryhandleiding'),
 link('naslag','CLAUDE.md',`${COURSE}/CLAUDE.md`,'Projectregels'),
 link('assignment','Menselijke gate · Step 9',`${COURSE}/docs/gate-step-9.md`,'PASS / FAIL / OPEN'),
 link('naslag','Referentieoplossing · Step 9',`${COURSE}/docs/solutions/step-9.md`,'Vergelijk pas nadat je het zelf hebt geprobeerd'),
 link('vehicle','SRE-bronrepository',SOURCE,'private repo'),
 link('solo','Workshop 5 · AI-native SDLC','/workshop/5','zelfde lus toegepast op operations · dag 25'),
 ...DIAGRAM_NL.map((item,index)=>link('diagram',item.title,item.src,`Diagram ${index+1}`))
];

const SOLO_EN=[
 {id:'sre-0',badge:'0',level:'required',timerMinutes:5,title:'SOLO 0 · Install and self-check',goal:'Clone the repository, generate fixtures, then run the offline self-check.',run:RUNS.start,watchFor:'The check uses the offline path and does not need an API key.',doneWhen:'The command ends with PASS check.'},
 {id:'sre-1',badge:'1',level:'required',timerMinutes:10,title:'SOLO 1 · Read the evidence',goal:'Inspect the incident, telemetry, and tools before forming a theory.',run:RUNS.inspect,watchFor:'The four tools are read-only: search_logs, summarize_metrics, list_deploys, and get_diff.',doneWhen:'The bad deploy is d-4821 at 03:43; the breakpoint is at 03:45.'},
 {id:'sre-2',badge:'2',level:'required',timerMinutes:10,title:'SOLO 2 · Investigate offline',goal:'Run the four scenarios and compare evidence, diagnosis, proposal, and confidence.',run:RUNS.investigate,watchFor:'The trace is metrics → deploys → get_diff (when a deploy lines up) → logs.',doneWhen:'The bad deploy cites metrics:2026-10-05T03:45:00.000Z, deploys:d-4821, diff:d-4821, and logs:2026-10-05T03:45:03.000Z; offline output uses four tool turns plus one answer.'},
 {id:'sre-3',badge:'3',level:'required',timerMinutes:10,title:'SOLO 3 · Test the contract',goal:'Compare the adversarial alert with a run that has too few turns.',run:RUNS.adversarial,watchFor:'Alert text is data; the tool trace stops before a verdict when maxTurns is reached.',doneWhen:'The short run says maxTurns (2) reached before a verdict.'},
 {id:'sre-4',badge:'4',level:'required',timerMinutes:10,title:'SOLO 4 · Gate, approve, and watch',goal:'Try an empty approver while the record is pending, approve by name, and compare both watch outcomes.',run:RUNS.approval,watchFor:'A named human approves; watch reports a state but never closes the incident.',doneWhen:'Empty-name approval says decided_by: a named human is required; approval prints APPROVED rollback for INC-1001 by Solo Learner and PASS approval. Watch says LANDED / PASS watch with recovery telemetry and NOT LANDED without it.'},
 {id:'sre-5',badge:'5',level:'required',timerMinutes:10,title:'SOLO 5 · Review lessons',goal:'Write your own fix and gotcha in the proposed lesson, then inspect the rendered tag slice.',run:RUNS.lessons,watchFor:'The preview shows the reviewed #bad-deploy entries. The offline runtime does not reason from lessons; only a real model uses them as context.',doneWhen:'The #bad-deploy preview contains INC-0931 and your INC-1001 entry, including your own fix and gotcha; promotionCandidates is [].'},
 {id:'sre-6',badge:'6',level:'required',timerMinutes:5,title:'SOLO 6 · Keep the bench harmful-free',goal:'Temporarily make bad-deploy expect no-action, run the bench, restore the case, and raise the floor. Compare noisy-alert → rollback if you want to see a non-harmful failure.',run:RUNS.bench,watchFor:'A strong action scored against a non-strong expectation is harmful; noisy-alert → rollback is a failed expectation but not harmful.',doneWhen:'The harmful edit prints 🚫 bad-deploy and FAIL bench; after restoring it, npm run bench -- --raise passes.'},
 {id:'sre-8',badge:'8',level:'stretch',timerMinutes:10,title:'SOLO 8 · Run the demos',goal:'Check the environment, run the live demo paths, and try the rejected watch-deploy sentence.',run:RUNS.live,watchFor:'The demo executor is separate from the read-only investigator; failures do not authorize automatic rollback.',doneWhen:'Doctor ends PASS doctor; the normal demo reaches LANDED / PASS watch, degrade proposals are refused, and the watch demo says FAILED watch and No automatic rollback.'},
 {id:'sre-9',badge:'9',level:'required',timerMinutes:25,title:'SOLO 9 · Ship a recovered-symptom change',goal:'Use the Workshop 5 loop: intent → red bench case → plan → build → check → named human gate → PR on your fork.',run:RUNS.step9,prompts:[STEP_9_PROMPT],watchFor:'The new case fails before the fix; only a named reviewer can record PASS at the human gate.',doneWhen:'The new case first shows 🚫 recovered-deploy; after the change npm run check ends PASS check, the bench shows ✅ recovered-deploy, and the original five cases are unchanged.'}
];

const SOLO_NL=[
 {id:'sre-0',badge:'0',level:'required',timerMinutes:5,title:'SOLO 0 · Installeren en zelf controleren',goal:'Clone de repository, maak de fixtures en run daarna de offline zelfcontrole.',run:RUNS.start,watchFor:'De check gebruikt het offline pad en heeft geen API-sleutel nodig.',doneWhen:'Het commando eindigt met PASS check.'},
 {id:'sre-1',badge:'1',level:'required',timerMinutes:10,title:'SOLO 1 · Lees het bewijs',goal:'Bekijk de incident-, telemetry- en toolbestanden voordat je een theorie vormt.',run:RUNS.inspect,watchFor:'De vier tools zijn read-only: search_logs, summarize_metrics, list_deploys en get_diff.',doneWhen:'De bad deploy is d-4821 om 03:43; de breakpoint staat op 03:45.'},
 {id:'sre-2',badge:'2',level:'required',timerMinutes:10,title:'SOLO 2 · Onderzoek offline',goal:'Run de vier scenario’s en vergelijk bewijs, diagnose, voorstel en vertrouwen.',run:RUNS.investigate,watchFor:'De trace is metrics → deploys → get_diff (als een deploy aansluit) → logs.',doneWhen:'De bad deploy citeert metrics:2026-10-05T03:45:00.000Z, deploys:d-4821, diff:d-4821 en logs:2026-10-05T03:45:03.000Z; offline gebruikt vier toolbeurten plus één antwoord.'},
 {id:'sre-3',badge:'3',level:'required',timerMinutes:10,title:'SOLO 3 · Test het contract',goal:'Vergelijk de adversarial-alert met een run die te weinig beurten heeft.',run:RUNS.adversarial,watchFor:'Alerttekst is data; de tooltrace stopt vóór een verdict als maxTurns is bereikt.',doneWhen:'De korte run meldt maxTurns (2) reached before a verdict.'},
 {id:'sre-4',badge:'4',level:'required',timerMinutes:10,title:'SOLO 4 · Gate, approve en watch',goal:'Probeer een lege approver zolang het record pending is, approve op naam en vergelijk beide watch-uitkomsten.',run:RUNS.approval,watchFor:'Een genoemde mens keurt goed; watch meldt een status maar sluit het incident niet.',doneWhen:'Lege approval meldt decided_by: a named human is required; approval toont APPROVED rollback for INC-1001 by Solo Learner en PASS approval. Watch meldt LANDED / PASS watch met herstelde telemetry en NOT LANDED zonder die telemetry.'},
 {id:'sre-5',badge:'5',level:'required',timerMinutes:10,title:'SOLO 5 · Beoordeel lessen',goal:'Schrijf zelf fix en gotcha in de voorgestelde les en bekijk daarna de gerenderde tag-slice.',run:RUNS.lessons,watchFor:'De preview toont de beoordeelde #bad-deploy-items. De offline runtime redeneert niet vanuit lessen; alleen een echt model gebruikt ze als context.',doneWhen:'De #bad-deploy-preview bevat INC-0931 en jouw INC-1001-item, met jouw eigen fix en gotcha; promotionCandidates is [].'},
 {id:'sre-6',badge:'6',level:'required',timerMinutes:5,title:'SOLO 6 · Houd de bench schadeloos',goal:'Laat bad-deploy tijdelijk no-action verwachten, run de bench, herstel de case en verhoog de grens. Vergelijk desgewenst noisy-alert → rollback voor een niet-schadelijke fout.',run:RUNS.bench,watchFor:'Een sterke actie met een niet-sterke verwachting is schadelijk; noisy-alert → rollback is een foutieve verwachting maar niet schadelijk.',doneWhen:'De schadelijke wijziging toont 🚫 bad-deploy en FAIL bench; na herstel slaagt npm run bench -- --raise.'},
 {id:'sre-8',badge:'8',level:'stretch',timerMinutes:10,title:'SOLO 8 · Run de demo’s',goal:'Controleer de omgeving, run de live demopaden en probeer de afgewezen watch-deploy-zin.',run:RUNS.live,watchFor:'De demo-executor staat los van de read-only investigator; een fout machtigt geen automatische rollback.',doneWhen:'Doctor eindigt met PASS doctor; de normale demo bereikt LANDED / PASS watch, degrade-voorstellen worden geweigerd en de watch-demo meldt FAILED watch en No automatic rollback.'},
 {id:'sre-9',badge:'9',level:'required',timerMinutes:25,title:'SOLO 9 · Ship een wijziging voor herstelde symptomen',goal:'Gebruik de Workshop 5-lus: intent → rode bench-case → plan → build → check → menselijke gate op naam → PR op je fork.',run:RUNS.step9,prompts:[STEP_9_PROMPT],watchFor:'De nieuwe case faalt vóór de fix; alleen een reviewer op naam kan PASS vastleggen bij de menselijke gate.',doneWhen:'De nieuwe case toont eerst 🚫 recovered-deploy; na de wijziging eindigt npm run check met PASS check, toont de bench ✅ recovered-deploy en zijn de oorspronkelijke vijf cases ongewijzigd.'}
];

const en={
 title:'Solo mission · AI SRE first responder',
 tag:'Solo mission',
 blurb:'Apply Workshop 5’s AI-native SDLC loop to operations, with a human owning every decision.',
 kicker:'Workshop 5 · operations loop',
 lessonTitle:'Read, cite, propose — human decides',
 motto:'The agent reads, cites and proposes; a named human decides, acts and closes.',
 leerdoel:'Apply Workshop 5’s AI-native SDLC loop to operations. Then use the same loop to change the agent in Step 9.',
 narrative:[
  'The first responder reads telemetry, deploys, diffs and logs. It cites evidence and proposes; it does not mitigate.',
  'A named human decides, acts and closes. Watch reports LANDED or NOT LANDED. Step 9 changes the offline rule through intent, a red bench case, a plan, a build, a green check, a human gate and a PR.'
 ],
 workedExample:'Follow the bad-deploy evidence from alert to watch; then make the recovered-deploy case pass on your own fork.',
 loop:[
  {label:'Alert',prompt:'What exact symptom crossed its threshold?'},
  {label:'Evidence',prompt:'Which source supports each line of the diagnosis?'},
  {label:'Contract',prompt:'Does the proposal cite enough evidence to pass?'},
  {label:'Human gate',prompt:'Who is named to decide and record the approval?'},
  {label:'Watch',prompt:'Did the metric land, and who closes the incident?'},
  {label:'Lesson',prompt:'What must a human review before a lesson is promoted?'},
  {label:'Ratchet',prompt:'Did harmful stay zero while the bench floor held?'}
 ],
 demo:{
  slides:[],
  script:[
   'Show the on-call loop diagram and its human gate.',
   'Step the sre-oncall-loop ConceptSim from alert to ratchet.',
   'Run npm run check and point to PASS check.'
  ],
  open:'Solo mission: walk it alone with SOLO.md and the HTML course; no deck slides required.'
 },
 solo:SOLO_EN,
 diagrams:DIAGRAM_EN,
 materials:MATERIALS_EN,
 simTitles:{[SIM_ID]:'ConceptSim · SRE on-call loop'},
 proof:[
  'npm run check ends with PASS check; the five baseline bench cases pass at 100%, harmful 0.',
  'Empty --by "" is refused with decided_by: a named human is required; a named approval is recorded.',
  'Watch produces both LANDED and NOT LANDED; a human closes the incident.',
  '--show-lessons previews INC-0931 and your INC-1001 fix/gotcha under #bad-deploy.',
  'The harmful bad-deploy edit prints 🚫 bad-deploy and FAIL bench; restore it before raising the floor.',
  'Step 9 moves red → green and docs/gate-step-9.md records a named reviewer.'
 ],
 quiz:[
  question('What can the four investigation tools change?',['Nothing; they are read-only.','They can roll back a deploy.','They can page the on-call.'],0),
  question('What does watch report, and who closes?',['LANDED or NOT LANDED; a named human closes.','Only LANDED; the agent closes.','The diagnosis; the model closes.'],0),
  question('What do lessons do in an offline run?',['They are shown, but only a real model uses them as context; the offline verdict is a fixed rule.','They change the offline verdict.','They approve the rollback.'],0)
 ],
 mission:{
  id:'SRE-ONCALL-25',
  title:'Solo mission · AI SRE first responder',
  minutes:110,
  goal:"Walk SOLO 0–9 in your own clone until Step 9's change has a named human gate and a PR on your fork.",
  allowed:['Use the read-only agent.','The default path is offline.','Use your own API key only for the stretch.','Never store the key in files.'],
  starterFiles:[],
  hints:['Read the cited evidence before accepting the diagnosis.','Keep the approval name explicit; watch does not close.','For Step 9, make the bench case red before you change the offline rule.'],
  stretch:'SOLO Step 7: run the real model with your own API key, set in the environment and never stored in a file.'
 },
 openItems:[
  'RyanLisse/sre-oncall-agent is a private repository; learner access is not arranged yet.',
  'Windows is verified in CI (windows-latest), not on a learner machine.'
 ]
};

const nl={
 title:'Solo-missie · AI-SRE first responder',
 tag:'Solo-missie',
 blurb:'Pas de AI-native SDLC-lus van Workshop 5 toe op operations, met een mens die elk besluit neemt.',
 kicker:'Workshop 5 · operations-lus',
 lessonTitle:'Lees, citeer, stel voor — de mens beslist',
 motto:'De agent leest, citeert en stelt voor; een mens op naam beslist, handelt en sluit af.',
 leerdoel:'Pas de AI-native SDLC-lus van Workshop 5 toe op operations. Gebruik diezelfde lus daarna om in Step 9 de agent te veranderen.',
 narrative:[
  'De first responder leest telemetry, deploys, diffs en logs. De agent citeert bewijs en doet een voorstel; hij voert geen mitigatie uit.',
  'Een mens op naam beslist, handelt en sluit af. Watch meldt LANDED of NOT LANDED. In Step 9 verander je de offline-regel via intent, een rode bench-case, een plan, een build, een groene check, een menselijke gate en een PR.'
 ],
 workedExample:'Volg het bewijs van de bad deploy van alert tot watch; laat daarna op je eigen fork de recovered-deploy-case slagen.',
 loop:[
  {label:'Alert',prompt:'Welk exact symptoom ging over de drempel?'},
  {label:'Bewijs',prompt:'Welke bron ondersteunt elke regel van de diagnose?'},
  {label:'Contract',prompt:'Bevat het voorstel genoeg bewijs om te slagen?'},
  {label:'Menselijke gate',prompt:'Wie beslist en legt de approval op naam vast?'},
  {label:'Watch',prompt:'Is de metric hersteld, en wie sluit het incident?'},
  {label:'Les',prompt:'Wat moet een mens beoordelen voordat een les wordt gepromoveerd?'},
  {label:'Ratchet',prompt:'Bleef harmful nul en hield de benchgrens stand?'}
 ],
 demo:{
  slides:[],
  script:[
   'Toon het diagram van de on-call-lus en de menselijke gate.',
   'Stap de sre-oncall-loop-ConceptSim van alert tot ratchet.',
   'Run npm run check en wijs PASS check aan.'
  ],
  open:'Solo-missie: doorloop dit zelf met SOLO.md en de HTML-cursus; er zijn geen deckdia’s nodig.'
 },
 solo:SOLO_NL,
 diagrams:DIAGRAM_NL,
 materials:MATERIALS_NL,
 simTitles:{[SIM_ID]:'ConceptSim · SRE on-call-lus'},
 proof:[
  'npm run check eindigt met PASS check; de vijf basis-benchcases slagen op 100%, harmful 0.',
  'Lege --by "" wordt geweigerd met decided_by: a named human is required; een approval op naam wordt vastgelegd.',
  'Watch geeft zowel LANDED als NOT LANDED; een mens sluit het incident.',
  '--show-lessons toont INC-0931 en jouw INC-1001-fix/gotcha onder #bad-deploy.',
  'De schadelijke bad-deploy-wijziging toont 🚫 bad-deploy en FAIL bench; herstel de case voordat je de grens verhoogt.',
  'Step 9 gaat van rood → groen en docs/gate-step-9.md legt een reviewer op naam vast.'
 ],
 quiz:[
  question('Wat kunnen de vier investigation-tools veranderen?',['Niets; ze zijn read-only.','Ze kunnen een deploy terugdraaien.','Ze kunnen de on-call pagineren.'],0),
  question('Wat meldt watch, en wie sluit af?',['LANDED of NOT LANDED; een mens op naam sluit af.','Alleen LANDED; de agent sluit af.','De diagnose; het model sluit af.'],0),
  question('Wat doen lessen in een offline run?',['Ze worden getoond, maar alleen een echt model gebruikt ze als context; het offline verdict is een vaste regel.','Ze veranderen het offline verdict.','Ze keuren de rollback goed.'],0)
 ],
 mission:{
  id:'SRE-ONCALL-25',
  title:'Solo-missie · AI-SRE first responder',
  minutes:110,
  goal:'Doorloop SOLO 0–9 in je eigen clone tot de wijziging uit Step 9 een menselijke gate op naam en een PR op je fork heeft.',
  allowed:['Gebruik de read-only agent.','Het standaardpad is offline.','Gebruik alleen voor de stretch je eigen API-sleutel.','Bewaar de sleutel nooit in bestanden.'],
  starterFiles:[],
  hints:['Lees het geciteerde bewijs voordat je de diagnose accepteert.','Noem de approver expliciet; watch sluit niet af.','Maak voor Step 9 eerst de bench-case rood en verander daarna pas de offline-regel.'],
  stretch:'SOLO Step 7: run het echte model met je eigen API-sleutel, ingesteld als omgevingsvariabele en nooit opgeslagen in een bestand.'
 },
 openItems:[
  'RyanLisse/sre-oncall-agent is a private repository; learner access is not arranged yet.',
  'Windows is verified in CI (windows-latest), not on a learner machine.'
 ]
};

export default {
 day:25,
 kind:'solo',
 deck:'workshop-5',
 localeComplete:true,
 requireLocales:true,
 skipAutoDeckLink:true,
 copy:{en,nl},
 ...en,
 sims:[{id:SIM_ID,title:'ConceptSim · SRE on-call loop'}]
};
