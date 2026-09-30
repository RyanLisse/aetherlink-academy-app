import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {Pool} from 'pg';
import {PostgresStore} from '../server/postgres-store.mjs';
import {Store} from '../server/store.mjs';
import {dayProgress} from '../server/progress.mjs';
test('day-specific help and reflection survive committed cross-instance changes',{skip:!process.env.DATABASE_URL},async()=>{
 const url=new URL(process.env.DATABASE_URL);url.searchParams.delete('sslmode');url.searchParams.delete('channel_binding');
 const pool=new Pool({connectionString:url.href,ssl:{rejectUnauthorized:true},connectionTimeoutMillis:10000});
 const schema=`academy_learning_${randomUUID().replaceAll('-','')}`;
 const one=new PostgresStore(pool,{schema}),two=new PostgresStore(pool,{schema});
 try{
  await one.init();await two.init();const host=await one.create('Test'),person=await one.join(host.code,'Learner');
  for(let day=1;day<=5;day++){
   await one.withSession(host.token,'browser',({r})=>Store.prototype.control.call({save(){},remaining:one.remaining},r,'day',day));
   await two.withSession(person.token,'browser',({p})=>{p.progressByDay??={};p.progressByDay[day]={route:'guided',reflection:{learned:`day ${day}`,next:'Repeat'}};});
  }
  await one.withSession(host.token,'browser',({r})=>Store.prototype.control.call({save(){},remaining:one.remaining},r,'day',1));
  const {r,p}=await two.auth(person.token,'browser');assert.equal(p.route,'guided');
  for(let day=1;day<=5;day++)assert.equal(dayProgress(r,p,day).reflection.learned,`day ${day}`);
 }finally{await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);await pool.end();}
});
