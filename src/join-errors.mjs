// The gateway answers join failures with Dutch prose, not codes. This table is
// the single place that turns that prose into a readable state and the field it
// belongs to; tests/join-errors.test.mjs pins it against the server constants.
const JOIN_ERRORS=[
  {key:'cohortInvalid',field:'code',match:/cohortcode is ongeldig/i},
  {key:'cohortExpired',field:'code',match:/cohorttoegang is verlopen/i},
  {key:'cohortNoRoom',field:null,match:/nog geen actieve kamer/i},
  {key:'cohortRate',field:null,match:/pogingen met een cohortcode|te veel verzoeken/i},
  {key:'cohortRoom',field:'code',match:/kamer hoort bij een cohort/i},
  {key:'hostKey',field:'hostKey',match:/ongeldige facilitator-startsleutel|start key/i},
  {key:'accessInvalid',field:null,match:/deelnemerslink is ongeldig/i},
  {key:'duplicate',field:'name',match:/naam is al in gebruik/i},
  {key:'room',field:'code',match:/kamercode niet gevonden|ongeldige kamercode|room not found|invalid room/i},
  {key:'full',field:null,match:/squad is vol|capacity/i},
];

export function classifyJoinError(message){
  if(!message)return null;
  const hit=JOIN_ERRORS.find(entry=>entry.match.test(message));
  return hit?{key:`join.err.${hit.key}`,title:`join.errTitle.${hit.key}`,field:hit.field}:{key:null,title:'join.errTitle.generic',field:null,message};
}
