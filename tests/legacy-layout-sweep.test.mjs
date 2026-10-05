import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {chromium} from '@playwright/test';
import {startLegacyFixture,root} from './support/legacy-fixture.mjs';

const screenshotDir=process.env.ACADEMY_SCREENSHOT_DIR??path.join(root,'.verification/evidence/lesson-flow/sweep');

async function shot(page,name){
  mkdirSync(screenshotDir,{recursive:true});
  await page.screenshot({path:path.join(screenshotDir,name),fullPage:true});
}

const layoutDefects=page=>page.evaluate(()=>{
  const defects=[];
  const root=document.documentElement;
  if(root.scrollWidth>root.clientWidth+1)defects.push(`page overflows horizontally by ${root.scrollWidth-root.clientWidth}px`);
  const describe=el=>`${el.tagName.toLowerCase()}${el.className&&typeof el.className==='string'?'.'+el.className.trim().split(/\s+/).join('.'):''} "${(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,40)}"`;
  const visible=el=>{const r=el.getBoundingClientRect();const s=getComputedStyle(el);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
  const scope=document.body;
  for(const el of scope.querySelectorAll('*')){
    if(!visible(el))continue;
    const style=getComputedStyle(el);
    // Letter-stacked text: a text node broken into 3+ lines with fewer than 4 characters per line.
    for(const node of el.childNodes){
      if(node.nodeType!==Node.TEXT_NODE)continue;
      const text=node.textContent.trim();
      if(text.length<8)continue;
      const range=document.createRange();range.selectNodeContents(node);
      const tops=new Set([...range.getClientRects()].map(r=>Math.round(r.top)));
      if(tops.size>=3&&text.length/tops.size<4)defects.push(`letter-stacked text (${tops.size} lines for ${text.length} chars) in ${describe(el)}`);
    }
    // Content bleeding out of a box that does not scroll or clip on purpose.
    if(style.overflowX==='visible'&&el.clientWidth>0&&el.scrollWidth>el.clientWidth+1)defects.push(`content ${el.scrollWidth-el.clientWidth}px wider than its box in ${describe(el)}`);
  }
  return defects;
});

const VIEWPORTS=[[1440,900],[390,844]];
const WAVE_DAYS=[1,2,3,4,5,6,7];
const HARNESS_DAYS=[8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];
const SRE_SOLO_DAYS=[25];

const scan=async(page,defects,where)=>{
  for(const [width,height] of VIEWPORTS){
    await page.setViewportSize({width,height});
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const found=await layoutDefects(page);
    for(const defect of found)defects.push(`${where} width=${width}: ${defect}`);
    if(found.length)await shot(page,`${where.replace(/\W+/g,'-')}-${width}.png`);
  }
};

test('every lesson day, page and viewport is free of layout defects',async()=>{
  assert.ok(existsSync(path.join(root,'dist/index.html')),'dist/index.html missing: run pnpm run build first');
  const wave=await startLegacyFixture();
  const harness=await startLegacyFixture({harness:true});
  const sreSolo=await startLegacyFixture({sreSolo:true});
  const browser=await chromium.launch();
  const defects=[];
  try{
    for(const day of [...WAVE_DAYS,...HARNESS_DAYS,...SRE_SOLO_DAYS]){
      const fixture=WAVE_DAYS.includes(day)?wave:HARNESS_DAYS.includes(day)?harness:sreSolo;
      fixture.setDay(day);
      const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
      await context.addInitScript(()=>localStorage.setItem('academy-locale','en'));
      const page=await context.newPage();
      try{
        await page.goto(`${fixture.base}/#access=${fixture.participantAccess}`);
        await page.getByRole('heading',{name:'Squad Noord'}).waitFor();
        const navigation=page.getByRole('navigation',{name:'Main navigation'});
        const lessonNav=navigation.getByRole('button',{name:'Lesson',exact:true});
        if(!await lessonNav.isVisible())await navigation.getByRole('button',{name:'More',exact:true}).click();
        await lessonNav.click();
        await page.getByTestId('course-pages').waitFor();
        await page.waitForFunction(()=>!document.querySelector('.primary [data-status="loading"]'),null,{timeout:10000});

        const stepper=page.getByTestId('lesson-stepper');
        const steps=stepper.getByRole('button');
        const stepCount=await steps.count();
        for(let index=0;index<stepCount;index++){
          await steps.nth(index).click();
          const lessonPage=page.getByTestId('lesson-page');
          await lessonPage.waitFor();
          const pageId=await lessonPage.getAttribute('data-lesson-page');
          await scan(page,defects,`day=${day} page=${pageId}`);
        }

        const activityProgress=page.getByRole('navigation',{name:'Activity progress'});
        for(const [name,ready] of [['Assignments','.assignment-page'],['Quiz','[data-testid="quiz-page"]']]){
          const button=activityProgress.getByRole('button',{name,exact:true});
          if(!await button.count())continue;
          await button.click();
          await page.locator(ready).waitFor();
          await page.waitForFunction(()=>!document.querySelector('.primary [data-status="loading"]'),null,{timeout:10000});
          await scan(page,defects,`day=${day} page=${name.toLowerCase()}`);
        }
      }finally{
        await context.close();
      }
    }
  }finally{
    await browser.close();
    await wave.close();
    await harness.close();
    await sreSolo.close();
  }
  assert.deepEqual(defects,[],`layout defects found:\n${defects.join('\n')}`);
});

test('every participant and facilitator destination is free of layout defects',async()=>{
  assert.ok(existsSync(path.join(root,'dist/index.html')),'dist/index.html missing: run pnpm run build first');
  const fixture=await startLegacyFixture();
  fixture.setDay(1);
  const browser=await chromium.launch();
  const defects=[];
  const open=async token=>{
    const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    await context.addInitScript(sessionToken=>{localStorage.setItem('academy-locale','en');if(sessionToken)sessionStorage.setItem('academy-token',sessionToken);},token);
    return context.newPage();
  };
  const settled=page=>page.waitForFunction(()=>!document.querySelector('.primary [data-status="loading"]')&&(document.querySelector('.primary')?.textContent||'').trim().length>0,null,{timeout:10000});
  try{
    const page=await open(null);
    await page.goto(`${fixture.base}/#access=${fixture.participantAccess}`);
    await page.getByRole('heading',{name:'Squad Noord'}).waitFor();
    await settled(page);
    await scan(page,defects,'participant view=room');
    const navigation=page.getByRole('navigation',{name:'Main navigation'});
    const primaryNav=navigation.getByTestId('participant-primary-nav');
    for(let index=0;index<await primaryNav.getByRole('button').count();index++){
      const button=primaryNav.getByRole('button').nth(index);
      const name=(await button.innerText()).trim().replace(/\s+/g,' ');
      await button.click();
      await settled(page);
      await scan(page,defects,`participant view=${name}`);
    }
    const more=page.locator('.participant-more > button');
    if(await more.count()){
      await more.click();
      const menu=page.locator('.participant-more-menu [data-nav]');
      const destinations=await menu.evaluateAll(buttons=>buttons.map(button=>button.dataset.nav));
      for(const destination of destinations){
        if(!await more.getAttribute('aria-expanded').then(value=>value==='true'))await more.click();
        await page.locator(`.participant-more-menu [data-nav="${destination}"]`).click();
        await settled(page);
        await scan(page,defects,`participant view=${destination}`);
      }
    }
    await page.context().close();

    const facilitator=await open(fixture.facilitatorToken);
    await facilitator.goto(fixture.base+'/');
    await facilitator.getByRole('heading',{name:'Squad Noord'}).waitFor();
    await facilitator.waitForFunction(()=>!document.querySelector('[data-status="loading"]'),null,{timeout:10000});
    await scan(facilitator,defects,'facilitator view=landing');
    await facilitator.locator('.simple-more > summary').click();
    await facilitator.getByRole('button',{name:'Session settings',exact:true}).click();
    await facilitator.locator('.simple-settings').waitFor();
    await scan(facilitator,defects,'facilitator view=settings');
    await facilitator.locator('.simple-settings').getByRole('button',{name:'Close',exact:true}).click();
    await facilitator.locator('.simple-nav').getByRole('button',{name:'Day pack',exact:true}).click();
    await facilitator.getByRole('navigation',{name:'Course pages'}).waitFor();
    await facilitator.waitForFunction(()=>!document.querySelector('[data-status="loading"]'),null,{timeout:10000});
    await scan(facilitator,defects,'facilitator view=daypack');
    await facilitator.context().close();
  }finally{
    await browser.close();
    await fixture.close();
  }
  assert.deepEqual(defects,[],`layout defects found:\n${defects.join('\n')}`);
});
