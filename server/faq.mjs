import {localizedLessons,getDayPack} from './content.mjs';
import {DAY_PACKS} from '../content/days/index.mjs';
import {NAVIGATION,CHAT_COPY} from '../content/faq/navigation.mjs';
import {releasedDays} from './release.mjs';
import {normalizeContentLocale,projectPackLocale} from '../content/days/locale.mjs';

const STOPWORDS=new Set('de het een en of in op aan van voor met bij naar om te tot uit als dat die dit deze is zijn wordt word ben bent was er ik je jij jou jouw mijn me mij we wij ons onze u uw hij zij ze hoe wat wie welke wanneer moet moeten kan kun kunnen mag mogen wil zal niet geen wel ook nog dan maar dus zo hier daar the a an and or of in on at to for with by from is are be do does can how what which who when my me i you your it this that there'.split(' '));
const NAVIGATION_CUES=new Set(['waar','vind','vinden','staat','staan','where','find','locate']);
const CONCEPT_CUES=new Set(['waarom','uitleg','uitleggen','leg','verschil','betekent','betekenis','werkt','why','explain','difference','means','meaning','works']);
const MAX_HITS=3;
const FIELD_WEIGHT={title:3,keywords:3,body:1};

export const tokens=text=>String(text||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().split(/[^a-z0-9]+/).filter(t=>t.length>1);
const contentTerms=list=>list.filter(t=>!STOPWORDS.has(t));

// Only the participant-facing fields of a released pack become documents:
// the quiz (and its key) and the facilitator demo script are never indexed.
const DOC_COPY={
 en:{slide:'Slide',goal:day=>`Learning goal day ${day}`,mission:'Assignment',allowed:'What is and is not allowed · stop rule',hints:'Assignment hints',starters:'Starter files',step:'Step',doneWhen:'Done when',tip:'Tip',demoAnswer:n=>`The facilitator shows this on slide ${n}.`,proof:'What counts as evidence · review criteria',openAnswer:'OPEN: this is not settled in the lesson plan yet. Ask your facilitator.',deepHelp:'Deeper help through your own Claude',tryIt:'Try',reference:'Reference'},
 nl:{slide:'Dia',goal:day=>`Leerdoel dag ${day}`,mission:'Opdracht',allowed:'Wat mag wel en wat niet · stopregel',hints:'Hints bij de opdracht',starters:'Starterbestanden',step:'Stap',doneWhen:'Klaar als',tip:'Tip',demoAnswer:n=>`De facilitator laat dit zien op dia ${n}.`,proof:'Wat telt als bewijs · reviewcriteria',openAnswer:'OPEN: dit staat nog niet vast in het lesplan. Vraag je facilitator.',deepHelp:'Diepere hulp via je eigen Claude',tryIt:'Probeer',reference:'Naslag'}
};

function packDocs(basePack,locale){
 const pack=projectPackLocale(basePack,locale),c=DOC_COPY[locale];
 // Soft-live F1: every day-pack hit carries an explicit `day` so the UI can cite source + day.
 const day=pack.day,source={label:pack.title,href:pack.deck.route};
 const slideLink=s=>({label:`${c.slide} ${s.slide} · ${s.title}`,href:s.href});
 const starters=pack.materials.filter(m=>m.kind==='starter');
 return [
  {id:`d${day}:goal`,kind:'goal',day,title:`${c.goal(day)} · ${pack.title}`,answer:pack.leerdoel,links:[{label:pack.materials[0].label,href:pack.deck.route}],source},
  {id:`d${day}:mission`,kind:'mission',day,title:`${c.mission} · ${pack.mission.title}`,answer:`${pack.mission.goal} (${pack.mission.minutes} min)`,links:[{view:'solo'}],source},
  {id:`d${day}:allowed`,kind:'mission',day,title:c.allowed,answer:[...pack.mission.allowed,pack.mission.stop].join(' '),links:[{view:'solo'}],source},
  ...(pack.mission.hints?.length?[{id:`d${day}:hints`,kind:'mission',day,title:c.hints,answer:pack.mission.hints.join(' '),links:[{view:'solo'}],source}]:[]),
  ...(pack.mission.stretch?[{id:`d${day}:stretch`,kind:'mission',day,title:'Stretch',answer:pack.mission.stretch,links:[{view:'solo'}],source}]:[]),
  ...(pack.mission.starterFiles?.length?[{id:`d${day}:starters`,kind:'material',day,title:c.starters,answer:pack.mission.starterFiles.join(', '),links:starters.length?starters.map(m=>({label:m.label,href:m.href})):[{view:'solo'}],source}]:[]),
  ...pack.steps.map(s=>({id:`d${day}:step:${s.id}`,kind:'step',day,title:`${c.step} ${s.badge} · ${s.title}`,answer:[s.goal,`${c.doneWhen}: ${s.doneWhen}`,s.hint&&`${c.tip}: ${s.hint}`].filter(Boolean).join(' '),links:[{view:'solo'},...(s.slide?[slideLink(s.slide)]:[])],source:s.slide?{label:`${pack.title} · ${c.slide.toLowerCase()} ${s.slide.slide}`,href:s.slide.href}:source})),
  ...(pack.demo?.slides||[]).map((s,i)=>({id:`d${day}:demo:${i+1}`,kind:'demo',day,title:`Demo · ${s.title}`,answer:c.demoAnswer(s.slide),links:[slideLink(s)],source:{label:`${pack.title} · ${c.slide.toLowerCase()} ${s.slide}`,href:s.href}})),
  ...pack.materials.filter(m=>m.kind!=='starter').map((m,i)=>({id:`d${day}:material:${i+1}`,kind:'material',day,title:m.label,answer:m.href?(m.note||m.label):`OPEN: ${m.open}`,links:m.href?[{label:m.label,href:m.href}]:[],source,...(m.href?{}:{open:true})})),
  {id:`d${day}:proof`,kind:'proof',day,title:c.proof,answer:pack.reviewCriteria.join(' '),links:[{view:'review'}],source},
  ...pack.openItems.map((item,i)=>({id:`d${day}:open:${i+1}`,kind:'open',day,title:item,answer:c.openAnswer,links:[],source,open:true})),
  {id:`d${day}:deep-help`,kind:'help',day,title:c.deepHelp,answer:pack.deepHelp,links:[{view:'coach'}],source}
 ];
}

const knowledgeDocs=locale=>localizedLessons(locale).map(l=>({id:`lesson:${l.id}`,kind:'lesson',title:l.title,answer:`${l.body} ${DOC_COPY[locale].tryIt}: ${l.exercise}`,links:[{view:'coach'}],source:{label:`${DOC_COPY[locale].reference} ${l.id}`,view:'coach'}}));

const navigationDocs=locale=>NAVIGATION.map(n=>({id:`nav:${n.view||'help'}`,kind:'nav',title:n.title[locale],answer:n.answer[locale],keywords:n.keywords,links:n.view?[{view:n.view}]:[],source:{label:'Academy',view:n.view}}));

const index=doc=>({doc,fields:{title:tokens(doc.title),keywords:doc.keywords||[],body:tokens(doc.answer)}});
const general={nl:[...navigationDocs('nl'),...knowledgeDocs('nl')].map(index),en:[...navigationDocs('en'),...knowledgeDocs('en')].map(index)};
const byDay={nl:new Map(DAY_PACKS.map(pack=>[pack.day,packDocs(pack,'nl').map(index)])),en:new Map(DAY_PACKS.map(pack=>[pack.day,packDocs(pack,'en').map(index)]))};

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
export function rankDocuments(query,{day,days,locale='en'}={}){
 locale=normalizeContentLocale(locale);
 const words=tokens(query);
 const navigation=words.some(w=>NAVIGATION_CUES.has(w));
 const conceptual=words.some(w=>CONCEPT_CUES.has(w));
 const terms=[...new Set(contentTerms(words).filter(w=>!NAVIGATION_CUES.has(w)&&!CONCEPT_CUES.has(w)))];
 if(!terms.length)return {terms,conceptual,hits:[]};
 const earlier=days.filter(d=>d!==day).reverse();
 const corpus=[...(days.includes(day)?byDay[locale].get(day)||[]:[]),...general[locale],...earlier.flatMap(d=>byDay[locale].get(d)||[])];
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
export function answerQuestion({day,released=releasedDays({day}),query,locale='en'}){
 const pack=getDayPack(day);
 const lang=normalizeContentLocale(locale);
 const {conceptual,hits}=rankDocuments(query,{day,days:released,locale:lang});
 const mode=hits.length&&!conceptual?'answer':'handoff';
 return {day,query,mode,hits,handoff:mode==='handoff'?{title:CHAT_COPY.handoffTitle[lang],text:pack?projectPackLocale(pack,lang).deepHelp??null:null,prompt:CHAT_COPY.handoffPrompt[lang](query),link:{view:'coach',label:CHAT_COPY.coachLabel[lang]}}:null};
}
