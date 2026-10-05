import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {Pool} from 'pg';
import {PostgresStore} from '../server/postgres-store.mjs';

test('facilitator login persists across instances and cleans up expired sessions',{skip:!process.env.DATABASE_URL},async()=>{
 const url=new URL(process.env.DATABASE_URL);url.searchParams.delete('sslmode');url.searchParams.delete('channel_binding');
 const pool=new Pool({connectionString:url.href,ssl:{rejectUnauthorized:true},connectionTimeoutMillis:10000});
 const schema=`academy_sso_test_${randomUUID().replaceAll('-','')}`;
 const one=new PostgresStore(pool,{schema}),two=new PostgresStore(pool,{schema});
 const identity={sub:'sso-test',email:'test@example.test',name:'Test facilitator',domain:'example.test'};
 try{
  await one.init();await two.init();
  const first=await one.facilitatorLogin(identity);
  assert.deepEqual(await two.facilitator(first),identity);
  await pool.query(`UPDATE "${schema}".facilitator_sessions SET expires_at=$1`,[Date.now()-1000]);
  const second=await two.facilitatorLogin(identity);
  assert.equal(await one.facilitator(first),null);
  assert.deepEqual(await one.facilitator(second),identity);
  assert.equal((await pool.query(`SELECT count(*)::int AS n FROM "${schema}".facilitator_sessions`)).rows[0].n,1);
  await one.facilitatorLogout(second);assert.equal(await two.facilitator(second),null);
 }finally{await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);await pool.end();}
});

test('facilitator delete cascades a squad and a cohort in Postgres',{skip:!process.env.DATABASE_URL},async()=>{
 const url=new URL(process.env.DATABASE_URL);url.searchParams.delete('sslmode');url.searchParams.delete('channel_binding');
 const pool=new Pool({connectionString:url.href,ssl:{rejectUnauthorized:true},connectionTimeoutMillis:10000});
 const schema=`academy_delete_test_${randomUUID().replaceAll('-','')}`;
 const store=new PostgresStore(pool,{schema});
 const count=async(table,where='',values=[])=>(await pool.query(`SELECT count(*)::int AS n FROM "${schema}".${table}${where?' WHERE '+where:''}`,values)).rows[0].n;
 try{
  await store.init();
  const keep=await store.create('Keep');
  const room=await store.create('Wave room');
  const solo=await store.create('Solo squad');
  const bob=await store.join(solo.code,'Bob');
  const {cohort,codes}=await store.createCohort({name:'AET softlive Wave',startsAt:Date.now(),days:5,readOnlyExport:true},['Alice','Carol'],null);
  await store.attachCohortRoom(cohort.id,room.roomId);
  const alice=await store.activateCohortCode(codes[0].code,{ip:'127.0.0.1'});
  await store.issueCertificate(cohort.id,codes[0].memberId,null).catch(()=>{});
  await assert.rejects(store.deleteCohort(randomUUID()),{status:404});
  const cohortResult=await store.deleteCohort(cohort.id);
  assert.equal(cohortResult.deleted,true);
  assert.equal(cohortResult.members,2);
  assert.deepEqual(cohortResult.rooms,[room.roomId]);
  for(const table of ['cohorts','cohort_members','cohort_access_codes','cohort_certificates'])assert.equal(await count(table),0,table);
  assert.equal(await count('sessions','person_id=ANY($1)',[codes.map(code=>code.memberId)]),0);
  await assert.rejects(store.auth(alice.token,'browser'),{status:401});
  const detached=(await pool.query(`SELECT data FROM "${schema}".rooms WHERE id=$1`,[room.roomId])).rows[0].data;
  assert.equal(detached.cohortId,undefined);
  assert.ok(detached.members.every(member=>!['Alice','Carol'].includes(member.name)));
  await assert.rejects(store.deleteRoom(randomUUID()),{status:404});
  const roomResult=await store.deleteRoom(solo.roomId);
  assert.deepEqual(roomResult,{deleted:true,roomId:solo.roomId,members:1});
  assert.equal(await count('rooms','id=$1',[solo.roomId]),0);
  assert.equal(await count('sessions','room_id=$1',[solo.roomId]),0);
  await assert.rejects(store.auth(bob.token,'browser'),{status:401});
  await store.deleteRoom(room.roomId);
  assert.deepEqual((await store.overview()).map(squad=>squad.id),[keep.roomId]);
 }finally{await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);await pool.end();}
});
