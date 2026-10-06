import React from 'react';
import {ArrowRight,BookOpen,Check,ClipboardCheck,ExternalLink,Target,Users} from 'lucide-react';
import {useT,useI18n} from './i18n';
import {RemoteStatus,useRemote} from './status';
import {coursePosition} from './panels';

const DONE=new Set(['approved','auto_approved']);
export const clock=seconds=>{const s=Math.max(0,Math.round(seconds||0));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;};

export function Today({room,onNavigate}){
  const t=useT();
  const {locale}=useI18n();
  const evidenceKey=room.evidence.map(e=>e.id+':'+e.status).join(',');
  const pack=useRemote(`day-pack?locale=${locale}`,[room.day]);
  const trail=useRemote(`tasks?locale=${locale}`,[room.day,evidenceKey]);
  const tasks=trail.data?.tasks||[];
  const required=tasks.filter(task=>task.required!==false);
  const done=required.filter(task=>DONE.has(task.status)).length;
  const next=required.find(task=>task.status==='changes_requested')||required.find(task=>task.status==='open')||null;
  const allDone=required.length>0&&done===required.length;
  const saved=room.me.progressByDay?.[String(room.day)]||{};
  const quizTotal=pack.data?.quiz?.questions?.length||0;
  const myEvidence=room.evidence.filter(e=>e.personId===room.me.id&&Number(e.day)===room.day).length;
  const online=room.members.filter(m=>m.online).length;
  const round=room.running?t('room.practice'):room.remaining===0?t('room.timeUp'):t('room.paused');
  const mission=pack.data?.mission;
  const title=mission?.title||pack.data?.lesson?.title;
  const primary=allDone
    ?{view:'review',label:t('today.handoff'),Icon:ClipboardCheck}
    :{view:'solo',label:done||tasks.some(task=>task.status!=='open')?t('today.continue'):t('today.start'),Icon:Target};
  const steps=[
    ['lesson',BookOpen,t('today.step.lesson'),t('today.step.lessonHelp'),null,false],
    ['solo',Target,t('today.step.assignment'),t('today.step.assignmentHelp'),required.length?t('today.tasksDone',{done,total:required.length}):null,allDone],
    ['lesson',Check,t('today.step.quiz'),t('today.step.quizHelp'),saved.quizScore!=null?t('today.quizScore',{score:saved.quizScore,total:quizTotal||saved.quizScore}):quizTotal?t('today.notStarted'):null,quizTotal>0&&saved.quizScore===quizTotal],
    ['review',ClipboardCheck,t('today.step.review'),t('today.step.reviewHelp'),myEvidence?t('today.evidence',{count:myEvidence}):null,false],
  ];
  return <section className="panel content-panel today-panel" data-testid="today-panel">
    <p className="cyan">{t('today.eyebrow',{day:coursePosition(room)})}</p>
    {pack.status!=='ready'?<RemoteStatus remote={pack} loading={t('today.loading')}/>:<>
      <h2>{title}</h2>
      {mission?.goal&&<p className="lede">{mission.goal}</p>}
      <div className="today-next" data-testid="today-next">
        <div>
          <small>{t('today.nextLabel')}</small>
          {trail.status==='ready'
            ?<strong>{allDone?t('today.allDone'):next?next.title:t('today.waiting')}</strong>
            :<RemoteStatus remote={trail} loading={t('tasks.loading')}/>}
          {next&&next.status!=='open'&&<span className="progress-chip">{t(`tasks.status.${next.status}`)}</span>}
          {required.length>0&&<p className="muted">{t('today.tasksDone',{done,total:required.length})}</p>}
        </div>
        <button type="button" className="gradient" onClick={()=>onNavigate(primary.view)}><primary.Icon size={17} aria-hidden="true"/>{primary.label}<ArrowRight size={17} aria-hidden="true"/></button>
      </div>
    </>}
    <h3>{t('today.planTitle')}</h3>
    <ol className="today-steps">
      {steps.map(([view,Icon,label,help,status,complete],i)=><li key={label} data-state={complete?'done':'todo'}>
        <button type="button" onClick={()=>onNavigate(view)}>
          <span className="today-step-n" aria-hidden="true">{complete?<Check size={15}/>:i+1}</span>
          <span className="today-step-text"><strong>{label}</strong><small>{help}</small></span>
          {status&&<span className={complete?'progress-chip on':'progress-chip'}>{status}</span>}
          <Icon size={17} aria-hidden="true"/>
        </button>
      </li>)}
    </ol>
    <div className="today-squad" data-testid="today-squad">
      <span><Users size={16} aria-hidden="true"/>{t('today.squadOnline',{online,total:room.members.length})}</span>
      <span>{t('fac.round')} {room.round} · {round}{room.running?` · ${clock(room.remaining)}`:''}</span>
      {room.intentUrl&&<a href={room.intentUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} aria-hidden="true"/>{t('doc.open')}</a>}
      <button type="button" className="text-button" onClick={()=>onNavigate('squad')}>{t('today.openSquad')}<ArrowRight size={15} aria-hidden="true"/></button>
    </div>
  </section>;
}
