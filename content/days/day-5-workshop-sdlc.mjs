import {link,question,slide} from './model.mjs';

const d='workshop-5';

export default {
 day:5,
 kind:'workshop',
 deck:d,
 title:'Workshop 5 · AI-native SDLC',
 tag:'Workshop',
 blurb:'Van intent naar spec, plan, build, test, review en handoff, met menselijke gates in het daily-brief-lab.',
 kicker:'Workshop 5 · SOLO 1 → 7',
 lessonTitle:'De lijn wordt een lus',
 leerdoel:'Je doorloopt intent → spec → plan → build → test → review → handoff in aetherlink-daily-brief-lab-s1. Bij elke overgang beslist een mens. Aan het eind staan zeven bestanden die een vreemde kan aanwijzen.',
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
  slides:[slide(d,7,'Watch: interview into intent.md'),slide(d,10,'Watch: red schema → green'),slide(d,13,'Watch: plan mode until accept'),slide(d,18,'Watch: brief:sample → out/latest.html'),slide(d,22,'Watch: one read-only tool'),slide(d,25,'Watch: three commands + screenshot'),slide(d,30,'Watch: fill gate + open the PR')],
  script:[
   'SOLO 1 (dia 7): open intent.md; Claude Code interviewt één vraag per keer; de grens moet een regel zijn, geen wens.',
   'SOLO 2 (dia 10): citeer één veld uit reference/ in docs/spec.md, laat test/schema.test.ts rood falen en daarna groen worden.',
   'SOLO 3 (dia 13): blijf in plan mode, schets docs/plan.md met één bewijscommando per stap en pauzeer bij het menselijke akkoord.',
   'SOLO 4 tot 7 (dia 18, 22, 25, 30): render out/latest.html, voeg één read-only tool toe, vul docs/evidence.md en docs/gate.md en open de PR.'
  ]
 },
 solo:[
  {id:'w5-solo1',badge:'1',level:'required',timerMinutes:15,title:'SOLO 1 · intent.md',goal:'Eén uitkomstzin, drie controles die een vreemde kan uitvoeren, een harde grens, eigenaren en minstens één OPEN.',doneWhen:'De grens hardop gelezen is een regel. Een wens betekent NEEDS REVISION en geen stap 2.',slide:slide(d,8,'Write the outcome a stranger can verify.')},
  {id:'w5-solo2',badge:'2',level:'required',timerMinutes:25,title:'SOLO 2 · docs/spec.md en schematest',goal:'Citeer per veld een voorbeeld uit reference/, laat test/schema.test.ts rood falen en maak src/brief.ts plus sample/brief.sample.json groen.',doneWhen:'npm test is groen en de testcommit staat vóór brief.ts in git log.',slide:slide(d,11,'Quoted examples → red schema → green.')},
  {id:'w5-solo3',badge:'3',level:'required',timerMinutes:15,title:'SOLO 3 · design, ADR en plan',goal:'Schrijf docs/design.md, één echte ADR onder docs/decisions/ en docs/plan.md met geordende stappen, exacte paden, een bewijscommando per stap en rollback.',doneWhen:'Elke stap heeft een bewijscommando en rollback; je blijft in plan mode tot een mens akkoord geeft.',slide:slide(d,14,'Stay in plan mode until a human accepts.')},
  {id:'w5-solo4',badge:'4',level:'required',timerMinutes:25,title:'SOLO 4 · render de sample',goal:'Maak test/render.test.ts rood, dan groen met src/render.ts, en schrijf out/latest.html met npm run brief:sample.',doneWhen:'npm run brief:sample levert out/latest.html op; screenshot bewaard als bewijs.',slide:slide(d,19,'Red render test → green sample HTML.')},
  {id:'w5-solo5',badge:'5',level:'required',timerMinutes:20,title:'SOLO 5 · één read-only tool',goal:'Voeg één read-only tool toe aan de agent, run npm run brief live en herleid elke zin naar een tool-call in run.log.',doneWhen:'Geen shell-tool en geen write-tool; elke zin is herleidbaar.',slide:slide(d,23,'One read-only tool. No shell, no write.')},
  {id:'w5-solo6',badge:'6',level:'required',timerMinutes:15,title:'SOLO 6 · docs/evidence.md',goal:'Run typecheck, test en brief; noteer exitcodes en één geciteerde regel per commando, een screenshot onder docs/evidence/ en een reviewer.',doneWhen:'Een vreemde kan de drie commando’s opnieuw draaien; verschillen met de PDF’s staan als OPEN.',slide:slide(d,26,'Proof a stranger can re-run.')},
  {id:'w5-solo7',badge:'7',level:'required',timerMinutes:15,title:'SOLO 7 · gate en PR',goal:'Vul docs/gate.md met PASS, FAIL of OPEN en citaten, weiger PASS op ongelezen checks, houd credentials buiten de repo en open de PR.',doneWhen:'Gate ingevuld, geen secrets in de repo en de PR staat open.',slide:slide(d,31,'Fill the gate. Open the PR.')}
 ],
 materials:[
  link('vehicle','Lab-repository aetherlink-daily-brief-lab-s1','https://github.com/RyanLisse/aetherlink-daily-brief-lab-s1','Dia 2; main is expres leeg; privé-repository')
 ],
 proof:[
  'intent.md met uitkomst, drie controleerbare checks, harde grens, eigenaren en minstens één OPEN (dia 8).',
  'docs/spec.md en docs/plan.md, met het plan geaccepteerd door een mens vóór de build (dia 11 en 14).',
  'out/latest.html gegenereerd door npm run brief:sample (dia 19).',
  'docs/evidence.md met drie commando’s, exitcodes, geciteerde regels, screenshot en reviewer (dia 26).',
  'docs/gate.md met PASS, FAIL of OPEN en citaten, en een open PR zonder secrets (dia 31).',
  'Samen zeven bestanden die een vreemde kan aanwijzen (dia 33).'
 ],
 quiz:[
  question('Welke volgorde heeft de artefactketen in het lab?',['intent.md → docs/spec.md → docs/plan.md → diff + tests → PR → docs/gate.md','docs/plan.md → diff → intent.md → PR','PR → docs/gate.md → docs/spec.md → intent.md'],0,slide(d,5,'intent → spec → plan → diff → PR → gate → intent.')),
  question('Wanneer verlaat je plan mode?',['Zodra het plan er staat','Als een mens het plan accepteert','Na de eerste groene test'],1,slide(d,14,'Stay in plan mode until a human accepts.')),
  question('Wat hoort in docs/evidence.md?',['Een samenvatting van de agent','Alleen een screenshot','Drie commando’s met exitcodes, één geciteerde regel elk, een screenshot en een reviewer'],2,slide(d,24,'Evidence is not a vibes check.'))
 ],
 mission:{
  id:'SDLC-BRIEF-05',
  title:'Doorloop de SDLC-lus in het daily-brief-lab',
  minutes:130,
  goal:'Doorloop SOLO 1 tot en met 7 op je eigen branch van aetherlink-daily-brief-lab-s1, met een menselijk akkoord bij elke gate, tot er een PR openstaat.',
  allowed:['Werk op je eigen branch of fork van aetherlink-daily-brief-lab-s1.','De brief-agent krijgt geen shell- en geen write-tool.','Credentials alleen in secrets, nooit in de repo; een mens beslist over PASS.'],
  starterFiles:[],
  hints:['Een grens die als wens klinkt is NEEDS REVISION.','Commit de test vóór brief.ts.','Weiger PASS op een check die je niet hebt gelezen.'],
  stretch:'Leg de weekday-schedule vast met gitlab-ci.example.yml of GitHub Actions (dia 27 en 31).'
 },
 openItems:[
  'aetherlink-daily-brief-lab-s1 is een privé-repository; toegang per deelnemer is niet geregeld in het lesplan.'
 ]
};
