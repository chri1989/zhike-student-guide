import { getAuth } from '@/lib/server';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) { return getAuth(request).handler(request); }
export async function POST(request: Request) {
  const path=new URL(request.url).pathname;
  if (path.endsWith('/admin/impersonate-user') || path.endsWith('/admin/remove-user') || path.endsWith('/admin/set-role')) return Response.json({error:'此操作未开放。'},{status:403});
  return getAuth(request).handler(request);
}
