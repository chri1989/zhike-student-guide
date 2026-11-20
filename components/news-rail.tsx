'use client';

import { useState } from 'react';
import { ArrowRight, Pause, Play } from 'lucide-react';
import { newsPosts } from '@/lib/news';

export default function NewsRail() {
  const [paused, setPaused] = useState(false);
  return <section className="home-news" aria-labelledby="home-news-title">
    <div className="section-heading">
      <h2 id="home-news-title">学代团News</h2>
      <div className="news-actions">
        <button className="icon-button" type="button" aria-label={paused ? '继续滚动推文' : '暂停滚动推文'} onClick={() => setPaused(value => !value)}>
          {paused ? <Play size={16}/> : <Pause size={16}/>}
        </button>
        <a href="/news">查看全部<ArrowRight size={15}/></a>
      </div>
    </div>
    <div className={'news-marquee' + (paused ? ' paused' : '')}>
      <div className="news-track">
        {[false, true].map(duplicate => <div key={String(duplicate)} className="news-strip" aria-hidden={duplicate || undefined}>
          {newsPosts.map(post => <a className="news-card" key={post.id} tabIndex={duplicate ? -1 : undefined} href={`/news/${post.id}.pdf`}>
            <img src={`/news/${post.id}.webp`} alt="" decoding="async"/>
            <div><time dateTime={post.date}>{post.date}</time><h3>{post.title}</h3></div>
          </a>)}
        </div>)}
      </div>
    </div>
  </section>;
}
