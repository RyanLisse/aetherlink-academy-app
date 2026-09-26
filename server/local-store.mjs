import {randomUUID} from 'node:crypto';
import {Store,hash,fail,writable,MAX_SQUAD_SIZE} from './store.mjs';
import {INVALID_COHORT_CODE_MESSAGE,COHORT_NO_ROOM_MESSAGE,COHORT_RATE_LIMIT_MESSAGE,attemptKeys,nextAttempt,issueAccessCode,sessionGrant,mergeSeatProgress,seatMember,cohortView,isDueForPurge,anonymizeRoom,dueCertificates,memberCertificate} from './cohort.mjs';
import {COACH_RETENTION_MS} from './coach.mjs';
import {EMAIL_CODE_INVALID_MESSAGE,EMAIL_PARTICIPANT_ONLY_MESSAGE,EMAIL_RATE_LIMIT_MESSAGE,challengeKey,checkChallenge,emailAttemptKeys,issueChallenge} from './email-login.mjs';
export class LocalStore extends Store {
 constructor(dir,options){super(dir,options);this.data.emails??={};this.data.emailChallenges??={};this.queue=Promise.resolve();}
 async locked(fn){
  const run=this.queue.then(async()=>{const before=structuredClone(this.data);try{const result=await fn();this.save();return result;}catch(error){this.data=before;throw error;}});
  this.queue=run.catch(()=>{});return run;
 }
 withSession(token,kind,fn){return this.locked(()=>fn(writable(this.auth(token,kind))));}
 logout(token){return this.locked(()=>{this.auth(token,'browser');delete this.data.sessions[hash(token)];});}
 rotateMcpToken(token){return this.locked(()=>{const {r,p,s:browser}=writable(this.auth(token,'browser'));if(!p)fail(403,'Gebruik hiervoor een deelnemerssessie.');for(const [key,s] of Object.entries(this.data.sessions))if(s.roomId===r.id&&s.personId===p.id&&s.kind==='mcp')delete this.data.sessions[key];return {token:this.session(r.id,p.id,'mcp',undefined,p.cohortMemberId?{expiresAt:browser.expiresAt}:undefined)};});}
 reserveRequest(token,kind,requestId,payloadHash,intent,validate=()=>{}){return this.withSession(token,undefined,async context=>{const {r,s}=context;const key=JSON.stringify([s.personId,kind,requestId]);r.requests??={};const old=r.requests[key];if(old){if(old.payloadHash!==payloadHash)fail(409,'Dit verzoeknummer is al gebruikt met andere invoer.');return old;}await validate(context);return r.requests[key]={payloadHash,intent,result:null,completed:false};});}
 completeRequest(token,kind,requestId,payloadHash,apply){return this.withSession(token,undefined,async context=>{const key=JSON.stringify([context.s.personId,kind,requestId]);const request=context.r.requests?.[key];if(!request)fail(404,'Verzoek niet gevonden.');if(request.payloadHash!==payloadHash)fail(409,'Dit verzoeknummer is al gebruikt met andere invoer.');if(request.completed)return request.result;request.result=await apply(context,request.intent);request.completed=true;return request.result;});}
 cohortRooms(cohortId){return Object.values(this.data.rooms).filter(room=>room.cohortId===cohortId).sort((a,b)=>a.cohortAttachedAt-b.cohortAttachedAt);}
 cohortCodes(cohortId){return Object.values(this.data.accessCodes).filter(code=>code.cohortId===cohortId);}
 cohortOr404(cohortId){const cohort=this.data.cohorts[cohortId];if(!cohort)fail(404,'Cohort niet gevonden.');return cohort;}
 memberOr404(cohort,memberId){const member=cohort.members.find(candidate=>candidate.id===memberId);if(!member)fail(404,'Deelnemer niet gevonden in dit cohort.');return member;}
 issueCode(cohortId,memberId){const {code,codeHash}=issueAccessCode();this.data.accessCodes[codeHash]={cohortId,memberId,createdAt:this.now(),revokedAt:null,lastActivatedAt:null};return code;}
 addMembers(cohort,names){return names.map(name=>{const member={id:randomUUID(),name,createdAt:this.now()};cohort.members.push(member);return {memberId:member.id,name,code:this.issueCode(cohort.id,member.id)};});}
 cohortCertificates(cohortId){return Object.values(this.data.certificates).filter(certificate=>certificate.cohortId===cohortId);}
 cohortSnapshot(cohort){return cohortView(this.cohortFacts(cohort));}
 createCohort(input,names,createdBy){return this.locked(()=>{const cohort={id:randomUUID(),...input,currentRoomId:null,createdBy:createdBy||null,createdAt:this.now(),members:[]};this.data.cohorts[cohort.id]=cohort;const codes=this.addMembers(cohort,names);return {cohort:this.cohortSnapshot(cohort),codes};});}
 addCohortMembers(cohortId,names){return this.locked(()=>{const cohort=this.cohortOr404(cohortId);if(names.some(name=>cohort.members.some(member=>member.name.toLowerCase()===name.toLowerCase())))fail(409,'Deze naam staat al in dit cohort.');return {codes:this.addMembers(cohort,names)};});}
 attachCohortRoom(cohortId,roomId){return this.locked(()=>{const cohort=this.cohortOr404(cohortId),room=this.data.rooms[roomId];if(!room)fail(404,'Kamer bestaat niet.');if(room.cohortId&&room.cohortId!==cohortId)fail(409,'Deze kamer hoort al bij een ander cohort.');room.cohortId=cohortId;room.cohortAttachedAt=this.now();room.version++;cohort.currentRoomId=roomId;return this.cohortSnapshot(cohort);});}
 revokeMember(cohort,memberId){this.memberOr404(cohort,memberId);for(const code of Object.values(this.data.accessCodes))if(code.memberId===memberId&&!code.revokedAt)code.revokedAt=this.now();for(const [key,session] of Object.entries(this.data.sessions))if(session.personId===memberId)delete this.data.sessions[key];}
 revokeCohortMember(cohortId,memberId){return this.locked(()=>{const cohort=this.cohortOr404(cohortId);this.revokeMember(cohort,memberId);return this.cohortSnapshot(cohort);});}
 reissueCohortCode(cohortId,memberId){return this.locked(()=>{const cohort=this.cohortOr404(cohortId);this.revokeMember(cohort,memberId);const member=this.memberOr404(cohort,memberId);return {memberId,name:member.name,code:this.issueCode(cohortId,memberId)};});}
 cohortFacts(cohort){return {cohort,members:cohort.members,codes:this.cohortCodes(cohort.id),rooms:this.cohortRooms(cohort.id),certificates:this.cohortCertificates(cohort.id),now:this.now()};}
 settleCertificates(cohort){for(const certificate of dueCertificates(this.cohortFacts(cohort)))this.data.certificates[certificate.id]=certificate;}
 myCertificate(token){return this.locked(()=>{
  const {r,p}=this.auth(token,'browser');
  const cohort=p?.cohortMemberId&&this.data.cohorts[r.cohortId];
  if(!cohort)return null;
  this.settleCertificates(cohort);
  const facts=this.cohortFacts(cohort);
  return {cohortName:cohort.name,days:cohort.days,...memberCertificate({...facts,memberId:p.cohortMemberId,codes:facts.codes.filter(code=>code.memberId===p.cohortMemberId)})};
 });}
 revokeCertificate(cohortId,certificateId){return this.locked(()=>{const cohort=this.cohortOr404(cohortId),certificate=this.data.certificates[certificateId];if(!certificate||certificate.cohortId!==cohortId)fail(404,'Certificaat niet gevonden in dit cohort.');certificate.revokedAt??=this.now();return this.cohortSnapshot(cohort);});}
 async certificate(id){return this.data.certificates[id]||null;}
 cohortOverview(){return this.locked(()=>Object.values(this.data.cohorts).sort((a,b)=>b.createdAt-a.createdAt).map(cohort=>{this.settleCertificates(cohort);return this.cohortSnapshot(cohort);}));}
 // Daily coach counters: all keys move together, and only when every one is under its cap.
 coachQuota(keys,{consume=false}={}){return this.locked(()=>{const now=this.now();for(const [key,record] of Object.entries(this.data.attempts))if(key.startsWith('coach:')&&now-record.windowStartedAt>COACH_RETENTION_MS)delete this.data.attempts[key];const counts=keys.map(([key])=>this.data.attempts[key]?.count||0),allowed=keys.every(([,max],i)=>counts[i]<max);if(!consume||!allowed)return {allowed,counts};keys.forEach(([key],i)=>{this.data.attempts[key]={windowStartedAt:this.data.attempts[key]?.windowStartedAt??now,count:counts[i]+1};});return {allowed,counts:counts.map(c=>c+1)};});}
 consumeAttempts(keys){const now=this.now();let ok=true;for(const [key,limit] of keys){const {record,allowed}=nextAttempt(this.data.attempts[key],now,limit);this.data.attempts[key]=record;ok&&=allowed;}return ok;}
 seatCohortSession(cohort,member,now){
  const grant=sessionGrant(cohort,now),room=this.data.rooms[cohort.currentRoomId];
  if(!room)fail(409,COHORT_NO_ROOM_MESSAGE);
  if(!room.members.some(seat=>seat.id===member.id)&&room.members.length>=MAX_SQUAD_SIZE)fail(409,`Squad is vol (maximaal ${MAX_SQUAD_SIZE}).`);
  seatMember(room,member,mergeSeatProgress(this.cohortRooms(cohort.id),member.id),now);room.version++;
  return {token:this.session(room.id,member.id,'browser',member.name,grant),roomId:room.id,cohortId:cohort.id,readOnly:grant.readOnly};
 }
 async activateCohortCode(input,{ip}={}){
  const {normalized,codeHash,keys}=attemptKeys(input,ip);
  const allowed=await this.locked(()=>this.consumeAttempts(keys));
  if(!allowed)fail(429,COHORT_RATE_LIMIT_MESSAGE);
  return this.locked(()=>{
   const now=this.now(),record=normalized&&this.data.accessCodes[codeHash];
   if(!record||record.revokedAt)fail(401,INVALID_COHORT_CODE_MESSAGE);
   const cohort=this.data.cohorts[record.cohortId],member=cohort?.members.find(candidate=>candidate.id===record.memberId);
   if(!member)fail(401,INVALID_COHORT_CODE_MESSAGE);
   const session=this.seatCohortSession(cohort,member,now);
   record.lastActivatedAt=now;
   return session;
  });
 }
 emailIdentity(token){
  const {r,p}=this.auth(token,'browser');
  if(!p)fail(403,EMAIL_PARTICIPANT_ONLY_MESSAGE);
  return {personId:p.id,roomId:p.cohortMemberId?null:r.id,cohortMemberId:p.cohortMemberId||null};
 }
 emailStatus(token){return this.locked(()=>({email:this.data.emails[this.emailIdentity(token).personId]?.email||null}));}
 issueEmailChallenge(key,email,ip){
  if(!this.consumeAttempts(emailAttemptKeys(email,ip)))fail(429,EMAIL_RATE_LIMIT_MESSAGE);
  const now=this.now();
  for(const [candidate,record] of Object.entries(this.data.emailChallenges))if(record.expiresAt<=now)delete this.data.emailChallenges[candidate];
  const {code,record}=issueChallenge(this.data.emailChallenges[key],now);
  this.data.emailChallenges[key]=record;
  return code;
 }
 checkEmailChallenge(key,code){
  const {ok,record}=checkChallenge(this.data.emailChallenges[key],code,this.now());
  if(record)this.data.emailChallenges[key]=record;else delete this.data.emailChallenges[key];
  return ok;
 }
 startEmailAttach(token,email,{ip}={}){return this.locked(()=>{const {personId}=this.emailIdentity(token);return {code:this.issueEmailChallenge(challengeKey('attach',email,personId),email,ip)};});}
 async verifyEmailAttach(token,email,code){
  const verified=await this.locked(()=>{const identity=this.emailIdentity(token);return this.checkEmailChallenge(challengeKey('attach',email,identity.personId),code)&&identity;});
  if(!verified)fail(401,EMAIL_CODE_INVALID_MESSAGE);
  return this.locked(()=>{
   for(const [personId,binding] of Object.entries(this.data.emails))if(binding.email===email)delete this.data.emails[personId];
   this.data.emails[verified.personId]={email,roomId:verified.roomId,cohortMemberId:verified.cohortMemberId,verifiedAt:this.now()};
   return {email};
  });
 }
 removeEmail(token){return this.locked(()=>{delete this.data.emails[this.emailIdentity(token).personId];return {email:null};});}
 emailBinding(email){return Object.entries(this.data.emails).find(([,binding])=>binding.email===email);}
 startEmailLogin(email,{ip}={}){return this.locked(()=>{const code=this.issueEmailChallenge(challengeKey('login',email),email,ip);return {code:this.emailBinding(email)?code:null};});}
 async verifyEmailLogin(email,code){
  const ok=await this.locked(()=>this.checkEmailChallenge(challengeKey('login',email),code));
  return this.locked(()=>{
   const [personId,binding]=(ok&&this.emailBinding(email))||[];
   if(!binding)fail(401,EMAIL_CODE_INVALID_MESSAGE);
   if(binding.cohortMemberId){
    const member=Object.values(this.data.cohorts).flatMap(cohort=>cohort.members.map(candidate=>({cohort,candidate}))).find(({candidate})=>candidate.id===binding.cohortMemberId);
    if(!member||!this.cohortCodes(member.cohort.id).some(entry=>entry.memberId===personId&&!entry.revokedAt))fail(401,INVALID_COHORT_CODE_MESSAGE);
    return this.seatCohortSession(member.cohort,member.candidate,this.now());
   }
   const room=this.data.rooms[binding.roomId],p=room?.members.find(member=>member.id===personId);
   if(!p)fail(401,EMAIL_CODE_INVALID_MESSAGE);
   return {token:this.session(room.id,p.id,'browser',p.name),roomId:room.id,resumed:true};
  });
 }
 purgeExpiredCohorts({dryRun=true}={}){return this.locked(()=>{
  const now=this.now(),due=Object.values(this.data.cohorts).filter(cohort=>isDueForPurge(cohort,now));
  const report=due.map(cohort=>({cohortId:cohort.id,members:cohort.members.length,rooms:this.cohortRooms(cohort.id).map(room=>room.id),certificates:this.cohortCertificates(cohort.id).length}));
  if(dryRun)return {dryRun,purged:report};
  for(const cohort of due){
   const ids=cohort.members.map(member=>member.id),idSet=new Set(ids);
   for(const room of this.cohortRooms(cohort.id)){anonymizeRoom(room,ids);room.requests={};}
   for(const [key,session] of Object.entries(this.data.sessions))if(idSet.has(session.personId))delete this.data.sessions[key];
   for(const id of ids)delete this.data.emails[id];
   for(const [key,code] of Object.entries(this.data.accessCodes))if(code.cohortId===cohort.id)delete this.data.accessCodes[key];
   for(const certificate of this.cohortCertificates(cohort.id))delete this.data.certificates[certificate.id];
   delete this.data.cohorts[cohort.id];
  }
  return {dryRun,purged:report};
 });}
}
