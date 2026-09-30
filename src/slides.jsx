import React,{useCallback,useEffect,useRef,useState} from 'react';
import {Presentation,Plus,ChevronLeft,ChevronRight,Download,Trash2,Copy,RefreshCw,ArrowLeft,Sparkles,Pin,PinOff,Eye,X,Pencil} from 'lucide-react';
import {api,apiMethod,getToken} from './api';
import {useI18n,useT} from './i18n';
import {reportScreen} from './screen';
import {StatusState} from './status';
import './slides-simple.css';

const DIMS={'16:9':[960,540],'4:3':[960,720],'1:1':[1080,1080],'9:16':[540,960],'4:5':[864,1080]};
const tokens=ds=>({'--ds-bg':ds?.bg||'#F5F2EA','--ds-surface':ds?.surface||'rgba(0,0,0,0.05)','--ds-text':ds?.text||'#171717','--ds-text-muted':ds?.textMuted||'#5c5c5c','--ds-accent':ds?.accent||'#0f766e','--ds-heading-font':ds?.headingFont||'Inter, system-ui, sans-serif','--ds-body-font':ds?.bodyFont||'Inter, system-ui, sans-serif','--ds-radius':ds?.radius||'8px'});

/** Renders one slide's HTML at its native canvas size, scaled to fit its box. */
export function SlideStage({slide,aspectRatio,designSystem,className=''}){
 const box=useRef(null);const [scale,setScale]=useState(0.5);
 const [w,h]=DIMS[aspectRatio]||DIMS['16:9'];
 useEffect(()=>{const el=box.current;if(!el)return;const fit=()=>setScale(Math.min(el.clientWidth/w,el.clientHeight/h)||0.1);fit();const ro=new ResizeObserver(fit);ro.observe(el);return()=>ro.disconnect();},[w,h]);
 return <div ref={box} className={`slide-stage ${className}`.trim()} style={{aspectRatio:`${w}/${h}`,...tokens(designSystem)}}>
  <div className="slide-canvas" style={{width:w,height:h,transform:`scale(${scale})`,background:slide?.background||'var(--ds-bg)'}} dangerouslySetInnerHTML={{__html:slide?.content||''}}/>
 </div>;
}

export function Decks({room,action,busy,onRoom,onContext}){
 const t=useT();
 const [decks,setDecks]=useState(null);
 const [listError,setListError]=useState('');
 const [open,setOpen]=useState(null);
 const [title,setTitle]=useState('');
 const createRef=useRef(null);
 const refresh=useCallback(async()=>{
  try{
   const result=await api('decks');
   setDecks(result.decks);
   setListError('');
  }catch(e){
   setListError(e.message||t('decks.loadFailed'));
   setDecks(prev=>prev===null?[]:prev);
  }
 },[t]);
 useEffect(()=>{refresh();const timer=setInterval(refresh,5000);return()=>clearInterval(timer);},[refresh]);
 if(open)return <DeckView room={room} deckId={open} action={action} busy={busy} onRoom={onRoom} onContext={onContext} onBack={()=>{setOpen(null);refresh();}}/>;
 const canDelete=deck=>room.me.role==='Facilitator'||deck.createdBy?.id===room.me.id;
 return <section className="panel content-panel decks">
  <p className="cyan"><Presentation size={16}/>{t('decks.eyebrow')}</p>
  <h2>{t('decks.title')}</h2>
  <p className="lede">{t('decks.lede')}</p>
  <nav className="deck-trail" aria-label={t('decks.trailAria')}>
   <ol>
    <li aria-current="page"><span className="deck-trail-here">{t('decks.trailRoot')}</span></li>
   </ol>
  </nav>
  <form ref={createRef} className="form-row deck-create" onSubmit={e=>{e.preventDefault();if(!title.trim())return;action(async()=>{const deck=await api('decks',{title:title.trim()});setTitle('');setOpen(deck.id);});}}>
   <input value={title} onChange={e=>setTitle(e.target.value)} maxLength={200} placeholder={t('decks.newPlaceholder')} aria-label={t('decks.newLabel')}/>
   <button type="submit" className="gradient" disabled={busy||!title.trim()}><Plus size={16}/>{t('decks.create')}</button>
  </form>
  <div className="notice"><strong><Sparkles size={14}/> {t('decks.agentTitle')}</strong><p>{t('decks.agentBody')}</p></div>
  {listError&&<StatusState kind="error" title={t('decks.loadFailed')} action={<button type="button" onClick={refresh}>{t('status.retry')}</button>}>{listError}<p>{t('decks.loadFailedHelp')}</p></StatusState>}
  {decks===null&&!listError&&<StatusState kind="loading" title={t('common.loading')}/>}
  {decks&&!decks.length&&!listError&&<StatusState kind="empty" title={t('decks.empty')} action={<button type="button" className="gradient" onClick={()=>createRef.current?.querySelector('input')?.focus()}>{t('decks.create')}</button>}>{t('decks.emptyHelp')}</StatusState>}
  {decks&&decks.length>0&&<div className="deck-list">{decks.map(deck=><article className="deck-card" key={deck.id}>
   <button type="button" className="deck-open" onClick={()=>setOpen(deck.id)}><strong>{deck.title}</strong><small className="muted">{t('decks.meta',{count:deck.slideCount,revision:deck.revision,by:deck.createdBy?.name||'?'})}</small></button>
   <div className="deck-card-actions">
    <button type="button" title={t('decks.duplicate')} aria-label={t('decks.duplicate')} disabled={busy} onClick={()=>action(async()=>{await api(`decks/${deck.id}/duplicate`,{});await refresh();})}><Copy size={14}/></button>
    {canDelete(deck)&&<button type="button" title={t('decks.delete')} aria-label={t('decks.delete')} disabled={busy} onClick={()=>{if(!confirm(t('decks.deleteConfirm',{title:deck.title})))return;action(async()=>{await apiMethod('DELETE',`decks/${deck.id}`);await refresh();});}}><Trash2 size={14}/></button>}
   </div>
  </article>)}</div>}
 </section>;
}

function DeckView({room,deckId,action,busy,onRoom,onContext,onBack}){
 const t=useT();
 const {locale}=useI18n();
 const [deck,setDeck]=useState(null);
 const [index,setIndex]=useState(0);
 const [error,setError]=useState('');
 const [preview,setPreview]=useState(false);
 const [renaming,setRenaming]=useState(false);
 const [editing,setEditing]=useState(false);
 const [moreOpen,setMoreOpen]=useState(false);
 const [draftTitle,setDraftTitle]=useState('');
 const stage=useRef(null);
 const onContextRef=useRef(onContext);
 useEffect(()=>{onContextRef.current=onContext;},[onContext]);
 const load=useCallback(async()=>{try{const next=await api(`decks/${deckId}`);setDeck(next);setError('');}catch(e){setError(e.message||t('decks.loadFailed'));}},[deckId,t]);
 useEffect(()=>{load();const timer=setInterval(load,4000);return()=>clearInterval(timer);},[load]);
 const count=deck?.slides.length||0;
 const slideId=deck?.slides[index]?.id??null;
 useEffect(()=>{reportScreen({deckId,slideIndex:index,slideId});},[deckId,index,slideId]);
 useEffect(()=>()=>reportScreen({deckId:null,slideIndex:null,slideId:null}),[]);
 useEffect(()=>{if(!deck?.title||!slideId)return;onContextRef.current?.({deckId,slideId,slideIndex:index,deckTitle:deck.title});},[deckId,slideId,index,deck?.title]);
 useEffect(()=>()=>onContextRef.current?.(null),[]);
 const go=useCallback(delta=>setIndex(i=>Math.max(0,Math.min(count-1,i+delta))),[count]);
 useEffect(()=>{if(index>=count&&count)setIndex(count-1);},[count,index]);
 useEffect(()=>{const onKey=e=>{if(e.key==='Escape'&&preview){e.preventDefault();setPreview(false);return;}if(preview||renaming)return;if(e.target.closest('input,textarea,select,[contenteditable],.simple-assistant,.simple-menu'))return;if(['ArrowRight','ArrowDown','PageDown'].includes(e.key)){e.preventDefault();go(1);}else if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();go(-1);}else if(e.key==='Home')setIndex(0);else if(e.key==='End')setIndex(Math.max(0,count-1));};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);},[go,count,preview,renaming]);
 const presentFullscreen=()=>setPreview(true);
 const download=()=>action(async()=>{const response=await fetch(`/game/decks/${deckId}/export.html`,{headers:{authorization:`Bearer ${getToken()}`}});if(!response.ok)throw Error((await response.json().catch(()=>({})))?.error||t('decks.exportFailed'));const blob=await response.blob();const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=response.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1]||'deck.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);});
 const addSlide=()=>action(async()=>{await api(`decks/${deckId}/slides`,{heading:t('decks.newSlideHeading'),body:[t('decks.newSlideBody')]});await load();setIndex(count);});
 const removeSlide=slide=>action(async()=>{await apiMethod('PATCH',`decks/${deckId}`,{operations:[{op:'delete-slide',slideId:slide.id}]});await load();});
 const move=(slide,delta)=>action(async()=>{const ids=deck.slides.map(s=>s.id);const from=ids.indexOf(slide.id),to=from+delta;if(to<0||to>=ids.length)return;ids.splice(to,0,ids.splice(from,1)[0]);await apiMethod('PATCH',`decks/${deckId}`,{expectedRevision:deck.revision,operations:[{op:'reorder-slides',slideIds:ids}]});await load();setIndex(to);});
 const saveTitle=()=>{const next=draftTitle.trim();if(!next||!deck||next===deck.title){setRenaming(false);return;}action(async()=>{await apiMethod('PATCH',`decks/${deckId}`,{expectedRevision:deck.revision,operations:[{op:'patch-deck-fields',fields:{title:next}}]});await load();setRenaming(false);});};
 const facilitator=room.me.role==='Facilitator';
 const pinned=facilitator&&room.classroomOverlayDeckId===deckId;
 const togglePin=()=>action(async()=>{
  const next=pinned
   ?await apiMethod('DELETE','classroom-overlay',{day:room.day})
   :await apiMethod('PUT','classroom-overlay',{deckId,day:room.day});
  onRoom?.(next);
 });
 const showNotes=room.me.role!=='Navigator';
 const current=deck?.slides[index];
 const positionLabel=count?t('decks.position',{n:index+1,count}):t('decks.noSlidesShort');
 return <section className="panel content-panel deck-view academy-simple">
  <nav className="deck-trail" aria-label={t('decks.trailAria')}>
   <ol>
    <li><button type="button" className="deck-trail-link" onClick={onBack}>{t('decks.trailRoot')}</button></li>
    <li aria-current={renaming?undefined:'page'}><span className="deck-trail-here">{deck?.title||t('common.loading')}</span></li>
    {deck&&<li aria-current="page"><span className="deck-trail-here">{positionLabel}</span></li>}
   </ol>
  </nav>
  <div className="deck-toolbar simple-deck-toolbar">
   <button type="button" className="simple-deck-back" onClick={onBack} aria-label={t('decks.back')}><ArrowLeft size={15}/></button>
   {renaming?
    <form className="deck-rename" onSubmit={e=>{e.preventDefault();saveTitle();}}>
     <input value={draftTitle} onChange={e=>setDraftTitle(e.target.value)} maxLength={200} aria-label={t('decks.renameLabel')} autoFocus/>
     <button type="submit" className="gradient" disabled={busy||!draftTitle.trim()}>{t('decks.renameSave')}</button>
     <button type="button" onClick={()=>setRenaming(false)}>{t('decks.renameCancel')}</button>
    </form>
    :<h2 className="deck-title-row">
      <span>{deck?.title||t('common.loading')}</span>
      {deck&&editing&&<button type="button" className="deck-rename-trigger" onClick={()=>{setDraftTitle(deck.title);setRenaming(true);}} title={t('decks.rename')} aria-label={t('decks.rename')}><Pencil size={14}/></button>}
     </h2>}
   <div className="deck-toolbar-actions simple-deck-actions">
    <button type="button" className="simple-deck-edit" aria-pressed={editing} onClick={()=>{setEditing(v=>!v);setRenaming(false);}}><Pencil size={14}/>{editing?(locale==='nl'?'Gereed':'Done'):(locale==='nl'?'Bewerken':'Edit')}</button>
    <button type="button" className="gradient deck-primary simple-deck-present" disabled={!count} onClick={presentFullscreen}><Presentation size={16}/>{t('decks.present')}</button>
    <details className="simple-deck-more" open={moreOpen} onToggle={e=>setMoreOpen(e.currentTarget.open)}>
     <summary>{locale==='nl'?'Meer':'More'}</summary>
     <div className="simple-deck-more-menu">
      <button type="button" disabled={busy} onClick={addSlide}><Plus size={14}/>{t('decks.addSlide')}</button>
      <button type="button" disabled={!count} onClick={()=>setPreview(true)}><Eye size={14}/>{t('decks.preview')}</button>
      <button type="button" onClick={load} aria-label={t('decks.refresh')}><RefreshCw size={14}/>{t('decks.refresh')}</button>
      <button type="button" disabled={!count} onClick={download}><Download size={14}/>{t('decks.export')}</button>
      {facilitator&&<button type="button" disabled={busy||!count} onClick={togglePin} aria-pressed={pinned}>{pinned?<PinOff size={14}/>:<Pin size={14}/>}{pinned?t('decks.unpinOverlayShort'):t('decks.pinOverlayShort')}</button>}
     </div>
    </details>
   </div>
  </div>
  {error&&<StatusState kind="error" title={t('decks.loadFailed')} action={<button type="button" onClick={load}>{t('status.retry')}</button>}>{error}<p>{t('decks.loadFailedHelp')}</p></StatusState>}
  {facilitator&&pinned&&<p className="notice deck-pin-notice" role="status">{t('decks.pinnedNotice',{day:room.day})}</p>}
  {!deck&&!error&&<StatusState kind="loading" title={t('common.loading')}/>}
  {deck&&!count&&<StatusState kind="empty" title={t('decks.noSlides')} action={<button type="button" className="gradient" disabled={busy} onClick={addSlide}><Plus size={14}/>{t('decks.addSlide')}</button>}>{t('decks.noSlidesHelp')}</StatusState>}
  {deck&&count>0&&<div className="deck-body">
   <div className="deck-structure">
    <div className="deck-structure-head"><strong>{t('decks.structure')}</strong><span className="muted">{index+1} / {count}</span></div>
    <p className="deck-structure-here muted" aria-live="polite">{t('decks.youAreHere',{n:index+1,count,title:deck.title})}</p>
    <ol className="slide-rail" aria-label={t('decks.rail')}>{deck.slides.map((slide,i)=><li key={slide.id} className={i===index?'selected':''}>
     <button type="button" className="slide-thumb" onClick={()=>setIndex(i)} aria-current={i===index} aria-label={t('decks.slideN',{n:i+1})}><SlideStage slide={slide} aspectRatio={deck.aspectRatio} designSystem={deck.designSystem} className="thumb"/><span>{i+1}</span></button>
    </li>)}</ol>
   </div>
   <div className="deck-main">
    <div ref={stage} className="deck-stage-wrap" onClick={e=>{if(document.fullscreenElement===stage.current)go(e.clientX<window.innerWidth/3?-1:1);}}>
     <SlideStage slide={current} aspectRatio={deck.aspectRatio} designSystem={deck.designSystem}/>
    </div>
    {editing&&<details className="simple-slide-tools">
     <summary>{t('decks.structure')} · {t('decks.addSlide')}</summary>
     <div className="simple-slide-tools-actions">
      <button type="button" disabled={busy} onClick={addSlide}><Plus size={14}/>{t('decks.addSlide')}</button>
      <button type="button" disabled={busy||index===0} onClick={()=>move(current,-1)}>{t('decks.moveUp')}</button>
      <button type="button" disabled={busy||index>=count-1} onClick={()=>move(current,1)}>{t('decks.moveDown')}</button>
      <button type="button" disabled={busy} onClick={()=>{if(confirm(t('decks.deleteSlideConfirm')))removeSlide(current);}}><Trash2 size={14}/>{t('decks.deleteSlide')}</button>
     </div>
    </details>}
    <div className="deck-nav simple-deck-nav">
     <button type="button" onClick={()=>go(-1)} disabled={index===0} aria-label={t('decks.prev')}><ChevronLeft size={16}/></button>
     <span>{index+1} / {count}</span>
     <button type="button" onClick={()=>go(1)} disabled={index>=count-1} aria-label={t('decks.next')}><ChevronRight size={16}/></button>
    </div>
    {showNotes&&current?.notes&&<details className="simple-speaker-notes"><summary>{t('decks.notes')}</summary><div className="notice deck-notes"><p>{current.notes}</p></div></details>}
    <details className="simple-technical-details"><summary>{locale==='nl'?'Technische details':'Technical details'}</summary><p>{t('decks.editHint',{id:current?.id||'',deckId:deck.id})}</p></details>
   </div>
  </div>}
  {preview&&deck&&<div className="deck-preview-overlay" role="dialog" aria-modal="true" aria-label={t('decks.previewTitle')}>
   <div className="deck-preview-chrome">
    <div>
     <p className="cyan">{t('decks.preview')}</p>
     <strong>{deck.title}</strong>
     <small className="muted">{t('decks.previewHint')}</small>
    </div>
    <button type="button" className="gradient" onClick={()=>setPreview(false)}><X size={14}/>{t('decks.previewClose')}</button>
   </div>
   <iframe className="deck-preview-frame" title={t('decks.previewTitle')} src={`/game/decks/${deckId}/present`}/>
  </div>}
 </section>;
}
