import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadEnvFile} from 'node:process';
import {validateRuntimeEnvironment} from '../server/runtime-config.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
process.chdir(root);
if(process.env.ACADEMY_ENV_FILE)loadEnvFile(path.resolve(process.env.ACADEMY_ENV_FILE));
const storageMode=process.env.ACADEMY_STORAGE||'postgres';
validateRuntimeEnvironment(process.env);
const dir=path.resolve(process.env.ACADEMY_DATA||path.join(root,'.data'));
mkdirSync(dir,{recursive:true,mode:0o700});
const port=Number(process.env.PORT||4317);
const publicUrl=process.env.ACADEMY_PUBLIC_URL||`http://127.0.0.1:${port}`;
let storage;
if(storageMode==='postgres'){
 const {createStorage}=await import('../server/storage.mjs');
 storage=await createStorage({databaseUrl:process.env.DATABASE_URL,redisUrl:process.env.REDIS_URL||process.env.KV_URL,schema:process.env.ACADEMY_DATABASE_SCHEMA||'academy',prefix:process.env.ACADEMY_REDIS_PREFIX||'academy'});
}
let server,stopping=false;
async function stop(code=0){
 if(stopping)return;stopping=true;
 const deadline=setTimeout(()=>process.exit(code||1),25000);deadline.unref();
 server?.close();server?.closeAllConnections();
 await storage?.close();
 clearTimeout(deadline);process.exit(code);
}
process.on('SIGINT',()=>void stop());process.on('SIGTERM',()=>void stop());
try{
 const {createApp}=await import('../server/app.mjs');
 ({server}=createApp({dir,root,hostKey:process.env.ACADEMY_HOST_KEY,publicBaseUrl:publicUrl,...storage}));
 server.on('error',()=>void stop(1));
 server.listen(port,process.env.HOST||'127.0.0.1',()=>console.log(`Academy: http://127.0.0.1:${port}\nAcademy storage: ${storageMode}.\nFacilitator host key: ${process.env.ACADEMY_HOST_KEY?'server environment':path.join(dir,'host-key')}`));
}catch(error){console.error(error.message);await stop(1);}
