import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';
import {LocalStore} from '../server/local-store.mjs';

const DAY=24*60*60*1000;
const START=Date.parse('2026-10-05T00:00:00Z');

async function gateway(){
 const dir=mkdtempSync(path.join(os.tmpdir(),'academy-cohort-routes-'));
 const clock={now:START};
 const instance=createApp({dir,repository:new LocalStore(dir,{now:()=>clock.now}),hostKey:'test-host',proofBase:'http://127.0.0.1:9',publicBaseUrl:'http://127.0.0.1:4317',slidesService:{run:async()=>null}});
 instance.proof.create=async()=>({slug:'cohort-proof',editor:'editor-token'});
 await new Promise(resolve=>instance.server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${instance.server.address().port}`;
 const call=async(method,route,{body,cookie}={})=>{
  const response=await fetch(base+route,{method,headers:{'content-type':'application/json',...(cookie?{cookie:`academy=${encodeURIComponent(cookie)}`}:{})},body:body?JSON.stringify(body):undefined});
  const text=await response.text();
  let json=null;try{json=JSON.parse(text);}catch{}
  return {status:response.status,body:json,setCookie:response.headers.get('set-cookie')};
 };
 return {clock,call,close:async()=>{await new Promise(resolve=>instance.server.close(resolve));rmSync(dir,{recursive:true,force:true});}};
}

test('facilitator creates a Wave cohort, participant activates a personal code into the cohort room',async()=>{
 const {clock,call,close}=await gateway();
 try {
  assert.equal((await call('POST','/game/facilitator/cohort/create',{body:{name:'Wave oktober (synthetisch)',startDate:'2026-10-05',days:5,members:['Alice']}})).status,403);
  assert.equal((await call('POST','/game/facilitator/cohort/create',{body:{hostKey:'test-host',name:'Wave',startDate:'2026-02-30',days:5}})).status,400);
  const created=await call('POST','/game/facilitator/cohort/create',{body:{hostKey:'test-host',name:'Wave oktober (synthetisch)',startDate:'2026-10-05',days:5,members:['Alice','Bob']}});
  assert.equal(created.status,201);
  assert.deepEqual(created.body.codes.map(entry=>entry.name),['Alice','Bob']);
  assert.equal(created.body.cohort.startsAt,START);
  const alice=created.body.codes[0];
  const room=await call('POST','/game/create',{body:{hostKey:'test-host',name:'Squad Orion'}});
  assert.equal((await call('POST','/game/facilitator/cohort/attach',{body:{hostKey:'test-host',cohortId:created.body.cohort.id,roomId:'not-a-uuid'}})).status,400);
  const attached=await call('POST','/game/facilitator/cohort/attach',{body:{hostKey:'test-host',cohortId:created.body.cohort.id,roomId:room.body.roomId}});
  assert.equal(attached.body.currentRoomId,room.body.roomId);

  const activated=await call('POST','/game/cohort/activate',{body:{code:alice.code.toLowerCase()}});
  assert.equal(activated.status,200);
  assert.equal(activated.body.roomId,room.body.roomId);
  assert.match(activated.setCookie,/^academy=[a-f0-9]{64}; Path=\/; HttpOnly; SameSite=Strict$/);
  const session=activated.body.token;
  const state=await call('GET','/game/state',{cookie:session});
  assert.equal(state.body.me.name,'Alice');
  assert.equal(state.body.readOnly,false);
  assert.equal(state.body.code,null);
  const roomJoin=await call('POST','/game/join',{body:{code:room.body.code,name:'Mallory'}});
  assert.equal(roomJoin.status,403);
  assert.match(roomJoin.body.error,/persoonlijke cohortcode/);
  assert.deepEqual((await call('POST','/game/help',{cookie:session,body:{}})).body,{help:true});
  assert.equal((await call('POST','/game/participant/access',{cookie:session,body:{}})).status,409);
  assert.equal((await call('PUT','/api/documents/cohort-proof',{cookie:session,body:{markdown:'# x'}})).status,502);

  const roster=await call('POST','/game/facilitator/cohorts',{body:{hostKey:'test-host'}});
  assert.deepEqual(roster.body[0].members.map(member=>[member.name,member.status,member.seated]),[['Alice','activated',true],['Bob','issued',false]]);
  const revoked=await call('POST','/game/facilitator/cohort/revoke',{body:{hostKey:'test-host',cohortId:created.body.cohort.id,memberId:alice.memberId}});
  assert.equal(revoked.body.members[0].status,'revoked');
  assert.equal((await call('GET','/game/state',{cookie:session})).status,401);
  assert.equal((await call('POST','/game/cohort/activate',{body:{code:alice.code}})).status,401);

  const reissued=await call('POST','/game/facilitator/cohort/reissue',{body:{hostKey:'test-host',cohortId:created.body.cohort.id,memberId:alice.memberId}});
  clock.now=START+91*DAY;
  const readOnly=await call('POST','/game/cohort/activate',{body:{code:reissued.body.code}});
  assert.equal(readOnly.body.readOnly,true);
  const readSession=readOnly.body.token;
  const readState=await call('GET','/game/state',{cookie:readSession});
  assert.equal(readState.status,200);
  assert.equal(readState.body.readOnly,true);
  const blocked=await call('POST','/game/help',{cookie:readSession,body:{}});
  assert.equal(blocked.status,403);
  assert.match(blocked.body.error,/alleen-lezen/);
  assert.equal((await call('POST','/GAME/Help/',{cookie:readSession,body:{}})).status,403);
  assert.equal((await call('POST','/GAME/mcp-token',{cookie:readSession,body:{}})).status,403);
  assert.equal((await call('POST','/game/reflection',{cookie:readSession,body:{learned:'a',next:'b'}})).status,403);
  assert.equal((await call('PUT','/api/documents/cohort-proof',{cookie:readSession,body:{markdown:'# x'}})).status,403);
  assert.equal((await call('POST','/game/logout',{cookie:readSession,body:{}})).status,200);
  clock.now=START+104*DAY;
  assert.equal((await call('POST','/game/cohort/activate',{body:{code:reissued.body.code}})).status,403);
 } finally {await close();}
});
