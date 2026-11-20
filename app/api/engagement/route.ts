import { z } from 'zod';
import { bindings, fail, HttpError, publicGuide, reply, sameOrigin } from '@/lib/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const eventSchema = z.object({
  visitorId: z.string().uuid(),
  visitId: z.string().uuid(),
  action: z.enum(['visit', 'view', 'like']),
  articleId: z.string().regex(/^g-(?:[a-f0-9]{10}|[a-f0-9]{36})$/).optional(),
}).strict();

async function readEvent(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, '缺少互动数据。');
  const decoder = new TextDecoder();
  let size = 0;
  let body = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 1024) {
      await reader.cancel();
      throw new HttpError(413, '互动数据过长。');
    }
    body += decoder.decode(value, { stream: true });
  }
  let input: unknown;
  try { input = JSON.parse(body + decoder.decode()); }
  catch { throw new HttpError(400, '互动数据格式有误。'); }
  const event = eventSchema.safeParse(input);
  if (!event.success || (event.data.action !== 'visit' && !event.data.articleId)) {
    throw new HttpError(400, '互动数据格式有误。');
  }
  return event.data;
}

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { visitorId, visitId, action, articleId } = await readEvent(request);
    const guide = await publicGuide();
    const active = new Set(guide.articles.map(article => article.id));
    if (articleId && !active.has(articleId)) throw new HttpError(404, '找不到已发布的指南。');

    const db = bindings().DB;
    const writes = [
      db.prepare(`CREATE TABLE IF NOT EXISTS guide_visits (
        id TEXT PRIMARY KEY, visitor_id TEXT NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS guide_article_activity (
        article_id TEXT NOT NULL, visit_id TEXT NOT NULL REFERENCES guide_visits(id),
        viewed INTEGER NOT NULL, liked INTEGER NOT NULL, PRIMARY KEY(article_id, visit_id)
      )`),
      db.prepare('INSERT OR IGNORE INTO guide_visits(id,visitor_id) VALUES(?,?)').bind(visitId, visitorId),
    ];
    if (action !== 'visit' && articleId) {
      writes.push(db.prepare(`INSERT INTO guide_article_activity(article_id,visit_id,viewed,liked)
        VALUES(?,?,?,?)
        ON CONFLICT(article_id,visit_id) DO UPDATE SET
          viewed=max(viewed,excluded.viewed), liked=max(liked,excluded.liked)`)
        .bind(articleId, visitId, Number(action === 'view'), Number(action === 'like')));
    }

    const results = await db.batch([
      ...writes,
      db.prepare('SELECT COUNT(*) visits, COUNT(DISTINCT visitor_id) visitors FROM guide_visits'),
      db.prepare(`SELECT article_id, SUM(viewed) views, SUM(liked) likes,
        MAX(CASE WHEN visit_id=? THEN liked ELSE 0 END) liked
        FROM guide_article_activity GROUP BY article_id`).bind(visitId),
    ]);
    const totals = results[writes.length].results[0] as { visits: number; visitors: number };
    const rows = results[writes.length + 1].results as {
      article_id: string; views: number; likes: number; liked: number;
    }[];
    const articles = Object.fromEntries(rows.filter(row => active.has(row.article_id))
      .map(({ article_id, views, likes, liked }) => [article_id, { views, likes, liked: liked === 1 }]));
    return reply({ ...totals, articles });
  } catch (error) { return fail(error); }
}
