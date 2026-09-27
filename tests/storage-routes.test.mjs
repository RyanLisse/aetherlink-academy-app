import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';
import {createFileStorage} from '../server/storage/runtime.ts';
import {MemoryObjectStore} from '../server/storage/object-store.ts';

async function fixture(t){
 const dir=await mkdtemp(path.join(os.tmpdir(),'academy-files-'));
 const files=createFileStorage({objectStore:MemoryObjectStore});
 const instance=createApp({dir,fileStorageService:files});
 const host=instance.store.create('Files',{slug:'files'});
 const participant=instance.store.join(host.code,'Uploader');
 const peer=instance.store.join(host.code,'Peer');
 const foreign=instance.store.create('Other',{slug:'other'});
 await new Promise(resolve=>instance.server.listen(0,'127.0.0.1',resolve));
 t.after(async()=>{
  await new Promise(resolve=>instance.server.close(resolve));
  await files.close();await instance.slides.close();
  await rm(dir,{recursive:true,force:true});
 });
 const base=`http://127.0.0.1:${instance.server.address().port}`;
 const request=(route,{token=participant.token,headers={},...options}={})=>fetch(`${base}/game/files${route}`,{...options,headers:{...(token?{authorization:`Bearer ${token}`} : {}),...headers}});
 const upload=(filename,contentType,body,options={})=>request(`?${new URLSearchParams({filename,contentType})}`,{...options,method:'POST',headers:{'content-type':contentType,...options.headers},body});
 return {request,upload,host,peer,foreign};
}

test('file HTTP routes preserve JSON bytes and Unicode names with safe download headers',async t=>{
 const {request,upload}=await fixture(t);
 const body='{"hello":"wereld"}';
 const created=await upload('日本語.json','application/json',body);
 assert.equal(created.status,201);
 const file=await created.json();
 const downloaded=await request(`/${file.id}`);
 assert.equal(downloaded.status,200);
 assert.equal(await downloaded.text(),body);
 assert.match(downloaded.headers.get('content-disposition'),/^attachment;/);
 assert.ok(downloaded.headers.get('content-disposition').includes("filename*=UTF-8''"+encodeURIComponent('日本語.json')));
 assert.match(downloaded.headers.get('content-type'),/^application\/json/);
 assert.equal(downloaded.headers.get('cache-control'),'private, no-store');
 assert.equal(downloaded.headers.get('x-content-type-options'),'nosniff');
 const listed=await request('');assert.equal(listed.status,200);
 assert.deepEqual((await listed.json()).files.map(entry=>entry.id),[file.id]);
 for(const [name,type,bytes,disposition] of [['図.svg','image/svg+xml','<svg/>','attachment'],['図.png','image/png',Buffer.from([137,80,78,71]),'inline']]){
  const response=await upload(name,type,bytes);assert.equal(response.status,201);
  const image=await response.json();const got=await request(`/${image.id}`);
  assert.equal(got.status,200);assert.ok(got.headers.get('content-disposition').startsWith(disposition+';'));
  assert.equal(got.headers.get('content-type'),type);
  assert.deepEqual(Buffer.from(await got.arrayBuffer()),Buffer.from(bytes));
 }
});

test('file HTTP routes enforce authentication, room isolation, delete authority and input limits',async t=>{
 const {request,upload,host,peer,foreign}=await fixture(t);
 const created=await upload('private.txt','text/plain','private');assert.equal(created.status,201);
 const {id}=await created.json();
 assert.equal((await request('',{token:null})).status,401);
 assert.equal((await request(`/${id}`,{token:foreign.token})).status,404);
 assert.equal((await request(`/${id}`,{method:'DELETE',token:foreign.token})).status,404);
 assert.equal((await request(`/${id}`,{method:'DELETE',token:peer.token})).status,403);
 const deleted=await request(`/${id}`,{method:'DELETE',token:host.token});assert.equal(deleted.status,200);
 assert.deepEqual(await deleted.json(),{deleted:true,fileId:id});
 assert.equal((await request(`/${id}`)).status,404);
 assert.equal((await upload('bad.html','text/html','<script/>')).status,400);
 assert.equal((await upload('empty.txt','text/plain','')).status,400);
 const tooLarge=await upload('large.txt','text/plain',Buffer.alloc(25*1024*1024+1));
 assert.equal(tooLarge.status,413);assert.match((await tooLarge.json()).error,/25 MiB/);
 const unauthenticatedLarge=await upload('unauthenticated.txt','text/plain',Buffer.alloc(27*1024*1024),{token:null});
 assert.equal(unauthenticatedLarge.status,401);
 const parserLimit=await upload('larger.txt','text/plain',Buffer.alloc(27*1024*1024));
 assert.equal(parserLimit.status,413);assert.match((await parserLimit.json()).error,/25 MiB/);
});
