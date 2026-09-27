import {createHash, randomUUID} from 'node:crypto';
import {Effect, ParseResult, Schema} from 'effect';
import type {Actor} from '../shared/actor.ts';
import {FileNotFound, FileTooLarge, Forbidden, InvalidInput} from './errors.ts';
import {ObjectStore} from './object-store.ts';
import {FileRepository} from './repository.ts';
import {CONTENT_TYPES, FileIdInput, StoredFile, UploadInput, extensionFor} from './schema.ts';

export const MAX_UPLOAD_BYTES=25*1024*1024;

const parse=<A,I>(schema:Schema.Schema<A,I>)=>(input:unknown)=>Schema.decodeUnknown(schema)(input).pipe(
 Effect.mapError(error=>new InvalidInput({reason:ParseResult.ArrayFormatter.formatErrorSync(error).map(issue=>`${issue.path.join('.')||'input'}: ${issue.message}`).join('; ')})));

const metadata=(file:StoredFile)=>({id:file.id,filename:file.filename,contentType:file.contentType,sizeBytes:file.sizeBytes,checksum:file.checksum,uploadedBy:file.uploadedBy,createdAt:file.createdAt});

export const makeFileActions=Effect.gen(function*(){
 const repo=yield* FileRepository;
 const objects=yield* ObjectStore;
 const owned=(actor:Actor,fileId:string)=>Effect.flatMap(repo.get(fileId),file=>file.roomId===actor.roomId?Effect.succeed(file):Effect.fail(new FileNotFound({fileId})));

 const uploadFile=(actor:Actor,raw:unknown)=>Effect.gen(function*(){
  const bytes=(raw as {bytes?:unknown}|null)?.bytes;
  if(!(bytes instanceof Uint8Array))return yield* Effect.fail(new InvalidInput({reason:'Geen bestandsinhoud ontvangen.'}));
  if(!bytes.byteLength)return yield* Effect.fail(new InvalidInput({reason:'Het bestand is leeg.'}));
  if(bytes.byteLength>MAX_UPLOAD_BYTES)return yield* Effect.fail(new FileTooLarge({sizeBytes:bytes.byteLength,maxBytes:MAX_UPLOAD_BYTES}));
  const requested=(raw as {contentType?:unknown}|null)?.contentType;
  if(typeof requested!=='string'||!(requested in CONTENT_TYPES))return yield* Effect.fail(new InvalidInput({reason:`Bestandstype ${typeof requested==='string'&&requested?requested:'ontbreekt'} wordt niet ondersteund. Toegestaan: ${Object.keys(CONTENT_TYPES).join(', ')}.`}));
  const input=yield* parse(UploadInput)(raw);
  const id=randomUUID();
  const objectKey=`rooms/${actor.roomId}/${id}${extensionFor(input.contentType)}`;
  yield* objects.put(objectKey,bytes,input.contentType);
  const file=yield* repo.insert(new StoredFile({
   id,roomId:actor.roomId,objectKey,
   filename:input.filename.trim(),contentType:input.contentType,
   sizeBytes:bytes.byteLength,checksum:createHash('sha256').update(bytes).digest('hex'),
   uploadedBy:{id:actor.id,name:actor.name},createdAt:new Date().toISOString(),
  })).pipe(Effect.tapError(()=>Effect.ignore(objects.remove(objectKey))));
  return metadata(file);
 });

 const listFiles=(actor:Actor)=>Effect.map(repo.listByRoom(actor.roomId),files=>({files:files.map(metadata)}));

 const getFile=(actor:Actor,raw:unknown)=>Effect.gen(function*(){
  const {fileId}=yield* parse(FileIdInput)(raw);
  const file=yield* owned(actor,fileId);
  const object=yield* objects.get(file.objectKey);
  return {...metadata(file),bytes:object.bytes};
 });

 const deleteFile=(actor:Actor,raw:unknown)=>Effect.gen(function*(){
  const {fileId}=yield* parse(FileIdInput)(raw);
  const file=yield* owned(actor,fileId);
  if(actor.role!=='facilitator'&&file.uploadedBy.id!==actor.id)return yield* Effect.fail(new Forbidden({reason:'Alleen de facilitator of de uploader verwijdert een bestand.'}));
  yield* repo.remove(fileId);
  yield* Effect.ignore(objects.remove(file.objectKey));
  return {deleted:true,fileId};
 });

 return {uploadFile,listFiles,getFile,deleteFile};
});
export type FileActions=Effect.Effect.Success<typeof makeFileActions>;
export type FileActionName=keyof FileActions;
