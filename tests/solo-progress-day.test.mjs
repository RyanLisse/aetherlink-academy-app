import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';
import {getDayPack} from '../server/content.mjs';

async function invoke(app,route,{body={},query={},cookies={},method}={}){
 const layer=app.router.stack.find(candidate=>candidate.route?.path===route);assert.ok(layer,`Missing route ${route}`);
 const response={statusCode:200,headers:{},cookies:[],body:null};
 const req={body,query,headers:{cookie:Object.entries(cookies).map(([name,value])=>`${name}=${value}`).join('; ')}};
 const res={cookie(name,value,options={}){response.cookies.push(`${name}=${encodeURIComponent(value)}${options.path?`; Path=${options.path}`:''}`);return this;},clearCookie(){return this;},redirect(status,location){response.statusCode=status;response.headers.location=location;return this;},status(status){response.statusCode=status;return this;},json(value){response.body=value;return this;},end(){return this;}};
 await layer.route.stack[0].handle(req,res,error=>{response.statusCode=error.status||500;response.body={error:error.status?error.message:'Onverwachte serverfout.'};});
 return response;
}

function fixture(){
 const instance=createApp({dir:mkdtempSync(path.join(os.tmpdir(),'academy-solo-progress-')),hostKey:'test-host',publicBaseUrl:'http://127.0.0.1:4320'});
 const host=instance.store.create('Solo progress',{slug:'solo-progress'});
 const participant=instance.store.join(host.code,'Deelnemer');
 instance.proof.comment=async()=>({ok:true});
 instance.proof.state=async()=>({markdown:'# Intent\nDoel',marks:{}});
 return {instance,host,participant};
}

test('get_mission returns day 1 ATLAS-REVIEW-01 and day 2 ATLAS-CONTEXT-02',async()=>{
 const {instance,host,participant}=fixture();
 const mcp=instance.store.session(instance.store.auth(participant.token).r.id,instance.store.auth(participant.token).p.id,'mcp');
 const day1=await invoke(instance.app,'/game/mcp/:tool',{body:{},cookies:{},query:{}});
 // invoke with :tool param — use execute via layer differently
 const layer=instance.app.router.stack.find(c=>c.route?.path==='/game/mcp/:tool');
 assert.ok(layer);
 async function mcpCall(tool){
  const response={statusCode:200,body:null};
  const req={params:{tool},body:{},headers:{authorization:'Bearer '+mcp}};
  const res={status(s){response.statusCode=s;return this;},json(v){response.body=v;return this;}};
  await layer.route.stack[0].handle(req,res,e=>{response.statusCode=e.status||500;response.body={error:e.message};});
  return response;
 }
 const first=await mcpCall('get_mission');
 assert.equal(first.statusCode,200);
 assert.equal(first.body.mission.id,'ATLAS-REVIEW-01');
 assert.equal(first.body.day,1);
 const change=await invoke(instance.app,'/game/control',{body:{action:'day',value:2},cookies:{academy:host.token}});
 assert.equal(change.statusCode,200);
 const second=await mcpCall('get_mission');
 assert.equal(second.statusCode,200);
 assert.equal(second.body.mission.id,'ATLAS-CONTEXT-02');
 assert.equal(second.body.day,2);
 assert.equal(second.body.mission.title,getDayPack(2).mission.title);
});

test('day 2 quiz does not overwrite day 1 progressByDay quiz record',async()=>{
 const {instance,host,participant}=fixture();
 const q1=await invoke(instance.app,'/game/quiz',{body:{answers:[1,0,2]},cookies:{academy:participant.token}});
 assert.equal(q1.statusCode,200);
 assert.equal(q1.body.score,3);
 const after1=instance.store.auth(participant.token).p;
 assert.equal(after1.progressByDay['1'].quizScore,3);
 assert.equal(after1.progressByDay['1'].route,'stretch');
 await invoke(instance.app,'/game/control',{body:{action:'day',value:2},cookies:{academy:host.token}});
 const q2=await invoke(instance.app,'/game/quiz',{body:{answers:[0,0,1]},cookies:{academy:participant.token}});
 assert.equal(q2.statusCode,200);
 assert.equal(q2.body.score,0);
 assert.equal(q2.body.route,'guided');
 const after2=instance.store.auth(participant.token).p;
 assert.equal(after2.progressByDay['1'].quizScore,3);
 assert.equal(after2.progressByDay['1'].route,'stretch');
 assert.equal(after2.progressByDay['2'].quizScore,0);
 assert.equal(after2.progressByDay['2'].route,'guided');
 assert.equal(after2.quiz.day,2);
 assert.equal(after2.quiz.score,0);
});

test('evidence stamps room.day and Route progress reflects quiz+evidence per day',async()=>{
 const {instance,host,participant}=fixture();
 await invoke(instance.app,'/game/quiz',{body:{answers:[1,0,2]},cookies:{academy:participant.token}});
 const ev=await invoke(instance.app,'/game/evidence',{body:{requestId:'ev-day1',finding:'README wijkt af van package.json',command:'node --test',observed:'1 failing',limitation:'Nog geen tweede lezer'},cookies:{academy:participant.token}});
 assert.equal(ev.statusCode,200);
 assert.equal(ev.body.day,1);
 const route1=await invoke(instance.app,'/game/day-route',{cookies:{academy:participant.token}});
 assert.equal(route1.statusCode,200);
 assert.equal(route1.body.days[0].progress.hasQuiz,true);
 assert.equal(route1.body.days[0].progress.quizScore,3);
 assert.equal(route1.body.days[0].progress.hasEvidence,true);
 assert.equal(route1.body.days[0].progress.evidenceCount,1);
 assert.equal(route1.body.days[1].progress.hasQuiz,false);
 assert.equal(route1.body.days[1].progress.hasEvidence,false);
 await invoke(instance.app,'/game/control',{body:{action:'day',value:2},cookies:{academy:host.token}});
 await invoke(instance.app,'/game/quiz',{body:{answers:getDayPack(2).quiz.answers},cookies:{academy:participant.token}});
 const ev2=await invoke(instance.app,'/game/evidence',{body:{requestId:'ev-day2',finding:'Capability-map gekoppeld aan CLAUDE.md',command:'node --test',observed:'ok',limitation:'Nog geen peer-check'},cookies:{academy:participant.token}});
 assert.equal(ev2.body.day,2);
 const route2=await invoke(instance.app,'/game/day-route',{cookies:{academy:participant.token}});
 assert.equal(route2.body.day,2);
 assert.equal(route2.body.days[0].progress.quizScore,3);
 assert.equal(route2.body.days[0].progress.evidenceCount,1);
 assert.equal(route2.body.days[1].progress.quizScore,3);
 assert.equal(route2.body.days[1].progress.hasEvidence,true);
 assert.equal(route2.body.days[1].progress.route,'stretch');
});

test('day pack exposes mission and reviewCriteria for Solo/Review UI',async()=>{
 const {instance,host,participant}=fixture();
 const d1=await invoke(instance.app,'/game/day-pack',{cookies:{academy:participant.token}});
 assert.equal(d1.body.mission.id,'ATLAS-REVIEW-01');
 assert.ok(Array.isArray(d1.body.reviewCriteria));
 assert.ok(d1.body.mission.starterFiles.includes('README.md'));
 await invoke(instance.app,'/game/control',{body:{action:'day',value:2},cookies:{academy:host.token}});
 const d2=await invoke(instance.app,'/game/day-pack',{cookies:{academy:participant.token}});
 assert.equal(d2.body.mission.id,'ATLAS-CONTEXT-02');
 assert.match(d2.body.mission.starterNote,/zelfde starterbestanden/);
 assert.ok(d2.body.reviewCriteria.some(c=>c.includes('PLACEHOLDER')));
});
