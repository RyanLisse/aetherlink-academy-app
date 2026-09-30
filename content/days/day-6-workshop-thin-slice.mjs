import {link,question,slide} from './model.mjs';

const d='workshop-6';

const DEMO_SLIDES=[slide(d,4,'Watch: one thin-slice example.'),slide(d,7,'Watch: intent in five minutes.'),slide(d,10,'Watch: a short plan aloud.')];

const en = {
 title:'Workshop 6 · Own assignment: thin slice',
 tag:'Own assignment',
 blurb:'Start your own thin slice on your Classroom 2 use case: intent, plan, first build and a Proof draft.',
 kicker:'Workshop 6 · Own assignment',
 lessonTitle:'Your thin slice starts today',
 leerdoel:'You pick the use case from Classroom 2, write an intent, make a short plan with a gate and build the first thin slice in n8n or the Claude Agent SDK. You finish with a Proof draft; a finished agent is not today’s goal.',
 loop:[
  {label:'Use case',prompt:'Which Classroom 2 use case do you take, and what is the one outcome?'},
  {label:'Intent',prompt:'Who benefits and what is out of scope?'},
  {label:'Plan',prompt:'Which steps, which gate, and where do you stop today?'},
  {label:'First build',prompt:'Does the thin slice run once, in n8n or with Claude?'},
  {label:'Proof draft',prompt:'Does it hold the intent, path, what ran, the gate and next steps?'}
 ],
 demo:{
  slides:DEMO_SLIDES,
  script:[
   'Open (slide 4): show one thin-slice example aloud and name the outcome in one sentence.',
   'Intent (slide 7): write one intent in about five minutes: outcome sentence, who benefits and what is out of scope.',
   'Plan (slide 10): show plan mode or a short plan.md with steps, gate and stop rule, then ten minutes of first build in n8n or Claude.'
  ]
 },
 solo:[
  {id:'w6-usecase',badge:'1',level:'required',timerMinutes:10,title:'Lock your use case',goal:'Name your Classroom 2 use case, keep it thin with one outcome and choose your stack: n8n or the Claude Agent SDK.',doneWhen:'Use case named, one outcome, stack choice written down and no new fantasy product.',slide:slide(d,5,'Lock your use-case on your machine.')},
  {id:'w6-intent',badge:'2',level:'required',timerMinutes:10,title:'Write your intent sentence',goal:'One outcome sentence, who benefits and one line on what is out of scope.',doneWhen:'Intent complete and still thin. Gate before the plan.',slide:slide(d,8,'Write your intent sentence.')},
  {id:'w6-build',badge:'3',level:'required',timerMinutes:25,title:'Plan and build your thin slice',goal:'Short plan with a gate, then the first build in n8n or with Claude. Stop before polish; Workshop 7 finishes it.',doneWhen:'Plan and gate written, thin slice runs once, a person has reviewed it and no secrets are committed.',slide:slide(d,11,'Plan and build your thin slice.')},
  {id:'w6-proof',badge:'P',level:'required',timerMinutes:15,title:'Fill in your Proof draft',goal:'Paste your intent, note your stack path, record what ran with a screenshot or link, name the human gate and park polish and presentation for Workshop 7.',doneWhen:'Proof draft with intent, path, what ran, gate and next steps.',slide:slide(d,13,'Fill your Proof draft.')}
 ],
 materials:[
  link('vehicle','Your Classroom 2 artifact','/classroom/2','Use case and team workflow from Classroom 2 (W6 slide 2)'),
  link('vehicle','n8n path: Workshop 3 starters','/workshop/3','Slide 2: stack n8n or Claude Agent SDK'),
  link('vehicle','Claude path: aetherlink-day5-n8n-to-agent','https://github.com/RyanLisse/aetherlink-day5-n8n-to-agent','Slide 2: stack n8n or Claude Agent SDK')
 ],
 proof:[
  'Classroom 2 use case named and kept thin: one outcome, no new fantasy product (slides 2 and 5).',
  'Intent with an outcome sentence, beneficiary and out-of-scope line (slide 8).',
  'Short plan with a human gate; the thin slice runs once (slide 11).',
  'Proof draft with intent, stack path (n8n or Claude), what ran with a screenshot or link, gate and next steps for Workshop 7 (slides 12 and 13).'
 ],
 quiz:[
  question('What is today’s vehicle?',['The daily-brief lab from Workshop 5','Your own or your team’s use case from Classroom 2, as a thin slice','A newly invented product'],1,slide(d,2,'Classroom 2 use-case — not a new fantasy.')),
  question('When is Workshop 6 done?',['Thin slice started and a Proof draft','When the agent is finished','After the five-minute presentation'],0,slide(d,14,'Tomorrow: polish, gate, present.')),
  question('What goes in your intent?',['A roadmap','A list of tickets','One outcome sentence, who benefits and what is out of scope'],2,slide(d,6,'Intent is the gate.'))
 ],
 mission:{
  id:'EIGEN-SLICE-06',
  title:'Start your thin slice',
  minutes:60,
  goal:'Pick your Classroom 2 use case, write the intent, make a short plan with a gate, run the first thin slice once in n8n or with Claude and fill in your Proof draft.',
  allowed:['Work on your own Classroom 2 use case, not on a new product.','Choose one stack: n8n or the Claude Agent SDK.','No secrets in your repo or workflow; a person reviews before you build further.'],
  starterFiles:[],
  hints:['Thin means one outcome a stranger can point to.','Intent before plan, plan before build.','Stop before polish; that is for Workshop 7.'],
  stretch:'Have another participant read your intent and tell the outcome back to you.'
 },
 openItems:[]
};

const nl = {
 title:'Workshop 6 · Eigen opdracht: thin slice',
 tag:'Eigen opdracht',
 blurb:'Start je eigen thin slice op je Classroom 2-use-case: intent, plan, eerste build en een Proof-draft.',
 kicker:'Workshop 6 · Eigen opdracht',
 lessonTitle:'Je thin slice begint vandaag',
 leerdoel:'Je kiest de use-case uit Classroom 2, schrijft een intent, maakt een kort plan met gate en bouwt de eerste thin slice in n8n óf de Claude Agent SDK. Je eindigt met een Proof-draft; een af agent is vandaag geen doel.',
 loop:[
  {label:'Use-case',prompt:'Welke Classroom 2-use-case neem je, en wat is de ene uitkomst?'},
  {label:'Intent',prompt:'Wie heeft er baat bij en wat valt buiten scope?'},
  {label:'Plan',prompt:'Welke stappen, welke gate en waar stop je vandaag?'},
  {label:'Eerste build',prompt:'Draait de thin slice één keer, in n8n of met Claude?'},
  {label:'Proof-draft',prompt:'Staan intent, pad, wat draaide, gate en volgende stappen erin?'}
 ],
 demo:{
  slides:DEMO_SLIDES,
  script:[
   'Open (dia 4): toon hardop één thin-slice-voorbeeld en benoem de uitkomst in één zin.',
   'Intent (dia 7): schrijf in ongeveer vijf minuten één intent: uitkomstzin, wie er baat bij heeft en wat buiten scope valt.',
   'Plan (dia 10): toon plan mode of een kort plan.md met stappen, gate en stopregel, en daarna tien minuten eerste build in n8n of Claude.'
  ]
 },
 solo:[
  {id:'w6-usecase',badge:'1',level:'required',timerMinutes:10,title:'Leg je use-case vast',goal:'Benoem je Classroom 2-use-case, houd hem thin met één uitkomst en kies je stack: n8n óf Claude Agent SDK.',doneWhen:'Use-case benoemd, één uitkomst, stackkeuze genoteerd en geen nieuw fantasieproduct.',slide:slide(d,5,'Lock your use-case on your machine.')},
  {id:'w6-intent',badge:'2',level:'required',timerMinutes:10,title:'Schrijf je intentzin',goal:'Eén uitkomstzin, wie er baat bij heeft en een regel over wat buiten scope valt.',doneWhen:'Intent compleet en nog steeds thin. Gate vóór het plan.',slide:slide(d,8,'Write your intent sentence.')},
  {id:'w6-build',badge:'3',level:'required',timerMinutes:25,title:'Plan en bouw je thin slice',goal:'Kort plan met gate, daarna de eerste build in n8n of met Claude. Stop vóór polish; Workshop 7 maakt af.',doneWhen:'Plan en gate geschreven, thin slice draait één keer, een mens heeft gereviewd en er zijn geen secrets gecommit.',slide:slide(d,11,'Plan and build your thin slice.')},
  {id:'w6-proof',badge:'P',level:'required',timerMinutes:15,title:'Vul je Proof-draft',goal:'Plak je intent, noteer je stackpad, leg vast wat draaide met screenshot of link, benoem de menselijke gate en parkeer polish en presentatie voor Workshop 7.',doneWhen:'Proof-draft met intent, pad, wat draaide, gate en volgende stappen.',slide:slide(d,13,'Fill your Proof draft.')}
 ],
 materials:[
  link('vehicle','Je Classroom 2-artefact','/classroom/2','Use-case en teamworkflow uit Classroom 2 (W6 dia 2)'),
  link('vehicle','n8n-pad: starters Workshop 3','/workshop/3','Dia 2: stack n8n óf Claude Agent SDK'),
  link('vehicle','Claude-pad: aetherlink-day5-n8n-to-agent','https://github.com/RyanLisse/aetherlink-day5-n8n-to-agent','Dia 2: stack n8n óf Claude Agent SDK')
 ],
 proof:[
  'Classroom 2-use-case benoemd en thin gehouden: één uitkomst, geen nieuw fantasieproduct (dia 2 en 5).',
  'Intent met uitkomstzin, begunstigde en buiten-scope-regel (dia 8).',
  'Kort plan met menselijke gate; de thin slice draait één keer (dia 11).',
  'Proof-draft met intent, stackpad (n8n of Claude), wat draaide met screenshot of link, gate en volgende stappen voor Workshop 7 (dia 12 en 13).'
 ],
 quiz:[
  question('Wat is vandaag het vehicle?',['Het daily-brief-lab van Workshop 5','Je eigen of team-use-case uit Classroom 2, als thin slice','Een nieuw verzonnen product'],1,slide(d,2,'Classroom 2 use-case — not a new fantasy.')),
  question('Wanneer is Workshop 6 klaar?',['Thin slice gestart en een Proof-draft','Als de agent af is','Na de presentatie van vijf minuten'],0,slide(d,14,'Tomorrow: polish, gate, present.')),
  question('Wat staat in je intent?',['Een roadmap','Een lijst met tickets','Eén uitkomstzin, wie er baat bij heeft en wat buiten scope valt'],2,slide(d,6,'Intent is the gate.'))
 ],
 mission:{
  id:'EIGEN-SLICE-06',
  title:'Start je thin slice',
  minutes:60,
  goal:'Kies je Classroom 2-use-case, schrijf de intent, maak een kort plan met gate, laat de eerste thin slice één keer draaien in n8n of met Claude en vul je Proof-draft.',
  allowed:['Werk aan je eigen Classroom 2-use-case, niet aan een nieuw product.','Kies één stack: n8n óf Claude Agent SDK.','Geen secrets in je repo of workflow; een mens reviewt vóór je verder bouwt.'],
  starterFiles:[],
  hints:['Thin betekent één uitkomst die een vreemde kan aanwijzen.','Intent vóór plan, plan vóór build.','Stop vóór polish; dat is voor Workshop 7.'],
  stretch:'Laat een andere deelnemer je intent lezen en de uitkomst terugvertellen.'
 },
 openItems:[]
};

export default {
 day:6,
 kind:'workshop',
 deck:d,
 copy:{en,nl},
 ...nl,
};
