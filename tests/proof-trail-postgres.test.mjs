import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';
import {PostgresStore} from '../server/postgres-store.mjs';

const listen=server=>new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(`http://127.0.0.1:${server.address().port}`)));
const close=server=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);});

test('Proof trail transitions hold across two instances sharing Postgres',{skip:process.env.ACADEMY_POSTGRES_TEST!=='1'},async()=>{
 const {Pool}=await import('pg');
 const url=new URL(process.env.DATABASE_URL);url.searchParams.delete('sslmode');url.searchParams.delete('channel_binding');
 const pool=new Pool({connectionString:url.href,ssl:{rejectUnauthorized:true},max:6,connectionTimeoutMillis:10000});
 const schema=`academy_trail_${randomUUID().replaceAll('-','')}`;
 const one=new PostgresStore(pool,{schema}),two=new PostgresStore(pool,{schema});
 const dir=await mkdtemp(path.join(tmpdir(),'academy-trail-'));
 const servers=[];
 try{
  await one.init();
  const apps=[one,two].map(repository=>{const app=createApp({dir,repository,hostKey:'test'});app.proof.comment=async()=>({ok:true});app.proof.state=async()=>({markdown:'# Intent',marks:{}});return app;});
  servers.push(...apps.map(app=>app.server));
  const bases=await Promise.all(apps.map(app=>listen(app.server)));
  const call=async(index,route,token,{body,cookie}={})=>{
   const response=await fetch(bases[index]+'/game/'+route,{method:body?'POST':'GET',headers:{authorization:`Bearer ${token}`,'content-type':'application/json',...(cookie?{cookie}:{})},body:body&&JSON.stringify(body)});
   return {status:response.status,body:await response.json()};
  };
  const host=await one.create('Trail',{slug:'trail'},{email:'fac@example.test',name:'Fac Ilitator'});
  const learner=await one.join(host.code,'Bo');
  const ada=await two.join(host.code,'Ada');
  const cy=await one.join(host.code,'Cy');
  const sso=`academy-facilitator=${await two.facilitatorLogin({sub:'g-1',email:'fac@example.test',name:'Fac Ilitator',domain:'example.test'})}`;
  const evidence=requestId=>({requestId,finding:'README wijkt af',command:'node --test',observed:'1 failing',limitation:'Lokaal',taskId:'ATLAS-REVIEW-01'});

  const race=await Promise.all([call(0,'evidence',learner.token,{body:evidence('race-a')}),call(1,'evidence',learner.token,{body:evidence('race-b')})]);
  assert.deepEqual(race.map(r=>r.status).sort(),[200,409]);
  const submitted=race.find(r=>r.status===200).body;

  assert.equal((await call(1,'tasks',learner.token)).body.tasks[0].status,'submitted');
  const queue=await call(1,'tasks/queue',host.token);
  assert.deepEqual(queue.body.queue.map(q=>[q.name,q.taskId,q.attempt]),[['Bo','ATLAS-REVIEW-01',1]]);
  assert.equal((await one.overview())[0].awaitingReview,1);

  assert.equal((await call(0,'tasks/queue',learner.token)).status,403);
  const changes=await call(1,'review',host.token,{body:{id:submitted.id,status:'needs-work',note:'Voeg de fout toe.',requestId:'r-1'},cookie:sso});
  assert.equal(changes.status,200);
  assert.deepEqual(changes.body.review.reviewer,{role:'facilitator',name:'Fac Ilitator',email:'fac@example.test'});
  const seen=(await call(0,'tasks',learner.token)).body.tasks[0];
  assert.deepEqual([seen.status,seen.submissions[0].review.note],['changes_requested','Voeg de fout toe.']);

  const second=await call(0,'evidence',learner.token,{body:evidence('again')});
  assert.equal(second.status,200);
  assert.deepEqual((await call(1,'tasks/peer',cy.token)).body.queue.map(q=>[q.name,q.attempt]),[['Bo',2]]);
  const peers=await Promise.all([call(0,'review',ada.token,{body:{id:second.body.id,status:'accepted',note:'Goed.',requestId:'p-ada'}}),call(1,'review',cy.token,{body:{id:second.body.id,status:'accepted',note:'Goed.',requestId:'p-cy'}})]);
  assert.deepEqual(peers.map(r=>r.status).sort(),[200,409]);
  assert.equal(peers.find(r=>r.status===200).body.review.reviewer.role,'peer');
  assert.equal((await call(0,'review',learner.token,{body:{id:second.body.id,status:'accepted',note:'Zelf',requestId:'self'}})).status,403);
  const done=(await call(0,'tasks',learner.token)).body.tasks[0];
  assert.deepEqual([done.status,done.submissions.length],['approved',2]);
  assert.equal((await two.overview())[0].awaitingReview,0);
 }finally{await Promise.all(servers.map(close));await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);await pool.end();}
});
