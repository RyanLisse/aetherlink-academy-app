import assert from 'node:assert/strict';
import test from 'node:test';
import {DAY_PACKS} from '../content/days/index.mjs';
import {loadDeckSlides,validateDayPacks} from '../content/days/validate.mjs';
import {SUPPORT_FIXTURES} from '../content/support/grade.mjs';
import {getDayPack,listDaySummaries,listRouteDays,starterFileNames} from '../server/content.mjs';

const root=process.cwd();
const decks=await loadDeckSlides(root);

test('Wave 1–7 stay locked; Harness packs 8–24 are opt-in',()=>{
 assert.deepEqual(listDaySummaries().map(d=>d.day),Array.from({length:24},(_,i)=>i+1));
 assert.deepEqual([1,2,3,4,5,6,7].map(day=>getDayPack(day).code),['classroom-1','classroom-2','workshop-3','workshop-4','workshop-5','workshop-6','workshop-7']);
 assert.deepEqual([1,2,3,4,5,6,7].map(day=>getDayPack(day).mission.id),['CLASSROOM-01','CLASSROOM-02','TRIAGE-N8N-03','TRIAGE-CLAUDE-04','SDLC-BRIEF-05','EIGEN-SLICE-06','EIGEN-SHIP-07']);
 assert.equal(getDayPack(8)?.code,'harness');
 assert.equal(getDayPack(9)?.mission.id,'HARNESS-S02');
 assert.equal(getDayPack(10)?.mission.id,'HARNESS-S03');
 assert.equal(getDayPack(11)?.mission.id,'HARNESS-S04');
 assert.equal(getDayPack(14)?.mission.id,'HARNESS-S07');
 assert.equal(getDayPack(17)?.mission.id,'HARNESS-S10');
 assert.equal(getDayPack(22)?.mission.id,'HARNESS-S15');
 assert.equal(getDayPack(24)?.mission.id,'HARNESS-S17');
 assert.equal(getDayPack(24)?.code,'harness');
 assert.equal(listRouteDays()[6].title,'Workshop 7 · Own assignment: ship it');
 assert.equal(getDayPack(7).copy.nl.title,'Workshop 7 · Eigen opdracht: afronden');
 assert.equal(listRouteDays().length,7,'default route stays Wave 1–7');
});

test('every pack passes the day-pack lint and every slide citation matches its deck',()=>{
 assert.deepEqual(validateDayPacks(DAY_PACKS,{root,decks}),[]);
 assert.deepEqual(getDayPack(3).quiz.questions.map(q=>q.id),['d3-q1','d3-q2','d3-q3']);
 assert.deepEqual(getDayPack(3).quiz.key,{'d3-q1':'b','d3-q2':'a','d3-q3':'c'});
 assert.equal(getDayPack(4).quiz.questions.length,3);
 assert.equal(decks['classroom-2'][10].title,'Assignment 6: Design AetherBOT');
 assert.deepEqual(getDayPack(2).steps[0].slide,{deck:'classroom-2',slide:78,title:'Assignment 6: Design AetherBOT',href:'/classroom/2?index=10'});
 assert.deepEqual(getDayPack(3).demo.slides.map(s=>s.href),['/workshop/3?index=5','/workshop/3?index=8','/workshop/3?index=11']);
});

test('s05 Try it fields project to both locales and validate their shape and parity',()=>{
 const pack=getDayPack(12);
 assert.deepEqual(pack.steps.map(step=>step.id),['s05-see','s05-sim','s05-run']);
 assert.equal(pack.steps[0].run.length,3);
 assert.equal(pack.steps[0].prompts.length,2);
 assert.equal(pack.steps[0].watchFor,pack.copy.en.solo[0].watchFor);
 assert.equal(pack.copy.nl.solo[0].run.length,3);
 assert.equal(pack.copy.nl.solo[0].prompts.length,2);
 for(const locale of ['en','nl'])assert.doesNotMatch(JSON.stringify(pack.copy[locale].solo),/state the motto|noem het motto/i);
 const invalid=structuredClone(DAY_PACKS);
 invalid[11].copy.en.solo[0].run[0]=' ';
 invalid[11].copy.nl.solo[0].prompts.pop();
 assert.deepEqual(validateDayPacks(invalid,{root,decks}),[
  'day 12: step s05-see en.run must be a non-empty string array',
  'day 12: step s05-see copy.nl.prompts must match the EN count'
 ]);
});

test('the lint names a citation whose slide title drifted and a missing starter',()=>{
 const drifted=structuredClone(DAY_PACKS);
 drifted[3].steps[2].slide.title='Run your agent';
 drifted[2].mission.starterFiles=['missing.json'];
 assert.deepEqual(validateDayPacks(drifted,{root,decks}),[
  'day 3: starter file missing: starter/missing.json',
  'day 4: step w4-solo2 cites workshop-4 slide 10 "Run your agent" but the deck has "Run the orchestrator and inspect the draft."'
 ]);
});

test('Workshop 3 keeps triage fixtures; Workshop 4 grades new support messages',()=>{
 const day3=getDayPack(3),day4=getDayPack(4);
 assert.deepEqual(day3.steps.filter(s=>s.autograde).map(s=>s.autograde),['triage','triage','triage']);
 assert.deepEqual(day4.steps.filter(s=>s.autograde).map(s=>[s.id,s.autograde]),[
  ['w4-solo1','support'],
  ['w4-solo4','support-mcp']
 ]);
 assert.deepEqual(day4.mission.starterFiles,['customer-messages.md']);
 assert.equal(SUPPORT_FIXTURES.id,'support-messages-v1');
 assert.deepEqual(SUPPORT_FIXTURES.tickets.map(({ticket})=>ticket.ticket_id),Array.from({length:10},(_,i)=>`MSG-${String(i+1).padStart(2,'0')}`));
 assert.deepEqual(SUPPORT_FIXTURES.tickets.filter(ticket=>ticket.expected_priority).map(({ticket,expected_priority})=>`${ticket.ticket_id}=${expected_priority}`),[
  'MSG-01=low','MSG-02=high','MSG-03=medium','MSG-04=low','MSG-05=high','MSG-06=low','MSG-07=medium','MSG-08=high','MSG-09=medium'
 ]);
 assert.deepEqual(SUPPORT_FIXTURES.ungraded,['MSG-10']);
 assert.equal(SUPPORT_FIXTURES.tickets.at(-1).expected_priority,undefined);
});

test('Workshop 4 quiz covers project settings, delegation, and stdio MCP',()=>{
 const pack=getDayPack(4);
 for(const lang of ['en','nl']){
  const quiz=pack.copy[lang].quiz;
  assert.equal(quiz.questions.length,3,lang);
  const quizText=JSON.stringify(quiz.questions);
  assert.match(quizText,/settingSources: \['project'\]/,lang);
  assert.match(quizText,/ticket-analyst/,lang);
  assert.match(quizText,/npm install/,lang);
  assert.match(quizText,lang==='en'?/on demand over stdio/i:/op verzoek via stdio/i,lang);
  assert.doesNotMatch(quizText,/transactions\.xlsx/i,lang);
 }
});

test('Workshop 3 keeps its levels; all Workshop 4 lessons are required',()=>{
 assert.deepEqual(getDayPack(3).steps.map(s=>`${s.badge}:${s.level}`),['L1:required','L2:required','L3:stretch','P:required']);
 assert.deepEqual(getDayPack(4).steps.map(s=>`${s.badge}:${s.level}`),['S0:required','S1:required','S2:required','S3:required','S4:required']);
 assert.deepEqual(getDayPack(5).lesson.loop.map(s=>s.label),['Intent','Spec','Plan','Build','Test','Review','Handoff']);
 assert.deepEqual(getDayPack(1).lesson.loop.map(s=>s.label),['Explore','Plan','Create','Test','Human review','Handoff']);
});

test('Classroom 2 Proof acceptance hands its use-case to Workshop 6 (AET-76)',()=>{
 const pack=getDayPack(2);
 const proof=pack.reviewCriteria;
 const blob=proof.join('\n');
 assert.ok(proof.length>=7);
 assert.match(blob,/Workshop 6/);
 assert.match(blob,/use-case/i);
 assert.match(blob,/Agent Capability Map/);
 assert.match(blob,/artefact|artifact/i);
 assert.match(blob,/Customize-stackdiagram|ConceptSim|c2-customize-stack/);
 // Locale-complete: EN+NL Proof AC both name use-case→W6 + capability map + artefact
 for(const lang of ['en','nl']){
  const loc=pack.copy[lang].proof.join('\n');
  assert.match(loc,/Workshop 6/,lang);
  assert.match(loc,/use-case/i,lang);
  assert.match(loc,/Agent Capability Map/,lang);
  assert.match(loc,/artefact|artifact|Proof-AC|Proof AC/,lang);
 }
 // Loop beats cite slides and/or P3 surfaces
 const loopBlob=[...pack.copy.en.loop,...pack.copy.nl.loop].map(s=>s.prompt).join('\n');
 assert.match(loopBlob,/slide 76|dia 76/);
 assert.match(loopBlob,/slide 86|dia 86/);
 assert.match(loopBlob,/c2-customize-stack/);
 assert.match(loopBlob,/Agent Capability Map/);
 assert.match(loopBlob,/Workshop 6/);
 assert.equal(getDayPack(6).materials.find(m=>m.label==='Je Classroom 2-artefact').href,'/classroom/2');
});

test('unverifiable sources stay OPEN instead of invented',()=>{
 assert.equal(getDayPack(2).demo.slides.length,0);
 assert.match(getDayPack(2).lesson.workedExample,/customize-stack|CLAUDE\.md → skills → subagents → MCP\/hooks/i);
 assert.match(getDayPack(2).demo.open || '',/geen aparte live-demo-dia/);
 assert.deepEqual(getDayPack(3).materials.filter(m=>!m.href).map(m=>m.label),['Workshop-n8n-instantie']);
 assert.deepEqual(getDayPack(1).materials.filter(m=>m.kind==='naslag').map(m=>m.href),[
  'https://anthropic.skilljar.com/claude-code-101',
  'https://anthropic.skilljar.com/claude-code-in-action',
  'https://ccforeveryone.com/guides/claude-code-concepts-explained'
 ]);
});
test('Classroom 2 and missing days gain naslag links from NASLAG SoT (AET-84)',()=>{
 const d2=getDayPack(2).materials.filter(m=>m.kind==='naslag');
 assert.deepEqual(d2.map(m=>m.href),[
  'https://academy.claude.com/courses/introduction-to-agent-skills',
  'https://academy.claude.com/courses/introduction-to-subagents',
  'https://code.claude.com/docs/en/agents',
  'https://code.claude.com/docs/en/skills',
  'https://code.claude.com/docs/en/sub-agents',
  'https://ccforeveryone.com/guides/claude-code-concepts-explained'
 ]);
 assert.equal(d2.every(m=>m.href),true);
 assert.equal(getDayPack(2).openItems.some(i=>/no reference|geen naslagbronnen/i.test(i)),false);
 for(const lang of ['en','nl']){
  const mats=getDayPack(2).copy[lang].materials.filter(m=>m.kind==='naslag');
  assert.ok(mats.length>=6,lang);
  assert.equal(mats.every(m=>m.href),true,lang);
  assert.equal(getDayPack(2).copy[lang].openItems.some(i=>/no reference|geen naslagbronnen/i.test(i)),false,lang);
 }
 const d3=getDayPack(3).materials.filter(m=>/facilitator/i.test(m.label));
 assert.equal(d3.length,1);
 assert.match(d3[0].href,/facilitator-n8n-triage\.md/);
 assert.ok(getDayPack(3).materials.some(m=>m.kind==='starter'&&m.file==='n8n-triage-l1-switch.json'));
 assert.ok(getDayPack(3).materials.some(m=>m.kind==='starter'&&m.file==='n8n-triage-l2-agent-memory.json'));
 assert.ok(getDayPack(3).materials.some(m=>m.kind==='starter'&&m.file==='n8n-triage-l3-multi-agent.json'));
 const d4=getDayPack(4).materials.filter(m=>m.kind==='naslag').map(m=>m.href);
 assert.ok(d4.includes('https://code.claude.com/docs/en/agent-sdk/overview'));
 assert.ok(d4.includes('https://code.claude.com/docs/en/agents'));
 const d5=getDayPack(5).materials.filter(m=>m.kind==='naslag').map(m=>m.href);
 assert.ok(d5.includes('https://academy.claude.com/courses/ai-native-sdlc-playbook'));
 assert.ok(d5.includes('https://claude.com/blog/the-ai-native-sdlc-playbook'));
 const proofBlob=getDayPack(2).reviewCriteria.join('\n');
 assert.match(proofBlob,/Workshop 6/);
 assert.match(proofBlob,/c2-customize-stack/);
 assert.equal(/Proof open|no reference sources/i.test(proofBlob),false);
});


test('starter whitelist keeps legacy files and adds the triage and support starters',()=>{
 for(const file of ['README.md','n8n-repository-review.json','n8n-triage-l1-switch.json','n8n-triage-l2-agent-memory.json','n8n-triage-l3-multi-agent.json','triage-fixtures.json','customer-messages.md'])assert.equal(starterFileNames.includes(file),true,file);
 assert.equal(starterFileNames.includes('../package.json'),false);
});

test('Workshop 4 cites HTML Solo packs weather + day5 + council (AET-130)',()=>{
 const d4=getDayPack(4);
 const solos=d4.materials.filter(m=>m.kind==='solo');
 assert.deepEqual(solos.map(m=>m.href),[
  '/courses/weather-agent-sdk/index.html',
  '/courses/aetherlink-day5-n8n-to-agent/index.html',
  '/courses/council-agent-sdk/index.html'
 ]);
 assert.match(solos[1].label,/optional parity bonus|optionele pariteitsbonus/i);
 assert.ok(d4.materials.some(m=>m.kind==='vehicle'&&m.href.endsWith('/training-lab/w4-support-agent-sdk')));
 for(const lang of ['en','nl']){
  const mats=d4.copy[lang].materials.filter(m=>m.kind==='solo');
  assert.deepEqual(mats.map(m=>m.href),[
   '/courses/weather-agent-sdk/index.html',
   '/courses/aetherlink-day5-n8n-to-agent/index.html',
   '/courses/council-agent-sdk/index.html'
  ],lang);
  assert.match(mats[1].label,lang==='en'?/optional parity bonus/i:/optionele pariteitsbonus/i,lang);
  // no EN leak under nl labels for the three solos — labels stay product ids + short NL notes
  assert.equal(mats.every(m=>typeof m.label==='string'&&m.label.length>0),true,lang);
 }
 assert.equal(d4.materials.some(m=>/start-solo/i.test(m.href||'')||/start-solo/i.test(m.label||'')),false);
});

test('Workshop 5 cites daily-brief HTML course + Assignments + SOLO (AET-131)',()=>{
 const d5=getDayPack(5);
 const solos=d5.materials.filter(m=>m.kind==='solo');
 assert.deepEqual(solos.map(m=>m.href),[
  '/courses/aetherlink-daily-brief-lab-s1/index.html',
  '/courses/aetherlink-daily-brief-lab-s1/SOLO.md'
 ]);
 const assignments=d5.materials.filter(m=>m.kind==='assignment');
 assert.deepEqual(assignments.map(m=>m.href),[
  '/courses/aetherlink-daily-brief-lab-s1/intent.md',
  '/courses/aetherlink-daily-brief-lab-s1/docs/spec.md',
  '/courses/aetherlink-daily-brief-lab-s1/docs/gate.md'
 ]);
 for(const lang of ['en','nl']){
  const mats=d5.copy[lang].materials;
  assert.deepEqual(mats.filter(m=>m.kind==='solo').map(m=>m.href),[
   '/courses/aetherlink-daily-brief-lab-s1/index.html',
   '/courses/aetherlink-daily-brief-lab-s1/SOLO.md'
  ],lang);
  assert.deepEqual(mats.filter(m=>m.kind==='assignment').map(m=>m.href),[
   '/courses/aetherlink-daily-brief-lab-s1/intent.md',
   '/courses/aetherlink-daily-brief-lab-s1/docs/spec.md',
   '/courses/aetherlink-daily-brief-lab-s1/docs/gate.md'
  ],lang);
  // no EN leak under nl labels for new cites
  if(lang==='nl'){
   for(const m of mats.filter(m=>m.kind==='solo'||m.kind==='assignment')){
    assert.equal(/HTML course ·|Assignment ·/.test(m.label),false,`EN leak in nl label: ${m.label}`);
   }
  }
 }
 assert.equal(d5.materials.some(m=>/start-solo/i.test(m.href||'')||/start-solo/i.test(m.label||'')),false);
});

test('Classroom 1-2 cite Solo-in-Claude concepts pack + Proof card (AET-132)',()=>{
 for(const day of [1,2]){
  const pack=getDayPack(day);
  const solos=pack.materials.filter(m=>m.kind==='solo');
  assert.ok(solos.some(m=>m.href==='/solos/c1-c2-concepts/index.html'),`day ${day} solo entry`);
  const proof=pack.materials.filter(m=>m.kind==='assignment');
  assert.ok(proof.some(m=>m.href==='/solos/c1-c2-concepts/proof/artifact-card.html'),`day ${day} proof card`);
  assert.ok(pack.materials.some(m=>m.kind==='naslag'&&m.href==='https://ccforeveryone.com/guides/claude-code-concepts-explained'),`day ${day} Carl naslag`);
  for(const lang of ['en','nl']){
   const mats=pack.copy[lang].materials;
   assert.ok(mats.some(m=>m.href==='/solos/c1-c2-concepts/index.html'),`${lang} day ${day} solo`);
   assert.ok(mats.some(m=>m.href==='/solos/c1-c2-concepts/proof/artifact-card.html'),`${lang} day ${day} proof`);
  }
  const nlSolo=pack.copy.nl.materials.find(m=>m.href==='/solos/c1-c2-concepts/index.html');
  assert.match(nlSolo.label,/concepten/i);
  assert.equal(/HTML course|Assignment /.test(nlSolo.label),false);
  const nlProof=pack.copy.nl.materials.find(m=>m.href==='/solos/c1-c2-concepts/proof/artifact-card.html');
  assert.match(nlProof.label,/artefactkaart/i);
 }
});
