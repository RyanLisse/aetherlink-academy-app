import React,{useCallback,useEffect,useState,useRef,useMemo} from 'react';
import {Search,Sparkles,ArrowRight,BookOpen,FileText,Check,Copy,Download,Target,Columns3,ClipboardList,ClipboardCheck,Circle,CircleDot,ChevronDown,ChevronRight,Lock,Lightbulb,Workflow,Wrench,Layers,ZoomIn,X} from 'lucide-react';
import {api} from './api';
import {useT,useI18n} from './i18n';
import {LabEmbed,LabSlotEmpty} from './LabEmbed';
import {ConceptSimSlot} from './ConceptSim';
import {StatusState,RemoteStatus,useRemote} from './status';
import {ClassroomExercises,PairedCodeExample} from './exercises';
import {OfficialDocs} from './official-docs';
import './learning-activities.css';
// AET-120: Coach Connect status chrome runs on shadcn/ui primitives; the testids,
// data-status contract and verified-after-tool-call behaviour (AET-126) are unchanged.
import {Alert,AlertDescription,AlertTitle} from '@/components/ui/alert';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {RadioGroup,RadioGroupItem} from '@/components/ui/radio-group';
import {Textarea} from '@/components/ui/textarea';

export const coursePosition=room=>room.course?room.course.days.findIndex(entry=>entry.day===room.day)+1:room.day;

function routeName(t,key){
  return ({guided:t('route.guided'),standard:t('route.standard'),stretch:t('route.stretch')})[key]||key;
}

export function Knowledge(){
  const t=useT();
  const {locale}=useI18n();
  const [query,setQuery]=useState('');
  const [lessons,setLessons]=useState([]);
  const [error,setError]=useState('');
  useEffect(()=>{let active=true;api(`knowledge?${new URLSearchParams({q:query,locale})}`).then(d=>{if(active)setLessons(d.lessons);}).catch(e=>setError(e.message));return()=>{active=false;};},[query,locale]);
  return <div className="knowledge"><label className="search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('knowledge.search')} aria-label={t('knowledge.searchLabel')}/></label>{error&&<p role="alert">{error}</p>}<div className="lesson-list">{lessons.map(l=><details key={l.id}><summary><BookOpen size={18}/><span>{l.title}<small>{l.id}</small></span><span className="detail-plus">+</span></summary><p>{l.body}</p><div className="exercise"><strong>{t('knowledge.try')}</strong><p>{l.exercise}</p></div><small className="muted">{l.source}</small></details>)}{!lessons.length&&<p>{t('knowledge.empty')}</p>}</div></div>;
}

// Badge tone per connection status. `verified` is the only state that means a tool call landed.
const STATUS_BADGE={verified:'default',waiting:'secondary',expired:'destructive',configured:'outline'};

export function Coach({room}){
  const t=useT();
  const {locale}=useI18n();
  const facilitator=room.me.role==='Facilitator';
  const [client,setClient]=useState('claude');
  const cacheKey=`academy-agent-setup:${room.id}:${room.me.id}:${client}`;
  const validSetup=useCallback(value=>value?.participantId===room.me.id&&value?.roomId===room.id&&value?.client===client&&value?.expiresAt>Date.now()&&typeof value.instructions==='string'&&value.instructions.length>0,[room.me.id,room.id,client]);
  const [setup,setSetup]=useState(()=>{try{const value=JSON.parse(sessionStorage.getItem(cacheKey)||'null');return validSetup(value)?value:null;}catch{return null;}});
  const [error,setError]=useState('');
  const [copied,setCopied]=useState(false);
  const [busy,setBusy]=useState(false);
  useEffect(()=>{
    setCopied(false);setError('');
    try{const value=JSON.parse(sessionStorage.getItem(cacheKey)||'null');setSetup(validSetup(value)?value:null);}catch{setSetup(null);}
  },[cacheKey,validSetup]);
  async function copyForAgent(){
    if(busy)return;setBusy(true);setError('');setCopied(false);
    const pending=validSetup(setup)?Promise.resolve(setup):api('agent-setup',{client}).then(result=>{if(!validSetup({...result,client:result.client||client}))throw Error(t('coach.invalidSetup'));const stored={...result,client:result.client||client};setSetup(stored);try{sessionStorage.setItem(cacheKey,JSON.stringify(stored));}catch{}return stored;});
    try{
      if(navigator.clipboard?.write&&globalThis.ClipboardItem)await navigator.clipboard.write([new ClipboardItem({'text/plain':pending.then(result=>new Blob([result.instructions],{type:'text/plain'}))})]);
      else{const result=await pending;if(!navigator.clipboard?.writeText)throw Error('clipboard');await navigator.clipboard.writeText(result.instructions);}
      setCopied(true);
    }catch{try{await pending;setError(t('coach.copyBlocked'));}catch(err){setError(err.message);}}finally{setBusy(false);}
  }
  // eslint-disable-next-line react/purity -- expiry is intentionally checked against wall clock each render
  const expired=Boolean(setup&&setup.expiresAt<=Date.now());
  const status=expired?'expired':room.me.lastMcp?'verified':validSetup(setup)?'waiting':'configured';
  const mcpTime=room.me.lastMcp?new Date(room.me.lastMcp).toLocaleTimeString(locale==='nl'?'nl-NL':'en-GB'):null;
  const statusText=status==='verified'?t('coach.status.verified',{time:mcpTime}):t(`coach.status.${status}`);
  const copyLabel=client==='codex'?t('coach.copyCodex'):t('coach.copyClaude');
  const instructionsLabel=client==='codex'?t('coach.instructionsLabelCodex'):t('coach.instructionsLabelClaude');
  const pasteTitle=client==='codex'?t('coach.pasteTitleCodex'):t('coach.pasteTitleClaude');
  const pasteBody=client==='codex'?t('coach.pasteBodyCodex'):t('coach.pasteBodyClaude');
  const eyebrow=client==='codex'?t('coach.eyebrowCodex'):t('coach.eyebrowClaude');
  const facilitatorLede=client==='codex'?t('coach.facilitatorLedeCodex'):t('coach.facilitatorLedeClaude');
  return <section className="panel content-panel academy-ui">
    <p className="cyan"><Sparkles size={16}/>{eyebrow}</p>
    <h2>{t(facilitator?'coach.facilitatorTitle':'coach.title')}</h2>
    <p className="lede">{facilitator?facilitatorLede:t('coach.lede')}</p>
    <fieldset className="client-selector">
      <legend>{t('coach.clientLabel')}</legend>
      <RadioGroup className="client-selector-options" aria-label={t('coach.clientLabel')} value={client} onValueChange={setClient}>
        <div className="client-option"><RadioGroupItem value="claude" id="agent-client-claude"/><Label htmlFor="agent-client-claude">{t('coach.clientClaude')}</Label></div>
        <div className="client-option"><RadioGroupItem value="codex" id="agent-client-codex"/><Label htmlFor="agent-client-codex">{t('coach.clientCodex')}</Label></div>
      </RadioGroup>
    </fieldset>
    <Alert role="status" className={`notice connection-status status-${status}`} data-testid="agent-connection-status" data-status={status}>
      <AlertTitle className="connection-status-title"><Badge variant={STATUS_BADGE[status]} className="connection-status-badge">{t(`coach.statusBadge.${status}`)}</Badge><strong>{statusText}</strong></AlertTitle>
      <AlertDescription>
        <p>{t('coach.mcpNote')}</p>
        <p className="muted">{t('coach.wrongRoomHelp')}</p>
      </AlertDescription>
    </Alert>
    <Button className="gradient coach-copy" type="button" disabled={busy} onClick={copyForAgent}><Copy size={19}/>{copied?t('coach.copied'):copyLabel}</Button>
    {error&&<Alert role="alert" variant="destructive" className="coach-error"><AlertDescription>{error}</AlertDescription></Alert>}
    {setup&&<details open={Boolean(error)}><summary>{t('coach.viewInstructions')}</summary><div className="coach-instructions"><Label htmlFor="coach-instructions">{instructionsLabel}</Label><Textarea id="coach-instructions" readOnly rows={Math.min(16,Math.max(5,setup.instructions.split('\n').length))} value={setup.instructions} onFocus={event=>event.currentTarget.select()} aria-label={instructionsLabel}/></div></details>}
    <p className="muted">{t('coach.privateNote')}</p>
    <div className="coach-context"><span><Target size={17}/>{t('coach.ctx.repo')}</span><span><FileText size={17}/>{t('coach.ctx.intent')}</span><span><BookOpen size={17}/>{t('coach.ctx.lessons')}</span></div>
    <div className="prompt"><strong>{pasteTitle}</strong><p>{pasteBody}</p></div>
    <h3>{t('coach.searchHeading')}</h3>
    <Knowledge/>
  </section>;
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

function InlineCode({text}){
  return text.split('`').map((segment,index)=>index%2===1?<code key={index}>{segment}</code>:segment);
}

function ProgressivePath({steps,compact=false}){
  const t=useT();
  if(!steps?.length)return null;
  const detailed=steps.some(s=>s.instructions?.length>0);
  const className=`progressive-path${compact?' compact':''}${detailed?' detailed':''}`;
  return <div className={className} aria-label={t('path.aria')}>{steps.map((s,i)=><div className="progressive-step" key={s.id||i}><span className="agent-badge">{s.badge}</span><strong>{s.title}{s.level==='stretch'&&<small className="muted"> · {t('path.stretch')}</small>}</strong><p>{s.goal}</p>{s.instructions?.length>0&&<ol className="step-instructions">{s.instructions.map((line,j)=><li key={j}><InlineCode text={line}/></li>)}</ol>}{!compact&&s.doneWhen&&<small><span className="muted">{t('path.doneWhen')}</span> {s.doneWhen}</small>}{compact&&s.hint&&<small className="muted">{s.hint}</small>}</div>)}</div>;
}
function QuickCheck({room,action,busy,practice,shownDay,chosen,questions,quizError}){
  const t=useT();
  const [answers,setAnswers]=useState({});
  const [result,setResult]=useState(null);
  const [expired,setExpired]=useState(false);
  const [localError,setLocalError]=useState('');
  const attempt=useRef(null);
  const total=questions?.length||0;
  const answered=questions?questions.filter(q=>answers[q.id]).length:0;
  const currentId=questions?.find(q=>!answers[q.id])?.id||null;
  useEffect(()=>{attempt.current=null;setAnswers({});setResult(null);setExpired(false);setLocalError('');},[shownDay,questions]);
  const openAttempt=()=>attempt.current??=api('quiz/start',chosen).catch(e=>{attempt.current=null;throw e;});
  const resetQuiz=()=>{attempt.current=null;setAnswers({});setResult(null);setExpired(false);setLocalError('');};
  const submitQuiz=async()=>{
    setLocalError('');setExpired(false);
    try{
      const {attemptId}=await openAttempt();
      setResult(await api('quiz',{...chosen,attemptId,answers}));
    }catch(e){
      if(e.status===410){setAnswers({});setExpired(true);setLocalError(e.message);attempt.current=null;return;}
      if(e.status===422){setLocalError(e.message);attempt.current=null;return;}
      throw e;
    }finally{attempt.current=null;}
  };
  if(quizError||!questions?.length){
    return <section className="quiz-chrome" aria-label={t('lesson.quickCheck')}><h3>{t('lesson.quickCheck')}</h3>
      <StatusState kind="error" title={t('lesson.quizBadTitle')} action={<button type="button" onClick={()=>location.reload()}>{t('status.retry')}</button>}>
        {quizError||t('lesson.quizBadBody')}<p>{t('lesson.quizBadNext')}</p>
      </StatusState>
    </section>;
  }
  const passed=result&&result.score===result.total;
  return <section className="quiz-chrome" aria-label={t('lesson.quickCheck')}>
    <div className="quiz-chrome-head">
      <h3>{t('lesson.quickCheck')}</h3>
      <span className="quiz-progress" aria-live="polite">{t('lesson.quizProgress',{answered,total})}</span>
    </div>
    <p className="muted">{practice?t('naslag.practiceHint',{day:shownDay}):t('lesson.quizHint')}</p>
    <p className="muted quiz-idle-note">{t('lesson.quizIdle')}</p>
    {expired&&<StatusState kind="error" title={t('lesson.quizExpiredTitle')} action={<button type="button" onClick={resetQuiz}>{t('lesson.quizRetry')}</button>}>{localError||t('lesson.quizExpiredBody')}</StatusState>}
    {localError&&!expired&&<StatusState kind="error" title={t('status.errorTitle')}>{localError}</StatusState>}
    <form onSubmit={e=>{e.preventDefault();action(submitQuiz);}}>
      {questions.map((q,i)=><fieldset key={q.id} className={q.id===currentId?'quiz-q current':'quiz-q'} aria-current={q.id===currentId?'step':undefined}>
        <legend>{t('lesson.quizQuestion',{n:i+1,total})} · {q.question}</legend>
        {q.options.map(o=><label className="radio" key={o.id}><input type="radio" name={q.id} required checked={answers[q.id]===o.id} onChange={()=>{setAnswers({...answers,[q.id]:o.id});setExpired(false);openAttempt().catch(()=>{});}}/>{o.label}</label>)}
      </fieldset>)}
      <button type="submit" className="gradient" disabled={busy||room.me.role==='Facilitator'||room.readOnly||answered<total}>{t('lesson.submit')}<ArrowRight size={17}/></button>
    </form>
    {result&&<div className={passed?'notice quiz-result pass':'notice quiz-result fail'} role="status">
      <strong>{passed?t('lesson.quizPass',{score:result.score,total:result.total}):t('lesson.quizFail',{score:result.score,total:result.total})} · {routeName(t,result.route)}</strong>
      <p>{result.note}</p>
      <p>{practice?t('naslag.practiceResult',{day:shownDay}):(passed?t('lesson.soloHint'):t('lesson.quizFailHint'))}</p>
      {!passed&&<button type="button" className="text-button" onClick={resetQuiz}>{t('lesson.quizRetry')}</button>}
    </div>}
  </section>;
}

const CONCEPT_ICONS=[Lightbulb,Workflow,Wrench,Layers];

function conceptTextParts(text){
  const match=String(text||'').match(/^([\s\S]*?[.!?])(?:\s+([\s\S]*))?$/);
  return match?{keyLine:match[1],remainder:match[2]||''}:{keyLine:text,remainder:''};
}

function DiagramGallery({diagrams,t}){
  const [active,setActive]=useState(null);
  const dialogRef=useRef(null);
  const triggerRef=useRef(null);
  useEffect(()=>{
    if(active&&dialogRef.current&&!dialogRef.current.open)dialogRef.current.showModal();
  },[active]);
  const restoreFocus=()=>{
    triggerRef.current?.focus();
    setActive(null);
  };
  return <>
    <section className="lesson-diagrams" aria-label={t('lesson.diagrams')} data-testid="lesson-diagrams">
      {diagrams.map(diagram=><figure key={diagram.src} className="lesson-diagram">
        <button type="button" className="lesson-diagram-trigger" aria-label={t('lessonPages.zoomDiagram',{title:diagram.title})}
          onClick={event=>{triggerRef.current=event.currentTarget;setActive(diagram);}}>
          <img src={diagram.src} alt={diagram.alt||diagram.title} loading="lazy"/>
          <span className="lesson-diagram-zoom-hint"><ZoomIn size={16} aria-hidden="true"/>{t('lessonPages.zoomHint')}</span>
        </button>
        <figcaption>{diagram.title}</figcaption>
      </figure>)}
    </section>
    <dialog ref={dialogRef} className="lesson-diagram-lightbox" aria-labelledby="lesson-diagram-lightbox-title" onClose={restoreFocus}>
      {active&&<div className="lesson-diagram-lightbox-content">
        <header><h2 id="lesson-diagram-lightbox-title">{t('lessonPages.diagramDialogTitle')}</h2>
          <button type="button" aria-label={t('lessonPages.closeDiagram')} onClick={()=>dialogRef.current?.close()}><X size={20} aria-hidden="true"/></button>
        </header>
        <figure><img src={active.src} alt={active.alt||active.title}/><figcaption>{active.title}</figcaption></figure>
      </div>}
    </dialog>
  </>;
}

const EMPTY_LESSON={};

export function Lesson({room,action,busy,day,page:controlledPage,onNavigate,onStepsChange,framed=false}){
  const t=useT();
  const {locale}=useI18n();
  const [pack,setPack]=useState(null);
  const [error,setError]=useState('');
  const [stepIndex,setStepIndex]=useState(0);
  const [visitedSteps,setVisitedSteps]=useState(()=>new Set([0]));
  const shownDay=day??room.day,practice=shownDay!==room.day;
  const [internalPage,setInternalPage]=useState('lesson');
  const page=controlledPage??internalPage;
  const updatePage=next=>{
    if(controlledPage!==undefined&&onNavigate)onNavigate('lesson',{page:next,day:shownDay});
    else setInternalPage(next);
  };
  useEffect(()=>{if(controlledPage===undefined)setInternalPage('lesson');},[room.day,day,controlledPage]);
  useEffect(()=>{setStepIndex(0);setVisitedSteps(new Set([0]));},[shownDay]);
  useEffect(()=>{let active=true;setPack(null);setError('');const q=new URLSearchParams({locale});if(day!==undefined)q.set('day',String(day));api(`day-pack?${q}`).then(d=>{if(active)setPack(d);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[room.day,day,locale]);
  const lesson=pack?.lesson||EMPTY_LESSON,questions=pack?.quiz?.questions;
  const chosen=practice?{day:shownDay}:{};
  const lessonPages=useMemo(()=>{
    if(!pack)return [];
    const diagrams=pack.diagrams||[],steps=pack.steps||[],sims=pack.sims||[],labs=pack.labs||[],examples=pack.codeExamples||[];
    const definitions=[
      {id:'overview',label:t('lessonPages.overview'),visible:Boolean(lesson.kicker||lesson.title||lesson.motto||lesson.lede||diagrams[0]||lesson.loop?.length||steps.length)},
      {id:'idea',label:t('lessonPages.idea'),visible:Boolean(lesson.narrative?.length||diagrams.length>1||lesson.workedExample)},
      {id:'sim',label:t('lessonPages.tryIt'),visible:Boolean(sims.length||labs.length||room.me.role==='Facilitator'||room.lab)},
      {id:'code',label:t('lessonPages.code'),visible:examples.length>0},
      {id:'sources',label:t('lessonPages.sources'),visible:true}
    ];
    return definitions.filter(item=>item.visible);
  },[lesson,pack,t,room.me.role,room.lab]);
  const currentStepIndex=Math.min(stepIndex,Math.max(0,lessonPages.length-1));
  const stepLabels=useMemo(()=>lessonPages.map(item=>item.label),[lessonPages]);
  const changeStep=useCallback(index=>{
    setStepIndex(Math.max(0,Math.min(index,lessonPages.length-1)));
    setVisitedSteps(current=>new Set(current).add(index));
  },[lessonPages.length]);
  const framedSteps=useMemo(()=>page==='lesson'&&lessonPages.length?{
    index:currentStepIndex,count:lessonPages.length,labels:stepLabels,onChange:changeStep
  }:null,[page,currentStepIndex,lessonPages.length,stepLabels,changeStep]);
  useEffect(()=>{
    if(framed&&onStepsChange)onStepsChange(framedSteps);
  },[framed,framedSteps,onStepsChange]);
  useEffect(()=>{
    if(!framed||!onStepsChange)return;
    return()=>onStepsChange(null);
  },[framed,onStepsChange]);
  const pageNav=!framed&&<nav className="course-page-nav" aria-label={t('coursePages.nav')}>{['lesson','assignments','quiz'].map(id=><button key={id} type="button" aria-current={page===id?'page':undefined} onClick={()=>updatePage(id)}>{id==='lesson'?<BookOpen size={17}/>:id==='assignments'?<ClipboardList size={17}/>:<Check size={17}/>}<span>{t(`coursePages.${id}`)}</span></button>)}</nav>;
  if(error)return <section className="panel content-panel" data-testid="course-pages" data-course-day={shownDay}>{pageNav}<p className="cyan">{t('lesson.eyebrow')}</p><h2>{t('lesson.noneTitle')}</h2><StatusState kind="error" title={t('status.errorTitle')}>{error}<p>{t('lesson.noneHint')}</p></StatusState></section>;
  if(!pack)return <section className="panel content-panel" data-testid="course-pages" data-course-day={shownDay}>{pageNav}<StatusState kind="loading" title={t('lesson.loading')}/></section>;
  const currentStep=lessonPages[currentStepIndex];
  const lessonPage=page==='lesson'&&currentStep&&<>
    <nav className="lesson-stepper-scroll" aria-label={t('lessonPages.stepper')} data-testid="lesson-stepper">
      {lessonPages.map((item,index)=>{
        const active=index===currentStepIndex,visited=visitedSteps.has(index)&&!active;
        return <button key={item.id} type="button" aria-label={item.label} aria-current={active?'step':undefined}
          onClick={()=>changeStep(index)}>
          <span className="lesson-step-number">{index+1}</span>
          {visited&&<Check className="lesson-step-check" size={14} aria-hidden="true"/>}
          <span className="lesson-step-label">{item.label}</span>
        </button>;
      })}
    </nav>
    <div className="lesson-page" data-testid="lesson-page" data-lesson-page={currentStep.id}>
      {currentStep.id==='overview'&&<div className="lesson-page-copy lesson-overview">
        <p className="cyan">{lesson.kicker}</p><h2>{lesson.title}</h2>
        {lesson.motto&&<p className="lesson-motto" data-testid="lesson-motto"><em>{lesson.motto}</em></p>}
        {lesson.lede&&<p className="lede">{lesson.lede}</p>}
          {pack.diagrams?.[0]&&<DiagramGallery diagrams={[pack.diagrams[0]]} t={t}/>}
        {lesson.loop?.length>0&&<section className="lesson-flow-section">
          <p className="cyan" data-testid="path-pedagogy-label">{t('lessonPages.flowLabel')}</p>
          <div className="lesson-flow" data-testid="path-pedagogy">
            {lesson.loop.map((item,index)=><React.Fragment key={item.label||index}>
              <article className="lesson-flow-step"><span>{String(index+1).padStart(2,'0')}</span><strong>{item.label}</strong><small>{item.prompt}</small></article>
              {index<lesson.loop.length-1&&<span className="lesson-flow-arrow" aria-hidden="true">→</span>}
            </React.Fragment>)}
          </div>
        </section>}
        {pack.steps?.length>0&&<p className="lesson-task-cta" data-testid="path-assignments-crosslink">
          <span>{t('lessonPages.taskSummary',{count:pack.steps.length})}</span>
          <button type="button" className="text-button" onClick={()=>updatePage('assignments')}>{t('lessonPages.openAssignment')}</button>
        </p>}
      </div>}
      {currentStep.id==='idea'&&<div className="lesson-page-copy lesson-idea">
        {lesson.narrative?.length>0&&<div className="lesson-concept-grid" data-testid="lesson-narrative">
          {lesson.narrative.map((text,index)=>{
            const Icon=CONCEPT_ICONS[index%CONCEPT_ICONS.length],parts=conceptTextParts(text);
            return <article className="lesson-concept-card" key={index} data-testid="lesson-concept-card">
              <div className="lesson-concept-card-heading"><span className="lesson-concept-number">{String(index+1).padStart(2,'0')}</span><Icon className="lesson-concept-icon" size={21} aria-hidden="true"/></div>
              <p><strong className="lesson-concept-key">{parts.keyLine}</strong>{parts.remainder&&<span className="lesson-concept-remainder">{parts.remainder}</span>}</p>
            </article>;
          })}
        </div>}
        {pack.diagrams?.length>1&&<DiagramGallery diagrams={pack.diagrams.slice(1)} t={t}/>}
        {lesson.workedExample&&<article className="lesson-worked-example" data-testid="lesson-worked-example">
          <h3>{t('lesson.explained')}</h3><p>{lesson.workedExample}</p>
        </article>}
      </div>}
      {currentStep.id==='sim'&&<div className="lesson-sim-page">
        {pack.sims?.length>0&&<ConceptSimSlot sims={pack.sims} watchLabel={t('lessonPages.watchFor')}/>}
        {pack.labs?.length>0?<section className="lab-slot" aria-label={t('lab.heading')}><h3>{t('lab.heading')}</h3>{pack.labs.map(lab=><LabEmbed key={lab.id} lab={lab} preview={room.me.role==='Facilitator'} saved={room.me.progressByDay?.[String(shownDay)]?.labs?.[lab.id]}/>)}</section>:(room.me.role==='Facilitator'||room.lab)?<LabSlotEmpty facilitator={room.me.role==='Facilitator'}/>:null}
      </div>}
      {currentStep.id==='code'&&<div className="lesson-page-copy lesson-code-examples" data-testid="lesson-code-examples">
        {pack.codeExamples.map(ex=><PairedCodeExample key={ex.id} id={ex.id} title={ex.title} examples={{typescript:ex.typescript,python:ex.python}}/>)}
      </div>}
      {currentStep.id==='sources'&&<div className="lesson-page-copy lesson-sources">
        {pack.materials?.length>0&&<><h3>{t('lesson.materials')}</h3><ul className="materials">{pack.materials.map(m=><li key={m.label}>{m.href?<a href={m.href} target={m.href.startsWith('http')?'_blank':undefined} rel="noreferrer">{m.label}</a>:<span>{m.label}: <strong>OPEN</strong> · {m.open}</span>}{m.note&&<small className="muted"> · {m.note}</small>}</li>)}</ul></>}
        <OfficialDocs day={shownDay}/>
        {pack.attribution&&<p className="muted lesson-attribution" data-testid="lesson-attribution">{pack.attribution}</p>}
        <p className="naslag-links"><a href="/?learn=s01">Developer deep dive: Learn Claude Code →</a></p>
      </div>}
    </div>
    {!framed&&<div className="lesson-local-pagination">
      <button type="button" disabled={currentStepIndex===0} onClick={()=>changeStep(currentStepIndex-1)}>
        {t('activity.previousTo',{target:lessonPages[currentStepIndex-1]?.label||t('nav.courseOverview')})}
      </button>
      <span>{t('lessonPages.pagePosition',{current:currentStepIndex+1,total:lessonPages.length})}</span>
      <button type="button" onClick={()=>currentStepIndex===lessonPages.length-1?updatePage('assignments'):changeStep(currentStepIndex+1)}>
        {t('activity.nextTo',{target:lessonPages[currentStepIndex+1]?.label||t('coursePages.assignments')})}
      </button>
    </div>}
  </>;
  return <section className="panel content-panel" data-testid="course-pages" data-course-day={shownDay}>
    {pageNav}
    {page==='lesson'&&<div className="lesson-panel" data-testid="lesson-panel">{lessonPage}</div>}
    {page==='assignments'&&<section data-testid="assignments-page"><p className="cyan">{t('coursePages.day',{day:coursePosition({...room,day:shownDay})})}</p><h2>{t('coursePages.assignments')}</h2>{shownDay===1||shownDay===2?<><p className="muted" data-testid="assignments-sot-hint">{t('path.assignmentsSoT')}</p>{pack.steps?.length>0&&<><p className="cyan">{t('path.checklistLabel')}</p><ProgressivePath steps={pack.steps}/></>}<ClassroomExercises day={shownDay}/></>:pack.mission?<div className="notice"><h3>{pack.mission.title}</h3><p>{pack.mission.goal}</p>{pack.steps?.length>0&&<ProgressivePath steps={pack.steps} compact/>}{!practice&&onNavigate&&<button type="button" onClick={()=>onNavigate('solo')}>{t('coursePages.openSolo')}<ArrowRight size={16}/></button>}</div>:<StatusState kind="empty" title={t('coursePages.noAssignments')}/>}</section>}
    <section className="course-quiz-page" hidden={page!=='quiz'} aria-label={t('coursePages.quiz')} data-testid="quiz-page"><p className="cyan">{t('coursePages.day',{day:coursePosition({...room,day:shownDay})})}</p><h2>{t('coursePages.quiz')}</h2><QuickCheck room={room} action={action} busy={busy} practice={practice} shownDay={shownDay} chosen={chosen} questions={questions} quizError={pack.quizError}/></section>
  </section>;
}

export function Solo({room,action,busy,onNavigate}){
  const t=useT();
  const [pack,setPack]=useState(null);
  const [error,setError]=useState('');
  const participant=room.me.role!=='Facilitator';
  const {locale}=useI18n();
  const trail=useRemote(participant?`tasks?locale=${locale}`:null,[room.day,trailKey(room)]),tasks=trail.data?.tasks;
  useEffect(()=>{let active=true;setPack(null);setError('');api(`day-pack?locale=${locale}`).then(d=>{if(active)setPack(d);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[room.day,locale]);
  if(error)return <section className="panel content-panel"><p className="cyan">{t('solo.eyebrow')}</p><h2>{t('solo.noneTitle')}</h2><StatusState kind="error" title={t('status.errorTitle')}>{error}<p>{t('solo.noneHint')}</p></StatusState></section>;
  if(!pack)return <section className="panel content-panel"><StatusState kind="loading" title={t('solo.loading')}/></section>;
  const mission=pack.mission;
  const files=mission.starterFiles||['README.md','CLAUDE.md','package.json','status.mjs','status.test.mjs'];
  const hintText=(mission.hints||[]).join(' ');
  const allowedText=(mission.allowed||[]).join(' ');
  const hasSteps=pack.steps?.length>0;
  const requiredIds=new Set((pack.steps||[]).filter(step=>step.level!=='stretch').map(step=>step.id));
  const requiredTasks=(tasks||[]).filter(task=>requiredIds.has(task.id));
  const statusCounts={
    approved:requiredTasks.filter(task=>task.status==='approved'||task.autograde?.passed).length,
    submitted:requiredTasks.filter(task=>task.status==='submitted').length,
    changes:requiredTasks.filter(task=>task.status==='changes_requested').length,
    open:requiredTasks.filter(task=>task.status==='open').length
  };
  const onEvidenceSubmitted=()=>trail.reload();
  return <section className="panel content-panel assignment-page">
    <p className="cyan">{t('solo.meta',{minutes:mission.minutes||25,id:mission.id})}</p>
    <h2>{mission.title}</h2>
    <p className="lede">{mission.goal}</p>
    {mission.starterNote&&<p className="muted">{mission.starterNote}</p>}
    {hasSteps&&participant&&tasks&&<div className="assignment-status-counts" data-testid="assignment-status-counts">
      <strong>{t('assignment.statusHeading')}</strong>
      <span className="assignment-status-chips">
        <span className="task-chip approved">{t('tasks.status.approved')}: {statusCounts.approved}</span>
        <span className="task-chip submitted">{t('tasks.status.submitted')}: {statusCounts.submitted}</span>
        <span className="task-chip changes_requested">{t('tasks.status.changes_requested')}: {statusCounts.changes}</span>
        <span className="task-chip">{t('tasks.status.open')}: {statusCounts.open}</span>
      </span>
    </div>}
    {!hasSteps&&<div className="mission-goal"><Target size={22}/><div><h3>{t('solo.goal')}</h3><p>{mission.goal}</p></div></div>}
    {hasSteps?
      <>
        {participant&&!tasks&&<RemoteStatus remote={trail} loading={t('tasks.loading')}/>}
        <StepTaskList steps={pack.steps} tasks={tasks} action={action} busy={busy} onGraded={trail.reload} onSubmitted={onEvidenceSubmitted} readOnly={room.readOnly||!participant}/>
      </>:
      participant&&(tasks?<TaskList tasks={tasks} action={action} busy={busy} onGraded={trail.reload}/>:<RemoteStatus remote={trail} loading={t('tasks.loading')}/>)}
    {room.me.route==='stretch'&&<div className="notice"><strong>{t('solo.stretch')}</strong><p>{mission.stretch||t('solo.stretchFallback')}</p></div>}
    <section className="assignment-workspace">
      <h3>{t('solo.workspace')}</h3>
      <p className="muted">{t('solo.workspaceHint')}</p>
      <div className="assignment-workspace-controls">
        <label className="route-select">{t('solo.helpAmount')}<select value={room.me.route||'standard'} disabled={room.me.role==='Facilitator'} onChange={e=>action(()=>api('route',{route:e.target.value}))}>{['guided','standard','stretch'].map(v=><option value={v} key={v}>{routeName(t,v)}</option>)}</select></label>
        <details className="hint" open={room.me.route==='guided'}><summary>{t('solo.hintSummary')}</summary><p>{hintText||t('solo.hintFallback')}</p></details>
        <details className="hint"><summary>{t('solo.allowedSummary')}</summary><p>{allowedText} {mission.stop} {t('solo.noPush')}</p></details>
      </div>
      <div className="files">{files.map(file=><a key={file} href={'/game/starter/'+file} download={file}><FileText size={16}/>{file}<Download size={15}/></a>)}</div>
      <button type="button" className="text-button" onClick={()=>onNavigate('coach')}><Sparkles size={17}/>{t('solo.openCoach')}</button>
    </section>
    {participant&&<details className="other-evidence-box">
      <summary><ClipboardCheck size={17}/><span>{t('assignment.otherEvidence')}</span><ChevronDown size={16}/></summary>
      <p className="muted">{t('assignment.otherEvidenceHelp')}</p>
      <TaskEvidenceForm taskId="" action={action} busy={busy} disabled={room.readOnly} onSubmitted={onEvidenceSubmitted} showTitle={false}/>
    </details>}
  </section>;
}

export function Review({room,action,busy}){
  const t=useT();
  const {locale}=useI18n();
  const [sent,setSent]=useState(false);
  const pack=useRemote(`day-pack?locale=${locale}`,[room.day]),criteria=pack.data?.reviewCriteria||null;
  const sourceLabel=source=>source==='MCP-client'?t('review.source.mcp'):source==='Participant'||source==='Deelnemer'?t('review.source.participant'):source;
  const statusLabel={pending:t('review.status.pending'),accepted:t('review.status.accepted'),'needs-work':t('review.status.needs-work')};
  return <section className="panel content-panel"><p className="cyan">{t('review.eyebrow')}</p><h2>{t('review.title')}</h2><p className="lede">{t('review.lede')}</p><RemoteStatus remote={pack} loading={t('review.criteriaLoading')}/>{criteria?.length>0&&<div className="notice"><strong>{t('review.criteria')}</strong><ul className="criteria-list">{criteria.map(c=><li key={c}>{c}</li>)}</ul></div>}{room.me.role==='Facilitator'?<TaskQueue room={room} action={action} busy={busy} path="tasks/queue" heading="queue"/>:<TaskQueue room={room} action={action} busy={busy} path="tasks/peer" heading="peer"/>}<h3>{t('review.evidenceHeading',{count:room.evidence.length})}</h3>{!room.evidence.length&&<StatusState kind="empty" title={t('review.empty')}>{criteria?.length?t('review.emptyCriteria'):t('review.emptyDefault')}</StatusState>}{room.evidence.map(e=><article className="evidence" key={e.id}><div><strong>{e.name}</strong><span>{statusLabel[e.status]||e.status}</span></div><small>{sourceLabel(e.source)}{e.day!=null?` · ${t('review.day',{day:e.day})}`:''}{e.taskId?` · ${t('review.taskLabel',{task:e.taskId})}`:''} · {new Date(e.at).toLocaleString(locale==='nl'?'nl-NL':'en-GB')}</small><p>{e.finding}</p><pre>{e.command}{'\n'}{e.observed}</pre><p><strong>{t('review.limitation')}</strong> {e.limitation}</p>{e.review&&<p><strong>{t('review.reviewLabel')}</strong> {e.review.note}</p>}{!room.readOnly&&e.personId!==room.me.id&&!e.taskId&&<form onSubmit={event=>{event.preventDefault();const form=event.currentTarget;const values=Object.fromEntries(new FormData(form));action(async()=>{await api('review',{id:e.id,...values,requestId:form.dataset.requestId||(form.dataset.requestId=crypto.randomUUID())});delete form.dataset.requestId;});}}><label>{t('review.note')}<textarea name="note" required maxLength={4000}/></label><div className="form-row"><select aria-label={t('review.decision')} name="status"><option value="accepted">{t('review.accepted')}</option><option value="needs-work">{t('review.needsWork')}</option></select><button type="submit" disabled={busy}>{t('review.save')}</button></div></form>}</article>)}<h3>{t('review.handoffTitle')}</h3><form onSubmit={e=>{e.preventDefault();const form=e.currentTarget;const data=Object.fromEntries(new FormData(form));action(async()=>{await api('handoff',{...data,requestId:form.dataset.requestId||(form.dataset.requestId=crypto.randomUUID())});delete form.dataset.requestId;setSent(true);});}}>{[['decision',t('review.decisionField')],['checked',t('review.checkedField')],['open',t('review.openField')]].map(([n,l])=><label key={n}>{l}<textarea name={n} required maxLength={4000}/></label>)}<button type="submit" className="gradient" disabled={busy||room.readOnly}>{t('review.handoffSubmit')}<ArrowRight size={17}/></button>{sent&&<p className="success" role="status">{t('review.handoffSaved')}</p>}</form>{room.handoffs.map(h=><div className="notice" key={h.id}><p>{h.decision}</p><small>{t('review.openLabel',{open:h.open})}</small></div>)}</section>;
}

function Reflection({room,onSaved}){
  const t=useT();
  const existing=room.me?.progressByDay?.[String(room.day)]?.reflection;
  const [learned,setLearned]=useState(existing?.learned||'');
  const [next,setNext]=useState(existing?.next||'');
  const [saved,setSaved]=useState(Boolean(existing));
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  return <form className="reflection" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{await api('reflection',{learned,next});setSaved(true);onSaved?.();}catch(err){setError(err.message);}finally{setBusy(false);}}}><h3>{t('reflection.title',{day:coursePosition(room)})}</h3><p className="muted">{t('reflection.privacy')}</p>{error&&<p className="error" role="alert">{error}</p>}<label>{t('reflection.learned')}<textarea required maxLength={4000} value={learned} onChange={e=>{setLearned(e.target.value);setSaved(false);}}/></label><label>{t('reflection.next')}<textarea required maxLength={4000} value={next} onChange={e=>{setNext(e.target.value);setSaved(false);}}/></label><button type="submit" disabled={busy}>{saved?t('reflection.saved'):t('reflection.save')}</button></form>;
}

export function Route({room,onNavigate}){
  const t=useT();
  const {locale}=useI18n();
  const progressKey=JSON.stringify(room.me?.progressByDay||{});
  const evidenceKey=(room.evidence||[]).map(e=>`${e.id}:${e.status}`).join(',');
  const remote=useRemote(`day-route?locale=${locale}`,[room.day,room.version,room.me?.quiz?.at,evidenceKey,progressKey]);
  const days=remote.data?.days||[];
  const [openDays,setOpenDays]=useState(()=>new Set([room.day]));
  useEffect(()=>setOpenDays(current=>new Set([...current,room.day])),[room.day]);
  const activitiesFor=day=>{
    const progress=day.progress||{},tasks=day.tasks;
    const taskStatus=tasks
      ?t('course.assignmentStatus',{approved:tasks.approved,total:tasks.total,awaiting:tasks.awaiting,changes:tasks.changesRequested})
      :t('course.taskCount',{count:day.activities?.taskCount||0});
    return [
      {id:'lesson',type:'lesson',title:day.activities?.lessonTitle||day.title,done:Boolean(progress.lessonDone),meta:progress.lessonDone?t('course.lessonDone'):t('course.lessonNotDone')},
      {id:'assignments',type:'assignment',title:day.activities?.missionTitle||day.title,done:Boolean(tasks?.total>0&&tasks.approved===tasks.total),meta:taskStatus},
      {id:'quiz',type:'quiz',title:t('course.quizTitle'),done:Boolean(progress.hasQuiz),meta:progress.hasQuiz?t('course.quizScore',{score:progress.quizScore??'—'}):t('course.quizQuestions',{count:day.activities?.quizCount||0})},
      ...(day.day===room.day?[{id:'review',type:'review',title:t('course.reviewTitle'),done:Boolean(progress.hasHandoff),meta:progress.hasHandoff?t('course.handoffDone'):progress.hasEvidence?t('course.evidenceCount',{count:progress.evidenceCount}):t('course.handoffNeeded')}]:[])
    ];
  };
  const releasedDays=days.filter(day=>day.released);
  const overallRows=releasedDays.flatMap(activitiesFor);
  const completed=overallRows.filter(row=>row.done).length;
  const currentDay=days.find(day=>day.day===room.day);
  const currentRows=currentDay?activitiesFor(currentDay):[];
  const nextActivity=currentRows.find(row=>!row.done);
  const toggleDay=day=>setOpenDays(current=>{const next=new Set(current);if(next.has(day))next.delete(day);else next.add(day);return next;});
  const openActivity=(day,activity)=>{
    if(!day.released)return;
    if(activity==='assignments'){
      onNavigate?.(day.day===room.day?'solo':'lesson',day.day===room.day?{}:{page:'assignments',day:day.day});
      return;
    }
    if(activity==='review'){onNavigate?.('review');return;}
    onNavigate?.('lesson',{page:activity,day:day.day});
  };
  const courseName=remote.data?.course?.name||t('route.title');
  const stateIcon=(row,isCurrent,locked)=>{
    if(locked)return <Lock size={16} aria-hidden="true"/>;
    if(row.done)return <Check size={16} aria-hidden="true"/>;
    return isCurrent?<CircleDot size={16} aria-hidden="true"/>:<Circle size={16} aria-hidden="true"/>;
  };
  const statusLabel=(row,isCurrent,locked)=>locked?t('course.locked'):row.done?t('course.state.done'):isCurrent?t('course.state.current'):t('course.state.todo');
  return <section className="panel content-panel course-overview" data-testid="course-overview">
    <header className="course-overview-heading"><p className="cyan">{t('route.eyebrow')}</p><h2>{courseName}</h2><p className="lede">{t('course.overviewLede')}</p></header>
    <RemoteStatus remote={remote} loading={t('route.loading')}/>
    {remote.status==='ready'&&!days.length&&<StatusState kind="empty" title={t('route.empty')}/>}
    {remote.status==='ready'&&days.length>0&&<div className="course-overview-grid">
      <div className="course-overview-main">
        <div className="course-chapter-list">
          {days.map(day=>{
            const expanded=openDays.has(day.day);
            const rows=activitiesFor(day);
            const currentNext=currentDay?.day===day.day?nextActivity?.id:null;
            return <article className={'course-chapter'+(day.day===room.day?' current':'')+(!day.released?' locked':'')} key={day.day} data-day={day.day}>
              <button type="button" className="course-chapter-toggle" aria-expanded={expanded} onClick={()=>toggleDay(day.day)}>
                <span className="course-day-number">{String(day.position).padStart(2,'0')}</span>
                <span className="course-chapter-title"><small>{t('route.supportDay',{day:day.position})} · {day.tag}{day.date&&<> · <time dateTime={day.date}>{day.date}</time></>}</small><strong>{day.title}</strong><span>{day.blurb}</span></span>
                <span className="course-chapter-lock">{day.released?t('course.unlocked'):t('course.locked')}</span>
                {expanded?<ChevronDown size={18} aria-hidden="true"/>:<ChevronRight size={18} aria-hidden="true"/>}
              </button>
              {expanded&&<div className="course-activity-list">
                {rows.map(row=>{
                  const locked=!day.released,isCurrent=day.day===room.day&&row.id===currentNext;
                  return <button type="button" className="course-activity-row" key={row.id} disabled={locked}
                    data-state={locked?'locked':row.done?'done':isCurrent?'current':'todo'}
                    aria-label={`${row.type}: ${row.title} · ${statusLabel(row,isCurrent,locked)}`}
                    onClick={()=>openActivity(day,row.id)}>
                    <span className="course-activity-marker">{stateIcon(row,isCurrent,locked)}</span>
                    <span className="course-activity-type">{t(`course.activity.${row.type}`)}</span>
                    <span className="course-activity-name">{row.title}</span>
                    <small className="course-activity-meta">{row.meta}</small>
                    <ArrowRight size={15} aria-hidden="true"/>
                  </button>;
                })}
              </div>}
            </article>;
          })}
        </div>
        {room.me.role!=='Facilitator'&&<Reflection key={room.day} room={room} onSaved={remote.reload}/>}
      </div>
      <aside className="course-progress-sidebar">
        <p className="cyan">{t('course.progressHeading')}</p>
        <strong>{t('course.progressValue',{done:completed,total:overallRows.length})}</strong>
        <progress value={completed} max={Math.max(1,overallRows.length)} aria-label={t('course.progressHeading')}/>
        <p className="muted">{t('course.progressHelp')}</p>
        {nextActivity
          ?<button type="button" className="gradient" onClick={()=>openActivity(currentDay,nextActivity.id)}>{t('course.continueActivity',{activity:nextActivity.title})}<ArrowRight size={17}/></button>
          :<button type="button" className="gradient" onClick={()=>onNavigate?.('today')}>{t('course.backToToday')}<ArrowRight size={17}/></button>}
      </aside>
    </div>}
  </section>;
}

export function Debrief({room,onOpenBoard}){
  const t=useT();
  const [data,setData]=useState(null);
  const [error,setError]=useState('');
  useEffect(()=>{let active=true;api('debrief').then(d=>{if(active)setData(d);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[room.day,room.serverTime]);
  if(error)return <section className="panel content-panel"><StatusState kind="error" title={t('status.errorTitle')}>{error}</StatusState></section>;
  if(!data)return <section className="panel content-panel"><StatusState kind="loading" title={t('debrief.loading')}/></section>;
  const quiz=data.quiz||{total:0,notStarted:0,inProgress:0,completed:0,expired:0,started:0};
  const phaseLabel=phase=>({not_started:t('debrief.quizNotStarted'),in_progress:t('debrief.quizInProgress'),completed:t('debrief.quizCompleted'),expired:t('debrief.quizExpired')})[phase]||phase;
  return <section className="panel content-panel"><p className="cyan">{t('debrief.eyebrow')}</p><h2>{t('debrief.title',{name:data.name,day:data.day})}</h2><p className="lede">{t('debrief.lede')}</p>
    <div className="notice quiz-status" role="status" aria-label={t('debrief.quizStatus')}>
      <strong>{t('debrief.quizStatus')}</strong>
      <p>{t('debrief.quizCounts',{started:quiz.started,inProgress:quiz.inProgress,completed:quiz.completed,notStarted:quiz.notStarted,expired:quiz.expired,total:quiz.total})}</p>
      <div className="progress-chips">
        <span className={quiz.inProgress?'progress-chip on':'progress-chip'}>{t('debrief.quizInProgress')}: {quiz.inProgress}</span>
        <span className={quiz.completed?'progress-chip on':'progress-chip'}>{t('debrief.quizCompleted')}: {quiz.completed}</span>
        <span className="progress-chip">{t('debrief.quizNotStarted')}: {quiz.notStarted}</span>
        {quiz.expired>0&&<span className="progress-chip">{t('debrief.quizExpired')}: {quiz.expired}</span>}
      </div>
    </div>
    <div className="day-list">{data.members.map(member=><div key={member.id}><span className="day-number">{member.help?'!':'·'}</span><div><h3>{member.name}</h3><p>{t('debrief.memberStats',{quiz:member.progress.quizScore??'—',evidence:member.progress.evidenceCount,review:member.progress.reviewedCount,accepted:member.progress.acceptedCount})}</p><div className="progress-chips"><span className={member.quizPhase==='completed'||member.quizPhase==='in_progress'?'progress-chip on':'progress-chip'}>{phaseLabel(member.quizPhase)}</span>{chipLabel(member.progress.hasReflection,t('route.reflection'))}{chipLabel(member.progress.hasHandoff,t('route.handoff'))}{member.help&&<span className="progress-chip on">{t('debrief.helpAsked')}</span>}</div>{member.progress.reflection&&<div className="notice"><strong>{t('debrief.reflection')}</strong><p>{member.progress.reflection.learned}</p><small>{t('debrief.nextPractice',{next:member.progress.reflection.next})}</small></div>}</div></div>)}</div><h3>{t('debrief.handoffs')}</h3>{!data.handoffs.length&&<p className="muted">{t('debrief.noHandoffs')}</p>}{data.handoffs.map(h=><div className="notice" key={h.id}><p>{h.decision}</p><small>{t('review.openLabel',{open:h.open})}</small></div>)}<div className="debrief-board-actions"><button type="button" className="gradient" data-testid="debrief-open-board" onClick={onOpenBoard}><Columns3 size={16} aria-hidden="true"/>{t(!room.board?'debrief.openBoard':room.board.status==='closed'?'debrief.reopenBoard':'debrief.viewBoard')}</button><a className="text-button" href="/game/debrief/export" download><Download size={16}/>{t('debrief.export')}</a></div></section>;
}

const chipLabel=(on,label)=><span className={on?'progress-chip on':'progress-chip'}>{label}</span>;

export function CourseComposer({room,control,busy}){
  const t=useT();
  const [data,setData]=useState(null);
  const [draft,setDraft]=useState(null);
  const [error,setError]=useState('');
  const courseKey=JSON.stringify(room.course);
  useEffect(()=>{let active=true;api('course').then(d=>{if(active){setData(d);setDraft(d.course);}}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[courseKey]);
  if(error)return <section className="panel content-panel"><StatusState kind="error" title={t('status.errorTitle')}>{error}</StatusState></section>;
  if(!data)return <section className="panel content-panel"><StatusState kind="loading" title={t('course.loading')}/></section>;
  const packs=Object.fromEntries(data.packs.map(pack=>[pack.day,pack]));
  const intro=<><p className="cyan">{t('course.eyebrow')}</p><h2>{t('course.title')}</h2><p className="lede">{t('course.lede')}</p></>;
  const templates=data.templates?.length?data.templates:[data.template];
  if(!draft)return <section className="panel content-panel course-composer">{intro}<p className="muted">{t('course.none')}</p><div className="form-row course-templates">{templates.map(tpl=><button key={tpl.name} className="gradient" type="button" data-testid={`course-template-${tpl.name.toLowerCase().replace(/\s+/g,'-')}`} onClick={()=>setDraft(tpl)}>{tpl.name===data.template.name?t('course.fromTemplate'):t('course.fromNamedTemplate',{name:tpl.name})}<ArrowRight size={17}/></button>)}</div></section>;
  const setDays=days=>setDraft({...draft,days});
  const edit=(index,patch)=>setDays(draft.days.map((entry,i)=>i===index?{...entry,...patch}:entry));
  const move=(index,delta)=>{const days=[...draft.days];const [entry]=days.splice(index,1);days.splice(index+delta,0,entry);setDays(days);};
  const excluded=data.packs.filter(pack=>!draft.days.some(entry=>entry.day===pack.day));
  return <section className="panel content-panel course-composer">{intro}
    <label className="course-name">{t('course.name')}<input value={draft.name} maxLength={80} onChange={e=>setDraft({...draft,name:e.target.value})}/></label>
    <ol className="course-days">{draft.days.map((entry,index)=>{const pack=packs[entry.day];return <li key={entry.day} className={room.day===entry.day?'current':''}>
      <span className="day-number">{String(index+1).padStart(2,'0')}</span>
      <div className="course-day-fields"><small>{t('course.pack',{day:entry.day,tag:pack.tag})}</small>
        <label>{t('course.dayTitle')}<input value={entry.title??''} placeholder={pack.title} maxLength={120} onChange={e=>edit(index,{title:e.target.value||null})}/></label>
        <label>{t('course.date')}<input type="date" value={entry.date??''} onChange={e=>edit(index,{date:e.target.value||null})}/></label>
      </div>
      <div className="course-day-actions">
        <button type="button" disabled={index===0} onClick={()=>move(index,-1)} aria-label={t('course.up',{title:pack.title})}>↑</button>
        <button type="button" disabled={index===draft.days.length-1} onClick={()=>move(index,1)} aria-label={t('course.down',{title:pack.title})}>↓</button>
        <button type="button" disabled={draft.days.length===1} onClick={()=>setDays(draft.days.filter((_,i)=>i!==index))}>{t('course.exclude')}</button>
      </div>
    </li>;})}</ol>
    {excluded.length>0&&<><h3>{t('course.excluded')}</h3><ul className="course-excluded">{excluded.map(pack=><li key={pack.day}><span>{t('course.pack',{day:pack.day,tag:pack.tag})} · {pack.title}</span><button type="button" onClick={()=>setDays([...draft.days,{day:pack.day,title:null,date:null}])}>{t('course.include')}</button></li>)}</ul></>}
    <div className="form-row"><button type="button" className="gradient" disabled={busy} onClick={()=>control('course',draft)}>{t('course.save')}</button>{data.course&&<button type="button" disabled={busy} onClick={()=>control('course',null)}>{t('course.remove')}</button>}</div>
    <p className="muted">{t('course.sot')}</p>
  </section>;
}

const trailKey=room=>room.evidence.map(e=>e.id+':'+e.status).join(',');


function TaskList({tasks,action,busy,onGraded}){
  const t=useT();
  return <><h3>{t('tasks.title')}</h3><p className="muted">{t('tasks.lede')}</p>{!tasks.length&&<StatusState kind="empty" title={t('tasks.empty')}/>}<div className="task-list">{tasks.map(task=>{const last=task.submissions.at(-1),auto=task.autograde?.passed;return <article className="task" key={task.id}><div><strong>{task.title}</strong><span className={'task-chip '+task.status}>{t(auto?'tasks.status.auto_approved':'tasks.status.'+task.status)}</span></div><small>{task.id}{task.submissions.length?` · ${t('tasks.attempts',{count:task.submissions.length})}`:''}</small>{last?.review&&<p><strong>{t('tasks.feedback',{name:last.review.reviewer?.name||'Facilitator'})}</strong> {last.review.note}</p>}{task.autograde&&(auto||task.status!=='approved')&&<AutogradeForm task={task} action={action} busy={busy} onGraded={onGraded}/>}</article>;})}</div></>;
}

function CopyTextButton({value}){
  const t=useT();
  const [copied,setCopied]=useState(false);
  const copy=async()=>{
    try{
      if(!navigator.clipboard?.writeText)throw Error('clipboard unavailable');
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(()=>setCopied(false),1400);
    }catch{setCopied(false);}
  };
  return <button type="button" className="text-button assignment-copy" onClick={copy}><Copy size={14}/>{t(copied?'assignment.copied':'assignment.copy')}</button>;
}

function TaskEvidenceForm({taskId,action,busy,disabled,onSubmitted,showTitle=true}){
  const t=useT();
  const [sent,setSent]=useState(false);
  const submit=event=>{
    event.preventDefault();
    const form=event.currentTarget,values=Object.fromEntries(new FormData(form));
    action(async()=>{
      await api('evidence',{...values,taskId,requestId:form.dataset.requestId||(form.dataset.requestId=crypto.randomUUID())});
      delete form.dataset.requestId;
      form.reset();
      setSent(true);
      onSubmitted?.();
    });
  };
  return <form className="assignment-evidence-form" onSubmit={submit}>
    <input type="hidden" name="taskId" value={taskId}/>
    {showTitle&&<strong>{t(taskId?'assignment.taskEvidence':'assignment.otherEvidence')}</strong>}
    {[['finding',t('solo.finding')],['command',t('solo.command')],['observed',t('solo.observed')],['limitation',t('solo.limitation')]].map(([name,label])=><label key={name}>{label}<textarea required name={name} maxLength={name==='command'?1000:4000}/></label>)}
    <button type="submit" className="gradient" disabled={busy||disabled}>{t('solo.submit')}<ArrowRight size={17}/></button>
    {sent&&<p className="success" role="status"><Check size={16}/>{t('solo.sent')}</p>}
  </form>;
}

function AssignmentTaskBox({step,task,action,busy,onGraded,onSubmitted,readOnly,open}){
  const t=useT();
  const auto=Boolean(task?.autograde?.passed);
  const approved=task?.status==='approved'||auto;
  const canSubmit=task&&(task.status==='open'||task.status==='changes_requested')&&!step.autograde;
  const status=auto?'auto_approved':task?.status;
  const prompts=step.prompts||[];
  const run=step.run||[];
  return <details className="step-card assignment-task-box" data-testid="step-card" data-assignment-task-box open={open} key={step.id}>
    <summary>
      <span className="agent-badge">{step.badge}</span>
      <strong>{step.title}{step.level==='stretch'&&<small className="muted"> · {t('path.stretch')}</small>}</strong>
      {step.timerMinutes&&<small className="muted">{t('steps.minutes',{minutes:step.timerMinutes})}</small>}
      {status&&<span className={'task-chip '+status}>{t('tasks.status.'+status)}</span>}
      {approved&&<Check size={16} aria-hidden="true"/>}
    </summary>
    <div className="step-card-body assignment-task-body">
      <section className="assignment-task-goal"><h4>{t('assignment.goal')}</h4><p>{step.goal}</p></section>
      {step.instructions?.length>0&&<section><h4>{t('assignment.steps')}</h4><ol className="step-instructions">{step.instructions.map((line,index)=><li key={index}><InlineCode text={line}/></li>)}</ol></section>}
      {run.length>0&&<section className="assignment-code"><header><h4>{t('assignment.runThis')}</h4><CopyTextButton value={run.join('\n')}/></header><pre><code>{run.join('\n')}</code></pre></section>}
      {prompts.length>0&&<section className="assignment-prompts"><header><h4>{t('assignment.prompts')}</h4></header><ol>{prompts.map((prompt,index)=><li key={index}><span>{prompt}</span><CopyTextButton value={prompt}/></li>)}</ol></section>}
      {step.watchFor&&<section className="assignment-watch"><h4>{t('assignment.watchFor')}</h4><p>{step.watchFor}</p></section>}
      {step.doneWhen&&<p className="assignment-done-when"><strong>{t('path.doneWhen')}</strong> {step.doneWhen}</p>}
      {step.hint&&<details className="hint assignment-hint"><summary>{t('solo.hintSummary')}</summary><p>{step.hint}</p></details>}
      {task?.submissions?.length>0&&<details className="assignment-history"><summary>{t('assignment.submissionHistory',{count:task.submissions.length})}</summary>{task.submissions.map((submission,index)=><article key={submission.id||index}><strong>{t('assignment.submissionNumber',{number:index+1})} · {t('review.status.'+submission.status)}</strong>{submission.finding&&<p>{submission.finding}</p>}{submission.command&&<small>{submission.command}</small>}{submission.observed&&<p>{submission.observed}</p>}{submission.limitation&&<small>{submission.limitation}</small>}{submission.review&&<p><strong>{t('tasks.feedback',{name:submission.review.reviewer?.name||'Facilitator'})}</strong> {submission.review.note}</p>}</article>)}</details>}
      {task?.autograde&&(auto||task.status!=='approved')&&<AutogradeForm task={task} action={action} busy={busy} onGraded={onGraded}/>}
      {approved&&<button type="button" className="assignment-approved-control" disabled><Check size={15}/>{t('tasks.status.approved')}</button>}
      {canSubmit&&<TaskEvidenceForm taskId={step.id} action={action} busy={busy} disabled={readOnly} onSubmitted={onSubmitted}/>}
    </div>
  </details>;
}

function StepTaskList({steps,tasks,action,busy,onGraded,onSubmitted,readOnly}){
  const t=useT();
  const taskById=new Map((tasks||[]).map(task=>[task.id,task]));
  const requiredSteps=steps.filter(step=>step.level!=='stretch');
  const approved=task=>task?.status==='approved'||Boolean(task?.autograde?.passed);
  const done=requiredSteps.filter(step=>approved(taskById.get(step.id))).length;
  const openIndex=tasks?steps.findIndex(step=>!approved(taskById.get(step.id))):steps.length?0:-1;
  if(!steps.length)return null;
  return <>
    <h3>{t('tasks.title')}</h3>
    <p className="muted">{t('tasks.lede')}</p>
    {tasks&&<div className="step-progress-row"><span>{t('steps.progress',{done,total:requiredSteps.length})}</span><progress className="step-progress" value={done} max={Math.max(1,requiredSteps.length)}/></div>}
    <div className="step-card-list">{steps.map((step,index)=><AssignmentTaskBox key={step.id||index} step={step} task={taskById.get(step.id)} action={action} busy={busy} onGraded={onGraded} onSubmitted={onSubmitted} readOnly={readOnly} open={index===openIndex}/>)}</div>
  </>;
}

const PRIORITIES=['low','medium','high'];

function AutogradeForm({task,action,busy,onGraded}){
  const t=useT();
  const grade=task.autograde,resultFor=id=>grade.results.find(r=>r.ticketId===id);
  const summary=grade.attempts>0&&<p className={grade.passed?'success':'muted'} role="status">{grade.passed&&<Check size={16}/>}{t(grade.passed?'autograde.passed':'autograde.result',{score:grade.score,total:grade.total,attempts:grade.attempts})}</p>;
  if(grade.passed)return summary;
  const submit=event=>{event.preventDefault();const labels=Object.fromEntries(new FormData(event.currentTarget));action(async()=>{await api(`tasks/${encodeURIComponent(task.id)}/autograde`,{labels});onGraded();});};
  return <details className="autograde" open={grade.attempts>0}><summary>{t('autograde.summary')}</summary><form onSubmit={submit}><p className="muted">{t('autograde.lede')}</p>{grade.tickets.map(ticket=>{const result=resultFor(ticket.ticketId);return <label className="autograde-ticket" key={ticket.ticketId}><span><strong>{ticket.ticketId}</strong> {ticket.message}</span><select name={ticket.ticketId} required defaultValue={result?.label||''}><option value="" disabled>{t('autograde.choose')}</option>{PRIORITIES.map(p=><option value={p} key={p}>{t('autograde.priority.'+p)}</option>)}</select>{result&&<small className={result.correct?'correct':'incorrect'}>{t(result.correct?'autograde.correct':'autograde.incorrect')}</small>}</label>;})}{summary}<button type="submit" className="gradient" disabled={busy}>{t('autograde.submit')}<ArrowRight size={17}/></button></form></details>;
}

function SubmissionsGrid({members}){
  const t=useT();
  const columns=members[0]?.tasks||[];
  const approved=task=>task.status==='approved';
  const statusCountsFor=taskId=>{
    const statuses=members.map(member=>member.tasks.find(task=>task.id===taskId)?.status||'open');
    return {
      approved:statuses.filter(status=>status==='approved').length,
      awaiting:statuses.filter(status=>status==='submitted').length,
      changes:statuses.filter(status=>status==='changes_requested').length,
      open:statuses.filter(status=>status==='open').length
    };
  };
  return <section className="submissions-grid-section" aria-labelledby="submissions-grid-heading">
    <h3 id="submissions-grid-heading">{t('submissionsGrid.title')}</h3>
    <div className="submissions-grid-scroll" role="region" aria-label={t('submissionsGrid.title')} tabIndex="0">
      <table className="submissions-grid" data-testid="submissions-grid">
        <thead><tr><th scope="col">{t('submissionsGrid.member')}</th>{columns.map(task=><th scope="col" key={task.id}><span className="submission-grid-task-title">{task.title}</span>{!task.required&&<small className="submission-grid-stretch">{t('submissionsGrid.stretch')}</small>}</th>)}</tr></thead>
        <tbody>{members.map(member=>{
          const requiredTasks=member.tasks.filter(task=>task.required);
          const approvedRequired=requiredTasks.filter(approved).length;
          const taskById=new Map(member.tasks.map(task=>[task.id,task]));
          return <tr key={member.id}>
            <th scope="row"><strong>{member.name}</strong><small>{t('submissionsGrid.memberProgress',{approved:approvedRequired,total:requiredTasks.length})}</small></th>
            {columns.map(column=>{
              const task=taskById.get(column.id)||{status:'open'};
              const label=t(`tasks.status.${task.status}`);
              return <td key={column.id} data-status={task.status}>
                {task.status==='submitted'&&task.latestEvidenceId
                  ?<a className="submission-status-link" href={`#queue-${task.latestEvidenceId}`} aria-label={t('submissionsGrid.openSubmission',{name:member.name,task:column.title})}>{label}<ArrowRight size={13}/></a>
                  :<span className={'task-chip '+task.status}>{label}</span>}
              </td>;
            })}
          </tr>;
        })}</tbody>
        <tfoot><tr><th scope="row">{t('submissionsGrid.taskSummary')}</th>{columns.map(task=><td key={task.id}>{t('submissionsGrid.statusCounts',statusCountsFor(task.id))}</td>)}</tr></tfoot>
      </table>
    </div>
  </section>;
}

function TaskQueue({room,action,busy,path,heading}){
  const t=useT();
  const {locale}=useI18n();
  const remote=useRemote(`${path}?locale=${locale}`,[room.day,trailKey(room)]);
  if(!remote.data)return <RemoteStatus remote={remote} loading={t('queue.loading')}/>;
  const data={...remote.data,reload:remote.reload};
  const decide=(item,event)=>{event.preventDefault();const form=event.currentTarget;const values=Object.fromEntries(new FormData(form,event.nativeEvent.submitter));action(async()=>{await api('review',{id:item.evidenceId,...values,requestId:form.dataset.requestId||(form.dataset.requestId=crypto.randomUUID())});delete form.dataset.requestId;data.reload();});};
  return <>
    <h3>{t(heading+'.title',{count:data.queue.length})}</h3>
    <p className="muted">{t(heading+'.lede')}</p>
    {!data.queue.length&&<StatusState kind="empty" title={t('queue.empty')}/>}
    {data.queue.map(item=><article className="evidence" id={`queue-${item.evidenceId}`} key={item.evidenceId}>
      <div><strong>{item.name} · {item.taskTitle}</strong><span>{t('queue.attempt',{attempt:item.attempt})}</span></div>
      <small>{t('review.day',{day:item.day})} · {new Date(item.at).toLocaleString(locale==='nl'?'nl-NL':'en-GB')}</small>
      <p>{item.finding}</p>
      <pre>{item.command}{'\n'}{item.observed}</pre>
      <p><strong>{t('review.limitation')}</strong> {item.limitation}</p>
      <form onSubmit={event=>decide(item,event)}>
        <label>{t('queue.note')}<textarea name="note" required maxLength={4000}/></label>
        <div className="form-row">
          <button type="submit" name="status" value="accepted" disabled={busy}>{t('queue.approve')}</button>
          <button type="submit" name="status" value="needs-work" disabled={busy}>{t('queue.requestChanges')}</button>
        </div>
      </form>
    </article>)}
    {data.members&&<SubmissionsGrid members={data.members}/>}
  </>;
}
