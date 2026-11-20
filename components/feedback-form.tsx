'use client';
import {useEffect,useState} from 'react';
import {Check,Send,ArrowUpRight} from 'lucide-react';
import type {Article} from '@/lib/guide';

export default function FeedbackForm({articles}:{articles:Article[]}){
  const [articleId,setArticleId]=useState(''),[title,setTitle]=useState(''),[body,setBody]=useState(''),[contact,setContact]=useState(''),[website,setWebsite]=useState('');
  const [busy,setBusy]=useState(false),[submitted,setSubmitted]=useState(false),[error,setError]=useState('');
  useEffect(()=>{setArticleId(new URLSearchParams(window.location.search).get('article')||'');},[]);
  const article=articles.find(a=>a.id===articleId);
  async function submit(e:React.FormEvent){
    e.preventDefault();if(busy)return;setBusy(true);setError('');
    try{
      const response=await fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title,body,contact,website,articleId:article?.id||''})});
      const data=await response.json() as {error?:string};if(!response.ok)throw new Error(data.error||'提交未完成，请重试。');
      setSubmitted(true);setTitle('');setBody('');setContact('');
    }catch(e){setError(e instanceof Error?e.message:'暂时无法提交，请稍后重试。');}finally{setBusy(false);}
  }
  return <section className="feedback-page"><div className="page-heading"><h1>问题反馈</h1></div>
    {submitted?<div className="feedback-success" role="status"><span className="feedback-success-icon"><Check size={25}/></span><h2>反馈已收到</h2><p>学代会查看并处理。</p><div><a className="button primary" href="/">返回指南</a><button className="button" onClick={()=>setSubmitted(false)}>继续反馈</button></div></div>:<form className="feedback-form" onSubmit={submit}>
      {article?<a className="feedback-context" href={'/guide/'+article.id}>关于：{article.title}<ArrowUpRight size={15}/></a>:null}
      <label>标题<input name="title" value={title} onChange={e=>setTitle(e.target.value)} placeholder="想反馈什么问题？" required maxLength={100}/></label>
      <label>问题内容<textarea name="body" value={body} onChange={e=>setBody(e.target.value)} placeholder="描述遇到的问题，或希望补充的信息" required rows={7} maxLength={3000}/></label>
      <label>联系方式（选填）<input name="contact" value={contact} onChange={e=>setContact(e.target.value)} placeholder="邮箱或微信号，方便学代联系你" maxLength={100}/></label>
      <label className="feedback-trap" aria-hidden="true">个人网站<input name="website" value={website} onChange={e=>setWebsite(e.target.value)} tabIndex={-1} autoComplete="off"/></label>
      {error?<div className="error-banner" role="alert">{error}</div>:null}
      <button className="button primary full" disabled={busy}><Send size={16}/>{busy?'正在提交…':'提交反馈'}</button>
    </form>}
  </section>;
}
