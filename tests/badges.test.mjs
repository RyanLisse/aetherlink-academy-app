import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {memberBadges,dayCompleteBadges,arcadeStopBadges,proofMilestoneBadges} from '../server/badges.mjs';
import {createApp} from '../server/app.mjs';
import {LocalStore} from '../server/local-store.mjs';
import {getDayPack} from '../server/content.mjs';

test('day-complete · arcade-stop · proof-milestone badges wire to existing signals',()=>{
 const memberId='m1';
 const progressByDay={
  1:{quizScore:getDayPack(1).quiz.questions.length,quizAt:'2026-10-05T10:00:00.000Z',labStops:{'ws-1-eve-weather':{goal:{stopId:'goal',passed:true,at:'2026-10-05T11:00:00.000Z',source:'server-graded',attempts:1}}}},
 };
 const rooms=[{id:'r1',members:[{id:memberId,progressByDay}],evidence:[
  {id:'e1',personId:memberId,day:1,taskId:'c1-a1',status:'accepted',at:'2026-10-05T12:00:00.000Z',review:{by:'peer',reviewer:{role:'peer'}}},
 ]}];
 const days=dayCompleteBadges({rooms,memberId,progressByDay,days:1});
 assert.deepEqual(days.map(b=>b.id),['day-complete:1']);
 const arcade=arcadeStopBadges(progressByDay);
 assert.deepEqual(arcade.map(b=>[b.type,b.labId,b.stopId]),[['arcade-stop','ws-1-eve-weather','goal']]);
 const proof=proofMilestoneBadges({rooms,memberId,days:1});
 assert.ok(proof.some(b=>b.taskId==='c1-a1'&&b.type==='proof-milestone'));
 const all=memberBadges({rooms,memberId,progressByDay,days:1});
 assert.ok(all.some(b=>b.type==='day-complete'));
 assert.ok(all.some(b=>b.type==='arcade-stop'));
 assert.ok(all.some(b=>b.type==='proof-milestone'));
});

test('GET /game/badges returns learner earnables; facilitator roster includes badges',async()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'academy-badges-'));
 const store=new LocalStore(dir);
 const instance=createApp({dir,repository:store,hostKey:'test-host',proofBase:'http://127.0.0.1:9',publicBaseUrl:'http://127.0.0.1:4317',slidesService:{run:async()=>null}});
 Object.assign(instance.proof,{create:async()=>({slug:'badge-proof',editor:'editor-token'}),state:async()=>({markdown:'# Intent\n',marks:{}}),comment:async()=>({ok:true})});
 await new Promise(resolve=>instance.server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${instance.server.address().port}`;
 const call=async(method,route,{body,cookie}={})=>{
  const response=await fetch(base+route,{method,headers:{'content-type':'application/json',...(cookie?{cookie:`academy=${encodeURIComponent(cookie)}`}:{})},body:body?JSON.stringify(body):undefined});
  const text=await response.text();
  let json=null;try{json=JSON.parse(text);}catch{}
  return {status:response.status,body:json,text};
 };
 try{
  const room=await call('POST','/game/create',{body:{hostKey:'test-host',name:'Squad Badge'}});
  const joined=await call('POST','/game/join',{body:{code:room.body.code,name:'Ada'}});
  const cookie=joined.body.token;
  const empty=await call('GET','/game/badges',{cookie});
  assert.equal(empty.status,200);
  assert.deepEqual(empty.body.badges,[]);
  await store.withSession(cookie,'browser',({r,p})=>{
   p.progressByDay={'1':{
    quizScore:getDayPack(1).quiz.questions.length,
    quizAt:'2026-10-05T10:00:00.000Z',
    labStops:{'ws-1-eve-weather':{'stop-a':{stopId:'stop-a',passed:true,at:'2026-10-05T11:00:00.000Z',source:'server-graded',attempts:1}}},
   }};
   r.evidence.push({id:'ev-1',personId:p.id,name:p.name,day:1,taskId:'c1-a1',status:'accepted',at:'2026-10-05T12:00:00.000Z',review:{by:'facilitator',reviewer:{role:'facilitator'},note:'ok'}});
  });
  const earned=await call('GET','/game/badges',{cookie});
  assert.equal(earned.status,200);
  const types=earned.body.badges.map(b=>b.type).sort();
  assert.deepEqual(types,['arcade-stop','day-complete','proof-milestone']);
 } finally {
  await new Promise(resolve=>instance.server.close(resolve));
  rmSync(dir,{recursive:true,force:true});
 }
});
