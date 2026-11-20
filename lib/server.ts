import { bindings } from './storage';
import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { Article, publicArticle, categories, Release } from './guide';

export { bindings } from './storage';
export function getAuth(request: Request, bootstrap = false) {
  const origin = new URL(process.env.SITE_URL || request.url).origin;
  const local = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
  return betterAuth({
    appName: '智科学代指南', secret: bindings().AUTH_SECRET,
    baseURL: origin,
    database: drizzleAdapter(getDb(), { provider: 'sqlite', schema, transaction: false }),
    emailAndPassword: { enabled: true, disableSignUp: !bootstrap, minPasswordLength: 12 },
    plugins: [admin({ defaultRole: bootstrap ? 'admin' : 'user' })],
    session: { expiresIn: 60*60*24*7, updateAge: 60*60*12, cookieCache: { enabled: false } },
    rateLimit: { enabled: true, storage: 'database', customRules: { '/sign-in/email': { window:60, max:8 } } },
    advanced: { useSecureCookies: !local },
  });
}
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export function reply(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' } });
}
export function fail(error: unknown) {
  if (error instanceof HttpError) return reply({ error:error.message },error.status);
  console.error('Guide request failed', error instanceof Error ? error.message : 'unknown error');
  return reply({error:'操作未完成，请稍后重试。'},500);
}
export function sameOrigin(request: Request) {
  const origin=request.headers.get('origin');
  if (!origin || origin!==new URL(process.env.SITE_URL || request.url).origin) throw new HttpError(403,'请从本站页面进行操作。');
}
export async function requireEditor(request: Request, owner = false) {
  const auth = getAuth(request);
  const session = await auth.api.getSession({headers:request.headers});
  if (!session?.user || session.user.banned) throw new HttpError(401,'请先登录管理后台。');
  if (owner && session.user.role!=='admin') throw new HttpError(403,'只有主管理员可以管理账号。');
  return session.user;
}
export async function latest() {
  return bindings().DB.prepare('SELECT * FROM releases ORDER BY id DESC LIMIT 1').first<{id:number;articles:string;changes:string;summary:string;publisher:string;published_at:string}>();
}
export function releaseInfo(row: NonNullable<Awaited<ReturnType<typeof latest>>>): Release {
  return {id:row.id,changes:JSON.parse(row.changes),summary:row.summary,publisher:row.publisher,publishedAt:row.published_at};
}
export async function publicGuide() {
  const row=await latest();
  if (!row) throw new HttpError(503,'指南正在准备中，请稍后刷新。');
  return {categories, articles:(JSON.parse(row.articles) as Article[]).map(publicArticle), release:releaseInfo(row)};
}
export function validateArticle(value: Article): Article {
  if (!value || !/^(g-[a-f0-9]{10}|g-[a-f0-9-]{36})$/.test(value.id)) throw new HttpError(400,'条目标识无效。');
  if (!value.title?.trim() || value.title.length>200) throw new HttpError(400,'请填写 200 字以内的标题。');
  if (!categories.some(c=>c.id===value.category)) throw new HttpError(400,'请选择有效分类。');
  if (typeof value.body!=='string' || value.body.length>100000 || typeof value.summary!=='string' || value.summary.length>300) throw new HttpError(400,'正文或摘要格式不正确。');
  if (!Array.isArray(value.tags) || value.tags.length>40 || value.tags.some(t=>typeof t!=='string'||t.length>50)) throw new HttpError(400,'关键词格式不正确。');
  if (!Array.isArray(value.images) || value.images.length>30 || value.images.some(i=>!/^\/api\/media\/[a-zA-Z0-9._-]+$/.test(i.src)||typeof i.alt!=='string'||i.alt.length>300)) throw new HttpError(400,'图片格式不正确，请使用后台上传。');
  return {id:value.id,title:value.title.trim(),category:value.category,summary:value.summary.trim(),body:value.body.trim(),tags:value.tags,images:value.images,verification:value.verification==='verified'?'verified':'pending',featured:!!value.featured};
}
