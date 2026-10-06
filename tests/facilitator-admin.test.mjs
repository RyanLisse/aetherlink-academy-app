import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createApp} from '../server/app.mjs';

const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const main=readFileSync(path.join(root,'src/main.jsx'),'utf8');
const workshop=readFileSync(path.join(root,'src/facilitator-workspace.jsx'),'utf8');
const between=(source,from,to)=>{const start=source.indexOf(from);assert.ok(start>=0,from);const end=source.indexOf(to,start+from.length);return source.slice(start,end<0?undefined:end);};

test('GET /facilitator serves the legacy SPA; participant / is unchanged',async()=>{
 const site=mkdtempSync(path.join(os.tmpdir(),'academy-admin-site-')),data=mkdtempSync(path.join(os.tmpdir(),'academy-admin-data-'));
 mkdirSync(path.join(site,'dist'),{recursive:true});mkdirSync(path.join(site,'apps/web/dist'),{recursive:true});
 writeFileSync(path.join(site,'dist/index.html'),'<!doctype html><body>legacy-root</body>');
 writeFileSync(path.join(site,'apps/web/dist/index.html'),'<!doctype html><body>web-root</body>');
 const {server}=createApp({dir:data,root:site,hostKey:'test-host',publicBaseUrl:'http://127.0.0.1:4317'});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const base=`http://127.0.0.1:${server.address().port}`;
  for(const route of ['/facilitator','/']){const response=await fetch(base+route);assert.equal(response.status,200,route);assert.match(await response.text(),/legacy-root/,route);}
 }finally{await new Promise(resolve=>server.close(resolve));rmSync(site,{recursive:true,force:true});rmSync(data,{recursive:true,force:true});}
});

test('/facilitator admin: squads + cohorts with create/delete/open, no participant join gate',()=>{
 const admin=between(main,'function FacilitatorAdmin(','function FacilitatorEmptyShell(');
 assert.match(main,/if\(path===ADMIN_PATH\)return <FacilitatorAdmin /);
 assert.match(admin,/<FacilitatorWorkspace session=\{\{hostKey:auth\.hostKey,squads\}\}/,'admin reuses the squads + cohorts hub (create, delete, attach, open)');
 assert.doesNotMatch(admin,/join-copy|join\.title|<Segmented|join-path|join\.participant/,'no join hero, role toggle or code tabs');
 assert.match(admin,/api\('facilitator\/me'\)/,'SSO cookie restores the admin');
 assert.match(admin,/api\('facilitator\/overview',\{hostKey\}\)/,'start key unlocks the admin');
 assert.match(admin,/sessionStorage\.setItem\(FACILITATOR_RETURN_KEY,ADMIN_PATH\)/,'Google sign-in from admin returns to /facilitator');
 const hub=between(main,'function FacilitatorWorkspace(','function FacilitatorAdmin(');
 assert.match(hub,/facilitator\/room\/delete/);assert.match(main,/facilitator\/cohort\/delete/);
});

test('post-auth land-in opens the Academy workspace; empty state is teach-mode without Create gate',()=>{
 assert.match(main,/const landIn=useCallback\(async\(auth,squads\)=>\{setFacilitatorAuth\(auth\);if\(!squads\?\.length\)\{setFacilitatorEmpty\(true\)/);
 assert.match(main,/api\('facilitator\/attach',\{\.\.\.\(auth\.hostKey\?\{hostKey:auth\.hostKey\}:\{\}\),roomId:squads\[0\]\.id\}\)/,'newest squad opens as facilitator');
 const join=between(main,'function Join(','function FacilitatorWorkspace(');
 assert.match(join,/await onFacilitator\(\{hostKey:data\.hostKey,identity:null\},squads\)/,'start-key unlock lands in');
 assert.match(join,/params\.get\('facilitator'\)==='1'&&!params\.get\('code'\)&&!getToken\(\)/,'Google callback (/?facilitator=1) lands in');
 assert.doesNotMatch(join,/<FacilitatorWorkspace /,'the hub is no longer rendered inside the join gate');
 const empty=between(main,'function FacilitatorEmptyShell(','function CohortPanel(');
 assert.match(empty,/ClassroomShell/);
 assert.match(empty,/teachMode/);
 assert.match(empty,/classroom-teach-embed/);
 assert.match(empty,/classroomPathForDay/);
 assert.doesNotMatch(empty,/facilitator-empty-cta|facilitatorEmpty\.cta/);
 assert.doesNotMatch(empty,/join-copy/);
});

test('workspace has an explicit way back to admin; leaving a squad returns to admin',()=>{
 assert.match(workshop,/\{onAdmin&&<button type="button" data-testid="nav-admin" onClick=\{onAdmin\}>/);
 assert.match(main,/<ClassroomShell[\s\S]*?onAdmin=\{facilitator\?\(\)=>openAdmin\(\):undefined\}/);
 const chrome=readFileSync(path.join(root,'src/classroom-shell.jsx'),'utf8');
 assert.match(chrome,/data-testid="nav-admin"/);
 assert.match(main,/if\(room\.me\.role==='Facilitator'\)\{setRoom\(null\);setConnected\(false\);setSession\(false\);go\(ADMIN_PATH\);return;\}/);
 assert.doesNotMatch(main,/sessionStorage\.setItem\([^)]*hostKey/i,'the start key is never stored');
 for(const file of ['src/i18n/en.json','src/i18n/nl.json','packages/i18n/src/en.json','packages/i18n/src/nl.json']){
  const catalog=JSON.parse(readFileSync(path.join(root,file),'utf8'));
  for(const key of ['nav.admin','admin.toWorkspace','join.openWorkspace','join.openAdmin','facilitatorEmpty.title','facilitatorEmpty.help','facilitatorEmpty.cta'])assert.ok(catalog[key],`${file} ${key}`);
 }
});
