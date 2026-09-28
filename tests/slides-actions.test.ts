import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createSlidesService} from '../server/slides/runtime.ts';

const room='11111111-1111-4111-8111-111111111111';
const other='33333333-3333-4333-8333-333333333333';
const ryan={roomId:room,id:'p1',name:'Ryan',role:'participant',source:'human'} as const;
const facilitator={roomId:room,id:'facilitator',name:'Facilitator',role:'facilitator',source:'human'} as const;
const stranger={roomId:other,id:'p9',name:'X',role:'participant',source:'ai'} as const;
const rejects=async(promise:Promise<unknown>,status:number,pattern?:RegExp)=>{try{await promise;}catch(error:any){assert.equal(error.status,status,error.message);if(pattern)assert.match(error.message,pattern);return error;}assert.fail('expected rejection');};

test('create, add, read, update and patch a deck inside one squad',async()=>{
 const svc=createSlidesService();
 try{
  const deck=await svc.run('createDeck',ryan,{title:'  Sprint recap  ',slides:[{heading:'Start',body:['een','twee']}]}) as any;
  assert.equal(deck.title,'Sprint recap');assert.equal(deck.revision,1);assert.equal(deck.slides.length,1);
  const added=await svc.run('addSlide',ryan,{deckId:deck.id,content:'<div class="fmd-slide"><h2>Twee</h2><script>x()</script></div>',notes:'noot'}) as any;
  assert.equal(added.revision,2);assert.equal(added.slide.slideNumber,2);
  const full=await svc.run('getDeck',ryan,{deckId:deck.id}) as any;
  assert.doesNotMatch(full.slides[1].content,/script/);assert.equal(full.slides[1].notes,'noot');
  const compact=await svc.run('getDeck',ryan,{deckId:deck.id,compact:true}) as any;
  assert.equal(compact.slides[0].content,undefined);assert.equal(compact.slides[0].textPreview,'Start een twee');
  const one=await svc.run('getDeck',ryan,{deckId:deck.id,slideId:added.slide.id}) as any;
  assert.equal(one.slide.contentHash,added.slide.contentHash);
  const updated=await svc.run('updateSlide',ryan,{deckId:deck.id,slideId:added.slide.id,edits:[{find:'Twee',replace:'Drie',expectedMatches:1}],baseContentHash:one.slide.contentHash}) as any;
  assert.equal(updated.changed,true);assert.deepEqual(updated.edits,['replace:first']);
  await rejects(svc.run('updateSlide',ryan,{deckId:deck.id,slideId:added.slide.id,edits:[{find:'Drie',replace:'Vier'}],baseContentHash:one.slide.contentHash}),409,/contentHash/);
  await rejects(svc.run('updateSlide',ryan,{deckId:deck.id,slideId:added.slide.id,edits:[{find:'x',replace:'y'}],fullContent:'<div class="fmd-slide">z</div>'}),400,/één invoermodus/);
  await rejects(svc.run('updateSlide',ryan,{deckId:deck.id,slideId:added.slide.id,edits:[{find:'nope',replace:'y'}]}),422);
  await rejects(svc.run('updateSlide',ryan,{deckId:deck.id,slideId:'missing',fullContent:'<div>x</div>'}),404);
  const patched=await svc.run('patchDeck',ryan,{deckId:deck.id,expectedRevision:updated.revision,operations:[{op:'add-slide',slide:{heading:'Einde'},afterSlideId:deck.slides[0].id},{op:'reorder-slides',slideIds:[added.slide.id,deck.slides[0].id].concat([])},{op:'patch-deck-fields',fields:{title:'Recap'}}]}).catch(e=>e) as any;
  assert.equal(patched.status,400,'reorder must include every slide');
  const state=await svc.run('getDeck',ryan,{deckId:deck.id,compact:true}) as any;
  assert.equal(state.slides.length,2,'failed patch writes nothing');assert.equal(state.title,'Sprint recap');
  const good=await svc.run('patchDeck',ryan,{deckId:deck.id,expectedRevision:state.revision,operations:[{op:'add-slide',slide:{heading:'Einde'}},{op:'patch-slide',slideId:deck.slides[0].id,fields:{notes:'n'}},{op:'reorder-slides',slideIds:[added.slide.id,deck.slides[0].id,'__new__']}]}).catch(e=>e) as any;
  assert.equal(good.status,400);
  const final=await svc.run('patchDeck',ryan,{deckId:deck.id,expectedRevision:state.revision,operations:[{op:'add-slide',slide:{id:'einde',heading:'Einde'}},{op:'patch-slide',slideId:deck.slides[0].id,fields:{notes:'n'}},{op:'reorder-slides',slideIds:['einde',added.slide.id,deck.slides[0].id]},{op:'delete-slide',slideId:added.slide.id},{op:'patch-deck-fields',fields:{title:'Recap',aspectRatio:'4:3'}}]}) as any;
  assert.deepEqual(final.slides.map((s:any)=>s.id),['einde',deck.slides[0].id]);
  assert.deepEqual(final.addedSlideIds,['einde']);assert.deepEqual(final.deletedSlideIds,[added.slide.id]);assert.deepEqual(final.unchangedSlideIds,[deck.slides[0].id]);
  assert.equal(final.title,'Recap');assert.equal(final.aspectRatio,'4:3');
  await rejects(svc.run('patchDeck',ryan,{deckId:deck.id,expectedRevision:state.revision,operations:[{op:'patch-deck-fields',fields:{title:'Oud'}}]}),409,/revisie/);
  const html=await svc.run('exportHtml',ryan,{deckId:deck.id}) as any;
  assert.equal(html.filename,'recap.html');assert.match(html.html,/Einde/);
 }finally{await svc.close();}
});

test('decks are invisible outside their room; delete needs facilitator or creator',async()=>{
 const svc=createSlidesService();
 try{
  const deck=await svc.run('createDeck',ryan,{title:'Privé'}) as any;
  assert.deepEqual(await svc.run('listDecks',stranger),{decks:[]});
  await rejects(svc.run('getDeck',stranger,{deckId:deck.id}),404);
  await rejects(svc.run('addSlide',stranger,{deckId:deck.id,heading:'x'}),404);
  await rejects(svc.run('deleteDeck',{...ryan,id:'p2'},{deckId:deck.id}),403);
  const copy=await svc.run('duplicateDeck',{...ryan,id:'p2'},{deckId:deck.id}) as any;
  assert.equal(copy.title,'Privé (kopie)');
  await svc.run('deleteDeck',facilitator,{deckId:deck.id});
  await rejects(svc.run('exportHtml',ryan,{deckId:copy.id}),400,/leeg/);
  const list=await svc.run('listDecks',ryan) as any;
  assert.deepEqual(list.decks.map((d:any)=>d.id),[copy.id]);
  await rejects(svc.run('createDeck',ryan,{title:''}),400,/title/);
  await rejects(svc.run('getDeck',ryan,{deckId:'not-a-uuid'}),400);
 }finally{await svc.close();}
});

test('facilitator deck notes stay private while participant-owned squad notes remain available to their owner',async()=>{
 const svc=createSlidesService();
 try{
  const deck=await svc.run('createDeck',facilitator,{title:'Facilitator notes',slides:[{heading:'Lesson',notes:'private speaker notes'}]}) as any;
  const learnerRead=await svc.run('getDeck',ryan,{deckId:deck.id}) as any;
  assert.equal('notes' in learnerRead.slides[0],false);
  await rejects(svc.run('addSlide',ryan,{deckId:deck.id,heading:'Injected notes',notes:'overwrite'}),403,/presenter notes/);
  await rejects(svc.run('patchDeck',ryan,{deckId:deck.id,operations:[{op:'add-slide',slide:{heading:'Injected notes',notes:'overwrite'}}]}),403,/presenter notes/);
  const afterDenied=await svc.run('getDeck',facilitator,{deckId:deck.id}) as any;
  assert.equal(afterDenied.revision,learnerRead.revision);
  assert.equal(afterDenied.slides.length,1);
  await svc.run('addSlide',ryan,{deckId:deck.id,heading:'Shared content without notes'});
  await rejects(svc.run('updateSlide',ryan,{deckId:deck.id,slideId:learnerRead.slides[0].id,notes:'overwrite'}),403,/presenter notes/);
  await rejects(svc.run('patchDeck',ryan,{deckId:deck.id,operations:[{op:'patch-slide',slideId:learnerRead.slides[0].id,fields:{notes:'overwrite'}}]}),403,/presenter notes/);
  const copy=await svc.run('duplicateDeck',ryan,{deckId:deck.id}) as any;
  const copied=await svc.run('getDeck',ryan,{deckId:copy.id}) as any;
  assert.equal(copied.slides[0].notes,'');
  const ownerRead=await svc.run('getDeck',facilitator,{deckId:deck.id}) as any;
  assert.equal(ownerRead.slides[0].notes,'private speaker notes');
  const participantDeck=await svc.run('createDeck',ryan,{title:'My notes',slides:[{heading:'My slide',notes:'my presenter notes'}]}) as any;
  const participantRead=await svc.run('getDeck',ryan,{deckId:participantDeck.id}) as any;
  assert.equal(participantRead.slides[0].notes,'my presenter notes');
 }finally{await svc.close();}
});

test('memory repository persists decks to the data dir and reloads them',async()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'academy-decks-'));
 const first=createSlidesService({dir});
 const deck=await first.run('createDeck',ryan,{title:'Blijft',slides:[{heading:'A'}]}) as any;
 await first.close();
 const second=createSlidesService({dir});
 try{const again=await second.run('getDeck',ryan,{deckId:deck.id,compact:true}) as any;assert.equal(again.title,'Blijft');assert.equal(again.slides.length,1);}
 finally{await second.close();}
 assert.ok(path.join(dir,'decks.json'));
});

test('concurrent writes to one deck serialise and keep every slide',async()=>{
 const svc=createSlidesService();
 try{
  const deck=await svc.run('createDeck',ryan,{title:'Race'}) as any;
  await Promise.all(Array.from({length:12},(_,i)=>svc.run('addSlide',ryan,{deckId:deck.id,heading:`S${i}`})));
  const state=await svc.run('getDeck',ryan,{deckId:deck.id,compact:true}) as any;
  assert.equal(state.slides.length,12);assert.equal(state.revision,13);
 }finally{await svc.close();}
});
