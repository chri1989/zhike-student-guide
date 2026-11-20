import seed from '@/data/seed.json';
import { bindings, reply, fail, HttpError, latest } from '@/lib/server';
export const dynamic='force-dynamic';
export async function POST(request:Request) {
  try {
    if (!bindings().BOOTSTRAP_TOKEN || request.headers.get('authorization')!==`Bearer ${bindings().BOOTSTRAP_TOKEN}`) throw new HttpError(403,'无权初始化。');
    if(await latest()) throw new HttpError(409,'内容已初始化。');
    const {images}=await request.json() as {images:{key:string;data:string;contentType:string}[]};
    const expected=new Set(seed.media.map(m=>m.path.split('/').pop()));
    if(!Array.isArray(images)||images.length!==expected.size||images.some(i=>!expected.has(i.key))) throw new HttpError(400,'初始图片清单不完整。');
    await Promise.all(images.map(async i=>{
      const binary=Uint8Array.from(atob(i.data),c=>c.charCodeAt(0));
      await bindings().BUCKET.put(i.key,binary);
    }));
    const now=new Date().toISOString();
    const articles=seed.articles.map(a=>({...a,updatedAt:now,images:a.images.map(i=>({...i,src:'/api/media/'+i.src.split('/').pop()}))}));
    const db=bindings().DB;
    const statements=articles.map(a=>db.prepare('INSERT OR IGNORE INTO drafts(id,content,active,revision,editor,edited_at) VALUES(?,?,1,1,?,?)').bind(a.id,JSON.stringify(a),'原表迁移',now));
    for(let i=0;i<statements.length;i+=30) await db.batch(statements.slice(i,i+30));
    await db.batch([
      ...images.map(i=>db.prepare('INSERT OR IGNORE INTO media(key,content_type,published) VALUES(?,?,1)').bind(i.key,i.contentType)),
      db.prepare('INSERT INTO releases(id,token,articles,changes,summary,publisher,published_at) VALUES(1,?,?,?,?,?,?)').bind(crypto.randomUUID(),JSON.stringify(articles),JSON.stringify([{id:'',title:`迁入 ${articles.length} 个条目与 24 张图片`,kind:'added'}]),'新增全文搜索、分类目录和更新记录。','智科学代团',now),
    ]);
    return reply({ok:true,articles:articles.length,images:images.length});
  }catch(e){return fail(e);}
}
