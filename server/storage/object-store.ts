import {AwsClient} from 'aws4fetch';
import {Context, Effect, Layer, Ref} from 'effect';
import type {StorageConfig} from './config.ts';
import {ObjectStoreFailure} from './errors.ts';

export interface StoredObject{readonly bytes:Uint8Array;readonly contentType:string;}
export interface ObjectStoreService{
 readonly put:(key:string,bytes:Uint8Array,contentType:string)=>Effect.Effect<void,ObjectStoreFailure>;
 readonly get:(key:string)=>Effect.Effect<StoredObject,ObjectStoreFailure>;
 readonly remove:(key:string)=>Effect.Effect<void,ObjectStoreFailure>;
}
export class ObjectStore extends Context.Tag('academy/storage/ObjectStore')<ObjectStore,ObjectStoreService>(){}

export const makeMemoryObjectStore=Effect.gen(function*(){
 const objects=yield* Ref.make(new Map<string,StoredObject>());
 const service:ObjectStoreService={
  put:(key,bytes,contentType)=>Ref.update(objects,map=>new Map(map).set(key,{bytes:Uint8Array.from(bytes),contentType})),
  get:key=>Effect.flatMap(Ref.get(objects),map=>{const object=map.get(key);return object?Effect.succeed(object):Effect.fail(new ObjectStoreFailure({operation:'get',cause:`no such key ${key}`}));}),
  remove:key=>Ref.update(objects,map=>{const copy=new Map(map);copy.delete(key);return copy;}),
 };
 return service;
});
export const MemoryObjectStore=Layer.effect(ObjectStore,makeMemoryObjectStore);

export const makeS3ObjectStore=(config:StorageConfig):ObjectStoreService=>{
 const client=new AwsClient({accessKeyId:config.accessKeyId,secretAccessKey:config.secretAccessKey,region:config.region,service:'s3'});
 const url=(key:string)=>`${config.endpoint}/${encodeURIComponent(config.bucket)}/${key.split('/').map(encodeURIComponent).join('/')}`;
 const send=(operation:string,key:string,init:RequestInit)=>Effect.tryPromise({
  try:async()=>{
   const response=await client.fetch(url(key),init);
   if(!response.ok)throw new Error(`${operation} ${key} → ${response.status} ${(await response.text()).slice(0,300)}`);
   return response;
  },
  catch:cause=>new ObjectStoreFailure({operation,cause}),
 });
 return {
  put:(key,bytes,contentType)=>Effect.asVoid(send('put',key,{method:'PUT',body:bytes,headers:{'content-type':contentType,'content-length':String(bytes.byteLength)}})),
  get:key=>Effect.flatMap(send('get',key,{method:'GET'}),response=>Effect.tryPromise({
   try:async()=>({bytes:new Uint8Array(await response.arrayBuffer()),contentType:response.headers.get('content-type')||'application/octet-stream'}),
   catch:cause=>new ObjectStoreFailure({operation:'get',cause}),
  })),
  remove:key=>Effect.asVoid(send('remove',key,{method:'DELETE'})),
 };
};
export const S3ObjectStore=(config:StorageConfig)=>Layer.sync(ObjectStore,()=>makeS3ObjectStore(config));

