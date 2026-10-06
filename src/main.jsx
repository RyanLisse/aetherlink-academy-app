import React,{useEffect,useState,useRef,useCallback,lazy,Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowRight,Download,FileText,House,LayoutGrid,LogOut,Moon,Sparkles,Sun,Trash2,Users,X} from 'lucide-react';
import {api,authApi,getToken,getParticipantAccess,saveParticipantAccess,forgetParticipantAccess,saveSession} from './api';
import {Lesson,Solo,Review} from './panels';
import {reportScreen,startScreenReporting} from './screen';
import {I18nProvider,LanguageToggle,useT,useI18n} from './i18n';
import {ArcadeApp, isArcadePath} from './arcade/ArcadeApp.jsx';
import {StatusState} from './status';
import {classifyJoinError} from './join-errors.mjs';
import {useAsyncAction} from './use-async-action';
import './tailwind.css';
import './style.css';
import {ClassroomShell} from './classroom-shell';
import {Decks} from './slides';

const FACILITATOR_RETURN_KEY='academy-facilitator-return';
const ADMIN_PATH='/facilitator';

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
  useI18n();
  const {busy,setBusy,error,setError,action}=useAsyncAction({initialError:()=>initialLoginError(t)});
  const [theme,setTheme]=useState(()=>localStorage.getItem('academy-theme')||'light');
  const [session,setSession]=useState(!!getToken());
  const [room,setRoom]=useState(null);
  const [view,setView]=useState('today');
  const [connected,setConnected]=useState(false);
  const [accessFromUrl]=useState(()=>new URLSearchParams(location.hash.slice(1)).get('access'));
  const [participantAccess,setParticipantAccess]=useState(()=>accessFromUrl||getParticipantAccess());
  const copiedTimer=useRef(null);
  const [path,setPath]=useState(()=>location.pathname);
  const [facilitatorAuth,setFacilitatorAuth]=useState(null);
  const [facilitatorEmpty,setFacilitatorEmpty]=useState(false);
  const [sessionEpoch,setSessionEpoch]=useState(0);
  useEffect(()=>{const sync=()=>setPath(location.pathname);window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync);},[]);
  // In-app navigation keeps the facilitator start key in memory (never in storage) between /facilitator and the workspace.
  const go=useCallback(next=>{if(location.pathname+location.search!==next)history.pushState(null,'',next);setPath(new URL(next,location.origin).pathname);},[]);
  const enterRoom=useCallback(resumeToken=>{if(resumeToken)setParticipantAccess(resumeToken);setFacilitatorEmpty(false);setRoom(null);setSessionEpoch(epoch=>epoch+1);setSession(true);go('/');},[go]);
  // Facilitator land-in: open the newest squad's workshop; with no squad yet, show the empty workspace shell.
  const landIn=useCallback(async(auth,squads)=>{setFacilitatorAuth(auth);setFacilitatorEmpty(false);if(!squads?.length){const result=await api('facilitator/teach',{...(auth?.hostKey?{hostKey:auth.hostKey}:{})});saveSession(result);enterRoom();return;}const result=await api('facilitator/attach',{...(auth.hostKey?{hostKey:auth.hostKey}:{}),roomId:squads[0].id});saveSession(result);enterRoom();},[enterRoom]);
  const openAdmin=useCallback(auth=>{if(auth)setFacilitatorAuth(auth);go(ADMIN_PATH);},[go]);
  const navigate=useCallback((next)=>{
    setView(next);
  },[]);
  useEffect(()=>()=>clearTimeout(copiedTimer.current),[]);
  useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('academy-theme',theme);},[theme]);
  useEffect(()=>{if(!accessFromUrl)return;const url=new URL(location.href);url.hash='';history.replaceState(null,'',url.pathname+url.search);},[accessFromUrl]);
  useEffect(()=>{if(session||!participantAccess)return;let active=true;setBusy(true);api('participant/resume',{resumeToken:participantAccess}).then(result=>{if(!active)return;saveParticipantAccess(participantAccess);saveSession(result);setSession(true);}).catch(e=>{if(!active)return;if(getParticipantAccess()===participantAccess)forgetParticipantAccess();setParticipantAccess(null);setError(e.message);}).finally(()=>{if(active)setBusy(false);});return()=>{active=false;};},[session,participantAccess,setBusy,setError]);
  useEffect(()=>{if(!session)return;let active=true;const poll=async()=>{try{const r=await api('state');if(active){setRoom(r);setConnected(true);}}catch(e){if(active){setConnected(false);if(e.status&&e.status<500)setError(e.message);}}};api('resume',{}).then(poll).catch(e=>{sessionStorage.removeItem('academy-token');setRoom(null);setConnected(false);setSession(false);if(!participantAccess)setError(e.message);});const timer=setInterval(poll,2000);return()=>{active=false;clearInterval(timer);};},[session,sessionEpoch,participantAccess,setError]);
  const participant=Boolean(room)&&room.me.role!=='Facilitator';
  const naslagLanding=participant&&(room.readOnly||(room.allReleased&&Boolean(room.me.cohortMemberId)));
  useEffect(()=>{if(naslagLanding)setView(current=>current==='today'||current==='lesson'||current==='squad'?'naslag':current);},[naslagLanding]);
  useEffect(()=>{if(room?.me.role==='Facilitator')setView(current=>current==='today'?'squad':current);},[room?.me.role]);
  useEffect(()=>{if(!participant)return;reportScreen({view});return startScreenReporting();},[participant,view]);
  async function leaveSession(){setBusy(true);setError('');try{await api('logout',{});sessionStorage.removeItem('academy-token');sessionStorage.removeItem('academy-mcp-'+room.me.id);sessionStorage.removeItem(`academy-agent-setup:${room.id}:${room.me.id}`);forgetParticipantAccess();if(room.me.role==='Facilitator'){setRoom(null);setConnected(false);setSession(false);go(ADMIN_PATH);return;}location.reload();}catch(err){setError(err.message);}finally{setBusy(false);}}
  const themeButton=<button className="icon-button" aria-label={theme==='dark'?t('theme.light'):t('theme.dark')} onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={19}/>:<Moon size={19}/>}</button>;
  const localeToggle=<LanguageToggle/>;
  if(isArcadePath(location.pathname))return <ArcadeApp themeButton={themeButton}/>;
  if(path===ADMIN_PATH)return <FacilitatorAdmin auth={facilitatorAuth} onAuth={setFacilitatorAuth} localeToggle={localeToggle} themeButton={themeButton} action={action} busy={busy} error={error} clearError={()=>setError('')} enterRoom={enterRoom}
    onWorkspace={()=>action(async()=>{if(session&&room&&room.me.role==='Facilitator'){go('/');return;}const squads=await api('facilitator/overview',{...(facilitatorAuth?.hostKey?{hostKey:facilitatorAuth.hostKey}:{})});await landIn(facilitatorAuth,squads);})}/>;
  if(!session&&facilitatorEmpty)return <FacilitatorEmptyShell onAdmin={()=>openAdmin()} onTeach={()=>action(async()=>{const auth=facilitatorAuth||{hostKey:''};const result=await api('facilitator/teach',{...(auth.hostKey?{hostKey:auth.hostKey}:{})});saveSession(result);enterRoom();})} account={<>{localeToggle}{themeButton}</>}/>;
  if(!session||!room)return <><header className="welcome-header"><Brand/><div className="welcome-actions">{localeToggle}{themeButton}</div></header><Join ready={session} action={action} busy={busy} error={error} clearError={()=>setError('')} joined={resumeToken=>{if(resumeToken)setParticipantAccess(resumeToken);setSession(true);}} onFacilitator={landIn} onAdmin={openAdmin}/></>;
  const facilitator=room.me.role==='Facilitator';
  const shellAccount=<>{localeToggle}{themeButton}<button type="button" onClick={leaveSession}><LogOut size={16}/>{t('account.leave')}</button></>;
  const renderWorkshop=lesson=>{
    const day=lesson.day??room.day;
    const page=lesson.page||'lesson';
    if(page==='review')return <Review room={room} action={action} busy={busy}/>;
    if(page==='assignments'&&day===room.day)return <Solo room={room} action={action} busy={busy} onNavigate={navigate}/>;
    return <Lesson room={room} action={action} busy={busy} day={day} page={page} onNavigate={navigate} framed/>;
  };
  const renderArcade=lesson=><div className="classroom-arcade-embed" data-testid="classroom-arcade-embed">
    <p className="muted">{t('classroom.arcade.help')}</p>
    <p><a className="button" href={lesson.href||'/arcade'} target="_blank" rel="noopener noreferrer">{t('classroom.arcade.open')}</a></p>
    <iframe title={lesson.title} src={lesson.href||'/arcade'} loading="lazy"/>
  </div>;
  const renderLearn=lesson=><div className="classroom-learn-embed" data-testid="classroom-learn-embed">
    <p className="muted">{lesson.title}</p>
    <p><a className="button" href={`/?learn=${encodeURIComponent(lesson.id)}`} target="_blank" rel="noopener noreferrer">{t('classroom.learn.open')}</a></p>
    <iframe title={lesson.title} src={`/?learn=${encodeURIComponent(lesson.id)}`} loading="lazy"/>
  </div>;
  const renderDecks=facilitator?()=><Decks room={room} action={action} busy={busy} onRoom={()=>{}}/>:undefined;
  return <ClassroomShell
    room={room}
    facilitator={facilitator}
    onAdmin={facilitator?()=>openAdmin():undefined}
    account={shellAccount}
    avatarLabel={room.me.name}
    action={action}
    busy={busy||!connected}
    renderWorkshop={renderWorkshop}
    renderArcade={renderArcade}
    renderLearn={renderLearn}
    renderDecks={renderDecks}
  />;
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


function Join({ready,action,busy,error,clearError,joined,onFacilitator,onAdmin}){
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
  useEffect(()=>{let active=true;(async()=>{try{const config=await api('config');if(!active)return;setGoogleSso(config.googleSso);setEmailLogin(Boolean(config.emailLogin));if(params.get('facilitator')==='1'||config.googleSso)try{const identity=await api('facilitator/me');const squads=await api('facilitator/overview',{});if(!active)return;const auth={hostKey:'',identity};if(params.get('facilitator')==='1'&&!params.get('code')&&!getToken()){const target=sessionStorage.getItem(FACILITATOR_RETURN_KEY);sessionStorage.removeItem(FACILITATOR_RETURN_KEY);history.replaceState(null,'','/');if(target===ADMIN_PATH)onAdmin(auth);else action(()=>onFacilitator(auth,squads));return;}setFacilitatorSession({hostKey:'',identity,squads});if(!params.get('code'))setMode('facilitator');}catch{}}catch{}})();return()=>{active=false;};},[]);
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
        <a className="gradient google-login" href="/auth/google/start" onClick={()=>sessionStorage.removeItem(FACILITATOR_RETURN_KEY)}><strong>G</strong> {t('join.googleButton')}</a>
        <p className="join-or" role="separator"><span>{t('join.orKey')}</span></p>
      </div>}
      {mode==='facilitator'&&facilitatorSession?<div className="join-facilitator-actions"><button type="button" className="gradient" data-testid="join-open-workspace" disabled={busy} onClick={()=>action(()=>onFacilitator({hostKey:facilitatorSession.hostKey,identity:facilitatorSession.identity},facilitatorSession.squads))}>{t('join.openWorkspace')}<ArrowRight size={18} aria-hidden="true"/></button><button type="button" data-testid="join-open-admin" onClick={()=>onAdmin({hostKey:facilitatorSession.hostKey,identity:facilitatorSession.identity})}><LayoutGrid size={16} aria-hidden="true"/>{t('join.openAdmin')}</button></div>
      :emailPath?<EmailLogin action={action} busy={busy} joined={joined}/>:<form onSubmit={e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));action(async()=>{if(mode==='facilitator'){const squads=await api('facilitator/overview',{hostKey:data.hostKey});await onFacilitator({hostKey:data.hostKey,identity:null},squads);return;}if(cohortPath){saveSession(await api('cohort/activate',{code:data.code}));history.replaceState(null,'',location.pathname);joined();return;}const result=await api('join',data);saveSession(result);history.replaceState(null,'',location.pathname);joined(result.resumeToken);});}}>
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




function FacilitatorWorkspace({session,action,busy,joined,onError}){
  const t=useT();
  const hostKey=session.hostKey;
  const [squads,setSquads]=useState(session.squads);
  const authBody=hostKey?{hostKey}:{};
  const refreshSquads=async()=>setSquads(await api('facilitator/overview',authBody));
  const deleteSquad=squad=>{if(!confirm(t('overview.deleteConfirm',{name:squad.name})))return;action(async()=>{await api('facilitator/room/delete',{...authBody,roomId:squad.id});await refreshSquads();});};
  useEffect(()=>{let active=true;const poll=async()=>{try{const next=await api('facilitator/overview',hostKey?{hostKey}:{});if(active)setSquads(next);}catch(e){if(active)onError(e);}};const timer=setInterval(poll,5000);return()=>{active=false;clearInterval(timer);};},[hostKey,onError]);
  const createSquad=e=>{
    e.preventDefault();
    const data=Object.fromEntries(new FormData(e.currentTarget));
    action(async()=>{
      const body={name:data.name,...(hostKey?{hostKey}:{})};
      try{
        const result=await api('create',body);
        saveSession(result);
        joined(result.resumeToken);
      }catch(err){
        // SSO path: empty hostKey relies on academy-facilitator cookie. Soft-retry once after me().
        if(err?.status===403&&!hostKey){
          try{
            await api('facilitator/me');
            const result=await api('create',body);
            saveSession(result);
            joined(result.resumeToken);
            return;
          }catch{
            throw Object.assign(Error(t('join.login.session')),{status:403});
          }
        }
        throw err;
      }
    });
  };
  return <div className="facilitator-overview"><section className="facilitator-create"><h2>{t('join.heading.create')}</h2><form onSubmit={createSquad}><label htmlFor="join-name">{t('join.nameSquad')}<input id="join-name" name="name" required maxLength={50} placeholder={t('join.placeholderSquad')} autoComplete="nickname"/></label><button type="submit" className="gradient" disabled={busy} aria-busy={busy||undefined}>{busy?t('join.submitBusy'):t('join.submitCreate')}<ArrowRight size={18} aria-hidden="true"/></button></form></section><CohortPanel squads={squads} hostKey={hostKey} action={action} onSquadsChanged={refreshSquads}/>{!squads.length?<StatusState kind="empty" title={t('overview.empty')}/>:squads.map(squad=><article className="evidence" key={squad.id} data-testid="squad-card"><h3>{squad.name}</h3><p>{t('overview.roomCode')} <code>{squad.code}</code></p><p>{t('overview.round',{round:squad.round,phase:squad.phase,day:squad.day})}</p><p>{squad.running?t('overview.running'):t('overview.paused')} · {formatSeconds(squad.remaining)}</p><ul>{squad.members.map(member=><li key={member.id}>{member.name} · {member.online?t('overview.online'):t('overview.offline')} · {member.help?t('overview.askingHelp'):''}</li>)}</ul><p>{t('overview.evidence',{evidence:squad.evidence,handoffs:squad.handoffs})}</p>{squad.awaitingReview>0&&<p className="cyan">{t('overview.awaitingReview',{count:squad.awaitingReview})}</p>}<p>{t('overview.board',{status:squad.board==='open'?t('board.open'):squad.board==='closed'?t('board.closed'):t('overview.boardNone')})}</p><button type="button" onClick={()=>action(async()=>{const result=await api('facilitator/attach',{...authBody,roomId:squad.id});saveSession(result);joined();})}>{t('overview.open')}</button> <button type="button" data-testid="squad-delete" disabled={busy} onClick={()=>deleteSquad(squad)}><Trash2 size={14} aria-hidden="true"/>{t('overview.delete')}</button></article>)}</div>;
}

// Dedicated facilitator admin (/facilitator): squads + Wave cohorts without the participant join gate.
function FacilitatorAdmin({auth,onAuth,onWorkspace,enterRoom,localeToggle,themeButton,action,busy,error,clearError}){
  const t=useT();
  const [squads,setSquads]=useState(null);
  const [checking,setChecking]=useState(true);
  const [googleSso,setGoogleSso]=useState(false);
  useEffect(()=>{let active=true;api('config').then(config=>{if(active)setGoogleSso(Boolean(config.googleSso));}).catch(()=>{});return()=>{active=false;};},[]);
  useEffect(()=>{let active=true;(async()=>{try{if(!auth){const identity=await api('facilitator/me');if(active)onAuth({hostKey:'',identity});return;}const next=await api('facilitator/overview',{hostKey:auth.hostKey});if(active)setSquads(next);}catch{if(active)setSquads(null);}finally{if(active)setChecking(false);}})();return()=>{active=false;};},[auth,onAuth]);
  const onError=useCallback(e=>action(async()=>{throw e;}),[action]);
  const signedIn=Boolean(auth&&squads);
  return <div className="facilitator-admin" data-testid="facilitator-admin">
    <header className="welcome-header"><Brand/><div className="welcome-actions">{signedIn&&<button type="button" data-testid="admin-to-workspace" onClick={onWorkspace} disabled={busy}><House size={16} aria-hidden="true"/>{t('admin.toWorkspace')}</button>}{localeToggle}{themeButton}{signedIn&&auth.identity&&<button type="button" onClick={()=>action(async()=>{await authApi('logout',{});setSquads(null);onAuth(null);})}><LogOut size={16} aria-hidden="true"/>{t('join.signOut')}</button>}</div></header>
    <main className="admin-main">
      {error&&<div className="error" role="alert">{error}<button type="button" onClick={clearError} aria-label={t('common.closeAlert')}>×</button></div>}
      {signedIn?<>
        <p className="muted admin-eyebrow">{t('nav.admin')}</p>
        <h1>{t('join.heading.workspace')}</h1>
        <p className="muted">{t('join.hint.workspace')}</p>
        {auth.identity&&<p className="facilitator-login">{t('join.signedIn',{name:auth.identity.name,email:auth.identity.email})}</p>}
        <FacilitatorWorkspace session={{hostKey:auth.hostKey,squads}} action={action} busy={busy} joined={enterRoom} onError={onError}/>
      </>:checking?<StatusState kind="loading" title={t('join.restoring')}/>:<section className="admin-login panel" aria-labelledby="admin-login-heading">
        <h1 id="admin-login-heading">{t('join.heading.facilitator')}</h1>
        <p className="muted">{googleSso?t('join.hint.facilitatorGoogle'):t('join.hint.facilitatorKey')}</p>
        {googleSso&&<><a className="gradient google-login" href="/auth/google/start" onClick={()=>sessionStorage.setItem(FACILITATOR_RETURN_KEY,ADMIN_PATH)}><strong>G</strong> {t('join.googleButton')}</a><p className="join-or" role="separator"><span>{t('join.orKey')}</span></p></>}
        <form onSubmit={e=>{e.preventDefault();const {hostKey}=Object.fromEntries(new FormData(e.currentTarget));action(async()=>{const next=await api('facilitator/overview',{hostKey});setSquads(next);onAuth({hostKey,identity:null});});}}>
          <label htmlFor="admin-hostkey">{t('join.hostKey')}<input id="admin-hostkey" name="hostKey" required type="password" autoComplete="off" placeholder={t('join.hostKeyPlaceholder')}/></label>
          <button type="submit" className="gradient" disabled={busy} aria-busy={busy||undefined}>{busy?t('join.submitBusy'):t('join.submitSignIn')}<ArrowRight size={18} aria-hidden="true"/></button>
        </form>
      </section>}
    </main>
  </div>;
}

// Soft fallback if teach attach fails: retry teach, never force Create as the only path.
function FacilitatorEmptyShell({onAdmin,account,onTeach}){
  const t=useT();
  return <ClassroomShell
    room={null}
    facilitator
    teachMode
    onAdmin={onAdmin}
    account={account}
    avatarLabel={t('simple.facilitator')}
    emptyCta={<div data-testid="facilitator-teach-fallback">
      <p className="simple-eyebrow">{t('simple.facilitator')}</p>
      <h1>{t('classroom.teachFallbackTitle')}</h1>
      <p className="simple-intro">{t('classroom.teachFallbackHelp')}</p>
      {onTeach&&<button type="button" className="simple-primary" data-testid="facilitator-teach-retry" onClick={onTeach}>{t('classroom.teachRetry')}</button>}
      <button type="button" data-testid="facilitator-empty-cta" onClick={onAdmin}>{t('nav.admin')}</button>
    </div>}
    renderWorkshop={()=>null}
    renderArcade={()=>null}
    renderLearn={()=>null}
  />;
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



const formatSeconds=seconds=>`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;



const LearnCourse=lazy(()=>import('./learn-course').then(module=>({default:module.LearnCourse})));
createRoot(document.getElementById('root')).render(<I18nProvider>{new URLSearchParams(location.search).has('learn')?<Suspense fallback={<p role="status">Loading course…</p>}><LearnCourse/></Suspense>:<App/>}</I18nProvider>);
