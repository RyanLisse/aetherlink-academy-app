import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {AlertCircle,ArrowRight,Bot,Pause,Play,RotateCcw,SkipForward,Terminal,User,Waypoints} from 'lucide-react';
import {useT} from './i18n';

const SPEEDS=[0.5,1,2,4];
const TYPE_META={
  user_message:{Icon:User,labelKey:'sim.type.user'},
  assistant_text:{Icon:Bot,labelKey:'sim.type.assistant'},
  tool_call:{Icon:Terminal,labelKey:'sim.type.toolCall'},
  tool_result:{Icon:ArrowRight,labelKey:'sim.type.toolResult'},
  system_event:{Icon:AlertCircle,labelKey:'sim.type.system'},
};

function useStepThrough(steps){
  const [index,setIndex]=useState(-1);
  const [playing,setPlaying]=useState(false);
  const [speed,setSpeed]=useState(1);
  const timer=useRef(null);
  const clear=useCallback(()=>{if(timer.current){clearTimeout(timer.current);timer.current=null;}},[]);
  const total=steps.length;
  const complete=index>=total-1;
  const stepForward=useCallback(()=>{
    setIndex(prev=>{
      if(prev>=total-1){setPlaying(false);return prev;}
      return prev+1;
    });
  },[total]);
  const play=useCallback(()=>{if(!complete)setPlaying(true);},[complete]);
  const pause=useCallback(()=>{clear();setPlaying(false);},[clear]);
  const reset=useCallback(()=>{clear();setPlaying(false);setIndex(-1);},[clear]);
  useEffect(()=>{
    if(playing&&index<total-1){
      timer.current=setTimeout(stepForward,1200/speed);
    }else if(playing&&index>=total-1){
      setPlaying(false);
    }
    return clear;
  },[playing,index,speed,total,stepForward,clear]);
  useEffect(()=>{clear();setPlaying(false);setIndex(-1);},[steps,clear]);
  return {
    index,playing,speed,setSpeed,complete,total,
    visible:steps.slice(0,index+1),
    play,pause,stepForward,reset,
  };
}

function SimMessage({step,t}){
  const meta=TYPE_META[step.type]||TYPE_META.assistant_text;
  const Icon=meta.Icon;
  const code=step.type==='tool_call'||step.type==='tool_result';
  return <article className={`sim-message sim-${step.type}`} data-sim-type={step.type}>
    <header>
      <Icon size={14} aria-hidden="true"/>
      <span>{t(meta.labelKey)}{step.toolName&&<code className="sim-tool">{step.toolName}</code>}</span>
    </header>
    {code?<pre>{step.content||t('sim.emptyResult')}</pre>:<p>{step.content}</p>}
    {step.annotation&&<p className="sim-annotation muted">{step.annotation}</p>}
  </article>;
}

/** Academy-native in-lesson step-through player (no iframe, no API keys). */
export function ConceptSim({scenario}){
  const t=useT();
  const steps=useMemo(()=>scenario?.steps||[],[scenario]);
  const sim=useStepThrough(steps);
  const scrollRef=useRef(null);
  useEffect(()=>{
    if(scrollRef.current)scrollRef.current.scrollTo({top:scrollRef.current.scrollHeight,behavior:'smooth'});
  },[sim.visible.length]);

  if(!scenario?.steps?.length)return null;

  return <article className="concept-sim" data-sim-id={scenario.id||scenario.version} data-testid="concept-sim">
    <header>
      <Waypoints size={17} aria-hidden="true"/>
      <strong>{scenario.title}</strong>
      <span className="progress-chip" role="status">{t('sim.progress',{step:Math.max(sim.index+1,0),total:sim.total})}</span>
    </header>
    {scenario.description&&<p className="muted sim-lede">{scenario.description}</p>}
    <div className="sim-controls" role="group" aria-label={t('sim.controls')}>
      {sim.playing
        ?<button type="button" className="sim-btn" onClick={sim.pause} data-testid="sim-pause" title={t('sim.pause')} aria-label={t('sim.pause')}><Pause size={16}/></button>
        :<button type="button" className="sim-btn sim-btn-primary" onClick={sim.play} disabled={sim.complete} data-testid="sim-play" title={t('sim.play')} aria-label={t('sim.play')}><Play size={16}/></button>}
      <button type="button" className="sim-btn" onClick={sim.stepForward} disabled={sim.complete} data-testid="sim-step" title={t('sim.step')} aria-label={t('sim.step')}><SkipForward size={16}/></button>
      <button type="button" className="sim-btn" onClick={sim.reset} data-testid="sim-reset" title={t('sim.reset')} aria-label={t('sim.reset')}><RotateCcw size={16}/></button>
      <span className="sim-speed muted">{t('sim.speed')}</span>
      {SPEEDS.map(s=><button key={s} type="button" className={sim.speed===s?'sim-speed-btn on':'sim-speed-btn'} onClick={()=>sim.setSpeed(s)} data-testid={`sim-speed-${s}`}>{s}×</button>)}
    </div>
    <div className="sim-timeline" ref={scrollRef} data-testid="sim-timeline" aria-live="polite">
      {sim.visible.length===0&&<p className="muted sim-empty">{t('sim.startHint')}</p>}
      {sim.visible.map((step,i)=><SimMessage key={`${step.type}-${i}`} step={step} t={t}/>)}
    </div>
    {sim.complete&&<p className="sim-done" role="status">{t('sim.complete')}</p>}
    {scenario.attribution&&<p className="sim-attribution muted"><small>{scenario.attribution}</small></p>}
  </article>;
}

/** Renders every resolved sim on a day pack inside the Lesson panel. */
export function ConceptSimSlot({sims}){
  const t=useT();
  if(!sims?.length)return null;
  return <section className="sim-slot" aria-label={t('sim.heading')} data-testid="sim-slot">
    <h3>{t('sim.heading')}</h3>
    <p className="muted">{t('sim.help')}</p>
    {sims.map(scenario=><ConceptSim key={scenario.id||scenario.version} scenario={scenario}/>)}
  </section>;
}
