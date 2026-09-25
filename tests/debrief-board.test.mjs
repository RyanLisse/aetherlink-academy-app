import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {createApp} from '../server/app.mjs';
import {parseBoard} from '../server/debrief-board.mjs';
import {exportDebrief} from '../server/progress.mjs';

const boardState='# Squad Noord\n\nIntro zonder kolom\n\n## Werkte goed\n\n- Pairing met de n8n-agent\n- <span data-proof="authored">Snelle review</span>\n\n## Lastig\n\n1. Tokens roteren\n\n## Volgende keer\n\n- [ ] Eerder testen';

test('parseBoard reads level-2 headings as columns and list, numbered and checkbox lines as cards',()=>{
 assert.deepEqual(parseBoard(boardState),[
  {title:'Werkte goed',cards:['Pairing met de n8n-agent','Snelle review']},
  {title:'Lastig',cards:['Tokens roteren']},
  {title:'Volgende keer',cards:['Eerder testen']},
 ]);
 assert.deepEqual(parseBoard('## Werkte goed\n\n## Lastig\n\n## Volgende keer\n').map(column=>column.cards),[[],[],[]]);
});

test('exportDebrief appends the board columns after the squad handoff',()=>{
 const room={name:'Squad Noord',members:[],handoffs:[]};
 const markdown=exportDebrief(room,parseBoard(boardState));
 assert.ok(markdown.endsWith('## Debriefbord\n\n### Werkte goed\n- Pairing met de n8n-agent\n- Snelle review\n\n### Lastig\n- Tokens roteren\n\n### Volgende keer\n- Eerder testen'),markdown);
 assert.doesNotMatch(exportDebrief(room),/Debriefbord/);
});

test('debrief board is created once per room, scoped to the room and read-only once closed',async()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'academy-board-'));
 const forwarded=[];let created=0,storedLags=true;
 const upstream=http.createServer((req,res)=>{let body='';req.on('data',chunk=>body+=chunk);req.on('end',()=>{
  forwarded.push({method:req.method,url:req.url,auth:req.headers.authorization});res.setHeader('content-type','application/json');
  if(req.method==='POST'&&req.url==='/documents'){created++;return res.end(JSON.stringify({slug:`board-${created}`,ownerSecret:'board-owner',accessToken:'board-editor'}));}
  if(req.url.endsWith('/access-links'))return res.end(JSON.stringify({accessToken:JSON.parse(body).role==='viewer'?'board-viewer':'board-commenter'}));
  if(req.url==='/documents/board-1/state')return res.end(JSON.stringify({markdown:boardState}));
  if(req.method==='GET'&&req.url==='/api/documents/board-1'&&req.headers.authorization==='Bearer board-editor')return res.end(JSON.stringify({markdown:storedLags?'## Werkte goed\n\n## Lastig\n\n## Volgende keer\n':boardState}));
  res.end('{"ok":true}');
 });});
 await new Promise(r=>upstream.listen(0,'127.0.0.1',r));
 const instance=createApp({dir,hostKey:'test-host',proofBase:`http://127.0.0.1:${upstream.address().port}`,root:process.cwd()});
 await new Promise(r=>instance.server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${instance.server.address().port}`;
 const board=(token,action)=>fetch(base+'/game/board',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({action})});
 const proof=(route,token,method='GET')=>fetch(base+route,{method,headers:{cookie:`academy=${token}`}});
 const lastForward=()=>forwarded.at(-1);
 try{
  const host=instance.store.create('Squad Noord',{slug:'intent-noord',editor:'intent-editor'});
  const ada=instance.store.join(host.code,'Ada');
  const foreign=instance.store.create('Squad Zuid',{slug:'intent-zuid',editor:'intent-zuid-editor'});
  const eve=instance.store.join(foreign.code,'Eve');

  assert.equal((await board(host.token,'close')).status,409);
  assert.equal((await board(ada.token,'open')).status,403);
  assert.equal((await board(eve.token,'open')).status,403);
  const opened=await board(host.token,'open');assert.equal(opened.status,200);assert.deepEqual(await opened.json(),{status:'open',slug:'board-1'});
  assert.deepEqual(await (await board(host.token,'open')).json(),{status:'open',slug:'board-1'});
  assert.equal(created,1);
  assert.deepEqual(forwarded.filter(f=>f.url.endsWith('/access-links')).map(f=>f.auth),['Bearer board-owner','Bearer board-owner']);

  const state=await (await fetch(base+'/game/state',{headers:{authorization:`Bearer ${ada.token}`}})).json();
  assert.deepEqual(state.board,{status:'open',slug:'board-1'});
  assert.equal(JSON.stringify(state).includes('board-editor'),false);
  const foreignState=await (await fetch(base+'/game/state',{headers:{authorization:`Bearer ${eve.token}`}})).json();
  assert.equal(foreignState.board,null);

  for(const route of ['/d/board-1','/api/documents/board-1/collab-session','/api/documents/board-1'])assert.equal((await proof(route,eve.token)).status,403,route);
  assert.equal((await proof('/api/documents/board-1/collab-session',ada.token)).status,200);
  assert.deepEqual(lastForward(),{method:'GET',url:'/api/documents/board-1/collab-session',auth:'Bearer board-editor'});
  assert.equal((await proof('/api/documents/board-1',ada.token,'PUT')).status,200);
  assert.deepEqual(lastForward(),{method:'PUT',url:'/api/documents/board-1',auth:'Bearer board-editor'});

  const lagging=await board(host.token,'close');assert.equal(lagging.status,503);assert.deepEqual(await lagging.json(),{error:'Proof slaat het bord nog op. Sluit het bord opnieuw.'});
  assert.equal(forwarded.some(f=>f.url.endsWith('/pause')),false);
  storedLags=false;
  const closed=await board(host.token,'close');assert.equal(closed.status,200);assert.deepEqual(await closed.json(),{status:'closed',slug:'board-1'});
  assert.deepEqual(forwarded.slice(-2),[{method:'POST',url:'/documents/board-1/pause',auth:'Bearer board-owner'},{method:'POST',url:'/documents/board-1/resume',auth:'Bearer board-owner'}]);
  const beforeWrites=forwarded.length;
  for(const [route,method] of [['/api/documents/board-1','PUT'],['/api/documents/board-1/content','POST'],['/api/agent/board-1/marks/comment','POST']])assert.equal((await proof(route,ada.token,method)).status,403,`${method} ${route}`);
  assert.equal(forwarded.length,beforeWrites);
  assert.equal((await proof('/api/documents/board-1/collab-session',ada.token)).status,200);
  assert.deepEqual(lastForward(),{method:'GET',url:'/api/documents/board-1/collab-session',auth:'Bearer board-viewer'});
  assert.equal((await proof('/api/documents/board-1/collab-refresh',ada.token,'POST')).status,200);
  assert.deepEqual(lastForward(),{method:'POST',url:'/api/documents/board-1/collab-refresh',auth:'Bearer board-viewer'});
  assert.equal((await proof('/d/board-1',ada.token)).status,200);
  assert.deepEqual(lastForward(),{method:'GET',url:'/d/board-1?token=board-viewer',auth:'Bearer board-viewer'});
  assert.equal((await proof('/api/documents/intent-noord',ada.token,'PUT')).status,200);
  assert.deepEqual(lastForward(),{method:'PUT',url:'/api/documents/intent-noord',auth:'Bearer intent-editor'});

  const exportResponse=await fetch(base+'/game/debrief/export',{headers:{authorization:`Bearer ${host.token}`}});
  assert.equal(exportResponse.status,200);
  assert.match(await exportResponse.text(),/## Debriefbord\n\n### Werkte goed\n- Pairing met de n8n-agent\n- Snelle review\n\n### Lastig\n- Tokens roteren/);

  const reopened=await board(host.token,'open');assert.deepEqual(await reopened.json(),{status:'open',slug:'board-1'});assert.equal(created,1);
  assert.equal((await proof('/api/documents/board-1',ada.token,'PUT')).status,200);
  assert.deepEqual(lastForward(),{method:'PUT',url:'/api/documents/board-1',auth:'Bearer board-editor'});

  const rejectedUpgrade=await new Promise(resolve=>{const req=http.request(`${base}/ws?slug=board-1`,{headers:{cookie:`academy=${eve.token}`,connection:'Upgrade',upgrade:'websocket','sec-websocket-version':'13','sec-websocket-key':'dGhlIHNhbXBsZSBub25jZQ=='}});req.on('response',r=>resolve(r.statusCode));req.on('error',()=>resolve('error'));req.end();});
  assert.equal(rejectedUpgrade,403);
 }finally{instance.server.close();upstream.close();}
});
