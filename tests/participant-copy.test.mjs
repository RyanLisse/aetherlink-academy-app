import assert from 'node:assert/strict';
import test from 'node:test';
import {readdirSync,readFileSync} from 'node:fs';
import {DAY_PACKS,DAY_SOURCES} from '../content/days/index.mjs';

const INTERNAL=/\bAET-\d+\b|\bSoT\b|Apple[- ]bar|retrofit|re-host|Jessy/i;

const leaks=(value,path,out=[])=>{
 if(typeof value==='string'){if(INTERNAL.test(value))out.push(`${path}: ${value.slice(0,120)}`);}
 else if(value&&typeof value==='object')for(const [key,child] of Object.entries(value))leaks(child,`${path}.${key}`,out);
 return out;
};

test('day packs shown to participants carry no internal ticket ids or authoring notes',()=>{
 const found=[...DAY_SOURCES.flatMap((pack,i)=>leaks(pack,`day${i+1}`)),...DAY_PACKS.flatMap((pack,i)=>leaks(pack,`pack${i+1}`))];
 assert.deepEqual(found,[]);
});

test('ConceptSim scenarios carry no internal ticket ids or authoring notes',()=>{
 const dir=new URL('../content/sims/',import.meta.url);
 const found=readdirSync(dir).filter(name=>name.endsWith('.json')).flatMap(name=>leaks(JSON.parse(readFileSync(new URL(name,dir),'utf8')),name));
 assert.deepEqual(found,[]);
});
