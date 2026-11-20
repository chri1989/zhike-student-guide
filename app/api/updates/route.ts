import { bindings, reply, fail } from '@/lib/server';
export const dynamic='force-dynamic';
export async function GET() {
  try {
    const {results}=await bindings().DB.prepare('SELECT id,summary,changes,publisher,published_at FROM releases ORDER BY id DESC LIMIT 100').all<{id:number;summary:string;changes:string;publisher:string;published_at:string}>();
    return reply(results.map(r=>({id:r.id,summary:r.summary,changes:JSON.parse(r.changes),publisher:r.publisher,publishedAt:r.published_at})));
  } catch(e) {return fail(e);}
}
