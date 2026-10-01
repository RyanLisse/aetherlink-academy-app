import {DAY_COUNT} from '../content/days/index.mjs';
import {getDayPack} from './content.mjs';
import {quizRoomStatus} from './quiz.mjs';
import {dayTasks,taskPassed} from './proof-trail.mjs';

// Every server-graded check for one participant and day, each with its own pass signal. A quiz passes
// with every answer right, a lab only when the server graded its stops, a task when it is approved.
export function dayChecks(room,person,day){
 const saved=person?.progressByDay?.[String(day)]||{},quizTotal=getDayPack(day)?.quiz?.questions?.length??0;
 return [
  ...(quizTotal?[{kind:'quiz',id:`d${day}-quiz`,source:'server-graded',passed:saved.quizScore===quizTotal}]:[]),
  ...Object.entries(saved.labs||{}).map(([id,lab])=>({kind:'lab',id,source:lab.source,passed:lab.source==='server-graded'})),
  ...dayTasks(day).filter(task=>task.grader).map(task=>({kind:'task',id:task.id,source:'auto-graded',passed:taskPassed(room,person?.id,task.id,day)}))
 ];
}
export function dayProgress(room, person, day) {
 const saved=person?.progressByDay?.[String(day)]||{};
 const evidence=(room.evidence||[]).filter(item=>item.personId===person?.id&&Number(item.day)===day);
 const reviewed=evidence.filter(item=>item.review);
 const handoffs=(room.handoffs||[]).filter(item=>Number(item.day)===day);
 return {quizScore:saved.quizScore??null,route:saved.route??null,evidenceCount:evidence.length,hasQuiz:saved.quizScore!=null,hasRoute:Boolean(saved.route),hasEvidence:evidence.length>0,lessonDone:Boolean(saved.lessonDoneAt),reviewedCount:reviewed.length,acceptedCount:evidence.filter(item=>item.status==='accepted').length,hasReview:reviewed.length>0,hasHandoff:handoffs.length>0,reflection:saved.reflection||null,hasReflection:Boolean(saved.reflection),labs:saved.labs||{},labsCompleted:Object.keys(saved.labs||{}).length};
}
export function debrief(room) {
 const quiz=quizRoomStatus(room.members,room.day);
 return {day:room.day,name:room.name,quiz,members:room.members.map(person=>({id:person.id,name:person.name,help:person.help,progress:dayProgress(room,person,room.day),quizPhase:quiz.members.find(m=>m.id===person.id)?.phase||'not_started'})),handoffs:(room.handoffs||[]).filter(item=>Number(item.day)===room.day)};
}
export function exportDebrief(room,board=null) {
 const lines=['# Squad handoff',room.name,'','This overview shows recorded evidence, not a certification or leaderboard.'];
 for(let day=1;day<=DAY_COUNT;day++){
  lines.push('',`## Day ${day}`);
  for(const person of room.members){const progress=dayProgress(room,person,day);lines.push('',`### ${person.name}`,`Evidence: ${progress.evidenceCount}; reviewed: ${progress.reviewedCount}; accepted: ${progress.acceptedCount}.`);if(progress.reflection)lines.push('Reflection:',progress.reflection.learned,'Next practice:',progress.reflection.next);}
  for(const handoff of (room.handoffs||[]).filter(item=>Number(item.day)===day))lines.push('','Decision:',handoff.decision,'Checked:',handoff.checked,'Open:',handoff.open);
 }
 if(board){lines.push('','## Debrief board');for(const column of board){lines.push('',`### ${column.title}`);lines.push(...(column.cards.length?column.cards.map(card=>`- ${card}`):['No cards.']));}}
 return lines.join('\n');
}
