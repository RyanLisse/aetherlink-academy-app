import {mkdirSync,mkdtempSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
import {createApp} from '../server/app.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'artifacts','lis-54');
mkdirSync(out,{recursive:true});
const port=4370;
const publicBaseUrl=`http://127.0.0.1:${port}`;
const dir=mkdtempSync(path.join(os.tmpdir(),'academy-lis-54-'));
const {server,store}=createApp({dir,root,hostKey:'lis-54-host',publicBaseUrl,proofBase:'http://127.0.0.1:4499'});
await new Promise((resolve,reject)=>server.listen(port,'127.0.0.1',err=>err?reject(err):resolve()));

const host=store.create('LIS-54 Classroom',{slug:'lis-54',editor:'editor-token'});
const widths=[1440,1180,1024];
const shots=[];

async function ensureNormal(page){
 try{await page.evaluate(()=>{if(document.fullscreenElement)document.exitFullscreen?.();});}catch{}
 await page.waitForTimeout(100);
}

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
await context.addInitScript(token=>{sessionStorage.setItem('academy-token',token);},host.token);
const page=await context.newPage();
await page.goto(publicBaseUrl+'/',{waitUntil:'domcontentloaded'});
await page.waitForSelector('.facilitator-controls',{timeout:20000});
await page.waitForSelector('.classroom-open');

for(const w of widths){
 await ensureNormal(page);
 await page.setViewportSize({width:w,height:900});
 await page.waitForTimeout(250);
 const file=`facilitator-bar-${w}.png`;
 await page.screenshot({path:path.join(out,file),fullPage:true});
 shots.push(file);
}

for(const w of widths){
 await ensureNormal(page);
 // close overlay if open
 if(await page.locator('[data-testid="classroom-overlay"]').count()){
  await page.getByRole('button',{name:'Exit Classroom'}).click();
  await page.waitForSelector('.facilitator-controls');
 }
 await page.setViewportSize({width:w,height:900});
 await page.getByRole('button',{name:'Open Classroom mode'}).click();
 await page.waitForSelector('[data-testid="classroom-overlay"]');
 await page.waitForSelector('iframe.classroom-frame');
 await page.waitForTimeout(3500);
 const file=`classroom-fullscreen-${w}.png`;
 await page.screenshot({path:path.join(out,file),fullPage:false});
 shots.push(file);
}

// Exit restores facilitator UI
await page.getByRole('button',{name:'Exit Classroom'}).click();
await page.waitForSelector('.facilitator-controls');
const overlayGone=await page.locator('[data-testid="classroom-overlay"]').count();
if(overlayGone!==0)throw new Error('classroom overlay still present after Exit');
await page.waitForSelector('.room-heading');
// room code still present
await page.waitForSelector('.room-code-display',{timeout:10000});

for(const w of widths){
 await ensureNormal(page);
 await page.setViewportSize({width:w,height:900});
 await page.waitForTimeout(250);
 const file=`after-exit-${w}.png`;
 await page.screenshot({path:path.join(out,file),fullPage:true});
 shots.push(file);
}

await browser.close();
server.close();
console.log(JSON.stringify({out,shots,roomCode:host.code},null,2));
