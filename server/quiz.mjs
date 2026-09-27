import {randomUUID} from 'node:crypto';
import {decodeDayQuiz,participantDayQuiz,scoreDayQuiz} from '../packages/schema/src/day-quiz.ts';
import {fail} from './store.mjs';

export const QUIZ_ATTEMPT_TTL_MS=30*60*1000;
/** Human copy when a day-pack quiz fails schema validation at serve/submit time (F1/F5). */
export const QUIZ_BAD_ASSET_MESSAGE='De quiz voor deze dag is ongeldig of ontbreekt. Vraag de facilitator om de content te herstellen, of ga verder met de solo-missie.';
export const QUIZ_EXPIRED_MESSAGE='Je quizpoging is verlopen (30 minuten zonder inleveren). Beantwoord de vragen opnieuw.';

const clip=value=>String(value).slice(0,64);
const describe=issue=>issue._tag==='MissingAnswer'?`vraag ${clip(issue.questionId)} is niet beantwoord`:issue._tag==='UnknownQuestion'?`onbekende vraag ${clip(issue.questionId)}`:`onbekende optie ${clip(issue.optionId)} bij vraag ${clip(issue.questionId)}`;
const routeFor=score=>score<=1?'guided':score===2?'standard':'stretch';

/** Decode or return null — never throws; used for soft-fail participant projection (F1/F5). */
export function tryDayQuiz(quiz){
 try{return decodeDayQuiz(quiz);}catch{return null;}
}

/** Participant day-pack projection: drop answer keys; on bad quiz set quiz=null + quizError (no crash). */
export function participantDayPack(pack){
 const decoded=tryDayQuiz(pack.quiz);
 if(!decoded)return {...pack,quiz:null,quizError:QUIZ_BAD_ASSET_MESSAGE};
 return {...pack,quiz:participantDayQuiz(decoded)};
}

/** Trusted quiz for scoring; 422 with human copy when the asset is broken. */
export function requireDayQuiz(quiz){
 const decoded=tryDayQuiz(quiz);
 if(!decoded)fail(422,QUIZ_BAD_ASSET_MESSAGE);
 return decoded;
}

export function openQuizAttempt(p,day,now){
 p.quizAttempt={id:randomUUID(),day,openedAt:now,expiresAt:now+QUIZ_ATTEMPT_TTL_MS};
 return {attemptId:p.quizAttempt.id,day,expiresAt:p.quizAttempt.expiresAt,idleTimeoutMs:QUIZ_ATTEMPT_TTL_MS};
}

/**
 * Phase for one member on a day (facilitator chrome, F4).
 * completed wins over an open attempt; expired only when no score yet.
 */
export function quizMemberPhase(member,day,now=Date.now()){
 const saved=member?.progressByDay?.[String(day)];
 if(saved?.quizScore!=null)return 'completed';
 const attempt=member?.quizAttempt;
 if(!attempt||attempt.day!==day)return 'not_started';
 if(attempt.result)return 'completed';
 if(now>attempt.expiresAt)return 'expired';
 return 'in_progress';
}

/** Room-level quiz status counts without raw attempt JSON (F4). */
export function quizRoomStatus(members,day,now=Date.now()){
 const counts={notStarted:0,inProgress:0,completed:0,expired:0,total:members.length};
 const detail=members.map(member=>{
  const phase=quizMemberPhase(member,day,now);
  if(phase==='not_started')counts.notStarted++;
  else if(phase==='in_progress')counts.inProgress++;
  else if(phase==='completed')counts.completed++;
  else counts.expired++;
  const score=member?.progressByDay?.[String(day)]?.quizScore??null;
  return {id:member.id,name:member.name,phase,quizScore:score};
 });
 return {day,...counts,started:counts.inProgress+counts.completed+counts.expired,members:detail};
}

// A live-day attempt records as before (latest wins) and steers the live help route and quiz badge.
// Practice on another day (naslag) keeps that day's best score, so a weaker retake never undoes a
// quiz pass the certificate check (dayChecks) already counts; the last practice run is kept apart.
export function submitQuizAttempt(p,day,quiz,body,now,liveDay=day){
 const attemptId=body?.attemptId,answers=body?.answers;
 if(typeof attemptId!=='string'||!answers||typeof answers!=='object'||Array.isArray(answers)||Object.values(answers).some(value=>typeof value!=='string'))fail(400,'Stuur een quizpoging-id en per vraag-id één gekozen optie-id.');
 const trusted=requireDayQuiz(quiz);
 const scoring=scoreDayQuiz(trusted,answers);
 if(scoring._tag==='Rejected')fail(400,`Ongeldige quizantwoorden: ${scoring.issues.slice(0,5).map(describe).join('; ')}.`);
 const attempt=p.quizAttempt;
 if(!attempt||attempt.id!==attemptId||attempt.day!==day)fail(409,'Onbekende quizpoging. Start de quiz opnieuw.');
 const fingerprint=trusted.questions.map(question=>`${question.id}=${answers[question.id]}`).join('&');
 if(attempt.result){
  if(attempt.fingerprint===fingerprint)return attempt.result;
  fail(409,'Deze quizpoging is al ingeleverd met andere antwoorden. Start een nieuwe poging.');
 }
 if(now>attempt.expiresAt)fail(410,QUIZ_EXPIRED_MESSAGE);
 const {score,total,results}=scoring,at=new Date(now).toISOString(),route=routeFor(score);
 const result={score,total,results,route,day,note:'Voorlopige hulpkeuze op basis van 3 scenario’s; geen vaardigheidsbewijs of permanent label.'};
 if(day===liveDay){p.route=route;p.quiz={score,at,day};}
 p.progressByDay=p.progressByDay||{};
 const saved=p.progressByDay[String(day)]||{};
 const practice=day!==liveDay,keep=practice&&saved.quizScore!=null&&saved.quizScore>=score;
 p.progressByDay[String(day)]={...saved,...(keep?{}:{quizScore:score,route,quizAt:at}),...(practice?{practiceQuiz:{score,at}}:{})};
 p.quizAttempt={...attempt,submittedAt:now,fingerprint,result};
 return result;
}
