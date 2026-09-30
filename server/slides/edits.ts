// Ordered, all-or-nothing slide edits: a port of the agent-native
// server/lib/slide-content-patch.ts contract (replace with occurrence/all/
// expectedMatches, insert-before/after, replace-between, regex-replace).
import {Effect} from 'effect';
import {EditFailed} from './errors.ts';
import type {SlideEdit} from './schema.ts';

export interface EditOutcome{content:string;summaries:string[];}

const indices=(haystack:string,needle:string):number[]=>{const out:number[]=[];let from=0;for(;;){const at=haystack.indexOf(needle,from);if(at===-1)return out;out.push(at);from=at+needle.length;}};
const failure=(index:number,reason:string)=>new EditFailed({index,reason});
const optional=(edit:SlideEdit)=>edit.required===false||edit.expectedMatches===0;

function applyOne(content:string,edit:SlideEdit,index:number):Effect.Effect<{content:string;summary:string},EditFailed>{
 const op=edit.op??'replace';
 const checkCount=(count:number,verb:string)=>{
  if(edit.expectedMatches!==undefined&&count!==edit.expectedMatches)return failure(index,`${verb} verwachtte ${edit.expectedMatches} match(es), vond ${count}.`);
  if(count===0&&!optional(edit))return failure(index,`${verb}: text not found. Read the slide again with get_deck and use text that occurs exactly.`);
  return null;
 };
 switch(op){
  case 'replace':{
   if(!('find' in edit)||!('replace' in edit))return Effect.fail(failure(index,'replace vereist find en replace.'));
   const found=indices(content,edit.find);const bad=checkCount(found.length,'replace');if(bad)return Effect.fail(bad);
   if(!found.length)return Effect.succeed({content,summary:'replace:0'});
   if(edit.all){return Effect.succeed({content:content.split(edit.find).join(edit.replace),summary:`replace:all:${found.length}`});}
   const nth=edit.occurrence??1;
   if(edit.occurrence===undefined&&found.length>1&&edit.expectedMatches===undefined)return Effect.fail(failure(index,`replace: "${edit.find.slice(0,60)}" occurs ${found.length} times. Provide occurrence, all=true or expectedMatches.`));
   const at=found[nth-1];if(at===undefined)return Effect.fail(failure(index,`replace: occurrence ${nth} does not exist (${found.length} found).`));
   return Effect.succeed({content:content.slice(0,at)+edit.replace+content.slice(at+edit.find.length),summary:edit.occurrence?`replace:nth:${nth}`:'replace:first'});
  }
  case 'insert-before':case 'insert-after':{
   if(!('content' in edit))return Effect.fail(failure(index,`${op} vereist content.`));
   const found=indices(content,edit.find);const bad=checkCount(found.length,op);if(bad)return Effect.fail(bad);
   if(!found.length)return Effect.succeed({content,summary:`${op}:0`});
   if(found.length>1&&edit.expectedMatches===undefined)return Effect.fail(failure(index,`${op}: anchor occurs ${found.length} times; provide expectedMatches or choose a unique anchor.`));
   let out='';let last=0;for(const at of found){const cut=op==='insert-before'?at:at+edit.find.length;out+=content.slice(last,cut)+edit.content;last=cut;}out+=content.slice(last);
   return Effect.succeed({content:out,summary:`${op}:${found.length}`});
  }
  case 'replace-between':{
   if(!('start' in edit))return Effect.fail(failure(index,'replace-between vereist start en end.'));
   const ranges:Array<[number,number]>=[];let from=0;for(;;){const s=content.indexOf(edit.start,from);if(s===-1)break;const e=content.indexOf(edit.end,s+edit.start.length);if(e===-1)break;ranges.push([s+edit.start.length,e]);from=e+edit.end.length;}
   const bad=checkCount(ranges.length,'replace-between');if(bad)return Effect.fail(bad);
   if(!ranges.length)return Effect.succeed({content,summary:'replace-between:0'});
   if(ranges.length>1&&edit.expectedMatches===undefined)return Effect.fail(failure(index,`replace-between: ${ranges.length} ranges found; provide expectedMatches.`));
   let out='';let last=0;for(const [s,e] of ranges){out+=content.slice(last,s)+edit.replace;last=e;}out+=content.slice(last);
   return Effect.succeed({content:out,summary:`replace-between:${ranges.length}`});
  }
  case 'regex-replace':{
   if(!('pattern' in edit))return Effect.fail(failure(index,'regex-replace vereist pattern.'));
   let regex:RegExp;try{regex=new RegExp(edit.pattern,(edit.flags??'').replace('g','')+'g');}catch(error){return Effect.fail(failure(index,`regex-replace: invalid expression (${(error as Error).message}).`));}
   const count=(content.match(regex)??[]).length;const bad=checkCount(count,'regex-replace');if(bad)return Effect.fail(bad);
   if(!count)return Effect.succeed({content,summary:'regex-replace:0'});
   if(!edit.all){regex=new RegExp(regex.source,regex.flags.replace('g',''));}
   return Effect.succeed({content:content.replace(regex,edit.replace),summary:`regex-replace:${edit.all?count:1}`});
  }
 }
}

/** Apply edits in order; the first failure aborts and nothing is written. */
export const applySlideEdits=(content:string,edits:readonly SlideEdit[]):Effect.Effect<EditOutcome,EditFailed>=>
 Effect.reduce(edits.map((edit,index)=>[edit,index] as const),{content,summaries:[] as string[]},(state,[edit,index])=>
  Effect.map(applyOne(state.content,edit,index),result=>({content:result.content,summaries:[...state.summaries,result.summary]})));
