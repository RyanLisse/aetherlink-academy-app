import React,{useEffect,useState} from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import catalog from '../content/learn-claude-code/catalog.json';
import {courseUrl,resolveCourseLink} from './learn-course-links.mjs';
import {OfficialDocs} from './official-docs';
import './learn-course.css';

const slug=text=>text.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu,'').trim().replace(/\s+/g,'-');
const nodeText=node=>typeof node==='string'?node:Array.isArray(node)?node.map(nodeText).join(''):node?.props?nodeText(node.props.children):'';

const resolveLink=(value,path)=>resolveCourseLink(value,path,catalog);

function useText(url){
  const [state,setState]=useState({loading:true,text:'',error:''});
  const [attempt,setAttempt]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    setState({loading:true,text:'',error:''});
    fetch(url,{signal:controller.signal}).then(async response=>{
      if(!response.ok||response.headers.get('content-type')?.includes('text/html'))throw new Error('This resource could not be loaded.');
      return response.text();
    }).then(text=>setState({loading:false,text,error:''})).catch(error=>{
      if(error.name!=='AbortError')setState({loading:false,text:'',error:error.message});
    });
    return()=>controller.abort();
  },[url,attempt]);
  return {...state,retry:()=>setAttempt(value=>value+1)};
}

function Resource({url,path,code=false,language='python'}){
  const {loading,text,error,retry}=useText(url);
  useEffect(()=>{
    if(!loading&&location.hash){
      let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
      document.getElementById(id)?.scrollIntoView();
    }
  },[loading,url]);
  if(loading)return <p role="status">Loading content…</p>;
  if(error)return <div role="alert"><p>{error}</p><button onClick={retry}>Try again</button></div>;
  if(code)return <pre tabIndex={0} aria-label={`${language} source code`}><code>{text}</code></pre>;
  const heading=level=>({children})=>React.createElement(`h${level}`,{id:slug(nodeText(children))},children);
  return <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeHighlight,{detect:false,plainText:['mermaid']}]]} components={{
    h1:heading(2),h2:heading(3),h3:heading(4),h4:heading(5),
    a:({href,children})=><a href={resolveLink(href,path)}>{children}</a>,
    img:({src,alt})=><img src={resolveLink(src,path)} alt={alt||''} loading="lazy"/>,
    table:({children})=><div className="learn-table" tabIndex={0} role="region" aria-label="Course table"><table>{children}</table></div>,
    pre:({children})=><pre tabIndex={0}>{children}</pre>,
  }}>{text.replace(/<!--[\s\S]*?-->/g,'')}</Markdown>;
}

function CourseNotes({chapter}){
  const annotations=useText(`/learn-claude-code/files/web/src/data/annotations/${chapter.id}.json`);
  const scenario=useText(`/learn-claude-code/files/web/src/data/scenarios/${chapter.id}.json`);
  if(annotations.loading||scenario.loading)return <p role="status">Loading walkthrough…</p>;
  if(annotations.error||scenario.error)return <div role="alert">Walkthrough could not be loaded. <button onClick={()=>{annotations.retry();scenario.retry();}}>Try again</button></div>;
  let decisions,example;
  try{decisions=JSON.parse(annotations.text).decisions;example=JSON.parse(scenario.text);}catch{return <p role="alert">This walkthrough has an invalid format.</p>;}
  return <div className="learn-prose">
    <h2>Design decisions</h2>
    {decisions.map(decision=><section key={decision.id}><h3>{decision.title}</h3><Markdown remarkPlugins={[remarkGfm]}>{decision.description}</Markdown>{decision.alternatives&&<><h4>Alternatives</h4><Markdown remarkPlugins={[remarkGfm]}>{decision.alternatives}</Markdown></>}</section>)}
    <h2>Example walkthrough · {example.title}</h2>
    <p>{example.description}</p><p className="muted">An illustrative upstream scenario. These messages and tool results are examples, not a live agent run.</p>
    <ol className="learn-scenario">{example.steps.map((step,index)=><li key={index}><strong>{step.type.replaceAll('_',' ')}{step.toolName?` · ${step.toolName}`:''}</strong>{step.content&&<pre><code>{step.content}</code></pre>}{step.annotation&&<p>{step.annotation}</p>}</li>)}</ol>
  </div>;
}

export function LearnCourse(){
  const requested=new URLSearchParams(location.search).get('learn');
  const chapter=catalog.chapters.find(item=>item.id===requested);
  const [query,setQuery]=useState('');
  const [page,setPage]=useState('lesson');
  const [source,setSource]=useState(0);
  useEffect(()=>{document.documentElement.dataset.theme=localStorage.getItem('academy-theme')||'dark';},[]);
  const sequence=chapter?catalog.chapters.filter(item=>item.kind===chapter.kind):[];
  const position=sequence.findIndex(item=>item.id===chapter?.id);
  const matches=catalog.chapters.filter(item=>`${item.id} ${item.title}`.toLowerCase().includes(query.toLowerCase()));
  const code=chapter?.code?.[source];
  return <div className="learn-course" lang="en">
    <header className="learn-top"><a href="/">← Academy</a><span>Developer learning path</span><a href={catalog.sourceUrl}>Source repository ↗</a></header>
    <main>
      <p className="cyan">LEARN CLAUDE CODE</p>
      <h1>Build an agent, one concept at a time.</h1>
      <p className="learn-intro">The complete English learning material from shareAI Lab. Read the explanation, follow the diagrams, and try the examples in your own local environment.</p>
      <details className="learn-contents" open={!chapter||undefined}>
        <summary>Contents · 17 chapters, original series and references</summary>
        <label>Find a lesson<input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Agent loop, memory, MCP…"/></label>
        {['chapter','archive','reference'].map(kind=><section key={kind}><h2>{kind==='chapter'?'Current course':kind==='archive'?'Original 12-part series':'Reference material'}</h2><nav aria-label={kind+' lessons'}>{matches.filter(item=>item.kind===kind).map(item=><a key={item.id} href={courseUrl(item.id)} aria-current={chapter?.id===item.id?'page':undefined}><span>{item.id.replace('legacy-','')}</span>{item.title}</a>)}</nav></section>)}
        {!matches.length&&<p role="status">No matching lessons.</p>}
      </details>
      {!chapter?<section className="learn-empty"><h2>{requested?'Lesson not found':'Start learning'}</h2><p>Choose a chapter above, or begin with the agent loop.</p><a href={courseUrl('s01')}>Start chapter 1 →</a></section>:<>
        <div className="learn-meta"><span>{chapter.kind==='archive'?'Original series · separate numbering':chapter.kind==='reference'?'Reference':`Chapter ${position+1} of ${sequence.length}`}</span><a href={chapter.sourceUrl}>View original ↗</a></div>
        <nav className="learn-tabs" aria-label="Lesson content"><button aria-current={page==='lesson'?'page':undefined} onClick={()=>setPage('lesson')}>Explanation</button>{chapter.kind==='chapter'&&<button aria-current={page==='notes'?'page':undefined} onClick={()=>setPage('notes')}>Walkthrough</button>}{chapter.code?.length>0&&<button aria-current={page==='source'?'page':undefined} onClick={()=>setPage('source')}>Source code</button>}</nav>
        {page==='source'&&code&&<div className="learn-source"><label>Source file<select value={source} onChange={event=>setSource(Number(event.target.value))}>{chapter.code.map((item,index)=><option value={index} key={item.url}>{item.label}</option>)}</select></label><a href={code.url} download>Download source</a><p>Original {code.language} source. Run it locally using the upstream setup instructions; this page does not execute code.</p></div>}
        <article className="learn-prose" key={`${chapter.id}-${page}-${source}`} aria-label={chapter.title}>
          {page==='notes'?<CourseNotes chapter={chapter}/>:<Resource url={page==='source'&&code?code.url:chapter.markdownUrl} path={chapter.path} code={page==='source'} language={code?.language}/>}
        </article>
        <OfficialDocs chapterId={chapter.id}/>
        <nav className="learn-pagination" aria-label="Chapter navigation">{position>0?<a href={courseUrl(sequence[position-1].id)}>← {sequence[position-1].title}</a>:<span/>}{position<sequence.length-1&&<a href={courseUrl(sequence[position+1].id)}>{sequence[position+1].title} →</a>}</nav>
      </>}
      <details className="learn-resources"><summary>Supporting files and provenance</summary><p>Imported from revision <code>{catalog.revision}</code>. These are upstream learning examples, not Academy services. <a href={catalog.sourceFilesManifestUrl}>File manifest and checksums</a></p><ul>{(catalog.resources||[]).map(item=><li key={item.path}><a href={item.url} download>{item.label||item.path}</a></li>)}</ul></details>
      <footer>Content © shareAI Lab · <a href={catalog.licenseFileUrl}>MIT license</a> · <a href={catalog.sourceUrl}>Upstream source</a></footer>
    </main>
  </div>;
}
