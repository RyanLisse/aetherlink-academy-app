import React,{useEffect,useRef,useState} from 'react';
import {ArrowRight,BookOpen,Check,ChevronDown,ClipboardCheck,Code2,Copy,ExternalLink,HelpCircle,MoreHorizontal,Pause,Play,Presentation,RotateCw,Settings2,Sparkles,Users,X} from 'lucide-react';
import {Chat} from './chat';
import {Coach} from './panels';
import {useT} from './i18n';
import {clock} from './today';
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

function SessionCockpit({room,control,busy,connected,onNavigate}){
 const t=useT();
 const online=room.members.filter(m=>m.online);
 const help=room.members.filter(m=>m.help);
 const status=room.running?t('room.practice'):room.remaining===0?t('room.timeUp'):t('room.paused');
 const send=(...args)=>{if(!busy)control?.(...args);};
 return <div className="cockpit" data-testid="session-cockpit">
  <RoomInvite room={room}/>
  <section className="cockpit-card" aria-labelledby="cockpit-people" data-testid="cockpit-people">
   <h2 id="cockpit-people"><Users size={17} aria-hidden="true"/>{t('cockpit.people')}</h2>
   <p className="cockpit-stat">{online.length}<small>{t('cockpit.onlineOf',{total:room.members.length})}</small></p>
   {help.length>0&&<p className="cockpit-alert"><HelpCircle size={15} aria-hidden="true"/>{t('cockpit.help',{names:help.map(m=>m.name).join(', ')})}</p>}
   {room.members.length?<ul className="cockpit-members">{room.members.slice(0,6).map(m=><li key={m.id}><span className={'presence'+(m.online?' present':'')} aria-hidden="true"/>{m.name}<small>{m.role}</small></li>)}</ul>:<p className="muted">{t('cockpit.nobody')}</p>}
   <button type="button" className="text-button" onClick={()=>onNavigate('participants')}>{t('cockpit.allParticipants')}<ArrowRight size={15} aria-hidden="true"/></button>
  </section>
  <section className="cockpit-card" aria-labelledby="cockpit-round" data-testid="cockpit-round">
   <h2 id="cockpit-round">{t('fac.round')} {room.round} · {room.phase}</h2>
   <p className="cockpit-stat">{clock(room.remaining)}<small>{status}</small></p>
   <div className="cockpit-actions">
    <button type="button" disabled={!connected} aria-pressed={room.running} onClick={()=>send(room.running?'pause':'start')}>{room.running?<Pause size={16} aria-hidden="true"/>:<Play size={16} aria-hidden="true"/>}{room.running?t('cockpit.pauseRound'):t('cockpit.startRound')}</button>
    <button type="button" disabled={!connected} onClick={()=>send('next')}><RotateCw size={16} aria-hidden="true"/>{t('fac.nextRound')}</button>
   </div>
  </section>
 </div>;
}

function SessionChecklist({room,onNavigate}){
 const t=useT();
 const pending=room.evidence.filter(e=>e.status==='pending').length;
 const joined=room.members.length;
 const groups=[
  ['cockpit.before',[
   ['decks','simple.prepare','simple.prepareHelp',Presentation,room.classroomOverlayDeckId?t('cockpit.deckPinned'):null,Boolean(room.classroomOverlayDeckId)],
   ['participants','cockpit.invite','cockpit.inviteHelp',Users,joined?t('cockpit.joined',{count:joined}):t('cockpit.waiting'),joined>0],
  ]],
  ['cockpit.during',[
   ['lesson','simple.teach','simple.teachHelp',BookOpen,null,false],
   ['review','cockpit.review','cockpit.reviewHelp',ClipboardCheck,pending?t('cockpit.pending',{count:pending}):room.evidence.length?t('cockpit.reviewed'):null,room.evidence.length>0&&!pending],
  ]],
  ['cockpit.after',[
   ['debrief','simple.reflect','simple.reflectHelp',Users,room.board?t(room.board.status==='closed'?'cockpit.boardClosed':'cockpit.boardOpen'):null,room.board?.status==='closed'],
  ]],
 ];
 return <div className="simple-agenda" data-testid="session-checklist"><h2>{t('simple.today')}</h2>
  {groups.map(([heading,items])=><section key={heading} className="cockpit-phase" aria-label={t(heading)}><h3>{t(heading)}</h3>
   {items.map(([id,title,help,Icon,status,done])=><button type="button" key={title} data-state={done?'done':'todo'} onClick={()=>onNavigate(id)}>{done?<Check size={22} aria-hidden="true" className="cockpit-done"/>:<Icon size={22} aria-hidden="true"/>}<span><strong>{t(title)}</strong><small>{t(help)}</small></span>{status&&<span className={done?'progress-chip on':'progress-chip'}>{status}</span>}<ArrowRight size={18} aria-hidden="true"/></button>)}
  </section>)}
 </div>;
}

export function FacilitatorWorkspace({room,view,onNavigate,renderContent,controls,classroom,onPresent,account,error,connected,control,busy}){
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
     <SessionCockpit room={room} control={control} busy={busy} connected={connected} onNavigate={navigate}/>
     <SessionChecklist room={room} onNavigate={navigate}/>
     <div className="simple-help"><span>{t('simple.help')}</span><button type="button" onClick={()=>{setConnection(false);setAssistant(true);}}><Sparkles size={17}/>{t('simple.assistant')}</button></div>
    </section>:view==='participants'?<section className="simple-participants"><h1>{t('simple.participants')}</h1><p className="muted">{t('simple.participantHelp')}</p><RoomInvite room={room}/><ul>{room.members.map(m=><li key={m.id}><strong>{m.name}</strong><span>{m.role} · {m.online?t('roster.online'):t('roster.offline')}{m.help?' · '+t('roster.helpAsked'):''}</span></li>)}</ul>{!room.members.length&&<p>{t('roster.empty')}</p>}</section>:renderContent(setContext)}
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
