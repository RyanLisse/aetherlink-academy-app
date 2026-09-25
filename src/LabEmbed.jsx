import React,{useEffect,useRef,useState} from 'react';
import {Check,FlaskConical} from 'lucide-react';
import {connectHost} from '../packages/lab-embed/src/index.ts';
import {api} from './api';
import {useT,useI18n} from './i18n';

// allow-same-origin keeps the lab's own origin so the origin check can hold; without it every lab reports "null".
const SANDBOX='allow-scripts allow-same-origin';

// A facilitator preview runs the lab ungraded: the server grades participants only.
const previewLab=lab=>({...lab,gradedStops:[]});

export function LabEmbed({lab,saved,preview}){
  const t=useT();
  const {locale}=useI18n();
  const frame=useRef(null);
  const bridge=useRef(null);
  const reported=useRef(false);
  const [progress,setProgress]=useState(null);
  const [status,setStatus]=useState(saved?'done':'open');
  const [source,setSource]=useState(saved?.source);
  const [error,setError]=useState('');
  useEffect(()=>{if(saved){setStatus('done');setSource(saved.source);}},[saved]);
  useEffect(()=>{
    const connection=connectHost(window,frame.current,preview?previewLab(lab):lab,{locale,onMessage:message=>{
      if(message.type==='progress')setProgress(message);
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
    return ()=>{connection.dispose();bridge.current=null;};
  },[lab,locale,preview]);
  const statusText=status==='done'?t(source==='server-graded'?'lab.doneGraded':'lab.done'):status==='saving'?t('lab.saving'):progress?t('lab.progress',{step:progress.step,total:progress.total}):t('lab.waiting');
  return <article className="lab-embed" data-lab-id={lab.id} data-lab-status={status}>
    <header><FlaskConical size={17}/><strong>{lab.title}</strong><span className={status==='done'?'progress-chip on':'progress-chip'} role="status">{status==='done'&&<Check size={13}/>}{statusText}</span></header>
    {preview&&<p className="muted">{t('lab.preview')}</p>}
    {error&&<p className="error" role="alert">{error}</p>}
    <iframe ref={frame} className="lab-frame" src={lab.src} title={lab.title} sandbox={SANDBOX} referrerPolicy="no-referrer" loading="lazy" onLoad={()=>bridge.current?.sendInit()}/>
  </article>;
}
