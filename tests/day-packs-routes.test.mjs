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

function fixture(){
 const instance=createApp({dir:mkdtempSync(path.join(os.tmpdir(),'academy-day-packs-')),hostKey:'test-host',publicBaseUrl:'http://127.0.0.1:4317'});
 const host=instance.store.create('Day packs',{slug:'day-packs'});
 const participant=instance.store.join(host.code,'Deelnemer');
 return {instance,host,participant};
}

test('day 1 quiz scores the extracted key and selects stretch',async()=>{
 const {instance,participant}=fixture();
 const result=await invoke(instance.app,'/game/quiz',{body:{answers:[1,0,2]},cookies:{academy:participant.token}});
 assert.equal(result.statusCode,200);
 assert.equal(result.body.score,3);
 assert.equal(result.body.route,'stretch');
 const wrong=await invoke(instance.app,'/game/quiz',{body:{answers:[0,1,0]},cookies:{academy:participant.token}});
 assert.equal(wrong.body.score,0);
 assert.equal(wrong.body.route,'guided');
});

test('day 2 quiz uses the day 2 pack after facilitator control',async()=>{
 const {instance,host,participant}=fixture();
 const changeDay=await invoke(instance.app,'/game/control',{body:{action:'day',value:2},cookies:{academy:host.token}});
 assert.equal(changeDay.statusCode,200);
 assert.equal(changeDay.body.day,2);
 const result=await invoke(instance.app,'/game/quiz',{body:{answers:getDayPack(2).quiz.answers},cookies:{academy:participant.token}});
 assert.equal(result.statusCode,200);
 assert.equal(result.body.score,3);
 assert.equal(result.body.route,'stretch');
 const publicPack=await invoke(instance.app,'/game/day-pack',{cookies:{academy:participant.token}});
 assert.equal(publicPack.statusCode,200);
 assert.equal(publicPack.body.day,2);
 assert.equal(publicPack.body.quiz.answers,undefined);
 assert.ok(publicPack.body.lesson.workedExample.includes('PLACEHOLDER — wacht op quizbank/vijfdagenplan'));
});

test('quiz rejects wrong answer arity and missing pack days with 400',async()=>{
 const {instance,host,participant}=fixture();
 const wrongLength=await invoke(instance.app,'/game/quiz',{body:{answers:[1,0]},cookies:{academy:participant.token}});
 assert.equal(wrongLength.statusCode,400);
 assert.match(wrongLength.body.error,/Beantwoord alle 3 vragen/);
 const changeDay=await invoke(instance.app,'/game/control',{body:{action:'day',value:3},cookies:{academy:host.token}});
 assert.equal(changeDay.statusCode,200);
 const missing=await invoke(instance.app,'/game/quiz',{body:{answers:[1,0,2]},cookies:{academy:participant.token}});
 assert.equal(missing.statusCode,400);
 assert.match(missing.body.error,/Geen contentpakket voor supportdag 3/);
 const publicMissing=await invoke(instance.app,'/game/day-pack',{cookies:{academy:participant.token}});
 assert.equal(publicMissing.statusCode,400);
});
