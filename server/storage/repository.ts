import {Context, Effect, Layer, Ref, pipe} from 'effect';
import type {Pool} from 'pg';
import {FileNotFound, StorageUnavailable} from './errors.ts';
import {StoredFile, decodeStoredFile} from './schema.ts';

export interface FileRepositoryService{
 readonly insert:(file:StoredFile)=>Effect.Effect<StoredFile,StorageUnavailable>;
 readonly get:(fileId:string)=>Effect.Effect<StoredFile,FileNotFound|StorageUnavailable>;
 readonly listByRoom:(roomId:string)=>Effect.Effect<readonly StoredFile[],StorageUnavailable>;
 readonly remove:(fileId:string)=>Effect.Effect<void,FileNotFound|StorageUnavailable>;
}
export class FileRepository extends Context.Tag('academy/storage/FileRepository')<FileRepository,FileRepositoryService>(){}

const storage=(cause:unknown)=>new StorageUnavailable({cause});
const decode=(raw:unknown)=>pipe(decodeStoredFile(raw),Effect.mapError(storage));
const newest=(a:StoredFile,b:StoredFile)=>b.createdAt.localeCompare(a.createdAt);

export const makeMemoryRepository=Effect.gen(function*(){
 const files=yield* Ref.make(new Map<string,StoredFile>());
 const get=(fileId:string)=>Effect.flatMap(Ref.get(files),map=>{const file=map.get(fileId);return file?Effect.succeed(file):Effect.fail(new FileNotFound({fileId}));});
 const service:FileRepositoryService={
  get,
  insert:file=>Effect.as(Ref.update(files,map=>new Map(map).set(file.id,file)),file),
  listByRoom:roomId=>Effect.map(Ref.get(files),map=>[...map.values()].filter(file=>file.roomId===roomId).sort(newest)),
  remove:fileId=>Effect.zipRight(get(fileId),Ref.update(files,map=>{const copy=new Map(map);copy.delete(fileId);return copy;})),
 };
 return service;
});
export const MemoryFileRepository=Layer.effect(FileRepository,makeMemoryRepository);

const COLUMNS='id,room_id AS "roomId",object_key AS "objectKey",filename,content_type AS "contentType",size_bytes AS "sizeBytes",checksum,uploaded_by AS "uploadedBy",created_at AS "createdAt"';

export const makePostgresRepository=(pool:Pool,schema:string)=>{
 if(!/^[a-z][a-z0-9_]{0,62}$/.test(schema))throw new Error('Invalid Academy schema');
 const table=`"${schema}".room_files`;
 const query=(sql:string,values:unknown[]=[])=>Effect.tryPromise({try:()=>pool.query(sql,values),catch:storage});
 const rows=(result:{rows:unknown[]})=>Effect.forEach(result.rows,decode);
 const service:FileRepositoryService={
  insert:file=>Effect.as(query(`INSERT INTO ${table}(id,room_id,object_key,filename,content_type,size_bytes,checksum,uploaded_by,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[file.id,file.roomId,file.objectKey,file.filename,file.contentType,file.sizeBytes,file.checksum,JSON.stringify(file.uploadedBy),file.createdAt]),file),
  get:fileId=>Effect.gen(function*(){const found=yield* rows(yield* query(`SELECT ${COLUMNS} FROM ${table} WHERE id=$1`,[fileId]));return found[0]??(yield* Effect.fail(new FileNotFound({fileId})));}),
  listByRoom:roomId=>Effect.flatMap(query(`SELECT ${COLUMNS} FROM ${table} WHERE room_id=$1 ORDER BY created_at DESC`,[roomId]),rows),
  remove:fileId=>Effect.flatMap(query(`DELETE FROM ${table} WHERE id=$1`,[fileId]),result=>result.rowCount?Effect.void:Effect.fail(new FileNotFound({fileId}))),
 };
 return service;
};
export const PostgresFileRepository=(pool:Pool,schema:string)=>Layer.succeed(FileRepository,makePostgresRepository(pool,schema));
