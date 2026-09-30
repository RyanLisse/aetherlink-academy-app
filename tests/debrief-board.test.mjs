import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';
import {BOARD_COLUMNS,MAX_BOARD_CARDS,addBoardCard,applyBoardAction,boardView} from '../server/debrief-board.mjs';
import {exportDebrief} from '../server/progress.mjs';

const at='2026-09-30T08:00:00.000Z';

test('board cards are stored per column and exported after the squad handoff',()=>{
 const r={name:'Squad Noord',members:[],handoffs:[],version:1};
 applyBoardAction(r,'open',{at,by:'Fac'});
 addBoardCard(r,{column:0,text:'Pairing met de n8n-agent',by:'Ada',at});
 addBoardCard(r,{column:0,text:'Snelle review',by:'Bo',at});
 addBoardCard(r,{column:1,text:'Tokens roteren',by:'Ada',at});
 assert.deepEqual(boardView(r.board),{status:'open',columns:[
  {title:BOARD_COLUMNS[0],cards:['Pairing met de n8n-agent','Snelle review']},
  {title:BOARD_COLUMNS[1],cards:['Tokens roteren']},
  {title:BOARD_COLUMNS[2],cards:[]},
 ]});
 const markdown=exportDebrief(r,boardView(r.board).columns);
 assert.ok(markdown.endsWith('## Debrief board\n\n### Went well\n- Pairing met de n8n-agent\n- Snelle review\n\n### Hard\n- Tokens roteren\n\n### Next time\nNo cards.'),markdown);
 assert.doesNotMatch(exportDebrief(r),/Debrief board/);
});

test('board cards are rejected for unknown columns, empty text, a closed board or a full board',()=>{
 const r={version:1};
 assert.throws(()=>addBoardCard(r,{column:0,text:'x',by:'Ada',at}),e=>e.status===409);
 assert.throws(()=>applyBoardAction(r,'close',{at,by:'Fac'}),e=>e.status===409);
 assert.throws(()=>applyBoardAction(r,'wipe',{at,by:'Fac'}),e=>e.status===400);
 applyBoardAction(r,'open',{at,by:'Fac'});
 for(const column of [-1,3,1.5,NaN])assert.throws(()=>addBoardCard(r,{column,text:'x',by:'Ada',at}),e=>e.status===400,String(column));
 assert.throws(()=>addBoardCard(r,{column:0,text:'',by:'Ada',at}),e=>e.status===400);
 r.board.cards=Array.from({length:MAX_BOARD_CARDS},(_,i)=>({id:String(i),column:0,text:'x',by:'Ada',at}));
 assert.throws(()=>addBoardCard(r,{column:0,text:'one more',by:'Ada',at}),e=>e.status===409);
 applyBoardAction(r,'close',{at,by:'Fac'});
 r.board.cards=[];
 assert.throws(()=>addBoardCard(r,{column:0,text:'late',by:'Ada',at}),e=>e.status===409);
});

test('a board from before cards were stored natively opens empty instead of failing',()=>{
 const r={version:1,board:{proof:{slug:'old-board'},status:'closed',createdAt:at}};
 assert.deepEqual(boardView(r.board).columns.map(c=>c.cards),[[],[],[]]);
 applyBoardAction(r,'open',{at,by:'Fac'});
 addBoardCard(r,{column:2,text:'Eerder testen',by:'Ada',at});
 assert.deepEqual(boardView(r.board).columns[2].cards,['Eerder testen']);
});

test('debrief board routes are room-scoped, facilitator-controlled and read-only once closed',async()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'academy-board-'));
 const instance=createApp({dir,hostKey:'test-host',root:process.cwd()});
 await new Promise(r=>instance.server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${instance.server.address().port}`;
 const post=(route,token,body)=>fetch(base+route,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify(body)});
 const state=async token=>(await fetch(base+'/game/state',{headers:{authorization:`Bearer ${token}`}})).json();
 try{
  const host=instance.store.create('Squad Noord');
  const ada=instance.store.join(host.code,'Ada');
  const foreign=instance.store.create('Squad Zuid');
  const eve=instance.store.join(foreign.code,'Eve');

  assert.equal((await post('/game/board',host.token,{action:'close'})).status,409);
  assert.equal((await post('/game/board',ada.token,{action:'open'})).status,403);
  assert.equal((await post('/game/board/card',ada.token,{column:0,text:'Too early'})).status,409);
  const opened=await post('/game/board',host.token,{action:'open'});
  assert.equal(opened.status,200);
  assert.deepEqual((await opened.json()).status,'open');

  const card=await post('/game/board/card',ada.token,{column:0,text:'Pairing met de n8n-agent'});
  assert.equal(card.status,200);
  assert.deepEqual((await card.json()).columns[0].cards,['Pairing met de n8n-agent']);
  assert.equal((await post('/game/board/card',host.token,{column:1,text:'Tokens roteren'})).status,200);
  assert.equal((await post('/game/board/card',ada.token,{column:9,text:'x'})).status,400);
  assert.equal((await post('/game/board/card',ada.token,{column:0,text:''})).status,400);
  assert.equal((await post('/game/board/card',ada.token,{column:0,text:'x'.repeat(281)})).status,400);

  const seen=await state(ada.token);
  assert.deepEqual(seen.board.columns.map(c=>c.cards),[['Pairing met de n8n-agent'],['Tokens roteren'],[]]);
  assert.equal(JSON.stringify(seen.board).includes('Ada'),false,'card authors stay out of the shared view');
  assert.equal((await state(eve.token)).board,null);
  assert.equal((await post('/game/board/card',eve.token,{column:0,text:'Wrong room'})).status,409);

  const closed=await post('/game/board',host.token,{action:'close'});
  assert.equal((await closed.json()).status,'closed');
  assert.equal((await post('/game/board/card',ada.token,{column:2,text:'Late'})).status,409);

  const exported=await fetch(base+'/game/debrief/export',{headers:{authorization:`Bearer ${host.token}`}});
  assert.equal(exported.status,200);
  assert.match(await exported.text(),/## Debrief board\n\n### Went well\n- Pairing met de n8n-agent\n\n### Hard\n- Tokens roteren/);

  const reopened=await post('/game/board',host.token,{action:'open'});
  assert.deepEqual((await reopened.json()).columns.map(c=>c.cards),[['Pairing met de n8n-agent'],['Tokens roteren'],[]]);
 }finally{await new Promise(r=>instance.server.close(r));rmSync(dir,{recursive:true,force:true});}
});
