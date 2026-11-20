import { z } from 'zod';
import { reply } from '@/lib/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const tokenFormat = z.object({ access_token: z.string().min(1), expires_in: z.number().positive() });
const publishedFormat = z.object({
  item: z.array(z.object({
    update_time: z.number().int().nonnegative(),
    content: z.object({ news_item: z.array(z.object({
      title: z.string(), digest: z.string().optional(), url: z.string(), thumb_url: z.string().optional(),
    })) }),
  })).default([]),
});

type WechatPost = { title: string; digest: string; url: string; cover?: string; date: string };
let token: { value: string; expires: number } | undefined;
let posts: WechatPost[] | undefined;
let refreshAfter = 0;
let pending: Promise<void> | undefined;

async function wechat(endpoint: URL | string, body: object) {
  const response = await fetch(endpoint, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) throw new Error('WeChat request failed');
  const result = await response.json();
  if (result.errcode) throw new Error('WeChat API error ' + Number(result.errcode));
  return result as unknown;
}

function officialUrl(value: string, cover = false) {
  try {
    const url = new URL(value);
    if (url.port || url.username || url.password) return;
    if (cover) {
      if (!['http:', 'https:'].includes(url.protocol) || !['mmbiz.qpic.cn', 'mmbiz.qlogo.cn'].includes(url.hostname)) return;
      url.protocol = 'https:';
    } else if (url.origin !== 'https://mp.weixin.qq.com' || !/^\/s(?:\/|$)/.test(url.pathname)) return;
    return url.href;
  } catch { return; }
}

async function refresh(appid: string, secret: string) {
  if (!token || token.expires <= Date.now()) {
    const credentials = tokenFormat.parse(await wechat('https://api.weixin.qq.com/cgi-bin/stable_token', {
      grant_type: 'client_credential', appid, secret, force_refresh: false,
    }));
    token = { value: credentials.access_token, expires: Date.now() + Math.max(0, credentials.expires_in - 60) * 1000 };
  }
  const endpoint = new URL('https://api.weixin.qq.com/cgi-bin/freepublish/batchget');
  endpoint.searchParams.set('access_token', token.value);
  const result = publishedFormat.parse(await wechat(endpoint, { offset: 0, count: 8, no_content: 0 }));
  const entries = result.item.sort((a, b) => b.update_time - a.update_time).flatMap(item => {
    const date = new Date(item.update_time * 1000).toISOString();
    return item.content.news_item.flatMap(article => {
      const url = officialUrl(article.url);
      return url && article.title.trim() ? [{
        url, title: article.title.trim(), digest: article.digest?.trim() ?? '',
        cover: article.thumb_url && officialUrl(article.thumb_url, true), date,
      }] : [];
    });
  });
  posts = [...new Map(entries.map(entry => [entry.url, entry])).values()].slice(0, 12);
}

export async function GET() {
  const appid = process.env.WECHAT_APP_ID?.trim();
  const secret = process.env.WECHAT_APP_SECRET?.trim();
  if (!appid || !secret) return reply({ connected: false, posts: [] });
  if (Date.now() >= refreshAfter && !pending) {
    refreshAfter = Date.now() + 60_000;
    pending = refresh(appid, secret).catch(() => {
      token = undefined;
      console.warn('WeChat published-post sync failed');
    }).finally(() => { pending = undefined; });
  }
  await pending;
  return reply({ connected: true, posts: posts ?? [] }, posts ? 200 : 503);
}
