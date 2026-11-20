import { bindings,requireEditor,fail,HttpError } from '@/lib/server';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{key:string}>}){
  try{
    const {key}=await params;
    if(!/^[a-zA-Z0-9._-]+$/.test(key)) throw new HttpError(404,'图片不存在。');
    const meta=await bindings().DB.prepare('SELECT content_type,published FROM media WHERE key=?').bind(key).first<{content_type:string;published:number}>();
    if(!meta) throw new HttpError(404,'图片不存在。');
    if(!meta.published) await requireEditor(request);
    const image=await bindings().BUCKET.get(key);
    if(!image) throw new HttpError(404,'图片不存在。');
    return new Response(image.body,{headers:{'Content-Type':meta.content_type,'Cache-Control':meta.published?'public, max-age=31536000, immutable':'private, no-store','X-Content-Type-Options':'nosniff'}});
  }catch(e){return fail(e);}
}
