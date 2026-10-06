import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {ArrowLeft,ArrowRight,BookOpen,Check,Circle,CircleDot,Gamepad2,GraduationCap,LayoutGrid,Presentation} from 'lucide-react';
import {api} from './api';
import {useT,useI18n} from './i18n';
import learnCatalog from '../content/learn-claude-code/catalog.json';
import arcadeManifest from '../content/arcade/arcade-manifest.json';
import './classroom-shell.css';

const LOCAL_KEY=(roomId,personId)=>`academy-classroom-progress:v1:${roomId}:${personId||'anon'}`;

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

/** Thin Classroom chrome: course grid → course outline + lesson body. Social feed chrome is out of scope. */
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
}){
  const t=useT();
  const {locale}=useI18n();
  const [screen,setScreen]=useState('home'); // home | course
  const [courseId,setCourseId]=useState(null);
  const [lessonKey,setLessonKey]=useState(null); // string id within course
  const [route,setRoute]=useState(null);
  const [routeError,setRouteError]=useState('');
  const [localProgress,setLocalProgress]=useState(()=>readLocal(room?.id,room?.me?.id));
  const [saving,setSaving]=useState(false);

  const personId=room?.me?.id;
  const roomId=room?.id;

  useEffect(()=>{setLocalProgress(readLocal(roomId,personId));},[roomId,personId]);

  const reloadRoute=useCallback(async()=>{
    if(!room)return;
    try{
      const next=await api(`day-route?locale=${locale}`);
      setRoute(next);setRouteError('');
    }catch(err){setRouteError(err.message||String(err));}
  },[room,locale]);

  const progressKey=room?.me?.progressByDay;
  useEffect(()=>{reloadRoute();},[reloadRoute,room?.day,room?.version,progressKey]);

  const workshopDays=useMemo(()=>route?.days||[],[route]);
  const workshopLessons=useMemo(()=>workshopDays.flatMap(day=>{
    const rows=[
      {key:`workshop:day-${day.day}:lesson`,day:day.day,page:'lesson',moduleId:`day-${day.day}`,moduleTitle:day.title,title:day.activities?.lessonTitle||day.title,kind:'workshop',done:Boolean(day.progress?.lessonDone),released:day.released},
      {key:`workshop:day-${day.day}:assignments`,day:day.day,page:'assignments',moduleId:`day-${day.day}`,moduleTitle:day.title,title:day.activities?.missionTitle||t('coursePages.assignments'),kind:'workshop',done:Boolean(day.tasks?.total>0&&day.tasks.approved===day.tasks.total),released:day.released},
      {key:`workshop:day-${day.day}:quiz`,day:day.day,page:'quiz',moduleId:`day-${day.day}`,moduleTitle:day.title,title:t('coursePages.quiz'),kind:'workshop',done:Boolean(day.progress?.hasQuiz),released:day.released},
    ];
    if(day.day===room?.day)rows.push({key:`workshop:day-${day.day}:review`,day:day.day,page:'review',moduleId:`day-${day.day}`,moduleTitle:day.title,title:t('nav.review'),kind:'workshop',done:Boolean(day.progress?.hasHandoff),released:day.released});
    return rows;
  }),[workshopDays,room?.day,t]);

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
      {id:'workshop',title:route?.course?.name||t('classroom.course.workshop'),blurb:t('classroom.course.workshopHelp'),icon:Presentation,tone:'workshop',total:workshopLessons.length,done:workshopDone,progress:percent(workshopDone,workshopLessons.length)},
      {id:'arcade',title:t('classroom.course.arcade'),blurb:t('classroom.course.arcadeHelp'),icon:Gamepad2,tone:'arcade',total:arcadeLessons.length,done:arcadeDone,progress:percent(arcadeDone,arcadeLessons.length)},
      {id:'learn',title:t('classroom.course.learn'),blurb:t('classroom.course.learnHelp'),icon:GraduationCap,tone:'learn',total:learnLessons.length,done:learnDone,progress:percent(learnDone,learnLessons.length)},
    ];
  },[workshopLessons,arcadeLessons,learnLessons,route,t]);

  const lessonsFor=useMemo(()=>courseId==='workshop'?workshopLessons:courseId==='arcade'?arcadeLessons:courseId==='learn'?learnLessons:[],[courseId,workshopLessons,arcadeLessons,learnLessons]);
  const activeLesson=lessonsFor.find(l=>l.key===lessonKey)||lessonsFor.find(l=>l.released!==false)||lessonsFor[0]||null;
  const activeIndex=activeLesson?lessonsFor.findIndex(l=>l.key===activeLesson.key):-1;

  const openCourse=id=>{
    setCourseId(id);setScreen('course');
    const list=id==='workshop'?workshopLessons:id==='arcade'?arcadeLessons:learnLessons;
    const first=list.find(l=>!l.done&&l.released!==false)||list[0];
    setLessonKey(first?.key||null);
  };
  const backHome=()=>{setScreen('home');setCourseId(null);setLessonKey(null);};

  const markComplete=async()=>{
    if(!activeLesson||!room)return;
    setSaving(true);
    try{
      if(activeLesson.kind==='workshop'&&activeLesson.page==='lesson'){
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
      if(!map.has(lesson.moduleId))map.set(lesson.moduleId,{id:lesson.moduleId,title:lesson.moduleTitle,lessons:[]});
      map.get(lesson.moduleId).lessons.push(lesson);
    }
    return [...map.values()];
  },[lessonsFor]);

  const courseMeta=courses.find(c=>c.id===courseId);

  let mainBody=null;
  if(screen==='home'){
    mainBody=<section className="classroom-home" data-testid="classroom-home">
      <header className="classroom-home-head">
        <p className="classroom-eyebrow">{t('classroom.eyebrow')}</p>
        <h1>{t('classroom.homeTitle')}</h1>
        <p className="muted">{t('classroom.homeHelp')}</p>
      </header>
      {!room&&emptyCta&&<div className="classroom-empty-cta" data-testid="facilitator-empty">{emptyCta}</div>}
      {routeError&&<p className="error" role="alert">{routeError}</p>}
      <div className="classroom-grid" data-testid="classroom-grid">
        {courses.map(course=>{
          const Icon=course.icon;
          return <button type="button" key={course.id} className={'classroom-card tone-'+course.tone} data-testid="classroom-course-card" data-course={course.id} onClick={()=>room&&openCourse(course.id)} disabled={!room}>
            <div className="classroom-card-cover" aria-hidden="true"><Icon size={36}/></div>
            <div className="classroom-card-body">
              <h2>{course.title}</h2>
              <p>{course.blurb}</p>
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
    mainBody=<div className="classroom-course" data-testid="classroom-course" data-course={courseId}>
      <aside className="classroom-outline" aria-label={t('classroom.outlineLabel')} data-testid="classroom-outline">
        <button type="button" className="classroom-back" onClick={backHome}><ArrowLeft size={16} aria-hidden="true"/>{t('classroom.backToCourses')}</button>
        <h2>{courseMeta?.title}</h2>
        <p className="muted">{t('classroom.progressLabel',{pct:courseMeta?.progress||0})}</p>
        <div className="classroom-outline-scroll">
          {modules.map(mod=><div key={mod.id} className="classroom-module">
            <p className="classroom-module-title">{mod.title}</p>
            <ul>
              {mod.lessons.map(lesson=>{
                const selected=lesson.key===activeLesson?.key;
                const Icon=lesson.done?Check:selected?CircleDot:Circle;
                return <li key={lesson.key}>
                  <button type="button" className={selected?'is-active':undefined} data-testid="classroom-outline-lesson" data-lesson={lesson.key} data-done={lesson.done||undefined} disabled={lesson.released===false} onClick={()=>setLessonKey(lesson.key)}>
                    <Icon size={15} aria-hidden="true"/><span>{lesson.title}</span>
                  </button>
                </li>;
              })}
            </ul>
          </div>)}
        </div>
      </aside>
      <div className="classroom-lesson" data-testid="classroom-lesson">
        <header className="classroom-lesson-head">
          <p className="classroom-eyebrow">{activeLesson?.moduleTitle}</p>
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
          <button type="button" data-testid="classroom-prev" onClick={goPrev} disabled={activeIndex<=0}><ArrowLeft size={16} aria-hidden="true"/>{t('classroom.prev')}</button>
          <button type="button" className={activeLesson?.done?'is-done':undefined} data-testid="classroom-mark-complete" disabled={!activeLesson||locked||saving||(activeLesson.kind==='workshop'&&activeLesson.page!=='lesson')} onClick={()=>action?action(markComplete):markComplete()}>
            <Check size={16} aria-hidden="true"/>{activeLesson?.done?t('classroom.completed'):t('classroom.markComplete')}
          </button>
          <button type="button" className="gradient" data-testid="classroom-next" onClick={goNext} disabled={activeIndex<0||activeIndex>=lessonsFor.length-1}>{t('classroom.next')}<ArrowRight size={16} aria-hidden="true"/></button>
        </nav>
      </div>
      <aside className="classroom-right" aria-label={t('classroom.rightLabel')} data-testid="classroom-right">
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
            {facilitator&&onAdmin&&<li><button type="button" onClick={onAdmin}>{t('nav.admin')}</button></li>}
          </ul>
        </section>
      </aside>
    </div>;
  }

  return <div className="classroom-shell" data-testid="classroom-shell" data-screen={screen}>
    <header className="classroom-topbar">
      <button type="button" className="classroom-brand" onClick={backHome}>AetherLink <span>Academy</span></button>
      <nav className="classroom-top-actions" aria-label={t('classroom.chromeLabel')}>
        <button type="button" className={screen==='home'?'is-active':undefined} data-testid="classroom-nav-home" onClick={backHome}><BookOpen size={16} aria-hidden="true"/>{t('classroom.nav.classroom')}</button>
        {facilitator&&onAdmin&&<button type="button" data-testid="nav-admin" onClick={onAdmin}><LayoutGrid size={16} aria-hidden="true"/>{t('nav.admin')}</button>}
        {account}
        <span className="classroom-avatar" aria-label={avatarLabel}>{(avatarLabel||'?').slice(0,2).toUpperCase()}</span>
      </nav>
    </header>
    <div className="classroom-body">{mainBody}</div>
    <footer className="classroom-bottom" data-testid="classroom-bottom">
      <span>{room?.code?`${t('roster.roomCode')} ${room.code}`:t('classroom.bottom.empty')}</span>
      {room&&<span>{t('classroom.bottom.roundDay',{round:room.round,day:room.day})}</span>}
      {busy&&<span>{t('common.loading')}</span>}
    </footer>
  </div>;
}
