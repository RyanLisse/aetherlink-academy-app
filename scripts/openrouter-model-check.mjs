// Live, synthetic-only probe for the free OpenRouter models used by the Leercoach.
// This intentionally has no alternate-model list: every completion request names exactly one
// catalog-verified :free model and retains the production data_collection=deny policy.
import {pathToFileURL} from 'node:url';
import {coachRequestBody,parseCoachReply} from '../server/coach.mjs';

export const OPENROUTER_FREE_MODEL_IDS=Object.freeze([
 'thinkingmachines/inkling:free',
 'cohere/north-mini-code:free',
 'nvidia/nemotron-3-ultra-550b-a55b:free'
]);

const DEFAULT_API_BASE='https://openrouter.ai/api/v1';
const ZERO=/^\+?0+(?:\.0+)?(?:e[+-]?\d+)?$/i;

function isZeroPrice(value){
 if(typeof value==='number')return Number.isFinite(value)&&value===0;
 return typeof value==='string'&&ZERO.test(value.trim());
}

export function freeCatalogEntry(entry,modelId){
 if(!entry||entry.id!==modelId||!modelId.endsWith(':free'))return false;
 const pricing=entry.pricing;
 return Boolean(pricing&&typeof pricing==='object'&&Object.keys(pricing).length>=2&&
  isZeroPrice(pricing.prompt)&&isZeroPrice(pricing.completion)&&
  Object.values(pricing).every(isZeroPrice));
}

export function classifyOpenRouterFailure(status,error){
 const code=typeof error?.code==='string'?error.code.toLowerCase():'';
 const message=typeof error?.message==='string'?error.message.toLowerCase():'';
 if(status===429||code==='429'||code.includes('rate_limit')||code.includes('rate-limit'))return 'rate-limited';
 if(/data[_ -]?collection|data policy|privacy policy|provider policy|zero data retention|\bzdr\b|retention policy|no endpoints found matching/.test(`${code} ${message}`))return 'policy-unavailable';
 if(status===401||status===403||code.includes('auth'))return 'authentication-failed';
 if(status===404||/model (was )?not found|no endpoints found|model unavailable/.test(message))return 'unavailable';
 if(status>=500)return 'unavailable';
 return 'request-rejected';
}

function makeProbe({modelId,apiKey,allowDataCollection=false}){
 const config={apiKey,model:modelId};
 const body=coachRequestBody({
  config,
  locale:'en',
  passages:[{id:'synthetic-lesson-1',title:'Synthetic lesson',answer:'For this synthetic lesson only, the paper bridge supports exactly three coins.'}],
  question:'According to this synthetic lesson, how many coins does the paper bridge support?'
 });
 if(allowDataCollection)delete body.provider.data_collection;
 return body;
}

async function safeJson(response){
 try{return await response.json();}catch{return null;}
}

function errorResult(modelId,status,error){
 return {model:modelId,status:classifyOpenRouterFailure(status,error),httpStatus:status};
}

/**
 * Check catalog price gates before sending one synthetic request per model. The return value
 * contains no API key, prompt, model response, or raw upstream error text.
 */
export async function checkOpenRouterModels({
 apiKey,
 modelIds=OPENROUTER_FREE_MODEL_IDS,
 fetchImpl=fetch,
 apiBase=DEFAULT_API_BASE,
 timeoutMs=15000,
 allowDataCollection=false
}={}){
 if(!String(apiKey||'').trim())return {status:'missing-key',results:[]};
 const ids=[...new Set(modelIds)];
 if(!ids.length||ids.some(id=>typeof id!=='string'||!id.endsWith(':free')||!/^[a-z0-9._-]+\/[a-z0-9._-]+:free$/i.test(id)))
  return {status:'invalid-model-id',results:ids.map(model=>({model:String(model),status:'invalid-model-id'}))};

 const base=String(apiBase).replace(/\/+$/,'');
 let catalogResponse;
 try{
  catalogResponse=await fetchImpl(`${base}/models`,{method:'GET',signal:AbortSignal.timeout(timeoutMs)});
 }catch{return {status:'catalog-unavailable',results:ids.map(model=>({model,status:'catalog-unavailable'}))};}
 if(!catalogResponse.ok){
  const parsed=await safeJson(catalogResponse);
  const failure=classifyOpenRouterFailure(catalogResponse.status,parsed?.error);
  return {status:'catalog-unavailable',results:ids.map(model=>({model,status:'catalog-unavailable',catalogFailure:failure,httpStatus:catalogResponse.status}))};
 }
 const catalog=await safeJson(catalogResponse);
 if(!Array.isArray(catalog?.data))return {status:'catalog-unavailable',results:ids.map(model=>({model,status:'catalog-unavailable'}))};
 const results=[];
 for(const modelId of ids){
  const entry=catalog.data.find(model=>model?.id===modelId);
  if(!entry){results.push({model:modelId,status:'unavailable',catalog:'missing'});continue;}
  if(!freeCatalogEntry(entry,modelId)){
   results.push({model:modelId,status:'price-gate-failed',catalog:'not-zero-priced'});continue;
  }
  let response;
  try{
   response=await fetchImpl(`${base}/chat/completions`,{
    method:'POST',
    headers:{authorization:`Bearer ${apiKey}`,'content-type':'application/json','x-title':'AetherLink Academy free-model check'},
    body:JSON.stringify(makeProbe({modelId,apiKey,allowDataCollection})),
    signal:AbortSignal.timeout(timeoutMs)
   });
  }catch(error){
   results.push({model:modelId,status:error?.name==='TimeoutError'||error?.name==='AbortError'?'timeout':'unavailable'});
   continue;
  }
  const payload=await safeJson(response);
  if(!response.ok){results.push(errorResult(modelId,response.status,payload?.error));continue;}
  const routedModel=payload?.model;
  const catalogRouteIds=new Set([entry.id,entry.canonical_slug,entry.canonical_slug?`${entry.canonical_slug}:free`:null].filter(Boolean));
  if(typeof routedModel!=='string'||!catalogRouteIds.has(routedModel)){
   results.push({model:modelId,status:'non-free-route-rejected'});continue;
  }
  const reportedCost=payload?.usage?.cost;
  if(reportedCost!==undefined&&!isZeroPrice(typeof reportedCost==='number'?reportedCost:String(reportedCost))){
   results.push({model:modelId,status:'non-zero-cost-rejected'});continue;
  }
  const reply=parseCoachReply(payload?.choices?.[0]?.message?.content,[{id:'synthetic-lesson-1',title:'Synthetic lesson',answer:'For this synthetic lesson only, the paper bridge supports exactly three coins.'}]);
  if(reply.status!=='answered'){
   results.push({model:modelId,status:'invalid-model-reply'});continue;
  }
  results.push({model:modelId,status:'passed',httpStatus:response.status,routedModel:typeof routedModel==='string'?routedModel:undefined,catalog:'zero-priced'});
 }
 return {status:results.every(result=>result.status==='passed')?'passed':'failed',results};
}

export function printCheckResult(result,write=console.log){
 if(result.status==='missing-key'){
  write('OPENROUTER_API_KEY is not set; no authenticated model request was made.');
  return;
 }
 if(result.status==='invalid-model-id'){
  write('Only explicit OpenRouter model IDs ending in :free are accepted.');
  for(const item of result.results)write(`FAIL ${item.model}: invalid-model-id`);
  return;
 }
 if(result.status==='catalog-unavailable')write('OpenRouter live catalog check failed; no model inference request was made.');
 for(const item of result.results){
  if(item.status==='passed')write(`PASS ${item.model}: live catalog prices are zero; authenticated synthetic inference succeeded${item.routedModel?` (routed model ${item.routedModel})`:''}.`);
  else if(item.status==='catalog-unavailable')write(`FAIL ${item.model}: catalog-unavailable${item.httpStatus?` (HTTP ${item.httpStatus})`:''}.`);
  else if(item.status==='unavailable'&&item.catalog==='missing')write(`FAIL ${item.model}: unavailable; exact model ID is absent from the live catalog.`);
  else if(item.status==='price-gate-failed')write(`FAIL ${item.model}: price-gate-failed; catalog did not confirm zero prompt and completion prices, so inference was skipped.`);
  else if(item.status==='policy-unavailable')write(`FAIL ${item.model}: policy-unavailable; no endpoint satisfied data_collection=deny. The privacy policy was preserved.`);
  else if(item.status==='rate-limited')write(`FAIL ${item.model}: rate-limited${item.httpStatus?` (HTTP ${item.httpStatus})`:''}.`);
  else if(item.status==='authentication-failed')write(`FAIL ${item.model}: authentication-failed${item.httpStatus?` (HTTP ${item.httpStatus})`:''}.`);
  else if(item.status==='non-free-route-rejected')write(`FAIL ${item.model}: non-free-route-rejected; OpenRouter reported a route not identified by the requested catalog entry.`);
  else if(item.status==='non-zero-cost-rejected')write(`FAIL ${item.model}: non-zero-cost-rejected; the completion reported a non-zero cost.`);
  else write(`FAIL ${item.model}: ${item.status}${item.httpStatus?` (HTTP ${item.httpStatus})`:''}.`);
 }
}

async function main(){
 const args=process.argv.slice(2),allowDataCollection=args.includes('--allow-data-collection');
 const ids=args.filter(arg=>arg!=='--allow-data-collection');
 const modelIds=ids.length?ids:OPENROUTER_FREE_MODEL_IDS;
 if(allowDataCollection)console.log('Synthetic probe only: provider data-collection filter relaxed explicitly.');
 const result=await checkOpenRouterModels({apiKey:process.env.OPENROUTER_API_KEY,modelIds,allowDataCollection});
 printCheckResult(result,line=>console.log(line));
 process.exitCode=result.status==='passed'?0:result.status==='missing-key'||result.status==='invalid-model-id'?2:1;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
