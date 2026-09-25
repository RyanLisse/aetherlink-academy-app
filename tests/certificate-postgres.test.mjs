import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {PostgresStore} from '../server/postgres-store.mjs';

const DAY=24*60*60*1000;
const START=Date.parse('2026-10-05T00:00:00Z');
const WAVE={name:'Wave oktober (synthetisch)',startsAt:START,days:1,readOnlyExport:true};

test('PostgresStore: facilitator-gated certificate lifecycle and retention cascade',{skip:process.env.ACADEMY_POSTGRES_TEST!=='1'},async()=>{
 const {Pool}=await import('pg');
 const url=new URL(process.env.DATABASE_URL);
 url.searchParams.delete('sslmode');
 url.searchParams.delete('channel_binding');
 const pool=new Pool({connectionString:url.href,ssl:process.env.PGSSLMODE==='disable'?false:{rejectUnauthorized:true},max:4});
 const schema=`academy_certificate_${randomUUID().replaceAll('-','')}`;
 const clock={now:START};
 try {
  const store=await new PostgresStore(pool,{schema,now:()=>clock.now}).init();
  const room=await store.create('Squad Orion',{slug:`proof-${randomUUID()}`});
  const {cohort,codes:[alice]}=await store.createCohort(WAVE,['Alice Jansen'],{email:'facilitator@example.test',name:'Facilitator (synthetisch)'});
  await store.attachCohortRoom(cohort.id,room.roomId);
  const session=(await store.activateCohortCode(alice.code,{ip:'203.0.113.7'})).token;
  await assert.rejects(store.issueCertificate(cohort.id,alice.memberId,null),error=>error.status===409&&error.message==='Nog geen certificaat mogelijk: Dag 1: quiz niet gemaakt; Dag 1: geen bewijs ingediend.');
  await store.withSession(session,'browser',({r,p})=>{p.progressByDay={'1':{quizScore:3}};r.evidence.push({id:'evidence-1',personId:p.id,name:p.name,day:1,status:'accepted'});});

  const issued=await store.issueCertificate(cohort.id,alice.memberId,{email:'facilitator@example.test',name:'Facilitator (synthetisch)'});
  const {id}=issued.members[0].certificate;
  assert.deepEqual(await store.certificate(id),{id,cohortId:cohort.id,memberId:alice.memberId,name:'Alice Jansen',cohortName:'Wave oktober (synthetisch)',startsAt:START,endsAt:START+DAY,days:1,issuedAt:START,issuedBy:{email:'facilitator@example.test',name:'Facilitator (synthetisch)'},revokedAt:null});
  const [first,second]=await Promise.all([store.issueCertificate(cohort.id,alice.memberId,null),store.issueCertificate(cohort.id,alice.memberId,null)]);
  assert.equal(first.members[0].certificate.id,id);
  assert.equal(second.members[0].certificate.id,id);

  clock.now=START+2*DAY;
  const revoked=await store.revokeCertificate(cohort.id,id);
  assert.equal(revoked.members[0].certificate.id,null);
  assert.equal((await store.certificate(id)).revokedAt,START+2*DAY);
  await assert.rejects(store.revokeCertificate(cohort.id,'0000-0000-0000-0000'),error=>error.status===404);
  const again=(await store.issueCertificate(cohort.id,alice.memberId,null)).members[0].certificate.id;
  assert.notEqual(again,id);

  clock.now=START+DAY+180*DAY;
  assert.equal((await store.purgeExpiredCohorts()).purged[0].certificates,2);
  await store.purgeExpiredCohorts({dryRun:false});
  assert.equal(await store.certificate(again),null);
  assert.equal((await pool.query(`SELECT count(*)::int AS count FROM "${schema}".cohort_certificates`)).rows[0].count,0);
  const leftovers=JSON.stringify([...(await pool.query(`SELECT data FROM "${schema}".rooms`)).rows,...(await pool.query(`SELECT * FROM "${schema}".requests`)).rows]);
  assert.ok(!leftovers.includes('Alice Jansen'));
 } finally {
  await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await pool.end();
 }
});
