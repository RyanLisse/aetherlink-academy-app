import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readdirSync,readFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';
import {dayChecks} from '../server/progress.mjs';
import {dayPackIssues} from '../server/day-pack-lint.mjs';
import {TRIAGE_FIXTURES} from '../content/triage/grade.mjs';

const ALL_CORRECT={'WL-1026':'high','WL-1027':'low','WL-9001':'medium','WL-9002':'medium'};
const ONE_WRONG={...ALL_CORRECT,'WL-9002':'low'};
const ALL_WRONG={'WL-1026':'low','WL-1027':'high','WL-9001':'low','WL-9002':'high'};

const listen=server=>new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(`http://127.0.0.1:${server.address().port}`)));
const close=server=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);});

async function room(t,day=3){
 const instance=createApp({dir:mkdtempSync(path.join(os.tmpdir(),'academy-autograde-')),hostKey:'test-host',publicBaseUrl:'http://127.0.0.1:4322'});
 instance.proof.comment=async()=>({ok:true});
 instance.proof.state=async()=>({markdown:'# Intent\nDoel',marks:{}});
 const base=await listen(instance.server);
 t.after(()=>close(instance.server));
 const host=instance.store.create('Triage squad',{slug:'triage'});
 const bo=instance.store.join(host.code,'Bo'),cy=instance.store.join(host.code,'Cy');
 const call=async(token,route,body)=>{
  const response=await fetch(`${base}/game/${route}`,{method:body?'POST':'GET',headers:{authorization:`Bearer ${token}`,...(body?{'content-type':'application/json'}:{})},body:body&&JSON.stringify(body)});
  const raw=await response.text();
  let json=null;try{json=JSON.parse(raw);}catch{}
  return {status:response.status,body:json,raw};
 };
 assert.equal((await call(host.token,'control',{action:'day',value:day})).status,200);
 const grade=(token,taskId,labels,extra={})=>call(token,`tasks/${taskId}/autograde`,{labels,...extra});
 const task=async(token,taskId)=>(await call(token,'tasks')).body.tasks.find(t=>t.id===taskId);
 return {instance,host,bo,cy,call,grade,task};
}

test('all labels correct: the task is approved by the autograder',async t=>{
 const {bo,grade,task}=await room(t);
 const result=await grade(bo.token,'w3-l1',ALL_CORRECT);
 assert.equal(result.status,200);
 assert.equal(result.body.recorded,true);
 assert.equal(result.body.status,'approved');
 assert.deepEqual({...result.body.autograde,at:null,tickets:null},{grader:'triage',tickets:null,passed:true,score:4,total:4,attempts:1,at:null,results:[
  {ticketId:'WL-1026',label:'high',correct:true},{ticketId:'WL-1027',label:'low',correct:true},{ticketId:'WL-9001',label:'medium',correct:true},{ticketId:'WL-9002',label:'medium',correct:true}
 ],reviewer:{role:'auto-graded'}});
 const card=await task(bo.token,'w3-l1');
 assert.equal(card.status,'approved');
 assert.deepEqual(card.autograde.reviewer,{role:'auto-graded'});
 assert.deepEqual(card.submissions,[]);
});

test('one wrong label: not approved, attempts counted, per-ticket result without the expected label',async t=>{
 const {bo,grade,task}=await room(t);
 const first=await grade(bo.token,'w3-l2',ONE_WRONG);
 assert.equal(first.status,200);
 assert.equal(first.body.status,'open');
 assert.deepEqual([first.body.autograde.passed,first.body.autograde.score,first.body.autograde.total,first.body.autograde.attempts],[false,3,4,1]);
 assert.deepEqual(first.body.autograde.results.at(-1),{ticketId:'WL-9002',label:'low',correct:false});
 assert.equal(first.body.autograde.reviewer,null);
 const second=await grade(bo.token,'w3-l2',ALL_WRONG);
 assert.deepEqual([second.body.status,second.body.autograde.score,second.body.autograde.attempts],['open',0,2]);
 const third=await grade(bo.token,'w3-l2',{'WL-1026':' HIGH ','WL-1027':'Low','WL-9001':'medium','WL-9002':'medium'});
 assert.deepEqual([third.body.status,third.body.autograde.passed,third.body.autograde.attempts],['approved',true,3]);
 const after=await grade(bo.token,'w3-l2',ALL_WRONG);
 assert.deepEqual([after.status,after.body.recorded,after.body.status,after.body.autograde.attempts,after.body.autograde.score],[200,false,'approved',3,4],'a pass is final');
 assert.equal((await task(bo.token,'w3-l2')).status,'approved');
});

test('a failing autograde keeps a human-requested change as changes_requested',async t=>{
 const {cy,bo,call,grade,task}=await room(t);
 const sent=await call(bo.token,'evidence',{requestId:'e-1',finding:'Flow draait',command:'n8n execute',observed:'4 items',limitation:'Fixture',taskId:'w3-l1'});
 assert.equal(sent.status,200);
 assert.equal((await call(cy.token,'review',{id:sent.body.id,status:'needs-work',note:'Voeg de export toe.',requestId:'r-1'})).status,200);
 const failed=await grade(bo.token,'w3-l1',ONE_WRONG);
 assert.equal(failed.body.status,'changes_requested');
 const passed=await grade(bo.token,'w3-l1',ALL_CORRECT);
 assert.equal(passed.body.status,'approved');
 assert.equal((await task(bo.token,'w3-l1')).submissions[0].review.note,'Voeg de export toe.');
});

test('an autograde pass closes pending evidence: it leaves the peer queue and cannot be reviewed',async t=>{
 const {bo,cy,call,grade}=await room(t);
 const sent=await call(bo.token,'evidence',{requestId:'e-2',finding:'Flow draait',command:'n8n execute',observed:'4 items',limitation:'Fixture',taskId:'w3-l1'});
 assert.deepEqual((await call(cy.token,'tasks/peer')).body.queue.map(q=>q.taskId),['w3-l1']);
 assert.equal((await grade(bo.token,'w3-l1',ALL_CORRECT)).body.status,'approved');
 assert.deepEqual((await call(cy.token,'tasks/peer')).body.queue,[]);
 const late=await call(cy.token,'review',{id:sent.body.id,status:'accepted',note:'Goed',requestId:'r-2'});
 assert.deepEqual([late.status,late.body.error],[409,'Alleen ingediende opdrachten kunnen worden beoordeeld.']);
 const again=await call(bo.token,'evidence',{requestId:'e-3',finding:'x',command:'y',observed:'z',limitation:'w',taskId:'w3-l1'});
 assert.equal(again.status,409);
});

test('a task a human already approved rejects a later autograde',async t=>{
 const {bo,cy,call,grade}=await room(t);
 const sent=await call(bo.token,'evidence',{requestId:'e-4',finding:'Flow draait',command:'n8n execute',observed:'4 items',limitation:'Fixture',taskId:'w3-l3'});
 assert.equal((await call(cy.token,'review',{id:sent.body.id,status:'accepted',note:'Goed',requestId:'r-3'})).status,200);
 const late=await grade(bo.token,'w3-l3',ALL_CORRECT);
 assert.deepEqual([late.status,late.body.error],[409,'Deze opdracht is al goedgekeurd.']);
});

test('tasks without an autograder keep peer or facilitator review',async t=>{
 const {bo,cy,call,grade,task}=await room(t);
 const refused=await grade(bo.token,'w3-proof',ALL_CORRECT);
 assert.deepEqual([refused.status,refused.body.error],[409,'Deze opdracht wordt door een mens beoordeeld, niet automatisch.']);
 const proofCard=await task(bo.token,'w3-proof');
 assert.equal(proofCard.status,'open');
 assert.equal(proofCard.autograde,undefined);
 const sent=await call(bo.token,'evidence',{requestId:'e-5',finding:'Export',command:'n8n export',observed:'json',limitation:'Geen',taskId:'w3-proof'});
 assert.equal((await task(bo.token,'w3-proof')).status,'submitted');
 assert.equal((await call(cy.token,'review',{id:sent.body.id,status:'accepted',note:'Compleet',requestId:'r-4'})).status,200);
 assert.equal((await task(bo.token,'w3-proof')).status,'approved');
});

test('autograde applies to the triage tasks of day 3 and SOLO 1 plus the acceptance table of day 4 only',async t=>{
 const {bo,call}=await room(t,4);
 const day4=(await call(bo.token,'tasks')).body.tasks;
 assert.deepEqual(day4.filter(task=>task.autograde).map(task=>task.id),['w4-solo1','w4-solo4']);
 assert.equal((await call(bo.token,'tasks/w4-solo4/autograde',{labels:ALL_CORRECT})).body.status,'approved');
 const wrongDay=await call(bo.token,'tasks/w3-l1/autograde',{labels:ALL_CORRECT});
 assert.deepEqual([wrongDay.status,wrongDay.body.error],[400,'Onbekende opdracht voor supportdag 4.']);
});

test('participant isolation: a pass is personal and the facilitator cannot submit labels',async t=>{
 const {host,bo,cy,grade,task}=await room(t);
 assert.equal((await grade(bo.token,'w3-l1',ALL_CORRECT)).body.status,'approved');
 const other=await task(cy.token,'w3-l1');
 assert.deepEqual([other.status,other.autograde.attempts,other.autograde.results],['open',0,[]]);
 const facilitator=await grade(host.token,'w3-l1',ALL_CORRECT);
 assert.deepEqual([facilitator.status,facilitator.body.error],[403,'Alleen deelnemers leveren labels in voor automatische beoordeling.']);
 assert.equal((await grade('not-a-token','w3-l1',ALL_CORRECT)).status,401);
});

test('malformed submissions are rejected before grading and do not count as attempts',async t=>{
 const {bo,grade,task}=await room(t);
 const cases=[
  [{'WL-1026':'urgent'},'Ongeldig label bij WL-1026. Kies low, medium of high.'],
  [{'WL-4242':'low'},'Onbekend ticket: WL-4242.'],
  [['high'],'Stuur per ticket-id een label (low, medium of high) en optioneel een antwoord.'],
  [{'WL-1026':3},'Ongeldig label bij WL-1026. Kies low, medium of high.']
 ];
 for(const [labels,error] of cases){
  const response=await grade(bo.token,'w3-l1',labels);
  assert.deepEqual([response.status,response.body.error],[400,error]);
 }
 const reply=await grade(bo.token,'w3-l1',ALL_CORRECT,{replies:{'WL-1026':'x'.repeat(2001)}});
 assert.deepEqual([reply.status,reply.body.error],[400,'Een antwoord is tekst van maximaal 2000 tekens.']);
 assert.equal((await task(bo.token,'w3-l1')).autograde.attempts,0);
 const missing=await grade(bo.token,'w3-l1',{'WL-1026':'high'});
 assert.deepEqual([missing.status,missing.body.autograde.score,missing.body.autograde.results[1]],[200,1,{ticketId:'WL-1027',label:null,correct:false}]);
});

const leaks=(value,found=[])=>{
 if(Array.isArray(value))value.forEach(v=>leaks(v,found));
 else if(value&&typeof value==='object'){
  for(const key of Object.keys(value))if(/^expected|^why$|^l1Rule$/.test(key))found.push(key);
  const id=value.ticketId??value.ticket_id,expected=TRIAGE_FIXTURES.tickets.find(t=>t.ticket.ticket_id===id)?.expected_priority;
  if(expected&&Object.values(value).includes(expected))found.push(`${id}=${expected}`);
  Object.values(value).forEach(v=>leaks(v,found));
 }
 return found;
};

test('expected labels never reach a participant: day pack, tasks, starter file and grade results',async t=>{
 const {bo,call,grade}=await room(t);
 assert.equal((await grade(bo.token,'w3-l1',ALL_WRONG)).status,200);
 const responses={
  'day-pack':await call(bo.token,'day-pack'),
  tasks:await call(bo.token,'tasks'),
  state:await call(bo.token,'state'),
  'day-route':await call(bo.token,'day-route'),
  knowledge:await call(bo.token,'knowledge'),
  starter:await call(bo.token,'starter/triage-fixtures.json'),
  autograde:await grade(bo.token,'w3-l1',ALL_WRONG)
 };
 for(const [name,response] of Object.entries(responses)){
  assert.equal(response.status,200,name);
  assert.ok(response.body,`${name} returns JSON`);
  assert.deepEqual(leaks(response.body),[],`${name} carries no expected label`);
  assert.doesNotMatch(response.raw,/expected_priority|"expected"/,name);
 }
 assert.deepEqual(responses.starter.body.tickets.map(t=>t.ticket),TRIAGE_FIXTURES.tickets.map(t=>t.ticket),'participants still get every fixture ticket');
 assert.deepEqual(responses.starter.body.labels,['low','medium','high']);
 assert.ok(leaks(TRIAGE_FIXTURES).includes('expected_priority'),'the leak detector finds the keyed fixture');
});

test('dayChecks exposes quiz, lab and autograded task passes as one list',async t=>{
 const {instance,bo,call,grade}=await room(t);
 const start=await call(bo.token,'quiz/start',{});
 await call(bo.token,'quiz',{attemptId:start.body.attemptId,answers:{'d3-q1':'b','d3-q2':'a','d3-q3':'c'}});
 await grade(bo.token,'w3-l1',ALL_CORRECT);
 await grade(bo.token,'w3-l2',ONE_WRONG);
 const {r,p}=instance.store.auth(bo.token);
 p.progressByDay['3'].labs={'lab-a':{source:'server-graded'},'lab-b':{source:'lab-reported'}};
 assert.deepEqual(dayChecks(r,p,3),[
  {kind:'quiz',id:'d3-quiz',source:'server-graded',passed:true},
  {kind:'lab',id:'lab-a',source:'server-graded',passed:true},
  {kind:'lab',id:'lab-b',source:'lab-reported',passed:false},
  {kind:'task',id:'w3-l1',source:'auto-graded',passed:true},
  {kind:'task',id:'w3-l2',source:'auto-graded',passed:false},
  {kind:'task',id:'w3-l3',source:'auto-graded',passed:false}
 ]);
});

test('a day pack naming an unknown autograder fails the content lint',()=>{
 const pack={day:3,quiz:{questions:[],key:{}},steps:[{id:'w3-l1',autograde:'vibes'}],mission:{starterFiles:[]}};
 assert.deepEqual(dayPackIssues([pack],{starterDir:'.',starterFileNames:[]}).filter(issue=>issue.includes('autograder')),['day 3: step w3-l1 names unknown autograder "vibes"']);
});

test('AET-103 decision: correct labels auto-approve every triage level L1 to L3 without a human review',async t=>{
 const {bo,grade,task}=await room(t);
 for(const taskId of ['w3-l1','w3-l2','w3-l3'])assert.deepEqual([(await grade(bo.token,taskId,ALL_CORRECT)).body.status,(await task(bo.token,taskId)).status,(await task(bo.token,taskId)).submissions],['approved','approved',[]],taskId);
 assert.equal((await task(bo.token,'w3-proof')).autograde,undefined,'the Proof pack stays with a human');
});

// Mentions like "WL-1026 high" in prose leak as surely as an expected_priority key.
const proseLeaks=raw=>TRIAGE_FIXTURES.tickets.map(t=>[t.ticket.ticket_id,t.expected_priority]).filter(([id,label])=>new RegExp(`${id}\\W{1,3}${label}\\b`,'i').test(raw)).map(([id,label])=>`${id}=${label}`);

test('SOLO 1 on day 4: predict the labels, then the autograder checks them; the day pack never names an expected label',async t=>{
 const {bo,call,grade,task}=await room(t,4);
 const pack=await call(bo.token,'day-pack');
 const solo1=pack.body.steps.find(step=>step.id==='w4-solo1');
 assert.deepEqual([solo1.title,solo1.autograde,solo1.slide.slide],['SOLO 1 · Voorspel en check de labels','triage',7]);
 assert.match(solo1.goal,/^Voorspel per fixture-ticket het label/);
 assert.deepEqual(leaks(pack.body),[]);
 assert.deepEqual(proseLeaks(pack.raw),[]);
 assert.doesNotMatch(pack.raw,/expected_priority|"expected"/);
 const card=await task(bo.token,'w4-solo1');
 assert.deepEqual([card.status,card.autograde.tickets.map(ticket=>ticket.ticketId)],['open',['WL-1026','WL-1027','WL-9001','WL-9002']]);
 const miss=await grade(bo.token,'w4-solo1',ONE_WRONG);
 assert.deepEqual([miss.status,miss.body.status,miss.body.autograde.score],[200,'open',3]);
 assert.deepEqual(proseLeaks(miss.raw),[]);
 const hit=await grade(bo.token,'w4-solo1',ALL_CORRECT);
 assert.deepEqual([hit.body.status,hit.body.autograde.reviewer],['approved',{role:'auto-graded'}]);
 assert.deepEqual((await grade(bo.token,'w4-solo4',ALL_CORRECT)).body.status,'approved','SOLO 4 keeps its own autograde');
});

test('the prose leak detector finds an expected label written next to its ticket',()=>{
 assert.deepEqual(proseLeaks('toon de verwachte labels (WL-1026 high, WL-1027 low)'),['WL-1026=high','WL-1027=low']);
});

test('no deck slide, speaker note or archived slide names an expected triage label, because both ship to the browser',()=>{
 const sources=[['../apps/web/src/deck/','.ts'],['../content/archive/','.json']];
 const found=sources.flatMap(([dir,ext])=>{const base=new URL(dir,import.meta.url);return readdirSync(base).filter(name=>name.endsWith(ext)).flatMap(name=>proseLeaks(readFileSync(new URL(name,base),'utf8')).map(leak=>`${name}: ${leak}`));});
 assert.deepEqual(found,[]);
});
