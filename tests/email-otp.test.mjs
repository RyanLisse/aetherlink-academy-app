import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtempSync, readFileSync, rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';
import {LocalStore} from '../server/local-store.mjs';
import {PostgresStore} from '../server/postgres-store.mjs';
import {createMailTransport} from '../server/email-login.mjs';

const DAY=24*60*60*1000;
const MINUTE=60*1000;
const START=Date.parse('2026-10-05T00:00:00Z');
const WAVE={name:'Wave oktober (synthetisch)',startsAt:START,days:5,readOnlyExport:true};
const ALICE_MAIL='alice.synthetisch@example.test';

function localBackend(){
 const dir=mkdtempSync(path.join(os.tmpdir(),'academy-email-'));
 const clock={now:START};
 const store=new LocalStore(dir,{now:()=>clock.now});
 return {store,clock,dump:async()=>readFileSync(path.join(dir,'rooms.json'),'utf8'),close:async()=>rmSync(dir,{recursive:true,force:true})};
}

async function postgresBackend(){
 const {Pool}=await import('pg');
 const url=new URL(process.env.DATABASE_URL);
 url.searchParams.delete('sslmode');
 url.searchParams.delete('channel_binding');
 const pool=new Pool({connectionString:url.href,ssl:process.env.PGSSLMODE==='disable'?false:{rejectUnauthorized:true},max:4,connectionTimeoutMillis:10000});
 const schema=`academy_email_${randomUUID().replaceAll('-','')}`;
 const clock={now:START};
 const store=await new PostgresStore(pool,{schema,now:()=>clock.now}).init();
 const dump=async()=>{const rows=[];for(const table of ['participant_emails','email_challenges','cohort_members','sessions','rooms','participant_access'])rows.push(...(await pool.query(`SELECT * FROM "${schema}".${table}`)).rows);return JSON.stringify(rows);};
 return {store,clock,pool,schema,dump,close:async()=>{await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);await pool.end();}};
}

const backends=[
 ['LocalStore',localBackend,{}],
 ['PostgresStore',postgresBackend,{skip:process.env.ACADEMY_POSTGRES_TEST!=='1'}],
];

const rejectsWith=(run,status,message)=>assert.rejects(async()=>run(),error=>error.status===status&&(!message||message.test(error.message)));
const ip=()=>randomUUID();

async function roomParticipant(store,name='Alice'){
 const room=await store.create('Squad Orion',{slug:`proof-${randomUUID()}`});
 const joined=await store.join(room.code,name);
 return {room,joined};
}

async function attach(store,token,email=ALICE_MAIL){
 const {code}=await store.startEmailAttach(token,email,{ip:ip()});
 return store.verifyEmailAttach(token,email,code);
}

async function cohortSeat(store){
 const room=await store.create('Squad Orion',{slug:`proof-${randomUUID()}`});
 const created=await store.createCohort(WAVE,['Alice','Bob'],{email:'facilitator@example.test',name:'Facilitator (synthetisch)'});
 await store.attachCohortRoom(created.cohort.id,room.roomId);
 const alice=created.codes.find(entry=>entry.name==='Alice');
 const activated=await store.activateCohortCode(alice.code,{ip:ip()});
 return {room,cohort:created.cohort,alice,activated};
}

for (const [label,backend,options] of backends) {
 test(`${label}: a participant attaches a verified email and signs back in with it`,options,async()=>{
  const env=await backend();
  try {
   const {room,joined}=await roomParticipant(env.store);
   assert.deepEqual(await env.store.emailStatus(joined.token),{email:null});
   const {code}=await env.store.startEmailAttach(joined.token,ALICE_MAIL,{ip:ip()});
   assert.match(code,/^\d{6}$/);
   assert.doesNotMatch(await env.dump(),new RegExp(`"${code}"|:${code}\\b`));
   await rejectsWith(()=>env.store.verifyEmailAttach(joined.token,'someone.else@example.test',code),401);
   assert.deepEqual(await env.store.verifyEmailAttach(joined.token,ALICE_MAIL,code),{email:ALICE_MAIL});
   assert.deepEqual(await env.store.emailStatus(joined.token),{email:ALICE_MAIL});
   await rejectsWith(()=>env.store.verifyEmailAttach(joined.token,ALICE_MAIL,code),401,/ongeldig of verlopen/);

   const unknown=await env.store.startEmailLogin('nobody@example.test',{ip:ip()});
   assert.equal(unknown.code,null);
   const login=await env.store.startEmailLogin(ALICE_MAIL,{ip:ip()});
   assert.match(login.code,/^\d{6}$/);
   const session=await env.store.verifyEmailLogin(ALICE_MAIL,login.code);
   assert.equal(session.roomId,room.roomId);
   const {p,s}=await env.store.auth(session.token,'browser');
   assert.equal(p.name,'Alice');
   assert.equal(s.readOnly,undefined);
   await rejectsWith(()=>env.store.verifyEmailLogin(ALICE_MAIL,login.code),401);
  } finally {await env.close();}
 });

 test(`${label}: codes expire after 10 minutes and allow 5 attempts`,options,async()=>{
  const env=await backend();
  try {
   const {joined}=await roomParticipant(env.store);
   const first=await env.store.startEmailAttach(joined.token,ALICE_MAIL,{ip:ip()});
   env.clock.now+=10*MINUTE;
   await rejectsWith(()=>env.store.verifyEmailAttach(joined.token,ALICE_MAIL,first.code),401,/ongeldig of verlopen/);

   const second=await env.store.startEmailAttach(joined.token,ALICE_MAIL,{ip:ip()});
   const wrong=second.code==='000000'?'111111':'000000';
   for(let attempt=0;attempt<5;attempt++)await rejectsWith(()=>env.store.verifyEmailAttach(joined.token,ALICE_MAIL,wrong),401);
   await rejectsWith(()=>env.store.verifyEmailAttach(joined.token,ALICE_MAIL,second.code),401);
   assert.deepEqual(await env.store.emailStatus(joined.token),{email:null});

   env.clock.now+=MINUTE;
   const third=await env.store.startEmailAttach(joined.token,ALICE_MAIL,{ip:ip()});
   for(let attempt=0;attempt<4;attempt++)await rejectsWith(()=>env.store.verifyEmailAttach(joined.token,ALICE_MAIL,third.code==='000000'?'111111':'000000'),401);
   assert.deepEqual(await env.store.verifyEmailAttach(joined.token,ALICE_MAIL,third.code),{email:ALICE_MAIL});
  } finally {await env.close();}
 });

 test(`${label}: resend waits 60 seconds and replaces the previous code`,options,async()=>{
  const env=await backend();
  try {
   const {joined}=await roomParticipant(env.store);
   const first=await env.store.startEmailAttach(joined.token,ALICE_MAIL,{ip:ip()});
   env.clock.now+=59*1000;
   await rejectsWith(()=>env.store.startEmailAttach(joined.token,ALICE_MAIL,{ip:ip()}),429,/Wacht een minuut/);
   env.clock.now+=1000;
   const second=await env.store.startEmailAttach(joined.token,ALICE_MAIL,{ip:ip()});
   if(first.code!==second.code)await rejectsWith(()=>env.store.verifyEmailAttach(joined.token,ALICE_MAIL,first.code),401);
   assert.deepEqual(await env.store.verifyEmailAttach(joined.token,ALICE_MAIL,second.code),{email:ALICE_MAIL});

   await env.store.startEmailLogin('nobody@example.test',{ip:ip()});
   await rejectsWith(()=>env.store.startEmailLogin('nobody@example.test',{ip:ip()}),429,/Wacht een minuut/);
   await env.store.startEmailLogin(ALICE_MAIL,{ip:ip()});
   await rejectsWith(()=>env.store.startEmailLogin(ALICE_MAIL,{ip:ip()}),429,/Wacht een minuut/);
  } finally {await env.close();}
 });

 test(`${label}: sends are limited to 5 per address per hour and 20 per IP per 15 minutes`,options,async()=>{
  const env=await backend();
  try {
   for(let send=0;send<5;send++){await env.store.startEmailLogin('limit@example.test',{ip:ip()});env.clock.now+=MINUTE;}
   await rejectsWith(()=>env.store.startEmailLogin('limit@example.test',{ip:ip()}),429,/Te veel codes/);
   env.clock.now+=60*MINUTE;
   assert.equal((await env.store.startEmailLogin('limit@example.test',{ip:ip()})).code,null);

   for(let send=0;send<20;send++)await env.store.startEmailLogin(`person${send}@example.test`,{ip:'203.0.113.7'});
   await rejectsWith(()=>env.store.startEmailLogin('person20@example.test',{ip:'203.0.113.7'}),429,/Te veel codes/);
   assert.equal((await env.store.startEmailLogin('person20@example.test',{ip:'203.0.113.8'})).code,null);
  } finally {await env.close();}
 });

 test(`${label}: changing or removing the email moves or ends email sign-in`,options,async()=>{
  const env=await backend();
  try {
   const {joined}=await roomParticipant(env.store);
   await attach(env.store,joined.token);
   await attach(env.store,joined.token,'alice.nieuw@example.test');
   assert.deepEqual(await env.store.emailStatus(joined.token),{email:'alice.nieuw@example.test'});
   assert.equal((await env.store.startEmailLogin(ALICE_MAIL,{ip:ip()})).code,null);

   const {joined:bob}=await roomParticipant(env.store,'Bob');
   await attach(env.store,bob.token,'alice.nieuw@example.test');
   assert.deepEqual(await env.store.emailStatus(joined.token),{email:null});
   const login=await env.store.startEmailLogin('alice.nieuw@example.test',{ip:ip()});
   const {p}=await env.store.auth((await env.store.verifyEmailLogin('alice.nieuw@example.test',login.code)).token,'browser');
   assert.equal(p.name,'Bob');

   assert.deepEqual(await env.store.removeEmail(bob.token),{email:null});
   env.clock.now+=MINUTE;
   assert.equal((await env.store.startEmailLogin('alice.nieuw@example.test',{ip:ip()})).code,null);
   const facilitator=await env.store.create('Facilitator room',{slug:`proof-${randomUUID()}`});
   await rejectsWith(()=>env.store.startEmailAttach(facilitator.token,ALICE_MAIL,{ip:ip()}),403,/Alleen deelnemers/);
  } finally {await env.close();}
 });

 test(`${label}: email sign-in recovers a cohort seat and follows cohort phases and revocation`,options,async()=>{
  const env=await backend();
  try {
   const {room,cohort,alice,activated}=await cohortSeat(env.store);
   await attach(env.store,activated.token);
   const signIn=async()=>{env.clock.now+=MINUTE;const {code}=await env.store.startEmailLogin(ALICE_MAIL,{ip:ip()});return env.store.verifyEmailLogin(ALICE_MAIL,code);};

   const recovered=await signIn();
   assert.deepEqual({roomId:recovered.roomId,cohortId:recovered.cohortId,readOnly:recovered.readOnly},{roomId:room.roomId,cohortId:cohort.id,readOnly:false});
   assert.equal((await env.store.auth(recovered.token,'browser')).p.cohortMemberId,alice.memberId);

   await env.store.revokeCohortMember(cohort.id,alice.memberId);
   await rejectsWith(signIn,401,/ingetrokken/);
   await env.store.reissueCohortCode(cohort.id,alice.memberId);
   assert.equal((await signIn()).roomId,room.roomId);

   env.clock.now=START+91*DAY;
   const readOnly=await signIn();
   assert.equal(readOnly.readOnly,true);
   assert.equal((await env.store.auth(readOnly.token,'browser')).s.readOnly,true);

   env.clock.now=START+105*DAY;
   await rejectsWith(signIn,403,/verlopen/);
  } finally {await env.close();}
 });

 test(`${label}: the cohort retention purge removes the verified email`,options,async()=>{
  const env=await backend();
  try {
   const {cohort,activated}=await cohortSeat(env.store);
   await attach(env.store,activated.token);
   assert.match(await env.dump(),/alice\.synthetisch@example\.test/);
   env.clock.now=START+(5+180)*DAY;
   const purged=await env.store.purgeExpiredCohorts({dryRun:false});
   assert.deepEqual(purged.purged.map(entry=>entry.cohortId),[cohort.id]);
   assert.doesNotMatch(await env.dump(),/alice\.synthetisch@example\.test/);
   assert.equal((await env.store.startEmailLogin(ALICE_MAIL,{ip:ip()})).code,null);
  } finally {await env.close();}
 });
}

test('PostgresStore: schema version 10 upgrades in place to 11 with the email tables',{skip:process.env.ACADEMY_POSTGRES_TEST!=='1'},async()=>{
 const env=await postgresBackend();
 try {
  await env.pool.query(`UPDATE "${env.schema}".system_metadata SET value='10:69d548aa2f4e29f3f498c1c3a7468eb8d6321b9971fa0abebe962358e94807fe' WHERE key='academy_schema_migration'`);
  await env.pool.query(`DROP TABLE "${env.schema}".participant_emails, "${env.schema}".email_challenges`);
  await new PostgresStore(env.pool,{schema:env.schema}).init();
  const migration=(await env.pool.query(`SELECT value FROM "${env.schema}".system_metadata WHERE key='academy_schema_migration'`)).rows[0].value;
  assert.match(migration,/^11:[a-f0-9]{64}$/);
  const tables=(await env.pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema=$1 AND table_name IN ('participant_emails','email_challenges') ORDER BY table_name`,[env.schema])).rows.map(row=>row.table_name);
  assert.deepEqual(tables,['email_challenges','participant_emails']);
 } finally {await env.close();}
});

test('mail transport: unset, unknown, incomplete SMTP and log-in-production are disabled',()=>{
 const warnings=[];
 const warn=message=>warnings.push(message);
 assert.equal(createMailTransport({},{warn}),null);
 assert.equal(createMailTransport({ACADEMY_MAIL_TRANSPORT:'sendgrid'},{warn}),null);
 assert.equal(createMailTransport({ACADEMY_MAIL_TRANSPORT:'smtp',ACADEMY_SMTP_HOST:'smtp.example.test'},{warn}),null);
 assert.equal(createMailTransport({ACADEMY_MAIL_TRANSPORT:'smtp',ACADEMY_SMTP_HOST:'smtp.example.test',ACADEMY_SMTP_FROM:'Academy <academy@example.test>',ACADEMY_SMTP_USER:'user'},{warn}),null);
 assert.equal(createMailTransport({ACADEMY_MAIL_TRANSPORT:'log',NODE_ENV:'production'},{warn}),null);
 assert.equal(warnings.length,4);
 assert.match(warnings[3],/not allowed in production/);
});

test('mail transport: log prints the mail and smtp hands nodemailer the configured server',async()=>{
 const lines=[];
 const log=createMailTransport({ACADEMY_MAIL_TRANSPORT:'log'},{log:line=>lines.push(line)});
 await log.send({to:ALICE_MAIL,subject:'Onderwerp',text:'Code 123456'});
 assert.deepEqual(lines,[`[academy-mail] to=${ALICE_MAIL} subject=Onderwerp\nCode 123456`]);

 const created=[],sent=[];
 const smtp=createMailTransport({ACADEMY_MAIL_TRANSPORT:'smtp',ACADEMY_SMTP_HOST:'smtp.example.test',ACADEMY_SMTP_PORT:'587',ACADEMY_SMTP_FROM:'Academy <academy@example.test>',ACADEMY_SMTP_USER:'user',ACADEMY_SMTP_PASS:'pass'},{createTransport:options=>{created.push(options);return {sendMail:async message=>{sent.push(message);return {messageId:'m1'};}};}});
 assert.equal(smtp.kind,'smtp');
 assert.deepEqual(created,[{host:'smtp.example.test',port:587,secure:false,requireTLS:true,auth:{user:'user',pass:'pass'}}]);
 await smtp.send({to:ALICE_MAIL,subject:'S',text:'T'});
 assert.deepEqual(sent,[{from:'Academy <academy@example.test>',to:ALICE_MAIL,subject:'S',text:'T'}]);
});

async function gateway({mailer}={}){
 const dir=mkdtempSync(path.join(os.tmpdir(),'academy-email-routes-'));
 const clock={now:START};
 const instance=createApp({dir,repository:new LocalStore(dir,{now:()=>clock.now}),hostKey:'test-host',proofBase:'http://127.0.0.1:9',publicBaseUrl:'http://127.0.0.1:4317',slidesService:{run:async()=>null},mailer});
 instance.proof.create=async()=>({slug:'email-proof',editor:'editor-token'});
 await new Promise(resolve=>instance.server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${instance.server.address().port}`;
 const call=async(method,route,{body,cookie}={})=>{
  const response=await fetch(base+route,{method,headers:{'content-type':'application/json',...(cookie?{cookie:`academy=${encodeURIComponent(cookie)}`}:{})},body:body?JSON.stringify(body):undefined});
  const text=await response.text();
  let json=null;try{json=JSON.parse(text);}catch{}
  return {status:response.status,body:json,text,setCookie:response.headers.get('set-cookie')};
 };
 return {clock,call,close:async()=>{await new Promise(resolve=>instance.server.close(resolve));rmSync(dir,{recursive:true,force:true});}};
}

const fakeMailer=()=>{const mails=[];return {mails,mailer:{kind:'fake',send:async message=>{mails.push(message);}}};};
const codeIn=mail=>mail.text.match(/: (\d{6})\n/)[1];
const settle=()=>new Promise(resolve=>setImmediate(resolve));

test('routes: without a mail transport every email route is 404 and the UI flag is off',async()=>{
 const {call,close}=await gateway();
 try {
  assert.equal((await call('GET','/game/config')).body.emailLogin,false);
  const room=await call('POST','/game/create',{body:{hostKey:'test-host',name:'Squad Orion'}});
  const alice=await call('POST','/game/join',{body:{code:room.body.code,name:'Alice'}});
  const results=[
   await call('GET','/game/email',{cookie:alice.body.token}),
   await call('POST','/game/email/attach/start',{cookie:alice.body.token,body:{email:ALICE_MAIL}}),
   await call('POST','/game/email/attach/verify',{cookie:alice.body.token,body:{email:ALICE_MAIL,code:'123456'}}),
   await call('POST','/game/email/remove',{cookie:alice.body.token,body:{}}),
   await call('POST','/game/email/login/start',{body:{email:ALICE_MAIL}}),
   await call('POST','/game/email/login/verify',{body:{email:ALICE_MAIL,code:'123456'}}),
  ];
  assert.deepEqual(results.map(result=>result.status),[404,404,404,404,404,404]);
 } finally {await close();}
});

test('routes: delivery, enumeration-resistant login and a private email',async()=>{
 const {mails,mailer}=fakeMailer();
 const {call,close}=await gateway({mailer});
 try {
  assert.equal((await call('GET','/game/config')).body.emailLogin,true);
  const room=await call('POST','/game/create',{body:{hostKey:'test-host',name:'Squad Orion'}});
  const alice=await call('POST','/game/join',{body:{code:room.body.code,name:'Alice'}});
  const bob=await call('POST','/game/join',{body:{code:room.body.code,name:'Bob'}});

  assert.equal((await call('POST','/game/email/attach/start',{cookie:alice.body.token,body:{email:'geen-adres'}})).status,400);
  assert.equal((await call('POST','/game/email/attach/start',{body:{email:ALICE_MAIL}})).status,401);
  const started=await call('POST','/game/email/attach/start',{cookie:alice.body.token,body:{email:' Alice.Synthetisch@Example.test '}});
  assert.deepEqual([started.status,started.body],[200,{ok:true}]);
  assert.equal(mails.length,1);
  assert.equal(mails[0].to,ALICE_MAIL);
  assert.match(mails[0].subject,/^Bevestig je e-mailadres voor AetherLink Academy: \d{6}$/);
  assert.match(mails[0].text,/10 minuten geldig[\s\S]*valid for 10 minutes/);
  const verified=await call('POST','/game/email/attach/verify',{cookie:alice.body.token,body:{email:ALICE_MAIL,code:codeIn(mails[0])}});
  assert.deepEqual([verified.status,verified.body],[200,{email:ALICE_MAIL}]);
  assert.deepEqual((await call('GET','/game/email',{cookie:alice.body.token})).body,{email:ALICE_MAIL});
  assert.deepEqual((await call('GET','/game/email',{cookie:bob.body.token})).body,{email:null});
  for(const token of [alice.body.token,bob.body.token,room.body.token])assert.doesNotMatch((await call('GET','/game/state',{cookie:token})).text,/synthetisch@example/);
  assert.doesNotMatch((await call('POST','/game/facilitator/overview',{body:{hostKey:'test-host'}})).text,/synthetisch@example/);

  const known=await call('POST','/game/email/login/start',{body:{email:ALICE_MAIL}});
  const unknown=await call('POST','/game/email/login/start',{body:{email:'nobody@example.test'}});
  await settle();
  assert.deepEqual([known.status,known.body],[200,{ok:true,message:'Als dit e-mailadres bij een deelnemer hoort, ontvang je een code van 6 cijfers.'}]);
  assert.deepEqual([unknown.status,unknown.body],[known.status,known.body]);
  assert.deepEqual(mails.map(mail=>mail.to),[ALICE_MAIL,ALICE_MAIL]);
  assert.match(mails[1].subject,/^Je inlogcode voor AetherLink Academy: \d{6}$/);
  const knownAgain=await call('POST','/game/email/login/start',{body:{email:ALICE_MAIL}});
  const unknownAgain=await call('POST','/game/email/login/start',{body:{email:'nobody@example.test'}});
  assert.deepEqual([knownAgain.status,knownAgain.body],[429,{error:'Wacht een minuut voordat je een nieuwe code aanvraagt.'}]);
  assert.deepEqual([unknownAgain.status,unknownAgain.body],[knownAgain.status,knownAgain.body]);
  const wrongKnown=await call('POST','/game/email/login/verify',{body:{email:ALICE_MAIL,code:codeIn(mails[1])==='000000'?'111111':'000000'}});
  const wrongUnknown=await call('POST','/game/email/login/verify',{body:{email:'nobody@example.test',code:'000000'}});
  assert.deepEqual([wrongKnown.status,wrongKnown.body],[401,{error:'Deze code is ongeldig of verlopen. Vraag een nieuwe code aan.'}]);
  assert.deepEqual([wrongUnknown.status,wrongUnknown.body],[wrongKnown.status,wrongKnown.body]);

  const login=await call('POST','/game/email/login/verify',{body:{email:ALICE_MAIL,code:codeIn(mails[1])}});
  assert.equal(login.status,200);
  assert.match(login.setCookie,/^academy=[a-f0-9]{64}; Path=\/; HttpOnly; SameSite=Strict$/);
  assert.equal((await call('GET','/game/state',{cookie:login.body.token})).body.me.name,'Alice');

  assert.deepEqual((await call('POST','/game/email/remove',{cookie:alice.body.token,body:{}})).body,{email:null});
  assert.deepEqual((await call('GET','/game/email',{cookie:alice.body.token})).body,{email:null});
 } finally {await close();}
});

test('routes: a failing mail server surfaces on attach as a 502',async()=>{
 const {call,close}=await gateway({mailer:{kind:'fake',send:async()=>{throw new Error('smtp down');}}});
 const errors=[],original=console.error;
 console.error=(...args)=>errors.push(args.join(' '));
 try {
  const room=await call('POST','/game/create',{body:{hostKey:'test-host',name:'Squad Orion'}});
  const alice=await call('POST','/game/join',{body:{code:room.body.code,name:'Alice'}});
  const attach=await call('POST','/game/email/attach/start',{cookie:alice.body.token,body:{email:ALICE_MAIL}});
  assert.deepEqual([attach.status,attach.body],[502,{error:'De e-mail kon niet worden verstuurd. Probeer het later opnieuw.'}]);
  assert.deepEqual(errors,['academy mail send failed smtp down']);
 } finally {console.error=original;await close();}
});
