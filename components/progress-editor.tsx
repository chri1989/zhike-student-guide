'use client';

import { useEffect, useState } from 'react';
import type { Article } from '@/lib/guide';
import { progressStages, type ProgressRecord, type ProgressStage } from '@/lib/feedback-progress';

export default function ProgressEditor({ id, guides, onDone }: {id:string; guides:Article[]; onDone:()=>void}) {
  const [record,setRecord]=useState<ProgressRecord|null|undefined>(undefined);
  const [title,setTitle]=useState(''),[summary,setSummary]=useState(''),[stage,setStage]=useState<ProgressStage>('received'),[guideId,setGuideId]=useState('');
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  useEffect(()=>{
    const controller=new AbortController();
    fetch('/api/admin/feedback-progress?id='+encodeURIComponent(id),{cache:'no-store',signal:controller.signal}).then(async response=>{
      const data=await response.json() as {record:ProgressRecord|null;error?:string};
      if(!response.ok)throw Error(data.error||'无法读取公开进展。');
      setRecord(data.record);
      if(data.record){setTitle(data.record.title);setSummary(data.record.summary);setStage(data.record.stage);setGuideId(data.record.guide_id);}
    }).catch(e=>{if(!controller.signal.aborted)setError(e.message);});
    return()=>controller.abort();
  },[id]);
  async function update(method:'PUT'|'DELETE') {
    setBusy(true);setError('');
    try {
      const response=await fetch('/api/admin/feedback-progress',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify({id,title,summary,stage,guideId,revision:record?.revision??0})});
      const data=await response.json();
      if(!response.ok)throw Error(data.error||'公开进展未保存。');
      onDone();
    } catch(e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <form className="progress-editor" onSubmit={e=>{e.preventDefault();void update('PUT');}}>
    <p className="muted">请单独填写可公开的标题和进展，去除姓名、学号、宿舍号和联系方式。</p>
    {error?<div className="error-banner" role="alert">{error}</div>:null}
    {record!==undefined?<>
      <label>公开标题<input value={title} onChange={e=>setTitle(e.target.value)} maxLength={100} required/></label>
      <label>公开进展<textarea value={summary} onChange={e=>setSummary(e.target.value)} maxLength={400} rows={3} required/></label>
      <label>进度<select value={stage} onChange={e=>setStage(e.target.value as ProgressStage)}>{Object.entries(progressStages).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
      <label>关联已发布指南<select value={guideId} onChange={e=>setGuideId(e.target.value)} required={stage==='resolved'}><option value="">选择指南</option>{guides.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <button className="button primary" disabled={busy}>保存并公开进展</button>
      {record?<button className="button" type="button" disabled={busy} onClick={()=>void update('DELETE')}>撤下公开进展</button>:null}
    </>:error?null:<p role="status">正在读取公开进展…</p>}
  </form>;
}
