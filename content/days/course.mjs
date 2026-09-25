import {DAY_PACKS} from './index.mjs';

// A course (Wave programme) composes existing day packs. Array order is course order;
// a pack absent from `days` is excluded. Pack content stays in git; only title and date are overridable.
export const COURSE_NAME_MAX=80;
export const COURSE_TITLE_MAX=120;

const invalid=message=>Object.assign(new Error(message),{status:400});
const PACK_DAYS=new Set(DAY_PACKS.map(pack=>pack.day));
const ISO_DATE=/^\d{4}-\d{2}-\d{2}$/;

export function courseTemplate(){
 return {name:'Wave · 7 dagen',days:DAY_PACKS.map(pack=>({day:pack.day,title:null,date:null}))};
}

const optionalText=(value,max,label)=>{
 if(value==null)return null;
 if(typeof value!=='string')throw invalid(`${label} moet tekst zijn.`);
 const text=value.trim();
 if(text.length>max)throw invalid(`${label} mag maximaal ${max} tekens zijn.`);
 return text||null;
};

const optionalDate=value=>{
 if(value==null||value==='')return null;
 if(typeof value!=='string'||!ISO_DATE.test(value)||new Date(`${value}T00:00:00Z`).toISOString().slice(0,10)!==value)throw invalid('Gebruik een datum als JJJJ-MM-DD.');
 return value;
};

export function parseCourse(input){
 if(!input||typeof input!=='object'||!Array.isArray(input.days))throw invalid('Een cursus heeft een naam en een lijst dagen.');
 const name=optionalText(input.name,COURSE_NAME_MAX,'De cursusnaam');
 if(!name)throw invalid('Geef de cursus een naam.');
 if(!input.days.length)throw invalid('Neem minimaal één dag op in de cursus.');
 const seen=new Set();
 const days=input.days.map(entry=>{
  const day=entry?.day;
  if(!PACK_DAYS.has(day))throw invalid(`Dag ${day} bestaat niet als contentpakket.`);
  if(seen.has(day))throw invalid(`Dag ${day} staat dubbel in de cursus.`);
  seen.add(day);
  return {day,title:optionalText(entry.title,COURSE_TITLE_MAX,'De dagtitel'),date:optionalDate(entry.date)};
 });
 return {name,days};
}

// Without a course the route is the fixed 7-day order, so position equals the pack day.
export function courseOrder(course){
 return (course?.days??courseTemplate().days).map((entry,index)=>({position:index+1,...entry}));
}
