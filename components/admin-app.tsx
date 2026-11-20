'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowLeft,ArrowUpRight,Plus,Search,Save,Eye,Send,LogOut,Users,ImagePlus,Trash2,Check,KeyRound,RefreshCw,BookOpen,Heading2,List,ListOrdered,MessageSquare} from 'lucide-react';
import {Article,Release,categories,dateLabel,searchArticles,changeLabels} from '@/lib/guide';
import {Brand,CategoryIcon,Modal,ArticleBody,ArticleMeta} from './shared';
import FeedbackInbox from './feedback-inbox';
import type {Feedback} from '@/lib/feedback';

type Draft={id:string;content:Article;active:boolean;revision:number;editor:string;edited_at:string};
type Maintainer={id:string;name:string;email:string;role:string;banned?:boolean};
type AdminData={user:Maintainer;drafts:Draft[];published:Article[];release:Release};
function comparable(a:Article){return JSON.stringify([a.title,a.category,a.summary,a.body,a.tags,a.images,a.verification,a.featured]);}
function pending(d:Draft,published:Article[]){const p=published.find(a=>a.id===d.id);return d.active?(!p||comparable(p)!==comparable(d.content)):!!p;}
async function api<T=Record<string,unknown>>(url:string,body?:unknown,method?:string):Promise<T>{
  const r=await fetch(url,{method:method||(body?'POST':'GET'),...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{}),cache:'no-store'});
  const data=await r.json() as T & {error?:string|{message?:string};message?:string};if(!r.ok)throw Object.assign(new Error((typeof data.error==='string'?data.error:data.error?.message)||data.message||'操作未完成，请重试。'),{status:r.status});return data;
}
export default function AdminApp(){
  const [stage,setStage]=useState('loading'),[data,setData]=useState<AdminData|null>(null),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[name,setName]=useState(''),[token,setToken]=useState('');
  const [query,setQuery]=useState(''),[onlyPending,setOnlyPending]=useState(false),[edit,setEdit]=useState<Draft|null>(null),[dirty,setDirty]=useState(false),[chosen,setChosen]=useState<Set<string>>(new Set());
  const [preview,setPreview]=useState(false),[publishOpen,setPublishOpen]=useState(false),[summary,setSummary]=useState(''),[membersOpen,setMembersOpen]=useState(false),[members,setMembers]=useState<Maintainer[]>([]);
  const [memberEmail,setMemberEmail]=useState(''),[memberName,setMemberName]=useState(''),[memberPassword,setMemberPassword]=useState(''),[passwordOpen,setPasswordOpen]=useState(false),[oldPassword,setOldPassword]=useState(''),[newPassword,setNewPassword]=useState('');
  const [zoom,setZoom]=useState<{src:string;alt:string}|null>(null);const textarea=useRef<HTMLTextAreaElement>(null);
  const [feedbackOpen,setFeedbackOpen]=useState(false);
  async function loadData(keepEdit=false){
    const next=await api<AdminData>('/api/admin/articles');setData(next);setStage('editor');if(!keepEdit)setEdit(null);return next;
  }
  useEffect(()=>{
    const fragment=new URLSearchParams(window.location.hash.slice(1));if(fragment.get('token')){setToken(fragment.get('token')!);window.history.replaceState(null,'',window.location.pathname);}
    (async()=>{try{const setup=await api<{needsSetup:boolean}>('/api/setup');if(setup.needsSetup){setStage('setup');return;}await loadData();}catch(e){if((e as {status?:number}).status===401)setStage('login');else{setError((e as Error).message);setStage('login');}}})();
  },[]);
  useEffect(()=>{const guard=(e:BeforeUnloadEvent)=>{if(dirty)e.preventDefault();};window.addEventListener('beforeunload',guard);return()=>window.removeEventListener('beforeunload',guard);},[dirty]);
  async function authSubmit(e:React.FormEvent){
    e.preventDefault();setBusy(true);setError('');
    try{
      if(stage==='setup')await api('/api/setup',{email,password,name,token});
      await api('/api/auth/sign-in/email',{email,password});setPassword('');setToken('');await loadData();
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  function select(d:Draft){if(dirty&&!window.confirm('当前修改还没有保存，切换后将丢失这些修改。继续切换？'))return false;setEdit(structuredClone(d));setDirty(false);setError('');setMessage('');return true;}
  function field<K extends keyof Article>(key:K,value:Article[K]){setEdit(prev=>prev?{...prev,content:{...prev.content,[key]:value}}:prev);setDirty(true);}
  function newArticle(){select({id:'g-'+crypto.randomUUID(),content:{id:'',title:'',category:'study',summary:'',body:'',tags:[],images:[],verification:'pending',featured:false},active:true,revision:0,editor:'',edited_at:''});}
  function feedbackDraft(item:Feedback){
    const category=data?.published.find(a=>a.id===item.article_id)?.category||'services';
    if(select({id:'g-'+crypto.randomUUID(),content:{id:'',title:item.title,category,summary:'',body:item.body,tags:[],images:[],verification:'pending',featured:false},active:true,revision:0,editor:'',edited_at:''})){
      setFeedbackOpen(false);setDirty(true);setMessage('已整理为指南草稿。请检查正文并删除个人信息，再保存、发布。');
    }
  }
  async function save(){
    if(!edit)return;setBusy(true);setError('');setMessage('');
    try{const content={...edit.content,id:edit.id};const result=await api<{revision:number}>('/api/admin/articles',{content,revision:edit.revision,active:edit.active},'PUT');setEdit({...edit,content,revision:result.revision});setDirty(false);await loadData(true);setMessage('草稿已保存，同学看到的内容还没有改变。');}
    catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  async function upload(file:File){
    setBusy(true);setError('');try{const form=new FormData();form.set('file',file);const r=await fetch('/api/admin/upload',{method:'POST',body:form});const image=await r.json() as {src:string;alt:string;error?:string};if(!r.ok)throw new Error(image.error);setEdit(prev=>prev?{...prev,content:{...prev.content,images:[...prev.content.images,image]}}:prev);setDirty(true);}catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  function insert(prefix:string){if(!edit)return;const at=textarea.current?.selectionStart??edit.content.body.length;field('body',edit.content.body.slice(0,at)+'\n\n'+prefix+edit.content.body.slice(at));setTimeout(()=>textarea.current?.focus(),0);}
  const pendingDrafts=useMemo(()=>data?.drafts.filter(d=>pending(d,data.published))||[],[data]);
  const selectedDrafts=pendingDrafts.filter(d=>chosen.has(d.id));
  const visible=useMemo(()=>{
    const drafts=onlyPending?pendingDrafts:data?.drafts||[];
    const ids=new Set(searchArticles(drafts.map(d=>d.content),query).map(a=>a.id));return drafts.filter(d=>ids.has(d.id));
  },[data,pendingDrafts,onlyPending,query]);
  function toggle(id:string){setChosen(prev=>{const next=new Set(prev);if(next.has(id))next.delete(id);else next.add(id);return next;});}
  async function publish(){
    if(!data)return;setBusy(true);setError('');
    try{const result=await api<{release:number}>('/api/admin/publish',{expectedRelease:data.release.id,selected:selectedDrafts.map(d=>({id:d.id,revision:d.revision})),summary});await loadData(true);setChosen(new Set());setPublishOpen(false);setSummary('');setMessage(`第 ${result.release} 次更新已发布，内容和公告已经同时生效。`);}
    catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  async function refresh(){if(dirty&&!window.confirm('重新载入会放弃当前未保存的修改，继续？'))return;setBusy(true);try{const next=await loadData();setDirty(false);if(edit){const d=next.drafts.find(x=>x.id===edit.id);if(d)setEdit(structuredClone(d));}setError('');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  async function loadMembers(){try{const r=await api<{users:Maintainer[]}>('/api/auth/admin/list-users');setMembers(r.users);setMembersOpen(true);}catch(e){setError((e as Error).message);}}
  async function createMember(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{await api('/api/auth/admin/create-user',{name:memberName,email:memberEmail,password:memberPassword,role:'user'});setMemberName('');setMemberEmail('');setMemberPassword('');await loadMembers();setMessage('维护者已添加。请私下将初始密码告知对方，并请对方登录后修改密码。');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  async function changeMember(m:Maintainer){setBusy(true);try{await api('/api/auth/admin/'+(m.banned?'unban-user':'ban-user'),{userId:m.id,...(!m.banned?{banReason:'由主管理员停用'}:{})});await loadMembers();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  async function resetMember(m:Maintainer){const pass=window.prompt('为 '+m.name+' 设置新的临时密码（至少 12 位）。请私下告知对方。');if(!pass)return;if(pass.length<12){setError('临时密码至少 12 位。');return;}setBusy(true);try{await api('/api/auth/admin/set-user-password',{userId:m.id,newPassword:pass});await api('/api/auth/admin/revoke-user-sessions',{userId:m.id});setMessage('该维护者的密码已重置，旧登录已失效。');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  async function changePassword(e:React.FormEvent){e.preventDefault();setBusy(true);try{await api('/api/auth/change-password',{currentPassword:oldPassword,newPassword,revokeOtherSessions:true});setPasswordOpen(false);setOldPassword('');setNewPassword('');setMessage('密码已修改，其他设备的登录已失效。');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  async function logout(){if(dirty&&!window.confirm('有未保存的修改，仍要退出登录？'))return;try{await api('/api/auth/sign-out',{});setData(null);setEdit(null);setDirty(false);setStage('login');}catch(e){setError((e as Error).message);}}
  if(stage==='loading')return <div className="loading-state"><div className="spinner"/>正在打开管理后台…</div>;
  if(stage!=='editor')return <div className="auth-page"><div className="auth-nav"><Brand/><a href="/">返回指南<ArrowUpRight size={15}/></a></div><main className="auth-card"><span className="auth-icon"><KeyRound size={25}/></span><span className="eyebrow">智科学代指南 · 管理后台</span><h1>{stage==='setup'?'设置首位管理员':'欢迎回来'}</h1><p>{stage==='setup'?'创建你的管理账号，之后即可邀请其他学代一起维护。':'登录后编辑指南、保存草稿和发布更新。'}</p>
    {error?<div className="error-banner" role="alert">{error}</div>:null}<form onSubmit={authSubmit}>
      {stage==='setup'?<><label>初始化凭证<input value={token} onChange={e=>setToken(e.target.value)} type="password" required autoComplete="off" placeholder="通过专属初始化入口自动填写"/></label><label>你的姓名<input value={name} onChange={e=>setName(e.target.value)} required maxLength={40} autoComplete="name"/></label></>:null}
      <label>邮箱账号<input type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="用于后台登录"/></label><label>密码<input type="password" required minLength={stage==='setup'?12:1} autoComplete={stage==='setup'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder={stage==='setup'?'至少 12 位':'输入你的密码'}/></label>
      <button className="button primary full" disabled={busy}>{busy?'正在处理…':stage==='setup'?'创建管理员并登录':'登录管理后台'}<ArrowUpRight size={16}/></button></form><p className="auth-footnote">{stage==='setup'?'初始化只需完成一次，请保管好你的账号密码。':'账号由主管理员添加。忘记密码请联系主管理员。'}</p></main><footer className="auth-footer">同学无需登录即可查阅指南</footer></div>;
  return <div className="admin-app"><header className="admin-topbar"><Brand/><span className="admin-badge">内容管理</span><div className="admin-top-actions"><a href="/" target="_blank">查看网站<ArrowUpRight size={14}/></a><button aria-label="问题反馈" onClick={()=>setFeedbackOpen(true)}><MessageSquare size={16}/><span className="desktop-only">问题反馈</span></button>{data?.user.role==='admin'?<button onClick={loadMembers}><Users size={16}/>维护者</button>:null}<button onClick={()=>setPasswordOpen(true)}><KeyRound size={16}/><span className="desktop-only">修改密码</span></button><span className="user-name">{data?.user.name}</span><button aria-label="退出登录" onClick={logout}><LogOut size={17}/></button></div></header>
    <div className="admin-announcements">{error?<div className="error-banner" role="alert">{error}</div>:null}{message?<div className="success-banner" role="status"><Check size={16}/>{message}</div>:null}</div>
    <div className="admin-workspace"><aside className="admin-list"><div className="admin-list-heading"><h1>指南条目 <span>{data?.drafts.length}</span></h1><button className="button small-button primary" onClick={newArticle}><Plus size={16}/>新增</button></div><div className="admin-search"><Search size={17}/><input aria-label="搜索后台条目" placeholder="搜索条目…" value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="admin-tabs"><button className={!onlyPending?'selected':''} onClick={()=>setOnlyPending(false)}>全部内容</button><button className={onlyPending?'selected':''} onClick={()=>setOnlyPending(true)}>待发布 <span>{pendingDrafts.length}</span></button><button className="refresh-button" aria-label="重新载入内容" onClick={refresh} disabled={busy}><RefreshCw size={15}/></button></div>
      <div className="draft-scroll">{visible.map(d=><div className={'draft-row '+(edit?.id===d.id?'selected':'')} key={d.id}>{pending(d,data!.published)?<input type="checkbox" aria-label={'选中发布：'+d.content.title} checked={chosen.has(d.id)} onChange={()=>toggle(d.id)}/>:<span className="checkbox-placeholder"/>}<button onClick={()=>select(d)}><span className="draft-title">{d.content.title}</span><span className="draft-meta">{categories.find(c=>c.id===d.content.category)?.name}{pending(d,data!.published)?<em>{d.active?'待发布':'待停用'}</em>:<span>{d.active?'已发布':'已停用'}</span>}</span></button></div>)}</div>
      <div className="publish-bar"><span>已选 {selectedDrafts.length} 项改动</span><button className="button primary" disabled={!selectedDrafts.length||busy||dirty} onClick={()=>{setError('');setPublishOpen(true);}}><Send size={15}/>发布选中</button></div>
    </aside><main className="editor-area">{edit?<><div className="editor-top"><div><span className="eyebrow">{edit.revision?'编辑条目':'新增条目'}</span><span className="edit-status">{dirty?'有修改未保存':'草稿已保存'}</span></div><div><button className="button" onClick={()=>setPreview(true)}><Eye size={16}/>预览</button><button className="button primary" onClick={save} disabled={busy||!dirty&&edit.revision>0}><Save size={16}/>{busy?'处理中…':'保存草稿'}</button></div></div>
      <div className="editor-form"><label>标题<input className="title-input" value={edit.content.title} onChange={e=>field('title',e.target.value)} placeholder="用同学会问的方式写标题" maxLength={200}/></label><div className="form-grid"><label>所属分类<select value={edit.content.category} onChange={e=>field('category',e.target.value)}>{categories.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label><label>信息核实状态<select value={edit.content.verification} onChange={e=>field('verification',e.target.value)}><option value="pending">原表信息 / 待核实</option><option value="verified">已核实当前有效</option></select></label></div>
      <label>简短说明<textarea value={edit.content.summary} onChange={e=>field('summary',e.target.value)} rows={2} maxLength={300} placeholder="一句话说明这条指南可以解决什么问题"/></label><label>搜索关键词<input value={edit.content.tags.join('，')} onChange={e=>field('tags',e.target.value.split(/[,，、]/).map(s=>s.trim()))} placeholder="例如：断网，连不上，校园网"/></label>
      <label>详细内容</label><div className="format-toolbar"><button type="button" onClick={()=>insert('## ')}><Heading2 size={17}/>小标题</button><button type="button" onClick={()=>insert('- ')}><List size={17}/>要点</button><button type="button" onClick={()=>insert('1. ')}><ListOrdered size={17}/>步骤</button><span>直接粘贴网址即可显示链接</span></div><textarea className="body-editor" ref={textarea} value={edit.content.body} onChange={e=>field('body',e.target.value)} rows={18} placeholder="填写正文；段落之间留一行空白。"/>
      <div className="images-heading"><h3>图片与图示</h3><label className="button upload-label"><ImagePlus size={16}/>{busy?'正在处理…':'上传图片'}<input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={busy} onChange={e=>{if(e.target.files?.[0])upload(e.target.files[0]);e.target.value='';}}/></label></div><p className="field-help">支持 JPG、PNG、WebP，每张不超过 8 MB。上传后请保存草稿。</p><div className="editor-images">{edit.content.images.map((im,i)=><div key={im.src} className="editor-image"><button className="editor-thumbnail" onClick={()=>setZoom(im)}><img src={im.src} alt={im.alt}/></button><input aria-label={'图片 '+(i+1)+' 的说明'} value={im.alt} onChange={e=>field('images',edit.content.images.map((x,j)=>j===i?{...x,alt:e.target.value}:x))}/><button className="icon-button" aria-label="移除此图片" onClick={()=>field('images',edit.content.images.filter((_,j)=>j!==i))}><Trash2 size={16}/></button></div>)}</div>
      <div className="editor-options"><label className="check-label"><input type="checkbox" checked={edit.content.featured} onChange={e=>field('featured',e.target.checked)}/>放入首页常用指南</label><label className="check-label"><input type="checkbox" checked={!edit.active} onChange={e=>{setEdit({...edit,active:!e.target.checked});setDirty(true);}}/>停用此条目（发布后生效）</label></div>
      {edit.content.sources?.length?<details className="source-details"><summary>原始出处（仅维护者可见）</summary>{edit.content.sources.map((s,i)=><p key={i}>{s.sheet} · {s.cells.join('、')}</p>)}</details>:null}<div className="editor-note"><strong>保存草稿后，还需要发布。</strong><p>在左侧勾选本次改动，点击“发布选中”，填写更新说明即可同步到网站。</p></div></div>
    </>:<div className="editor-empty"><BookOpen size={43}/><h2>选择一条指南，开始维护</h2><p>编辑后先保存草稿，再选择需要公开的改动。<br/>发布时会同时生成同学能看到的更新公告。</p><button className="button primary" onClick={newArticle}><Plus size={17}/>新增指南</button><span>当前已发布第 {data?.release?.id||'—'} 版 · {dateLabel(data?.release?.publishedAt)}</span></div>}</main></div>
    {feedbackOpen?<Modal title="学生反馈" wide onClose={()=>setFeedbackOpen(false)}><FeedbackInbox onCreateDraft={feedbackDraft}/></Modal>:null}
    {preview&&edit?<Modal title="条目预览" wide onClose={()=>setPreview(false)}><article className="detail preview-detail"><div className="category-eyebrow"><CategoryIcon id={edit.content.category}/>{categories.find(c=>c.id===edit.content.category)?.name}</div><h1>{edit.content.title||'未填写标题'}</h1><ArticleMeta article={edit.content}/><ArticleBody article={edit.content} onImage={(src,alt)=>setZoom({src,alt})}/></article></Modal>:null}
    {publishOpen?<Modal title="发布本次更新" onClose={()=>{if(!busy)setPublishOpen(false);}}><p className="muted">所选内容和这条公告会同时公开。未选中的草稿将继续保留。</p><div className="change-list">{selectedDrafts.map(d=><div className="change-item" key={d.id}><span className="change-kind">{!d.active?'停用':data?.published.some(a=>a.id===d.id)?'修改':'新增'}</span><span>{d.content.title}</span></div>)}</div><label>本次更新说明<textarea rows={4} value={summary} onChange={e=>setSummary(e.target.value)} maxLength={2000} placeholder="例如：更新宿舍报修联系方式，新增校园网缴费说明。"/></label>{error?<div className="error-banner" role="alert">{error}</div>:null}<button className="button primary full" onClick={publish} disabled={busy||!summary.trim()}><Send size={16}/>{busy?'正在发布…':'确认发布并显示公告'}</button></Modal>:null}
    {membersOpen?<Modal title="维护者账号" wide onClose={()=>setMembersOpen(false)}><p className="muted">每位维护者使用自己的账号，均可编辑和发布。只有你能管理账号。</p><div className="member-list">{members.map(m=><div className="member-row" key={m.id}><span><strong>{m.name}</strong><small>{m.email}</small></span><span>{m.role==='admin'?'主管理员':m.banned?'已停用':'维护者'}</span>{m.id!==data?.user.id?<><button className="text-button" disabled={busy} onClick={()=>resetMember(m)}>重置密码</button><button className="text-button" disabled={busy} onClick={()=>changeMember(m)}>{m.banned?'恢复':'停用'}</button></>:null}</div>)}</div><h3>添加维护者</h3><form className="member-form" onSubmit={createMember}><label>姓名<input value={memberName} onChange={e=>setMemberName(e.target.value)} required maxLength={40}/></label><label>邮箱<input type="email" value={memberEmail} onChange={e=>setMemberEmail(e.target.value)} required/></label><label>临时密码<input type="password" value={memberPassword} onChange={e=>setMemberPassword(e.target.value)} required minLength={12} autoComplete="new-password"/></label><button className="button primary" disabled={busy}>添加维护者<Plus size={16}/></button></form>{error?<div className="error-banner">{error}</div>:null}</Modal>:null}
    {passwordOpen?<Modal title="修改你的登录密码" onClose={()=>setPasswordOpen(false)}><form onSubmit={changePassword}><label>原密码<input type="password" value={oldPassword} onChange={e=>setOldPassword(e.target.value)} required autoComplete="current-password"/></label><label>新密码<input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required minLength={12} autoComplete="new-password"/></label>{error?<div className="error-banner">{error}</div>:null}<button className="button primary full" disabled={busy}>保存新密码</button></form></Modal>:null}
    {zoom?<Modal title={zoom.alt} onClose={()=>setZoom(null)} wide><img className="lightbox-image" src={zoom.src} alt={zoom.alt}/></Modal>:null}
  </div>;
}
