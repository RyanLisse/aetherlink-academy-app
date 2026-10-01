import React,{useState} from 'react';
import {ArrowLeft,ArrowRight,BookOpen,Check,ClipboardCheck,ClipboardList,Circle,CircleDot} from 'lucide-react';
import {api} from './api';
import {useT,useI18n} from './i18n';
import {useRemote} from './status';
import './activity-frame.css';

const ICONS={lesson:BookOpen,assignments:ClipboardList,quiz:Check,review:ClipboardCheck};

export function ActivityFrame({room,day,activity,onGo,children}){
  const t=useT();
  const {locale}=useI18n();
  const progressKey=JSON.stringify(room.me?.progressByDay||{});
  const evidenceKey=(room.evidence||[]).map(e=>`${e.id}:${e.status}`).join(',');
  const route=useRemote(`day-route?locale=${locale}`,[room.day,room.version,progressKey,evidenceKey]);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const days=route.data?.days||[];
  const summary=days.find(item=>item.day===day);
  const dayPosition=summary?.position??day;
  const activities=[
    {id:'lesson',label:t('coursePages.lesson')},
    {id:'assignments',label:t('coursePages.assignments')},
    {id:'quiz',label:t('coursePages.quiz')},
    ...(day===room.day?[{id:'review',label:t('nav.review')}]:[])
  ];
  const activeIndex=Math.max(0,activities.findIndex(item=>item.id===activity));
  const progress=summary?.progress||{};
  const isDone=id=>id==='lesson'?Boolean(progress.lessonDone):
    id==='assignments'?Boolean(summary?.tasks?.total>0&&summary.tasks.approved===summary.tasks.total):
      id==='quiz'?Boolean(progress.hasQuiz):Boolean(progress.hasHandoff);
  const lessonDone=Boolean(progress.lessonDone);
  const changeCompletion=async()=>{
    setSaving(true);setError('');
    try{
      await api('lesson-complete',{day,done:!lessonDone});
      route.reload();
    }catch(err){setError(err.message);}
    finally{setSaving(false);}
  };
  const courseName=route.data?.course?.name||t('route.title');
  const dayTitle=summary?.title||t('activity.day',{day:dayPosition});
  const activityLabel=activities.find(item=>item.id===activity)?.label||t('coursePages.lesson');
  const previousTarget=activeIndex===0?t('nav.courseOverview'):activities[activeIndex-1].label;
  const nextLabel=activeIndex===activities.length-1?t('activity.backToCourse'):t('activity.nextTo',{target:activities[activeIndex+1].label});
  const goTo=index=>{
    if(index<0){onGo('course',day);return;}
    if(index>=activities.length){onGo('course',day);return;}
    onGo(activities[index].id,day);
  };
  return <div className="activity-frame" data-testid="activity-frame">
    <nav className="activity-breadcrumb" aria-label={t('activity.breadcrumb')}>
      <button type="button" className="activity-course-link" onClick={()=>onGo('course',day)}>{courseName}</button>
      <span aria-hidden="true">/</span><span>{t('route.supportDay',{day:dayPosition})} · {dayTitle}</span>
      <span aria-hidden="true">/</span><strong>{activityLabel}</strong>
    </nav>
    <nav className="course-page-nav activity-indicators" aria-label={t('activity.progress')}>
      {activities.map(item=>{
        const active=item.id===activity,done=isDone(item.id);
        const Icon=done?Check:active?CircleDot:ICONS[item.id]||Circle;
        return <button key={item.id} type="button" aria-current={active?'page':undefined} aria-label={item.label}
          data-state={active?'current':done?'done':'todo'} data-complete={done||undefined}
          onClick={()=>onGo(item.id,day)}>
          <Icon size={17} aria-hidden="true"/><span>{item.label}</span>
        </button>;
      })}
    </nav>
    <div className="activity-frame-card"><div className="activity-frame-content">{children}</div></div>
    {error&&<p className="error activity-frame-error" role="alert">{error}</p>}
    <nav className="activity-frame-bottom" aria-label={t('activity.pagination')}>
      <button type="button" onClick={()=>goTo(activeIndex-1)} disabled={activeIndex===0}>
        <ArrowLeft size={17} aria-hidden="true"/>{t('activity.previousTo',{target:previousTarget})}
      </button>
      <span>{t('activity.position',{current:activeIndex+1,total:activities.length})}</span>
      <div className="activity-frame-actions">
        {activity==='lesson'&&!room.readOnly&&<button type="button" className={lessonDone?'activity-complete':'activity-mark-complete'} disabled={saving} onClick={changeCompletion}>
          <Check size={17} aria-hidden="true"/>{saving?t('activity.saving'):lessonDone?t('activity.lessonComplete'):t('activity.markLessonComplete')}
        </button>}
        <button type="button" className="gradient" onClick={()=>goTo(activeIndex+1)}>
          {nextLabel}<ArrowRight size={17} aria-hidden="true"/>
        </button>
      </div>
    </nav>
  </div>;
}
