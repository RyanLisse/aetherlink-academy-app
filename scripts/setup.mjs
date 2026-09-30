import {spawnSync} from 'node:child_process';import {existsSync} from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const bundled=path.join(process.env.HOME||'','.cache','codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/bin/pnpm.cjs');
const cli=process.env.PNPM_CLI||(existsSync(bundled)?bundled:null);
const env={...process.env,PATH:path.dirname(process.execPath)+path.delimiter+process.env.PATH};
function run(cwd,args){const r=spawnSync(cli?process.execPath:'pnpm',cli?[cli,...args]:args,{cwd,env,stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
run(root,['install','--frozen-lockfile']);run(root,['run','build']);
