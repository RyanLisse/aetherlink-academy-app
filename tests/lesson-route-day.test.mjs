import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';
import {getDayPack,listRouteDays} from '../server/content.mjs';

async function invoke(app,route,{body={},query={},cookies={}}={}){
 const layer=app.router.stack.find(candidate=>candidate.route?.path===route);assert.ok(layer,`Missing route ${route}`);
 const response={statusCode:200,headers:{},cookies:[],body:null};
 const req={body,query,headers:{cookie:Object.entries(cookies).map(([name,value])=>`${name}=${value}`).join('; ')}};
 const res={cookie(name,value,options={}){response.cookies.push(`${name}=${encodeURIComponent(value)}${options.path?`; Path=${options.path}`:''}`);return this;},clearCookie(){return this;},redirect(status,location){response.statusCode=status;response.headers.location=location;return this;},status(status){response.statusCode=status;return this;},json(value){response.body=value;return this;},end(){return this;}};
 await layer.route.stack[0].handle(req,res,error=>{response.statusCode=error.status||500;response.body={error:error.status?error.message:'Onverwachte serverfout.'};});
 return response;
}

function fixture(){
 const instance=createApp({dir:mkdtempSync(path.join(os.tmpdir(),'academy-lesson-route-')),hostKey:'test-host',publicBaseUrl:'http://127.0.0.1:4318'});
 const host=instance.store.create('Lesson route',{slug:'lesson-route'});
 const participant=instance.store.join(host.code,'Deelnemer');
 return {instance,host,participant};
}

test('day 1 lesson pack and route days stay available',async()=>{
 const {instance,participant}=fixture();
 const pack=await invoke(instance.app,'/game/day-pack',{cookies:{academy:participant.token}});
 assert.equal(pack.statusCode,200);
 assert.equal(pack.body.day,1);
 assert.equal(pack.body.lesson.title,getDayPack(1).lesson.title);
 assert.equal(pack.body.lesson.kicker,getDayPack(1).lesson.kicker);
 assert.equal(pack.body.quiz.questions.length,3);
 assert.equal(pack.body.quiz.answers,undefined);
 const route=await invoke(instance.app,'/game/day-route',{cookies:{academy:participant.token}});
 assert.equal(route.statusCode,200);
 assert.equal(route.body.day,1);
 assert.equal(route.body.days.length,5);
 assert.equal(route.body.days.length,listRouteDays().length);
 for(const [i,expected] of listRouteDays().entries()){
  assert.equal(route.body.days[i].day,expected.day);
  assert.equal(route.body.days[i].title,expected.title);
  assert.equal(route.body.days[i].blurb,expected.blurb);
  assert.equal(route.body.days[i].hasLesson,expected.hasLesson);
  assert.equal(route.body.days[i].progress.hasQuiz,false);
 }
 assert.equal(route.body.days[0].hasLesson,true);
 assert.equal(route.body.days[0].blurb,getDayPack(1).blurb);
 assert.equal(route.body.days[2].hasLesson,false);
});

test('facilitator day control switches lesson pack and highlights day 2 on route',async()=>{
 const {instance,host,participant}=fixture();
 const change=await invoke(instance.app,'/game/control',{body:{action:'day',value:2},cookies:{academy:host.token}});
 assert.equal(change.statusCode,200);
 assert.equal(change.body.day,2);
 const pack=await invoke(instance.app,'/game/day-pack',{cookies:{academy:participant.token}});
 assert.equal(pack.statusCode,200);
 assert.equal(pack.body.day,2);
 assert.equal(pack.body.lesson.title,getDayPack(2).lesson.title);
 assert.equal(pack.body.lesson.lede,getDayPack(2).lesson.lede);
 assert.ok(pack.body.lesson.workedExample.includes('PLACEHOLDER — wacht op quizbank/vijfdagenplan'));
 assert.equal(pack.body.quiz.questions[0].question,getDayPack(2).quiz.questions[0].question);
 const route=await invoke(instance.app,'/game/day-route',{cookies:{academy:participant.token}});
 assert.equal(route.statusCode,200);
 assert.equal(route.body.day,2);
 assert.equal(route.body.days[1].title,getDayPack(2).title);
 assert.equal(route.body.days[1].blurb,getDayPack(2).blurb);
 assert.equal(route.body.days[1].hasLesson,true);
});

test('day without pack keeps route cards and rejects lesson pack with 400',async()=>{
 const {instance,host,participant}=fixture();
 const change=await invoke(instance.app,'/game/control',{body:{action:'day',value:3},cookies:{academy:host.token}});
 assert.equal(change.statusCode,200);
 const pack=await invoke(instance.app,'/game/day-pack',{cookies:{academy:participant.token}});
 assert.equal(pack.statusCode,400);
 assert.match(pack.body.error,/Geen contentpakket voor supportdag 3/);
 const route=await invoke(instance.app,'/game/day-route',{cookies:{academy:participant.token}});
 assert.equal(route.statusCode,200);
 assert.equal(route.body.day,3);
 assert.equal(route.body.days[2].hasLesson,false);
 assert.match(route.body.days[2].title,/Samen bouwen/);
});
