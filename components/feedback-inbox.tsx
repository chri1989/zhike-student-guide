'use client';
import {useEffect,useState} from 'react';
import {RefreshCw,FilePlus2,ArrowUpRight,MessageSquare} from 'lucide-react';
import {dateLabel} from '@/lib/guide';
import {Feedback,FeedbackList,FeedbackStatus,feedbackStatuses} from '@/lib/feedback';

export default function FeedbackInbox({onCreateDraft}:{onCreateDraft:(item:Feedback)=>void}){
  const [data,setData]=useState<FeedbackList|null>(null),[status,setStatus]=useState('new'),[page,setPage]=useState(1),[reload,setReload]=useState(0);
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
  useEffect(()=>{
    const controller=new AbortController();setLoading(true);setError('');
    fetch('/api/admin/feedback?'+new URLSearchParams({status,page:String(page)}),{cache:'no-store',signal:controller.signal}).then(async response=>{
      const result=await response.json() as FeedbackList & {error?:string};if(!response.ok)throw new Error(result.error||'反馈暂时无法加载。');return result;
    }).then(result=>{if(!controller.signal.aborted)setData(result);}).catch(e=>{if(!controller.signal.aborted)setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[status,page,reload]);
  async function changeStatus(item:Feedback,nextStatus:FeedbackStatus){
    setBusy(true);setError('');
    try{
      const response=await fetch('/api/admin/feedback',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:item.id,status:nextStatus,revision:item.revision})});
      const result=await response.json() as {error?:string};if(!response.ok)throw new Error(result.error||'状态未保存，请重试。');setReload(value=>value+1);
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  return <div className="feedback-inbox"><div className="feedback-tabs" role="group" aria-label="筛选反馈状态">{[['all','全部'],...Object.entries(feedbackStatuses)].map(([value,label])=><button className={value===status?'selected':''} key={value} disabled={busy||loading} onClick={()=>{setStatus(value);setPage(1);}}>{label}{data?<span>{value==='all'?Object.values(data.counts).reduce((a,b)=>a+b,0):data.counts[value as FeedbackStatus]}</span>:null}</button>)}<button className="icon-button" aria-label="刷新反馈" disabled={busy||loading} onClick={()=>setReload(value=>value+1)}><RefreshCw size={16}/></button></div>
    {error?<div className="error-banner" role="alert">{error}</div>:null}
    {loading?<p className="feedback-loading" role="status">正在加载反馈…</p>:data?.items.length?<div className="feedback-items">{data.items.map(item=><article className="feedback-item" key={item.id}>
      <div className="feedback-item-heading"><h3>{item.title}</h3><label className="feedback-status-label"><span className="sr-only">处理状态：{item.title}</span><select value={item.status} onChange={e=>changeStatus(item,e.target.value as FeedbackStatus)} disabled={busy}>{Object.entries(feedbackStatuses).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label></div>
      <p className="feedback-body">{item.body}</p>
      {item.contact?<p className="feedback-contact">联系方式：{item.contact}</p>:null}
      <div className="feedback-item-footer"><span>{dateLabel(item.created_at,true)}</span>{item.article_id?<a href={'/guide/'+item.article_id} target="_blank" rel="noopener noreferrer">相关指南<ArrowUpRight size={13}/></a>:null}<button className="text-button" disabled={busy} onClick={()=>onCreateDraft(item)}><FilePlus2 size={15}/>整理为指南草稿</button></div>
    </article>)}</div>:!error?<div className="feedback-empty"><MessageSquare size={28}/><p>暂无{status==='all'?'':feedbackStatuses[status as FeedbackStatus]}反馈</p></div>:null}
    {data&&data.pages>1?<div className="feedback-pagination"><button className="button small-button" disabled={busy||loading||data.page===1} onClick={()=>setPage(data.page-1)}>上一页</button><span>{data.page} / {data.pages} · 共 {data.total} 条</span><button className="button small-button" disabled={busy||loading||data.page===data.pages} onClick={()=>setPage(data.page+1)}>下一页</button></div>:null}
  </div>;
}
