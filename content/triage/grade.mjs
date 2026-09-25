import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import fixtures from '../../starter/triage-fixtures.json' with {type:'json'};

export const TRIAGE_FIXTURES=fixtures;
export const PRIORITIES=['low','medium','high'];
const TICKET_KEYS=['ticket_id','customer','message'];
const highRule=new RegExp(fixtures.l1Rule.high,fixtures.l1Rule.flags);
const mediumRule=new RegExp(fixtures.l1Rule.medium,fixtures.l1Rule.flags);

export function keywordPriority(message){
 if(highRule.test(message))return 'high';
 if(mediumRule.test(message))return 'medium';
 return fixtures.l1Rule.fallback;
}

export function parseTicket(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return {ok:false,errors:['ticket: expected a JSON object']};
 const errors=[
  ...TICKET_KEYS.filter(key=>typeof raw[key]!=='string'||!raw[key].trim()).map(key=>`${key}: expected a non-empty string`),
  ...Object.keys(raw).filter(key=>!TICKET_KEYS.includes(key)).map(key=>`${key}: unsupported field`)
 ];
 return errors.length?{ok:false,errors}:{ok:true,ticket:raw};
}

export const TRIAGE_ACCEPTANCE={
 fixtureSet:fixtures.id,
 fixtureFile:'triage-fixtures.json',
 labels:PRIORITIES,
 tickets:fixtures.tickets.map(({ticket,expected_priority,synthetic})=>({ticketId:ticket.ticket_id,expected:expected_priority,synthetic})),
 grader:'node content/triage/grade.mjs <labels.json>'
};

const normalize=label=>typeof label==='string'?label.trim().toLowerCase():null;

export function gradeTriage(actualByTicketId,fixtureSet=fixtures){
 const rows=fixtureSet.tickets.map(({ticket,expected_priority})=>{
  const actual=normalize(actualByTicketId?.[ticket.ticket_id]);
  const known=PRIORITIES.includes(actual);
  return {ticketId:ticket.ticket_id,expected:expected_priority,actual:known?actual:null,match:known&&actual===expected_priority};
 });
 const matched=rows.filter(row=>row.match).length;
 return {fixtureSet:fixtureSet.id,rows,matched,total:rows.length,pass:matched===rows.length};
}

export function formatAcceptanceTable(grade){
 return ['| Ticket | Verwacht | Werkelijk | Match |','| --- | --- | --- | --- |',...grade.rows.map(row=>`| ${row.ticketId} | ${row.expected} | ${row.actual??'OPEN'} | ${row.match?'ja':'nee'} |`),'',`${grade.matched}/${grade.total} labels gelijk · ${grade.pass?'PASS':'REVISE'}`].join('\n');
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
 const file=process.argv[2];
 if(!file){console.error('usage: node content/triage/grade.mjs <labels.json>  (labels.json = {"WL-1026":"high",...})');process.exit(2);}
 const grade=gradeTriage(JSON.parse(readFileSync(file,'utf8')));
 console.log(formatAcceptanceTable(grade));
 process.exit(grade.pass?0:1);
}
