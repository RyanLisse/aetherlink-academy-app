import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';

async function invoke(app,route,body,headers={}){
 const layer=app.router.stack.find(candidate=>candidate.route?.path===route);
 assert.ok(layer,`Missing route ${route}`);
 const response={statusCode:200,cookies:[],body:null};
 const req={body,query:{},headers};
 const res={cookie(name,value,options={}){response.cookies.push({name,value,options});return this;},status(code){response.statusCode=code;return this;},json(value){response.body=value;return this;}};
 await layer.route.stack[0].handle(req,res,error=>{response.statusCode=error.status||500;response.body={error:error.message};});
 return response;
}

test('personal access route exchanges a durable secret for a fresh browser session',async()=>{
 const instance=createApp({dir:mkdtempSync(path.join(os.tmpdir(),'academy-access-route-')),hostKey:'test-host',publicBaseUrl:'https://academy.example.test',chatConfig:null});
 instance.proof.create=async()=>({slug:'access-proof',editor:'editor'});
 const room=await instance.store.create('Access room',await instance.proof.create());
 const joined=await instance.store.join(room.code,'Alice');
 const result=await invoke(instance.app,'/game/participant/resume',{resumeToken:joined.resumeToken});
 assert.equal(result.statusCode,200);
 assert.equal(result.body.roomId,room.roomId);
 assert.equal(result.body.resumed,true);
 assert.equal('resumeToken' in result.body,false);
 assert.equal(result.cookies[0].name,'academy');
 assert.equal(result.cookies[0].options.httpOnly,true);
 assert.equal(result.cookies[0].options.sameSite,'strict');
 assert.equal(result.cookies[0].options.secure,true);
 assert.equal((await instance.store.auth(result.body.token,'browser')).p.name,'Alice');
});

test('an authenticated participant can mint a personal access link',async()=>{
 const instance=createApp({dir:mkdtempSync(path.join(os.tmpdir(),'academy-access-mint-')),hostKey:'test-host',publicBaseUrl:'https://academy.example.test',chatConfig:null});
 const room=await instance.store.create('Access room',{slug:'access-proof'});
 const joined=await instance.store.join(room.code,'Alice');
 delete instance.store.auth(joined.token).p.access;
 instance.store.save();
 const result=await invoke(instance.app,'/game/participant/access',{}, {authorization:`Bearer ${joined.token}`});
 assert.equal(result.statusCode,200);
 assert.match(result.body.resumeToken,/^[a-f0-9]{64}$/);
 assert.equal(instance.store.resumeParticipant(result.body.resumeToken).roomId,room.roomId);
});

test('personal access route rejects an unknown secret',async()=>{
 const instance=createApp({dir:mkdtempSync(path.join(os.tmpdir(),'academy-access-route-invalid-')),hostKey:'test-host',publicBaseUrl:'http://127.0.0.1:4317',chatConfig:null});
 const result=await invoke(instance.app,'/game/participant/resume',{resumeToken:'unknown-secret'});
 assert.equal(result.statusCode,401);
 assert.match(result.body.error,/persoonlijke deelnemerslink/);
 assert.equal(result.cookies.length,0);
});
