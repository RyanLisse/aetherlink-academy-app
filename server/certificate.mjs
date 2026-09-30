import {createHash} from 'node:crypto';
import {dayChecks} from './progress.mjs';
import {dayTasks,taskPassed} from './proof-trail.mjs';

export const CERTIFICATE_INVALID_MESSAGE='No valid certificate found for this code.';

// Certificate eligibility reads the same pass signals as the rest of the Academy (AET-103): a quiz
// passes with every answer right and a day task when the Proof trail approves it, by an accepted peer
// or facilitator review or by a passing auto-grade.
const safely=fn=>{try{return fn();}catch{return false;}};

// Every check one member must pass for one cohort day, across all rooms of the cohort. A member can
// sit in several cohort rooms, so a task passes when its trail is approved in any of them.
export function memberDayChecks({rooms,memberId,progressByDay,day}){
 const views=(rooms.length?rooms:[{evidence:[]}]).map(room=>({...room,members:[{id:memberId,progressByDay}]}));
 const person={id:memberId,progressByDay};
 const graded=dayChecks(views[0],person,day).filter(check=>check.kind!=='task');
 const tasks=dayTasks(day).map(task=>({kind:'task',id:task.id,title:task.title,passed:views.some(view=>safely(()=>taskPassed(view,memberId,task.id,day)))}));
 return [...graded,...tasks];
}

// A single cohort day under the lighter rule (Ryan, 2026-09-25): quiz fully correct and at least
// one of its tasks passed. A day without a quiz is judged on its tasks alone, a day without tasks
// on its quiz alone, and a day with neither fails closed. Labs are not part of the rule.
export function dayIsComplete(checks=[]){
 const quizzes=checks.filter(check=>check.kind==='quiz');
 const tasks=checks.filter(check=>check.kind==='task');
 if(!quizzes.length&&!tasks.length)return false;
 if(quizzes.some(check=>!check.passed))return false;
 if(tasks.length&&!tasks.some(task=>task.passed))return false;
 return true;
}

// The lighter rule (Ryan, 2026-09-25): a day counts when its quiz is fully correct and at least one
// of its tasks passed. A day without a quiz is judged on its tasks alone, a day without tasks on its
// quiz alone, and a day with neither fails closed. Labs are not part of the rule.
export function certificateEligibility({days,checksByDay,accessRevoked,lastDayStarted}){
 const reasons=[];
 if(!lastDayStarted)reasons.push({code:'cohort-running'});
 if(accessRevoked)reasons.push({code:'access-revoked'});
 let daysCompleted=0;
 for(let day=1;day<=days;day++){
  const checks=checksByDay[day]||[];
  const quizzes=checks.filter(check=>check.kind==='quiz'),tasks=checks.filter(check=>check.kind==='task');
  const dayReasons=[];
  if(!quizzes.length&&!tasks.length)dayReasons.push({code:'day-without-content',day});
  for(const quiz of quizzes.filter(check=>!check.passed))dayReasons.push({code:'quiz-open',day,id:quiz.id});
  if(tasks.length&&!tasks.some(task=>task.passed))dayReasons.push({code:'no-task-passed',day});
  if(!dayReasons.length)daysCompleted++;
  reasons.push(...dayReasons);
 }
 return {eligible:reasons.length===0,daysCompleted,reasons};
}

export function publicVerification(certificate){
 if(!certificate||certificate.revokedAt)return null;
 return {name:certificate.name,cohortName:certificate.cohortName,issuedAt:certificate.issuedAt};
}

const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const normalizeCertLocale=value=>value==='en'||value==='nl'?value:'en';
const localeDate=(ms,locale)=>new Date(ms).toLocaleDateString(locale==='en'?'en-GB':'nl-NL',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
const PRINT_SCRIPT="document.getElementById('print').addEventListener('click',()=>print())";
export const CERTIFICATE_CSP=`default-src 'none'; style-src 'unsafe-inline'; script-src 'sha256-${createHash('sha256').update(PRINT_SCRIPT).digest('base64')}; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`;

const STYLE=`:root{color-scheme:light;--ink:#14161f;--muted:#5b6070;--line:#d9dce5;--accent:#1b7f8c;--paper:#fff;--page:#eef0f4}
*{box-sizing:border-box}body{margin:0;background:var(--page);color:var(--ink);font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:860px;margin:32px auto;padding:0 16px}
.sheet{background:var(--paper);border:1px solid var(--line);border-radius:6px;padding:56px 64px;text-align:center}
.kicker{letter-spacing:.18em;text-transform:uppercase;font-size:12px;color:var(--accent);margin:0}
h1{font:600 34px/1.2 Georgia,"Times New Roman",serif;margin:14px 0 28px}
.name{font:600 30px/1.25 Georgia,"Times New Roman",serif;margin:8px 0 6px;overflow-wrap:anywhere}
.cohort{font-size:20px;margin:6px 0 28px;overflow-wrap:anywhere}
dl{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:0;padding:22px 0 0;border-top:1px solid var(--line);text-align:left}
dt{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}dd{margin:2px 0 0;font-size:15px;overflow-wrap:anywhere}
.verify{margin-top:26px;font-size:13px;color:var(--muted);overflow-wrap:anywhere}.verify code{font:14px ui-monospace,Menlo,monospace;color:var(--ink)}
.tools{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 14px;font-size:13px;color:var(--muted)}
button{font:inherit;padding:8px 16px;border-radius:6px;border:1px solid var(--accent);background:var(--accent);color:#fff;cursor:pointer}
.status{background:var(--paper);border:1px solid var(--line);border-radius:6px;padding:32px;text-align:center}.status h1{font-size:26px;margin:10px 0 18px}
.ok{color:var(--accent)}.bad{color:#9b3b1f}
@media(max-width:620px){.sheet{padding:32px 20px}h1{font-size:26px}.name{font-size:24px}dl{grid-template-columns:1fr}}
@media print{body{background:#fff}main{margin:0;max-width:none;padding:0}.tools{display:none}.sheet{border:0}@page{size:A4 landscape;margin:14mm}}`;

const COPY={
 en:{
  printHint:'Choose Print, then Save as PDF.',
  print:'Print',
  title:'Certificate of completion',
  declare:'This certifies that',
  finished:'has completed the Wave cohort',
  period:'Period',
  daysDone:'Days completed',
  issued:'Issued',
  verify:'Verify this certificate at',
  code:'Verification code',
  until:'verifiable through',
  of:'of',
  invalidTitle:'Certificate not valid',
  invalidHeading:CERTIFICATE_INVALID_MESSAGE,
  invalidKicker:'Not valid',
  invalidBody:'The code does not exist, was revoked, or was removed after the retention period.',
  validTitle:'Certificate valid',
  validKicker:'Valid certificate',
  issuedOn:'Issued on',
 },
 nl:{
  printHint:'Kies Afdrukken en dan Opslaan als PDF.',
  print:'Afdrukken',
  title:'Certificaat van afronding',
  declare:'Hierbij verklaren wij dat',
  finished:'het Wave-cohort heeft afgerond',
  period:'Periode',
  daysDone:'Dagen afgerond',
  issued:'Uitgegeven',
  verify:'Controleer dit certificaat op',
  code:'Verificatiecode',
  until:'verifieerbaar tot en met',
  of:'van',
  invalidTitle:'Certificaat niet geldig',
  invalidHeading:'Geen geldig certificaat gevonden voor deze code.',
  invalidKicker:'Niet geldig',
  invalidBody:'De code bestaat niet, is ingetrokken of is na de bewaartermijn verwijderd.',
  validTitle:'Certificaat geldig',
  validKicker:'Geldig certificaat',
  issuedOn:'Uitgegeven op',
 },
};

const page=(title,body,locale)=>`<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)}</title><style>${STYLE}</style></head><body><main>${body}</main></body></html>`;

export function renderCertificatePage(certificate,{verifyUrl,verifiableUntil,locale}={}){
 const lang=normalizeCertLocale(locale);
 const c=COPY[lang];
 const period=`${localeDate(certificate.startsAt,lang)} – ${localeDate(certificate.endsAt-1,lang)}`;
 const daysLine=`${certificate.days} ${c.of} ${certificate.days}`;
 return page(`${c.title} · ${certificate.name}`,`<div class="tools"><span>${c.printHint}</span><button type="button" id="print">${c.print}</button></div>
<article class="sheet"><p class="kicker">AetherLink Academy</p><h1>${c.title}</h1>
<p>${c.declare}</p><p class="name">${escapeHtml(certificate.name)}</p>
<p>${c.finished}</p><p class="cohort">${escapeHtml(certificate.cohortName)}</p>
<dl><div><dt>${c.period}</dt><dd>${period}</dd></div><div><dt>${c.daysDone}</dt><dd>${daysLine}</dd></div><div><dt>${c.issued}</dt><dd>${localeDate(certificate.issuedAt,lang)}</dd></div></dl>
<p class="verify">${c.verify} <code>${escapeHtml(verifyUrl)}</code><br>${c.code} <code>${escapeHtml(certificate.id)}</code> · ${c.until} ${localeDate(verifiableUntil-1,lang)}</p></article>
<script>${PRINT_SCRIPT}</script>`,lang);
}

export function renderVerificationPage(verification,{locale}={}){
 const lang=normalizeCertLocale(locale);
 const c=COPY[lang];
 if(!verification)return page(c.invalidTitle,`<section class="status"><p class="kicker bad">${c.invalidKicker}</p><h1>${c.invalidHeading}</h1><p>${c.invalidBody}</p></section>`,lang);
 const completedLine=lang==='en'
  ?`has completed the Wave cohort <strong>${escapeHtml(verification.cohortName)}</strong>.`
  :`heeft het Wave-cohort <strong>${escapeHtml(verification.cohortName)}</strong> afgerond.`;
 return page(c.validTitle,`<section class="status"><p class="kicker ok">${c.validKicker}</p><h1>${escapeHtml(verification.name)}</h1><p>${completedLine}</p><p>${c.issuedOn} ${localeDate(verification.issuedAt,lang)}.</p></section>`,lang);
}
