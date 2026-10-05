import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, readFileSync, rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createApp} from '../server/app.mjs';
import {LocalStore} from '../server/local-store.mjs';

const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const START=Date.parse('2026-10-05T08:00:00Z');

async function gateway({files}={}){
 const dir=mkdtempSync(path.join(os.tmpdir(),'academy-facilitator-delete-'));
 const store=new LocalStore(dir,{now:()=>START});
 const fileStorageService=files||{configured:false,run:async()=>{throw Object.assign(new Error('off'),{status:503});}};
 const instance=createApp({dir,repository:store,hostKey:'test-host',publicBaseUrl:'http://127.0.0.1:4317',slidesService:{run:async()=>null},fileStorageService});
 await new Promise(resolve=>instance.server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${instance.server.address().port}`;
 const call=async(route,body={},cookies={})=>{
  const cookie=Object.entries(cookies).map(([name,value])=>`${name}=${encodeURIComponent(value)}`).join('; ');
  const response=await fetch(base+route,{method:'POST',headers:{'content-type':'application/json',...(cookie?{cookie}:{})},body:JSON.stringify(body)});
  const text=await response.text();let json=null;try{json=JSON.parse(text);}catch{}
  return {status:response.status,body:json};
 };
 const get=async(route,cookies={})=>{
  const cookie=Object.entries(cookies).map(([name,value])=>`${name}=${encodeURIComponent(value)}`).join('; ');
  const response=await fetch(base+route,{headers:cookie?{cookie}:{}});
  return {status:response.status};
 };
 return {store,call,get,close:async()=>{await new Promise(resolve=>instance.server.close(resolve));rmSync(dir,{recursive:true,force:true});}};
}

const host={hostKey:'test-host'};

test('non-facilitators cannot delete squads or cohorts',async()=>{
 const {call,close}=await gateway();
 try{
  const room=(await call('/game/create',{...host,name:'Squad Orion'})).body;
  const cohort=(await call('/game/facilitator/cohort/create',{...host,name:'Wave test',startDate:'2026-10-05',days:5,members:['Alice']})).body.cohort;
  const participant=(await call('/game/join',{code:room.code,name:'Mallory'})).body.token;
  for(const [route,body] of [['/game/facilitator/room/delete',{roomId:room.roomId}],['/game/facilitator/cohort/delete',{cohortId:cohort.id}]]){
   assert.equal((await call(route,body)).status,403,`${route} without key`);
   assert.equal((await call(route,{...body,hostKey:'wrong'})).status,403,`${route} wrong key`);
   assert.equal((await call(route,body,{academy:participant})).status,403,`${route} participant session`);
   assert.equal((await call(route,body,{academy:room.token})).status,403,`${route} in-room facilitator session is not the facilitator login`);
   assert.equal((await call(route,body,{'academy-facilitator':'forged'})).status,403,`${route} forged facilitator cookie`);
  }
  const overview=(await call('/game/facilitator/overview',host)).body;
  assert.deepEqual(overview.map(squad=>squad.id),[room.roomId]);
  assert.deepEqual((await call('/game/facilitator/cohorts',host)).body.map(entry=>entry.id),[cohort.id]);
 }finally{await close();}
});

test('facilitator (host key) deletes a squad; its sessions and links stop working',async()=>{
 const {call,get,close}=await gateway();
 try{
  const keep=(await call('/game/create',{...host,name:'Keep'})).body;
  const room=(await call('/game/create',{...host,name:'Delete me'})).body;
  const participant=(await call('/game/join',{code:room.code,name:'Bob'})).body;
  assert.equal((await get('/game/state',{academy:participant.token})).status,200);
  assert.equal((await call('/game/facilitator/room/delete',{...host,roomId:'not-a-uuid'})).status,400);
  const deleted=await call('/game/facilitator/room/delete',{...host,roomId:room.roomId});
  assert.equal(deleted.status,200);
  assert.deepEqual(deleted.body,{deleted:true,roomId:room.roomId,members:1,files:0});
  assert.deepEqual((await call('/game/facilitator/overview',host)).body.map(squad=>squad.id),[keep.roomId]);
  assert.equal((await get('/game/state',{academy:participant.token})).status,401);
  assert.equal((await get('/game/state',{academy:room.token})).status,401);
  assert.equal((await call('/game/participant/resume',{resumeToken:participant.resumeToken})).status,401);
  assert.equal((await call('/game/join',{code:room.code,name:'Carol'})).status,404);
  assert.equal((await call('/game/facilitator/room/delete',{...host,roomId:room.roomId})).status,404);
 }finally{await close();}
});

test('facilitator (Google SSO cookie) deletes a cohort: codes revoked, seats anonymized, room detached',async()=>{
 const {store,call,get,close}=await gateway();
 try{
  const sso=await store.facilitatorLogin({sub:'s',email:'f@example.test',name:'Fac',domain:'example.test'});
  const facilitator={'academy-facilitator':sso};
  const room=(await call('/game/create',{...host,name:'Wave room'})).body;
  const created=(await call('/game/facilitator/cohort/create',{name:'AET softlive Wave',startDate:'2026-10-05',days:5,members:['Alice','Bob']},facilitator)).body;
  assert.equal((await call('/game/facilitator/cohort/attach',{cohortId:created.cohort.id,roomId:room.roomId},facilitator)).status,200);
  const alice=(await call('/game/cohort/activate',{code:created.codes[0].code})).body;
  assert.equal((await get('/game/state',{academy:alice.token})).status,200);
  const deleted=await call('/game/facilitator/cohort/delete',{cohortId:created.cohort.id},facilitator);
  assert.equal(deleted.status,200);
  assert.deepEqual(deleted.body,{deleted:true,cohortId:created.cohort.id,members:2,rooms:[room.roomId],certificates:0});
  assert.deepEqual((await call('/game/facilitator/cohorts',{},facilitator)).body,[]);
  assert.equal((await get('/game/state',{academy:alice.token})).status,401);
  assert.equal((await call('/game/cohort/activate',{code:created.codes[1].code})).status,401);
  const squad=(await call('/game/facilitator/overview',{},facilitator)).body.find(entry=>entry.id===room.roomId);
  assert.ok(squad,'the squad itself survives a cohort delete');
  assert.ok(squad.members.every(member=>member.name!=='Alice'&&member.name!=='Bob'),'no cohort names left in the squad');
  assert.equal(store.data.rooms[room.roomId].cohortId,undefined);
  assert.equal(Object.keys(store.data.accessCodes).length,0);
  assert.equal((await call('/game/facilitator/cohort/delete',{cohortId:created.cohort.id},facilitator)).status,404);
  assert.equal((await call('/game/facilitator/room/delete',{roomId:room.roomId},facilitator)).status,200);
  assert.deepEqual((await call('/game/facilitator/overview',{},facilitator)).body,[]);
 }finally{await close();}
});

test('squad delete removes uploaded files first and keeps the squad when storage fails',async()=>{
 const calls=[];let broken=true;
 const files={configured:true,run:async(action,actor,input)=>{calls.push([action,actor.roomId,actor.role,input?.fileId]);if(action==='listFiles'){if(broken)throw Object.assign(new Error('down'),{status:503});return {files:[{id:'f1'},{id:'f2'}]};}return {deleted:true};}};
 const {call,close}=await gateway({files});
 try{
  const room=(await call('/game/create',{...host,name:'Files'})).body;
  assert.equal((await call('/game/facilitator/room/delete',{...host,roomId:room.roomId})).status,502);
  assert.equal((await call('/game/facilitator/overview',host)).body.length,1);
  broken=false;calls.length=0;
  const deleted=await call('/game/facilitator/room/delete',{...host,roomId:room.roomId});
  assert.equal(deleted.status,200);
  assert.equal(deleted.body.files,2);
  assert.deepEqual(calls,[['listFiles',room.roomId,'facilitator',undefined],['deleteFile',room.roomId,'facilitator','f1'],['deleteFile',room.roomId,'facilitator','f2']]);
 }finally{await close();}
});

test('facilitator hub shows delete with confirm on squad and cohort cards',()=>{
 const main=readFileSync(path.join(root,'src/main.jsx'),'utf8');
 assert.match(main,/data-testid="squad-delete"/);
 assert.match(main,/data-testid="cohort-delete"/);
 assert.match(main,/confirm\(t\('overview\.deleteConfirm'/);
 assert.match(main,/confirm\(t\('cohort\.deleteConfirm'/);
 assert.match(main,/api\('facilitator\/room\/delete',\{hostKey,roomId:squad\.id\}\)/);
 assert.match(main,/api\('facilitator\/cohort\/delete',\{hostKey,cohortId:cohort\.id\}\)/);
 for(const file of ['src/i18n/en.json','src/i18n/nl.json','packages/i18n/src/en.json','packages/i18n/src/nl.json']){
  const catalog=JSON.parse(readFileSync(path.join(root,file),'utf8'));
  for(const key of ['overview.delete','overview.deleteConfirm','cohort.delete','cohort.deleteConfirm'])assert.ok(catalog[key],`${file} ${key}`);
 }
});
