import test from 'node:test';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';
import {LocalStore} from '../server/local-store.mjs';
import {certificateEligibility,taskPassed} from '../server/certificate.mjs';
import {getDayPack} from '../server/content.mjs';

const DAY=24*60*60*1000;
const START=Date.parse('2026-10-05T00:00:00Z');
const ID=/^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;

const quiz={quizScore:2};
const accepted=day=>({day,status:'accepted'});
const pending=day=>({day,status:'pending'});
const base={days:2,progressByDay:{1:quiz,2:quiz},evidence:[accepted(1),accepted(2)],accessRevoked:false,lastDayStarted:true};

test('completion rule: every cohort day needs its quiz and accepted evidence',()=>{
 const table=[
  ['all days complete',{},{eligible:true,daysCompleted:2,reasons:[]}],
  ['quiz of day 2 missing',{progressByDay:{1:quiz}},{eligible:false,daysCompleted:1,reasons:[{code:'quiz-missing',day:2}]}],
  ['quiz score 0 still counts as done',{progressByDay:{1:{quizScore:0},2:quiz}},{eligible:true,daysCompleted:2,reasons:[]}],
  ['no evidence on day 1',{evidence:[accepted(2)]},{eligible:false,daysCompleted:1,reasons:[{code:'evidence-missing',day:1}]}],
  ['evidence on day 2 not yet accepted',{evidence:[accepted(1),pending(2),{day:2,status:'needs-work'}]},{eligible:false,daysCompleted:1,reasons:[{code:'evidence-not-accepted',day:2}]}],
  ['acceptance by a peer reviewer counts like the facilitator\'s',{evidence:[{day:1,status:'accepted',review:{by:'peer-member-id'}},{day:2,status:'accepted',review:{by:'facilitator'}}]},{eligible:true,daysCompleted:2,reasons:[]}],
  ['evidence day given as a string',{evidence:[accepted('1'),accepted('2')]},{eligible:true,daysCompleted:2,reasons:[]}],
  ['cohort still before its last day',{lastDayStarted:false},{eligible:false,daysCompleted:2,reasons:[{code:'cohort-running'}]}],
  ['facilitator revoked access',{accessRevoked:true},{eligible:false,daysCompleted:2,reasons:[{code:'access-revoked'}]}],
  ['day 6 has no quiz pack but no evidence can be recorded either',{days:6,progressByDay:{1:quiz,2:quiz,3:quiz,4:quiz,5:quiz},evidence:[1,2,3,4,5].map(accepted)},{eligible:false,daysCompleted:5,reasons:[{code:'evidence-missing',day:6}]}],
  ['nothing recorded',{progressByDay:{},evidence:[]},{eligible:false,daysCompleted:0,reasons:[{code:'quiz-missing',day:1},{code:'evidence-missing',day:1},{code:'quiz-missing',day:2},{code:'evidence-missing',day:2}]}],
 ];
 for(const [label,override,expected] of table)assert.deepEqual(certificateEligibility({...base,...override}),expected,label);
});

test('taskPassed is the single pass predicate: accepted passes, pending and needs-work do not',()=>{
 assert.deepEqual([{status:'accepted'},{status:'pending'},{status:'needs-work'}].map(taskPassed),[true,false,false]);
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

async function completeDay(call,sessions,day,reviewer='facilitator'){
 const {facilitator,alice}=sessions;
 assert.equal((await call('POST','/game/control',{cookie:facilitator,body:{action:'day',value:day}})).status,200);
 const answers=getDayPack(day).quiz.answers;
 assert.equal((await call('POST','/game/quiz',{cookie:alice,body:{answers}})).body.score,answers.length);
 const submitted=await call('POST','/game/evidence',{cookie:alice,body:{requestId:`ev-${day}`,finding:`Dag ${day} bevinding (synthetisch)`,command:'npm test',observed:'groen',limitation:'alleen lokaal'}});
 assert.equal(submitted.body.day,day);
 const reviewed=await call('POST','/game/review',{cookie:sessions[reviewer],body:{requestId:`rv-${day}`,id:submitted.body.id,status:'accepted',note:'Klopt.'}});
 assert.equal(reviewed.body.status,'accepted');
}

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
  assert.deepEqual(early.body,{cohortName:'Wave oktober (synthetisch)',days:2,eligible:false,daysCompleted:1,reasons:[{code:'cohort-running'},{code:'quiz-missing',day:2},{code:'evidence-missing',day:2}],status:'not-eligible',id:null,issuedAt:null,revokedAt:null});
  assert.equal(certificateCount(store),0);

  await nextDay(clock,login);
  assert.equal((await call('POST','/game/control',{cookie:sessions.facilitator,body:{action:'shuffle'}})).status,200);
  await completeDay(call,sessions,2,'bob');
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
  assert.deepEqual(roster.map(member=>[member.name,member.certificate.status,member.certificate.reasons]),[
   ['Alice Jansen','issued',[]],
   ['Bob','not-eligible',[{code:'quiz-missing',day:1},{code:'evidence-missing',day:1},{code:'quiz-missing',day:2},{code:'evidence-missing',day:2}]],
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
