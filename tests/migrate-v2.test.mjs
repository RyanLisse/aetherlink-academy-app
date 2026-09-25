import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {planMigration,readOwnershipMap} from '../scripts/migrate-v2/plan.mjs';
import {snapshotFromFile} from '../scripts/migrate-v2/source.mjs';
import {runMigration} from '../scripts/migrate-v2/run.mjs';
import {runInventory} from '../scripts/migrate-v2/inventory.mjs';

const fixture=name=>new URL(`../scripts/migrate-v2/fixtures/${name}`,import.meta.url).pathname;
const FILE_STORE=fixture('legacy-file-store.json');
const PG_EXPORT=fixture('legacy-postgres-export.json');
const OWNERSHIP=fixture('ownership-map.json');
const ROOM=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const quiet=()=>{};

async function withOut(fn){
 const dir=await mkdtemp(path.join(tmpdir(),'migrate-v2-'));
 try{return await fn(dir);}finally{await rm(dir,{recursive:true,force:true});}
}
const readJson=async file=>JSON.parse(await readFile(file,'utf8'));

test('dry run over the file-store fixture writes a report and an exception file', ()=>withOut(async out=>{
 assert.equal(await runMigration(['--source',FILE_STORE,'--out',out],quiet),0);
 const report=await readJson(path.join(out,'report.json'));
 const exceptions=await readJson(path.join(out,'exceptions.json'));
 assert.equal(report.mode,'dry-run');
 assert.deepEqual(report.rooms,{wouldInsert:[ROOM(101),ROOM(104)],alreadyMigrated:[],heldForReview:[ROOM(102),ROOM(103)]});
 assert.deepEqual(exceptions.map(e=>[e.roomId,e.kind]),[
  [ROOM(101),'unknown-day-record'],
  [ROOM(101),'unknown-day-record'],
  [ROOM(101),'duplicate-display-name'],
  [ROOM(102),'unknown-day'],
  [ROOM(103),'malformed-room'],
 ]);
 assert.deepEqual(exceptions.find(e=>e.kind==='malformed-room').detail,['proof.slug is missing','members is not an array']);
 assert.equal(exceptions.find(e=>e.kind==='unknown-day').record.code,'FIXTUREB2');
 assert.deepEqual(report.invalidatedAtCutover,{sessions:{browser:3,mcp:1},facilitatorSessions:1,loginStates:0,resumeAccessRemoved:2});
 assert.deepEqual(report.notMigrated,{requestLedgerRows:2,decks:0});
}));

test('a migrated room keeps its ids and Proof slug, drops credentials and retains same-name members without access', async()=>{
 const plan=planMigration(await snapshotFromFile(FILE_STORE));
 const room=plan.insert.find(row=>row.id===ROOM(101)).data;
 assert.equal(room.id,ROOM(101));
 assert.equal(room.code,'FIXTUREA1');
 assert.deepEqual(room.proof,{slug:'fixture-proof-101',editor:'fixture-editor'});
 assert.deepEqual(room.members.map(m=>m.id),['member-a3','member-a4']);
 assert.deepEqual(room.migration.retainedMembers.map(m=>m.id),['member-a1','member-a2']);
 assert.equal(room.migration.retainedMembers[0].access,undefined);
 assert.deepEqual(room.migration.droppedAccessMemberIds,['member-a1']);
 assert.equal(room.driver,0);
 assert.equal('requests' in room,false);
 assert.deepEqual(room.evidence.map(e=>[e.id,e.day]),[['evidence-a1',2],['evidence-a2',9]]);
 assert.deepEqual(room.migration.historicalLessons,{1:'legacy-v1:day-1',2:'legacy-v1:day-2'});
 assert.equal(room.migration.sourceRoomId,ROOM(101));
 assert.equal(room.migration.sourceProofSlug,'fixture-proof-101');
 const d=plan.insert.find(row=>row.id===ROOM(104)).data;
 assert.deepEqual(d.members.map(m=>[m.id,'access' in m]),[['member-d1',false],['member-d2',false]]);
 assert.deepEqual(d.migration.droppedAccessMemberIds,['member-d1']);
});

test('a verified ownership mapping keeps exactly that member joinable', async()=>{
 const snapshot=await snapshotFromFile(PG_EXPORT);
 const without=planMigration(snapshot).insert.find(row=>row.id===ROOM(201)).data;
 assert.deepEqual(without.members.map(m=>m.id),['member-e3']);
 const verified=readOwnershipMap(await readJson(OWNERSHIP));
 const plan=planMigration(snapshot,{verified});
 const room=plan.insert.find(row=>row.id===ROOM(201)).data;
 assert.deepEqual(room.members.map(m=>m.id),['member-e1','member-e3']);
 assert.deepEqual(room.migration.retainedMembers.map(m=>m.id),['member-e2']);
 assert.equal(room.driver,0);
 assert.deepEqual(plan.exceptions[0].record,{memberIds:['member-e1','member-e2'],verifiedMemberId:'member-e1'});
 assert.throws(()=>readOwnershipMap({verified:[{roomId:ROOM(201),memberId:'member-e2'}]}),/needs non-empty roomId, memberId, verifiedBy and evidence/);
});

test('replanning against the migrated target duplicates nothing and never overwrites a different room', async()=>{
 const snapshot=await snapshotFromFile(FILE_STORE);
 const first=planMigration(snapshot);
 const existing=first.insert.map(row=>({id:row.id,code:row.code,sourceFingerprint:row.sourceFingerprint}));
 const second=planMigration(snapshot,{existing});
 assert.deepEqual([second.insert.length,second.skip.map(row=>row.id)],[0,[ROOM(101),ROOM(104)]]);
 const clash=planMigration(snapshot,{existing:[{id:ROOM(101),code:'FIXTUREA1',sourceFingerprint:null},{id:randomUUID(),code:'FIXTURED4',sourceFingerprint:null}]});
 assert.deepEqual(clash.insert,[]);
 assert.deepEqual(clash.exceptions.filter(e=>e.kind==='target-conflict').map(e=>e.roomId),[ROOM(101),ROOM(104)]);
});

test('apply refuses without an explicit target and snapshot confirmation', async()=>{
 await assert.rejects(runMigration(['--apply','--source',FILE_STORE],quiet),/refuses to run without an explicit --target/);
 await assert.rejects(runMigration(['--apply','--source',FILE_STORE,'--target','postgres://127.0.0.1:1/none'],quiet),/refuses to run without --i-have-a-snapshot/);
 await assert.rejects(runMigration(['--apply','--dry-run','--source',FILE_STORE],quiet),/not both/);
});

test('inventory reports day semantics and counts for the file-store fixture', async()=>{
 const lines=[];
 assert.equal(await runInventory(['--source',FILE_STORE,'--json'],line=>lines.push(line)),0);
 const result=JSON.parse(lines.join('\n'));
 assert.deepEqual(Object.values(result.days).map(d=>[d.historicalLessonId,d.roomsOnDay,d.progressEntries,d.evidence,d.handoffs]),[
  ['legacy-v1:day-1',0,1,0,0],['legacy-v1:day-2',1,1,1,1],['legacy-v1:day-3',0,0,0,0],['legacy-v1:day-4',0,0,0,0],['legacy-v1:day-5',1,0,0,0],
 ]);
 assert.deepEqual(result.unknownDays,{roomsOnUnknownDay:[ROOM(102)],records:2});
 assert.deepEqual(result.counts,{rooms:4,malformedRooms:1,members:7,membersWithResumeAccess:2,duplicateNameGroups:1,sessions:{browser:3,mcp:1},facilitatorSessions:1,loginStates:0,requests:1,decks:0});
});

const pgEnabled=process.env.ACADEMY_MIGRATE_PG_TEST==='1';
test('apply against a throwaway Postgres is idempotent and leaves the legacy source untouched', {skip:!pgEnabled}, async()=>{
 const {default:pg}=await import('pg');
 const {PostgresStore}=await import('../server/postgres-store.mjs');
 const {RUNTIME_DDL}=await import('../apps/server/src/squad/schema.ts');
 const admin=new pg.Client({connectionString:process.env.DATABASE_URL});
 await admin.connect();
 const name=`migrate_v2_${randomUUID().replaceAll('-','')}`;
 await admin.query(`CREATE DATABASE ${name}`);
 const url=new URL(process.env.DATABASE_URL);url.pathname=`/${name}`;
 const dbUrl=url.href;
 const pool=new pg.Pool({connectionString:dbUrl,max:2});
 try{
  await new PostgresStore(pool,{schema:'academy'}).init();
  const legacy=await readJson(FILE_STORE);
  for(const room of Object.values(legacy.rooms))await pool.query('INSERT INTO academy.rooms VALUES ($1,$2,$3)',[room.id,room.code,JSON.stringify(room)]);
  let n=0;
  for(const session of Object.values(legacy.sessions).filter(s=>legacy.rooms[s.roomId]))await pool.query('INSERT INTO academy.sessions(token_hash,room_id,person_id,kind,expires_at) VALUES ($1,$2,$3,$4,$5)',[`fixture-${n++}`,session.roomId,session.personId,session.kind,session.expiresAt]);
  await pool.query(RUNTIME_DDL);

  const lines=[];
  await runInventory(['--source-url',dbUrl,'--json'],line=>lines.push(line));
  const stock=JSON.parse(lines.join('\n'));
  assert.deepEqual([stock.origin,stock.counts.rooms,stock.counts.malformedRooms,stock.counts.sessions],['postgres-export',4,1,{browser:2,mcp:1}]);

  await withOut(async out=>{
   await runMigration(['--source-url',dbUrl,'--target',dbUrl,'--out',path.join(out,'dry')],quiet);
   assert.equal((await pool.query('SELECT count(*)::int AS n FROM academy_runtime.squad_rooms')).rows[0].n,0);
   await runMigration(['--apply','--i-have-a-snapshot','--source-url',dbUrl,'--target',dbUrl,'--out',path.join(out,'one')],quiet);
   await runMigration(['--apply','--i-have-a-snapshot','--source-url',dbUrl,'--target',dbUrl,'--out',path.join(out,'two')],quiet);
   const one=await readJson(path.join(out,'one','report.json'));
   const two=await readJson(path.join(out,'two','report.json'));
   assert.deepEqual(one.rooms,{inserted:[ROOM(101),ROOM(104)],alreadyMigrated:[],heldForReview:[ROOM(102),ROOM(103)]});
   assert.deepEqual(two.rooms,{inserted:[],alreadyMigrated:[ROOM(101),ROOM(104)],heldForReview:[ROOM(102),ROOM(103)]});
  });
  const rows=(await pool.query("SELECT id::text,code,data->'proof'->>'slug' AS slug,jsonb_array_length(data->'members') AS members FROM academy_runtime.squad_rooms ORDER BY id")).rows;
  assert.deepEqual(rows,[{id:ROOM(101),code:'FIXTUREA1',slug:'fixture-proof-101',members:2},{id:ROOM(104),code:'FIXTURED4',slug:'fixture-proof-104',members:2}]);
  assert.equal((await pool.query('SELECT count(*)::int AS n FROM academy_runtime.squad_sessions')).rows[0].n,0);
  assert.deepEqual((await pool.query('SELECT (SELECT count(*)::int FROM academy.rooms) AS rooms,(SELECT count(*)::int FROM academy.sessions) AS sessions')).rows[0],{rooms:4,sessions:3});
 }finally{
  await pool.end();
  await admin.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
  await admin.end();
 }
});
