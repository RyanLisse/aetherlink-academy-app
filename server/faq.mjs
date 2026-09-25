import {lessons,getDayPack} from './content.mjs';
import {DAY_PACKS} from '../content/days/index.mjs';
import {NAVIGATION,CHAT_COPY} from '../content/faq/navigation.mjs';
import {releasedDays} from './release.mjs';

const STOPWORDS=new Set('de het een en of in op aan van voor met bij naar om te tot uit als dat die dit deze is zijn wordt word ben bent was er ik je jij jou jouw mijn me mij we wij ons onze u uw hij zij ze hoe wat wie welke wanneer moet moeten kan kun kunnen mag mogen wil zal niet geen wel ook nog dan maar dus zo hier daar the a an and or of in on at to for with by from is are be do does can how what which who when my me i you your it this that there'.split(' '));
const NAVIGATION_CUES=new Set(['waar','vind','vinden','staat','staan','where','find','locate']);
const CONCEPT_CUES=new Set(['waarom','uitleg','uitleggen','leg','verschil','betekent','betekenis','werkt','why','explain','difference','means','meaning','works']);
const MAX_HITS=3;
const FIELD_WEIGHT={title:3,keywords:3,body:1};

export const tokens=text=>String(text||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().split(/[^a-z0-9]+/).filter(t=>t.length>1);
const contentTerms=list=>list.filter(t=>!STOPWORDS.has(t));

// Only the participant-facing fields of a released pack become documents:
// the quiz (and its key) and the facilitator demo script are never indexed.
function packDocs(pack){
 const day=pack.day,source={label:pack.title,href:pack.deck.route};
 const slideLink=s=>({label:`Dia ${s.slide} · ${s.title}`,href:s.href});
 const starters=pack.materials.filter(m=>m.kind==='starter');
 return [
  {id:`d${day}:goal`,kind:'goal',title:`Leerdoel dag ${day} · ${pack.title}`,answer:pack.leerdoel,links:[{label:pack.materials[0].label,href:pack.deck.route}],source},
  {id:`d${day}:mission`,kind:'mission',title:`Opdracht · ${pack.mission.title}`,answer:`${pack.mission.goal} (${pack.mission.minutes} min)`,links:[{view:'solo'}],source},
  {id:`d${day}:allowed`,kind:'mission',title:'Wat mag wel en wat niet · stopregel',answer:[...pack.mission.allowed,pack.mission.stop].join(' '),links:[{view:'solo'}],source},
  ...(pack.mission.hints?.length?[{id:`d${day}:hints`,kind:'mission',title:'Hints bij de opdracht',answer:pack.mission.hints.join(' '),links:[{view:'solo'}],source}]:[]),
  ...(pack.mission.stretch?[{id:`d${day}:stretch`,kind:'mission',title:'Stretch',answer:pack.mission.stretch,links:[{view:'solo'}],source}]:[]),
  ...(pack.mission.starterFiles?.length?[{id:`d${day}:starters`,kind:'material',title:'Starterbestanden',answer:pack.mission.starterFiles.join(', '),links:starters.length?starters.map(m=>({label:m.label,href:m.href})):[{view:'solo'}],source}]:[]),
  ...pack.steps.map(s=>({id:`d${day}:step:${s.id}`,kind:'step',title:`Stap ${s.badge} · ${s.title}`,answer:[s.goal,`Klaar als: ${s.doneWhen}`,s.hint&&`Tip: ${s.hint}`].filter(Boolean).join(' '),links:[{view:'solo'},slideLink(s.slide)],source:{label:`${pack.title} · dia ${s.slide.slide}`,href:s.slide.href}})),
  ...pack.demo.slides.map((s,i)=>({id:`d${day}:demo:${i+1}`,kind:'demo',title:`Demo · ${s.title}`,answer:`De facilitator laat dit zien op dia ${s.slide}.`,links:[slideLink(s)],source:{label:`${pack.title} · dia ${s.slide}`,href:s.href}})),
  ...pack.materials.filter(m=>m.kind!=='starter').map((m,i)=>({id:`d${day}:material:${i+1}`,kind:'material',title:m.label,answer:m.href?(m.note||m.label):`OPEN: ${m.open}`,links:m.href?[{label:m.label,href:m.href}]:[],source,...(m.href?{}:{open:true})})),
  {id:`d${day}:proof`,kind:'proof',title:'Wat telt als bewijs · reviewcriteria',answer:pack.reviewCriteria.join(' '),links:[{view:'review'}],source},
  ...pack.openItems.map((item,i)=>({id:`d${day}:open:${i+1}`,kind:'open',title:item,answer:`OPEN: dit staat nog niet vast in het lesplan. Vraag je facilitator.`,links:[],source,open:true})),
  {id:`d${day}:deep-help`,kind:'help',title:'Diepere hulp via je eigen Claude',answer:pack.deepHelp,links:[{view:'coach'}],source}
 ];
}

const knowledgeDocs=lessons.map(l=>({id:`lesson:${l.id}`,kind:'lesson',title:l.title,answer:`${l.body} Probeer: ${l.exercise}`,links:[{view:'coach'}],source:{label:`Naslag ${l.id}`,view:'coach'}}));

const navigationDocs=locale=>NAVIGATION.map(n=>({id:`nav:${n.view||'help'}`,kind:'nav',title:n.title[locale],answer:n.answer[locale],keywords:n.keywords,links:n.view?[{view:n.view}]:[],source:{label:'Academy',view:n.view}}));

const index=doc=>({doc,fields:{title:tokens(doc.title),keywords:doc.keywords||[],body:tokens(doc.answer)}});
const general={nl:[...navigationDocs('nl'),...knowledgeDocs].map(index),en:[...navigationDocs('en'),...knowledgeDocs].map(index)};
const byDay=new Map(DAY_PACKS.map(pack=>[pack.day,packDocs(pack).map(index)]));

function termWeight(term,fields){
 let best=0;
 for(const [field,words] of Object.entries(fields))for(const word of words){
  const weight=word===term?FIELD_WEIGHT[field]:term.length>=4&&word.length>=4&&(word.startsWith(term)||term.startsWith(word))?FIELD_WEIGHT[field]/2:0;
  if(weight>best)best=weight;
 }
 return best;
}

// Ties go to the live day first, then platform navigation, then earlier released days (latest first),
// so opening up the archive does not push today's answers or the app's own help down.
export function rankDocuments(query,{day,days,locale='nl'}={}){
 const words=tokens(query);
 const navigation=words.some(w=>NAVIGATION_CUES.has(w));
 const conceptual=words.some(w=>CONCEPT_CUES.has(w));
 const terms=[...new Set(contentTerms(words).filter(w=>!NAVIGATION_CUES.has(w)&&!CONCEPT_CUES.has(w)))];
 if(!terms.length)return {terms,conceptual,hits:[]};
 const earlier=days.filter(d=>d!==day).reverse();
 const corpus=[...(days.includes(day)?byDay.get(day)||[]:[]),...general[locale],...earlier.flatMap(d=>byDay.get(d)||[])];
 const hits=corpus.map(({doc,fields},order)=>{
  const weights=terms.map(term=>termWeight(term,fields));
  const matched=weights.filter(Boolean).length;
  const score=weights.reduce((a,b)=>a+b,0)+(navigation&&doc.kind==='nav'&&matched?3:0);
  return {doc,score,order,coverage:matched/terms.length};
 }).filter(h=>h.score>0&&h.coverage>=0.5).sort((a,b)=>b.score-a.score||a.order-b.order);
 return {terms,conceptual,hits:hits.slice(0,MAX_HITS).map(({doc:{keywords,...doc},score})=>({...doc,score}))};
}

// Deterministic and local: no model, no network. The Postgres tsvector search
// in apps/server is the later upgrade once prod runs that server.
// `released` comes from server/release.mjs; a bare day stands for a room that is on that day.
export function answerQuestion({day,released=releasedDays({day}),query,locale='nl'}){
 const pack=getDayPack(day);
 const lang=locale==='en'?'en':'nl';
 const {conceptual,hits}=rankDocuments(query,{day,days:released,locale:lang});
 const mode=hits.length&&!conceptual?'answer':'handoff';
 return {day,query,mode,hits,handoff:mode==='handoff'?{title:CHAT_COPY.handoffTitle[lang],text:pack?.deepHelp??null,prompt:CHAT_COPY.handoffPrompt[lang](query),link:{view:'coach',label:CHAT_COPY.coachLabel[lang]}}:null};
}
