import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';
import {LocalStore} from '../server/local-store.mjs';
import {dayProgress,exportDebrief} from '../server/progress.mjs';
async function call(app,route,token,body={}){
 const response={status:200};
 const res={json(value){response.body=value;return this;},type(){return this;},set(){return this;},send(value){response.body=value;return this;}};
 await app.router.stack.find(layer=>layer.route?.path===route).route.stack[0].handle({headers:{authorization:'Bearer '+token},body},res,error=>{response.status=error.status||500;response.body=error.message;});
 return response;
}
test('five-day progress survives restart; private reflection and debrief stay access scoped',async()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'academy-learning-'));
 try{
 const {app,store,proof}=createApp({dir,hostKey:'test'});
 proof.state=async()=>({markdown:'# Intent'});proof.comment=async()=>({});
 const host=store.create('Test squad',{slug:'test'}),alice=store.join(host.code,'Alice'),bob=store.join(host.code,'Bob');
 for(let day=1;day<=7;day++){
  assert.equal((await call(app,'/game/control',host.token,{action:'day',value:day})).status,200);
  assert.equal(store.auth(alice.token).p.route,'standard');
  await call(app,'/game/route',alice.token,{route:'guided'});
  await call(app,'/game/reflection',alice.token,{learned:`Geleerd op dag ${day}`,next:`Oefening ${day}`});
  const evidence=await call(app,'/game/evidence',alice.token,{requestId:`e${day}`,finding:'Een aanname gecontroleerd',command:'node --test',observed:'Testresultaat',limitation:'Geen productiecontrole'});
  await call(app,'/game/review',host.token,{requestId:`r${day}`,id:evidence.body.id,status:'accepted',note:'Herhaald door tweede lezer'});
  await call(app,'/game/handoff',host.token,{requestId:`h${day}`,decision:`Dag ${day} afgerond`,checked:'Tweede lezer',open:'Productie',next:'Ignored'});
 }
 assert.equal((await call(app,'/game/debrief',bob.token)).status,403);
 assert.equal((await call(app,'/game/debrief/export',bob.token)).status,403);
 assert.equal((await call(app,'/game/reflection',host.token,{learned:'x',next:'y'})).status,403);
 const bobRoute=(await call(app,'/game/day-route',bob.token)).body;
 assert.ok(bobRoute.days.every(day=>day.progress.reflection===null&&day.progress.evidenceCount===0));
 const restored=new LocalStore(dir),{r,p}=restored.auth(alice.token);
 for(let day=1;day<=7;day++){
  const progress=dayProgress(r,p,day);
  assert.equal(progress.route,'guided');assert.equal(progress.acceptedCount,1);assert.equal(progress.hasHandoff,true);assert.equal(progress.reflection.learned,`Geleerd op dag ${day}`);
 }
 await call(app,'/game/control',host.token,{action:'day',value:1});
 assert.equal(store.auth(alice.token).p.route,'guided');
 assert.equal(store.auth(bob.token).p.route,'standard');
 const exported=exportDebrief(r);assert.match(exported,/## Dag 7\n/);assert.doesNotMatch(exported,/Supportdag/);assert.doesNotMatch(exported,/quizScore|guided|stretch/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
