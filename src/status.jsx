import React,{useEffect,useState} from 'react';
import {LoaderCircle,Inbox,AlertTriangle,WifiOff,Lock} from 'lucide-react';
import {api} from './api';
import {useT} from './i18n';

// One table for every panel state that is not "content": the role decides how
// assistive tech announces it, so a kind can never be announced inconsistently.
const KINDS={
  loading:{Icon:LoaderCircle,role:'status'},
  empty:{Icon:Inbox,role:undefined},
  error:{Icon:AlertTriangle,role:'alert'},
  offline:{Icon:WifiOff,role:'status'},
  readonly:{Icon:Lock,role:'status'},
};

export function StatusState({kind,title,children,action,inline=false}){
  const t=useT();
  const {Icon,role}=KINDS[kind];
  return <div className={`status-state status-${kind}${inline?' status-inline':''}`} role={role} data-status={kind}>
    <Icon size={inline?16:22} aria-hidden="true" className="status-icon"/>
    <div className="status-body"><strong>{title??t(`status.${kind}`)}</strong>{children&&<div className="status-detail">{children}</div>}</div>
    {action}
  </div>;
}

// Remote<T>: loading until the first answer, then ready or error. Keeps the last
// good data while a reload is in flight so panels never blank on refresh.
export function useRemote(path,deps=[]){
  const [state,setState]=useState({status:'loading'});
  const [tick,setTick]=useState(0);
  useEffect(()=>{
    if(!path)return;
    let active=true;
    api(path).then(data=>{if(active)setState({status:'ready',data});}).catch(e=>{if(active)setState({status:'error',message:e.message});});
    return()=>{active=false;};
  },[path,tick,...deps]);
  return {...state,reload:()=>setTick(n=>n+1)};
}

export function RemoteStatus({remote,loading,retry=true}){
  const t=useT();
  if(remote.status==='loading')return <StatusState kind="loading" title={loading}/>;
  if(remote.status==='error')return <StatusState kind="error" title={t('status.errorTitle')} action={retry?<button type="button" onClick={remote.reload}>{t('status.retry')}</button>:null}>{remote.message}</StatusState>;
  return null;
}
