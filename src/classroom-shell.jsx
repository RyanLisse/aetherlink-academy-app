import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {ArrowLeft,ArrowRight,BookOpen,Check,ChevronRight,Circle,CircleDot,Eye,Gamepad2,GraduationCap,LayoutGrid,Lock,MonitorPlay,Pencil,Presentation,Users} from 'lucide-react';
import {api} from './api';
import {useT,useI18n} from './i18n';
import learnCatalog from '../content/learn-claude-code/catalog.json';
import arcadeManifest from '../content/arcade/arcade-manifest.json';
import {TEACH_WAVE_DAYS, teachDayTitle, teachLessonHref} from './teach-catalog';
import './classroom-shell.css';

const LOCAL_KEY=(roomId,personId)=>`academy-classroom-progress:v1:${roomId||'teach'}:${personId||'anon'}`;

function readLocal(roomId,personId){
  try{return JSON.parse(localStorage.getItem(LOCAL_KEY(roomId,personId))||'{}');}catch{return {};}
}
function writeLocal(roomId,personId,next){
  localStorage.setItem(LOCAL_KEY(roomId,personId),JSON.stringify(next));
}

function percent(done,total){
  if(!total)return 0;
  return Math.round((done/total)*100);
}

/** Thin Classroom chrome: teach-first home (A) + three-column teach lesson (B). Social feed chrome is out of scope. */
export function ClassroomShell({
  room,
  facilitator=false,
  onAdmin,
  account=null,
  avatarLabel='',
  action,
  busy=false,
  renderWorkshop,
  renderArcade,
  renderLearn,
  emptyCta=null,
  teachMode=false,
  renderDecks=null,
}){
  const t=useT();
  const {locale}=useI18n();
  const [screen,setScreen]=useState('home'); // home | course | decks
  const [courseId,setCourseId]=useState(null);
  const [lessonKey,setLessonKey]=useState(null); // string id within course
  const [route,setRoute]=useState(null);
  const [routeError,setRouteError]=useState('');
  const [localProgress,setLocalProgress]=useState(()=>readLocal(room?.id||(teachMode?'teach':null),room?.me?.id||(teachMode?'facilitator':undefined)));
  const [saving,setSaving]=useState(false);
  const [jumpSession,setJumpSession]=useState('1');
  const [previewNote,setPreviewNote]=useState('');

  const personId=room?.me?.id||(teachMode?'facilitator':undefined);
  const roomId=room?.id||(teachMode?'teach':undefined);
  const canBrowse=Boolean(room)||teachMode;
  const isFacilitatorChrome=Boolean(facilitator||teachMode);

  useEffect(()=>{if(roomId)setLocalProgress(readLocal(roomId,personId));},[roomId,personId]);

  const reloadRoute=useCallback(async()=>{
    if(!room){setRoute(null);setRouteError('');return;}
    try{
      const next=await api(`day-route?locale=${locale}`);
      setRoute(next);setRouteError('');
    }catch(err){setRouteError(err.message||String(err));}
  },[room,locale]);

  const progressKey=room?.me?.progressByDay;
  useEffect(()=>{reloadRoute();},[reloadRoute,room?.day,room?.version,progressKey]);

  const workshopDays=useMemo(()=>{
    if(route?.days?.length)return route.days;
    if(teachMode)return TEACH_WAVE_DAYS.map(d=>({
      day:d.day,
      title:teachDayTitle(d.day,locale),
      released:true,
      activities:{lessonTitle:teachDayTitle(d.day,locale)},
      progress:{},
      tasks:null,
    }));
    return [];
  },[route,teachMode,locale]);
  const workshopLessons=useMemo(()=>workshopDays.flatMap(day=>{
    // Facilitators must see every Wave day selectable. Server readableDays already unlocks them;
    // keep client unlock so a stale day-route cannot day-lock the outline for Facilitator.
    // Teach-mode (no room) also unlocks all Wave sessions without Create squad.
    const released=facilitator||teachMode?true:day.released!==false;
    const moduleTitle=t('classroom.session',{day:day.day});
    const moduleSubtitle=day.title;
    const localLessonDone=Boolean(localProgress[`workshop:day-${day.day}:lesson`]);
    // Teach-mode without a room: lesson browse only (assignments/quiz/review need a live squad).
    if(teachMode&&!room){
      return [{key:`workshop:day-${day.day}:lesson`,day:day.day,page:'lesson',moduleId:`day-${day.day}`,moduleTitle,moduleSubtitle,title:day.activities?.lessonTitle||day.title,kind:'workshop',done:localLessonDone,released,href:teachLessonHref(day.day)}];
    }
    const rows=[
      {key:`workshop:day-${day.day}:lesson`,day:day.day,page:'lesson',moduleId:`day-${day.day}`,moduleTitle,moduleSubtitle,title:day.activities?.lessonTitle||day.title,kind:'workshop',done:Boolean(day.progress?.lessonDone),released},
      {key:`workshop:day-${day.day}:assignments`,day:day.day,page:'assignments',moduleId:`day-${day.day}`,moduleTitle,moduleSubtitle,title:day.activities?.missionTitle||t('coursePages.assignments'),kind:'workshop',done:Boolean(day.tasks?.total>0&&day.tasks.approved===day.tasks.total),released},
      {key:`workshop:day-${day.day}:quiz`,day:day.day,page:'quiz',moduleId:`day-${day.day}`,moduleTitle,moduleSubtitle,title:t('coursePages.quiz'),kind:'workshop',done:Boolean(day.progress?.hasQuiz),released},
    ];
    if(day.day===room?.day)rows.push({key:`workshop:day-${day.day}:review`,day:day.day,page:'review',moduleId:`day-${day.day}`,moduleTitle,moduleSubtitle,title:t('nav.review'),kind:'workshop',done:Boolean(day.progress?.hasHandoff),released});
    return rows;
  }),[workshopDays,t,facilitator,teachMode,room,localProgress]);

  const arcadeLessons=useMemo(()=>{
    const lessons=(arcadeManifest.lessons||[]).map(L=>({
      key:`arcade:${L.id}`,id:L.id,moduleId:'arcade-labs',moduleTitle:t('classroom.module.arcadeLabs'),title:L.title||L.id,kind:'arcade',
      done:Boolean(localProgress[`arcade:${L.id}`]),href:`/arcade#${L.id}`,
    }));
    const solos=(arcadeManifest.soloLessons||[]).map(L=>({
      key:`arcade-solo:${L.id}`,id:L.id,moduleId:'arcade-solos',moduleTitle:t('classroom.module.arcadeSolos'),title:L.title||L.id,kind:'arcade-solo',
      done:Boolean(localProgress[`arcade-solo:${L.id}`]),href:`/arcade/solo?lesson=${L.id}`,
    }));
    return [...lessons,...solos];
  },[localProgress,t]);

  const learnLessons=useMemo(()=>(learnCatalog.chapters||[])
    .filter(c=>c.kind==='chapter')
    .map(c=>({
      key:`learn:${c.id}`,id:c.id,moduleId:'learn-chapters',moduleTitle:t('classroom.module.learnChapters'),title:c.title||c.id,kind:'learn',
      done:Boolean(localProgress[`learn:${c.id}`]),
    })),[localProgress,t]);

  const courses=useMemo(()=>{
    const workshopDone=workshopLessons.filter(l=>l.done).length;
    const arcadeDone=arcadeLessons.filter(l=>l.done).length;
    const learnDone=learnLessons.filter(l=>l.done).length;
    return [
      {id:'workshop',title:route?.course?.name||t('classroom.course.workshop'),blurb:t('classroom.course.workshopHelp'),icon:Presentation,tone:'workshop',total:workshopLessons.length,done:workshopDone,progress:percent(workshopDone,workshopLessons.length),sessions:workshopDays.length||7},
      {id:'arcade',title:t('classroom.course.arcade'),blurb:t('classroom.course.arcadeHelp'),icon:Gamepad2,tone:'arcade',total:arcadeLessons.length,done:arcadeDone,progress:percent(arcadeDone,arcadeLessons.length),sessions:8},
      {id:'learn',title:t('classroom.course.learn'),blurb:t('classroom.course.learnHelp'),icon:GraduationCap,tone:'learn',total:learnLessons.length,done:learnDone,progress:percent(learnDone,learnLessons.length),sessions:6},
    ];
  },[workshopLessons,arcadeLessons,learnLessons,workshopDays,route,t]);

  const lessonsFor=useMemo(()=>courseId==='workshop'?workshopLessons:courseId==='arcade'?arcadeLessons:courseId==='learn'?learnLessons:[],[courseId,workshopLessons,arcadeLessons,learnLessons]);
  const activeLesson=lessonsFor.find(l=>l.key===lessonKey)||lessonsFor.find(l=>l.released!==false)||lessonsFor[0]||null;
  const activeIndex=activeLesson?lessonsFor.findIndex(l=>l.key===activeLesson.key):-1;

  const openCourse=id=>{
    setCourseId(id);setScreen('course');
    const list=id==='workshop'?workshopLessons:id==='arcade'?arcadeLessons:learnLessons;
    const first=list.find(l=>!l.done&&l.released!==false)||list[0];
    setLessonKey(first?.key||null);
    if(id==='workshop'&&first?.day)setJumpSession(String(first.day));
  };
  const backHome=()=>{setScreen('home');setCourseId(null);setLessonKey(null);setPreviewNote('');};
  const openDecks=()=>setScreen('decks');

  const markComplete=async()=>{
    if(!activeLesson||(!room&&!teachMode))return;
    setSaving(true);
    try{
      if(room&&activeLesson.kind==='workshop'&&activeLesson.page==='lesson'){
        await api('lesson-complete',{day:activeLesson.day,done:!activeLesson.done});
        await reloadRoute();
      }else{
        const key=activeLesson.key;
        const next={...localProgress,[key]:!localProgress[key]};
        writeLocal(roomId,personId,next);
        setLocalProgress(next);
      }
    }finally{setSaving(false);}
  };

  const goPrev=()=>{if(activeIndex>0)setLessonKey(lessonsFor[activeIndex-1].key);};
  const goNext=()=>{if(activeIndex>=0&&activeIndex<lessonsFor.length-1)setLessonKey(lessonsFor[activeIndex+1].key);};

  const modules=useMemo(()=>{
    const map=new Map();
    for(const lesson of lessonsFor){
      if(!map.has(lesson.moduleId))map.set(lesson.moduleId,{id:lesson.moduleId,title:lesson.moduleTitle,subtitle:lesson.moduleSubtitle||'',lessons:[]});
      map.get(lesson.moduleId).lessons.push(lesson);
    }
    return [...map.values()];
  },[lessonsFor]);

  const courseMeta=courses.find(c=>c.id===courseId);
  const workshopMeta=courses.find(c=>c.id==='workshop');
  const secondaryCourses=courses.filter(c=>c.id!=='workshop');

  useEffect(()=>{
    if(activeLesson?.day)setJumpSession(String(activeLesson.day));
  },[activeLesson?.day]);

  const selectModule=mod=>{
    const first=mod.lessons.find(l=>l.released!==false)||mod.lessons[0];
    if(first)setLessonKey(first.key);
  };

  const doJumpSession=()=>{
    const day=Number(jumpSession);
    const target=lessonsFor.find(l=>l.day===day&&l.page==='lesson')||lessonsFor.find(l=>l.day===day);
    if(target)setLessonKey(target.key);
  };

  const markDisabled=!activeLesson||activeLesson.released===false||saving||(activeLesson.kind==='workshop'&&activeLesson.page!=='lesson'&&!(teachMode&&!room));

  let mainBody=null;
  if(screen==='decks'&&renderDecks){
    mainBody=<div className="classroom-decks" data-testid="classroom-decks">
      <button type="button" className="classroom-back" data-testid="classroom-decks-back" onClick={()=>setScreen(courseId?'course':'home')}><ArrowLeft size={16} aria-hidden="true"/>{t('classroom.backToCourses')}</button>
      {renderDecks()}
    </div>;
  }else if(screen==='home'){
    mainBody=<section className="classroom-home" data-testid="classroom-home">
      <header className="classroom-home-head">
        <h1>{t('classroom.homeTitle')}</h1>
        <p className="muted">{t('classroom.homeHelp')}</p>
      </header>
      {teachMode&&!room&&<p className="classroom-teach-note muted" data-testid="teach-session-note">{t('classroom.teachNote')}</p>}
      {!room&&!teachMode&&emptyCta&&<div className="classroom-empty-cta" data-testid="facilitator-empty">{emptyCta}</div>}
      {routeError&&<p className="error" role="alert">{routeError}</p>}

      <article className="classroom-wave-hero" data-testid="classroom-wave-hero" data-course="workshop">
        <div className="classroom-wave-hero-art" aria-hidden="true">
          <div className="classroom-wave-hero-copy">
            <strong>{t('classroom.course.workshop')}</strong>
            <p>{t('classroom.hero.blurb')}</p>
            <span className="classroom-wave-hero-tag"><Users size={14} aria-hidden="true"/>{t('classroom.hero.tag')}</span>
          </div>
          <div className="classroom-wave-hero-photo"/>
        </div>
        <div className="classroom-wave-hero-panel">
          <div className="classroom-wave-hero-progress" aria-label={t('classroom.progressLabel',{pct:workshopMeta?.progress||0})}>
            <svg viewBox="0 0 36 36" className="classroom-ring" aria-hidden="true">
              <path className="classroom-ring-bg" d="M18 2.5a15.5 15.5 0 1 1 0 31 15.5 15.5 0 1 1 0-31"/>
              <path className="classroom-ring-fg" strokeDasharray={`${workshopMeta?.progress||0}, 100`} d="M18 2.5a15.5 15.5 0 1 1 0 31 15.5 15.5 0 1 1 0-31"/>
            </svg>
            <strong>{workshopMeta?.progress||0}%</strong>
          </div>
          <p className="classroom-wave-hero-ready">{t('classroom.hero.ready')}</p>
          <p className="muted classroom-wave-hero-ready-help">{t('classroom.hero.readyHelp')}</p>
          <div className="classroom-wave-hero-actions">
            <button type="button" className="classroom-btn-primary" data-testid="classroom-open-classroom" disabled={!canBrowse} onClick={()=>canBrowse&&openCourse('workshop')}>
              <MonitorPlay size={16} aria-hidden="true"/>{t('classroom.openClassroom')}
            </button>
            {isFacilitatorChrome&&renderDecks&&<button type="button" className="classroom-btn-secondary" data-testid="classroom-hero-slides" onClick={openDecks}>
              <Presentation size={16} aria-hidden="true"/>{t('classroom.hero.slides')}
            </button>}
          </div>
        </div>
      </article>

      <div className="classroom-grid" data-testid="classroom-grid">
        {secondaryCourses.map(course=>{
          const Icon=course.icon;
          return <button type="button" key={course.id} className={'classroom-card tone-'+course.tone} data-testid="classroom-course-card" data-course={course.id} onClick={()=>canBrowse&&openCourse(course.id)} disabled={!canBrowse}>
            <div className="classroom-card-cover" aria-hidden="true">
              <span className="classroom-card-cover-label">{course.title}</span>
              <span className="classroom-card-cover-tag">{t('classroom.sessionsCount',{n:course.sessions})}</span>
              <Icon size={28} className="classroom-card-cover-icon"/>
            </div>
            <div className="classroom-card-body">
              <h2>{course.title}</h2>
              <p>{course.blurb}</p>
              <div className="classroom-card-status"><span className="classroom-status-dot" aria-hidden="true"/><span>{t('classroom.readyToTeach')}</span></div>
              <div className="classroom-card-progress" aria-label={t('classroom.progressLabel',{pct:course.progress})}>
                <span className="classroom-card-bar"><i style={{width:`${course.progress}%`}}/></span>
                <strong>{course.progress}%</strong>
                <small>{t('classroom.progressCount',{done:course.done,total:course.total})}</small>
              </div>
            </div>
          </button>;
        })}
      </div>
    </section>;
  }else{
    const locked=activeLesson?.released===false;
    const sessionLessons=activeLesson?lessonsFor.filter(l=>l.moduleId===activeLesson.moduleId):[];
    const sessionIndex=activeLesson?sessionLessons.findIndex(l=>l.key===activeLesson.key):-1;
    mainBody=<div className="classroom-course" data-testid="classroom-course" data-course={courseId}>
      <aside className="classroom-outline" aria-label={t('classroom.outlineLabel')} data-testid="classroom-outline">
        <button type="button" className="classroom-back" onClick={backHome}><ArrowLeft size={16} aria-hidden="true"/>{t('classroom.backToCourses')}</button>
        <h2>{t('classroom.outlineTitle')}</h2>
        <p className="muted classroom-outline-meta">{t('classroom.outlineMeta',{sessions:modules.length,lessons:lessonsFor.length})}</p>
        <div className="classroom-outline-scroll">
          {modules.map(mod=>{
            const selected=mod.lessons.some(l=>l.key===activeLesson?.key);
            const allDone=mod.lessons.every(l=>l.done);
            const lockedMod=mod.lessons.every(l=>l.released===false);
            return <div key={mod.id} className={'classroom-module'+(selected?' is-selected':'')} data-testid="classroom-module" data-session={mod.id}>
              <button type="button" className={'classroom-session-btn'+(selected?' is-active':'')} data-testid="classroom-outline-session" disabled={lockedMod} onClick={()=>selectModule(mod)}>
                <span className="classroom-session-check" aria-hidden="true">{allDone?<Check size={16}/>:selected?<CircleDot size={16}/>:<Circle size={16}/>}</span>
                <span className="classroom-session-text">
                  <span className="classroom-module-title">{mod.title}</span>
                  {mod.subtitle?<span className="classroom-module-subtitle">{mod.subtitle}</span>:null}
                </span>
                <ChevronRight size={16} aria-hidden="true" className="classroom-session-chevron"/>
              </button>
              {selected&&mod.lessons.length>1&&<ul>
                {mod.lessons.map(lesson=>{
                  const lessonSelected=lesson.key===activeLesson?.key;
                  const Icon=lesson.done?Check:lessonSelected?CircleDot:Circle;
                  return <li key={lesson.key}>
                    <button type="button" className={lessonSelected?'is-active':undefined} data-testid="classroom-outline-lesson" data-lesson={lesson.key} data-done={lesson.done||undefined} disabled={lesson.released===false} onClick={()=>setLessonKey(lesson.key)}>
                      <Icon size={15} aria-hidden="true"/><span>{lesson.title}</span>
                    </button>
                  </li>;
                })}
              </ul>}
              {selected&&mod.lessons.length===1&&mod.lessons.map(lesson=>
                <span key={lesson.key} className="sr-only" data-testid="classroom-outline-lesson" data-lesson={lesson.key} data-done={lesson.done||undefined}>{lesson.title}</span>
              )}
            </div>;
          })}
        </div>
        {isFacilitatorChrome&&<p className="classroom-teach-view-note" data-testid="classroom-teach-view-note">{t('classroom.teachViewNote')}</p>}
      </aside>
      <div className="classroom-lesson" data-testid="classroom-lesson">
        <header className="classroom-lesson-head">
          <p className="classroom-eyebrow">{activeLesson?.moduleTitle}{sessionLessons.length?` · ${t('classroom.lessonOf',{n:Math.max(sessionIndex+1,1),total:sessionLessons.length})}`:''}</p>
          <h1>{activeLesson?.title||t('classroom.pickLesson')}</h1>
        </header>
        <div className="classroom-lesson-body">
          {locked&&<p className="muted">{t('course.locked')}</p>}
          {!locked&&activeLesson?.kind==='workshop'&&renderWorkshop?.(activeLesson)}
          {!locked&&activeLesson?.kind==='arcade'&&renderArcade?.(activeLesson)}
          {!locked&&activeLesson?.kind==='arcade-solo'&&renderArcade?.(activeLesson)}
          {!locked&&activeLesson?.kind==='learn'&&renderLearn?.(activeLesson)}
          {!activeLesson&&<p className="muted">{t('classroom.pickLesson')}</p>}
        </div>
        <nav className="classroom-lesson-nav" aria-label={t('classroom.lessonNav')}>
          <button type="button" data-testid="classroom-prev" onClick={goPrev} disabled={activeIndex<=0}><ArrowLeft size={16} aria-hidden="true"/>{t('classroom.prevSlide')}</button>
          <button type="button" className={activeLesson?.done?'is-done':undefined} data-testid="classroom-mark-complete" disabled={markDisabled} onClick={()=>action?action(markComplete):markComplete()}>
            <Check size={16} aria-hidden="true"/>{activeLesson?.done?t('classroom.completed'):t('classroom.markComplete')}
          </button>
          <button type="button" className="gradient" data-testid="classroom-next" onClick={goNext} disabled={activeIndex<0||activeIndex>=lessonsFor.length-1}>{t('classroom.nextSlide')}<ArrowRight size={16} aria-hidden="true"/></button>
          {isFacilitatorChrome&&renderDecks&&<button type="button" className="classroom-btn-bewerk" data-testid="classroom-bewerk-slides" onClick={openDecks}>
            <Pencil size={16} aria-hidden="true"/>{t('classroom.bewerkSlides')}
          </button>}
        </nav>
      </div>
      <aside className="classroom-right" aria-label={isFacilitatorChrome?t('classroom.teachControls'):t('classroom.rightLabel')} data-testid="classroom-right">
        {isFacilitatorChrome?<>
          <section className="classroom-teach-controls" data-testid="classroom-teach-controls">
            <h3>{t('classroom.teachControls')}</h3>
            <p className="muted">{t('classroom.teachControlsHelp')}</p>
          </section>
          <section data-testid="classroom-jump-session">
            <h3>{t('classroom.jumpSession')}</h3>
            <label className="classroom-jump-label">
              <select value={jumpSession} onChange={e=>setJumpSession(e.target.value)} data-testid="classroom-jump-select">
                {workshopDays.map(d=>
                  <option key={d.day} value={String(d.day)}>{t('classroom.session',{day:d.day})} — {d.title}</option>
                )}
              </select>
            </label>
            <button type="button" className="classroom-btn-primary classroom-btn-block" data-testid="classroom-jump-go" onClick={doJumpSession} disabled={courseId!=='workshop'}>{t('classroom.jumpSessionAction')}</button>
          </section>
          <section>
            <h3>{t('classroom.markComplete')}</h3>
            <button type="button" className={activeLesson?.done?'is-done classroom-btn-block':'classroom-btn-block'} data-testid="classroom-right-mark-complete" disabled={markDisabled} onClick={()=>action?action(markComplete):markComplete()}>
              {markDisabled&&activeLesson?.page==='quiz'?<Lock size={14} aria-hidden="true"/>:<Check size={14} aria-hidden="true"/>}
              {activeLesson?.done?t('classroom.completed'):t('classroom.markComplete')}
            </button>
          </section>
          {renderDecks&&<section>
            <h3>{t('classroom.deckEditor')}</h3>
            <button type="button" className="classroom-btn-secondary classroom-btn-block" data-testid="classroom-right-decks" onClick={openDecks}>
              <Pencil size={14} aria-hidden="true"/>{t('classroom.bewerkSlides')}
            </button>
          </section>}
          <section data-testid="classroom-preview-participant">
            <h3>{t('classroom.previewParticipant')}</h3>
            <button type="button" className="classroom-btn-secondary classroom-btn-block" data-testid="classroom-preview-open" onClick={()=>setPreviewNote(t('classroom.previewStub'))}>
              <Eye size={14} aria-hidden="true"/>{t('classroom.previewOpen')}
            </button>
            {previewNote&&<p className="muted classroom-preview-stub" role="status">{previewNote}</p>}
          </section>
        </>:<>
          <section>
            <h3>{t('classroom.right.progress')}</h3>
            <p><strong>{courseMeta?.progress||0}%</strong></p>
            <p className="muted">{t('classroom.progressCount',{done:courseMeta?.done||0,total:courseMeta?.total||0})}</p>
          </section>
          <section>
            <h3>{t('classroom.right.resources')}</h3>
            <ul className="classroom-resources">
              <li><a href="/arcade">{t('classroom.course.arcade')}</a></li>
              <li><button type="button" onClick={()=>openCourse('learn')}>{t('classroom.course.learn')}</button></li>
            </ul>
          </section>
        </>}
      </aside>
    </div>;
  }

  return <div className="classroom-shell" data-testid="classroom-shell" data-screen={screen}>
    <header className="classroom-topbar">
      <button type="button" className="classroom-brand" onClick={backHome}>AetherLink <span>Academy</span></button>
      <nav className="classroom-top-actions" aria-label={t('classroom.chromeLabel')}>
        {isFacilitatorChrome&&<span className="classroom-teach-badge" data-testid="classroom-teach-badge"><MonitorPlay size={14} aria-hidden="true"/>{t('classroom.teachModeBadge')}</span>}
        <button type="button" className={screen==='home'?'is-active':undefined} data-testid="classroom-nav-home" onClick={backHome}><BookOpen size={16} aria-hidden="true"/>{t('classroom.nav.classroom')}</button>
        {isFacilitatorChrome&&renderDecks&&<button type="button" data-testid="nav-decks" className={screen==='decks'?'is-active':undefined} onClick={openDecks}><Presentation size={16} aria-hidden="true"/>{t('classroom.nav.decks')}</button>}
        {facilitator&&onAdmin&&<button type="button" data-testid="nav-admin" onClick={onAdmin}><LayoutGrid size={16} aria-hidden="true"/>{t('nav.admin')}</button>}
        {account}
        <span className="classroom-avatar" aria-label={avatarLabel}>{(avatarLabel||'?').slice(0,2).toUpperCase()}</span>
      </nav>
    </header>
    <div className="classroom-body">{mainBody}</div>
    <footer className="classroom-bottom" data-testid="classroom-bottom">
      <span>{room?.code?`${t('roster.roomCode')} ${room.code}`:teachMode?t('classroom.bottom.teach'):t('classroom.bottom.empty')}</span>
      {room&&<span>{t('classroom.bottom.roundDay',{round:room.round,day:room.day})}</span>}
      {busy&&<span>{t('common.loading')}</span>}
    </footer>
  </div>;
}
