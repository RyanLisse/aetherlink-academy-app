import {Cause, Context, Effect, Exit, Layer, ManagedRuntime} from 'effect';
import type {Pool} from 'pg';
import type {Actor} from '../shared/actor.ts';
import {type FileActionName, type FileActions, makeFileActions} from './actions.ts';
import {type StorageConfig, isStorageConfigured, readStorageConfig} from './config.ts';
import {httpStatus, type StorageError} from './errors.ts';
import {ObjectStore, S3ObjectStore} from './object-store.ts';
import {MemoryFileRepository, PostgresFileRepository} from './repository.ts';

export interface FileStorageOptions{pool?:Pool;schema?:string;config?:StorageConfig;objectStore?:Layer.Layer<ObjectStore>;}
class FileActionsTag extends Context.Tag('academy/storage/FileActions')<FileActionsTag,FileActions>(){}

export const ACTION_NAMES:readonly FileActionName[]=['uploadFile','listFiles','getFile','deleteFile'];

export function createFileStorage({pool,schema='academy',config=readStorageConfig(),objectStore}:FileStorageOptions={}){
 const configured=Boolean(objectStore)||isStorageConfigured(config);
 const repository=pool?PostgresFileRepository(pool,schema):MemoryFileRepository;
 const runtime=ManagedRuntime.make(Layer.effect(FileActionsTag,makeFileActions).pipe(Layer.provide(Layer.mergeAll(repository,objectStore??S3ObjectStore(config)))));
 const run=async(action:FileActionName,actor:Actor,input:unknown={})=>{
  if(!configured)throw Object.assign(new Error('Bestandsopslag is niet geconfigureerd op deze omgeving.'),{status:503,tag:'StorageUnavailable'});
  const exit=await runtime.runPromiseExit(Effect.flatMap(FileActionsTag,actions=>(actions[action] as (actor:Actor,input:unknown)=>Effect.Effect<unknown,StorageError>)(actor,input)));
  if(Exit.isSuccess(exit))return exit.value;
  const failure=Cause.failureOption(exit.cause);
  if(failure._tag==='Some'){const error=failure.value;throw Object.assign(new Error(error.message),{status:httpStatus(error),tag:error._tag,detail:'cause' in error?String((error as {cause:unknown}).cause):undefined});}
  throw Cause.squash(exit.cause);
 };
 return {run,close:()=>runtime.dispose(),configured};
}
export type FileStorageService=ReturnType<typeof createFileStorage>;
