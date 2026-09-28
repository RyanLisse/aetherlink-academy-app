import React,{useState} from 'react';
import {classroomExerciseSources,exercisesForDay} from '../content/exercises/classroom-days.mjs';
import './exercises.css';

const labels={typescript:'TypeScript',python:'Python'};

function CodeTabs({examples}){
  const [language,setLanguage]=useState('typescript');
  const code=examples?.[language];
  if(!code)return null;
  return <section className="classroom-code" aria-label="Illustrative code examples">
    <div className="classroom-code-head"><div><h4>Developer deep dive · code example</h4><p>Display only. Academy does not run these snippets; use your own local repository when you choose to try them.</p></div>
      <div className="classroom-code-tabs" role="group" aria-label="Code display language">
        {Object.keys(examples).map(key=><button key={key} type="button" aria-pressed={language===key} onClick={()=>setLanguage(key)}>{labels[key]||key}</button>)}
      </div>
    </div>
    <pre><code>{code}</code></pre>
  </section>;
}

function ExerciseCard({item}){
  const [open,setOpen]=useState(true);
  return <article className="classroom-exercise" data-testid={`exercise-${item.id}`}>
    <button type="button" className="classroom-exercise-toggle" aria-expanded={open} onClick={()=>setOpen(value=>!value)}>
      <span className="classroom-exercise-badge">A{item.assignment}</span>
      <span className="classroom-exercise-heading"><strong>{item.title}</strong><small>Source slide {item.sourceSlide}</small></span>
      <span aria-hidden="true" className="classroom-exercise-chevron">{open?'−':'+'}</span>
    </button>
    {open&&<div className="classroom-exercise-body">
      <section><h4>The problem</h4><p>{item.problem}</p></section>
      <section><h4>How to think about it</h4><p>{item.explanation}</p></section>
      <section><h4>Flow</h4><ol className="exercise-flow" tabIndex={0} aria-label={`${item.title} process`}>{item.diagram.map((step,index)=><li key={step}><span>{step}</span>{index<item.diagram.length-1&&<span className="exercise-flow-arrow" aria-hidden="true">→</span>}</li>)}</ol></section>
      <section><h4>Walkthrough</h4><ol>{item.walkthrough.map(step=><li key={step}>{step}</li>)}</ol></section>
      <section className="exercise-try"><h4>Try it in your repository</h4><p>{item.tryIt}</p></section>
      <section><h4>Expected evidence</h4><ul>{item.evidence.map(evidence=><li key={evidence}>{evidence}</li>)}</ul></section>
      <section><h4>Reflect</h4><ul>{item.reflection.map(question=><li key={question}>{question}</li>)}</ul></section>
      <section className="exercise-deep-dive"><h4>Developer deep dive</h4><p>{item.deepDive}</p><CodeTabs examples={item.code}/></section>
    </div>}
  </article>;
}

export function ClassroomExercises({day}){
  const items=exercisesForDay(day);
  const [selected,setSelected]=useState(items[0]?.id);
  if(!items.length)return null;
  const active=items.find(item=>item.id===selected)||items[0];
  return <section className="classroom-exercises" data-testid="classroom-exercises" aria-label={`Day ${day} practice exercises`}>
    <p className="cyan">PRACTICE · DAY {day}</p>
    <h3>Exercises from the classroom days</h3>
    <p className="muted classroom-exercise-intro">English is the default. Work individually in your own local starter copy; the practice repository is a reference for implemented pages and data shapes. The code tabs display examples only.</p>
    {Number(day)===1&&<section className="classroom-setup" aria-label="Practice repository setup">
      <h4>Set up your individual practice copy</h4>
      <p>Use the starter as your workspace. The practice repo is a reference implementation; do not use its sample participant profile as your own.</p>
      <pre><code>{`git clone https://github.com/jyse/aetherlink-classroom-starter.git
cd aetherlink-classroom-starter
npm install
npm start
# Open http://localhost:3000
# In a second terminal in this folder:
claude`}</code></pre>
      <p>Before a data change, run <code>npm run validate</code>. These commands are for your own terminal; Academy does not execute them.</p>
    </section>}
    <div className="classroom-exercise-picker" role="group" aria-label={`Day ${day} assignment`}>
      {items.map(item=><button key={item.id} id={`tab-${item.id}`} type="button" aria-pressed={active.id===item.id} onClick={()=>setSelected(item.id)}>A{item.assignment} · {item.title}</button>)}
    </div>
    <div id={`panel-${active.id}`}>
      <ExerciseCard key={active.id} item={active}/>
    </div>
    <div className="classroom-exercise-sources">
      <strong>Source revisions</strong>
      <a href={classroomExerciseSources.slides.url} target="_blank" rel="noreferrer">Classroom slides · {classroomExerciseSources.slides.revision.slice(0,12)}</a>
      <a href={classroomExerciseSources.starter.url} target="_blank" rel="noreferrer">Starter · {classroomExerciseSources.starter.revision.slice(0,12)}</a>
      <a href={classroomExerciseSources.practice.url} target="_blank" rel="noreferrer">Practice reference · {classroomExerciseSources.practice.revision.slice(0,12)}</a>
    </div>
  </section>;
}
