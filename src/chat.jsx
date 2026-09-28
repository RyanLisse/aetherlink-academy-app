import React,{useEffect,useState} from 'react';
import {MessageCircle,Send,ExternalLink,Sparkles,Copy,Bot} from 'lucide-react';
import {api} from './api';
import {useT,useI18n} from './i18n';
// AET-120: the conversational shell (log, bubbles, composer) is AI Elements; the FAQ result
// cards below stay Academy-owned because they render day-pack content, not chat chrome.
import {Conversation,ConversationContent,ConversationEmptyState,ConversationScrollButton} from '@/components/ai-elements/conversation';
import {Message,MessageContent} from '@/components/ai-elements/message';
import {PromptInput,PromptInputFooter,PromptInputSubmit,PromptInputTextarea,PromptInputTools} from '@/components/ai-elements/prompt-input';
import {Alert,AlertDescription} from '@/components/ui/alert';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';

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

function Handoff({handoff,onNavigate,brief=false}){
 const t=useT();
 const [copied,setCopied]=useState(false);
 async function copy(){try{await navigator.clipboard.writeText(handoff.prompt);setCopied(true);}catch{setCopied(false);}}
 return <div className="chat-handoff"><strong><Sparkles size={14} aria-hidden="true"/> {handoff.title}</strong>{handoff.text&&!brief&&<p>{handoff.text}</p>}<p className="muted">{t('chat.promptLabel')}</p><blockquote>{handoff.prompt}</blockquote><div className="chat-links"><Button type="button" variant="outline" size="sm" className="chat-action" onClick={copy}><Copy size={12} aria-hidden="true"/>{copied?t('chat.copied'):t('chat.copyPrompt')}</Button><Button type="button" variant="ghost" size="sm" className="chat-action" onClick={()=>onNavigate(handoff.link.view)}>{handoff.link.label}</Button></div></div>;
}

// Citations come from the server's own retrieved passages, so every link is one the FAQ already serves.
function Citation({hit,onNavigate}){
 if(hit.source.href)return <a className="chat-link" href={hit.source.href} target="_blank" rel="noopener noreferrer">{hit.title}<ExternalLink size={12} aria-hidden="true"/></a>;
 return <button type="button" className="chat-link" onClick={()=>onNavigate('naslag')}>{hit.title}</button>;
}

function CoachAnswer({coach,onNavigate}){
 const t=useT();
 return <div className="chat-coach"><strong><Bot size={14} aria-hidden="true"/> {t('chat.coachLabel')}</strong><p>{coach.answer}</p><small className="muted">{t('chat.coachSources')}</small><div className="chat-links">{coach.citations.map(hit=><Citation key={hit.id} hit={hit} onNavigate={onNavigate}/>)}</div></div>;
}

const COACH_NOTICE={capped:'chat.coachCapped','platform-capped':'chat.coachPlatformCapped','out-of-scope':'chat.coachOutOfScope'};
const coachNotice=coach=>coach&&(COACH_NOTICE[coach.status]||(coach.status==='fallback'&&(coach.reason==='timeout'?'chat.coachTimeout':'chat.coachFallback')));

function Turn({turn,onNavigate}){
 const t=useT();
 const answered=turn.coach?.status==='answered',notice=coachNotice(turn.coach);
 return <div className="chat-turn">
  <Message from="user">
   <MessageContent className="chat-question"><span className="sr-only">{t('chat.you')}</span>{turn.query}</MessageContent>
  </Message>
  <Message from="assistant">
   <MessageContent className="chat-answer">
    {answered&&<CoachAnswer coach={turn.coach} onNavigate={onNavigate}/>}
    {notice&&<p className="chat-notice" role="status">{t(notice,{limit:turn.coach.limit})}</p>}
    {!answered&&turn.hits[0]&&<Hit hit={turn.hits[0]} onNavigate={onNavigate}/>}
    {!answered&&turn.hits.length>1&&<details className="chat-more"><summary>{t('chat.more',{count:turn.hits.length-1})}</summary>{turn.hits.slice(1).map(hit=><Hit key={hit.id} hit={hit} onNavigate={onNavigate}/>)}</details>}
    {turn.handoff&&<Handoff handoff={turn.handoff} onNavigate={onNavigate} brief={answered}/>}
   </MessageContent>
  </Message>
 </div>;
}

export function Chat({room,onNavigate}){
 const t=useT();
 const {locale}=useI18n();
 const [query,setQuery]=useState('');
 const [turns,setTurns]=useState([]);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [coach,setCoach]=useState(null);
 useEffect(()=>{setTurns([]);},[room.day]);
 useEffect(()=>{let live=true;api('chat/coach').then(status=>{if(live)setCoach(status.enabled?status:null);}).catch(()=>{});return()=>{live=false;};},[]);
 // AI Elements' Conversation keeps the log pinned to the newest turn, so no manual scroll effect.
 async function ask(message,event){
  event?.preventDefault?.();
  const q=(message?.text??query).trim();
  if(!q||busy)return;
  setBusy(true);setError('');
  try{const result=await api('chat',{q,locale});setTurns(list=>[...list.slice(1-MAX_TURNS),result]);if(result.coach)setCoach(result.coach);setQuery('');}
  catch(err){setError(err.message);}
  finally{setBusy(false);}
 }
 const participantsOff=room.me.role==='Facilitator'&&!room.chat;
 return <section className="panel chat academy-ui" aria-labelledby="chat-heading">
  <div className="panel-heading"><h2 id="chat-heading">{t('chat.title')}</h2><MessageCircle size={17} aria-hidden="true"/></div>
  <p className="muted chat-lede">{t(coach?'chat.ledeCoach':'chat.lede')}</p>
  {participantsOff&&<p className="chat-off">{t('chat.offForParticipants')}</p>}
  <Conversation className="chat-log" aria-live="polite" aria-label={t('chat.log')}>
   <ConversationContent className="chat-conversation">
    {turns.length===0&&<ConversationEmptyState className="chat-empty" icon={<MessageCircle size={20} aria-hidden="true"/>} title={t('chat.emptyTitle')} description={t('chat.emptyBody')}/>}
    {turns.map((turn,i)=><Turn key={i} turn={turn} onNavigate={onNavigate}/>)}
   </ConversationContent>
   <ConversationScrollButton aria-label={t('chat.scrollLatest')}/>
  </Conversation>
  {error&&<Alert role="alert" variant="destructive" className="chat-alert"><AlertDescription>{error}</AlertDescription></Alert>}
  <Label htmlFor="chat-input" className="chat-input-label">{t('chat.label')}</Label>
  <PromptInput className="chat-form" onSubmit={ask}>
   <PromptInputTextarea id="chat-input" name="message" value={query} onChange={e=>setQuery(e.target.value)} maxLength={300} placeholder={t('chat.placeholder')} autoComplete="off"/>
   <PromptInputFooter className="chat-form-footer">
    <PromptInputTools>{coach&&<Badge variant="secondary" className="chat-quota-badge">{t('chat.coachRemaining',{remaining:coach.remaining,limit:coach.limit})}</Badge>}</PromptInputTools>
    <PromptInputSubmit aria-label={t('chat.send')} disabled={busy||!query.trim()} status={busy?'submitted':undefined}>{busy?undefined:<Send size={16} aria-hidden="true"/>}</PromptInputSubmit>
   </PromptInputFooter>
  </PromptInput>
 </section>;
}
