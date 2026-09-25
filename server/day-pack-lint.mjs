import {existsSync} from 'node:fs';
import path from 'node:path';
import {decodeDayQuiz} from '../packages/schema/src/day-quiz.ts';

export function dayPackIssues(packs,{starterDir,starterFileNames}){
 const issues=[],questionDays=new Map();
 for(const pack of packs){
  const at=`day ${pack.day}`;
  try{
   for(const question of decodeDayQuiz(pack.quiz).questions){
    if(questionDays.has(question.id))issues.push(`${at}: question id "${question.id}" is already used on day ${questionDays.get(question.id)}`);
    else questionDays.set(question.id,pack.day);
   }
  }catch(error){issues.push(`${at}: quiz ${String(error.message).split('\n').join('; ')}`);}
  for(const file of pack.mission?.starterFiles??[]){
   if(!starterFileNames.includes(file))issues.push(`${at}: starter file "${file}" is not a served starter file`);
   else if(!existsSync(path.join(starterDir,file)))issues.push(`${at}: starter file "${file}" is missing from ${starterDir}`);
  }
 }
 return issues;
}

export function assertValidDayPacks(packs,options){
 const issues=dayPackIssues(packs,options);
 if(issues.length)throw new Error(`Invalid day-pack content:\n- ${issues.join('\n- ')}`);
}
