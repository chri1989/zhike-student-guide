import type { Metadata } from 'next';
import { ArrowUpRight } from 'lucide-react';
import GuideApp from '@/components/guide-app';
import { newsPosts } from '@/lib/news';

export const metadata: Metadata = { title: '学代团News · 智科学代指南' };

export default function Page() {
  const content = <section className="news-page">
    <div className="page-heading"><h1>学代团News</h1></div>
    <div className="news-list">
      {newsPosts.map(post => <article className="news-list-item" key={post.id}>
        <a href={`/news/${post.id}.pdf`}>
          <img src={`/news/${post.id}.webp`} alt="" loading="lazy"/>
          <div><time dateTime={post.date}>{post.date}</time><h2>{post.title}</h2><p>{post.description}</p></div>
          <ArrowUpRight size={18} aria-hidden="true"/>
        </a>
      </article>)}
    </div>
  </section>;
  return <GuideApp contentPage={{title:'学代团News', content}}/>;
}
