import {link,question,slide} from './model.mjs';

const d='workshop-7';

const DEMO_SLIDES=[slide(d,4,'Watch: one polish pass.'),slide(d,7,'Watch: review one aloud.'),slide(d,12,'Watch: sixty-second model.')];

const en = {
 title:'Workshop 7 · Own assignment: ship it',
 tag:'Own assignment',
 blurb:'Polish, review gate, Proof final, a five-minute presentation and one next step for the coming 90 days.',
 kicker:'Workshop 7 · Own assignment',
 lessonTitle:'Deliver the thin slice',
 leerdoel:'You finish the same thin slice from Workshop 6: one polish pass, a human review gate, your Proof final, a five-minute presentation and one next step for the coming 90 days. No scope expansion.',
 loop:[
  {label:'Polish',prompt:'Which single pass makes your slice demo-ready?'},
  {label:'Review',prompt:'Does the intent still hold, is it thin and safe, and can a stranger point to the outcome?'},
  {label:'Proof final',prompt:'Does it hold the intent, path, what ran, gate, presentation hook and 90-day step?'},
  {label:'Present',prompt:'Problem → thin slice → what ran → gate → next 90 days, within five minutes?'},
  {label:'90 days',prompt:'What is your one next step?'}
 ],
 demo:{
  slides:DEMO_SLIDES,
  script:[
   'Polish (slide 4): do one polish pass on a thin slice: clarity, one edge case or making it demo-ready. No scope expansion.',
   'Review (slide 7): review one build aloud against the checklist.',
   'Present (slide 12): model about sixty seconds of the five-minute format: problem → slice → proof → next step.'
  ]
 },
 solo:[
  {id:'w7-polish',badge:'1',level:'required',timerMinutes:20,title:'Polish your slice',goal:'One polish pass on your Workshop 6 slice. No new feature.',doneWhen:'Slice still named, one polish pass, demo-ready and no secrets committed. Gate before review.',slide:slide(d,5,'Polish your slice on your machine.')},
  {id:'w7-review',badge:'2',level:'required',timerMinutes:10,title:'Gate your build',goal:'Peer or self review: does the intent still hold, is it thin and safe, and can a stranger point to the outcome?',doneWhen:'PASS, or exactly one fix. Gate before Proof final.',slide:slide(d,8,'Gate your build.')},
  {id:'w7-proof',badge:'P',level:'required',timerMinutes:15,title:'Make your Proof final',goal:'Your Workshop 6 draft becomes final: intent, stack path, what ran with a screenshot or link, human gate, presentation hook and 90-day step.',doneWhen:'Proof final complete. Gate before presenting.',slide:slide(d,10,'Finalize your Proof.')},
  {id:'w7-present',badge:'3',level:'required',timerMinutes:25,title:'Present your slice',goal:'Rehearse the five-minute format, name one outcome and stop at five minutes.',doneWhen:'Presented within five minutes with the Proof final ready and no scope pitch.',slide:slide(d,13,'Prepare and present your slice.')}
 ],
 materials:[
  link('vehicle','Your Proof draft from Workshop 6','/workshop/6','Same own assignment as Workshop 6')
 ],
 proof:[
  'Polished thin slice, same use case as Workshop 6 and no new feature (slide 5).',
  'Human review gate: PASS or one fix (slide 8).',
  'Proof final with intent, stack path, what ran, gate, presentation hook and 90-day step (slides 9 and 10).',
  'Five-minute presentation: problem → thin slice → what ran → gate → next 90 days (slides 11 and 13).',
  'One next step for 90 days recorded before you leave (slide 14).'
 ],
 quiz:[
  question('What does “done enough” mean?',['One polish pass until a stranger can point to the outcome','Add one more feature','Rewrite everything'],0,slide(d,3,'Done enough beats perfect.')),
  question('When do you make your Proof final?',['Before the polish','After the human review gate','Without review, straight after the build'],1,slide(d,6,'Human review is the gate.')),
  question('What is the structure of the five minutes?',['A demo of every feature','A roadmap pitch','Problem → thin slice → what ran → human gate → next 90 days'],2,slide(d,11,'Five minutes. One outcome.'))
 ],
 mission:{
  id:'EIGEN-SHIP-07',
  title:'Finish your thin slice and present it',
  minutes:85,
  goal:'Polish your Workshop 6 slice once, take it through the human review gate, make your Proof final, present in five minutes and record one 90-day step.',
  allowed:['Work on the same slice as in Workshop 6.','No new feature and no scope expansion.','No secrets in your repo or workflow; a person decides at the gate.'],
  starterFiles:[],
  hints:['Stop polishing as soon as a stranger can point to the outcome.','On REVISE: exactly one fix, then the gate again.','Write down your 90-day step before you leave.'],
  stretch:'During the other presentations, check whether you can point to their outcome and say it aloud.'
 },
 openItems:[]
};

const nl = {
 title:'Workshop 7 · Eigen opdracht: afronden',
 tag:'Eigen opdracht',
 blurb:'Polish, review-gate, Proof final, vijf minuten presenteren en één vervolgstap voor de komende 90 dagen.',
 kicker:'Workshop 7 · Eigen opdracht',
 lessonTitle:'Lever de thin slice op',
 leerdoel:'Je maakt dezelfde thin slice uit Workshop 6 af: één polish-ronde, een menselijke review-gate, je Proof final, een presentatie van vijf minuten en één vervolgstap voor de komende 90 dagen. Geen scope-uitbreiding.',
 loop:[
  {label:'Polish',prompt:'Welke ene ronde maakt je slice demoklaar?'},
  {label:'Review',prompt:'Klopt de intent nog, is het thin en veilig, en kan een vreemde de uitkomst aanwijzen?'},
  {label:'Proof final',prompt:'Staan intent, pad, wat draaide, gate, presentatiehaak en 90-dagenstap erin?'},
  {label:'Presenteren',prompt:'Probleem → thin slice → wat draaide → gate → volgende 90 dagen, binnen vijf minuten?'},
  {label:'90 dagen',prompt:'Wat is je ene volgende stap?'}
 ],
 demo:{
  slides:DEMO_SLIDES,
  script:[
   'Polish (dia 4): doe één polish-ronde op een thin slice: duidelijkheid, één edge case of demoklaar maken. Geen scope-uitbreiding.',
   'Review (dia 7): review één build hardop tegen de checklist.',
   'Presenteren (dia 12): doe ongeveer zestig seconden van het vijfminutenformat voor: probleem → slice → proof → volgende stap.'
  ]
 },
 solo:[
  {id:'w7-polish',badge:'1',level:'required',timerMinutes:20,title:'Polish je slice',goal:'Eén polish-ronde op je Workshop 6-slice. Geen nieuwe feature.',doneWhen:'Slice nog steeds benoemd, één polish-ronde, demoklaar en geen secrets gecommit. Gate vóór review.',slide:slide(d,5,'Polish your slice on your machine.')},
  {id:'w7-review',badge:'2',level:'required',timerMinutes:10,title:'Gate je build',goal:'Peer- of zelfreview: klopt de intent nog, is het thin, veilig en kan een vreemde de uitkomst aanwijzen?',doneWhen:'PASS, of precies één fix. Gate vóór Proof final.',slide:slide(d,8,'Gate your build.')},
  {id:'w7-proof',badge:'P',level:'required',timerMinutes:15,title:'Maak je Proof final',goal:'Je draft uit Workshop 6 wordt final: intent, stackpad, wat draaide met screenshot of link, menselijke gate, presentatiehaak en 90-dagenstap.',doneWhen:'Proof final compleet. Gate vóór presenteren.',slide:slide(d,10,'Finalize your Proof.')},
  {id:'w7-present',badge:'3',level:'required',timerMinutes:25,title:'Presenteer je slice',goal:'Oefen het vijfminutenformat, benoem één uitkomst en stop op vijf minuten.',doneWhen:'Gepresenteerd binnen vijf minuten met Proof final klaar en zonder scope-pitch.',slide:slide(d,13,'Prepare and present your slice.')}
 ],
 materials:[
  link('vehicle','Je Proof-draft uit Workshop 6','/workshop/6','Zelfde eigen opdracht als Workshop 6')
 ],
 proof:[
  'Gepolijste thin slice, zelfde use-case als Workshop 6 en geen nieuwe feature (dia 5).',
  'Menselijke review-gate: PASS of één fix (dia 8).',
  'Proof final met intent, stackpad, wat draaide, gate, presentatiehaak en 90-dagenstap (dia 9 en 10).',
  'Presentatie van vijf minuten: probleem → thin slice → wat draaide → gate → volgende 90 dagen (dia 11 en 13).',
  'Eén vervolgstap voor 90 dagen vastgelegd vóór vertrek (dia 14).'
 ],
 quiz:[
  question('Wat betekent “done enough”?',['Eén polish-ronde tot een vreemde de uitkomst kan aanwijzen','Nog één feature toevoegen','Alles herschrijven'],0,slide(d,3,'Done enough beats perfect.')),
  question('Wanneer maak je je Proof final?',['Vóór de polish','Na de menselijke review-gate','Zonder review, direct na de build'],1,slide(d,6,'Human review is the gate.')),
  question('Wat is de structuur van de vijf minuten?',['Een demo van alle features','Een roadmap-pitch','Probleem → thin slice → wat draaide → menselijke gate → volgende 90 dagen'],2,slide(d,11,'Five minutes. One outcome.'))
 ],
 mission:{
  id:'EIGEN-SHIP-07',
  title:'Rond je thin slice af en presenteer',
  minutes:85,
  goal:'Polijst je Workshop 6-slice één keer, laat hem door de menselijke review-gate gaan, maak je Proof final, presenteer in vijf minuten en leg één 90-dagenstap vast.',
  allowed:['Werk aan dezelfde slice als in Workshop 6.','Geen nieuwe feature en geen scope-uitbreiding.','Geen secrets in je repo of workflow; een mens beslist bij de gate.'],
  starterFiles:[],
  hints:['Stop met polishen zodra een vreemde de uitkomst kan aanwijzen.','Bij REVISE: precies één fix, dan opnieuw de gate.','Schrijf je 90-dagenstap op vóór je vertrekt.'],
  stretch:'Luister bij de presentaties van anderen of je hun uitkomst kunt aanwijzen en zeg het hardop.'
 },
 openItems:[]
};

export default {
 day:7,
 kind:'workshop',
 deck:d,
 copy:{en,nl},
 ...nl,
};
