import React,{useEffect,useRef,useState} from 'react';
import {Check,FlaskConical} from 'lucide-react';
import {connectHost} from '../packages/lab-embed/src/index.ts';
import {api} from './api';
import {useT,useI18n} from './i18n';

// allow-same-origin keeps the lab's own origin so the origin check can hold; without it every lab reports "null".
const SANDBOX='allow-scripts allow-same-origin';

export function LabEmbed({lab,done,preview}){
  const t=useT();
  const {locale}=useI18n();
  const frame=useRef(null);
  const bridge=useRef(null);
  const reported=useRef(false);
  const [progress,setProgress]=useState(null);
  const [status,setStatus]=useState(done?'done':'open');
  const [error,setError]=useState('');
  useEffect(()=>{if(done)setStatus('done');},[done]);
  useEffect(()=>{
    const connection=connectHost(window,frame.current,lab,{locale,onMessage:message=>{
      if(message.type==='progress')setProgress(message);
      else if(message.type==='error')setError(message.message);
      else if(message.type==='complete'&&!preview&&!reported.current){
        reported.current=true;setStatus('saving');
        api('lab-complete',{labId:message.labId,result:message.result,...(message.evidence?{evidence:message.evidence}:{})})
          .then(()=>setStatus('done'))
          .catch(err=>{reported.current=false;setStatus('open');setError(err.message);});
      }
    }});
    bridge.current=connection;connection.sendInit();
    return ()=>{connection.dispose();bridge.current=null;};
  },[lab,locale,preview]);
  const statusText=status==='done'?t('lab.done'):status==='saving'?t('lab.saving'):progress?t('lab.progress',{step:progress.step,total:progress.total}):t('lab.waiting');
  return <article className="lab-embed" data-lab-id={lab.id} data-lab-status={status}>
    <header><FlaskConical size={17}/><strong>{lab.title}</strong><span className={status==='done'?'progress-chip on':'progress-chip'} role="status">{status==='done'&&<Check size={13}/>}{statusText}</span></header>
    {preview&&<p className="muted">{t('lab.preview')}</p>}
    {error&&<p className="error" role="alert">{t('lab.error',{message:error})}</p>}
    <iframe ref={frame} className="lab-frame" src={lab.src} title={lab.title} sandbox={SANDBOX} referrerPolicy="no-referrer" loading="lazy" onLoad={()=>bridge.current?.sendInit()}/>
  </article>;
}
