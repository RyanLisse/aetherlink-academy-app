import {link,question,slide} from './model.mjs';

const d='workshop-7';

export default {
 day:7,
 kind:'workshop',
 deck:d,
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
  slides:[slide(d,4,'Watch: one polish pass.'),slide(d,7,'Watch: review one aloud.'),slide(d,12,'Watch: sixty-second model.')],
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
