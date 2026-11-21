'use client';

import { useEffect, useRef } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { featuredNewsPost, newsPosts } from '@/lib/news';

const carouselPosts = newsPosts.filter(post => post.id !== featuredNewsPost.id);

export default function NewsRail() {
  const rail = useRef<HTMLDivElement>(null);
  const originalStrip = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = rail.current;
    const strip = originalStrip.current;
    if (!scroller || !strip) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let stripWidth = 0;
    let writtenPosition = 0;
    let resumeAt = 0;
    let dragging = false;
    let previousFrame = performance.now();
    let fractionalPixels = 0;
    let frame = 0;

    function writePosition(left: number) {
      if (!scroller) return;
      scroller.scrollLeft = left;
      writtenPosition = scroller.scrollLeft;
    }

    function measure() {
      if (!strip || !scroller) return;
      const width = Math.round(strip.getBoundingClientRect().width);
      if (reducedMotion.matches) {
        stripWidth = width;
        writePosition(0);
        return;
      }
      // Use the middle copy so a swipe can move in either direction.
      if (width !== stripWidth || scroller.scrollLeft < width) {
        writePosition(width);
      }
      stripWidth = width;
    }

    const holdForSwipe = () => { resumeAt = performance.now() + 700; };
    const startSwipe = () => { dragging = true; holdForSwipe(); };
    const stopSwipe = () => {
      if (!dragging) return;
      dragging = false;
      holdForSwipe();
    };
    const onScroll = () => {
      if (Math.abs(scroller.scrollLeft - writtenPosition) > 0.5) holdForSwipe();
    };

    function tick(now: number) {
      frame = requestAnimationFrame(tick);
      const elapsed = Math.max(0, Math.min(now - previousFrame, 50));
      previousFrame = now;
      if (!scroller || reducedMotion.matches || !stripWidth || dragging || now < resumeAt ||
        (scroller.contains(document.activeElement) && document.activeElement?.matches(':focus-visible'))) {
        fractionalPixels = 0;
        return;
      }

      fractionalPixels += elapsed * 0.018;
      const pixels = Math.floor(fractionalPixels);
      if (!pixels) return;
      fractionalPixels -= pixels;
      const left = scroller.scrollLeft + pixels;
      writePosition(stripWidth + ((left % stripWidth) + stripWidth) % stripWidth);
    }

    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(strip);
    reducedMotion.addEventListener('change', measure);
    scroller.addEventListener('pointerdown', startSwipe, { passive: true });
    scroller.addEventListener('scroll', onScroll, { passive: true });
    scroller.addEventListener('wheel', holdForSwipe, { passive: true });
    window.addEventListener('pointerup', stopSwipe);
    window.addEventListener('pointercancel', stopSwipe);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      reducedMotion.removeEventListener('change', measure);
      scroller.removeEventListener('pointerdown', startSwipe);
      scroller.removeEventListener('scroll', onScroll);
      scroller.removeEventListener('wheel', holdForSwipe);
      window.removeEventListener('pointerup', stopSwipe);
      window.removeEventListener('pointercancel', stopSwipe);
    };
  }, []);

  return <section className="home-news" aria-labelledby="home-news-title">
    <div className="section-heading">
      <h2 id="home-news-title">学院News</h2>
      <a href="/news">查看全部<ArrowRight size={15}/></a>
    </div>
    <a className="news-feature" href={`/news/${featuredNewsPost.id}.pdf`}>
      <img src={`/news/${featuredNewsPost.id}.webp`} width={1080} height={458} alt="" decoding="async"/>
      <div className="news-feature-caption">
        <div><time dateTime={featuredNewsPost.date}>{featuredNewsPost.date}</time><h3>{featuredNewsPost.title}</h3></div>
        <ArrowUpRight size={20} aria-hidden="true"/>
      </div>
    </a>
    <div className="news-marquee" ref={rail}>
      <div className="news-track">
        {['before', 'original', 'after'].map(copy => <div key={copy} className="news-strip"
          ref={copy === 'original' ? originalStrip : undefined} aria-hidden={copy !== 'original' || undefined}>
          {carouselPosts.map(post => <a className="news-card" key={post.id} tabIndex={copy === 'original' ? undefined : -1} href={`/news/${post.id}.pdf`}>
            <img src={`/news/${post.id}.webp`} alt="" decoding="async"/>
            <div><time dateTime={post.date}>{post.date}</time><h3>{post.title}</h3></div>
          </a>)}
        </div>)}
      </div>
    </div>
  </section>;
}
