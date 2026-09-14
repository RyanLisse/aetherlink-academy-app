import {mkdirSync,mkdtempSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
import {createApp} from '../server/app.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'artifacts','lx-pr4');
mkdirSync(out,{recursive:true});
const port=4369;
const publicBaseUrl=`http://127.0.0.1:${port}`;
const dir=mkdtempSync(path.join(os.tmpdir(),'academy-lx-pr4-ui-'));
const {server,store}=createApp({dir,root,hostKey:'lx-pr4-host',publicBaseUrl,proofBase:'http://127.0.0.1:4499'});
await new Promise((resolve,reject)=>server.listen(port,'127.0.0.1',err=>err?reject(err):resolve()));

const host=store.create('LX PR4 screenshots',{slug:'lx-pr4',editor:'editor-token'});
const widths=[1440,1180,1024];
const shots=[];

async function shoot(page,prefix){
 for(const w of widths){
  await page.setViewportSize({width:w,height:1100});
  await page.waitForTimeout(250);
  const file=`${prefix}-${w}.png`;
  await page.screenshot({path:path.join(out,file),fullPage:true});
  shots.push(file);
 }
}

const browser=await chromium.launch({headless:true});

// Join: participant default
{
 const context=await browser.newContext({viewport:{width:1440,height:1100},deviceScaleFactor:1});
 const page=await context.newPage();
 await page.goto(publicBaseUrl+'/',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('.join-form');
 await page.getByRole('tab',{name:'Ik ben deelnemer'}).click();
 await page.waitForSelector('text=Welkom bij je squad');
 await shoot(page,'join-deelnemer');
 await context.close();
}

// Join: facilitator choice (no Google SSO in local createApp without creds)
{
 const context=await browser.newContext({viewport:{width:1440,height:1100},deviceScaleFactor:1});
 const page=await context.newPage();
 await page.goto(publicBaseUrl+'/',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('.join-form');
 await page.getByRole('tab',{name:'Ik ben facilitator'}).click();
 await page.waitForSelector('text=Start een squad');
 await shoot(page,'join-facilitator');
 // mobile-ish join check
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(200);
 await page.screenshot({path:path.join(out,'join-facilitator-mobile-390.png'),fullPage:true});
 shots.push('join-facilitator-mobile-390.png');
 await context.close();
}

// Join with invite code prefilled
{
 const context=await browser.newContext({viewport:{width:1440,height:1100},deviceScaleFactor:1});
 const page=await context.newPage();
 await page.goto(publicBaseUrl+'/?code='+host.code,{waitUntil:'domcontentloaded'});
 await page.waitForSelector('.join-form');
 await page.waitForSelector(`input[name="code"]`);
 await shoot(page,'join-with-code');
 await context.close();
}

// Facilitator bar in room (esp 1024)
{
 const context=await browser.newContext({viewport:{width:1440,height:1100},deviceScaleFactor:1});
 await context.addInitScript(token=>{sessionStorage.setItem('academy-token',token);},host.token);
 const page=await context.newPage();
 await page.goto(publicBaseUrl+'/',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('.facilitator-controls',{timeout:15000});
 await page.waitForSelector('.facilitator-controls-time');
 await page.waitForSelector('.facilitator-controls-context');
 await shoot(page,'facilitator-bar');
 // crop-ish full page is fine; also room with bar
 await shoot(page,'room-with-bar');
 await context.close();
}

await browser.close();
server.close();
console.log(JSON.stringify({out,shots},null,2));
