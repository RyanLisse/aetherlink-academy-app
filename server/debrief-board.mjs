import {fail} from './store.mjs';
// Placeholder column names: no debrief/retro column copy exists in the SoT yet.
export const BOARD_COLUMNS=['Werkte goed','Lastig','Volgende keer'];
export const BOARD_ACTIONS={open:'open',close:'closed'};
export const boardMarkdown=()=>BOARD_COLUMNS.map(column=>`## ${column}\n`).join('\n');
export const boardView=board=>board?{status:board.status,slug:board.proof.slug}:null;
export function roomDocument(r,slug){
 if(!slug||slug===r.proof.slug)return {proof:r.proof,token:r.proof.editor,writable:true};
 if(r.board&&slug===r.board.proof.slug){const writable=r.board.status==='open';return {proof:r.board.proof,token:writable?r.board.proof.editor:r.board.proof.viewer,writable};}
 return null;
}
export function applyBoardAction(r,action,{created,at,by}){
 const status=BOARD_ACTIONS[action];if(!status)fail(400,'Onbekende bordactie.');
 if(!r.board){if(status==='closed')fail(409,'Er is nog geen debriefbord om te sluiten.');if(!created)fail(409,'Debriefbord kon niet worden aangemaakt. Probeer opnieuw.');r.board={proof:created,createdAt:at};}
 r.board.status=status;r.board.changedAt=at;r.board.changedBy=by;r.version++;
 return r.board;
}
const cardText=line=>line.replace(/^\s*(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?/,'').replace(/<[^>]+>/g,'').trim();
export function parseBoard(markdown){
 const columns=[];
 for(const line of String(markdown||'').split('\n')){
  const heading=line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
  if(heading){if(heading[1].length===2)columns.push({title:heading[2].replace(/<[^>]+>/g,'').trim(),cards:[]});continue;}
  const text=cardText(line);if(columns.length&&text)columns.at(-1).cards.push(text);
 }
 return columns;
}
