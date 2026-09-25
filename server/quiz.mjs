import {randomUUID} from 'node:crypto';
import {participantDayQuiz,scoreDayQuiz} from '../packages/schema/src/day-quiz.ts';
import {fail} from './store.mjs';

export const QUIZ_ATTEMPT_TTL_MS=30*60*1000;

export const participantDayPack=pack=>({...pack,quiz:participantDayQuiz(pack.quiz)});

const clip=value=>String(value).slice(0,64);
const describe=issue=>issue._tag==='MissingAnswer'?`vraag ${clip(issue.questionId)} is niet beantwoord`:issue._tag==='UnknownQuestion'?`onbekende vraag ${clip(issue.questionId)}`:`onbekende optie ${clip(issue.optionId)} bij vraag ${clip(issue.questionId)}`;
const routeFor=score=>score<=1?'guided':score===2?'standard':'stretch';

export function openQuizAttempt(p,day,now){
 p.quizAttempt={id:randomUUID(),day,openedAt:now,expiresAt:now+QUIZ_ATTEMPT_TTL_MS};
 return {attemptId:p.quizAttempt.id,day,expiresAt:p.quizAttempt.expiresAt};
}

// A live-day attempt records as before (latest wins) and steers the live help route and quiz badge.
// Practice on another day (naslag) keeps that day's best score, so a weaker retake never undoes a
// quiz pass the certificate check (dayChecks) already counts; the last practice run is kept apart.
export function submitQuizAttempt(p,day,quiz,body,now,liveDay=day){
 const attemptId=body?.attemptId,answers=body?.answers;
 if(typeof attemptId!=='string'||!answers||typeof answers!=='object'||Array.isArray(answers)||Object.values(answers).some(value=>typeof value!=='string'))fail(400,'Stuur een quizpoging-id en per vraag-id één gekozen optie-id.');
 const scoring=scoreDayQuiz(quiz,answers);
 if(scoring._tag==='Rejected')fail(400,`Ongeldige quizantwoorden: ${scoring.issues.slice(0,5).map(describe).join('; ')}.`);
 const attempt=p.quizAttempt;
 if(!attempt||attempt.id!==attemptId||attempt.day!==day)fail(409,'Onbekende quizpoging. Start de quiz opnieuw.');
 const fingerprint=quiz.questions.map(question=>`${question.id}=${answers[question.id]}`).join('&');
 if(attempt.result){
  if(attempt.fingerprint===fingerprint)return attempt.result;
  fail(409,'Deze quizpoging is al ingeleverd met andere antwoorden. Start een nieuwe poging.');
 }
 if(now>attempt.expiresAt)fail(410,'Je quizpoging is verlopen (30 minuten zonder inleveren). Beantwoord de vragen opnieuw.');
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
