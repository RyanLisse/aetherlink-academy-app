import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {chromium} from '@playwright/test';
import {AxeBuilder} from '@axe-core/playwright';
import {startLegacyFixture,root,HOST_KEY,ROOM_CODE} from './support/legacy-fixture.mjs';

const screenshotDir=process.env.ACADEMY_SCREENSHOT_DIR;
const PROOF_STUB='<!doctype html><html lang="nl"><head><title>Proof</title></head><body><main><p>Synthetisch Proof-document</p></main></body></html>';

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

async function withBrowser(run){
  assert.ok(existsSync(path.join(root,'dist/index.html')),'dist/index.html missing: run pnpm run build first');
  const fixture=await startLegacyFixture();
  const browser=await chromium.launch();
  const open=async({width,height,token=null})=>{
    const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
    await context.addInitScript(value=>{localStorage.setItem('academy-locale','nl');if(value)sessionStorage.setItem('academy-token',value);},token);
    await context.route('**/d/**',route=>route.fulfill({contentType:'text/html',body:PROOF_STUB}));
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

test('participant views: loading, empty, error and offline states are visible and pass axe',async()=>{
  await withBrowser(async({fixture,open})=>{
    for(const [width,height] of [[1440,900],[390,844]]){
      const page=await open({width,height});
      await page.goto(`${fixture.base}/#access=${fixture.participantAccess}`);
      await page.getByRole('heading',{name:'Squad Noord'}).waitFor();
      assert.deepEqual(await blockingViolations(page),[],`room ${width}px`);
      assert.equal(await overflow(page),0,`room has no horizontal scroll at ${width}px`);
      await shot(page,`room-${width}.png`);
      await page.close();
    }

    const page=await open({width:1440,height:900});
    await page.goto(`${fixture.base}/#access=${fixture.participantAccess}`);
    await page.getByRole('heading',{name:'Squad Noord'}).waitFor();
    const nav=name=>page.getByRole('navigation',{name:'Hoofdnavigatie'}).getByRole('button',{name,exact:true});
    for(const [label,ready] of [['Mijn route','Vijf dagen. Echte voortgang.'],['Les',null],['Solo-missie',null],['Naslag','Alles wat al vrijgegeven is, om na te lezen'],['Review & overdracht','Alles klaar voor overdracht?']]){
      await nav(label).click();
      await page.waitForFunction(()=>!document.querySelector('.primary [data-status="loading"]'),null,{timeout:10000});
      assert.equal(await page.locator('.primary').innerText().then(text=>text.trim().length>0),true,`${label} is never blank`);
      assert.deepEqual(await blockingViolations(page),[],label);
      if(ready)assert.ok(await page.locator('.primary').getByText(ready).first().isVisible(),`${label} shows ${ready}`);
    }

    await nav('Les').click();
    await page.getByTestId('course-pages').waitFor();
    const courseNav=page.getByRole('navigation',{name:"Cursuspagina's"});
    assert.ok(await courseNav.isVisible(),'participants can reach the course pages from Lesson');
    assert.equal(await page.getByTestId('lesson-panel').getByTestId('classroom-exercises').count(),0,'assignments are not embedded in Lesson');
    await courseNav.getByRole('button',{name:'Quiz',exact:true}).click();
    assert.ok(await page.getByTestId('quiz-page').isVisible(),'quiz has its own course page');
    const answer=page.locator('[data-testid="quiz-page"] input[type="radio"]').first();
    await answer.check();
    await courseNav.getByRole('button',{name:'Opdrachten',exact:true}).click();
    assert.ok(await page.getByTestId('assignments-page').getByTestId('classroom-exercises').isVisible(),'assignments have their own course page');
    assert.equal(await page.locator('[data-testid="quiz-page"] form').isVisible(),false,'quiz is hidden while Assignments is open');
    assert.deepEqual(await blockingViolations(page),[],'assignment page passes axe');
    await courseNav.getByRole('button',{name:'Quiz',exact:true}).click();
    assert.equal(await answer.isChecked(),true,'switching pages preserves the in-progress quiz answers');
    assert.deepEqual(await blockingViolations(page),[],'quiz page passes axe');

    assert.equal(await nav('Debriefbord').count(),0,'participants only see the board once it exists');

    await page.route('**/game/day-route',route=>route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({error:'Synthetische serverfout.'})}));
    await nav('Mijn route').click();
    const failure=page.locator('.primary [data-status="error"]');
    await failure.waitFor();
    assert.equal(await failure.getAttribute('role'),'alert');
    assert.match(await failure.innerText(),/Dit kon niet worden geladen\s+Synthetische serverfout\./);
    await page.unroute('**/game/day-route');
    await failure.getByRole('button',{name:'Opnieuw proberen'}).click();
    await failure.waitFor({state:'detached'});
    await shot(page,'route-recovered-1440.png');

    await page.route('**/game/state',route=>route.abort('internetdisconnected'));
    const offline=page.locator('[data-status="offline"]');
    await offline.waitFor({timeout:10000});
    assert.equal(await offline.getAttribute('role'),'status');
    assert.match(await offline.innerText(),/Geen verbinding met de room/);
    assert.equal(await page.locator('main > .error').count(),0,'a dropped poll is not shown as a raw error');
    assert.deepEqual(await blockingViolations(page),[],'offline');
    await shot(page,'room-offline-1440.png');
    await page.unroute('**/game/state');
    await offline.waitFor({state:'detached',timeout:10000});
  });
});

test('facilitator workshop landing keeps settings tucked away and exposes usable day controls',async()=>{
  await withBrowser(async({fixture,open})=>{
    const page=await open({width:1024,height:768,token:fixture.facilitatorToken});
    await page.goto(fixture.base+'/');
    await page.getByRole('heading',{name:'Squad Noord'}).waitFor();
    assert.match(await page.locator('.simple-eyebrow').innerText(),/^Facilitatorwerkplek · Dag 1$/,'workshop landing is the default facilitator view');
    assert.ok(await page.getByRole('button',{name:'Slides presenteren'}).isVisible(),'presentation action is available on the landing');
    assert.ok(await page.getByRole('heading',{name:'Jouw workshop'}).isVisible(),'workshop agenda is visible');
    assert.equal(await page.getByRole('region',{name:'Facilitatorbediening'}).count(),0,'session controls start hidden');
    assert.equal(await page.locator('.simple-settings').count(),0,'settings panel is not rendered before it is requested');
    assert.equal(await overflow(page),0,'workshop landing has no horizontal scroll');
    assert.deepEqual(await blockingViolations(page),[],'facilitator workshop landing');
    await shot(page,'facilitator-room-1024.png');

    await page.locator('.simple-more > summary').click();
    await page.getByRole('button',{name:'Sessie-instellingen'}).click();
    const settings=page.locator('.simple-settings');
    await settings.getByRole('heading',{name:'Sessie-instellingen'}).waitFor();
    const bar=settings.getByRole('region',{name:'Facilitatorbediening'});
    await bar.waitFor();
    assert.ok(await bar.locator('.facilitator-teach').isVisible(),'teach controls remain available in settings');
    assert.ok(await bar.locator('.facilitator-dials').isVisible(),'session controls remain available in settings');
    for(const name of ['Start timer','Volgende ronde','Rollen schudden','Open Classroom','Debriefbord openen'])assert.ok(await bar.getByRole('button',{name}).isVisible(),name);
    const day=bar.getByRole('combobox',{name:'Dag',exact:true});
    assert.equal(await day.inputValue(),'1','day selector starts on the active room day');
    assert.equal(await bar.locator('.fac-day-label').innerText(),'Dag 1','current day is announced beside its selector');
    await day.selectOption('2');
    await page.waitForFunction(()=>document.querySelector('.simple-eyebrow')?.textContent.includes('Dag 2'));
    assert.equal(await day.inputValue(),'2','selecting a day updates the room control');
    assert.equal(await bar.locator('.fac-day-label').innerText(),'Dag 2','updated day is announced to assistive technology');
    await bar.getByRole('spinbutton',{name:'Tijd (min)',exact:true}).focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(()=>document.activeElement.textContent.trim()),'+5 min','time adjust follows its input in tab order');
    assert.equal(await overflow(page),0,'revealed settings have no horizontal scroll');
    assert.deepEqual(await blockingViolations(page),[],'facilitator session settings');
    await settings.getByRole('button',{name:'Sluiten'}).click();
    assert.equal(await page.getByRole('region',{name:'Facilitatorbediening'}).count(),0,'closing settings hides the session controls again');
    await page.getByRole('button',{name:/Reflecteer samen/}).click();
    await page.getByRole('heading',{name:'Squad Noord · dag 2'}).waitFor();
    assert.ok(await page.getByText('Voortgang van de huidige dag.',{exact:false}).isVisible(),'workshop agenda opens the facilitator debrief for the selected day');
    await page.locator('.simple-more > summary').click();
    await page.locator('.simple-menu').getByRole('button',{name:'Les',exact:true}).click();
    await page.getByRole('navigation',{name:"Cursuspagina's"}).waitFor();
    assert.ok(await page.getByRole('navigation',{name:"Cursuspagina's"}).isVisible(),'facilitators see the same Lesson, Assignments, and Quiz navigation');
  });
});

test('facilitator overview and read-only cohort room pass axe and show their states',async()=>{
  await withBrowser(async({fixture,open})=>{
    const page=await open({width:1024,height:768});
    await page.goto(fixture.base+'/');
    await page.getByRole('button',{name:'Facilitator-overzicht'}).click();
    await page.getByLabel('Facilitator-startsleutel').fill(HOST_KEY);
    await page.getByRole('button',{name:'Toon overzicht'}).click();
    await page.getByRole('heading',{name:'Wave oktober (synthetisch)'}).waitFor();
    assert.ok(await page.getByText(ROOM_CODE,{exact:true}).first().isVisible());
    assert.deepEqual(await blockingViolations(page),[],'facilitator overview');
    await shot(page,'facilitator-overview-1024.png');
    await page.close();

    fixture.enterReadOnlyWindow();
    const reader=await open({width:390,height:844});
    await reader.goto(fixture.base+'/?cohort=1');
    await reader.getByLabel('Persoonlijke cohortcode').fill(fixture.cohortCodes[0]);
    await reader.getByRole('button',{name:'Inloggen met cohortcode'}).click();
    const banner=reader.locator('[data-status="readonly"]');
    await banner.waitFor();
    assert.match(await banner.innerText(),/Alleen-lezen\s+De schrijfperiode van je cohort is voorbij/);
    assert.ok(await banner.getByRole('button',{name:'Exporteer het document'}).isVisible());
    assert.deepEqual(await blockingViolations(reader),[],'read-only room 390');
    assert.equal(await overflow(reader),0);
    await shot(reader,'readonly-390.png');
  });
});
