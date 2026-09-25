import test from 'node:test';
import assert from 'node:assert/strict';
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

async function answerQuiz(app,token,answers){
 const start=await invoke(app,'/game/quiz/start',{cookies:{academy:token}});assert.equal(start.statusCode,200);
 return invoke(app,'/game/quiz',{body:{attemptId:start.body.attemptId,answers},cookies:{academy:token}});
}

function fixture(){
 const instance=createApp({dir:mkdtempSync(path.join(os.tmpdir(),'academy-day-packs-')),hostKey:'test-host',publicBaseUrl:'http://127.0.0.1:4317'});
 const host=instance.store.create('Day packs',{slug:'day-packs'});
 const participant=instance.store.join(host.code,'Deelnemer');
 return {instance,host,participant};
}

test('day 1 quiz scores the extracted key and selects stretch',async()=>{
 const {instance,participant}=fixture();
 const result=await answerQuiz(instance.app,participant.token,{'d1-q1':'b','d1-q2':'a','d1-q3':'c'});
 assert.equal(result.statusCode,200);
 assert.equal(result.body.score,3);
 assert.equal(result.body.route,'stretch');
 const wrong=await answerQuiz(instance.app,participant.token,{'d1-q1':'a','d1-q2':'b','d1-q3':'a'});
 assert.equal(wrong.body.score,0);
 assert.equal(wrong.body.route,'guided');
});

test('day 2 quiz uses the Classroom 2 pack after facilitator control',async()=>{
 const {instance,host,participant}=fixture();
 const changeDay=await invoke(instance.app,'/game/control',{body:{action:'day',value:2},cookies:{academy:host.token}});
 assert.equal(changeDay.statusCode,200);
 assert.equal(changeDay.body.day,2);
 const result=await answerQuiz(instance.app,participant.token,{'d2-q1':'b','d2-q2':'a','d2-q3':'c'});
 assert.equal(result.statusCode,200);
 assert.equal(result.body.score,3);
 assert.equal(result.body.route,'stretch');
 const publicPack=await invoke(instance.app,'/game/day-pack',{cookies:{academy:participant.token}});
 assert.equal(publicPack.statusCode,200);
 assert.equal(publicPack.body.day,2);
 assert.equal(publicPack.body.quiz.key,undefined);
 assert.deepEqual(publicPack.body.lesson.loop.map(step=>step.label),['CLAUDE.md','Skill','Bounded run','MCP','Workflow','Handoff']);
});

test('quiz rejects wrong answer arity and scores every day pack 1–7',async()=>{
 const {instance,host,participant}=fixture();
 const wrongLength=await answerQuiz(instance.app,participant.token,{'d1-q1':'b','d1-q2':'a'});
 assert.equal(wrongLength.statusCode,400);
 assert.match(wrongLength.body.error,/vraag d1-q3 is niet beantwoord/);
 for(const day of [1,2,3,4,5,6,7]){
  const changeDay=await invoke(instance.app,'/game/control',{body:{action:'day',value:day},cookies:{academy:host.token}});
  assert.equal(changeDay.statusCode,200);
  const result=await answerQuiz(instance.app,participant.token,getDayPack(day).quiz.key);
  assert.equal(result.statusCode,200);
  assert.equal(result.body.score,getDayPack(day).quiz.questions.length);
  const publicPack=await invoke(instance.app,'/game/day-pack',{cookies:{academy:participant.token}});
  assert.equal(publicPack.statusCode,200);
  assert.equal(publicPack.body.quiz.key,undefined);
 }
});
