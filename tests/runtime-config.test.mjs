import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateRuntimeEnvironment} from '../server/runtime-config.mjs';
const fixture={VERCEL:'1',DATABASE_URL:'postgresql://fixture.invalid/academy',REDIS_URL:'rediss://fixture.invalid:6379',ACADEMY_HOST_KEY:'a'.repeat(32),ACADEMY_SIGNING_SECRET:'b'.repeat(32),ACADEMY_PUBLIC_URL:'https://academy.example.test'};
test('production requires shared credentials and a canonical HTTPS origin before startup',()=>{
 assert.doesNotThrow(()=>validateRuntimeEnvironment(fixture));
 for(const key of ['DATABASE_URL','REDIS_URL','ACADEMY_HOST_KEY','ACADEMY_SIGNING_SECRET','ACADEMY_PUBLIC_URL'])assert.throws(()=>validateRuntimeEnvironment({...fixture,[key]:undefined}));
 for(const value of ['http://academy.example.test','https://academy.example.test/path','https://academy.example.test?token=fixture','https://user:pass@academy.example.test'])assert.throws(()=>validateRuntimeEnvironment({...fixture,ACADEMY_PUBLIC_URL:value}),/HTTPS origin/);
 assert.throws(()=>validateRuntimeEnvironment({...fixture,REDIS_URL:'redis://fixture.invalid'}),/TLS Redis/);
 assert.throws(()=>validateRuntimeEnvironment({...fixture,ACADEMY_HOST_KEY:'short'}),/32 characters/);
 assert.doesNotThrow(()=>validateRuntimeEnvironment({...fixture,REDIS_URL:undefined,KV_URL:fixture.REDIS_URL}));
 assert.doesNotThrow(()=>validateRuntimeEnvironment({...fixture,ACADEMY_SIGNING_SECRET:undefined,PROOF_COLLAB_SIGNING_SECRET:'c'.repeat(32)}),'existing deployments keep their signing secret');
});
test('local runtime still requires Postgres while allowing loopback verification keys',()=>{
 assert.doesNotThrow(()=>validateRuntimeEnvironment({DATABASE_URL:fixture.DATABASE_URL,ACADEMY_PUBLIC_URL:'http://127.0.0.1:4321'}));
 assert.throws(()=>validateRuntimeEnvironment({DATABASE_URL:fixture.DATABASE_URL,ACADEMY_STORAGE:'local'}),/requires ACADEMY_STORAGE=postgres/);
});
test('Google facilitator login configuration is all-or-nothing',()=>{
 assert.doesNotThrow(()=>validateRuntimeEnvironment({...fixture,GOOGLE_CLIENT_ID:'client',GOOGLE_CLIENT_SECRET:'secret',ACADEMY_FACILITATOR_DOMAINS:'example.nl'}));
 for(const key of ['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','ACADEMY_FACILITATOR_DOMAINS'])assert.throws(()=>validateRuntimeEnvironment({...fixture,GOOGLE_CLIENT_ID:'client',GOOGLE_CLIENT_SECRET:'secret',ACADEMY_FACILITATOR_DOMAINS:'example.nl',[key]:undefined}),/Google sign-in requires/);
});
