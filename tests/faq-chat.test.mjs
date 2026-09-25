import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';
import {answerQuestion} from '../server/faq.mjs';
import {DAY_SOURCES} from '../content/days/index.mjs';

async function invoke(app,route,{body={},cookies={}}={}){
 const layer=app.router.stack.find(candidate=>candidate.route?.path===route&&candidate.route.methods.post);assert.ok(layer,`Missing route ${route}`);
 const response={statusCode:200,body:null};
 const req={body,query:{},headers:{cookie:Object.entries(cookies).map(([name,value])=>`${name}=${value}`).join('; ')}};
 const res={status(status){response.statusCode=status;return this;},json(value){response.body=value;return this;},end(){return this;}};
 await layer.route.stack[0].handle(req,res,error=>{response.statusCode=error.status||500;response.body={error:error.status?error.message:'Onverwachte serverfout.'};});
 return response;
}

function fixture(){
 const instance=createApp({dir:mkdtempSync(path.join(os.tmpdir(),'academy-faq-chat-')),hostKey:'test-host',publicBaseUrl:'http://127.0.0.1:4317'});
 const host=instance.store.create('FAQ chat',{slug:'faq-chat'});
 const participant=instance.store.join(host.code,'Deelnemer');
 return {instance,host,participant};
}

test('literal questions return the expected day-pack entry with its source link',()=>{
 const credential=answerQuestion({day:3,query:'Heb ik een credential nodig voor L1?'});
 assert.equal(credential.mode,'answer');
 assert.equal(credential.hits[0].id,'d3:step:w3-l1');
 assert.equal(credential.hits[0].title,'Stap L1 · L1 · Switch zonder LLM');
 assert.match(credential.hits[0].answer,/Tip: Importeer n8n-triage-l1-switch\.json; er is geen credential nodig\.$/);
 assert.deepEqual(credential.hits[0].links,[{view:'solo'},{label:'Dia 7 · Build or inspect L1 on your machine.',href:'/workshop/3?index=6'}]);
 assert.deepEqual(credential.hits[0].source,{label:'Workshop 3 · Agents in n8n · dia 7',href:'/workshop/3?index=6'});

 const setup=answerQuestion({day:1,query:'oefenrepository opzetten'});
 assert.equal(setup.hits[0].id,'d1:step:c1-setup');
 assert.equal(setup.hits[0].source.href,'/classroom/1?index=33');
});

test('navigation intents answer with an in-app view link',()=>{
 for(const query of ['Waar vind ik mijn opdracht?','Hoe start ik mijn opdracht?']){
  const result=answerQuestion({day:3,query});
  assert.equal(result.mode,'answer');
  assert.equal(result.hits[0].id,'nav:solo');
  assert.equal(result.hits[0].title,'Je opdracht staat onder Solo-missie');
  assert.deepEqual(result.hits[0].links,[{view:'solo'}]);
 }
 assert.equal(answerQuestion({day:3,query:'Where do I find my assignment?',locale:'en'}).hits[0].title,'Your assignment is under Solo mission');
 assert.deepEqual(answerQuestion({day:2,query:'waar lever ik bewijs in'}).hits[0].links,[{view:'review'}]);
});

test('facts the lesson plan leaves open come back marked OPEN, not invented',()=>{
 const result=answerQuestion({day:3,query:'Wat is de URL van de n8n-instantie?'});
 assert.equal(result.hits[0].id,'d3:open:1');
 assert.equal(result.hits[0].title,'URL van de workshop-n8n-instantie ontbreekt in het lesplan.');
 assert.equal(result.hits[0].open,true);
 assert.equal(result.hits[0].answer,'OPEN: dit staat nog niet vast in het lesplan. Vraag je facilitator.');
});

test('no match or a conceptual question hands off to the participant’s own Claude via MCP',()=>{
 const none=answerQuestion({day:3,query:'pizza recept'});
 assert.equal(none.mode,'handoff');
 assert.deepEqual(none.hits,[]);
 assert.deepEqual(none.handoff.link,{view:'coach',label:'Open Mijn leercoach'});
 assert.match(none.handoff.text,/^Diepere hulp, zoals uitleg van een concept/);
 assert.equal(none.handoff.prompt,'Lees mijn Academy-scherm met get_screen_state en mijn opdracht met get_mission. Help me daarna met: “pizza recept”. Geef eerst hints, geen kant-en-klaar antwoord.');

 const why=answerQuestion({day:3,query:'Waarom is L1 zonder LLM?'});
 assert.equal(why.mode,'handoff');
 assert.equal(why.hits[0].id,'d3:step:w3-l1');
});

test('every released day is searchable and nothing after the room’s day',()=>{
 const day4Titles=DAY_SOURCES[3].solo.map(step=>step.title);
 for(const title of day4Titles){
  assert.ok(answerQuestion({day:4,query:title}).hits[0].id.startsWith('d4:'),title);
  assert.deepEqual(answerQuestion({day:3,query:title}).hits.filter(hit=>/^d[4-7]:/.test(hit.id)),[],title);
 }
 assert.equal(answerQuestion({day:5,query:'Heb ik een credential nodig voor L1?'}).hits[0].id,'d3:step:w3-l1');
 assert.deepEqual(answerQuestion({day:2,query:'Heb ik een credential nodig voor L1?'}).hits.filter(hit=>hit.id.startsWith('d3:')),[]);
 assert.equal(answerQuestion({day:2,released:[1,2,3],query:'Heb ik een credential nodig voor L1?'}).hits[0].id,'d3:step:w3-l1');
});

test('quiz questions, quiz keys and the facilitator demo script never come back',()=>{
 assert.equal(answerQuestion({day:3,query:DAY_SOURCES[2].demo.script[0]}).hits[0].id,'d3:step:w3-l1');
 for(const source of DAY_SOURCES){
  for(const {question,options,answer} of source.quiz){
   const body=JSON.stringify(answerQuestion({day:source.day,query:`${question} ${options[answer]}`}).hits);
   assert.equal(body.includes(question),false,question);
  }
  for(const line of source.demo.script){
   const {hits}=answerQuestion({day:source.day,query:line});
   assert.equal(JSON.stringify(hits).includes(line),false,line);
  }
 }
});

test('facilitator toggle: off hides the chat and the endpoint answers 403 to participants',async()=>{
 const {instance,host,participant}=fixture();
 const ask=token=>invoke(instance.app,'/game/chat',{body:{q:'Waar vind ik mijn opdracht?'},cookies:{academy:token}});
 assert.equal((await ask(participant.token)).body.hits[0].id,'nav:solo');

 const off=await invoke(instance.app,'/game/control',{body:{action:'chat',value:false},cookies:{academy:host.token}});
 assert.equal(off.statusCode,200);
 assert.equal(off.body.chat,false);
 const blocked=await ask(participant.token);
 assert.equal(blocked.statusCode,403);
 assert.equal(blocked.body.error,'De facilitator heeft de chat voor deze kamer uitgezet.');
 assert.equal((await ask(host.token)).statusCode,200);

 assert.equal((await invoke(instance.app,'/game/control',{body:{action:'chat',value:false},cookies:{academy:participant.token}})).statusCode,403);
 assert.equal((await invoke(instance.app,'/game/control',{body:{action:'chat',value:'on'},cookies:{academy:host.token}})).statusCode,400);
 const on=await invoke(instance.app,'/game/control',{body:{action:'chat',value:true},cookies:{academy:host.token}});
 assert.equal(on.body.chat,true);
 assert.equal((await ask(participant.token)).statusCode,200);
 assert.equal((await ask('not-a-session')).statusCode,401);
});

test('the chat handler makes no network call',async()=>{
 const {instance,participant}=fixture();
 const calls=[];
 const original=globalThis.fetch;
 globalThis.fetch=async(...args)=>{calls.push(String(args[0]));throw new Error('network disabled in test');};
 try{
  const result=await invoke(instance.app,'/game/chat',{body:{q:'oefenrepository opzetten'},cookies:{academy:participant.token}});
  assert.equal(result.statusCode,200);
  assert.equal(result.body.day,1);
  assert.equal(result.body.hits[0].id,'d1:step:c1-setup');
  const handoff=await invoke(instance.app,'/game/chat',{body:{q:'Leg uit wat een agent is'},cookies:{academy:participant.token}});
  assert.equal(handoff.body.mode,'handoff');
 }finally{globalThis.fetch=original;}
 assert.deepEqual(calls,[]);
});
