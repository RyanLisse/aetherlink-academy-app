import {randomBytes,randomInt,timingSafeEqual} from 'node:crypto';
import nodemailer from 'nodemailer';
import {fail,hash} from './store.mjs';

export const OTP_TTL_MS=10*60*1000;
export const OTP_MAX_ATTEMPTS=5;
export const OTP_RESEND_MS=60*1000;
export const EMAIL_RATE_LIMITS={
 email:{max:5,windowMs:60*60*1000},
 ip:{max:20,windowMs:15*60*1000},
};
export const EMAIL_INVALID_MESSAGE='Vul een geldig e-mailadres in.';
export const EMAIL_CODE_INVALID_MESSAGE='Deze code is ongeldig of verlopen. Vraag een nieuwe code aan.';
export const EMAIL_COOLDOWN_MESSAGE='Wacht een minuut voordat je een nieuwe code aanvraagt.';
export const EMAIL_RATE_LIMIT_MESSAGE='Te veel codes aangevraagd. Wacht even en probeer opnieuw.';
export const EMAIL_LOGIN_SENT_MESSAGE='Als dit e-mailadres bij een deelnemer hoort, ontvang je een code van 6 cijfers.';
export const EMAIL_PARTICIPANT_ONLY_MESSAGE='Alleen deelnemers kunnen een e-mailadres koppelen.';

export function normalizeEmail(input){
 const email=typeof input==='string'?input.trim().toLowerCase():'';
 if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail(400,EMAIL_INVALID_MESSAGE);
 return email;
}

// A login challenge is keyed by the address alone and exists whether or not the address is
// bound, so cooldown, attempt and rate-limit behaviour cannot reveal a registered address.
export const challengeKey=(purpose,email,personId='')=>hash(`email-otp\n${purpose}\n${email}\n${personId}`);

export const emailAttemptKeys=(email,ip)=>[[`email-otp:${hash(email)}`,EMAIL_RATE_LIMITS.email],[`email-otp-ip:${hash(String(ip||'unknown'))}`,EMAIL_RATE_LIMITS.ip]];

const codeHash=(salt,code)=>`${salt}:${hash(`${salt}:${code}`)}`;

export function issueChallenge(existing,now){
 if(existing&&existing.expiresAt>now&&now-existing.sentAt<OTP_RESEND_MS)fail(429,EMAIL_COOLDOWN_MESSAGE);
 const code=String(randomInt(0,1_000_000)).padStart(6,'0');
 return {code,record:{codeHash:codeHash(randomBytes(16).toString('hex'),code),sentAt:now,expiresAt:now+OTP_TTL_MS,attempts:0}};
}

// Returns the record to store next (null deletes it). An exhausted record is kept until it
// expires so the resend cooldown still holds after the fifth wrong code.
export function checkChallenge(record,code,now){
 if(!record||record.expiresAt<=now||record.attempts>=OTP_MAX_ATTEMPTS)return {ok:false,record};
 const expected=Buffer.from(record.codeHash),actual=Buffer.from(codeHash(record.codeHash.split(':')[0],String(code||'')));
 if(/^\d{6}$/.test(String(code||''))&&expected.length===actual.length&&timingSafeEqual(expected,actual))return {ok:true,record:null};
 return {ok:false,record:{...record,attempts:record.attempts+1}};
}

export function otpMail(purpose,code){
 const nl=purpose==='login'?'Je inlogcode voor AetherLink Academy':'Bevestig je e-mailadres voor AetherLink Academy';
 const en=purpose==='login'?'Your AetherLink Academy sign-in code':'Confirm your email address for AetherLink Academy';
 return {
  subject:`${nl}: ${code}`,
  text:`${nl}: ${code}\nDe code is 10 minuten geldig. Heb je dit niet aangevraagd? Dan kun je deze e-mail negeren.\n\n${en}: ${code}\nThe code is valid for 10 minutes. If you did not request it, you can ignore this email.\n`,
 };
}

// ACADEMY_MAIL_TRANSPORT: smtp | log | unset. Anything else, a log transport in production, or an
// incomplete SMTP setup disables email features rather than half-enabling them.
export function createMailTransport(env=process.env,{log=console.log,warn=console.error,createTransport=nodemailer.createTransport}={}){
 const kind=String(env.ACADEMY_MAIL_TRANSPORT||'').trim().toLowerCase();
 if(!kind)return null;
 if(kind==='log'){
  if(env.NODE_ENV==='production'){warn('ACADEMY_MAIL_TRANSPORT=log is not allowed in production; email login is disabled.');return null;}
  return {kind,send:async({to,subject,text})=>log(`[academy-mail] to=${to} subject=${subject}\n${text}`)};
 }
 if(kind==='smtp'){
  const host=String(env.ACADEMY_SMTP_HOST||'').trim(),port=Number(env.ACADEMY_SMTP_PORT||587),from=String(env.ACADEMY_SMTP_FROM||'').trim(),user=env.ACADEMY_SMTP_USER,pass=env.ACADEMY_SMTP_PASS;
  if(!host||!Number.isInteger(port)||!from||Boolean(user)!==Boolean(pass)){warn('ACADEMY_MAIL_TRANSPORT=smtp needs ACADEMY_SMTP_HOST, ACADEMY_SMTP_PORT, ACADEMY_SMTP_FROM and both or neither of ACADEMY_SMTP_USER/ACADEMY_SMTP_PASS; email login is disabled.');return null;}
  const transporter=createTransport({host,port,secure:port===465,requireTLS:port!==465&&env.ACADEMY_SMTP_REQUIRE_TLS!=='0',...(user?{auth:{user,pass}}:{})});
  return {kind,send:message=>transporter.sendMail({from,...message})};
 }
 warn(`ACADEMY_MAIL_TRANSPORT=${kind} is unknown (use smtp or log); email login is disabled.`);
 return null;
}
