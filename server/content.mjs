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
 hints:['Vergelijk README.md met de scripts in package.json.','Voer de beschikbare test uit met node --test.','Een mislukte opdracht is óók bewijs; noteer de echte fout.']
};
const day2Placeholder='PLACEHOLDER — wacht op quizbank/vijfdagenplan';
const day2Pack={
 day:2,
 title:days[1],
 tag:'Begeleid',
 blurb:'Begrijp hoe context, skills, MCP en bewijs samen een begrensde agenttaak uitvoerbaar maken.',
 lesson:{
  kicker:'Les 2 · Dieper begrijpen',
  title:'Geef een agent de juiste context',
  lede:'Maak zichtbaar welke informatie, instructie, tool en menselijke beslissing nodig zijn om een controle betrouwbaar uit te voeren.',
  loop:[
   {label:'Context',prompt:'Welke informatie is relevant voor deze taak?'},
   {label:'Instructie',prompt:'Welke afspraak maakt het gedrag herhaalbaar?'},
   {label:'Tool',prompt:'Welke toegang is echt nodig?'},
   {label:'Bewijs',prompt:'Welke waarneming kan een ander opnieuw controleren?'}
  ],
  workedExample:`Een skill beschrijft een herhaalbare werkwijze; die geeft niet vanzelf toegang tot een systeem. MCP kan informatie of tools ontsluiten, maar de kamertoken begrenst de toegang. Leg daarom per stap vast wat de agent leest, uitvoert en overdraagt. ${day2Placeholder} voor aanvullingen uit de goedgekeurde leerplanning.`
 },
 quiz:{
  questions:[
   {question:'Welke afspraak hoort bij duurzame projectcontext?',options:['Een geheim in een gedeelde prompt bewaren','Een losse chatboodschap als enige bron gebruiken','Een korte, vindbare afspraak in CLAUDE.md vastleggen']},
   {question:'Wat is de juiste conclusie na een geslaagde MCP-aanroep?',options:['De agent mag nu alle systemen gebruiken','De toegestane tool leverde informatie binnen de geldende kamertoken','De agent heeft zelfstandig de beslissing genomen']},
   {question:'Welke overdracht maakt een bevinding reproduceerbaar?',options:['Bestand, commando, waargenomen uitvoer en beperking','Alleen een samenvatting van de agent','Een screenshot zonder context of volgende eigenaar']}
  ],
  answers:[2,1,0]
 },
 mission:{
  id:'ATLAS-CONTEXT-02',
  title:'Maak context en bewijs overdraagbaar',
  minutes:25,
  goal:'Onderzoek welke context de fictieve Atlas-repository nodig heeft. Lever een capability-map en één controleerbare aanbeveling zonder extra toegang te vragen.',
  allowed:['Lees alleen de meegeleverde starterbestanden.','Gebruik alleen lokale commando’s in je eigen kopie.','Dien bewijs en een suggestie in; een mens beslist over acceptatie.'],
  stop:'Stop bij ontbrekende bestanden, geheimen of benodigde toegang buiten de starter. Meld wat ontbreekt; verzin geen uitvoer.',
  checks:['Koppel context, instructie, tool, skill en menselijk oordeel aan concrete observaties.','Vermeld het werkelijk uitgevoerde commando en de uitvoer.','Beschrijf waarom dit het doel raakt en wat nog niet is bewezen.'],
  starterFiles,
  hints:['Maak eerst een capability-map van context, instructie, tool, skill en menselijk oordeel.','Vraag alleen de kleinste toegang die de lokale controle nodig heeft.','Leg je bevinding vast voor een verse lezer.']
 },
 reviewCriteria:['De capability-map is gekoppeld aan concrete bestanden of uitvoer.','De controle is door een tweede deelnemer te herhalen.','Onzekerheden en menselijke beslispunten blijven zichtbaar.',day2Placeholder]
};
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
 2:day2Pack
};
export function getDayPack(day){return dayPacks[day]??null;}
export function listDaySummaries(){return Object.values(dayPacks).map(({day,title,tag,blurb})=>({day,title,tag,blurb}));}
