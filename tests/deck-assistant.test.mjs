import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';
import {readDeckAssistantConfig, toDeckOperations} from '../server/deck-assistant.mjs';

async function invoke(app,method,route,{body={},query={},params={},cookies={}}={}){
 const layer=app.router.stack.find(candidate=>candidate.route?.path===route&&candidate.route.methods[method]);assert.ok(layer,`Missing ${method} ${route}`);
 const response={statusCode:200,headers:{},body:null,text:null};
 const req={method:method.toUpperCase(),body,query,params,headers:{cookie:Object.entries(cookies).map(([k,v])=>`${k}=${v}`).join('; ')}};
 const res={status(s){response.statusCode=s;return this;},json(v){response.body=v;return this;},type(){return this;},set(k,v){response.headers[k.toLowerCase()]=v;return this;},send(v){response.text=v;return this;},redirect(s,url){response.statusCode=s;response.headers.location=url;return this;},end(){return this;}};
 await layer.route.stack[0].handle(req,res,error=>{response.statusCode=error.status||500;response.body={error:error.status?error.message:'Onverwachte serverfout.'};});
 return response;
}

const config={apiKey:'sk-or-test',model:'test/model:free',url:'https://openrouter.test/chat',facilitatorCap:3,platformCap:50,timeoutMs:1000};
function model(replies){
 const calls=[];
 const fetchImpl=async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});const next=replies.shift(),body=JSON.parse(options.body),content=typeof next==='function'?next(body):next;return {ok:true,status:200,json:async()=>({choices:[{message:{content:typeof content==='string'?content:JSON.stringify(content)}}]})};};
 return {calls,fetchImpl};
}
function fixture(replies){
 const mock=model(replies);
 const instance=createApp({dir:mkdtempSync(path.join(os.tmpdir(),'academy-deck-assistant-')),hostKey:'test-host',publicBaseUrl:'http://127.0.0.1:4317',deckAssistantConfig:config,fetchImpl:mock.fetchImpl});
 const host=instance.store.create('Squad Noord');
 const participant=instance.store.join(host.code,'Marieke');
 return {...mock,app:instance.app,host,participant};
}

test('facilitator creates and then edits a classroom deck through the in-app chat',async()=>{
 const {app,host,calls}=fixture([
  {reply:'Deck met twee slides gemaakt.',title:'Prompt basics',operations:[
   {op:'add-slide',slide:{title:'Welkom',kicker:'DAG 1',type:'context',cards:[{title:'Doel',body:'Leren prompten'}],notes:'Stel jezelf voor.'}},
   {op:'add-slide',slide:{title:'Welke prompt werkt?',type:'quiz',cards:[{title:'Vaag',body:'Help'},{title:'Concreet',body:'Rol, doel, formaat'}],keyPoints:['Concreet wint'],visual:{quiz:{answer:1}}}},
  ]},
 ]);
 const cookies={academy:host.token};
 const status=await invoke(app,'get','/game/decks/assistant',{cookies});
 assert.deepEqual(status.body,{enabled:true,model:'test/model:free',limit:3,remaining:3});
 const created=await invoke(app,'post','/game/decks/assistant',{body:{message:`Maak een deck voor ${host.code} over prompten`,locale:'nl'},cookies});
 assert.equal(created.statusCode,200,created.body?.error);
 assert.equal(created.body.changes.created,true);
 assert.equal(created.body.changes.added.length,2);
 assert.equal(created.body.assistant.remaining,2);
 assert.doesNotMatch(calls[0].body.messages.at(-1).content,new RegExp(host.code));
 assert.deepEqual(calls[0].body.provider,{data_collection:'deny'});
 const deckId=created.body.deckId;
 const deck=await invoke(app,'get','/game/decks/:deckId',{params:{deckId},cookies});
 assert.equal(deck.body.title,'Prompt basics');
 assert.deepEqual(deck.body.slides.map(slide=>slide.classroom.title),['Welkom','Welke prompt werkt?']);
 assert.equal(deck.body.slides[0].notes,'Stel jezelf voor.');
 const present=await invoke(app,'get','/game/decks/:deckId/present',{params:{deckId},cookies});
 assert.equal(present.statusCode,302);assert.equal(present.headers.location,`/decks/${deckId}`);
});

test('edits merge into the active slide, notes and key points stay on the server',async()=>{
 const activeId=body=>/"id":"([^"]+)","active":true/.exec(body.messages.at(-1).content)?.[1];
 const {app,host,calls}=fixture([
  {reply:'Klaar.',title:'Prompt basics',operations:[{op:'add-slide',slide:{title:'Welkom',cards:[{title:'Doel',body:'Leren'}],keyPoints:['Geheim kernpunt'],notes:'Geheime notitie'}}]},
  body=>({reply:'Titel aangepast en een pauze toegevoegd.',operations:[
   {op:'update-slide',slideId:activeId(body),slide:{title:'Welkom bij Academy'}},
   {op:'add-slide',afterSlideId:activeId(body),slide:{title:'Pauze',type:'pause',visual:{countdown:10}}},
  ]}),
  {reply:'Verwijderd.',operations:[{op:'delete-slide',slideId:'bestaat-niet'}]},
 ]);
 const cookies={academy:host.token};
 const created=await invoke(app,'post','/game/decks/assistant',{body:{message:'Maak een welkomstslide'},cookies});
 const deckId=created.body.deckId,slideId=created.body.changes.added[0];
 const edited=await invoke(app,'post','/game/decks/assistant',{body:{message:'Andere titel en een pauze',deckId,slideId,history:[{message:'Maak een welkomstslide',reply:'Klaar.'}]},cookies});
 assert.equal(edited.statusCode,200,edited.body?.error);
 assert.deepEqual(edited.body.changes,{created:false,added:[edited.body.changes.added[0]],updated:[slideId],deleted:[],renamed:false});
 const sent=calls[1].body.messages;
 assert.equal(sent.length,4);
 assert.doesNotMatch(sent.at(-1).content,/Geheim kernpunt|Geheime notitie/);
 const deck=await invoke(app,'get','/game/decks/:deckId',{params:{deckId},cookies});
 assert.deepEqual(deck.body.slides.map(slide=>slide.classroom.title),['Welkom bij Academy','Pauze']);
 assert.deepEqual(deck.body.slides[0].classroom.keyPoints,['Geheim kernpunt']);
 assert.equal(deck.body.slides[0].notes,'Geheime notitie');
 assert.equal(deck.body.slides[1].classroom.visual.countdown,10);
 const rejected=await invoke(app,'post','/game/decks/assistant',{body:{message:'Verwijder slide 9',deckId},cookies});
 assert.equal(rejected.statusCode,502);
 const unchanged=await invoke(app,'get','/game/decks/:deckId',{params:{deckId},cookies});
 assert.equal(unchanged.body.revision,deck.body.revision);
});

test('update-slide proposals merge onto the stored slide, including visual settings',()=>{
 const deck={slides:[{id:'s1',classroom:{title:'Oud',cards:[{title:'A',body:'B'}],keyPoints:['k'],visual:{reveal:'click'}}}]};
 assert.deepEqual(toDeckOperations([{op:'update-slide',slideId:'s1',slide:{title:'Nieuw',visual:{stagger:'pop'},notes:'n'}}],deck),[
  {op:'patch-slide',slideId:'s1',fields:{classroom:{title:'Nieuw',cards:[{title:'A',body:'B'}],keyPoints:['k'],visual:{reveal:'click',stagger:'pop'}},notes:'n'}},
 ]);
 assert.throws(()=>toDeckOperations([{op:'drop-table'}],deck),/unknown action/);
});

test('only the facilitator uses the assistant, and it is off without an OpenRouter key',async()=>{
 const {app,participant}=fixture([]);
 const denied=await invoke(app,'post','/game/decks/assistant',{body:{message:'Maak slides'},cookies:{academy:participant.token}});
 assert.equal(denied.statusCode,403);
 assert.equal(readDeckAssistantConfig({}),null);
 assert.throws(()=>readDeckAssistantConfig({OPENROUTER_API_KEY:'k',ACADEMY_DECK_ASSISTANT_MODEL:'paid/model'}),/:free/);
});
