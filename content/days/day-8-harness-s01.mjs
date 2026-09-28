import {diagram,link,question} from './model.mjs';

const MIT='Ported/adapted from shareAI-lab/learn-claude-code (MIT, Copyright 2024 shareAI Lab). https://github.com/shareAI-lab/learn-claude-code';

export default {
 day:8,
 kind:'harness',
 deck:'harness',
 title:'Harness · s01 Agent Loop',
 tag:'Harness',
 blurb:'One loop & Bash is all you need — messages, while True, tool_use.',
 kicker:'Harness Engineering · s01',
 lessonTitle:'The Agent Loop — One Loop Is All You Need',
 motto:'One loop & Bash is all you need',
 leerdoel:'You explain why an agent needs a loop around the model, name the tool_use vs final-answer signals, and step a preauthored agent loop without API keys.',
 narrative:[
  'You ask the model to list files and run a script. It can output a bash command, but once it finishes outputting it stops — it will not execute the command or keep reasoning on the result.',
  'You could run each command yourself, paste the output back, and repeat. Every round-trip, you are the middle layer. Automating that handoff is the agent loop.',
  'A while True loop keeps going when the model emits a tool_use block, and stops when it does not. Append the assistant turn, execute tools, append tool_result messages, call the model again.',
  'Harness layer: The Loop — the first bridge between the model and the real world.'
 ],
 workedExample:'Mechanism: messages = [{role:user, content:query}]; while True: response = model(messages, tools); messages.append(assistant); if no tool_use blocks → break; else execute tools, append tool_result, continue. Motto: one tool + one loop = one agent.',
 loop:[
  {label:'User message',prompt:'What task enters the messages list?'},
  {label:'Model turn',prompt:'Did the response contain a tool_use block?'},
  {label:'Execute',prompt:'What did the tool return, and did you append tool_result?'},
  {label:'Continue or stop',prompt:'tool_use → loop again; otherwise answer the user'}
 ],
 demo:{
  slides:[],
  script:[
   'Show the agent-loop diagram, then step the ConceptSim: user task → bash tool_use → result → verify → final answer.',
   'Emphasize: no API key is required for the concept path — the scenario is preauthored.'
  ],
  open:'Harness chapters teach via narrative + SVG + ConceptSim (no Worldline deck slides required).'
 },
 solo:[
  {id:'s01-motto',badge:'1',title:'State the motto',goal:'Write the s01 motto and name the harness layer in one sentence.',doneWhen:'Motto and harness layer named without copying a slide wall.'},
  {id:'s01-signal',badge:'2',title:'Name the loop signals',goal:'List the two response signals (tool_use present / absent) and the loop action for each.',doneWhen:'Both signals and actions written.'},
  {id:'s01-sim',badge:'3',title:'Step the ConceptSim',goal:'Play or step the Agent Loop sim through tool_call → tool_result → final answer.',doneWhen:'You can narrate each step without an API key.'}
 ],
 materials:[
  link('diagram','Agent loop diagram','/diagrams/harness/s01-agent-loop.svg','EN SVG · MIT shareAI Lab'),
  link('naslag','Upstream s01 README','https://github.com/shareAI-lab/learn-claude-code/tree/main/s01_agent_loop','Reference only — do not iframe learn.shareai.run')
 ],
 diagrams:[
  diagram('/diagrams/harness/s01-agent-loop.svg','Agent loop','while True: tool_use continues, otherwise stop')
 ],
 sims:[{id:'s01',title:'Concept sim · Agent Loop'}],
 attribution:MIT,
 skipAutoDeckLink:true,
 proof:[
  'Motto and harness layer stated (s01).',
  'tool_use vs no-tool_use signals named with loop actions.',
  'ConceptSim stepped without API keys.'
 ],
 quiz:[
  question('What keeps the agent loop running?',['A larger model','A tool_use block in the model response','A longer system prompt'],1),
  question('When does the loop stop?',['After every tool result','When the response has no tool_use block','Only when bash exits non-zero'],1),
  question('Why is the concept sim useful here?',['It needs a live Anthropic key','It shows messages → tool_use → results without API keys','It replaces the permission system'],1)
 ],
 mission:{
  id:'HARNESS-S01',
  title:'Explain and step the agent loop',
  minutes:20,
  goal:'Name the loop signals and step the preauthored Agent Loop ConceptSim end-to-end.',
  allowed:['Use the in-lesson diagram and ConceptSim only.','No live model API required for the concept path.'],
  starterFiles:[],
  hints:['Look for tool_use blocks in the assistant turn.','tool_result is appended before the next model call.']
 },
 openItems:[]
};
