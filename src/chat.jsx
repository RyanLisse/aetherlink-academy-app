import React,{useState} from 'react';
import {MessageSquare,RefreshCw} from 'lucide-react';
import {useT} from './i18n';

export function ChatPanel(){
 const t=useT();
 const [attempt,setAttempt]=useState(0);
 const [loading,setLoading]=useState(true);
 const src=`/game/chat/embed?attempt=${attempt}`;
 return <section className="panel content-panel chat-panel">
  <div className="chat-panel-heading">
   <p className="cyan"><MessageSquare size={16}/>{t('chat.eyebrow')}</p>
   <h2>{t('chat.title')}</h2>
   <p className="lede">{t('chat.lede')}</p>
  </div>
  <div className="chat-frame-wrap">
   {loading&&<div className="chat-loading" role="status">{t('chat.loading')}</div>}
   <iframe
    key={attempt}
    className="chat-frame"
    title={t('chat.frameTitle')}
    src={src}
    referrerPolicy="no-referrer"
    allow="clipboard-read; clipboard-write"
    onLoad={()=>setLoading(false)}
   />
  </div>
  <div className="chat-panel-foot">
   <button type="button" onClick={()=>{setLoading(true);setAttempt(a=>a+1);}}><RefreshCw size={14}/>{t('chat.retry')}</button>
  </div>
 </section>;
}
