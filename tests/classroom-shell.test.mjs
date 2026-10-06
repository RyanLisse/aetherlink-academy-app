import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const main=readFileSync(path.join(root,'src/main.jsx'),'utf8');
const shell=readFileSync(path.join(root,'src/classroom-shell.jsx'),'utf8');
const css=readFileSync(path.join(root,'src/classroom-shell.css'),'utf8');

test('Classroom shell: course grid home + course outline + mark-complete (no community tabs)',()=>{
  assert.match(shell,/data-testid="classroom-shell"/);
  assert.match(shell,/data-testid="classroom-home"/);
  assert.match(shell,/data-testid="classroom-grid"/);
  assert.match(shell,/data-testid="classroom-course-card"/);
  assert.match(shell,/data-testid="classroom-outline"/);
  assert.match(shell,/data-testid="classroom-mark-complete"/);
  assert.match(shell,/lesson-complete/);
  assert.match(shell,/academy-classroom-progress/);
  assert.match(css,/\.classroom-grid/);
  assert.doesNotMatch(shell,/skool\.tabs/);
  assert.doesNotMatch(shell,/data-testid="skool-/);
  assert.doesNotMatch(main,/SkoolShell/);
});

test('session UI is ClassroomShell; join gate and /facilitator stay outside',()=>{
  assert.match(main,/import \{ClassroomShell\} from '\.\/classroom-shell'/);
  assert.match(main,/return <ClassroomShell/);
  assert.match(main,/if\(path===ADMIN_PATH\)return <FacilitatorAdmin /);
  assert.match(main,/if\(!session\|\|!room\)return <><header className="welcome-header">/);
});

test('i18n classroom keys present EN+NL with parity',()=>{
  for(const file of ['src/i18n/en.json','src/i18n/nl.json','packages/i18n/src/en.json','packages/i18n/src/nl.json']){
    const catalog=JSON.parse(readFileSync(path.join(root,file),'utf8'));
    for(const key of ['classroom.homeTitle','classroom.course.workshop','classroom.course.arcade','classroom.course.learn','classroom.markComplete','classroom.backToCourses']){
      assert.equal(typeof catalog[key],'string',`${file} ${key}`);
    }
    assert.equal(Object.keys(catalog).filter(k=>k.startsWith('skool.')).length,0,`${file} still has skool.* keys`);
  }
  const en=JSON.parse(readFileSync(path.join(root,'src/i18n/en.json'),'utf8'));
  const nl=JSON.parse(readFileSync(path.join(root,'src/i18n/nl.json'),'utf8'));
  assert.deepEqual(Object.keys(en).sort(),Object.keys(nl).sort());
  assert.notEqual(nl['classroom.homeTitle'],en['classroom.homeTitle']);
});

test('old community skool-shell files are gone',()=>{
  assert.equal(existsSync(path.join(root,'src/skool-shell.jsx')),false);
  assert.equal(existsSync(path.join(root,'src/skool-shell.css')),false);
});

test('Wave outline labels Session/Day 1–7; facilitator unlocks all days in shell',()=>{
  assert.match(shell,/classroom\.session/);
  assert.match(shell,/moduleSubtitle/);
  assert.match(shell,/data-testid="classroom-module"/);
  assert.match(shell,/facilitator\|\|teachMode\?true:day\.released!==false/);
  assert.match(shell,/classroom-module-subtitle/);
  for(const file of ['src/i18n/en.json','src/i18n/nl.json','packages/i18n/src/en.json','packages/i18n/src/nl.json']){
    const catalog=JSON.parse(readFileSync(path.join(root,file),'utf8'));
    assert.equal(typeof catalog['classroom.session'],'string',`${file} classroom.session`);
    assert.match(catalog['classroom.session'],/\{day\}/);
    assert.match(catalog['classroom.course.workshopHelp'],/7/);
  }
});

test('facilitator teach-mode: browse without room; Wave catalog unlocked; contrast tokens',()=>{
  assert.match(shell,/teachMode/);
  assert.match(shell,/canBrowse/);
  assert.match(shell,/TEACH_WAVE_DAYS/);
  assert.match(shell,/teach-session-note/);
  assert.match(shell,/classroom\.teachNote/);
  assert.match(shell,/classroom\.bottom\.teach/);
  assert.match(css,/--c-surface: var\(--surface/);
  assert.doesNotMatch(css,/--c-surface: var\(--panel/);
  assert.match(css,/\.classroom-teach-embed/);
  assert.match(css,/classroom-avatar[\s\S]*background:var\(--surface2/);
  for(const file of ['src/i18n/en.json','src/i18n/nl.json','packages/i18n/src/en.json','packages/i18n/src/nl.json']){
    const catalog=JSON.parse(readFileSync(path.join(root,file),'utf8'));
    for(const key of ['classroom.teachNote','classroom.bottom.teach','classroom.teachEmbedHelp','classroom.teachOpenSlide']){
      assert.equal(typeof catalog[key],'string',`${file} ${key}`);
    }
  }
});

test('teach-catalog maps Wave days 1–7 onto classroom/workshop paths',async()=>{
  const {TEACH_WAVE_DAYS,teachLessonHref,teachDayTitle}=await import('../src/teach-catalog.js');
  assert.equal(TEACH_WAVE_DAYS.length,7);
  assert.deepEqual(TEACH_WAVE_DAYS.map(d=>d.day),[1,2,3,4,5,6,7]);
  assert.equal(teachLessonHref(1),'/classroom/1');
  assert.equal(teachLessonHref(7),'/workshop/7');
  assert.match(teachDayTitle(1,'en'),/Classroom 1/);
  assert.match(teachDayTitle(1,'nl'),/Classroom 1/);
});

test('Classroom chrome exposes room Decks entry for facilitator teach slides',()=>{
  assert.match(shell,/renderDecks/);
  assert.match(shell,/data-testid="nav-decks"/);
  assert.match(shell,/data-testid="classroom-decks"/);
  assert.match(shell,/classroom\.nav\.decks/);
  for(const file of ['src/i18n/en.json','src/i18n/nl.json','packages/i18n/src/en.json','packages/i18n/src/nl.json']){
    const catalog=JSON.parse(readFileSync(path.join(root,file),'utf8'));
    assert.equal(typeof catalog['classroom.nav.decks'],'string',`${file} classroom.nav.decks`);
  }
});
