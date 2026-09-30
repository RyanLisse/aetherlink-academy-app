import {randomUUID} from 'node:crypto';
import {fail} from './store.mjs';
export const BOARD_COLUMNS=['Went well','Hard','Next time'];
export const BOARD_ACTIONS={open:'open',close:'closed'};
export const MAX_BOARD_CARDS=300;
export const boardColumns=board=>BOARD_COLUMNS.map((title,index)=>({title,cards:(board?.cards||[]).filter(card=>card.column===index).map(card=>card.text)}));
export const boardView=board=>board?{status:board.status,columns:boardColumns(board)}:null;
export function applyBoardAction(r,action,{at,by}){
 const status=BOARD_ACTIONS[action];if(!status)fail(400,'Unknown board action.');
 if(!r.board){if(status==='closed')fail(409,'There is no debrief board to close yet.');r.board={cards:[],createdAt:at};}
 r.board.cards??=[];
 r.board.status=status;r.board.changedAt=at;r.board.changedBy=by;r.version++;
 return r.board;
}
export function addBoardCard(r,{column,text,by,at}){
 if(r.board?.status!=='open')fail(409,'The debrief board is not open.');
 if(!Number.isInteger(column)||column<0||column>=BOARD_COLUMNS.length)fail(400,'Unknown board column.');
 if(!text)fail(400,'A card needs text.');
 r.board.cards??=[];
 if(r.board.cards.length>=MAX_BOARD_CARDS)fail(409,'The debrief board is full.');
 r.board.cards.push({id:randomUUID(),column,text,by,at});r.version++;
 return r.board;
}
