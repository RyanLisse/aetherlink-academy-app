const PARTICIPANT_ACCESS_KEY='academy-participant-access';
export function getToken(){return sessionStorage.getItem('academy-token');}
export function getParticipantAccess(){return localStorage.getItem(PARTICIPANT_ACCESS_KEY);}
export function saveParticipantAccess(token){if(token)localStorage.setItem(PARTICIPANT_ACCESS_KEY,token);}
export function forgetParticipantAccess(){localStorage.removeItem(PARTICIPANT_ACCESS_KEY);}
export function participantAccessUrl(token=getParticipantAccess()){if(!token)return null;const url=new URL(location.origin+location.pathname);url.hash=new URLSearchParams({access:token}).toString();return url.toString();}
async function request(path,body,token=false,method=body?'POST':'GET'){const response=await fetch(path,{method,headers:{'content-type':'application/json',...(token&&getToken()?{authorization:`Bearer ${getToken()}`}:{})},body:body?JSON.stringify(body):undefined}),data=response.status===204?null:await response.json();if(!response.ok)throw Error(data?.error||'Verzoek mislukt.');return data;}
export const api=(path,body)=>request('/game/'+path,body,true);
export const apiMethod=(method,path,body)=>request('/game/'+path,body,true,method);
export const authApi=(path,body)=>request('/auth/'+path,body);
export function saveSession(data){sessionStorage.setItem('academy-token',data.token);saveParticipantAccess(data.resumeToken);}
