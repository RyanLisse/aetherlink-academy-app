import {createHash} from 'node:crypto';
import {dayChecks} from './progress.mjs';
import {dayTasks,taskPassed} from './proof-trail.mjs';

export const CERTIFICATE_INVALID_MESSAGE='Geen geldig certificaat gevonden voor deze code.';

// Certificate eligibility reads the same pass signals as the rest of the Academy (AET-103): a quiz
// passes with every answer right, a lab only when the server graded it, and a day task when the
// Proof trail approves it, by an accepted peer or facilitator review or by a passing auto-grade.
// Nothing here waits on the facilitator.
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

// A day counts when it has content and every check passes. A day without content fails closed.
export function certificateEligibility({days,checksByDay,accessRevoked,lastDayStarted}){
 const reasons=[];
 if(!lastDayStarted)reasons.push({code:'cohort-running'});
 if(accessRevoked)reasons.push({code:'access-revoked'});
 let daysCompleted=0;
 for(let day=1;day<=days;day++){
  const checks=checksByDay[day]||[];
  const open=checks.filter(check=>!check.passed);
  if(!checks.length)reasons.push({code:'day-without-content',day});
  for(const check of open)reasons.push({code:`${check.kind}-open`,day,id:check.id,...(check.title?{title:check.title}:{})});
  if(checks.length&&!open.length)daysCompleted++;
 }
 return {eligible:reasons.length===0,daysCompleted,reasons};
}

export function publicVerification(certificate){
 if(!certificate||certificate.revokedAt)return null;
 return {name:certificate.name,cohortName:certificate.cohortName,issuedAt:certificate.issuedAt};
}

const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const dutchDate=ms=>new Date(ms).toLocaleDateString('nl-NL',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
const PRINT_SCRIPT="document.getElementById('print').addEventListener('click',()=>print())";
export const CERTIFICATE_CSP=`default-src 'none'; style-src 'unsafe-inline'; script-src 'sha256-${createHash('sha256').update(PRINT_SCRIPT).digest('base64')}'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`;

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

const page=(title,body)=>`<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)}</title><style>${STYLE}</style></head><body><main>${body}</main></body></html>`;

export function renderCertificatePage(certificate,{verifyUrl,verifiableUntil}){
 const period=`${dutchDate(certificate.startsAt)} – ${dutchDate(certificate.endsAt-1)}`;
 return page(`Certificaat ${certificate.name}`,`<div class="tools"><span>Kies Afdrukken en dan Opslaan als PDF.</span><button type="button" id="print">Afdrukken</button></div>
<article class="sheet"><p class="kicker">AetherLink Academy</p><h1>Certificaat van afronding</h1>
<p>Hierbij verklaren wij dat</p><p class="name">${escapeHtml(certificate.name)}</p>
<p>het Wave-cohort heeft afgerond</p><p class="cohort">${escapeHtml(certificate.cohortName)}</p>
<dl><div><dt>Periode</dt><dd>${period}</dd></div><div><dt>Dagen afgerond</dt><dd>${certificate.days} van ${certificate.days}</dd></div><div><dt>Uitgegeven</dt><dd>${dutchDate(certificate.issuedAt)}</dd></div></dl>
<p class="verify">Controleer dit certificaat op <code>${escapeHtml(verifyUrl)}</code><br>Verificatiecode <code>${escapeHtml(certificate.id)}</code> · verifieerbaar tot en met ${dutchDate(verifiableUntil-1)}</p></article>
<script>${PRINT_SCRIPT}</script>`);
}

export function renderVerificationPage(verification){
 if(!verification)return page('Certificaat niet geldig',`<section class="status"><p class="kicker bad">Niet geldig</p><h1>${CERTIFICATE_INVALID_MESSAGE}</h1><p>De code bestaat niet, is ingetrokken of is na de bewaartermijn verwijderd.</p></section>`);
 return page('Certificaat geldig',`<section class="status"><p class="kicker ok">Geldig certificaat</p><h1>${escapeHtml(verification.name)}</h1><p>heeft het Wave-cohort <strong>${escapeHtml(verification.cohortName)}</strong> afgerond.</p><p>Uitgegeven op ${dutchDate(verification.issuedAt)}.</p></section>`);
}
