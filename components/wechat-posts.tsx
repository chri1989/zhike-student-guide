'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { dateLabel } from '@/lib/guide';

type Post = { title: string; digest: string; url: string; cover?: string; date: string };
const accountPage = 'https://sisse.jnu.edu.cn/2019/0516/c12436a317862/page.htm';

export default function WechatPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      fetch('/api/wechat-posts', { cache: 'no-store', signal: controller.signal })
        .then(async response => {
          if (!response.ok) return;
          const data = await response.json() as { posts: Post[] };
          if (!controller.signal.aborted) setPosts(data.posts);
        }).catch(() => {});
    };
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);
  return <section className="wechat-posts">
    <div className="section-heading"><h2>{posts.length ? '学院公众号推文' : '学院公众号'}</h2>
      <a className="wechat-post-open" href={accountPage} target="_blank" rel="noopener noreferrer">官方公众号入口 <ArrowUpRight size={15} aria-hidden="true"/></a>
    </div>
    {posts.length > 0 && <div className="wechat-grid">{posts.map(post => <a className="wechat-post" href={post.url} key={post.url} target="_blank" rel="noopener noreferrer">
      {post.cover && <img src={post.cover} alt="" loading="lazy" referrerPolicy="no-referrer"/>}
      <div>
        <span className="wechat-post-date">{dateLabel(post.date)}</span>
        <h3>{post.title}</h3>
        {post.digest && <p>{post.digest}</p>}
        <span className="wechat-post-open">阅读原文 <ArrowUpRight size={15} aria-hidden="true"/></span>
      </div>
    </a>)}</div>}
  </section>;
}
