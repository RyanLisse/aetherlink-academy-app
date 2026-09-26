import {hash} from './store.mjs';

// Picked from https://openrouter.ai/api/v1/models on 2026-09-26: a current :free model with solid
// Dutch. Any other ':free' id works through ACADEMY_COACH_MODEL.
export const COACH_DEFAULT_MODEL='google/gemma-4-31b-it:free';
const OPENROUTER_URL='https://openrouter.ai/api/v1/chat/completions';
const MAX_ANSWER_CHARS=1500;
// Counter rows carry the Amsterdam date in their key; they only need to outlive that date.
export const COACH_RETENTION_MS=36*60*60*1000;

const positiveInt=(raw,fallback,name)=>{
 if(raw===undefined||raw==='')return fallback;
 const value=Number(raw);
 if(!Number.isInteger(value)||value<1)throw Error(`${name} moet een positief geheel getal zijn.`);
 return value;
};

// No key means no coach: the FAQ keeps answering exactly as before.
export function readCoachConfig(env=process.env){
 const apiKey=String(env.OPENROUTER_API_KEY||'').trim();
 if(!apiKey)return null;
 const model=String(env.ACADEMY_COACH_MODEL||COACH_DEFAULT_MODEL).trim();
 if(!model.endsWith(':free'))throw Error(`ACADEMY_COACH_MODEL moet een gratis OpenRouter-model zijn (id eindigt op ':free'); kreeg '${model}'.`);
 return {
  apiKey,model,
  url:String(env.OPENROUTER_BASE_URL||'').trim()||OPENROUTER_URL,
  participantCap:positiveInt(env.ACADEMY_COACH_DAILY_CAP,40,'ACADEMY_COACH_DAILY_CAP'),
  platformCap:positiveInt(env.ACADEMY_COACH_PLATFORM_DAILY_CAP,50,'ACADEMY_COACH_PLATFORM_DAILY_CAP'),
  timeoutMs:positiveInt(env.ACADEMY_COACH_TIMEOUT_MS,15000,'ACADEMY_COACH_TIMEOUT_MS')
 };
}

export const amsterdamDate=now=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);

export function coachQuotaKeys({config,personKey,now}){
 const date=amsterdamDate(now);
 return [[`coach:p:${hash(personKey)}:${date}`,config.participantCap],[`coach:platform:${date}`,config.platformCap]];
}

const escapeRegExp=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
// The model sees lesson passages and the question only. Anything in the question that names a
// person or opens a room is replaced before it leaves the server.
export function redactQuestion(question,{names=[],codes=[]}={}){
 let out=question.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g,'[e-mail]').replace(/\b[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}\b/gi,'[code]');
 for(const code of codes.filter(Boolean))out=out.replace(new RegExp(escapeRegExp(code),'gi'),'[code]');
 const parts=names.filter(Boolean).flatMap(name=>[name.trim(),...name.trim().split(/\s+/).filter(part=>part.length>=3)]);
 for(const name of [...new Set(parts)].filter(n=>n.length>=2).sort((a,b)=>b.length-a.length))out=out.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(name.trim())}(?![\\p{L}\\p{N}])`,'giu'),'[naam]');
 return out;
}

const INSTRUCTIONS={
 nl:'Je bent de Leercoach van AetherLink Academy. Beantwoord de vraag van de deelnemer uitsluitend met de passages hieronder. Noem bij elke bewering de id van de passage waar die vandaan komt. Geef uitleg en hints, geen kant-en-klare oplossing van de opdracht. Geen links of URL\'s, geen code uitvoeren, geen acties. Staat het antwoord niet in de passages of gaat de vraag niet over de lesstof, zet dan outOfScope op true. Antwoord in het Nederlands, in maximaal vijf zinnen.',
 en:'You are the AetherLink Academy learning coach. Answer the participant\'s question using only the passages below. For every claim, name the id of the passage it comes from. Explain and give hints, not a finished solution to the assignment. No links or URLs, no code execution, no actions. If the passages do not contain the answer or the question is not about the course material, set outOfScope to true. Answer in English, in at most five sentences.'
};
const FORMAT='Reply with JSON only, no other text: {"answer": string, "citations": [passage id, ...], "outOfScope": boolean}';

export function coachRequestBody({config,question,passages,locale}){
 const lang=locale==='en'?'en':'nl';
 const context=passages.map(p=>`[${p.id}] ${p.title}\n${p.answer}`).join('\n\n');
 return {
  model:config.model,
  messages:[{role:'system',content:`${INSTRUCTIONS[lang]}\n${FORMAT}`},{role:'user',content:`Passages:\n\n${context}\n\n${lang==='en'?'Question':'Vraag'}: ${question}`}],
  temperature:0.2,
  max_tokens:600,
  provider:{data_collection:'deny'}
 };
}

const cleanAnswer=text=>text
 .replace(/\[([^\]]*)\]\([^)]*\)/g,'$1')
 .replace(/\b(?:https?:\/\/|www\.)\S+/gi,'')
 .replace(/\[[\w.:-]+\]/g,'')
 .replace(/[ \t]{2,}/g,' ')
 .trim();

// Citations must name a passage we sent; everything else is dropped. No valid citation, no answer.
export function parseCoachReply(content,passages){
 const raw=String(content||''),start=raw.indexOf('{'),end=raw.lastIndexOf('}');
 if(start<0||end<start)return {status:'fallback',reason:'invalid'};
 let reply;
 try{reply=JSON.parse(raw.slice(start,end+1));}catch{return {status:'fallback',reason:'invalid'};}
 if(reply?.outOfScope===true)return {status:'out-of-scope'};
 const byId=new Map(passages.map(p=>[p.id,p]));
 const cited=[...new Set(Array.isArray(reply?.citations)?reply.citations.filter(id=>typeof id==='string'&&byId.has(id)):[])];
 const answer=typeof reply?.answer==='string'?cleanAnswer(reply.answer).slice(0,MAX_ANSWER_CHARS):'';
 if(!answer||!cited.length)return {status:'fallback',reason:'no-citation'};
 return {status:'answered',answer,citations:cited.map(id=>byId.get(id))};
}

async function callModel({config,fetchImpl,body}){
 let response;
 try{
  response=await fetchImpl(config.url,{method:'POST',headers:{authorization:`Bearer ${config.apiKey}`,'content-type':'application/json','x-title':'AetherLink Academy'},body:JSON.stringify(body),signal:AbortSignal.timeout(config.timeoutMs)});
 }catch(error){
  return {status:'fallback',reason:error?.name==='TimeoutError'||error?.name==='AbortError'?'timeout':'unavailable'};
 }
 if(response.status===429)return {status:'fallback',reason:'rate-limited'};
 if(!response.ok)return {status:'fallback',reason:'unavailable'};
 try{return {status:'ok',content:(await response.json())?.choices?.[0]?.message?.content};}
 catch(error){return {status:'fallback',reason:error?.name==='TimeoutError'||error?.name==='AbortError'?'timeout':'invalid'};}
}

const usage=(config,counts)=>({limit:config.participantCap,remaining:Math.max(0,config.participantCap-counts[0])});

export async function coachStatus({config,store,personKey,now=store.now()}){
 const {counts}=await store.coachQuota(coachQuotaKeys({config,personKey,now}));
 return {enabled:true,...usage(config,counts)};
}

// The FAQ answer is always computed first and is what the participant gets whenever the coach
// does not produce a cited answer. Only questions the FAQ would hand off, with passages to
// ground on, reach the model: literal lookups stay free and deterministic, and a question with
// nothing in the released material is out of scope without asking the model.
export async function coachAnswer({faq,config,store,fetchImpl,personKey,redact,locale,now=store.now()}){
 const keys=coachQuotaKeys({config,personKey,now});
 if(faq.mode!=='handoff'||!faq.hits.length){
  const {counts}=await store.coachQuota(keys);
  return {...faq,coach:{status:faq.hits.length?'skipped':'out-of-scope',...usage(config,counts)}};
 }
 const {allowed,counts}=await store.coachQuota(keys,{consume:true});
 if(!allowed)return {...faq,coach:{status:counts[0]>=config.participantCap?'capped':'platform-capped',...usage(config,counts)}};
 const passages=faq.hits.map(({id,title,answer})=>({id,title,answer}));
 const called=await callModel({config,fetchImpl,body:coachRequestBody({config,question:redact(faq.query),passages,locale})});
 const reply=called.status==='ok'?parseCoachReply(called.content,faq.hits):called;
 const coach={...reply,...usage(config,counts)};
 if(reply.status!=='answered')return {...faq,coach};
 return {...faq,coach:{...coach,citations:reply.citations,model:config.model}};
}
