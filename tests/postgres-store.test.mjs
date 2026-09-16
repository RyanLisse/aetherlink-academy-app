import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {PostgresStore} from '../server/postgres-store.mjs';

const enabled=process.env.ACADEMY_POSTGRES_TEST==='1';
test('Postgres Academy state survives independent concurrent instances', {skip:!enabled}, async()=>{
 const {Pool}=await import('pg');
 const url=new URL(process.env.DATABASE_URL);
 url.searchParams.delete('sslmode');
 url.searchParams.delete('channel_binding');
 const pool=new Pool({connectionString:url.href,ssl:{rejectUnauthorized:true},max:8,connectionTimeoutMillis:10000});
 const schema=`academy_test_${randomUUID().replaceAll('-','')}`;
 const one=new PostgresStore(pool,{schema});
 const two=new PostgresStore(pool,{schema});
 try {
  await one.init();
  const migration=(await pool.query(`SELECT value FROM "${schema}".system_metadata WHERE key='academy_schema_migration'`)).rows[0]?.value;
  assert.match(migration,/^3:[a-f0-9]{64}$/);
  await two.init();
  const room=await one.create('Concurrency',{slug:'test-document',editor:'test-editor'});
  const joined=await Promise.allSettled(Array.from({length:15},(_,i)=>(i%2?one:two).join(room.code,`Participant ${i}`)));
  assert.equal(joined.filter(r=>r.status==='fulfilled').length,12);
  assert.equal(joined.filter(r=>r.status==='rejected'&&r.reason.status===409).length,3);
  const participant=joined.find(r=>r.status==='fulfilled').value;
  const before=await two.auth(room.token,'browser');
  assert.equal(before.r.members.length,12);
  assert.equal(before.r.version,13);
  await one.control(room.token,'phase','Test');
  await Promise.all([one.control(room.token,'next'),two.control(room.token,'next')]);
  const after=await two.auth(room.token,'browser');
  assert.equal(after.r.round,3);
  assert.equal(after.r.driver,2);
  assert.equal(after.r.phase,'Test');
  const first=await one.rotateMcpToken(participant.token);
  assert.equal((await two.auth(first.token,'mcp')).s.kind,'mcp');
  const second=await two.rotateMcpToken(participant.token);
  await assert.rejects(one.auth(first.token,'mcp'),error=>error.status===401);
  assert.equal((await one.auth(second.token,'mcp')).s.kind,'mcp');
  await assert.rejects(one.withSession(room.token,'browser',({r})=>{r.name='Rollback';throw Error('rollback sentinel');}),/rollback sentinel/);
  assert.equal((await two.auth(room.token)).r.name,'Concurrency');
  await one.transaction(async client=>{
   await client.query('LOCK TABLE rooms IN ROW EXCLUSIVE MODE');
   let deadline;
   const initializing=two.init();
   try {
    await Promise.race([
     initializing,
     new Promise((_,reject)=>{deadline=setTimeout(()=>reject(new Error('Restart attempted DDL while a live Academy writer held its table lock')),2000);}),
    ]);
   } finally {
    clearTimeout(deadline);
    void initializing.catch(()=>{});
   }
  });
  assert.equal((await two.auth(room.token)).r.name,'Concurrency');
  const intent={id:randomUUID(),finding:'one evidence'};
  const reservations=await Promise.all([one.reserveRequest(participant.token,'evidence','req-1','payload',intent),two.reserveRequest(participant.token,'evidence','req-1','payload',{id:'losing-id'})]);
  assert.deepEqual(reservations[0].intent,reservations[1].intent);
  await assert.rejects(one.reserveRequest(participant.token,'evidence','req-1','different',intent),error=>error.status===409);
  let applied=0;
  const apply=({r},saved)=>{applied++;r.evidence.push(saved);return saved;};
  const completed=await Promise.all([one.completeRequest(participant.token,'evidence','req-1','payload',apply),two.completeRequest(participant.token,'evidence','req-1','payload',apply)]);
  assert.equal(applied,1);
  assert.deepEqual(completed[0],completed[1]);
  assert.equal((await one.auth(participant.token)).r.evidence.length,1);
  for (const kind of ['review','handoff']) {
   await one.reserveRequest(participant.token,kind,'same-id','payload',{kind});
   await assert.rejects(one.completeRequest(participant.token,kind,'same-id','payload',({r})=>{r.name='Must roll back';throw Error('request rollback');}),/request rollback/);
   assert.equal((await two.auth(room.token)).r.name,'Concurrency');
   const outcome=await two.completeRequest(participant.token,kind,'same-id','payload',(_context,saved)=>saved);
   assert.deepEqual(outcome,{kind});
   assert.equal((await one.reserveRequest(participant.token,kind,'same-id','payload',{})).completed,true);
  }
  await two.logout(participant.token);
  await assert.rejects(one.auth(participant.token),error=>error.status===401);
  assert.equal(one.view(after.r,after.s).documentSlug,'test-document');
 } finally {
  await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await pool.end();
 }
});

test('Academy schema migration fails closed for changed or unversioned state', {skip:!enabled}, async()=>{
 const {Pool}=await import('pg');
 const url=new URL(process.env.DATABASE_URL);
 url.searchParams.delete('sslmode');
 url.searchParams.delete('channel_binding');
 const pool=new Pool({connectionString:url.href,ssl:{rejectUnauthorized:true},max:4,connectionTimeoutMillis:10000});
 const schema=`academy_test_${randomUUID().replaceAll('-','')}`;
 const one=new PostgresStore(pool,{schema});
 const two=new PostgresStore(pool,{schema});
 try {
  await one.init();
  const original=(await pool.query(`SELECT value FROM "${schema}".system_metadata WHERE key='academy_schema_migration'`)).rows[0].value;
  await pool.query(`UPDATE "${schema}".system_metadata SET value='1:unsupported-checksum' WHERE key='academy_schema_migration'`);
  await assert.rejects(two.init(),/version or checksum differs/);
  await pool.query(`DELETE FROM "${schema}".system_metadata WHERE key='academy_schema_migration'`);
  await assert.rejects(two.init(),/unversioned.*offline migration/);
  await pool.query(`DROP TABLE "${schema}".facilitator_sessions`);
  await pool.query(`ALTER TABLE "${schema}".sessions DROP COLUMN display_name`);
  await pool.query(`INSERT INTO "${schema}".system_metadata (key,value,updated_at) VALUES ('academy_schema_migration',$1,$2)`,['1:cfd75de0661902abf5fd6d4b2fe2984d7e9228cc111392e96686ed29d228b3e1',new Date().toISOString()]);
  await two.init();
  assert.equal((await pool.query(`SELECT value FROM "${schema}".system_metadata WHERE key='academy_schema_migration'`)).rows[0].value,original);
  assert.equal((await pool.query(`SELECT 1 FROM "${schema}".facilitator_sessions`)).rowCount,0);
  assert.equal((await pool.query(`SELECT display_name FROM "${schema}".sessions LIMIT 1`)).rowCount,0);
 } finally {
  await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await pool.end();
 }
});

test('Postgres schema name is validated before SQL',()=>{
 assert.throws(()=>new PostgresStore({}, {schema:'public; DROP TABLE rooms'}),/Invalid Academy schema/);
});
