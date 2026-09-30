import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {Pool} from 'pg';
import {PostgresStore} from '../server/postgres-store.mjs';
import {createSlidesService} from '../server/slides/runtime.ts';

test('decks persist in the academy Postgres schema and serialise cross-instance writes',{skip:!process.env.DATABASE_URL},async()=>{
 const url=new URL(process.env.DATABASE_URL!);url.searchParams.delete('sslmode');url.searchParams.delete('channel_binding');
 const pool=new Pool({connectionString:url.href,ssl:process.env.PGSSLMODE==='disable'?false:{rejectUnauthorized:true},connectionTimeoutMillis:10000});
 const schema=`academy_slides_${randomUUID().replaceAll('-','')}`;
 const store=await new PostgresStore(pool,{schema}).init();
 const one=createSlidesService({pool,schema}),two=createSlidesService({pool,schema});
 try{
  const host=await store.create('Slides');
  const {r}=await store.auth(host.token,'browser');
  const actor={roomId:r.id,id:'p1',name:'P',role:'participant',source:'human'} as const;
  const deck=await one.run('createDeck',actor,{title:'PG'}) as any;
  await Promise.all(Array.from({length:6},(_,i)=>(i%2?one:two).run('addSlide',actor,{deckId:deck.id,heading:`S${i}`})));
  const state=await two.run('getDeck',actor,{deckId:deck.id,compact:true}) as any;
  assert.equal(state.slides.length,6);assert.equal(state.revision,7);
  await assert.rejects(one.run('patchDeck',actor,{deckId:deck.id,expectedRevision:1,operations:[{op:'patch-deck-fields',fields:{title:'x'}}]}),(e:any)=>e.status===409);
  await one.run('deleteDeck',{...actor,role:'facilitator'},{deckId:deck.id});
  assert.deepEqual(await two.run('listDecks',actor),{decks:[]});
  const rooms=await pool.query(`SELECT count(*)::int AS n FROM "${schema}".decks`);assert.equal(rooms.rows[0].n,0);
 }finally{await one.close();await two.close();await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);await pool.end();}
});
