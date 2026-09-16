import {createHmac,createPublicKey,timingSafeEqual,verify} from 'node:crypto';

const GOOGLE_ISSUER='https://accounts.google.com';
const CACHE_TTL=60*60*1000;
const CLOCK_SKEW=5*60;
const encoded=value=>Buffer.from(value).toString('base64url');
const decoded=value=>JSON.parse(Buffer.from(value,'base64url').toString('utf8'));
const failure=(code,reason)=>Object.assign(new Error(`Google-login mislukt (${code}${reason?`:${reason}`:''}).`),{code,reason:reason||null});
const same=(left,right)=>{const a=Buffer.from(String(left||'')),b=Buffer.from(String(right||''));return a.length===b.length&&timingSafeEqual(a,b);};
const audienceMatches=(aud,clientId)=>{
 if(typeof aud==='string')return aud===clientId;
 if(Array.isArray(aud))return aud.some(value=>typeof value==='string'&&value===clientId);
 return false;
};
const emailVerified=value=>value===true||value==='true';

export function signLoginState(obj,secret){const payload=encoded(JSON.stringify(obj));return `${payload}.${createHmac('sha256',secret).update(payload).digest('base64url')}`;}
export function readLoginState(value,secret){
 const [payload,signature,...rest]=String(value||'').split('.');
 if(!payload||!signature||rest.length||!same(signature,createHmac('sha256',secret).update(payload).digest('base64url')))throw Object.assign(failure('state','bad-signature'),{reason:'bad-signature'});
 try{return decoded(payload);}catch{throw Object.assign(failure('state','bad-signature'),{reason:'bad-signature'});}
}

export function createGoogleSso({clientId,clientSecret,allowedDomains,publicUrl,fetchImpl=fetch}){
 clientId=String(clientId||'').trim();
 clientSecret=String(clientSecret||'').trim();
 const domains=(Array.isArray(allowedDomains)?allowedDomains:String(allowedDomains||'').split(',')).map(domain=>domain.trim().toLowerCase()).filter(Boolean);
 const enabled=Boolean(clientId&&clientSecret&&domains.length);
 const redirectUri=new URL('/auth/google/callback',publicUrl).href;
 let discoveryCache,jwksCache;
 async function json(url,options,code='verify',reason='fetch'){
  let response;try{response=await fetchImpl(url,{...options,signal:AbortSignal.timeout(8000)});}catch{throw failure(code,reason);}
  if(!response.ok)throw failure(code,reason);
  try{return await response.json();}catch{throw failure(code,reason);}
 }
 async function discovery(){
  if(discoveryCache?.expiresAt>Date.now())return discoveryCache.value;
  const value=await json(`${GOOGLE_ISSUER}/.well-known/openid-configuration`,undefined,'verify','discovery');
  if(value.issuer!==GOOGLE_ISSUER||![value.authorization_endpoint,value.token_endpoint,value.jwks_uri].every(endpoint=>{try{return new URL(endpoint).protocol==='https:';}catch{return false;}}))throw failure('verify','discovery');
  discoveryCache={value,expiresAt:Date.now()+CACHE_TTL};return value;
 }
 async function jwks(force=false){
  if(!force&&jwksCache?.expiresAt>Date.now())return jwksCache.value;
  const config=await discovery(),value=await json(config.jwks_uri,undefined,'verify','jwks');
  if(!Array.isArray(value.keys))throw failure('verify','jwks');
  jwksCache={value:value.keys,expiresAt:Date.now()+CACHE_TTL};return value.keys;
 }
 async function verifyIdToken(idToken,{nonce}={}){
  const parts=String(idToken||'').split('.');if(parts.length!==3)throw failure('verify','malformed');
  let header,payload;try{header=decoded(parts[0]);payload=decoded(parts[1]);}catch{throw failure('verify','malformed');}
  if(header.alg!=='RS256'||typeof header.kid!=='string')throw failure('verify','malformed');
  let key=(await jwks()).find(candidate=>candidate.kid===header.kid);
  if(!key)key=(await jwks(true)).find(candidate=>candidate.kid===header.kid);
  if(!key)throw failure('verify','jwks');
  let valid=false;try{valid=verify('RSA-SHA256',Buffer.from(`${parts[0]}.${parts[1]}`),createPublicKey({key,format:'jwk'}),Buffer.from(parts[2],'base64url'));}catch{}
  if(!valid)throw failure('verify','signature');
  const now=Math.floor(Date.now()/1000);
  if(!['accounts.google.com',GOOGLE_ISSUER].includes(payload.iss))throw failure('verify','iss');
  if(!audienceMatches(payload.aud,clientId))throw failure('verify','aud');
  if(!Number.isInteger(payload.exp)||payload.exp<now-CLOCK_SKEW)throw failure('verify','exp');
  if(!Number.isInteger(payload.iat)||payload.iat>now+CLOCK_SKEW||payload.iat>payload.exp)throw failure('verify','iat');
  if(typeof nonce!=='string'||!nonce||typeof payload.nonce!=='string'||!same(payload.nonce,nonce))throw failure('verify','nonce');
  if(!emailVerified(payload.email_verified))throw failure('verify','email_verified');
  if(typeof payload.sub!=='string'||!payload.sub)throw failure('verify','sub');
  if(typeof payload.email!=='string')throw failure('verify','email');
  const email=payload.email.toLowerCase(),separator=email.lastIndexOf('@');if(separator<1||separator===email.length-1)throw failure('verify','email');const emailDomain=email.slice(separator+1),hasHostedDomain=Object.hasOwn(payload,'hd');
  if(hasHostedDomain&&(typeof payload.hd!=='string'||!payload.hd.trim()))throw failure('domain','hd');const domain=hasHostedDomain?payload.hd.trim().toLowerCase():emailDomain;
  if(!domains.includes(domain))throw failure('domain','allowlist');
  return {sub:payload.sub,email,name:typeof payload.name==='string'&&payload.name.trim()?payload.name.trim():'Facilitator',domain};
 }
 async function startUrl({state,nonce,codeChallenge}){
  if(!enabled)throw failure('disabled','config');const config=await discovery();
  const url=new URL(config.authorization_endpoint);url.searchParams.set('client_id',clientId);url.searchParams.set('redirect_uri',redirectUri);url.searchParams.set('response_type','code');url.searchParams.set('scope','openid email profile');url.searchParams.set('state',state);url.searchParams.set('nonce',nonce);url.searchParams.set('code_challenge',codeChallenge);url.searchParams.set('code_challenge_method','S256');if(domains.length===1)url.searchParams.set('hd',domains[0]);return url.href;
 }
 async function exchangeAndVerify({code,codeVerifier,nonce}){
  if(!enabled)throw failure('disabled','config');if(typeof code!=='string'||!code||typeof codeVerifier!=='string'||!codeVerifier)throw failure('token','code');const config=await discovery();
  const body=new URLSearchParams({grant_type:'authorization_code',code,client_id:clientId,client_secret:clientSecret,redirect_uri:redirectUri,code_verifier:codeVerifier});
  const tokens=await json(config.token_endpoint,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body},'token','token');
  if(typeof tokens.id_token!=='string')throw failure('token','id_token');return verifyIdToken(tokens.id_token,{nonce});
 }
 // Server-side state alone allows a login-CSRF (a victim can end up signed in as an attacker's Google identity); impact is bounded because createdBy records the true identity and only allowlisted Workspace domains can authenticate at all, and the cookie binding above still applies whenever the cookie survives the round trip.
 async function handleCallback(query,loginState){
  if(!loginState||loginState.expiresAt<Date.now()||typeof query?.state!=='string'||!same(query.state,loginState.state))throw failure('state','mismatch');
  return exchangeAndVerify({code:query?.code,codeVerifier:loginState.codeVerifier,nonce:loginState.nonce});
 }
 return {enabled,startUrl,handleCallback,exchangeAndVerify,verifyIdToken};
}
