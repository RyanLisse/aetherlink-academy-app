import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtempSync, readFileSync, rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {LocalStore} from '../server/local-store.mjs';
import {PostgresStore} from '../server/postgres-store.mjs';

function localFixture() {
 const dir=mkdtempSync(path.join(os.tmpdir(),'academy-participant-access-'));
 const store=new LocalStore(dir);
 const room=store.create('Access room',{slug:'access-room'});
 return {dir,store,room};
}

test('first participant join returns a one-time resume token and stores only its hash',()=>{
 const {dir,store,room}=localFixture();
 try {
  const joined=store.join(room.code,'Alice');
  assert.match(joined.resumeToken,/^[a-f0-9]{64}$/);
  assert.equal(store.data.schemaVersion,2);
  const member=store.auth(joined.token).p;
  assert.deepEqual(Object.keys(member.access),['resumeSecretHash']);
  assert.equal(store.view(store.auth(joined.token).r,store.auth(joined.token).s).me.access,undefined);
  assert.equal(member.access.resumeSecretHash.length,64);
  assert.notEqual(member.access.resumeSecretHash,joined.resumeToken);
  assert.doesNotMatch(readFileSync(path.join(dir,'rooms.json'),'utf8'),new RegExp(joined.resumeToken));
 } finally {rmSync(dir,{recursive:true,force:true});}
});

test('duplicate participant names require the personal link',()=>{
 const {dir,store,room}=localFixture();
 try {
  store.join(room.code,'Alice');
  assert.throws(()=>store.join(room.code,'alice'),error=>error.status===409&&error.message.includes('persoonlijke deelnemerslink'));
  assert.equal(store.auth(room.token).r.members.length,1);
 } finally {rmSync(dir,{recursive:true,force:true});}
});

test('personal resume link survives a store restart and preserves progress',()=>{
 const {dir,store,room}=localFixture();
 try {
  const joined=store.join(room.code,'Alice');
  const member=store.auth(joined.token).p;
  member.route='guided';
  member.progressByDay={'1':{quizScore:3}};
  store.save();
  const restarted=new LocalStore(dir);
  const resumed=restarted.resumeParticipant(joined.resumeToken);
  assert.equal(resumed.roomId,room.roomId);
  assert.equal(restarted.auth(resumed.token).p.id,member.id);
  assert.equal(restarted.auth(resumed.token).p.route,'guided');
  assert.deepEqual(restarted.auth(resumed.token).p.progressByDay,{'1':{quizScore:3}});
  assert.equal('resumeToken' in resumed,false);
  const resumedAgain=restarted.resumeParticipant(joined.resumeToken);
  assert.notEqual(resumedAgain.token,resumed.token);
 } finally {rmSync(dir,{recursive:true,force:true});}
});

test('unknown personal resume links are rejected',()=>{
 const {dir,store,room}=localFixture();
 try {
  store.join(room.code,'Alice');
  assert.throws(()=>store.resumeParticipant('not-a-personal-link'),error=>error.status===401&&error.message.includes('persoonlijke deelnemerslink'));
 } finally {rmSync(dir,{recursive:true,force:true});}
});

test('an authenticated legacy participant can create and rotate a personal link',()=>{
 const {dir,store,room}=localFixture();
 try {
  const joined=store.join(room.code,'Alice');
  const member=store.auth(joined.token).p;
  delete member.access;
  store.save();
  const first=store.rotateParticipantAccess(joined.token);
  assert.equal(store.resumeParticipant(first.resumeToken).roomId,room.roomId);
  const second=store.rotateParticipantAccess(joined.token);
  assert.notEqual(first.resumeToken,second.resumeToken);
  assert.throws(()=>store.resumeParticipant(first.resumeToken),error=>error.status===401);
  assert.equal(store.resumeParticipant(second.resumeToken).roomId,room.roomId);
 } finally {rmSync(dir,{recursive:true,force:true});}
});

test('Postgres stores durable participant access separately from room data',{skip:process.env.ACADEMY_POSTGRES_TEST!=='1'},async()=>{
 const {Pool}=await import('pg');
 const url=new URL(process.env.DATABASE_URL);
 url.searchParams.delete('sslmode');
 url.searchParams.delete('channel_binding');
 const pool=new Pool({connectionString:url.href,ssl:process.env.PGSSLMODE==='disable'?false:{rejectUnauthorized:true},max:4,connectionTimeoutMillis:10000});
 const schema=`academy_access_${randomUUID().replaceAll('-','')}`;
 const store=new PostgresStore(pool,{schema});
 try {
  await store.init();
  const room=await store.create('Access room',{slug:'access-room'});
  const joined=await store.join(room.code,'Alice');
  assert.match(joined.resumeToken,/^[a-f0-9]{64}$/);
  const stored=await pool.query(`SELECT secret_hash,verified_email FROM "${schema}".participant_access`);
  assert.equal(stored.rowCount,1);
  assert.equal(stored.rows[0].secret_hash.length,64);
  assert.equal(stored.rows[0].verified_email,null);
  assert.notEqual(stored.rows[0].secret_hash,joined.resumeToken);
  await assert.rejects(store.join(room.code,'alice'),error=>error.status===409&&error.message.includes('persoonlijke deelnemerslink'));
  const resumed=await store.resumeParticipant(joined.resumeToken);
  assert.equal((await store.auth(resumed.token)).p.name,'Alice');
  const resumedAgain=await store.resumeParticipant(joined.resumeToken);
  assert.notEqual(resumedAgain.token,resumed.token);
  const rotated=await store.rotateParticipantAccess(joined.token);
  await assert.rejects(store.resumeParticipant(joined.resumeToken),error=>error.status===401);
  assert.equal((await store.auth((await store.resumeParticipant(rotated.resumeToken)).token)).p.name,'Alice');
 } finally {
  await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await pool.end();
 }
});
