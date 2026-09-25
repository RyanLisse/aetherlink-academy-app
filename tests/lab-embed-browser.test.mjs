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
