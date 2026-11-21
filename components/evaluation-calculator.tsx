'use client';

import { useEffect, useRef, useState } from 'react';
import { Calculator, Copy, Minus, Plus } from 'lucide-react';
import { evaluateScores, evaluationModules, type EvaluationInputs, type EvaluationRule } from '@/lib/evaluation';

const storageKey='zhike-guide:evaluation:202604';
const format=(n:number)=>n.toFixed(2);
type Report=ReturnType<typeof evaluateScores>;

function RuleInput({rule,value,setValue}:{rule:EvaluationRule;value:string;setValue:(v:string)=>void}) {
  const fieldId='eval-'+rule.id;
  const points=rule.factor&&rule.kind==='count'?`${rule.factor>0?'+':''}${rule.factor} 分／项`:'';
  const detail=[points,rule.note].filter(Boolean).join('，');
  const descriptionId=detail?fieldId+'-detail':undefined;
  return <div className="evaluation-rule">
    <div><label htmlFor={fieldId}>{rule.label}</label>
      {detail?<span id={descriptionId} className="evaluation-rule-note">（{detail}）</span>:null}
    </div>
    {rule.kind==='flag'||rule.kind==='toggle'?<input id={fieldId} aria-describedby={descriptionId} type="checkbox" checked={value==='1'} onChange={e=>setValue(e.target.checked?'1':'')}/>
    :rule.kind==='choice'?<select id={fieldId} aria-describedby={descriptionId} value={value||'0'} onChange={e=>setValue(e.target.value)}>{rule.options?.map(option=><option key={option.label} value={option.score}>{option.label}（{option.score} 分）</option>)}</select>
    :rule.kind==='count'?<div className="evaluation-stepper">
      <button type="button" aria-label={'减少'+rule.label} onClick={()=>setValue(String(Math.max(0,(Number(value)||0)-1)))}><Minus size={15}/></button>
      <input id={fieldId} aria-describedby={descriptionId} type="text" inputMode="numeric" value={value||'0'} onChange={e=>setValue(e.target.value.replace(/[^0-9]/g,''))}/>
      <button type="button" aria-label={'增加'+rule.label} onClick={()=>setValue(String((Number(value)||0)+1))}><Plus size={15}/></button>
    </div>:<input id={fieldId} aria-describedby={descriptionId} type="text" inputMode="decimal" value={value} placeholder="0" onChange={e=>setValue(e.target.value)}/>}
  </div>;
}

export default function EvaluationCalculator() {
  const [inputs,setInputs]=useState<EvaluationInputs>({}),[manual,setManual]=useState(false),[restored,setRestored]=useState(false);
  const [report,setReport]=useState<Report|null>(null),[copyStatus,setCopyStatus]=useState('');
  const reportRef=useRef<HTMLElement>(null);
  useEffect(()=>{
    try {
      const saved=JSON.parse(localStorage.getItem(storageKey)??'null');
      if(saved?.inputs && typeof saved.inputs==='object')setInputs(Object.fromEntries(Object.entries(saved.inputs).filter(([,v])=>typeof v==='string')) as EvaluationInputs);
      setManual(saved?.manual===true);
    }catch{}
    setRestored(true);
  },[]);
  useEffect(()=>{if(restored)try{localStorage.setItem(storageKey,JSON.stringify({inputs,manual}));}catch{}},[inputs,manual,restored]);
  useEffect(()=>{if(report)reportRef.current?.scrollIntoView({behavior:'smooth',block:'start'});},[report]);
  function field(key:string,value:string) {setInputs(previous=>({...previous,[key]:value}));setCopyStatus('');}
  function reset(){if(window.confirm('清空这台设备上已填写的综测数据？')){setInputs({});setManual(false);setReport(null);setCopyStatus('');}}
  async function copy(){
    if(!report)return;
    const lines=[report.total===null?'综合素养记实分 '+format(report.z):'综合素质评价总分 '+format(report.total),
      `基础性素养评议分 ${format(report.s)}，学业成绩积分 ${report.x===null?'待填写':format(report.x)}，综合素养记实分 ${format(report.z)}`,
      ...report.modules.map(item=>`${item.label} ${format(item.score)}／${item.maximum} 分${item.factor===2?'，折合 '+format(item.score*2)+' 分':''}`),
      ...report.modules.flatMap(item=>item.cappedSubItems.map(cap=>`${cap.label} ${format(cap.before)} 分按 ${format(cap.after)} 分计`))];
    try{await navigator.clipboard.writeText(lines.join('\n'));setCopyStatus('报告已复制。');}catch{setCopyStatus('复制失败，可手动选中报告文字。');}
  }

  return <section className="evaluation-page">
    <div className="page-heading"><h1>综测加分自算器</h1></div>
    <p>按 2026 年 4 月第一次修订的学院方案核算。</p>
    <nav className="evaluation-nav" aria-label="综测计算板块"><a href="#eval-base">基础信息</a>{evaluationModules.map(m=><a key={m.id} href={'#'+m.id} onClick={()=>{const el=document.getElementById(m.id);if(el instanceof HTMLDetailsElement)el.open=true;}}>{m.label}</a>)}</nav>
    <section id="eval-base" className="evaluation-group">
      <h2>基础信息</h2>
      <label>学业成绩积分 X<input inputMode="decimal" value={inputs.x??''} onChange={e=>field('x',e.target.value)} placeholder="0–100，可留空"/></label>
      <label className="check-label"><input type="checkbox" checked={manual} onChange={e=>setManual(e.target.checked)}/>手动填写基础性素养评议分（默认 100 分）</label>
      {manual?<div className="evaluation-base-scores">{[['s1','个人评议（10%）'],['s2','班级评议（60%）'],['s3','学院评议（30%）']].map(([id,label])=><label key={id}>{label}<input inputMode="decimal" value={inputs[id]??''} placeholder="100" onChange={e=>field(id,e.target.value)}/></label>)}</div>:null}
    </section>
    {evaluationModules.map(module=><details className="evaluation-group" id={module.id} key={module.id}>
      <summary><strong>{module.label}</strong><span>上限 {module.maximum} 分{module.factor===2?' · 计入记实分时 ×2':''}</span></summary>
      {module.groups.map(group=><section key={group.id} className="evaluation-subgroup">
        <h3>{group.label}</h3>{'note' in group&&group.note?<p>{group.note}</p>:null}
        {group.rules.map(rule=><RuleInput key={rule.id} rule={rule} value={inputs[rule.id]??''} setValue={n=>field(rule.id,n)}/>)}
      </section>)}
    </details>)}
    <div className="evaluation-actions"><button className="button primary" type="button" onClick={()=>{setCopyStatus('');setReport(evaluateScores(inputs,manual));}}><Calculator size={17}/>一键计算总分</button><button className="button" type="button" onClick={reset}>重置</button></div>
    {report?<section className="evaluation-report" ref={reportRef}>
      <h2>个人综测核算报告</h2>
      <p>{report.total===null?'综合素养记实分':'综合素质评价总分'} <strong className="evaluation-score">{format(report.total??report.z)}</strong> 分</p>
      {report.total===null?<p>填入学业成绩 X 后，可以计算最终综测总分。</p>:<p>{format(report.s)} × 10% ＋ {format(report.x!)} × 60% ＋ {format(report.z)} × 30%</p>}
      <dl>{report.modules.map(item=><div key={item.id}>
        <dt>{item.label}{item.factor===2?'（×2）':''}</dt><dd><strong className="evaluation-score">{format(item.score)}</strong>／{item.maximum}</dd>
        <dd><progress aria-label={item.label+'得分'} max={item.maximum} value={item.score}/></dd>
        {item.net>item.maximum?<dd>净分 {format(item.net)}，按 <strong className="evaluation-score">{item.maximum}</strong> 分计。</dd>:null}
        {item.net<0?<dd>扣分 {format(item.deductions)}，该项按 0 分计。</dd>:null}
        {item.cappedSubItems.map(cap=><dd key={cap.label}>{cap.label} {format(cap.before)} 分，按 <strong className="evaluation-score">{format(cap.after)}</strong> 分计。</dd>)}
      </div>)}</dl>
      <p>本次记实分为 <strong className="evaluation-score">{format(report.z)}</strong> 分，其中智育加权后计 <strong className="evaluation-score">{format(report.modules[1].score*2)}</strong> 分。
        {report.modules.every(item=>item.net<=item.maximum&&item.cappedSubItems.length===0)?'本次未触发封顶截断。':''}</p>
      {report.discipline?<p className="evaluation-score">已取消本学年德育加分，扣分照常核算。</p>:null}
      {report.cadreDisqualified?<p className="evaluation-score">团干部任职加分资格取消，请从任职档位移除对应项目后重新计算。</p>:null}
      <button className="button" type="button" onClick={copy}><Copy size={16}/>复制报告文本</button><span role="status">{copyStatus}</span>
      <p className="muted">依据《暨南大学智能科学与工程学院本科学生综合素质评价实施方案》（2026 年 4 月第一次修订）测算。最终成绩以学院公示结果为准。</p>
    </section>:null}
  </section>;
}
