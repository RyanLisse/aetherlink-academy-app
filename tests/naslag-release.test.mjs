import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';
import {LocalStore} from '../server/local-store.mjs';
import {getDayPack} from '../server/content.mjs';
import {releasedDays,recordReach,courseDays} from '../server/release.mjs';

const DAY=24*60*60*1000;
const START=Date.parse('2026-10-05T00:00:00Z');
const READ_ONLY='Je cohorttoegang is alleen-lezen. Je kunt je werk nog bekijken en exporteren.';
// Synthetic lab declarations: production day packs declare no labs yet.
const LABS={2:[{id:'synthetic-day2-lab',src:'/arcade-lab/?lesson=synthetic-day2-lab&embed=1',title:'Synthetisch lab dag 2'}],6:[{id:'synthetic-day6-lab',src:'/arcade-lab/?lesson=synthetic-day6-lab&embed=1',title:'Synthetisch lab dag 6'}]};

async function gateway(){
 const dir=mkdtempSync(path.join(os.tmpdir(),'academy-naslag-'));
 const clock={now:START};
 const instance=createApp({dir,repository:new LocalStore(dir,{now:()=>clock.now}),hostKey:'test-host',proofBase:'http://127.0.0.1:9',publicBaseUrl:'http://127.0.0.1:4317',slidesService:{run:async()=>null},labsForDay:day=>LABS[day]});
 instance.proof.create=async()=>({slug:'naslag-proof',editor:'editor-token'});
 await new Promise(resolve=>instance.server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${instance.server.address().port}`;
 const call=async(method,route,{body,token}={})=>{
  const response=await fetch(base+route,{method,headers:{'content-type':'application/json',...(token?{cookie:`academy=${token}`}:{})},body:body?JSON.stringify(body):undefined});
  const text=await response.text();
  return {status:response.status,body:text?JSON.parse(text):null};
 };
 const room=instance.store.create('Naslag',{slug:'naslag'});
 const ann=instance.store.join(room.code,'Ann');
 const setDay=async day=>assert.equal((await call('POST','/game/control',{token:room.token,body:{action:'day',value:day}})).status,200);
 return {instance,clock,call,room,ann,setDay,close:async()=>{await new Promise(resolve=>instance.server.close(resolve));rmSync(dir,{recursive:true,force:true});}};
}

test('release table: cumulative up to the furthest day reached, everything after the last day or in read-only',()=>{
 for(let day=1;day<=7;day++)assert.deepEqual(releasedDays({day}),[1,2,3,4,5,6,7].slice(0,day),`room on day ${day}`);
 assert.deepEqual(releasedDays({day:3,reachedDay:5}),[1,2,3,4,5],'stepping back to day 3 keeps day 4 and 5 open');
 assert.deepEqual(releasedDays({day:2,reachedDay:7}),[1,2,3,4,5,6,7],'once the last day was reached everything stays open');
 assert.deepEqual(releasedDays({day:1},{readOnly:true}),[1,2,3,4,5,6,7],'a read-only cohort session reads every day');
 assert.deepEqual(releasedDays({day:1},{readOnly:false}),[1]);
 assert.deepEqual(releasedDays({day:4,reachedDay:99}),[1,2,3,4],'an unknown high-water mark falls back to the live day');

 const course={days:[{day:3},{day:1},{day:5}]};
 assert.deepEqual(courseDays({course}),[3,1,5]);
 assert.deepEqual(releasedDays({day:1,course}),[3,1],'a composed course releases in course order');
 assert.deepEqual(releasedDays({day:5,course}),[3,1,5],'the course’s last day releases all course days');
 assert.deepEqual(releasedDays({day:2,course}),[],'a day outside the course releases nothing');

 const room={day:5};
 recordReach(room);
 room.day=2;recordReach(room);
 assert.equal(room.reachedDay,5,'recordReach never lowers the high-water mark');
});

test('the facilitator moves the live day; the release follows the furthest day and never shrinks',async()=>{
 const g=await gateway();
 try{
  const released=async token=>(await g.call('GET','/game/state',{token})).body;
  assert.deepEqual([(await released(g.ann.token)).released,(await released(g.ann.token)).allReleased],[[1],false]);
  await g.setDay(5);await g.setDay(2);
  const state=await released(g.ann.token);
  assert.deepEqual([state.day,state.released,state.allReleased],[2,[1,2,3,4,5],false]);
  await g.setDay(7);await g.setDay(3);
  const after=await released(g.ann.token);
  assert.deepEqual([after.day,after.released,after.allReleased],[3,[1,2,3,4,5,6,7],true]);

  const control=await g.call('POST','/game/control',{token:g.ann.token,body:{action:'day',value:1}});
  assert.deepEqual([control.status,control.body.error],[403,'Alleen de facilitator bedient de ronde.']);
  assert.equal((await released(g.ann.token)).day,3,'a participant cannot move the room');
 }finally{await g.close();}
});

test('a participant opens day 2 while the room is on day 5; unreleased and unknown days are refused',async()=>{
 const g=await gateway();
 try{
  await g.setDay(5);
  const pack=await g.call('GET','/game/day-pack?day=2',{token:g.ann.token});
  assert.equal(pack.status,200);
  assert.deepEqual([pack.body.day,pack.body.title,pack.body.deck.route],[2,'Classroom 2 · Herbruikbare workflows','/classroom/2']);
  assert.deepEqual(Object.keys(pack.body.quiz),['questions'],'the practice pack carries no answer key');
  assert.equal((await g.call('GET','/game/day-pack',{token:g.ann.token})).body.day,5,'without ?day the live day is served');
  assert.equal((await g.call('GET','/game/state',{token:g.ann.token})).body.day,5,'reading day 2 does not move the room');

  const locked=await g.call('GET','/game/day-pack?day=6',{token:g.ann.token});
  assert.deepEqual([locked.status,locked.body.error],[403,'Dag 6 is nog niet vrijgegeven.']);
  const unknown=await g.call('GET','/game/day-pack?day=9',{token:g.ann.token});
  assert.deepEqual([unknown.status,unknown.body.error],[404,'Geen contentpakket voor dag 9.']);
  assert.equal((await g.call('GET','/game/day-pack?day=abc',{token:g.ann.token})).status,404);
  assert.equal((await g.call('GET','/game/knowledge?day=6',{token:g.ann.token})).status,403);
  assert.equal((await g.call('GET','/game/knowledge?day=2',{token:g.ann.token})).body.mission.id,getDayPack(2).mission.id);

  const facilitatorPreview=await g.call('GET','/game/day-pack?day=7',{token:g.room.token});
  assert.deepEqual([facilitatorPreview.status,facilitatorPreview.body.day],[200,7],'the facilitator previews any day');

  const route=await g.call('GET','/game/day-route',{token:g.ann.token});
  assert.deepEqual(route.body.released,[1,2,3,4,5]);
  assert.deepEqual(route.body.days.map(day=>day.released),[true,true,true,true,true,false,false]);
 }finally{await g.close();}
});

test('quiz practice on an earlier day records on that day and leaves the live route alone',async()=>{
 const g=await gateway();
 try{
  await g.setDay(5);
  const key=getDayPack(2).quiz.key;
  const start=await g.call('POST','/game/quiz/start',{token:g.ann.token,body:{day:2}});
  assert.deepEqual([start.status,start.body.day],[200,2]);
  const result=await g.call('POST','/game/quiz',{token:g.ann.token,body:{day:2,attemptId:start.body.attemptId,answers:key}});
  assert.deepEqual([result.status,result.body.day,result.body.score,result.body.route],[200,2,3,'stretch']);
  const me=(await g.call('GET','/game/state',{token:g.ann.token})).body.me;
  assert.deepEqual(me.progressByDay['2'],{quizScore:3,route:'stretch',quizAt:me.progressByDay['2'].quizAt});
  assert.deepEqual([me.route,me.quiz],['standard',null],'the live day’s help route and quiz badge are untouched');

  const retake=await g.call('POST','/game/quiz/start',{token:g.ann.token,body:{day:2}});
  const wrong=Object.fromEntries(Object.keys(key).map(id=>[id,key[id]==='a'?'b':'a']));
  assert.equal((await g.call('POST','/game/quiz',{token:g.ann.token,body:{day:2,attemptId:retake.body.attemptId,answers:wrong}})).body.score,0);
  assert.equal((await g.call('GET','/game/state',{token:g.ann.token})).body.me.progressByDay['2'].quizScore,0,'a retake replaces the day’s score');

  const locked=await g.call('POST','/game/quiz/start',{token:g.ann.token,body:{day:6}});
  assert.deepEqual([locked.status,locked.body.error],[403,'Dag 6 is nog niet vrijgegeven.']);

  const live=await g.call('POST','/game/quiz/start',{token:g.ann.token,body:{}});
  const liveKey=getDayPack(5).quiz.key;
  const liveResult=await g.call('POST','/game/quiz',{token:g.ann.token,body:{attemptId:live.body.attemptId,answers:liveKey}});
  assert.deepEqual([liveResult.body.day,liveResult.body.route],[5,'stretch']);
  const afterLive=(await g.call('GET','/game/state',{token:g.ann.token})).body.me;
  assert.deepEqual([afterLive.route,afterLive.quiz.day,afterLive.quiz.score],['stretch',5,3]);
 }finally{await g.close();}
});

test('a lab from an earlier released day records on its own day; a locked day’s lab is refused',async()=>{
 const g=await gateway();
 try{
  await g.setDay(5);
  const done=await g.call('POST','/game/lab-complete',{token:g.ann.token,body:{labId:'synthetic-day2-lab',result:{outcome:'completed'},evidence:'synthetisch'}});
  assert.deepEqual([done.status,done.body.day,done.body.recorded],[200,2,true]);
  const me=(await g.call('GET','/game/state',{token:g.ann.token})).body.me;
  assert.equal(me.progressByDay['2'].labs['synthetic-day2-lab'].source,'lab-reported');
  assert.equal(me.progressByDay['5'],undefined,'the live day has no lab record');
  const locked=await g.call('POST','/game/lab-complete',{token:g.ann.token,body:{labId:'synthetic-day6-lab',result:{outcome:'completed'}}});
  assert.deepEqual([locked.status,locked.body.error],[404,'Lab synthetic-day6-lab hoort niet bij een vrijgegeven dag.']);
 }finally{await g.close();}
});

test('naslag search and the FAQ reach earlier released days and nothing later',async()=>{
 const g=await gateway();
 try{
  await g.setDay(2);
  const early=await g.call('GET','/game/naslag/search?q='+encodeURIComponent('credential nodig voor L1'),{token:g.ann.token});
  assert.deepEqual([early.body.released,early.body.hits.filter(hit=>hit.id.startsWith('d3:'))],[[1,2],[]]);
  await g.setDay(5);
  const later=await g.call('GET','/game/naslag/search?q='+encodeURIComponent('credential nodig voor L1'),{token:g.ann.token});
  assert.equal(later.body.hits[0].id,'d3:step:w3-l1');
  const chat=await g.call('POST','/game/chat',{token:g.ann.token,body:{q:'Heb ik een credential nodig voor L1?'}});
  assert.deepEqual([chat.body.day,chat.body.hits[0].id],[5,'d3:step:w3-l1']);
  assert.deepEqual((await g.call('GET','/game/naslag/search?q='+encodeURIComponent('credential nodig voor L1'),{token:g.ann.token})).body.hits.filter(hit=>/^d[67]:/.test(hit.id)),[]);
 }finally{await g.close();}
});

test('a read-only cohort session reads every day in the naslag but cannot write',async()=>{
 const g=await gateway();
 try{
  const created=await g.call('POST','/game/facilitator/cohort/create',{body:{hostKey:'test-host',name:'Wave (synthetisch)',startDate:'2026-10-05',days:7,members:['Alice']}});
  const room=await g.call('POST','/game/create',{body:{hostKey:'test-host',name:'Cohortkamer'}});
  await g.call('POST','/game/facilitator/cohort/attach',{body:{hostKey:'test-host',cohortId:created.body.cohort.id,roomId:room.body.roomId}});
  g.clock.now=START+91*DAY;
  const activated=await g.call('POST','/game/cohort/activate',{body:{code:created.body.codes[0].code}});
  assert.equal(activated.body.readOnly,true);
  const token=activated.body.token;
  const state=(await g.call('GET','/game/state',{token})).body;
  assert.deepEqual([state.day,state.readOnly,state.released,state.allReleased,Boolean(state.me.cohortMemberId)],[1,true,[1,2,3,4,5,6,7],true,true]);
  const pack=await g.call('GET','/game/day-pack?day=7',{token});
  assert.deepEqual([pack.status,pack.body.day],[200,7]);
  assert.equal((await g.call('GET','/game/day-route',{token})).body.days.every(day=>day.released),true);
  assert.equal((await g.call('GET','/game/naslag/search?q=credential',{token})).status,200);
  assert.equal((await g.call('POST','/game/screen-state',{token,body:{tabId:'8b0e7a52-8a4c-4c1e-9d59-0f3b2a1c4d5e',view:'naslag',day:6}})).status,204);
  for(const [route,body] of [['/game/quiz/start',{day:2}],['/game/quiz',{day:2,attemptId:'x',answers:{}}],['/game/lab-complete',{labId:'synthetic-day2-lab',result:{outcome:'completed'}}],['/game/reflection',{learned:'a',next:'b'}]]){
   const result=await g.call('POST',route,{token,body});
   assert.deepEqual([route,result.status,result.body.error],[route,403,READ_ONLY]);
  }
 }finally{await g.close();}
});
