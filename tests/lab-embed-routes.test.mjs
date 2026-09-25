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
const LABS={
 1:[
  {id:'sample-counter',src:'/arcade-lab/?lesson=sample-counter&embed=1',title:'Arcade · click counter'},
  {id:'partner-lab',src:'https://labs.example/lab?x=1',title:'Partner lab'},
  {id:'rogue-lab',src:'https://rogue.example/lab',title:'Not allowlisted'},
 ],
 2:[{id:'ws-2-eve-state',src:'/arcade-lab/?lesson=ws-2-eve-state&embed=1',title:'Arcade · state'}],
};

function fixture(){
 const instance=createApp({dir:mkdtempSync(path.join(os.tmpdir(),'academy-lab-embed-')),hostKey:'test-host',publicBaseUrl:'https://academy.example',labOrigins:'https://labs.example, *',labsForDay:day=>LABS[day]});
 const host=instance.store.create('Labs',{slug:'labs'});
 const ada=instance.store.join(host.code,'Ada');
 const bo=instance.store.join(host.code,'Bo');
 return {app:instance.app,host,ada,bo};
}

const complete=(app,token,body)=>invoke(app,'/game/lab-complete',{body,cookies:{academy:token}});
const me=async(app,token)=>(await invoke(app,'/game/state',{cookies:{academy:token}})).body.me;

test('day pack lists only labs whose origin is on the server allowlist',async()=>{
 const {app,ada}=fixture();
 const pack=await invoke(app,'/game/day-pack',{cookies:{academy:ada.token}});
 assert.equal(pack.statusCode,200);
 assert.deepEqual(pack.body.labs,[
  {id:'sample-counter',src:'https://academy.example/arcade-lab/?lesson=sample-counter&embed=1',origin:'https://academy.example',title:'Arcade · click counter',config:{},gradedStops:[]},
  {id:'partner-lab',src:'https://labs.example/lab?x=1',origin:'https://labs.example',title:'Partner lab',config:{},gradedStops:[]},
 ]);
});

test('lab completion is recorded once as reported by the lab',async()=>{
 const {app,ada}=fixture();
 const first=await complete(app,ada.token,{labId:'sample-counter',result:{outcome:'completed',score:{value:1,max:1}},evidence:'1/1 checkpoints'});
 assert.equal(first.statusCode,200);
 assert.equal(first.body.recorded,true);
 assert.equal(first.body.lab.source,'lab-reported');
 const again=await complete(app,ada.token,{labId:'sample-counter',result:{outcome:'completed'},evidence:'replayed'});
 assert.equal(again.statusCode,200);
 assert.equal(again.body.recorded,false);
 assert.equal(again.body.lab.evidence,'1/1 checkpoints');
 assert.equal(again.body.lab.at,first.body.lab.at);
 const saved=(await me(app,ada.token)).progressByDay['1'].labs;
 assert.deepEqual(Object.keys(saved),['sample-counter']);
 assert.deepEqual(saved['sample-counter'],{source:'lab-reported',result:{outcome:'completed',score:{value:1,max:1}},evidence:'1/1 checkpoints',at:first.body.lab.at});
 const route=await invoke(app,'/game/day-route',{cookies:{academy:ada.token}});
 const day1=route.body.days.find(d=>d.day===1);
 assert.equal(day1.labsTotal,2);
 assert.equal(day1.progress.labsCompleted,1);
});

test('unknown, off-day, non-allowlisted and malformed labs fail closed',async()=>{
 const {app,ada}=fixture();
 const result={outcome:'completed'};
 assert.equal((await complete(app,ada.token,{labId:'made-up',result})).statusCode,404);
 assert.equal((await complete(app,ada.token,{labId:'ws-2-eve-state',result})).statusCode,404);
 assert.equal((await complete(app,ada.token,{labId:'rogue-lab',result})).statusCode,404);
 assert.equal((await complete(app,ada.token,{labId:'sample-counter',result:{outcome:'passed'}})).statusCode,400);
 assert.equal((await complete(app,ada.token,{labId:'sample-counter'})).statusCode,400);
 assert.equal((await me(app,ada.token)).progressByDay['1'],undefined);
});

test('completion writes only the caller’s own progress',async()=>{
 const {app,host,ada,bo}=fixture();
 assert.equal((await complete(app,undefined,{labId:'sample-counter',result:{outcome:'completed'}})).statusCode,401);
 assert.equal((await complete(app,host.token,{labId:'sample-counter',result:{outcome:'completed'}})).statusCode,403);
 const boMe=await me(app,bo.token);
 const done=await complete(app,ada.token,{labId:'partner-lab',result:{outcome:'completed'},participantId:boMe.id});
 assert.equal(done.body.recorded,true);
 assert.deepEqual(Object.keys((await me(app,ada.token)).progressByDay['1'].labs),['partner-lab']);
 assert.equal((await me(app,bo.token)).progressByDay['1'],undefined);
 const boFirst=await complete(app,bo.token,{labId:'partner-lab',result:{outcome:'completed'}});
 assert.equal(boFirst.body.recorded,true);
});
