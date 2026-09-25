import React,{useEffect,useState} from 'react';
import {Library,Lock,Search,ExternalLink,BookText} from 'lucide-react';
import {api} from './api';
import {useT,useI18n} from './i18n';
import {Lesson} from './panels';
import {Hit} from './chat';
import {reportScreen} from './screen';
import {StatusState,RemoteStatus,useRemote} from './status';

// Reference view: every released day stays readable on its own, without moving the room.
export function Naslag({room,action,busy,onNavigate}){
  const t=useT();
  const {locale}=useI18n();
  const [error,setError]=useState('');
  const [selected,setSelected]=useState(null);
  const [query,setQuery]=useState('');
  const [result,setResult]=useState(null);
  const releasedKey=room.released?.join(',');
  const remote=useRemote('day-route',[releasedKey]),days=remote.data?.days||[];
  useEffect(()=>{reportScreen({view:'naslag',day:selected});},[selected]);
  async function search(e){
    e.preventDefault();
    const q=query.trim();if(!q)return;
    try{setError('');setResult(await api(`naslag/search?q=${encodeURIComponent(q)}&locale=${locale}`));}catch(err){setError(err.message);}
  }
  const open=days.find(d=>d.day===selected);
  return <section className="panel content-panel naslag">
    <p className="cyan"><Library size={16} aria-hidden="true"/>{t('naslag.eyebrow')}</p>
    <h2>{t('naslag.title')}</h2>
    <p className="lede">{room.allReleased?t('naslag.ledeAll'):t('naslag.lede')}</p>
    <form className="naslag-search" role="search" onSubmit={search}>
      <label className="search"><Search size={18} aria-hidden="true"/><input value={query} onChange={e=>setQuery(e.target.value)} maxLength={300} placeholder={t('naslag.searchPlaceholder')} aria-label={t('naslag.searchLabel')}/></label>
      <button type="submit" disabled={!query.trim()}>{t('naslag.searchButton')}</button>
    </form>
    {error&&<StatusState kind="error" title={t('status.errorTitle')}>{error}</StatusState>}
    {result&&<div className="naslag-hits" aria-live="polite">{result.hits.length?result.hits.map(hit=><Hit key={hit.id} hit={hit} onNavigate={onNavigate}/>):<StatusState kind="empty" title={t('naslag.noHits')}/>}</div>}
    <RemoteStatus remote={remote} loading={t('naslag.loading')}/>
    {remote.status==='ready'&&!days.some(d=>d.released)&&<StatusState kind="empty" title={t('naslag.noneReleased')}/>}
    <nav className="naslag-days" aria-label={t('naslag.daysLabel')}>
      {days.map(d=>d.released
        ?<button type="button" key={d.day} aria-pressed={selected===d.day} className={selected===d.day?'selected':''} onClick={()=>setSelected(selected===d.day?null:d.day)}><span className="day-number">0{d.day}</span><span><small>{t('route.supportDay',{day:d.day})}{room.day===d.day?` · ${t('naslag.live')}`:''}</small><strong>{d.title}</strong></span></button>
        :<button type="button" key={d.day} disabled className="locked"><span className="day-number">0{d.day}</span><span><small><Lock size={12} aria-hidden="true"/> {t('naslag.locked')}</small><strong>{d.title}</strong></span></button>)}
    </nav>
    <p className="naslag-links"><a href="/reference" target="_blank" rel="noopener noreferrer"><BookText size={15} aria-hidden="true"/>{t('naslag.deckReference')}<ExternalLink size={12} aria-hidden="true"/></a><a href="/reference/glossary" target="_blank" rel="noopener noreferrer">{t('naslag.glossary')}<ExternalLink size={12} aria-hidden="true"/></a></p>
    {open&&<div className="naslag-day">
      <p className="naslag-links"><a href={`/reference/day/${open.day}`} target="_blank" rel="noopener noreferrer">{t('naslag.dayDeck',{day:open.day})}<ExternalLink size={12} aria-hidden="true"/></a></p>
      <Lesson key={open.day} room={room} action={action} busy={busy} day={open.day}/>
    </div>}
  </section>;
}
