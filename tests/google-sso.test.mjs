import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac,generateKeyPairSync,sign} from 'node:crypto';
import {createGoogleSso,readLoginState,signLoginState} from '../server/google-sso.mjs';

const now=()=>Math.floor(Date.now()/1000);
function fixture(allowedDomain='allowed.example',{clientId='client-id'}={}){
 const {publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:2048}),jwk={...publicKey.export({format:'jwk'}),kid:'test-key',alg:'RS256',use:'sig'};let token;
 const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
 const issue=(claims,headerOverrides={})=>{const header=encode({alg:'RS256',kid:jwk.kid,typ:'JWT',...headerOverrides}),payload=encode(claims),input=`${header}.${payload}`,signature=headerOverrides.alg==='none'?'':headerOverrides.alg==='HS256'?createHmac('sha256','client-secret').update(input).digest('base64url'):sign('RSA-SHA256',Buffer.from(input),privateKey).toString('base64url');return `${input}.${signature}`;};
 const fetchImpl=async(url,options={})=>{
  if(url==='https://accounts.google.com/.well-known/openid-configuration')return Response.json({issuer:'https://accounts.google.com',authorization_endpoint:'https://accounts.google.com/o/oauth2/v2/auth',token_endpoint:'https://oauth2.googleapis.com/token',jwks_uri:'https://www.googleapis.com/oauth2/v3/certs'});
  if(url==='https://www.googleapis.com/oauth2/v3/certs')return Response.json({keys:[jwk]});
  if(url==='https://oauth2.googleapis.com/token'){assert.equal(options.method,'POST');return Response.json({id_token:token});}
  throw Error(`Unexpected URL ${url}`);
 };
 const sso=createGoogleSso({clientId,clientSecret:'client-secret',allowedDomains:allowedDomain,publicUrl:'https://academy.example.test',fetchImpl});
 const claims=overrides=>({iss:'https://accounts.google.com',aud:clientId.trim(),sub:'google-subject',email:'facilitator@allowed.example',email_verified:true,name:'Ada Facilitator',hd:'allowed.example',nonce:'expected-nonce',iat:now(),exp:now()+600,...overrides});
 return {sso,issue,claims,setToken:value=>{token=value;},clientId:clientId.trim()};
}

test('authorization-code exchange verifies a valid Google id_token',async()=>{const f=fixture();f.setToken(f.issue(f.claims()));assert.deepEqual(await f.sso.exchangeAndVerify({code:'code',codeVerifier:'verifier',nonce:'expected-nonce'}),{sub:'google-subject',email:'facilitator@allowed.example',name:'Ada Facilitator',domain:'allowed.example'});});
for(const [name,overrides,reason] of [['wrong aud',{aud:'other-client'},'aud'],['expired',{exp:now()-301},'exp'],['wrong nonce',{nonce:'other-nonce'},'nonce'],['unverified email',{email_verified:false},'email_verified'],['disallowed hd',{hd:'blocked.example'},null]])test(`id_token rejects ${name}`,async()=>{const f=fixture();await assert.rejects(f.sso.verifyIdToken(f.issue(f.claims(overrides)),{nonce:'expected-nonce'}),error=>{
 if(name==='disallowed hd')return error.code==='domain'&&error.reason==='allowlist';
 return error.code==='verify'&&error.reason===reason;
});});
for(const [name,header] of [['alg none',{alg:'none'}],['HS256 signed with the client secret',{alg:'HS256'}],['missing kid',{kid:undefined}]])test(`id_token rejects ${name}`,async()=>{const f=fixture();await assert.rejects(f.sso.verifyIdToken(f.issue(f.claims(),header),{nonce:'expected-nonce'}),error=>error.code==='verify'&&error.reason==='malformed');});
for(const hd of ['evil-aetherlink.ai','aetherlink.ai.evil.com'])test(`id_token rejects lookalike hosted domain ${hd}`,async()=>{const f=fixture('aetherlink.ai');await assert.rejects(f.sso.verifyIdToken(f.issue(f.claims({email:'facilitator@aetherlink.ai',hd}),{kid:'test-key'}),{nonce:'expected-nonce'}),error=>error.code==='domain');});
test('missing hd falls back to an allowed email domain',async()=>{const f=fixture(),claims=f.claims();delete claims.hd;assert.equal((await f.sso.verifyIdToken(f.issue(claims),{nonce:'expected-nonce'})).domain,'allowed.example');});
test('id_token accepts aud as a single-element array matching the client id',async()=>{const f=fixture();assert.equal((await f.sso.verifyIdToken(f.issue(f.claims({aud:['client-id']})),{nonce:'expected-nonce'})).email,'facilitator@allowed.example');});
test('id_token accepts email_verified string true',async()=>{const f=fixture();assert.equal((await f.sso.verifyIdToken(f.issue(f.claims({email_verified:'true'})),{nonce:'expected-nonce'})).email,'facilitator@allowed.example');});
test('client id env whitespace is trimmed for audience checks',async()=>{const f=fixture('allowed.example',{clientId:'  client-id  '});assert.equal((await f.sso.verifyIdToken(f.issue(f.claims()),{nonce:'expected-nonce'})).email,'facilitator@allowed.example');});
test('verify failures expose a stable reason for server logs',async()=>{const f=fixture();await assert.rejects(f.sso.verifyIdToken(f.issue(f.claims({aud:'nope'})),{nonce:'expected-nonce'}),error=>error.code==='verify'&&error.reason==='aud'&&/verify:aud/.test(error.message));});
test('callback rejects a state mismatch before exchanging the code',async()=>{const f=fixture();await assert.rejects(f.sso.handleCallback({code:'code',state:'wrong'},{state:'right',nonce:'expected-nonce',codeVerifier:'verifier',expiresAt:Date.now()+1000}),error=>error.code==='state');});
test('callback rejects an expired login-state cookie',async()=>{const f=fixture();await assert.rejects(f.sso.handleCallback({code:'code',state:'right'},{state:'right',nonce:'expected-nonce',codeVerifier:'verifier',expiresAt:Date.now()-1}),error=>error.code==='state');});
test('login-state cookies are signed and reject tampering',()=>{const value=signLoginState({state:'state'},'secret');assert.deepEqual(readLoginState(value,'secret'),{state:'state'});assert.throws(()=>readLoginState(value+'x','secret'),error=>error.code==='state');});
