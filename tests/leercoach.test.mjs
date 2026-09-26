import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtempSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';
import {answerQuestion} from '../server/faq.mjs';
import {LocalStore} from '../server/local-store.mjs';
import {readCoachConfig,coachAnswer,COACH_DEFAULT_MODEL} from '../server/coach.mjs';
import {validateRuntimeEnvironment} from '../server/runtime-config.mjs';
import {DAY_SOURCES} from '../content/days/index.mjs';
import {TRIAGE_FIXTURES} from '../content/triage/grade.mjs';

const WHY_L1='Waarom is L1 zonder LLM?';

// A stand-in for https://openrouter.ai/api/v1/chat/completions. Tests never reach the real API.
async function fakeOpenRouter(t){
 const fake={requests:[],reply:()=>({json:{answer:'x',citations:[]}})};
 const server=http.createServer((req,res)=>{
  let raw='';req.on('data',chunk=>raw+=chunk);req.on('end',async()=>{
   const body=JSON.parse(raw);fake.requests.push({headers:req.headers,raw,body});
   const {status=200,json,content,delayMs=0}=fake.reply(body);
   if(delayMs)await new Promise(resolve=>setTimeout(resolve,delayMs));
   if(res.destroyed)return;
   res.writeHead(status,{'content-type':'application/json'});
   res.end(JSON.stringify(status===200?{choices:[{message:{role:'assistant',content:content??JSON.stringify(json)}}]}:{error:{code:status,message:'fake'}}));
  });
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
 fake.config=(overrides={})=>({apiKey:'sk-or-test',model:'google/gemma-4-31b-it:free',url:`http://127.0.0.1:${server.address().port}/api/v1/chat/completions`,participantCap:40,platformCap:50,timeoutMs:2000,...overrides});
 return fake;
}

async function invoke(app,route,{method='post',body={},cookies={}}={}){
 const layer=app.router.stack.find(candidate=>candidate.route?.path===route&&candidate.route.methods[method]);assert.ok(layer,`Missing route ${method} ${route}`);
 const response={statusCode:200,body:null};
 const req={method:method.toUpperCase(),body,query:{},headers:{cookie:Object.entries(cookies).map(([name,value])=>`${name}=${value}`).join('; ')}};
 const res={status(status){response.statusCode=status;return this;},json(value){response.body=value;return this;},end(){return this;}};
 await layer.route.stack[0].handle(req,res,error=>{response.statusCode=error.status||500;response.body={error:error.status?error.message:'Onverwachte serverfout.'};});
 return response;
}

async function classroom(coachConfig,{day=3,name='Deelnemer'}={}){
 const instance=createApp({dir:mkdtempSync(path.join(os.tmpdir(),'academy-leercoach-')),hostKey:'test-host',publicBaseUrl:'http://127.0.0.1:4317',coachConfig});
 const host=instance.store.create('Squad Noordzee',{slug:'noordzee'});
 const participant=instance.store.join(host.code,name);
 if(day!==1)assert.equal((await invoke(instance.app,'/game/control',{body:{action:'day',value:day},cookies:{academy:host.token}})).statusCode,200);
 const ask=(q,token=participant.token)=>invoke(instance.app,'/game/chat',{body:{q},cookies:{academy:token}});
 return {instance,host,participant,ask};
}

test('config: no key means no coach, a paid model id is refused at boot, caps are configurable',()=>{
 assert.equal(readCoachConfig({}),null);
 assert.equal(readCoachConfig({OPENROUTER_API_KEY:'  '}),null);
 assert.deepEqual(readCoachConfig({OPENROUTER_API_KEY:'sk-or-1'}),{apiKey:'sk-or-1',model:'google/gemma-4-31b-it:free',url:'https://openrouter.ai/api/v1/chat/completions',participantCap:40,platformCap:50,timeoutMs:15000});
 assert.equal(COACH_DEFAULT_MODEL.endsWith(':free'),true);
 assert.deepEqual(readCoachConfig({OPENROUTER_API_KEY:'k',ACADEMY_COACH_MODEL:'qwen/qwen3.8-27b:free',ACADEMY_COACH_DAILY_CAP:'12',ACADEMY_COACH_PLATFORM_DAILY_CAP:'200'}),{apiKey:'k',model:'qwen/qwen3.8-27b:free',url:'https://openrouter.ai/api/v1/chat/completions',participantCap:12,platformCap:200,timeoutMs:15000});
 assert.throws(()=>readCoachConfig({OPENROUTER_API_KEY:'k',ACADEMY_COACH_MODEL:'anthropic/claude-sonnet-5'}),{message:"ACADEMY_COACH_MODEL moet een gratis OpenRouter-model zijn (id eindigt op ':free'); kreeg 'anthropic/claude-sonnet-5'."});
 assert.throws(()=>readCoachConfig({OPENROUTER_API_KEY:'k',ACADEMY_COACH_DAILY_CAP:'0'}),{message:'ACADEMY_COACH_DAILY_CAP moet een positief geheel getal zijn.'});
 assert.throws(()=>validateRuntimeEnvironment({OPENROUTER_API_KEY:'k',ACADEMY_COACH_MODEL:'openai/gpt-5',DATABASE_URL:'postgres://x'}),/eindigt op ':free'/);
 assert.doesNotThrow(()=>validateRuntimeEnvironment({OPENROUTER_API_KEY:'k',DATABASE_URL:'postgres://x'}));
});

test('disabled: without a key the chat answers exactly as the FAQ and never calls a model',async t=>{
 const fake=await fakeOpenRouter(t);
 const {instance,participant,ask}=await classroom(null);
 const response=await ask(WHY_L1);
 assert.equal(response.statusCode,200);
 assert.deepEqual(response.body,answerQuestion({day:3,released:[1,2,3],query:WHY_L1}));
 assert.equal('coach' in response.body,false);
 assert.deepEqual((await invoke(instance.app,'/game/chat/coach',{method:'get',cookies:{academy:participant.token}})).body,{enabled:false});
 assert.equal(fake.requests.length,0);
});

test('citations: a valid id is kept with its server-side source link, invented ids and links are dropped',async t=>{
 const fake=await fakeOpenRouter(t);
 fake.reply=()=>({json:{answer:'L1 is een Switch zonder LLM [d3:step:w3-l1], zodat je eerst ziet wat vaste regels doen. Zie https://evil.example/x en [dit](https://evil.example/y).',citations:['d3:step:w3-l1','d9:invented','d3:step:w3-l1'],outOfScope:false}});
 const {ask}=await classroom(fake.config());
 const {body}=await ask(WHY_L1);
 assert.equal(body.mode,'handoff');
 assert.equal(body.coach.status,'answered');
 assert.equal(body.coach.answer,'L1 is een Switch zonder LLM , zodat je eerst ziet wat vaste regels doen. Zie en dit.');
 assert.deepEqual(body.coach.citations.map(hit=>[hit.id,hit.source.href]),[['d3:step:w3-l1','/workshop/3?index=6']]);
 assert.equal(body.coach.model,'google/gemma-4-31b-it:free');
 assert.equal(body.coach.remaining,39);
 assert.equal(body.coach.limit,40);
 assert.equal(fake.requests.length,1);
});

test('citations: only invented ids, no JSON, or an out-of-scope verdict fall back to the FAQ answer',async t=>{
 const fake=await fakeOpenRouter(t);
 const {ask}=await classroom(fake.config());
 const faq=answerQuestion({day:3,released:[1,2,3],query:WHY_L1});
 const cases=[
  [{json:{answer:'Omdat het zo is.',citations:['d3:made-up']}},{status:'fallback',reason:'no-citation',remaining:39,limit:40}],
  [{json:{answer:'Omdat het zo is.',citations:[]}},{status:'fallback',reason:'no-citation',remaining:38,limit:40}],
  [{content:'Ik denk dat L1 geen LLM nodig heeft.'},{status:'fallback',reason:'invalid',remaining:37,limit:40}],
  [{json:{answer:'',citations:[],outOfScope:true}},{status:'out-of-scope',remaining:36,limit:40}]
 ];
 for(const [reply,coach] of cases){
  fake.reply=()=>reply;
  const {body}=await ask(WHY_L1);
  assert.deepEqual(body,{...faq,coach});
 }
});

test('literal FAQ hits stay deterministic and a question outside the material is referred to the facilitator without a model call',async t=>{
 const fake=await fakeOpenRouter(t);
 const {ask}=await classroom(fake.config());
 const literal=await ask('Heb ik een credential nodig voor L1?');
 assert.equal(literal.body.hits[0].id,'d3:step:w3-l1');
 assert.deepEqual(literal.body.coach,{status:'skipped',remaining:40,limit:40});
 const pizza=await ask('Leg uit hoe ik pizza bak');
 assert.deepEqual(pizza.body.hits,[]);
 assert.deepEqual(pizza.body.coach,{status:'out-of-scope',remaining:40,limit:40});
 assert.equal(fake.requests.length,0);
});

test('timeout, 429 and 5xx fall back to the FAQ answer and say why',async t=>{
 const fake=await fakeOpenRouter(t);
 const {ask}=await classroom(fake.config({timeoutMs:150}));
 const faq=answerQuestion({day:3,released:[1,2,3],query:WHY_L1});
 fake.reply=()=>({delayMs:600,json:{answer:'te laat',citations:['d3:step:w3-l1']}});
 assert.deepEqual((await ask(WHY_L1)).body,{...faq,coach:{status:'fallback',reason:'timeout',remaining:39,limit:40}});
 fake.reply=()=>({status:429});
 assert.deepEqual((await ask(WHY_L1)).body.coach,{status:'fallback',reason:'rate-limited',remaining:38,limit:40});
 fake.reply=()=>({status:502});
 assert.deepEqual((await ask(WHY_L1)).body.coach,{status:'fallback',reason:'unavailable',remaining:37,limit:40});
});

test('outbound payload: lesson passages and the question only, with names, emails and codes removed',async t=>{
 const fake=await fakeOpenRouter(t);
 fake.reply=()=>({json:{answer:'Uitleg.',citations:['d3:step:w3-l1']}});
 const {instance,host,participant,ask}=await classroom(fake.config(),{name:'Fenna Jansen'});
 instance.store.join(host.code,'Karim');
 for(const q of [`Waarom L1 Switch zonder LLM regels? fenna Karim ${host.code.toLowerCase()}`,'Waarom L1 Switch LLM? f.jansen@example.test','Waarom L1 Switch zonder LLM credential? ABCD-EFGH-JKMN-PQRS'])assert.equal((await ask(q)).body.coach.status,'answered',q);
 const questions=fake.requests.map(({body})=>body.messages[1].content.split('\n\nVraag: ')[1]);
 assert.deepEqual(questions,['Waarom L1 Switch zonder LLM regels? [naam] [naam] [code]','Waarom L1 Switch LLM? [e-mail]','Waarom L1 Switch zonder LLM credential? [code]']);
 const [{headers,body:sent}]=fake.requests;
 assert.equal(headers.authorization,'Bearer sk-or-test');
 assert.deepEqual(Object.keys(sent).sort(),['max_tokens','messages','model','provider','temperature']);
 assert.equal(sent.model,'google/gemma-4-31b-it:free');
 assert.deepEqual(sent.provider,{data_collection:'deny'});
 assert.deepEqual(sent.messages.map(m=>m.role),['system','user']);
 assert.match(sent.messages[1].content,/^Passages:\n\n\[d3:step:w3-l1\] Stap L1 · L1 · Switch zonder LLM\n/);
 for(const {raw} of fake.requests)for(const secret of ['Fenna','fenna','Jansen','jansen','Karim','example.test',host.code,host.code.toLowerCase(),'ABCD-EFGH',participant.token,host.roomId,'Noordzee'])assert.equal(raw.includes(secret),false,secret);
});

// Mirrors the autograde leak detector: an expected label next to its ticket, or any expected key.
const proseLeaks=raw=>TRIAGE_FIXTURES.tickets.map(t=>[t.ticket.ticket_id,t.expected_priority]).filter(([id,label])=>new RegExp(`${id}\\W{1,3}${label}\\b`,'i').test(raw)).map(([id,label])=>`${id}=${label}`);

test('answer keys never reach the model: no quiz question or key, no expected triage label',async t=>{
 const fake=await fakeOpenRouter(t);
 fake.reply=body=>({json:{answer:'Uitleg.',citations:[body.messages[1].content.match(/^\[([^\]]+)\]/m)[1]]}});
 const {ask}=await classroom(fake.config({participantCap:1000,platformCap:1000}),{day:7});
 for(const source of DAY_SOURCES)for(const {question,options,answer} of source.quiz)await ask(`Waarom? ${question} ${options[answer]}`.slice(0,300));
 for(const {ticket} of TRIAGE_FIXTURES.tickets)await ask(`Waarom krijgt ticket ${ticket.ticket_id} deze prioriteit in de triage?`);
 assert.ok(fake.requests.length>=DAY_SOURCES.length,`model saw ${fake.requests.length} grounded questions`);
 for(const {raw} of fake.requests){
  const context=JSON.parse(raw).messages[1].content.split('\n\nVraag: ')[0];
  for(const source of DAY_SOURCES)for(const {question} of source.quiz)assert.equal(context.includes(question),false,question);
  assert.doesNotMatch(raw,/expected_priority|"expected"|answerKey/);
  assert.deepEqual(proseLeaks(raw),[]);
 }
});

test('caps: 40 per participant per Amsterdam day, the 41st is refused without a model call, midnight in Amsterdam resets it',async t=>{
 const fake=await fakeOpenRouter(t);
 fake.reply=()=>({json:{answer:'Uitleg.',citations:['d3:step:w3-l1']}});
 const clock={now:Date.parse('2026-09-26T21:30:00Z')};
 const store=new LocalStore(mkdtempSync(path.join(os.tmpdir(),'academy-coach-cap-')),{now:()=>clock.now});
 const config=fake.config();
 const faq=answerQuestion({day:3,released:[1,2,3],query:WHY_L1});
 const ask=personKey=>coachAnswer({faq,config,store,fetchImpl:fetch,personKey,redact:q=>q,locale:'nl'});
 const remaining=[];
 for(let i=0;i<40;i++)remaining.push((await ask('p1')).coach.remaining);
 assert.deepEqual(remaining,Array.from({length:40},(_,i)=>39-i));
 const refused=await ask('p1');
 assert.deepEqual(refused,{...faq,coach:{status:'capped',remaining:0,limit:40}});
 assert.equal(fake.requests.length,40);
 clock.now=Date.parse('2026-09-26T21:59:59Z');
 assert.equal((await ask('p1')).coach.status,'capped','23:59:59 in Amsterdam is still the same day');
 assert.equal((await ask('p2')).coach.remaining,39,'another participant keeps a separate counter');
 clock.now=Date.parse('2026-09-26T22:00:30Z');
 assert.deepEqual((await ask('p1')).coach,{status:'answered',answer:'Uitleg.',citations:faq.hits.filter(hit=>hit.id==='d3:step:w3-l1'),model:'google/gemma-4-31b-it:free',remaining:39,limit:40});
});

test('platform cap: the shared free-tier budget stops every participant and spends nobody’s own count',async t=>{
 const fake=await fakeOpenRouter(t);
 fake.reply=()=>({json:{answer:'Uitleg.',citations:['d3:step:w3-l1']}});
 const {instance,host,participant,ask}=await classroom(fake.config({platformCap:3}));
 const second=instance.store.join(host.code,'Tweede');
 assert.equal((await ask(WHY_L1)).body.coach.remaining,39);
 assert.equal((await ask(WHY_L1)).body.coach.remaining,38);
 assert.equal((await ask(WHY_L1,second.token)).body.coach.remaining,39);
 assert.deepEqual((await ask(WHY_L1,second.token)).body.coach,{status:'platform-capped',remaining:39,limit:40});
 assert.deepEqual((await ask(WHY_L1)).body.coach,{status:'platform-capped',remaining:38,limit:40});
 assert.deepEqual((await invoke(instance.app,'/game/chat/coach',{method:'get',cookies:{academy:participant.token}})).body,{enabled:true,remaining:38,limit:40});
 assert.equal(fake.requests.length,3);
});

test('the facilitator toggle also closes the coach and its status route',async t=>{
 const fake=await fakeOpenRouter(t);
 const {instance,host,participant,ask}=await classroom(fake.config());
 await invoke(instance.app,'/game/control',{body:{action:'chat',value:false},cookies:{academy:host.token}});
 assert.equal((await ask(WHY_L1)).statusCode,403);
 assert.equal((await invoke(instance.app,'/game/chat/coach',{method:'get',cookies:{academy:participant.token}})).statusCode,403);
 assert.equal((await invoke(instance.app,'/game/chat/coach',{method:'get',cookies:{academy:'nope'}})).statusCode,401);
 assert.equal(fake.requests.length,0);
});
