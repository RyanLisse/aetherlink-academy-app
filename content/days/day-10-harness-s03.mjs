import {diagram,link,question} from './model.mjs';

const MIT='Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code';

export default {
 day:10,
 kind:'harness',
 deck:'harness',
 title:'Harness · s03 Permission System',
 tag:'Harness',
 blurb:'Check permissions before executing — deny list, rule match, optional user approval.',
 kicker:'Harness Engineering · s03',
 lessonTitle:'Permission — Check Permissions Before Execution',
 motto:'Check permissions before executing',
 leerdoel:'You insert a permission pipeline before tool execution (hard deny → rule match → user approval), and step a ConceptSim that pauses for approval without API keys.',
 narrative:[
  's02 gives the agent five tools. File tools can use safe_path, but bash is unrestricted. Ask it to clean up and it might run rm -rf /.',
  'Safety cannot rely on trusting the model — it needs code: a check before every tool execution.',
  'Keep the s02 loop. Insert check_permission() before execution. Three gates in fixed order: hard deny, soft ask (rule match), then user approval. No match → allow.',
  'Harness layer: Permission — a gate before tool execution.'
 ],
 workedExample:'Mechanism: for each tool_call → Gate1 deny list (block) → Gate2 permission rules (ask) → Gate3 user y/N → else allow → run handler → tool_result. Motto: check permissions before executing.',
 loop:[
  {label:'Propose tool',prompt:'Which tool_call did the model emit?'},
  {label:'Gate 1 deny',prompt:'Is it on the hard deny list?'},
  {label:'Gate 2 rules',prompt:'Does a soft-ask rule match?'},
  {label:'Gate 3 approval',prompt:'Did the user allow or deny before execution?'}
 ],
 demo:{
  slides:[],
  script:[
   'Show permission overview + pipeline diagrams.',
   'Step the ConceptSim: destructive-looking bash → system_event gates → user approval → tool_result.'
  ],
  open:'Harness chapters teach via narrative + SVG + ConceptSim (no Worldline deck slides required).'
 },
 solo:[
  {id:'s03-gates',badge:'1',title:'Name the three gates',goal:'Write deny / rule match / user approval and what happens on match.',doneWhen:'All three gates and outcomes named.'},
  {id:'s03-where',badge:'2',title:'Place the gate in the loop',goal:'Point to the single insertion point: before handler execution, after tool_use is parsed.',doneWhen:'Insertion point stated relative to the s02 loop.'},
  {id:'s03-sim',badge:'3',title:'Step the ConceptSim',goal:'Step Permission sim through system_event approval to tool_result.',doneWhen:'You can narrate why the runtime paused.'}
 ],
 materials:[
  link('diagram','Permission overview','/diagrams/harness/s03-permission-overview.svg','EN SVG · MIT shareAI Lab'),
  link('diagram','Permission pipeline','/diagrams/harness/s03-permission-pipeline.svg','EN SVG · MIT shareAI Lab'),
  link('naslag','Upstream s03 README','https://github.com/shareAI-lab/learn-claude-code/tree/main/s03_permission','Reference only — do not iframe learn.shareai.run')
 ],
 diagrams:[
  diagram('/diagrams/harness/s03-permission-overview.svg','Permission overview','deny → ask → allow around tool execution'),
  diagram('/diagrams/harness/s03-permission-pipeline.svg','Permission pipeline','three gates before the handler runs')
 ],
 sims:[{id:'s03',title:'Concept sim · Permission'}],
 attribution:MIT,
 skipAutoDeckLink:true,
 proof:[
  'Three permission gates named with outcomes.',
  'Insertion point before handler execution stated.',
  'ConceptSim stepped without API keys.'
 ],
 quiz:[
  question('Where does the permission check sit?',['After tool_result is appended','Before the tool handler runs','Inside the model weights'],1),
  question('What is Gate 1?',['User free-text chat','A hard deny list that blocks immediately','A cron schedule'],1),
  question('If no gate matches, what happens?',['The tool is denied','The tool executes (allow path)','The loop restarts from scratch'],1)
 ],
 mission:{
  id:'HARNESS-S03',
  title:'Explain the permission pipeline',
  minutes:20,
  goal:'Name the three gates, place check_permission before execution, and step the Permission ConceptSim.',
  allowed:['Use the in-lesson diagrams and ConceptSim only.','No live model API required for the concept path.'],
  starterFiles:[],
  hints:['Deny first, then soft ask, then user approval.','Most routine calls take the allow path.']
 },
 openItems:[]
};
