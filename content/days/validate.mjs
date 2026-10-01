import {existsSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {DECKS} from './model.mjs';

const DAY_2_DIVIDER='TEACHING DAY 2';
const REQUIRED=['title','tag','blurb','leerdoel','lesson','quiz','mission','reviewCriteria','steps','materials','openItems'];

export async function loadDeckSlides(root){
 const decks={};
 for(const [code,deck] of Object.entries(DECKS)){
  const mod=await import(pathToFileURL(path.join(root,deck.module)).href);
  const slides=Object.values(mod).find(Array.isArray);
  const divider=slides.findIndex(raw=>raw.kicker===DAY_2_DIVIDER);
  decks[code]=code==='classroom-1'?slides.slice(0,divider):code==='classroom-2'?slides.slice(divider):slides;
 }
 return decks;
}

export function slideRefs(pack){
 return [
  ...pack.demo.slides.map(ref=>['demo',ref]),
  ...pack.steps.filter(step=>step.slide).map(step=>[`step ${step.id}`,step.slide]),
  ...Object.entries(pack.quizSlides).map(([id,ref])=>[`quiz ${id}`,ref])
 ];
}

function validateTryItFields(pack,err){
 const copies=[
  ['en',pack.copy?.en?.solo??pack.steps??[]],
  ['nl',pack.copy?.nl?.solo??pack.steps??[]]
 ];
 for(const [locale,steps] of copies){
  for(const step of steps){
   for(const field of ['run','prompts']){
    const values=step[field];
    if(values!==undefined&&(!Array.isArray(values)||!values.length||values.some(value=>typeof value!=='string'||!value.trim())))
     err(pack,`step ${step.id} ${locale}.${field} must be a non-empty string array`);
   }
   if(step.watchFor!==undefined&&(typeof step.watchFor!=='string'||!step.watchFor.trim()))
    err(pack,`step ${step.id} ${locale}.watchFor must be a non-empty string`);
  }
 }
 const enSteps=pack.copy?.en?.solo,nlSteps=pack.copy?.nl?.solo;
 if(!enSteps||!nlSteps)return;
 const dutchById=new Map(nlSteps.map(step=>[step.id,step]));
 for(const step of enSteps){
  const translated=dutchById.get(step.id);
  for(const field of ['run','prompts']){
   if(step[field]!==undefined&&(!Array.isArray(translated?.[field])||translated[field].length!==step[field].length))
    err(pack,`step ${step.id} copy.nl.${field} must match the EN count`);
  }
  if(step.watchFor!==undefined&&translated?.watchFor===undefined)
   err(pack,`step ${step.id} copy.nl.watchFor is required when EN has it`);
 }
}

export function validateDayPacks(packs,{root,decks}){
 const errors=[];
 const err=(pack,message)=>errors.push(`day ${pack.day}: ${message}`);
 packs.forEach((pack,index)=>{
  if(pack.day!==index+1)err(pack,`expected day ${index+1}`);
  for(const key of REQUIRED)if(pack[key]==null||pack[key]==='')err(pack,`missing ${key}`);
  if(!pack.lesson.loop?.length)err(pack,'lesson.loop is empty');
  if(!pack.steps.length)err(pack,'no solo steps');
  if(!pack.reviewCriteria.length)err(pack,'no Proof acceptance');
  if(!pack.demo.open&&!pack.demo.slides.length)err(pack,'demo has neither slides nor an OPEN note');
  if(pack.quiz.questions.length!==3)err(pack,'quiz needs exactly 3 questions');
  validateTryItFields(pack,err);
  for(const file of pack.mission.starterFiles)if(!existsSync(path.join(root,'starter',file)))err(pack,`starter file missing: starter/${file}`);
  for(const material of pack.materials)if(!material.href&&!material.open)err(pack,`material "${material.label}" has no href and no OPEN reason`);
  for(const [where,ref] of slideRefs(pack)){
   const deck=decks[ref.deck];
   const position=ref.slide-DECKS[ref.deck].firstSlide;
   const actual=deck?.[position]?.title;
   if(actual!==ref.title)err(pack,`${where} cites ${ref.deck} slide ${ref.slide} "${ref.title}" but the deck has "${actual}"`);
   if(ref.href!==`${DECKS[ref.deck].route}?index=${position}`)err(pack,`${where} href ${ref.href} does not match slide ${ref.slide}`);
  }
 });
 return errors;
}
