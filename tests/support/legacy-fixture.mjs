import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createApp} from '../../server/app.mjs';
import {LocalStore} from '../../server/local-store.mjs';

// Synthetic, deterministic Academy for browser checks: fixed server clock, fixed
// room code, invented names. Nothing here is real participant data.
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const FIXED_NOW=Date.parse('2026-10-07T09:00:00Z');
export const ROOM_CODE='SQUAD7';
export const HOST_KEY='test-host';
const DAY=24*60*60*1000;

export async function startLegacyFixture({port=0}={}){
  const dir=mkdtempSync(path.join(os.tmpdir(),'academy-legacy-ui-'));
  const clock={now:FIXED_NOW};
  const store=new LocalStore(dir,{now:()=>clock.now});
  const app=createApp({dir,repository:store,root,hostKey:HOST_KEY,proofBase:'http://127.0.0.1:9',publicBaseUrl:'http://127.0.0.1:4317',slidesService:{run:async()=>null}});
  await new Promise(resolve=>app.server.listen(port,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${app.server.address().port}`;
  const post=async(route,body)=>{const response=await fetch(base+route,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const json=await response.json();if(!response.ok)throw Error(`${route}: ${json.error}`);return json;};

  const squad=store.create('Squad Noord',{slug:'squad-noord'});
  store.data.rooms[squad.roomId].code=ROOM_CODE;
  store.save();
  for(const name of ['Ada','Grace','Linus','Margaret'])store.join(ROOM_CODE,name);
  const participant=store.join(ROOM_CODE,'Tim');

  const cohortRoom=store.create('Squad Wave',{slug:'squad-wave'});
  store.data.rooms[cohortRoom.roomId].code='WAVE01';
  store.save();
  const cohort=await post('/game/facilitator/cohort/create',{hostKey:HOST_KEY,name:'Wave oktober (synthetisch)',startDate:'2026-10-05',days:5,members:['Alice','Bob']});
  await post('/game/facilitator/cohort/attach',{hostKey:HOST_KEY,cohortId:cohort.cohort.id,roomId:cohortRoom.roomId});

  return {
    base,
    facilitatorToken:squad.token,
    participantAccess:participant.resumeToken,
    cohortCodes:cohort.codes.map(entry=>entry.code),
    // Moves the server past the 90-day write window so a cohort code opens read-only.
    enterReadOnlyWindow:()=>{clock.now=cohort.cohort.startsAt+91*DAY;},
    close:async()=>{await new Promise(resolve=>app.server.close(resolve));rmSync(dir,{recursive:true,force:true});},
  };
}
