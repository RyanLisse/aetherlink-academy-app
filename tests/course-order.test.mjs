import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {Pool} from 'pg';
import {createApp} from '../server/app.mjs';
import {PostgresStore} from '../server/postgres-store.mjs';
import {Store} from '../server/store.mjs';
import {listRouteDays} from '../server/content.mjs';
import {courseOrder,courseTemplate,parseCourse} from '../content/days/course.mjs';

async function invoke(app,route,{method='get',body={},cookies={}}={}){
 const layer=app.router.stack.find(candidate=>candidate.route?.path===route&&candidate.route.methods[method]);assert.ok(layer,`Missing ${method} ${route}`);
 const response={statusCode:200,body:null};
 const req={body,query:{},headers:{cookie:Object.entries(cookies).map(([name,value])=>`${name}=${value}`).join('; ')}};
 const res={cookie(){return this;},clearCookie(){return this;},status(status){response.statusCode=status;return this;},json(value){response.body=value;return this;},end(){return this;}};
 await layer.route.stack[0].handle(req,res,error=>{response.statusCode=error.status||500;response.body={error:error.status?error.message:'Onverwachte serverfout.'};});
 return response;
}

function fixture(){
 const instance=createApp({dir:mkdtempSync(path.join(os.tmpdir(),'academy-course-order-')),hostKey:'test-host',publicBaseUrl:'http://127.0.0.1:4318'});
 const host=instance.store.create('Wave squad',{slug:'course-order'});
 const participant=instance.store.join(host.code,'Deelnemer');
 const as=token=>({cookies:{academy:token}});
 return {app:instance.app,host:as(host.token),participant:as(participant.token)};
}

const SYNTHETIC_COURSE={name:'Wave 2 · synthetische testcursus',days:[{day:5,title:'Start met SDLC',date:'2026-10-05'},{day:3},{day:1,title:'  ',date:''}]};

test('courseOrder without a course is the fixed 7-day order',()=>{
 assert.deepEqual(courseOrder(null).map(({position,day})=>[position,day]),[[1,1],[2,2],[3,3],[4,4],[5,5],[6,6],[7,7]]);
 assert.deepEqual(courseTemplate(),{name:'Wave · 7 dagen',days:[1,2,3,4,5,6,7].map(day=>({day,title:null,date:null}))});
});

test('parseCourse keeps order, drops excluded days and normalises overrides',()=>{
 const course=parseCourse(SYNTHETIC_COURSE);
 assert.deepEqual(course,{name:'Wave 2 · synthetische testcursus',days:[{day:5,title:'Start met SDLC',date:'2026-10-05'},{day:3,title:null,date:null},{day:1,title:null,date:null}]});
 assert.deepEqual(courseOrder(course).map(({position,day})=>[position,day]),[[1,5],[2,3],[3,1]]);
});

test('parseCourse rejects duplicates, unknown packs, empty courses, bad dates and missing names',()=>{
 const rejects=(input,message)=>assert.throws(()=>parseCourse(input),{status:400,message});
 rejects({name:'X',days:[{day:2},{day:2}]},'Dag 2 staat dubbel in de cursus.');
 rejects({name:'X',days:[{day:8}]},'Dag 8 bestaat niet als contentpakket.');
 rejects({name:'X',days:[{day:'1'}]},'Dag 1 bestaat niet als contentpakket.');
 rejects({name:'X',days:[]},'Neem minimaal één dag op in de cursus.');
 rejects({name:'X',days:[{day:1,date:'2026-02-30'}]},'Gebruik een datum als JJJJ-MM-DD.');
 rejects({name:' ',days:[{day:1}]},'Geef de cursus een naam.');
 rejects({name:'X',days:[{day:1,title:'x'.repeat(121)}]},'De dagtitel mag maximaal 120 tekens zijn.');
});

test('a room without a course keeps the fixed 1..7 route and plain day pack',async()=>{
 const {app,host,participant}=fixture();
 const route=await invoke(app,'/game/day-route',participant);
 assert.equal(route.statusCode,200);
 assert.equal(route.body.course,undefined);
 assert.deepEqual(route.body.days.map(d=>[d.position,d.day,d.date]),[[1,1,null],[2,2,null],[3,3,null],[4,4,null],[5,5,null],[6,6,null],[7,7,null]]);
 assert.equal(route.body.days[6].title,'Workshop 7 · Eigen opdracht: afronden');
 assert.equal((await invoke(app,'/game/control',{...host,method:'post',body:{action:'day',value:7}})).body.day,7);
 const pack=await invoke(app,'/game/day-pack',participant);
 assert.equal(pack.body.day,7);
 assert.equal(pack.body.title,'Workshop 7 · Eigen opdracht: afronden');
 assert.equal(pack.body.course,undefined);
});

test('with a course the day route, day control and day pack follow the course order',async()=>{
 const {app,host,participant}=fixture();
 await invoke(app,'/game/control',{...host,method:'post',body:{action:'day',value:2}});
 const saved=await invoke(app,'/game/control',{...host,method:'post',body:{action:'course',value:SYNTHETIC_COURSE}});
 assert.equal(saved.statusCode,200);
 assert.equal(saved.body.day,5,'room moves to the first course day when its day was excluded');
 assert.deepEqual(saved.body.course.days.map(d=>d.day),[5,3,1]);

 const route=await invoke(app,'/game/day-route',participant);
 assert.deepEqual(route.body.course,{name:'Wave 2 · synthetische testcursus'});
 assert.deepEqual(route.body.days.map(d=>[d.position,d.day,d.title,d.date]),[[1,5,'Start met SDLC','2026-10-05'],[2,3,'Workshop 3 · Agents in n8n',null],[3,1,'Classroom 1 · AI en Claude Code',null]]);

 const first=await invoke(app,'/game/day-pack',participant);
 assert.equal(first.body.day,5);
 assert.equal(first.body.title,'Start met SDLC');
 assert.deepEqual(first.body.course,{name:'Wave 2 · synthetische testcursus',position:1,count:3,date:'2026-10-05'});

 const excluded=await invoke(app,'/game/control',{...host,method:'post',body:{action:'day',value:2}});
 assert.equal(excluded.statusCode,400);
 assert.equal(excluded.body.error,'Dag 2 zit niet in de cursus.');

 assert.equal((await invoke(app,'/game/control',{...host,method:'post',body:{action:'day',value:3}})).body.day,3);
 const second=await invoke(app,'/game/day-pack',participant);
 assert.equal(second.body.mission.id,'TRIAGE-N8N-03');
 assert.deepEqual(second.body.course,{name:'Wave 2 · synthetische testcursus',position:2,count:3,date:null});

 const cleared=await invoke(app,'/game/control',{...host,method:'post',body:{action:'course',value:null}});
 assert.equal(cleared.body.course,null);
 assert.equal(cleared.body.day,3);
 assert.equal((await invoke(app,'/game/day-route',participant)).body.days.length,7);
});

test('participants cannot read the composer or change the course',async()=>{
 const {app,host,participant}=fixture();
 const write=await invoke(app,'/game/control',{...participant,method:'post',body:{action:'course',value:SYNTHETIC_COURSE}});
 assert.equal(write.statusCode,403);
 assert.equal(write.body.error,'Alleen de facilitator bedient de ronde.');
 const read=await invoke(app,'/game/course',participant);
 assert.equal(read.statusCode,403);
 assert.equal((await invoke(app,'/game/day-route',participant)).body.days.length,7);
 const composer=await invoke(app,'/game/course',host);
 assert.equal(composer.statusCode,200);
 assert.equal(composer.body.course,null);
 assert.deepEqual(composer.body.packs.map(pack=>pack.day),[1,2,3,4,5,6,7]);
 assert.deepEqual(composer.body.template.days.map(d=>d.day),[1,2,3,4,5,6,7]);
});

test('an invalid course is rejected and leaves the room unchanged',async()=>{
 const {app,host,participant}=fixture();
 const bad=await invoke(app,'/game/control',{...host,method:'post',body:{action:'course',value:{name:'X',days:[{day:4},{day:4}]}}});
 assert.equal(bad.statusCode,400);
 assert.equal((await invoke(app,'/game/day-route',participant)).body.course,undefined);
});

test('a course survives a committed cross-instance Postgres round trip',{skip:!process.env.DATABASE_URL},async()=>{
 const url=new URL(process.env.DATABASE_URL);url.searchParams.delete('sslmode');url.searchParams.delete('channel_binding');
 const pool=new Pool({connectionString:url.href,ssl:{rejectUnauthorized:true},connectionTimeoutMillis:10000});
 const schema=`academy_course_${randomUUID().replaceAll('-','')}`;
 const one=new PostgresStore(pool,{schema}),two=new PostgresStore(pool,{schema});
 const control=(store,token,action,value)=>store.withSession(token,'browser',({r})=>Store.prototype.control.call({save(){},remaining:store.remaining},r,action,value));
 try{
  await one.init();await two.init();
  const host=await one.create('Wave squad',{slug:'course-pg'}),person=await one.join(host.code,'Learner');
  await control(one,host.token,'course',SYNTHETIC_COURSE);
  const {r}=await two.auth(person.token,'browser');
  assert.equal(r.day,1,'day 1 stays current because the course includes it');
  assert.deepEqual(listRouteDays(r.course).map(d=>[d.position,d.day,d.title]),[[1,5,'Start met SDLC'],[2,3,'Workshop 3 · Agents in n8n'],[3,1,'Classroom 1 · AI en Claude Code']]);
  await assert.rejects(control(two,host.token,'day',6),{status:400,message:'Dag 6 zit niet in de cursus.'});
  await assert.rejects(two.control(person.token,'course',null),{status:403});
  await control(two,host.token,'course',null);
  assert.equal((await one.auth(person.token,'browser')).r.course,undefined);
 }finally{await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);await pool.end();}
});
