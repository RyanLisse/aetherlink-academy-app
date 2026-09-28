import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveCourseLink} from '../../src/learn-course-links.mjs';
const catalog={sourceUrl:'https://github.com/shareAI-lab/learn-claude-code/tree/pinned',chapters:[{id:'s02',path:'s02_tool_use/README.md'}],filePaths:['s01_agent_loop/images/agent-loop.en.svg','requirements.txt']};
test('course links keep chapter navigation and diagrams inside Academy',()=>{
  assert.equal(resolveCourseLink('../s02_tool_use/','s01_agent_loop/README.md',catalog),'/?learn=s02');
  assert.equal(resolveCourseLink('images/agent-loop.en.svg','s01_agent_loop/README.md',catalog),'/learn-claude-code/files/s01_agent_loop/images/agent-loop.en.svg');
  assert.equal(resolveCourseLink('../requirements.txt','s01_agent_loop/README.md',catalog),'/learn-claude-code/files/requirements.txt');
});
test('omitted files retain pinned upstream links and executable schemes are rejected',()=>{
  assert.equal(resolveCourseLink('README.zh.md','s01_agent_loop/README.md',catalog),'https://github.com/shareAI-lab/learn-claude-code/blob/pinned/s01_agent_loop/README.zh.md');
  assert.equal(resolveCourseLink('javascript:alert(1)','README.md',catalog),'');
  assert.equal(resolveCourseLink('data:text/html,test','README.md',catalog),'');
  assert.equal(resolveCourseLink('.env.example','README.md',{...catalog,filePaths:['.env.example']}),'https://github.com/shareAI-lab/learn-claude-code/blob/pinned/.env.example');
  assert.equal(resolveCourseLink('%zz','README.md',catalog),'');
  assert.equal(resolveCourseLink('#the-problem','README.md',catalog),'#the-problem');
});
