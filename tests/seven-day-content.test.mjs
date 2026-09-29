import assert from 'node:assert/strict';
import test from 'node:test';
import {DAY_PACKS} from '../content/days/index.mjs';
import {loadDeckSlides,validateDayPacks} from '../content/days/validate.mjs';
import {TRIAGE_FIXTURES,gradeTriage,keywordPriority} from '../content/triage/grade.mjs';
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
 assert.equal(listRouteDays()[6].title,'Workshop 7 · Eigen opdracht: afronden');
 assert.equal(listRouteDays().length,7,'default route stays Wave 1–7');
});

test('every pack passes the day-pack lint and every slide citation matches its deck',()=>{
 assert.deepEqual(validateDayPacks(DAY_PACKS,{root,decks}),[]);
 assert.deepEqual(getDayPack(3).quiz.questions.map(q=>q.id),['d3-q1','d3-q2','d3-q3']);
 assert.deepEqual(getDayPack(3).quiz.key,{'d3-q1':'b','d3-q2':'a','d3-q3':'c'});
 assert.equal(decks['classroom-2'][10].title,'Assignment 6: Project instructions');
 assert.deepEqual(getDayPack(2).steps[0].slide,{deck:'classroom-2',slide:55,title:'Assignment 6: Project instructions',href:'/classroom/2?index=10'});
 assert.deepEqual(getDayPack(3).demo.slides.map(s=>s.href),['/workshop/3?index=5','/workshop/3?index=8','/workshop/3?index=11']);
});

test('the lint names a citation whose slide title drifted and a missing starter',()=>{
 const drifted=structuredClone(DAY_PACKS);
 drifted[3].steps[2].slide.title='Run your agent';
 drifted[2].mission.starterFiles=['missing.json'];
 assert.deepEqual(validateDayPacks(drifted,{root,decks}),[
  'day 3: starter file missing: starter/missing.json',
  'day 4: step w4-solo2 cites workshop-4 slide 10 "Run your agent" but the deck has "Run your first agent on a fixture."'
 ]);
});

test('day 3 and day 4 are graded on one fixture set with the same labels',()=>{
 const day3=getDayPack(3).triage,day4=getDayPack(4).triage;
 assert.equal(day3,day4);
 assert.deepEqual(day3.tickets,[
  {ticketId:'WL-1026',synthetic:false},
  {ticketId:'WL-1027',synthetic:false},
  {ticketId:'WL-9001',synthetic:true},
  {ticketId:'WL-9002',synthetic:true}
 ]);
 assert.deepEqual(TRIAGE_FIXTURES.tickets.map(t=>`${t.ticket.ticket_id}=${t.expected_priority}`),['WL-1026=high','WL-1027=low','WL-9001=medium','WL-9002=medium']);
 const n8nL1=Object.fromEntries(TRIAGE_FIXTURES.tickets.map(({ticket})=>[ticket.ticket_id,keywordPriority(ticket.message)]));
 assert.deepEqual(n8nL1,{'WL-1026':'high','WL-1027':'low','WL-9001':'medium','WL-9002':'medium'});
 assert.equal(gradeTriage(n8nL1).pass,true);
 const claude=gradeTriage({'WL-1026':'HIGH','WL-1027':'low','WL-9001':'low','WL-9002':'urgent'});
 assert.deepEqual(claude.rows.map(r=>[r.ticketId,r.actual,r.match]),[['WL-1026','high',true],['WL-1027','low',true],['WL-9001','low',false],['WL-9002',null,false]]);
 assert.equal(claude.pass,false);
});

test('workshop rhythm: W3 solo bar is L2 with L3 as stretch, W4 bar is SOLO 2',()=>{
 assert.deepEqual(getDayPack(3).steps.map(s=>`${s.badge}:${s.level}`),['L1:required','L2:required','L3:stretch','P:required']);
 assert.deepEqual(getDayPack(4).steps.map(s=>`${s.badge}:${s.level}`),['S0:required','S1:required','S2:required','S3:stretch','S4:required']);
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
 assert.match(loopBlob,/slide 54|dia 54/);
 assert.match(loopBlob,/slide 63|dia 63/);
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
 assert.deepEqual(getDayPack(1).materials.filter(m=>m.kind==='naslag').map(m=>m.href),['https://anthropic.skilljar.com/claude-code-101','https://anthropic.skilljar.com/claude-code-in-action']);
});
test('Classroom 2 and missing days gain naslag links from NASLAG SoT (AET-84)',()=>{
 const d2=getDayPack(2).materials.filter(m=>m.kind==='naslag');
 assert.deepEqual(d2.map(m=>m.href),[
  'https://academy.claude.com/courses/introduction-to-agent-skills',
  'https://academy.claude.com/courses/introduction-to-subagents',
  'https://code.claude.com/docs/en/agents',
  'https://code.claude.com/docs/en/skills',
  'https://code.claude.com/docs/en/sub-agents'
 ]);
 assert.equal(d2.every(m=>m.href),true);
 assert.equal(getDayPack(2).openItems.some(i=>/no reference|geen naslagbronnen/i.test(i)),false);
 for(const lang of ['en','nl']){
  const mats=getDayPack(2).copy[lang].materials.filter(m=>m.kind==='naslag');
  assert.ok(mats.length>=5,lang);
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


test('starter whitelist keeps legacy files and adds the triage starters',()=>{
 for(const file of ['README.md','n8n-repository-review.json','n8n-triage-l1-switch.json','n8n-triage-l2-agent-memory.json','n8n-triage-l3-multi-agent.json','triage-fixtures.json'])assert.equal(starterFileNames.includes(file),true,file);
 assert.equal(starterFileNames.includes('../package.json'),false);
});
