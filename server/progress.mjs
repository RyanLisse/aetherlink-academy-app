export function dayProgress(room, person, day) {
 const saved=person?.progressByDay?.[String(day)]||{};
 const evidence=(room.evidence||[]).filter(item=>item.personId===person?.id&&Number(item.day)===day);
 const reviewed=evidence.filter(item=>item.review);
 const handoffs=(room.handoffs||[]).filter(item=>Number(item.day)===day);
 return {quizScore:saved.quizScore??null,route:saved.route??null,evidenceCount:evidence.length,hasQuiz:saved.quizScore!=null,hasRoute:Boolean(saved.route),hasEvidence:evidence.length>0,reviewedCount:reviewed.length,acceptedCount:evidence.filter(item=>item.status==='accepted').length,hasReview:reviewed.length>0,hasHandoff:handoffs.length>0,reflection:saved.reflection||null,hasReflection:Boolean(saved.reflection),labs:saved.labs||{},labsCompleted:Object.keys(saved.labs||{}).length};
}
export function debrief(room) {
 return {day:room.day,name:room.name,members:room.members.map(person=>({id:person.id,name:person.name,help:person.help,progress:dayProgress(room,person,room.day)})),handoffs:(room.handoffs||[]).filter(item=>Number(item.day)===room.day)};
}
export function exportDebrief(room) {
 const lines=['# Squad-overdracht',room.name,'','Dit overzicht toont vastgelegd bewijs, geen certificering of ranglijst.'];
 for(let day=1;day<=5;day++){
  lines.push('',`## Supportdag ${day}`);
  for(const person of room.members){const progress=dayProgress(room,person,day);lines.push('',`### ${person.name}`,`Bewijs: ${progress.evidenceCount}; beoordeeld: ${progress.reviewedCount}; geaccepteerd: ${progress.acceptedCount}.`);if(progress.reflection)lines.push('Reflectie:',progress.reflection.learned,'Volgende oefening:',progress.reflection.next);}
  for(const handoff of (room.handoffs||[]).filter(item=>Number(item.day)===day))lines.push('','Besluit:',handoff.decision,'Gecontroleerd:',handoff.checked,'Open:',handoff.open,'Volgende eigenaar:',handoff.next);
 }
 return lines.join('\n');
}
