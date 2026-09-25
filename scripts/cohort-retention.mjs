import pg from 'pg';
import {PostgresStore} from '../server/postgres-store.mjs';

const apply=process.argv.includes('--apply');
if(!process.env.DATABASE_URL){console.error('DATABASE_URL is required. Dry run by default; pass --apply to anonymize.');process.exit(2);}
const url=new URL(process.env.DATABASE_URL);
url.searchParams.delete('sslmode');
url.searchParams.delete('channel_binding');
const pool=new pg.Pool({connectionString:url.href,ssl:process.env.PGSSLMODE==='disable'?false:{rejectUnauthorized:true},max:1});
try{
 // No init(): this job must never migrate a schema, only read and anonymize an existing one.
 const store=new PostgresStore(pool,{schema:process.env.ACADEMY_DATABASE_SCHEMA||'academy'});
 console.log(JSON.stringify(await store.purgeExpiredCohorts({dryRun:!apply}),null,1));
}finally{await pool.end();}
