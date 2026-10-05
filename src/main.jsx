import React,{useEffect,useState,useRef,useCallback,lazy,Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import {Library,Users,BookOpen,Compass,Target,Sparkles,ClipboardCheck,Sun,Moon,ArrowRight,Clock,Play,Pause,RotateCw,HelpCircle,Check,LogOut,Copy,FileText,ExternalLink,Presentation,FlaskConical,X,LayoutGrid,Link,Columns3,Plus,Download,Award,ListOrdered,MessageSquare,Mail,StickyNote,Type,Wrench,MoreHorizontal,House,Trash2} from 'lucide-react';
import {api,authApi,getToken,getParticipantAccess,saveParticipantAccess,forgetParticipantAccess,participantAccessUrl,saveSession} from './api';
import {AppsLauncher} from './portal/AppsLauncher.jsx';
import {Coach,Lesson,Solo,Review,Route,Debrief,CourseComposer,coursePosition} from './panels';
import {Decks} from './slides';
import {Chat} from './chat';
import {AgentChatPanel} from './agent-chat';
import {Naslag} from './naslag';
import {Today} from './today';
import {ActivityFrame} from './activity-frame';
import {reportScreen,startScreenReporting} from './screen';
import {I18nProvider,LanguageToggle,useT,useI18n} from './i18n';
import {classroomEmbedUrl,CLASSROOM_SANDBOX,pinnedDeckIdForRoom,isClassroomNavKey,forwardClassroomNavKey} from './classroom';
import {ArcadeApp, isArcadePath} from './arcade/ArcadeApp.jsx';
import {StatusState} from './status';
import {classifyJoinError} from './join-errors.mjs';
import {useAsyncAction} from './use-async-action';
import './tailwind.css';
import './style.css';
import {FacilitatorWorkspace as FacilitatorRoomWorkspace} from './facilitator-workspace';

const phases=['Plan','Design','Build','Test','Deploy','Maintain'];
// AET-115: teach-path primary (learner order 1–7). Apps / Reference / Decks → tertiary Tools.
const teachNavIds=[
  ['squad','nav.squad',Users],
  ['route','nav.route',Compass],
  ['lesson','nav.lesson',BookOpen],
  ['solo','nav.solo',Target],
  ['coach','nav.coach',Sparkles],
  ['review','nav.review',ClipboardCheck],
  ['debrief','nav.debrief',ClipboardCheck],
];
const toolNavIds=[
  ['naslag','nav.naslag',Library],
  ['decks','nav.decks',Presentation],
];

const EMAIL_ERRORS=[[/code is invalid or has expired|code is ongeldig of verlopen/i,'email.err.code'],[/wait a minute|wacht een minuut/i,'email.err.cooldown'],[/too many codes|te veel codes/i,'email.err.rate'],[/valid email address|geldig e-mailadres/i,'email.err.invalid'],[/email could not be sent|e-mail kon niet worden verstuurd/i,'email.err.send']];
const emailError=(t,message)=>{const match=EMAIL_ERRORS.find(([pattern])=>pattern.test(message||''));return match?t(match[1]):message;};

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
  const {busy,setBusy,error,setError,action}=useAsyncAction({initialError:()=>initialLoginError(t)});
  const [theme,setTheme]=useState(()=>localStorage.getItem('academy-theme')||'light');
  const [session,setSession]=useState(!!getToken());
  const [room,setRoom]=useState(null);
  const [view,setView]=useState('today');
  const [lessonPage,setLessonPage]=useState('lesson');
  const [lessonDay,setLessonDay]=useState(null);
  const [lessonSteps,setLessonSteps]=useState(null);
  const [connected,setConnected]=useState(false);
  const [copied,setCopied]=useState(null);
  const [classroomOpen,setClassroomOpen]=useState(false);
  const [moreOpen,setMoreOpen]=useState(false);
  const [squadHelpOpen,setSquadHelpOpen]=useState(false);
  const closeClassroom=useCallback(()=>setClassroomOpen(false),[]);
  const [agentChatAvailable,setAgentChatAvailable]=useState(false);
  const [accessFromUrl]=useState(()=>new URLSearchParams(location.hash.slice(1)).get('access'));
  const [participantAccess,setParticipantAccess]=useState(()=>accessFromUrl||getParticipantAccess());
  const copiedTimer=useRef(null);
  const navigate=useCallback((next,{page='lesson',day}={})=>{
    setView(next);
    if(next==='lesson'){
      setLessonPage(page);
      setLessonDay(day??room?.day);
    }
  },[room?.day]);
  const goActivity=useCallback((activity,day)=>{
    if(activity==='course'){navigate('route');return;}
    if(activity==='assignments'&&day===room?.day){navigate('solo');return;}
    if(activity==='review'){navigate('review');return;}
    navigate('lesson',{page:activity==='assignments'?'assignments':activity,day});
  },[navigate,room?.day]);
  useEffect(()=>{
    if(room?.day){setLessonPage('lesson');setLessonDay(room.day);}
  },[room?.day]);
  useEffect(()=>{setLessonSteps(null);},[lessonDay,room?.day]);
  useEffect(()=>{setLessonSteps(null);},[lessonDay,room?.day]);
  useEffect(()=>()=>clearTimeout(copiedTimer.current),[]);
  useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('academy-theme',theme);},[theme]);
  useEffect(()=>{if(!accessFromUrl)return;const url=new URL(location.href);url.hash='';history.replaceState(null,'',url.pathname+url.search);},[accessFromUrl]);
  useEffect(()=>{if(session||!participantAccess)return;let active=true;setBusy(true);api('participant/resume',{resumeToken:participantAccess}).then(result=>{if(!active)return;saveParticipantAccess(participantAccess);saveSession(result);setSession(true);}).catch(e=>{if(!active)return;if(getParticipantAccess()===participantAccess)forgetParticipantAccess();setParticipantAccess(null);setError(e.message);}).finally(()=>{if(active)setBusy(false);});return()=>{active=false;};},[session,participantAccess,setBusy,setError]);
  useEffect(()=>{if(!session)return;let active=true;const poll=async()=>{try{const r=await api('state');if(active){setRoom(r);setConnected(true);}}catch(e){if(active){setConnected(false);if(e.status&&e.status<500)setError(e.message);}}};api('resume',{}).then(poll).catch(e=>{sessionStorage.removeItem('academy-token');setRoom(null);setConnected(false);setSession(false);if(!participantAccess)setError(e.message);});const timer=setInterval(poll,2000);return()=>{active=false;clearInterval(timer);};},[session,participantAccess,setError]);
  useEffect(()=>{if(!session)return;let active=true;api('config').then(config=>{if(active)setAgentChatAvailable(Boolean(config.agentChatAvailable));}).catch(()=>{if(active)setAgentChatAvailable(false);});return()=>{active=false;};},[session]);
  const participant=Boolean(room)&&room.me.role!=='Facilitator';
  const naslagLanding=participant&&(room.readOnly||(room.allReleased&&Boolean(room.me.cohortMemberId)));
  useEffect(()=>{if(naslagLanding)setView(current=>current==='today'||current==='lesson'||current==='squad'?'naslag':current);},[naslagLanding]);
  useEffect(()=>{if(room?.me.role==='Facilitator')setView(current=>current==='today'?'squad':current);},[room?.me.role]);
  useEffect(()=>{if(!participant)return;reportScreen({view});return startScreenReporting();},[participant,view]);
  const showCopied=kind=>{setCopied(kind);clearTimeout(copiedTimer.current);copiedTimer.current=setTimeout(()=>setCopied(null),1500);};
  async function leaveSession(){setBusy(true);setError('');try{await api('logout',{});sessionStorage.removeItem('academy-token');sessionStorage.removeItem('academy-mcp-'+room.me.id);sessionStorage.removeItem(`academy-agent-setup:${room.id}:${room.me.id}`);forgetParticipantAccess();location.reload();}catch(err){setError(err.message);}finally{setBusy(false);}}
  const themeButton=<button className="icon-button" aria-label={theme==='dark'?t('theme.light'):t('theme.dark')} onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={19}/>:<Moon size={19}/>}</button>;
  const localeToggle=<LanguageToggle/>;
  if(isArcadePath(location.pathname))return <ArcadeApp themeButton={themeButton}/>;
  if(!session||!room)return <><header className="welcome-header"><Brand/><div className="welcome-actions">{localeToggle}{themeButton}</div></header><Join ready={session} action={action} busy={busy} error={error} clearError={()=>setError('')} joined={resumeToken=>{if(resumeToken)setParticipantAccess(resumeToken);setSession(true);}}/></>;
  const facilitator=room.me.role==='Facilitator';
  const control=(actionName,value)=>action(async()=>{const r=await api('control',{action:actionName,value});setRoom(r);});
  const dayLabel=room.day<=2?t('room.guided'):room.day===3?t('room.coached'):room.day===4?t('room.hints'):t('room.independent');
  const roundStatus=room.running?t('room.practice'):room.remaining===0?t('room.timeUp'):t('room.paused');
  const modeLabel=({lesson:t('roster.mode.lesson'),solo:t('roster.mode.solo'),squad:t('roster.mode.squad'),review:t('roster.mode.review')})[room.mode]||room.mode;
  const contribution=facilitator?t('roster.contributionFacilitator'):t('roster.contributionParticipant');
  const participantPrimary=[['today','nav.today',House],['route','nav.courseOverview',Compass],['lesson','nav.lesson',BookOpen],['squad','nav.squad',Users]];
  const participantMore=[['solo','nav.solo',Target],['coach','nav.coach',Sparkles],['review','nav.review',ClipboardCheck],['debrief','nav.debrief',ClipboardCheck],['naslag','nav.naslag',Library],['decks','nav.decks',Presentation],...(agentChatAvailable&&!room.readOnly?[['agentChat','nav.agentChat',MessageSquare]]:[]),...(room.board?[['board','nav.board',Columns3]]:[]),...(room.me.cohortMemberId?[['certificate','nav.certificate',Award]]:[])];
  const participantSquadMode=view==='squad';
  if(facilitator)return <FacilitatorRoomWorkspace room={room} view={view} onNavigate={navigate} connected={connected} error={error} control={control} busy={busy}
    account={<>{localeToggle}{themeButton}<button type="button" onClick={leaveSession}><LogOut size={16}/>{t('account.leave')}</button></>}
    onPresent={()=>setClassroomOpen(true)}
    controls={<FacilitatorControls room={room} control={control} busy={busy} connected={connected} onOpenClassroom={()=>setClassroomOpen(true)} onOpenBoard={()=>action(async()=>{navigate('board');if(!room.board||room.board.status==='closed'){const board=await api('board',{action:'open'});if(board)setRoom(current=>({...current,board}));}})}/>}
    classroom={classroomOpen?<ClassroomOverlay room={room} onClose={closeClassroom}/>:null}
    renderContent={onContext=><>{view==='document'&&<Document room={room} action={action} busy={busy} onIntent={intentUrl=>setRoom(current=>({...current,intentUrl}))}/>}{view==='route'&&<Route room={room} onNavigate={navigate}/>}{view==='lesson'&&<Lesson room={room} action={action} busy={busy} day={lessonDay??room.day} page={lessonPage} onNavigate={navigate}/>}{view==='solo'&&<Solo room={room} action={action} busy={busy} onNavigate={navigate}/>}{view==='coach'&&<Coach room={room} action={action}/>}{view==='naslag'&&<Naslag room={room} action={action} busy={busy} onNavigate={navigate}/>}{view==='review'&&<Review room={room} action={action} busy={busy}/>}{view==='decks'&&<Decks room={room} action={action} busy={busy} onRoom={setRoom} onContext={onContext}/>}{view==='apps'&&<AppsLauncher action={action} busy={busy} facilitator={facilitator} hostKey={''}/>}{view==='agentChat'&&agentChatAvailable&&!facilitator&&!room.readOnly&&<AgentChatPanel/>}{view==='debrief'&&facilitator&&<Debrief room={room} onOpenBoard={()=>action(async()=>{navigate('board');if(!room.board||room.board.status==='closed'){const board=await api('board',{action:'open'});if(board)setRoom(current=>({...current,board}));}})}/>}{view==='debrief'&&!facilitator&&<section className="panel content-panel" data-testid="debrief-learner"><StatusState kind="empty" title={t('debrief.learnerTitle')}>{t('debrief.learnerHelp')}</StatusState></section>}{view==='course'&&facilitator&&<CourseComposer room={room} control={control} busy={busy}/>}{view==='board'&&<Board room={room} action={action} busy={busy} onBoard={board=>setRoom(current=>({...current,board}))}/>}{view==='certificate'&&!facilitator&&<MyCertificate room={room}/>}</>}/>;
  return <div className={'app'+(!facilitator?' participant-app':'')} key={locale}>
    <header className="topbar"><Brand/><div className="account"><span className={'connection '+(connected?'online':'offline')} role="status" aria-live="polite"><i/>{connected?t('account.connected'):t('account.disconnected')}</span>{localeToggle}{themeButton}<span className="avatar small">{room.me.name.slice(0,2).toUpperCase()}</span><span>{room.me.name}</span><button className="icon-button" aria-label={t('account.leave')} onClick={leaveSession}><LogOut size={17}/></button></div></header>
    <aside className={'sidebar'+(!facilitator?' participant-sidebar':'')}>
      <nav aria-label={t('nav.main')} className="sidebar-nav">
        {!facilitator?<>
          <div className="participant-primary-nav" role="group" aria-label={t('nav.main')} data-testid="participant-primary-nav">
            {participantPrimary.map(([id,labelKey,Icon])=><button key={id} type="button" data-nav={id} aria-current={view===id?'page':undefined} className={view===id?'selected':''} onClick={()=>navigate(id)}><Icon size={17}/>{t(labelKey)}</button>)}
          </div>
          <div className="participant-more">
            <button type="button" className={moreOpen?'selected':''} aria-expanded={moreOpen} aria-controls="participant-more-menu" onClick={()=>setMoreOpen(open=>!open)}><MoreHorizontal size={17}/>{t('participant.more')}</button>
            <div id="participant-more-menu" className="participant-more-menu" role="group" aria-label={t('participant.more')} hidden={!moreOpen}>
              {participantMore.map(([id,labelKey,Icon])=><button key={id} type="button" data-nav={id} aria-current={view===id?'page':undefined} className={view===id?'selected':''} onClick={()=>{navigate(id);setMoreOpen(false);}}><Icon size={16}/>{t(labelKey)}</button>)}
            </div>
          </div>
        </>:<>
          <div className="nav-primary" role="group" aria-label={t('nav.teach')} data-testid="nav-primary">
            {teachNavIds.map(([id,labelKey,Icon])=><button key={id} type="button" data-nav={id} data-nav-tier="teach" className={view===id?'selected':''} onClick={()=>navigate(id)}><Icon size={19}/>{t(labelKey)}</button>)}
          </div>
          <div className="nav-tools" role="group" aria-label={t('nav.tools')} data-testid="nav-tools">
            <p className="nav-tools-label"><Wrench size={12} aria-hidden="true"/>{t('nav.tools')}</p>
            {toolNavIds.map(([id,labelKey,Icon])=><button key={id} type="button" data-nav={id} data-nav-tier="tools" className={view===id?'selected':''} onClick={()=>navigate(id)}><Icon size={16}/>{t(labelKey)}</button>)}
            {facilitator&&<button type="button" data-nav="apps" data-nav-tier="tools" data-testid="nav-tools-apps" className={view==='apps'?'selected':''} onClick={()=>navigate('apps')}><LayoutGrid size={16}/>{t('nav.apps')}</button>}
            {(facilitator||room.board)&&<button type="button" data-nav="board" data-nav-tier="tools" className={view==='board'?'selected':''} onClick={()=>navigate('board')}><Columns3 size={16}/>{t('nav.board')}</button>}
            {facilitator&&<button type="button" data-nav="course" data-nav-tier="tools" className={view==='course'?'selected':''} onClick={()=>navigate('course')}><ListOrdered size={16}/>{t('nav.course')}</button>}
            {agentChatAvailable&&!facilitator&&!room.readOnly&&<button type="button" data-nav="agentChat" data-nav-tier="tools" className={view==='agentChat'?'selected':''} onClick={()=>navigate('agentChat')}><MessageSquare size={16}/>{t('nav.agentChat')}</button>}
            {!facilitator&&room.me.cohortMemberId&&<button type="button" data-nav="certificate" data-nav-tier="tools" className={view==='certificate'?'selected':''} onClick={()=>navigate('certificate')}><Award size={16}/>{t('nav.certificate')}</button>}
          </div>
        </>}
      </nav>
      <div className="sidebar-bottom"><span>{t('nav.tagline1')}</span><span>{t('nav.tagline2')}</span><strong>{t('nav.tagline3')}</strong><hr/><small>{t('nav.schedule')}</small></div>
    </aside>
    <main>
      <div className={'room-heading'+(!facilitator?' participant-room-heading':'')}><div><p className="muted" data-testid="room-session-label">{t('room.sessionLabel')} · {t('room.supportDay',{day:coursePosition(room)})}{(facilitator||participantSquadMode)&&` · ${dayLabel}`}</p><h1>{room.name}</h1>{room.wave?.name&&<p className="wave-cohort-badge" data-testid="wave-cohort-badge">{t('room.waveOf',{name:room.wave.name})}</p>}</div>{(!facilitator)&&<button type="button" className="participant-squad-toggle" aria-expanded={squadHelpOpen} onClick={()=>setSquadHelpOpen(open=>!open)}><Users size={16}/>{t('participant.squadHelp')}</button>}{(facilitator||participantSquadMode)&&<div className="round"><span>{t('room.round',{round:room.round})} · {roundStatus}</span><strong><Clock size={22}/><Timer room={room}/></strong></div>}</div>
      {(facilitator||participantSquadMode)&&<div className="sdlc" aria-label={t('room.sdlc')}>{phases.map((p,i)=><React.Fragment key={p}><div className={p===room.phase?'active':''}><span>{p}</span></div>{i<5&&<span className="phase-line"/>}</React.Fragment>)}</div>}
      {!connected&&<StatusState kind="offline" title={t('status.offline')} action={<button type="button" onClick={()=>location.reload()}>{t('status.reload')}</button>}>{t('status.offlineHelp')}</StatusState>}
      {room.readOnly&&<StatusState kind="readonly" title={t('readOnly.title')} action={room.intentUrl?<a className="button" href={room.intentUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} aria-hidden="true"/>{t('doc.open')}</a>:null}>{t('readOnly.help')}</StatusState>}
      {error&&<div className="error" role="alert">{error}<button onClick={()=>setError('')} aria-label={t('common.closeAlert')}>×</button></div>}
      {facilitator&&<FacilitatorControls room={room} control={control} busy={busy} connected={connected} onOpenClassroom={()=>setClassroomOpen(true)} onOpenBoard={()=>action(async()=>{navigate('board');if(!room.board||room.board.status==='closed'){const board=await api('board',{action:'open'});if(board)setRoom(current=>({...current,board}));}})}/>}
      {facilitator&&classroomOpen&&<ClassroomOverlay room={room} onClose={closeClassroom}/>}
      <div className={'workspace'+(!facilitator&&squadHelpOpen?' participant-workspace-open':'')}>
        <section className="primary">
          {view==='today'&&<Today room={room} onNavigate={navigate}/>}
          {view==='squad'&&<Document room={room} action={action} busy={busy} onIntent={intentUrl=>setRoom(current=>({...current,intentUrl}))}/>}
          {view==='route'&&<Route room={room} onNavigate={navigate}/>}
          {view==='lesson'&&(participant
            ?<ActivityFrame room={room} day={lessonDay??room.day} activity={lessonPage} onGo={goActivity} steps={lessonSteps}>
              <Lesson room={room} action={action} busy={busy} day={lessonDay??room.day} page={lessonPage} onNavigate={navigate} onStepsChange={setLessonSteps} framed/>
            </ActivityFrame>
            :<Lesson room={room} action={action} busy={busy} day={lessonDay??room.day} page={lessonPage} onNavigate={navigate}/>)}
          {view==='solo'&&(participant
            ?<ActivityFrame room={room} day={room.day} activity="assignments" onGo={goActivity}>
              <Solo room={room} action={action} busy={busy} onNavigate={navigate}/>
            </ActivityFrame>
            :<Solo room={room} action={action} busy={busy} onNavigate={navigate}/>)}
          {view==='coach'&&<Coach room={room} action={action}/>}
          {view==='naslag'&&<Naslag room={room} action={action} busy={busy} onNavigate={navigate}/>}
          {view==='review'&&(participant
            ?<ActivityFrame room={room} day={room.day} activity="review" onGo={goActivity}>
              <Review room={room} action={action} busy={busy}/>
            </ActivityFrame>
            :<Review room={room} action={action} busy={busy}/>)}
          {view==='decks'&&<Decks room={room} action={action} busy={busy} onRoom={setRoom}/>}
          {view==='apps'&&<AppsLauncher action={action} busy={busy} facilitator={facilitator} hostKey={''}/>}
          {view==='agentChat'&&agentChatAvailable&&!facilitator&&!room.readOnly&&<AgentChatPanel/>}
          {view==='debrief'&&facilitator&&<Debrief room={room} onOpenBoard={()=>action(async()=>{navigate('board');if(!room.board||room.board.status==='closed'){const board=await api('board',{action:'open'});if(board)setRoom(current=>({...current,board}));}})}/>}
          {view==='debrief'&&!facilitator&&<section className="panel content-panel" data-testid="debrief-learner"><StatusState kind="empty" title={t('debrief.learnerTitle')}>{t('debrief.learnerHelp')}</StatusState></section>}
          {view==='course'&&facilitator&&<CourseComposer room={room} control={control} busy={busy}/>}
          {view==='board'&&<Board room={room} action={action} busy={busy} onBoard={board=>setRoom(current=>({...current,board}))}/>}
          {view==='certificate'&&!facilitator&&<MyCertificate room={room}/>}
        </section>
        {(facilitator||squadHelpOpen)&&<aside className="right-rail" id={!facilitator?'participant-squad-help':undefined} aria-label={!facilitator?t('participant.squadHelp'):undefined}>
          <section className="panel roster">
            <div className="panel-heading"><h2>{t('roster.title')} <span>({room.members.length}/{t('roster.softMax')})</span></h2><Users size={17}/></div>
            {room.members.length===0&&<StatusState kind="empty" title={t('roster.empty')} action={room.code?<button type="button" onClick={()=>action(async()=>{await navigator.clipboard.writeText(room.code);showCopied('code');})}>{copied==='code'?t('roster.codeCopied'):t('roster.copyCodeShort')}</button>:null}>{t('roster.emptyHelp')}</StatusState>}
            {room.members.map(m=><div className="member" key={m.id}><span className="avatar">{m.name.slice(0,2).toUpperCase()}</span><div><strong>{m.name}{m.id===room.me.id?` ${t('common.you')}`:''}</strong></div><span className={'presence '+(m.online?'present':'')} title={m.online?t('roster.online'):t('roster.offline')}/>{m.help&&<HelpCircle size={17} className="cyan" aria-label={t('roster.helpAsked')}/>}</div>)}
            {room.code&&<div className="room-code"><small>{t('roster.roomCode')}</small><div className="room-code-actions"><button className="room-code-display" type="button" onClick={()=>action(async()=>{await navigator.clipboard.writeText(room.code);showCopied('code');})} aria-label={t('roster.copyCode',{code:room.code})} title={t('roster.copyCodeTitle')}>{room.code}{copied==='code'?<Check size={14}/>:<Copy size={14}/>}</button><button className="room-code-link" type="button" onClick={()=>action(async()=>{await navigator.clipboard.writeText(`${location.origin}/?code=${room.code}`);showCopied('link');})} title={t('roster.copyLink')}>{copied==='link'?t('roster.linkCopied'):t('roster.copyLink')}</button>{room.me.role==='Facilitator'&&<button className="room-code-link" type="button" onClick={()=>window.open(`${location.origin}/?code=${room.code}`,'_blank','noopener')} title={t('roster.testAsParticipantTitle')}><ExternalLink size={14}/>{t('roster.testAsParticipant')}</button>}</div><span className="sr-only" role="status">{copied==='code'?t('roster.codeCopied'):copied==='link'?t('roster.inviteCopied'):''}</span></div>}
            {!facilitator&&room.me.cohortMemberId&&<div className="participant-access"><small>{t('access.title')}</small><p>{t('access.cohort')}</p></div>}
            {!facilitator&&!room.me.cohortMemberId&&<div className="participant-access"><small>{t('access.title')}</small><p>{t('access.help')}</p><button type="button" onClick={()=>action(async()=>{let resumeToken=participantAccess;if(!resumeToken){const result=await api('participant/access',{});resumeToken=result.resumeToken;saveParticipantAccess(resumeToken);setParticipantAccess(resumeToken);}await navigator.clipboard.writeText(participantAccessUrl(resumeToken));showCopied('access');})}><Link size={14}/>{copied==='access'?t('access.copied'):t('access.copy')}</button><span className="sr-only" role="status">{copied==='access'?t('access.copiedStatus'):''}</span></div>}
            {!facilitator&&<EmailAccess/>}
            {room.members.length<4&&<small className="muted">{t('roster.minMembers')}</small>}
          </section>
          <section className="panel contribution"><FileText size={20}/><h2>{t('roster.contribution')}</h2><p>{contribution}</p><small className="muted">{t('roster.modeLabel',{mode:modeLabel})}</small></section>
          <button type="button" className="gradient coach-cta" onClick={()=>navigate('coach')}><Sparkles size={18}/>{t('roster.askCoach')}<ArrowRight size={17}/></button>
          {(facilitator||room.chat)&&<Chat room={room} onNavigate={navigate}/>}
          {!facilitator&&<button type="button" className="help-button" onClick={()=>action(()=>api('help',{}))}><HelpCircle size={16}/>{room.me.help?t('roster.helpOn'):t('roster.helpOff')}</button>}
        </aside>}
      </div>
      {facilitator&&<footer>{t('room.footer')}</footer>}
    </main>
  </div>;
}

function ClassroomOverlay({room,onClose}){
  const t=useT();
  const frameRef=useRef(null);
  const shellRef=useRef(null);
  // Keep the latest onClose available to mount-only listeners (room polling recreates
  // inline closers; adding it to their deps would exit fullscreen every ~2s).
  const onCloseRef=useRef(onClose);
  useEffect(()=>{onCloseRef.current=onClose;});
  const [isFullscreen,setIsFullscreen]=useState(()=>typeof document!=='undefined'&&!!document.fullscreenElement);
  useEffect(()=>{
    const sync=()=>setIsFullscreen(!!document.fullscreenElement);
    sync();
    document.addEventListener('fullscreenchange',sync);
    return()=>document.removeEventListener('fullscreenchange',sync);
  },[]);
  useEffect(()=>{
    const prevOverflow=document.body.style.overflow;
    const returnFocusTo=document.activeElement;
    document.body.style.overflow='hidden';
    try{if(!navigator.webdriver)document.documentElement.requestFullscreen?.();}catch{}
    const exit=()=>{
      try{if(document.fullscreenElement)document.exitFullscreen?.();}catch{}
      onCloseRef.current();
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
      if(isClassroomNavKey(e.key)){
        // Focus is on overlay chrome (Exit etc.): deck key handlers live inside
        // the iframe and never see these. Forward same-origin without requiring
        // a prior click into the frame. Skip when iframe focus is editable (K6).
        if(forwardClassroomNavKey(frameRef.current,e.key)){
          e.preventDefault();
        }
        return;
      }
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
  },[]);
  const exit=()=>{try{if(document.fullscreenElement)document.exitFullscreen?.();}catch{}onCloseRef.current();};
  const toggleFullscreen=(event)=>{
    try{
      if(document.fullscreenElement)document.exitFullscreen?.();
      else document.documentElement.requestFullscreen?.();
    }catch{}
    // AET-107: drop focus ring from ⛶ so Space/arrows go to slides cleanly.
    event.currentTarget.blur();
    frameRef.current?.focus?.();
  };
  const fullscreenLabel=isFullscreen?t('classroom.exitFullscreen'):t('classroom.enterFullscreen');
  return <div ref={shellRef} className="classroom-overlay" role="dialog" aria-modal="true" aria-label={t('classroom.title')} data-testid="classroom-overlay">
    <div className="classroom-chrome">
      <div className="classroom-chrome-left">
        <Presentation size={18}/>
        <strong>{t('classroom.title')}</strong>
        <span className="classroom-day-hint">{t('classroom.dayHint',{day:room.day})}</span>
        {pinnedDeckIdForRoom(room)?<span className="classroom-pin-hint cyan">{t('classroom.pinnedHint')}</span>:null}
        <span className="muted classroom-room-hint">{room.name}</span>
      </div>
      <div className="classroom-chrome-actions">
        <button type="button" className="classroom-fullscreen" onClick={toggleFullscreen} aria-label={fullscreenLabel} title={fullscreenLabel} data-testid="classroom-overlay-fullscreen">⛶</button>
        <button type="button" className="classroom-exit" onClick={exit} aria-label={t('classroom.exit')}><X size={16}/>{t('classroom.exitShort')}</button>
      </div>
    </div>
    <iframe ref={frameRef} className="classroom-frame" src={classroomEmbedUrl(room.day,pinnedDeckIdForRoom(room))} title={t('classroom.frameTitle')} sandbox={CLASSROOM_SANDBOX} allow="fullscreen" allowFullScreen/>
  </div>;
}

function Brand(){const t=useT();return <div className="brand">AetherLink <span>{t('brand.academy')}</span></div>;}

function Segmented({name,legend,value,options,onChange,className}){
  return <fieldset className={'segmented '+(className||'')}>
    <legend className="sr-only">{legend}</legend>
    {options.map(option=><label key={option.value} className={value===option.value?'selected':''}>
      <input type="radio" name={name} value={option.value} checked={value===option.value} onChange={()=>onChange(option.value)}/>
      <span>{option.label}</span>{option.detail&&<small>{option.detail}</small>}
    </label>)}
  </fieldset>;
}

function EmailLogin({action,busy,joined}){
  const t=useT();
  const [email,setEmail]=useState('');
  const [sent,setSent]=useState(false);
  const start=()=>action(async()=>{await api('email/login/start',{email});setSent(true);});
  return <form onSubmit={e=>{e.preventDefault();if(!sent)return start();const {code}=Object.fromEntries(new FormData(e.currentTarget));action(async()=>{saveSession(await api('email/login/verify',{email,code}));history.replaceState(null,'',location.pathname);joined();});}}>
    <label htmlFor="join-email">{t('email.address')}<input id="join-email" name="email" type="email" required autoComplete="email" maxLength={254} value={email} onChange={e=>{setEmail(e.target.value);setSent(false);}} placeholder={t('email.placeholder')}/></label>
    {sent&&<p className="muted email-sent" role="status">{t('email.loginSent')}</p>}
    {sent&&<label htmlFor="join-email-code">{t('email.code')}<input id="join-email-code" name="code" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="123456" autoFocus/></label>}
    <button type="submit" className="gradient" disabled={busy}>{busy?t('join.submitBusy'):sent?t('email.loginSubmit'):t('email.sendCode')}<ArrowRight size={18}/></button>
    {sent&&<button type="button" className="text-button" disabled={busy} onClick={start}>{t('email.resend')}</button>}
  </form>;
}

function EmailAccess(){
  const t=useT();
  const {busy,error,setError,action}=useAsyncAction({formatError:message=>emailError(t,message)});
  const [status,setStatus]=useState(null);
  const [draft,setDraft]=useState('');
  const [pending,setPending]=useState(null);
  const [editing,setEditing]=useState(false);
  useEffect(()=>{let active=true;api('email').then(result=>{if(active)setStatus(result);}).catch(()=>{});return()=>{active=false;};},[]);
  if(!status)return null;
  const run=fn=>event=>{event?.preventDefault();return action(()=>fn(event));};
  const send=run(async()=>{await api('email/attach/start',{email:draft});setPending(draft);});
  const reset=()=>{setPending(null);setEditing(false);setDraft('');setError('');};
  return <div className="participant-access email-access">
    <small><Mail size={13}/> {t('email.title')}</small>
    {status.email&&!editing&&!pending?<>
      <p>{t('email.linked',{email:status.email})}</p>
      <div className="email-actions"><button type="button" disabled={busy} onClick={()=>{setEditing(true);setDraft(status.email);}}>{t('email.change')}</button><button type="button" disabled={busy} onClick={run(async()=>{setStatus(await api('email/remove',{}));})}>{t('email.remove')}</button></div>
    </>:pending?<form onSubmit={run(async event=>{const {code}=Object.fromEntries(new FormData(event.currentTarget));setStatus(await api('email/attach/verify',{email:pending,code}));reset();})}>
      <p role="status">{t('email.codeSent',{email:pending})}</p>
      <label htmlFor="email-access-code">{t('email.code')}<input id="email-access-code" name="code" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="123456" autoFocus/></label>
      <div className="email-actions"><button type="submit" disabled={busy}>{t('email.confirm')}</button><button type="button" disabled={busy} onClick={send}>{t('email.resend')}</button></div>
      <button type="button" className="text-button" onClick={reset}>{t('email.cancel')}</button>
    </form>:<form onSubmit={send}>
      <p>{t('email.help')}</p>
      <label htmlFor="email-access-address" className="sr-only">{t('email.address')}</label>
      <input id="email-access-address" type="email" required autoComplete="email" maxLength={254} value={draft} onChange={e=>setDraft(e.target.value)} placeholder={t('email.placeholder')}/>
      <div className="email-actions"><button type="submit" disabled={busy}>{t('email.sendCode')}</button>{editing&&<button type="button" disabled={busy} onClick={reset}>{t('email.cancel')}</button>}</div>
    </form>}
    {error&&<p className="error" role="alert">{error}</p>}
  </div>;
}

function Join({ready,action,busy,error,clearError,joined}){
  const t=useT();
  const params=new URLSearchParams(location.search);
  const [mode,setMode]=useState(params.get('facilitator')==='1'?'facilitator':'join');
  const [code,setCode]=useState(()=>params.get('code')?.toUpperCase()||'');
  const [joinPath,setJoinPath]=useState(params.get('cohort')==='1'?'cohort':'room');
  const [googleSso,setGoogleSso]=useState(false);
  const [emailLogin,setEmailLogin]=useState(false);
  const [facilitatorSession,setFacilitatorSession]=useState(null);
  const nameRef=useRef(null);
  // Focus only from the initial join code; later edits should not steal focus.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- this focus is intentionally mount-only
  useEffect(()=>{if(code)nameRef.current?.focus();},[]);
  // Read URL parameters once when the Join screen mounts.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- params represents the initial URL query
  useEffect(()=>{let active=true;(async()=>{try{const config=await api('config');if(!active)return;setGoogleSso(config.googleSso);setEmailLogin(Boolean(config.emailLogin));if(params.get('facilitator')==='1'||config.googleSso)try{const identity=await api('facilitator/me');const squads=await api('facilitator/overview',{});if(active){setFacilitatorSession({hostKey:'',identity,squads});if(!params.get('code'))setMode('facilitator');}}catch{}}catch{}})();return()=>{active=false;};},[]);
  const participant=mode==='join',cohortPath=participant&&joinPath==='cohort',emailPath=participant&&emailLogin&&joinPath==='email';
  const setRole=next=>{setMode(next);clearError();};
  const choosePath=next=>{setJoinPath(next);clearError();};
  const emailMessage=error&&emailError(t,error);
  const failure=emailMessage&&emailMessage!==error?{key:null,title:'join.errTitle.generic',field:null,message:emailMessage}:classifyJoinError(error);
  const invalid=field=>failure?.field===field?{'aria-invalid':true,'aria-describedby':'join-error'}:{};
  const heading=mode==='facilitator'?(facilitatorSession?t('join.heading.workspace'):t('join.heading.facilitator')):t('join.heading.join');
  const hint=mode==='facilitator'?(facilitatorSession?t('join.hint.workspace'):googleSso?t('join.hint.facilitatorGoogle'):t('join.hint.facilitatorKey')):emailPath?t('join.hint.email'):cohortPath?t('join.hint.cohort'):t('join.hint.join');
  return <main className="join">
    <div className="join-copy"><p className="muted">{t('join.eyebrow')}</p><h1>{t('join.title')} <br/><span>{t('join.titleAccent')}</span></h1><p>{t('join.lede').split('\n').map((line,i)=><React.Fragment key={i}>{line}{i===0&&<br/>}</React.Fragment>)}</p><div className="join-principles"><span><Users aria-hidden="true"/>{t('join.principle.squad')}</span><span><FileText aria-hidden="true"/>{t('join.principle.intent')}</span><span><Sparkles aria-hidden="true"/>{t('join.principle.coach')}</span></div></div>
    <section className="join-form panel" aria-labelledby="join-heading">
      <Segmented name="join-role" className="join-role" legend={t('join.roleList')} value={participant?'join':'facilitator'} onChange={setRole} options={[{value:'join',label:t('join.participant')},{value:'facilitator',label:t('join.facilitator')}]}/>
      <h2 id="join-heading">{heading}</h2>
      {participant&&<Segmented name="join-path" className="join-path" legend={t('join.path.label')} value={joinPath} onChange={choosePath} options={[{value:'room',label:t('join.path.room'),detail:t('join.path.roomDetail')},{value:'cohort',label:t('join.path.cohort'),detail:t('join.path.cohortDetail')},...(emailLogin?[{value:'email',label:t('join.path.email'),detail:t('join.path.emailDetail')}]:[])]}/>}
      <p className="muted join-hint">{hint}</p>
      {facilitatorSession?.identity&&<p className="facilitator-login" aria-live="polite">{t('join.signedIn',{name:facilitatorSession.identity.name,email:facilitatorSession.identity.email})} <button type="button" className="text-button" onClick={()=>action(async()=>{await authApi('logout',{});setFacilitatorSession(null);setMode('join');})}>{t('join.signOut')}</button></p>}
      {mode==='facilitator'&&!facilitatorSession&&googleSso&&<div className="join-google-block">
        <p className="join-google-lede">{t('join.googleLede')}</p>
        <a className="gradient google-login" href="/auth/google/start"><strong>G</strong> {t('join.googleButton')}</a>
        <p className="join-or" role="separator"><span>{t('join.orKey')}</span></p>
      </div>}
      {mode==='facilitator'&&facilitatorSession?<FacilitatorWorkspace session={facilitatorSession} action={action} busy={busy} joined={joined} onError={e=>action(async()=>{throw e;})}/>
      :emailPath?<EmailLogin action={action} busy={busy} joined={joined}/>:<form onSubmit={e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));action(async()=>{if(mode==='facilitator'){const squads=await api('facilitator/overview',{hostKey:data.hostKey});setFacilitatorSession({hostKey:data.hostKey,identity:null,squads});return;}if(cohortPath){saveSession(await api('cohort/activate',{code:data.code}));history.replaceState(null,'',location.pathname);joined();return;}const result=await api('join',data);saveSession(result);history.replaceState(null,'',location.pathname);joined(result.resumeToken);});}}>
        {mode==='facilitator'&&<label htmlFor="join-hostkey">{t('join.hostKey')}<input id="join-hostkey" name="hostKey" required type="password" autoComplete="off" placeholder={t('join.hostKeyPlaceholder')} {...invalid('hostKey')}/></label>}
        {participant&&!cohortPath&&<label htmlFor="join-name">{t('join.nameYou')}<input id="join-name" ref={nameRef} name="name" required maxLength={50} placeholder={t('join.placeholderName')} autoComplete="nickname" {...invalid('name')}/></label>}
        {cohortPath&&<label htmlFor="join-cohort-code">{t('join.cohortCode')}<input id="join-cohort-code" name="code" required type="text" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={40} placeholder={t('join.cohortCodePlaceholder')} aria-describedby={failure?.field==='code'?'join-error join-cohort-code-help':'join-cohort-code-help'} aria-invalid={failure?.field==='code'||undefined}/><small id="join-cohort-code-help" className="muted">{t('join.cohortCodeHelp')}</small></label>}
        {participant&&!cohortPath&&<label htmlFor="join-code">{t('join.roomCode')}<input id="join-code" name="code" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} required type="text" autoComplete="off" autoCapitalize="characters" placeholder={t('join.roomCodePlaceholder')} spellCheck={false} {...invalid('code')}/></label>}
        <button type="submit" className="gradient" disabled={busy} aria-busy={busy||undefined}>{busy?t('join.submitBusy'):mode==='facilitator'?t('join.submitSignIn'):cohortPath?t('join.submitCohort'):t('join.submitJoin')}<ArrowRight size={18} aria-hidden="true"/></button>
      </form>}
      <div className="join-live" id="join-error">{failure&&<StatusState kind="error" title={t(failure.title)} action={<button type="button" className="status-dismiss" onClick={clearError} aria-label={t('common.closeAlert')}><X size={14}/></button>}>{failure.key?t(failure.key):failure.message}</StatusState>}</div>
      {ready&&<StatusState kind="loading" inline title={t('join.restoring')}/>}
      {participant&&googleSso&&!facilitatorSession&&<p className="join-side-hint muted">{t('join.sideHint')}</p>}
      <div className="join-secondary">
        <a href="/arcade" data-arcade-entry>{t('join.arcadeLink')}</a>
      </div>
      <small>{t('join.noApiKey')}</small>
    </section>
  </main>;
}


function LabConfigChrome({room,control,disabled}){
  const t=useT();
  const [catalog,setCatalog]=useState([]);
  const [loadError,setLoadError]=useState('');
  useEffect(()=>{let active=true;api('lab-catalog').then(data=>{if(active){setCatalog(data.labs||[]);setLoadError('');}}).catch(err=>{if(active)setLoadError(err.message||String(err));});return()=>{active=false;};},[]);
  const assigned=room.lab||null;
  const selectId=assigned?.id||'';
  const onSelect=e=>{
    const lessonId=e.target.value;
    if(!lessonId)control('lab',{lessonId:null});
    else control('lab',{lessonId,open:assigned?.open!==false});
  };
  const onToggle=e=>control('lab',{lessonId:assigned.id,open:e.target.checked});
  return <div className="fac-lab-config" role="group" aria-label={t('fac.lab')}>
    <FlaskConical size={16} aria-hidden="true"/>
    <label className="fac-lab-select">{t('fac.lab')}
      <select value={selectId} disabled={disabled||Boolean(loadError)} onChange={onSelect} aria-label={t('fac.lab')} data-testid="fac-lab-select">
        <option value="">{t('fac.labNone')}</option>
        {catalog.map(lesson=><option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}
      </select>
    </label>
    {assigned&&<label className="facilitator-toggle fac-lab-open"><input type="checkbox" checked={assigned.open===true} disabled={disabled} onChange={onToggle} data-testid="fac-lab-open"/>{t('fac.labOpen')}</label>}
    {assigned&&<span className="fac-lab-status muted" aria-live="polite">{assigned.open?t('fac.labOpenHint',{title:assigned.title}):t('fac.labClosedHint',{title:assigned.title})}</span>}
    {loadError&&<span className="error" role="alert">{t('fac.labCatalogFailed',{message:loadError})}</span>}
  </div>;
}

function FacilitatorControls({room,control:send,busy,connected,onOpenClassroom,onOpenBoard}){
  const t=useT();
  // Ignore input while a command is in flight instead of disabling: a disabled
  // button drops keyboard focus when the blur-commit of a time field starts.
  const control=(...args)=>{if(!busy)send(...args);};
  const [time,setTime]=useState(String(Math.ceil(room.remaining/60)));
  const [duration,setDuration]=useState(String(Math.ceil((room.roundSeconds||1500)/60)));
  useEffect(()=>setTime(String(Math.ceil(room.remaining/60))),[room.remaining]);
  useEffect(()=>setDuration(String(Math.ceil((room.roundSeconds||1500)/60))),[room.roundSeconds]);
  const commit=(draft,name,current)=>{const minutes=Number(draft);if(Number.isFinite(minutes)&&minutes*60!==current)control(name,minutes*60);};
  const enter=e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur();}};
  const disabled=!connected;
  const dayOptions=room.course?.days.map(entry=>entry.day)??Array.from({length:7},(_,i)=>i+1);
  return <div className="facilitator-controls" role="region" aria-label={t('fac.toolbar')}>
    <div className="facilitator-controls-row facilitator-teach" role="group" aria-label={t('fac.teach')}>
      <div className="fac-day-chip">
        <span className="fac-day-label" aria-live="polite">{t('classroom.dayHint',{day:room.day})}</span>
        <label className="fac-day-select">{t('fac.day')}<select value={room.day} disabled={disabled} onChange={e=>control('day',Number(e.target.value))} aria-label={t('fac.day')}>{dayOptions.map((day,i)=><option key={day} value={day}>{i+1}</option>)}</select></label>
      </div>
      <button type="button" className="classroom-open gradient" onClick={onOpenClassroom} aria-label={t('classroom.open')}><Presentation size={18} aria-hidden="true"/>{t('classroom.open')}</button>
      <button type="button" className={'fac-board-open'+(room.mode==='review'?' is-review':'')+(room.board?.status==='open'?' is-open':'')} data-testid="fac-board-open" disabled={disabled||busy} onClick={onOpenBoard} aria-label={t(!room.board?'fac.boardOpen':room.board.status==='closed'?'fac.boardReopen':'fac.boardView')}><Columns3 size={18} aria-hidden="true"/>{t(!room.board?'fac.boardOpen':room.board.status==='closed'?'fac.boardReopen':'fac.boardView')}</button>
      <LabConfigChrome room={room} control={control} disabled={disabled}/>
    </div>
    <div className="facilitator-controls-row facilitator-dials" role="group" aria-label={t('fac.session')}>
      <strong className="fac-dials-label">{t('fac.session')}</strong>
      <div className="fac-group" role="group" aria-label={t('fac.round')}>
        <button type="button" disabled={disabled} onClick={()=>control(room.running?'pause':'start')} aria-pressed={room.running}>{room.running?<Pause size={16} aria-hidden="true"/>:<Play size={16} aria-hidden="true"/>}{room.running?t('fac.pause'):t('fac.startTimer')}</button>
        <button type="button" disabled={disabled} onClick={()=>control('next')}><RotateCw size={16} aria-hidden="true"/>{t('fac.nextRound')}</button>
      </div>
      <div className="fac-group" role="group" aria-label={t('fac.timeMin')}>
        <label>{t('fac.timeMin')}<input type="number" min={0} max={120} value={time} onChange={e=>setTime(e.target.value)} onBlur={()=>commit(time,'time',Math.ceil(room.remaining/60)*60)} onKeyDown={enter}/></label>
        <button type="button" disabled={disabled} onClick={()=>control('time',Math.max(0,room.remaining+300))} title={t('fac.plus5')}>+5 min</button>
        <button type="button" disabled={disabled} onClick={()=>control('time',Math.max(0,room.remaining-300))} title={t('fac.minus5')}>−5 min</button>
      </div>
      <label>{t('fac.roundMin')}<input type="number" min={1} max={120} value={duration} onChange={e=>setDuration(e.target.value)} onBlur={()=>commit(duration,'duration',room.roundSeconds||1500)} onKeyDown={enter}/></label>
      <label>{t('fac.phase')}<select value={room.phase} disabled={disabled} onChange={e=>control('phase',e.target.value)}>{phases.map(p=><option key={p}>{p}</option>)}</select></label>
      <label>{t('fac.format')}<select value={room.mode} disabled={disabled} onChange={e=>control('mode',e.target.value)}><option value="lesson">{t('fac.format.lesson')}</option><option value="solo">{t('fac.format.solo')}</option><option value="squad">{t('fac.format.squad')}</option><option value="review">{t('fac.format.review')}</option></select></label>
      <label className="facilitator-toggle"><input type="checkbox" checked={room.chat} disabled={disabled} onChange={e=>control('chat',e.target.checked)}/>{t('fac.chat')}</label>
    </div>
  </div>;
}

function FacilitatorWorkspace({session,action,busy,joined,onError}){
  const t=useT();
  const hostKey=session.hostKey;
  const [squads,setSquads]=useState(session.squads);
  const refreshSquads=async()=>setSquads(await api('facilitator/overview',{hostKey}));
  const deleteSquad=squad=>{if(!confirm(t('overview.deleteConfirm',{name:squad.name})))return;action(async()=>{await api('facilitator/room/delete',{hostKey,roomId:squad.id});await refreshSquads();});};
  useEffect(()=>{let active=true;const poll=async()=>{try{const next=await api('facilitator/overview',{hostKey});if(active)setSquads(next);}catch(e){if(active)onError(e);}};const timer=setInterval(poll,5000);return()=>{active=false;clearInterval(timer);};},[hostKey,onError]);
  return <div className="facilitator-overview"><section className="facilitator-create"><h2>{t('join.heading.create')}</h2><form onSubmit={e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));action(async()=>{const result=await api('create',{name:data.name,hostKey});saveSession(result);joined(result.resumeToken);});}}><label htmlFor="join-name">{t('join.nameSquad')}<input id="join-name" name="name" required maxLength={50} placeholder={t('join.placeholderSquad')} autoComplete="nickname"/></label><button type="submit" className="gradient" disabled={busy} aria-busy={busy||undefined}>{busy?t('join.submitBusy'):t('join.submitCreate')}<ArrowRight size={18} aria-hidden="true"/></button></form></section><CohortPanel squads={squads} hostKey={hostKey} action={action} onSquadsChanged={refreshSquads}/>{!squads.length?<StatusState kind="empty" title={t('overview.empty')}/>:squads.map(squad=><article className="evidence" key={squad.id} data-testid="squad-card"><h3>{squad.name}</h3><p>{t('overview.roomCode')} <code>{squad.code}</code></p><p>{t('overview.round',{round:squad.round,phase:squad.phase,day:squad.day})}</p><p>{squad.running?t('overview.running'):t('overview.paused')} · {formatSeconds(squad.remaining)}</p><ul>{squad.members.map(member=><li key={member.id}>{member.name} · {member.online?t('overview.online'):t('overview.offline')} · {member.help?t('overview.askingHelp'):''}</li>)}</ul><p>{t('overview.evidence',{evidence:squad.evidence,handoffs:squad.handoffs})}</p>{squad.awaitingReview>0&&<p className="cyan">{t('overview.awaitingReview',{count:squad.awaitingReview})}</p>}<p>{t('overview.board',{status:squad.board==='open'?t('board.open'):squad.board==='closed'?t('board.closed'):t('overview.boardNone')})}</p><button type="button" onClick={()=>action(async()=>{const result=await api('facilitator/attach',{hostKey,roomId:squad.id});saveSession(result);joined();})}>{t('overview.open')}</button> <button type="button" data-testid="squad-delete" disabled={busy} onClick={()=>deleteSquad(squad)}><Trash2 size={14} aria-hidden="true"/>{t('overview.delete')}</button></article>)}</div>;
}

function CohortPanel({squads,hostKey,action,onSquadsChanged}){
  const t=useT();
  const {locale}=useI18n();
  const [cohorts,setCohorts]=useState([]);
  const [codes,setCodes]=useState([]);
  const [copied,setCopied]=useState(false);
  const [rosterCopied,setRosterCopied]=useState(null);
  const refresh=async()=>setCohorts(await api('facilitator/cohorts',{hostKey}));
  // Refresh when hostKey changes; action and refresh are recreated on render.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh is intentionally keyed only by hostKey
  useEffect(()=>{action(refresh);},[hostKey]);
  const reveal=list=>{setCodes(current=>[...current,...list]);setCopied(false);};
  const names=value=>String(value||'').split('\n').map(name=>name.trim()).filter(Boolean);
  const date=ms=>new Date(ms).toLocaleDateString(locale==='nl'?'nl-NL':'en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
  const dateTime=ms=>ms?new Date(ms).toLocaleString(locale==='nl'?'nl-NL':'en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'UTC'}):'';
  const submit=(route,build,after)=>e=>{e.preventDefault();const form=e.currentTarget,data=Object.fromEntries(new FormData(form));action(async()=>{const result=await api(route,{hostKey,...build(data)});after(result);form.reset();await refresh();});};
  const memberAction=(route,cohortId,memberId)=>action(async()=>{const result=await api(route,{hostKey,cohortId,memberId});if(result.code)reveal([result]);await refresh();});
  const revokeCertificate=(cohortId,certificateId)=>action(async()=>{await api('facilitator/cohort/certificate/revoke',{hostKey,cohortId,certificateId});await refresh();});
  const deleteCohort=cohort=>{if(!confirm(t('cohort.deleteConfirm',{name:cohort.name})))return;action(async()=>{await api('facilitator/cohort/delete',{hostKey,cohortId:cohort.id});await refresh();await onSquadsChanged?.();});};
  const issueCertificate=(cohortId,memberId)=>action(async()=>{await api('facilitator/cohort/certificate/issue',{hostKey,cohortId,memberId});await refresh();});
  const openCertificate=certificateId=>{const view=window.open('','_blank');if(view)view.opener=null;action(async()=>{try{const response=await fetch('/game/facilitator/cohort/certificate/view',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({hostKey,certificateId,locale})});if(!response.ok)throw Error((await response.json()).error);const url=URL.createObjectURL(new Blob([await response.text()],{type:'text/html'}));view.location=url;setTimeout(()=>URL.revokeObjectURL(url),60000);}catch(error){view?.close();throw error;}});};
  const rosterCsvText=cohort=>{
    const rows=[['name','room','room_code','joined_at'],...cohort.members.map(member=>[member.name,member.room?.name||'',member.room?.code||'',member.joinedAt?new Date(member.joinedAt).toISOString():''])];
    return rows.map(row=>row.map(value=>{const text=value==null?'':String(value);return /["\n,]/.test(text)?`"${text.replaceAll('"','""')}"`:text;}).join(',')).join('\n')+'\n';
  };
  const exportRoster=(cohort,mode)=>action(async()=>{
    const csv=rosterCsvText(cohort);
    if(mode==='copy'){await navigator.clipboard.writeText(csv);setRosterCopied(cohort.id);return;}
    const link=document.createElement('a');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    link.href=url;
    link.download=`${cohort.name.replace(/[^\w.-]+/g,'_')||'wave-cohort'}-roster.csv`;
    link.click();URL.revokeObjectURL(url);
  });
  return <section className="cohort-panel" aria-labelledby="cohort-heading" data-testid="wave-cohort-panel">
    <h3 id="cohort-heading">{t('cohort.title')}</h3>
    <p className="muted cohort-lede" data-testid="cohort-vocab">{t('cohort.lede')}</p>
    {codes.length>0&&<div className="cohort-codes" role="region" aria-label={t('cohort.codesTitle')}>
      <strong>{t('cohort.codesTitle')}</strong><p>{t('cohort.codesHelp')}</p>
      <ul>{codes.map(entry=><li key={entry.memberId+entry.code}><span>{entry.name}</span><code>{entry.code}</code></li>)}</ul>
      <div className="cohort-actions"><button type="button" onClick={()=>action(async()=>{await navigator.clipboard.writeText(codes.map(entry=>`${entry.name}\t${entry.code}`).join('\n'));setCopied(true);})}>{copied?t('cohort.copied'):t('cohort.copyAll')}</button><button type="button" className="text-button" onClick={()=>setCodes([])}>{t('cohort.hideCodes')}</button></div>
    </div>}
    {!cohorts.length&&<p className="muted" data-testid="cohort-empty">{t('cohort.empty')}</p>}
    {cohorts.map(cohort=><article className="cohort-card" key={cohort.id} data-testid="cohort-card">
      <header><h4>{cohort.name}</h4><span className={'cohort-phase '+cohort.phase}>{t(`cohort.phase.${cohort.phase}`)}</span><button type="button" className="cohort-delete" data-testid="cohort-delete" title={t('cohort.delete')} aria-label={t('cohort.delete')} onClick={()=>deleteCohort(cohort)}><Trash2 size={14} aria-hidden="true"/></button></header>
      <p className="muted">{t('cohort.window',{start:date(cohort.startsAt),active:date(cohort.activeEndsAt),readOnly:date(cohort.readOnlyEndsAt)})}</p>
      <div className="cohort-rooms" data-testid="cohort-rooms">
        <strong>{t('cohort.linkedRooms')}</strong>
        {!cohort.rooms?.length&&<p className="muted">{t('cohort.noLinkedRooms')}</p>}
        {!!cohort.rooms?.length&&<ul className="cohort-room-list">{cohort.rooms.map(room=><li key={room.id}><span>{room.name}</span><code>{room.code}</code>{room.id===cohort.currentRoomId&&<small className="cohort-status activated">{t('cohort.currentRoom')}</small>}</li>)}</ul>}
      </div>
      <form className="cohort-attach" key={(cohort.currentRoomId||'none')+'-select'} onSubmit={submit('facilitator/cohort/attach',data=>({cohortId:cohort.id,roomId:data.roomId}),()=>{})}>
        <label>{t('cohort.room')}<select name="roomId" defaultValue={cohort.currentRoomId||''} required><option value="" disabled>{t('cohort.noRoom')}</option>{squads.map(squad=><option key={squad.id} value={squad.id}>{squad.name} · {squad.code}</option>)}</select></label>
        <button type="submit">{t('cohort.attach')}</button>
      </form>
      <form className="cohort-attach" onSubmit={submit('facilitator/cohort/attach',data=>({cohortId:cohort.id,roomCode:String(data.roomCode||'').trim().toUpperCase()}),()=>{})}>
        <label>{t('cohort.attachByCode')}<input name="roomCode" required maxLength={40} autoCapitalize="characters" autoComplete="off" spellCheck={false} placeholder={t('cohort.attachByCodePlaceholder')}/></label>
        <button type="submit">{t('cohort.attach')}</button>
      </form>
      <div className="cohort-roster-heading">
        <strong>{t('cohort.roster')}</strong>
        <span className="cohort-actions">
          <button type="button" data-testid="cohort-roster-copy" onClick={()=>exportRoster(cohort,'copy')}>{rosterCopied===cohort.id?t('cohort.copied'):t('cohort.copyRoster')}</button>
          <button type="button" data-testid="cohort-roster-csv" onClick={()=>exportRoster(cohort,'csv')}><Download size={14} aria-hidden="true"/>{t('cohort.exportRoster')}</button>
        </span>
      </div>
      {!cohort.members.length&&<p className="muted" data-testid="cohort-roster-empty">{t('cohort.rosterEmpty')}</p>}
      <ul className="cohort-roster">{cohort.members.map(member=><li key={member.id}>
        <span><strong>{member.name}</strong><small className={'cohort-status '+member.status}>{t(`cohort.status.${member.status}`)}{member.seated?` · ${t('cohort.seated')}`:''}{member.room?` · ${member.room.name}`:''}{member.joinedAt?` · ${dateTime(member.joinedAt)}`:''}</small></span>
        <span className="cohort-actions">{member.status!=='revoked'&&<button type="button" onClick={()=>memberAction('facilitator/cohort/revoke',cohort.id,member.id)}>{t('cohort.revoke')}</button>}<button type="button" onClick={()=>memberAction('facilitator/cohort/reissue',cohort.id,member.id)}>{t('cohort.reissue')}</button></span>
        <CertificateLine certificate={member.certificate} badges={member.badges} date={date} open={()=>openCertificate(member.certificate.id)} revoke={()=>revokeCertificate(cohort.id,member.certificate.id)} issue={()=>issueCertificate(cohort.id,member.id)}/>
      </li>)}</ul>
      <form className="cohort-add" onSubmit={submit('facilitator/cohort/members',data=>({cohortId:cohort.id,members:names(data.members)}),result=>reveal(result.codes))}>
        <label>{t('cohort.addMembers')}<textarea name="members" rows={2} required/></label>
        <button type="submit">{t('cohort.submitAdd')}</button>
      </form>
    </article>)}
    <form className="cohort-create" data-testid="cohort-create" onSubmit={submit('facilitator/cohort/create',data=>({name:data.name,startDate:data.startDate,days:Number(data.days),members:names(data.members)}),result=>reveal(result.codes))}>
      <strong>{t('cohort.create')}</strong>
      <p className="muted">{t('cohort.createHelp')}</p>
      <label>{t('cohort.name')}<input name="name" required maxLength={60} placeholder={t('cohort.namePlaceholder')}/></label>
      <div className="cohort-row"><label>{t('cohort.startDate')}<input name="startDate" type="date" required/></label><label>{t('cohort.days')}<input name="days" type="number" min={1} max={14} defaultValue={5} required/></label></div>
      <label>{t('cohort.members')}<textarea name="members" rows={4} placeholder={t('cohort.membersOptional')}/></label>
      <button type="submit" className="gradient">{t('cohort.submitCreate')}</button>
    </form>
  </section>;
}
function CertificateLine({certificate,date,open,revoke,issue,badges}){
  const t=useT();
  const badgeStrip=!!badges?.length&&<ul className="cohort-badges" data-testid="facilitator-badges">{badges.map(badge=><li key={badge.id} data-badge-type={badge.type}>{t(`badge.${badge.type}`,{day:badge.day,stop:badge.stopId,task:badge.taskId||badge.title})}</li>)}</ul>;
  if(certificate.id)return <div className="cohort-certificate"><small className="cohort-status activated">{t('cert.issued',{date:date(certificate.issuedAt)})}</small><span className="cohort-actions"><button type="button" onClick={open}>{t('cert.open')}</button><button type="button" onClick={revoke}>{t('cert.revoke')}</button></span>{badgeStrip}</div>;
  if(certificate.status==='eligible'||(certificate.status==='revoked'&&certificate.eligible))return <div className="cohort-certificate"><small className="cohort-status activated">{certificate.status==='revoked'?t('cert.revokedEligible',{date:date(certificate.revokedAt)}):t('cert.eligible')}</small><span className="cohort-actions"><button type="button" data-testid="cert-issue" onClick={issue}>{certificate.status==='revoked'?t('cert.reissue'):t('cert.issue')}</button></span>{badgeStrip}</div>;
  if(certificate.status==='revoked')return <div className="cohort-certificate"><small className="cohort-status revoked">{t('cert.revoked',{date:date(certificate.revokedAt)})}</small>{badgeStrip}</div>;
  const summary=(certificate.reasons||[]).map(reason=>t(`cert.reason.${reason.code}`,{day:reason.day}));
  return <div className="cohort-certificate"><small className="muted">{t('cert.notYet')} {summary.join(' · ')}</small>{badgeStrip}</div>;
}

function MyBadges(){
  const t=useT();
  const [bag,setBag]=useState(null);
  const [error,setError]=useState('');
  useEffect(()=>{let active=true;api('badges').then(result=>{if(active)setBag(result);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[]);
  return <section className="panel content-panel my-badges" aria-labelledby="my-badges-heading" data-testid="learner-badges">
    <p className="cyan">{t('badge.eyebrow')}</p><h2 id="my-badges-heading">{t('badge.title')}</h2>
    {error&&<StatusState kind="error" title={t('status.errorTitle')}>{error}</StatusState>}
    {!bag&&!error&&<StatusState kind="loading" title={t('badge.loading')}/>}
    {bag&&!bag.badges.length&&<p className="lede muted">{t('badge.empty')}</p>}
    {!!bag?.badges?.length&&<ul className="badge-list">{bag.badges.map(badge=><li key={badge.id} data-badge-type={badge.type}><strong>{t(`badge.${badge.type}`,{day:badge.day,stop:badge.stopId,task:badge.taskId||badge.title})}</strong>{badge.day!=null&&<small className="muted"> · {t('badge.day',{day:badge.day})}</small>}</li>)}</ul>}
  </section>;
}

function MyCertificate({room}){
  const t=useT();
  const {locale}=useI18n();
  const [mine,setMine]=useState(null);
  const [error,setError]=useState('');
  useEffect(()=>{let active=true;api('certificate').then(result=>{if(active)setMine(result);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[room.version]);
  const date=ms=>new Date(ms).toLocaleDateString(locale==='nl'?'nl-NL':'en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
  const certHref=mine?.certificateUrl?`${mine.certificateUrl}?locale=${locale}`:null;
  return <><section className="panel content-panel my-certificate" aria-labelledby="my-certificate-heading">
    <p className="cyan">{t('mycert.eyebrow')}</p><h2 id="my-certificate-heading">{t('mycert.title')}</h2>
    {error&&<StatusState kind="error" title={t('status.errorTitle')}>{error}</StatusState>}
    {!mine&&!error&&<StatusState kind="loading" title={t('mycert.loading')}/>}
    {mine?.status==='no-cohort'&&<p className="lede">{t('mycert.noCohort')}</p>}
    {mine?.status==='issued'&&<div className="my-certificate-issued">
      <p className="lede">{t('mycert.issued',{cohort:mine.cohortName,date:date(mine.issuedAt)})}</p>
      <p><a className="button-link gradient" href={certHref} target="_blank" rel="noopener"><Award size={16}/>{t('mycert.open')}</a></p>
      <dl><div><dt>{t('mycert.verificationId')}</dt><dd><code>{mine.id}</code></dd></div><div><dt>{t('mycert.verifyAt')}</dt><dd><code>{mine.verifyUrl}</code></dd></div></dl>
      <p className="muted">{t('mycert.share')}</p>
    </div>}
    {mine?.status==='eligible'&&<div>
      <p className="lede">{t('mycert.eligible',{done:mine.daysCompleted,days:mine.days})}</p>
      <p className="muted">{t('mycert.awaitFacilitator')}</p>
    </div>}
    {mine?.status==='revoked'&&<div>
      <p className="lede">{t('mycert.revoked')}</p>
      {mine.eligible&&<p className="muted">{t('mycert.awaitReissue')}</p>}
    </div>}
    {mine?.status==='not-eligible'&&<div>
      <p className="lede">{t('mycert.notYet',{done:mine.daysCompleted,days:mine.days})}</p>
      <ul className="my-certificate-todo">{mine.reasons.map(reason=><li key={[reason.code,reason.day,reason.id].join(':')}>{t(`mycert.reason.${reason.code}`,{day:reason.day,id:reason.id,title:reason.title})}</li>)}</ul>
      <p className="muted">{t('mycert.gated')}</p>
    </div>}
  </section>
  <MyBadges/>
  </>;
}

const formatSeconds=seconds=>`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;

function Timer({room}){
  const [now,setNow]=useState(()=>Date.now());
  const offset=useRef(0);
  useEffect(()=>{offset.current=room.serverTime-Date.now();},[room.serverTime]);
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),500);return()=>clearInterval(timer);},[]);
  // eslint-disable-next-line react/refs -- offset is synced from server time in an effect; read at render for countdown
  const seconds=room.running?Math.max(0,Math.ceil((room.deadline-now-offset.current)/1000)):room.remaining;
  return <>{formatSeconds(seconds)}</>;
}

function Document({room,action,busy,onIntent}){
  const t=useT();
  const canEdit=!room.readOnly;
  const [draft,setDraft]=useState(room.intentUrl||'');
  const [editing,setEditing]=useState(false);
  useEffect(()=>{if(!editing)setDraft(room.intentUrl||'');},[room.intentUrl,editing]);
  const save=event=>{event.preventDefault();action(async()=>{const next=await api('intent',{url:draft.trim()});onIntent(next.intentUrl);setEditing(false);});};
  const showForm=canEdit&&!room.readOnly&&(editing||!room.intentUrl);
  return <section className="panel document intent-document" data-testid="intent-document"><div className="document-heading"><div><h2>{t('doc.title')}</h2><p>{t('doc.subtitle')}</p></div><span><FileText size={15}/>{t('doc.badge')}</span></div>
    <div className="intent-body">
      {room.intentUrl&&<div className="intent-link"><a className="button gradient" href={room.intentUrl} target="_blank" rel="noopener noreferrer" data-testid="intent-open"><ExternalLink size={15} aria-hidden="true"/>{t('doc.open')}</a><small className="muted">{room.intentUrl}</small>{canEdit&&!room.readOnly&&!editing&&<button type="button" className="text-button" onClick={()=>setEditing(true)}>{t('doc.change')}</button>}</div>}
      {!room.intentUrl&&<StatusState kind="empty" title={t('doc.emptyTitle')}>{t(canEdit?'doc.emptyEditor':'doc.emptyReader')}</StatusState>}
      {showForm&&<form className="intent-form" onSubmit={save}><label htmlFor="intent-url">{t('doc.urlLabel')}</label><input id="intent-url" type="url" inputMode="url" placeholder="https://" maxLength={500} value={draft} onChange={event=>setDraft(event.target.value)}/><small className="muted">{t('doc.urlHelp')}</small><div className="intent-form-actions"><button type="submit" className="gradient" disabled={busy}>{t('doc.save')}</button>{room.intentUrl&&<button type="button" disabled={busy} onClick={()=>{setDraft('');action(async()=>{const next=await api('intent',{url:''});onIntent(next.intentUrl);setEditing(false);});}}>{t('doc.remove')}</button>}{editing&&<button type="button" className="text-button" onClick={()=>setEditing(false)}>{t('doc.cancel')}</button>}</div></form>}
      <div className="intent-repo"><h3>{t('doc.repoTitle')}</h3><p>{t('doc.repoHelp')}</p><a className="text-button" href="/game/intent.md" download="intent.md"><Download size={16} aria-hidden="true"/>{t('doc.template')}</a></div>
    </div>
    <div className="document-foot"><span>{t('doc.footLink')}</span><small>{t('doc.footAll')}</small></div></section>;
}

function Board({room,action,busy,onBoard}){
  const t=useT();
  const board=room.board,facilitator=room.me.role==='Facilitator',closed=board?.status==='closed';
  const columns=board?.columns||[];
  const [drafts,setDrafts]=useState({});
  const [tool,setTool]=useState('sticky');
  const firstCard=useRef(null);
  const change=kind=>action(async()=>onBoard(await api('board',{action:kind})));
  const add=(event,index)=>{event.preventDefault();const text=(drafts[index]||'').trim();if(!text||busy)return;action(async()=>{onBoard(await api('board/card',{column:index,text}));setDrafts(current=>({...current,[index]:''}));});};
  const focusAdd=()=>{setTool('sticky');(firstCard.current||document.getElementById('card-0'))?.focus();};
  const emptyCards=board&&!closed&&columns.length>0&&columns.every(column=>!column.cards.length);
  const columnTitle=index=>t('board.column.'+index);
  return <section className="panel document board" data-testid="debrief-board">
    <div className="document-heading"><div><h2>{t('board.title')}</h2><p>{t(!board?'board.none':closed?'board.closedLede':'board.lede')}</p></div>{board&&<span className={'board-status '+board.status}>{t(closed?'board.closed':'board.open')}</span>}</div>
    <div className="board-toolbar" role="toolbar" aria-label={t('board.toolbar')} data-testid="board-toolbar">
      {board&&!closed&&<>
        <button type="button" className={tool==='sticky'?'is-active':''} data-tool="sticky" onClick={()=>{setTool('sticky');focusAdd();}}><StickyNote size={15} aria-hidden="true"/>{t('board.tool.sticky')}</button>
        <button type="button" className={tool==='text'?'is-active':''} data-tool="text" onClick={()=>{setTool('text');focusAdd();}}><Type size={15} aria-hidden="true"/>{t('board.tool.text')}</button>
      </>}
      {facilitator&&(!board||closed)&&<button type="button" className="gradient" data-tool="open" disabled={busy} onClick={()=>change('open')}>{t(board?'board.reopen':'board.start')}</button>}
      {facilitator&&board&&!closed&&<button type="button" data-tool="close" disabled={busy} onClick={()=>change('close')}>{t('board.closeAction')}</button>}
      {board&&<a className="text-button" data-tool="export" href="/game/debrief/export" download><Download size={16} aria-hidden="true"/>{t('debrief.export')}</a>}
    </div>
    {!board&&<div className="board-empty"><StatusState kind="empty" title={t('board.startDebrief')} action={facilitator?<button type="button" className="gradient" disabled={busy} onClick={()=>change('open')}>{t('board.start')}</button>:null}>{t(facilitator?'board.startDebriefHelp':'board.emptyParticipant')}</StatusState></div>}
    {board&&emptyCards&&<div className="board-empty-cards" role="status"><StatusState kind="empty" title={t('board.startDebrief')}>{t('board.emptyCardsHelp')}</StatusState></div>}
    {board&&<><div className="board-columns">{columns.map((column,index)=><section className="board-column" key={index} aria-label={columnTitle(index)}><h3>{columnTitle(index)}<span>{column.cards.length}</span></h3><ul>{column.cards.map((card,cardIndex)=><li key={cardIndex}>{card}</li>)}</ul>{!column.cards.length&&<p className="muted">{t('board.noCards')}</p>}{!closed&&<form onSubmit={event=>add(event,index)}><label className="sr-only" htmlFor={'card-'+index}>{t('board.addLabel',{column:columnTitle(index)})}</label><textarea id={'card-'+index} ref={index===0?firstCard:undefined} rows={2} maxLength={280} value={drafts[index]||''} placeholder={tool==='text'?t('board.placeholderText'):t('board.placeholder')} onChange={event=>setDrafts(current=>({...current,[index]:event.target.value}))} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey)add(event,index);}}/><button type="submit" disabled={busy||!(drafts[index]||'').trim()}><Plus size={15}/>{t('board.add')}</button></form>}</section>)}</div><div className="document-foot"><span>{t(closed?'board.footClosed':'board.footOpen')}</span></div></>}
  </section>;
}
const LearnCourse=lazy(()=>import('./learn-course').then(module=>({default:module.LearnCourse})));
createRoot(document.getElementById('root')).render(<I18nProvider>{new URLSearchParams(location.search).has('learn')?<Suspense fallback={<p role="status">Loading course…</p>}><LearnCourse/></Suspense>:<App/>}</I18nProvider>);
