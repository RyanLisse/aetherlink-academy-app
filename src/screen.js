import {api} from './api';

const tabId=crypto.randomUUID();
let current={view:null};
const send=()=>{if(current.view)api('screen-state',{tabId,...current}).catch(()=>{});};

export function reportScreen(patch){current={...current,...patch};send();}
export function startScreenReporting(){const timer=setInterval(send,10000);return()=>clearInterval(timer);}
