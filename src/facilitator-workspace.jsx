import React,{useEffect,useRef,useState} from 'react';
import {ArrowRight,BookOpen,ChevronDown,Code2,Copy,ExternalLink,MoreHorizontal,Presentation,Settings2,Sparkles,Users,X} from 'lucide-react';
import {Chat} from './chat';
import {Coach} from './panels';
import {useT} from './i18n';
import './facilitator-workspace.css';

function RoomInvite({room}){
 const t=useT();
 const [status,setStatus]=useState('');
 if(!room.code)return null;
 const link=`${location.origin}/?code=${room.code}`;
 const copy=async(text,done)=>{try{await navigator.clipboard.writeText(text);setStatus(t(done));}catch{setStatus(t('simple.copyBlocked'));}};
 return <section className="simple-invite" aria-labelledby="simple-invite-label">
  <p id="simple-invite-label" className="simple-invite-label">{t('roster.roomCode')}</p>
  <div className="simple-invite-row">
   <button type="button" className="simple-invite-code" aria-label={t('roster.copyCode',{code:room.code})} title={t('roster.copyCodeTitle')} onClick={()=>copy(room.code,'roster.codeCopied')}>{room.code}<Copy size={16} aria-hidden="true"/></button>
   <button type="button" onClick={()=>copy(link,'roster.linkCopied')}>{t('roster.copyLink')}</button>
   <button type="button" title={t('roster.testAsParticipantTitle')} onClick={()=>window.open(link,'_blank','noopener')}><ExternalLink size={15} aria-hidden="true"/>{t('roster.testAsParticipant')}</button>
  </div>
  <p className="simple-invite-status muted" role="status">{status}</p>
 </section>;
}

export function FacilitatorWorkspace({room,view,onNavigate,renderContent,controls,classroom,onPresent,account,error,connected}){
 const t=useT();
 const [assistant,setAssistant]=useState(false);
 const [connection,setConnection]=useState(false);
 const [settings,setSettings]=useState(false);
 const [context,setContext]=useState(null);
 const assistantButton=useRef(null);
 const drawer=useRef(null);
 const workshop=view==='workshop'||view==='squad';
 const navigate=next=>{onNavigate(next);setContext(null);};
 const closeAssistant=()=>{setAssistant(false);assistantButton.current?.focus();};
 useEffect(()=>{if(assistant)drawer.current?.querySelector('button')?.focus();},[assistant]);
 useEffect(()=>{if(!assistant)return;const escape=e=>{if(e.key==='Escape'){setAssistant(false);assistantButton.current?.focus();}if(e.key==='Tab'&&window.matchMedia('(max-width:760px)').matches){const nodes=[...drawer.current.querySelectorAll('button:not(:disabled),a[href],input,textarea,summary')].filter(node=>node.getClientRects().length);const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape);},[assistant]);
 return <div className="academy-simple">
  <header className="simple-header">
   <a className="simple-brand" href="#" onClick={e=>{e.preventDefault();navigate('workshop');}}>AetherLink <span>Academy</span></a>
   <nav className="simple-nav" aria-label={t('nav.main')}>
    {[['workshop','simple.workshop',workshop],['decks','simple.deck',view==='decks'],['lesson','simple.dayPack',view==='lesson'],['naslag','simple.resources',view==='naslag']].map(([id,label,selected])=><button type="button" key={id} className={selected?'simple-nav-active':undefined} aria-current={selected?'page':undefined} data-surface={id} onClick={()=>navigate(id)}>{t(label)}</button>)}
   </nav>
   <div className="simple-utilities">
    <button ref={assistantButton} type="button" aria-label={t('simple.assistant')} aria-expanded={assistant} aria-controls="academy-assistant" onClick={()=>setAssistant(value=>!value)}><Sparkles size={17}/><span>{t('simple.assistant')}</span></button>
    <details className="simple-more"><summary aria-label={t('simple.more')}><MoreHorizontal size={20}/></summary><div className="simple-menu">
     <button type="button" onClick={e=>{setSettings(value=>!value);e.currentTarget.closest('details').open=false;}}><Settings2 size={16}/>{t('simple.settings')}</button>
     <button type="button" onClick={e=>{navigate('participants');e.currentTarget.closest('details').open=false;}}><Users size={16}/>{t('simple.participants')}</button>
     {room.code&&<button type="button" onClick={e=>{window.open(`${location.origin}/?code=${room.code}`,'_blank','noopener');e.currentTarget.closest('details').open=false;}} title={t('roster.testAsParticipantTitle')}><ExternalLink size={16}/>{t('roster.testAsParticipant')}</button>}
     <div className="simple-menu-sep" role="separator"/>
     {['document','debrief','board','course','apps'].map(id=><button type="button" key={id} onClick={e=>{navigate(id);e.currentTarget.closest('details').open=false;}}>{t(id==='document'?'nav.squad':`nav.${id}`)}</button>)}
     <div className="simple-account">{account}</div>
    </div></details>
   </div>
  </header>
  {!connected&&<p className="simple-banner" role="status">{t('status.offlineHelp')}</p>}
  {error&&<div className="simple-banner error" role="alert">{error}</div>}
  {settings&&<section className="simple-settings"><div><h2>{t('simple.settings')}</h2><button type="button" onClick={()=>setSettings(false)} aria-label={t('simple.close')}><X size={18}/></button></div>{controls}</section>}
  <div className={'simple-layout'+(assistant?' has-assistant':'')}>
   <main className="simple-main">
    {workshop?<section className="simple-workshop">
     <p className="simple-eyebrow">{t('simple.facilitator')} · {t('classroom.dayHint',{day:room.day})}</p>
     <h1>{room.name}</h1><p className="simple-intro">{t('simple.intro')}</p>
     <button type="button" className="simple-primary" onClick={onPresent}><Presentation size={19}/>{t('simple.present')}</button>
     <RoomInvite room={room}/>
     <div className="simple-agenda"><h2>{t('simple.today')}</h2>
      {[['decks','simple.prepare','simple.prepareHelp',Presentation],['lesson','simple.teach','simple.teachHelp',BookOpen],['debrief','simple.reflect','simple.reflectHelp',Users]].map(([id,title,help,Icon])=><button type="button" key={id} onClick={()=>navigate(id)}><Icon size={22}/><span><strong>{t(title)}</strong><small>{t(help)}</small></span><ArrowRight size={18}/></button>)}
     </div>
     <div className="simple-help"><span>{t('simple.help')}</span><button type="button" onClick={()=>{setConnection(false);setAssistant(true);}}><Sparkles size={17}/>{t('simple.assistant')}</button></div>
    </section>:view==='participants'?<section className="simple-participants"><h1>{t('simple.participants')}</h1><p className="muted">{t('simple.participantHelp')}</p><RoomInvite room={room}/><ul>{room.members.map(m=><li key={m.id}><strong>{m.name}</strong><span>{m.online?t('roster.online'):t('roster.offline')}{m.help?' · '+t('roster.helpAsked'):''}</span></li>)}</ul>{!room.members.length&&<p>{t('roster.empty')}</p>}</section>:renderContent(setContext)}
   </main>
   {assistant&&<aside ref={drawer} id="academy-assistant" className="simple-assistant" aria-label={t('simple.assistantTitle')}>
    <div className="simple-assistant-heading"><div><h2>{t('simple.assistantTitle')}</h2><p>{t('classroom.dayHint',{day:room.day})}{context?.slideIndex!=null?` · ${t('decks.slideN',{n:context.slideIndex+1})}`:''}</p></div><button type="button" onClick={closeAssistant} aria-label={t('simple.close')}><X size={20}/></button></div>
    {context?.deckTitle&&<p className="simple-context">{context.deckTitle}</p>}
    <div className="simple-assistant-body">{connection?<Coach room={room}/>:<Chat room={room} onNavigate={next=>{if(next==='coach')setConnection(true);else navigate(next);}}/>}</div>
    <button type="button" className="simple-connect" onClick={()=>setConnection(value=>!value)}><Code2 size={18}/>{t(connection?'simple.backAssistant':'simple.connect')}<ChevronDown size={14}/></button>
   </aside>}
  </div>
  {classroom}
 </div>;
}
