'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { dateLabel } from '@/lib/guide';
import { progressStages, type SiteOverview } from '@/lib/feedback-progress';

function useOverview() {
  const [data, setData] = useState<SiteOverview | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/site-overview', {cache:'no-store',signal:controller.signal}).then(async response => {
      if (!response.ok) throw Error('Overview unavailable');
      setData(await response.json());
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, []);
  return {data,error};
}

export function SiteMetrics() {
  const {data,error}=useOverview();
  const metrics = [
    { label:'收录条目数', value:data?.items, unit:'条', note:'已发布的校园指南' },
    { label:'覆盖高频场景数', value:data?.scenarios, unit:'类', note:'含已发布指南的分类' },
    { label:'已解答／已解决诉求数', value:data?.resolved, unit:'条', note:'已公开且附指南答复' },
    { label:'知识库更新频次', value:data?.releases30d, unit:'次', note:'近 30 天内容发布' },
  ];
  return <section className="guide-metrics">
    <div className="section-heading"><h2>智科数智服务看板</h2><a href="/feedback-progress">查看诉求进展<ArrowRight size={15}/></a></div>
    <dl>{metrics.map(row=><div key={row.label}><dt>{row.label}</dt><dd><strong>{row.value?.toLocaleString('zh-CN')??'—'}</strong> {row.unit}</dd><dd>{row.note}</dd></div>)}</dl>
    {error?<p className="muted" role="status">数据暂时无法加载。</p>:null}
  </section>;
}

export function ProgressWall() {
  const {data,error}=useOverview();
  return <section className="progress-wall">
    <div className="page-heading"><h1>「我为同学办实事」诉求追踪墙</h1></div>
    <p>查看公开的办理进展与站内答复。你也可以把校园问题和建议反馈给学代。</p>
    <a className="button primary" href="/feedback">提交问题反馈<ArrowRight size={16}/></a>
    {error?<p role="alert">办理进展暂时无法加载。</p>:!data?<p role="status">正在加载办理进展…</p>:null}
    <ol className="progress-board">
      {Object.entries(progressStages).map(([stage,label])=>{
        const items=data?.progress.filter(item=>item.stage===stage)??[];
        return <li key={stage}><h2>{label}{data?<span>{items.length}</span>:null}</h2>
          {items.map(item=><article key={item.id} className="progress-card">
            <h3>{item.title}</h3><p>{item.summary}</p><time dateTime={item.updatedAt}>{dateLabel(item.updatedAt)}</time>
            {item.guide?<a href={'/guide/'+encodeURIComponent(item.guide.id)}><BookOpen size={15}/>查看《{item.guide.title}》</a>:null}
          </article>)}
          {data&&items.length===0?<p className="progress-empty">暂无公开诉求</p>:null}
        </li>;
      })}
    </ol>
    <section className="progress-history">
      <h2>宿舍走访回顾</h2>
      <p>第二届学代见面会记录了 198 间宿舍的走访工作。整理出的 34 条有效问题已在智科学代指南中解答。</p>
      <a href="/about#dorm-visit">查看走访介绍<ArrowRight size={15}/></a>
    </section>
  </section>;
}
