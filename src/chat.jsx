import React,{useEffect,useRef,useState} from 'react';
import {MessageCircle,Send,ExternalLink,Sparkles,Copy} from 'lucide-react';
import {api} from './api';
import {useT,useI18n} from './i18n';

const MAX_TURNS=5;

function ChatLink({link,onNavigate}){
 const t=useT();
 if(link.view)return <button type="button" className="chat-link" onClick={()=>onNavigate(link.view)}>{link.label||t(`nav.${link.view}`)}</button>;
 return <a className="chat-link" href={link.href} target="_blank" rel="noopener noreferrer">{link.label}<ExternalLink size={12} aria-hidden="true"/></a>;
}

export function Hit({hit,onNavigate}){
 const t=useT();
 return <div className="chat-hit">
  <strong>{hit.title}</strong>{hit.open&&<span className="chat-open">OPEN</span>}
  <p>{hit.answer}</p>
  {hit.links.length>0&&<div className="chat-links">{hit.links.map((link,j)=><ChatLink key={j} link={link} onNavigate={onNavigate}/>)}</div>}
  <small className="muted">{t('chat.source')} {hit.source.href?<a href={hit.source.href} target="_blank" rel="noopener noreferrer">{hit.source.label}</a>:hit.source.label}</small>
 </div>;
}

function Handoff({handoff,onNavigate}){
 const t=useT();
 const [copied,setCopied]=useState(false);
 async function copy(){try{await navigator.clipboard.writeText(handoff.prompt);setCopied(true);}catch{setCopied(false);}}
 return <div className="chat-handoff"><strong><Sparkles size={14} aria-hidden="true"/> {handoff.title}</strong>{handoff.text&&<p>{handoff.text}</p>}<p className="muted">{t('chat.promptLabel')}</p><blockquote>{handoff.prompt}</blockquote><div className="chat-links"><button type="button" className="chat-link" onClick={copy}><Copy size={12} aria-hidden="true"/>{copied?t('chat.copied'):t('chat.copyPrompt')}</button><button type="button" className="chat-link" onClick={()=>onNavigate(handoff.link.view)}>{handoff.link.label}</button></div></div>;
}

export function Chat({room,onNavigate}){
 const t=useT();
 const {locale}=useI18n();
 const [query,setQuery]=useState('');
 const [turns,setTurns]=useState([]);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const logRef=useRef(null);
 useEffect(()=>{setTurns([]);},[room.day]);
 useEffect(()=>{logRef.current?.lastElementChild?.scrollIntoView?.({block:'nearest'});},[turns]);
 async function ask(e){
  e.preventDefault();
  const q=query.trim();
  if(!q||busy)return;
  setBusy(true);setError('');
  try{const result=await api('chat',{q,locale});setTurns(list=>[...list.slice(1-MAX_TURNS),result]);setQuery('');}
  catch(err){setError(err.message);}
  finally{setBusy(false);}
 }
 const participantsOff=room.me.role==='Facilitator'&&!room.chat;
 return <section className="panel chat" aria-labelledby="chat-heading">
  <div className="panel-heading"><h2 id="chat-heading">{t('chat.title')}</h2><MessageCircle size={17} aria-hidden="true"/></div>
  <p className="muted chat-lede">{t('chat.lede')}</p>
  {participantsOff&&<p className="chat-off">{t('chat.offForParticipants')}</p>}
  <div className="chat-log" ref={logRef} role="log" aria-live="polite" aria-label={t('chat.log')}>
   {turns.map((turn,i)=><article className="chat-turn" key={i}>
    <p className="chat-question"><span className="muted">{t('chat.you')}</span> {turn.query}</p>
    {turn.hits[0]&&<Hit hit={turn.hits[0]} onNavigate={onNavigate}/>}
    {turn.hits.length>1&&<details className="chat-more"><summary>{t('chat.more',{count:turn.hits.length-1})}</summary>{turn.hits.slice(1).map(hit=><Hit key={hit.id} hit={hit} onNavigate={onNavigate}/>)}</details>}
    {turn.handoff&&<Handoff handoff={turn.handoff} onNavigate={onNavigate}/>}
   </article>)}
  </div>
  {error&&<p className="error" role="alert">{error}</p>}
  <form className="chat-form" onSubmit={ask}>
   <label htmlFor="chat-input">{t('chat.label')}</label>
   <div className="chat-row"><input id="chat-input" value={query} onChange={e=>setQuery(e.target.value)} maxLength={300} placeholder={t('chat.placeholder')} autoComplete="off"/><button type="submit" disabled={busy||!query.trim()} aria-label={t('chat.send')}><Send size={16} aria-hidden="true"/></button></div>
  </form>
 </section>;
}
