import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(new URL('../vendor/proof-sdk/package.json',import.meta.url));const {HocuspocusProvider,HocuspocusProviderWebsocket}=require('@hocuspocus/provider');const Y=require('yjs');const WS=require('ws');
const base=process.env.ACADEMY_URL||'http://127.0.0.1:4317';
const hostKey=()=>process.env.ACADEMY_HOST_KEY||readFileSync('.data/host-key','utf8');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){for(let i=0;i<200;i++){if(await fn())return;await delay(50);}throw Error(`${label} did not happen within 10 seconds`);}
async function call(p,body,token){const res=await fetch(base+'/game/'+p,{method:body?'POST':'GET',headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});const d=await res.json();assert(res.ok,JSON.stringify(d));return d;}
async function exported(token){const res=await fetch(base+'/game/debrief/export',{headers:{authorization:'Bearer '+token}});assert.equal(res.status,200);return res.text();}
async function session(token,slug){const res=await fetch(`${base}/api/documents/${slug}/collab-session`,{headers:{cookie:'academy='+token,'x-proof-client-version':'0.30.0','x-proof-client-build':'academy-test','x-proof-client-protocol':'3'}});return {status:res.status,session:(await res.json()).session};}
async function client(token,slug){const {session:s}=await session(token,slug);assert(s);const url=new URL(s.collabWsUrl);url.search='';class AuthedWS extends WS{constructor(u){super(u,{headers:{cookie:'academy='+token}});}}const socket=new HocuspocusProviderWebsocket({url:url.toString(),parameters:{token:s.token,role:s.role,slug},WebSocketPolyfill:AuthedWS});const doc=new Y.Doc();const provider=new HocuspocusProvider({websocketProvider:socket,name:slug,document:doc,token:s.token});await until(()=>provider.isSynced,'Yjs sync');return {doc,role:s.role,fragment:doc.getXmlFragment('prosemirror'),close(){provider.destroy();socket.destroy();doc.destroy();}};}
function addCard(c,column,text){const nodes=c.fragment.toArray();const index=nodes.findIndex(node=>node.nodeName==='heading'&&node.toString().includes(column));assert.notEqual(index,-1,`column ${column} exists in the board fragment`);c.doc.transact(()=>{const list=new Y.XmlElement('bullet_list'),item=new Y.XmlElement('list_item'),paragraph=new Y.XmlElement('paragraph');paragraph.insert(0,[new Y.XmlText(text)]);item.insert(0,[paragraph]);list.insert(0,[item]);c.fragment.insert(index+1,[list]);},'human:test');}

test('debrief board syncs cards live over Proof Yjs, exports them and fences writers once closed',{timeout:60000},async()=>{
 const host=await call('create',{name:'Debrief live '+Date.now(),hostKey:hostKey()});const ada=await call('join',{code:host.code,name:'Ada'});
 const opened=await call('board',{action:'open'},host.token);assert.equal(opened.status,'open');
 assert.deepEqual(await call('board',{action:'open'},host.token),opened);
 assert.deepEqual((await call('state',null,ada.token)).board,{status:'open',slug:opened.slug});
 const participant=await client(ada.token,opened.slug),facilitator=await client(host.token,opened.slug);let viewer;
 try{
  assert.equal(participant.role,'editor');
  addCard(participant,'Werkte goed','Pairing met de n8n-agent');
  await until(()=>facilitator.fragment.toString().includes('Pairing met de n8n-agent'),'live card on the facilitator client');
  await until(async()=>(await exported(host.token)).includes('### Werkte goed\n- Pairing met de n8n-agent'),'card in the export');
  assert.deepEqual(await call('board',{action:'close'},host.token),{status:'closed',slug:opened.slug});
  addCard(participant,'Lastig','Na sluiting geschreven');
  await delay(2500);
  assert.equal((await session(ada.token,opened.slug)).session.role,'viewer');
  viewer=await client(ada.token,opened.slug);
  await until(()=>viewer.fragment.toString().includes('Pairing met de n8n-agent'),'reopened viewer sees the card');
  assert.equal(viewer.fragment.toString().includes('Na sluiting geschreven'),false);
  const markdown=await exported(host.token);assert.match(markdown,/### Lastig\nGeen kaarten\./);assert.doesNotMatch(markdown,/Na sluiting geschreven/);
  const foreign=await call('create',{name:'Foreign '+Date.now(),hostKey:hostKey()});const eve=await call('join',{code:foreign.code,name:'Eve'});
  assert.equal((await session(eve.token,opened.slug)).status,403);
  const rejected=await new Promise(resolve=>{const ws=new WS(base.replace('http','ws')+'/ws?slug='+opened.slug,{headers:{cookie:'academy='+eve.token}});ws.on('unexpected-response',(_req,r)=>{resolve(r.statusCode);ws.terminate();});ws.on('error',()=>{});});assert.equal(rejected,403);
 }finally{participant.close();facilitator.close();viewer?.close();}
});
