import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {DAY_PACKS} from '../content/days/index.mjs';

const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const publicAssets=path.join(root,'apps/web/public');
const course=path.join(publicAssets,'courses/sre-oncall-agent');
const mirroredFiles=[
 'course/index.html',
 'course/main.js',
 'course/styles.css',
 'docs/diagrams/01-architecture.svg',
 'docs/diagrams/02-contract.svg',
 'docs/diagrams/03-lessons.svg',
 'docs/diagrams/04-ratchet.svg',
 'docs/console-overview.png',
 'docs/console-incident.png',
 'docs/gate-step-9.md',
 'docs/solutions/step-9.md',
 'docs/verification.md',
 'references/README.md',
 'SOLO.md',
 'README.md',
 'CLAUDE.md',
 'LICENSE'
];

test('pinned SRE course mirror has its required files and diagram references',()=>{
 for(const file of mirroredFiles)assert.equal(existsSync(path.join(course,file)),true,file);

 const html=readFileSync(path.join(course,'course/index.html'),'utf8');
 for(const diagram of ['01-architecture.svg','02-contract.svg','03-lessons.svg','04-ratchet.svg']){
  assert.ok(html.includes(`../docs/diagrams/${diagram}`),diagram);
  assert.equal(existsSync(path.join(course,'docs/diagrams',diagram)),true,diagram);
 }

 const solo=readFileSync(path.join(course,'SOLO.md'),'utf8');
 assert.match(solo,/Step 9/);
 assert.match(solo,/get_diff/);
 assert.match(solo,/PASS check/);
 const source=readFileSync(path.join(publicAssets,'courses/SOURCE.md'),'utf8');
 assert.match(source,/sre-oncall-agent@[0-9a-f]{40}/);
});

test('Workshop 5 SRE course materials resolve under public assets in EN and NL',()=>{
 const day5=DAY_PACKS.find(pack=>pack.day===5);
 assert.ok(day5);
 for(const locale of ['en','nl']){
  const hrefs=day5.copy[locale].materials.map(item=>item.href).filter(href=>href?.startsWith('/courses/'));
  assert.ok(hrefs.length>0,`day 5 ${locale} has a /courses/ link`);
  for(const href of hrefs){
   const file=path.join(publicAssets,href.split(/[?#]/,1)[0].replace(/^\/+/,''));
   assert.equal(existsSync(file),true,`day 5 ${locale}: ${href}`);
  }
 }
});

test('Workshop 5 SRE stretch steps stay paired and use cross-platform command lines',()=>{
 const copy=DAY_PACKS.find(pack=>pack.day===5).copy;
 const en=copy.en.solo.filter(step=>step.id.startsWith('sre-'));
 const nl=copy.nl.solo.filter(step=>step.id.startsWith('sre-'));
 assert.deepEqual(en.map(step=>step.id),['sre-0','sre-1','sre-2','sre-3','sre-4','sre-5','sre-6','sre-8','sre-9']);
 assert.deepEqual(nl.map(step=>step.id),en.map(step=>step.id));
 assert.deepEqual(en.map(step=>step.badge),['S0','S1','S2','S3','S4','S5','S6','S8','S9']);
 assert.deepEqual(nl.map(step=>step.badge),en.map(step=>step.badge));
 assert.deepEqual(nl.map(step=>step.run.length),en.map(step=>step.run.length));
 assert.deepEqual(nl.map(step=>(step.prompts??[]).length),en.map(step=>(step.prompts??[]).length));
 for(const locale of ['en','nl']){
  for(const step of copy[locale].solo.filter(item=>item.id.startsWith('sre-'))){
   assert.equal(step.level,'stretch',`${locale} ${step.id} level`);
   assert.equal(typeof step.watchFor,'string',`${locale} ${step.id} watchFor`);
   assert.ok(step.watchFor.length>0,`${locale} ${step.id} watchFor`);
   for(const command of step.run){
    assert.doesNotMatch(command,/export /,`${locale} ${step.id}`);
    assert.equal(command.endsWith('\\'),false,`${locale} ${step.id}`);
   }
  }
 }
});
