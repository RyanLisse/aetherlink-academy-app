import {createHash, randomBytes, randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {awaitingReview} from './proof-trail.mjs';
import {hash, secret, fail, writable, Store, MAX_SQUAD_SIZE, COHORT_ROOM_JOIN_MESSAGE, DUPLICATE_PARTICIPANT_MESSAGE, INVALID_PARTICIPANT_ACCESS_MESSAGE, COHORT_SEAT_ACCESS_MESSAGE} from './store.mjs';
import {INVALID_COHORT_CODE_MESSAGE,COHORT_NO_ROOM_MESSAGE,COHORT_RATE_LIMIT_MESSAGE,RATE_LIMITS,attemptKeys,issueAccessCode,sessionGrant,mergeSeatProgress,seatMember,cohortView,cohortWindow,anonymizeRoom,dueCertificates,memberCertificate} from './cohort.mjs';

export class PostgresStore {
 constructor(pool, {schema='academy',now=Date.now}={}) {
  this.now=now;
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(schema) || schema==='public' || schema.startsWith('pg_') || schema==='information_schema') throw new Error('Invalid Academy schema');
  this.pool=pool;
  this.schema=schema;
  this.live=new Map();
 }
 async transaction(fn) {
  const client=await this.pool.connect();
  try {
   await client.query('BEGIN');
   await client.query(`SET LOCAL search_path TO "${this.schema}"`);
   const result=await fn(client);
   await client.query('COMMIT');
   return result;
  } catch(error) {
   await client.query('ROLLBACK');
   throw error;
  } finally {client.release();}
 }
 async init() {
  const sql=await readFile(new URL('./schema/academy.sql',import.meta.url),'utf8');
  const migration=`10:${createHash('sha256').update(sql).digest('hex')}`,previousMigrations=['6:fbae0eba4b46d45c35d4d9705afa174d0d46cb651e940ac979d7c26c2ad59c2a','5:57e09fb6b675447a5d37dca65ae64d9910c99ff4c8a4214a9c04402d38284bd0','4:0b073193ff907df7232bf74f47211525b268a81df5c3dd9210879a07e5081a11','3:321f2a26590284cfb07e23cad1940e0d56c3589ac012f9c7cfaf03d7315be2a3','2:3fa9bb87a5cfb8efe24eddc2f7fa94ff0657c0d711f5f9e19e41c6f91b12f3d2','1:cfd75de0661902abf5fd6d4b2fe2984d7e9228cc111392e96686ed29d228b3e1'];
  await this.transaction(async client=>{
   await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',[`academy-schema:${this.schema}`]);
   const existing=await client.query('SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname=$1',[this.schema]);
   if(existing.rowCount){
    let upgrade=false;
    const relations=await client.query(`
     SELECT c.relname FROM pg_catalog.pg_class c
     JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
     WHERE n.nspname=$1 AND c.relkind IN ('r','p')
    `,[this.schema]);
    if(relations.rows.some(row=>row.relname==='system_metadata')){
     const applied=await client.query('SELECT value FROM system_metadata WHERE key=$1',['academy_schema_migration']);
     if(applied.rowCount){if(applied.rows[0].value===migration)return;if(!previousMigrations.includes(applied.rows[0].value))throw new Error('Academy schema migration version or checksum differs; apply an explicit offline migration before startup');upgrade=true;}
    }
    if(relations.rowCount&&!upgrade)throw new Error('Academy schema is unversioned; an explicit offline migration is required before startup');
   }else await client.query(`CREATE SCHEMA "${this.schema}"`);
   await client.query(sql);
   await client.query('INSERT INTO system_metadata (key,value,updated_at) VALUES ($1,$2,$3) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,updated_at=EXCLUDED.updated_at', ['academy_schema_migration',migration,new Date().toISOString()]);
  });
  return this;
 }
 async session(client,roomId,personId,kind,displayName,{expiresAt=this.now()+12*60*60*1000,readOnly=false}={}) {
  const token=secret();
  await client.query('INSERT INTO sessions(token_hash,room_id,person_id,kind,expires_at,display_name,read_only) VALUES ($1,$2,$3,$4,$5,$6,$7)',[hash(token),roomId,personId,kind,expiresAt,displayName||null,readOnly]);
  return token;
 }
 async authenticated(client,token,kind,lock=false) {
  const key=hash(token||'');
  const found=await client.query('SELECT room_id FROM sessions WHERE token_hash=$1',[key]);
  if (!found.rows[0]) fail(401,'Geen geldige toegang. Meld je opnieuw aan.');
  const room=await client.query(`SELECT data FROM rooms WHERE id=$1${lock?' FOR UPDATE':''}`,[found.rows[0].room_id]);
  const session=await client.query('SELECT room_id,person_id,kind,expires_at,display_name,read_only FROM sessions WHERE token_hash=$1',[key]);
  const row=session.rows[0];
  if (!row || Number(row.expires_at)<=this.now() || kind&&row.kind!==kind) fail(401,'Geen geldige toegang. Meld je opnieuw aan.');
  if (!room.rows[0]) fail(401,'Kamer bestaat niet.');
  const s={roomId:row.room_id,personId:row.person_id,kind:row.kind,expiresAt:Number(row.expires_at),displayName:row.display_name||undefined,...(row.read_only?{readOnly:true}:{})};
  const r=room.rows[0].data;
  return {s,r,p:r.members.find(member=>member.id===s.personId)};
 }
 async auth(token,kind) {return this.transaction(client=>this.authenticated(client,token,kind));}
 async save(client,r) {await client.query('UPDATE rooms SET data=$2 WHERE id=$1',[r.id,JSON.stringify(r)]);}
 async withSession(token,kind,fn) {
  return this.transaction(async client=>{
   const context=writable(await this.authenticated(client,token,kind,true));
   const result=await fn(context);
   await this.save(client,context.r);
   return result;
  });
 }
 async facilitatorLogin(identity) {
  return this.transaction(async client=>{await client.query('DELETE FROM facilitator_sessions WHERE expires_at < $1',[Date.now()]);const token=secret();await client.query('INSERT INTO facilitator_sessions(token_hash,sub,email,name,domain,expires_at) VALUES ($1,$2,$3,$4,$5,$6)',[hash(token),identity.sub,identity.email,identity.name,identity.domain,Date.now()+12*60*60*1000]);return token;});
 }
 async facilitator(token) {
  if(!token)return null;return this.transaction(async client=>{const key=hash(token);await client.query('DELETE FROM facilitator_sessions WHERE token_hash=$1 AND expires_at<$2',[key,Date.now()]);const result=await client.query('SELECT sub,email,name,domain FROM facilitator_sessions WHERE token_hash=$1',[key]);return result.rows[0]||null;});
 }
 async facilitatorLogout(token) {if(token)await this.transaction(client=>client.query('DELETE FROM facilitator_sessions WHERE token_hash=$1',[hash(token)]));}
 async loginStateSave({stateHash,nonce,codeVerifier,expiresAt}) {await this.transaction(async client=>{await client.query('DELETE FROM login_states WHERE expires_at < now()');await client.query('INSERT INTO login_states(state_hash,nonce,code_verifier,expires_at) VALUES ($1,$2,$3,to_timestamp($4/1000.0)) ON CONFLICT (state_hash) DO UPDATE SET nonce=EXCLUDED.nonce,code_verifier=EXCLUDED.code_verifier,expires_at=EXCLUDED.expires_at',[stateHash,nonce,codeVerifier,expiresAt]);});}
 async loginStateTake(stateHash) {return this.transaction(async client=>{const result=await client.query('DELETE FROM login_states WHERE state_hash=$1 RETURNING nonce,code_verifier,expires_at',[stateHash]);const row=result.rows[0];if(!row)return null;const expiresAt=new Date(row.expires_at).getTime();return expiresAt<Date.now()?null:{nonce:row.nonce,codeVerifier:row.code_verifier,expiresAt};});}
 async create(name,proof,createdBy) {
  return this.transaction(async client=>{
   const id=randomUUID();
   const code=randomBytes(5).toString('hex').toUpperCase();
   const r={id,code,name,proof,createdBy:createdBy||null,createdAt:Date.now(),roundSeconds:1500,members:[],driver:0,round:1,phase:'Plan',day:1,mode:'lesson',running:false,remaining:1500,deadline:null,evidence:[],handoffs:[],version:1};
   await client.query('INSERT INTO rooms VALUES ($1,$2,$3)',[id,code,JSON.stringify(r)]);
   return {token:await this.session(client,id,'facilitator','browser',createdBy?.name),roomId:id,code};
  });
 }
 async join(code,name) {
  return this.transaction(async client=>{
   const result=await client.query('SELECT data FROM rooms WHERE code=$1 FOR UPDATE',[code.toUpperCase()]);
   const r=result.rows[0]?.data;
   if (!r) fail(404,'Kamercode niet gevonden.');
   if (r.cohortId) fail(403,COHORT_ROOM_JOIN_MESSAGE);
   const existing=r.members.find(m=>m.name.toLowerCase()===name.toLowerCase());
   if (existing) fail(409,DUPLICATE_PARTICIPANT_MESSAGE);
   if (r.members.length>=MAX_SQUAD_SIZE) fail(409,`Squad is vol (maximaal ${MAX_SQUAD_SIZE}).`);
   const resumeToken=secret();
   const p={id:randomUUID(),name,help:false,quiz:null,route:'standard',progressByDay:{},lastMcp:null};
   r.members.push(p);r.version++;
   await this.save(client,r);
   await client.query('INSERT INTO participant_access(room_id,person_id,secret_hash) VALUES ($1,$2,$3)',[r.id,p.id,hash(resumeToken)]);
   return {token:await this.session(client,r.id,p.id,'browser',p.name),roomId:r.id,resumeToken};
  });
 }
 async resumeParticipant(resumeToken) {
  return this.transaction(async client=>{
   const access=await client.query('SELECT room_id,person_id FROM participant_access WHERE secret_hash=$1',[hash(resumeToken||'')]);
   const row=access.rows[0];
   if(!row) fail(401,INVALID_PARTICIPANT_ACCESS_MESSAGE);
   const room=await client.query('SELECT data FROM rooms WHERE id=$1 FOR UPDATE',[row.room_id]);
   const r=room.rows[0]?.data;
   const p=r?.members.find(member=>member.id===row.person_id);
   if(!r||!p) fail(401,INVALID_PARTICIPANT_ACCESS_MESSAGE);
   return {token:await this.session(client,r.id,p.id,'browser',p.name),roomId:r.id,resumed:true};
  });
 }
 async rotateParticipantAccess(token) {
  return this.transaction(async client=>{
   const {r,p}=writable(await this.authenticated(client,token,'browser',true));
   if(!p)fail(403,'Gebruik hiervoor een deelnemerssessie.');
   if(p.cohortMemberId)fail(409,COHORT_SEAT_ACCESS_MESSAGE);
   const resumeToken=secret();
   await client.query('INSERT INTO participant_access(room_id,person_id,secret_hash) VALUES ($1,$2,$3) ON CONFLICT (room_id,person_id) DO UPDATE SET secret_hash=EXCLUDED.secret_hash,created_at=now()',[r.id,p.id,hash(resumeToken)]);
   return {resumeToken};
  });
 }
 async logout(token) {
  return this.transaction(async client=>{
   await this.authenticated(client,token,'browser',true);
   await client.query('DELETE FROM sessions WHERE token_hash=$1',[hash(token)]);
  });
 }
 async attachFacilitator(roomId,displayName) {
  return this.transaction(async client=>{
   const result=await client.query('SELECT data FROM rooms WHERE id=$1 FOR UPDATE',[roomId]);
   const r=result.rows[0]?.data;
   if(!r) fail(404,'Kamer bestaat niet.');
   return {token:await this.session(client,roomId,'facilitator','browser',displayName),roomId,code:r.code};
  });
 }
 async rotateMcpToken(token) {
  return this.transaction(async client=>{
   const {r,p,s}=writable(await this.authenticated(client,token,'browser',true));
   if (!p) fail(403,'Gebruik hiervoor een deelnemerssessie.');
   await client.query("DELETE FROM sessions WHERE room_id=$1 AND person_id=$2 AND kind='mcp'",[r.id,p.id]);
   return {token:await this.session(client,r.id,p.id,'mcp',undefined,p.cohortMemberId?{expiresAt:s.expiresAt}:undefined)};
  });
 }
 async control(token,action,value) {
  return this.withSession(token,'browser',({r,s})=>{
   if (s.personId!=='facilitator') fail(403,'Alleen de facilitator bedient de ronde.');
   Store.prototype.control.call({remaining:this.remaining,save(){}},r,action,value);
   return this.view(r,s);
  });
 }
 async updateParticipant(token,patch) {
  if (Object.keys(patch).some(key=>!['help','quiz','route','progressByDay','lastMcp'].includes(key))) fail(400,'Ongeldig deelnemersveld.');
  return this.withSession(token,'browser',({p})=>{
   if (!p) fail(400,'Alleen deelnemers.');
   Object.assign(p,patch);
   return p;
  });
 }
 async reserveRequest(token,kind,requestId,payloadHash,intent,validate=()=>{}) {
  return this.transaction(async client=>{
   const context=writable(await this.authenticated(client,token,undefined,true));
   const {r,s}=context;
   const values=[r.id,s.personId,kind,requestId];
   const found=await client.query('SELECT payload_hash,intent,result FROM requests WHERE room_id=$1 AND person_id=$2 AND kind=$3 AND request_id=$4',values);
   const row=found.rows[0];
   if (row) {
    if(row.payload_hash!==payloadHash) fail(409,'Dit verzoeknummer is al gebruikt met andere invoer.');
    return {intent:row.intent,result:row.result,completed:row.result!==null};
   }
   await validate(context);
   await client.query('INSERT INTO requests(room_id,person_id,kind,request_id,payload_hash,intent) VALUES ($1,$2,$3,$4,$5,$6)',[...values,payloadHash,JSON.stringify(intent)]);
   return {intent,result:null,completed:false};
  });
 }
 async completeRequest(token,kind,requestId,payloadHash,apply) {
  return this.transaction(async client=>{
   const context=writable(await this.authenticated(client,token,undefined,true));
   const values=[context.r.id,context.s.personId,kind,requestId];
   const found=await client.query('SELECT payload_hash,intent,result FROM requests WHERE room_id=$1 AND person_id=$2 AND kind=$3 AND request_id=$4',values);
   const row=found.rows[0];
   if (!row) fail(404,'Verzoek niet gevonden.');
   if (row.payload_hash!==payloadHash) fail(409,'Dit verzoeknummer is al gebruikt met andere invoer.');
   if (row.result!==null) return row.result;
   const result=await apply(context,row.intent);
   if (result===undefined||result===null) throw new Error('Completed request requires a result');
   await this.save(client,context.r);
   await client.query('UPDATE requests SET result=$5 WHERE room_id=$1 AND person_id=$2 AND kind=$3 AND request_id=$4',[...values,JSON.stringify(result)]);
   return result;
  });
 }
 remaining(r,now=Date.now()) {return Store.prototype.remaining.call(this,r,now);}
 async overview() {
  const result=await this.transaction(client=>client.query('SELECT data FROM rooms'));
  return result.rows.map(({data:r})=>({id:r.id,name:r.name,code:r.code,createdBy:r.createdBy||null,createdAt:r.createdAt||null,round:r.round,phase:r.phase,day:r.day,mode:r.mode,running:r.running,remaining:this.remaining(r),roundSeconds:r.roundSeconds||1500,driver:r.members[r.driver]?.name||null,members:r.members.map((m,i)=>({id:m.id,name:m.name,role:i===r.driver?'Driver':'Navigator',online:(this.live.get(m.id)||0)>Date.now()-12000,help:m.help,lastMcp:m.lastMcp||null})),evidence:r.evidence.length,awaitingReview:awaitingReview(r).length,handoffs:r.handoffs.length,board:r.board?.status||null})).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
 }
 view(r,s) {return Store.prototype.view.call(this,r,s);}
 async cohortRooms(client,cohortId,lock=false) {
  const result=await client.query(`SELECT data FROM rooms WHERE data->>'cohortId'=$1 ORDER BY (data->>'cohortAttachedAt')::bigint${lock?' FOR UPDATE':''}`,[cohortId]);
  return result.rows.map(row=>row.data);
 }
 async cohortRow(client,cohortId,lock=false) {
  const result=await client.query(`SELECT id,name,starts_at,days,read_only_export,current_room_id,created_at FROM cohorts WHERE id=$1${lock?' FOR UPDATE':''}`,[cohortId]);
  const row=result.rows[0];
  if(!row)fail(404,'Cohort niet gevonden.');
  return {id:row.id,name:row.name,startsAt:Number(row.starts_at),days:row.days,readOnlyExport:row.read_only_export,currentRoomId:row.current_room_id,createdAt:Number(row.created_at)};
 }
 async cohortFacts(client,cohort) {
  const members=await client.query('SELECT id,name FROM cohort_members WHERE cohort_id=$1 ORDER BY created_at,name',[cohort.id]);
  const codes=await client.query('SELECT member_id,revoked_at,last_activated_at FROM cohort_access_codes WHERE cohort_id=$1',[cohort.id]);
  return {cohort,members:members.rows,codes:codes.rows.map(row=>({memberId:row.member_id,revokedAt:row.revoked_at===null?null:Number(row.revoked_at),lastActivatedAt:row.last_activated_at===null?null:Number(row.last_activated_at)})),rooms:await this.cohortRooms(client,cohort.id),certificates:await this.certificates(client,'cohort_id=$1',[cohort.id]),now:this.now()};
 }
 async cohortSnapshot(client,cohort) {
  return cohortView(await this.cohortFacts(client,cohort));
 }
 // Reads without a lock first; only when a certificate is due does it take the cohort row lock
 // (the same lock member revoke, code reissue and certificate revoke take) and re-evaluate, so
 // concurrent evaluations insert one certificate and a revoke in flight is never overtaken.
 async settleCertificates(client,cohortId) {
  let cohort=await this.cohortRow(client,cohortId);
  let facts=await this.cohortFacts(client,cohort);
  if(!dueCertificates(facts).length)return facts;
  cohort=await this.cohortRow(client,cohortId,true);
  for(const certificate of dueCertificates(await this.cohortFacts(client,cohort)))await client.query('INSERT INTO cohort_certificates(id,cohort_id,member_id,member_name,cohort_name,starts_at,ends_at,days,issued_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',[certificate.id,cohort.id,certificate.memberId,certificate.name,certificate.cohortName,certificate.startsAt,certificate.endsAt,certificate.days,certificate.issuedAt]);
  return this.cohortFacts(client,cohort);
 }
 async issueCode(client,cohortId,memberId) {
  const {code,codeHash}=issueAccessCode();
  await client.query('INSERT INTO cohort_access_codes(code_hash,cohort_id,member_id,created_at) VALUES ($1,$2,$3,$4)',[codeHash,cohortId,memberId,this.now()]);
  return code;
 }
 async addMembers(client,cohortId,names) {
  const codes=[];
  for(const name of names){
   const id=randomUUID();
   await client.query('INSERT INTO cohort_members(id,cohort_id,name,created_at) VALUES ($1,$2,$3,$4)',[id,cohortId,name,this.now()]);
   codes.push({memberId:id,name,code:await this.issueCode(client,cohortId,id)});
  }
  return codes;
 }
 async createCohort(input,names,createdBy) {
  return this.transaction(async client=>{
   const cohort={id:randomUUID(),...input,currentRoomId:null,createdAt:this.now()};
   await client.query('INSERT INTO cohorts(id,name,starts_at,days,read_only_export,created_by,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',[cohort.id,cohort.name,cohort.startsAt,cohort.days,cohort.readOnlyExport,createdBy?JSON.stringify(createdBy):null,cohort.createdAt]);
   const codes=await this.addMembers(client,cohort.id,names);
   return {cohort:await this.cohortSnapshot(client,cohort),codes};
  });
 }
 async addCohortMembers(cohortId,names) {
  return this.transaction(async client=>{
   await this.cohortRow(client,cohortId,true);
   const taken=await client.query('SELECT 1 FROM cohort_members WHERE cohort_id=$1 AND lower(name)=ANY($2)',[cohortId,names.map(name=>name.toLowerCase())]);
   if(taken.rowCount)fail(409,'Deze naam staat al in dit cohort.');
   return {codes:await this.addMembers(client,cohortId,names)};
  });
 }
 async attachCohortRoom(cohortId,roomId) {
  return this.transaction(async client=>{
   const cohort=await this.cohortRow(client,cohortId,true);
   const found=await client.query('SELECT data FROM rooms WHERE id=$1 FOR UPDATE',[roomId]);
   const r=found.rows[0]?.data;
   if(!r)fail(404,'Kamer bestaat niet.');
   if(r.cohortId&&r.cohortId!==cohortId)fail(409,'Deze kamer hoort al bij een ander cohort.');
   r.cohortId=cohortId;r.cohortAttachedAt=this.now();r.version++;
   await this.save(client,r);
   await client.query('UPDATE cohorts SET current_room_id=$2 WHERE id=$1',[cohortId,roomId]);
   return this.cohortSnapshot(client,{...cohort,currentRoomId:roomId});
  });
 }
 async revokeMember(client,cohortId,memberId) {
  const member=await client.query('SELECT name FROM cohort_members WHERE id=$1 AND cohort_id=$2 FOR UPDATE',[memberId,cohortId]);
  if(!member.rowCount)fail(404,'Deelnemer niet gevonden in dit cohort.');
  await client.query('UPDATE cohort_access_codes SET revoked_at=$2 WHERE member_id=$1 AND revoked_at IS NULL',[memberId,this.now()]);
  await client.query('DELETE FROM sessions WHERE person_id=$1',[memberId]);
  return member.rows[0].name;
 }
 async revokeCohortMember(cohortId,memberId) {
  return this.transaction(async client=>{const cohort=await this.cohortRow(client,cohortId,true);await this.revokeMember(client,cohortId,memberId);return this.cohortSnapshot(client,cohort);});
 }
 async reissueCohortCode(cohortId,memberId) {
  return this.transaction(async client=>{await this.cohortRow(client,cohortId,true);const name=await this.revokeMember(client,cohortId,memberId);return {memberId,name,code:await this.issueCode(client,cohortId,memberId)};});
 }
 async certificates(client,where,values) {
  const result=await client.query(`SELECT id,cohort_id,member_id,member_name,cohort_name,starts_at,ends_at,days,issued_at,issued_by,revoked_at FROM cohort_certificates WHERE ${where}`,values);
  return result.rows.map(row=>({id:row.id,cohortId:row.cohort_id,memberId:row.member_id,name:row.member_name,cohortName:row.cohort_name,startsAt:Number(row.starts_at),endsAt:Number(row.ends_at),days:row.days,issuedAt:Number(row.issued_at),issuedBy:row.issued_by,revokedAt:row.revoked_at===null?null:Number(row.revoked_at)}));
 }
 async certificate(id) {
  return this.transaction(async client=>(await this.certificates(client,'id=$1',[id]))[0]||null);
 }
 async myCertificate(token) {
  return this.transaction(async client=>{
   const {r,p}=await this.authenticated(client,token,'browser');
   if(!p?.cohortMemberId||!r.cohortId)return null;
   const facts=await this.settleCertificates(client,r.cohortId);
   return {cohortName:facts.cohort.name,days:facts.cohort.days,...memberCertificate({...facts,memberId:p.cohortMemberId,codes:facts.codes.filter(code=>code.memberId===p.cohortMemberId)})};
  });
 }
 async revokeCertificate(cohortId,certificateId) {
  return this.transaction(async client=>{
   const cohort=await this.cohortRow(client,cohortId,true);
   const found=await client.query('UPDATE cohort_certificates SET revoked_at=COALESCE(revoked_at,$3) WHERE id=$1 AND cohort_id=$2 RETURNING id',[certificateId,cohortId,this.now()]);
   if(!found.rowCount)fail(404,'Certificaat niet gevonden in dit cohort.');
   return this.cohortSnapshot(client,cohort);
  });
 }
 async cohortOverview() {
  return this.transaction(async client=>{
   const ids=await client.query('SELECT id FROM cohorts ORDER BY created_at DESC');
   const cohorts=[];
   for(const {id} of ids.rows)cohorts.push(cohortView(await this.settleCertificates(client,id)));
   return cohorts;
  });
 }
 async activateCohortCode(input,{ip}={}) {
  const {normalized,codeHash,keys}=attemptKeys(input,ip);
  const allowed=await this.transaction(async client=>{
   const now=this.now();
   await client.query('DELETE FROM access_attempts WHERE window_started_at<$1',[now-Math.max(...Object.values(RATE_LIMITS).map(limit=>limit.windowMs))]);
   let ok=true;
   for(const [key,{max,windowMs}] of keys){
    const result=await client.query(`INSERT INTO access_attempts(key,window_started_at,count) VALUES ($1,$2,1)
     ON CONFLICT (key) DO UPDATE SET
      count=CASE WHEN $2-access_attempts.window_started_at>=$3 THEN 1 ELSE access_attempts.count+1 END,
      window_started_at=CASE WHEN $2-access_attempts.window_started_at>=$3 THEN $2 ELSE access_attempts.window_started_at END
     RETURNING count`,[key,now,windowMs]);
    ok&&=result.rows[0].count<=max;
   }
   return ok;
  });
  if(!allowed)fail(429,COHORT_RATE_LIMIT_MESSAGE);
  return this.transaction(async client=>{
   const now=this.now();
   const found=normalized?await client.query(`SELECT c.cohort_id,c.member_id,m.name FROM cohort_access_codes c JOIN cohort_members m ON m.id=c.member_id WHERE c.code_hash=$1 AND c.revoked_at IS NULL FOR UPDATE OF c`,[codeHash]):{rows:[]};
   const row=found.rows[0];
   if(!row)fail(401,INVALID_COHORT_CODE_MESSAGE);
   const cohort=await this.cohortRow(client,row.cohort_id);
   const grant=sessionGrant(cohort,now);
   if(!cohort.currentRoomId)fail(409,COHORT_NO_ROOM_MESSAGE);
   const rooms=await this.cohortRooms(client,cohort.id,true);
   const r=rooms.find(room=>room.id===cohort.currentRoomId);
   if(!r)fail(409,COHORT_NO_ROOM_MESSAGE);
   const member={id:row.member_id,name:row.name};
   if(!r.members.some(seat=>seat.id===member.id)&&r.members.length>=MAX_SQUAD_SIZE)fail(409,`Squad is vol (maximaal ${MAX_SQUAD_SIZE}).`);
   seatMember(r,member,mergeSeatProgress(rooms,member.id),now);r.version++;
   await this.save(client,r);
   await client.query('UPDATE cohort_access_codes SET last_activated_at=$2 WHERE code_hash=$1',[codeHash,now]);
   return {token:await this.session(client,r.id,member.id,'browser',member.name,grant),roomId:r.id,cohortId:cohort.id,readOnly:grant.readOnly};
  });
 }
 async purgeExpiredCohorts({dryRun=true}={}) {
  return this.transaction(async client=>{
   const now=this.now();
   const all=await client.query('SELECT id FROM cohorts FOR UPDATE');
   const due=[];
   for(const {id} of all.rows){const cohort=await this.cohortRow(client,id);if(now>=cohortWindow(cohort).purgeAt)due.push(cohort);}
   const report=[];
   for(const cohort of due){
    const members=(await client.query('SELECT id FROM cohort_members WHERE cohort_id=$1',[cohort.id])).rows.map(row=>row.id);
    const rooms=await this.cohortRooms(client,cohort.id,true);
    const certificates=await client.query('SELECT count(*)::int AS count FROM cohort_certificates WHERE cohort_id=$1',[cohort.id]);
    report.push({cohortId:cohort.id,members:members.length,rooms:rooms.map(room=>room.id),certificates:certificates.rows[0].count});
    if(dryRun)continue;
    for(const room of rooms)await this.save(client,anonymizeRoom(room,members));
    await client.query('DELETE FROM sessions WHERE person_id=ANY($1)',[members]);
    await client.query('DELETE FROM requests WHERE person_id=ANY($1) OR room_id=ANY($2)',[members,rooms.map(room=>room.id)]);
    await client.query(`UPDATE decks SET data=jsonb_set(data,'{createdBy,name}',to_jsonb($2::text)) WHERE data->'createdBy'->>'id'=ANY($1)`,[members,'Geanonimiseerd']);
    await client.query('DELETE FROM cohorts WHERE id=$1',[cohort.id]);
   }
   return {dryRun,purged:report};
  });
 }
}
