import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {Client,StreamableHTTPClientTransport} from '@modelcontextprotocol/client';
import {createApp} from '../server/app.mjs';
import {createScreenStore} from '../server/screen-state.mjs';

const TAB_A='11111111-1111-4111-8111-111111111111';
const TAB_A2='22222222-2222-4222-8222-222222222222';
const TAB_B='33333333-3333-4333-8333-333333333333';
const DECK='44444444-4444-4444-8444-444444444444';

async function gateway(){
 const reservation=http.createServer();await new Promise(r=>reservation.listen(0,'127.0.0.1',r));const port=reservation.address().port;await new Promise(r=>reservation.close(r));
 const dir=mkdtempSync(path.join(os.tmpdir(),'academy-screen-'));const instance=createApp({dir,hostKey:'test-host',publicBaseUrl:`https://127.0.0.1:${port}`});
 await new Promise(r=>instance.server.listen(port,'127.0.0.1',r));
 const base=`http://127.0.0.1:${port}`,clients=[];
 const headers=token=>({host:`127.0.0.1:${port}`,...(token?{authorization:'Bearer '+token}:{})});
 const post=(route,token,body)=>fetch(base+route,{method:'POST',headers:{...headers(token),'content-type':'application/json'},body:JSON.stringify(body)});
 const connect=async token=>{const c=new Client({name:'screen-test',version:'1'});await c.connect(new StreamableHTTPClientTransport(new URL(base+'/mcp'),{requestInit:{headers:headers(token)}}));clients.push(c);return c;};
 const screen=async c=>{const result=await c.callTool({name:'get_screen_state',arguments:{}});const text=result.content[0].text;return result.isError?{error:text}:JSON.parse(text);};
 const participant=(room,name)=>{const joined=instance.store.join(room.code,name);const {r,p}=instance.store.auth(joined.token);return {browser:joined.token,mcp:instance.store.session(r.id,p.id,'mcp'),id:p.id,roomId:r.id};};
 const close=async()=>{for(const c of clients)await c.close();await new Promise(r=>instance.server.close(r));rmSync(dir,{recursive:true,force:true});};
 return {instance,post,connect,screen,participant,close};
}

const expected=(roomId,overrides={})=>({lessonId:null,route:'squad',slideIndex:0,viewedRevision:null,latestPublishedRevision:null,assignmentId:null,proof:{open:true,section:null},quiz:null,room:{id:roomId,phase:'lesson',releasedLessonIds:['day-1']},browserSessionId:TAB_A,...overrides});

test('public /mcp lists get_screen_state and returns the caller\'s live screen after a heartbeat',async()=>{
 const g=await gateway();
 try{
  const room=g.instance.store.create('Squad',{slug:'s'}),ann=g.participant(room,'Ann');
  const c=await g.connect(ann.mcp);
  assert.ok((await c.listTools()).tools.some(t=>t.name==='get_screen_state'),'get_screen_state is listed on the public /mcp');
  assert.deepEqual(await g.screen(c),{error:'No active browser view for this participant. Open the follow view first.'});
  assert.equal((await g.post('/game/screen-state',ann.browser,{tabId:TAB_A,view:'squad'})).status,204);
  assert.deepEqual(await g.screen(c),expected(room.roomId));
  assert.equal((await g.post('/game/screen-state',ann.browser,{tabId:TAB_A,view:'lesson'})).status,204);
  assert.deepEqual(await g.screen(c),expected(room.roomId,{lessonId:'day-1',route:'lesson',proof:{open:false,section:null},quiz:{id:'day-1-quiz',status:'idle',itemIndex:null}}));
  assert.equal((await g.post('/game/screen-state',ann.browser,{tabId:TAB_A,view:'decks',deckId:DECK,slideIndex:2,slideId:'s3'})).status,204);
  assert.deepEqual(await g.screen(c),expected(room.roomId,{route:`decks/${DECK}`,slideIndex:2,proof:{open:false,section:null}}));
 }finally{await g.close();}
});

test('release filter is cumulative and a naslag heartbeat for an unreleased day is refused',async()=>{
 const g=await gateway();
 try{
  const room=g.instance.store.create('Squad',{slug:'s'}),ann=g.participant(room,'Ann');
  const c=await g.connect(ann.mcp);
  const setDay=async day=>assert.equal((await g.post('/game/control',room.token,{action:'day',value:day})).status,200);
  await g.post('/game/screen-state',ann.browser,{tabId:TAB_A,view:'squad'});
  await setDay(2);
  assert.deepEqual((await g.screen(c)).room,{id:room.roomId,phase:'lesson',releasedLessonIds:['day-1']},'day-1 stays released once the room is on day 2');
  await g.post('/game/screen-state',ann.browser,{tabId:TAB_A,view:'lesson'});
  assert.equal((await g.screen(c)).lessonId,'day-2');
  assert.deepEqual((await g.screen(c)).room.releasedLessonIds,['day-1','day-2']);
  await setDay(5);await setDay(3);
  assert.equal((await g.post('/game/screen-state',ann.browser,{tabId:TAB_A,view:'naslag',day:4})).status,204);
  assert.deepEqual(await g.screen(c),expected(room.roomId,{lessonId:'day-4',route:'naslag',proof:{open:false,section:null},quiz:{id:'day-4-quiz',status:'idle',itemIndex:null},room:{id:room.roomId,phase:'lesson',releasedLessonIds:['day-1','day-2','day-3','day-4','day-5']}}));
  const refused=await g.post('/game/screen-state',ann.browser,{tabId:TAB_A,view:'naslag',day:6});
  assert.equal(refused.status,403);
  assert.deepEqual(await refused.json(),{error:'Deze dag is nog niet vrijgegeven.'});
  assert.equal((await g.screen(c)).lessonId,'day-4','the refused heartbeat did not replace the last served view');
 }finally{await g.close();}
});

test('a participant token reads only its own participant\'s screen',async()=>{
 const g=await gateway();
 try{
  const room=g.instance.store.create('Squad',{slug:'s'}),other=g.instance.store.create('Other',{slug:'o'});
  const ann=g.participant(room,'Ann'),bob=g.participant(room,'Bob'),eve=g.participant(other,'Eve');
  const [ca,cb,ce]=await Promise.all([g.connect(ann.mcp),g.connect(bob.mcp),g.connect(eve.mcp)]);
  await g.post('/game/screen-state',ann.browser,{tabId:TAB_A,view:'squad'});
  assert.deepEqual(await g.screen(cb),{error:'No active browser view for this participant. Open the follow view first.'});
  assert.deepEqual(await g.screen(ce),{error:'No active browser view for this participant. Open the follow view first.'});
  await g.post('/game/screen-state',bob.browser,{tabId:TAB_B,view:'decks',deckId:DECK,slideIndex:0,slideId:'s1'});
  assert.deepEqual(await g.screen(ca),expected(room.roomId));
  assert.deepEqual(await g.screen(cb),expected(room.roomId,{route:`decks/${DECK}`,proof:{open:false,section:null},browserSessionId:TAB_B}));
  await g.post('/game/screen-state',ann.browser,{tabId:TAB_A2,view:'lesson'});
  assert.deepEqual(await g.screen(ca),{error:'Multiple browser tabs report different view context (lesson, slide, assignment, Proof, quiz or room phase). Select one tab and retry.'});
 }finally{await g.close();}
});

test('missing, invalid and wrong-kind tokens are rejected on both the MCP read and the heartbeat',async()=>{
 const g=await gateway();
 try{
  const room=g.instance.store.create('Squad',{slug:'s'}),ann=g.participant(room,'Ann');
  const call={jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'get_screen_state',arguments:{}}};
  for(const token of [undefined,'invalid',ann.browser])assert.equal((await g.post('/mcp',token,call)).status,401);
  for(const token of [undefined,'invalid',ann.mcp])assert.equal((await g.post('/game/screen-state',token,{tabId:TAB_A,view:'squad'})).status,401);
  assert.deepEqual(await (await g.post('/game/screen-state',room.token,{tabId:TAB_A,view:'squad'})).json(),{error:'Alleen deelnemers melden hun scherm.'});
  assert.equal((await g.post('/game/screen-state',ann.browser,{tabId:'not-a-tab',view:'squad'})).status,400);
  assert.equal((await g.post('/game/screen-state',ann.browser,{tabId:TAB_A,view:'facilitator'})).status,400);
  assert.equal((await g.post('/game/screen-state',ann.browser,{tabId:TAB_A,view:'decks',deckId:'../x',slideIndex:0})).status,400);
 }finally{await g.close();}
});

test('the Redis screen store shares heartbeats per participant and caps tabs',async()=>{
 const hashes=new Map(),ttl=new Map();
 const redis={
  async hexists(k,f){return hashes.get(k)?.has(f)?1:0;},
  async hlen(k){return hashes.get(k)?.size||0;},
  async del(k){hashes.delete(k);},
  async hset(k,f,v){if(!hashes.has(k))hashes.set(k,new Map());hashes.get(k).set(f,v);},
  async expire(k,s){ttl.set(k,s);},
  async hgetall(k){return Object.fromEntries(hashes.get(k)||[]);},
 };
 const screens=createScreenStore({redis,prefix:'academy'});
 const binding=(participantId,tab,updatedAt)=>({roomId:'r',participantId,browserSessionId:tab,updatedAt});
 await screens.save(binding('ann','t1',1000));
 await screens.save(binding('bob','t1',1000));
 assert.deepEqual(await screens.list('r','ann',1000),[binding('ann','t1',1000)]);
 assert.deepEqual(await screens.list('r','ann',32_000),[],'heartbeats older than 30s are ignored');
 assert.deepEqual([...hashes.keys()],['academy:screen:r:ann','academy:screen:r:bob']);
 assert.equal(ttl.get('academy:screen:r:ann'),30);
 for(let i=2;i<=9;i++)await screens.save(binding('ann',`t${i}`,1000));
 assert.deepEqual((await screens.list('r','ann',1000)).map(b=>b.browserSessionId),['t9'],'a ninth tab resets the hash instead of growing it');
});
