import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {PostgresStore} from '../server/postgres-store.mjs';

const DAY=24*60*60*1000;
const START=Date.parse('2026-10-05T00:00:00Z');
const WAVE={name:'Wave oktober (synthetisch)',startsAt:START,days:1,readOnlyExport:true};

test('PostgresStore: automatic certificate issuance is idempotent under concurrency, revocation is final, retention cascades',{skip:process.env.ACADEMY_POSTGRES_TEST!=='1'},async()=>{
 const {Pool}=await import('pg');
 const url=new URL(process.env.DATABASE_URL);
 url.searchParams.delete('sslmode');
 url.searchParams.delete('channel_binding');
 const pool=new Pool({connectionString:url.href,ssl:process.env.PGSSLMODE==='disable'?false:{rejectUnauthorized:true},max:8});
 const schema=`academy_certificate_${randomUUID().replaceAll('-','')}`;
 const clock={now:START};
 try {
  const store=await new PostgresStore(pool,{schema,now:()=>clock.now}).init();
  const room=await store.create('Squad Orion',{slug:`proof-${randomUUID()}`});
  const {cohort,codes:[alice,bob]}=await store.createCohort(WAVE,['Alice Jansen','Bob'],{email:'facilitator@example.test',name:'Facilitator (synthetisch)'});
  await store.attachCohortRoom(cohort.id,room.roomId);
  const session=(await store.activateCohortCode(alice.code,{ip:'203.0.113.7'})).token;
  const bobSession=(await store.activateCohortCode(bob.code,{ip:'203.0.113.8'})).token;
  const count=async()=>(await pool.query(`SELECT count(*)::int AS count FROM "${schema}".cohort_certificates`)).rows[0].count;

  assert.deepEqual(await store.myCertificate(session),{cohortName:'Wave oktober (synthetisch)',days:1,eligible:false,daysCompleted:0,reasons:[{code:'quiz-missing',day:1},{code:'evidence-missing',day:1}],status:'not-eligible',id:null,issuedAt:null,revokedAt:null});
  assert.equal(await count(),0);
  await store.withSession(session,'browser',({r,p})=>{p.progressByDay={'1':{quizScore:3}};r.evidence.push({id:'evidence-1',personId:p.id,name:p.name,day:1,status:'accepted',review:{by:bob.memberId}});});

  const results=await Promise.all([...Array(6)].map(()=>store.myCertificate(session)).concat(store.cohortOverview(),store.cohortOverview()));
  const {id}=results[0];
  assert.match(id,/^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
  assert.deepEqual(results.slice(0,6).map(result=>[result.status,result.id]),Array(6).fill(['issued',id]));
  assert.deepEqual(results.slice(6).map(overview=>overview[0].members[0].certificate.id),[id,id]);
  assert.equal(await count(),1);
  assert.deepEqual(await store.certificate(id),{id,cohortId:cohort.id,memberId:alice.memberId,name:'Alice Jansen',cohortName:'Wave oktober (synthetisch)',startsAt:START,endsAt:START+DAY,days:1,issuedAt:START,issuedBy:null,revokedAt:null});
  const other=await store.myCertificate(bobSession);
  assert.deepEqual([other.status,other.id],['not-eligible',null]);

  clock.now=START+2*DAY;
  const revoked=await store.revokeCertificate(cohort.id,id);
  assert.deepEqual([revoked.members[0].certificate.status,revoked.members[0].certificate.id,revoked.members[0].certificate.revokedAt],['revoked',null,START+2*DAY]);
  assert.equal((await store.certificate(id)).revokedAt,START+2*DAY);
  await assert.rejects(store.revokeCertificate(cohort.id,'0000-0000-0000-0000'),error=>error.status===404);
  const fresh=(await store.activateCohortCode(alice.code,{ip:'203.0.113.7'})).token;
  const later=await Promise.all([store.myCertificate(fresh),store.cohortOverview()]);
  assert.deepEqual([later[0].status,later[0].id],['revoked',null]);
  assert.equal(later[1][0].members[0].certificate.status,'revoked');
  assert.equal(await count(),1,'a revoked certificate is never reissued automatically');

  clock.now=START+DAY+180*DAY;
  assert.equal((await store.purgeExpiredCohorts()).purged[0].certificates,1);
  await store.purgeExpiredCohorts({dryRun:false});
  assert.equal(await store.certificate(id),null);
  assert.equal((await pool.query(`SELECT count(*)::int AS count FROM "${schema}".cohort_certificates`)).rows[0].count,0);
  const leftovers=JSON.stringify([...(await pool.query(`SELECT data FROM "${schema}".rooms`)).rows,...(await pool.query(`SELECT * FROM "${schema}".requests`)).rows]);
  assert.ok(!leftovers.includes('Alice Jansen'));
 } finally {
  await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await pool.end();
 }
});
