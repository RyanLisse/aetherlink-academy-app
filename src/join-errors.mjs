// The gateway answers join failures with prose, not codes. This table is
// the single place that turns that prose into a readable state and the field it
// belongs to; tests/join-errors.test.mjs pins it against the server constants.
const JOIN_ERRORS=[
  {key:'cohortInvalid',field:'code',match:/cohort code is invalid|cohortcode is ongeldig/i},
  {key:'cohortExpired',field:'code',match:/cohort access has expired|cohorttoegang is verlopen/i},
  {key:'cohortNoRoom',field:null,match:/no active room yet|nog geen actieve kamer/i},
  {key:'cohortRate',field:null,match:/cohort code attempts|too many requests|pogingen met een cohortcode|te veel verzoeken/i},
  {key:'cohortRoom',field:'code',match:/room belongs to a cohort|kamer hoort bij een cohort/i},
  {key:'hostKey',field:'hostKey',match:/invalid facilitator start key|ongeldige facilitator-startsleutel|start key/i},
  {key:'accessInvalid',field:null,match:/participant link is invalid|deelnemerslink is ongeldig/i},
  {key:'duplicate',field:'name',match:/name is already in use|naam is al in gebruik/i},
  {key:'room',field:'code',match:/room code not found|kamercode niet gevonden|ongeldige kamercode|room not found|invalid room/i},
  {key:'full',field:null,match:/squad is full|squad is vol|capacity/i},
];

export function classifyJoinError(message){
  if(!message)return null;
  const hit=JOIN_ERRORS.find(entry=>entry.match.test(message));
  return hit?{key:`join.err.${hit.key}`,title:`join.errTitle.${hit.key}`,field:hit.field}:{key:null,title:'join.errTitle.generic',field:null,message};
}
