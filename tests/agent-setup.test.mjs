import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';
async function call(app,route,token,params={}){const response={status:200};await app.router.stack.find(l=>l.route?.path===route).route.stack[0].handle({headers:{authorization:'Bearer '+token},body:{},params},{json(body){response.body=body;}},e=>{response.status=e.status||500;});return response;}
test('one-click setup binds the agent to its participant and squad, never facilitator or browser access',async()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'academy-agent-'));
 try{
 const {app,store}=createApp({dir,hostKey:'test',publicBaseUrl:'https://academy.example.test'});
 const host=store.create('Squad',{slug:'intent'}),alice=store.join(host.code,'Alice'),bob=store.join(host.code,'Bob');
 assert.equal((await call(app,'/game/agent-setup',host.token)).status,403);
 const setup=await call(app,'/game/agent-setup',alice.token);assert.equal(setup.status,200);
 const access=setup.body.instructions.match(/Authorization: Bearer ([a-f0-9]{64})/)[1];
 const identity=store.auth(access,'mcp');assert.equal(identity.p.name,'Alice');assert.equal(identity.r.id,setup.body.roomId);assert.equal(identity.p.id,setup.body.participantId);
 assert.throws(()=>store.auth(access,'browser'));
 const mission=await call(app,'/game/mcp/:tool',access,{tool:'get_mission'});
 assert.equal(mission.body.session.participantId,setup.body.participantId);assert.equal(mission.body.session.roomId,setup.body.roomId);
 assert.match(setup.body.instructions,/--scope local/);assert.ok(!setup.body.instructions.includes(alice.token));
 assert.match(setup.body.instructions,/create_deck/);
 assert.match(setup.body.instructions,/Classroom-overlay|Classroom overlay/);
 assert.match(setup.body.instructions,/geen CLASSROOM_DECK_ID|no CLASSROOM_DECK_ID/);
 assert.doesNotMatch(setup.body.instructions,/docs\.google\.com\/presentation/);
 assert.ok(setup.body.expiresAt>Date.now());
 const other=await call(app,'/game/agent-setup',bob.token);assert.notEqual(other.body.participantId,setup.body.participantId);
 assert.equal(store.auth(access,'mcp').p.name,'Alice');
 await call(app,'/game/agent-setup',alice.token);assert.throws(()=>store.auth(access,'mcp'));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('local preview does not mint an unusable remote setup',async()=>{const dir=mkdtempSync(path.join(os.tmpdir(),'academy-local-'));try{const {app,store}=createApp({dir,hostKey:'test',publicBaseUrl:'http://127.0.0.1:4317'});const host=store.create('Squad',{slug:'intent'}),person=store.join(host.code,'Alice');assert.equal((await call(app,'/game/agent-setup',person.token)).status,409);}finally{rmSync(dir,{recursive:true,force:true});}});
