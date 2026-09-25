import React,{useCallback,useEffect,useRef,useState} from 'react';
import {Presentation,Plus,ChevronLeft,ChevronRight,Maximize,Download,Trash2,Copy,RefreshCw,ArrowLeft,Sparkles} from 'lucide-react';
import {api,apiMethod,getToken} from './api';
import {useT} from './i18n';
import {reportScreen} from './screen';

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

export function Decks({room,action,busy}){
 const t=useT();
 const [decks,setDecks]=useState(null);
 const [open,setOpen]=useState(null);
 const [title,setTitle]=useState('');
 const refresh=useCallback(async()=>{try{const result=await api('decks');setDecks(result.decks);}catch{}},[]);
 useEffect(()=>{refresh();const timer=setInterval(refresh,5000);return()=>clearInterval(timer);},[refresh]);
 if(open)return <DeckView room={room} deckId={open} action={action} busy={busy} onBack={()=>{setOpen(null);refresh();}}/>;
 const canDelete=deck=>room.me.role==='Facilitator'||deck.createdBy?.id===room.me.id;
 return <section className="panel content-panel decks">
  <p className="cyan"><Presentation size={16}/>{t('decks.eyebrow')}</p>
  <h2>{t('decks.title')}</h2>
  <p className="lede">{t('decks.lede')}</p>
  <form className="form-row deck-create" onSubmit={e=>{e.preventDefault();if(!title.trim())return;action(async()=>{const deck=await api('decks',{title:title.trim()});setTitle('');setOpen(deck.id);});}}>
   <input value={title} onChange={e=>setTitle(e.target.value)} maxLength={200} placeholder={t('decks.newPlaceholder')} aria-label={t('decks.newLabel')}/>
   <button type="submit" className="gradient" disabled={busy||!title.trim()}><Plus size={16}/>{t('decks.create')}</button>
  </form>
  <div className="notice"><strong><Sparkles size={14}/> {t('decks.agentTitle')}</strong><p>{t('decks.agentBody')}</p></div>
  {decks===null&&<p className="muted">{t('common.loading')}</p>}
  {decks&&!decks.length&&<p className="empty"><Presentation size={22}/><br/>{t('decks.empty')}</p>}
  {decks&&decks.length>0&&<div className="deck-list">{decks.map(deck=><article className="deck-card" key={deck.id}>
   <button type="button" className="deck-open" onClick={()=>setOpen(deck.id)}><strong>{deck.title}</strong><small className="muted">{t('decks.meta',{count:deck.slideCount,revision:deck.revision,by:deck.createdBy?.name||'?'})}</small></button>
   <div className="deck-card-actions">
    <button type="button" title={t('decks.duplicate')} aria-label={t('decks.duplicate')} disabled={busy} onClick={()=>action(async()=>{await api(`decks/${deck.id}/duplicate`,{});await refresh();})}><Copy size={14}/></button>
    {canDelete(deck)&&<button type="button" title={t('decks.delete')} aria-label={t('decks.delete')} disabled={busy} onClick={()=>{if(!confirm(t('decks.deleteConfirm',{title:deck.title})))return;action(async()=>{await apiMethod('DELETE',`decks/${deck.id}`);await refresh();});}}><Trash2 size={14}/></button>}
   </div>
  </article>)}</div>}
 </section>;
}

function DeckView({room,deckId,action,busy,onBack}){
 const t=useT();
 const [deck,setDeck]=useState(null);
 const [index,setIndex]=useState(0);
 const [error,setError]=useState('');
 const stage=useRef(null);
 const load=useCallback(async()=>{try{const next=await api(`decks/${deckId}`);setDeck(next);setError('');}catch(e){setError(e.message);}},[deckId]);
 useEffect(()=>{load();const timer=setInterval(load,4000);return()=>clearInterval(timer);},[load]);
 const count=deck?.slides.length||0;
 const slideId=deck?.slides[index]?.id??null;
 useEffect(()=>{reportScreen({deckId,slideIndex:index,slideId});},[deckId,index,slideId]);
 useEffect(()=>()=>reportScreen({deckId:null,slideIndex:null,slideId:null}),[]);
 const go=useCallback(delta=>setIndex(i=>Math.max(0,Math.min(count-1,i+delta))),[count]);
 useEffect(()=>{if(index>=count&&count)setIndex(count-1);},[count,index]);
 useEffect(()=>{const onKey=e=>{if(e.target.closest('input,textarea'))return;if(['ArrowRight','ArrowDown','PageDown'].includes(e.key)){e.preventDefault();go(1);}else if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();go(-1);}else if(e.key==='Home')setIndex(0);else if(e.key==='End')setIndex(Math.max(0,count-1));};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);},[go,count]);
 const present=()=>{const el=stage.current;if(el?.requestFullscreen)el.requestFullscreen().catch(()=>{});};
 const download=()=>action(async()=>{const response=await fetch(`/game/decks/${deckId}/export.html`,{headers:{authorization:`Bearer ${getToken()}`}});if(!response.ok)throw Error((await response.json().catch(()=>({})))?.error||t('decks.exportFailed'));const blob=await response.blob();const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=response.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1]||'deck.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);});
 const addSlide=()=>action(async()=>{await api(`decks/${deckId}/slides`,{heading:t('decks.newSlideHeading'),body:[t('decks.newSlideBody')]});await load();setIndex(count);});
 const removeSlide=slide=>action(async()=>{await apiMethod('PATCH',`decks/${deckId}`,{operations:[{op:'delete-slide',slideId:slide.id}]});await load();});
 const move=(slide,delta)=>action(async()=>{const ids=deck.slides.map(s=>s.id);const from=ids.indexOf(slide.id),to=from+delta;if(to<0||to>=ids.length)return;ids.splice(to,0,ids.splice(from,1)[0]);await apiMethod('PATCH',`decks/${deckId}`,{expectedRevision:deck.revision,operations:[{op:'reorder-slides',slideIds:ids}]});await load();setIndex(to);});
 const showNotes=room.me.role!=='Navigator';
 const current=deck?.slides[index];
 return <section className="panel content-panel deck-view">
  <div className="deck-toolbar">
   <button type="button" onClick={onBack}><ArrowLeft size={15}/>{t('decks.back')}</button>
   <h2>{deck?.title||t('common.loading')}</h2>
   <div className="deck-toolbar-actions">
    <button type="button" onClick={load} aria-label={t('decks.refresh')} title={t('decks.refresh')}><RefreshCw size={14}/></button>
    <button type="button" disabled={busy} onClick={addSlide}><Plus size={14}/>{t('decks.addSlide')}</button>
    <button type="button" disabled={!count} onClick={download}><Download size={14}/>{t('decks.export')}</button>
    <button type="button" className="gradient" disabled={!count} onClick={present}><Maximize size={14}/>{t('decks.present')}</button>
   </div>
  </div>
  {error&&<p className="error" role="alert">{error}</p>}
  {deck&&!count&&<p className="empty"><Presentation size={22}/><br/>{t('decks.noSlides')}</p>}
  {deck&&count>0&&<div className="deck-body">
   <ol className="slide-rail" aria-label={t('decks.rail')}>{deck.slides.map((slide,i)=><li key={slide.id} className={i===index?'selected':''}>
    <button type="button" className="slide-thumb" onClick={()=>setIndex(i)} aria-current={i===index} aria-label={t('decks.slideN',{n:i+1})}><SlideStage slide={slide} aspectRatio={deck.aspectRatio} designSystem={deck.designSystem} className="thumb"/><span>{i+1}</span></button>
   </li>)}</ol>
   <div className="deck-main">
    <div ref={stage} className="deck-stage-wrap" onClick={e=>{if(document.fullscreenElement===stage.current)go(e.clientX<window.innerWidth/3?-1:1);}}>
     <SlideStage slide={current} aspectRatio={deck.aspectRatio} designSystem={deck.designSystem}/>
    </div>
    <div className="deck-nav">
     <button type="button" onClick={()=>go(-1)} disabled={index===0} aria-label={t('decks.prev')}><ChevronLeft size={16}/></button>
     <span>{index+1} / {count}</span>
     <button type="button" onClick={()=>go(1)} disabled={index>=count-1} aria-label={t('decks.next')}><ChevronRight size={16}/></button>
     <span className="deck-nav-spacer"/>
     <button type="button" disabled={busy||index===0} onClick={()=>move(current,-1)}>{t('decks.moveUp')}</button>
     <button type="button" disabled={busy||index>=count-1} onClick={()=>move(current,1)}>{t('decks.moveDown')}</button>
     <button type="button" disabled={busy} onClick={()=>{if(confirm(t('decks.deleteSlideConfirm')))removeSlide(current);}}><Trash2 size={14}/>{t('decks.deleteSlide')}</button>
    </div>
    {showNotes&&current?.notes&&<div className="notice deck-notes"><strong>{t('decks.notes')}</strong><p>{current.notes}</p></div>}
    <small className="muted">{t('decks.editHint',{id:current?.id||'',deckId:deck.id})}</small>
   </div>
  </div>}
 </section>;
}
