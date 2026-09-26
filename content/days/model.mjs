export const DECKS={
 'classroom-1':{route:'/classroom/1',module:'apps/web/src/deck/slides.ts',firstSlide:1},
 'classroom-2':{route:'/classroom/2',module:'apps/web/src/deck/slides.ts',firstSlide:45},
 'workshop-3':{route:'/workshop/3',module:'apps/web/src/deck/workshop3-slides.ts',firstSlide:1},
 'workshop-4':{route:'/workshop/4',module:'apps/web/src/deck/workshop4-slides.ts',firstSlide:1},
 'workshop-5':{route:'/workshop/5',module:'apps/web/src/deck/workshop5-slides.ts',firstSlide:1},
 'workshop-6':{route:'/workshop/6',module:'apps/web/src/deck/workshop6-slides.ts',firstSlide:1},
 'workshop-7':{route:'/workshop/7',module:'apps/web/src/deck/workshop7-slides.ts',firstSlide:1}
};

export const slide=(deck,number,title)=>({deck,slide:number,title,href:`${DECKS[deck].route}?index=${number-DECKS[deck].firstSlide}`});
export const starter=(file,label)=>({kind:'starter',label,href:`/game/starter/${file}`,file});
export const link=(kind,label,href,note)=>({kind,label,href,...(note?{note}:{})});
export const openMaterial=(kind,label,open)=>({kind,label,href:null,open});
export const question=(text,options,answer,ref)=>({question:text,options,answer,...(ref?{slide:ref}:{source:'authored-adaptation'})});

export const SOURCE='Afgeleid van het lesplan (Linear, SoT) en de dagdeck; iedere stap verwijst naar zijn dia.';
export const DEEP_HELP='Diepere hulp, zoals uitleg van een concept of feedback op je eigen werk, vraag je aan je eigen Claude via MCP. Verbind Claude Code via “Mijn leercoach”; Claude leest dan met get_screen_state en get_mission wat jij nu ziet. De chat in de Academy beantwoordt korte vragen over de lesstof met een verwijzing naar de bron; voor meedenken over je eigen werk gebruik je je eigen Claude.';
export const DEFAULT_STOP='Stop bij geheimen, ontbrekende toegang, productiesystemen of een resultaat dat je niet werkelijk hebt uitgevoerd. Markeer het als OPEN; verzin geen uitvoer.';

const OPTION_IDS='abcdefgh';

const questionId=(day,index)=>`d${day}-q${index+1}`;

export function dayQuiz(day,authored){
 const questions=authored.map(({question:text,options,source},i)=>({id:questionId(day,i),kind:'single-choice',question:text,options:options.map((label,j)=>({id:OPTION_IDS[j],label})),...(source?{source}:{})}));
 return {questions,key:Object.fromEntries(authored.map(({answer},i)=>[questions[i].id,OPTION_IDS[answer]]))};
}

const quizSlides=(day,authored)=>Object.fromEntries(authored.flatMap(({slide},i)=>slide?[[questionId(day,i),slide]]:[]));

export function projectDayPack(src){
 const deck=DECKS[src.deck];
 const {script,open}=src.demo;
 return {
  day:src.day,
  kind:src.kind,
  code:src.deck,
  title:src.title,
  tag:src.tag,
  blurb:src.blurb,
  source:SOURCE,
  sourceLink:deck.route,
  deck:{route:deck.route},
  leerdoel:src.leerdoel,
  demo:src.demo,
  steps:src.solo,
  materials:[link('deck',`Deck ${src.title.split(' · ')[0]}`,deck.route),...src.materials],
  reviewCriteria:src.proof,
  openItems:src.openItems,
  deepHelp:DEEP_HELP,
  ...(src.triage?{triage:src.triage}:{}),
  lesson:{kicker:src.kicker,title:src.lessonTitle,lede:src.leerdoel,loop:src.loop,workedExample:open?`OPEN: ${open}`:script.join(' ')},
  quiz:dayQuiz(src.day,src.quiz),
  quizSlides:quizSlides(src.day,src.quiz),
  mission:{stop:DEFAULT_STOP,...src.mission,checks:src.proof}
 };
}
