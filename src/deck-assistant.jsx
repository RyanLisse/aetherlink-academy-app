import React,{useEffect,useState} from 'react';
import {Send,Sparkles,Wand2} from 'lucide-react';
import {api} from './api';
import {useI18n,useT} from './i18n';
import {Conversation,ConversationContent,ConversationEmptyState,ConversationScrollButton} from '@/components/ai-elements/conversation';
import {Message,MessageContent} from '@/components/ai-elements/message';
import {PromptInput,PromptInputFooter,PromptInputSubmit,PromptInputTextarea,PromptInputTools} from '@/components/ai-elements/prompt-input';
import {Alert,AlertDescription} from '@/components/ui/alert';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';

const MAX_TURNS=6;
const SUGGESTIONS={
 create:['deckAssistant.suggestCreate','deckAssistant.suggestWorkshop'],
 edit:['deckAssistant.suggestQuiz','deckAssistant.suggestExercise','deckAssistant.suggestPause','deckAssistant.suggestTighten'],
};

function changeSummary(t,changes){
 if(!changes)return t('deckAssistant.noChanges');
 const parts=[];
 if(changes.created)parts.push(t('deckAssistant.created'));
 if(changes.added.length)parts.push(t('deckAssistant.added',{count:changes.added.length}));
 if(changes.updated.length)parts.push(t('deckAssistant.updated',{count:changes.updated.length}));
 if(changes.deleted.length)parts.push(t('deckAssistant.deleted',{count:changes.deleted.length}));
 if(changes.renamed)parts.push(t('deckAssistant.renamed'));
 return parts.join(' · ')||t('deckAssistant.noChanges');
}

/** Facilitator in-app chat that creates and edits classroom slides through the deck actions. */
export function DeckAssistant({deckId=null,slideId=null,onApplied}){
 const t=useT();
 const {locale}=useI18n();
 const [status,setStatus]=useState(null);
 const [query,setQuery]=useState('');
 const [turns,setTurns]=useState([]);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 useEffect(()=>{let live=true;api('decks/assistant').then(next=>{if(live)setStatus(next);}).catch(()=>{if(live)setStatus({enabled:false});});return()=>{live=false;};},[]);
 async function send(message,event){
  event?.preventDefault?.();
  const text=(message?.text??query).trim();
  if(!text||busy)return;
  setBusy(true);setError('');
  try{
   const result=await api('decks/assistant',{message:text,deckId,slideId,locale,history:turns.map(({message,reply})=>({message,reply}))});
   setTurns(list=>[...list.slice(1-MAX_TURNS),{message:text,reply:result.reply,changes:result.changes}]);
   setQuery('');
   if(result.assistant)setStatus(current=>({...current,...result.assistant}));
   onApplied?.(result);
  }catch(err){setError(err.message);}
  finally{setBusy(false);}
 }
 const idPrefix=deckId?'deck-assistant-edit':'deck-assistant-create';
 const enabled=status?.enabled===true;
 return <section className="panel deck-assistant academy-ui" aria-labelledby={`${idPrefix}-heading`} data-testid="deck-assistant">
  <div className="panel-heading"><h3 id={`${idPrefix}-heading`}><Wand2 size={16} aria-hidden="true"/> {t('deckAssistant.title')}</h3>{enabled&&<Badge variant="secondary">{t('deckAssistant.remaining',{remaining:status.remaining,limit:status.limit})}</Badge>}</div>
  <p className="muted deck-assistant-lede">{t(deckId?'deckAssistant.ledeEdit':'deckAssistant.ledeCreate')}</p>
  {status&&!enabled&&<p className="notice" role="status">{t('deckAssistant.disabled')}</p>}
  <Conversation className="chat-log deck-assistant-log" aria-live="polite" aria-label={t('deckAssistant.log')}>
   <ConversationContent className="chat-conversation">
    {turns.length===0&&<ConversationEmptyState className="chat-empty" icon={<Sparkles size={20} aria-hidden="true"/>} title={t('deckAssistant.emptyTitle')} description={t('deckAssistant.privacy')}/>}
    {turns.map((turn,i)=><div className="chat-turn" key={i}>
     <Message from="user"><MessageContent className="chat-question"><span className="sr-only">{t('chat.you')}</span>{turn.message}</MessageContent></Message>
     <Message from="assistant"><MessageContent className="chat-answer">{turn.reply&&<p>{turn.reply}</p>}<small className="muted" role="status">{changeSummary(t,turn.changes)}</small></MessageContent></Message>
    </div>)}
   </ConversationContent>
   <ConversationScrollButton aria-label={t('chat.scrollLatest')}/>
  </Conversation>
  {error&&<Alert role="alert" variant="destructive" className="chat-alert"><AlertDescription>{error}</AlertDescription></Alert>}
  {enabled&&<div className="chat-links deck-assistant-suggestions">{SUGGESTIONS[deckId?'edit':'create'].map(key=><Button key={key} type="button" variant="outline" size="sm" disabled={busy} onClick={()=>setQuery(t(key))}>{t(key)}</Button>)}</div>}
  <Label htmlFor={`${idPrefix}-input`} className="chat-input-label">{t(deckId?'deckAssistant.labelEdit':'deckAssistant.labelCreate')}</Label>
  <PromptInput className="chat-form" onSubmit={send}>
   <PromptInputTextarea id={`${idPrefix}-input`} name="message" value={query} onChange={e=>setQuery(e.target.value)} maxLength={2000} disabled={!enabled} placeholder={t(deckId?'deckAssistant.placeholderEdit':'deckAssistant.placeholderCreate')} autoComplete="off"/>
   <PromptInputFooter className="chat-form-footer">
    <PromptInputTools>{busy&&<span className="muted" role="status">{t('deckAssistant.working')}</span>}</PromptInputTools>
    <PromptInputSubmit aria-label={t('chat.send')} disabled={!enabled||busy||!query.trim()} status={busy?'submitted':undefined}>{busy?undefined:<Send size={16} aria-hidden="true"/>}</PromptInputSubmit>
   </PromptInputFooter>
  </PromptInput>
 </section>;
}
