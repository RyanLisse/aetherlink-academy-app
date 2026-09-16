export const lessons = [
 ['L1-INTENT','Een gedeelde north star','Beschrijf het probleem vóór de oplossing. Noteer wie er last van heeft, wat beter moet en welk observeerbaar bewijs telt. De mens bepaalt het doel en de acceptatie.','Maak een opportunity/responsibility-map: huidige taak, gewenste taak, en één beslissing die AI niet zelfstandig neemt.'],
 ['L1-SCOUT','Eerst lezen, dan handelen','Laat Claude Code eerst werkmap, bestanden, doel en ontbrekende informatie onderzoeken. Een README is een claim; controleer die tegen de bestanden en uitvoerbare checks. Vraag om paden en concrete observaties.','Vraag om een read-only repository-verkenning met drie paden, één onzekerheid en een stopregel.'],
 ['L1-PLAN','De kleinste nuttige stap','Splits de taak in onderzoeken, plannen, kleine wijziging, verifiëren en overdragen. Geef iedere stap een resultaat en controle. Kies één nuttige workflow; groter is geen bewijs van beter.','Schrijf een plan voor één README-correctie. Wat valt expliciet buiten scope?'],
 ['L2-CONTEXT','Context en herstel','Context is informatie voor de huidige taak. Bewaar duurzame projectafspraken in CLAUDE.md, uitgebreide uitleg in vindbare referenties en voortgang in een overdracht. Geheimen horen niet in gedeelde context.','Herstart met een verse context: kan een ander doel, besluit, bewijs en volgende stap terugvinden?'],
 ['L2-SKILLS','Instructies en skills','Projectinstructies beschrijven vaste afspraken; een skill beschrijft een herhaalbare werkwijze. Een skill geeft op zichzelf geen toegang tot een systeem. Gebruik gewone code of een sjabloon waar dat voldoende is.','Maak een capability-map: context, instructie, tool, skill en menselijk oordeel voor deze review.'],
 ['L2-MCP','MCP en informatiegrenzen','MCP ontsluit tools en informatie aan een agent. De toegestane tools en kamertoken begrenzen toegang. De game kan je Claude Code niet op afstand starten. Een kamertoken is geen Anthropic API-key.','Lees missie en document via MCP. Vraag om een suggestie; geef geen toestemming voor stilzwijgend accepteren.'],
 ['L2-PERMISSIONS','Menselijke beslispunten','Spreek af wat de agent mag lezen, voorstellen en uitvoeren. Stop bij ontbrekende toegang, gevoelige informatie of werk buiten scope. In deze missie: lokale fictieve bestanden lezen en checks uitvoeren; geen client-systemen, push of deployment.','Een tool wil toegang tot Jira. Is die toegang nodig voor deze lokale taak? Licht je stopbesluit toe.'],
 ['L2-EVIDENCE','Review, test en bewijs','Onderscheid een claim van een uitgevoerde controle. Noteer commando, waargenomen resultaat, bestandsverwijzing en beperking. Een groene check bewijst alleen wat die check meet. Een mens beoordeelt de conclusie.','Vergelijk README en package.json. Lever één reproduceerbare bevinding, met letterlijk waargenomen uitvoer.'],
 ['L2-HANDOFF','Overdragen aan een verse lezer','Leg doel, besluiten, gewijzigde bestanden, uitgevoerde checks, open risico en volgende eigenaar vast. Laat een andere deelnemer de controle opnieuw uitvoeren. Agentovereenstemming is geen onafhankelijke test.','Vraag een navigator je bevinding te reproduceren en noteer het resultaat vóór acceptatie.'],
 ['L2-WORKFLOW','Kies een passend hulpmiddel','Gebruik een prompt voor incidenteel denkwerk, een sjabloon of skill voor herhaalbare instructies en deterministische automatisering voor vaste regels. Een agent is passend als het werk contextafhankelijke stappen vraagt en toetsbaar begrensd kan worden.','Ontwerp de kleinste nuttige workflow: input, AI-taak, tools, menselijke gate, verificatie en waarde.']
].map(([id,title,body,exercise])=>({id,title,body,exercise,source:'MVP-les, afgeleid van het goedgekeurde intent-document; geen letterlijke weergave van het klasdocument.'}));
export const days=['Samen starten','Dieper begrijpen','Samen bouwen','Zelf aanpakken','Zelfstandig toepassen'];
export const phases=['Plan','Design','Build','Test','Deploy','Maintain'];
export const mission={id:'ATLAS-REVIEW-01',title:'Maak de repository begrijpelijk',minutes:25,goal:'Onderzoek de fictieve Atlas-repository. Lever één reproduceerbare afwijking tussen de onboarding-instructies en het project, plus een begrensd verbetervoorstel.',allowed:['Lees alleen de meegeleverde starterbestanden.','Voer node --test uit in je eigen kopie.','Dien bewijs en een suggestie in; een mens beslist over acceptatie.'],stop:'Stop bij ontbrekende bestanden, geheimen of benodigde toegang buiten de starter. Meld wat ontbreekt; verzin geen uitvoer.',checks:['Verwijs naar een concreet bestand en passage.','Vermeld het werkelijk uitgevoerde commando en de uitvoer.','Beschrijf waarom dit het doel raakt en wat nog niet is bewezen.'],lessonIds:['L1-SCOUT','L2-CONTEXT','L2-MCP','L2-EVIDENCE','L2-HANDOFF']};
export const initialDocument=`# Onze intent\n\n## Probleem\nNieuwe teamleden kunnen de fictieve Atlas-repository niet betrouwbaar opstarten met alleen de README.\n\n## Gewenst resultaat\nEen verse lezer kan de juiste controle uitvoeren en de uitkomst uitleggen.\n\n## Succescriteria\nDe instructie komt overeen met de beschikbare scripts. Een tweede deelnemer reproduceert de controle. Onzekerheden blijven zichtbaar.\n\n## Grenzen en eigenaarschap\nAlleen de meegeleverde starter. Geen klantdata, externe systemen, push of deployment. De driver verwerkt teambesluiten; navigators onderzoeken en geven feedback.\n\n## Plan en menselijk beslispunt\nEerst lezen, dan één afwijking onderbouwen. De squad beoordeelt bewijs voordat een voorstel wordt geaccepteerd.\n\n## Bewijs en overdracht\nLeg hier geaccepteerde bevindingen, de controle, beperkingen en de volgende eigenaar vast.\n`;
export function searchKnowledge(query=''){const words=query.toLowerCase().trim().split(/\s+/).filter(Boolean);return lessons.filter(l=>!words.length||words.some(w=>`${l.id} ${l.title} ${l.body} ${l.exercise}`.toLowerCase().includes(w)));}

const starterFiles=['README.md','CLAUDE.md','package.json','status.mjs','status.test.mjs'];
const day1Lesson={
 kicker:'Les 1 · Van intent naar bewijs',
 title:'Maak de opdracht helder',
 lede:'Zorg dat iedereen hetzelfde doel begrijpt, stel verhelderende vragen en leg de scope vast.',
 loop:[
  {label:'Intent',prompt:'Wat willen we bereiken?'},
  {label:'Plan',prompt:'Hoe pakken we het aan?'},
  {label:'Uitvoering',prompt:'Eén begrensde stap'},
  {label:'Controle',prompt:'Wat hebben we bewezen?'}
 ],
 workedExample:'“Maak onboarding beter” is te breed. Begin met: “Een nieuwe collega kan de beschikbare controle vinden en uitvoeren.” Laat Claude de README en scripts vergelijken. Vraag om het exacte bestand, de waarneming en wat de controle niet bewijst.'
};
const day1Questions=[
 {question:'Claude wil “de repository verbeteren”. Wat ontbreekt eerst?',options:['Een extra tool','Een begrensd doel met een controle','Een groter model']},
 {question:'De lokale missie vraagt geen Jira-data. Claude vraagt toch toegang. Wat doe je?',options:['Stoppen en de noodzaak bespreken','Alle permissies geven','Een collega-token delen']},
 {question:'Wat is een sterke overdracht?',options:['“Alles werkt”','Een overtuigende agentsamenvatting','Bestand, uitgevoerd commando, uitkomst, beperking en volgende eigenaar']}
];
const day1Mission={
 ...mission,
 starterFiles,
 hints:['Vergelijk README.md met de scripts in package.json.','Voer de beschikbare test uit met node --test.','Een mislukte opdracht is óók bewijs; noteer de echte fout.'],
 stretch:'Ontwerp een controle die voorkomt dat de README weer achterloopt. Waarom vangt de bestaande test dit niet?'
};
const curriculumSource='Bewerking van het interne Squad 2-programma, geraadpleegd op 14 september 2026; scenario-vragen zijn nieuw oefenmateriaal.';
const sourceLink='docs/LEARNING-ROUTE.md';
const authoredQuiz=(question,options)=>({source:'authored-adaptation',question,options});
const feedbackLoop=[
 {label:'Intent',prompt:'Welk probleem lossen we op en welk bewijs telt?'},
 {label:'Plan',prompt:'Wat is de kleinste wijziging en hoe controleren we die?'},
 {label:'Wijziging',prompt:'Welke ene, omkeerbare stap voeren we uit?'},
 {label:'Test',prompt:'Welke lokale controle is werkelijk uitgevoerd?'},
 {label:'Review',prompt:'Wat besluit een menselijke reviewer op basis van bewijs?'},
 {label:'Handoff',prompt:'Wat moet een verse lezer weten en wie neemt het over?'}
];
const day2Pack={
 day:2,
 title:'Van intent naar een gecontroleerde wijziging',
 tag:'Begeleid',
 blurb:'Doorloop één kleine wijziging van intent tot reproduceerbare overdracht.',
 source:curriculumSource,sourceLink,
 lesson:{
  kicker:'Les 2 · Feedbackloop',title:'Van intent naar een gecontroleerde wijziging',
  lede:'Oefen intent → plan → kleine wijziging → test → review → handoff. Context, tools en menselijke beslissingen blijven zichtbaar.',
  loop:feedbackLoop,
  workedExample:'Vergelijk README.md met package.json. Leg één kleine documentatiecorrectie vast, voer node --test uit, laat een verse lezer de controle herhalen en vraag een mens om PASS, REVISE of OPEN. Een afgewezen voorstel blijft zichtbaar als open vervolgstap.'
 },
 quiz:{
  questions:[
   authoredQuiz('Welke evidence sluit de feedbackloop na een kleine README-wijziging?',['Alleen een agentsamenvatting','Het werkelijk uitgevoerde commando, de uitvoer en een verse-reader resultaat','Een groter plan zonder controle']),
   authoredQuiz('Wat doe je als de menselijke reviewer het voorstel afwijst?',['De afwijzing en volgende stap als OPEN vastleggen','De reviewer overslaan','De wijziging toch accepteren']),
   authoredQuiz('Een agent vraagt Jira-toegang voor deze lokale controle. Wat doe je?',['De token delen','Toegang geven omdat het sneller is','Stoppen en uitleggen waarom de toegang buiten scope valt'])
  ],
  answers:[1,0,2]
 },
 mission:{
  id:'ATLAS-FEEDBACK-02',title:'Maak één gecontroleerde verbetering',
  minutes:25,
  goal:'Maak één kleine, controleerbare verbetering in de fictieve Atlas-repository en draag intent, plan, wijziging, testuitkomst, reviewbesluit en open risico over.',
  allowed:['Lees alleen de meegeleverde starterbestanden.','Gebruik alleen lokale commando’s in je eigen kopie.','Dien bewijs en een suggestie in; een mens beslist over acceptatie.'],
  stop:'Stop bij ontbrekende bestanden, geheimen of benodigde toegang buiten de starter. Meld wat ontbreekt; verzin geen uitvoer.',
  checks:['Leg alle zes loopstappen vast met concrete observaties.','Vermeld het werkelijk uitgevoerde commando en de uitvoer.','Laat een verse lezer de controle herhalen en noteer reviewer, beperking en volgende eigenaar.'],
  starterFiles,
  hints:['Begin met intent en plan voordat je een bestand wijzigt.','Kies één kleine, omkeerbare README-correctie.','Een niet-uitgevoerde of afgewezen stap blijft OPEN; verzin geen resultaat.'],
  stretch:'Maak een herbruikbare feedbackloop-checklist voor een verse lezer.'
 },
 reviewCriteria:['Alle zes loopstappen zijn zichtbaar.','De wijziging is klein en reproduceerbaar getest.','Een menselijke reviewer en eventuele REVISE/OPEN-uitkomst zijn vastgelegd.']
};

const commonMission=(id,title,goal,starterFilesOverride,extra)=>({id,title,minutes:25,goal,allowed:['Gebruik alleen fictieve, lokale starterdata en read-only tools.','Voer uitsluitend lokale commando’s uit.','Lever bewijs in; een mens beslist over acceptatie.'],stop:'Stop bij secrets, ontbrekende input, externe toegang of een resultaat dat je niet werkelijk hebt uitgevoerd.',checks:['Verwijs naar concrete input, output en beperkingen.','Vermeld het werkelijk uitgevoerde commando of de runstatus.','Draag over aan een verse lezer met eigenaar en volgende stap.'],starterFiles:starterFilesOverride,...extra});
const day3Steps=[
 {id:"n8n-zero",agentCount:0,title:"Flow zonder AI-agent",goal:"Bouw of inspecteer een begrensde n8n-flow: trigger → acties → output. Geen LLM-node. Begrijp input, output en foutpad.",doneWhen:"Flow runt lokaal; output en stappen in bewijs; menselijke gate.",hint:"Run eerst de deterministic fixture-check zonder API-key."},
 {id:"n8n-one",agentCount:1,title:"Flow met 1 AI-agent",goal:"Zelfde keten plus één begrensde AI-stap (model, prompt, input/output). Agent maakt een draft; een mens beoordeelt.",doneWhen:"Eén AI-run vastgelegd (trace/settings); reviewakkoord; geen echte schrijfacties.",hint:"Vervang alleen de reviewstap door een goedgekeurde modeladapter; claim geen AI-run zonder trace."},
 {id:"n8n-multi",agentCount:"multi",title:"Flow met meerdere AI-agents",goal:"Splits in specialisten (ophalen / redeneren / formatteren) of parallelle agents; orchestratie plus gezamenlijke review.",doneWhen:"Multi-agent pad gedocumenteerd; wie doet wat; menselijke gate vóór done.",hint:"Noteer per specialist input, output en wie de gate houdt."}
];
const day3Pack={day:3,title:days[2],tag:"Coaching",blurb:"Doorloop dezelfde n8n-keten progressief: 0 agents → 1 agent → multi-agent.",source:curriculumSource,sourceLink,scenario:{id:"GL-REVIEW-001",kind:"fictional",externalWrites:false},steps:day3Steps,lesson:{kicker:"Les 3 · Agents in n8n",title:"Van nul naar multi-agent in n8n",lede:"Doorloop dezelfde reconciliatieketen drie keer: eerst zonder AI, dan met één agent, dan met meerdere — zodat verantwoordelijkheid en review zichtbaar verschillen.",loop:[{label:"0 agents",prompt:"Wat bewijst de deterministische flow zonder LLM?"},{label:"1 agent",prompt:"Welke ene AI-stap is begrensd en hoe review je die?"},{label:"Multi",prompt:"Wie doet wat tussen specialisten?"},{label:"Gate",prompt:"Wie beoordeelt vóór acceptatie, ongeacht het aantal agents?"}],workedExample:"Importeer starter/n8n-repository-review.json. Stap 1: run de fixture-check zonder API-key en label deterministic-run. Stap 2: voeg één begrensde AI-reviewstap toe en leg trace vast vóór je AI-run claimt. Stap 3: splits ophalen/redeneren/formatteren (of parallel) en documenteer orchestratie plus menselijke gate. Geen echte GitLab/Jira/Confluence-schrijfacties."},quiz:{questions:[authoredQuiz("Wat bewijst de baseline zonder AI-agent?",["Een geïmporteerde workflow zonder run","Een lokale deterministic-run met input, output en foutpad","Een voorbeeldoutput uit de README"]),authoredQuiz("Wat mag je als bewijs van één AI-agent tellen?",["Alleen de aanwezigheid van een LLM-node","Een captured run met modelsettings, input, output en trace plus menselijke review","Een ingevulde placeholder zonder modelrun"]),authoredQuiz("Wat is verplicht bij multi-agent vóór done?",["Automatisch accepteren van alle agentoutputs","Documentatie wie wat doet plus een menselijke gate","Eén gedeelde API-key op het scherm"])],answers:[1,1,1]},mission:commonMission("ATLAS-N8N-03","Doorloop n8n progressief (0→1→multi)","Leg voor elke stap (zonder AI, één agent, multi) input, output, eventuele trace en menselijke beoordeling vast zonder externe schrijfacties.", ["starter/n8n-repository-review.json","starter/n8n-review-README.md"],{hints:["Volg de drie stappen in volgorde; begin met deterministic-run.","Noteer live modelrun als OPEN wanneer geen provider is geconfigureerd.","Documenteer bij multi wie ophaalt, redeneert, formatteert en wie de gate houdt."],stretch:"Ontwerp één extra schema-check of specialist zonder externe toegang."}),reviewCriteria:["Stap 0 (geen AI) heeft een lokale deterministic-run met zichtbaar foutpad.","Stap 1 (één agent) onderscheidt deterministic-run van AI-run met trace.","Stap 2 (multi) documenteert specialisten of parallelle paden en orchestratie.","Human gate blijft verplicht vóór acceptatie; geen externe schrijfacties."],openGates:["live n8n/model smoke test","external GitLab access"]};
const day4Pack={day:4,title:days[3],tag:'Hints',blurb:'Bouw dezelfde reviewtaak opnieuw in Claude Code met read-only grenzen.',source:curriculumSource,sourceLink,scenario:{id:'GL-REVIEW-001',kind:'fictional',externalWrites:false},lesson:{kicker:'Les 4 · Agents in Claude Code',title:'Zelfde taak, andere agent',lede:'Gebruik eigen Claude Code met CLAUDE.md, read-only tools, trace en een hook die een out-of-scope write blokkeert.',loop:[{label:'Fresh context',prompt:'Kan een nieuwe context het doel terugvinden?'},{label:'Read',prompt:'Welke lokale bestanden mag Claude lezen?'},{label:'Trace',prompt:'Welke stappen zijn werkelijk gelogd?'},{label:'Guard',prompt:'Wat blokkeert de PreToolUse-hook?'},{label:'Compare',prompt:'Welke verschillen met n8n zijn waargenomen?'}],workedExample:'Werk met de lokale GL-REVIEW-001-fixture. Vraag eerst om onderzoek, laat een write buiten scope blokkeren en bewaar de trace. Claim geen modelrun wanneer alleen handmatige of deterministic checks zijn uitgevoerd.'},quiz:{questions:[authoredQuiz('Wat bewijst een PreToolUse-blokkade?',['Dat één geconfigureerde actie is geweigerd','Dat de hele review correct is','Dat productie veilig kan worden aangepast'])],answers:[0]},mission:commonMission('ATLAS-CLAUDE-04','Herbouw de lokale reviewtaak','Voer dezelfde fictieve review uit met eigen Claude Code, CLAUDE.md, read-only tools, trace en hook.', ['starter/claude-code-review-README.md','starter/n8n-repository-review.json'],{hints:['Gebruik geen API-key buiten je bestaande eigen setup.','Laat een fresh reader de handoff en trace begrijpen.'],stretch:'Leg één verschil met n8n vast als observatie, niet als algemene conclusie.'}),reviewCriteria:['Fresh-context rerun is reproduceerbaar.','Read-only scope, trace en hookresultaat zijn zichtbaar.','Verschillen met n8n zijn observaties met bewijs.','Geen onuitgevoerde AI-run wordt geclaimd.'],openGates:['provider/model availability','external writes']};
const day5Pack={day:5,title:days[4],tag:'Zelfstandig',blurb:'Doorloop een klein fictief teamissue van intent tot handoff.',source:curriculumSource,sourceLink,scenario:{id:'GL-REVIEW-001',kind:'fictional',externalWrites:false},lesson:{kicker:'Les 5 · Transfer',title:'Een teamissue end-to-end',lede:'Kies één kleine fictieve wijziging en sluit de artefactketen met review, human gate en overdracht.',loop:[{label:'Intent',prompt:'Welk klein probleem kiezen we?'},{label:'Plan',prompt:'Welke controleerbare stap volgt?'},{label:'Agentwerk',prompt:'Welke begrensde lokale taak voer je uit?'},{label:'Verify',prompt:'Welke checks en reviewerresultaat bestaan er?'},{label:'Handoff',prompt:'Wie neemt welke OPEN-stap over?'}],workedExample:'Kies een lokale fixturewijziging. GitLab, Jira en Confluence blijven mock of OPEN. Een PASS geldt alleen na menselijke beoordeling; anders draag je REVISE of OPEN over.'},quiz:{questions:[authoredQuiz('Wat doe je als een extern ticket niet is goedgekeurd?',['Het veld OPEN laten, lokale evidence bewaren en de approval-behoefte overdragen','Een ticket aanmaken met een gedeelde token','Doen alsof de link bestaat'])],answers:[0]},mission:commonMission('ATLAS-TEAM-05','Voer één fictief teamissue uit','Doorloop intent, plan, begrensd agentwerk, lokale checks, review, human gate en reproduceerbare handoff.', ['starter/README.md','starter/package.json','starter/status.mjs','starter/status.test.mjs'],{hints:['Kies één kleine slice en benoem eigenaar en risico.','Gebruik mock/OPEN voor externe systemen.'],stretch:'Laat een tweede deelnemer de volledige handoff met maximaal één hint uitvoeren.'}),reviewCriteria:['Artefactketen en eigenaar zijn compleet.','Lokale check is werkelijk uitgevoerd en reproduceerbaar.','Human gate is PASS, REVISE of OPEN met reden.','Externe integraties blijven mock/OPEN.'],openGates:['external GitLab/Jira/Confluence approval','production access']};
const dayPacks={
 1:{
  day:1,
  title:days[0],
  tag:'Begeleid',
  blurb:'Van een begrensd doel naar een controleerbaar bewijsstuk.',
  lesson:day1Lesson,
  quiz:{questions:day1Questions,answers:[1,0,2]},
  mission:day1Mission,
  reviewCriteria:mission.checks
 },
 2:day2Pack,3:day3Pack,4:day4Pack,5:day5Pack
};
export function getDayPack(day){return dayPacks[day]??null;}
export function listDaySummaries(){return Object.values(dayPacks).map(({day,title,tag,blurb})=>({day,title,tag,blurb}));}

export function listRouteDays(){
 return days.map((title,i)=>{
  const day=i+1,pack=dayPacks[day];
  if(pack)return {day,title:pack.title,tag:pack.tag,blurb:pack.blurb,hasLesson:true};
  return {day,title,tag:'OPEN',blurb:'Nog geen dagpakket beschikbaar.',hasLesson:false};
 });
}
