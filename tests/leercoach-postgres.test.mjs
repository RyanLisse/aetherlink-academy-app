import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {PostgresStore} from '../server/postgres-store.mjs';
import {coachQuotaKeys} from '../server/coach.mjs';

async function pool(){
 const {Pool}=await import('pg');
 const url=new URL(process.env.DATABASE_URL);
 url.searchParams.delete('sslmode');
 url.searchParams.delete('channel_binding');
 return new Pool({connectionString:url.href,ssl:process.env.PGSSLMODE==='disable'?false:{rejectUnauthorized:true},max:6,connectionTimeoutMillis:10000});
}

test('PostgresStore: coach caps hold across two instances, reset on the Amsterdam date and survive the access-attempt sweep',{skip:process.env.ACADEMY_POSTGRES_TEST!=='1'},async()=>{
 const schema=`academy_coach_${randomUUID().replaceAll('-','')}`;
 const clock={now:Date.parse('2026-09-26T21:30:00Z')};
 const [poolA,poolB]=[await pool(),await pool()];
 const a=await new PostgresStore(poolA,{schema,now:()=>clock.now}).init();
 const b=new PostgresStore(poolB,{schema,now:()=>clock.now});
 try{
  const config={participantCap:5,platformCap:8};
  const keys=personKey=>coachQuotaKeys({config,personKey,now:clock.now});
  const results=await Promise.all(Array.from({length:12},(_,i)=>(i%2?a:b).coachQuota(keys('p1'),{consume:true})));
  assert.equal(results.filter(r=>r.allowed).length,5);
  assert.deepEqual(results.filter(r=>r.allowed).map(r=>r.counts[0]).sort(),[1,2,3,4,5]);
  assert.deepEqual(await a.coachQuota(keys('p1')),{allowed:false,counts:[5,5]});

  const others=await Promise.all(Array.from({length:6},()=>b.coachQuota(keys('p2'),{consume:true})));
  assert.equal(others.filter(r=>r.allowed).length,3,'the platform cap of 8 leaves 3 after p1 used 5');
  assert.deepEqual(await b.coachQuota(keys('p2')),{allowed:false,counts:[3,8]});

  clock.now+=2*60*60*1000;
  await a.transaction(client=>a.consumeAttempts(client,[['ip:sweep',{max:20,windowMs:60*1000}]]));
  assert.deepEqual(await a.coachQuota(keys('p1')),{allowed:true,counts:[0,0]},'the next Amsterdam day starts at zero');
  const {rows}=await poolA.query(`SELECT count(*)::int AS n FROM "${schema}".access_attempts WHERE key LIKE 'coach:%'`);
  assert.equal(rows[0].n,3,'yesterday’s coach rows outlive the 1-hour access-attempt sweep');

  clock.now+=40*60*60*1000;
  assert.equal((await b.coachQuota(keys('p1'),{consume:true})).allowed,true);
  const left=await poolA.query(`SELECT key FROM "${schema}".access_attempts WHERE key LIKE 'coach:%' ORDER BY key`);
  assert.equal(left.rows.length,2,'rows older than the retention window are removed');
 }finally{
  await poolA.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await poolA.end();await poolB.end();
 }
});
