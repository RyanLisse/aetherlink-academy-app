import test from 'node:test';
import assert from 'node:assert/strict';
import {createSlidesService} from '../server/slides/runtime.ts';

const room='11111111-1111-4111-8111-111111111111';
const facilitator={roomId:room,id:'facilitator',name:'Facilitator',role:'facilitator',source:'human'} as const;
const participant={roomId:room,id:'p1',name:'Ryan',role:'participant',source:'human'} as const;
const quiz={title:'Wat doet een <prompt>?',type:'quiz',cards:[{title:'A',body:'Raden'},{title:'B',body:'Sturen'}],keyPoints:['B is juist'],visual:{quiz:{answer:1},reveal:'click'}} as const;
const status=async(promise:Promise<unknown>)=>{try{await promise;}catch(error){return (error as {status:number}).status;}return 200;};

test('structured classroom slides render to escaped HTML and hide presenter data from participants',async()=>{
 const svc=createSlidesService();
 try{
  const deck=await svc.run('createDeck',facilitator,{title:'Dag 1',slides:[{classroom:quiz,notes:'Vraag eerst de zaal.'}]}) as any;
  const compact=await svc.run('getDeck',participant,{deckId:deck.id,compact:true}) as any;
  assert.equal(compact.slides[0].kind,'classroom');
  assert.equal(compact.slides[0].textPreview,'Wat doet een <prompt>? A Raden B Sturen');
  const own=await svc.run('getDeck',facilitator,{deckId:deck.id}) as any;
  assert.match(own.slides[0].content,/Wat doet een &lt;prompt&gt;\?/);
  assert.deepEqual(own.slides[0].classroom.keyPoints,['B is juist']);
  assert.deepEqual(own.slides[0].classroom.visual,{quiz:{answer:1},reveal:'click'});
  const theirs=await svc.run('getDeck',participant,{deckId:deck.id}) as any;
  assert.equal(theirs.slides[0].notes,undefined);
  assert.equal(theirs.slides[0].classroom.keyPoints,undefined);
  assert.deepEqual(theirs.slides[0].classroom.visual,{reveal:'click'});
  assert.equal(await status(svc.run('addSlide',participant,{deckId:deck.id,classroom:{title:'X',keyPoints:['geheim']}})),403);
  assert.equal(await status(svc.run('addSlide',facilitator,{deckId:deck.id,classroom:{title:''}})),400);
  assert.equal(await status(svc.run('addSlide',facilitator,{deckId:deck.id,classroom:{title:'X',visual:{countdown:0}}})),400);
 }finally{await svc.close();}
});

test('classroom exercise timer presets round-trip and enforce supported minutes',async()=>{
 const svc=createSlidesService();
 try{
  const deck=await svc.run('createDeck',facilitator,{title:'Timer',slides:[{classroom:{title:'Oefening',type:'practice',layout:'exercise',steps:['Open de taak'],expected:'De taak is klaar.',timer:10}}]}) as any;
  const slideId=deck.slides[0].id;
  const own=await svc.run('getDeck',facilitator,{deckId:deck.id,slideId}) as any;
  assert.equal(own.slide.classroom.timer,10);
  const theirs=await svc.run('getDeck',participant,{deckId:deck.id,slideId}) as any;
  assert.equal(theirs.slide.classroom.timer,10);
  assert.equal(await status(svc.run('createDeck',facilitator,{title:'Invalid zero',slides:[{classroom:{title:'Oefening',timer:0}}]})),400);
  assert.equal(await status(svc.run('createDeck',facilitator,{title:'Invalid high',slides:[{classroom:{title:'Oefening',timer:121}}]})),400);
 }finally{await svc.close();}
});

test('patching classroom fields regenerates HTML, keeps key points, and an HTML edit drops the structure',async()=>{
 const svc=createSlidesService();
 try{
  const deck=await svc.run('createDeck',facilitator,{title:'Dag 1',slides:[{classroom:quiz}]}) as any;
  const slideId=deck.slides[0].id;
  await svc.run('patchDeck',facilitator,{deckId:deck.id,expectedRevision:deck.revision,operations:[{op:'patch-slide',slideId,fields:{classroom:{title:'Oefening 1',layout:'exercise',steps:['Open Claude','Plak de prompt']}}}]});
  const patched=await svc.run('getDeck',facilitator,{deckId:deck.id,slideId}) as any;
  assert.match(patched.slide.content,/Oefening 1/);
  assert.match(patched.slide.content,/<li>Plak de prompt<\/li>/);
  assert.deepEqual(patched.slide.classroom.keyPoints,['B is juist']);
  await svc.run('updateSlide',facilitator,{deckId:deck.id,slideId,edits:[{find:'Oefening 1',replace:'Oefening 2',expectedMatches:1}]});
  const edited=await svc.run('getDeck',facilitator,{deckId:deck.id,slideId}) as any;
  assert.equal(edited.slide.kind,'html');
  assert.equal(edited.slide.classroom,undefined);
 }finally{await svc.close();}
});
