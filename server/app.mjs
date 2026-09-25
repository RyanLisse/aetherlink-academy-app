import express from 'express';
import {agentInstructions} from './agent-setup.mjs';
import {dayProgress,debrief,exportDebrief} from './progress.mjs';
import {findTask,taskStatus,taskTrail,reviewQueue,peerQueue,transition,reviewEvent,reviewerRole,authorizeTaskReview} from './proof-trail.mjs';
import {applyBoardAction,boardMarkdown,boardView,parseBoard,roomDocument} from './debrief-board.mjs';
import http from 'node:http';
import httpProxy from 'http-proxy';
import {createHash,createHmac,randomBytes,randomUUID,timingSafeEqual} from 'node:crypto';
import {readFileSync,existsSync,writeFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
import {Store,secret,hash,fail} from './store.mjs';
import {LocalStore} from './local-store.mjs';
import {Proof} from './proof.mjs';
import {createAcademyMcpServer} from './mcp-tools.mjs';
import {createMcpHandler,validateHostHeader} from '@modelcontextprotocol/server';
import {toNodeHandler} from '@modelcontextprotocol/node';
import {lessons,mission,initialDocument,searchKnowledge,getDayPack,listRouteDays,starterFileNames} from './content.mjs';
import {openQuizAttempt,participantDayPack,submitQuizAttempt} from './quiz.mjs';
import {createGoogleSso,readLoginState,signLoginState} from './google-sso.mjs';
import {createSlidesService} from './slides/runtime.ts';
import {createPortal} from './portal/index.mjs';
import {READ_ONLY_MESSAGE,parseCohortInput,parseMemberNames,normalizeAccessCode,certificateVerifiableUntil} from './cohort.mjs';
import {CERTIFICATE_CSP,CERTIFICATE_INVALID_MESSAGE,publicVerification,renderCertificatePage,renderVerificationPage} from './certificate.mjs';
import {parseLabAnswer,parseLabCompletion,parseOriginAllowlist,resolveLabs} from '../packages/lab-embed/src/index.ts';
import {gradedStopsPassed,parseLabKeys,recordAttempt} from '../packages/lab-embed/src/grading.ts';
import {labGradingKeys} from './lab-keys.mjs';
import {createScreenStore,screenBinding,readScreenState} from './screen-state.mjs';
import {answerQuestion} from './faq.mjs';
const text=(v,max=4000)=>{if(typeof v!=='string'||!v.trim()||v.length>max)fail(400,`Vul tekst in (maximaal ${max} tekens).`);return v.trim();};
const namedCookie=(req,name)=>{const value=req.headers.cookie?.split(';').map(c=>c.trim()).find(c=>c.startsWith(`${name}=`))?.slice(name.length+1);if(value===undefined)return;try{return decodeURIComponent(value);}catch{return;}};
const cookie=req=>namedCookie(req,'academy');
const uuid=v=>{if(typeof v!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v))fail(400,'Ongeldige id.');return v;};
// screen-state (presence heartbeat) and chat (FAQ lookup) are reads over POST, so read-only members
// can keep using the Academy as a reference after the live days.
const readOnlyExempt=new Set(['/game/logout','/game/resume','/game/join','/game/create','/game/participant/resume','/game/cohort/activate','/game/screen-state','/game/chat']);
const certificateId=v=>{const normalized=normalizeAccessCode(v);if(!normalized)fail(404,CERTIFICATE_INVALID_MESSAGE);return normalized.match(/.{4}/g).join('-');};
const bearer=req=>req.headers.authorization?.startsWith('Bearer ')?req.headers.authorization.slice(7):null;
export function createApp({dir,repository,presence,proofBase='http://127.0.0.1:4400',root=process.cwd(),hostKey,publicBaseUrl=process.env.ACADEMY_PUBLIC_URL||`http://127.0.0.1:${process.env.PORT||4317}`,googleClientId=process.env.GOOGLE_CLIENT_ID,googleClientSecret=process.env.GOOGLE_CLIENT_SECRET,facilitatorDomains=process.env.ACADEMY_FACILITATOR_DOMAINS,signingSecret=process.env.PROOF_COLLAB_SIGNING_SECRET,fetchImpl=fetch,slidesService,labOrigins=process.env.ACADEMY_LAB_ORIGINS,labsForDay=day=>getDayPack(day)?.labs,labKeys=labGradingKeys,trustProxy=process.env.ACADEMY_TRUST_PROXY}={}){
 const publicUrl=new URL(publicBaseUrl);if(!['http:','https:'].includes(publicUrl.protocol)||publicUrl.username||publicUrl.password||publicUrl.search||publicUrl.hash||publicUrl.pathname!=='/')throw Error('ACADEMY_PUBLIC_URL moet een HTTP(S)-origin zonder pad of credentials zijn.');
 const store=repository||new LocalStore(dir);const proof=new Proof(proofBase);const slides=slidesService||createSlidesService(repository?{pool:repository.pool,schema:repository.schema}:{dir});const app=express();const proxy=httpProxy.createProxyServer({target:proofBase,ws:true});
 const token=req=>bearer(req)||cookie(req);
 const browser=req=>store.auth(bearer(req)||cookie(req),'browser');
 const suggestionReviewer=({r,s})=>{if(s.personId!=='facilitator'&&s.personId!==r.members[r.driver]?.id)fail(403,'Driver of facilitator beslist over documentvoorstellen.');};
 const hostFile=path.join(dir,'host-key');if(hostKey===undefined||hostKey===null){if(!existsSync(hostFile))writeFileSync(hostFile,secret(),{mode:0o600});hostKey=readFileSync(hostFile,'utf8').trim();}if(!hostKey.trim())throw new Error('ACADEMY_HOST_KEY of .data/host-key is leeg.');
 const googleSso=createGoogleSso({clientId:googleClientId,clientSecret:googleClientSecret,allowedDomains:facilitatorDomains,publicUrl:publicUrl.origin,fetchImpl}),authSecure=publicUrl.protocol==='https:',loginSecret=createHmac('sha256',signingSecret||hostKey).update('academy-login-state').digest();
 const portal=createPortal({signingSecret:signingSecret||hostKey,academyOrigin:publicUrl.origin,readCanonical:async(ref)=>{if(ref?.kind==='day-pack'){const pack=getDayPack(ref.day);if(!pack)fail(404,`Geen contentpakket voor dag ${ref.day}.`);return {body:JSON.stringify(participantDayPack(pack)),sourceRef:`day-pack:${ref.day}`,contentType:'application/json'};}if(typeof ref?.body==='string')return {body:ref.body,sourceRef:ref.sourceRef||'inline',contentType:ref.contentType||'text/plain'};fail(400,'Onbekende content-ref.');}});
 const sameState=(a,b)=>{const x=Buffer.from(String(a||'')),y=Buffer.from(String(b||''));return x.length===y.length&&timingSafeEqual(x,y);};
 const stateCheckFailed=(req,reason)=>{const rawCookie=req.headers.cookie;const cookieHeader=typeof rawCookie==='string'&&rawCookie.length>0;const cookieNames=cookieHeader?rawCookie.split(';').map(c=>c.trim().split('=')[0]).filter(Boolean):[];console.warn('[academy] Google-login state check failed',{cookieHeader,loginCookie:cookieNames.includes('academy-login'),cookieNames,reason,userAgent:String(req.headers['user-agent']||'').slice(0,80)});return Object.assign(new Error('Google-login mislukt (state).'),{code:'state'});};
 const requireFacilitator=async req=>{const key=Buffer.from(hash(req.body?.hostKey||''));if(timingSafeEqual(key,Buffer.from(hash(hostKey))))return null;const identity=await store.facilitator(namedCookie(req,'academy-facilitator'));if(identity)return identity;fail(403,'Ongeldige facilitator-startsleutel.');};
 app.disable('x-powered-by');if(trustProxy)app.set('trust proxy',/^\d+$/.test(String(trustProxy))?Number(trustProxy):trustProxy);app.use((req,res,next)=>{res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');const origin=req.headers.origin;if(origin&&origin!==publicUrl.origin&&origin!==`${req.protocol}://${req.headers.host}`)return res.status(403).json({error:'Andere origin niet toegestaan.'});next();});
 proxy.on('error',(_e,_req,res)=>{if(res.writeHead)res.writeHead(502,{'content-type':'application/json'}).end(JSON.stringify({error:'Proof is niet bereikbaar.'}));else res.destroy();});
 const webDist=path.join(root,'apps/web/dist'),webAssetsDir=path.join(webDist,'assets');
 // apps/web/public/assets shares the /assets prefix with Proof's editor bundle; only files the web build shipped bypass the Proof session.
 const webPublicAssets=new Set(existsSync(webAssetsDir)?readdirSync(webAssetsDir,{recursive:true,withFileTypes:true}).filter(e=>e.isFile()).map(e=>'/assets/'+path.relative(webAssetsDir,path.join(e.parentPath,e.name)).split(path.sep).join('/')):[]);
 // Proof retains the single authoritative Yjs document. Only authenticated room paths pass this gateway.
 app.use(async(req,res,next)=>{
  if(!/^\/(d\/|api\/|documents\/|assets\/|ws\b)/.test(req.path)||webPublicAssets.has(req.path))return next();
  try{const session=await store.auth(cookie(req),'browser');const {r}=session;const slug=req.path.match(/^\/(?:d|documents|api\/documents|api\/agent)\/([^/]+)/)?.[1];
   const doc=roomDocument(r,slug);if(!doc)fail(403,'Dit document hoort bij een andere kamer.');const docSlug=doc.proof.slug;
   if(session.s.readOnly&&!['GET','HEAD'].includes(req.method))fail(403,READ_ONLY_MESSAGE);
   const allowed=(['GET','PUT'].includes(req.method)&&req.path===`/api/documents/${docSlug}`)||req.path.startsWith('/assets/')||req.path===`/d/${docSlug}`||req.path==='/api/capabilities'||new RegExp(`^/api/documents/${docSlug}/(open-context|collab-session|collab-refresh|info|presence|marks|content|title)$`).test(req.path);
   const agentAllowed=new RegExp(`^/api/agent/${docSlug}/(state|events/pending|presence/disconnect|marks/(comment|reply|resolve|unresolve|accept|reject|suggest-insert|suggest-replace|suggest-delete))$`).test(req.path);
   if(!allowed&&!agentAllowed)fail(403,'Deze Proof-route is niet beschikbaar via de game.');
   if(!doc.writable&&!['GET','HEAD'].includes(req.method)&&req.path!==`/api/documents/${docSlug}/collab-refresh`)fail(403,'Het debriefbord is gesloten; alleen lezen is mogelijk.');
   if(new RegExp(`^/api/agent/${docSlug}/marks/(accept|reject)$`).test(req.path))suggestionReviewer(session);
   if(req.path.startsWith('/d/'))req.url=req.path+'?token='+doc.token;
   req.headers.authorization=`Bearer ${doc.token}`;req.headers['x-share-token']=doc.token;proxy.web(req,res);
  }catch(e){res.status(e.status||500).json({error:e.message});}
 });
 app.use(express.json({limit:'64kb'}));
 const buckets=new Map();app.use(['/game','/mcp','/auth','/verify','/certificate'],(req,res,next)=>{const k=req.ip;const b=buckets.get(k)||{t:Date.now(),n:0};if(Date.now()-b.t>60000){b.t=Date.now();b.n=0;}b.n++;buckets.set(k,b);if(b.n>1500)return res.status(429).json({error:'Te veel verzoeken. Wacht even.'});next();});
 app.use(async(req,res,next)=>{
  const route=req.path.toLowerCase().replace(/\/+$/,'');
  if(['GET','HEAD'].includes(req.method)||!route.startsWith('/game/')||route.startsWith('/game/facilitator/')||readOnlyExempt.has(route)||!token(req))return next();
  try{const {s}=await store.auth(token(req));if(s.readOnly)return res.status(403).json({error:READ_ONLY_MESSAGE});}catch(e){if(e.status!==401)return next(e);}
  next();
 });
 const wrap=fn=>async(req,res,next)=>{try{await fn(req,res);}catch(e){next(e);}};
 const setSession=(res,result)=>{res.cookie('academy',result.token,{httpOnly:true,sameSite:'strict',secure:publicUrl.protocol==='https:',path:'/'});res.json(result);};
 const loginCookie={httpOnly:true,sameSite:'lax',secure:authSecure,path:'/'},loginCodes=new Set(['state','domain','token','verify','disabled','session']),mapLoginError=e=>loginCodes.has(e?.code)?e.code:'session',loginError=(res,code,detail={})=>{res.clearCookie('academy-login',loginCookie);console.warn('[academy] Google-login mislukt',{code,reason:detail.reason||null,message:typeof detail.message==='string'?detail.message.slice(0,160):null});res.redirect(302,`/?login_error=${code}`);};
 app.get('/auth/google/start',wrap(async(_req,res)=>{if(!googleSso.enabled)return loginError(res,'disabled');try{const state=randomBytes(32).toString('base64url'),nonce=randomBytes(32).toString('base64url'),codeVerifier=randomBytes(32).toString('base64url'),expiresAt=Date.now()+10*60*1000,codeChallenge=createHash('sha256').update(codeVerifier).digest('base64url');const location=await googleSso.startUrl({state,nonce,codeChallenge});await store.loginStateSave({stateHash:hash(state),nonce,codeVerifier,expiresAt});res.cookie('academy-login',signLoginState({state,nonce,codeVerifier,expiresAt},loginSecret),{...loginCookie,maxAge:10*60*1000});res.redirect(302,location);}catch(e){loginError(res,mapLoginError(e),{reason:e.reason,message:e.message});}}));
 app.get('/auth/google/callback',wrap(async(req,res)=>{if(!googleSso.enabled)return loginError(res,'disabled');try{const cookieValue=namedCookie(req,'academy-login');let reason,loginState=null;if(!cookieValue)reason='no-cookie';else{try{const candidate=readLoginState(cookieValue,loginSecret);if(candidate.expiresAt<Date.now())reason='expired';else if(typeof req.query?.state!=='string'||!sameState(req.query.state,candidate.state))reason='mismatch';else loginState=candidate;}catch(e){reason=e.reason||'bad-signature';}}const stateHash=typeof req.query?.state==='string'&&req.query.state?hash(req.query.state):null;if(loginState&&stateHash)await store.loginStateTake(stateHash);else if(stateHash){const record=await store.loginStateTake(stateHash);if(record)loginState={state:req.query.state,nonce:record.nonce,codeVerifier:record.codeVerifier,expiresAt:record.expiresAt};else reason='no-server-state';}else reason=reason||'no-server-state';if(!loginState)throw stateCheckFailed(req,reason);const identity=await googleSso.handleCallback(req.query,loginState),token=await store.facilitatorLogin(identity);res.clearCookie('academy-login',loginCookie);res.cookie('academy-facilitator',token,{...loginCookie,maxAge:12*60*60*1000});res.redirect(302,'/?facilitator=1');}catch(e){loginError(res,mapLoginError(e),{reason:e.reason,message:e.message});}}));
 app.post('/auth/logout',wrap(async(req,res)=>{await store.facilitatorLogout(namedCookie(req,'academy-facilitator'));res.clearCookie('academy-facilitator',loginCookie);res.status(204).end();}));
 app.get('/game/config',(_req,res)=>res.json({googleSso:googleSso.enabled,portal:true,portalLaunch:process.env.ACADEMY_PORTAL_LAUNCH!=='0'}));
 app.get('/game/facilitator/me',wrap(async(req,res)=>{const identity=await store.facilitator(namedCookie(req,'academy-facilitator'));if(!identity)return res.status(401).json({error:'Geen geldige facilitator-login.'});res.json({email:identity.email,name:identity.name});}));
 app.post('/game/create',wrap(async(req,res)=>{const identity=await requireFacilitator(req),name=text(req.body.name,60),p=await proof.create(initialDocument,name+' — Onze intent');setSession(res,await store.create(name,p,identity&&{email:identity.email,name:identity.name}));}));
 app.post('/game/join',wrap(async(req,res)=>setSession(res,await store.join(text(req.body.code,15),text(req.body.name,50)))));
 app.post('/game/participant/resume',wrap(async(req,res)=>setSession(res,await store.resumeParticipant(text(req.body.resumeToken,128)))));
 app.post('/game/participant/access',wrap(async(req,res)=>res.json(await store.rotateParticipantAccess(token(req)))));
 app.post('/game/cohort/activate',wrap(async(req,res)=>setSession(res,await store.activateCohortCode(text(req.body.code,40),{ip:req.ip}))));
 app.post('/game/facilitator/cohorts',wrap(async(req,res)=>{await requireFacilitator(req);res.json(await store.cohortOverview());}));
 app.post('/game/facilitator/cohort/create',wrap(async(req,res)=>{const identity=await requireFacilitator(req);const input=parseCohortInput(req.body||{}),names=req.body?.members?.length?parseMemberNames(req.body.members):[];res.status(201).json(await store.createCohort(input,names,identity&&{email:identity.email,name:identity.name}));}));
 app.post('/game/facilitator/cohort/members',wrap(async(req,res)=>{await requireFacilitator(req);res.json(await store.addCohortMembers(uuid(req.body.cohortId),parseMemberNames(req.body.members)));}));
 app.post('/game/facilitator/cohort/attach',wrap(async(req,res)=>{await requireFacilitator(req);res.json(await store.attachCohortRoom(uuid(req.body.cohortId),uuid(req.body.roomId)));}));
 const liveSockets=new Map();
 const closeSockets=personId=>{for(const socket of liveSockets.get(personId)||[])socket.destroy();liveSockets.delete(personId);};
 app.post('/game/facilitator/cohort/revoke',wrap(async(req,res)=>{await requireFacilitator(req);const result=await store.revokeCohortMember(uuid(req.body.cohortId),uuid(req.body.memberId));closeSockets(req.body.memberId);res.json(result);}));
 app.post('/game/facilitator/cohort/reissue',wrap(async(req,res)=>{await requireFacilitator(req);const result=await store.reissueCohortCode(uuid(req.body.cohortId),uuid(req.body.memberId));closeSockets(req.body.memberId);res.json(result);}));
 app.post('/game/facilitator/cohort/certificate/revoke',wrap(async(req,res)=>{await requireFacilitator(req);res.json(await store.revokeCertificate(uuid(req.body.cohortId),certificateId(req.body.certificateId)));}));
 const sendCertificate=(res,certificate)=>{if(!certificate||certificate.revokedAt)fail(404,CERTIFICATE_INVALID_MESSAGE);res.type('text/html').set('Content-Security-Policy',CERTIFICATE_CSP).set('X-Robots-Tag','noindex').send(renderCertificatePage(certificate,{verifyUrl:`${publicUrl.origin}/verify/${certificate.id}`,verifiableUntil:certificateVerifiableUntil(certificate)}));};
 app.post('/game/facilitator/cohort/certificate/view',wrap(async(req,res)=>{await requireFacilitator(req);sendCertificate(res,await store.certificate(certificateId(req.body.certificateId)));}));
 app.get('/certificate/:id',wrap(async(req,res)=>{const certificate=await store.certificate(certificateId(req.params.id));const facilitator=await store.facilitator(namedCookie(req,'academy-facilitator'));if(!facilitator){const {s}=await store.auth(cookie(req),'browser');if(!certificate||s.personId!==certificate.memberId)fail(404,CERTIFICATE_INVALID_MESSAGE);}sendCertificate(res,certificate);}));
 app.get('/game/certificate',wrap(async(req,res)=>{const mine=await store.myCertificate(token(req));if(!mine)return res.json({status:'no-cohort'});res.json({...mine,...(mine.id?{certificateUrl:`/certificate/${mine.id}`,verifyUrl:`${publicUrl.origin}/verify/${mine.id}`}:{})});}));
 app.get('/verify/:id',wrap(async(req,res)=>{const normalized=normalizeAccessCode(req.params.id);const verification=normalized?publicVerification(await store.certificate(normalized.match(/.{4}/g).join('-'))):null;res.status(verification?200:404).type('text/html').set('Content-Security-Policy',CERTIFICATE_CSP).set('X-Robots-Tag','noindex').send(renderVerificationPage(verification));}));
 app.post('/game/facilitator/overview',wrap(async(req,res)=>{await requireFacilitator(req);res.json(await store.overview());}));
 app.post('/game/facilitator/attach',wrap(async(req,res)=>{const identity=await requireFacilitator(req);setSession(res,await store.attachFacilitator(text(req.body.roomId,60),identity?.name));}));
 app.post('/game/logout',wrap(async(req,res)=>{await store.logout(token(req));res.clearCookie('academy',{path:'/'});res.json({ok:true});}));
 app.get('/game/suggestions',wrap(async(req,res)=>{const {r}=await browser(req);const d=await proof.state(r);res.json(Object.entries(d.marks||{}).filter(([,m])=>['insert','replace','delete'].includes(m.kind)).map(([id,m])=>({id,...m})));}));
 app.post('/game/suggestion-review',wrap(async(req,res)=>{const {r,s}=await browser(req);suggestionReviewer({r,s});if(!['accept','reject'].includes(req.body.decision))fail(400,'Ongeldig besluit.');const id=text(req.body.id,100);const result=await proof.suggestionReview(r,req.body.decision,id,`human:${s.personId}`,text(req.body.requestId,100));res.json(result);}));
 app.post('/game/resume',wrap(async(req,res)=>{await browser(req);res.cookie('academy',bearer(req),{httpOnly:true,sameSite:'strict',secure:publicUrl.protocol==='https:',path:'/'});res.json({ok:true});}));
 app.get('/game/state',wrap(async(req,res)=>{const {r,s,p}=await browser(req);if(p){if(presence)await presence.touch(r.id,p.id);else store.live.set(p.id,Date.now());}const view=store.view(r,s);if(presence){const online=await presence.members(r.id,r.members.map(m=>m.id));view.members.forEach(m=>m.online=online.has(m.id));}res.json(view);}));
 app.post('/game/control',wrap(async(req,res)=>res.json(await store.withSession(token(req),'browser',({r,s})=>{if(s.personId!=='facilitator')fail(403,'Alleen de facilitator bedient de ronde.');const value=['time','duration'].includes(req.body.action)?Number(req.body.value):req.body.value;Store.prototype.control.call({remaining:store.remaining,save(){}},r,req.body.action,value);return store.view(r,s);})))) ;
 app.get('/game/knowledge',wrap(async(req,res)=>{const {r}=await browser(req);const pack=getDayPack(r.day);res.json({lessons:searchKnowledge(String(req.query.q||'')),mission:pack?.mission||mission});}));
 // Labs are embeddable only from origins configured here, never from the pack or the client.
 const allowedLabOrigins=parseOriginAllowlist(labOrigins,publicUrl.origin),gradingKeys=parseLabKeys(labKeys),dayLabs=day=>resolveLabs(labsForDay(day),{baseUrl:publicUrl.origin,allowedOrigins:allowedLabOrigins,gradedStopsFor:id=>[...(gradingKeys.get(id)?.keys()??[])]});
 const participantLab=(r,p,labId)=>{if(!p)fail(403,'Alleen deelnemers maken een lab.');if(!dayLabs(r.day).some(lab=>lab.id===labId))fail(404,`Lab ${labId} hoort niet bij dag ${r.day}.`);const key=String(r.day);p.progressByDay??={};return {key,day:p.progressByDay[key]||{}};};
 const publicDayPack=pack=>({...participantDayPack(pack),labs:dayLabs(pack.day)});
 app.get('/game/day-pack',wrap(async(req,res)=>{const {r}=await browser(req),pack=getDayPack(r.day);if(!pack)fail(400,`Geen contentpakket voor supportdag ${r.day}.`);res.json(publicDayPack(pack));}));
 app.post('/game/chat',wrap(async(req,res)=>{const {r,s}=await browser(req);if(s.personId!=='facilitator'&&r.chat===false)fail(403,'De facilitator heeft de chat voor deze kamer uitgezet.');res.json(answerQuestion({day:r.day,query:text(req.body?.q,300),locale:req.body?.locale}));}));
 app.get('/game/day-route',wrap(async(req,res)=>{const {r,p}=await browser(req);res.json({day:r.day,days:listRouteDays().map(d=>({...d,labsTotal:dayLabs(d.day).length,progress:dayProgress(r,p,d.day)}))});}));
 app.post('/game/lab-answer',wrap(async(req,res)=>{const submission=parseLabAnswer(req.body);if(!submission)fail(400,'Ongeldig labantwoord.');res.json(await store.withSession(token(req),'browser',({r,p})=>{const {key,day}=participantLab(r,p,submission.labId),answerKey=gradingKeys.get(submission.labId)?.get(submission.stopId);if(!answerKey)fail(404,`Stop ${submission.stopId} wordt niet beoordeeld.`);const stops=day.labStops?.[submission.labId]||{},{recorded,stop}=recordAttempt(stops[submission.stopId],answerKey,submission,new Date().toISOString());if(recorded)p.progressByDay[key]={...day,labStops:{...day.labStops,[submission.labId]:{...stops,[submission.stopId]:stop}}};return {recorded,day:r.day,labId:submission.labId,stop};}));}));
 app.post('/game/lab-complete',wrap(async(req,res)=>{const completion=parseLabCompletion(req.body);if(!completion)fail(400,'Ongeldige labvoltooiing.');res.json(await store.withSession(token(req),'browser',({r,p})=>{const {key,day}=participantLab(r,p,completion.labId),existing=day.labs?.[completion.labId];if(existing)return {recorded:false,day:r.day,labId:completion.labId,lab:existing};const graded=gradedStopsPassed(gradingKeys.get(completion.labId),day.labStops?.[completion.labId]);if(graded.passed<graded.total)fail(409,`Nog niet alle beoordeelde stops gehaald (${graded.passed}/${graded.total}).`);const lab=graded.total?{source:'server-graded',result:{outcome:'completed',score:{value:graded.passed,max:graded.total}},evidence:completion.evidence??null,at:new Date().toISOString()}:{source:'lab-reported',result:completion.result,evidence:completion.evidence??null,at:new Date().toISOString()};p.progressByDay[key]={...day,labs:{...day.labs,[completion.labId]:lab}};return {recorded:true,day:r.day,labId:completion.labId,lab};}));}));
 app.post('/game/reflection',wrap(async(req,res)=>res.json(await store.withSession(token(req),'browser',({r,p})=>{if(!p)fail(403,'Alleen deelnemers schrijven een eigen reflectie.');const reflection={learned:text(req.body.learned),next:text(req.body.next),at:new Date().toISOString()};p.progressByDay??={};p.progressByDay[String(r.day)]={...p.progressByDay[String(r.day)],reflection};return reflection;}))));
 app.get('/game/debrief',wrap(async(req,res)=>{const {r,s}=await browser(req);if(s.personId!=='facilitator')fail(403,'Alleen de facilitator bekijkt de debrief.');res.json(debrief(r));}));
 app.get('/game/debrief/export',wrap(async(req,res)=>{const {r,s}=await browser(req);if(s.personId!=='facilitator')fail(403,'Alleen de facilitator exporteert de debrief.');const board=r.board?parseBoard((await proof.state({proof:r.board.proof})).markdown):null;res.type('text/markdown').set('Content-Disposition','attachment; filename="squad-overdracht.md"').send(exportDebrief(r,board));}));
 // Fencing drops Proof's loaded doc, so wait until its debounced persist has stored every card that is already live.
 async function settleBoard(p){for(let attempt=0;attempt<25;attempt++){const [live,stored]=await Promise.all([proof.state({proof:p}),proof.stored(p)]);if(JSON.stringify(parseBoard(live.markdown))===JSON.stringify(parseBoard(stored.markdown)))return;await new Promise(resolve=>setTimeout(resolve,200));}fail(503,'Proof slaat het bord nog op. Sluit het bord opnieuw.');}
 app.post('/game/board',wrap(async(req,res)=>{
  const {r,s}=await browser(req);if(s.personId!=='facilitator')fail(403,'Alleen de facilitator opent of sluit het debriefbord.');
  const action=req.body?.action,created=action==='open'&&!r.board?await proof.createBoard(boardMarkdown(),`${r.name} — Debriefbord`):null;
  const board=await store.withSession(token(req),'browser',({r,s})=>{if(s.personId!=='facilitator')fail(403,'Alleen de facilitator opent of sluit het debriefbord.');return applyBoardAction(r,action,{created,at:new Date().toISOString(),by:s.displayName||'Facilitator'});});
  if(board.status==='closed'){await settleBoard(board.proof);await proof.fence(board.proof);}
  res.json(boardView(board));
 }));
 app.get('/game/document',wrap(async(req,res)=>{const {r}=await browser(req);res.json(await proof.state(r));}));
 const screens=createScreenStore(presence);
 app.post('/game/screen-state',wrap(async(req,res)=>{await screens.save(screenBinding(await browser(req),req.body));res.status(204).end();}));
 app.post('/game/help',wrap(async(req,res)=>res.json(await store.withSession(token(req),'browser',({p})=>{if(!p)fail(400,'De facilitator heeft geen solo-profiel.');p.help=!p.help;return {help:p.help};}))));
 const currentQuiz=({r,p})=>{if(!p)fail(400,'Alleen deelnemers.');const pack=getDayPack(r.day);if(!pack)fail(400,`Geen contentpakket voor supportdag ${r.day}.`);return pack.quiz;};
 app.post('/game/quiz/start',wrap(async(req,res)=>res.json(await store.withSession(token(req),'browser',context=>{currentQuiz(context);return openQuizAttempt(context.p,context.r.day,Date.now());}))));
 app.post('/game/quiz',wrap(async(req,res)=>res.json(await store.withSession(token(req),'browser',context=>submitQuizAttempt(context.p,context.r.day,currentQuiz(context),req.body,Date.now())))));
 app.post('/game/route',wrap(async(req,res)=>{if(!['guided','standard','stretch'].includes(req.body.route))fail(400,'Ongeldige hulpkeuze.');await store.withSession(token(req),'browser',({r,p})=>{if(!p)fail(400,'Alleen deelnemers.');p.route=req.body.route;p.progressByDay??={};p.progressByDay[String(r.day)]={...p.progressByDay[String(r.day)],route:p.route};});res.json({ok:true});}));
 app.post('/game/agent-setup',wrap(async(req,res)=>{const {r,p}=await browser(req);if(!p)fail(403,'Neem als deelnemer deel om je eigen Claude te verbinden.');if(publicUrl.protocol!=='https:')fail(409,'De agentkoppeling is beschikbaar op de publieke HTTPS-versie.');const access=await store.rotateMcpToken(token(req));res.json({instructions:agentInstructions({origin:publicUrl.origin,roomId:r.id,participantId:p.id,accessToken:access.token}),expiresAt:Date.now()+12*60*60*1000,participantId:p.id,roomId:r.id});}));
 app.post('/game/mcp-token',wrap(async(req,res)=>res.json(await store.rotateMcpToken(token(req)))));
 function reviewer({r,s}){if(s.personId!=='facilitator'&&s.personId!==r.members[r.driver]?.id)fail(403,'Driver of facilitator beoordeelt het bewijs.');}
 async function commentQuote(r){const state=await proof.state(r);const quote=state.markdown.split('\n').find(line=>line.trim())?.replace(/^#+\s*/,'').trim();if(!quote)fail(409,'Het document heeft nog geen tekst voor commentaar.');return quote;}
 async function evidence(token,input){
  const {r,p,s}=await store.auth(token);if(!p)fail(403,'Alleen een deelnemer kan bewijs indienen.');
  const taskId=input.taskId==null||input.taskId===''?undefined:findTask(r.day,text(input.taskId,100)).id;
  const key=text(input.requestId,100),fields={finding:text(input.finding),command:text(input.command,1000),observed:text(input.observed),limitation:text(input.limitation),...(taskId?{taskId}:{})};
  const fingerprint=hash(JSON.stringify(fields));
  const canSubmit=({r,p},e)=>{if(e.taskId)transition(taskStatus(r,p.id,e.taskId,e.day),'submit');};
  const reserved=await store.reserveRequest(token,'evidence',key,fingerprint,{value:{id:randomUUID(),requestId:key,personId:p.id,name:p.name,source:s.kind==='mcp'?'MCP-client':'Deelnemer',...fields,day:r.day,at:new Date().toISOString(),status:'pending'},actor:`${s.kind==='mcp'?'ai':'human'}:${p.name}:${p.id}`,quote:await commentQuote(r)},context=>{if(!context.p)fail(403,'Alleen deelnemers.');canSubmit(context,{taskId,day:context.r.day});});
  if(reserved.completed)return reserved.result;
  const {value:e,actor,quote}=reserved.intent;
  await proof.comment(r,actor,`Bewijs ${e.id}\n${e.finding}\nControle: ${e.command}\nWaargenomen: ${e.observed}\nBeperking: ${e.limitation}\n${e.taskId?`Opdracht: ${e.taskId}\n`:''}Status: ingediend, nog niet door een mens beoordeeld.`,quote,`${p.id}:${key}`);
  return store.completeRequest(token,'evidence',key,fingerprint,({r,p})=>{canSubmit({r,p},e);r.evidence.push(e);if(p){p.progressByDay=p.progressByDay||{};const keyDay=String(e.day);const prev=p.progressByDay[keyDay]||{};p.progressByDay[keyDay]={...prev,evidenceCount:(prev.evidenceCount||0)+1,evidenceAt:e.at};}return e;});
 }
 app.post('/game/evidence',wrap(async(req,res)=>{await browser(req);res.json(await evidence(token(req),req.body));}));
 app.get('/game/tasks',wrap(async(req,res)=>{const {r,p}=await browser(req);if(!p)fail(403,'Alleen deelnemers hebben een eigen opdrachtenlijst.');res.json({day:r.day,tasks:taskTrail(r,p.id,r.day)});}));
 app.get('/game/tasks/peer',wrap(async(req,res)=>{const {r,p}=await browser(req);if(!p)fail(403,'Alleen deelnemers beoordelen elkaars opdrachten.');res.json(peerQueue(r,p.id));}));
 app.get('/game/tasks/queue',wrap(async(req,res)=>{const {r,s}=await browser(req);if(s.personId!=='facilitator')fail(403,'Alleen de facilitator ziet de beoordelingswachtrij.');res.json(reviewQueue(r));}));
 app.post('/game/review',wrap(async(req,res)=>{
  const {r,s,p}=await browser(req);
  if(!['accepted','needs-work'].includes(req.body.status))fail(400,'Ongeldige beoordeling.');
  const fields={id:text(req.body.id,100),status:req.body.status,note:text(req.body.note)},key=text(req.body.requestId,100),fingerprint=hash(JSON.stringify(fields));
  const sso=s.personId==='facilitator'?await store.facilitator(namedCookie(req,'academy-facilitator')):null;
  const reviewedBy={role:reviewerRole(s),name:sso?.name||p?.name||s.displayName||'Facilitator',email:sso?.email||null};
  const canReview=(context,e)=>{if(!e.taskId)return;authorizeTaskReview(context);transition(taskStatus(context.r,e.personId,e.taskId,e.day),reviewEvent(fields.status));};
  const saved=await store.reserveRequest(token(req),'review',key,fingerprint,{value:{...fields,by:s.personId,reviewer:reviewedBy,at:new Date().toISOString()},actor:`human:${s.personId}`,quote:await commentQuote(r)},context=>{const e=context.r.evidence.find(e=>e.id===fields.id);if(!e?.taskId)reviewer(context);if(!e)fail(404,'Bewijs niet gevonden.');if(e.personId===context.s.personId)fail(403,'Laat een andere deelnemer jouw bewijs beoordelen.');canReview(context,e);});if(saved.completed)return res.json(saved.result);
  const {value:intent,actor,quote}=saved.intent;await proof.comment(r,actor,`Review bewijs ${intent.id}: ${intent.status}\n${intent.note}`,quote,`review:${s.personId}:${key}`);
  res.json(await store.completeRequest(token(req),'review',key,fingerprint,context=>{const target=context.r.evidence.find(x=>x.id===intent.id);if(!target)fail(404,'Bewijs niet gevonden.');canReview(context,target);target.status=intent.status;target.review={by:intent.by,reviewer:intent.reviewer,note:intent.note,at:intent.at};return target;}));
 }));
 app.post('/game/handoff',wrap(async(req,res)=>{
  const {r,s}=await browser(req);
  const fields={decision:text(req.body.decision),checked:text(req.body.checked),open:text(req.body.open)},key=text(req.body.requestId,100),fingerprint=hash(JSON.stringify(fields));
  const saved=await store.reserveRequest(token(req),'handoff',key,fingerprint,{value:{id:randomUUID(),day:r.day,by:s.personId,...fields,next:r.members[(r.driver+1)%r.members.length]?.name||'Nog te bepalen',at:new Date().toISOString()},actor:`human:${s.personId}`,quote:await commentQuote(r)},reviewer);if(saved.completed)return res.json(saved.result);
  const {value:h,actor,quote}=saved.intent;await proof.comment(r,actor,`Overdracht\nBesluit: ${h.decision}\nGecontroleerd: ${h.checked}\nOpen: ${h.open}\nVolgende eigenaar: ${h.next}`,quote,h.id);
  res.json(await store.completeRequest(token(req),'handoff',key,fingerprint,context=>{context.r.handoffs.push(h);return h;}));
 }));

 // Slide decks (Effect-TS module, server/slides). Same squad session, no model call.
 const deckActor=({r,s,p})=>({roomId:r.id,id:s.personId,name:p?.name||s.displayName||'Facilitator',role:s.personId==='facilitator'?'facilitator':'participant',source:s.kind==='mcp'?'ai':'human'});
 const deckId=req=>String(req.params.deckId||'');
 app.get('/game/decks',wrap(async(req,res)=>res.json(await slides.run('listDecks',deckActor(await browser(req))))));
 app.post('/game/decks',wrap(async(req,res)=>res.status(201).json(await slides.run('createDeck',deckActor(await browser(req)),req.body))));
 app.get('/game/decks/:deckId',wrap(async(req,res)=>res.json(await slides.run('getDeck',deckActor(await browser(req)),{deckId:deckId(req),slideId:req.query.slideId||undefined,compact:req.query.compact==='true'}))));
 app.post('/game/decks/:deckId/slides',wrap(async(req,res)=>res.status(201).json(await slides.run('addSlide',deckActor(await browser(req)),{...req.body,deckId:deckId(req)}))));
 app.patch('/game/decks/:deckId/slides/:slideId',wrap(async(req,res)=>res.json(await slides.run('updateSlide',deckActor(await browser(req)),{...req.body,deckId:deckId(req),slideId:String(req.params.slideId)}))));
 app.patch('/game/decks/:deckId',wrap(async(req,res)=>res.json(await slides.run('patchDeck',deckActor(await browser(req)),{...req.body,deckId:deckId(req)}))));
 app.post('/game/decks/:deckId/duplicate',wrap(async(req,res)=>res.status(201).json(await slides.run('duplicateDeck',deckActor(await browser(req)),{deckId:deckId(req)}))));
 app.delete('/game/decks/:deckId',wrap(async(req,res)=>res.json(await slides.run('deleteDeck',deckActor(await browser(req)),{deckId:deckId(req)}))));
 app.get('/game/decks/:deckId/export.html',wrap(async(req,res)=>{const result=await slides.run('exportHtml',deckActor(await browser(req)),{deckId:deckId(req)});res.type('text/html').set('Content-Disposition',`attachment; filename="${result.filename}"`).set('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src https: data:; font-src https: data:").send(result.html);}));
 async function executeMcp(token,tool,input){const a=await store.auth(token,'mcp');const {r,p}=a;if(!p)fail(403,'Geen deelnemer.');let result;
  switch(tool){case 'get_mission':{const pack=getDayPack(r.day);result={session:{roomId:r.id,participantId:p.id,participantName:p.name,squadName:r.name},mission:pack?.mission||mission,day:r.day,phase:r.phase,route:p.route,role:r.members[r.driver]?.id===p.id?'Driver':'Navigator',tasks:taskTrail(r,p.id,r.day),coach:'Leg begrippen uit, citeer les-IDs, pas hints aan de hulpkeuze aan. Lees eerst de gedeelde intent. Geen browserchat of model-API vanuit de game.'};break;}
  case 'get_document':result=await proof.state(r);break;
  case 'get_screen_state':result=await readScreenState(a,screens);break;
  case 'search_knowledge':result={lessons:searchKnowledge(String(input.query||''))};break;
  case 'submit_evidence':result=await evidence(token,input);break;
  case 'list_decks':case 'get_deck':case 'create_deck':case 'add_slide':case 'update_slide':case 'patch_deck':case 'export_deck_html':{const action={list_decks:'listDecks',get_deck:'getDeck',create_deck:'createDeck',add_slide:'addSlide',update_slide:'updateSlide',patch_deck:'patchDeck',export_deck_html:'exportHtml'}[tool];result=await slides.run(action,deckActor(a),input||{});break;}
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
 app.get('/game/starter/:file',wrap(async(req,res)=>{await browser(req);if(!starterFileNames.includes(req.params.file))fail(404,'Bestand niet gevonden.');res.type('text/plain').send(readFileSync(path.join(root,'starter',req.params.file),'utf8'));}));

 const resolvePortalActor=async req=>{
  const facilitator=await store.facilitator(namedCookie(req,'academy-facilitator'));
  if(facilitator)return {ownerId:facilitator.sub||facilitator.email,role:'facilitator',name:facilitator.name,email:facilitator.email,roomId:null,via:'facilitator-cookie'};
  if(typeof req.body?.hostKey==='string'&&req.body.hostKey){
   const key=Buffer.from(hash(req.body.hostKey));
   if(timingSafeEqual(key,Buffer.from(hash(hostKey))))return {ownerId:'host-key',role:'facilitator',name:'Facilitator',email:null,roomId:null,via:'host-key'};
  }
  try{
   const {r,s,p}=await browser(req);
   if(s.personId==='facilitator')return {ownerId:'room-facilitator:'+r.id,role:'facilitator',name:s.displayName||'Facilitator',email:null,roomId:r.id,via:'room-session'};
   return {ownerId:p?.id||s.personId,role:'participant',name:p?.name||s.displayName||'Deelnemer',email:null,roomId:r.id,via:'room-session'};
  }catch{fail(401,'Log in als facilitator of open een kamer om de portal te gebruiken.');}
 };
 app.get('/game/apps',wrap(async(_req,res)=>res.json({apps:portal.listLauncherApps(),inventory:portal.inventory()})));
 app.post('/game/apps/:appId/launch',wrap(async(req,res)=>{
  const actor=await resolvePortalActor(req);
  portal.ownership.assertCanLaunch({appId:req.params.appId,actor});
  const appMeta=portal.listLauncherApps().find(a=>a.id===req.params.appId);
  if(!appMeta)fail(404,'Onbekende app.');
  if(!appMeta.launchable)fail(409,appMeta.blockedBy?`App geblokkeerd door ${appMeta.blockedBy}.`:'App nog niet launchbaar.');
  const grant=portal.ownership.grant({appId:req.params.appId,ownerKind:actor.role==='facilitator'?'facilitator':'participant',ownerId:actor.ownerId,orgId:req.body?.orgId||null,resourceId:req.body?.resourceId||actor.roomId||null,role:actor.role,grantedBy:actor.ownerId});
  const returnTo=typeof req.body?.returnTo==='string'&&req.body.returnTo.startsWith(publicUrl.origin)?req.body.returnTo:publicUrl.origin+'/?view=apps';
  const ticket=portal.launch.mint({appId:req.params.appId,actor,returnTo,grantId:grant.id,targetOrigin:appMeta.origin||publicUrl.origin});
  res.json({grantId:grant.id,launch:ticket,backToAcademy:returnTo});
 }));
 app.post('/game/apps/grants/:grantId/revoke',wrap(async(req,res)=>{
  const actor=await resolvePortalActor(req);
  res.json(portal.ownership.revoke({grantId:req.params.grantId,actorId:actor.ownerId}));
 }));
 app.post('/game/apps/:appId/publish',wrap(async(req,res)=>{
  const actor=await resolvePortalActor(req);
  if(actor.role!=='facilitator')fail(403,'Alleen de facilitator publiceert immutable Academy-versies.');
  const contentRef=req.body?.contentRef||{kind:'day-pack',day:Number(req.body?.day||1)};
  const artifact=await portal.adapters.publishImmutable({appId:req.params.appId,contentRef,actor,resourceId:req.body?.resourceId||null});
  res.status(201).json({id:artifact.id,contentSha256:artifact.contentSha256,publishedAt:artifact.publishedAt,publisher:artifact.publisher,sourceRef:artifact.sourceRef});
 }));
 app.post('/game/apps/:appId/pin',wrap(async(req,res)=>{
  const actor=await resolvePortalActor(req);
  const roomId=text(req.body?.roomId||actor.roomId||'',60);
  res.json(portal.adapters.pinClassroom({roomId,publishedId:text(req.body?.publishedId,80),actor}));
 }));
 app.get('/game/apps/:appId/published/:publishedId',wrap(async(req,res)=>{
  const artifact=portal.adapters.getPublished(req.params.publishedId);
  if(!artifact||artifact.appId!==req.params.appId)fail(404,'Publicatie niet gevonden.');
  res.json({id:artifact.id,appId:artifact.appId,contentSha256:artifact.contentSha256,publishedAt:artifact.publishedAt,publisher:artifact.publisher,sourceRef:artifact.sourceRef,body:artifact.body});
 }));
 app.post('/game/portal/verify-ticket',wrap(async(req,res)=>{
  const claims=portal.launch.verify(req.body?.ticket);
  res.json({claims,backToAcademy:claims.returnTo});
 }));
 app.get('/game/health',wrap(async(_req,res)=>{let connected=false;try{connected=(await fetch(proofBase+'/health',{signal:AbortSignal.timeout(2000)})).ok;}catch{}res.json({ok:true,proof:connected,revision:process.env.VERCEL_GIT_COMMIT_SHA||process.env.SOURCE_REVISION||null});}));
 const arcadeLabDist=path.join(root,'apps/arcade-lab/dist');
 app.use('/arcade-lab',express.static(arcadeLabDist,{index:false,fallthrough:true}));
 app.get(['/arcade-lab','/arcade-lab/'],(_req,res)=>{
  const index=path.join(arcadeLabDist,'index.html');
  if(!existsSync(index))return res.status(503).type('text').send('arcade-lab not built');
  return res.sendFile(index);
 });
 // apps/web SPA (Classroom / deck / workshop / lesson / live) — AET-75+ routes live in apps/web, not root dist/
 const webIndex=path.join(webDist,'index.html');
 const isWebSpaPath=p=>p==='/deck'||p.startsWith('/classroom/')||p.startsWith('/workshop/')||p==='/lesson'||p.startsWith('/lesson/')||p.startsWith('/live/');
 app.use(express.static(webDist,{index:false,fallthrough:true}));
 app.use((req,res,next)=>{
  if(req.method!=='GET'&&req.method!=='HEAD')return next();
  if(!isWebSpaPath(req.path))return next();
  if(!existsSync(webIndex))return res.status(503).type('text').send('apps/web not built');
  return res.sendFile(webIndex);
 });
 app.use(express.static(path.join(root,'dist')));app.get('/',(_req,res)=>res.sendFile(path.join(root,'dist/index.html')));app.use((req,res,next)=>{if(req.method==='GET'&&(req.path==='/arcade'||req.path.startsWith('/arcade/')))return res.sendFile(path.join(root,'dist/index.html'));return next();});
 app.use((e,req,res,_next)=>{if(!e.status)console.error('[academy] unhandled',{method:req.method,path:req.path,message:e?.message,stack:e?.stack});return res.status(e.status||500).json({error:e.status?e.message:'Onverwachte serverfout. Probeer opnieuw; je invoer blijft staan.'});});
 const server=http.createServer(app);server.on('upgrade',async(req,socket,head)=>{try{const {r,s}=await browser(req);if(s.readOnly)fail(403,READ_ONLY_MESSAGE);const url=new URL(req.url,'http://localhost');if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`&&req.headers.origin!==`https://${req.headers.host}`)fail(403,'Origin');if(url.pathname!=='/ws'||!url.searchParams.get('slug')||!roomDocument(r,url.searchParams.get('slug')))fail(403,'Kamer');if(s.expiresAt){const sockets=liveSockets.get(s.personId)||new Set();liveSockets.set(s.personId,sockets.add(socket));const expiry=setTimeout(()=>socket.destroy(),Math.max(0,s.expiresAt-Date.now()));socket.once('close',()=>{clearTimeout(expiry);sockets.delete(socket);if(!sockets.size)liveSockets.delete(s.personId);});}proxy.ws(req,socket,head);}catch(e){console.warn('WS denied',new URL(req.url,'http://localhost').pathname,e.message);socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');socket.destroy();}});
 return {app,server,store,proof,slides,portal};
}
