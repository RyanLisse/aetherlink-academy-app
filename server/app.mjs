import express from 'express';
import http from 'node:http';
import httpProxy from 'http-proxy';
import {createHash,createHmac,randomBytes,randomUUID,timingSafeEqual} from 'node:crypto';
import {readFileSync,existsSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {Store,secret,hash,fail} from './store.mjs';
import {LocalStore} from './local-store.mjs';
import {Proof} from './proof.mjs';
import {createAcademyMcpServer} from './mcp-tools.mjs';
import {createMcpHandler,validateHostHeader} from '@modelcontextprotocol/server';
import {toNodeHandler} from '@modelcontextprotocol/node';
import {lessons,mission,initialDocument,searchKnowledge,getDayPack,listRouteDays} from './content.mjs';
import {createGoogleSso,readLoginState,signLoginState} from './google-sso.mjs';
const text=(v,max=4000)=>{if(typeof v!=='string'||!v.trim()||v.length>max)fail(400,`Vul tekst in (maximaal ${max} tekens).`);return v.trim();};
const namedCookie=(req,name)=>{const value=req.headers.cookie?.split(';').map(c=>c.trim()).find(c=>c.startsWith(`${name}=`))?.slice(name.length+1);if(value===undefined)return;try{return decodeURIComponent(value);}catch{return;}};
const cookie=req=>namedCookie(req,'academy');
const bearer=req=>req.headers.authorization?.startsWith('Bearer ')?req.headers.authorization.slice(7):null;
export function createApp({dir,repository,presence,proofBase='http://127.0.0.1:4400',root=process.cwd(),hostKey,publicBaseUrl=process.env.ACADEMY_PUBLIC_URL||`http://127.0.0.1:${process.env.PORT||4317}`,googleClientId=process.env.GOOGLE_CLIENT_ID,googleClientSecret=process.env.GOOGLE_CLIENT_SECRET,facilitatorDomains=process.env.ACADEMY_FACILITATOR_DOMAINS,signingSecret=process.env.PROOF_COLLAB_SIGNING_SECRET,fetchImpl=fetch}={}){
 const publicUrl=new URL(publicBaseUrl);if(!['http:','https:'].includes(publicUrl.protocol)||publicUrl.username||publicUrl.password||publicUrl.search||publicUrl.hash||publicUrl.pathname!=='/')throw Error('ACADEMY_PUBLIC_URL moet een HTTP(S)-origin zonder pad of credentials zijn.');
 const store=repository||new LocalStore(dir);const proof=new Proof(proofBase);const app=express();const proxy=httpProxy.createProxyServer({target:proofBase,ws:true});
 const token=req=>bearer(req)||cookie(req);
 const browser=req=>store.auth(bearer(req)||cookie(req),'browser');
 const suggestionReviewer=({r,s})=>{if(s.personId!=='facilitator'&&s.personId!==r.members[r.driver]?.id)fail(403,'Driver of facilitator beslist over documentvoorstellen.');};
 const hostFile=path.join(dir,'host-key');if(hostKey===undefined||hostKey===null){if(!existsSync(hostFile))writeFileSync(hostFile,secret(),{mode:0o600});hostKey=readFileSync(hostFile,'utf8').trim();}if(!hostKey.trim())throw new Error('ACADEMY_HOST_KEY of .data/host-key is leeg.');
 const googleSso=createGoogleSso({clientId:googleClientId,clientSecret:googleClientSecret,allowedDomains:facilitatorDomains,publicUrl:publicUrl.origin,fetchImpl}),authSecure=publicUrl.protocol==='https:',loginSecret=createHmac('sha256',signingSecret||hostKey).update('academy-login-state').digest();
 const sameState=(a,b)=>{const x=Buffer.from(String(a||'')),y=Buffer.from(String(b||''));return x.length===y.length&&timingSafeEqual(x,y);};
 const stateCheckFailed=(req,reason)=>{const rawCookie=req.headers.cookie;const cookieHeader=typeof rawCookie==='string'&&rawCookie.length>0;const cookieNames=cookieHeader?rawCookie.split(';').map(c=>c.trim().split('=')[0]).filter(Boolean):[];console.warn('[academy] Google-login state check failed',{cookieHeader,loginCookie:cookieNames.includes('academy-login'),cookieNames,reason,userAgent:String(req.headers['user-agent']||'').slice(0,80)});return Object.assign(new Error('Google-login mislukt (state).'),{code:'state'});};
 const requireFacilitator=async req=>{const key=Buffer.from(hash(req.body?.hostKey||''));if(timingSafeEqual(key,Buffer.from(hash(hostKey))))return null;const identity=await store.facilitator(namedCookie(req,'academy-facilitator'));if(identity)return identity;fail(403,'Ongeldige facilitator-startsleutel.');};
 app.disable('x-powered-by');app.use((req,res,next)=>{res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');const origin=req.headers.origin;if(origin&&origin!==publicUrl.origin&&origin!==`${req.protocol}://${req.headers.host}`)return res.status(403).json({error:'Andere origin niet toegestaan.'});next();});
 proxy.on('error',(_e,_req,res)=>{if(res.writeHead)res.writeHead(502,{'content-type':'application/json'}).end(JSON.stringify({error:'Proof is niet bereikbaar.'}));else res.destroy();});
 // Proof retains the single authoritative Yjs document. Only authenticated room paths pass this gateway.
 app.use(async(req,res,next)=>{
  if(!/^\/(d\/|api\/|documents\/|assets\/|ws\b)/.test(req.path))return next();
  try{const session=await store.auth(cookie(req),'browser');const {r}=session;const slug=req.path.match(/^\/(?:d|documents|api\/documents|api\/agent)\/([^/]+)/)?.[1];
   if(slug&&slug!==r.proof.slug)fail(403,'Dit document hoort bij een andere kamer.');
   const allowed=(['GET','PUT'].includes(req.method)&&req.path===`/api/documents/${r.proof.slug}`)||req.path.startsWith('/assets/')||req.path===`/d/${r.proof.slug}`||req.path==='/api/capabilities'||new RegExp(`^/api/documents/${r.proof.slug}/(open-context|collab-session|collab-refresh|info|presence|marks|content|title)$`).test(req.path);
   const agentAllowed=new RegExp(`^/api/agent/${r.proof.slug}/(state|events/pending|presence/disconnect|marks/(comment|reply|resolve|unresolve|accept|reject|suggest-insert|suggest-replace|suggest-delete))$`).test(req.path);
   if(!allowed&&!agentAllowed)fail(403,'Deze Proof-route is niet beschikbaar via de game.');
   if(new RegExp(`^/api/agent/${r.proof.slug}/marks/(accept|reject)$`).test(req.path))suggestionReviewer(session);
   if(req.path.startsWith('/d/'))req.url=req.path+'?token='+r.proof.editor;
   req.headers.authorization=`Bearer ${r.proof.editor}`;req.headers['x-share-token']=r.proof.editor;proxy.web(req,res);
  }catch(e){res.status(e.status||500).json({error:e.message});}
 });
 app.use(express.json({limit:'64kb'}));
 const buckets=new Map();app.use(['/game','/mcp','/auth'],(req,res,next)=>{const k=req.ip;const b=buckets.get(k)||{t:Date.now(),n:0};if(Date.now()-b.t>60000){b.t=Date.now();b.n=0;}b.n++;buckets.set(k,b);if(b.n>1500)return res.status(429).json({error:'Te veel verzoeken. Wacht even.'});next();});
 const wrap=fn=>async(req,res,next)=>{try{await fn(req,res);}catch(e){next(e);}};
 const setSession=(res,result)=>{res.cookie('academy',result.token,{httpOnly:true,sameSite:'strict',secure:publicUrl.protocol==='https:',path:'/'});res.json(result);};
 const loginCookie={httpOnly:true,sameSite:'lax',secure:authSecure,path:'/'},loginError=(res,code)=>{res.clearCookie('academy-login',loginCookie);console.warn(`[academy] Google-login mislukt: ${code}`);res.redirect(302,`/?login_error=${code}`);};
 app.get('/auth/google/start',wrap(async(_req,res)=>{if(!googleSso.enabled)return loginError(res,'disabled');try{const state=randomBytes(32).toString('base64url'),nonce=randomBytes(32).toString('base64url'),codeVerifier=randomBytes(32).toString('base64url'),expiresAt=Date.now()+10*60*1000,codeChallenge=createHash('sha256').update(codeVerifier).digest('base64url');const location=await googleSso.startUrl({state,nonce,codeChallenge});await store.loginStateSave({stateHash:hash(state),nonce,codeVerifier,expiresAt});res.cookie('academy-login',signLoginState({state,nonce,codeVerifier,expiresAt},loginSecret),{...loginCookie,maxAge:10*60*1000});res.redirect(302,location);}catch(e){loginError(res,['state','domain','token','verify','disabled'].includes(e.code)?e.code:'verify');}}));
 app.get('/auth/google/callback',wrap(async(req,res)=>{if(!googleSso.enabled)return loginError(res,'disabled');try{const cookieValue=namedCookie(req,'academy-login');let reason,loginState=null;if(!cookieValue)reason='no-cookie';else{try{const candidate=readLoginState(cookieValue,loginSecret);if(candidate.expiresAt<Date.now())reason='expired';else if(typeof req.query?.state!=='string'||!sameState(req.query.state,candidate.state))reason='mismatch';else loginState=candidate;}catch(e){reason=e.reason||'bad-signature';}}const stateHash=typeof req.query?.state==='string'&&req.query.state?hash(req.query.state):null;if(loginState&&stateHash)await store.loginStateTake(stateHash);else if(stateHash){const record=await store.loginStateTake(stateHash);if(record)loginState={state:req.query.state,nonce:record.nonce,codeVerifier:record.codeVerifier,expiresAt:record.expiresAt};else reason='no-server-state';}else reason=reason||'no-server-state';if(!loginState)throw stateCheckFailed(req,reason);const identity=await googleSso.handleCallback(req.query,loginState),token=await store.facilitatorLogin(identity);res.clearCookie('academy-login',loginCookie);res.cookie('academy-facilitator',token,{...loginCookie,maxAge:12*60*60*1000});res.redirect(302,'/?facilitator=1');}catch(e){loginError(res,['state','domain','token','verify','disabled'].includes(e.code)?e.code:'verify');}}));
 app.post('/auth/logout',wrap(async(req,res)=>{await store.facilitatorLogout(namedCookie(req,'academy-facilitator'));res.clearCookie('academy-facilitator',loginCookie);res.status(204).end();}));
 app.get('/game/config',(_req,res)=>res.json({googleSso:googleSso.enabled}));
 app.get('/game/facilitator/me',wrap(async(req,res)=>{const identity=await store.facilitator(namedCookie(req,'academy-facilitator'));if(!identity)return res.status(401).json({error:'Geen geldige facilitator-login.'});res.json({email:identity.email,name:identity.name});}));
 app.post('/game/create',wrap(async(req,res)=>{const identity=await requireFacilitator(req),name=text(req.body.name,60),p=await proof.create(initialDocument,name+' — Onze intent');setSession(res,await store.create(name,p,identity&&{email:identity.email,name:identity.name}));}));
 app.post('/game/join',wrap(async(req,res)=>setSession(res,await store.join(text(req.body.code,15),text(req.body.name,50)))));
 app.post('/game/facilitator/overview',wrap(async(req,res)=>{await requireFacilitator(req);res.json(await store.overview());}));
 app.post('/game/facilitator/attach',wrap(async(req,res)=>{const identity=await requireFacilitator(req);setSession(res,await store.attachFacilitator(text(req.body.roomId,60),identity?.name));}));
 app.post('/game/logout',wrap(async(req,res)=>{await store.logout(token(req));res.clearCookie('academy',{path:'/'});res.json({ok:true});}));
 app.get('/game/suggestions',wrap(async(req,res)=>{const {r}=await browser(req);const d=await proof.state(r);res.json(Object.entries(d.marks||{}).filter(([,m])=>['insert','replace','delete'].includes(m.kind)).map(([id,m])=>({id,...m})));}));
 app.post('/game/suggestion-review',wrap(async(req,res)=>{const {r,s}=await browser(req);suggestionReviewer({r,s});if(!['accept','reject'].includes(req.body.decision))fail(400,'Ongeldig besluit.');const id=text(req.body.id,100);const result=await proof.request(`/documents/${r.proof.slug}/ops`,r.proof.editor,{type:'suggestion.'+req.body.decision,markId:id,by:`human:${s.personId}`},text(req.body.requestId,100));res.json(result);}));
 app.post('/game/resume',wrap(async(req,res)=>{await browser(req);res.cookie('academy',bearer(req),{httpOnly:true,sameSite:'strict',secure:publicUrl.protocol==='https:',path:'/'});res.json({ok:true});}));
 app.get('/game/state',wrap(async(req,res)=>{const {r,s,p}=await browser(req);if(p){if(presence)await presence.touch(r.id,p.id);else store.live.set(p.id,Date.now());}const view=store.view(r,s);if(presence){const online=await presence.members(r.id,r.members.map(m=>m.id));view.members.forEach(m=>m.online=online.has(m.id));}res.json(view);}));
 app.post('/game/control',wrap(async(req,res)=>res.json(await store.withSession(token(req),'browser',({r,s})=>{if(s.personId!=='facilitator')fail(403,'Alleen de facilitator bedient de ronde.');const value=['time','duration'].includes(req.body.action)?Number(req.body.value):req.body.value;Store.prototype.control.call({remaining:store.remaining,save(){}},r,req.body.action,value);return store.view(r,s);})))) ;
 app.get('/game/knowledge',wrap(async(req,res)=>{await browser(req);res.json({lessons:searchKnowledge(String(req.query.q||'')),mission});}));
 const publicDayPack=pack=>({...pack,quiz:{questions:pack.quiz.questions}});
 app.get('/game/day-pack',wrap(async(req,res)=>{const {r}=await browser(req),pack=getDayPack(r.day);if(!pack)fail(400,`Geen contentpakket voor supportdag ${r.day}.`);res.json(publicDayPack(pack));}));
 app.get('/game/day-route',wrap(async(req,res)=>{const {r}=await browser(req);res.json({day:r.day,days:listRouteDays()});}));
 app.get('/game/document',wrap(async(req,res)=>{const {r}=await browser(req);res.json(await proof.state(r));}));
 app.post('/game/help',wrap(async(req,res)=>res.json(await store.withSession(token(req),'browser',({p})=>{if(!p)fail(400,'De facilitator heeft geen solo-profiel.');p.help=!p.help;return {help:p.help};}))));
 app.post('/game/quiz',wrap(async(req,res)=>res.json(await store.withSession(token(req),'browser',({r,p})=>{if(!p)fail(400,'Alleen deelnemers.');const pack=getDayPack(r.day);if(!pack)fail(400,`Geen contentpakket voor supportdag ${r.day}.`);const answers=req.body?.answers,expected=pack.quiz.questions.length;if(!Array.isArray(answers)||answers.length!==expected)fail(400,`Beantwoord alle ${expected} vragen.`);if(answers.some((answer,index)=>!Number.isInteger(answer)||answer<0||answer>=pack.quiz.questions[index].options.length))fail(400,'Gebruik een geldige optie voor elke vraag.');const score=answers.filter((answer,index)=>answer===pack.quiz.answers[index]).length;p.quiz={score,at:new Date().toISOString()};p.route=score<=1?'guided':score===2?'standard':'stretch';return {score,route:p.route,note:'Voorlopige hulpkeuze op basis van 3 scenario’s; geen vaardigheidsbewijs of permanent label.'};}))));
 app.post('/game/route',wrap(async(req,res)=>{if(!['guided','standard','stretch'].includes(req.body.route))fail(400,'Ongeldige hulpkeuze.');await store.withSession(token(req),'browser',({p})=>{if(!p)fail(400,'Alleen deelnemers.');p.route=req.body.route;});res.json({ok:true});}));
 app.post('/game/mcp-token',wrap(async(req,res)=>res.json(await store.rotateMcpToken(token(req)))));
 function reviewer({r,s}){if(s.personId!=='facilitator'&&s.personId!==r.members[r.driver]?.id)fail(403,'Driver of facilitator beoordeelt het bewijs.');}
 async function commentQuote(r){const state=await proof.state(r);const quote=state.markdown.split('\n').find(line=>line.trim())?.replace(/^#+\s*/,'').trim();if(!quote)fail(409,'Het document heeft nog geen tekst voor commentaar.');return quote;}
 async function evidence(token,input){
  const {r,p,s}=await store.auth(token);if(!p)fail(403,'Alleen een deelnemer kan bewijs indienen.');
  const key=text(input.requestId,100),fields={finding:text(input.finding),command:text(input.command,1000),observed:text(input.observed),limitation:text(input.limitation)};
  const fingerprint=hash(JSON.stringify(fields));
  const reserved=await store.reserveRequest(token,'evidence',key,fingerprint,{value:{id:randomUUID(),requestId:key,personId:p.id,name:p.name,source:s.kind==='mcp'?'MCP-client':'Deelnemer',...fields,at:new Date().toISOString(),status:'pending'},actor:`${s.kind==='mcp'?'ai':'human'}:${p.name}:${p.id}`,quote:await commentQuote(r)},({p})=>{if(!p)fail(403,'Alleen deelnemers.');});
  if(reserved.completed)return reserved.result;
  const {value:e,actor,quote}=reserved.intent;
  await proof.comment(r,actor,`Bewijs ${e.id}\n${e.finding}\nControle: ${e.command}\nWaargenomen: ${e.observed}\nBeperking: ${e.limitation}\nStatus: ingediend, nog niet door een mens beoordeeld.`,quote,`${p.id}:${key}`);
  return store.completeRequest(token,'evidence',key,fingerprint,({r})=>{r.evidence.push(e);return e;});
 }
 app.post('/game/evidence',wrap(async(req,res)=>{await browser(req);res.json(await evidence(token(req),req.body));}));
 app.post('/game/review',wrap(async(req,res)=>{
  const {r,s}=await browser(req);
  if(!['accepted','needs-work'].includes(req.body.status))fail(400,'Ongeldige beoordeling.');
  const fields={id:text(req.body.id,100),status:req.body.status,note:text(req.body.note)},key=text(req.body.requestId,100),fingerprint=hash(JSON.stringify(fields));
  const saved=await store.reserveRequest(token(req),'review',key,fingerprint,{value:{...fields,by:s.personId,at:new Date().toISOString()},actor:`human:${s.personId}`,quote:await commentQuote(r)},context=>{reviewer(context);const e=context.r.evidence.find(e=>e.id===fields.id);if(!e)fail(404,'Bewijs niet gevonden.');if(e.personId===context.s.personId)fail(403,'Laat een andere deelnemer jouw bewijs beoordelen.');});if(saved.completed)return res.json(saved.result);
  const {value:intent,actor,quote}=saved.intent;await proof.comment(r,actor,`Review bewijs ${intent.id}: ${intent.status}\n${intent.note}`,quote,`review:${s.personId}:${key}`);
  res.json(await store.completeRequest(token(req),'review',key,fingerprint,context=>{const target=context.r.evidence.find(x=>x.id===intent.id);if(!target)fail(404,'Bewijs niet gevonden.');target.status=intent.status;target.review={by:intent.by,note:intent.note,at:intent.at};return target;}));
 }));
 app.post('/game/handoff',wrap(async(req,res)=>{
  const {r,s}=await browser(req);
  const fields={decision:text(req.body.decision),checked:text(req.body.checked),open:text(req.body.open)},key=text(req.body.requestId,100),fingerprint=hash(JSON.stringify(fields));
  const saved=await store.reserveRequest(token(req),'handoff',key,fingerprint,{value:{id:randomUUID(),by:s.personId,...fields,next:r.members[(r.driver+1)%r.members.length]?.name||'Nog te bepalen',at:new Date().toISOString()},actor:`human:${s.personId}`,quote:await commentQuote(r)},reviewer);if(saved.completed)return res.json(saved.result);
  const {value:h,actor,quote}=saved.intent;await proof.comment(r,actor,`Overdracht\nBesluit: ${h.decision}\nGecontroleerd: ${h.checked}\nOpen: ${h.open}\nVolgende eigenaar: ${h.next}`,quote,h.id);
  res.json(await store.completeRequest(token(req),'handoff',key,fingerprint,context=>{context.r.handoffs.push(h);return h;}));
 }));
 async function executeMcp(token,tool,input){const a=await store.auth(token,'mcp');const {r,p}=a;if(!p)fail(403,'Geen deelnemer.');let result;
  switch(tool){case 'get_mission':result={mission,day:r.day,phase:r.phase,route:p.route,role:r.members[r.driver]?.id===p.id?'Driver':'Navigator',coach:'Leg begrippen uit, citeer les-IDs, pas hints aan de hulpkeuze aan. Lees eerst de gedeelde intent. Geen browserchat of model-API vanuit de game.'};break;
  case 'get_document':result=await proof.state(r);break;
  case 'search_knowledge':result={lessons:searchKnowledge(String(input.query||''))};break;
  case 'submit_evidence':result=await evidence(token,input);break;
  case 'suggest_document':result=await proof.suggest(r,`ai:${p.name}:${p.id}`,text(input.quote),text(input.content),`${p.id}:${text(input.requestId,100)}`);break;
  default:fail(404,'Onbekende MCP-tool.');}
  await store.withSession(token,'mcp',({p})=>{p.lastMcp=new Date().toISOString();});return result;}
 app.post('/game/mcp/:tool',wrap(async(req,res)=>res.json(await executeMcp(bearer(req),req.params.tool,req.body))));
 app.get('/game/connection',wrap(async(req,res)=>{await browser(req);res.json({transport:'streamable-http',mcpUrl:publicUrl.origin+'/mcp',remoteConfigured:publicUrl.protocol==='https:',status:publicUrl.protocol==='https:'?'Remote-adres geconfigureerd; externe bereikbaarheid nog te controleren.':'Lokale preview. Er is nog geen publieke remote MCP uitgerold.'});}));
 const mcpHandler=createMcpHandler(()=>createAcademyMcpServer((tool,input,ctx)=>{const auth=ctx.http?.req?.headers.get('authorization')||'';return executeMcp(auth.startsWith('Bearer ')?auth.slice(7):'',tool,input);}),{legacy:'stateless',responseMode:'json'});
 const mcpNodeHandler=toNodeHandler(mcpHandler);
 app.all('/mcp',wrap(async(req,res)=>{
  try{await store.auth(bearer(req),'mcp');}catch(e){res.setHeader('WWW-Authenticate','Bearer realm="academy"');throw e;}
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Stateless Streamable HTTP ondersteunt hier alleen POST.'});}
  if(!validateHostHeader(req.headers.host,[publicUrl.hostname]).ok)return res.status(403).json({error:'Ongeldige Host-header.'});
  if(req.headers.origin&&req.headers.origin!==publicUrl.origin)return res.status(403).json({error:'Andere origin niet toegestaan.'});
  await mcpNodeHandler(req,res,req.body);
 }));
 app.get('/game/starter/:file',wrap(async(req,res)=>{await browser(req);if(!['README.md','CLAUDE.md','package.json','status.mjs','status.test.mjs'].includes(req.params.file))fail(404,'Bestand niet gevonden.');res.type('text/plain').send(readFileSync(path.join(root,'starter',req.params.file),'utf8'));}));
 app.get('/game/health',wrap(async(_req,res)=>{let connected=false;try{connected=(await fetch(proofBase+'/health',{signal:AbortSignal.timeout(2000)})).ok;}catch{}res.json({ok:true,proof:connected,revision:process.env.VERCEL_GIT_COMMIT_SHA||process.env.SOURCE_REVISION||null});}));
 app.use(express.static(path.join(root,'dist')));app.get('/',(_req,res)=>res.sendFile(path.join(root,'dist/index.html')));
 app.use((e,req,res,_next)=>{if(!e.status)console.error('[academy] unhandled',{method:req.method,path:req.path,message:e?.message,stack:e?.stack});return res.status(e.status||500).json({error:e.status?e.message:'Onverwachte serverfout. Probeer opnieuw; je invoer blijft staan.'});});
 const server=http.createServer(app);server.on('upgrade',async(req,socket,head)=>{try{const {r}=await browser(req);const url=new URL(req.url,'http://localhost');if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`&&req.headers.origin!==`https://${req.headers.host}`)fail(403,'Origin');if(url.pathname!=='/ws'||url.searchParams.get('slug')!==r.proof.slug)fail(403,'Kamer');proxy.ws(req,socket,head);}catch(e){console.warn('WS denied',new URL(req.url,'http://localhost').pathname,e.message);socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');socket.destroy();}});
 return {app,server,store,proof};
}
