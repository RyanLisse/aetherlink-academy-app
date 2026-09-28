import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';

async function invoke(app,method,route,{body={},query={},params={},cookies={},bearer}={}){
 const layer=app.router.stack.find(candidate=>candidate.route?.path===route&&candidate.route.methods[method]);assert.ok(layer,`Missing ${method} ${route}`);
 const response={statusCode:200,headers:{},body:null,text:null};
 const req={method:method.toUpperCase(),body,query,params,headers:{cookie:Object.entries(cookies).map(([k,v])=>`${k}=${v}`).join('; '),...(bearer?{authorization:`Bearer ${bearer}`}:{})}};
 const res={status(s){response.statusCode=s;return this;},json(v){response.body=v;return this;},type(){return this;},set(k,v){response.headers[k.toLowerCase()]=v;return this;},send(v){response.text=v;return this;},end(){return this;}};
 await layer.route.stack[0].handle(req,res,error=>{response.statusCode=error.status||500;response.body={error:error.status?error.message:'Onverwachte serverfout.'};});
 return response;
}
function fixture(publicBaseUrl='http://127.0.0.1:4317'){
 const instance=createApp({dir:mkdtempSync(path.join(os.tmpdir(),'academy-slides-')),hostKey:'test-host',publicBaseUrl});
 const host=instance.store.create('Slides',{slug:'slides'});
 const participant=instance.store.join(host.code,'Deelnemer');
 return {instance,host,participant};
}

test('deck routes create, add, patch, export and delete within the squad session',async()=>{
 const {instance,host,participant}=fixture();
 const app=instance.app,cookies={academy:participant.token};
 const created=await invoke(app,'post','/game/decks',{body:{title:'Route deck'},cookies});
 assert.equal(created.statusCode,201);
 const deckId=created.body.id;
 const added=await invoke(app,'post','/game/decks/:deckId/slides',{body:{heading:'Eén',body:['a']},params:{deckId},cookies});
 assert.equal(added.statusCode,201);
 const listed=await invoke(app,'get','/game/decks',{cookies:{academy:host.token}});
 assert.equal(listed.body.decks[0].slideCount,1);
 const edited=await invoke(app,'patch','/game/decks/:deckId/slides/:slideId',{body:{edits:[{find:'Eén',replace:'Twee',expectedMatches:1}]},params:{deckId,slideId:added.body.slide.id},cookies});
 assert.equal(edited.statusCode,200);assert.equal(edited.body.changed,true);
 const bad=await invoke(app,'patch','/game/decks/:deckId',{body:{operations:[{op:'reorder-slides',slideIds:['nope']}]},params:{deckId},cookies});
 assert.equal(bad.statusCode,400);
 const exported=await invoke(app,'get','/game/decks/:deckId/export.html',{params:{deckId},cookies:{academy:host.token}});
 assert.equal(exported.statusCode,200);assert.match(exported.text,/Twee/);assert.match(exported.headers['content-disposition'],/route-deck\.html/);
 const forbidden=await invoke(app,'delete','/game/decks/:deckId',{params:{deckId},cookies:{academy:instance.store.join(host.code,'Ander').token}});
 assert.equal(forbidden.statusCode,403);
 const deleted=await invoke(app,'delete','/game/decks/:deckId',{params:{deckId},cookies:{academy:host.token}});
 assert.equal(deleted.statusCode,200);
 const gone=await invoke(app,'get','/game/decks/:deckId',{params:{deckId},cookies});
 assert.equal(gone.statusCode,404);
 const anonymous=await invoke(app,'get','/game/decks',{});
 assert.equal(anonymous.statusCode,401);
});

test('MCP deck tools run as the participant and register lastMcp',async()=>{
 const {instance,participant}=fixture();
 const app=instance.app;
 const mcp=await instance.store.rotateMcpToken(participant.token);
 const created=await invoke(app,'post','/game/mcp/:tool',{params:{tool:'create_deck'},body:{title:'Via MCP'},bearer:mcp.token});
 assert.equal(created.statusCode,200,JSON.stringify(created.body));
 const added=await invoke(app,'post','/game/mcp/:tool',{params:{tool:'add_slide'},body:{deckId:created.body.id,heading:'Agent',body:['x']},bearer:mcp.token});
 assert.equal(added.body.slide.textPreview,'Agent x');
 const listed=await invoke(app,'post','/game/mcp/:tool',{params:{tool:'list_decks'},body:{},bearer:mcp.token});
 assert.equal(listed.body.decks[0].createdBy.name,'Deelnemer');
 const html=await invoke(app,'post','/game/mcp/:tool',{params:{tool:'export_deck_html'},body:{deckId:created.body.id},bearer:mcp.token});
 assert.match(html.body.html,/<!DOCTYPE html>/);
 const {p}=instance.store.auth(mcp.token,'mcp');assert.ok(p.lastMcp);
 const browserToken=await invoke(app,'post','/game/mcp/:tool',{params:{tool:'list_decks'},body:{},bearer:participant.token});
 assert.equal(browserToken.statusCode,401);
});

test('facilitator agent setup issues a room-bound MCP token and exposes facilitator-only classroom pinning',async()=>{
 const {instance,host,participant}=fixture('https://academy.example');
 const app=instance.app;
 const setup=await invoke(app,'post','/game/agent-setup',{bearer:host.token});
 assert.equal(setup.statusCode,200,JSON.stringify(setup.body));
 assert.deepEqual({participantId:setup.body.participantId,role:setup.body.role,roomId:setup.body.roomId},{participantId:'facilitator',role:'facilitator',roomId:host.roomId});
 assert.equal(setup.body.expiresAt,instance.store.auth(host.token,'browser').s.expiresAt);
 assert.match(setup.body.instructions,/session\.role=facilitator/);
 assert.match(setup.body.instructions,/pin_classroom_deck/);
 const facilitatorToken=/Authorization: Bearer ([a-f0-9]+)/.exec(setup.body.instructions)?.[1];
 assert.ok(facilitatorToken,'private setup instructions contain the generated bearer');
 const facilitator=instance.store.auth(facilitatorToken,'mcp');
 assert.equal(facilitator.s.personId,'facilitator');assert.equal(facilitator.s.roomId,host.roomId);assert.equal(facilitator.p,undefined);
 assert.equal(facilitator.s.expiresAt,instance.store.auth(host.token,'browser').s.expiresAt);

 const mission=await invoke(app,'post','/game/mcp/:tool',{params:{tool:'get_mission'},bearer:facilitatorToken});
 assert.equal(mission.statusCode,200);assert.equal(mission.body.session.role,'facilitator');assert.equal(mission.body.session.roomId,host.roomId);
 assert.equal('participantId' in mission.body.session,false);
 const created=await invoke(app,'post','/game/mcp/:tool',{params:{tool:'create_deck'},body:{title:'Facilitator lesson'},bearer:facilitatorToken});
 assert.equal(created.statusCode,200,JSON.stringify(created.body));
 const added=await invoke(app,'post','/game/mcp/:tool',{params:{tool:'add_slide'},body:{deckId:created.body.id,heading:'Private notes',notes:'Facilitator-only note'},bearer:facilitatorToken});
 assert.equal(added.statusCode,200);
 const editInput={deckId:created.body.id,slideId:added.body.slide.id,edits:[{find:'Private notes',replace:'Facilitator notes',expectedMatches:1}],baseContentHash:added.body.slide.contentHash};
 const edit=await invoke(app,'post','/game/mcp/:tool',{params:{tool:'update_slide'},body:editInput,bearer:facilitatorToken});
 assert.equal(edit.statusCode,200);
 const staleEdit=await invoke(app,'post','/game/mcp/:tool',{params:{tool:'update_slide'},body:editInput,bearer:facilitatorToken});
 assert.equal(staleEdit.statusCode,409);
 const facilitatorRead=await invoke(app,'post','/game/mcp/:tool',{params:{tool:'get_deck'},body:{deckId:created.body.id},bearer:facilitatorToken});
 assert.equal(facilitatorRead.body.slides[0].notes,'Facilitator-only note');
 const participantToken=await instance.store.rotateMcpToken(participant.token);
 const participantRead=await invoke(app,'post','/game/mcp/:tool',{params:{tool:'get_deck'},body:{deckId:created.body.id},bearer:participantToken.token});
 assert.equal(participantRead.statusCode,200,'participants retain access to their squad decks');
 assert.equal('notes' in participantRead.body.slides[0],false,'facilitator notes stay private to learners');
 const participantCopy=await invoke(app,'post','/game/decks/:deckId/duplicate',{params:{deckId:created.body.id},cookies:{academy:participant.token}});
 assert.equal(participantCopy.statusCode,201);
 const copiedDeck=await invoke(app,'get','/game/decks/:deckId',{params:{deckId:participantCopy.body.id},cookies:{academy:participant.token}});
 assert.equal(copiedDeck.statusCode,200);
 assert.equal(copiedDeck.body.slides[0].notes,'','duplicating a facilitator deck drops its private speaker notes');
 const participantPublish=await invoke(app,'post','/game/mcp/:tool',{params:{tool:'pin_classroom_deck'},body:{deckId:created.body.id},bearer:participantToken.token});
 assert.equal(participantPublish.statusCode,403);
 assert.equal(instance.store.data.rooms[host.roomId].classroomOverlayByDay,undefined);
 const published=await invoke(app,'post','/game/mcp/:tool',{params:{tool:'pin_classroom_deck'},body:{deckId:created.body.id},bearer:facilitatorToken});
 assert.equal(published.statusCode,200,JSON.stringify(published.body));
 assert.deepEqual(published.body,{deckId:created.body.id,day:1,pinned:true});

 const replacement=await invoke(app,'post','/game/agent-setup',{bearer:host.token});
 const nextToken=/Authorization: Bearer ([a-f0-9]+)/.exec(replacement.body.instructions)?.[1];
 assert.ok(nextToken);assert.notEqual(nextToken,facilitatorToken);
 assert.throws(()=>instance.store.auth(facilitatorToken,'mcp'),/Geen geldige toegang/,'rotating access revokes the previous facilitator token');
 assert.equal(instance.store.auth(nextToken,'mcp').s.personId,'facilitator');
 const participantSetup=await invoke(app,'post','/game/agent-setup',{bearer:participant.token});
 assert.equal(participantSetup.statusCode,200);assert.equal(participantSetup.body.role,'participant');assert.equal(participantSetup.body.participantId,instance.store.auth(participant.token,'browser').p.id);
 for(const tool of ['submit_evidence','suggest_document','get_document','get_screen_state']){
  const denied=await invoke(app,'post','/game/mcp/:tool',{params:{tool},body:{},bearer:nextToken});
  assert.equal(denied.statusCode,403,`${tool} denied to facilitator`);
 }
 const invalidDay=await invoke(app,'post','/game/mcp/:tool',{params:{tool:'pin_classroom_deck'},body:{deckId:created.body.id,day:99},bearer:nextToken});
 assert.equal(invalidDay.statusCode,400);
 const other=instance.store.create('Other room',{slug:'other'});
 const otherMcp=await instance.store.rotateMcpToken(other.token);
 const otherDeck=await invoke(app,'post','/game/mcp/:tool',{params:{tool:'create_deck'},body:{title:'Other room deck'},bearer:otherMcp.token});
 assert.equal(otherDeck.statusCode,200);
 const crossRoomPublish=await invoke(app,'post','/game/mcp/:tool',{params:{tool:'pin_classroom_deck'},body:{deckId:otherDeck.body.id},bearer:nextToken});
 assert.equal(crossRoomPublish.statusCode,404);
 assert.deepEqual(instance.store.data.rooms[host.roomId].classroomOverlayByDay,{'1':created.body.id});
});
