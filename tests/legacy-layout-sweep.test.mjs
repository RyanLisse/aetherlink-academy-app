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
  const browser=await chromium.launch();
  const defects=[];
  try{
    for(const day of [...WAVE_DAYS,...HARNESS_DAYS]){
      const fixture=WAVE_DAYS.includes(day)?wave:harness;
      fixture.setDay(day);
      const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
      await context.addInitScript(()=>localStorage.setItem('academy-locale','en'));
      const page=await context.newPage();
      try{
        await page.goto(`${fixture.base}/#access=${fixture.participantAccess}`);
        await page.getByTestId('classroom-shell').waitFor();
        await page.getByTestId('classroom-home').waitFor();
        await scan(page,defects,`day=${day} classroom-home`);

        const cards=page.getByTestId('classroom-course-card');
        const cardCount=await cards.count();
        assert.ok(cardCount>0,'expected course cards on Classroom home');
        await cards.first().click();
        await page.getByTestId('classroom-course').waitFor();
        await page.getByTestId('classroom-outline').waitFor();
        await scan(page,defects,`day=${day} course`);

        const lessons=page.getByTestId('classroom-outline-lesson');
        const lessonCount=await lessons.count();
        const limit=Math.min(lessonCount,4);
        for(let index=0;index<limit;index++){
          await lessons.nth(index).click();
          await page.getByTestId('classroom-lesson').waitFor();
          await page.waitForFunction(()=>!document.querySelector('[data-status="loading"]'),null,{timeout:10000}).catch(()=>{});
          await scan(page,defects,`day=${day} lesson=${index}`);
          // If workshop lesson exposes stepper pages, sample them
          const stepper=page.getByTestId('lesson-stepper');
          if(await stepper.count()){
            const steps=stepper.getByRole('button');
            const stepCount=Math.min(await steps.count(),3);
            for(let s=0;s<stepCount;s++){
              await steps.nth(s).click();
              await page.getByTestId('lesson-page').waitFor({timeout:5000}).catch(()=>{});
              await scan(page,defects,`day=${day} lesson=${index} step=${s}`);
            }
          }
        }
      }finally{
        await context.close();
      }
    }
  }finally{
    await browser.close();
    await wave.close();
    await harness.close();
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
  try{
    const page=await open(null);
    await page.goto(`${fixture.base}/#access=${fixture.participantAccess}`);
    await page.getByTestId('classroom-shell').waitFor();
    await page.getByTestId('classroom-home').waitFor();
    await scan(page,defects,'participant view=classroom-home');
    await page.getByTestId('classroom-course-card').first().click();
    await page.getByTestId('classroom-course').waitFor();
    await scan(page,defects,'participant view=course');
    await page.getByTestId('classroom-outline-lesson').first().click();
    await page.getByTestId('classroom-lesson').waitFor();
    await scan(page,defects,'participant view=lesson');
    await page.getByTestId('classroom-nav-home').click();
    await page.getByTestId('classroom-home').waitFor();
    await page.context().close();

    const facilitator=await open(fixture.facilitatorToken);
    await facilitator.goto(fixture.base+'/');
    await facilitator.getByTestId('classroom-shell').waitFor();
    await facilitator.getByTestId('classroom-home').waitFor();
    await scan(facilitator,defects,'facilitator view=classroom-home');
    assert.ok(await facilitator.getByTestId('nav-admin').isVisible(),'admin reachable');
    await facilitator.getByTestId('nav-admin').click();
    await facilitator.getByTestId('facilitator-admin').waitFor();
    await scan(facilitator,defects,'facilitator view=admin');
    await facilitator.goto(fixture.base+'/');
    await facilitator.getByTestId('classroom-home').waitFor();
    await scan(facilitator,defects,'facilitator view=workspace-return');
    await facilitator.context().close();
  }finally{
    await browser.close();
    await fixture.close();
  }
  assert.deepEqual(defects,[],`layout defects found:\n${defects.join('\n')}`);
});
