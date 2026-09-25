import React,{useEffect,useState,useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {Users,BookOpen,Compass,Target,Sparkles,ClipboardCheck,Sun,Moon,ArrowRight,Clock,Play,Pause,RotateCw,Shuffle,HelpCircle,Check,LogOut,Copy,FileText,ExternalLink,Presentation,X,LayoutGrid,Link,Columns3,Plus,Download} from 'lucide-react';
import {api,authApi,getToken,getParticipantAccess,saveParticipantAccess,forgetParticipantAccess,participantAccessUrl,saveSession} from './api';
import {AppsLauncher} from './portal/AppsLauncher.jsx';
import {Knowledge,Coach,Lesson,Solo,Review,Route,Debrief} from './panels';
import {Decks} from './slides';
import {Chat} from './chat';
import {reportScreen,startScreenReporting} from './screen';
import {I18nProvider,LanguageToggle,useT,useI18n} from './i18n';
import {classroomEmbedUrl,CLASSROOM_SANDBOX} from './classroom';
import {connectBoard} from './board-doc';
import {ArcadeApp, isArcadePath} from './arcade/ArcadeApp.jsx';
import './style.css';

const phases=['Plan','Design','Build','Test','Deploy','Maintain'];
const navIds=[
  ['squad','nav.squad',Users],
  ['route','nav.route',Compass],
  ['lesson','nav.lesson',BookOpen],
  ['solo','nav.solo',Target],
  ['coach','nav.coach',Sparkles],
  ['review','nav.review',ClipboardCheck],
  ['decks','nav.decks',Presentation],
  ['apps','nav.apps',LayoutGrid],
];

function loginErrorMessage(t,code){
  const key=`join.login.${code}`;
  const mapped=t(key);
  return mapped===key?t('join.login.generic'):mapped;
}
function initialLoginError(t){
  const code=new URLSearchParams(location.search).get('login_error');
  if(!code)return '';
  return loginErrorMessage(t,code);
}

function App(){
  const t=useT();
  const {locale}=useI18n();
  const [theme,setTheme]=useState(()=>localStorage.getItem('academy-theme')||'dark');
  const [session,setSession]=useState(!!getToken());
  const [room,setRoom]=useState(null);
  const [view,setView]=useState('squad');
  const [error,setError]=useState(()=>initialLoginError(t));
  const [connected,setConnected]=useState(false);
  const [busy,setBusy]=useState(false);
  const [copied,setCopied]=useState(null);
  const [classroomOpen,setClassroomOpen]=useState(false);
  const accessFromUrl=useRef(new URLSearchParams(location.hash.slice(1)).get('access')).current;
  const [participantAccess,setParticipantAccess]=useState(()=>accessFromUrl||getParticipantAccess());
  const copiedTimer=useRef(null);
  useEffect(()=>()=>clearTimeout(copiedTimer.current),[]);
  useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('academy-theme',theme);},[theme]);
  useEffect(()=>{if(!accessFromUrl)return;const url=new URL(location.href);url.hash='';history.replaceState(null,'',url.pathname+url.search);},[accessFromUrl]);
  useEffect(()=>{if(session||!participantAccess)return;let active=true;setBusy(true);api('participant/resume',{resumeToken:participantAccess}).then(result=>{if(!active)return;saveParticipantAccess(participantAccess);saveSession(result);setSession(true);}).catch(e=>{if(!active)return;if(getParticipantAccess()===participantAccess)forgetParticipantAccess();setParticipantAccess(null);setError(e.message);}).finally(()=>{if(active)setBusy(false);});return()=>{active=false;};},[session,participantAccess]);
  useEffect(()=>{if(!session)return;let active=true;const poll=async()=>{try{const r=await api('state');if(active){setRoom(r);setConnected(true);}}catch(e){if(active){setConnected(false);setError(e.message);}}};api('resume',{}).then(poll).catch(e=>{sessionStorage.removeItem('academy-token');setRoom(null);setConnected(false);setSession(false);if(!participantAccess)setError(e.message);});const timer=setInterval(poll,2000);return()=>{active=false;clearInterval(timer);};},[session,participantAccess]);
  const participant=Boolean(room)&&room.me.role!=='Facilitator';
  useEffect(()=>{if(!participant)return;reportScreen({view});return startScreenReporting();},[participant,view]);
  const showCopied=kind=>{setCopied(kind);clearTimeout(copiedTimer.current);copiedTimer.current=setTimeout(()=>setCopied(null),1500);};
  async function action(fn){setBusy(true);setError('');try{return await fn();}catch(e){setError(e.message);return null;}finally{setBusy(false);}}
  async function leaveSession(){setBusy(true);setError('');try{await api('logout',{});sessionStorage.removeItem('academy-token');sessionStorage.removeItem('academy-mcp-'+room.me.id);sessionStorage.removeItem(`academy-agent-setup:${room.id}:${room.me.id}`);forgetParticipantAccess();location.reload();}catch(err){setError(err.message);}finally{setBusy(false);}}
  const themeButton=<button className="icon-button" aria-label={theme==='dark'?t('theme.light'):t('theme.dark')} onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={19}/>:<Moon size={19}/>}</button>;
  const localeToggle=<LanguageToggle/>;
  if(isArcadePath(location.pathname))return <ArcadeApp themeButton={themeButton}/>;
  if(!session||!room)return <><header className="welcome-header"><Brand/><div className="welcome-actions">{localeToggle}{themeButton}</div></header><Join ready={session} action={action} busy={busy} error={error} joined={resumeToken=>{if(resumeToken)setParticipantAccess(resumeToken);setSession(true);}}/></>;
  const facilitator=room.me.role==='Facilitator';
  const control=(actionName,value)=>action(async()=>{const r=await api('control',{action:actionName,value});setRoom(r);});
  const dayLabel=room.day<=2?t('room.guided'):room.day===3?t('room.coached'):room.day===4?t('room.hints'):t('room.independent');
  const roundStatus=room.running?t('room.practice'):room.remaining===0?t('room.timeUp'):t('room.paused');
  const modeLabel=({lesson:t('roster.mode.lesson'),solo:t('roster.mode.solo'),squad:t('roster.mode.squad'),review:t('roster.mode.review')})[room.mode]||room.mode;
  const contribution=facilitator?t('roster.contributionFacilitator'):room.me.role==='Driver'?t('roster.contributionDriver'):t('roster.contributionNavigator');
  return <div className="app" key={locale}>
    <header className="topbar"><Brand/><div className="account"><span className={'connection '+(connected?'online':'offline')} role="status" aria-live="polite"><i/>{connected?t('account.connected'):t('account.disconnected')}</span>{localeToggle}{themeButton}<span className="avatar small">{room.me.name.slice(0,2).toUpperCase()}</span><span>{room.me.name}</span><button className="icon-button" aria-label={t('account.leave')} onClick={leaveSession}><LogOut size={17}/></button></div></header>
    <aside className="sidebar"><nav aria-label={t('nav.main')}>{navIds.map(([id,labelKey,Icon])=><button key={id} className={view===id?'selected':''} onClick={()=>setView(id)}><Icon size={19}/>{t(labelKey)}</button>)}{(facilitator||room.board)&&<button className={view==='board'?'selected':''} onClick={()=>setView('board')}><Columns3 size={19}/>{t('nav.board')}</button>}{facilitator&&<button className={view==='debrief'?'selected':''} onClick={()=>setView('debrief')}><ClipboardCheck size={19}/>{t('nav.debrief')}</button>}</nav><div className="sidebar-bottom"><span>{t('nav.tagline1')}</span><span>{t('nav.tagline2')}</span><strong>{t('nav.tagline3')}</strong><hr/><small>{t('nav.schedule')}</small></div></aside>
    <main>
      <div className="room-heading"><div><p className="muted">{t('room.supportDay',{day:room.day})} · {dayLabel}</p><h1>{room.name}</h1></div><div className="round"><span>{t('room.round',{round:room.round})} · {roundStatus}</span><strong><Clock size={22}/><Timer room={room}/></strong></div></div>
      <div className="sdlc" aria-label={t('room.sdlc')}>{phases.map((p,i)=><React.Fragment key={p}><div className={p===room.phase?'active':''}><span>{p}</span></div>{i<5&&<span className="phase-line"/>}</React.Fragment>)}</div>
      {error&&<div className="error" role="alert">{error}<button onClick={()=>setError('')} aria-label={t('common.closeAlert')}>×</button></div>}
      {facilitator&&<FacilitatorControls room={room} control={control} busy={busy} connected={connected} onOpenClassroom={()=>setClassroomOpen(true)}/>}
      {facilitator&&classroomOpen&&<ClassroomOverlay room={room} onClose={()=>setClassroomOpen(false)}/>}
      <div className="workspace">
        <section className="primary">{view==='squad'&&<Document room={room} theme={theme}/>}{view==='route'&&<Route room={room} onNavigate={setView}/>}{view==='lesson'&&<Lesson room={room} action={action} busy={busy}/>}{view==='solo'&&<Solo room={room} action={action} busy={busy} onNavigate={setView}/>}{view==='coach'&&<Coach room={room} action={action}/>}{view==='review'&&<Review room={room} action={action} busy={busy}/>}{view==='decks'&&<Decks room={room} action={action} busy={busy}/>}{view==='apps'&&<AppsLauncher action={action} busy={busy} facilitator={facilitator} hostKey={''}/>}{view==='debrief'&&facilitator&&<Debrief room={room}/>}{view==='board'&&<Board room={room} action={action} busy={busy} onBoard={board=>setRoom(current=>({...current,board}))}/>}</section>
        <aside className="right-rail">
          <section className="panel roster">
            <div className="panel-heading"><h2>{t('roster.title')} <span>({room.members.length}/{t('roster.softMax')})</span></h2><Users size={17}/></div>
            {room.members.length===0&&<p className="muted">{t('roster.empty')}</p>}
            {room.members.map(m=><div className="member" key={m.id}><span className="avatar">{m.name.slice(0,2).toUpperCase()}</span><div><strong>{m.name}{m.id===room.me.id?` ${t('common.you')}`:''}</strong><small className={m.role==='Driver'?'cyan':''}>{m.role}</small></div><span className={'presence '+(m.online?'present':'')} title={m.online?t('roster.online'):t('roster.offline')}/>{m.help&&<HelpCircle size={17} className="cyan" aria-label={t('roster.helpAsked')}/>}</div>)}
            <div className="room-code"><small>{t('roster.roomCode')}</small><div className="room-code-actions"><button className="room-code-display" type="button" onClick={()=>action(async()=>{await navigator.clipboard.writeText(room.code);showCopied('code');})} aria-label={t('roster.copyCode',{code:room.code})} title={t('roster.copyCodeTitle')}>{room.code}{copied==='code'?<Check size={14}/>:<Copy size={14}/>}</button><button className="room-code-link" type="button" onClick={()=>action(async()=>{await navigator.clipboard.writeText(`${location.origin}/?code=${room.code}`);showCopied('link');})} title={t('roster.copyLink')}>{copied==='link'?t('roster.linkCopied'):t('roster.copyLink')}</button>{room.me.role==='Facilitator'&&<button className="room-code-link" type="button" onClick={()=>window.open(`${location.origin}/?code=${room.code}`,'_blank','noopener')} title={t('roster.testAsParticipantTitle')}><ExternalLink size={14}/>{t('roster.testAsParticipant')}</button>}</div><span className="sr-only" role="status">{copied==='code'?t('roster.codeCopied'):copied==='link'?t('roster.inviteCopied'):''}</span></div>
            {!facilitator&&<div className="participant-access"><small>{t('access.title')}</small><p>{t('access.help')}</p><button type="button" onClick={()=>action(async()=>{let resumeToken=participantAccess;if(!resumeToken){const result=await api('participant/access',{});resumeToken=result.resumeToken;saveParticipantAccess(resumeToken);setParticipantAccess(resumeToken);}await navigator.clipboard.writeText(participantAccessUrl(resumeToken));showCopied('access');})}><Link size={14}/>{copied==='access'?t('access.copied'):t('access.copy')}</button><span className="sr-only" role="status">{copied==='access'?t('access.copiedStatus'):''}</span></div>}
            {room.members.length<4&&<small className="muted">{t('roster.minMembers')}</small>}
          </section>
          <section className="panel contribution"><FileText size={20}/><h2>{t('roster.contribution')}</h2><p>{contribution}</p><small className="muted">{t('roster.modeLabel',{mode:modeLabel})}</small></section>
          <button className="gradient coach-cta" onClick={()=>setView('coach')}><Sparkles size={18}/>{t('roster.askCoach')}<ArrowRight size={17}/></button>
          {(facilitator||room.chat)&&<Chat room={room} onNavigate={setView}/>}
          {!facilitator&&<button className="help-button" onClick={()=>action(()=>api('help',{}))}><HelpCircle size={16}/>{room.me.help?t('roster.helpOn'):t('roster.helpOff')}</button>}
        </aside>
      </div>
      <footer>{t('room.footer')}</footer>
    </main>
  </div>;
}

function ClassroomOverlay({room,onClose}){
  const t=useT();
  const frameRef=useRef(null);
  const shellRef=useRef(null);
  useEffect(()=>{
    const prevOverflow=document.body.style.overflow;
    const returnFocusTo=document.activeElement;
    document.body.style.overflow='hidden';
    try{if(!navigator.webdriver)document.documentElement.requestFullscreen?.();}catch{}
    const exit=()=>{
      try{if(document.fullscreenElement)document.exitFullscreen?.();}catch{}
      onClose();
    };
    const focusable=()=>[...(shellRef.current?.querySelectorAll('button,iframe,[href],[tabindex]:not([tabindex="-1"])')||[])].filter(el=>!el.disabled);
    // Walk to the next element that actually accepts focus: an iframe is only
    // tabbable when its content is, so a fixed first/last pair is not reliable.
    const step=(items,active,back)=>{
      const n=items.length;
      let i=items.indexOf(active);
      if(i===-1)i=back?0:n-1;
      for(let k=0;k<n;k++){
        i=back?(i-1+n)%n:(i+1)%n;
        items[i].focus();
        if(document.activeElement===items[i])return true;
      }
      return false;
    };
    const onKey=e=>{
      if(e.key==='Escape'){e.preventDefault();exit();return;}
      if(e.key!=='Tab')return;
      // The deck covers the whole app, so focus behind it is invisible: drive Tab
      // ourselves instead of letting it reach the room controls underneath.
      const items=focusable();
      if(!items.length)return;
      e.preventDefault();
      step(items,document.activeElement,e.shiftKey);
    };
    // Safety net for focus we cannot see leaving: once it is inside the
    // cross-origin deck, its Tab keys never reach this document, so the browser
    // can hand focus back to whatever follows the overlay. Pull it in again.
    const onFocusIn=e=>{
      const shell=shellRef.current;
      if(!shell||shell.contains(e.target))return;
      const items=focusable();
      if(items.length)step(items,null,false);
    };
    document.addEventListener('focusin',onFocusIn);
    window.addEventListener('keydown',onKey);
    focusable()[0]?.focus();
    return()=>{
      window.removeEventListener('keydown',onKey);
      document.removeEventListener('focusin',onFocusIn);
      document.body.style.overflow=prevOverflow;
      try{if(document.fullscreenElement)document.exitFullscreen?.();}catch{}
      returnFocusTo?.focus?.();
    };
  },[onClose]);
  const exit=()=>{try{if(document.fullscreenElement)document.exitFullscreen?.();}catch{}onClose();};
  return <div ref={shellRef} className="classroom-overlay" role="dialog" aria-modal="true" aria-label={t('classroom.title')} data-testid="classroom-overlay">
    <div className="classroom-chrome">
      <div className="classroom-chrome-left">
        <Presentation size={18}/>
        <strong>{t('classroom.title')}</strong>
        <span className="classroom-day-hint">{t('classroom.dayHint',{day:room.day})}</span>
        <span className="muted classroom-room-hint">{room.name}</span>
      </div>
      <button type="button" className="classroom-exit" onClick={exit} aria-label={t('classroom.exit')}><X size={16}/>{t('classroom.exitShort')}</button>
    </div>
    <iframe ref={frameRef} className="classroom-frame" src={classroomEmbedUrl(room.day)} title={t('classroom.frameTitle')} sandbox={CLASSROOM_SANDBOX} allow="fullscreen" allowFullScreen/>
  </div>;
}

function Brand(){const t=useT();return <div className="brand">AetherLink <span>{t('brand.academy')}</span></div>;}

function Join({ready,action,busy,error,joined}){
  const t=useT();
  const params=new URLSearchParams(location.search);
  const [mode,setMode]=useState(params.get('facilitator')==='1'?'create':'join');
  const [code,setCode]=useState(()=>params.get('code')?.toUpperCase()||'');
  const [hostKey,setHostKey]=useState('');
  const [overview,setOverview]=useState(null);
  const [googleSso,setGoogleSso]=useState(false);
  const [facilitator,setFacilitator]=useState(null);
  const nameRef=useRef(null);
  const roleRef=useRef(null);
  useEffect(()=>{if(code)nameRef.current?.focus();else roleRef.current?.focus();},[]);
  useEffect(()=>{let active=true;(async()=>{try{const config=await api('config');if(!active)return;setGoogleSso(config.googleSso);if(params.get('facilitator')==='1'||config.googleSso)try{const identity=await api('facilitator/me');if(active){setFacilitator(identity);if(!params.get('code'))setMode('create');}}catch{}}catch{}})();return()=>{active=false;};},[]);
  const create=mode==='create',facilitatorOverview=mode==='overview',participant=!create&&!facilitatorOverview;
  const setRole=next=>{setMode(next);setOverview(null);};
  const plainError=error&&(
    /ongeldige facilitator-startsleutel|start key/i.test(error)?t('join.err.hostKey'):
    /deelnemerslink is ongeldig/i.test(error)?t('join.err.accessInvalid'):
    /naam is al in gebruik/i.test(error)?t('join.err.duplicate'):
    /kamer niet gevonden|ongeldige kamercode|niet gevonden|room not found|invalid room/i.test(error)?t('join.err.room'):
    /vol|volzet|maximaal|te veel|full|capacity/i.test(error)?t('join.err.full'):
    error
  );
  const heading=facilitatorOverview?t('join.heading.overview'):create?t('join.heading.create'):t('join.heading.join');
  const hint=facilitatorOverview?(facilitator?t('join.hint.overviewAuthed'):t('join.hint.overviewKey')):create?(facilitator?t('join.hint.createAuthed'):googleSso?t('join.hint.createGoogle'):t('join.hint.createKey')):t('join.hint.join');
  return <main className="join">
    <div className="join-copy"><p className="muted">{t('join.eyebrow')}</p><h1>{t('join.title')}<br/><span>{t('join.titleAccent')}</span></h1><p>{t('join.lede').split('\n').map((line,i)=><React.Fragment key={i}>{line}{i===0&&<br/>}</React.Fragment>)}</p><div className="join-principles"><span><Users/>{t('join.principle.squad')}</span><span><FileText/>{t('join.principle.intent')}</span><span><Sparkles/>{t('join.principle.coach')}</span></div></div>
    <section className="join-form panel" aria-labelledby="join-heading">
      <div className="join-role" role="tablist" aria-label={t('join.roleList')}>
        <button ref={roleRef} type="button" role="tab" className={participant?'selected':''} aria-selected={participant} onClick={()=>setRole('join')}>{t('join.participant')}</button>
        <button type="button" role="tab" className={create?'selected':''} aria-selected={create} onClick={()=>setRole('create')}>{t('join.facilitator')}</button>
      </div>
      <h2 id="join-heading">{heading}</h2>
      <p className="muted">{hint}</p>
      {facilitator&&<p className="facilitator-login" aria-live="polite">{t('join.signedIn',{name:facilitator.name,email:facilitator.email})} <button type="button" className="text-button" onClick={()=>action(async()=>{await authApi('logout',{});setFacilitator(null);setMode('join');})}>{t('join.signOut')}</button></p>}
      {create&&!facilitator&&googleSso&&<div className="join-google-block">
        <p className="join-google-lede">{t('join.googleLede')}</p>
        <a className="gradient google-login" href="/auth/google/start"><strong>G</strong> {t('join.googleButton')}</a>
        <p className="join-or" role="separator"><span>{t('join.orKey')}</span></p>
      </div>}
      <p className="muted" data-arcade-entry><a href="/arcade">Agent Arcade — je eerste agent</a> (LIS-59)</p>
      <form onSubmit={e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));action(async()=>{if(facilitatorOverview){setOverview(await api('facilitator/overview',data));return;}const result=await api(create?'create':'join',data);saveSession(result);if(!create)history.replaceState(null,'',location.pathname);joined(result.resumeToken);});}}>
        {!facilitatorOverview&&<label htmlFor="join-name">{create?t('join.nameSquad'):t('join.nameYou')}<input id="join-name" ref={!create?nameRef:null} name="name" required maxLength={50} placeholder={create?t('join.placeholderSquad'):t('join.placeholderName')} autoComplete="nickname"/></label>}
        {(facilitatorOverview||create)&&!facilitator&&<label htmlFor="join-hostkey">{t('join.hostKey')}<input id="join-hostkey" name="hostKey" value={hostKey} onChange={e=>setHostKey(e.target.value)} required={!googleSso||facilitatorOverview} type="password" autoComplete="off" placeholder={t('join.hostKeyPlaceholder')}/></label>}
        {participant&&<label htmlFor="join-code">{t('join.roomCode')}<input id="join-code" name="code" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} required type="text" autoComplete="off" placeholder={t('join.roomCodePlaceholder')} spellCheck={false}/></label>}
        <button type="submit" className="gradient" disabled={busy}>{busy?t('join.submitBusy'):facilitatorOverview?t('join.submitOverview'):create?t('join.submitCreate'):t('join.submitJoin')}<ArrowRight size={18}/></button>
      </form>
      <div className="join-live" aria-live="assertive">{plainError&&<p className="error" role="alert">{plainError}</p>}</div>
      {!create&&!facilitatorOverview&&googleSso&&!facilitator&&<p className="join-side-hint muted">{t('join.sideHint')}</p>}
      <button type="button" className="text-button" onClick={()=>{setMode('overview');setOverview(null);}}>{t('join.overviewLink')}</button>
      {ready&&<p className="muted" aria-live="polite">{t('join.restoring')}</p>}
      <small>{t('join.noApiKey')}</small>
      {facilitatorOverview&&overview&&<FacilitatorOverview squads={overview} hostKey={hostKey} action={action} joined={joined} onError={e=>action(async()=>{throw e;})}/>}
    </section>
  </main>;
}

function FacilitatorControls({room,control,busy,connected,onOpenClassroom}){
  const t=useT();
  const [time,setTime]=useState(String(Math.ceil(room.remaining/60)));
  const [duration,setDuration]=useState(String(Math.ceil((room.roundSeconds||1500)/60)));
  useEffect(()=>setTime(String(Math.ceil(room.remaining/60))),[room.remaining]);
  useEffect(()=>setDuration(String(Math.ceil((room.roundSeconds||1500)/60))),[room.roundSeconds]);
  const commit=(draft,name)=>{const minutes=Number(draft);if(Number.isFinite(minutes))control(name,minutes*60);};
  const enter=e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur();}};
  const disabled=busy||!connected;
  return <div className="facilitator-controls" role="toolbar" aria-label={t('fac.toolbar')}>
    <div className="facilitator-controls-row facilitator-controls-time">
      <strong id="facilitator-label">{t('fac.label')}</strong>
      <button type="button" disabled={disabled} onClick={()=>control(room.running?'pause':'start')} aria-pressed={room.running}>{room.running?<Pause size={16}/>:<Play size={16}/>} {room.running?t('fac.pause'):t('fac.startTimer')}</button>
      <button type="button" disabled={disabled} onClick={()=>control('next')}><RotateCw size={16}/>{t('fac.nextRound')}</button><button type="button" disabled={disabled||!room.members.length} onClick={()=>control('shuffle')}><Shuffle size={16}/>{t('fac.shuffleRoles')}</button>
      <label>{t('fac.timeMin')}<input type="number" min={0} max={120} value={time} onChange={e=>setTime(e.target.value)} onBlur={()=>commit(time,'time')} onKeyDown={enter} aria-describedby="facilitator-label"/></label>
      <button type="button" disabled={disabled} onClick={()=>control('time',Math.max(0,room.remaining+300))} aria-label={t('fac.plus5')}>+5 min</button>
      <button type="button" disabled={disabled} onClick={()=>control('time',Math.max(0,room.remaining-300))} aria-label={t('fac.minus5')}>-5 min</button>
      <label>{t('fac.roundMin')}<input type="number" min={1} max={120} value={duration} onChange={e=>setDuration(e.target.value)} onBlur={()=>commit(duration,'duration')} onKeyDown={enter}/></label>
    </div>
    <div className="facilitator-controls-row facilitator-controls-context" aria-label={t('fac.context')}>
      <label>{t('fac.phase')}<select value={room.phase} onChange={e=>control('phase',e.target.value)}>{phases.map(p=><option key={p}>{p}</option>)}</select></label>
      <label>{t('fac.day')}<select value={room.day} onChange={e=>control('day',Number(e.target.value))}>{Array.from({length:7},(_,i)=>i+1).map(n=><option key={n}>{n}</option>)}</select></label>
      <label>{t('fac.format')}<select value={room.mode} onChange={e=>control('mode',e.target.value)}><option value="lesson">{t('fac.format.lesson')}</option><option value="solo">{t('fac.format.solo')}</option><option value="squad">{t('fac.format.squad')}</option><option value="review">{t('fac.format.review')}</option></select></label>
      <label className="facilitator-toggle"><input type="checkbox" checked={room.chat} disabled={disabled} onChange={e=>control('chat',e.target.checked)}/>{t('fac.chat')}</label>
      <button type="button" className="classroom-open" onClick={onOpenClassroom} aria-label={t('classroom.open')}><Presentation size={16}/>{t('classroom.title')}</button>
    </div>
  </div>;
}

function FacilitatorOverview({squads:initial,hostKey,action,joined,onError}){
  const t=useT();
  const [squads,setSquads]=useState(initial);
  useEffect(()=>{let active=true;const poll=async()=>{try{const next=await api('facilitator/overview',{hostKey});if(active)setSquads(next);}catch(e){if(active)onError(e);}};const timer=setInterval(poll,5000);return()=>{active=false;clearInterval(timer);};},[hostKey,onError]);
  return <div className="facilitator-overview">{!squads.length?<p className="empty">{t('overview.empty')}</p>:squads.map(squad=><article className="evidence" key={squad.id}><h3>{squad.name}</h3><p>{t('overview.roomCode')} <code>{squad.code}</code></p><p>{t('overview.round',{round:squad.round,phase:squad.phase,day:squad.day})}</p><p>{squad.running?t('overview.running'):t('overview.paused')} · {formatSeconds(squad.remaining)}</p><ul>{squad.members.map(member=><li key={member.id}>{member.name} · {member.role} · {member.online?t('overview.online'):t('overview.offline')} · {member.help?t('overview.askingHelp'):''}</li>)}</ul><p>{t('overview.evidence',{evidence:squad.evidence,handoffs:squad.handoffs})}</p>{squad.awaitingReview>0&&<p className="cyan">{t('overview.awaitingReview',{count:squad.awaitingReview})}</p>}<p>{t('overview.board',{status:squad.board==='open'?t('board.open'):squad.board==='closed'?t('board.closed'):t('overview.boardNone')})}</p><button type="button" onClick={()=>action(async()=>{const result=await api('facilitator/attach',{hostKey,roomId:squad.id});saveSession(result);joined();})}>{t('overview.open')}</button></article>)}</div>;
}

const formatSeconds=seconds=>`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;

function Timer({room}){const [now,setNow]=useState(Date.now());const offset=useRef(0);useEffect(()=>{offset.current=room.serverTime-Date.now();},[room.serverTime]);useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),500);return()=>clearInterval(timer);},[]);const seconds=room.running?Math.max(0,Math.ceil((room.deadline-now-offset.current)/1000)):room.remaining;return <>{formatSeconds(seconds)}</>;}

function Document({room,theme}){
  const t=useT();
  const frame=useRef(null);
  const [state,setState]=useState(()=>t('doc.loading'));
  useEffect(()=>{setState(t('doc.loading'));},[t]);
  useEffect(()=>{localStorage.setItem('proof-share-viewer-name',room.me.name);},[room.me.name]);
  useEffect(()=>{
    const syncMap={Saved:t('doc.saved'),Saving:t('doc.saving'),Connecting:t('doc.connecting'),Offline:t('doc.offline'),Syncing:t('doc.syncing')};
    const update=()=>{try{const win=frame.current?.contentWindow;const d=win?.document;if(!d?.body)return;d.documentElement.dataset.academyTheme=theme;let style=d.getElementById('academy-style');if(!style){style=d.createElement('style');style.id='academy-style';d.head.appendChild(style);}style.textContent=`:root{--font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;--font-size:16px;--line-height:1.7;--bg-color:${theme==='dark'?'#0c1928':'#ffffff'};--text-color:${theme==='dark'?'#e3ecfa':'#14243a'};--code-bg:${theme==='dark'?'#172b43':'#eff4fa'};--blockquote-color:${theme==='dark'?'#b7c7df':'#42536a'}}body{background:var(--bg-color)!important;color:var(--text-color)!important} .milkdown,.ProseMirror{color:var(--text-color)!important;font-family:var(--font-family)!important} #editor{padding:24px 36px!important} .ProseMirror h1{font-size:26px!important}.ProseMirror h2{font-size:18px!important;margin-top:26px!important} #share-banner{display:none!important;position:sticky!important;top:0!important;left:0!important;transform:none!important;width:100%!important;margin:0!important;border-radius:0!important;background:var(--bg-color)!important;color:var(--text-color)!important;box-shadow:none!important;padding:8px 16px!important} #share-banner .share-pill-agent-btn,#share-banner .share-pill-share-btn,#share-banner .share-pill-title,#share-banner .share-pill-sep,#share-banner>a{display:none!important} #share-banner button[aria-label="Share options"]{display:none!important} #share-banner *{color:var(--text-color)!important} #share-banner .share-pill-status-inline{display:flex!important} #editor{padding-top:20px!important}`;
      const editable=d.querySelector('[contenteditable="true"]');const sync=d.querySelector('.share-pill-status-inline .status-label')?.textContent?.trim();if(sync)setState(syncMap[sync]||('Proof · '+sync));else if(editable)setState(t('doc.opened'));else if(d.body.innerText.includes('error')||d.body.innerText.includes('Not found'))setState(t('doc.loadFail'));}catch{setState(t('doc.statusUnavailable'));}};
    update();const timer=setInterval(update,1500);return()=>clearInterval(timer);
  },[theme,t]);
  return <section className="panel document"><div className="document-heading"><div><h2>{t('doc.title')}</h2><p>{t('doc.subtitle')}</p></div><span><FileText size={15}/>{t('doc.badge')}</span></div><div className="document-status"><i/>{state}</div><iframe ref={frame} key={room.documentSlug} src={'/d/'+room.documentSlug} title={t('doc.badge')}/><div className="document-foot"><span>{t('doc.footDriver')}</span><small>{t('doc.footAll')}</small></div></section>;
}

function Board({room,action,busy,onBoard}){
  const t=useT();
  const board=room.board,facilitator=room.me.role==='Facilitator',closed=board?.status==='closed';
  const [columns,setColumns]=useState([]);
  const [sync,setSync]=useState('connecting');
  const [drafts,setDrafts]=useState({});
  const link=useRef(null);
  useEffect(()=>{if(!board)return;let active=true,connection=null;setSync('connecting');connectBoard(board.slug,{onColumns:columns=>active&&setColumns(columns),onStatus:status=>active&&setSync(status)}).then(next=>{if(active){connection=next;link.current=next;}else next.close();}).catch(()=>active&&setSync('denied'));return()=>{active=false;link.current=null;connection?.close();};},[board?.slug,board?.status]);
  const change=kind=>action(async()=>onBoard(await api('board',{action:kind})));
  const add=(event,index)=>{event.preventDefault();const text=(drafts[index]||'').trim();if(!text||!link.current)return;link.current.add(index,text);setDrafts(current=>({...current,[index]:''}));};
  return <section className="panel document board"><div className="document-heading"><div><h2>{t('board.title')}</h2><p>{t(!board?'board.none':closed?'board.closedLede':'board.lede')}</p></div>{board&&<span className={'board-status '+board.status}>{t(closed?'board.closed':'board.open')}</span>}</div>
    {facilitator&&<div className="board-actions">{(!board||closed)&&<button type="button" className="gradient" disabled={busy} onClick={()=>change('open')}>{t(board?'board.reopen':'board.start')}</button>}{board&&!closed&&<button type="button" disabled={busy} onClick={()=>change('close')}>{t('board.closeAction')}</button>}{board&&<a className="text-button" href="/game/debrief/export" download><Download size={16}/>{t('debrief.export')}</a>}</div>}
    {!board&&<p className="muted board-empty">{t(facilitator?'board.emptyFacilitator':'board.emptyParticipant')}</p>}
    {board&&<><div className="document-status"><i/>{t(closed&&sync==='synced'?'board.sync.readonly':'board.sync.'+sync)}</div><div className="board-columns">{columns.map((column,index)=><section className="board-column" key={index} aria-label={column.title}><h3>{column.title}<span>{column.cards.length}</span></h3><ul>{column.cards.map((card,cardIndex)=><li key={cardIndex}>{card}</li>)}</ul>{!column.cards.length&&<p className="muted">{t('board.noCards')}</p>}{!closed&&<form onSubmit={event=>add(event,index)}><label className="sr-only" htmlFor={'card-'+index}>{t('board.addLabel',{column:column.title})}</label><textarea id={'card-'+index} rows={2} maxLength={280} value={drafts[index]||''} placeholder={t('board.placeholder')} onChange={event=>setDrafts(current=>({...current,[index]:event.target.value}))} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey)add(event,index);}}/><button type="submit" disabled={sync!=='synced'||!(drafts[index]||'').trim()}><Plus size={15}/>{t('board.add')}</button></form>}</section>)}</div><div className="document-foot"><span>{t(closed?'board.footClosed':'board.footOpen')}</span><small>{t('board.columnsPlaceholder')}</small></div></>}</section>;
}

createRoot(document.getElementById('root')).render(<I18nProvider><App/></I18nProvider>);
