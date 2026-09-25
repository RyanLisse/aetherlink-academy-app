import React,{useEffect,useState,useRef} from 'react';
import {Search,Sparkles,ArrowRight,BookOpen,FileText,Check,Copy,Download,Target} from 'lucide-react';
import {api} from './api';
import {useT,useI18n} from './i18n';
import {LabEmbed} from './LabEmbed';

function routeName(t,key){
  return ({guided:t('route.guided'),standard:t('route.standard'),stretch:t('route.stretch')})[key]||key;
}

export function Knowledge(){
  const t=useT();
  const [query,setQuery]=useState('');
  const [lessons,setLessons]=useState([]);
  const [error,setError]=useState('');
  useEffect(()=>{let active=true;api('knowledge?q='+encodeURIComponent(query)).then(d=>{if(active)setLessons(d.lessons);}).catch(e=>setError(e.message));return()=>{active=false;};},[query]);
  return <div className="knowledge"><label className="search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('knowledge.search')} aria-label={t('knowledge.searchLabel')}/></label>{error&&<p role="alert">{error}</p>}<div className="lesson-list">{lessons.map(l=><details key={l.id}><summary><BookOpen size={18}/><span>{l.title}<small>{l.id}</small></span><span className="detail-plus">+</span></summary><p>{l.body}</p><div className="exercise"><strong>{t('knowledge.try')}</strong><p>{l.exercise}</p></div><small className="muted">{l.source}</small></details>)}{!lessons.length&&<p>{t('knowledge.empty')}</p>}</div></div>;
}

export function Coach({room}){
  const t=useT();
  const {locale}=useI18n();
  const cacheKey=`academy-agent-setup:${room.id}:${room.me.id}`;
  const validSetup=value=>value?.participantId===room.me.id&&value?.roomId===room.id&&value?.expiresAt>Date.now()&&typeof value.instructions==='string'&&value.instructions.length>0;
  const [setup,setSetup]=useState(()=>{try{const value=JSON.parse(sessionStorage.getItem(cacheKey)||'null');return validSetup(value)?value:null;}catch{return null;}});
  const [error,setError]=useState('');
  const [copied,setCopied]=useState(false);
  const [busy,setBusy]=useState(false);
  async function copyForClaude(){
    if(busy)return;setBusy(true);setError('');setCopied(false);
    const pending=validSetup(setup)?Promise.resolve(setup):api('agent-setup',{}).then(result=>{if(!validSetup(result))throw Error(t('coach.invalidSetup'));setSetup(result);try{sessionStorage.setItem(cacheKey,JSON.stringify(result));}catch{}return result;});
    try{
      if(navigator.clipboard?.write&&globalThis.ClipboardItem)await navigator.clipboard.write([new ClipboardItem({'text/plain':pending.then(result=>new Blob([result.instructions],{type:'text/plain'}))})]);
      else{const result=await pending;if(!navigator.clipboard?.writeText)throw Error('clipboard');await navigator.clipboard.writeText(result.instructions);}
      setCopied(true);
    }catch{try{await pending;setError(t('coach.copyBlocked'));}catch(err){setError(err.message);}}finally{setBusy(false);}
  }
  const mcpTime=room.me.lastMcp?new Date(room.me.lastMcp).toLocaleTimeString(locale==='nl'?'nl-NL':'en-GB'):null;
  return <section className="panel content-panel"><p className="cyan"><Sparkles size={16}/>{t('coach.eyebrow')}</p><h2>{t('coach.title')}</h2><p className="lede">{t('coach.lede')}</p><div className="notice"><strong>{mcpTime?t('coach.lastMcp',{time:mcpTime}):t('coach.noMcp')}</strong><p>{t('coach.mcpNote')}</p></div>{room.me.role==='Facilitator'?<div className="notice"><strong>{t('coach.needParticipant')}</strong><p>{t('coach.needParticipantBody')}</p></div>:<><button className="gradient" type="button" disabled={busy} onClick={copyForClaude}><Copy size={19}/>{copied?t('coach.copied'):t('coach.copy')}</button>{error&&<p className="error" role="alert">{error}</p>}{setup&&<details open={Boolean(error)}><summary>{t('coach.viewInstructions')}</summary><label>{t('coach.instructionsLabel')}<textarea readOnly rows={Math.min(16,Math.max(5,setup.instructions.split('\n').length))} value={setup.instructions} onFocus={event=>event.currentTarget.select()} aria-label={t('coach.instructionsLabel')}/></label></details>}<p className="muted">{t('coach.privateNote')}</p></>}<div className="coach-context"><span><Target size={17}/>{t('coach.ctx.repo')}</span><span><FileText size={17}/>{t('coach.ctx.intent')}</span><span><BookOpen size={17}/>{t('coach.ctx.lessons')}</span></div><div className="prompt"><strong>{t('coach.pasteTitle')}</strong><p>{t('coach.pasteBody')}</p></div><h3>{t('coach.searchHeading')}</h3><Knowledge/></section>;
}

export function CopyConfiguration({value,label}){
  const t=useT();
  const resolvedLabel=label||t('copy.configLabel');
  const field=useRef(null);
  const [message,setMessage]=useState('');
  function select(){field.current?.focus();field.current?.select();setMessage(t('copy.selected'));}
  async function copy(){try{if(!navigator.clipboard?.writeText)throw Error('clipboard unavailable');await navigator.clipboard.writeText(value);setMessage(t('copy.done'));}catch{select();setMessage(t('copy.fallback'));}}
  return <div className="copy-configuration"><label>{resolvedLabel}<textarea ref={field} aria-label={resolvedLabel} readOnly value={value} rows={Math.min(14,Math.max(3,value.split('\n').length))} spellCheck={false} onFocus={e=>e.currentTarget.select()}/></label><div className="form-row"><button type="button" onClick={copy}><Copy size={16}/>{t('copy.button')}</button><button type="button" onClick={select}>{t('copy.select')}</button></div>{message&&<p role="status">{message}</p>}</div>;
}

function ProgressivePath({steps,compact=false}){
  const t=useT();
  if(!steps?.length)return null;
  return <div className={compact?'progressive-path compact':'progressive-path'} aria-label={t('path.aria')}>{steps.map((s,i)=><div className="progressive-step" key={s.id||i}><span className="agent-badge">{s.badge}</span><strong>{s.title}{s.level==='stretch'&&<small className="muted"> · {t('path.stretch')}</small>}</strong><p>{s.goal}</p>{!compact&&s.doneWhen&&<small><span className="muted">{t('path.doneWhen')}</span> {s.doneWhen}</small>}{compact&&s.hint&&<small className="muted">{s.hint}</small>}</div>)}</div>;
}
export function Lesson({room,action,busy,day}){
  const t=useT();
  const [pack,setPack]=useState(null);
  const [error,setError]=useState('');
  const [answers,setAnswers]=useState({});
  const [result,setResult]=useState(null);
  const attempt=useRef(null);
  const chosen=day===undefined?{}:{day};
  const shownDay=day??room.day,practice=shownDay!==room.day;
  const openAttempt=()=>attempt.current??=api('quiz/start',chosen).catch(e=>{attempt.current=null;throw e;});
  const submitQuiz=async()=>{try{const {attemptId}=await openAttempt();setResult(await api('quiz',{...chosen,attemptId,answers}));}catch(e){if(e.status===410)setAnswers({});throw e;}finally{attempt.current=null;}};
  useEffect(()=>{let active=true;attempt.current=null;setPack(null);setError('');setAnswers({});setResult(null);api(day===undefined?'day-pack':`day-pack?day=${day}`).then(d=>{if(active)setPack(d);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[room.day,day]);
  if(error)return <section className="panel content-panel"><p className="cyan">{t('lesson.eyebrow')}</p><h2>{t('lesson.noneTitle')}</h2><p className="lede" role="alert">{error}</p><p className="muted">{t('lesson.noneHint')}</p></section>;
  if(!pack)return <section className="panel content-panel"><p className="muted">{t('lesson.loading')}</p></section>;
  const lesson=pack.lesson,questions=pack.quiz.questions;
  return <section className="panel content-panel"><p className="cyan">{lesson.kicker}</p><h2>{lesson.title}</h2><p className="lede">{lesson.lede}</p>{pack.steps?.length>0&&<><p className="cyan">{t('path.label')}</p><ProgressivePath steps={pack.steps}/></>}<div className="learning-loop">{lesson.loop.map((s,i)=><div key={s.label}><span>0{i+1}</span><strong>{s.label}</strong><small>{s.prompt}</small></div>)}</div><div className="worked"><BookOpen size={20}/><div><h3>{t('lesson.explained')}</h3><p>{lesson.workedExample}</p></div></div>{pack.materials?.length>0&&<><h3>{t('lesson.materials')}</h3><ul className="materials">{pack.materials.map(m=><li key={m.label}>{m.href?<a href={m.href} target={m.href.startsWith('http')?'_blank':undefined} rel="noreferrer">{m.label}</a>:<span>{m.label}: <strong>OPEN</strong> · {m.open}</span>}{m.note&&<small className="muted"> · {m.note}</small>}</li>)}</ul></>}{pack.labs?.length>0&&<section className="lab-slot" aria-label={t('lab.heading')}><h3>{t('lab.heading')}</h3>{pack.labs.map(lab=><LabEmbed key={lab.id} lab={lab} preview={room.me.role==='Facilitator'} saved={room.me.progressByDay?.[String(shownDay)]?.labs?.[lab.id]}/>)}</section>}<h3>{t('lesson.quickCheck')}</h3><p className="muted">{practice?t('naslag.practiceHint',{day:shownDay}):t('lesson.quizHint')}</p><form onSubmit={e=>{e.preventDefault();action(submitQuiz);}}>{questions.map((q,i)=><fieldset key={q.id}><legend>{i+1}. {q.question}</legend>{q.options.map(o=><label className="radio" key={o.id}><input type="radio" name={q.id} required checked={answers[q.id]===o.id} onChange={()=>{setAnswers({...answers,[q.id]:o.id});openAttempt().catch(()=>{});}}/>{o.label}</label>)}</fieldset>)}<button className="gradient" disabled={busy||room.me.role==='Facilitator'||room.readOnly}>{t('lesson.submit')}<ArrowRight size={17}/></button></form>{result&&<div className="notice" role="status"><strong>{result.score}/{result.total} · {routeName(t,result.route)}</strong><p>{result.note}</p><p>{practice?t('naslag.practiceResult',{day:shownDay}):t('lesson.soloHint')}</p></div>}</section>;
}

export function Solo({room,action,busy,onNavigate}){
  const t=useT();
  const [pack,setPack]=useState(null);
  const [error,setError]=useState('');
  const [sent,setSent]=useState(false);
  const participant=room.me.role!=='Facilitator';
  const tasks=useFetched(participant?'tasks':null,[room.day,trailKey(room)])?.tasks;
  const submittable=(tasks||[]).filter(task=>task.status==='open'||task.status==='changes_requested');
  useEffect(()=>{let active=true;setPack(null);setError('');setSent(false);api('day-pack').then(d=>{if(active)setPack(d);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[room.day]);
  if(error)return <section className="panel content-panel"><p className="cyan">{t('solo.eyebrow')}</p><h2>{t('solo.noneTitle')}</h2><p className="lede" role="alert">{error}</p><p className="muted">{t('solo.noneHint')}</p></section>;
  if(!pack)return <section className="panel content-panel"><p className="muted">{t('solo.loading')}</p></section>;
  const mission=pack.mission;
  const files=mission.starterFiles||['README.md','CLAUDE.md','package.json','status.mjs','status.test.mjs'];
  const hintText=(mission.hints||[]).join(' ');
  const allowedText=(mission.allowed||[]).join(' ');
  return <section className="panel content-panel"><p className="cyan">{t('solo.meta',{minutes:mission.minutes||25,id:mission.id})}</p><h2>{mission.title}</h2><p className="lede">{mission.goal}</p>{mission.starterNote&&<p className="muted">{mission.starterNote}</p>}{pack.steps?.length>0&&<><p className="cyan">{t('path.label')}</p><ProgressivePath steps={pack.steps} compact/></>}<div className="mission-goal"><Target size={22}/><div><h3>{t('solo.goal')}</h3><p>{mission.goal}</p></div></div>{tasks&&<TaskList tasks={tasks}/>}<label className="route-select">{t('solo.helpAmount')}<select value={room.me.route||'standard'} disabled={room.me.role==='Facilitator'} onChange={e=>action(()=>api('route',{route:e.target.value}))}>{['guided','standard','stretch'].map(v=><option value={v} key={v}>{routeName(t,v)}</option>)}</select></label><details className="hint" open={room.me.route==='guided'}><summary>{t('solo.hintSummary')}</summary><p>{hintText||t('solo.hintFallback')}</p></details>{room.me.route==='stretch'&&<div className="notice"><strong>{t('solo.stretch')}</strong><p>{mission.stretch||t('solo.stretchFallback')}</p></div>}<h3>{t('solo.workspace')}</h3><p className="muted">{t('solo.workspaceHint')}</p><div className="files">{files.map(f=><a key={f} href={'/game/starter/'+f} download={f}><FileText size={16}/>{f}<Download size={15}/></a>)}</div><details className="hint"><summary>{t('solo.allowedSummary')}</summary><p>{allowedText} {mission.stop} {t('solo.noPush')}</p></details><button className="text-button" onClick={()=>onNavigate('coach')}><Sparkles size={17}/>{t('solo.openCoach')}</button><h3>{t('solo.submitHeading')}</h3><p className="muted">{t('solo.submitHint')}</p><form onSubmit={e=>{e.preventDefault();const form=e.currentTarget;const values=Object.fromEntries(new FormData(form));action(async()=>{await api('evidence',{...values,requestId:form.dataset.requestId||(form.dataset.requestId=crypto.randomUUID())});setSent(true);form.reset();delete form.dataset.requestId;});}}>{tasks&&<label>{t('tasks.field')}<select name="taskId" key={submittable.map(task=>task.id).join()} defaultValue={submittable[0]?.id||''}>{submittable.map(task=><option value={task.id} key={task.id}>{task.title}</option>)}<option value="">{t('tasks.none')}</option></select></label>}{[['finding',t('solo.finding')],['command',t('solo.command')],['observed',t('solo.observed')],['limitation',t('solo.limitation')]].map(([n,l])=><label key={n}>{l}<textarea required name={n} maxLength={n==='command'?1000:4000}/></label>)}<button className="gradient" disabled={busy||room.me.role==='Facilitator'}>{t('solo.submit')}<ArrowRight size={17}/></button>{sent&&<p className="success" role="status"><Check size={16}/>{t('solo.sent')}</p>}</form></section>;
}

export function Review({room,action,busy}){
  const t=useT();
  const {locale}=useI18n();
  const [sent,setSent]=useState(false);
  const [criteria,setCriteria]=useState(null);
  useEffect(()=>{let active=true;api('day-pack').then(d=>{if(active)setCriteria(d.reviewCriteria||null);}).catch(()=>{if(active)setCriteria(null);});return()=>{active=false;};},[room.day]);
  const statusLabel={pending:t('review.status.pending'),accepted:t('review.status.accepted'),'needs-work':t('review.status.needs-work')};
  return <section className="panel content-panel"><p className="cyan">{t('review.eyebrow')}</p><h2>{t('review.title')}</h2><p className="lede">{t('review.lede')}</p>{criteria?.length>0&&<div className="notice"><strong>{t('review.criteria')}</strong><ul className="criteria-list">{criteria.map(c=><li key={c}>{c}</li>)}</ul></div>}{room.me.role==='Facilitator'?<TaskQueue room={room} action={action} busy={busy} path="tasks/queue" heading="queue"/>:<TaskQueue room={room} action={action} busy={busy} path="tasks/peer" heading="peer"/>}<SuggestionReview room={room} action={action} busy={busy}/><h3>{t('review.evidenceHeading',{count:room.evidence.length})}</h3>{!room.evidence.length&&<div className="empty"><FileText size={30}/><p>{t('review.empty')}</p><small>{criteria?.length?t('review.emptyCriteria'):t('review.emptyDefault')}</small></div>}{room.evidence.map(e=><article className="evidence" key={e.id}><div><strong>{e.name}</strong><span>{statusLabel[e.status]||e.status}</span></div><small>{e.source}{e.day!=null?` · ${t('review.day',{day:e.day})}`:''}{e.taskId?` · ${t('review.taskLabel',{task:e.taskId})}`:''} · {new Date(e.at).toLocaleString(locale==='nl'?'nl-NL':'en-GB')}</small><p>{e.finding}</p><pre>{e.command}{'\n'}{e.observed}</pre><p><strong>{t('review.limitation')}</strong> {e.limitation}</p>{e.review&&<p><strong>{t('review.reviewLabel')}</strong> {e.review.note}</p>}{['Driver','Facilitator'].includes(room.me.role)&&e.personId!==room.me.id&&!e.taskId&&<form onSubmit={event=>{event.preventDefault();const form=event.currentTarget;const values=Object.fromEntries(new FormData(form));action(async()=>{await api('review',{id:e.id,...values,requestId:form.dataset.requestId||(form.dataset.requestId=crypto.randomUUID())});delete form.dataset.requestId;});}}><label>{t('review.note')}<textarea name="note" required maxLength={4000}/></label><div className="form-row"><select aria-label={t('review.decision')} name="status"><option value="accepted">{t('review.accepted')}</option><option value="needs-work">{t('review.needsWork')}</option></select><button disabled={busy}>{t('review.save')}</button></div></form>}</article>)}<h3>{t('review.handoffTitle')}</h3><form onSubmit={e=>{e.preventDefault();const form=e.currentTarget;const data=Object.fromEntries(new FormData(form));action(async()=>{await api('handoff',{...data,requestId:form.dataset.requestId||(form.dataset.requestId=crypto.randomUUID())});delete form.dataset.requestId;setSent(true);});}}>{[['decision',t('review.decisionField')],['checked',t('review.checkedField')],['open',t('review.openField')]].map(([n,l])=><label key={n}>{l}<textarea name={n} required maxLength={4000}/></label>)}<button className="gradient" disabled={busy||!['Driver','Facilitator'].includes(room.me.role)}>{t('review.handoffSubmit')}<ArrowRight size={17}/></button>{sent&&<p className="success" role="status">{t('review.handoffSaved')}</p>}</form>{room.handoffs.map(h=><div className="notice" key={h.id}><strong>{t('review.nextOwner',{next:h.next})}</strong><p>{h.decision}</p><small>{t('review.openLabel',{open:h.open})}</small></div>)}</section>;
}

function Reflection({room,onSaved}){
  const t=useT();
  const existing=room.me?.progressByDay?.[String(room.day)]?.reflection;
  const [learned,setLearned]=useState(existing?.learned||'');
  const [next,setNext]=useState(existing?.next||'');
  const [saved,setSaved]=useState(Boolean(existing));
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  return <form className="reflection" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{await api('reflection',{learned,next});setSaved(true);onSaved?.();}catch(err){setError(err.message);}finally{setBusy(false);}}}><h3>{t('reflection.title',{day:room.day})}</h3><p className="muted">{t('reflection.privacy')}</p>{error&&<p className="error" role="alert">{error}</p>}<label>{t('reflection.learned')}<textarea required maxLength={4000} value={learned} onChange={e=>{setLearned(e.target.value);setSaved(false);}}/></label><label>{t('reflection.next')}<textarea required maxLength={4000} value={next} onChange={e=>{setNext(e.target.value);setSaved(false);}}/></label><button disabled={busy}>{saved?t('reflection.saved'):t('reflection.save')}</button></form>;
}

export function Route({room,onNavigate}){
  const t=useT();
  const [days,setDays]=useState([]);
  const [error,setError]=useState('');
  useEffect(()=>{let active=true;api('day-route').then(d=>{if(active)setDays(d.days||[]);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[room.day,room.version,room.me?.quiz?.at,room.evidence?.length,room.me?.progressByDay]);
  const chip=(label,on)=><span className={on?'progress-chip on':'progress-chip'} key={label}>{label}</span>;
  return <section className="panel content-panel"><p className="cyan">{t('route.eyebrow')}</p><h2>{t('route.title')}</h2><p className="lede">{t('route.lede')}</p><p className="muted">{t('route.preface')}</p>{error&&<p role="alert">{error}</p>}<div className="day-list">{days.map(d=>{const prog=d.progress||{};return <div className={room.day===d.day?'current':''} key={d.day}><span className="day-number">0{d.day}</span><div><small>{t('route.supportDay',{day:d.day})} · {d.tag}</small><h3>{d.title}</h3><p>{d.blurb}</p><div className="progress-chips" aria-label={t('route.progressAria',{day:d.day})}>{chip(prog.hasQuiz?t('route.quizScore',{score:prog.quizScore}):t('route.quiz'),prog.hasQuiz)}{chip(prog.route?routeName(t,prog.route):t('route.helpChoice'),prog.hasRoute)}{chip(prog.hasEvidence?t('route.evidenceCount',{count:prog.evidenceCount}):t('route.evidence'),prog.hasEvidence)}{chip(prog.hasReview?t('route.reviewCount',{count:prog.reviewedCount}):t('route.review'),prog.hasReview)}{chip(t('route.handoff'),prog.hasHandoff)}{chip(t('route.reflection'),prog.hasReflection)}{d.labsTotal>0&&chip(t('route.labs',{done:prog.labsCompleted||0,total:d.labsTotal}),prog.labsCompleted>0)}</div></div></div>;})}</div>{room.me.role!=='Facilitator'&&<Reflection key={room.day} room={room} onSaved={()=>setDays(current=>current.map(d=>d.day===room.day?{...d,progress:{...d.progress,hasReflection:true}}:d))}/>}<button className="gradient" onClick={()=>onNavigate('lesson')}>{t('route.toLesson')}<ArrowRight size={17}/></button></section>;
}

export function Debrief({room}){
  const t=useT();
  const [data,setData]=useState(null);
  const [error,setError]=useState('');
  useEffect(()=>{let active=true;api('debrief').then(d=>{if(active)setData(d);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[room.day,room.serverTime]);
  if(error)return <section className="panel content-panel"><p role="alert">{error}</p></section>;
  if(!data)return <section className="panel content-panel"><p className="muted">{t('debrief.loading')}</p></section>;
  return <section className="panel content-panel"><p className="cyan">{t('debrief.eyebrow')}</p><h2>{t('debrief.title',{name:data.name,day:data.day})}</h2><p className="lede">{t('debrief.lede')}</p><div className="day-list">{data.members.map(member=><div key={member.id}><span className="day-number">{member.help?'!':'·'}</span><div><h3>{member.name}</h3><p>{t('debrief.memberStats',{quiz:member.progress.quizScore??'—',evidence:member.progress.evidenceCount,review:member.progress.reviewedCount,accepted:member.progress.acceptedCount})}</p><div className="progress-chips">{chipLabel(member.progress.hasReflection,t('route.reflection'))}{chipLabel(member.progress.hasHandoff,t('route.handoff'))}{member.help&&<span className="progress-chip on">{t('debrief.helpAsked')}</span>}</div>{member.progress.reflection&&<div className="notice"><strong>{t('debrief.reflection')}</strong><p>{member.progress.reflection.learned}</p><small>{t('debrief.nextPractice',{next:member.progress.reflection.next})}</small></div>}</div></div>)}</div><h3>{t('debrief.handoffs')}</h3>{!data.handoffs.length&&<p className="muted">{t('debrief.noHandoffs')}</p>}{data.handoffs.map(h=><div className="notice" key={h.id}><strong>{h.next}</strong><p>{h.decision}</p><small>{t('review.openLabel',{open:h.open})}</small></div>)}<a className="text-button" href="/game/debrief/export" download><Download size={16}/>{t('debrief.export')}</a></section>;
}

const chipLabel=(on,label)=><span className={on?'progress-chip on':'progress-chip'}>{label}</span>;

function SuggestionReview({room,action,busy}){
  const t=useT();
  const [items,setItems]=useState([]);
  const [error,setError]=useState('');
  useEffect(()=>{let active=true;const poll=()=>api('suggestions').then(d=>{if(active)setItems(d);}).catch(e=>{if(active)setError(e.message);});poll();const timer=setInterval(poll,3000);return()=>{active=false;clearInterval(timer);};},[]);
  const statusMap={pending:t('suggestions.pending'),accepted:t('suggestions.accepted'),rejected:t('suggestions.rejected')};
  return <><h3>{t('suggestions.title')}</h3>{error&&<p role="alert">{error}</p>}{!items.length&&<p className="muted">{t('suggestions.empty')}</p>}{items.map(m=><article className="evidence" key={m.id}><small>{m.by} · {statusMap[m.status]||m.status}</small><p><strong>{t('suggestions.current')}</strong> {m.quote}</p><p><strong>{t('suggestions.proposal')}</strong> {m.content||t('suggestions.delete')}</p>{m.status==='pending'&&['Driver','Facilitator'].includes(room.me.role)&&<div className="form-row"><button disabled={busy} onClick={()=>action(()=>api('suggestion-review',{id:m.id,decision:'accept',requestId:crypto.randomUUID()}))}>{t('suggestions.accept')}</button><button disabled={busy} onClick={()=>action(()=>api('suggestion-review',{id:m.id,decision:'reject',requestId:crypto.randomUUID()}))}>{t('suggestions.reject')}</button></div>}</article>)}</>;
}

const trailKey=room=>room.evidence.map(e=>e.id+':'+e.status).join(',');

function useFetched(path,deps){
  const [data,setData]=useState(null);
  const [tick,setTick]=useState(0);
  useEffect(()=>{if(!path)return;let active=true;api(path).then(d=>{if(active)setData(d);}).catch(()=>{if(active)setData(null);});return()=>{active=false;};},[path,tick,...deps]);
  return path&&data?{...data,reload:()=>setTick(n=>n+1)}:null;
}

function TaskList({tasks}){
  const t=useT();
  return <><h3>{t('tasks.title')}</h3><p className="muted">{t('tasks.lede')}</p>{!tasks.length&&<p className="muted">{t('tasks.empty')}</p>}<div className="task-list">{tasks.map(task=>{const last=task.submissions.at(-1);return <article className="task" key={task.id}><div><strong>{task.title}</strong><span className={'task-chip '+task.status}>{t('tasks.status.'+task.status)}</span></div><small>{task.id}{task.submissions.length?` · ${t('tasks.attempts',{count:task.submissions.length})}`:''}</small>{last?.review&&<p><strong>{t('tasks.feedback',{name:last.review.reviewer?.name||'Facilitator'})}</strong> {last.review.note}</p>}</article>;})}</div></>;
}

function TaskQueue({room,action,busy,path,heading}){
  const t=useT();
  const {locale}=useI18n();
  const data=useFetched(path,[room.day,trailKey(room)]);
  if(!data)return null;
  const decide=(item,event)=>{event.preventDefault();const form=event.currentTarget;const values=Object.fromEntries(new FormData(form,event.nativeEvent.submitter));action(async()=>{await api('review',{id:item.evidenceId,...values,requestId:form.dataset.requestId||(form.dataset.requestId=crypto.randomUUID())});delete form.dataset.requestId;data.reload();});};
  return <><h3>{t(heading+'.title',{count:data.queue.length})}</h3><p className="muted">{t(heading+'.lede')}</p>{!data.queue.length&&<p className="muted">{t('queue.empty')}</p>}{data.queue.map(item=><article className="evidence" key={item.evidenceId}><div><strong>{item.name} · {item.taskTitle}</strong><span>{t('queue.attempt',{attempt:item.attempt})}</span></div><small>{t('review.day',{day:item.day})} · {new Date(item.at).toLocaleString(locale==='nl'?'nl-NL':'en-GB')}</small><p>{item.finding}</p><pre>{item.command}{'\n'}{item.observed}</pre><p><strong>{t('review.limitation')}</strong> {item.limitation}</p><form onSubmit={event=>decide(item,event)}><label>{t('queue.note')}<textarea name="note" required maxLength={4000}/></label><div className="form-row"><button name="status" value="accepted" disabled={busy}>{t('queue.approve')}</button><button name="status" value="needs-work" disabled={busy}>{t('queue.requestChanges')}</button></div></form></article>)}{data.members&&<><h3>{t('queue.statusTitle',{day:data.day})}</h3><div className="task-status">{data.members.map(member=><div key={member.id}><strong>{member.name}</strong><div className="progress-chips">{member.tasks.map(task=><span className={'task-chip '+task.status} key={task.id}>{task.title} · {t('tasks.status.'+task.status)}</span>)}</div></div>)}</div></>}</>;
}
