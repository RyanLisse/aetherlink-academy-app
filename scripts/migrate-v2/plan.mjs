import {createHash} from 'node:crypto';
import {getDayPack} from '../../server/content.mjs';

export const MIGRATION_SOURCE='aetherlink-academy-v1';

// Legacy "supportdag" numbers name the v1 day packs. They are historical lessons,
// never v2 curriculum lessons, so v2LessonIds stays empty on purpose.
export const LEGACY_DAYS=Object.freeze(Object.fromEntries([1,2,3,4,5].map(day=>{
 const pack=getDayPack(day);
 return [String(day),Object.freeze({legacyDay:day,historicalLessonId:`legacy-v1:day-${day}`,title:pack.title,lessonTitle:pack.lesson.title,kicker:pack.lesson.kicker,v2LessonIds:Object.freeze([])})];
})));

export const EXCEPTION_KINDS=Object.freeze({
 malformed:'malformed-room',
 unknownDay:'unknown-day',
 unknownDayRecord:'unknown-day-record',
 duplicateName:'duplicate-display-name',
 targetConflict:'target-conflict',
});

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);

export function legacyDay(value){
 if(typeof value==='number'&&Number.isInteger(value))return LEGACY_DAYS[String(value)];
 if(typeof value==='string'&&/^[1-9]\d*$/.test(value))return LEGACY_DAYS[value];
 return undefined;
}

function canonical(value){
 if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;
 if(isObject(value))return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
 return JSON.stringify(value);
}
export const fingerprint=value=>createHash('sha256').update(canonical(value)).digest('hex');

export function roomProblems(sourceRoomId,data){
 if(!isObject(data))return ['room is not an object'];
 const problems=[];
 if(typeof data.id!=='string'||!UUID.test(data.id))problems.push('id is not a uuid');
 else if(sourceRoomId!==data.id)problems.push(`source key ${sourceRoomId} differs from room id`);
 if(typeof data.code!=='string'||!/^[A-Z0-9]{4,32}$/.test(data.code))problems.push('code is missing or not uppercase alphanumeric');
 if(typeof data.name!=='string')problems.push('name is missing');
 if(!isObject(data.proof)||typeof data.proof.slug!=='string'||!data.proof.slug)problems.push('proof.slug is missing');
 if(!Array.isArray(data.members))problems.push('members is not an array');
 else data.members.forEach((member,index)=>{if(!isObject(member)||typeof member.id!=='string'||!member.id||typeof member.name!=='string')problems.push(`members[${index}] lacks a string id and name`);});
 for(const key of ['evidence','handoffs'])if(!Array.isArray(data[key]))problems.push(`${key} is not an array`);
 return problems;
}

const nameKey=name=>name.trim().toLowerCase();

function duplicateNameGroups(members){
 const groups=new Map();
 for(const member of members){const key=nameKey(member.name);groups.set(key,[...(groups.get(key)||[]),member]);}
 return [...groups.values()].filter(group=>group.length>1);
}

function unknownDayRecords(data){
 const records=[];
 for(const member of data.members)for(const key of Object.keys(isObject(member.progressByDay)?member.progressByDay:{}))if(!legacyDay(key))records.push({where:'progressByDay',memberId:member.id,day:key});
 data.evidence.forEach((item,index)=>{if(!legacyDay(item?.day))records.push({where:'evidence',index,id:item?.id??null,day:item?.day??null});});
 data.handoffs.forEach((item,index)=>{if(!legacyDay(item?.day))records.push({where:'handoffs',index,id:item?.id??null,day:item?.day??null});});
 return records;
}

function daysReferenced(data){
 const days=new Set([String(data.day)]);
 for(const member of data.members)for(const key of Object.keys(isObject(member.progressByDay)?member.progressByDay:{}))days.add(key);
 for(const item of [...data.evidence,...data.handoffs])days.add(String(item?.day));
 return Object.fromEntries([...days].map(legacyDay).filter(Boolean).sort((a,b)=>a.legacyDay-b.legacyDay).map(day=>[String(day.legacyDay),day.historicalLessonId]));
}

function mapRoom({sourceRoomId,data},verified){
 const exceptions=[];
 const base={roomId:sourceRoomId};
 const problems=roomProblems(sourceRoomId,data);
 if(problems.length)return {exceptions:[{...base,kind:EXCEPTION_KINDS.malformed,detail:problems,record:data}]};
 if(!legacyDay(data.day))return {exceptions:[{...base,kind:EXCEPTION_KINDS.unknownDay,detail:[`room day ${JSON.stringify(data.day)} is not a legacy supportdag 1-5`],record:data}]};
 for(const record of unknownDayRecords(data))exceptions.push({...base,kind:EXCEPTION_KINDS.unknownDayRecord,detail:[`${record.where} day ${JSON.stringify(record.day)} is not a legacy supportdag 1-5; kept verbatim`],record});

 const retained=new Set();
 for(const group of duplicateNameGroups(data.members)){
  const confirmed=group.filter(member=>verified.has(`${sourceRoomId}:${member.id}`));
  const keep=confirmed.length===1?confirmed[0].id:null;
  for(const member of group)if(member.id!==keep)retained.add(member.id);
  exceptions.push({...base,kind:EXCEPTION_KINDS.duplicateName,detail:[`${group.length} members share a display name; ${keep?'one verified ownership mapping keeps its access, the rest':'all'} are retained without access`],record:{memberIds:group.map(member=>member.id),verifiedMemberId:keep}});
 }

 const droppedAccess=[];
 const toMember=member=>{
  if(member.access===undefined)return member;
  droppedAccess.push(member.id);
  const {access,...rest}=member;
  return rest;
 };
 const members=data.members.filter(member=>!retained.has(member.id)).map(toMember);
 const retainedMembers=data.members.filter(member=>retained.has(member.id)).map(toMember);
 const driverId=data.members[data.driver]?.id;
 const driver=Math.max(0,members.findIndex(member=>member.id===driverId));
 const {requests,...room}=data;
 const sourceFingerprint=fingerprint(data);
 return {
  exceptions,
  droppedAccess,
  droppedRequestLedger:isObject(requests)?Object.keys(requests).length:0,
  row:{id:data.id,code:data.code,sourceFingerprint,data:{...room,members,driver,migration:{
   source:MIGRATION_SOURCE,
   sourceRoomId,
   sourceCode:data.code,
   sourceProofSlug:data.proof.slug,
   sourceFingerprint,
   historicalLessons:daysReferenced(data),
   retainedMembers,
   droppedAccessMemberIds:droppedAccess,
  }}},
 };
}

export function readOwnershipMap(value){
 if(value===undefined)return new Set();
 if(!isObject(value)||!Array.isArray(value.verified))throw new Error('ownership map must be {"verified":[{roomId,memberId,verifiedBy,evidence}]}');
 return new Set(value.verified.map((entry,index)=>{
  if(!['roomId','memberId','verifiedBy','evidence'].every(key=>typeof entry?.[key]==='string'&&entry[key].trim()))throw new Error(`ownership map entry ${index} needs non-empty roomId, memberId, verifiedBy and evidence`);
  return `${entry.roomId}:${entry.memberId}`;
 }));
}

// existing: rows already in the target, as [{id, code, sourceFingerprint|null}].
export function planMigration(snapshot,{verified=new Set(),existing=[]}={}){
 const byId=new Map(existing.map(row=>[row.id,row]));
 const codeOwner=new Map(existing.map(row=>[row.code,row.id]));
 const plan={insert:[],skip:[],exceptions:[],droppedAccess:0,droppedRequestLedger:0};
 for(const entry of snapshot.rooms){
  const mapped=mapRoom(entry,verified);
  plan.exceptions.push(...mapped.exceptions);
  if(!mapped.row)continue;
  const {row}=mapped;
  const current=byId.get(row.id);
  const conflict=current
   ?current.sourceFingerprint===row.sourceFingerprint?null:`target already has room ${row.id} with ${current.sourceFingerprint?'a different source fingerprint':'no migration metadata'}; not overwritten`
   :codeOwner.has(row.code)&&codeOwner.get(row.code)!==row.id?`room code ${row.code} already belongs to ${codeOwner.get(row.code)}; not overwritten`:null;
  if(conflict){plan.exceptions.push({roomId:row.id,kind:EXCEPTION_KINDS.targetConflict,detail:[conflict],record:{id:row.id,code:row.code}});continue;}
  plan.droppedAccess+=mapped.droppedAccess.length;
  plan.droppedRequestLedger+=mapped.droppedRequestLedger;
  if(current){plan.skip.push(row);continue;}
  plan.insert.push(row);
  byId.set(row.id,{id:row.id,code:row.code,sourceFingerprint:row.sourceFingerprint});
  codeOwner.set(row.code,row.id);
 }
 return plan;
}

export function inventory(snapshot){
 const days=Object.fromEntries(Object.values(LEGACY_DAYS).map(day=>[String(day.legacyDay),{...day,roomsOnDay:0,progressEntries:0,evidence:0,handoffs:0}]));
 const unknown={roomsOnUnknownDay:[],records:0};
 let members=0,membersWithAccess=0,duplicateGroups=0;
 const malformed=[];
 for(const {sourceRoomId,data} of snapshot.rooms){
  if(roomProblems(sourceRoomId,data).length){malformed.push(sourceRoomId);continue;}
  members+=data.members.length;
  membersWithAccess+=data.members.filter(member=>member.access!==undefined).length;
  duplicateGroups+=duplicateNameGroups(data.members).length;
  if(legacyDay(data.day))days[String(data.day)].roomsOnDay++;else unknown.roomsOnUnknownDay.push(sourceRoomId);
  for(const member of data.members)for(const key of Object.keys(isObject(member.progressByDay)?member.progressByDay:{}))legacyDay(key)?days[key].progressEntries++:unknown.records++;
  for(const [list,field] of [[data.evidence,'evidence'],[data.handoffs,'handoffs']])for(const item of list)legacyDay(item?.day)?days[String(item.day)][field]++:unknown.records++;
 }
 const sessions={};
 for(const session of snapshot.sessions)sessions[session.kind]=(sessions[session.kind]||0)+1;
 return {
  origin:snapshot.origin,
  daySemantics:'Legacy room.day, progressByDay keys, evidence.day and handoffs.day are supportdag numbers 1-5 naming v1 day packs. Each maps to a historical lesson id, never to a v2 curriculum lesson.',
  days,
  unknownDays:unknown,
  counts:{rooms:snapshot.rooms.length,malformedRooms:malformed.length,members,membersWithResumeAccess:membersWithAccess,duplicateNameGroups:duplicateGroups,sessions,facilitatorSessions:snapshot.facilitatorSessions,loginStates:snapshot.loginStates,requests:snapshot.requests.length,decks:snapshot.decks.length},
  malformedRoomIds:malformed,
 };
}
