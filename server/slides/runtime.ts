// Promise-facing adapter: the Express routes and MCP tools stay plain JS and
// call `run(action, actor, input)`; typed failures become `{status,message}`
// errors the existing `fail`-style error middleware already understands.
import path from 'node:path';
import {Cause,Context,Effect,Exit,Layer,ManagedRuntime} from 'effect';
import type {Pool} from 'pg';
import type {Actor} from '../shared/actor.ts';
import {type DeckActions,type DeckActionName,makeDeckActions} from './actions.ts';
import {httpStatus,type SlidesError} from './errors.ts';
import {MemoryDeckRepository,PostgresDeckRepository} from './repository.ts';

export interface SlidesServiceOptions{pool?:Pool;schema?:string;dir?:string;}
class DeckActionsTag extends Context.Tag('academy/slides/DeckActions')<DeckActionsTag,DeckActions>(){}

export const ACTION_NAMES:readonly DeckActionName[]=['createDeck','listDecks','getDeck','addSlide','updateSlide','patchDeck','deleteDeck','duplicateDeck','exportHtml'];

export function createSlidesService({pool,schema='academy',dir}:SlidesServiceOptions={}){
 const repository=pool?PostgresDeckRepository(pool,schema):MemoryDeckRepository(dir?path.join(dir,'decks.json'):undefined);
 const runtime=ManagedRuntime.make(Layer.effect(DeckActionsTag,makeDeckActions).pipe(Layer.provide(repository)));
 const run=async(action:DeckActionName,actor:Actor,input:unknown={})=>{
  const exit=await runtime.runPromiseExit(Effect.flatMap(DeckActionsTag,actions=>(actions[action] as (actor:Actor,input:unknown)=>Effect.Effect<unknown,SlidesError>)(actor,input)));
  if(Exit.isSuccess(exit))return exit.value;
  const failure=Cause.failureOption(exit.cause);
  if(failure._tag==='Some'){const error=failure.value;throw Object.assign(new Error(error.message),{status:httpStatus(error),tag:error._tag,detail:error._tag==='StorageFailure'?String((error as {cause:unknown}).cause):undefined});}
  throw Cause.squash(exit.cause);
 };
 return {run,close:()=>runtime.dispose()};
}
export type SlidesService=ReturnType<typeof createSlidesService>;
