import {diagram,link,question} from './model.mjs';

const MIT='Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code';

export default {
 day:9,
 kind:'harness',
 deck:'harness',
 title:'Harness · s02 Tool Use',
 tag:'Harness',
 blurb:'Add a tool, add just one handler — TOOL_HANDLERS dispatch keeps the loop unchanged.',
 kicker:'Harness Engineering · s02',
 lessonTitle:'Tool Use — Add a Tool, Add Just One Line',
 motto:'Add a tool, add just one handler',
 leerdoel:'You keep the s01 loop intact, expand from bash-only to a tool dispatch map, and step a multi-tool ConceptSim without API keys.',
 narrative:[
  's01 has only bash. To read a file the model must spell cat; to write, echo redirects; to edit, sed. That translation wastes tokens and invites errors.',
  's02 keeps the loop word-for-word. The only change is the tool execution line: run_bash() becomes TOOL_HANDLERS[block.name]() lookup.',
  'Adding a tool means two registrations: one entry in TOOLS (schema the model sees) and one mapping in TOOL_HANDLERS (code that runs).',
  'Harness layer: Tool Dispatch — expanding the model\'s reach without rewriting the loop.'
 ],
 workedExample:'Mechanism: TOOLS = [bash, read_file, write_file, edit_file, glob]; TOOL_HANDLERS = {name: fn}. Loop still checks tool_use blocks; only the execute line becomes handler = TOOL_HANDLERS[block.name]; output = handler(**block.input).',
 loop:[
  {label:'Same loop',prompt:'Which s01 steps stay unchanged?'},
  {label:'Define tool',prompt:'What schema entry did you add to TOOLS?'},
  {label:'Register handler',prompt:'Which TOOL_HANDLERS mapping runs for this name?'},
  {label:'Dispatch',prompt:'Did you avoid a hardcoded run_bash call?'}
 ],
 demo:{
  slides:[],
  script:[
   'Show the tool-dispatch diagram. Contrast bash-only vs dedicated read/write tools.',
   'Step the ConceptSim: read_file → write_file for greet(name).'
  ],
  open:'Harness chapters teach via narrative + SVG + ConceptSim (no Worldline deck slides required).'
 },
 solo:[
  {id:'s02-dispatch',badge:'1',title:'Sketch the dispatch map',goal:'List at least four tool names and the one loop line that looks them up.',doneWhen:'Dispatch map and lookup line written.'},
  {id:'s02-two-steps',badge:'2',title:'Name the two registration steps',goal:'State: (1) TOOLS entry (2) TOOL_HANDLERS mapping.',doneWhen:'Both registration steps named.'},
  {id:'s02-sim',badge:'3',title:'Step the ConceptSim',goal:'Step Tool Use sim through read_file → write_file.',doneWhen:'You can narrate why dedicated tools beat bash-only.'}
 ],
 materials:[
  link('diagram','Tool dispatch diagram','/diagrams/harness/s02-tool-dispatch.svg','EN SVG · MIT shareAI Lab'),
  link('naslag','Upstream s02 README','https://github.com/shareAI-lab/learn-claude-code/tree/main/s02_tool_use','Reference only — do not iframe learn.shareai.run')
 ],
 diagrams:[
  diagram('/diagrams/harness/s02-tool-dispatch.svg','Tool dispatch','TOOLS + TOOL_HANDLERS leave the loop unchanged')
 ],
 sims:[{id:'s02',title:'Concept sim · Tool Use'}],
 attribution:MIT,
 skipAutoDeckLink:true,
 proof:[
  'Dispatch map sketched with lookup line.',
  'Two registration steps named (TOOLS + TOOL_HANDLERS).',
  'ConceptSim stepped without API keys.'
 ],
 quiz:[
  question('What stays unchanged when you add a tool in s02?',['The while True / tool_use loop','The deny list','The cron scheduler'],0),
  question('What two things does adding a tool require?',['A new model and a new loop','A TOOLS entry and a TOOL_HANDLERS mapping','A permission gate and a subagent'],1),
  question('Why prefer read_file over bash cat?',['It needs an API key','Dedicated tools reduce translation errors and wasted tokens','It bypasses permissions'],1)
 ],
 mission:{
  id:'HARNESS-S02',
  title:'Explain tool dispatch',
  minutes:20,
  goal:'Keep the s01 loop, describe TOOL_HANDLERS dispatch, and step the Tool Use ConceptSim.',
  allowed:['Use the in-lesson diagram and ConceptSim only.','No live model API required for the concept path.'],
  starterFiles:[],
  hints:['The loop body is almost identical to s01.','Only the execute line becomes a dict lookup.']
 },
 openItems:[]
};
