import {parseArgs} from 'node:util';
import {snapshotFromFile,exportFromPostgres,snapshotFromJson} from './source.mjs';

export class UsageError extends Error {}

export function parse(argv,options){
 try{return parseArgs({args:argv,options,strict:true,allowPositionals:false}).values;}
 catch(error){throw new UsageError(error.message);}
}

export const SOURCE_OPTIONS={
 source:{type:'string'},
 'source-url':{type:'string'},
 'source-schema':{type:'string',default:'academy'},
};

export async function loadSource(values){
 if(Boolean(values.source)===Boolean(values['source-url']))throw new UsageError('give exactly one of --source <snapshot.json> or --source-url <postgres url>');
 if(values.source)return snapshotFromFile(values.source);
 return snapshotFromJson(await exportFromPostgres(values['source-url'],values['source-schema']));
}

export async function main(run,usage){
 try{process.exitCode=await run(process.argv.slice(2))??0;}
 catch(error){
  if(error instanceof UsageError){console.error(`${error.message}\n\n${usage}`);process.exitCode=2;return;}
  console.error(error?.stack||String(error));
  process.exitCode=1;
 }
}
