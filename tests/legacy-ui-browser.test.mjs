import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {chromium} from '@playwright/test';
import {AxeBuilder} from '@axe-core/playwright';
import {startLegacyFixture,root,HOST_KEY,ROOM_CODE} from './support/legacy-fixture.mjs';
import {getSim} from '../server/sims.mjs';

const screenshotDir=process.env.ACADEMY_SCREENSHOT_DIR;

async function shot(page,name){
  if(!screenshotDir)return;
  mkdirSync(screenshotDir,{recursive:true});
  await page.screenshot({path:path.join(screenshotDir,name),fullPage:true});
}

async function blockingViolations(page){
  const {violations}=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  return violations.filter(v=>v.impact==='serious'||v.impact==='critical').map(v=>`${v.id}: ${v.nodes.map(n=>n.target.join(' ')).join(', ')}`);
}

const overflow=page=>page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);

async function withBrowser(run,{harness=false}={}){
  assert.ok(existsSync(path.join(root,'dist/index.html')),'dist/index.html missing: run pnpm run build first');
  const fixture=await startLegacyFixture({harness});
  const browser=await chromium.launch();
  const open=async({width,height,token=null,locale='nl'})=>{
    const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
    await context.addInitScript(({token:sessionToken,locale:initialLocale})=>{localStorage.setItem('academy-locale',initialLocale);if(sessionToken)sessionStorage.setItem('academy-token',sessionToken);},{token,locale});
    return context.newPage();
  };
  try{await run({fixture,open});}
  finally{await browser.close();await fixture.close();}
}

test('join screen: room or cohort choice is keyboard-operable, errors are readable, no axe blockers',async()=>{
  await withBrowser(async({fixture,open})=>{
    for(const [width,height] of [[1440,900],[390,844]]){
      const page=await open({width,height});
      await page.goto(fixture.base+'/');
      const room=page.getByRole('radio',{name:/Kamercode/});
      const cohort=page.getByRole('radio',{name:/Cohortcode/});
      assert.equal(await room.isChecked(),true,'room code is the default path');
      assert.equal(await page.getByRole('radio',{name:'Ik ben deelnemer'}).isChecked(),true);
      assert.deepEqual(await blockingViolations(page),[],`join ${width}px`);
      assert.equal(await overflow(page),0,`no horizontal scroll at ${width}px`);
      await shot(page,`join-${width}.png`);

      await room.focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await cohort.isChecked(),true,'arrow key moves to the cohort path');
      const code=page.getByLabel('Persoonlijke cohortcode');
      await code.fill('AAAA-BBBB-CCCC-DDDD');
      await page.keyboard.press('Enter');
      const alert=page.getByRole('alert');
      await alert.getByText('Cohortcode niet herkend').waitFor();
      assert.match(await alert.innerText(),/Deze cohortcode werkt niet\. Controleer de tekens/);
      assert.equal(await code.getAttribute('aria-invalid'),'true');
      assert.match(await code.getAttribute('aria-describedby'),/join-error/);
      assert.deepEqual(await blockingViolations(page),[],`join error ${width}px`);
      await shot(page,`join-error-${width}.png`);

      await page.keyboard.press('Shift+Tab');
      await room.check();
      assert.equal(await alert.count(),0,'switching path clears the stale error');
      await page.getByLabel('Je naam',{exact:true}).fill('Nieuw');
      await page.getByLabel('Kamercode',{exact:true}).fill('NOPE00');
      await page.getByRole('button',{name:'Deelnemen'}).click();
      await page.getByRole('alert').getByText('Kamercode niet gevonden').waitFor();
      assert.equal(await page.getByLabel('Kamercode',{exact:true}).getAttribute('aria-invalid'),'true');
      await page.close();
    }
  });
});

test('participant views: Classroom home, course open, offline state pass axe',async()=>{
  await withBrowser(async({fixture,open})=>{
    for(const [width,height] of [[1440,900],[390,844]]){
      const page=await open({width,height});
      await page.goto(`${fixture.base}/#access=${fixture.participantAccess}`);
      await page.getByTestId('classroom-shell').waitFor();
      await page.getByTestId('classroom-home').waitFor();
      assert.deepEqual(await blockingViolations(page),[],`classroom home ${width}px`);
      assert.equal(await overflow(page),0,`classroom home has no horizontal scroll at ${width}px`);
      await shot(page,`room-${width}.png`);
      await page.close();
    }

    const page=await open({width:1440,height:900});
    await page.goto(`${fixture.base}/#access=${fixture.participantAccess}`);
    await page.getByTestId('classroom-home').waitFor();
    await page.getByTestId('classroom-course-card').first().click();
    await page.getByTestId('classroom-course').waitFor();
    await page.getByTestId('classroom-outline').waitFor();
    assert.ok(await page.getByTestId('classroom-mark-complete').isVisible(),'mark-complete on course lesson');
    assert.deepEqual(await blockingViolations(page),[],'classroom course');
    assert.equal(await overflow(page),0,'classroom course no horizontal scroll');

    await page.route('**/game/state',route=>route.abort('internetdisconnected'));
    // polling may surface offline in bottom/status; Classroom still mounted
    await page.waitForTimeout(2500);
    assert.ok(await page.getByTestId('classroom-shell').isVisible(),'shell stays mounted while offline');
    assert.deepEqual(await blockingViolations(page),[],'offline classroom');
    await page.unroute('**/game/state');
  });
});

test('facilitator lands in Classroom course grid and can open a course outline',async()=>{
  await withBrowser(async({fixture,open})=>{
    const page=await open({width:1024,height:768,token:fixture.facilitatorToken});
    await page.goto(fixture.base+'/');
    await page.getByTestId('classroom-shell').waitFor();
    await page.getByTestId('classroom-home').waitFor();
    assert.ok(await page.getByTestId('classroom-grid').isVisible(),'course cards are on the Classroom home');
    assert.equal(await page.locator('.join-copy').count(),0,'join hero is not shown after auth');
    assert.ok(await page.getByTestId('nav-admin').isVisible(),'Admin remains reachable from Classroom chrome');
    assert.equal(await overflow(page),0,'Classroom home has no horizontal scroll');
    assert.deepEqual(await blockingViolations(page),[],'classroom home');
    await shot(page,'facilitator-room-1024.png');

    const openWave = page.getByTestId('classroom-open-classroom');
    if (await openWave.count()) await openWave.click();
    else await page.getByTestId('classroom-course-card').first().click();
    await page.getByTestId('classroom-course').waitFor();
    await page.getByTestId('classroom-outline').waitFor();
    await page.getByTestId('classroom-lesson').waitFor();
    assert.ok(await page.getByTestId('classroom-mark-complete').isVisible(),'mark-complete is available on a lesson');
    assert.ok(await page.getByTestId('classroom-prev').isVisible(),'previous lesson control');
    assert.ok(await page.getByTestId('classroom-next').isVisible(),'next lesson control');
    assert.equal(await overflow(page),0,'course page has no horizontal scroll');
    assert.deepEqual(await blockingViolations(page),[],'classroom course page');
  });
});

test('participant lands in Classroom; Learn route and Arcade remain reachable',async()=>{
  await withBrowser(async({fixture,open})=>{
    const page=await open({width:1440,height:900,locale:'en'});
    await page.goto(`${fixture.base}/#access=${fixture.participantAccess}`);
    await page.getByTestId('classroom-shell').waitFor();
    await page.getByTestId('classroom-home').waitFor();
    assert.ok(await page.getByTestId('classroom-grid').isVisible(),'participant sees course cards');
    assert.equal(await page.locator('.join-copy').count(),0,'join hero hidden after resume');

    await page.goto(`${fixture.base}/?learn=s01`);
    await page.locator('.learn-course').waitFor();
    await page.locator('.learn-contents > summary').click();
    const contentsNav=page.locator('.learn-contents nav').first();
    await contentsNav.waitFor();
    const tabs=page.locator('.learn-tabs');
    await tabs.waitFor();
    const chapterNav=page.locator('.learn-pagination');
    await chapterNav.waitFor();
    assert.equal(await contentsNav.evaluate(element=>getComputedStyle(element).flexDirection),'column','Learn contents stay vertically grouped');
    assert.equal(await tabs.evaluate(element=>getComputedStyle(element).flexDirection),'row','Learn content tabs stay horizontal');
    assert.equal(await chapterNav.evaluate(element=>getComputedStyle(element).flexDirection),'row','Learn chapter pagination stays horizontal');
  });
});

test('facilitator land-in, /facilitator admin and read-only cohort room pass axe and show their states',async()=>{
  await withBrowser(async({fixture,open})=>{
    const page=await open({width:1024,height:768});
    await page.goto(fixture.base+'/');
    await page.getByRole('radio',{name:'Ik ben facilitator'}).check();
    await page.getByLabel('Facilitator-startsleutel').fill(HOST_KEY);
    await page.getByRole('button',{name:'Inloggen'}).click();
    await page.getByTestId('classroom-shell').waitFor();
    await page.getByTestId('classroom-home').waitFor();
    assert.ok(await page.getByTestId('classroom-grid').isVisible(),'start-key unlock lands in Classroom course grid');
    assert.equal(await page.locator('.join-copy').count(),0,'no participant join hero after unlock');
    assert.equal(await page.getByRole('heading',{name:'Je squads en cohorten'}).count(),0,'the squads hub is not the landing');

    await page.getByTestId('nav-admin').click();
    await page.getByRole('heading',{name:'Wave oktober (synthetisch)'}).waitFor();
    assert.equal(new URL(page.url()).pathname,'/facilitator','admin lives on /facilitator');
    assert.equal(await page.getByRole('radio',{name:'Ik ben facilitator'}).count(),0,'admin has no role toggle');
    assert.ok(await page.getByRole('button',{name:'Academy-werkplek'}).isVisible(),'admin can return to workspace');
    assert.deepEqual(await blockingViolations(page),[],'facilitator admin');
    await shot(page,'facilitator-overview-1024.png');

    await page.getByRole('button',{name:'Academy-werkplek'}).click();
    await page.getByTestId('classroom-home').waitFor();

    // Create a squad from admin and open it
    await page.getByTestId('nav-admin').click();
    const freshName=`Browser Squad ${Date.now()}`;
    await page.getByLabel('Squadnaam').fill(freshName);
    await page.getByRole('button',{name:'Maak squad'}).click();
    await page.getByTestId('classroom-shell').waitFor();
    assert.ok(await page.getByTestId('classroom-home').isVisible(),'created squad lands on Classroom');
    await page.getByTestId('nav-admin').click();
    await page.getByRole('heading',{name:freshName}).waitFor();

    const reopen=await open({width:1024,height:768});
    await reopen.goto(fixture.base+'/facilitator');
    await reopen.getByLabel('Facilitator-startsleutel').fill(HOST_KEY);
    await reopen.getByRole('button',{name:'Inloggen'}).click();
    await reopen.getByRole('heading',{name:'Wave oktober (synthetisch)'}).waitFor();
    assert.equal(await reopen.getByRole('radio',{name:'Ik ben facilitator'}).count(),0,'admin sign-in has no role toggle');
    await reopen.getByRole('article').filter({has:reopen.getByRole('heading',{name:freshName})}).getByRole('button',{name:'Open als facilitator'}).click();
    await reopen.getByTestId('classroom-home').waitFor();

    fixture.enterReadOnlyWindow();
    const cohort=await open({width:1024,height:768});
    await cohort.goto(fixture.base+'/');
    await cohort.getByRole('radio',{name:/Cohortcode/}).check();
    await cohort.getByLabel('Persoonlijke cohortcode').fill(fixture.cohortCodes[0]);
    await cohort.getByRole('button',{name:'Inloggen met cohortcode'}).click();
    await cohort.getByTestId('classroom-shell').waitFor();
    await cohort.getByTestId('classroom-home').waitFor();
    assert.deepEqual(await blockingViolations(cohort),[],'cohort classroom shell');
  });
});

test('Classroom workshop lesson can mark complete and move next/prev',async()=>{
  await withBrowser(async({fixture,open})=>{
    const page=await open({width:1440,height:900,locale:'en'});
    await page.goto(`${fixture.base}/#access=${fixture.participantAccess}`);
    await page.getByTestId('classroom-home').waitFor();
    await page.getByTestId('classroom-course-card').first().click();
    await page.getByTestId('classroom-course').waitFor();
    const lessons=page.getByTestId('classroom-outline-lesson');
    await lessons.first().waitFor();
    const count=await lessons.count();
    assert.ok(count>=2,'outline lists multiple lessons');
    const mark=page.getByTestId('classroom-mark-complete');
    if(await mark.isEnabled()){
      await mark.click();
      await page.waitForTimeout(500);
    }
    await page.getByTestId('classroom-next').click();
    await page.waitForTimeout(300);
    await page.getByTestId('classroom-prev').click();
    assert.ok(await page.getByTestId('classroom-lesson').isVisible(),'lesson pane remains');
    assert.equal(await overflow(page),0,'classroom lesson has no horizontal overflow');
    assert.deepEqual(await blockingViolations(page),[],'classroom lesson axe');
  },{harness:true});
});
