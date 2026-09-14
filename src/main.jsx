import React,{useEffect,useState,useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {Users,BookOpen,Compass,Target,Sparkles,ClipboardCheck,Sun,Moon,ArrowRight,Clock,Play,Pause,RotateCw,HelpCircle,Check,Link,LogOut,Copy,ChevronRight,FileText,ExternalLink} from 'lucide-react';
import {api,authApi,getToken,saveSession} from './api';
import {Knowledge,Coach,Lesson,Solo,Review,Route} from './panels';
import './style.css';
const phases=['Plan','Design','Build','Test','Deploy','Maintain'];
const nav=[['squad','Squad-room',Users],['route','Mijn route',Compass],['lesson','Les & quick check',BookOpen],['solo','Solo-missie',Target],['coach','Mijn leercoach',Sparkles],['review','Review & overdracht',ClipboardCheck]];
const loginErrorCopy={domain:'Dit Google-account hoort niet bij een toegestaan werkdomein. Gebruik je AetherLink- of schoolaccount, of vraag de beheerder.',disabled:'Google-login is nu niet beschikbaar. Gebruik de startsleutel of vraag de beheerder.',token:'Google kon je account niet bevestigen. Probeer opnieuw in te loggen.',verify:'Google kon je account niet bevestigen. Probeer opnieuw in te loggen.',state:'Je Google-login is onderbroken. Start opnieuw met de Google-knop.',expired:'Je Google-login is verlopen. Start opnieuw met de Google-knop.',mismatch:'Je Google-login klopte niet meer. Start opnieuw met de Google-knop.','no-cookie':'Je Google-login is onderbroken (geen sessiecookie). Start opnieuw.','no-server-state':'Je Google-login is verlopen op de server. Start opnieuw.','bad-signature':'Je Google-login was ongeldig. Start opnieuw.'};
const initialLoginError=()=>{const code=new URLSearchParams(location.search).get('login_error');if(!code)return '';return loginErrorCopy[code]||'Inloggen mislukt. Probeer het opnieuw of kies een andere manier.';};
function App(){const [theme,setTheme]=useState(()=>localStorage.getItem('academy-theme')||'dark');const [session,setSession]=useState(!!getToken());const [room,setRoom]=useState(null);const [view,setView]=useState('squad');const [error,setError]=useState(initialLoginError);const [connected,setConnected]=useState(false);const [busy,setBusy]=useState(false);const [copied,setCopied]=useState(null);const copiedTimer=useRef(null);
 useEffect(()=>()=>clearTimeout(copiedTimer.current),[]);
 useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('academy-theme',theme);},[theme]);
 useEffect(()=>{if(!session)return;let active=true;const poll=async()=>{try{const r=await api('state');if(active){setRoom(r);setConnected(true);}}catch(e){if(active){setConnected(false);setError(e.message);}}};api('resume',{}).then(poll).catch(e=>setError(e.message));const t=setInterval(poll,2000);return()=>{active=false;clearInterval(t);};},[session]);
 const showCopied=kind=>{setCopied(kind);clearTimeout(copiedTimer.current);copiedTimer.current=setTimeout(()=>setCopied(null),1500);};
 async function action(fn){setBusy(true);setError('');try{return await fn();}catch(e){setError(e.message);return null;}finally{setBusy(false);}}
 const themeButton=<button className="icon-button" aria-label={theme==='dark'?'Lichte modus':'Donkere modus'} onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={19}/>:<Moon size={19}/>}</button>;
 if(!session||!room)return <><header className="welcome-header"><Brand/>{themeButton}</header><Join ready={session} action={action} busy={busy} error={error} joined={()=>setSession(true)}/></>;
 const facilitator=room.me.role==='Facilitator';
 const control=(actionName,value)=>action(async()=>{const r=await api('control',{action:actionName,value});setRoom(r);});
 return <div className="app"><header className="topbar"><Brand/><div className="account"><span className={'connection '+(connected?'online':'offline')} role="status" aria-live="polite"><i/>{connected?'Room verbonden':'Roomverbinding verbroken'}</span>{themeButton}<span className="avatar small">{room.me.name.slice(0,2).toUpperCase()}</span><span>{room.me.name}</span><button className="icon-button" aria-label="Sessie verlaten" onClick={()=>action(async()=>{await api('logout',{});sessionStorage.removeItem('academy-token');sessionStorage.removeItem('academy-mcp-'+room.me.id);location.reload();})}><LogOut size={17}/></button></div></header>
 <aside className="sidebar"><nav aria-label="Hoofdnavigatie">{nav.map(([id,label,Icon])=><button key={id} className={view===id?'selected':''} onClick={()=>setView(id)}><Icon size={19}/>{label}</button>)}</nav><div className="sidebar-bottom"><span>Samen leren.</span><span>Beter bouwen.</span><strong>Echte impact.</strong><hr/><small>2 klasdagen · 5 supportdagen</small></div></aside>
 <main><div className="room-heading"><div><p className="muted">Supportdag {room.day} · {room.day<=2?'Begeleid':room.day===3?'Samen met coaching':room.day===4?'Met hints':'Zelfstandig'}</p><h1>{room.name}</h1></div><div className="round"><span>Ronde {room.round} · {room.running?'Praktijk':room.remaining===0?'Tijd is om':'Gepauzeerd'}</span><strong><Clock size={22}/><Timer room={room}/></strong></div></div>
 <div className="sdlc" aria-label="Software development lifecycle">{phases.map((p,i)=><React.Fragment key={p}><div className={p===room.phase?'active':''}><span>{p}</span></div>{i<5&&<span className="phase-line"/>}</React.Fragment>)}</div>
 {error&&<div className="error" role="alert">{error}<button onClick={()=>setError('')} aria-label="Melding sluiten">×</button></div>}
 {facilitator&&<FacilitatorControls room={room} control={control} busy={busy} connected={connected}/>}
 <div className="workspace"><section className="primary">{view==='squad'&&<Document room={room} theme={theme}/ >}{view==='route'&&<Route room={room} onNavigate={setView}/ >}{view==='lesson'&&<Lesson room={room} action={action} busy={busy}/ >}{view==='solo'&&<Solo room={room} action={action} busy={busy} onNavigate={setView}/ >}{view==='coach'&&<Coach room={room} action={action}/ >}{view==='review'&&<Review room={room} action={action} busy={busy}/ >}</section>
 <aside className="right-rail"><section className="panel roster"><div className="panel-heading"><h2>Jouw squad <span>({room.members.length}/5)</span></h2><Users size={17}/></div>{room.members.length===0&&<p className="muted">Wacht op je squad. Deel de kamercode om te beginnen.</p>}{room.members.map(m=><div className="member" key={m.id}><span className="avatar">{m.name.slice(0,2).toUpperCase()}</span><div><strong>{m.name}{m.id===room.me.id?' (jij)':''}</strong><small className={m.role==='Driver'?'cyan':''}>{m.role}</small></div><span className={'presence '+(m.online?'present':'')} title={m.online?'Recent actief':'Geen recente activiteit'}/>{m.help&&<HelpCircle size={17} className="cyan" aria-label="Hulp gevraagd"/>}</div>)}<div className="room-code"><small>Kamercode</small><div className="room-code-actions"><button className="room-code-display" type="button" onClick={()=>action(async()=>{await navigator.clipboard.writeText(room.code);showCopied('code');})} aria-label={`Kamercode ${room.code}, kopieer`} title="Kopieer kamercode">{room.code}{copied==='code'?<Check size={14}/>:<Copy size={14}/>}</button><button className="room-code-link" type="button" onClick={()=>action(async()=>{await navigator.clipboard.writeText(`${location.origin}/?code=${room.code}`);showCopied('link');})} title="Kopieer uitnodigingslink">{copied==='link'?'Link gekopieerd':'Kopieer uitnodigingslink'}</button>{room.me.role==='Facilitator'&&<button className="room-code-link" type="button" onClick={()=>window.open(`${location.origin}/?code=${room.code}`,'_blank','noopener')} title="Opent de aanmeldpagina in een nieuw tabblad zodat je als deelnemer kunt meedoen"><ExternalLink size={14}/>Test als deelnemer</button>}</div><span className="sr-only" role="status">{copied==='code'?'Kamercode gekopieerd':copied==='link'?'Uitnodigingslink gekopieerd':''}</span></div>{room.members.length<4&&<small className="muted">De praktijk start vanaf 4 deelnemers.</small>}</section>
 <section className="panel contribution"><FileText size={20}/><h2>Jouw bijdrage</h2><p>{facilitator?'Bewaak het tempo en bespreek het bewijs. Jij start de timer en roteert de driver.':room.me.role==='Driver'?'Verwerk het gezamenlijke besluit in de intent. Spreek hardop uit wat je verandert.':'Onderzoek één aanname. Stel een gerichte vraag of voeg onderbouwd commentaar toe.'}</p><small className="muted">Werkvorm: {({lesson:'Les & quick check',solo:'Individuele praktijk',squad:'Squad-synthese',review:'Review & overdracht'})[room.mode]}</small></section>
 <button className="gradient coach-cta" onClick={()=>setView('coach')}><Sparkles size={18}/>Vraag je leercoach<ArrowRight size={17}/></button>{!facilitator&&<button className="help-button" onClick={()=>action(()=>api('help',{}))}><HelpCircle size={16}/>{room.me.help?'Hulp gevraagd · intrekken':'Vraag de facilitator om hulp'}</button>}
 </aside></div><footer>Een gedeelde intent. Kleine stappen. Bewijs dat je kunt uitleggen.</footer></main></div>;
}
function Brand(){return <div className="brand">AetherLink <span>Academy</span></div>;}
function Join({ready,action,busy,error,joined}){
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
 useEffect(()=>{let active=true;(async()=>{try{const config=await api('config');if(!active)return;setGoogleSso(config.googleSso);if(params.get('facilitator')==='1'||config.googleSso)try{const identity=await api('facilitator/me');if(active){setFacilitator(identity);setMode('create');}}catch{}}catch{}})();return()=>{active=false;};},[]);
 const create=mode==='create',facilitatorOverview=mode==='overview',participant=!create&&!facilitatorOverview;
 const setRole=next=>{setMode(next);setOverview(null);};
 const plainError=error&&(
  /ongeldige facilitator-startsleutel/i.test(error)?'Die startsleutel klopt niet. Controleer hem of log in met Google.':
  /kamer niet gevonden|ongeldige kamercode|niet gevonden/i.test(error)?'Die kamercode ken ik niet. Vraag je facilitator om de juiste code.':
  /vol|volzet|maximaal|te veel/i.test(error)?'Deze squad zit vol. Vraag je facilitator om een andere kamer.':
  error
 );
 return <main className="join">
  <div className="join-copy"><p className="muted">Samen leren · samen bouwen · groeien</p><h1>Klaar voor je<br/><span>missie?</span></h1><p>Werk met je squad en je eigen Claude Code.<br/>Van een heldere intent naar werk dat je kunt uitleggen.</p><div className="join-principles"><span><Users/>Eén squad</span><span><FileText/>Gedeelde intent</span><span><Sparkles/>Je eigen leercoach</span></div></div>
  <section className="join-form panel" aria-labelledby="join-heading">
   <div className="join-role" role="tablist" aria-label="Kies je rol">
    <button ref={roleRef} type="button" role="tab" className={participant?'selected':''} aria-selected={participant} onClick={()=>setRole('join')}>Ik ben deelnemer</button>
    <button type="button" role="tab" className={create?'selected':''} aria-selected={create} onClick={()=>setRole('create')}>Ik ben facilitator</button>
   </div>
   <h2 id="join-heading">{facilitatorOverview?'Facilitator-overzicht':create?'Start een squad':'Welkom bij je squad'}</h2>
   <p className="muted">{facilitatorOverview?(facilitator?'Bekijk alle squads als ingelogde facilitator.':'Bekijk alle squads met de facilitator-startsleutel.'):create?(facilitator?'Je bent ingelogd. Geef je squad een naam en maak de kamer.':googleSso?'Facilitators starten hier. Log bij voorkeur in met Google; de startsleutel is alleen een noodpad.':'Alleen voor de facilitator. Vul de startsleutel in om een squad te maken.'):'Vul je naam en de kamercode van je facilitator in. Geen Google-account nodig.'}</p>
   {facilitator&&<p className="facilitator-login" aria-live="polite">Ingelogd als {facilitator.name} ({facilitator.email}) <button type="button" className="text-button" onClick={()=>action(async()=>{await authApi('logout',{});setFacilitator(null);setMode('join');})}>Uitloggen</button></p>}
   {create&&!facilitator&&googleSso&&<div className="join-google-block">
    <p className="join-google-lede">Log in met je Google-werkaccount om als facilitator te starten.</p>
    <a className="gradient google-login" href="/auth/google/start"><strong>G</strong> Inloggen met Google (facilitator)</a>
    <p className="join-or" role="separator"><span>of startsleutel</span></p>
   </div>}
   <form onSubmit={e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));action(async()=>{if(facilitatorOverview){setOverview(await api('facilitator/overview',data));return;}const result=await api(create?'create':'join',data);saveSession(result);if(!create)history.replaceState(null,'',location.pathname);joined();});}}>
    {!facilitatorOverview&&<label htmlFor="join-name">{create?'Squadnaam':'Je naam'}<input id="join-name" ref={!create?nameRef:null} name="name" required maxLength={50} placeholder={create?'Squad Orion':'Bijv. Sam'} autoComplete="nickname"/></label>}
    {(facilitatorOverview||create)&&!facilitator&&<label htmlFor="join-hostkey">Facilitator-startsleutel<input id="join-hostkey" name="hostKey" value={hostKey} onChange={e=>setHostKey(e.target.value)} required={!googleSso||facilitatorOverview} type="password" autoComplete="off" placeholder="Alleen als Google niet werkt"/></label>}
    {participant&&<label htmlFor="join-code">Kamercode<input id="join-code" name="code" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} required type="text" autoComplete="off" placeholder="Bijv. 8A2F…" spellCheck={false}/></label>}
    <button type="submit" className="gradient" disabled={busy}>{busy?'Verbinden…':facilitatorOverview?'Toon overzicht':create?'Maak squad':'Deelnemen'}<ArrowRight size={18}/></button>
   </form>
   <div className="join-live" aria-live="assertive">{plainError&&<p className="error" role="alert">{plainError}</p>}</div>
   {create&&!facilitator&&!googleSso&&null}
   {!create&&!facilitatorOverview&&googleSso&&!facilitator&&<p className="join-side-hint muted">Ben je facilitator? Kies hierboven <strong>Ik ben facilitator</strong> en log in met Google.</p>}
   <button type="button" className="text-button" onClick={()=>{setMode('overview');setOverview(null);}}>Facilitator-overzicht</button>
   {ready&&<p className="muted" aria-live="polite">Bestaande sessie herstellen…</p>}
   <small>Geen Anthropic API-key nodig. Gebruik je eigen ingelogde Claude Code.</small>
   {facilitatorOverview&&overview&&<FacilitatorOverview squads={overview} hostKey={hostKey} action={action} joined={joined} onError={e=>action(async()=>{throw e;})}/>}
  </section>
 </main>;
}
function FacilitatorControls({room,control,busy,connected}){
 const [time,setTime]=useState(String(Math.ceil(room.remaining/60)));
 const [duration,setDuration]=useState(String(Math.ceil((room.roundSeconds||1500)/60)));
 useEffect(()=>setTime(String(Math.ceil(room.remaining/60))),[room.remaining]);
 useEffect(()=>setDuration(String(Math.ceil((room.roundSeconds||1500)/60))),[room.roundSeconds]);
 const commit=(draft,name)=>{const minutes=Number(draft);if(Number.isFinite(minutes))control(name,minutes*60);};
 const enter=e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur();}};
 const disabled=busy||!connected;
 return <div className="facilitator-controls" role="toolbar" aria-label="Facilitatorbediening">
  <div className="facilitator-controls-row facilitator-controls-time">
   <strong id="facilitator-label">Facilitator</strong>
   <button type="button" disabled={disabled} onClick={()=>control(room.running?'pause':'start')} aria-pressed={room.running}>{room.running?<Pause size={16}/>:<Play size={16}/>} {room.running?'Pauzeren':'Start timer'}</button>
   <button type="button" disabled={disabled} onClick={()=>control('next')}><RotateCw size={16}/>Volgende ronde</button>
   <label>Tijd (min)<input type="number" min={0} max={120} value={time} onChange={e=>setTime(e.target.value)} onBlur={()=>commit(time,'time')} onKeyDown={enter} aria-describedby="facilitator-label"/></label>
   <button type="button" disabled={disabled} onClick={()=>control('time',Math.max(0,room.remaining+300))} aria-label="Vijf minuten erbij">+5 min</button>
   <button type="button" disabled={disabled} onClick={()=>control('time',Math.max(0,room.remaining-300))} aria-label="Vijf minuten eraf">-5 min</button>
   <label>Rondetijd (min)<input type="number" min={1} max={120} value={duration} onChange={e=>setDuration(e.target.value)} onBlur={()=>commit(duration,'duration')} onKeyDown={enter}/></label>
  </div>
  <div className="facilitator-controls-row facilitator-controls-context" aria-label="Fase, dag en werkvorm">
   <label>Fase<select value={room.phase} onChange={e=>control('phase',e.target.value)}>{phases.map(p=><option key={p}>{p}</option>)}</select></label>
   <label>Dag<select value={room.day} onChange={e=>control('day',Number(e.target.value))}>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></label>
   <label>Werkvorm<select value={room.mode} onChange={e=>control('mode',e.target.value)}><option value="lesson">Les</option><option value="solo">Solo</option><option value="squad">Squad</option><option value="review">Review</option></select></label>
  </div>
 </div>;
}
function FacilitatorOverview({squads:initial,hostKey,action,joined,onError}){const [squads,setSquads]=useState(initial);useEffect(()=>{let active=true;const poll=async()=>{try{const next=await api('facilitator/overview',{hostKey});if(active)setSquads(next);}catch(e){if(active)onError(e);}};const timer=setInterval(poll,5000);return()=>{active=false;clearInterval(timer);};},[hostKey,onError]);return <div className="facilitator-overview">{!squads.length?<p className="empty">Nog geen squads.</p>:squads.map(squad=><article className="evidence" key={squad.id}><h3>{squad.name}</h3><p>Kamercode <code>{squad.code}</code></p><p>Ronde {squad.round} · {squad.phase} · Dag {squad.day}</p><p>{squad.running?'loopt':'gepauzeerd'} · {formatSeconds(squad.remaining)}</p><ul>{squad.members.map(member=><li key={member.id}>{member.name} · {member.role} · {member.online?'online':'offline'} · {member.help?'vraagt hulp':''}</li>)}</ul><p>Bewijs {squad.evidence} · Overdrachten {squad.handoffs}</p><button type="button" onClick={()=>action(async()=>{const result=await api('facilitator/attach',{hostKey,roomId:squad.id});saveSession(result);joined();})}>Open als facilitator</button></article>)}</div>;}
const formatSeconds=seconds=>`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
function Timer({room}){const [now,setNow]=useState(Date.now());const offset=useRef(0);useEffect(()=>{offset.current=room.serverTime-Date.now();},[room.serverTime]);useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),500);return()=>clearInterval(t);},[]);const seconds=room.running?Math.max(0,Math.ceil((room.deadline-now-offset.current)/1000)):room.remaining;return <>{formatSeconds(seconds)}</>;}
function Document({room,theme}){const frame=useRef(null);const [state,setState]=useState('Editor laden…');useEffect(()=>{localStorage.setItem('proof-share-viewer-name',room.me.name);},[room.me.name]);useEffect(()=>{const update=()=>{try{const win=frame.current?.contentWindow;const d=win?.document;if(!d?.body)return;d.documentElement.dataset.academyTheme=theme;let style=d.getElementById('academy-style');if(!style){style=d.createElement('style');style.id='academy-style';d.head.appendChild(style);}style.textContent=`:root{--font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;--font-size:16px;--line-height:1.7;--bg-color:${theme==='dark'?'#0c1928':'#ffffff'};--text-color:${theme==='dark'?'#e3ecfa':'#14243a'};--code-bg:${theme==='dark'?'#172b43':'#eff4fa'};--blockquote-color:${theme==='dark'?'#b7c7df':'#42536a'}}body{background:var(--bg-color)!important;color:var(--text-color)!important} .milkdown,.ProseMirror{color:var(--text-color)!important;font-family:var(--font-family)!important} #editor{padding:24px 36px!important} .ProseMirror h1{font-size:26px!important}.ProseMirror h2{font-size:18px!important;margin-top:26px!important} #share-banner{display:none!important;position:sticky!important;top:0!important;left:0!important;transform:none!important;width:100%!important;margin:0!important;border-radius:0!important;background:var(--bg-color)!important;color:var(--text-color)!important;box-shadow:none!important;padding:8px 16px!important} #share-banner .share-pill-agent-btn,#share-banner .share-pill-share-btn,#share-banner .share-pill-title,#share-banner .share-pill-sep,#share-banner>a{display:none!important} #share-banner button[aria-label=\"Share options\"]{display:none!important} #share-banner *{color:var(--text-color)!important} #share-banner .share-pill-status-inline{display:flex!important} #editor{padding-top:20px!important}`;
 const editable=d.querySelector('[contenteditable="true"]');const sync=d.querySelector('.share-pill-status-inline .status-label')?.textContent?.trim();if(sync)setState(({Saved:'Proof verbonden · wijzigingen opgeslagen',Saving:'Proof · wijzigingen opslaan…',Connecting:'Proof · verbinden…',Offline:'Proof offline · controleer je verbinding',Syncing:'Proof · synchroniseren…'})[sync]||('Proof · '+sync));else if(editable)setState('Editor geopend · synchronisatie nog niet bevestigd');else if(d.body.innerText.includes('error')||d.body.innerText.includes('Not found'))setState('Proof kon niet laden');}catch{setState('Proof-status niet beschikbaar');}};update();const t=setInterval(update,1500);return()=>clearInterval(t);},[theme]);return <section className="panel document"><div className="document-heading"><div><h2>Onze intent</h2><p>Eén doorlopend document voor het hele team.</p></div><span><FileText size={15}/>Gedeeld document · Proof</span></div><div className="document-status"><i/>{state}</div><iframe ref={frame} key={room.documentSlug} src={'/d/'+room.documentSlug} title="Gedeelde Proof-intent"/><div className="document-foot"><span>Driver verwerkt · navigators lezen en geven feedback</span><small>Alle squadleden kunnen samenwerken in dit document.</small></div></section>;}
createRoot(document.getElementById('root')).render(<App/>);
