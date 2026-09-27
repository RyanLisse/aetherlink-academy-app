import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {Effect, Layer} from 'effect';
import {Pool} from 'pg';
import {PostgresStore} from '../server/postgres-store.mjs';
import {createFileStorage} from '../server/storage/runtime.ts';
import {ObjectStore, makeMemoryObjectStore} from '../server/storage/object-store.ts';

const unavailable=(error:unknown)=>{
 assert.ok(error instanceof Error);
 assert.equal((error as Error & {status:number}).status,503);
 assert.equal((error as Error & {tag:string}).tag,'StorageUnavailable');
 return true;
};

const notFound=(error:unknown)=>{
 assert.ok(error instanceof Error);
 assert.equal((error as Error & {status:number}).status,404);
 return true;
};

test('Postgres file storage reports commit failures and preserves object consistency',{skip:process.env.ACADEMY_POSTGRES_TEST!=='1',timeout:60000},async t=>{
 const url=new URL(process.env.DATABASE_URL!);
 url.searchParams.delete('sslmode');
 url.searchParams.delete('channel_binding');
 const pool=new Pool({connectionString:url.href,ssl:process.env.PGSSLMODE==='disable'?false:{rejectUnauthorized:true},max:1,connectionTimeoutMillis:3000,query_timeout:5000});
 const schema=`academy_files_${randomUUID().replaceAll('-','')}`;
 const table=`"${schema}".room_files`;
 const objects=await Effect.runPromise(makeMemoryObjectStore);
 const calls:{operation:'put'|'remove';key:string}[]=[];
 const objectStore=Layer.succeed(ObjectStore,{
  ...objects,
  put:(key,bytes,contentType)=>objects.put(key,bytes,contentType).pipe(Effect.tap(()=>Effect.sync(()=>{calls.push({operation:'put',key});}))),
  remove:key=>objects.remove(key).pipe(Effect.tap(()=>Effect.sync(()=>{calls.push({operation:'remove',key});}))),
 });
 const one=createFileStorage({pool,schema,objectStore});
 const two=createFileStorage({pool,schema,objectStore});
 try{
  const store=await new PostgresStore(pool,{schema}).init();
  const host=await store.create('Files',{slug:'files'});
  const {r}=await store.auth(host.token,'browser');
  const actor={roomId:r.id,id:'p1',name:'P',role:'participant',source:'human'} as const;
  const input={filename:'saved.txt',contentType:'text/plain',bytes:Buffer.from('durable bytes')};
  const saved=await one.run('uploadFile',actor,input) as {id:string};
  const reusable=async()=>{
   assert.deepEqual((await pool.query('SELECT 1 AS value')).rows,[{value:1}]);
   assert.equal(pool.totalCount,1);
   assert.equal(pool.idleCount,1);
   assert.equal(pool.waitingCount,0);
  };

  await t.test('independent runtimes read durable metadata and hide foreign or missing files',async()=>{
   const read=await two.run('getFile',actor,{fileId:saved.id}) as {bytes:Uint8Array};
   assert.equal(Buffer.from(read.bytes).toString(),'durable bytes');
   const listed=await two.run('listFiles',actor) as {files:{id:string}[]};
   assert.deepEqual(listed.files.map(file=>file.id),[saved.id]);
   const stranger={...actor,roomId:randomUUID()};
   assert.deepEqual(await two.run('listFiles',stranger),{files:[]});
   await assert.rejects(two.run('getFile',stranger,{fileId:saved.id}),notFound);
   await assert.rejects(two.run('deleteFile',stranger,{fileId:saved.id}),notFound);
   await assert.rejects(two.run('getFile',actor,{fileId:randomUUID()}),notFound);
   await assert.rejects(two.run('deleteFile',actor,{fileId:randomUUID()}),notFound);
   await reusable();
  });

  await pool.query(`CREATE FUNCTION "${schema}".reject_file_commit() RETURNS trigger LANGUAGE plpgsql AS $$
   BEGIN
    IF TG_OP = 'INSERT' THEN
     IF NEW.filename = 'reject-upload.txt' THEN RAISE EXCEPTION 'deferred upload rejection'; END IF;
     RETURN NEW;
    END IF;
    IF OLD.filename = 'saved.txt' THEN RAISE EXCEPTION 'deferred delete rejection'; END IF;
    RETURN OLD;
   END $$`);
  await pool.query(`CREATE CONSTRAINT TRIGGER reject_file_commit AFTER INSERT OR DELETE ON ${table} DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "${schema}".reject_file_commit()`);

  await t.test('constraints reject COMMIT after successful INSERT and DELETE statements',async()=>{
   const client=await pool.connect();
   try{
    await client.query('BEGIN');
    const inserted=await client.query(`INSERT INTO ${table} SELECT $1,room_id,$2,'reject-upload.txt',content_type,size_bytes,checksum,uploaded_by,created_at FROM ${table} WHERE id=$3`,[randomUUID(),randomUUID(),saved.id]);
    assert.equal(inserted.rowCount,1);
    await assert.rejects(client.query('COMMIT'),/deferred upload rejection/);
    await client.query('BEGIN');
    assert.equal((await client.query(`DELETE FROM ${table} WHERE id=$1`,[saved.id])).rowCount,1);
    await assert.rejects(client.query('COMMIT'),/deferred delete rejection/);
   }finally{
    try{await client.query('ROLLBACK');}finally{client.release();}
   }
   await reusable();
  });

  await t.test('rejected upload returns 503 and compensates the object write',async()=>{
   for(let attempt=0;attempt<2;attempt++){
    calls.length=0;
    await assert.rejects(one.run('uploadFile',actor,{...input,filename:'reject-upload.txt'}),unavailable);
    assert.equal(calls.length,2);
    assert.deepEqual(calls,[{operation:'put',key:calls[0].key},{operation:'remove',key:calls[0].key}]);
    await assert.rejects(Effect.runPromise(objects.get(calls[0].key)));
    assert.equal((await pool.query(`SELECT count(*)::int AS count FROM ${table} WHERE filename='reject-upload.txt'`)).rows[0].count,0);
    await reusable();
   }
  });

  await t.test('rejected delete returns 503 and retains metadata and bytes',async()=>{
   calls.length=0;
   await assert.rejects(two.run('deleteFile',actor,{fileId:saved.id}),unavailable);
   assert.deepEqual(calls,[]);
   assert.equal((await pool.query(`SELECT id FROM ${table} WHERE id=$1`,[saved.id])).rows[0].id,saved.id);
   const read=await one.run('getFile',actor,{fileId:saved.id}) as {bytes:Uint8Array};
   assert.equal(Buffer.from(read.bytes).toString(),'durable bytes');
   await reusable();
  });

  await t.test('successful deletion removes metadata and bytes',async()=>{
   await pool.query(`DROP TRIGGER reject_file_commit ON ${table}`);
   calls.length=0;
   assert.deepEqual(await two.run('deleteFile',actor,{fileId:saved.id}),{deleted:true,fileId:saved.id});
   assert.equal(calls.length,1);
   assert.equal(calls[0].operation,'remove');
   await assert.rejects(Effect.runPromise(objects.get(calls[0].key)));
   assert.deepEqual(await one.run('listFiles',actor),{files:[]});
   await reusable();
  });
 }finally{
  await one.close();
  await two.close();
  try{await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);}finally{await pool.end();}
 }
});
