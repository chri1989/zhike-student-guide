'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Eye, Share2, ThumbsUp } from 'lucide-react';

export type ArticleActivity = { views: number; likes: number; liked: boolean };
type Activity = { visits: number; visitors: number; articles: Record<string, ArticleActivity> };
let identity: { visitorId: string; visitId: string } | undefined;

function storedId(storage: 'localStorage' | 'sessionStorage', key: string) {
  const generated = crypto.randomUUID();
  try {
    const saved = window[storage].getItem(key);
    if (saved && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(saved)) return saved;
    window[storage].setItem(key, generated);
  } catch {}
  return generated;
}

export async function recordGuideActivity(action: 'visit' | 'view' | 'like', articleId?: string) {
  identity ??= {
    visitorId: storedId('localStorage', 'zhike-guide:visitor:v1'),
    visitId: storedId('sessionStorage', 'zhike-guide:visit:v1'),
  };
  const response = await fetch('/api/engagement', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...identity, action, articleId }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error('互动暂时未保存，请重试。');
  return await response.json() as Activity;
}

export function useGuideActivity(articleId?: string) {
  const [activity, setActivity] = useState<Activity | null>(null);
  const accept = useCallback((next: Activity) => setActivity(previous => {
    if (!previous) return next;
    const articles = { ...previous.articles };
    for (const [id, value] of Object.entries(next.articles)) {
      const old = articles[id];
      articles[id] = old ? {
        views: Math.max(old.views, value.views),
        likes: Math.max(old.likes, value.likes),
        liked: old.liked || value.liked,
      } : value;
    }
    return { visitors: Math.max(previous.visitors, next.visitors), visits: Math.max(previous.visits, next.visits), articles };
  }), []);

  useEffect(() => {
    let current = true;
    const refresh = () => {
      recordGuideActivity(articleId ? 'view' : 'visit', articleId)
        .then(result => { if (current) accept(result); }).catch(() => {});
    };
    const visible = () => { if (document.visibilityState === 'visible') refresh(); };
    const restored = (event: PageTransitionEvent) => { if (event.persisted) refresh(); };
    refresh();
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('pageshow', restored);
    return () => {
      current = false;
      document.removeEventListener('visibilitychange', visible);
      window.removeEventListener('pageshow', restored);
    };
  }, [accept, articleId]);

  const like = useCallback(async (id: string) => accept(await recordGuideActivity('like', id)), [accept]);
  return { activity, like };
}

export function ArticleActions({ id, title, activity, onLike }: {
  id: string; title: string; activity?: ArticleActivity; onLike: (id: string) => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const liked = activity?.liked ?? false;

  async function like() {
    if (submitting.current || liked) return;
    submitting.current = true;
    setPending(true);
    setError('');
    try {
      await onLike(id);
      setCelebrate(true);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : '点赞暂时未保存，请重试。');
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  async function share() {
    const url = new URL('/guide/' + encodeURIComponent(id), window.location.origin).href;
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; }
      catch (failure) { if (failure instanceof DOMException && failure.name === 'AbortError') return; }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch { window.prompt('复制此链接转发', url); }
  }

  return <div className="guide-actions" aria-label="条目互动">
    <span className="guide-view-count" aria-label={`浏览 ${activity?.views ?? '暂无'} 次`}><Eye size={16} aria-hidden="true"/>{activity?.views.toLocaleString('zh-CN') ?? '—'}</span>
    <button type="button" className={`guide-like${celebrate ? ' guide-like-pop' : ''}`}
      aria-label={liked ? '已点赞' : '点赞'} aria-pressed={liked} disabled={liked || pending}
      onAnimationEnd={() => setCelebrate(false)} onClick={like}>
      <ThumbsUp size={16} aria-hidden="true"/><span>{activity?.likes.toLocaleString('zh-CN') ?? '—'}</span>
    </button>
    <button type="button" className="guide-share" onClick={share}>
      {copied ? <Check size={16} aria-hidden="true"/> : <Share2 size={16} aria-hidden="true"/>}
      <span>{copied ? '已复制' : '转发'}</span>
    </button>
    {error && <span className="guide-action-error" role="status">{error}</span>}
  </div>;
}
