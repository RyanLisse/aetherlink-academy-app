// Live check of the Leercoach against OpenRouter with the real key and model from the environment.
// Usage: OPENROUTER_API_KEY=... [ACADEMY_COACH_MODEL=...:free] node --import ./vendor/proof-sdk/node_modules/tsx/dist/loader.mjs scripts/coach-smoke.mjs ["vraag"] [dag]
// Spends one request of the free-tier daily budget. Exit 0 only for a cited answer.
import {readCoachConfig,coachRequestBody,parseCoachReply} from '../server/coach.mjs';
import {answerQuestion} from '../server/faq.mjs';

const config=readCoachConfig(process.env);
if(!config){console.error('OPENROUTER_API_KEY is not set; nothing to check.');process.exit(2);}
const query=process.argv[2]||'Waarom is L1 zonder LLM?';
const day=Number(process.argv[3]||3);
const faq=answerQuestion({day,released:Array.from({length:day},(_,i)=>i+1),query});
if(!faq.hits.length){console.error(`The FAQ finds no passages for "${query}" on day ${day}; pick a question from the material.`);process.exit(2);}
const body=coachRequestBody({config,question:query,passages:faq.hits.map(({id,title,answer})=>({id,title,answer})),locale:'nl'});
console.log(`model ${config.model}, passages ${faq.hits.map(hit=>hit.id).join(', ')}`);
const started=Date.now();
const response=await fetch(config.url,{method:'POST',headers:{authorization:`Bearer ${config.apiKey}`,'content-type':'application/json','x-title':'AetherLink Academy'},body:JSON.stringify(body),signal:AbortSignal.timeout(config.timeoutMs)});
const raw=await response.text();
console.log(`HTTP ${response.status} in ${Date.now()-started} ms`);
if(!response.ok){
 // A 404 "No endpoints found matching your data policy" means this :free model has no provider
 // that honours data_collection=deny; choose another ACADEMY_COACH_MODEL.
 console.error(raw.slice(0,600));process.exit(1);
}
const content=JSON.parse(raw)?.choices?.[0]?.message?.content;
console.log('raw reply:',String(content).slice(0,800));
const reply=parseCoachReply(content,faq.hits);
console.log('parsed:',JSON.stringify({...reply,citations:reply.citations?.map(hit=>hit.id)},null,1));
process.exit(reply.status==='answered'?0:1);
