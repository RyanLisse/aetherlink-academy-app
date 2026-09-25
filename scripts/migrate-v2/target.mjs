import {poolConfig} from './source.mjs';
import {planMigration} from './plan.mjs';

const TABLE='academy_runtime.squad_rooms';
const LOCK='academy-migrate-v2';

async function existingRows(client){
 const present=await client.query("SELECT to_regclass($1) AS t",[TABLE]);
 if(!present.rows[0].t)throw new Error(`${TABLE} does not exist on the target; run the v2 runtime migrations first`);
 const {rows}=await client.query(`SELECT id::text AS id,code,data->'migration'->>'sourceFingerprint' AS fp FROM ${TABLE}`);
 return rows.map(row=>({id:row.id,code:row.code,sourceFingerprint:row.fp}));
}

async function connect(url){
 const {default:pg}=await import('pg');
 const client=new pg.Client(poolConfig(url));
 await client.connect();
 return client;
}

export async function planAgainstTarget(url,snapshot,options){
 const client=await connect(url);
 try{
  await client.query('BEGIN TRANSACTION READ ONLY');
  const plan=planMigration(snapshot,{...options,existing:await existingRows(client)});
  await client.query('COMMIT');
  return plan;
 }finally{await client.end();}
}

// Plans again under an advisory lock so a concurrent run cannot interleave,
// then inserts only rows the plan marked new. ON CONFLICT keeps a lost race harmless.
export async function applyToTarget(url,snapshot,options){
 const client=await connect(url);
 try{
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[LOCK]);
  const plan=planMigration(snapshot,{...options,existing:await existingRows(client)});
  const inserted=[];
  for(const row of plan.insert){
   const result=await client.query(`INSERT INTO ${TABLE}(id,code,data) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING id`,[row.id,row.code,JSON.stringify(row.data)]);
   if(result.rowCount)inserted.push(row.id);
  }
  if(inserted.length!==plan.insert.length)throw new Error('target changed during apply; rolled back, rerun to converge');
  await client.query('COMMIT');
  return plan;
 }catch(error){
  await client.query('ROLLBACK').catch(()=>{});
  throw error;
 }finally{await client.end();}
}
