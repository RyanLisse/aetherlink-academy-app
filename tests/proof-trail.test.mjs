import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';
import {transition,dayTasks,REVIEWER_ROLES} from '../server/proof-trail.mjs';

async function invoke(app,route,{body={},cookies={},params={},headers={},method}={}){
 const layer=app.router.stack.find(candidate=>candidate.route?.path===route&&(!method||candidate.route.methods[method]));assert.ok(layer,`Missing route ${route}`);
 const response={statusCode:200,body:null};
 const req={body,query:{},params,headers:{...headers,cookie:Object.entries(cookies).map(([name,value])=>`${name}=${value}`).join('; ')}};
 const res={cookie(){return this;},clearCookie(){return this;},status(status){response.statusCode=status;return this;},json(value){response.body=value;return this;},end(){return this;}};
 await layer.route.stack[0].handle(req,res,error=>{response.statusCode=error.status||500;response.body={error:error.message};});
 return response;
}

function fixture(){
 const instance=createApp({dir:mkdtempSync(path.join(os.tmpdir(),'academy-proof-trail-')),hostKey:'test-host',publicBaseUrl:'http://127.0.0.1:4321'});
 const host=instance.store.create('Trail squad',{slug:'trail'},{email:'fac@example.test',name:'Fac Ilitator'});
 const driver=instance.store.join(host.code,'Ada');
 const learner=instance.store.join(host.code,'Bo');
 const peer=instance.store.join(host.code,'Cy');
 const comments=[];
 instance.proof.comment=async(_r,actor,text)=>{comments.push({actor,text});return {ok:true};};
 instance.proof.state=async()=>({markdown:'# Intent\nDoel',marks:{}});
 const sso=instance.store.facilitatorLogin({sub:'g-1',email:'fac@example.test',name:'Fac Ilitator',domain:'example.test'});
 const as=token=>({academy:token});
 const facilitator={...as(host.token),'academy-facilitator':sso};
 const submit=(token,requestId,taskId)=>invoke(instance.app,'/game/evidence',{body:{requestId,finding:'README noemt npm test',command:'node --test',observed:'1 failing',limitation:'Nog geen tweede lezer',...(taskId===undefined?{}:{taskId})},cookies:as(token)});
 const review=(cookies,id,status,note,requestId)=>invoke(instance.app,'/game/review',{body:{id,status,note,requestId},cookies});
 const tasks=token=>invoke(instance.app,'/game/tasks',{cookies:as(token),method:'get'});
 const queue=cookies=>invoke(instance.app,'/game/tasks/queue',{cookies,method:'get'});
 const peerList=cookies=>invoke(instance.app,'/game/tasks/peer',{cookies,method:'get'});
 return {instance,host,driver,learner,peer,facilitator,comments,as,submit,review,tasks,queue,peerList};
}

const TABLE=[
 ['open','submit','submitted'],
 ['open','approve',409],
 ['open','request_changes',409],
 ['submitted','submit',409],
 ['submitted','approve','approved'],
 ['submitted','request_changes','changes_requested'],
 ['changes_requested','submit','submitted'],
 ['changes_requested','approve',409],
 ['changes_requested','request_changes',409],
 ['approved','submit',409],
 ['approved','approve',409],
 ['approved','request_changes',409],
];
for(const [status,event,expected] of TABLE)test(`transition ${status} --${event}--> ${expected}`,()=>{
 if(expected===409)assert.throws(()=>transition(status,event),error=>error.status===409);
 else assert.equal(transition(status,event),expected);
});

test('tasks come from day-pack ids: the mission, or the progressive steps when a day has them',()=>{
 assert.deepEqual(dayTasks(1),[{id:'ATLAS-REVIEW-01',title:'Maak de repository begrijpelijk'}]);
 assert.deepEqual(dayTasks(3).map(t=>t.id),['n8n-zero','n8n-one','n8n-multi']);
 assert.deepEqual(dayTasks(9),[]);
});

test('task → submit → changes requested → resubmit → approved, visible to participant and facilitator',async()=>{
 const {instance,learner,driver,facilitator,comments,as,submit,review,tasks,queue}=fixture();
 assert.deepEqual((await tasks(learner.token)).body,{day:1,tasks:[{id:'ATLAS-REVIEW-01',title:'Maak de repository begrijpelijk',day:1,status:'open',submissions:[]}]});

 const first=await submit(learner.token,'t-1','ATLAS-REVIEW-01');
 assert.equal(first.statusCode,200);
 assert.equal(first.body.taskId,'ATLAS-REVIEW-01');
 assert.match(comments.at(-1).text,/Opdracht: ATLAS-REVIEW-01\nStatus: ingediend/);
 assert.equal((await tasks(learner.token)).body.tasks[0].status,'submitted');
 assert.equal((await tasks(driver.token)).body.tasks[0].status,'open','another participant sees only their own trail');

 const again=await submit(learner.token,'t-2','ATLAS-REVIEW-01');
 assert.equal(again.statusCode,409);
 assert.equal(again.body.error,'Deze opdracht wacht op beoordeling of is al goedgekeurd.');

 const waiting=await queue(facilitator);
 assert.equal(waiting.statusCode,200);
 assert.deepEqual(waiting.body.queue.map(({name,taskId,taskTitle,attempt,day})=>({name,taskId,taskTitle,attempt,day})),[{name:'Bo',taskId:'ATLAS-REVIEW-01',taskTitle:'Maak de repository begrijpelijk',attempt:1,day:1}]);
 assert.deepEqual(waiting.body.members.map(m=>[m.name,m.tasks[0].status]),[['Ada','open'],['Bo','submitted'],['Cy','open']]);

 const self=await review(as(learner.token),first.body.id,'accepted','Mijn eigen werk','r-self');
 assert.equal(self.statusCode,403);
 assert.equal(self.body.error,'Laat een andere deelnemer jouw bewijs beoordelen.');
 assert.equal((await tasks(learner.token)).body.tasks[0].status,'submitted');

 const changes=await review(facilitator,first.body.id,'needs-work','Voeg de letterlijke foutmelding toe.','r-1');
 assert.equal(changes.statusCode,200);
 assert.deepEqual(changes.body.review.reviewer,{role:'facilitator',name:'Fac Ilitator',email:'fac@example.test'});
 const afterChanges=(await tasks(learner.token)).body.tasks[0];
 assert.equal(afterChanges.status,'changes_requested');
 assert.equal(afterChanges.submissions[0].review.note,'Voeg de letterlijke foutmelding toe.');
 assert.equal((await queue(facilitator)).body.queue.length,0);

 const twice=await review(facilitator,first.body.id,'accepted','Toch goed','r-2');
 assert.equal(twice.statusCode,409);

 const second=await submit(learner.token,'t-3','ATLAS-REVIEW-01');
 assert.equal(second.statusCode,200);
 assert.equal((await queue(facilitator)).body.queue[0].attempt,2);
 const approved=await review(facilitator,second.body.id,'accepted','Reproduceerbaar.','r-3');
 assert.equal(approved.statusCode,200);
 const final=(await tasks(learner.token)).body.tasks[0];
 assert.equal(final.status,'approved');
 assert.deepEqual(final.submissions.map(s=>[s.status,s.review.note]),[['needs-work','Voeg de letterlijke foutmelding toe.'],['accepted','Reproduceerbaar.']]);
 assert.deepEqual((await queue(facilitator)).body.members.map(m=>[m.name,m.tasks[0].status]),[['Ada','open'],['Bo','approved'],['Cy','open']]);
 assert.equal((await submit(learner.token,'t-4','ATLAS-REVIEW-01')).statusCode,409);

 const overview=await invoke(instance.app,'/game/facilitator/overview',{body:{hostKey:'test-host'}});
 assert.equal(overview.body[0].awaitingReview,0);
});

test('reviewer roles are a closed list that AET-103 can extend with auto-graded',()=>{
 assert.deepEqual(REVIEWER_ROLES,['peer','facilitator']);
});

test('a peer in the same room reviews task evidence; the author sees the decision and who made it',async()=>{
 const {learner,peer,driver,as,submit,review,tasks,peerList}=fixture();
 const sent=await submit(learner.token,'p-1','ATLAS-REVIEW-01');
 assert.equal(sent.statusCode,200);

 const cyList=await peerList(as(peer.token));
 assert.equal(cyList.statusCode,200);
 assert.deepEqual(cyList.body.queue.map(({evidenceId,name,taskId,taskTitle,attempt,day})=>({evidenceId,name,taskId,taskTitle,attempt,day})),[{evidenceId:sent.body.id,name:'Bo',taskId:'ATLAS-REVIEW-01',taskTitle:'Maak de repository begrijpelijk',attempt:1,day:1}]);
 assert.equal(cyList.body.members,undefined,'peers do not get the room-wide status board');
 assert.deepEqual((await peerList(as(learner.token))).body.queue,[],'the author never sees their own submission to review');

 const decided=await review(as(peer.token),sent.body.id,'needs-work','Noem de exacte foutmelding.','p-r-1');
 assert.equal(decided.statusCode,200,'Cy is a navigator, not the driver, and may still review');
 assert.deepEqual(decided.body.review.reviewer,{role:'peer',name:'Cy',email:null});
 const trail=(await tasks(learner.token)).body.tasks[0];
 assert.equal(trail.status,'changes_requested');
 assert.deepEqual(trail.submissions[0].review,{note:'Noem de exacte foutmelding.',at:decided.body.review.at,reviewer:{role:'peer',name:'Cy',email:null}});
 assert.deepEqual((await peerList(as(driver.token))).body.queue,[]);

 const again=await submit(learner.token,'p-2','ATLAS-REVIEW-01');
 const approved=await review(as(driver.token),again.body.id,'accepted','Nu reproduceerbaar.','p-r-2');
 assert.equal(approved.statusCode,200);
 assert.equal((await tasks(learner.token)).body.tasks[0].status,'approved');
});

test('a participant from another room cannot see or review the submission',async()=>{
 const {instance,learner,as,submit,review,tasks,peerList}=fixture();
 const sent=await submit(learner.token,'x-1','ATLAS-REVIEW-01');
 const other=instance.store.create('Andere squad',{slug:'other'},{email:'fac@example.test',name:'Fac Ilitator'});
 const outsider=instance.store.join(other.code,'Dex');
 assert.deepEqual((await peerList(as(outsider.token))).body.queue,[]);
 const attempt=await review(as(outsider.token),sent.body.id,'accepted','Lijkt goed','x-r-1');
 assert.equal(attempt.statusCode,404);
 assert.equal(attempt.body.error,'Bewijs niet gevonden.');
 assert.equal((await tasks(learner.token)).body.tasks[0].status,'submitted');
});

test('two peers deciding the same submission at once: exactly one decision lands',async()=>{
 const {instance,host,learner,peer,driver,as,submit,review,tasks}=fixture();
 const sent=await submit(learner.token,'race-1','ATLAS-REVIEW-01');
 const results=await Promise.all([review(as(driver.token),sent.body.id,'accepted','Goed','race-a'),review(as(peer.token),sent.body.id,'needs-work','Nog niet','race-b')]);
 assert.deepEqual(results.map(r=>r.statusCode).sort(),[200,409]);
 const winner=results.find(r=>r.statusCode===200).body.review;
 const trail=(await tasks(learner.token)).body.tasks[0];
 assert.equal(trail.submissions.length,1);
 assert.deepEqual(trail.submissions[0].review,{note:winner.note,at:winner.at,reviewer:winner.reviewer});
 assert.equal(trail.status,winner.note==='Goed'?'approved':'changes_requested');
 assert.equal(instance.store.auth(host.token).r.evidence.filter(e=>e.review).length,1);
});

test('review queue and task list are role-scoped',async()=>{
 const {host,learner,facilitator,as,tasks,queue,peerList}=fixture();
 const facilitatorPeer=await peerList(facilitator);
 assert.equal(facilitatorPeer.statusCode,403);
 assert.equal(facilitatorPeer.body.error,'Alleen deelnemers beoordelen elkaars opdrachten.');
 const participantQueue=await queue(as(learner.token));
 assert.equal(participantQueue.statusCode,403);
 assert.equal(participantQueue.body.error,'Alleen de facilitator ziet de beoordelingswachtrij.');
 assert.equal((await tasks(host.token)).statusCode,403);
 assert.equal((await queue(facilitator)).statusCode,200);
});

test('untasked evidence keeps the peer review path; unknown task ids are rejected',async()=>{
 const {instance,driver,learner,as,submit,review}=fixture();
 const loose=await submit(learner.token,'loose-1','');
 assert.equal(loose.statusCode,200);
 assert.equal(loose.body.taskId,undefined);
 const peer=await review(as(driver.token),loose.body.id,'accepted','Gereproduceerd','peer-1');
 assert.equal(peer.statusCode,200);
 assert.deepEqual(peer.body.review.reviewer,{role:'peer',name:'Ada',email:null});
 const unknown=await submit(learner.token,'bad-1','NOPE');
 assert.equal(unknown.statusCode,400);
 assert.equal(unknown.body.error,'Onbekende opdracht voor supportdag 1.');
 const overview=await invoke(instance.app,'/game/facilitator/overview',{body:{hostKey:'test-host'}});
 assert.equal(overview.body[0].awaitingReview,0);
});

test('MCP: get_mission lists own tasks and submit_evidence maps to a task',async()=>{
 const {instance,host,learner,facilitator,queue}=fixture();
 const {r,p}=instance.store.auth(learner.token);
 const mcp=instance.store.session(r.id,p.id,'mcp');
 await invoke(instance.app,'/game/control',{body:{action:'day',value:3},cookies:{academy:host.token}});
 const call=(tool,body={})=>invoke(instance.app,'/game/mcp/:tool',{params:{tool},body,headers:{authorization:'Bearer '+mcp}});
 const mission=await call('get_mission');
 assert.deepEqual(mission.body.tasks.map(t=>[t.id,t.status]),[['n8n-zero','open'],['n8n-one','open'],['n8n-multi','open']]);
 const sent=await call('submit_evidence',{requestId:'mcp-1',finding:'Flow draait',command:'n8n execute',observed:'3 items',limitation:'Fixture-data',taskId:'n8n-zero'});
 assert.equal(sent.statusCode,200);
 assert.equal(sent.body.source,'MCP-client');
 assert.deepEqual((await call('get_mission')).body.tasks.map(t=>t.status),['submitted','open','open']);
 assert.deepEqual((await queue(facilitator)).body.queue.map(q=>[q.name,q.taskId,q.taskTitle]),[['Bo','n8n-zero','Flow zonder AI-agent']]);
 const overview=await invoke(instance.app,'/game/facilitator/overview',{body:{hostKey:'test-host'}});
 assert.equal(overview.body[0].awaitingReview,1);
});
