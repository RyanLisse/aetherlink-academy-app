// Deck actions: the agent-facing contract of the agent-native slides template
// (create-deck, add-slide, update-slide, patch-deck, get-deck, list-decks,
// delete-deck, duplicate-deck, export-html) as Effect programs scoped to one
// squad room. Every write goes through DeckRepository.modify, so a deck is
// only ever changed by one caller at a time and the revision moves per write.
import {randomUUID} from 'node:crypto';
import {Effect,ParseResult,Schema} from 'effect';
import {applySlideEdits} from './edits.ts';
import {DeckNotFound,EditFailed,Forbidden,InvalidInput,RevisionConflict,SlideNotFound,StaleContent,type SlidesError} from './errors.ts';
import {ensureUniqueSlideIds,hashSlideContent,newSlideId,sanitizeSlideContent,templateSlide,textPreview} from './html.ts';
import {renderDeckHtml} from './export-html.ts';
import type {Actor} from '../shared/actor.ts';
import {DeckRepository} from './repository.ts';
import {AddSlideInput,CreateDeckInput,Deck,DeckIdInput,type DeckOperation,GetDeckInput,PatchDeckInput,Slide,type SlideInput,UpdateSlideInput} from './schema.ts';

const parse=<A,I>(schema:Schema.Schema<A,I>)=>(input:unknown)=>Schema.decodeUnknown(schema)(input).pipe(
 Effect.mapError(error=>new InvalidInput({reason:ParseResult.ArrayFormatter.formatErrorSync(error).map(issue=>`${issue.path.join('.')||'input'}: ${issue.message}`).join('; ')})));

const buildSlide=(input:SlideInput,id=input.id??newSlideId()):Effect.Effect<Slide,InvalidInput>=>{
 if(input.content!==undefined){
  const content=sanitizeSlideContent(input.content);
  if(!content.trim())return Effect.fail(new InvalidInput({reason:'Slide-inhoud is leeg na opschonen.'}));
  return Effect.succeed(new Slide({id,content,notes:input.notes??'',layout:input.layout??'content',background:input.background,transition:input.transition}));
 }
 if(!input.heading&&!input.body?.length)return Effect.fail(new InvalidInput({reason:'Geef content (HTML) of heading/body op voor een slide.'}));
 const built=templateSlide(input);
 return Effect.succeed(new Slide({id,content:built.content,notes:input.notes??'',layout:built.layout,background:input.background,transition:input.transition}));
};
const buildSlides=(inputs:readonly SlideInput[])=>Effect.map(Effect.forEach(inputs,input=>buildSlide(input)),slides=>ensureUniqueSlideIds(slides).map(slide=>slide instanceof Slide?slide:new Slide(slide)));

const summary=(deck:Deck)=>({id:deck.id,title:deck.title,aspectRatio:deck.aspectRatio,slideCount:deck.slides.length,revision:deck.revision,createdBy:deck.createdBy,createdAt:deck.createdAt,updatedAt:deck.updatedAt,hasDesignSystem:Boolean(deck.designSystem)});
const compactSlide=(slide:Slide,index:number)=>({slideNumber:index+1,id:slide.id,layout:slide.layout,contentHash:hashSlideContent(slide.content),textPreview:textPreview(slide.content),hasNotes:Boolean(slide.notes),transition:slide.transition,background:slide.background});
const fullSlide=(slide:Slide,index:number)=>({...compactSlide(slide,index),content:slide.content,notes:slide.notes});
const slideIndex=(deck:Deck,slideId:string)=>{const index=deck.slides.findIndex(slide=>slide.id===slideId);return index===-1?Effect.fail(new SlideNotFound({deckId:deck.id,slideId})):Effect.succeed(index);};
const insertAt=(slides:readonly Slide[],slide:Slide,afterSlideId:string|undefined)=>{const at=afterSlideId?slides.findIndex(candidate=>candidate.id===afterSlideId):-1;const next=[...slides];next.splice(at===-1?next.length:at+1,0,slide);return next;};
const revisionGuard=(deck:Deck,expected:number|undefined)=>expected!==undefined&&expected!==deck.revision?Effect.fail(new RevisionConflict({deckId:deck.id,expected,actual:deck.revision})):Effect.void;

export const makeDeckActions=Effect.gen(function*(){
 const repo=yield* DeckRepository;
 /** Decks are only visible inside their own squad room. */
 const owned=(actor:Actor,deckId:string)=>Effect.flatMap(repo.get(deckId),deck=>deck.roomId===actor.roomId?Effect.succeed(deck):Effect.fail(new DeckNotFound({deckId})));
 const modifyOwned=<E>(actor:Actor,deckId:string,change:(deck:Deck)=>Effect.Effect<Deck,E>)=>repo.modify(deckId,deck=>deck.roomId===actor.roomId?change(deck):Effect.fail(new DeckNotFound({deckId})));

 const createDeck=(actor:Actor,raw:unknown)=>Effect.gen(function*(){
  const input=yield* parse(CreateDeckInput)(raw);
  const slides=yield* buildSlides(input.slides);
  const now=new Date().toISOString();
  const deck=yield* repo.insert(new Deck({id:randomUUID(),roomId:actor.roomId,title:input.title.trim(),aspectRatio:input.aspectRatio??'16:9',slides,designSystem:input.designSystem,revision:1,createdBy:{id:actor.id,name:actor.name},createdAt:now,updatedAt:now}));
  return {...summary(deck),slides:deck.slides.map(compactSlide)};
 });

 const listDecks=(actor:Actor)=>Effect.map(repo.list(actor.roomId),decks=>({decks:decks.map(summary)}));

 const getDeck=(actor:Actor,raw:unknown)=>Effect.gen(function*(){
  const input=yield* parse(GetDeckInput)(raw);
  const deck=yield* owned(actor,input.deckId);
  if(input.slideId){const index=yield* slideIndex(deck,input.slideId);return {deckId:deck.id,revision:deck.revision,aspectRatio:deck.aspectRatio,slide:fullSlide(deck.slides[index]!,index)};}
  const compact=input.compact??false;
  return {...summary(deck),designSystem:deck.designSystem,slides:deck.slides.map(compact?compactSlide:fullSlide)};
 });

 const addSlide=(actor:Actor,raw:unknown)=>Effect.gen(function*(){
  const input=yield* parse(AddSlideInput)(raw);
  let added:Slide|undefined;
  const deck=yield* modifyOwned(actor,input.deckId,deck=>Effect.gen(function*(){
   yield* revisionGuard(deck,input.expectedRevision);
   if(input.afterSlideId)yield* slideIndex(deck,input.afterSlideId);
   const existing=new Set(deck.slides.map(slide=>slide.id));
   const slide=yield* buildSlide({...input,id:input.id&&!existing.has(input.id)?input.id:undefined});
   added=slide;
   return new Deck({...deck,slides:insertAt(deck.slides,slide,input.afterSlideId)});
  }));
  const index=deck.slides.findIndex(slide=>slide.id===added!.id);
  return {deckId:deck.id,revision:deck.revision,slideCount:deck.slides.length,slide:compactSlide(deck.slides[index]!,index)};
 });

 const updateSlide=(actor:Actor,raw:unknown)=>Effect.gen(function*(){
  const input=yield* parse(UpdateSlideInput)(raw);
  const modes=[input.edits,input.fullContent].filter(value=>value!==undefined).length;
  if(modes>1)return yield* Effect.fail(new InvalidInput({reason:'Gebruik precies één invoermodus: edits of fullContent.'}));
  if(modes===0&&input.notes===undefined)return yield* Effect.fail(new InvalidInput({reason:'Geef edits, fullContent of notes op.'}));
  let previousHash='';let summaries:string[]=[];
  const deck=yield* modifyOwned(actor,input.deckId,deck=>Effect.gen(function*(){
   const index=yield* slideIndex(deck,input.slideId);
   const slide=deck.slides[index]!;
   previousHash=hashSlideContent(slide.content);
   if(input.baseContentHash!==undefined&&input.baseContentHash!==previousHash)return yield* Effect.fail(new StaleContent({deckId:deck.id,slideId:slide.id,currentHash:previousHash}));
   let content=slide.content;
   if(input.edits){const outcome=yield* applySlideEdits(slide.content,input.edits);content=outcome.content;summaries=outcome.summaries;}
   else if(input.fullContent!==undefined){content=input.fullContent;summaries=['fullContent'];}
   content=sanitizeSlideContent(content);
   if(!content.trim())return yield* Effect.fail(new EditFailed({index:0,reason:'De slide zou leeg worden.'}));
   const slides=[...deck.slides];slides[index]=new Slide({...slide,content,notes:input.notes??slide.notes});
   return new Deck({...deck,slides});
  }));
  const index=deck.slides.findIndex(slide=>slide.id===input.slideId);
  const next=deck.slides[index]!;
  return {deckId:deck.id,revision:deck.revision,slide:compactSlide(next,index),previousContentHash:previousHash,changed:hashSlideContent(next.content)!==previousHash,edits:summaries};
 });

 const applyOperation=(deck:Deck,operation:DeckOperation):Effect.Effect<Deck,SlidesError>=>{
  switch(operation.op){
   case 'patch-slide':return Effect.map(slideIndex(deck,operation.slideId),index=>{const slides=[...deck.slides];const slide=slides[index]!;const {content,...rest}=operation.fields;slides[index]=new Slide({...slide,...Object.fromEntries(Object.entries(rest).filter(([,value])=>value!==undefined)),...(content!==undefined?{content:sanitizeSlideContent(content)}:{})});return new Deck({...deck,slides});});
   case 'delete-slide':return Effect.map(slideIndex(deck,operation.slideId),index=>new Deck({...deck,slides:deck.slides.filter((_,i)=>i!==index)}));
   case 'reorder-slides':{
    const ids=new Set(deck.slides.map(slide=>slide.id));
    if(operation.slideIds.length!==ids.size||new Set(operation.slideIds).size!==operation.slideIds.length||operation.slideIds.some(id=>!ids.has(id)))return Effect.fail(new InvalidInput({reason:'reorder-slides moet elke bestaande slide-id precies één keer bevatten.'}));
    return Effect.succeed(new Deck({...deck,slides:operation.slideIds.map(id=>deck.slides.find(slide=>slide.id===id)!)}));
   }
   case 'add-slide':return Effect.gen(function*(){if(operation.afterSlideId)yield* slideIndex(deck,operation.afterSlideId);const existing=new Set(deck.slides.map(slide=>slide.id));const slide=yield* buildSlide({...operation.slide,id:operation.slide.id&&!existing.has(operation.slide.id)?operation.slide.id:undefined});return new Deck({...deck,slides:insertAt(deck.slides,slide,operation.afterSlideId)});});
   case 'patch-deck-fields':return Effect.succeed(new Deck({...deck,...(operation.fields.title!==undefined?{title:operation.fields.title.trim()}:{}),...(operation.fields.aspectRatio?{aspectRatio:operation.fields.aspectRatio}:{}),...(operation.fields.designSystem?{designSystem:operation.fields.designSystem}:{})}));
  }
 };

 const patchDeck=(actor:Actor,raw:unknown)=>Effect.gen(function*(){
  const input=yield* parse(PatchDeckInput)(raw);
  let before=new Map<string,string>();
  const deck=yield* modifyOwned(actor,input.deckId,deck=>Effect.gen(function*(){
   yield* revisionGuard(deck,input.expectedRevision);
   before=new Map(deck.slides.map(slide=>[slide.id,hashSlideContent(slide.content)]));
   return yield* Effect.reduce(input.operations,deck,applyOperation);
  }));
  const after=new Map(deck.slides.map(slide=>[slide.id,hashSlideContent(slide.content)]));
  return {
   ...summary(deck),
   updatedSlideIds:[...after].filter(([id,hash])=>before.has(id)&&before.get(id)!==hash).map(([id])=>id),
   unchangedSlideIds:[...after].filter(([id,hash])=>before.get(id)===hash).map(([id])=>id),
   addedSlideIds:[...after.keys()].filter(id=>!before.has(id)),
   deletedSlideIds:[...before.keys()].filter(id=>!after.has(id)),
   slides:deck.slides.map(compactSlide),
  };
 });

 const deleteDeck=(actor:Actor,raw:unknown)=>Effect.gen(function*(){
  const {deckId}=yield* parse(DeckIdInput)(raw);
  const deck=yield* owned(actor,deckId);
  if(actor.role!=='facilitator'&&deck.createdBy.id!==actor.id)return yield* Effect.fail(new Forbidden({reason:'Alleen de facilitator of de maker verwijdert een deck.'}));
  yield* repo.remove(deckId);
  return {deleted:true,deckId};
 });

 const duplicateDeck=(actor:Actor,raw:unknown)=>Effect.gen(function*(){
  const {deckId}=yield* parse(DeckIdInput)(raw);
  const source=yield* owned(actor,deckId);
  const now=new Date().toISOString();
  const copy=yield* repo.insert(new Deck({...source,id:randomUUID(),title:`${source.title} (kopie)`,slides:source.slides.map(slide=>new Slide({...slide,id:newSlideId()})),revision:1,createdBy:{id:actor.id,name:actor.name},createdAt:now,updatedAt:now}));
  return {...summary(copy),sourceDeckId:source.id};
 });

 const exportHtml=(actor:Actor,raw:unknown)=>Effect.gen(function*(){
  const {deckId}=yield* parse(DeckIdInput)(raw);
  const deck=yield* owned(actor,deckId);
  if(!deck.slides.length)return yield* Effect.fail(new InvalidInput({reason:'Een leeg deck kan niet geëxporteerd worden.'}));
  return {deckId:deck.id,title:deck.title,filename:`${deck.title.replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'').toLowerCase()||'deck'}.html`,html:renderDeckHtml(deck,{includeNotes:actor.role==='facilitator'})};
 });

 return {createDeck,listDecks,getDeck,addSlide,updateSlide,patchDeck,deleteDeck,duplicateDeck,exportHtml};
});
export type DeckActions=Effect.Effect.Success<typeof makeDeckActions>;
export type DeckActionName=keyof DeckActions;
