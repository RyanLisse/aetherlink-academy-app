import test from 'node:test';
import assert from 'node:assert/strict';
import {Effect,Exit} from 'effect';
import {applySlideEdits} from '../server/slides/edits.ts';
import {hashSlideContent,sanitizeSlideContent,templateSlide,ensureUniqueSlideIds,textPreview} from '../server/slides/html.ts';
import {renderDeckHtml} from '../server/slides/export-html.ts';
import {Deck,Slide} from '../server/slides/schema.ts';

const run=(content:string,edits:any[])=>Effect.runSyncExit(applySlideEdits(content,edits));
const ok=(content:string,edits:any[])=>{const exit=run(content,edits);assert.ok(Exit.isSuccess(exit),JSON.stringify(exit));return (exit as any).value;};
const failWith=(content:string,edits:any[],pattern:RegExp)=>{const exit=run(content,edits);assert.ok(Exit.isFailure(exit));const error=(exit as any).cause.error;assert.equal(error._tag,'EditFailed');assert.match(error.message,pattern);};

test('replace: unique literal, expectedMatches guard and occurrence selection',()=>{
 assert.equal(ok('<p>a b a</p>',[{find:'b',replace:'c',expectedMatches:1}]).content,'<p>a c a</p>');
 failWith('<p>a b a</p>',[{find:'a',replace:'x'}],/occurs 2 times/);
 assert.equal(ok('<p>a b a</p>',[{find:'a',replace:'x',occurrence:2}]).content,'<p>a b x</p>');
 assert.equal(ok('<p>a b a</p>',[{find:'a',replace:'x',all:true}]).content,'<p>x b x</p>');
 failWith('<p>a</p>',[{find:'a',replace:'x',expectedMatches:2}],/verwachtte 2/);
 failWith('<p>a</p>',[{find:'zzz',replace:'x'}],/not found/);
 assert.deepEqual(ok('<p>a</p>',[{find:'zzz',replace:'x',required:false}]).summaries,['replace:0']);
});

test('insert, replace-between and regex-replace are ordered and atomic',()=>{
 const html='<h2>T</h2><ul><li>1</li></ul>';
 const out=ok(html,[{op:'insert-after',find:'<li>1</li>',content:'<li>2</li>'},{op:'replace-between',start:'<h2>',end:'</h2>',replace:'Titel'},{op:'regex-replace',pattern:'<li>(\\d)</li>',replace:'<li>punt $1</li>',all:true}]);
 assert.equal(out.content,'<h2>Titel</h2><ul><li>punt 1</li><li>punt 2</li></ul>');
 assert.deepEqual(out.summaries,['insert-after:1','replace-between:1','regex-replace:2']);
 failWith(html,[{op:'insert-before',find:'<li>1</li>',content:'x'},{find:'missing',replace:'y'}],/Edit 2/);
 failWith(html,[{op:'regex-replace',pattern:'(',replace:'x'}],/invalid expression/);
});

test('hash matches upstream FNV-1a and sanitizer strips active content',()=>{
 assert.equal(hashSlideContent(''),'811c9dc5');
 assert.equal(hashSlideContent('a'),'e40c292c');
 const dirty='<div class="fmd-slide" onclick="x()"><script>alert(1)</script><a href="javascript:evil()">l</a><iframe src="x"></iframe><img src=x onerror="y"><sty<style>le>body{}</style></div>';
 const clean=sanitizeSlideContent(dirty);
 assert.doesNotMatch(clean,/<script|<iframe|onclick|onerror|javascript:|<style/i);
 assert.match(clean,/class="fmd-slide"/);
});

test('templates produce the shared wrapper contract and escape text',()=>{
 const title=templateSlide({heading:'Hallo <b>',body:['Ondertitel'],layout:'title'});
 assert.equal(title.layout,'title');
 assert.match(title.content,/class="fmd-slide" style="--deck-bg: var\(--ds-bg, Canvas\)/);
 assert.match(title.content,/<h1[^>]*>Hallo &lt;b&gt;<\/h1>/);
 const two=templateSlide({heading:'H',body:['a','b','c']});
 assert.equal(two.layout,'content');
 assert.equal((two.content.match(/border-left: 3px solid/g)||[]).length,3);
 assert.equal(templateSlide({heading:'H',body:['a','b','c','d'],layout:'two-column'}).content.match(/grid-template-columns: 1fr 1fr/g)?.length,1);
 assert.equal(textPreview('<h2>Een</h2><p>twee &amp; drie</p>'),'Een twee & drie');
});

test('ensureUniqueSlideIds keeps first ids and repairs duplicates',()=>{
 const out=ensureUniqueSlideIds([{id:'a'},{id:'a'},{},{id:'b'}]);
 assert.equal(out[0].id,'a');assert.notEqual(out[1].id,'a');assert.match(out[2].id!,/^slide-/);assert.equal(out[3].id,'b');
 assert.equal(new Set(out.map(s=>s.id)).size,4);
});

test('export renders a standalone viewer with every slide and no external scripts',()=>{
 const now=new Date().toISOString();
 const deck=new Deck({id:'11111111-1111-4111-8111-111111111111',roomId:'22222222-2222-4222-8222-222222222222',title:'Demo <deck>',slides:[new Slide({id:'s1',content:'<div class="fmd-slide"><h1>Een</h1></div>'}),new Slide({id:'s2',content:'<div class="fmd-slide"><h2>Twee</h2><script>x()</script></div>',notes:'geheim'})],revision:1,createdBy:{id:'p',name:'P'},createdAt:now,updatedAt:now});
 const html=renderDeckHtml(deck);
 assert.match(html,/<title>Demo &lt;deck&gt;<\/title>/);
 assert.equal((html.match(/class="slide"/g)||[]).length,2);
 assert.doesNotMatch(html,/x\(\)|geheim|src="http/);
 assert.match(html,/ArrowRight/);
 assert.match(renderDeckHtml(deck,{includeNotes:true}),/class="notes" hidden>geheim/);
});
