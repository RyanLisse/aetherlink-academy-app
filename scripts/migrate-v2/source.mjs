import {readFile} from 'node:fs/promises';

export const EXPORT_FORMAT='academy-v1-postgres-export';
const SCHEMA=/^[a-z][a-z0-9_]{0,62}$/;

// A LegacySnapshot is what every command reads:
// {origin, rooms:[{sourceRoomId,data}], sessions:[{roomId,kind}], facilitatorSessions, loginStates, requests:[{roomId,kind}], decks:[{id,roomId}]}
// Session token hashes are never read; sessions are only counted and dropped.

function fromFileStore(json){
 const rooms=Object.entries(json.rooms||{}).map(([sourceRoomId,data])=>({sourceRoomId,data}));
 const requests=rooms.flatMap(({sourceRoomId,data})=>Object.keys(data?.requests&&typeof data.requests==='object'?data.requests:{}).map(key=>{
  let kind='unknown';
  try{kind=JSON.parse(key)[1]??kind;}catch{}
  return {roomId:sourceRoomId,kind};
 }));
 return {
  origin:'file-store',
  rooms,
  sessions:Object.values(json.sessions||{}).map(session=>({roomId:session?.roomId??null,kind:session?.kind??'unknown'})),
  facilitatorSessions:Object.keys(json.facilitators||{}).length,
  loginStates:0,
  requests,
  decks:[],
 };
}

function fromPostgresExport(json){
 const tables=json.tables||{};
 return {
  origin:'postgres-export',
  rooms:(tables.rooms||[]).map(row=>({sourceRoomId:row.id,data:typeof row.data==='string'?JSON.parse(row.data):row.data})),
  sessions:(tables.sessions||[]).map(row=>({roomId:row.room_id,kind:row.kind})),
  facilitatorSessions:Number(tables.facilitator_sessions_count||0),
  loginStates:Number(tables.login_states_count||0),
  requests:(tables.requests||[]).map(row=>({roomId:row.room_id,kind:row.kind})),
  decks:(tables.decks||[]).map(row=>({id:row.id,roomId:row.room_id})),
 };
}

export function snapshotFromJson(json){
 if(json?.format===EXPORT_FORMAT)return fromPostgresExport(json);
 if(json&&typeof json.rooms==='object'&&!Array.isArray(json.rooms)&&typeof json.sessions==='object')return fromFileStore(json);
 throw new Error(`unrecognised source: expected a legacy rooms.json or a ${EXPORT_FORMAT} file`);
}

export async function snapshotFromFile(path){
 return snapshotFromJson(JSON.parse(await readFile(path,'utf8')));
}

export function poolConfig(url){
 const parsed=new URL(url);
 parsed.searchParams.delete('sslmode');
 parsed.searchParams.delete('channel_binding');
 return {connectionString:parsed.href,ssl:process.env.PGSSLMODE==='disable'?false:{rejectUnauthorized:true},max:2,connectionTimeoutMillis:10000};
}

export const redactUrl=url=>{
 try{const parsed=new URL(url);return `${parsed.protocol}//${parsed.hostname}${parsed.port?`:${parsed.port}`:''}${parsed.pathname}`;}
 catch{return '<unparseable url>';}
};

// Reads the legacy server/schema/academy.sql tables in a READ ONLY transaction.
export async function exportFromPostgres(url,schema='academy'){
 if(!SCHEMA.test(schema))throw new Error('invalid legacy schema name');
 const {default:pg}=await import('pg');
 const client=new pg.Client(poolConfig(url));
 await client.connect();
 try{
  await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const q=sql=>client.query(sql).then(result=>result.rows);
  const count=async table=>Number((await q(`SELECT count(*)::int AS n FROM "${schema}".${table}`))[0].n);
  const tables={
   rooms:await q(`SELECT id,code,data FROM "${schema}".rooms ORDER BY id`),
   sessions:await q(`SELECT room_id,kind FROM "${schema}".sessions`),
   facilitator_sessions_count:await count('facilitator_sessions'),
   login_states_count:await count('login_states'),
   requests:await q(`SELECT room_id,kind FROM "${schema}".requests`),
   decks:await q(`SELECT id,room_id FROM "${schema}".decks`),
  };
  await client.query('COMMIT');
  return {format:EXPORT_FORMAT,schema,tables};
 }finally{await client.end();}
}
