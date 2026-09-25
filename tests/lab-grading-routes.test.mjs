import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';

async function invoke(app,route,{body={},cookies={}}={}){
 const layer=app.router.stack.find(candidate=>candidate.route?.path===route);assert.ok(layer,`Missing route ${route}`);
 const response={statusCode:200,body:null};
 const req={body,query:{},headers:{cookie:Object.entries(cookies).map(([name,value])=>`${name}=${value}`).join('; ')}};
 const res={status(status){response.statusCode=status;return this;},json(value){response.body=value;return this;},end(){return this;}};
 await layer.route.stack[0].handle(req,res,error=>{response.statusCode=error.status||500;response.body={error:error.status?error.message:'Onverwachte serverfout.'};});
 return response;
}

// Synthetic lab declarations: production day packs declare no labs yet.
const LABS={1:[
 {id:'ws-2-eve-state',src:'/arcade-lab/?lesson=ws-2-eve-state&embed=1',title:'Arcade · state'},
 {id:'sample-counter',src:'/arcade-lab/?lesson=sample-counter&embed=1',title:'Arcade · click counter'},
],2:[{id:'ws-1-eve-weather',src:'/arcade-lab/?lesson=ws-1-eve-weather&embed=1',title:'Arcade · weather'}]};
// ws-2-eve-state stop-2 and ws-1-eve-weather stop-3 are the lessons' real knowledge checks. The match key is synthetic, with a marker to find leaks.
const MARKER='KEY-MARKER-7f3a';
const KEYS={
 'ws-2-eve-state':{'stop-1':{kind:'match',includes:MARKER},'stop-2':{kind:'choice',correct:1}},
 'ws-1-eve-weather':{'stop-3':{kind:'choice',correct:1}},
};

function fixture(){
 const instance=createApp({dir:mkdtempSync(path.join(os.tmpdir(),'academy-lab-grading-')),hostKey:'test-host',publicBaseUrl:'https://academy.example',labsForDay:day=>LABS[day],labKeys:KEYS});
 const host=instance.store.create('Graded labs',{slug:'graded-labs'});
 return {app:instance.app,host,ada:instance.store.join(host.code,'Ada'),bo:instance.store.join(host.code,'Bo')};
}

const as=token=>({cookies:{academy:token}});
const answer=(app,token,body)=>invoke(app,'/game/lab-answer',{body,...as(token)});
const complete=(app,token,labId)=>invoke(app,'/game/lab-complete',{body:{labId,result:{outcome:'completed',score:{value:9,max:9}},evidence:'lab says done'},...as(token)});
const me=async(app,token)=>(await invoke(app,'/game/state',as(token))).body.me;

test('the day pack names graded stops but carries no answer key',async()=>{
 const {app,ada}=fixture();
 const pack=await invoke(app,'/game/day-pack',as(ada.token));
 assert.deepEqual(pack.body.labs.map(lab=>[lab.id,lab.gradedStops]),[['ws-2-eve-state',['stop-1','stop-2']],['sample-counter',[]]]);
 await answer(app,ada.token,{labId:'ws-2-eve-state',stopId:'stop-1',answer:`my answer has ${MARKER}`});
 await answer(app,ada.token,{labId:'ws-2-eve-state',stopId:'stop-2',answer:0});
 await answer(app,ada.token,{labId:'ws-2-eve-state',stopId:'stop-2',answer:1});
 const payloads=[
  pack.body,
  (await invoke(app,'/game/day-route',as(ada.token))).body,
  (await answer(app,ada.token,{labId:'ws-2-eve-state',stopId:'stop-2',answer:0})).body,
  (await complete(app,ada.token,'ws-2-eve-state')).body,
 ];
 const state=(await invoke(app,'/game/state',as(ada.token))).body;
 for(const payload of payloads)assert.doesNotMatch(JSON.stringify(payload),/KEY-MARKER|"correct"|"includes"|"kind":"(choice|match)"/,'no browser-bound payload carries a key');
 assert.doesNotMatch(JSON.stringify(state),/"correct"|"includes"|"kind":"(choice|match)"/,'state carries no key');
 assert.equal(JSON.stringify(state).includes(MARKER),false,'the participant’s submitted text is not stored either');
});

test('a wrong answer is recorded as failed with attempts counted, and a pass freezes the record',async()=>{
 const {app,ada}=fixture();
 const wrong=await answer(app,ada.token,{labId:'ws-2-eve-state',stopId:'stop-2',answer:0});
 assert.equal(wrong.statusCode,200);
 assert.deepEqual({...wrong.body,stop:{...wrong.body.stop,at:'<at>'}},{recorded:true,day:1,labId:'ws-2-eve-state',stop:{stopId:'stop-2',passed:false,attempts:1,at:'<at>',source:'server-graded'}});
 const again=await answer(app,ada.token,{labId:'ws-2-eve-state',stopId:'stop-2',answer:0});
 assert.equal(again.body.stop.attempts,2);
 assert.equal(again.body.stop.passed,false);
 const right=await answer(app,ada.token,{labId:'ws-2-eve-state',stopId:'stop-2',answer:1});
 assert.equal(right.body.stop.passed,true);
 assert.equal(right.body.stop.attempts,3);
 const after=await answer(app,ada.token,{labId:'ws-2-eve-state',stopId:'stop-2',answer:0});
 assert.equal(after.body.recorded,false);
 assert.deepEqual(after.body.stop,right.body.stop);
 assert.deepEqual((await me(app,ada.token)).progressByDay['1'].labStops,{'ws-2-eve-state':{'stop-2':right.body.stop}});
 const text=await answer(app,ada.token,{labId:'ws-2-eve-state',stopId:'stop-1',answer:'nothing useful'});
 assert.equal(text.body.stop.passed,false);
});

test('completion is refused until every graded stop has passed, then recorded as server-graded',async()=>{
 const {app,ada}=fixture();
 const early=await complete(app,ada.token,'ws-2-eve-state');
 assert.equal(early.statusCode,409);
 assert.equal(early.body.error,'Nog niet alle beoordeelde stops gehaald (0/2).');
 await answer(app,ada.token,{labId:'ws-2-eve-state',stopId:'stop-2',answer:1});
 await answer(app,ada.token,{labId:'ws-2-eve-state',stopId:'stop-1',answer:`see ${MARKER}`});
 const done=await complete(app,ada.token,'ws-2-eve-state');
 assert.equal(done.statusCode,200);
 assert.deepEqual({...done.body.lab,at:'<at>'},{source:'server-graded',result:{outcome:'completed',score:{value:2,max:2}},evidence:'lab says done',at:'<at>'});
 const ungraded=await complete(app,ada.token,'sample-counter');
 assert.equal(ungraded.body.lab.source,'lab-reported');
 assert.deepEqual(ungraded.body.lab.result,{outcome:'completed',score:{value:9,max:9}});
 const day1=(await invoke(app,'/game/day-route',as(ada.token))).body.days.find(d=>d.day===1);
 assert.equal(day1.progress.labsCompleted,2);
});

test('answers fail closed and write only the caller’s own progress',async()=>{
 const {app,host,ada,bo}=fixture();
 const body={labId:'ws-2-eve-state',stopId:'stop-2',answer:1};
 assert.equal((await answer(app,undefined,body)).statusCode,401);
 assert.equal((await answer(app,host.token,body)).statusCode,403);
 assert.equal((await answer(app,ada.token,{...body,stopId:'stop-9'})).statusCode,404,'undeclared stop');
 assert.equal((await answer(app,ada.token,{...body,labId:'sample-counter',stopId:'stop-1'})).statusCode,404,'lab without keys');
 assert.equal((await answer(app,ada.token,{labId:'ws-1-eve-weather',stopId:'stop-3',answer:1})).statusCode,404,'another day’s lab');
 assert.equal((await answer(app,ada.token,{...body,answer:{index:1}})).statusCode,400);
 assert.equal((await me(app,ada.token)).progressByDay['1'],undefined);
 const boId=(await me(app,bo.token)).id;
 assert.equal((await answer(app,ada.token,{...body,answer:0,participantId:boId})).body.stop.attempts,1);
 assert.equal((await me(app,bo.token)).progressByDay['1'],undefined,'Bo is untouched');
 const boFirst=await answer(app,bo.token,body);
 assert.equal(boFirst.body.stop.attempts,1,'Bo’s attempts count from zero');
 assert.equal(boFirst.body.stop.passed,true);
 assert.equal((await me(app,ada.token)).progressByDay['1'].labStops['ws-2-eve-state']['stop-2'].passed,false,'Ada still has to pass herself');
 assert.equal((await complete(app,ada.token,'ws-2-eve-state')).statusCode,409);
});

test('the server refuses to start with a malformed answer key',()=>{
 assert.throws(()=>createApp({dir:mkdtempSync(path.join(os.tmpdir(),'academy-lab-grading-')),hostKey:'test-host',publicBaseUrl:'https://academy.example',labKeys:{'ws-2-eve-state':{'stop-2':{kind:'choice',correct:'1'}}}}),/choice needs a non-negative integer correct/);
});
