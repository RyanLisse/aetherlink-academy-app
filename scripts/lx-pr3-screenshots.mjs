import {mkdirSync,mkdtempSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
import {createApp} from '../server/app.mjs';
import {randomUUID} from 'node:crypto';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'artifacts','lx-pr3');
mkdirSync(out,{recursive:true});
const port=4368;
const publicBaseUrl=`http://127.0.0.1:${port}`;
const dir=mkdtempSync(path.join(os.tmpdir(),'academy-lx-pr3-ui-'));
const {server,store}=createApp({dir,root,hostKey:'lx-pr3-host',publicBaseUrl,proofBase:'http://127.0.0.1:4499'});
await new Promise((resolve,reject)=>server.listen(port,'127.0.0.1',err=>err?reject(err):resolve()));

const host=store.create('LX PR3 screenshots',{slug:'lx-pr3',editor:'editor-token'});
const participant=store.join(host.code,'Sam');
const widths=[1440,1180,1024];

async function withPage(fn){
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1100},deviceScaleFactor:1});
 await context.addInitScript(token=>{sessionStorage.setItem('academy-token',token);},participant.token);
 const page=await context.newPage();
 await page.goto(publicBaseUrl+'/',{waitUntil:'domcontentloaded'});
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
 await page.waitForTimeout(500);
}

async function shoot(page,prefix,shots){
 for(const w of widths){
  await page.setViewportSize({width:w,height:1100});
  await page.waitForTimeout(200);
  const file=`${prefix}-${w}.png`;
  await page.screenshot({path:path.join(out,file),fullPage:true});
  shots.push(file);
 }
}

async function seedDay1Progress(){
 await setDay(1);
 // Mutate through withSession so LocalStore queue stays consistent
 await store.withSession(participant.token,'browser',({r,p})=>{
  const at=new Date().toISOString();
  p.quiz={score:3,at,day:1};
  p.route='stretch';
  p.progressByDay={...(p.progressByDay||{}),['1']:{quizScore:3,route:'stretch',quizAt:at,evidenceCount:1,evidenceAt:at}};
  if(!r.evidence.some(e=>e.requestId==='shot-1')){
   r.evidence.push({id:randomUUID(),requestId:'shot-1',personId:p.id,name:p.name,source:'Deelnemer',finding:'README.md zegt npm test, package.json heeft alleen node --test.',command:'node --test',observed:'1 failed, 0 passed',limitation:'Nog geen tweede lezer',day:1,at,status:'pending'});
  }
  r.version++;
 });
 const state=await fetch(publicBaseUrl+'/game/state',{headers:{authorization:`Bearer ${participant.token}`}}).then(r=>r.json());
 if(!state.evidence?.length)throw new Error('seed failed: '+JSON.stringify(state.evidence));
 if(!state.me?.progressByDay?.['1']?.hasQuiz && state.me?.progressByDay?.['1']?.quizScore!==3){
  // progressByDay may be present with quizScore
  if(state.me?.progressByDay?.['1']?.quizScore!==3)throw new Error('progress seed failed '+JSON.stringify(state.me?.progressByDay));
 }
 return state;
}

const shots=[];

await setDay(1);
await withPage(async page=>{
 await openView(page,'Solo-missie');
 await page.waitForSelector('text=ATLAS-REVIEW-01');
 await shoot(page,'solo-day1',shots);
});

await setDay(2);
await withPage(async page=>{
 await openView(page,'Solo-missie');
 await page.waitForSelector('text=ATLAS-CONTEXT-02');
 await page.waitForSelector('text=zelfde starterbestanden');
 await shoot(page,'solo-day2',shots);
});

await seedDay1Progress();
await withPage(async page=>{
 await openView(page,'Review & overdracht');
 await page.waitForSelector('text=README.md zegt npm test',{timeout:10000});
 await shoot(page,'review-evidence',shots);
 await openView(page,'Mijn route');
 await page.waitForSelector('.progress-chip.on');
 await shoot(page,'route-after-day1',shots);
});

await setDay(2);
await withPage(async page=>{
 await openView(page,'Mijn route');
 await page.waitForSelector('.day-list .current');
 const currentTitle=await page.locator('.day-list .current h3').innerText();
 if(!/Dieper begrijpen/.test(currentTitle))throw new Error('expected day2 current, got '+currentTitle);
 await page.waitForSelector('.progress-chip.on');
 await shoot(page,'route-after-day2-switch',shots);
});

server.close();
console.log(JSON.stringify({out,shots},null,2));
