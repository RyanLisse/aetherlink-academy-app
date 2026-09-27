import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';
import {ARCADE_CATALOG} from '../server/arcade-catalog.mjs';

async function invoke(app,route,{body={},cookies={}}={}){
 const layer=app.router.stack.find(candidate=>candidate.route?.path===route);
 assert.ok(layer,`Missing route ${route}`);
 const response={statusCode:200,body:null};
 const req={body,query:{},headers:{cookie:Object.entries(cookies).map(([name,value])=>`${name}=${value}`).join('; ')}};
 const res={status(status){response.statusCode=status;return this;},json(value){response.body=value;return this;},end(){return this;}};
 await layer.route.stack[0].handle(req,res,error=>{response.statusCode=error.status||500;response.body={error:error.status?error.message:'Onverwachte serverfout.'};});
 return response;
}

function fixture(){
 const instance=createApp({dir:mkdtempSync(path.join(os.tmpdir(),'academy-room-lab-')),hostKey:'test-host',publicBaseUrl:'https://academy.example'});
 const host=instance.store.create('Lab room',{slug:'lab-room'});
 const ada=instance.store.join(host.code,'Ada');
 return {app:instance.app,store:instance.store,host,ada};
}

const as=token=>({cookies:{academy:token}});

test('lab catalog lists Arcade lessons without a raw URL paste surface',async()=>{
 const {app,host}=fixture();
 const catalog=await invoke(app,'/game/lab-catalog',as(host.token));
 assert.equal(catalog.statusCode,200);
 assert.equal(catalog.body.labs.length,ARCADE_CATALOG.length);
 assert.ok(catalog.body.labs.every(lab=>lab.id&&lab.title&&!String(lab.title).includes('http')));
 assert.ok(catalog.body.labs.some(lab=>lab.id==='sample-counter'));
});

test('facilitator assigns and opens a room lab; learners see it in day-pack; close hides it',async()=>{
 const {app,host,ada}=fixture();
 const assign=await invoke(app,'/game/control',{body:{action:'lab',value:{lessonId:'sample-counter',open:true}},...as(host.token)});
 assert.equal(assign.statusCode,200);
 assert.equal(assign.body.lab.id,'sample-counter');
 assert.equal(assign.body.lab.open,true);
 assert.equal(assign.body.labByDay['1'].id,'sample-counter');

 const openPack=await invoke(app,'/game/day-pack',as(ada.token));
 assert.equal(openPack.statusCode,200);
 assert.equal(openPack.body.labs.length,1);
 assert.equal(openPack.body.labs[0].id,'sample-counter');
 assert.match(openPack.body.labs[0].src,/\/arcade-lab\/\?lesson=sample-counter&embed=1/);

 const route=await invoke(app,'/game/day-route',as(ada.token));
 assert.equal(route.body.days.find(d=>d.day===1).labsTotal,1);

 const close=await invoke(app,'/game/control',{body:{action:'lab',value:{lessonId:'sample-counter',open:false}},...as(host.token)});
 assert.equal(close.body.lab.open,false);
 const closedPack=await invoke(app,'/game/day-pack',as(ada.token));
 assert.deepEqual(closedPack.body.labs,[]);
 assert.equal((await invoke(app,'/game/day-route',as(ada.token))).body.days.find(d=>d.day===1).labsTotal,0);
});

test('completion records for a room-assigned open lab',async()=>{
 const {app,host,ada}=fixture();
 await invoke(app,'/game/control',{body:{action:'lab',value:{lessonId:'ws-5-sdk-quickstart',open:true}},...as(host.token)});
 const first=await invoke(app,'/game/lab-complete',{body:{labId:'ws-5-sdk-quickstart',result:{outcome:'completed'},evidence:'done'},...as(ada.token)});
 assert.equal(first.statusCode,200);
 assert.equal(first.body.recorded,true);
 assert.equal(first.body.lab.source,'lab-reported');
 const state=await invoke(app,'/game/state',as(ada.token));
 assert.equal(state.body.me.progressByDay['1'].labs['ws-5-sdk-quickstart'].source,'lab-reported');
});

test('unknown lesson id and non-facilitator assign fail closed',async()=>{
 const {app,host,ada}=fixture();
 assert.equal((await invoke(app,'/game/control',{body:{action:'lab',value:{lessonId:'not-a-lesson'}},...as(host.token)})).statusCode,400);
 assert.equal((await invoke(app,'/game/control',{body:{action:'lab',value:{lessonId:'sample-counter'}},...as(ada.token)})).statusCode,403);
 const clear=await invoke(app,'/game/control',{body:{action:'lab',value:{lessonId:null}},...as(host.token)});
 assert.equal(clear.statusCode,200);
 assert.equal(clear.body.lab,null);
});
