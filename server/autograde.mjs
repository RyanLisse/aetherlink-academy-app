import {gradeTriage,PRIORITIES,TRIAGE_FIXTURES} from '../content/triage/grade.mjs';
import {gradeSupport,PARTICIPANT_SUPPORT_FIXTURES,SUPPORT_IDS} from '../content/support/grade.mjs';
import {fail} from './store.mjs';

const REPLY_MAX=2000;
const isRecord=value=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
const clip=value=>String(value).slice(0,40);

const TRIAGE_TICKETS=TRIAGE_FIXTURES.tickets.map(({ticket})=>({ticketId:ticket.ticket_id,message:ticket.message}));
const TRIAGE_IDS=TRIAGE_TICKETS.map(t=>t.ticketId);
const SUPPORT_L1_IDS=SUPPORT_IDS.slice(0,6);
const SUPPORT_MCP_IDS=SUPPORT_IDS.slice(0,9);
const SUPPORT_TICKET_BY_ID=new Map(PARTICIPANT_SUPPORT_FIXTURES.tickets.map(({ticket})=>[ticket.ticket_id,ticket]));
const supportTickets=ids=>ids.map(ticketId=>{
 const ticket=SUPPORT_TICKET_BY_ID.get(ticketId);
 return {ticketId,message:`Subject: ${ticket.subject}\n\n${ticket.message}`};
});
const supportResults=graded=>graded.rows.map(({ticketId,match})=>({ticketId,correct:match}));

function parseSubmission(body,ids){
 const labels=body?.labels,replies=body?.replies??{};
 if(!isRecord(labels)||!isRecord(replies))fail(400,'Send one label (low, medium or high) per ticket id, plus an optional reply.');
 const unknown=[...Object.keys(labels),...Object.keys(replies)].filter(id=>!ids.includes(id));
 if(unknown.length)fail(400,`Unknown ticket: ${unknown.slice(0,3).map(clip).join(', ')}.`);
 const invalid=Object.entries(labels).filter(([,label])=>typeof label!=='string'||!PRIORITIES.includes(label.trim().toLowerCase()));
 if(invalid.length)fail(400,`Invalid label for ${invalid.slice(0,3).map(([id])=>id).join(', ')}. Choose low, medium or high.`);
 if(Object.values(replies).some(reply=>typeof reply!=='string'||reply.length>REPLY_MAX))fail(400,`A reply is text of at most ${REPLY_MAX} characters.`);
 return {
  labels:Object.fromEntries(Object.entries(labels).map(([id,label])=>[id,label.trim().toLowerCase()])),
  replies:Object.fromEntries(Object.entries(replies).map(([id,reply])=>[id,reply.trim()]).filter(([,reply])=>reply))
 };
}

// Deterministic graders a day-pack step can name in `autograde`. Answer keys stay inside the grader;
// a result says per ticket only whether the submitted label was correct.
const GRADERS={
 triage:{
  tickets:TRIAGE_TICKETS,
  grade(body){
   const {labels,replies}=parseSubmission(body,TRIAGE_IDS),graded=gradeTriage(labels);
   return {fixtureSet:graded.fixtureSet,passed:graded.pass,score:graded.matched,total:graded.total,results:graded.rows.map(({ticketId,actual,match})=>({ticketId,label:actual,correct:match})),replies};
  }
 },
 support:{
  tickets:supportTickets(SUPPORT_L1_IDS),
  grade(body){
   const {labels,replies}=parseSubmission(body,SUPPORT_L1_IDS),graded=gradeSupport(labels,SUPPORT_L1_IDS);
   return {fixtureSet:graded.fixtureSet,passed:graded.pass,score:graded.matched,total:graded.total,results:supportResults(graded),replies};
  }
 },
 'support-mcp':{
  tickets:supportTickets(SUPPORT_MCP_IDS),
  grade(body){
   const {labels,replies}=parseSubmission(body,SUPPORT_MCP_IDS),graded=gradeSupport(labels,SUPPORT_MCP_IDS);
   return {fixtureSet:graded.fixtureSet,passed:graded.pass,score:graded.matched,total:graded.total,results:supportResults(graded),replies};
  }
 }
};
export const GRADER_IDS=Object.freeze(Object.keys(GRADERS));

export function recordAutograde(previous,grader,body,at){
 if(previous?.passed)return {recorded:false,record:previous};
 return {recorded:true,record:{source:'auto-graded',grader,...GRADERS[grader].grade(body),attempts:(previous?.attempts??0)+1,at}};
}

export const autogradeView=(grader,record)=>({
 grader,
 tickets:GRADERS[grader].tickets,
 passed:record?.passed===true,
 score:record?.score??null,
 total:record?.total??null,
 attempts:record?.attempts??0,
 at:record?.at??null,
 results:record?.results??[],
 reviewer:record?.passed?{role:'auto-graded'}:null
});
