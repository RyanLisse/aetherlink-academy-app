import test from 'node:test';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';
import {LocalStore} from '../server/local-store.mjs';
import {certificateEligibility} from '../server/certificate.mjs';
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
  ['evidence day given as a string',{evidence:[accepted('1'),accepted('2')]},{eligible:true,daysCompleted:2,reasons:[]}],
  ['cohort still before its last day',{lastDayStarted:false},{eligible:false,daysCompleted:2,reasons:[{code:'cohort-running'}]}],
  ['facilitator revoked access',{accessRevoked:true},{eligible:false,daysCompleted:2,reasons:[{code:'access-revoked'}]}],
  ['day 6 has no quiz pack but no evidence can be recorded either',{days:6,progressByDay:{1:quiz,2:quiz,3:quiz,4:quiz,5:quiz},evidence:[1,2,3,4,5].map(accepted)},{eligible:false,daysCompleted:5,reasons:[{code:'evidence-missing',day:6}]}],
  ['nothing recorded',{progressByDay:{},evidence:[]},{eligible:false,daysCompleted:0,reasons:[{code:'quiz-missing',day:1},{code:'evidence-missing',day:1},{code:'quiz-missing',day:2},{code:'evidence-missing',day:2}]}],
 ];
 for(const [label,override,expected] of table)assert.deepEqual(certificateEligibility({...base,...override}),expected,label);
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

async function completeDay(call,sessions,day){
 const {facilitator,alice}=sessions;
 assert.equal((await call('POST','/game/control',{cookie:facilitator,body:{action:'day',value:day}})).status,200);
 const answers=getDayPack(day).quiz.answers;
 assert.equal((await call('POST','/game/quiz',{cookie:alice,body:{answers}})).body.score,answers.length);
 const submitted=await call('POST','/game/evidence',{cookie:alice,body:{requestId:`ev-${day}`,finding:`Dag ${day} bevinding (synthetisch)`,command:'npm test',observed:'groen',limitation:'alleen lokaal'}});
 assert.equal(submitted.body.day,day);
 const reviewed=await call('POST','/game/review',{cookie:facilitator,body:{requestId:`rv-${day}`,id:submitted.body.id,status:'accepted',note:'Klopt.'}});
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

test('facilitator sees eligibility with reasons, issues behind the gate, and revokes',async()=>{
 const {clock,call,close}=await gateway();
 try {
  const {cohortId,alice,bob,sessions,login}=await wave(call);
  await completeDay(call,sessions,1);
  const early=await rosterOf(call);
  assert.deepEqual(early.map(member=>[member.name,member.certificate.eligible,member.certificate.reasons]),[
   ['Alice Jansen',false,[{code:'cohort-running'},{code:'quiz-missing',day:2},{code:'evidence-missing',day:2}]],
   ['Bob',false,[{code:'cohort-running'},{code:'quiz-missing',day:1},{code:'evidence-missing',day:1},{code:'quiz-missing',day:2},{code:'evidence-missing',day:2}]],
  ]);
  await nextDay(clock,login);
  await completeDay(call,sessions,2);
  const blocked=await call('POST','/game/facilitator/cohort/certificate/issue',host({cohortId,memberId:bob.memberId}));
  assert.equal(blocked.status,409);
  assert.equal(blocked.body.error,'Nog geen certificaat mogelijk: Dag 1: quiz niet gemaakt; Dag 1: geen bewijs ingediend; Dag 2: quiz niet gemaakt; Dag 2: geen bewijs ingediend.');

  const asParticipant=await call('POST','/game/facilitator/cohort/certificate/issue',{cookie:sessions.alice,body:{cohortId,memberId:alice.memberId}});
  assert.equal(asParticipant.status,403);
  assert.equal((await rosterOf(call))[0].certificate.id,null);

  const issued=await call('POST','/game/facilitator/cohort/certificate/issue',host({cohortId,memberId:alice.memberId}));
  assert.equal(issued.status,200);
  const certificate=issued.body.members[0].certificate;
  assert.equal(certificate.eligible,true);
  assert.equal(certificate.daysCompleted,2);
  assert.match(certificate.id,ID);
  assert.equal(certificate.issuedAt,START+1*DAY);
  const again=await call('POST','/game/facilitator/cohort/certificate/issue',host({cohortId,memberId:alice.memberId}));
  assert.equal(again.body.members[0].certificate.id,certificate.id);

  const printable=await call('POST','/game/facilitator/cohort/certificate/view',host({certificateId:certificate.id}));
  assert.equal(printable.status,200);
  for(const expected of ['Alice Jansen','Wave oktober (synthetisch)','5 oktober 2026 – 6 oktober 2026','2 van 2','6 oktober 2026',`http://127.0.0.1:4317/verify/${certificate.id}`,'verifieerbaar tot en met 4 april 2027'])assert.ok(printable.text.includes(expected),expected);
  const inlineScript=printable.text.match(/<script>(.*?)<\/script>/s)[1];
  assert.ok(printable.csp.includes(`script-src 'sha256-${createHash('sha256').update(inlineScript).digest('base64')}'`),'CSP allows exactly the print script');
  assert.equal((await call('POST','/game/facilitator/cohort/certificate/view',{cookie:sessions.alice,body:{certificateId:certificate.id}})).status,403);
  const own=await call('GET',`/certificate/${certificate.id.toLowerCase()}`,{cookie:sessions.alice});
  assert.equal(own.status,200);
  assert.ok(own.text.includes('Alice Jansen'));
  assert.equal((await call('GET',`/certificate/${certificate.id}`,{cookie:sessions.bob})).status,404);
  assert.equal((await call('GET',`/certificate/${certificate.id}`)).status,401);

  const revokeAsParticipant=await call('POST','/game/facilitator/cohort/certificate/revoke',{cookie:sessions.alice,body:{cohortId,certificateId:certificate.id}});
  assert.equal(revokeAsParticipant.status,403);
  const revoked=await call('POST','/game/facilitator/cohort/certificate/revoke',host({cohortId,certificateId:certificate.id}));
  assert.equal(revoked.body.members[0].certificate.id,null);
  assert.equal(revoked.body.members[0].certificate.eligible,true);
  assert.equal((await call('GET',`/certificate/${certificate.id}`,{cookie:sessions.alice})).status,404);
  const reissued=await call('POST','/game/facilitator/cohort/certificate/issue',host({cohortId,memberId:alice.memberId}));
  assert.notEqual(reissued.body.members[0].certificate.id,certificate.id);
 } finally {await close();}
});

test('public verification confirms only name, cohort and date, and fails for revoked or unknown ids',async()=>{
 const {clock,call,close}=await gateway();
 try {
  const {cohortId,alice,sessions,login}=await wave(call);
  await completeDay(call,sessions,1);
  await nextDay(clock,login);
  await completeDay(call,sessions,2);
  const id=(await call('POST','/game/facilitator/cohort/certificate/issue',host({cohortId,memberId:alice.memberId}))).body.members[0].certificate.id;

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
  const id=(await call('POST','/game/facilitator/cohort/certificate/issue',host({cohortId,memberId:alice.memberId}))).body.members[0].certificate.id;
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
