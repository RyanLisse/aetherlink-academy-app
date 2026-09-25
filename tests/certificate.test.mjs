import test from 'node:test';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';
import {LocalStore} from '../server/local-store.mjs';
import {certificateEligibility,memberDayChecks} from '../server/certificate.mjs';
import {getDayPack} from '../server/content.mjs';

const DAY=24*60*60*1000;
const START=Date.parse('2026-10-05T00:00:00Z');
const ID=/^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;

const pass=(kind,id)=>({kind,id,passed:true});
const open=(kind,id,title)=>({kind,id,passed:false,...(title?{title}:{})});
const day1=[pass('quiz','d1-quiz'),pass('task','c1-a1'),open('task','c1-a2','Opdracht 2 · Nachtelijke bugjacht')];
const day2=[pass('quiz','d2-quiz'),open('lab','lab-1'),pass('task','c2-a6'),open('task','c2-a7')];
const base={days:2,checksByDay:{1:day1,2:day2},accessRevoked:false,lastDayStarted:true};

test('completion rule (lighter, 2026-09-25): a day counts when its quiz is fully correct and at least one task passed',()=>{
 const table=[
  ['one passed task and a fully correct quiz complete a day; other open tasks and labs do not block',{},{eligible:true,daysCompleted:2,reasons:[]}],
  ['quiz of day 2 not fully correct',{checksByDay:{1:day1,2:[open('quiz','d2-quiz'),pass('task','c2-a6')]}},{eligible:false,daysCompleted:1,reasons:[{code:'quiz-open',day:2,id:'d2-quiz'}]}],
  ['no task of day 1 passed',{checksByDay:{1:[pass('quiz','d1-quiz'),open('task','c1-a1'),open('task','c1-a2')],2:day2}},{eligible:false,daysCompleted:1,reasons:[{code:'no-task-passed',day:1}]}],
  ['quiz and tasks both open on day 1',{checksByDay:{1:[open('quiz','d1-quiz'),open('task','c1-a1')],2:day2}},{eligible:false,daysCompleted:1,reasons:[{code:'quiz-open',day:1,id:'d1-quiz'},{code:'no-task-passed',day:1}]}],
  ['a day without a quiz counts on one passed task',{checksByDay:{1:[open('task','c1-a1'),pass('task','c1-a2')],2:day2}},{eligible:true,daysCompleted:2,reasons:[]}],
  ['a day without a quiz and no passed task stays open',{checksByDay:{1:[open('task','c1-a1')],2:day2}},{eligible:false,daysCompleted:1,reasons:[{code:'no-task-passed',day:1}]}],
  ['a day without tasks counts on its quiz',{checksByDay:{1:[pass('quiz','d1-quiz')],2:day2}},{eligible:true,daysCompleted:2,reasons:[]}],
  ['a day without tasks and a wrong quiz stays open',{checksByDay:{1:[open('quiz','d1-quiz')],2:day2}},{eligible:false,daysCompleted:1,reasons:[{code:'quiz-open',day:1,id:'d1-quiz'}]}],
  ['a day with only labs has neither quiz nor task and fails closed',{checksByDay:{1:[pass('lab','lab-1')],2:day2}},{eligible:false,daysCompleted:1,reasons:[{code:'day-without-content',day:1}]}],
  ['a day without content fails closed',{days:3},{eligible:false,daysCompleted:2,reasons:[{code:'day-without-content',day:3}]}],
  ['cohort still before its last day',{lastDayStarted:false},{eligible:false,daysCompleted:2,reasons:[{code:'cohort-running'}]}],
  ['facilitator revoked access',{accessRevoked:true},{eligible:false,daysCompleted:2,reasons:[{code:'access-revoked'}]}],
 ];
 for(const [label,override,expected] of table)assert.deepEqual(certificateEligibility({...base,...override}),expected,label);
});

test('memberDayChecks reads AET-103 pass signals: quiz all-correct, graded labs, auto-graded and peer-approved tasks',()=>{
 const member='member-1';
 const progressByDay={3:{quizScore:getDayPack(3).quiz.questions.length,labs:{'lab-a':{source:'server-graded'},'lab-b':{source:'self-reported'}},autograde:{'w3-l1':{source:'auto-graded',passed:true}}}};
 const peerReviewed={id:'e-1',personId:member,day:3,taskId:'w3-proof',status:'accepted',review:{by:'member-2',reviewer:{role:'peer'}}};
 const pendingTask={id:'e-2',personId:member,day:3,taskId:'w3-l2',status:'pending'};
 const otherRoom={id:'room-2',members:[],evidence:[peerReviewed]};
 const checks=memberDayChecks({rooms:[{id:'room-1',members:[],evidence:[pendingTask]},otherRoom],memberId:member,progressByDay,day:3});
 assert.deepEqual(checks.map(check=>[check.kind,check.id,check.passed]),[
  ['quiz','d3-quiz',true],['lab','lab-a',true],['lab','lab-b',false],
  ['task','w3-l1',true],['task','w3-l2',false],['task','w3-l3',false],['task','w3-proof',true],
 ]);
 const oneWrong=memberDayChecks({rooms:[],memberId:member,progressByDay:{3:{quizScore:getDayPack(3).quiz.questions.length-1}},day:3});
 assert.deepEqual(oneWrong.filter(check=>check.kind==='quiz'),[{kind:'quiz',id:'d3-quiz',source:'server-graded',passed:false}]);
});

async function gateway(){
 const dir=mkdtempSync(path.join(os.tmpdir(),'academy-certificate-'));
 const clock={now:START};
 const store=new LocalStore(dir,{now:()=>clock.now});
 const instance=createApp({dir,repository:store,hostKey:'test-host',proofBase:'http://127.0.0.1:9',publicBaseUrl:'http://127.0.0.1:4317',slidesService:{run:async()=>null}});
 Object.assign(instance.proof,{create:async()=>({slug:'certificate-proof',editor:'editor-token'}),state:async()=>({markdown:'# Onze intent\n',marks:{}}),comment:async()=>({ok:true})});
 await new Promise(resolve=>instance.server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${instance.server.address().port}`;
 const call=async(method,route,{body,cookie}={})=>{
  const response=await fetch(base+route,{method,headers:{'content-type':'application/json',...(cookie?{cookie:`academy=${encodeURIComponent(cookie)}`}:{})},body:body?JSON.stringify(body):undefined});
  const text=await response.text();
  let json=null;try{json=JSON.parse(text);}catch{}
  return {status:response.status,body:json,text,csp:response.headers.get('content-security-policy')};
 };
 return {store,clock,call,close:async()=>{await new Promise(resolve=>instance.server.close(resolve));rmSync(dir,{recursive:true,force:true});}};
}

const host=body=>({body:{hostKey:'test-host',...body}});

// Passes a day the way a participant does under the lighter rule: every quick check answer right,
// then evidence for the given day tasks (default: only the first), each approved by someone other
// than the author (alternating facilitator and a peer).
async function completeDay(call,sessions,day,reviewers=['facilitator','bob'],tasks=TASKS[day].slice(0,1)){
 const {facilitator,alice}=sessions;
 assert.equal((await call('POST','/game/control',{cookie:facilitator,body:{action:'day',value:day}})).status,200);
 const {key}=getDayPack(day).quiz;
 const {attemptId}=(await call('POST','/game/quiz/start',{cookie:alice,body:{}})).body;
 assert.equal((await call('POST','/game/quiz',{cookie:alice,body:{attemptId,answers:key}})).body.score,Object.keys(key).length);
 for(const [index,taskId] of tasks.entries()){
  const submitted=await call('POST','/game/evidence',{cookie:alice,body:{requestId:`ev-${taskId}`,taskId,finding:`${taskId} bevinding (synthetisch)`,command:'npm test',observed:'groen',limitation:'alleen lokaal'}});
  assert.equal(submitted.body.taskId,taskId);
  const reviewed=await call('POST','/game/review',{cookie:sessions[reviewers[index%reviewers.length]],body:{requestId:`rv-${taskId}`,id:submitted.body.id,status:'accepted',note:'Klopt.'}});
  assert.equal(reviewed.body.status,'accepted');
 }
}
const TASKS={1:['c1-setup','c1-a1','c1-a2','c1-a3','c1-a4'],2:['c2-a6','c2-a7','c2-a9','c2-a10','c2-a12','c2-a13']};
const reasonKeys=reasons=>reasons.map(reason=>[reason.code,reason.day,reason.id].filter(Boolean).join(':'));

async function wave(call){
 const created=await call('POST','/game/facilitator/cohort/create',host({name:'Wave oktober (synthetisch)',startDate:'2026-10-05',days:2,members:['Alice Jansen','Bob']}));
 const cohortId=created.body.cohort.id,[alice,bob]=created.body.codes;
 const room=await call('POST','/game/create',host({name:'Squad Orion'}));
 await call('POST','/game/facilitator/cohort/attach',host({cohortId,roomId:room.body.roomId}));
 const sessions={};
 const login=async()=>Object.assign(sessions,{
  facilitator:(await call('POST','/game/facilitator/attach',host({roomId:room.body.roomId}))).body.token,
  alice:(await call('POST','/game/cohort/activate',{body:{code:alice.code}})).body.token,
  bob:(await call('POST','/game/cohort/activate',{body:{code:bob.code}})).body.token,
 });
 await login();
 return {cohortId,alice,bob,sessions,login};
}

async function nextDay(clock,login){clock.now=START+1*DAY;await login();}

const rosterOf=async(call)=>(await call('POST','/game/facilitator/cohorts',host({}))).body[0].members;

const mine=(call,cookie)=>call('GET','/game/certificate',{cookie});
const certificateCount=store=>Object.keys(store.data.certificates).length;

test('Mijn certificaat: ineligible members get reasons and no certificate; eligible ones get exactly one, automatically',async()=>{
 const {store,clock,call,close}=await gateway();
 try {
  const {sessions,login}=await wave(call);
  await completeDay(call,sessions,1);
  const early=await mine(call,sessions.alice);
  assert.equal(early.status,200);
  assert.deepEqual({...early.body,reasons:reasonKeys(early.body.reasons)},{cohortName:'Wave oktober (synthetisch)',days:2,eligible:false,daysCompleted:1,reasons:['cohort-running','quiz-open:2:d2-quiz','no-task-passed:2'],status:'not-eligible',id:null,issuedAt:null,revokedAt:null});
  assert.equal(certificateCount(store),0);

  await nextDay(clock,login);
  await completeDay(call,sessions,2,['bob']);
  assert.equal(certificateCount(store),0,'nothing is issued until someone looks');

  const first=await mine(call,sessions.alice);
  assert.equal(first.status,200);
  assert.equal(first.body.status,'issued');
  assert.equal(first.body.eligible,true);
  assert.equal(first.body.daysCompleted,2);
  assert.match(first.body.id,ID);
  assert.equal(first.body.issuedAt,START+1*DAY);
  assert.equal(first.body.certificateUrl,`/certificate/${first.body.id}`);
  assert.equal(first.body.verifyUrl,`http://127.0.0.1:4317/verify/${first.body.id}`);
  const {id}=first.body;
  assert.equal((await store.certificate(id)).issuedBy,null,'no facilitator identity on an automatic certificate');

  for(let i=0;i<3;i++)assert.equal((await mine(call,sessions.alice)).body.id,id);
  const concurrent=await Promise.all([...Array(6)].map(()=>mine(call,sessions.alice)).concat(call('POST','/game/facilitator/cohorts',host({}))));
  assert.deepEqual(concurrent.slice(0,6).map(response=>response.body.id),Array(6).fill(id));
  assert.equal(concurrent[6].body[0].members[0].certificate.id,id);
  assert.equal(certificateCount(store),1);

  const bob=await mine(call,sessions.bob);
  assert.deepEqual([bob.body.status,bob.body.id,bob.body.daysCompleted],['not-eligible',null,0]);
  assert.ok(!bob.text.includes(id),'another member never sees this certificate id');
  assert.ok(!bob.text.includes('Alice'));
  assert.equal((await call('GET',`/certificate/${id}`,{cookie:sessions.bob})).status,404);
  assert.equal((await call('GET',`/certificate/${id.toLowerCase()}`,{cookie:sessions.alice})).status,200);
  assert.deepEqual((await mine(call,sessions.facilitator)).body,{status:'no-cohort'});
  assert.equal((await mine(call)).status,401);
  assert.equal(certificateCount(store),1);
 } finally {await close();}
});

test('facilitator roster issues automatically, shows reasons, keeps revoke, and a revoked certificate is never reissued',async()=>{
 const {store,clock,call,close}=await gateway();
 try {
  const {cohortId,alice,sessions,login}=await wave(call);
  await completeDay(call,sessions,1);
  await nextDay(clock,login);
  await completeDay(call,sessions,2);
  const roster=await rosterOf(call);
  assert.deepEqual(roster.map(member=>[member.name,member.certificate.status,reasonKeys(member.certificate.reasons)]),[
   ['Alice Jansen','issued',[]],
   ['Bob','not-eligible',[1,2].flatMap(day=>[`quiz-open:${day}:d${day}-quiz`,`no-task-passed:${day}`])],
  ]);
  const {id}=roster[0].certificate;
  assert.match(id,ID);
  assert.equal((await call('POST','/game/facilitator/cohort/certificate/issue',host({cohortId,memberId:alice.memberId}))).status,404,'the manual issue route is gone');

  const printable=await call('POST','/game/facilitator/cohort/certificate/view',host({certificateId:id}));
  assert.equal(printable.status,200);
  for(const expected of ['Alice Jansen','Wave oktober (synthetisch)','5 oktober 2026 – 6 oktober 2026','2 van 2','6 oktober 2026',`http://127.0.0.1:4317/verify/${id}`,'verifieerbaar tot en met 4 april 2027'])assert.ok(printable.text.includes(expected),expected);
  const inlineScript=printable.text.match(/<script>(.*?)<\/script>/s)[1];
  assert.ok(printable.csp.includes(`script-src 'sha256-${createHash('sha256').update(inlineScript).digest('base64')}'`),'CSP allows exactly the print script');
  assert.equal((await call('POST','/game/facilitator/cohort/certificate/view',{cookie:sessions.alice,body:{certificateId:id}})).status,403);

  assert.equal((await call('POST','/game/facilitator/cohort/certificate/revoke',{cookie:sessions.alice,body:{cohortId,certificateId:id}})).status,403);
  clock.now=START+3*DAY;await login();
  const revoked=await call('POST','/game/facilitator/cohort/certificate/revoke',host({cohortId,certificateId:id}));
  assert.deepEqual([revoked.body.members[0].certificate.status,revoked.body.members[0].certificate.id,revoked.body.members[0].certificate.eligible,revoked.body.members[0].certificate.revokedAt],['revoked',null,true,START+3*DAY]);
  const after=await mine(call,sessions.alice);
  assert.deepEqual([after.body.status,after.body.id,after.body.certificateUrl],['revoked',null,undefined]);
  assert.equal((await rosterOf(call))[0].certificate.status,'revoked');
  assert.equal(certificateCount(store),1,'revocation is final: no new certificate on later evaluations');
  assert.equal((await call('GET',`/certificate/${id}`,{cookie:sessions.alice})).status,404);
 } finally {await close();}
});

test('public verification confirms only name, cohort and date, and fails for revoked or unknown ids',async()=>{
 const {clock,call,close}=await gateway();
 try {
  const {cohortId,alice,sessions,login}=await wave(call);
  await completeDay(call,sessions,1);
  await nextDay(clock,login);
  await completeDay(call,sessions,2);
  const id=(await mine(call,sessions.alice)).body.id;

  const valid=await call('GET',`/verify/${id}`);
  assert.equal(valid.status,200);
  assert.match(valid.text,/<h1>Alice Jansen<\/h1><p>heeft het Wave-cohort <strong>Wave oktober \(synthetisch\)<\/strong> afgerond\.<\/p><p>Uitgegeven op 6 oktober 2026\.<\/p>/);
  for(const hidden of [alice.memberId,cohortId,'Bob','Squad Orion','2 van 2','5 oktober 2026','bevinding','facilitator'])assert.ok(!valid.text.includes(hidden),`public page leaks ${hidden}`);
  assert.equal((await call('GET',`/verify/${id.replaceAll('-','').toLowerCase()}`)).status,200);

  const unknown=await call('GET','/verify/0000-0000-0000-0000');
  assert.equal(unknown.status,404);
  assert.ok(unknown.text.includes('Geen geldig certificaat gevonden voor deze code.'));
  assert.equal((await call('GET','/verify/not-a-code')).status,404);

  await call('POST','/game/facilitator/cohort/certificate/revoke',host({cohortId,certificateId:id}));
  const revoked=await call('GET',`/verify/${id}`);
  assert.equal(revoked.status,404);
  assert.ok(!revoked.text.includes('Alice'));
  assert.equal(revoked.text,unknown.text);
 } finally {await close();}
});

test('retention deletes certificates with the cohort, so verification stops after the purge date',async()=>{
 const {store,clock,call,close}=await gateway();
 try {
  const {cohortId,alice,sessions,login}=await wave(call);
  await completeDay(call,sessions,1);
  await nextDay(clock,login);
  await completeDay(call,sessions,2);
  const id=(await mine(call,sessions.alice)).body.id;
  clock.now=START+2*DAY+180*DAY-1;
  assert.deepEqual((await store.purgeExpiredCohorts({dryRun:false})).purged,[]);
  assert.equal((await call('GET',`/verify/${id}`)).status,200);
  clock.now=START+2*DAY+180*DAY;
  const dry=await store.purgeExpiredCohorts();
  assert.equal(dry.purged[0].certificates,1);
  assert.equal((await call('GET',`/verify/${id}`)).status,200);
  await store.purgeExpiredCohorts({dryRun:false});
  assert.equal(await store.certificate(id),null);
  assert.equal((await call('GET',`/verify/${id}`)).status,404);
  assert.ok(!JSON.stringify(store.data).includes('Alice Jansen'));
 } finally {await close();}
});
