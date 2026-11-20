'use client';
import {useCallback,useDeferredValue,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {Search,ArrowRight,ArrowLeft,ArrowUpRight,ChevronRight,History,Menu,RefreshCw,BookOpen,CalendarDays,Globe,Phone,MessageSquare,Settings,X,Eye,Newspaper,Calculator,ClipboardList} from 'lucide-react';
import {Article,Guide,Release,categories,changeLabels,dateLabel,searchArticles,searchTerms} from '@/lib/guide';
import { delegateContact } from '@/lib/contact';
import {Brand,CategoryIcon,Modal,ArticleBody,ArticleMeta,GuideFooter,DelegateIcon} from './shared';
import FeedbackForm from './feedback-form';
import { XiaozhiLauncher } from './xiaozhi';
import { ArticleActions, useGuideActivity } from './guide-interaction';
import NewsRail from './news-rail';
import { SiteMetrics } from './site-progress';

function ResultSnippet({article,query}:{article:Article;query:string}){
  const flat=article.body.replace(/\s+/g,' '),terms=searchTerms(query);
  const hit=terms.map(t=>({t,i:flat.toLowerCase().indexOf(t)})).find(x=>x.i>=0);
  if(!hit)return <>{article.summary}</>;
  const begin=Math.max(0,hit.i-30),end=Math.min(flat.length,hit.i+hit.t.length+80);
  return <>{begin?'…':''}{flat.slice(begin,hit.i)}<mark>{flat.slice(hit.i,hit.i+hit.t.length)}</mark>{flat.slice(hit.i+hit.t.length,end)}{end<flat.length?'…':''}</>;
}
function ReleaseContent({release}:{release:Release}){return <>
  <div className="release-meta"><span className="version">第 {release.id} 次发布</span><span>{dateLabel(release.publishedAt,true)}</span></div>
  <p className="release-summary">{release.summary}</p>
  <div className="change-list">{release.changes.map((c,i)=><div className="change-item" key={c.id+i}><span className={'change-kind '+c.kind}>{changeLabels[c.kind]}</span>{c.id&&c.kind!=='removed'?<a href={'/guide/'+c.id}>{c.title}<ChevronRight size={15}/></a>:<span>{c.title}</span>}</div>)}</div>
  <p className="small muted">{release.publisher}</p>
</>;}
export default function GuideApp({articleId,historyView=false,feedbackView=false,contactView=false,contentPage}:{articleId?:string;historyView?:boolean;feedbackView?:boolean;contactView?:boolean;contentPage?:{title:string;content:ReactNode}}){
  const [guide,setGuide]=useState<Guide|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  const [query,setQuery]=useState(''),[category,setCategory]=useState(''),[menu,setMenu]=useState(false),[history,setHistory]=useState<Release[]>([]);
  const [image,setImage]=useState<{src:string;alt:string}|null>(null),[welcome,setWelcome]=useState(false);
  const deferred=useDeferredValue(query);const searchRef=useRef<HTMLInputElement>(null),fetching=useRef(false);
  const { activity, like } = useGuideActivity(articleId);
  const ready = guide !== null;
  const browseView = !articleId && !historyView && !feedbackView && !contactView && !contentPage;
  const homeView = browseView && !category;
  const load=useCallback(async()=>{
    if(fetching.current)return;fetching.current=true;
    try{
      const response=await fetch('/api/guide',{cache:'no-store'});const data=await response.json() as Guide & {error?:string};if(!response.ok)throw new Error(data.error||'暂时无法加载指南。');
      setGuide(data);setError('');
    }catch(e){setError(e instanceof Error?e.message:'网络连接失败，请重试。');}finally{setLoading(false);fetching.current=false;}
  },[]);
  useEffect(()=>{
    load();const foreground=()=>{if(document.visibilityState==='visible')load();};const restore=(e:PageTransitionEvent)=>{if(e.persisted)load();};
    document.addEventListener('visibilitychange',foreground);window.addEventListener('pageshow',restore);
    const keys=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();searchRef.current?.focus();}};window.addEventListener('keydown',keys);
    return()=>{document.removeEventListener('visibilitychange',foreground);window.removeEventListener('pageshow',restore);window.removeEventListener('keydown',keys);};
  },[load]);
  useEffect(()=>{if(historyView)fetch('/api/updates',{cache:'no-store'}).then(async r=>{if(!r.ok)throw new Error();setHistory(await r.json());}).catch(()=>setError('更新历史暂时无法加载，请刷新重试。'));},[historyView]);
  useEffect(() => {
    if (!ready || !browseView) return;
    try {
      const key = 'zhike-guide:welcomed:v1';
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {}
    setWelcome(true);
  }, [ready, browseView]);
  const filtered=useMemo(()=>searchArticles(guide?.articles||[],deferred,category==='all'?'':category),[guide,deferred,category]);
  const article=guide?.articles.find(a=>a.id===articleId);
  const counts=useMemo(()=>Object.fromEntries(categories.map(c=>[c.id,guide?.articles.filter(a=>a.category===c.id).length||0])),[guide]);
  function choose(id:string){if(articleId||historyView||contactView||contentPage){window.location.href='/?category='+id;return;}setCategory(id);setQuery('');setMenu(false);window.scrollTo({top:0,behavior:'smooth'});}
  useEffect(()=>{const p=new URLSearchParams(window.location.search);const c=p.get('category');if(c&&(c==='all'||categories.some(x=>x.id===c)))setCategory(c);const q=p.get('q');if(q)setQuery(q);},[]);
  function searchSubmit(e:React.FormEvent){e.preventDefault();if(articleId||historyView)window.location.href='/?q='+encodeURIComponent(query);}
  const popular = useMemo(() => {
    const articles = guide?.articles ?? [];
    const count = articles.filter(item => item.featured).length || 6;
    return [...articles].sort((a, b) => (activity?.articles[b.id]?.likes ?? 0) - (activity?.articles[a.id]?.likes ?? 0) ||
      Number(b.featured) - Number(a.featured)).slice(0, count);
  }, [guide, activity]);
  function actions(item: Article) {
    return <ArticleActions id={item.id} title={item.title} onLike={like}
      activity={activity ? activity.articles[item.id] ?? { views: 0, likes: 0, liked: false } : undefined}/>;
  }
  const shortcuts=[{title:'常用网站',term:'校园常用网站',icon:Globe},{title:'学年校历',term:'学年校历',icon:CalendarDays},{title:'办事联系',term:'校内办事时间',icon:Phone}];
  const currentCategory=categories.find(c=>c.id===(article?.category||category));
  return <div className={'site-layout'+(browseView?' guide-browse':'')+(homeView?' guide-home':'')}>
    <aside className={'sidebar '+(menu?'mobile-open':'')}>
      <Brand/><div className="sidebar-label">指南目录</div>
      <nav aria-label="指南分类"><a href="/" className={!category&&browseView?'nav-item active':'nav-item'}><BookOpen size={19}/>全部指南<span>{guide?.articles.length||'—'}</span></a>
        {categories.map(c=><button key={c.id} className={'nav-item '+(category===c.id||article?.category===c.id?'active':'')} onClick={()=>choose(c.id)}><CategoryIcon id={c.id} size={19}/>{c.name}<span>{counts[c.id]||''}</span></button>)}
      </nav><div className="sidebar-label spaced">了解更多</div>
      <a className={'nav-item '+(contentPage?.title==='关于我们'?'active':'')} href="/about" aria-current={contentPage?.title==='关于我们'?'page':undefined}><DelegateIcon/>关于我们</a>
      <a className={'nav-item '+(contentPage?.title==='学代团News'?'active':'')} href="/news"><Newspaper size={19} aria-hidden="true"/>学代团News</a>
      <a className={'nav-item '+(contentPage?.title==='诉求追踪墙'?'active':'')} href="/feedback-progress"><ClipboardList size={19} aria-hidden="true"/>诉求追踪墙</a>
      <a className={'nav-item '+(contentPage?.title==='综测加分自算器'?'active':'')} href="/calculator"><Calculator size={19} aria-hidden="true"/>综测加分自算器</a>
      <a href="/updates" className={'nav-item '+(historyView?'active':'')}><History size={19}/>更新记录</a>
      <a className={'nav-item '+(feedbackView?'active':'')} href="/feedback"><MessageSquare size={19}/>问题反馈</a>
      <a className={'nav-item '+(contactView?'active':'')} href="/contact" aria-current={contactView?'page':undefined}><MessageSquare size={19}/>联系学代</a>
      <div className="sidebar-bottom"><a href="/admin"><Settings size={16}/>管理后台<ArrowUpRight size={14}/></a></div>
    </aside>
    {menu?<button className="sidebar-scrim" aria-label="收起目录" onClick={()=>setMenu(false)}/>:null}
    <div className="page-shell"><header className="topbar">
      <div className="mobile-brand"><button className="icon-button" aria-label="打开分类目录" onClick={()=>setMenu(!menu)}>{menu?<X size={21}/>:<Menu size={21}/>}</button><a href="/">智科学代指南</a></div>
      <span className="breadcrumb"><span>{contentPage?.title??(contactView?'联系学代':feedbackView?'问题反馈':historyView?'更新记录':currentCategory?.name||'首页')}</span></span>
      <div className="topbar-right">
        <span className="desktop-only">智能科学与工程学院/人工智能产业学院·学生代表团</span>
        {homeView?<a className="header-about-link" href="/about"><DelegateIcon size={17}/>关于我们</a>:<>
          <a href="/feedback" aria-label="提交问题反馈"><MessageSquare size={17}/><span>反馈</span></a>
          <a href="/updates" aria-label="查看更新记录"><History size={17}/><span>更新记录</span></a>
        </>}
      </div>
    </header>
      <main className="main-content">
        {error&&!contentPage?<div className="error-banner" role="alert">{error}<button onClick={load}>重试<RefreshCw size={14}/></button></div>:null}
        {loading&&!contactView&&!contentPage?<div className="loading-state"><div className="spinner"/><p>正在载入校园指南…</p></div>:null}
        {!loading&&!guide&&!contactView&&!contentPage?<div className="empty-state"><BookOpen size={35}/><h1>指南暂时无法打开</h1><p>请检查网络连接后重试。</p><button className="button" onClick={load}>重新加载</button></div>:null}
        {guide&&articleId?(article?<>
          <a className="back-link" href={'/?category='+article.category}><ArrowLeft size={16}/>返回{currentCategory?.name}</a>
          <article className="detail"><div className={'category-eyebrow '+article.category}><CategoryIcon id={article.category} size={17}/>{currentCategory?.name}</div><h1>{article.title}</h1><div className="detail-meta"><ArticleMeta article={article}/></div>
            {actions(article)}
            <ArticleBody article={article} onImage={(src,alt)=>setImage({src,alt})}/><a className="feedback-link" href={'/feedback?article='+encodeURIComponent(article.id)}><MessageSquare size={15}/>信息反馈<ArrowUpRight size={14}/></a>
          </article><section className="related"><h2>相关条目</h2>{guide.articles.filter(a=>a.category===article.category&&a.id!==article.id).slice(0,4).map(a=><a key={a.id} href={'/guide/'+a.id}>{a.title}<ArrowRight size={16}/></a>)}</section>
        </>:<div className="empty-state"><h1>这条指南已停用或不存在</h1><p>可以返回首页搜索其他内容，或查看更新记录。</p><a className="button primary" href="/">返回首页</a></div>):null}
        {guide&&historyView?<><div className="page-heading"><h1>更新记录</h1></div><div className="timeline">{history.map(r=><section className="history-card" key={r.id}><div className="timeline-dot"/><ReleaseContent release={r}/></section>)}</div></>:null}
        {guide&&feedbackView?<><FeedbackForm articles={guide.articles}/><a className="feedback-link" href="/feedback-progress">查看诉求追踪墙<ArrowRight size={16}/></a></>:null}
        {contactView && <article className="detail"><h1>问题反馈渠道</h1><ArticleBody article={delegateContact}/><a className="feedback-link" href="/feedback-progress">查看诉求追踪墙<ArrowRight size={16}/></a></article>}
        {contentPage?.content}
        {guide&&browseView?<>
          <div className={'page-heading '+(!category?'home-heading':'')}><h1>{category?(currentCategory?.name||'全部指南'):'智科学代指南'}</h1></div>
          <div className="guide-search-row">
            <form className="search-box" onSubmit={searchSubmit}><Search size={23}/><input ref={searchRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索校园信息" aria-label="搜索指南"/>{query?<button type="button" className="icon-button" aria-label="清空搜索" onClick={()=>setQuery('')}><X size={18}/></button>:<kbd className="desktop-only">Ctrl K</kbd>}</form>
            <XiaozhiLauncher/>
          </div>
          {!query&&homeView?<NewsRail/>:null}
          <nav className="guide-mobile-links" aria-label="常用入口">
            <a href="/updates"><History size={16} aria-hidden="true"/>更新记录</a>
            <a href="/feedback"><MessageSquare size={16} aria-hidden="true"/>问题反馈</a>
            <a href="/contact"><MessageSquare size={16} aria-hidden="true"/>联系学代</a>
          </nav>
          {!query&&!category?<>
            {activity && <p className="guide-site-activity"><Eye size={16} aria-hidden="true"/>
              <span>{activity.visits.toLocaleString('zh-CN')} 次访问</span>
            </p>}
            <SiteMetrics/>
            <section className="categories-section"><div className="section-heading"><h2>分类</h2><span>{guide.articles.length} 个条目</span></div><div className="category-grid">{categories.map(c=><button className={'category-card '+c.id} key={c.id} onClick={()=>choose(c.id)}><span className="category-icon"><CategoryIcon id={c.id} size={23}/></span><strong>{c.name}</strong><span className="card-bottom">{counts[c.id]}<ArrowUpRight size={16}/></span></button>)}</div></section>
            <section className="quick-section"><div className="shortcut-grid">{shortcuts.map(s=>{const target=guide.articles.find(a=>a.title.includes(s.term));return <a className="shortcut" key={s.title} href={target?'/guide/'+target.id:'/?q='+encodeURIComponent(s.term)}><s.icon size={19}/><span><strong>{s.title}</strong></span><ArrowUpRight size={15}/></a>;})}</div></section>
          </>:null}
          <section className="results-section"><div className="section-heading"><h2>{query?'搜索结果':category?'分类条目':'热门指南'}</h2><span>{query||category?`${filtered.length} 个结果`:<a href="/?category=all" onClick={e=>{e.preventDefault();setCategory('all');}}>查看全部<ArrowRight size={14}/></a>}</span></div>
            <div className="mobile-filters">{(query||category)?<><button className={!category||category==='all'?'selected':''} onClick={()=>setCategory('all')}>全部</button>{categories.map(c=><button key={c.id} className={category===c.id?'selected':''} onClick={()=>setCategory(c.id)}>{c.name}</button>)}</>:null}</div>
            <div className="result-list">{(query||category?filtered:popular).map(a => <article key={a.id} className="guide-result-entry">
              <a className="result-card" href={'/guide/'+a.id}><span className={'result-icon '+a.category}><CategoryIcon id={a.category}/></span><div><div className="result-title"><h3>{a.title}</h3></div><p>{query?<ResultSnippet article={a} query={query}/>:a.summary}</p><div className="result-meta"><span>{categories.find(c=>c.id===a.category)?.name}</span><span>{dateLabel(a.updatedAt)}</span>{a.images.length?<span>含图示</span>:null}</div></div><ChevronRight size={19}/></a>
              {actions(a)}
            </article>)}</div>
            {(query||category)&&!filtered.length?<div className="empty-state"><Search size={32}/><h3>还没找到相关内容</h3><p>换一个简短关键词，或试试其他分类。</p><button className="button" onClick={()=>{setQuery('');setCategory('');}}>查看全部分类</button></div>:null}
          </section>
        </>:null}
        <GuideFooter/>
      </main>
    </div>
    {welcome?<Modal title="终于等到你！" onClose={()=>setWelcome(false)}>
      <div className="guide-welcome">
        <img src="/guide-welcome.png" width={254} height={243} alt="叼着玫瑰打招呼的小猫"/>
        <p>由学代团出品的智科学代指南现在正式上线啦！我们整理了关于学习教务、综测评优、校园网、饮食生活、校内办事等各类校园指南，供大家查阅浏览。</p>
        <p>除此之外还有可以帮你检索信息的站内专属大模型：小智（点击搜索框右边的Q版小人就可以唤起对话哦）</p>
        <button type="button" className="button primary full" onClick={()=>setWelcome(false)}>开始浏览</button>
      </div>
    </Modal>:null}
    {image?<Modal title={image.alt} onClose={()=>setImage(null)} wide><img className="lightbox-image" src={image.src} alt={image.alt}/></Modal>:null}
  </div>;
}
