import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';
import {getDayPack,starterFileNames} from '../server/content.mjs';
import {assertValidDayPacks,dayPackIssues} from '../server/day-pack-lint.mjs';
import {QUIZ_ATTEMPT_TTL_MS} from '../server/quiz.mjs';

async function invoke(app,route,{body={},params={},cookies={}}={}){
 const layer=app.router.stack.find(candidate=>candidate.route?.path===route);assert.ok(layer,`Missing route ${route}`);
 const response={statusCode:200,body:null};
 const req={body,params,query:{},headers:{cookie:Object.entries(cookies).map(([name,value])=>`${name}=${value}`).join('; ')}};
 const res={cookie(){return this;},clearCookie(){return this;},status(status){response.statusCode=status;return this;},json(value){response.body=value;return this;},type(){return this;},send(value){response.body=value;return this;},end(){return this;}};
 await layer.route.stack[0].handle(req,res,error=>{response.statusCode=error.status||500;response.body={error:error.status?error.message:'Onverwachte serverfout.'};});
 return response;
}

function fixture(){
 const instance=createApp({dir:mkdtempSync(path.join(os.tmpdir(),'academy-quiz-')),hostKey:'quiz-host',publicBaseUrl:'http://127.0.0.1:4317'});
 const host=instance.store.create('Quiz',{slug:'quiz'});
 const participant=instance.store.join(host.code,'Deelnemer');
 const as=token=>({cookies:{academy:token}});
 const start=()=>invoke(instance.app,'/game/quiz/start',as(participant.token));
 const submit=body=>invoke(instance.app,'/game/quiz',{body,...as(participant.token)});
 return {instance,host,participant,as,start,submit};
}

const DAY1_CORRECT={'d1-q1':'b','d1-q2':'a','d1-q3':'c'};

test('server scores option ids against the day 1 key and reports correctness without keys',async()=>{
 const {start,submit}=fixture();
 const attempt=await start();
 assert.equal(attempt.statusCode,200);
 assert.equal(attempt.body.day,1);
 const result=await submit({attemptId:attempt.body.attemptId,answers:{'d1-q1':'b','d1-q2':'b','d1-q3':'c'}});
 assert.equal(result.statusCode,200);
 assert.deepEqual(result.body,{
  score:2,total:3,
  results:[{questionId:'d1-q1',correct:true},{questionId:'d1-q2',correct:false},{questionId:'d1-q3',correct:true}],
  route:'standard',day:1,
  note:'Voorlopige hulpkeuze op basis van 3 scenario’s; geen vaardigheidsbewijs of permanent label.'
 });
});

test('participant-visible payloads never carry the answer key',async()=>{
 const {instance,host,participant,as,start,submit}=fixture();
 for(const day of [1,2,3,4,5]){
  await invoke(instance.app,'/game/control',{body:{action:'day',value:day},...as(host.token)});
  const pack=await invoke(instance.app,'/game/day-pack',as(participant.token));
  assert.equal(pack.statusCode,200);
  const serialized=JSON.stringify(pack.body.quiz);
  assert.doesNotMatch(serialized,/"key"|"answers?"/);
  assert.deepEqual(Object.keys(pack.body.quiz),['questions']);
  for(const question of pack.body.quiz.questions)assert.deepEqual(Object.keys(question).filter(name=>name!=='source'),['id','kind','question','options']);
 }
 await invoke(instance.app,'/game/control',{body:{action:'day',value:1},...as(host.token)});
 const attempt=await start();
 const result=await submit({attemptId:attempt.body.attemptId,answers:{'d1-q1':'a','d1-q2':'b','d1-q3':'a'}});
 assert.equal(result.body.score,0);
 assert.doesNotMatch(JSON.stringify(result.body),/"key"|"b"|"c"/);
 const state=await invoke(instance.app,'/game/state',as(participant.token));
 assert.doesNotMatch(JSON.stringify(state.body),/"key"/);
 const publish=await invoke(instance.app,'/game/apps/:appId/publish',{params:{appId:'slides'},body:{hostKey:'quiz-host',contentRef:{kind:'day-pack',day:1}}});
 assert.equal(publish.statusCode,201,JSON.stringify(publish.body));
 const published=await invoke(instance.app,'/game/apps/:appId/published/:publishedId',{params:{appId:'slides',publishedId:publish.body.id}});
 assert.equal(published.statusCode,200);
 assert.deepEqual(Object.keys(JSON.parse(published.body.body).quiz),['questions']);
});

test('malformed submissions are rejected with 400 before touching progress',async()=>{
 const {instance,participant,start,submit}=fixture();
 const {body:{attemptId}}=await start();
 const cases=[
  [{attemptId,answers:[1,0,2]},'Stuur een quizpoging-id en per vraag-id één gekozen optie-id.'],
  [{answers:DAY1_CORRECT},'Stuur een quizpoging-id en per vraag-id één gekozen optie-id.'],
  [{attemptId,answers:{...DAY1_CORRECT,'d1-q2':1}},'Stuur een quizpoging-id en per vraag-id één gekozen optie-id.'],
  [{attemptId,answers:{'d1-q1':'b','d1-q2':'a'}},'Ongeldige quizantwoorden: vraag d1-q3 is niet beantwoord.'],
  [{attemptId,answers:{...DAY1_CORRECT,'d1-q3':'z'}},'Ongeldige quizantwoorden: onbekende optie z bij vraag d1-q3.'],
  [{attemptId,answers:{...DAY1_CORRECT,'d9-q9':'a'}},'Ongeldige quizantwoorden: onbekende vraag d9-q9.']
 ];
 for(const [body,error] of cases){
  const response=await submit(body);
  assert.equal(response.statusCode,400,JSON.stringify(body));
  assert.equal(response.body.error,error);
 }
 assert.deepEqual(instance.store.auth(participant.token).p.progressByDay,{});
});

test('a submitted attempt replays its result for identical answers and rejects different ones',async()=>{
 const {instance,participant,start,submit}=fixture();
 const {body:{attemptId}}=await start();
 const first=await submit({attemptId,answers:DAY1_CORRECT});
 assert.equal(first.body.score,3);
 const quizAt=instance.store.auth(participant.token).p.progressByDay['1'].quizAt;
 const replay=await submit({attemptId,answers:{...DAY1_CORRECT}});
 assert.equal(replay.statusCode,200);
 assert.deepEqual(replay.body,first.body);
 assert.equal(instance.store.auth(participant.token).p.progressByDay['1'].quizAt,quizAt);
 const changed=await submit({attemptId,answers:{...DAY1_CORRECT,'d1-q1':'a'}});
 assert.equal(changed.statusCode,409);
 assert.equal(changed.body.error,'Deze quizpoging is al ingeleverd met andere antwoorden. Start een nieuwe poging.');
 const retake=await start();
 const stale=await submit({attemptId,answers:DAY1_CORRECT});
 assert.equal(stale.statusCode,409);
 assert.equal(stale.body.error,'Onbekende quizpoging. Start de quiz opnieuw.');
 const second=await submit({attemptId:retake.body.attemptId,answers:{'d1-q1':'a','d1-q2':'a','d1-q3':'a'}});
 assert.equal(second.body.score,1);
 assert.equal(instance.store.auth(participant.token).p.progressByDay['1'].quizScore,1);
});

test('an attempt left open past the 30 minute idle timeout expires',async t=>{
 t.mock.timers.enable({apis:['Date'],now:Date.parse('2026-09-25T09:00:00Z')});
 const {start,submit}=fixture();
 assert.equal(QUIZ_ATTEMPT_TTL_MS,1_800_000);
 const opened=await start();
 assert.equal(opened.body.expiresAt,Date.parse('2026-09-25T09:30:00Z'));
 t.mock.timers.tick(QUIZ_ATTEMPT_TTL_MS+1);
 const expired=await submit({attemptId:opened.body.attemptId,answers:DAY1_CORRECT});
 assert.equal(expired.statusCode,410);
 assert.equal(expired.body.error,'Je quizpoging is verlopen (30 minuten zonder inleveren). Beantwoord de vragen opnieuw.');
 const fresh=await start();
 const scored=await submit({attemptId:fresh.body.attemptId,answers:DAY1_CORRECT});
 assert.equal(scored.body.score,3);
});

test('an attempt opened for one day cannot be submitted after the facilitator switches day',async()=>{
 const {instance,host,as,start,submit}=fixture();
 const {body:{attemptId}}=await start();
 await invoke(instance.app,'/game/control',{body:{action:'day',value:2},...as(host.token)});
 const response=await submit({attemptId,answers:{'d2-q1':'b','d2-q2':'a','d2-q3':'c'}});
 assert.equal(response.statusCode,409);
 const facilitatorStart=await invoke(instance.app,'/game/quiz/start',as(host.token));
 assert.equal(facilitatorStart.statusCode,400);
});

test('every shipped day pack passes the quiz and asset lint',()=>{
 const starterDir=path.resolve('starter');
 assert.deepEqual(dayPackIssues([1,2,3,4,5].map(getDayPack),{starterDir,starterFileNames}),[]);
});

test('the lint names every broken quiz and asset in a synthetic fixture',()=>{
 const starterDir=mkdtempSync(path.join(os.tmpdir(),'academy-starter-'));
 writeFileSync(path.join(starterDir,'README.md'),'synthetic fixture');
 const option=(id,label)=>({id,label});
 const question=(id,options)=>({id,kind:'single-choice',question:'Synthetische vraag',options});
 const broken=[
  {day:98,quiz:{questions:[question('x-q1',[option('a','A'),option('b','B')]),question('x-q1',[option('a','A'),option('a','A2')]),question('x-q3',[option('a','A'),option('b','B')])],key:{'x-q1':'z','x-q9':'a'}},mission:{starterFiles:['README.md','starter/README.md','CLAUDE.md']}},
  {day:97,quiz:{questions:[question('x-q7',[option('a','A'),option('b','B')])],key:{'x-q7':'b'}},mission:{starterFiles:['README.md']}},
  {day:99,quiz:{questions:[question('x-q7',[option('a','A'),option('b','B')])],key:{'x-q7':'a'}},mission:{starterFiles:[]}}
 ];
 const issues=dayPackIssues(broken,{starterDir,starterFileNames});
 assert.deepEqual(issues,[
  'day 98: quiz '+['duplicate question id "x-q1"','answer key for "x-q1" references unknown option "z"','question "x-q1" has duplicate option id "a"','answer key for "x-q1" references unknown option "z"','question "x-q3" has no answer key','answer key names unknown question "x-q9"'].join('; '),
  'day 98: starter file "starter/README.md" is not a served starter file',
  `day 98: starter file "CLAUDE.md" is missing from ${starterDir}`,
  'day 99: question id "x-q7" is already used on day 97'
 ]);
 assert.throws(()=>assertValidDayPacks(broken,{starterDir,starterFileNames}),/^Error: Invalid day-pack content:\n- day 98: quiz duplicate question id "x-q1"/);
});
