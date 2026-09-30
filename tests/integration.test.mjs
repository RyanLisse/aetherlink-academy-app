import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {randomUUID} from 'node:crypto';
import {Client} from '@modelcontextprotocol/client';import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
const base=process.env.ACADEMY_URL||'http://127.0.0.1:4317';
async function req(route,body,token,expected=200){const res=await fetch(base+route,{method:body?'POST':'GET',headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}: {})},body:body?JSON.stringify(body):undefined});const d=await res.json();assert.equal(res.status,expected,JSON.stringify(d));return d;}
test('room authorization, real MCP bridge evidence and human handoff',async()=>{
 const host=await req('/game/create',{name:'Integration '+Date.now(),hostKey:process.env.ACADEMY_HOST_KEY||readFileSync('.data/host-key','utf8')});const people=[];for(const name of ['A','B','C','D'])people.push(await req('/game/join',{code:host.code,name}));
 await req('/game/state',null,null,401);await req('/game/control',{action:'next'},people[0].token,403);await req('/game/control',{action:'start'},host.token);const state=await req('/game/state',null,people[0].token);assert.equal(state.running,true);await req('/game/control',{action:'pause'},host.token);
 const other=await req('/game/create',{name:'Other room',hostKey:process.env.ACADEMY_HOST_KEY||readFileSync('.data/host-key','utf8')});const otherState=await req('/game/state',null,other.token);
 await req('/game/intent',{url:'https://proof.example.test/d/integration'},host.token);assert.equal(otherState.intentUrl,null);assert.equal((await req('/game/state',null,other.token)).intentUrl,null,'intent links stay per room');
 const m=await req('/game/mcp-token',{},people[0].token);await req('/game/control',{action:'next'},m.token,401);await req('/game/mcp/get_mission',{},people[0].token,401);
 const transport=new StdioClientTransport({command:process.execPath,args:['server/mcp.mjs'],env:{...process.env,ACADEMY_URL:base,ACADEMY_TOKEN:m.token}});const client=new Client({name:'academy-integration-test',version:'1'});await client.connect(transport);
 try{const tools=await client.listTools();assert.deepEqual(tools.tools.map(t=>t.name).sort(),['add_slide','create_deck','export_deck_html','get_deck','get_mission','get_screen_state','list_decks','patch_deck','pin_classroom_deck','search_knowledge','submit_evidence','update_slide']);assert(!tools.tools.some(t=>/accept|rotate|rewrite/.test(t.name)));
 await req('/game/mcp/pin_classroom_deck',{deckId:randomUUID(),day:1},m.token,403);
 const call=async(name,args={})=>{const r=await client.callTool({name,arguments:args});assert(!r.isError,JSON.stringify(r));return JSON.parse(r.content[0].text);};
 assert.equal((await call('get_mission')).mission.id,'CLASSROOM-01');assert.equal((await call('search_knowledge',{query:''})).lessons.length,10);assert.equal((await call('search_knowledge',{query:'MCP'})).lessons.some(l=>l.id==='L2-MCP'),true);
 assert.deepEqual((await call('get_mission')).intent,{url:'https://proof.example.test/d/integration',file:'intent.md'});
 const data={requestId:randomUUID(),finding:'Integration test: README verwijst naar verify.',command:'node --test (fixture check performed by test harness separately)',observed:'Dit is testbewijs voor de transportkoppeling, geen echte deelnemerprestatie.',limitation:'Claude Code-account is niet getest.'};
 const a=await call('submit_evidence',data);const b=await call('submit_evidence',data);assert.equal(a.id,b.id);assert.equal((await req('/game/state',null,people[1].token)).evidence.length,1);
 await req('/game/review',{requestId:randomUUID(),id:a.id,status:'accepted',note:'Eigen bewijs mag niet.'},people[0].token,403);
 await req('/game/control',{action:'next'},host.token);await req('/game/review',{requestId:randomUUID(),id:a.id,status:'accepted',note:'Testpayload en squadbewijs vergeleken; inhoud is geen leerprestatie.'},people[1].token);
 await req('/game/handoff',{requestId:randomUUID(),decision:'Transportkoppeling gecontroleerd',checked:'Stdio MCP en kamerstatus',open:'Twee echte accounts nog handmatig testen'},people[1].token);
 const final=await req('/game/state',null,host.token);assert.equal(final.handoffs.length,1);assert.equal(final.evidence[0].status,'accepted');
 const replacement=await req('/game/mcp-token',{},people[0].token);assert(replacement.token!==m.token);await req('/game/mcp/get_mission',{},m.token,401);
 }finally{await client.close();}
});
