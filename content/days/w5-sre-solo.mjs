import {diagram,link} from './model.mjs';

const COURSE='/courses/sre-oncall-agent';
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

export const SRE_SIM_ID='sre-oncall-loop';
export const SRE_DIAGRAMS={en:DIAGRAM_EN,nl:DIAGRAM_NL};
export const SRE_SIM_TITLES={
 en:'ConceptSim · SRE on-call loop',
 nl:'ConceptSim · SRE on-call-lus'
};

const MATERIALS_EN=[
 link('solo','Solo mission · AI SRE first responder',`${COURSE}/course/index.html`,'same loop applied to operations'),
 link('solo','SOLO.md',`${COURSE}/SOLO.md`,'Steps 0–9'),
 link('naslag','README.md',`${COURSE}/README.md`,'Repository guide'),
 link('naslag','CLAUDE.md',`${COURSE}/CLAUDE.md`,'Project rules'),
 link('assignment','Human gate · Step 9',`${COURSE}/docs/gate-step-9.md`,'PASS / FAIL / OPEN'),
 link('naslag','Reference solution · Step 9',`${COURSE}/docs/solutions/step-9.md`,'compare after you tried'),
 link('vehicle','SRE source repository',SOURCE,'private repo')
];
const MATERIALS_NL=[
 link('solo','Solo-missie · AI-SRE first responder',`${COURSE}/course/index.html`,'zelfde lus, toegepast op operations'),
 link('solo','SOLO.md',`${COURSE}/SOLO.md`,'Stappen 0–9'),
 link('naslag','README.md',`${COURSE}/README.md`,'Repositoryhandleiding'),
 link('naslag','CLAUDE.md',`${COURSE}/CLAUDE.md`,'Projectregels'),
 link('assignment','Menselijke gate · Stap 9',`${COURSE}/docs/gate-step-9.md`,'PASS / FAIL / OPEN'),
 link('naslag','Referentieoplossing · Stap 9',`${COURSE}/docs/solutions/step-9.md`,'Vergelijk pas nadat je het zelf hebt geprobeerd'),
 link('vehicle','SRE-bronrepository',SOURCE,'private repo')
];

export const SRE_MATERIALS={en:MATERIALS_EN,nl:MATERIALS_NL};

const STEPS_EN=[
 {id:'sre-0',badge:'S0',level:'stretch',timerMinutes:5,title:'SRE solo 0 · Install and self-check',goal:'Clone the repository, generate fixtures, then run the offline self-check.',run:RUNS.start,watchFor:'The check uses the offline path and does not need an API key.',doneWhen:'The command ends with PASS check.'},
 {id:'sre-1',badge:'S1',level:'stretch',timerMinutes:10,title:'SRE solo 1 · Read the evidence',goal:'Inspect the incident, telemetry, and tools before forming a theory.',run:RUNS.inspect,watchFor:'The four tools are read-only: search_logs, summarize_metrics, list_deploys, and get_diff.',doneWhen:'The bad deploy is d-4821 at 03:43; the breakpoint is at 03:45.'},
 {id:'sre-2',badge:'S2',level:'stretch',timerMinutes:10,title:'SRE solo 2 · Investigate offline',goal:'Run the four scenarios and compare evidence, diagnosis, proposal, and confidence.',run:RUNS.investigate,watchFor:'The trace is metrics → deploys → get_diff (when a deploy lines up) → logs. Verdicts include data_gaps; high confidence is refused while gaps exist.',doneWhen:'The bad deploy cites metrics:2026-10-05T03:45:00.000Z, deploys:d-4821, diff:d-4821, and logs:2026-10-05T03:45:03.000Z; offline output uses four tool turns plus one answer. Its structured verdict includes data_gaps: [].'},
 {id:'sre-3',badge:'S3',level:'stretch',timerMinutes:10,title:'SRE solo 3 · Test the contract',goal:'Compare the adversarial alert with a run that has too few turns.',run:RUNS.adversarial,watchFor:'Alert text is data; the tool trace stops before a verdict when maxTurns is reached.',doneWhen:'The short run says maxTurns (2) reached before a verdict.'},
 {id:'sre-4',badge:'S4',level:'stretch',timerMinutes:10,title:'SRE solo 4 · Gate, approve, and watch',goal:'Try an empty approver while the record is pending, approve by name, and compare both watch outcomes.',run:RUNS.approval,watchFor:'A named human approves; watch reports a state but never closes the incident.',doneWhen:'Empty-name approval says decided_by: a named human is required; approval prints APPROVED rollback for INC-1001 by Solo Learner and PASS approval. Watch says LANDED / PASS watch with recovery telemetry and NOT LANDED without it.'},
 {id:'sre-5',badge:'S5',level:'stretch',timerMinutes:10,title:'SRE solo 5 · Review lessons',goal:'Write your own fix and gotcha in the proposed lesson, then inspect the rendered tag slice.',run:RUNS.lessons,watchFor:'The preview shows the reviewed #bad-deploy entries. The offline runtime does not reason from lessons; only a real model uses them as context.',doneWhen:'The #bad-deploy preview contains INC-0931 and your INC-1001 entry, including your own fix and gotcha; promotionCandidates is [].'},
 {id:'sre-6',badge:'S6',level:'stretch',timerMinutes:5,title:'SRE solo 6 · Keep the bench harmful-free',goal:'Temporarily make bad-deploy expect no-action, run the bench, restore the case, and raise the floor. Compare noisy-alert → rollback if you want to see a non-harmful failure.',run:RUNS.bench,watchFor:'A strong action scored against a non-strong expectation is harmful; noisy-alert → rollback is a failed expectation but not harmful.',doneWhen:'The harmful edit prints 🚫 bad-deploy and FAIL bench; after restoring it, npm run bench -- --raise passes.'},
 {id:'sre-8',badge:'S8',level:'stretch',timerMinutes:10,title:'SRE solo 8 · Run the demos',goal:'Check the environment, run the live demo paths, and try the rejected watch-deploy sentence.',run:RUNS.live,watchFor:'The demo executor is separate from the read-only investigator; failures do not authorize automatic rollback.',doneWhen:'Doctor ends PASS doctor; the normal demo reaches LANDED / PASS watch, degrade proposals are refused, and the watch demo says FAILED watch and No automatic rollback.'},
 {id:'sre-9',badge:'S9',level:'stretch',timerMinutes:25,title:'SRE solo 9 · Ship a recovered-symptom change',goal:'Use the Workshop 5 loop: intent → red bench case → plan → build → check → named human gate → PR on your fork.',run:RUNS.step9,prompts:[STEP_9_PROMPT],watchFor:'The new case fails before the fix; only a named reviewer can record PASS at the human gate.',doneWhen:'The new case first shows 🚫 recovered-deploy; after the change npm run check ends PASS check, the bench shows ✅ recovered-deploy, and the original five cases are unchanged.'}
];
const STEPS_NL=[
 {id:'sre-0',badge:'S0',level:'stretch',timerMinutes:5,title:'SRE-solo 0 · Installeren en zelf controleren',goal:'Clone de repository, maak de fixtures en run daarna de offline zelfcontrole.',run:RUNS.start,watchFor:'De check gebruikt het offline pad en heeft geen API-sleutel nodig.',doneWhen:'Het commando eindigt met PASS check.'},
 {id:'sre-1',badge:'S1',level:'stretch',timerMinutes:10,title:'SRE-solo 1 · Lees het bewijs',goal:'Bekijk de incident-, telemetry- en toolbestanden voordat je een theorie vormt.',run:RUNS.inspect,watchFor:'De vier tools zijn read-only: search_logs, summarize_metrics, list_deploys en get_diff.',doneWhen:'De bad deploy is d-4821 om 03:43; de breakpoint staat op 03:45.'},
 {id:'sre-2',badge:'S2',level:'stretch',timerMinutes:10,title:'SRE-solo 2 · Onderzoek offline',goal:'Run de vier scenario’s en vergelijk bewijs, diagnose, voorstel en vertrouwen.',run:RUNS.investigate,watchFor:'De trace is metrics → deploys → get_diff (als een deploy aansluit) → logs. Verdicts bevatten data_gaps; high confidence wordt geweigerd zolang er gaps zijn.',doneWhen:'De bad deploy citeert metrics:2026-10-05T03:45:00.000Z, deploys:d-4821, diff:d-4821 en logs:2026-10-05T03:45:03.000Z; offline gebruikt vier toolbeurten plus één antwoord. Het gestructureerde verdict bevat data_gaps: [].'},
 {id:'sre-3',badge:'S3',level:'stretch',timerMinutes:10,title:'SRE-solo 3 · Test het contract',goal:'Vergelijk de adversarial-alert met een run die te weinig beurten heeft.',run:RUNS.adversarial,watchFor:'Alerttekst is data; de tooltrace stopt vóór een verdict als maxTurns is bereikt.',doneWhen:'De korte run meldt maxTurns (2) reached before a verdict.'},
 {id:'sre-4',badge:'S4',level:'stretch',timerMinutes:10,title:'SRE-solo 4 · Gate, approve en watch',goal:'Probeer een lege approver zolang het record pending is, approve op naam en vergelijk beide watch-uitkomsten.',run:RUNS.approval,watchFor:'Een genoemde mens keurt goed; watch meldt een status maar sluit het incident niet.',doneWhen:'Lege approval meldt decided_by: a named human is required; approval toont APPROVED rollback for INC-1001 by Solo Learner en PASS approval. Watch meldt LANDED / PASS watch met herstelde telemetry en NOT LANDED zonder die telemetry.'},
 {id:'sre-5',badge:'S5',level:'stretch',timerMinutes:10,title:'SRE-solo 5 · Beoordeel lessen',goal:'Schrijf zelf fix en gotcha in de voorgestelde les en bekijk daarna de gerenderde tag-slice.',run:RUNS.lessons,watchFor:'De preview toont de beoordeelde #bad-deploy-items. De offline runtime redeneert niet vanuit lessen; alleen een echt model gebruikt ze als context.',doneWhen:'De #bad-deploy-preview bevat INC-0931 en jouw INC-1001-item, met jouw eigen fix en gotcha; promotionCandidates is [].'},
 {id:'sre-6',badge:'S6',level:'stretch',timerMinutes:5,title:'SRE-solo 6 · Houd de bench schadeloos',goal:'Laat bad-deploy tijdelijk no-action verwachten, run de bench, herstel de case en verhoog de grens. Vergelijk desgewenst noisy-alert → rollback voor een niet-schadelijke fout.',run:RUNS.bench,watchFor:'Een sterke actie met een niet-sterke verwachting is schadelijk; noisy-alert → rollback is een foutieve verwachting maar niet schadelijk.',doneWhen:'De schadelijke wijziging toont 🚫 bad-deploy en FAIL bench; na herstel slaagt npm run bench -- --raise.'},
 {id:'sre-8',badge:'S8',level:'stretch',timerMinutes:10,title:'SRE-solo 8 · Run de demo’s',goal:'Controleer de omgeving, run de live demopaden en probeer de afgewezen watch-deploy-zin.',run:RUNS.live,watchFor:'De demo-executor staat los van de read-only investigator; een fout machtigt geen automatische rollback.',doneWhen:'Doctor eindigt met PASS doctor; de normale demo bereikt LANDED / PASS watch, degrade-voorstellen worden geweigerd en de watch-demo meldt FAILED watch en No automatic rollback.'},
 {id:'sre-9',badge:'S9',level:'stretch',timerMinutes:25,title:'SRE-solo 9 · Ship een wijziging voor herstelde symptomen',goal:'Gebruik de Workshop 5-lus: intent → rode bench-case → plan → build → check → menselijke gate op naam → PR op je fork.',run:RUNS.step9,prompts:[STEP_9_PROMPT],watchFor:'De nieuwe case faalt vóór de fix; alleen een reviewer op naam kan PASS vastleggen bij de menselijke gate.',doneWhen:'De nieuwe case toont eerst 🚫 recovered-deploy; na de wijziging eindigt npm run check met PASS check, toont de bench ✅ recovered-deploy en zijn de oorspronkelijke vijf cases ongewijzigd.'}
];

export const SRE_STEPS={en:STEPS_EN,nl:STEPS_NL};
export const SRE_OPEN_ITEMS={
 en:[
  'RyanLisse/sre-oncall-agent is a private repository; learner access is not arranged yet.',
  'Windows is verified in CI (windows-latest), not on a learner machine.'
 ],
 nl:[
  'RyanLisse/sre-oncall-agent is een privé-repository; toegang voor deelnemers is nog niet geregeld.',
  'Windows is geverifieerd in CI (windows-latest), niet op de laptop van een deelnemer.'
 ]
};
