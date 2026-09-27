import React,{useEffect,useRef,useState} from 'react';
import {Check,FlaskConical,Play,RotateCw} from 'lucide-react';
import {connectHost} from '../packages/lab-embed/src/index.ts';
import {api} from './api';
import {useT,useI18n} from './i18n';

// allow-same-origin keeps the lab's own origin so the origin check can hold; without it every lab reports "null".
const SANDBOX='allow-scripts allow-same-origin';
/** How long we wait for lab → host `ready` before showing a timeout with retry. */
const READY_TIMEOUT_MS=12_000;

// A facilitator preview runs the lab ungraded: the server grades participants only.
const previewLab=lab=>({...lab,gradedStops:[]});

export function LabEmbed({lab,saved,preview}){
  const t=useT();
  const {locale}=useI18n();
  const frame=useRef(null);
  const bridge=useRef(null);
  const reported=useRef(false);
  const [playing,setPlaying]=useState(Boolean(saved));
  const [progress,setProgress]=useState(null);
  const [status,setStatus]=useState(saved?'done':'open');
  const [source,setSource]=useState(saved?.source);
  const [error,setError]=useState('');
  const [ready,setReady]=useState(false);
  const readyRef=useRef(false);
  const [timedOut,setTimedOut]=useState(false);
  const [reloadKey,setReloadKey]=useState(0);

  useEffect(()=>{if(saved){setStatus('done');setSource(saved.source);setPlaying(true);}},[saved]);

  useEffect(()=>{
    if(!playing||!lab?.src)return undefined;
    readyRef.current=false;setReady(false);setTimedOut(false);setError('');setProgress(null);reported.current=false;
    const markReady=()=>{readyRef.current=true;setReady(true);setTimedOut(false);};
    const connection=connectHost(window,frame.current,preview?previewLab(lab):lab,{locale,onMessage:message=>{
      if(message.type==='ready')markReady();
      else if(message.type==='progress'){markReady();setProgress(message);}
      else if(message.type==='error')setError(t('lab.error',{message:message.message}));
      else if(message.type==='answer'){
        setError('');
        api('lab-answer',{labId:message.labId,stopId:message.stopId,answer:message.answer})
          .then(result=>connection.sendVerdict(result.stop))
          .catch(err=>setError(t('lab.answerFailed',{message:err.message})));
      }
      else if(message.type==='complete'&&!preview&&!reported.current){
        reported.current=true;setStatus('saving');
        api('lab-complete',{labId:message.labId,result:message.result,...(message.evidence?{evidence:message.evidence}:{})})
          .then(result=>{setSource(result.lab.source);setStatus('done');})
          .catch(err=>{reported.current=false;setStatus('open');setError(t('lab.saveFailed',{message:err.message}));});
      }
    }});
    bridge.current=connection;connection.sendInit();
    const timer=setTimeout(()=>{if(!readyRef.current)setTimedOut(true);},READY_TIMEOUT_MS);
    return ()=>{clearTimeout(timer);connection.dispose();bridge.current=null;};
  },[lab,locale,preview,playing,reloadKey]);

  const retry=()=>{setError('');setTimedOut(false);setReady(false);setReloadKey(k=>k+1);};

  if(!lab?.src){
    return <article className="lab-embed lab-empty" data-lab-status="empty" role="status">
      <header><FlaskConical size={17}/><strong>{t('lab.heading')}</strong></header>
      <p className="muted">{preview?t('lab.emptyFacilitator'):t('lab.emptyLearner')}</p>
    </article>;
  }

  const statusText=status==='done'?t(source==='server-graded'?'lab.doneGraded':'lab.done'):status==='saving'?t('lab.saving'):progress?t('lab.progress',{step:progress.step,total:progress.total}):ready?t('lab.waiting'):t('lab.waiting');
  const showTimeout=playing&&timedOut&&!ready&&status!=='done';

  return <article className="lab-embed" data-lab-id={lab.id} data-lab-status={status} data-lab-playing={playing?'1':'0'}>
    <header><FlaskConical size={17}/><strong>{lab.title}</strong><span className={status==='done'?'progress-chip on':'progress-chip'} role="status">{status==='done'&&<Check size={13}/>}{playing?statusText:t('lab.readyToPlay')}</span></header>
    {preview&&<p className="muted">{t('lab.preview')}</p>}
    {error&&<p className="error" role="alert">{error} <button type="button" className="text-button" onClick={retry}><RotateCw size={13} aria-hidden="true"/>{t('lab.retry')}</button></p>}
    {showTimeout&&<p className="error" role="alert">{t('lab.timeout')} <button type="button" className="text-button" onClick={retry}><RotateCw size={13} aria-hidden="true"/>{t('lab.retry')}</button></p>}
    {!playing&&<div className="lab-play-surface">
      <p className="muted">{preview?t('lab.playHintFacilitator'):t('lab.playHint')}</p>
      <button type="button" className="gradient lab-play" onClick={()=>setPlaying(true)} data-testid="lab-play"><Play size={17} aria-hidden="true"/>{t('lab.play')}</button>
    </div>}
    {playing&&<iframe key={reloadKey} ref={frame} className="lab-frame" src={lab.src} title={lab.title} sandbox={SANDBOX} referrerPolicy="no-referrer" loading="lazy" onLoad={()=>bridge.current?.sendInit()} onError={()=>setError(t('lab.loadFailed'))}/>}
  </article>;
}

/** Empty lab slot when the day has no open lab — facilitator gets assign hint, learner gets wait copy. */
export function LabSlotEmpty({facilitator}){
  const t=useT();
  return <section className="lab-slot lab-slot-empty" aria-label={t('lab.heading')}>
    <h3>{t('lab.heading')}</h3>
    <article className="lab-embed lab-empty" data-lab-status="empty" role="status">
      <header><FlaskConical size={17}/><strong>{t('lab.heading')}</strong></header>
      <p className="muted">{facilitator?t('lab.emptyFacilitator'):t('lab.emptyLearner')}</p>
    </article>
  </section>;
}
