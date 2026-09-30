import {getDayPack} from './content.mjs';
import {projectPackLocale} from '../content/days/locale.mjs';
import {fail} from './store.mjs';
import {autogradeView,recordAutograde} from './autograde.mjs';

// Task status is never stored. It is folded from the participant's evidence trail for that task,
// then from the participant's passing auto-grade record, so those stay the single source of truth.
const TASK_TRANSITIONS={
 open:{submit:'submitted',autograde_pass:'approved'},
 submitted:{approve:'approved',request_changes:'changes_requested',autograde_pass:'approved'},
 changes_requested:{submit:'submitted',autograde_pass:'approved'},
 approved:{}
};
const REVIEW_EVENTS={accepted:'approve','needs-work':'request_changes'};
const ILLEGAL={
 submit:'This assignment is awaiting review or has already been approved.',
 approve:'Only submitted assignments can be reviewed.',
 request_changes:'Only submitted assignments can be reviewed.',
 autograde_pass:'This assignment has already been approved.'
};

export function transition(status,event){
 const next=TASK_TRANSITIONS[status]?.[event];
 if(!next)fail(409,ILLEGAL[event]||'Invalid assignment step.');
 return next;
}
export const reviewEvent=evidenceStatus=>REVIEW_EVENTS[evidenceStatus];

export function dayTasks(day,locale='en'){
 const pack=getDayPack(day);
 if(!pack)return [];
 const projected=projectPackLocale(pack,locale);
 const titles=new Map((projected.steps||[]).map(step=>[step.id,step.title]));
 if(pack.steps?.length)return pack.steps.map(step=>({id:step.id,title:titles.get(step.id)??step.title,...(step.autograde?{grader:step.autograde}:{})}));
 return [{id:pack.mission.id,title:projected.mission?.title??pack.mission.title}];
}
export function findTask(day,taskId){
 const task=dayTasks(day).find(t=>t.id===taskId);
 if(!task)fail(400,`Unknown assignment for support day ${day}.`);
 return task;
}

const submissionsFor=(room,personId,taskId,day)=>(room.evidence||[]).filter(e=>e.personId===personId&&e.taskId===taskId&&Number(e.day)===Number(day));
const autogradeRecord=(room,personId,taskId,day)=>room.members.find(m=>m.id===personId)?.progressByDay?.[String(day)]?.autograde?.[taskId];
const fold=(submissions,record)=>{
 const status=submissions.reduce((status,e)=>{const next=transition(status,'submit');return e.review?transition(next,reviewEvent(e.status)):next;},'open');
 return record?.passed?transition(status,'autograde_pass'):status;
};
export const taskStatus=(room,personId,taskId,day)=>fold(submissionsFor(room,personId,taskId,day),autogradeRecord(room,personId,taskId,day));
export const taskPassed=(room,personId,taskId,day)=>taskStatus(room,personId,taskId,day)==='approved';

// A failing attempt is recorded without a status change; a passing one approves through the table above.
export function submitAutograde(room,person,task,body,at){
 if(!task.grader)fail(409,'This assignment is reviewed by a person, not automatically.');
 const day=String(room.day),progress=person.progressByDay?.[day]||{},previous=progress.autograde?.[task.id];
 if(!previous?.passed)transition(taskStatus(room,person.id,task.id,room.day),'autograde_pass');
 const {recorded,record}=recordAutograde(previous,task.grader,body,at);
 if(recorded)person.progressByDay={...person.progressByDay,[day]:{...progress,autograde:{...progress.autograde,[task.id]:record}}};
 return {recorded,taskId:task.id,day:room.day,status:taskStatus(room,person.id,task.id,room.day),autograde:autogradeView(task.grader,record)};
}

const submissionView=e=>({evidenceId:e.id,at:e.at,status:e.status,review:e.review?{note:e.review.note,at:e.review.at,reviewer:e.review.reviewer||null}:null});
export function taskTrail(room,personId,day,locale='en'){
 return dayTasks(day,locale).map(({grader,...task})=>{
  const submissions=submissionsFor(room,personId,task.id,day),record=autogradeRecord(room,personId,task.id,day);
  return {...task,day:Number(day),status:fold(submissions,record),submissions:submissions.map(submissionView),...(grader?{autograde:autogradeView(grader,record)}:{})};
 });
}
export const awaitingReview=room=>(room.evidence||[]).filter(e=>e.taskId&&!e.review&&taskStatus(room,e.personId,e.taskId,e.day)!=='approved');

// Who closed a submission; views read the role, never branch on the session.
export const REVIEWER_ROLES=Object.freeze(['peer','facilitator','auto-graded']);
export const reviewerRole=session=>session.personId==='facilitator'?'facilitator':'peer';

// The facilitator is only present in the live classroom, so any other participant in the room may review task evidence.
// Self-review is rejected by the caller for all evidence.
export function authorizeTaskReview({s,p}){
 if(s.personId!=='facilitator'&&!p)fail(403,'Only participants or the facilitator review assignments.');
}

const queueItem=(room,e,locale)=>({evidenceId:e.id,taskId:e.taskId,taskTitle:dayTasks(e.day,locale).find(t=>t.id===e.taskId)?.title||e.taskId,day:e.day,personId:e.personId,name:e.name,at:e.at,attempt:submissionsFor(room,e.personId,e.taskId,e.day).indexOf(e)+1,finding:e.finding,command:e.command,observed:e.observed,limitation:e.limitation});

export function reviewQueue(room,locale='en'){
 return {
  day:room.day,
  queue:awaitingReview(room).map(e=>queueItem(room,e,locale)),
  members:room.members.map(m=>({id:m.id,name:m.name,tasks:taskTrail(room,m.id,room.day,locale).map(({id,title,status})=>({id,title,status}))}))
 };
}

export const peerQueue=(room,personId,locale='en')=>({day:room.day,queue:awaitingReview(room).filter(e=>e.personId!==personId&&Number(e.day)===Number(room.day)).map(e=>queueItem(room,e,locale))});
