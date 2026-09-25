import React,{useState} from 'react';
import {MessageSquare,RefreshCw} from 'lucide-react';
import {useT} from './i18n';

export function AgentChatPanel(){
 const t=useT();
 const [attempt,setAttempt]=useState(0);
 const [loading,setLoading]=useState(true);
 const src=`/game/chat/embed?attempt=${attempt}`;
 return <section className="panel content-panel agent-chat">
  <div className="agent-chat-heading">
   <p className="cyan"><MessageSquare size={16}/>{t('agentChat.eyebrow')}</p>
   <h2>{t('agentChat.title')}</h2>
   <p className="lede">{t('agentChat.lede')}</p>
  </div>
  <div className="agent-chat-frame-wrap">
   {loading&&<div className="agent-chat-loading" role="status">{t('agentChat.loading')}</div>}
   <iframe
    key={attempt}
    className="agent-chat-frame"
    title={t('agentChat.frameTitle')}
    src={src}
    referrerPolicy="no-referrer"
    allow="clipboard-read; clipboard-write"
    onLoad={()=>setLoading(false)}
   />
  </div>
  <div className="agent-chat-foot">
   <button type="button" onClick={()=>{setLoading(true);setAttempt(a=>a+1);}}><RefreshCw size={14}/>{t('agentChat.retry')}</button>
  </div>
 </section>;
}
