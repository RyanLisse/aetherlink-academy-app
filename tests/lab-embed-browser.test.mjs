import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,mkdtempSync} from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
import {createApp} from '../server/app.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const screenshotDir=process.env.ACADEMY_SCREENSHOT_DIR;

const freePort=()=>new Promise((resolve,reject)=>{const probe=net.createServer();probe.once('error',reject);probe.listen(0,'127.0.0.1',()=>{const {port}=probe.address();probe.close(()=>resolve(port));});});

async function shot(page,name){
 if(!screenshotDir)return;
 mkdirSync(screenshotDir,{recursive:true});
 await page.screenshot({path:path.join(screenshotDir,name),fullPage:false});
}

test('a real Arcade lesson embedded in the day-1 lesson reports completion into room progress',async()=>{
 for(const built of ['dist/index.html','apps/arcade-lab/dist/index.html'])assert.ok(existsSync(path.join(root,built)),`${built} missing: run pnpm run build first`);
 const port=await freePort(),base=`http://127.0.0.1:${port}`;
 // Synthetic lab declaration: production day packs declare no labs yet.
 const {server,store}=createApp({dir:mkdtempSync(path.join(os.tmpdir(),'academy-lab-browser-')),root,hostKey:'test-host',publicBaseUrl:base,labsForDay:day=>day===1?[{id:'sample-counter',src:'/arcade-lab/?lesson=sample-counter&embed=1',title:'Arcade · klikteller'}]:[]});
 await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
 const host=store.create('Lab squad',{slug:'lab-squad'});
 const {resumeToken}=store.join(host.code,'Ada');
 const browser=await chromium.launch();
 try{
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  await context.addInitScript(()=>localStorage.setItem('academy-locale','nl'));
  const page=await context.newPage();
  const state=()=>page.evaluate(async()=>(await fetch('/game/state',{headers:{authorization:`Bearer ${sessionStorage.getItem('academy-token')}`}})).json());
  await page.goto(`${base}/#access=${resumeToken}`);
  await page.getByRole('button',{name:'Les & quick check',exact:true}).click();
  const embed=page.locator('article.lab-embed[data-lab-id="sample-counter"]');
  const chip=embed.getByRole('status');
  await assert.doesNotReject(chip.filter({hasText:'Stap 0 van 2'}).waitFor({timeout:20000}),'lab handshake reports step 0 of 2');

  await page.evaluate(()=>window.postMessage({v:1,type:'complete',labId:'sample-counter',result:{outcome:'completed'}},'*'));
  await page.waitForTimeout(300);
  assert.equal(await embed.getAttribute('data-lab-status'),'open','a complete message from a non-lab window is ignored');

  const lab=page.frameLocator('iframe.lab-frame');
  const frame=page.frames().find(candidate=>candidate.url().includes('/arcade-lab/'));
  assert.ok(frame,'arcade lab frame is loaded');
  assert.equal(await frame.evaluate(()=>document.body.classList.contains('lab-bridge')),true);
  const stopAt=await frame.evaluate(()=>window.lessons.find(lesson=>lesson.id==='sample-counter').ops.find(op=>op.stop).t);
  await shot(page,'lab-embed-desktop-start.png');

  await frame.evaluate(t=>{window.player.seek(t-150);window.player.play();},stopAt);
  await lab.getByRole('button',{name:'Reveal & continue'}).click();
  await lab.getByRole('button',{name:'Continue'}).click();
  await assert.doesNotReject(chip.filter({hasText:'Stap 1 van 2'}).waitFor({timeout:10000}),'finishing the checkpoint advances progress');
  assert.equal((await state()).me.progressByDay['1']?.labs,undefined,'progress alone records nothing');

  const duration=await frame.evaluate(()=>window.lessons.find(lesson=>lesson.id==='sample-counter').duration);
  await frame.evaluate(t=>{window.player.seek(t);window.player.play();},duration-300);
  await assert.doesNotReject(chip.filter({hasText:'Afgerond · gemeld door het lab'}).waitFor({timeout:10000}),'completion is saved');
  const saved=(await state()).me.progressByDay['1'].labs['sample-counter'];
  assert.equal(saved.source,'lab-reported');
  assert.deepEqual(saved.result,{outcome:'completed'});
  assert.equal(saved.evidence,'sample-counter: 1/1 checkpoints, end reached');
  await shot(page,'lab-embed-desktop-done.png');

  await page.getByRole('button',{name:'Mijn route'}).click();
  await assert.doesNotReject(page.locator('.progress-chip.on',{hasText:'Labs 1/1'}).waitFor({timeout:10000}),'route shows the lab chip');

  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Les & quick check',exact:true}).click();
  await embed.scrollIntoViewIfNeeded();
  await chip.filter({hasText:'Afgerond'}).waitFor();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert.equal(overflow,0,'no horizontal scroll at 390px');
  await shot(page,'lab-embed-390-done.png');
 }finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
});

test('graded Arcade stops are checked by the server before the lab can complete',async()=>{
 const port=await freePort(),base=`http://127.0.0.1:${port}`;
 // Synthetic lab declaration and stop-1 key. stop-2 is the lesson's real knowledge check (correct: 1).
 const {server,store}=createApp({dir:mkdtempSync(path.join(os.tmpdir(),'academy-lab-graded-')),root,hostKey:'test-host',publicBaseUrl:base,
  labsForDay:day=>day===1?[{id:'ws-2-eve-state',src:'/arcade-lab/?lesson=ws-2-eve-state&embed=1',title:'Arcade · state'}]:[],
  labKeys:{'ws-2-eve-state':{'stop-1':{kind:'match',regex:'\\b(ja|yes)\\b',flags:'i'},'stop-2':{kind:'choice',correct:1}}}});
 await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
 const host=store.create('Graded squad',{slug:'graded-squad'});
 const {resumeToken}=store.join(host.code,'Ada');
 const browser=await chromium.launch();
 try{
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  await context.addInitScript(()=>localStorage.setItem('academy-locale','nl'));
  const page=await context.newPage();
  const academyBodies=[];
  page.on('response',response=>{if(new URL(response.url()).pathname.startsWith('/game/'))academyBodies.push(response.text().catch(()=>''));});
  const state=()=>page.evaluate(async()=>(await fetch('/game/state',{headers:{authorization:`Bearer ${sessionStorage.getItem('academy-token')}`}})).json());
  const stops=async()=>(await state()).me.progressByDay['1']?.labStops?.['ws-2-eve-state'];
  await page.goto(`${base}/#access=${resumeToken}`);
  await page.getByRole('button',{name:'Les & quick check',exact:true}).click();
  const embed=page.locator('article.lab-embed[data-lab-id="ws-2-eve-state"]');
  const chip=embed.getByRole('status');
  await assert.doesNotReject(chip.filter({hasText:'Stap 0 van 3'}).waitFor({timeout:20000}),'lab handshake reports step 0 of 3');
  const lab=page.frameLocator('iframe.lab-frame');
  const frame=page.frames().find(candidate=>candidate.url().includes('/arcade-lab/'));
  const stopTimes=await frame.evaluate(()=>window.lessons.find(lesson=>lesson.id==='ws-2-eve-state').ops.filter(op=>op.stop).map(op=>op.t));
  const verdict=lab.locator('#cpExplain');

  await frame.evaluate(t=>{window.player.seek(t-150);window.player.play();},stopTimes[0]);
  await lab.getByText('graded by Academy').waitFor({timeout:10000});
  await lab.locator('#cpText').fill('Nee, nooit');
  await lab.getByRole('button',{name:'Check answer'}).click();
  await assert.doesNotReject(verdict.filter({hasText:'Not quite. Try again · attempt 1'}).waitFor({timeout:10000}),'the server verdict reaches the lab');
  assert.equal(await lab.getByRole('button',{name:'Continue'}).isDisabled(),true,'a failed stop cannot continue');
  assert.deepEqual((await stops())['stop-1'].passed,false);
  await lab.locator('#cpText').fill('Ja, de stap draait opnieuw');
  await lab.getByRole('button',{name:'Check answer'}).click();
  await verdict.filter({hasText:'Correct.'}).waitFor({timeout:10000});
  await lab.getByRole('button',{name:'Continue'}).click();
  await assert.doesNotReject(chip.filter({hasText:'Stap 1 van 3'}).waitFor({timeout:10000}),'a passed graded stop advances progress');

  await frame.evaluate(t=>{window.player.seek(t-150);window.player.play();},stopTimes[1]);
  const options=lab.locator('#checkpoint .opt');
  await options.first().waitFor({timeout:10000});
  await options.nth(0).click();
  await verdict.filter({hasText:'Not quite.'}).waitFor({timeout:10000});
  assert.deepEqual(await options.evaluateAll(buttons=>buttons.map(button=>button.className)),['opt wrong','opt'],'a wrong choice does not reveal the right one');
  await frame.evaluate(()=>{document.getElementById('checkpoint').scrollTop=0;});
  await shot(page,'lab-graded-desktop-wrong.png');
  await options.nth(1).click();
  await verdict.filter({hasText:'Correct.'}).waitFor({timeout:10000});
  const {'stop-2':choice}=await stops();
  assert.deepEqual({passed:choice.passed,attempts:choice.attempts,source:choice.source},{passed:true,attempts:2,source:'server-graded'});
  await lab.getByRole('button',{name:'Continue'}).click();
  await chip.filter({hasText:'Stap 2 van 3'}).waitFor({timeout:10000});

  const duration=await frame.evaluate(()=>window.lessons.find(lesson=>lesson.id==='ws-2-eve-state').duration);
  await frame.evaluate(t=>{window.player.seek(t);window.player.play();},duration-300);
  await assert.doesNotReject(chip.filter({hasText:'Afgerond · door de server beoordeeld'}).waitFor({timeout:10000}),'completion is saved as server-graded');
  const saved=(await state()).me.progressByDay['1'].labs['ws-2-eve-state'];
  assert.deepEqual({source:saved.source,result:saved.result},{source:'server-graded',result:{outcome:'completed',score:{value:2,max:2}}});
  await shot(page,'lab-graded-desktop-done.png');

  for(const body of await Promise.all(academyBodies))assert.doesNotMatch(body,/"correct"|"regex"|"kind":"(choice|match)"/,'no Academy response carries an answer key');
  assert.ok(academyBodies.length>=8,'the leak check saw the Academy traffic');

  await page.setViewportSize({width:390,height:844});
  await embed.scrollIntoViewIfNeeded();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert.equal(overflow,0,'no horizontal scroll at 390px');
  await shot(page,'lab-graded-390-done.png');
 }finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
});
