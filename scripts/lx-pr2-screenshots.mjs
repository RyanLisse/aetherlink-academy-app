import {mkdirSync,mkdtempSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
import {createApp} from '../server/app.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'artifacts','lx-pr2');
mkdirSync(out,{recursive:true});
const port=4367;
const publicBaseUrl=`http://127.0.0.1:${port}`;
const dir=mkdtempSync(path.join(os.tmpdir(),'academy-lx-pr2-ui-'));
const {server,store}=createApp({dir,root,hostKey:'lx-pr2-host',publicBaseUrl,proofBase:'http://127.0.0.1:4499'});
await new Promise((resolve,reject)=>server.listen(port,'127.0.0.1',err=>err?reject(err):resolve()));

const host=store.create('LX PR2 screenshots',{slug:'lx-pr2',editor:'editor-token'});
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
 // use API as facilitator host
 const res=await fetch(publicBaseUrl+'/game/control',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${host.token}`},body:JSON.stringify({action:'day',value:day})});
 if(!res.ok)throw new Error('control failed '+await res.text());
}

async function openView(page,label){
 await page.getByRole('button',{name:label}).click();
 await page.waitForTimeout(400);
}

const shots=[];
await setDay(1);
await withPage(1440,async page=>{
 await openView(page,'Les & quick check');
 await page.waitForSelector('text=Maak de opdracht helder');
 for(const w of widths){
  await page.setViewportSize({width:w,height:1100});
  await page.waitForTimeout(200);
  const file=`lesson-day1-${w}.png`;
  await page.screenshot({path:path.join(out,file),fullPage:true});
  shots.push(file);
 }
});

await setDay(2);
await withPage(1440,async page=>{
 await openView(page,'Les & quick check');
 await page.waitForSelector('text=Geef een agent de juiste context');
 for(const w of widths){
  await page.setViewportSize({width:w,height:1100});
  await page.waitForTimeout(200);
  const file=`lesson-day2-${w}.png`;
  await page.screenshot({path:path.join(out,file),fullPage:true});
  shots.push(file);
 }
 await openView(page,'Mijn route');
 await page.waitForSelector('.day-list .current');
 const currentTitle=await page.locator('.day-list .current h3').innerText();
 if(!/Dieper begrijpen/.test(currentTitle))throw new Error('expected day2 current, got '+currentTitle);
 for(const w of widths){
  await page.setViewportSize({width:w,height:1100});
  await page.waitForTimeout(200);
  const file=`route-day2-${w}.png`;
  await page.screenshot({path:path.join(out,file),fullPage:true});
  shots.push(file);
 }
});

server.close();
console.log(JSON.stringify({out,shots},null,2));
