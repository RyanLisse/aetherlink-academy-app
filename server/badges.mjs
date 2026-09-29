import {DAY_COUNT} from '../content/days/index.mjs';
import {memberDayChecks,dayIsComplete} from './certificate.mjs';
import {dayTasks,taskPassed} from './proof-trail.mjs';
import {mergeSeatProgress} from './cohort.mjs';

const safely=fn=>{try{return fn();}catch{return false;}};

/** Day-complete uses the same lighter rule as Wave-cohort certificates (quiz + ≥1 task). */
export function dayCompleteBadges({rooms,memberId,progressByDay,days=DAY_COUNT}){
 const badges=[];
 for(let day=1;day<=days;day++){
  const checks=memberDayChecks({rooms,memberId,progressByDay,day});
  if(!dayIsComplete(checks))continue;
  const saved=progressByDay?.[String(day)]||{};
  badges.push({type:'day-complete',id:`day-complete:${day}`,day,earnedAt:saved.quizAt||null});
 }
 return badges;
}

/** Arcade stop: each server-graded lab stop that passed (AET-59 shell earnable wire). */
export function arcadeStopBadges(progressByDay={}){
 const badges=[];
 for(const [day,saved] of Object.entries(progressByDay)){
  for(const [labId,stops] of Object.entries(saved.labStops||{})){
   for(const [stopId,stop] of Object.entries(stops||{})){
    if(!stop?.passed)continue;
    badges.push({type:'arcade-stop',id:`arcade-stop:${labId}:${stopId}`,day:Number(day),labId,stopId,earnedAt:stop.at||null});
   }
  }
 }
 return badges;
}

/** Proof milestone: each day task that is approved (peer / facilitator / auto-grade). */
export function proofMilestoneBadges({rooms,memberId,days=DAY_COUNT}){
 const badges=[];
 const views=rooms.length?rooms:[{evidence:[],members:[]}];
 for(let day=1;day<=days;day++){
  for(const task of dayTasks(day)){
   const passed=views.some(view=>safely(()=>taskPassed(view,memberId,task.id,day)));
   if(!passed)continue;
   let earnedAt=null;
   for(const view of views){
    const hit=(view.evidence||[])
     .filter(e=>e.personId===memberId&&e.taskId===task.id&&Number(e.day)===day&&e.status==='accepted')
     .sort((a,b)=>String(b.at||'').localeCompare(String(a.at||'')))[0];
    if(hit?.at){earnedAt=hit.at;break;}
    const auto=view.members?.find(m=>m.id===memberId)?.progressByDay?.[String(day)]?.autograde?.[task.id];
    if(auto?.passed&&auto.at){earnedAt=auto.at;break;}
   }
   badges.push({type:'proof-milestone',id:`proof-milestone:${task.id}`,day,taskId:task.id,title:task.title,earnedAt});
  }
 }
 return badges;
}

export function memberBadges({rooms,memberId,progressByDay,days=DAY_COUNT}){
 const progress=progressByDay??mergeSeatProgress(rooms,memberId);
 return [
  ...dayCompleteBadges({rooms,memberId,progressByDay:progress,days}),
  ...arcadeStopBadges(progress),
  ...proofMilestoneBadges({rooms,memberId,days}),
 ].sort((a,b)=>String(a.id).localeCompare(String(b.id)));
}
