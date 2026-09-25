// Platform copy about the Academy app itself, not course content. Every
// course fact the chat returns comes from the day packs or the lesson list.
export const NAVIGATION=[
 {view:'solo',keywords:['opdracht','missie','solo','starten','starter','starterbestanden','bestanden','assignment','mission','task','start'],
  title:{nl:'Je opdracht staat onder Solo-missie',en:'Your assignment is under Solo mission'},
  answer:{nl:'Open Solo-missie. Daar staan het doel, wat mag, de stopregel, de starterbestanden en de stappen van vandaag.',en:'Open Solo mission. It lists today’s goal, what is allowed, the stop rule, the starter files and the steps.'}},
 {view:'lesson',keywords:['les','lesson','quiz','quick','check','leerdoel','uitleg','lesstof','goal'],
  title:{nl:'De les en quick check staan onder Les & quick check',en:'The lesson and quick check are under Lesson & quick check'},
  answer:{nl:'Open Les & quick check voor het leerdoel, de leerlus, het materiaal en de quiz van vandaag.',en:'Open Lesson & quick check for today’s learning goal, loop, materials and quiz.'}},
 {view:'route',keywords:['route','dagen','dag','voortgang','overzicht','planning','progress','days','schedule'],
  title:{nl:'Alle dagen en je voortgang staan onder Mijn route',en:'All days and your progress are under My route'},
  answer:{nl:'Open Mijn route voor de zeven dagen en per dag je quiz, bewijs, reflectie en overdracht.',en:'Open My route for the seven days and, per day, your quiz, evidence, reflection and handoff.'}},
 {view:'squad',keywords:['proof','document','intent','squad','samen','driver','navigator','gedeeld','shared'],
  title:{nl:'Het gedeelde Proof-document staat in de Squad-room',en:'The shared Proof document is in the Squad room'},
  answer:{nl:'Open Squad-room. Daar werkt je squad samen in de intent in Proof; de driver verwerkt de besluiten.',en:'Open Squad room. Your squad works on the intent in Proof there; the driver records decisions.'}},
 {view:'review',keywords:['review','bewijs','evidence','inleveren','indienen','beoordeling','overdracht','handoff','submit','reflectie'],
  title:{nl:'Bewijs en overdracht lever je in onder Review & overdracht',en:'Submit evidence and handoff under Review & handoff'},
  answer:{nl:'Open Review & overdracht. Daar staan de reviewcriteria van vandaag, dien je bewijs in en schrijf je je overdracht.',en:'Open Review & handoff. It lists today’s review criteria; submit evidence and write your handoff there.'}},
 {view:'coach',keywords:['claude','mcp','verbinden','koppelen','koppeling','coach','leercoach','agent','connect','tutor'],
  title:{nl:'Je eigen Claude verbind je via Mijn leercoach',en:'Connect your own Claude via My learning coach'},
  answer:{nl:'Open Mijn leercoach en kopieer de instructie voor je eigen Claude Code. Claude verbindt dan via MCP met jouw sessie.',en:'Open My learning coach and copy the instruction for your own Claude Code. Claude then connects to your session over MCP.'}},
 {view:'decks',keywords:['deck','decks','slides','slide','presentatie','dia','dias','presentation'],
  title:{nl:'Squad-presentaties staan onder Slidedecks',en:'Squad presentations are under Slide decks'},
  answer:{nl:'Open Slidedecks voor de presentaties van je squad. Het dagdeck van de facilitator vind je bij het materiaal van de les.',en:'Open Slide decks for your squad’s presentations. The facilitator’s day deck is in the lesson materials.'}},
 {view:null,keywords:['hulp','help','facilitator','vast','vastzitten','stuck','trainer'],
  title:{nl:'Hulp van de facilitator vraag je in de zijbalk',en:'Ask the facilitator for help from the side panel'},
  answer:{nl:'Klik op “Vraag de facilitator om hulp” onder je squad. De facilitator ziet dat je hulp vraagt.',en:'Click “Ask the facilitator for help” under your squad. The facilitator sees your request.'}}
];

export const CHAT_COPY={
 handoffTitle:{nl:'Vraag dit aan je eigen Claude',en:'Ask your own Claude'},
 handoffPrompt:{nl:q=>`Lees mijn Academy-scherm met get_screen_state en mijn opdracht met get_mission. Help me daarna met: “${q}”. Geef eerst hints, geen kant-en-klaar antwoord.`,en:q=>`Read my Academy screen with get_screen_state and my assignment with get_mission. Then help me with: “${q}”. Give hints first, not a finished answer.`},
 coachLabel:{nl:'Open Mijn leercoach',en:'Open My learning coach'}
};
