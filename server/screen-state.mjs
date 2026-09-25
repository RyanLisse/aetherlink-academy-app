import {fail} from './store.mjs';
import {getDayPack} from './content.mjs';
import {runParticipantScreenState} from '../packages/actions/src/adapters/screen-state-host.ts';

const MAX_AGE_MS=30_000,MAX_TABS=8;
const VIEWS=new Set(['squad','route','lesson','solo','coach','review','decks','apps']);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const dayLessonId=day=>`day-${day}`;

// The browser only says which tab, view and deck slide it shows. Everything
// else comes from the server-side room and participant, so a tab cannot claim
// a lesson, quiz or release it was never served.
export function screenBinding({r,p},report,now=Date.now()){
 if(!p)fail(403,'Alleen deelnemers melden hun scherm.');
 const {tabId,view,deckId,slideId,slideIndex}=report||{};
 if(typeof tabId!=='string'||!UUID.test(tabId))fail(400,'Ongeldige tab.');
 if(!VIEWS.has(view))fail(400,'Onbekende weergave.');
 const deck=view==='decks'&&deckId!==undefined&&deckId!==null;
 if(deck&&(typeof deckId!=='string'||!UUID.test(deckId)))fail(400,'Ongeldig deck.');
 if(deck&&(!Number.isInteger(slideIndex)||slideIndex<0||slideIndex>999))fail(400,'Ongeldige slide.');
 if(deck&&slideId!==undefined&&slideId!==null&&(typeof slideId!=='string'||slideId.length>64))fail(400,'Ongeldige slide.');
 const lesson=['lesson','solo'].includes(view)&&getDayPack(r.day)?dayLessonId(r.day):null;
 const quizDone=p.progressByDay?.[String(r.day)]?.quizScore!=null;
 return {browserSessionId:tabId,roomId:r.id,participantId:p.id,lessonId:lesson,slideIndex:deck?slideIndex:0,slideId:deck?slideId??null:null,viewedRevision:null,latestPublishedRevision:null,assignmentId:null,route:deck?`decks/${deckId}`:view,proofOpen:view==='squad',proofSection:null,quizId:view==='lesson'&&lesson?`${lesson}-quiz`:null,quizStatus:view==='lesson'&&lesson?(quizDone?'completed':'idle'):null,quizItemIndex:null,roomPhase:r.mode||null,releasedLessonIds:getDayPack(r.day)?[dayLessonId(r.day)]:[],updatedAt:now};
}

const fresh=(bindings,now)=>bindings.filter(b=>now-b.updatedAt<=MAX_AGE_MS);

function memoryScreens(){
 const rooms=new Map();
 return {
  async save(b){const key=`${b.roomId}::${b.participantId}`;const tabs=rooms.get(key)||new Map();if(!tabs.has(b.browserSessionId)&&tabs.size>=MAX_TABS)tabs.clear();tabs.set(b.browserSessionId,b);rooms.set(key,tabs);},
  async list(roomId,participantId,now=Date.now()){return fresh([...(rooms.get(`${roomId}::${participantId}`)?.values()||[])],now);},
 };
}

// One Redis hash per participant, one field per tab, so every gateway
// instance answers get_screen_state from the same heartbeats.
function redisScreens({redis,prefix}){
 const key=(roomId,participantId)=>`${prefix}:screen:${encodeURIComponent(roomId)}:${encodeURIComponent(participantId)}`;
 return {
  async save(b){const k=key(b.roomId,b.participantId);if(!await redis.hexists(k,b.browserSessionId)&&await redis.hlen(k)>=MAX_TABS)await redis.del(k);await redis.hset(k,b.browserSessionId,JSON.stringify(b));await redis.expire(k,MAX_AGE_MS/1000);},
  async list(roomId,participantId,now=Date.now()){return fresh(Object.values(await redis.hgetall(key(roomId,participantId))).map(v=>JSON.parse(v)),now);},
 };
}

export const createScreenStore=presence=>presence?redisScreens(presence):memoryScreens();

// The legacy room has one release authority: the facilitator's support day.
// /game/day-pack serves only that day, so only that day's lesson is released.
export const readScreenState=({r,p},screens)=>runParticipantScreenState({principalId:p.id,roomId:r.id,role:'participant'},{
 listActive:(roomId,participantId)=>screens.list(roomId,participantId),
 isReleased:async(squadId,lessonId)=>squadId===r.id&&Boolean(getDayPack(r.day))&&lessonId===dayLessonId(r.day),
});
