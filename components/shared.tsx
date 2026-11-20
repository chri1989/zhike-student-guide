'use client';
import {useEffect,useRef,ReactNode} from 'react';
import {BookOpen,GraduationCap,House,Wifi,HeartPulse,Activity,Utensils,Building2,Compass,X,ArrowUpRight,Phone,Mail,Expand} from 'lucide-react';
import {Article,dateLabel} from '@/lib/guide';
export const icons={study:BookOpen,evaluation:GraduationCap,dorm:House,network:Wifi,health:HeartPulse,sports:Activity,food:Utensils,services:Building2};
export function DelegateIcon({size=19}:{size?:number}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="10" cy="7" r="4"/>
    <path d="M8.5 8a2 2 0 0 0 3 0M4 21v-2a6 6 0 0 1 12 0v2M15 16c1.8-.3 3-2 4-4m.2-4 .7 1.4m2.1-.2-1 1.1"/>
  </svg>;
}
export function CategoryIcon({id,size=20}:{id:string;size?:number}){const Icon=icons[id as keyof typeof icons]||Compass;return <Icon size={size} strokeWidth={1.8} aria-hidden="true"/>;}
export function Brand(){return <a href="/" className="brand"><span className="brand-mark"><BookOpen size={23}/></span><strong>智科学代指南</strong><small>暨南大学·智能科学与工程学院</small></a>;}
export function GuideFooter(){
  return <footer className="footer">
    <span>智科学代团</span>
    <a href="/admin">管理后台<ArrowUpRight size={13}/></a>
    <span className="footer-icp"><a href="https://beian.miit.gov.cn/">陕ICP备2026033981号-1</a></span>
    <span className="footer-icp">
      <a href="https://beian.mps.gov.cn/#/query/webSearch?code=44040202002082" rel="noreferrer" target="_blank">
        <img src="/mps-filing.png" width={18} height={20} alt=""/>粤公网安备44040202002082号
      </a>
    </span>
  </footer>;
}
export function Modal({title,children,onClose,wide=false}:{title:string;children:ReactNode;onClose:()=>void;wide?:boolean}){
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const d=ref.current;d?.showModal();return()=>d?.close();},[]);
  return <dialog ref={ref} className={'modal '+(wide?'wide':'')} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget)onClose();}} aria-label={title}>
    <div className="modal-heading"><h2>{title}</h2><button type="button" className="icon-button" aria-label="关闭" onClick={onClose}><X size={20}/></button></div>{children}
  </dialog>;
}
function linkedText(text:string){
  const pattern=/(https?:\/\/[^\s<>）)]+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?<!\d)(?:0\d{2,3}-?\d{7,8}|1[3-9]\d{9}|\d{7})(?!\d))/g;
  const nodes:ReactNode[]=[];let last=0;for(const match of text.matchAll(pattern)){
    const value=match[0],at=match.index!;nodes.push(text.slice(last,at));
    if(value.startsWith('http'))nodes.push(<a key={at} href={value.replace(/[，。；;]+$/,'')} target="_blank" rel="noopener noreferrer">{value}<ArrowUpRight size={12}/></a>);
    else if(value.includes('@'))nodes.push(<a key={at} href={'mailto:'+value}>{value}<Mail size={12}/></a>);
    else nodes.push(<a key={at} href={'tel:'+value}>{value}<Phone size={12}/></a>);
    last=at+value.length;
  }nodes.push(text.slice(last));return nodes;
}
export function ArticleBody({article,onImage}:{article:Article;onImage?:(src:string,alt:string)=>void}){
  return <div className="article-body">
    {article.body.split(/\n\n+/).map((p,i)=>{
      const lines=p.split('\n');
      if(lines.every(l=>/^\s*[-●•]\s+/.test(l)))return <ul key={i}>{lines.map((l,j)=><li key={j}>{linkedText(l.replace(/^\s*[-●•]\s+/,''))}</li>)}</ul>;
      if(lines.every(l=>/^\s*\d+[.、]\s*/.test(l)))return <ol key={i} start={Number(lines[0].match(/\d+/)?.[0])||1}>{lines.map((l,j)=><li key={j}>{linkedText(l.replace(/^\s*\d+[.、]\s*/,''))}</li>)}</ol>;
      return p.startsWith('## ')?<h3 key={i}>{p.slice(3)}</h3>:p.startsWith('# ')?<h3 key={i}>{p.slice(2)}</h3>:<p key={i}>{linkedText(p)}</p>;
    })}
    {article.images.map((im,i)=><figure key={im.src+'-'+i}><button type="button" className="image-button" onClick={()=>onImage?.(im.src,im.alt)} aria-label={'放大查看：'+im.alt}><img src={im.src} alt={im.alt} loading="lazy"/><span><Expand size={16}/></span></button></figure>)}
  </div>;
}
export function ArticleMeta({article}:{article:Article}){return <div className="article-meta"><span>{dateLabel(article.updatedAt)}</span></div>;}
