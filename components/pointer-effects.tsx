'use client';
import {useEffect,useRef} from 'react';

const interactive='.category-card,.result-card,.shortcut,.search-box,.latest-banner,.nav-item,.button';

export default function PointerEffects(){
  const layerRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!matchMedia('(pointer:fine)').matches||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
    const layer=layerRef.current;if(!layer)return;
    let frame=0,x=0,y=0,targetX=0,targetY=0,active=false,dirty=false;
    let lit=new Set<HTMLElement>();
    const highlight=()=>{
      const elements=new Set(document.querySelectorAll<HTMLElement>('.category-card,.shortcut,.search-box,.latest-banner'));
      const hovered=document.elementFromPoint(targetX,targetY)?.closest<HTMLElement>(interactive);
      if(hovered)elements.add(hovered);
      const positions=[...elements].map(element=>({element,box:element.getBoundingClientRect()}));
      const next=new Set<HTMLElement>();
      for(const {element,box} of positions){
        const dx=Math.max(box.left-targetX,0,targetX-box.right),dy=Math.max(box.top-targetY,0,targetY-box.bottom);
        const distance=Math.hypot(dx,dy);
        if(distance>=90)continue;
        element.style.setProperty('--mx',(targetX-box.left)+'px');
        element.style.setProperty('--my',(targetY-box.top)+'px');
        element.style.setProperty('--proximity',String((1-distance/90)**1.5));
        next.add(element);
      }
      for(const element of lit)if(!next.has(element))element.style.setProperty('--proximity','0');
      lit=next;
    };
    const draw=()=>{
      x+=(targetX-x)*.13;y+=(targetY-y)*.13;
      layer.style.setProperty('--light-x',x+'px');layer.style.setProperty('--light-y',y+'px');
      if(dirty){highlight();dirty=false;}
      frame=Math.hypot(targetX-x,targetY-y)>.2?requestAnimationFrame(draw):0;
    };
    const queue=()=>{if(active){dirty=true;if(!frame)frame=requestAnimationFrame(draw);}};
    const move=(e:PointerEvent)=>{
      if(e.pointerType==='touch')return;
      targetX=e.clientX;targetY=e.clientY;
      if(!active){x=targetX;y=targetY;active=true;layer.dataset.active='true';}
      queue();
    };
    const clear=()=>{
      cancelAnimationFrame(frame);frame=0;active=false;delete layer.dataset.active;
      for(const element of lit)element.style.setProperty('--proximity','0');lit.clear();
    };
    const visibility=()=>{if(document.hidden)clear();};
    document.addEventListener('pointermove',move,{passive:true});
    document.addEventListener('pointerleave',clear);
    document.addEventListener('visibilitychange',visibility);
    window.addEventListener('blur',clear);window.addEventListener('resize',queue);
    window.addEventListener('scroll',queue,{passive:true,capture:true});
    return()=>{
      clear();document.removeEventListener('pointermove',move);document.removeEventListener('pointerleave',clear);
      document.removeEventListener('visibilitychange',visibility);window.removeEventListener('blur',clear);
      window.removeEventListener('resize',queue);window.removeEventListener('scroll',queue,true);
    };
  },[]);
  return <div ref={layerRef} className="ambient-background" aria-hidden="true"/>;
}
