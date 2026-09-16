import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';
import {getDayPack} from '../server/content.mjs';

async function invoke(app,route,{body={},query={},cookies={}}={}){
 const layer=app.router.stack.find(candidate=>candidate.route?.path===route);assert.ok(layer,`Missing route ${route}`);
 const response={statusCode:200,headers:{},cookies:[],body:null};
 const req={body,query,headers:{cookie:Object.entries(cookies).map(([name,value])=>`${name}=${value}`).join('; ')}};
 const res={cookie(name,value,options={}){response.cookies.push(`${name}=${encodeURIComponent(value)}${options.path?`; Path=${options.path}`:''}`);return this;},clearCookie(){return this;},redirect(status,location){response.statusCode=status;response.headers.location=location;return this;},status(status){response.statusCode=status;return this;},json(value){response.body=value;return this;},end(){return this;}};
 await layer.route.stack[0].handle(req,res,error=>{response.statusCode=error.status||500;response.body={error:error.status?error.message:'Onverwachte serverfout.'};});
 return response;
}

test('day 3 pack exposes progressive n8n steps 0→1→multi',()=>{
 const pack=getDayPack(3);
 assert.equal(pack.mission.id,'ATLAS-N8N-03');
 assert.equal(pack.steps.length,3);
 assert.deepEqual(pack.steps.map(s=>s.agentCount),[0,1,'multi']);
 assert.deepEqual(pack.steps.map(s=>s.id),['n8n-zero','n8n-one','n8n-multi']);
 assert.match(pack.blurb,/0 agents|progressief|multi/i);
 assert.equal(pack.quiz.questions.length,3);
 assert.deepEqual(pack.quiz.answers,[1,1,1]);
 assert.deepEqual(pack.lesson.loop.map(s=>s.label),['0 agents','1 agent','Multi','Gate']);
 assert.equal(pack.scenario.externalWrites,false);
});

test('day-pack API returns steps and strips quiz answers on day 3',async()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'academy-day3-'));
 const {app,store}=createApp({dir,hostKey:'day3-host',publicBaseUrl:'http://127.0.0.1:4371'});
 const host=store.create('Day3 progressive',{slug:'day3-prog'});
 const participant=store.join(host.code,'Sam');
 const change=await invoke(app,'/game/control',{body:{action:'day',value:3},cookies:{academy:host.token}});
 assert.equal(change.statusCode,200);
 const pack=await invoke(app,'/game/day-pack',{cookies:{academy:participant.token}});
 assert.equal(pack.statusCode,200);
 assert.equal(pack.body.day,3);
 assert.equal(pack.body.steps.length,3);
 assert.equal(pack.body.quiz.answers,undefined);
 assert.equal(pack.body.mission.id,'ATLAS-N8N-03');
});

test('day 3 quiz scores progressive answers after facilitator sets day',async()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'academy-day3-quiz-'));
 const {app,store}=createApp({dir,hostKey:'day3-quiz-host',publicBaseUrl:'http://127.0.0.1:4371'});
 const host=store.create('Day3 quiz',{slug:'day3-quiz'});
 const participant=store.join(host.code,'Sam');
 await invoke(app,'/game/control',{body:{action:'day',value:3},cookies:{academy:host.token}});
 const perfect=await invoke(app,'/game/quiz',{body:{answers:[1,1,1]},cookies:{academy:participant.token}});
 assert.equal(perfect.statusCode,200);
 assert.equal(perfect.body.score,3);
 assert.equal(perfect.body.route,'stretch');
 assert.equal(perfect.body.day,3);
 const guided=await invoke(app,'/game/quiz',{body:{answers:[0,0,0]},cookies:{academy:participant.token}});
 assert.equal(guided.statusCode,200);
 assert.equal(guided.body.score,0);
 assert.equal(guided.body.route,'guided');
});
