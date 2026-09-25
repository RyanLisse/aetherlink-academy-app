import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtempSync, readFileSync, rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {LocalStore} from '../server/local-store.mjs';
import {PostgresStore} from '../server/postgres-store.mjs';
import {dayProgress} from '../server/progress.mjs';

const DAY=24*60*60*1000;
const START=Date.parse('2026-10-05T00:00:00Z');
const WAVE={name:'Wave oktober (synthetisch)',startsAt:START,days:5,readOnlyExport:true};
const CODE=/^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;

function localBackend(){
 const dir=mkdtempSync(path.join(os.tmpdir(),'academy-cohort-'));
 const clock={now:START};
 const store=new LocalStore(dir,{now:()=>clock.now});
 return {store,clock,dump:async()=>readFileSync(path.join(dir,'rooms.json'),'utf8'),close:async()=>rmSync(dir,{recursive:true,force:true})};
}

async function postgresBackend(){
 const {Pool}=await import('pg');
 const url=new URL(process.env.DATABASE_URL);
 url.searchParams.delete('sslmode');
 url.searchParams.delete('channel_binding');
 const pool=new Pool({connectionString:url.href,ssl:process.env.PGSSLMODE==='disable'?false:{rejectUnauthorized:true},max:4,connectionTimeoutMillis:10000});
 const schema=`academy_cohort_${randomUUID().replaceAll('-','')}`;
 const clock={now:START};
 const store=await new PostgresStore(pool,{schema,now:()=>clock.now}).init();
 const dump=async()=>{const rows=[];for(const table of ['cohorts','cohort_members','cohort_access_codes','sessions','rooms','access_attempts','requests','decks','participant_access','cohort_certificates'])rows.push(...(await pool.query(`SELECT * FROM "${schema}".${table}`)).rows);return JSON.stringify(rows);};
 return {store,clock,pool,schema,dump,close:async()=>{await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);await pool.end();}};
}

const backends=[
 ['LocalStore',localBackend,{}],
 ['PostgresStore',postgresBackend,{skip:process.env.ACADEMY_POSTGRES_TEST!=='1'}],
];

const activate=(store,code,ip=randomUUID())=>store.activateCohortCode(code,{ip});
const rejectsWith=(run,code)=>assert.rejects(async()=>run(),error=>error.status===code);
const authOf=async(store,token,kind)=>store.auth(token,kind);

async function wave(store,names=['Alice','Bob'],input=WAVE){
 const room=await store.create('Squad Orion',{slug:`proof-${randomUUID()}`});
 const created=await store.createCohort(input,names,{email:'facilitator@example.test',name:'Facilitator (synthetisch)'});
 const code=name=>created.codes.find(entry=>entry.name===name);
 return {room,cohort:created.cohort,codes:created.codes,code};
}

for (const [label,backend,options] of backends) {
 test(`${label}: cohort codes are typeable, shown once and stored only as hashes`,options,async()=>{
  const env=await backend();
  try {
   const {room,cohort,codes,code}=await wave(env.store);
   assert.deepEqual(codes.map(entry=>entry.name),['Alice','Bob']);
   for (const entry of codes) assert.match(entry.code,CODE);
   const dump=await env.dump();
   for (const entry of codes) {
    assert.equal(dump.includes(entry.code),false);
    assert.equal(dump.includes(entry.code.replaceAll('-','')),false);
   }
   await rejectsWith(()=>activate(env.store,code('Alice').code),409);
   await env.store.attachCohortRoom(cohort.id,room.roomId);
   const typed=code('Alice').code.replaceAll('-','').toLowerCase().replaceAll('0','o');
   const session=await activate(env.store,typed);
   assert.equal(session.roomId,room.roomId);
   assert.equal(session.cohortId,cohort.id);
   assert.equal(session.readOnly,false);
   const {r,s,p}=await authOf(env.store,session.token,'browser');
   assert.equal(p.id,code('Alice').memberId);
   assert.equal(p.cohortMemberId,code('Alice').memberId);
   const view=env.store.view(r,s);
   assert.equal(view.me.name,'Alice');
   assert.equal(view.code,null);
   assert.equal((await env.store.auth(room.token,'browser')).r.code,room.code);
   await rejectsWith(()=>env.store.join(room.code,'Mallory'),403);
   assert.equal(view.readOnly,false);
   await rejectsWith(()=>activate(env.store,'AAAA-BBBB-CCCC-DDDD'),401);
   const [overview]=await env.store.cohortOverview();
   assert.deepEqual(overview.members.map(member=>[member.name,member.status,member.seated]),[['Alice','activated',true],['Bob','issued',false]]);
   assert.equal(overview.activeEndsAt,START+90*DAY);
   assert.equal(overview.readOnlyEndsAt,START+104*DAY);
   assert.equal(overview.purgeAt,START+185*DAY);
   assert.deepEqual(overview.rooms,[{id:room.roomId,name:'Squad Orion',code:room.code}]);
  } finally {await env.close();}
 });

 test(`${label}: access runs 90 days from cohort start, then 14 days read-only, then closes`,options,async()=>{
  const env=await backend();
  try {
   const {room,cohort,code}=await wave(env.store);
   await env.store.attachCohortRoom(cohort.id,room.roomId);
   env.clock.now=START+90*DAY-60*60*1000;
   const late=await activate(env.store,code('Alice').code);
   assert.equal(late.readOnly,false);
   env.clock.now=START+90*DAY-1;
   assert.equal((await authOf(env.store,late.token,'browser')).s.readOnly,undefined);
   env.clock.now=START+90*DAY;
   await rejectsWith(()=>authOf(env.store,late.token,'browser'),401);
   const readOnly=await activate(env.store,code('Alice').code);
   assert.equal(readOnly.readOnly,true);
   const {r,s}=await authOf(env.store,readOnly.token,'browser');
   assert.equal(s.readOnly,true);
   assert.equal(env.store.view(r,s).readOnly,true);
   await rejectsWith(()=>env.store.withSession(readOnly.token,'browser',({p})=>{p.help=true;}),403);
   await rejectsWith(()=>env.store.rotateMcpToken(readOnly.token),403);
   await rejectsWith(()=>env.store.reserveRequest(readOnly.token,'evidence','request-1','hash',{}),403);
   env.clock.now=START+104*DAY-1;
   assert.equal((await activate(env.store,code('Bob').code)).readOnly,true);
   env.clock.now=START+104*DAY;
   await rejectsWith(()=>activate(env.store,code('Alice').code),403);
   const strict=await env.store.createCohort({...WAVE,name:'Wave zonder export (synthetisch)',readOnlyExport:false},['Carol'],null);
   const strictRoom=await env.store.create('Squad Lyra',{slug:`proof-${randomUUID()}`});
   await env.store.attachCohortRoom(strict.cohort.id,strictRoom.roomId);
   env.clock.now=START+90*DAY;
   await rejectsWith(()=>activate(env.store,strict.codes[0].code),403);
  } finally {await env.close();}
 });

 test(`${label}: facilitator revoke kills browser and MCP sessions immediately`,options,async()=>{
  const env=await backend();
  try {
   const {room,cohort,code}=await wave(env.store);
   await env.store.attachCohortRoom(cohort.id,room.roomId);
   const browser=await activate(env.store,code('Alice').code);
   const mcp=await env.store.rotateMcpToken(browser.token);
   const bob=await activate(env.store,code('Bob').code);
   assert.equal((await authOf(env.store,mcp.token,'mcp')).p.name,'Alice');
   const overview=await env.store.revokeCohortMember(cohort.id,code('Alice').memberId);
   assert.deepEqual(overview.members.map(member=>[member.name,member.status]),[['Alice','revoked'],['Bob','activated']]);
   await rejectsWith(()=>authOf(env.store,browser.token,'browser'),401);
   await rejectsWith(()=>authOf(env.store,mcp.token,'mcp'),401);
   await rejectsWith(()=>activate(env.store,code('Alice').code),401);
   assert.equal((await authOf(env.store,bob.token,'browser')).p.name,'Bob');
  } finally {await env.close();}
 });

 test(`${label}: reissue invalidates the old code and sessions and keeps the seat identity`,options,async()=>{
  const env=await backend();
  try {
   const {room,cohort,code}=await wave(env.store);
   await env.store.attachCohortRoom(cohort.id,room.roomId);
   const old=await activate(env.store,code('Alice').code);
   const reissued=await env.store.reissueCohortCode(cohort.id,code('Alice').memberId);
   assert.equal(reissued.name,'Alice');
   assert.match(reissued.code,CODE);
   assert.notEqual(reissued.code,code('Alice').code);
   await rejectsWith(()=>activate(env.store,code('Alice').code),401);
   await rejectsWith(()=>authOf(env.store,old.token,'browser'),401);
   const fresh=await activate(env.store,reissued.code);
   const {r,p}=await authOf(env.store,fresh.token,'browser');
   assert.equal(p.id,code('Alice').memberId);
   assert.deepEqual(r.members.map(member=>member.name),['Alice']);
   const [overview]=await env.store.cohortOverview();
   assert.deepEqual(overview.members.map(member=>[member.name,member.status]),[['Alice','activated'],['Bob','issued']]);
  } finally {await env.close();}
 });

 test(`${label}: activation is rate limited per code and per IP`,options,async()=>{
  const env=await backend();
  try {
   const {room,cohort,code}=await wave(env.store);
   await env.store.attachCohortRoom(cohort.id,room.roomId);
   for (let attempt=0;attempt<5;attempt++) assert.equal((await activate(env.store,code('Alice').code)).roomId,room.roomId);
   await rejectsWith(()=>activate(env.store,code('Alice').code),429);
   env.clock.now+=60*60*1000;
   assert.equal((await activate(env.store,code('Alice').code)).roomId,room.roomId);
   for (let attempt=0;attempt<20;attempt++) await rejectsWith(()=>activate(env.store,`ZZZZ-ZZZZ-ZZZZ-${String(attempt).padStart(4,'0')}`,'203.0.113.7'),401);
   await rejectsWith(()=>activate(env.store,code('Bob').code,'203.0.113.7'),429);
   assert.equal((await activate(env.store,code('Bob').code,'203.0.113.8')).roomId,room.roomId);
  } finally {await env.close();}
 });

 test(`${label}: cohorts are isolated from each other`,options,async()=>{
  const env=await backend();
  try {
   const a=await wave(env.store,['Alice']);
   const b=await wave(env.store,['Alice']);
   await env.store.attachCohortRoom(a.cohort.id,a.room.roomId);
   await env.store.attachCohortRoom(b.cohort.id,b.room.roomId);
   await rejectsWith(()=>env.store.attachCohortRoom(b.cohort.id,a.room.roomId),409);
   const inA=await activate(env.store,a.code('Alice').code);
   const inB=await activate(env.store,b.code('Alice').code);
   assert.equal(inA.roomId,a.room.roomId);
   assert.equal(inB.roomId,b.room.roomId);
   assert.notEqual((await authOf(env.store,inA.token,'browser')).p.id,(await authOf(env.store,inB.token,'browser')).p.id);
   await rejectsWith(()=>env.store.revokeCohortMember(b.cohort.id,a.code('Alice').memberId),404);
   await env.store.revokeCohortMember(a.cohort.id,a.code('Alice').memberId);
   await rejectsWith(()=>authOf(env.store,inA.token,'browser'),401);
   assert.equal((await authOf(env.store,inB.token,'browser')).r.id,b.room.roomId);
  } finally {await env.close();}
 });

 test(`${label}: progress follows the member across two rooms of one cohort`,options,async()=>{
  const env=await backend();
  try {
   const {room:first,cohort,code}=await wave(env.store,['Alice']);
   await env.store.attachCohortRoom(cohort.id,first.roomId);
   const day1=await activate(env.store,code('Alice').code);
   await env.store.withSession(day1.token,'browser',({p})=>{p.route='guided';p.quiz={score:1,at:'2026-10-05T09:00:00.000Z',day:1};p.progressByDay={'1':{quizScore:1,route:'guided',quizAt:'2026-10-05T09:00:00.000Z',labs:{'lab-1':{source:'arcade-lab',score:2,completedAt:'2026-10-05T11:00:00.000Z'}},reflection:{learned:'Intent eerst',next:'Kleinere stappen',at:'2026-10-05T15:00:00.000Z'}}};});
   const second=await env.store.create('Squad Orion dag 2',{slug:`proof-${randomUUID()}`});
   env.clock.now+=DAY;
   await env.store.attachCohortRoom(cohort.id,second.roomId);
   const day2=await activate(env.store,code('Alice').code);
   assert.equal(day2.roomId,second.roomId);
   const {r,p}=await authOf(env.store,day2.token,'browser');
   assert.equal(p.id,code('Alice').memberId);
   assert.equal(p.route,'guided');
   assert.deepEqual(p.quiz,{score:1,at:'2026-10-05T09:00:00.000Z',day:1});
   assert.equal(dayProgress(r,p,1).quizScore,1);
   assert.equal(dayProgress(r,p,1).reflection.learned,'Intent eerst');
   assert.deepEqual(p.progressByDay['1'].labs,{'lab-1':{source:'arcade-lab',score:2,completedAt:'2026-10-05T11:00:00.000Z'}});
   await env.store.withSession(day2.token,'browser',({p})=>{p.progressByDay['1']={...p.progressByDay['1'],quizScore:3};p.progressByDay['2']={quizScore:3,route:'stretch'};});
   env.clock.now+=DAY;
   await env.store.attachCohortRoom(cohort.id,first.roomId);
   const back=await activate(env.store,code('Alice').code);
   assert.equal(back.roomId,first.roomId);
   const again=(await authOf(env.store,back.token,'browser')).p;
   assert.deepEqual(Object.keys(again.progressByDay).sort(),['1','2']);
   assert.equal(again.progressByDay['2'].route,'stretch');
   assert.equal(again.progressByDay['1'].quizScore,3);
   assert.equal(again.progressByDay['1'].reflection.learned,'Intent eerst');
   assert.equal(again.progressByDay['1'].labs['lab-1'].score,2);
   await rejectsWith(()=>env.store.rotateParticipantAccess(back.token),409);
  } finally {await env.close();}
 });

 test(`${label}: retention anonymizes a cohort 180 days after it ends and leaves younger cohorts alone`,options,async()=>{
  const env=await backend();
  try {
   const old=await wave(env.store,['Alice']);
   const young=await wave(env.store,['Dana'],{...WAVE,name:'Wave november (synthetisch)',startsAt:START+30*DAY});
   await env.store.attachCohortRoom(old.cohort.id,old.room.roomId);
   await env.store.attachCohortRoom(young.cohort.id,young.room.roomId);
   const alice=await activate(env.store,old.code('Alice').code);
   await env.store.withSession(alice.token,'browser',({r,p})=>{p.progressByDay={'1':{quizScore:2}};r.evidence.push({id:'evidence-1',personId:p.id,name:'Alice',day:1,status:'pending'});r.handoffs.push({id:'handoff-1',day:1,by:p.id,decision:'Alice kiest de kleine stap',checked:'tests',open:'-',next:'Alice'});});
   const purgeAt=START+5*DAY+180*DAY;
   env.clock.now=purgeAt-1;
   assert.deepEqual(await env.store.purgeExpiredCohorts({dryRun:false}),{dryRun:false,purged:[]});
   env.clock.now=purgeAt;
   const dry=await env.store.purgeExpiredCohorts();
   assert.deepEqual(dry,{dryRun:true,purged:[{cohortId:old.cohort.id,members:1,rooms:[old.room.roomId],certificates:0}]});
   assert.equal((await env.store.cohortOverview()).length,2);
   const applied=await env.store.purgeExpiredCohorts({dryRun:false});
   assert.deepEqual(applied.purged.map(entry=>entry.cohortId),[old.cohort.id]);
   assert.deepEqual((await env.store.cohortOverview()).map(cohort=>cohort.name),['Wave november (synthetisch)']);
   await rejectsWith(()=>authOf(env.store,alice.token,'browser'),401);
   await rejectsWith(()=>activate(env.store,old.code('Alice').code),401);
   const {r}=await authOf(env.store,(await env.store.attachFacilitator(old.room.roomId,'Facilitator')).token,'browser');
   assert.deepEqual(r.members.map(member=>[member.name,member.progressByDay]),[['Geanonimiseerd',{}]]);
   assert.deepEqual(r.evidence,[]);
   assert.deepEqual([r.handoffs[0].next,r.handoffs[0].decision],['Geanonimiseerd','Geanonimiseerd']);
   assert.equal(r.cohortId,undefined);
   assert.equal((await env.dump()).includes('Alice'),false);
  } finally {await env.close();}
 });
}

test('PostgresStore: activation fails closed when the attempt counter cannot be written',{skip:process.env.ACADEMY_POSTGRES_TEST!=='1'},async()=>{
 const env=await postgresBackend();
 try {
  const {room,cohort,code}=await wave(env.store);
  await env.store.attachCohortRoom(cohort.id,room.roomId);
  await env.pool.query(`DROP TABLE "${env.schema}".access_attempts`);
  await assert.rejects(activate(env.store,code('Alice').code));
  const sessions=await env.pool.query(`SELECT person_id FROM "${env.schema}".sessions`);
  assert.deepEqual(sessions.rows.map(row=>row.person_id),['facilitator']);
 } finally {await env.close();}
});
