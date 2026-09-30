import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';

test('browser reads and intent-link changes enforce credential and driver roles',async()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'academy-browser-auth-'));
 const instance=createApp({dir,hostKey:'test-host',root:process.cwd()});
 await new Promise(r=>instance.server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${instance.server.address().port}`;
 const request=(route,token,method='GET',body)=>fetch(base+route,{method,headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:body&&JSON.stringify(body)});
 const jsonRequest=(route,body)=>fetch(base+route,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
 const setIntent=(token,url)=>request('/game/intent',token,'POST',{url});
 try{
  const host=instance.store.create('Auth room');
  for(const [route,body] of [['/game/facilitator/overview',{hostKey:'wrong'}],['/game/facilitator/attach',{hostKey:'wrong',roomId:host.roomId}]]){const response=await jsonRequest(route,body);assert.equal(response.status,403);assert.deepEqual(await response.json(),{error:'Invalid facilitator start key.'});}
  const overview=await jsonRequest('/game/facilitator/overview',{hostKey:'test-host'});assert.equal(overview.status,200);assert.ok(Array.isArray(await overview.json()));
  const driver=instance.store.join(host.code,'Driver');
  const navigator=instance.store.join(host.code,'Navigator');
  instance.store.join(host.code,'Third');
  instance.store.join(host.code,'Fourth');
  const {r,p}=instance.store.auth(navigator.token);
  const mcp=instance.store.session(r.id,p.id,'mcp');
  for(const route of ['/game/knowledge','/game/intent.md','/game/starter/README.md']){
   assert.equal((await request(route,mcp)).status,401,route);
   assert.equal((await request(route,navigator.token)).status,200,route);
  }
  const template=await request('/game/intent.md',navigator.token);
  assert.match(template.headers.get('content-disposition'),/intent\.md/);
  assert.match(await template.text(),/^# Our intent/);
  for(const route of ['/d/auth-room','/api/documents/auth-room','/documents/auth-room/ops','/game/document','/game/suggestions'])assert.equal((await request(route,navigator.token)).status,404,route);

  const link='https://proof.example.test/d/squad-intent';
  assert.equal((await setIntent(navigator.token,link)).status,403);
  assert.equal((await setIntent(mcp,link)).status,401);
  const saved=await setIntent(driver.token,link);
  assert.equal(saved.status,200);
  assert.deepEqual(await saved.json(),{intentUrl:link});
  assert.equal((await (await request('/game/state',navigator.token)).json()).intentUrl,link);
  for(const bad of ['http://proof.example.test/d/x','javascript:alert(1)','intent.md','https://user:pw@example.test/intent.md',`https://example.test/${'x'.repeat(500)}`,42])assert.equal((await setIntent(host.token,bad)).status,400,String(bad).slice(0,40));
  instance.store.control(instance.store.auth(navigator.token).r,'next');
  assert.equal((await setIntent(driver.token,'https://github.com/squad/repo/blob/main/intent.md')).status,403);
  assert.equal((await setIntent(navigator.token,'https://github.com/squad/repo/blob/main/intent.md')).status,200);
  const cleared=await setIntent(host.token,'');
  assert.deepEqual(await cleared.json(),{intentUrl:null});
 }finally{await new Promise(r=>instance.server.close(r));rmSync(dir,{recursive:true,force:true});}
});
