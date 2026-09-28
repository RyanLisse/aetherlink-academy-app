import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';

async function call(app,route,token,body={},params={}){
 const response={status:200};
 await app.router.stack.find(l=>l.route?.path===route).route.stack[0].handle(
  {headers:{authorization:'Bearer '+token},body,params},
  {json(payload){response.body=payload;}},
  e=>{response.status=e.status||500;response.body={error:e.message};}
 );
 return response;
}

function extractClaudeToken(instructions){
 const match=instructions.match(/Authorization: Bearer ([a-f0-9]{64})/);
 assert.ok(match,'claude instructions embed Authorization bearer');
 return match[1];
}

function extractCodexToken(instructions){
 const match=instructions.match(/export ACADEMY_MCP_[A-Z0-9_]+=\'([a-f0-9]{64})\'/);
 assert.ok(match,'codex instructions embed export env bearer');
 return match[1];
}

test('one-click setup binds participant and facilitator agents to their room role, never browser access',async()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'academy-agent-'));
 try{
 const {app,store}=createApp({dir,hostKey:'test',publicBaseUrl:'https://academy.example.test'});
 const host=store.create('Squad',{slug:'intent'}),alice=store.join(host.code,'Alice'),bob=store.join(host.code,'Bob');
 const facilitatorSetup=await call(app,'/game/agent-setup',host.token);assert.equal(facilitatorSetup.status,200);
 assert.equal(facilitatorSetup.body.client,'claude');
 assert.equal(facilitatorSetup.body.participantId,'facilitator');assert.equal(facilitatorSetup.body.role,'facilitator');assert.equal(facilitatorSetup.body.roomId,host.roomId);
 assert.match(facilitatorSetup.body.connectionHint,/Claude Code|existing Claude login/i);
 assert.match(facilitatorSetup.body.instructions,/session\.role=facilitator/);assert.match(facilitatorSetup.body.instructions,/pin_classroom_deck/);
 const facilitatorAccess=extractClaudeToken(facilitatorSetup.body.instructions);
 const facilitatorIdentity=store.auth(facilitatorAccess,'mcp');assert.equal(facilitatorIdentity.s.personId,'facilitator');assert.equal(facilitatorIdentity.r.id,host.roomId);assert.equal(facilitatorIdentity.p,undefined);
 const facilitatorMission=await call(app,'/game/mcp/:tool',facilitatorAccess,{},{tool:'get_mission'});assert.equal(facilitatorMission.body.session.role,'facilitator');assert.equal(facilitatorMission.body.session.roomId,host.roomId);
 assert.ok(store.data.rooms[host.roomId].facilitatorLastMcp,'facilitator successful tool call stamps facilitatorLastMcp');
 assert.ok(store.view(store.data.rooms[host.roomId],store.auth(host.token,'browser').s).me.lastMcp);
 const setup=await call(app,'/game/agent-setup',alice.token);assert.equal(setup.status,200);
 assert.equal(setup.body.client,'claude');
 const access=extractClaudeToken(setup.body.instructions);
 const identity=store.auth(access,'mcp');assert.equal(identity.p.name,'Alice');assert.equal(identity.r.id,setup.body.roomId);assert.equal(identity.p.id,setup.body.participantId);
 assert.throws(()=>store.auth(access,'browser'));
 const mission=await call(app,'/game/mcp/:tool',access,{},{tool:'get_mission'});
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

test('agent-setup supports Codex client with bearer env var instructions',async()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'academy-codex-'));
 try{
  const {app,store}=createApp({dir,hostKey:'test',publicBaseUrl:'https://academy.example.test'});
  const host=store.create('Squad',{slug:'intent'});
  const alice=store.join(host.code,'Alice');
  const bad=await call(app,'/game/agent-setup',alice.token,{client:'windsurf'});
  assert.equal(bad.status,400);
  const setup=await call(app,'/game/agent-setup',alice.token,{client:'codex'});
  assert.equal(setup.status,200);
  assert.equal(setup.body.client,'codex');
  assert.match(setup.body.connectionHint,/Codex reads the bearer|environment variable/i);
  assert.match(setup.body.instructions,/codex mcp add/);
  assert.match(setup.body.instructions,/--bearer-token-env-var/);
  assert.match(setup.body.instructions,/export ACADEMY_MCP_/);
  assert.doesNotMatch(setup.body.instructions,/claude mcp add/);
  assert.ok(!setup.body.instructions.includes(alice.token));
  const access=extractCodexToken(setup.body.instructions);
  const identity=store.auth(access,'mcp');
  assert.equal(identity.p.name,'Alice');
  assert.equal(identity.r.id,setup.body.roomId);
  const mission=await call(app,'/game/mcp/:tool',access,{},{tool:'get_mission'});
  assert.equal(mission.status,200);
  assert.equal(mission.body.session.participantId,setup.body.participantId);
  const facilitator=await call(app,'/game/agent-setup',host.token,{client:'codex'});
  assert.equal(facilitator.status,200);
  assert.equal(facilitator.body.client,'codex');
  assert.match(facilitator.body.instructions,/codex mcp add/);
  assert.match(facilitator.body.instructions,/session\.role=facilitator/);
  const facToken=extractCodexToken(facilitator.body.instructions);
  assert.equal(store.auth(facToken,'mcp').s.personId,'facilitator');
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('local preview does not mint an unusable remote setup',async()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'academy-local-'));
 try{
  const {app,store}=createApp({dir,hostKey:'test',publicBaseUrl:'http://127.0.0.1:4317'});
  const host=store.create('Squad',{slug:'intent'}),person=store.join(host.code,'Alice');
  assert.equal((await call(app,'/game/agent-setup',person.token)).status,409);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
