import {mkdirSync,mkdtempSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
import {createApp} from '../server/app.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'artifacts','lis-56');
mkdirSync(out,{recursive:true});
const port=4371;
const publicBaseUrl=`http://127.0.0.1:${port}`;
const dir=mkdtempSync(path.join(os.tmpdir(),'academy-lis56-ui-'));
const {server,store}=createApp({dir,root,hostKey:'lis-56-host',publicBaseUrl,proofBase:'http://127.0.0.1:4499'});
await new Promise((resolve,reject)=>server.listen(port,'127.0.0.1',err=>err?reject(err):resolve()));

const host=store.create('LIS-56 screenshots',{slug:'lis-56',editor:'editor-token'});
const participant=store.join(host.code,'Sam');
const widths=[1440,1180,1024];

async function withPage(width,fn){
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width,height:1100},deviceScaleFactor:1});
 await context.addInitScript(token=>{sessionStorage.setItem('academy-token',token);},participant.token);
 const page=await context.newPage();
 await page.goto(publicBaseUrl+'/',{waitUntil:'networkidle'});
 try{await page.waitForSelector('.workspace',{timeout:15000});}catch(e){console.error('body',await page.content());throw e;}
 await fn(page);
 await browser.close();
}

async function setDay(day){
 const res=await fetch(publicBaseUrl+'/game/control',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${host.token}`},body:JSON.stringify({action:'day',value:day})});
 if(!res.ok)throw new Error('control failed '+await res.text());
}

async function openView(page,label){
 await page.getByRole('button',{name:label}).click();
 await page.waitForTimeout(400);
}

const shots=[];
await setDay(3);
await withPage(1440,async page=>{
 await openView(page,'Les & quick check');
 await page.waitForSelector('.progressive-path');
 await page.waitForSelector('text=Van nul naar multi-agent in n8n');
 for(const w of widths){
  await page.setViewportSize({width:w,height:1100});
  await page.waitForTimeout(200);
  const file=`lesson-day3-${w}.png`;
  await page.screenshot({path:path.join(out,file),fullPage:true});
  shots.push(file);
 }
 await openView(page,'Solo-missie');
 await page.waitForSelector('.progressive-path');
 await page.waitForSelector('text=ATLAS-N8N-03');
 for(const w of widths){
  await page.setViewportSize({width:w,height:1100});
  await page.waitForTimeout(200);
  const file=`solo-day3-${w}.png`;
  await page.screenshot({path:path.join(out,file),fullPage:true});
  shots.push(file);
 }
 await openView(page,'Mijn route');
 await page.waitForSelector('.day-list .current');
 for(const w of widths){
  await page.setViewportSize({width:w,height:1100});
  await page.waitForTimeout(200);
  const file=`route-day3-${w}.png`;
  await page.screenshot({path:path.join(out,file),fullPage:true});
  shots.push(file);
 }
});

server.close();
console.log('Wrote',shots.length,'screenshots to',out);
console.log(shots.join('\n'));
