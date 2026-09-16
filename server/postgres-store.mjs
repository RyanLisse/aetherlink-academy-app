import {createHash, randomBytes, randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {hash, secret, fail, Store, MAX_SQUAD_SIZE} from './store.mjs';

export class PostgresStore {
 constructor(pool, {schema='academy'}={}) {
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
  const migration=`3:${createHash('sha256').update(sql).digest('hex')}`,previousMigrations=['2:3fa9bb87a5cfb8efe24eddc2f7fa94ff0657c0d711f5f9e19e41c6f91b12f3d2','1:cfd75de0661902abf5fd6d4b2fe2984d7e9228cc111392e96686ed29d228b3e1'];
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
 async session(client,roomId,personId,kind,displayName) {
  const token=secret();
  await client.query('INSERT INTO sessions(token_hash,room_id,person_id,kind,expires_at,display_name) VALUES ($1,$2,$3,$4,$5,$6)',[hash(token),roomId,personId,kind,Date.now()+12*60*60*1000,displayName||null]);
  return token;
 }
 async authenticated(client,token,kind,lock=false) {
  const key=hash(token||'');
  const found=await client.query('SELECT room_id FROM sessions WHERE token_hash=$1',[key]);
  if (!found.rows[0]) fail(401,'Geen geldige toegang. Meld je opnieuw aan.');
  const room=await client.query(`SELECT data FROM rooms WHERE id=$1${lock?' FOR UPDATE':''}`,[found.rows[0].room_id]);
  const session=await client.query('SELECT room_id,person_id,kind,expires_at,display_name FROM sessions WHERE token_hash=$1',[key]);
  const row=session.rows[0];
  if (!row || Number(row.expires_at)<Date.now() || kind&&row.kind!==kind) fail(401,'Geen geldige toegang. Meld je opnieuw aan.');
  if (!room.rows[0]) fail(401,'Kamer bestaat niet.');
  const s={roomId:row.room_id,personId:row.person_id,kind:row.kind,expiresAt:Number(row.expires_at),displayName:row.display_name||undefined};
  const r=room.rows[0].data;
  return {s,r,p:r.members.find(member=>member.id===s.personId)};
 }
 async auth(token,kind) {return this.transaction(client=>this.authenticated(client,token,kind));}
 async save(client,r) {await client.query('UPDATE rooms SET data=$2 WHERE id=$1',[r.id,JSON.stringify(r)]);}
 async withSession(token,kind,fn) {
  return this.transaction(async client=>{
   const context=await this.authenticated(client,token,kind,true);
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
   const existing=r.members.find(m=>m.name.toLowerCase()===name.toLowerCase());
   if (existing) return {token:await this.session(client,r.id,existing.id,'browser'),roomId:r.id,rejoined:true};
   if (r.members.length>=MAX_SQUAD_SIZE) fail(409,`Squad is vol (maximaal ${MAX_SQUAD_SIZE}).`);
   const p={id:randomUUID(),name,help:false,quiz:null,route:'standard',progressByDay:{},lastMcp:null};
   r.members.push(p);r.version++;
   await this.save(client,r);
   return {token:await this.session(client,r.id,p.id,'browser'),roomId:r.id};
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
   const {r,p}=await this.authenticated(client,token,'browser',true);
   if (!p) fail(403,'Gebruik hiervoor een deelnemerssessie.');
   await client.query("DELETE FROM sessions WHERE room_id=$1 AND person_id=$2 AND kind='mcp'",[r.id,p.id]);
   return {token:await this.session(client,r.id,p.id,'mcp')};
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
   const context=await this.authenticated(client,token,undefined,true);
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
   const context=await this.authenticated(client,token,undefined,true);
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
  return result.rows.map(({data:r})=>({id:r.id,name:r.name,code:r.code,createdBy:r.createdBy||null,createdAt:r.createdAt||null,round:r.round,phase:r.phase,day:r.day,mode:r.mode,running:r.running,remaining:this.remaining(r),roundSeconds:r.roundSeconds||1500,driver:r.members[r.driver]?.name||null,members:r.members.map((m,i)=>({id:m.id,name:m.name,role:i===r.driver?'Driver':'Navigator',online:(this.live.get(m.id)||0)>Date.now()-12000,help:m.help,lastMcp:m.lastMcp||null})),evidence:r.evidence.length,handoffs:r.handoffs.length})).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
 }
 view(r,s) {return Store.prototype.view.call(this,r,s);}
}
