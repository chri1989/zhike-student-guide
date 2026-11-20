import { bindings, fail, publicGuide, reply } from '@/lib/server';
import type { ProgressRecord, PublicProgress, SiteOverview } from '@/lib/feedback-progress';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { DB } = bindings();
    const since = new Date(Date.now() - 30*24*60*60*1000).toISOString();
    const [guide, rows, updates] = await Promise.all([
      publicGuide(),
      DB.prepare('SELECT * FROM feedback_progress ORDER BY updated_at DESC,feedback_id').all<ProgressRecord>(),
      DB.prepare('SELECT COUNT(*) AS count FROM releases WHERE published_at>=?').bind(since).first<{count:number}>(),
    ]);
    const articles = new Map(guide.articles.map(article => [article.id,article.title]));
    const progress: PublicProgress[] = rows.results.filter(row => row.stage !== 'resolved' || articles.has(row.guide_id)).map(row => {
      const title = articles.get(row.guide_id);
      return { id:row.feedback_id, title:row.title, summary:row.summary, stage:row.stage, updatedAt:row.updated_at,
        ...(title ? { guide:{id:row.guide_id,title} } : {}) };
    });
    const result:SiteOverview = { items:guide.articles.length, scenarios:new Set(guide.articles.map(item => item.category)).size,
      resolved:progress.filter(row => row.stage === 'resolved').length, releases30d:updates?.count ?? 0, progress };
    return reply(result);
  } catch (error) { return fail(error); }
}
