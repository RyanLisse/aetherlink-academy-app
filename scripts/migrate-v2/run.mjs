#!/usr/bin/env node
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {LEGACY_DAYS,MIGRATION_SOURCE,inventory,planMigration,readOwnershipMap} from './plan.mjs';
import {redactUrl} from './source.mjs';
import {applyToTarget,planAgainstTarget} from './target.mjs';
import {parse,loadSource,main,SOURCE_OPTIONS,UsageError} from './cli.mjs';

const DEFAULT_OUT=path.join(path.dirname(fileURLToPath(import.meta.url)),'out');

export const USAGE=`Usage: node scripts/migrate-v2/run.mjs (--source <snapshot.json> | --source-url <postgres url>) [--dry-run | --apply ...] [options]

Maps legacy Academy rooms onto v2 academy_runtime.squad_rooms. Dry run is the default and writes nothing to any database.

  --source <file>            legacy rooms.json or academy-v1-postgres-export file
  --source-url <url>         legacy Postgres, read in a READ ONLY transaction
  --source-schema <name>     legacy schema name (default academy)
  --target <url>             v2 Postgres. Dry run: read-only comparison. Apply: required.
  --ownership-map <file>     {"verified":[{roomId,memberId,verifiedBy,evidence}]} for duplicate display names
  --out <dir>                report directory (default scripts/migrate-v2/out/<run id>)
  --dry-run                  plan and report only (default)
  --apply                    write to --target; also needs --i-have-a-snapshot
  --i-have-a-snapshot        confirms a restorable snapshot of the target and source exists`;

const count=(items,key)=>items.reduce((acc,item)=>({...acc,[item[key]]:(acc[item[key]]||0)+1}),{});

function buildReport({mode,values,snapshot,plan,runId}){
 const stock=inventory(snapshot);
 return {
  runId,
  mode,
  migrationSource:MIGRATION_SOURCE,
  source:{origin:snapshot.origin,locator:values.source?path.basename(values.source):redactUrl(values['source-url'])},
  target:values.target?{table:'academy_runtime.squad_rooms',locator:redactUrl(values.target)}:null,
  dayMap:LEGACY_DAYS,
  inventory:stock.counts,
  rooms:{
   [mode==='apply'?'inserted':'wouldInsert']:plan.insert.map(row=>row.id),
   alreadyMigrated:plan.skip.map(row=>row.id),
   heldForReview:[...new Set(plan.exceptions.filter(e=>!plan.insert.some(r=>r.id===e.roomId)&&!plan.skip.some(r=>r.id===e.roomId)).map(e=>e.roomId))],
  },
  exceptions:count(plan.exceptions,'kind'),
  invalidatedAtCutover:{sessions:stock.counts.sessions,facilitatorSessions:snapshot.facilitatorSessions,loginStates:snapshot.loginStates,resumeAccessRemoved:plan.droppedAccess},
  notMigrated:{requestLedgerRows:snapshot.requests.length+plan.droppedRequestLedger,decks:snapshot.decks.length},
  notes:[
   'Room ids, room codes and Proof slugs are preserved; source identifiers live in data.migration.',
   'No academy_curriculum progress, lesson_release or course-pin rows are written; legacy days map only to legacy-v1 historical lessons.',
   'Legacy browser, MCP and facilitator sessions and member resume access are not migrated; everyone signs in again after cutover.',
   'Nothing is deleted from the source. Held rooms and records are listed in exceptions.json.',
  ],
 };
}

export async function runMigration(argv,log=console.log){
 const values=parse(argv,{...SOURCE_OPTIONS,target:{type:'string'},'ownership-map':{type:'string'},out:{type:'string'},'dry-run':{type:'boolean',default:false},apply:{type:'boolean',default:false},'i-have-a-snapshot':{type:'boolean',default:false},help:{type:'boolean',default:false}});
 if(values.help){log(USAGE);return 0;}
 if(values.apply&&values['dry-run'])throw new UsageError('choose --dry-run or --apply, not both');
 const mode=values.apply?'apply':'dry-run';
 if(mode==='apply'){
  if(!values.target)throw new UsageError('--apply refuses to run without an explicit --target <url>');
  if(!values['i-have-a-snapshot'])throw new UsageError('--apply refuses to run without --i-have-a-snapshot; take and verify a restorable snapshot first');
 }
 const snapshot=await loadSource(values);
 const verified=readOwnershipMap(values['ownership-map']?JSON.parse(await readFile(values['ownership-map'],'utf8')):undefined);
 const plan=mode==='apply'
  ?await applyToTarget(values.target,snapshot,{verified})
  :values.target?await planAgainstTarget(values.target,snapshot,{verified}):planMigration(snapshot,{verified});
 const runId=`${new Date().toISOString().replaceAll(':','-')}-${mode}`;
 const out=values.out||path.join(DEFAULT_OUT,runId);
 await mkdir(out,{recursive:true,mode:0o700});
 const report=buildReport({mode,values,snapshot,plan,runId});
 await writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2),{mode:0o600});
 await writeFile(path.join(out,'exceptions.json'),JSON.stringify(plan.exceptions,null,2),{mode:0o600});
 const inserted=report.rooms.inserted??report.rooms.wouldInsert;
 log(`${mode}: ${mode==='apply'?'inserted':'would insert'} ${inserted.length}, already migrated ${plan.skip.length}, held for review ${report.rooms.heldForReview.length}, exceptions ${plan.exceptions.length} ${JSON.stringify(report.exceptions)}`);
 log(`report: ${path.join(out,'report.json')}`);
 log(`exceptions: ${path.join(out,'exceptions.json')}`);
 return 0;
}

if(import.meta.url===pathToFileURL(process.argv[1]).href)main(runMigration,USAGE);
