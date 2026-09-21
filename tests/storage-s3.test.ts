import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {Effect} from 'effect';
import {isStorageConfigured, readStorageConfig} from '../server/storage/config.ts';
import {ObjectStore, S3ObjectStore} from '../server/storage/object-store.ts';

const config=readStorageConfig();

test('the S3 layer round-trips bytes against a real endpoint',{skip:!isStorageConfigured(config)},async()=>{
 const key=`rooms/${randomUUID()}/space & unicode-ø 🚀.txt`;
 const bytes=new TextEncoder().encode('AetherLink Academy — round trip\n');
 const program=Effect.gen(function*(){
  const store=yield* ObjectStore;
  yield* Effect.ensuring(Effect.gen(function*(){
   yield* store.put(key,bytes,'text/plain');
   const object=yield* store.get(key);
   assert.deepEqual([...object.bytes],[...bytes]);
   assert.match(object.contentType,/^text\/plain/);
   yield* store.remove(key);
   const after=yield* Effect.either(store.get(key));
   assert.equal(after._tag,'Left','a removed object must not be readable');
  }),Effect.orDie(store.remove(key)));
 });
 await Effect.runPromise(Effect.provide(program,S3ObjectStore(config)));
});

test('the S3 layer rejects writes to a missing bucket',{skip:!isStorageConfigured(config)},async()=>{
 const missingBucket=`aetherlink-missing-${randomUUID().replaceAll('-','').slice(0,16)}`;
 const key=`rooms/${randomUUID()}/wrong-bucket.txt`;
 const program=Effect.gen(function*(){
  const store=yield* ObjectStore;
  yield* store.put(key,new TextEncoder().encode('must not persist'),'text/plain');
 });
 const result=await Effect.runPromise(Effect.either(Effect.provide(program,S3ObjectStore({...config,bucket:missingBucket}))));
 assert.equal(result._tag,'Left','a write to a missing bucket must fail');
 if(result._tag==='Left'){
  assert.equal(result.left._tag,'ObjectStoreFailure');
  assert.match(String(result.left.cause),/404|NoSuchBucket|bucket/i);
 }
});
