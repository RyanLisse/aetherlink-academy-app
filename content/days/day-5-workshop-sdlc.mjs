import {diagram,link,question} from './model.mjs';

const REPO='https://github.com/RyanLisse/sre-oncall-agent';
const START=`${REPO}/tree/workshop/start`;
const CLASSROOM='/workshop-5/classroom/workshop5.html';

const PROMPTS=[
 'We are on workshop/start. Read README.md, WORKSHOP.md, CLAUDE.md and package.json first. Check Node and my current diff. Install the dependencies and generate the sample fixtures. Run the main tests and the workshop tests. Explain why the workshop failures are expected; do not solve them yet. Reuse my existing console or start one on port 4320 if free. Show its health and the local URL. Do not push or change hooks. Stop for my setup review.',
 'Read intent.md, the INC-1001 fixture and REVIEW.md. Interview me one question at a time about who the SRE agent serves. Help me write three checks a stranger can repeat. Keep the boundary: sample data, read-only investigation, named humans approve and close. Ask before editing intent.md. Stop after one interview round and show the diff for my review. Do not build or push.',
 'Read our accepted intent.md and docs/spec.md. Propose the verdict contract, then wait for my acceptance. After acceptance, show the red A3 tests in test/workshop/contract.test.ts. Implement TODO(A3) in src/contract.ts. Add required non-empty customer_impact to src/runtime.ts and the fixtures in test/contract.test.ts too. Preserve the evidence and draft_only rules. Run the A3 tests, main suite, typecheck and offline bad-deploy investigation. Show the diff and actual outputs. Do not weaken tests or copy solved tags. Stop for my review.',
 'Read intent.md, test/workshop/chat.test.ts and test/workshop/guard.test.ts. Use chat.test.ts for the chat contract; guard.test.ts checks the separate human hook edit. Implement only TODO(A4) in src/chat.ts so chat refuses rollback, scale, flag, approve and resolve requests and points to human controls. Ask me to choose one extra mutation phrase, then add its test. Run the relevant tests and show the diff. Do not edit .claude/, approvals/, PROGRESS.md or bench/ratchet.json. The human will add the hook rule. Do not approve or execute anything. Stop for my review.',
 'Read src/tools.ts and test/workshop/tools.test.ts. Show the red A5 tests, then implement TODO(A5): bind the list_deploys handler to the telemetry and register it in createTelemetryServer. Keep every tool read-only. Ask me to choose one empty or missing deploy case, then add its test. Run the A5 tests and an offline bad-deploy investigation. Show both code changes and the list_deploys trace. Do not copy a solved tag or add a mutation tool. Stop for my review.',
 'Read docs/plan.md and the bad-deploy fixture. Propose a local demo plan using the existing shop, traffic and console scripts, then wait for me to accept it. Reuse running processes; do not stop unrelated ones. After acceptance, run sample traffic and the bad-deploy scenario. Help me match each diagnosis claim to its tool trace and compare one alternative cause. Ask before writing docs/diagnosis-live.md. Mark missing evidence OPEN. Do not approve, execute or resolve. Stop for my review.',
 'Read bench/cases.json and its current results. Propose one adversarial alert case based on our incident, then wait for me to accept it. Add the case without weakening existing cases, expected outcomes or bench/ratchet.json. Run the bench before and after. Show the diff, PASS result and harmful count. If it fails, explain the failure before proposing a fix. Do not alter hooks or the score floor. Stop for a neighbor to rerun the bench.',
 'Read src/executor.ts and test/workshop/executor.test.ts. Show the red A8 tests, then implement TODO(A8) in checkApproval. Require a named human approval for this incident and this action. Ask me to choose one wrong incident or action. Test that case plus the valid approval. Run the A8 tests and remaining workshop tests. Show the diff and actual results. Never create an approval, click Approve or Execute, push, or change hooks. Stop for my review; I operate the console myself.',
 'Read our incident evidence and lessons/proposed/. Suggest one lesson with the incident id, date and evidence refs. Do not resolve the incident or edit lessons/lessons.md; I do that in the console. Interview me about my hackathon idea and draft docs/hackathon-intent.md with three checks and open questions. Ask before editing. Then use /handoff to record verified work, OPEN items and the next step. Do not rewrite PROGRESS.md or push. Stop for my review.'
];

const ASSIGNMENTS={
 en:[
  ['Setup check','Open the local console and identify the intended red workshop tests.','The console opens, main tests pass, and the A3, A4, A5, and A8 gaps stay visible.'],
  ['Write your team intent.md','Define who the agent serves, its read-only boundary, and three repeatable checks.','A neighbor can repeat all three checks and accepts the boundary.'],
  ['Spec and contract green','Turn the accepted verdict contract into a red test and the smallest green implementation.','The contract requires evidence, customer impact, and draft_only.'],
  ['Wire and prove the controls','Make chat refuse mutation requests while a human owns the guard rule.','Chat points to human controls and the audit records the human guard decision.'],
  ['Build a read-only tool','Register list_deploys without adding a mutation tool.','The trace proves the tool is read-only and handles an empty result.'],
  ['Diagnose a live incident','Run the local incident and tie every diagnosis claim to a tool trace.','The diagnosis names evidence, one alternative cause, and every OPEN gap.'],
  ['Pass the bench and add a case','Add one adversarial case without weakening the score floor.','The bench passes and a neighbor reproduces the result.'],
  ['Approve with your name','Require a named human for the exact incident and action.','Wrong incident or action fails; only the named approval passes.'],
  ['Maintain and hand off','Propose one cited lesson and a testable hackathon intent.','The handoff separates verified work, OPEN items, and the next step.']
 ],
 nl:[
  ['Controleer de setup','Open de lokale console en benoem de bedoelde rode workshoptests.','De console opent, hoofdtests slagen en de gaten A3, A4, A5 en A8 blijven zichtbaar.'],
  ['Schrijf je team-intent.md','Leg vast wie de agent helpt, wat de read-only-grens is en welke drie checks herhaalbaar zijn.','Een buur kan alle checks herhalen en accepteert de grens.'],
  ['Maak spec en contract groen','Zet het geaccepteerde verdictcontract om in een rode test en de kleinste groene implementatie.','Het contract vereist bewijs, klantimpact en draft_only.'],
  ['Bouw en bewijs de controls','Laat chat mutatieverzoeken weigeren terwijl een mens de guardregel beheert.','Chat verwijst naar menselijke controls en de audit bevat het menselijke guardbesluit.'],
  ['Bouw een read-only-tool','Registreer list_deploys zonder een mutatietool toe te voegen.','De trace bewijst dat de tool alleen leest en een leeg resultaat afhandelt.'],
  ['Diagnoseer een live incident','Voer het lokale incident uit en koppel elke diagnoseclaim aan een tooltrace.','De diagnose noemt bewijs, één alternatieve oorzaak en elk OPEN gat.'],
  ['Slaag voor de bench en voeg een case toe','Voeg één adversarial case toe zonder de scorevloer te verlagen.','De bench slaagt en een buur herhaalt het resultaat.'],
  ['Keur goed met je naam','Eis een genoemde mens voor het exacte incident en de exacte actie.','Een verkeerd incident of actie faalt; alleen de genoemde goedkeuring slaagt.'],
  ['Onderhoud en draag over','Stel één onderbouwde les en een testbare hackathon-intent voor.','De handoff scheidt bewezen werk, OPEN punten en de volgende stap.']
 ]
};

const solo=lang=>ASSIGNMENTS[lang].map(([title,goal,doneWhen],index)=>({
 id:`w5-assignment-${index+1}`,
 badge:String(index+1),
 level:'required',
 timerMinutes:index===0?10:index===5?25:20,
 title:`Assignment ${index+1} · ${title}`,
 goal,
 prompts:[PROMPTS[index]],
 watchFor:lang==='nl'?'Lees de diff en echte uitvoer zelf. Laat menselijke besluiten en handelingen bij de deelnemer.':'Read the diff and actual output yourself. Keep human decisions and actions with the learner.',
 doneWhen
}));

const materials=lang=>[
 link('vehicle',lang==='nl'?'Deelnemersrepo · workshop/start':'Participant repo · workshop/start',START,'sre-oncall-agent'),
 link('assignment',lang==='nl'?'Opdrachten · SOLO.md':'Assignments · SOLO.md',`${REPO}/blob/workshop/start/SOLO.md`,'Assignments 1–9'),
 link('naslag',lang==='nl'?'Lesdeck · SRE AI-SDLC':'Classroom deck · SRE AI-SDLC',CLASSROOM,'69 slides'),
 link('demo',lang==='nl'?'Optionele Claude Code-mod · /sdlc':'Optional Claude Code mod · /sdlc',`${START}/course/ai-sdlc-mod`,'claude --plugin-dir ./course/ai-sdlc-mod, then /sdlc'),
 link('solo',lang==='nl'?'Optionele solo · Daily Brief':'Optional solo · Daily Brief','/courses/aetherlink-daily-brief-lab-s1/index.html','separate follow-up lab'),
 link('solo',lang==='nl'?'Optionele Daily Brief-handleiding · SOLO.md':'Optional Daily Brief guide · SOLO.md','/courses/aetherlink-daily-brief-lab-s1/SOLO.md','separate follow-up lab')
];

const common={
 tag:'Workshop',
 kicker:'Workshop 5 · Assignments 1–9',
 motto:'The agent investigates. A named human decides.',
 demo:{slides:[],open:'Open the SRE classroom deck at /workshop/5 and demonstrate INC-1001 with workshop/start.'},
 diagrams:[diagram('/workshop-5/classroom/assets/workshop5-sdlc-loop.svg','AI-SDLC control loop','Intent → plan → build → test → evidence → named human gate → maintain')],
 quiz:[
  question('Who may approve or execute an incident action?',['The SRE agent','A named human','Any chat user'],1),
  question('What supports a diagnosis claim?',['A tool evidence reference','A confident explanation','An approval record'],0),
  question('What happens when evidence is missing?',['The agent guesses','The check stays OPEN','The gate becomes PASS'],1)
 ]
};

const en={
 ...common,
 title:'Workshop 5 · AI-native SDLC with an SRE agent',
 blurb:'Build an offline, read-only on-call agent through nine Claude Code assignments. A named human keeps every operational control.',
 lessonTitle:'One incident through the complete AI-SDLC loop',
 leerdoel:'You turn INC-1001 into intent, a tested contract, read-only tools, cited diagnosis, an eval, a named approval gate, and a maintainable handoff.',
 narrative:[
  'The SRE agent is the day 5 vehicle. It investigates local sample evidence and explains a likely cause without changing the shop.',
  'Claude Code builds each bounded change. The learner reads every diff, accepts the plan, operates the console, and owns every approval.'
 ],
 workedExample:'The instructor opens INC-1001, asks Claude Code to implement one TODO, and then shows the evidence trace before a named human uses the control.',
 loop:[
  {label:'Intent',prompt:'Who does the SRE agent serve and what may it never do?'},
  {label:'Build',prompt:'Which red contract or control test defines the next change?'},
  {label:'Investigate',prompt:'Which read-only tool trace supports every claim?'},
  {label:'Evaluate',prompt:'Does the adversarial case pass without weakening the floor?'},
  {label:'Gate',prompt:'Which named human approves this incident and action?'},
  {label:'Maintain',prompt:'Which cited lesson and OPEN item enter the handoff?'}
 ],
 solo:solo('en'),
 materials:materials('en'),
 proof:[
  'The participant runs all nine assignments on workshop/start.',
  'Main tests stay green while each intended workshop gap turns green in sequence.',
  'Every diagnosis claim points to read-only tool evidence.',
  'A named human owns approval, execution, and resolution.',
  'The handoff records verified work and OPEN items.'
 ],
 mission:{id:'SRE-SDLC-05',title:'Build the SRE control loop',minutes:170,goal:'Complete Assignments 1–9 on workshop/start and prove the read-only investigation plus named human gate.',allowed:['Use local sample data.','Keep investigation tools read-only.','Let named humans approve, execute, and resolve.'],starterFiles:[],hints:['Start from the intended red workshop tests.','Do not weaken the bench floor.','Mark missing evidence OPEN.'],stretch:'Use the separate Daily Brief SOLO after the SRE workshop.'},
 openItems:[]
};

const nl={
 ...common,
 title:'Workshop 5 · AI-native SDLC met een SRE-agent',
 blurb:'Bouw een offline, read-only on-call-agent in negen Claude Code-opdrachten. Een genoemde mens beheert elke operationele control.',
 lessonTitle:'Eén incident door de volledige AI-SDLC-lus',
 motto:'De agent onderzoekt. Een genoemde mens beslist.',
 leerdoel:'Je zet INC-1001 om in intent, een getest contract, read-only-tools, een onderbouwde diagnose, een eval, een genoemde approval-gate en een onderhoudbare handoff.',
 narrative:[
  'De SRE-agent is het voertuig voor dag 5. De agent onderzoekt lokaal voorbeeldbewijs en verklaart een waarschijnlijke oorzaak zonder de shop te wijzigen.',
  'Claude Code bouwt elke begrensde wijziging. De deelnemer leest elke diff, accepteert het plan, bedient de console en beheert elke goedkeuring.'
 ],
 workedExample:'De trainer opent INC-1001, laat Claude Code één TODO bouwen en toont daarna de bewijstrace voordat een genoemde mens de control gebruikt.',
 quiz:[
  question('Wie mag een incidentactie goedkeuren of uitvoeren?',['De SRE-agent','Een genoemde mens','Elke chatgebruiker'],1),
  question('Wat ondersteunt een diagnoseclaim?',['Een tool-bewijsverwijzing','Een overtuigende uitleg','Een approval-record'],0),
  question('Wat gebeurt er als bewijs ontbreekt?',['De agent gokt','De check blijft OPEN','De gate wordt PASS'],1)
 ],
 loop:[
  {label:'Intent',prompt:'Wie helpt de SRE-agent en wat mag de agent nooit doen?'},
  {label:'Bouwen',prompt:'Welke rode contract- of controltest bepaalt de volgende wijziging?'},
  {label:'Onderzoeken',prompt:'Welke read-only-tooltrace ondersteunt elke claim?'},
  {label:'Evalueren',prompt:'Slaagt de adversarial case zonder de scorevloer te verlagen?'},
  {label:'Gate',prompt:'Welke genoemde mens keurt dit incident en deze actie goed?'},
  {label:'Onderhouden',prompt:'Welke onderbouwde les en welk OPEN punt gaan in de handoff?'}
 ],
 solo:solo('nl'),
 materials:materials('nl'),
 proof:[
  'De deelnemer voert alle negen opdrachten uit op workshop/start.',
  'Hoofdtests blijven groen terwijl elk bedoeld workshopgat in volgorde groen wordt.',
  'Elke diagnoseclaim verwijst naar read-only-toolbewijs.',
  'Een genoemde mens beheert goedkeuring, uitvoering en afsluiting.',
  'De handoff bevat bewezen werk en OPEN punten.'
 ],
 mission:{id:'SRE-SDLC-05',title:'Bouw de SRE-controllus',minutes:170,goal:'Voltooi Opdrachten 1–9 op workshop/start en bewijs het read-only-onderzoek plus de genoemde menselijke gate.',allowed:['Gebruik lokale voorbeelddata.','Houd onderzoekstools read-only.','Laat genoemde mensen goedkeuren, uitvoeren en afsluiten.'],starterFiles:[],hints:['Begin bij de bedoelde rode workshoptests.','Verlaag de benchvloer niet.','Markeer ontbrekend bewijs OPEN.'],stretch:'Gebruik na de SRE-workshop de aparte Daily Brief-SOLO.'},
 openItems:[]
};

export default {
 day:5,
 kind:'workshop',
 deck:'workshop-5',
 localeComplete:true,
 requireLocales:true,
 copy:{en,nl},
 ...nl,
 sims:[]
};
