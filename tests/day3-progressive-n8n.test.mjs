import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';

async function invoke(app,route,{body={},query={},params={},cookies={}}={}){
 const layer=app.router.stack.find(candidate=>candidate.route?.path===route);assert.ok(layer,`Missing route ${route}`);
 const response={statusCode:200,headers:{},cookies:[],body:null};
 const req={body,query,params,headers:{cookie:Object.entries(cookies).map(([name,value])=>`${name}=${value}`).join('; ')}};
 const res={cookie(){return this;},clearCookie(){return this;},redirect(status,location){response.statusCode=status;response.headers.location=location;return this;},status(status){response.statusCode=status;return this;},json(value){response.body=value;return this;},type(value){response.headers['content-type']=value;return this;},send(value){response.body=value;return this;},end(){return this;}};
 await layer.route.stack[0].handle(req,res,error=>{response.statusCode=error.status||500;response.body={error:error.status?error.message:'Onverwachte serverfout.'};});
 return response;
}

async function answerQuiz(app,token,answers){
 const start=await invoke(app,'/game/quiz/start',{cookies:{academy:token}});assert.equal(start.statusCode,200);
 return invoke(app,'/game/quiz',{body:{attemptId:start.body.attemptId,answers},cookies:{academy:token}});
}

function room(slug){
 const {app,store}=createApp({dir:mkdtempSync(path.join(os.tmpdir(),'academy-day3-')),hostKey:`${slug}-host`,publicBaseUrl:'http://127.0.0.1:4371'});
 const host=store.create('Day3 triage',{slug});
 return {app,host,participant:store.join(host.code,'Sam')};
}

test('day 3 pack serves the n8n L1–L3 ticket ladder with the shared fixture',async()=>{
 const {app,host,participant}=room('day3-ladder');
 assert.equal((await invoke(app,'/game/control',{body:{action:'day',value:3},cookies:{academy:host.token}})).statusCode,200);
 const pack=await invoke(app,'/game/day-pack',{cookies:{academy:participant.token}});
 assert.equal(pack.statusCode,200);
 assert.equal(pack.body.mission.id,'TRIAGE-N8N-03');
 assert.deepEqual(pack.body.steps.map(s=>s.id),['w3-l1','w3-l2','w3-l3','w3-proof']);
 assert.deepEqual(pack.body.lesson.loop.map(s=>s.label),['L1 regels','L2 oordeel','L3 specialisten','Proof','Gate']);
 assert.deepEqual(pack.body.triage.tickets.map(t=>`${t.ticketId}=${t.expected}`),['WL-1026=high','WL-1027=low','WL-9001=medium','WL-9002=medium']);
 assert.equal(pack.body.quiz.key,undefined);
 assert.deepEqual(pack.body.quiz.questions.map(q=>q.id),['d3-q1','d3-q2','d3-q3']);
});

test('day 3 quiz scores the deck-derived answers',async()=>{
 const {app,host,participant}=room('day3-quiz');
 await invoke(app,'/game/control',{body:{action:'day',value:3},cookies:{academy:host.token}});
 const perfect=await answerQuiz(app,participant.token,{'d3-q1':'b','d3-q2':'a','d3-q3':'c'});
 assert.deepEqual([perfect.statusCode,perfect.body.score,perfect.body.route,perfect.body.day],[200,3,'stretch',3]);
 const guided=await answerQuiz(app,participant.token,{'d3-q1':'a','d3-q2':'b','d3-q3':'a'});
 assert.deepEqual([guided.body.score,guided.body.route],[0,'guided']);
});

test('day 3 starters download through the served starter route',async()=>{
 const {app,participant}=room('day3-starters');
 const l1=await invoke(app,'/game/starter/:file',{params:{file:'n8n-triage-l1-switch.json'},cookies:{academy:participant.token}});
 assert.equal(l1.statusCode,200);
 assert.equal(JSON.parse(l1.body).name,'AetherLink W3 · L1 Switch (no LLM)');
 const fixtures=await invoke(app,'/game/starter/:file',{params:{file:'triage-fixtures.json'},cookies:{academy:participant.token}});
 assert.equal(JSON.parse(fixtures.body).id,'support-triage-v1');
 const missing=await invoke(app,'/game/starter/:file',{params:{file:'secrets.json'},cookies:{academy:participant.token}});
 assert.equal(missing.statusCode,404);
});

test('facilitator can select day 7 but not day 8',async()=>{
 const {app,host}=room('day3-bounds');
 const seven=await invoke(app,'/game/control',{body:{action:'day',value:7},cookies:{academy:host.token}});
 assert.deepEqual([seven.statusCode,seven.body.day],[200,7]);
 const eight=await invoke(app,'/game/control',{body:{action:'day',value:8},cookies:{academy:host.token}});
 assert.deepEqual([eight.statusCode,eight.body.error],[400,'Kies dag 1–7.']);
});
