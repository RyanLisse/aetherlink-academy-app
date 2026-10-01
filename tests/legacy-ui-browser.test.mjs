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

test('participant views: loading, empty, error and offline states are visible and pass axe',async()=>{
  await withBrowser(async({fixture,open})=>{
    for(const [width,height] of [[1440,900],[390,844]]){
      const page=await open({width,height});
      await page.goto(`${fixture.base}/#access=${fixture.participantAccess}`);
      await page.getByRole('heading',{name:'Squad Noord'}).waitFor();
      await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
      assert.deepEqual(await blockingViolations(page),[],`room ${width}px`);
      assert.equal(await overflow(page),0,`room has no horizontal scroll at ${width}px`);
      await shot(page,`room-${width}.png`);
      await page.close();
    }

    const page=await open({width:1440,height:900});
    await page.goto(`${fixture.base}/#access=${fixture.participantAccess}`);
    await page.getByRole('heading',{name:'Squad Noord'}).waitFor();
    const navigation=page.getByRole('navigation',{name:'Hoofdnavigatie'});
    const nav=name=>navigation.getByRole('button',{name,exact:true});
    const selectNav=async name=>{if(name!=='Vandaag'&&name!=='Les'&&name!=='Squad-room'&&!await nav(name).isVisible())await nav('Meer').click();await nav(name).click();};
    assert.equal(await page.locator('.right-rail').count(),0,'participant support rail is closed by default');
    for(const [label,ready] of [['Vandaag','Je plan voor vandaag'],['Cursus','Kies een activiteit en ga verder waar je was gebleven.'],['Les',null],['Solo-missie',null],['Naslag','Alles wat al vrijgegeven is, om na te lezen'],['Review & overdracht','Alles klaar voor overdracht?']]){
      await selectNav(label);
      await page.waitForFunction(()=>!document.querySelector('.primary [data-status="loading"]'),null,{timeout:10000});
      assert.equal(await page.locator('.primary').innerText().then(text=>text.trim().length>0),true,`${label} is never blank`);
      assert.deepEqual(await blockingViolations(page),[],label);
      if(ready)assert.ok(await page.locator('.primary').getByText(ready).first().isVisible(),`${label} shows ${ready}`);
    }

    await selectNav('Cursus');
    await page.getByTestId('course-overview').waitFor();
    assert.equal(await page.locator('.course-chapter.current .course-chapter-toggle').getAttribute('aria-expanded'),'true','the current chapter opens by default');
    assert.ok(await page.locator('.course-activity-row').count()>=3,'the chapter lists lesson, assignment and quiz activities');
    assert.ok(await page.locator('.course-progress-sidebar progress').count(), 'course progress is visible');
    assert.equal(await page.locator('.course-overview-heading>.cyan').innerText(),'Cursus','Course uses the localized eyebrow');
    await page.setViewportSize({width:390,height:844});
    assert.equal(await overflow(page),0,'Course has no horizontal page overflow at 390px');
    assert.deepEqual(await blockingViolations(page),[],'Course view passes axe at 390px');
    await page.setViewportSize({width:1440,height:900});

    await selectNav('Les');
    await page.getByTestId('course-pages').waitFor();
    const courseNav=page.getByRole('navigation',{name:"Cursuspagina's"});
    assert.equal(await courseNav.count(),0,'ActivityFrame replaces the legacy Lesson page tabs');
    const activityFrame=page.getByTestId('activity-frame');
    await activityFrame.waitFor();
    const frameLayout=await page.evaluate(()=>{
      const breadcrumb=document.querySelector('.activity-breadcrumb');
      const pager=document.querySelector('.activity-frame-bottom');
      const rect=element=>{
        const {left,right,width}=element.getBoundingClientRect();
        return {left,right,width};
      };
      return {
        breadcrumbDirection:getComputedStyle(breadcrumb).flexDirection,
        breadcrumbAlignment:getComputedStyle(breadcrumb).justifyContent,
        pagerDirection:getComputedStyle(pager).flexDirection,
        previous:rect(pager.querySelector(':scope > button')),
        position:rect(pager.querySelector(':scope > span')),
        actions:rect(pager.querySelector('.activity-frame-actions')),
        pager:rect(pager)
      };
    });
    assert.equal(frameLayout.breadcrumbDirection,'row','activity breadcrumb stays on one horizontal line');
    assert.equal(frameLayout.breadcrumbAlignment,'flex-start','activity breadcrumb stays left-aligned');
    assert.equal(frameLayout.pagerDirection,'row','activity pager stays on one horizontal line');
    assert.ok(frameLayout.previous.right<frameLayout.position.left+frameLayout.position.width/2,'Previous is left of the centered position');
    assert.ok(frameLayout.position.left+frameLayout.position.width/2<frameLayout.actions.left,'the position is centered before the right-side actions');
    assert.ok(frameLayout.actions.right<=frameLayout.pager.right,'activity actions stay inside the pager');
    const activityProgress=page.getByRole('navigation',{name:'Voortgang van activiteiten'});
    assert.ok(await activityProgress.isVisible(),'Lesson is framed by activity progress');
    const activityPagination=page.getByRole('navigation',{name:'Activiteitsnavigatie'});
    const lessonStepper=page.getByTestId('lesson-stepper');
    await lessonStepper.locator('.lesson-step-label').first().waitFor();
    const lessonLabels=(await lessonStepper.locator('.lesson-step-label').allTextContents()).map(label=>label.trim());
    const nextLessonPage=lessonLabels.length>1?`Volgende: ${lessonLabels[1]}`:'Volgende: Opdrachten';
    assert.ok(await activityPagination.getByText('1 van 4').isVisible(),'the frame shows position and total activities');
    assert.ok(await activityPagination.getByRole('button',{name:'Vorige: Cursus',exact:true}).isDisabled(),'the first activity names its previous target');
    await page.setViewportSize({width:390,height:844});
    assert.equal(await overflow(page),0,'ActivityFrame has no horizontal page overflow at 390px');
    assert.ok(await activityPagination.getByRole('button',{name:nextLessonPage,exact:true}).isVisible(),'the mobile pager keeps its next destination visible');
    await page.setViewportSize({width:1440,height:900});
    if(lessonLabels.length>1){
      for(const [index,label] of lessonLabels.slice(1).entries()){
        await activityPagination.getByRole('button',{name:`Volgende: ${label}`,exact:true}).click();
        assert.equal(await lessonStepper.getByRole('button',{name:label,exact:true}).getAttribute('aria-current'),'step',`Next opens lesson page ${label}`);
        if(index===0)await activityPagination.getByText(`Pagina 2 van ${lessonLabels.length}`).waitFor();
      }
    }
    await activityPagination.getByRole('button',{name:'Volgende: Opdrachten',exact:true}).click();
    assert.equal(await page.getByRole('navigation',{name:'Voortgang van activiteiten'}).getByRole('button',{name:'Opdrachten',exact:true}).getAttribute('aria-current'),'page','Next opens the assignment activity');
    assert.ok(await activityPagination.getByRole('button',{name:'Vorige: Les',exact:true}).isVisible(),'the assignment pager names Lesson as its previous target');
    assert.ok(await activityPagination.getByRole('button',{name:'Volgende: Quiz',exact:true}).isVisible(),'the assignment pager names Quiz as its next target');
    await activityPagination.getByRole('button',{name:'Vorige: Les',exact:true}).click();
    await page.getByTestId('lesson-panel').waitFor();
    assert.equal(await page.getByTestId('lesson-panel').getByTestId('classroom-exercises').count(),0,'assignments are not embedded in Lesson');
    await activityProgress.getByRole('button',{name:'Opdrachten',exact:true}).click();
    await page.locator('.assignment-page').waitFor();
    assert.ok(await page.getByTestId('step-card').count()>0,'the assignment activity opens practical task boxes');
    await page.getByRole('navigation',{name:'Voortgang van activiteiten'}).getByRole('button',{name:'Quiz',exact:true}).click();
    await page.getByTestId('quiz-page').waitFor();
    assert.ok(await activityPagination.getByRole('button',{name:'Volgende: Review & overdracht',exact:true}).isVisible(),'the quiz pager names Review as its next target');
    assert.ok(await page.getByTestId('quiz-page').isVisible(),'quiz has its own course activity');
    const answer=page.locator('[data-testid="quiz-page"] input[type="radio"]').first();
    await answer.check();
    assert.deepEqual(await blockingViolations(page),[],'quiz page passes axe');
    const squadHelp=page.getByRole('button',{name:'Squad en hulp',exact:true});
    await squadHelp.click();
    assert.equal(await page.locator('.right-rail .roster').count(),1,'participants can open the squad roster and access actions');
    assert.equal(await answer.isChecked(),true,'opening squad support keeps the active quiz mounted');
    await squadHelp.click();
    assert.equal(await page.locator('.right-rail').count(),0,'participants can close squad support');
    assert.equal(await answer.isChecked(),true,'closing squad support keeps the active quiz mounted');
    await activityProgress.getByRole('button',{name:'Review & overdracht',exact:true}).click();
    const backToCourse=activityPagination.getByRole('button',{name:'Terug naar de cursus',exact:true});
    await backToCourse.waitFor();

    assert.equal(await nav('Debriefbord').count(),0,'participants only see the board once it exists');

    await page.route('**/game/day-route?*',route=>route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({error:'Synthetische serverfout.'})}));
    await selectNav('Cursus');
    const failure=page.locator('.primary [data-status="error"]');
    await failure.waitFor();
    assert.equal(await failure.getAttribute('role'),'alert');
    assert.match(await failure.innerText(),/Dit kon niet worden geladen\s+Synthetische serverfout\./);
    await page.unroute('**/game/day-route?*');
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
    for(const name of ['Start timer','Volgende ronde','Open Classroom','Debriefbord openen'])assert.ok(await bar.getByRole('button',{name}).isVisible(),name);
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
    await page.locator('.simple-nav').getByRole('button',{name:'Dagpakket',exact:true}).click();
    const courseNavigation=page.getByRole('navigation',{name:"Cursuspagina's"});
    await courseNavigation.waitFor({state:'visible'});
    assert.ok(await courseNavigation.isVisible(),'facilitators see the same Lesson, Assignments, and Quiz navigation');
    assert.equal(await page.locator('.simple-nav').evaluate(element=>getComputedStyle(element).flexDirection),'row','facilitator navigation remains a horizontal row');
    assert.equal(await courseNavigation.evaluate(element=>getComputedStyle(element).flexDirection),'row','unframed course-page navigation remains horizontal');
    assert.equal(await page.locator('.lesson-stepper-scroll').evaluate(element=>getComputedStyle(element).flexDirection),'row','unframed lesson stepper remains horizontal');
  });
});

test('participant, reference, Learn, and deck navigation retain their intended layouts',async()=>{
  await withBrowser(async({fixture,open})=>{
    const page=await open({width:1440,height:900,locale:'en'});
    await page.goto(`${fixture.base}/#access=${fixture.participantAccess}`);
    await page.getByRole('heading',{name:'Squad Noord'}).waitFor();
    const todayNav=page.locator('.participant-sidebar .sidebar-nav');
    assert.equal(await todayNav.evaluate(element=>getComputedStyle(element).flexDirection),'row','participant Today navigation stays horizontal');

    await page.locator('.participant-more > button').click();
    await page.locator('.participant-more-menu [data-nav="naslag"]').click();
    const referenceDays=page.locator('.naslag-days');
    await referenceDays.waitFor();
    assert.equal(await referenceDays.evaluate(element=>getComputedStyle(element).display),'grid','the Naslag day selector stays a responsive grid');

    await page.locator('.participant-more > button').click();
    await page.locator('.participant-more-menu [data-nav="decks"]').click();
    const deckTrail=page.locator('.deck-trail');
    await deckTrail.waitFor();
    assert.equal(await deckTrail.evaluate(element=>getComputedStyle(element).flexDirection),'row','deck breadcrumbs stay horizontal');
    assert.equal(await deckTrail.locator('ol').evaluate(element=>getComputedStyle(element).flexDirection),'row','deck breadcrumb items stay inline');

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

test('facilitator overview and read-only cohort room pass axe and show their states',async()=>{
  await withBrowser(async({fixture,open})=>{
    const page=await open({width:1024,height:768});
    await page.goto(fixture.base+'/');
    await page.getByRole('radio',{name:'Ik ben facilitator'}).check();
    await page.getByLabel('Facilitator-startsleutel').fill(HOST_KEY);
    await page.getByRole('button',{name:'Inloggen'}).click();
    await page.getByRole('heading',{name:'Wave oktober (synthetisch)'}).waitFor();
    assert.ok(await page.getByRole('heading',{name:'Je squads en cohorten'}).isVisible(),'the workspace heading follows the session');
    assert.ok(await page.getByText(ROOM_CODE,{exact:true}).first().isVisible());
    assert.ok(await page.getByRole('heading',{name:'Start een squad'}).isVisible(),'the workspace opens squad creation');
    assert.ok(await page.getByRole('button',{name:'Maak squad'}).isVisible(),'the create submit is visible');
    assert.deepEqual(await blockingViolations(page),[],'facilitator workspace');
    await shot(page,'facilitator-overview-1024.png');

    await page.getByLabel('Squadnaam').fill('Squad Nieuw');
    await page.getByRole('button',{name:'Maak squad'}).click();
    await page.getByRole('heading',{name:'Squad Nieuw'}).waitFor();
    assert.match(await page.locator('.simple-eyebrow').innerText(),/Facilitatorwerkplek/,'created squad lands on the facilitator workspace');

    const reopen=await open({width:1024,height:768});
    await reopen.goto(fixture.base+'/');
    await reopen.getByRole('radio',{name:'Ik ben facilitator'}).check();
    await reopen.getByLabel('Facilitator-startsleutel').fill(HOST_KEY);
    await reopen.getByRole('button',{name:'Inloggen'}).click();
    await reopen.getByRole('heading',{name:'Wave oktober (synthetisch)'}).waitFor();
    await reopen.getByRole('article').filter({has:reopen.getByRole('heading',{name:'Squad Noord'})}).getByRole('button',{name:'Open als facilitator'}).click();
    await reopen.getByRole('heading',{name:'Squad Noord'}).waitFor();
    await reopen.close();
    await page.close();

    fixture.enterReadOnlyWindow();
    const reader=await open({width:390,height:844});
    await reader.goto(fixture.base+'/?cohort=1');
    await reader.getByLabel('Persoonlijke cohortcode').fill(fixture.cohortCodes[0]);
    await reader.getByRole('button',{name:'Inloggen met cohortcode'}).click();
    const banner=reader.locator('[data-status="readonly"]');
    await banner.waitFor();
    const participantNavigation=reader.getByRole('navigation',{name:'Hoofdnavigatie'});
    await participantNavigation.getByRole('button',{name:'Meer',exact:true}).click();
    assert.equal(await participantNavigation.getByRole('button',{name:'Naslag',exact:true}).getAttribute('aria-current'),'page','read-only cohort participants land on Reference');
    await participantNavigation.getByRole('button',{name:'Meer',exact:true}).click();
    assert.match(await banner.innerText(),/Alleen-lezen\s+De schrijfperiode van je cohort is voorbij/);
    assert.equal(await banner.getByRole('button',{name:'Exporteer het document'}).count(),0,'no embedded document export');
    assert.deepEqual(await blockingViolations(reader),[],'read-only room 390');
    assert.equal(await overflow(reader),0);
    await shot(reader,'readonly-390.png');
  });
});

test('s05 lesson pages, accessible diagram zoom, and page-aware activity navigation',async()=>{
  await withBrowser(async({fixture,open})=>{
    const page=await open({width:1440,height:900,locale:'en'});
    await page.goto(`${fixture.base}/#access=${fixture.participantAccess}`);
    await page.getByRole('heading',{name:'Squad Noord'}).waitFor();
    await page.locator('.participant-primary-nav [data-nav="lesson"]').click();
    await page.getByTestId('lesson-panel').waitFor();
    assert.equal(await page.getByTestId('course-pages').getAttribute('data-course-day'),'12','the fixture opens the s05 content day');

    const stepper=page.getByTestId('lesson-stepper');
    assert.ok(await stepper.isVisible(),'s05 Lesson exposes its numbered page stepper');
    await page.getByTestId('lesson-page').waitFor();
    const labels=stepper.locator('.lesson-step-label');
    assert.deepEqual((await labels.allTextContents()).map(label=>label.trim()),['Overview','The idea','Try it','Sources'],'empty Code page is omitted from s05');
    const activityPagination=page.getByRole('navigation',{name:'Activity navigation'});
    const breadcrumb=page.locator('.activity-breadcrumb');
    assert.equal(await breadcrumb.evaluate(element=>getComputedStyle(element).flexDirection),'row','ActivityFrame breadcrumb stays inline');
    assert.equal(await breadcrumb.evaluate(element=>getComputedStyle(element).justifyContent),'flex-start','ActivityFrame breadcrumb stays left aligned');
    assert.equal(await activityPagination.evaluate(element=>getComputedStyle(element).flexDirection),'row','ActivityFrame pager stays in a desktop row');
    await activityPagination.getByText('Page 1 of 4').waitFor();
    assert.equal(await stepper.getByRole('button',{name:'Overview'}).getAttribute('aria-current'),'step');
    assert.equal(await page.getByTestId('lesson-narrative').count(),0,'narrative is not visible on Overview');
    assert.equal((await page.getByTestId('path-assignments-crosslink').innerText()).replace(/\s+/g,' ').trim(),'This lesson has 3 tasks → Open assignment','the Overview keeps one compact assignment CTA instead of a checklist');
    assert.equal(await activityPagination.getByRole('button',{name:'Mark lesson complete',exact:true}).count(),0,'lesson completion is hidden before the final page');
    assert.ok(await activityPagination.getByRole('button',{name:'Previous: Course',exact:true}).isDisabled(),'Previous falls back to the activity sequence on the first lesson page');

    await activityPagination.getByRole('button',{name:'Next: The idea',exact:true}).click();
    await page.getByTestId('lesson-narrative').waitFor();
    await activityPagination.getByText('Page 2 of 4').waitFor();
    assert.ok(await activityPagination.getByRole('button',{name:'Previous: Overview',exact:true}).isVisible());
    assert.equal(await stepper.getByRole('button',{name:'The idea'}).getAttribute('aria-current'),'step');
    assert.equal(await stepper.getByRole('button',{name:'Overview'}).locator('.lesson-step-check').count(),1,'visited lesson pages show a check');
    assert.equal(await page.getByTestId('lesson-concept-card').count(),4,'s05 narrative is rendered as concept cards');
    assert.equal(await page.locator('.lesson-concept-icon').count(),4,'each concept card has an icon');
    assert.ok(await page.getByTestId('lesson-worked-example').isVisible(),'the worked example appears on The idea page');

    await page.setViewportSize({width:390,height:844});
    assert.equal(await overflow(page),0,'the lesson stepper and content do not overflow at 390px');
    await page.setViewportSize({width:1440,height:900});
    await stepper.getByRole('button',{name:'Overview'}).click();

    const zoom=page.getByRole('button',{name:'Zoom diagram: TodoWrite overview'});
    await zoom.click();
    const dialog=page.getByRole('dialog',{name:'Diagram preview'});
    await dialog.waitFor({state:'visible'});
    const zoomedImage=dialog.getByRole('img');
    assert.ok(await zoomedImage.isVisible()&&Boolean(await zoomedImage.getAttribute('alt')),'the zoomed diagram has accessible alternate text');
    assert.equal((await dialog.locator('figcaption').innerText()).trim(),'TodoWrite overview');
    await page.keyboard.press('Escape');
    await dialog.waitFor({state:'hidden'});
    assert.equal(await zoom.evaluate(element=>document.activeElement===element),true,'Escape restores focus to the diagram trigger');
    await zoom.click();
    await dialog.getByRole('button',{name:'Close diagram'}).click();
    await dialog.waitFor({state:'hidden'});
    assert.equal(await zoom.evaluate(element=>document.activeElement===element),true,'the close button restores focus to the diagram trigger');

    await stepper.getByRole('button',{name:'Try it'}).click();
    const sim=page.getByTestId('concept-sim');
    await sim.waitFor({state:'visible'});
    assert.equal((await page.getByTestId('lesson-watch-caption').innerText()).replace(/\s+/g,' ').trim(),`What to watch for ${getSim('s05','en').description}`);
    const simWidth=await sim.evaluate(element=>Math.round(element.getBoundingClientRect().width));
    const contentWidth=await page.getByTestId('lesson-page').evaluate(element=>Math.round(element.getBoundingClientRect().width));
    assert.ok(simWidth>=contentWidth-4,'ConceptSim fills the Try it page width');

    await stepper.getByRole('button',{name:'Sources'}).click();
    const markComplete=activityPagination.getByRole('button',{name:'Mark lesson complete',exact:true});
    await markComplete.waitFor();
    assert.equal(await markComplete.count(),1,'lesson completion appears on the last page');
    const assignments=activityPagination.getByRole('button',{name:'Next: Assignments',exact:true});
    await assignments.waitFor();
    await assignments.click();
    await page.locator('.assignment-page').waitFor();
    assert.equal(await page.getByTestId('lesson-page').count(),0,'the last-page activity fallback opens Assignments');
    assert.equal(await overflow(page),0,'the assignment destination has no horizontal overflow');
  },{harness:true});
});
