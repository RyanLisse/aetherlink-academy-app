'use strict';
window.CLASSROOM_SESSIONS = [
  {id:'day-1',label:'Day 1 · AI and Claude Code',href:'index.html#7',deck:'index.html',start:7},
  {id:'day-2',label:'Day 2 · Reusable workflows',href:'index.html#63',deck:'index.html',start:63},
  {id:'workshop-3',label:'Day 3 · Agents in n8n',href:'workshop3.html#1',deck:'workshop3.html',start:1},
  {id:'workshop-4',label:'Day 4 · Claude Agent SDK',href:'workshop4.html#1',deck:'workshop4.html',start:1},
  {id:'workshop-5',label:'Day 5 · AI-native SDLC',href:'workshop5.html#1',deck:'workshop5.html',start:1},
  {id:'hackathon-1',label:'Day 6 · Hackathon: thin slice',href:'workshop6.html#1',deck:'workshop6.html',start:1},
  {id:'hackathon-2',label:'Day 7 · Hackathon: ship and present',href:'workshop7.html#1',deck:'workshop7.html',start:1}
];
if(!new URLSearchParams(location.search).has('embed')){
  const label=document.createElement('label'); label.className='session-picker';
  const text=document.createElement('span'); text.className='sr-only'; text.textContent='Choose a day or session';
  const select=document.createElement('select'); select.id='session-select';
  window.CLASSROOM_SESSIONS.forEach(session=>{const option=document.createElement('option');option.value=session.id;option.textContent=session.label;select.append(option)});
  const update=()=>{const deck=location.pathname.split('/').pop()||'index.html';const slide=Number(location.hash.slice(1))||1;const session=window.CLASSROOM_SESSIONS.filter(s=>s.deck===deck&&s.start<=slide).at(-1)||window.CLASSROOM_SESSIONS.find(s=>s.deck===deck);if(session)select.value=session.id};
  update();addEventListener('hashchange',update);
  select.addEventListener('change',()=>{const session=window.CLASSROOM_SESSIONS.find(s=>s.id===select.value);if(session)location.href=session.href});
  label.append(text,select);document.querySelector('.tools')?.prepend(label);
}
