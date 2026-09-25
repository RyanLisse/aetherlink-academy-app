import {randomBytes} from 'node:crypto';
import {fail,hash} from './store.mjs';
import {certificateEligibility} from './certificate.mjs';

export const DAY_MS=24*60*60*1000;
export const ACCESS_DAYS=90;
export const READ_ONLY_DAYS=14;
export const RETENTION_DAYS=180;
export const SESSION_MS=12*60*60*1000;
export const ANONYMIZED_NAME='Geanonimiseerd';
export const INVALID_COHORT_CODE_MESSAGE='Deze cohortcode is ongeldig of ingetrokken.';
export const COHORT_EXPIRED_MESSAGE='Je cohorttoegang is verlopen.';
export const COHORT_NO_ROOM_MESSAGE='Je cohort heeft nog geen actieve kamer. Vraag je facilitator.';
export const COHORT_RATE_LIMIT_MESSAGE='Te veel pogingen met een cohortcode. Wacht even en probeer opnieuw.';
export {READ_ONLY_MESSAGE,COHORT_ROOM_JOIN_MESSAGE} from './store.mjs';

// Crockford base32 without I, L, O, U: typeable, unambiguous when read aloud.
const ALPHABET='0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const CODE_LENGTH=16;

export function generateAccessCode(){
 const bytes=randomBytes(CODE_LENGTH);
 const chars=[...bytes].map(byte=>ALPHABET[byte&31]).join('');
 return chars.match(/.{4}/g).join('-');
}

export function issueAccessCode(){const code=generateAccessCode();return {code,codeHash:hash(normalizeAccessCode(code))};}

export function attemptKeys(input,ip){
 const normalized=normalizeAccessCode(input);
 return {normalized,codeHash:normalized?hash(normalized):null,keys:[[`code:${hash(normalized||String(input||''))}`,RATE_LIMITS.code],[`ip:${hash(String(ip||'unknown'))}`,RATE_LIMITS.ip]]};
}

export function nextAttempt(record,now,{max,windowMs}){
 const next=!record||now-record.windowStartedAt>=windowMs?{windowStartedAt:now,count:1}:{windowStartedAt:record.windowStartedAt,count:record.count+1};
 return {record:next,allowed:next.count<=max};
}

export function normalizeAccessCode(input){
 const cleaned=String(input||'').toUpperCase().replace(/[\s-]/g,'').replace(/O/g,'0').replace(/[IL]/g,'1');
 return cleaned.length===CODE_LENGTH&&[...cleaned].every(char=>ALPHABET.includes(char))?cleaned:null;
}

export const RATE_LIMITS={
 code:{max:5,windowMs:60*60*1000},
 ip:{max:20,windowMs:15*60*1000},
};

export function cohortWindow(cohort){
 const activeEndsAt=cohort.startsAt+ACCESS_DAYS*DAY_MS;
 const endsAt=cohort.startsAt+cohort.days*DAY_MS;
 return {
  activeEndsAt,
  readOnlyEndsAt:cohort.readOnlyExport?activeEndsAt+READ_ONLY_DAYS*DAY_MS:activeEndsAt,
  endsAt,
  purgeAt:endsAt+RETENTION_DAYS*DAY_MS,
 };
}

export function accessPhase(cohort,now){
 const window=cohortWindow(cohort);
 if(now<window.activeEndsAt)return {phase:'active',readOnly:false,until:window.activeEndsAt};
 if(now<window.readOnlyEndsAt)return {phase:'read-only',readOnly:true,until:window.readOnlyEndsAt};
 return {phase:'closed',readOnly:true,until:window.readOnlyEndsAt};
}

export function sessionGrant(cohort,now){
 const access=accessPhase(cohort,now);
 if(access.phase==='closed')fail(403,COHORT_EXPIRED_MESSAGE);
 return {readOnly:access.readOnly,expiresAt:Math.min(now+SESSION_MS,access.until)};
}

export function isDueForPurge(cohort,now){return now>=cohortWindow(cohort).purgeAt;}

// Every activation copies the merged progress into the seat it lands in, so the most recently
// seated room already holds everything older seats had: merge by seat time, latest wins.
export function mergeSeatProgress(rooms,memberId){
 const seats=rooms.map(room=>room.members.find(member=>member.id===memberId)).filter(Boolean).sort((a,b)=>(a.seatedAt||0)-(b.seatedAt||0));
 const merged={};
 for(const seat of seats)for(const [day,progress] of Object.entries(seat.progressByDay||{}))merged[day]={...merged[day],...progress};
 return merged;
}

export function seatMember(room,member,progressByDay,now){
 const today=progressByDay[String(room.day)];
 const quiz=today?.quizScore!=null?{score:today.quizScore,at:today.quizAt,day:room.day}:null;
 const existing=room.members.find(seat=>seat.id===member.id);
 if(existing){Object.assign(existing,{name:member.name,progressByDay,seatedAt:now,route:today?.route||existing.route,quiz:quiz||existing.quiz});return existing;}
 const seat={id:member.id,cohortMemberId:member.id,seatedAt:now,name:member.name,help:false,quiz,route:today?.route||'standard',progressByDay,lastMcp:null};
 room.members.push(seat);
 return seat;
}

export function anonymizeRoom(room,memberIds){
 const ids=new Set(memberIds);
 const names=new Set(room.members.filter(member=>ids.has(member.id)).map(member=>member.name));
 for(const member of room.members)if(ids.has(member.id))Object.assign(member,{name:ANONYMIZED_NAME,help:false,quiz:null,route:'standard',progressByDay:{},lastMcp:null});
 room.evidence=(room.evidence||[]).filter(item=>!ids.has(item.personId));
 for(const item of room.evidence)if(item.review&&ids.has(item.review.by))item.review={...item.review,by:ANONYMIZED_NAME,note:ANONYMIZED_NAME};
 for(const handoff of room.handoffs||[])if(ids.has(handoff.by))Object.assign(handoff,{by:ANONYMIZED_NAME,decision:ANONYMIZED_NAME,checked:ANONYMIZED_NAME,open:ANONYMIZED_NAME});
 for(const handoff of room.handoffs||[])if(names.has(handoff.next))handoff.next=ANONYMIZED_NAME;
 delete room.cohortId;
 delete room.cohortAttachedAt;
 room.version=(room.version||0)+1;
 return room;
}

export function memberStatus(codes){
 const live=codes.find(code=>!code.revokedAt);
 if(!live)return {status:'revoked',lastActivatedAt:null};
 return {status:live.lastActivatedAt?'activated':'issued',lastActivatedAt:live.lastActivatedAt||null};
}

// Certificates are issued by the server, never by a facilitator click: whenever a member's
// status is evaluated (participant opens "Mijn certificaat", facilitator opens the roster) and the
// member is eligible with no certificate on record, one is created. A revoked certificate stays on
// record, so revocation is final and is never undone by auto-issuance.
export function memberCertificate({cohort,memberId,codes,rooms,certificates,now}){
 const own=certificates.filter(certificate=>certificate.memberId===memberId);
 const live=own.find(certificate=>!certificate.revokedAt);
 const revoked=own.filter(certificate=>certificate.revokedAt).sort((a,b)=>b.revokedAt-a.revokedAt)[0];
 const eligibility=certificateEligibility({
  days:cohort.days,
  progressByDay:mergeSeatProgress(rooms,memberId),
  evidence:rooms.flatMap(room=>(room.evidence||[]).filter(item=>item.personId===memberId)),
  accessRevoked:memberStatus(codes).status==='revoked',
  lastDayStarted:now>=cohort.startsAt+(cohort.days-1)*DAY_MS,
 });
 const status=live?'issued':revoked?'revoked':eligibility.eligible?'due':'not-eligible';
 return {...eligibility,status,id:live?.id||null,issuedAt:live?.issuedAt||null,revokedAt:live?null:revoked?.revokedAt||null};
}

export function dueCertificates({cohort,members,codes,rooms,certificates,now}){
 return members
  .filter(member=>memberCertificate({cohort,memberId:member.id,codes:codes.filter(code=>code.memberId===member.id),rooms,certificates,now}).status==='due')
  .map(member=>({id:generateAccessCode(),cohortId:cohort.id,memberId:member.id,name:member.name,cohortName:cohort.name,startsAt:cohort.startsAt,endsAt:cohortWindow(cohort).endsAt,days:cohort.days,issuedAt:now,issuedBy:null,revokedAt:null}));
}

export const certificateVerifiableUntil=certificate=>certificate.endsAt+RETENTION_DAYS*DAY_MS;

export function cohortView({cohort,members,codes,rooms,certificates,now}){
 const current=rooms.find(room=>room.id===cohort.currentRoomId);
 return {
  id:cohort.id,name:cohort.name,startsAt:cohort.startsAt,days:cohort.days,readOnlyExport:cohort.readOnlyExport,createdAt:cohort.createdAt,
  phase:accessPhase(cohort,now).phase,...cohortWindow(cohort),
  currentRoomId:cohort.currentRoomId||null,
  rooms:rooms.map(room=>({id:room.id,name:room.name,code:room.code})),
  members:[...members].sort((a,b)=>a.name.localeCompare(b.name)).map(member=>{const own=codes.filter(code=>code.memberId===member.id);return {id:member.id,name:member.name,...memberStatus(own),seated:Boolean(current?.members.some(seat=>seat.id===member.id)),certificate:memberCertificate({cohort,memberId:member.id,codes:own,rooms,certificates,now})};}),
 };
}

export function parseCohortInput({name,startDate,days,readOnlyExport=true}){
 if(typeof name!=='string'||!name.trim()||name.length>60)fail(400,'Geef het cohort een naam (maximaal 60 tekens).');
 if(typeof startDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(startDate))fail(400,'Kies een startdatum (JJJJ-MM-DD).');
 const startsAt=Date.parse(`${startDate}T00:00:00Z`);
 if(!Number.isFinite(startsAt)||new Date(startsAt).toISOString().slice(0,10)!==startDate)fail(400,'Kies een geldige startdatum.');
 const dayCount=Number(days);
 if(!Number.isInteger(dayCount)||dayCount<1||dayCount>14)fail(400,'Kies 1 tot 14 cohortdagen.');
 return {name:name.trim(),startsAt,days:dayCount,readOnlyExport:readOnlyExport!==false};
}

export function parseMemberNames(names,existing=[]){
 if(!Array.isArray(names))fail(400,'Geef een lijst met deelnemersnamen.');
 const cleaned=names.map(name=>typeof name==='string'?name.trim():'').filter(Boolean);
 if(!cleaned.length||cleaned.length>40)fail(400,'Voeg 1 tot 40 deelnemers tegelijk toe.');
 const seen=new Set(existing.map(name=>name.toLowerCase()));
 for(const name of cleaned){
  if(name.length>50)fail(400,'Deelnemersnamen zijn maximaal 50 tekens.');
  if(seen.has(name.toLowerCase()))fail(409,`De naam ${name} staat al in dit cohort.`);
  seen.add(name.toLowerCase());
 }
 return cleaned;
}
