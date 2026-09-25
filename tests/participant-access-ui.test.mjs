import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {forgetParticipantAccess,getParticipantAccess,participantAccessUrl,saveSession} from '../src/api.js';

function storage(){
 const values=new Map();
 return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
}

test('the browser keeps the personal secret separately from the short-lived session',()=>{
 globalThis.sessionStorage=storage();
 globalThis.localStorage=storage();
 globalThis.location={origin:'https://academy.example.test',pathname:'/academy'};
 saveSession({token:'browser-session',resumeToken:'personal-secret'});
 assert.equal(sessionStorage.getItem('academy-token'),'browser-session');
 assert.equal(getParticipantAccess(),'personal-secret');
 assert.equal(participantAccessUrl(),'https://academy.example.test/academy#access=personal-secret');
 forgetParticipantAccess();
 assert.equal(getParticipantAccess(),null);
});

test('the Academy exchanges and strips access links and offers a copy action',()=>{
 const main=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
 assert.match(main,/api\('participant\/resume'/);
 assert.match(main,/location\.hash\.slice\(1\)/);
 assert.match(main,/url\.hash=''/);
 assert.match(main,/api\('participant\/access'/);
 assert.match(main,/setParticipantAccess\(null\)/);
 assert.match(main,/participantAccessUrl\(resumeToken\)/);
 assert.match(main,/forgetParticipantAccess\(\)/);
});
