#!/usr/bin/env node
import {writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {inventory} from './plan.mjs';
import {exportFromPostgres} from './source.mjs';
import {parse,loadSource,main,SOURCE_OPTIONS,UsageError} from './cli.mjs';

export const USAGE=`Usage: node scripts/migrate-v2/inventory.mjs (--source <snapshot.json> | --source-url <postgres url>) [options]

Reads a legacy Academy store and prints its day semantics and record counts. Read-only.

  --source <file>          legacy rooms.json (server/store.mjs) or an academy-v1-postgres-export file
  --source-url <url>       legacy Postgres (server/schema/academy.sql), read in a READ ONLY transaction
  --source-schema <name>   legacy schema name (default academy)
  --write-export <file>    with --source-url: also freeze the read as an export file for later runs
  --json                   print the inventory as JSON`;

export async function runInventory(argv,log=console.log){
 const values=parse(argv,{...SOURCE_OPTIONS,json:{type:'boolean',default:false},'write-export':{type:'string'},help:{type:'boolean',default:false}});
 if(values.help){log(USAGE);return 0;}
 if(values['write-export']){
  if(!values['source-url'])throw new UsageError('--write-export needs --source-url');
  const exported=await exportFromPostgres(values['source-url'],values['source-schema']);
  await writeFile(values['write-export'],JSON.stringify(exported,null,1),{mode:0o600});
  values.source=values['write-export'];
  delete values['source-url'];
 }
 const result=inventory(await loadSource(values));
 if(values.json){log(JSON.stringify(result,null,2));return 0;}
 const c=result.counts;
 log(`origin: ${result.origin}`);
 log(result.daySemantics);
 for(const day of Object.values(result.days))log(`  supportdag ${day.legacyDay} -> ${day.historicalLessonId} (${day.lessonTitle}): rooms ${day.roomsOnDay}, progress ${day.progressEntries}, evidence ${day.evidence}, handoffs ${day.handoffs}`);
 log(`  unknown: rooms on unknown day ${result.unknownDays.roomsOnUnknownDay.length}, records with unknown day ${result.unknownDays.records}`);
 log(`rooms ${c.rooms} (malformed ${c.malformedRooms}), members ${c.members}, members with resume access ${c.membersWithResumeAccess}, duplicate-name groups ${c.duplicateNameGroups}`);
 log(`sessions ${JSON.stringify(c.sessions)}, facilitator sessions ${c.facilitatorSessions}, login states ${c.loginStates}, requests ${c.requests}, decks ${c.decks}`);
 return 0;
}

if(import.meta.url===pathToFileURL(process.argv[1]).href)main(runInventory,USAGE);
